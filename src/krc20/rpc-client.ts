import { HttpRequest } from './http-request';
import { RpcClient } from '../rpc/rpc-client';
import {
  GetKrc20AddressTokenListResponse,
  GetKrc20BalanceResponse,
  GetKrc20TokenInfoResponse,
  Krc20Response,
  GetKrc20TokenListResponse,
  GetKrc20OperationListResponse,
  GetKrc20OperationDetailsResponse,
  GetKrc20VspcDetailsResponse,
  GetKrc20DataByOPrangeResponse,
  GetKrc20ListingListResponse
} from './types';
import { NetworkId } from '../consensus';
import { Fees, Generator, SignableTransaction } from '../tx';
import { SendKrc20Params } from '../send-param';
import { Keypair } from '../keypair';
import { Address } from '..';

interface Krc20RpcClientOptions {
  networkId: NetworkId;
  endpoint?: string;
  rpcClient?: RpcClient;
}

/**
 * Krc20RpcClient is a client for interacting with KRC-20 tokens via RPC.
 * It provides methods to retrieve token information, balances, and perform token transfers.
 */
export class Krc20RpcClient {
  public readonly networkId: NetworkId;
  private readonly endpoint: string;
  private httpRequest: HttpRequest;
  private readonly rpcClient?: RpcClient;

  /**
   * Creates an instance of Krc20RpcClient.
   * @param options - The options for the Krc20RpcClient.
   */
  constructor(options: Krc20RpcClientOptions) {
    this.networkId = options.networkId;
    if (!options.endpoint) {
      switch (options.networkId) {
        case NetworkId.Mainnet:
          this.endpoint = 'https://api.kasplex.org/v1';
          break;
        case NetworkId.Testnet10:
          this.endpoint = 'https://tn10api.kasplex.org/v1';
          break;
        default:
          throw new Error(`Krc20 not supported for this network ${options.networkId.toString()}`);
      }
    } else {
      this.endpoint = options.endpoint;
    }
    this.httpRequest = new HttpRequest(this.endpoint);
    this.rpcClient = options.rpcClient;
  }

  /**
   * Retrieves the current indexer status, including DAA score and OP score.
   * @returns A promise that resolves to the indexer status.
   */
  async getIndexerStatus(): Promise<any> {
    return await this.httpRequest.get<any>('/info');
  }

  /**
   * Retrieves the list of all KRC-20 tokens.
   * @returns A promise that resolves to the list of all tokens.
   */
  getKrc20TokenList = async (): Promise<Krc20Response<GetKrc20TokenListResponse>> => {
    return await this.httpRequest.get<Krc20Response<GetKrc20TokenListResponse>>(`/krc20/tokenlist`);
  };

  /**
   * Retrieves information about a specific KRC-20 token.
   * @param tick - The ticker symbol of the KRC-20 token.
   * @returns A promise that resolves to the token information.
   */
  getKrc20TokenInfo = async (tick: string): Promise<Krc20Response<GetKrc20TokenInfoResponse>> => {
    return await this.httpRequest.get<Krc20Response<GetKrc20TokenInfoResponse>>(`/krc20/token/${tick}`);
  };

  /**
   * Retrieves the list of KRC-20 tokens held by a specific address.
   * @param address - The address to query.
   * @returns A promise that resolves to the list of tokens held by the address.
   */
  getKrc20AddressTokenList = async (address: string): Promise<Krc20Response<GetKrc20AddressTokenListResponse>> => {
    return await this.httpRequest.get<Krc20Response<GetKrc20AddressTokenListResponse>>(
      `/krc20/address/${address}/tokenlist`
    );
  };

  /**
   * Retrieves the balance of a specific KRC-20 token for a given address.
   * @param address - The address to query.
   * @param tick - The ticker symbol of the KRC-20 token.
   * @returns A promise that resolves to the token balance.
   */
  getKrc20Balance = async (address: string, tick: string): Promise<Krc20Response<GetKrc20BalanceResponse>> => {
    return await this.httpRequest.get<Krc20Response<GetKrc20BalanceResponse>>(
      `/krc20/address/${address}/token/${tick}`
    );
  };

  /**
   * Retrieves the list of operations for a specific address.
   * @param address - The address to query.
   * @returns A promise that resolves to the list of operations.
   */
  getKrc20OperationList = async (address: string): Promise<Krc20Response<GetKrc20OperationListResponse>> => {
    return await this.httpRequest.get<Krc20Response<GetKrc20OperationListResponse>>(`/krc20/oplist?address=${address}`);
  };

  /**
   * Retrieves details of a specific operation.
   * @param operationId - The ID of the operation.
   * @returns A promise that resolves to the operation details.
   */
  getKrc20OperationDetails = async (operationId: string): Promise<Krc20Response<GetKrc20OperationDetailsResponse>> => {
    return await this.httpRequest.get<Krc20Response<GetKrc20OperationDetailsResponse>>(`/krc20/op/${operationId}`);
  };

  /**
   * Retrieves details of a specific VSPC (Virtual Smart Contract).
   * @param daaScore - The DAA score of the VSPC.
   * @returns A promise that resolves to the VSPC details.
   */
  getKrc20VspcDetails = async (daaScore: string): Promise<Krc20Response<GetKrc20VspcDetailsResponse>> => {
    return await this.httpRequest.get<Krc20Response<GetKrc20VspcDetailsResponse>>(`/archive/vspc/${daaScore}`);
  };

  /**
   * Retrieves data by operation range.
   * @param oprange - The operation range to query.
   * @returns A promise that resolves to the data for the specified range.
   */
  getKrc20DataByOPrange = async (oprange: string): Promise<Krc20Response<GetKrc20DataByOPrangeResponse>> => {
    return await this.httpRequest.get<Krc20Response<GetKrc20DataByOPrangeResponse>>(`/archive/oplist/${oprange}`);
  };

  /**
   * Retrieves the list of KRC-20 token listings.
   * @param tick - The ticker symbol of the KRC-20 token.
   * @returns A promise that resolves to the list of token listings.
   */
  getKrc20ListingList = async (tick: string): Promise<Krc20Response<GetKrc20ListingListResponse>> => {
    return await this.httpRequest.get<Krc20Response<GetKrc20ListingListResponse>>(`/krc20/market/${tick}`);
  };

  /**
   * Transfers KRC-20 tokens from one address to another.
   * @param receiverAddress - The address receiving the tokens.
   * @param amount - The amount of tokens to transfer.
   * @param tick - The ticker symbol of the KRC-20 token.
   * @param privateKey - The private key of the sender's address, hex format.
   * @param priorityFee - The priority fee to set for the reveal transaction.
   * @returns A promise that resolves to the reveal transaction id.
   */
  async transfer(
    receiverAddress: string,
    amount: bigint,
    tick: string,
    privateKey: string,
    priorityFee?: bigint
  ): Promise<string> {
    if (!this.rpcClient) {
      throw new Error('transfer krc20 requires rpc client');
    }

    const senderKey = Keypair.fromPrivateKeyHex(privateKey);
    const senderAddress = senderKey.toAddress(this.networkId.networkType);
    // check receiver address
    const receiver = Address.fromString(receiverAddress);

    await this.rpcClient.connect();
    const { entries: utxos } = await this.rpcClient.getUtxosByAddresses([senderAddress.toString()]);
    const sendKrc20Params = new SendKrc20Params(senderAddress, amount, receiver, tick, this.networkId);

    // 1. commit tx stage
    const generatorOfCommitTx = new Generator(sendKrc20Params.toCommitTxGeneratorSettings(utxos));

    while (true) {
      const transaction = generatorOfCommitTx.generateTransaction();
      if (transaction === undefined) break;
      const signedTx = transaction.sign([privateKey]);
      await this.rpcClient.submitTransaction({
        transaction: signedTx.toSubmittableJsonTx(),
        allowOrphan: false
      });
    }

    const { finalTransactionId } = generatorOfCommitTx.summary();

    // 1.1 wait for commit tx to be confirmed
    let isConfirmed = false;
    let maxRetries = 10;
    let currentRetries = 0;
    while (isConfirmed) {
      const utxos = await this.rpcClient.getUtxosByAddresses([sendKrc20Params.p2shAddress.toString()]);
      if (utxos.entries.filter((o) => o.outpoint.transactionId === finalTransactionId).length > 0) {
        isConfirmed = true;
        break;
      }
      currentRetries++;
      if (currentRetries > maxRetries) {
        throw new Error('Commit tx not confirmed');
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // 2. reveal tx stage
    const newUtxos = await this.rpcClient.getUtxosByAddresses([senderAddress.toString()]);
    if (newUtxos.entries.length === 0) throw new Error('No utxos found for reveal tx');

    let generatorOfRevealTx = new Generator(
      sendKrc20Params.toRevealTxGeneratorSettings(newUtxos.entries, finalTransactionId!)
    );
    let revealTxs = new Array<SignableTransaction>();
    while (true) {
      const transaction = generatorOfRevealTx.generateTransaction();
      if (transaction === undefined) break;
      revealTxs.push(transaction);
    }

    // 2.1  calc priority fee
    if (priorityFee === undefined) {
      const feeSetting = await this.rpcClient.getFeeEstimate();
      const mass = revealTxs[revealTxs.length - 1].mass;
      priorityFee = mass * BigInt(feeSetting?.estimate?.priorityBucket?.feerate ?? 1n);
    }

    // 2.2  regenerate reveal tx with priority fee
    sendKrc20Params.setPriorityFee(Fees.from(priorityFee));
    generatorOfRevealTx = new Generator(
      sendKrc20Params.toRevealTxGeneratorSettings(newUtxos.entries, finalTransactionId!)
    );
    while (true) {
      const transaction = generatorOfRevealTx.generateTransaction();
      if (transaction === undefined) break;
      const signedTx = transaction.sign([privateKey]);
      await this.rpcClient.submitTransaction({
        transaction: signedTx.toSubmittableJsonTx(),
        allowOrphan: false
      });
    }

    return generatorOfRevealTx.summary().finalTransactionId!.toHex();
  }
}

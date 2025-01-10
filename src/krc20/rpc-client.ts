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
  GetKrc20ListingListResponse,
  Krc20PagerRequest,
  makeQueryString,
  Krc20TokenListRequest
} from './types';
import { NetworkId } from '../consensus';
import { Fees, Generator } from '../tx';
import { Keypair } from '../keypair';
import { Address } from '..';
import {
  Krc20MintParams,
  Krc20TransferParams,
  Krc20DeployParams,
  Krc20MintOptions,
  Krc20TransferOptions,
  Krc20DeployOptions,
  Krc20TxParams
} from './tx-params';
import { RpcUtxosByAddressesEntry } from '../rpc/types';

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
    this.endpoint = options.endpoint || this.getDefaultEndpoint(options.networkId);
    this.httpRequest = new HttpRequest(this.endpoint);
    this.rpcClient = options.rpcClient;
  }

  /**
   * Retrieves the default endpoint based on the network ID.
   * @param networkId - The network ID.
   * @returns The default endpoint URL.
   */
  private getDefaultEndpoint(networkId: NetworkId): string {
    switch (networkId) {
      case NetworkId.Mainnet:
        return 'https://api.kasplex.org/v1';
      case NetworkId.Testnet10:
        return 'https://tn10api.kasplex.org/v1';
      default:
        throw new Error(`Krc20 not supported for this network ${networkId.toString()}`);
    }
  }

  /**
   * Connects to the RPC client.
   * @throws Error if the RPC client is not available.
   */
  private async connectRpcClient(): Promise<void> {
    if (!this.rpcClient) {
      throw new Error('RPC client is not available');
    }
    await this.rpcClient.connect();
  }

  /**
   * Waits for a transaction to be confirmed.
   * @param address - The address to check for UTXOs.
   * @param transactionId - The transaction ID to confirm.
   * @throws Error if the transaction is not confirmed within the retry limit.
   */
  private async waitForTransactionConfirmation(address: Address, transactionId: string): Promise<void> {
    let isConfirmed = false;
    const maxRetries = 10;
    let currentRetries = 0;

    while (!isConfirmed) {
      const utxos = await this.rpcClient!.getUtxosByAddresses([address.toString()]);
      if (utxos.entries.some((o) => o.outpoint?.transactionId === transactionId)) {
        isConfirmed = true;
        break;
      }
      currentRetries++;
      if (currentRetries > maxRetries) {
        throw new Error('Transaction not confirmed');
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  /**
   * Executes the transaction stages (commit and reveal).
   * @param params - The transaction parameters.
   * @param privateKey - The private key for signing transactions.
   * @param utxos - The UTXOs for the sender's address.
   * @returns The final transaction ID.
   */
  private async executeTransactionStages<T extends Krc20TxParams>(
    params: T,
    privateKey: string,
    utxos: RpcUtxosByAddressesEntry[]
  ): Promise<string> {
    // 1. commit tx stage
    const generatorOfCommitTx = new Generator(params.toCommitTxGeneratorSettings(utxos));

    while (true) {
      const transaction = generatorOfCommitTx.generateTransaction();
      if (transaction === undefined) break;
      const signedTx = transaction.sign([privateKey]);
      await this.rpcClient!.submitTransaction({
        transaction: signedTx.toSubmittableJsonTx(),
        allowOrphan: false
      });
    }

    const { finalTransactionId } = generatorOfCommitTx.summary();

    // 1.1 wait for commit tx to be confirmed
    await this.waitForTransactionConfirmation(params.p2shAddress, finalTransactionId!.toHex());

    // 2. reveal tx stage
    const newUtxos = await this.rpcClient!.getUtxosByAddresses([params.sender.toString()]);
    if (newUtxos.entries.length === 0) throw new Error('No utxos found for reveal tx');

    let generatorOfRevealTx = new Generator(params.toRevealTxGeneratorSettings(newUtxos.entries, finalTransactionId!));

    while (true) {
      const transaction = generatorOfRevealTx.generateTransaction();
      if (!transaction) break;
      const signedTx = transaction.sign([privateKey]);
      const revealInputIndex = transaction.tx.inputs.findIndex((input) => input.signatureScript.length === 0);
      if (revealInputIndex !== -1) {
        const signature = transaction.createInputSignature(revealInputIndex, privateKey);
        transaction.fillInputSignature(revealInputIndex, params.script.encodePayToScriptHashSignatureScript(signature));
      }
      await this.rpcClient!.submitTransaction({
        transaction: signedTx.toSubmittableJsonTx(),
        allowOrphan: false
      });
    }

    return generatorOfRevealTx.summary().finalTransactionId!.toHex();
  }

  /**
   * Handles the common logic for deploying, minting, and transferring KRC-20 tokens.
   * @param params - The transaction parameters.
   * @param privateKey - The private key for signing transactions.
   * @returns A promise that resolves to the reveal transaction id.
   */
  private async handleKrc20Transaction<T extends Krc20TxParams>(params: T, privateKey: string): Promise<string> {
    await this.connectRpcClient();

    const senderAddress = params.sender;
    const { entries: utxos } = await this.rpcClient!.getUtxosByAddresses([senderAddress.toString()]);

    return await this.executeTransactionStages(params, privateKey, utxos);
  }

  /**
   * Deploys a new KRC-20 token.
   * @param options - The deployment options.
   * @param priorityFee - The priority fee to set for the reveal transaction, in sompi.
   * @param privateKey - The private key of the deployer's address, hex format.
   * @returns A promise that resolves to the reveal transaction id.
   */
  async deploy(options: Krc20DeployOptions, priorityFee: bigint, privateKey: string): Promise<string> {
    const senderKey = Keypair.fromPrivateKeyHex(privateKey);
    const senderAddress = senderKey.toAddress(this.networkId.networkType);
    const deployParams = new Krc20DeployParams(senderAddress, this.networkId, Fees.from(priorityFee || 0n), options);

    return await this.handleKrc20Transaction(deployParams, privateKey);
  }

  /**
   * Mints additional KRC-20 tokens.
   * @param options - The mint options.
   * @param priorityFee - The priority fee to set for the reveal transaction, in sompi.
   * @param privateKey - The private key of the minter's address, hex format.
   * @returns A promise that resolves to the reveal transaction id.
   */
  async mint(options: Krc20MintOptions, priorityFee: bigint, privateKey: string): Promise<string> {
    const senderKey = Keypair.fromPrivateKeyHex(privateKey);
    const senderAddress = senderKey.toAddress(this.networkId.networkType);
    const mintParams = new Krc20MintParams(senderAddress, this.networkId, Fees.from(priorityFee || 0n), options);

    return await this.handleKrc20Transaction(mintParams, privateKey);
  }

  /**
   * Transfers KRC-20 tokens from one address to another.
   * @param options - The transfer options.
   * @param priorityFee - The priority fee to set for the reveal transaction, in sompi.
   * @param privateKey - The private key of the sender's address, hex format.
   * @returns A promise that resolves to the reveal transaction id.
   */
  async transfer(options: Krc20TransferOptions, priorityFee: bigint, privateKey: string): Promise<string> {
    const senderKey = Keypair.fromPrivateKeyHex(privateKey);
    const senderAddress = senderKey.toAddress(this.networkId.networkType);
    const sendKrc20Params = new Krc20TransferParams(senderAddress, this.networkId, Fees.from(priorityFee), options);

    return await this.handleKrc20Transaction(sendKrc20Params, privateKey);
  }

  // Restored get methods
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
  async getKrc20TokenList(req: Krc20PagerRequest): Promise<Krc20Response<GetKrc20TokenListResponse>> {
    const url = this.buildUrl('/krc20/tokenlist', req);
    return await this.httpRequest.get<Krc20Response<GetKrc20TokenListResponse>>(url);
  }

  /**
   * Retrieves information about a specific KRC-20 token.
   * @param tick - The ticker symbol of the KRC-20 token.
   * @returns A promise that resolves to the token information.
   */
  async getKrc20TokenInfo(tick: string): Promise<Krc20Response<GetKrc20TokenInfoResponse>> {
    return await this.httpRequest.get<Krc20Response<GetKrc20TokenInfoResponse>>(`/krc20/token/${tick}`);
  }

  /**
   * Retrieves the list of KRC-20 tokens held by a specific address.
   * @param address - The address to query.
   * @returns A promise that resolves to the list of tokens held by the address.
   */
  async getKrc20AddressTokenList(address: string): Promise<Krc20Response<GetKrc20AddressTokenListResponse>> {
    return await this.httpRequest.get<Krc20Response<GetKrc20AddressTokenListResponse>>(
      `/krc20/address/${address}/tokenlist`
    );
  }

  /**
   * Retrieves the balance of a specific KRC-20 token for a given address.
   * @param address - The address to query.
   * @param tick - The ticker symbol of the KRC-20 token.
   * @returns A promise that resolves to the token balance.
   */
  async getKrc20Balance(address: string, tick: string): Promise<Krc20Response<GetKrc20BalanceResponse>> {
    return await this.httpRequest.get<Krc20Response<GetKrc20BalanceResponse>>(
      `/krc20/address/${address}/token/${tick}`
    );
  }

  /**
   * Retrieves the list of operations for a specific address.
   * @param req - The request parameters.
   * @returns A promise that resolves to the list of operations.
   */
  async getKrc20OperationList(req: Krc20TokenListRequest): Promise<Krc20Response<GetKrc20OperationListResponse>> {
    const url = this.buildUrl('/krc20/oplist', req);
    return await this.httpRequest.get<Krc20Response<GetKrc20OperationListResponse>>(url);
  }

  /**
   * Retrieves details of a specific operation.
   * @param operationId - The ID of the operation.
   * @returns A promise that resolves to the operation details.
   */
  async getKrc20OperationDetails(operationId: string): Promise<Krc20Response<GetKrc20OperationDetailsResponse>> {
    return await this.httpRequest.get<Krc20Response<GetKrc20OperationDetailsResponse>>(`/krc20/op/${operationId}`);
  }

  /**
   * Retrieves details of a specific VSPC (Virtual Smart Contract).
   * @param daaScore - The DAA score of the VSPC.
   * @returns A promise that resolves to the VSPC details.
   */
  async getKrc20VspcDetails(daaScore: string): Promise<Krc20Response<GetKrc20VspcDetailsResponse>> {
    return await this.httpRequest.get<Krc20Response<GetKrc20VspcDetailsResponse>>(`/archive/vspc/${daaScore}`);
  }

  /**
   * Retrieves data by operation range.
   * @param oprange - The operation range to query.
   * @returns A promise that resolves to the data for the specified range.
   */
  async getKrc20DataByOPrange(oprange: string): Promise<Krc20Response<GetKrc20DataByOPrangeResponse>> {
    return await this.httpRequest.get<Krc20Response<GetKrc20DataByOPrangeResponse>>(`/archive/oplist/${oprange}`);
  }

  /**
   * Retrieves the list of KRC-20 token listings.
   * @param tick - The ticker symbol of the KRC-20 token.
   * @returns A promise that resolves to the list of token listings.
   */
  async getKrc20ListingList(tick: string): Promise<Krc20Response<GetKrc20ListingListResponse>> {
    return await this.httpRequest.get<Krc20Response<GetKrc20ListingListResponse>>(`/krc20/market/${tick}`);
  }

  private buildUrl(base: string, params: Record<string, any>): string {
    try {
      const queryString = makeQueryString(params);
      return queryString ? `${base}?${queryString}` : base;
    } catch (error: any) {
      throw new Error(`Failed to build URL: ${error.message}`);
    }
  }
}

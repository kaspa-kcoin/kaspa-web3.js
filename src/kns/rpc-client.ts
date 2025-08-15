import { RpcClient } from '../rpc/rpc-client';
import { NetworkId } from '../consensus';
import { Fees, Generator } from '../tx';
import { Keypair } from '../keypair';
import { Address } from '..';
import { KnsTransferParams, KnsTxParams, KnsTransferOptions, KnsCreateParams, KnsCreateOptions } from './tx-params';
import { RpcUtxosByAddressesEntry } from '../rpc/types';

interface KnsRpcClientOptions {
  networkId: NetworkId;
  endpoint?: string;
  rpcClient?: RpcClient;
}

/**
 * KnsRpcClient is a client for interacting with KNS domains via RPC.
 * It provides methods to retrieve domain information and perform domain operations.
 */
export class KnsRpcClient {
  public readonly networkId: NetworkId;
  private readonly rpcClient?: RpcClient;

  /**
   * Creates an instance of KnsRpcClient.
   * @param options - The options for the KnsRpcClient.
   */
  constructor(options: KnsRpcClientOptions) {
    this.networkId = options.networkId;
    this.rpcClient = options.rpcClient;
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
  private async executeTransactionStages<T extends KnsTxParams>(
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
   * Handles the common logic for KNS operations.
   * @param params - The transaction parameters.
   * @param privateKey - The private key for signing transactions.
   * @returns A promise that resolves to the reveal transaction id.
   */
  private async handleKnsTransaction<T extends KnsTxParams>(params: T, privateKey: string): Promise<string> {
    await this.connectRpcClient();

    const senderAddress = params.sender;
    const { entries: utxos } = await this.rpcClient!.getUtxosByAddresses([senderAddress.toString()]);

    return await this.executeTransactionStages(params, privateKey, utxos);
  }

  /**
   * Transfers a KNS domain from one address to another.
   * @param options - The transfer options.
   * @param priorityFee - The priority fee to set for the reveal transaction, in sompi.
   * @param privateKey - The private key of the sender's address, hex format.
   * @returns A promise that resolves to the reveal transaction id.
   */
  async transfer(options: KnsTransferOptions, priorityFee: bigint, privateKey: string): Promise<string> {
    const senderKey = Keypair.fromPrivateKeyHex(privateKey);
    const senderAddress = senderKey.toAddress(this.networkId.networkType);
    const transferParams = new KnsTransferParams(senderAddress, this.networkId, Fees.from(priorityFee), options);

    return await this.handleKnsTransaction(transferParams, privateKey);
  }

  /**
   * Creates a new KNS domain.
   * @param options - The create options containing the domain name.
   * @param priorityFee - The priority fee to set for the reveal transaction, in sompi.
   * @param privateKey - The private key of the sender's address, hex format.
   * @returns A promise that resolves to the reveal transaction id.
   */
  async create(options: KnsCreateOptions, priorityFee: bigint, privateKey: string): Promise<string> {
    const senderKey = Keypair.fromPrivateKeyHex(privateKey);
    const senderAddress = senderKey.toAddress(this.networkId.networkType);
    const createParams = new KnsCreateParams(senderAddress, this.networkId, Fees.from(priorityFee), options);

    return await this.handleKnsTransaction(createParams, privateKey);
  }
}

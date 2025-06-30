import { HttpRequest } from './http-request';
import { RpcClient } from '../rpc/rpc-client';
import {
  Krc721PagerRequest,
  Krc721Response,
  GetKrc721CollectionsResponse,
  GetKrc721CollectionDetailsResponse,
  GetKrc721TokenDetailsResponse,
  GetKrc721TokenOwnersResponse,
  GetKrc721AddressHoldingsResponse,
  GetKrc721AddressCollectionHoldingResponse,
  GetKrc721OperationsResponse,
  GetKrc721OperationDetailsResponse,
  GetKrc721RoyaltyFeesResponse,
  GetKrc721RejectionResponse,
  GetKrc721OwnershipHistoryResponse,
  GetKrc721TokenRangesResponse,
  makeQueryString
} from './types';
import { NetworkId } from '../consensus';
import { Fees, Generator, PaymentOutput } from '../tx';
import { Keypair } from '../keypair';
import { Address } from '..';
import {
  Krc721DeployParams,
  Krc721MintParams,
  Krc721TransferParams,
  Krc721DiscountParams,
  Krc721TxParams,
  Krc721DeployOptions,
  Krc721MintOptions,
  Krc721TransferOptions,
  Krc721DiscountOptions
} from './tx-params';
import { RpcUtxosByAddressesEntry } from '../rpc/types';

interface Krc721RpcClientOptions {
  networkId: NetworkId;
  endpoint?: string;
  rpcClient?: RpcClient;
}

/**
 * Krc721RpcClient is a client for interacting with KRC-721 tokens via RPC.
 * It provides methods to retrieve token information and perform token operations.
 */
export class Krc721RpcClient {
  public readonly networkId: NetworkId;
  private readonly endpoint: string;
  private httpRequest: HttpRequest;
  private readonly rpcClient?: RpcClient;

  /**
   * Creates an instance of Krc721RpcClient.
   * @param options - The options for the Krc721RpcClient.
   */
  constructor(options: Krc721RpcClientOptions) {
    this.networkId = options.networkId;
    this.endpoint = options.endpoint || this.getDefaultEndpoint(options.networkId);
    this.httpRequest = new HttpRequest(this.endpoint);
    this.rpcClient = options.rpcClient;
  }

  /**
   * Retrieves the default endpoint based on the network type.
   * @param networkId - The network type.
   * @returns The default endpoint URL.
   */
  private getDefaultEndpoint(networkId: NetworkId): string {
    switch (networkId) {
      case NetworkId.Mainnet:
        return 'https://mainnet.krc721.stream';
      case NetworkId.Testnet10:
        return 'https://testnet-10.krc721.stream';
      default:
        throw new Error(`KRC-721 not supported for this network ${networkId.toString()}`);
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
  private async executeTransactionStages<T extends Krc721TxParams>(
    params: T,
    privateKey: string,
    utxos: RpcUtxosByAddressesEntry[],
    extraOutputs: PaymentOutput[] = []
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

    const revealSettings = params.toRevealTxGeneratorSettings(newUtxos.entries, finalTransactionId!);
    // Add extra outputs if provided
    if (extraOutputs.length > 0) {
      revealSettings.outputs = [...extraOutputs, ...revealSettings.outputs];
    }

    let generatorOfRevealTx = new Generator(revealSettings);

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
   * Handles the common logic for KRC-721 transactions.
   * @param params - The transaction parameters.
   * @param privateKey - The private key for signing transactions.
   * @param extraOutputs - Optional additional payment outputs.
   * @returns A promise that resolves to the reveal transaction id.
   */
  private async handleKrc721Transaction<T extends Krc721TxParams>(
    params: T, 
    privateKey: string,
    extraOutputs: PaymentOutput[] = []
  ): Promise<string> {
    await this.connectRpcClient();

    const senderAddress = params.sender;
    const { entries: utxos } = await this.rpcClient!.getUtxosByAddresses([senderAddress.toString()]);

    return await this.executeTransactionStages(params, privateKey, utxos, extraOutputs);
  }

  /**
   * Deploys a new KRC-721 token collection.
   * @param options - The deployment options.
   * @param priorityFee - The priority fee to set for the reveal transaction, in sompi.
   * @param privateKey - The private key of the deployer's address, hex format.
   * @returns A promise that resolves to the reveal transaction id.
   */
  async deploy(options: Krc721DeployOptions, priorityFee: bigint, privateKey: string): Promise<string> {
    const senderKey = Keypair.fromPrivateKeyHex(privateKey);
    const senderAddress = senderKey.toAddress(this.networkId.networkType);
    const deployParams = new Krc721DeployParams(senderAddress, this.networkId, Fees.from(priorityFee), options);

    return await this.handleKrc721Transaction(deployParams, privateKey);
  }

  /**
   * Mints a new KRC-721 token.
   * @param options - The mint options.
   * @param priorityFee - The priority fee to set for the reveal transaction, in sompi.
   * @param privateKey - The private key of the minter's address, hex format.
   * @param royaltyBeneficiary - Optional royalty beneficiary address and amount if the collection has royalties.
   * @returns A promise that resolves to the reveal transaction id.
   */
  async mint(
    options: Krc721MintOptions, 
    priorityFee: bigint, 
    privateKey: string,
    royaltyBeneficiary?: { address: string, amount: bigint }
  ): Promise<string> {
    const senderKey = Keypair.fromPrivateKeyHex(privateKey);
    const senderAddress = senderKey.toAddress(this.networkId.networkType);
    const mintParams = new Krc721MintParams(senderAddress, this.networkId, Fees.from(priorityFee), options);

    // If there's a royalty beneficiary, create a payment output for them
    const extraOutputs: PaymentOutput[] = [];
    if (royaltyBeneficiary) {
      const beneficiaryAddress = Address.fromString(royaltyBeneficiary.address);
      extraOutputs.push(new PaymentOutput(beneficiaryAddress, royaltyBeneficiary.amount));
    }

    return await this.handleKrc721Transaction(mintParams, privateKey, extraOutputs);
  }

  /**
   * Transfers ownership of a KRC-721 token.
   * @param options - The transfer options.
   * @param priorityFee - The priority fee to set for the reveal transaction, in sompi.
   * @param privateKey - The private key of the sender's address, hex format.
   * @returns A promise that resolves to the reveal transaction id.
   */
  async transfer(options: Krc721TransferOptions, priorityFee: bigint, privateKey: string): Promise<string> {
    const senderKey = Keypair.fromPrivateKeyHex(privateKey);
    const senderAddress = senderKey.toAddress(this.networkId.networkType);
    const transferParams = new Krc721TransferParams(senderAddress, this.networkId, Fees.from(priorityFee), options);

    return await this.handleKrc721Transaction(transferParams, privateKey);
  }

  /**
   * Sets a discount for a KRC-721 token minting.
   * @param options - The discount options.
   * @param priorityFee - The priority fee to set for the reveal transaction, in sompi.
   * @param privateKey - The private key of the deployer's address, hex format.
   * @returns A promise that resolves to the reveal transaction id.
   */
  async discount(options: Krc721DiscountOptions, priorityFee: bigint, privateKey: string): Promise<string> {
    const senderKey = Keypair.fromPrivateKeyHex(privateKey);
    const senderAddress = senderKey.toAddress(this.networkId.networkType);
    const discountParams = new Krc721DiscountParams(senderAddress, this.networkId, Fees.from(priorityFee), options);

    return await this.handleKrc721Transaction(discountParams, privateKey);
  }

  /* API Methods */

  /**
   * Retrieves the current indexer status.
   * @returns A promise that resolves to the indexer status.
   */
  async getIndexerStatus(): Promise<any> {
    const networkPath = this.getNetworkPath();
    return await this.httpRequest.get<any>(`/api/v1/krc721/${networkPath}/status`);
  }

  /**
   * Gets the network path segment for API URLs.
   * @returns The network path segment (e.g., 'mainnet' or 'testnet-10').
   */
  private getNetworkPath(): string {
    switch (this.networkId) {
      case NetworkId.Mainnet:
        return 'mainnet';
      case NetworkId.Testnet10:
        return 'testnet-10';
      default:
        throw new Error(`Unsupported network id: ${this.networkId}`);
    }
  }

  /**
   * Builds a URL with query parameters.
   * @param base - The base URL path.
   * @param params - The query parameters.
   * @returns The complete URL with query string.
   */
  private buildUrl(base: string, params: Record<string, any> = {}): string {
    try {
      const queryString = makeQueryString(params);
      return queryString ? `${base}?${queryString}` : base;
    } catch (error: any) {
      throw new Error(`Failed to build URL: ${error.message}`);
    }
  }

  /* Collection methods */

  /**
   * Retrieves the list of KRC-721 collections.
   * @param params - Optional pagination parameters.
   * @returns A promise that resolves to the list of collections.
   */
  async getCollections(params: Krc721PagerRequest = {}): Promise<Krc721Response<GetKrc721CollectionsResponse>> {
    const networkPath = this.getNetworkPath();
    const url = this.buildUrl(`/api/v1/krc721/${networkPath}/nfts`, params);
    return await this.httpRequest.get<Krc721Response<GetKrc721CollectionsResponse>>(url);
  }

  /**
   * Retrieves details about a specific KRC-721 collection.
   * @param tick - The ticker symbol of the KRC-721 collection.
   * @returns A promise that resolves to the collection details.
   */
  async getCollectionDetails(tick: string): Promise<Krc721Response<GetKrc721CollectionDetailsResponse>> {
    const networkPath = this.getNetworkPath();
    return await this.httpRequest.get<Krc721Response<GetKrc721CollectionDetailsResponse>>(
      `/api/v1/krc721/${networkPath}/nfts/${tick}`
    );
  }

  /* Token methods */

  /**
   * Retrieves details about a specific KRC-721 token.
   * @param tick - The ticker symbol of the KRC-721 collection.
   * @param id - The token ID.
   * @returns A promise that resolves to the token details.
   */
  async getTokenDetails(tick: string, id: string): Promise<Krc721Response<GetKrc721TokenDetailsResponse>> {
    const networkPath = this.getNetworkPath();
    return await this.httpRequest.get<Krc721Response<GetKrc721TokenDetailsResponse>>(
      `/api/v1/krc721/${networkPath}/nfts/${tick}/${id}`
    );
  }

  /**
   * Retrieves the list of token owners for a specific KRC-721 collection.
   * @param tick - The ticker symbol of the KRC-721 collection.
   * @param params - Optional pagination parameters.
   * @returns A promise that resolves to the list of token owners.
   */
  async getTokenOwners(tick: string, params: Krc721PagerRequest = {}): 
    Promise<Krc721Response<GetKrc721TokenOwnersResponse>> {
    const networkPath = this.getNetworkPath();
    const url = this.buildUrl(`/api/v1/krc721/${networkPath}/owners/${tick}`, params);
    return await this.httpRequest.get<Krc721Response<GetKrc721TokenOwnersResponse>>(url);
  }

  /* Address methods */

  /**
   * Retrieves the list of KRC-721 tokens held by a specific address.
   * @param address - The address to query.
   * @param params - Optional pagination parameters.
   * @returns A promise that resolves to the list of tokens held by the address.
   */
  async getAddressHoldings(address: string, params: Krc721PagerRequest = {}): 
    Promise<Krc721Response<GetKrc721AddressHoldingsResponse>> {
    const networkPath = this.getNetworkPath();
    const url = this.buildUrl(`/api/v1/krc721/${networkPath}/address/${address}`, params);
    return await this.httpRequest.get<Krc721Response<GetKrc721AddressHoldingsResponse>>(url);
  }

  /**
   * Retrieves the details of tokens from a specific collection held by an address.
   * @param address - The address to query.
   * @param tick - The ticker symbol of the KRC-721 collection.
   * @returns A promise that resolves to the collection holdings details.
   */
  async getAddressCollectionHolding(address: string, tick: string): 
    Promise<Krc721Response<GetKrc721AddressCollectionHoldingResponse>> {
    const networkPath = this.getNetworkPath();
    return await this.httpRequest.get<Krc721Response<GetKrc721AddressCollectionHoldingResponse>>(
      `/api/v1/krc721/${networkPath}/address/${address}/${tick}`
    );
  }

  /* Operations methods */

  /**
   * Retrieves the list of KRC-721 operations.
   * @param params - Optional pagination parameters.
   * @returns A promise that resolves to the list of operations.
   */
  async getOperations(params: Krc721PagerRequest = {}): Promise<Krc721Response<GetKrc721OperationsResponse>> {
    const networkPath = this.getNetworkPath();
    const url = this.buildUrl(`/api/v1/krc721/${networkPath}/ops`, params);
    return await this.httpRequest.get<Krc721Response<GetKrc721OperationsResponse>>(url);
  }

  /**
   * Retrieves details of a specific operation by operation score.
   * @param score - The operation score.
   * @returns A promise that resolves to the operation details.
   */
  async getOperationDetailsByScore(score: string): Promise<Krc721Response<GetKrc721OperationDetailsResponse>> {
    const networkPath = this.getNetworkPath();
    return await this.httpRequest.get<Krc721Response<GetKrc721OperationDetailsResponse>>(
      `/api/v1/krc721/${networkPath}/ops/score/${score}`
    );
  }

  /**
   * Retrieves details of a specific operation by transaction ID.
   * @param txid - The transaction ID.
   * @returns A promise that resolves to the operation details.
   */
  async getOperationDetailsByTxId(txid: string): Promise<Krc721Response<GetKrc721OperationDetailsResponse>> {
    const networkPath = this.getNetworkPath();
    return await this.httpRequest.get<Krc721Response<GetKrc721OperationDetailsResponse>>(
      `/api/v1/krc721/${networkPath}/ops/txid/${txid}`
    );
  }

  /**
   * Retrieves the royalty fees for a given address and collection.
   * @param address - The address to query.
   * @param tick - The ticker symbol of the KRC-721 collection.
   * @returns A promise that resolves to the royalty fees amount.
   */
  async getRoyaltyFees(address: string, tick: string): Promise<Krc721Response<GetKrc721RoyaltyFeesResponse>> {
    const networkPath = this.getNetworkPath();
    return await this.httpRequest.get<Krc721Response<GetKrc721RoyaltyFeesResponse>>(
      `/api/v1/krc721/${networkPath}/royalties/${address}/${tick}`
    );
  }

  /**
   * Retrieves the rejection reason for a transaction.
   * @param txid - The transaction ID.
   * @returns A promise that resolves to the rejection reason.
   */
  async getRejectionReason(txid: string): Promise<Krc721Response<GetKrc721RejectionResponse>> {
    const networkPath = this.getNetworkPath();
    return await this.httpRequest.get<Krc721Response<GetKrc721RejectionResponse>>(
      `/api/v1/krc721/${networkPath}/rejections/txid/${txid}`
    );
  }

  /**
   * Retrieves the ownership history of a token.
   * @param tick - The ticker symbol of the KRC-721 collection.
   * @param id - The token ID.
   * @param params - Optional pagination parameters.
   * @returns A promise that resolves to the ownership history.
   */
  async getTokenOwnershipHistory(
    tick: string, 
    id: string, 
    params: Krc721PagerRequest = {}
  ): Promise<Krc721Response<GetKrc721OwnershipHistoryResponse>> {
    const networkPath = this.getNetworkPath();
    const url = this.buildUrl(`/api/v1/krc721/${networkPath}/history/${tick}/${id}`, params);
    return await this.httpRequest.get<Krc721Response<GetKrc721OwnershipHistoryResponse>>(url);
  }

  /**
   * Retrieves the available token ID ranges for a collection.
   * @param tick - The ticker symbol of the KRC-721 collection.
   * @returns A promise that resolves to the available token ID ranges.
   */
  async getAvailableTokenRanges(tick: string): Promise<Krc721Response<GetKrc721TokenRangesResponse>> {
    const networkPath = this.getNetworkPath();
    return await this.httpRequest.get<Krc721Response<GetKrc721TokenRangesResponse>>(
      `/api/v1/krc721/${networkPath}/ranges/${tick}`
    );
  }
}

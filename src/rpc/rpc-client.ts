import {
  AddPeerRequestMessage,
  AddPeerResponseMessage,
  BanRequestMessage,
  BanResponseMessage,
  EstimateNetworkHashesPerSecondRequestMessage,
  EstimateNetworkHashesPerSecondResponseMessage,
  GetBalanceByAddressRequestMessage,
  GetBalanceByAddressResponseMessage,
  GetBalancesByAddressesRequestMessage,
  GetBalancesByAddressesResponseMessage,
  GetBlockCountRequestMessage,
  GetBlockCountResponseMessage,
  GetBlockDagInfoRequestMessage,
  GetBlockDagInfoResponseMessage,
  GetBlockRequestMessage,
  GetBlockResponseMessage,
  GetBlocksRequestMessage,
  GetBlocksResponseMessage,
  GetBlockTemplateRequestMessage,
  GetBlockTemplateResponseMessage,
  GetCoinSupplyRequestMessage,
  GetCoinSupplyResponseMessage,
  GetConnectedPeerInfoRequestMessage,
  GetConnectedPeerInfoResponseMessage,
  GetConnectionsRequestMessage,
  GetConnectionsResponseMessage,
  GetCurrentBlockColorRequestMessage,
  GetCurrentBlockColorResponseMessage,
  GetCurrentNetworkRequestMessage,
  GetCurrentNetworkResponseMessage,
  GetDaaScoreTimestampEstimateRequestMessage,
  GetDaaScoreTimestampEstimateResponseMessage,
  GetFeeEstimateExperimentalRequestMessage,
  GetFeeEstimateExperimentalResponseMessage,
  GetFeeEstimateRequestMessage,
  GetFeeEstimateResponseMessage,
  GetHeadersRequestMessage,
  GetHeadersResponseMessage,
  GetInfoRequestMessage,
  GetInfoResponseMessage,
  GetMempoolEntriesByAddressesRequestMessage,
  GetMempoolEntriesByAddressesResponseMessage,
  GetMempoolEntriesRequestMessage,
  GetMempoolEntriesResponseMessage,
  GetMempoolEntryRequestMessage,
  GetMempoolEntryResponseMessage,
  GetMetricsRequestMessage,
  GetMetricsResponseMessage,
  GetPeerAddressesRequestMessage,
  GetPeerAddressesResponseMessage,
  GetServerInfoRequestMessage,
  GetServerInfoResponseMessage,
  GetSinkBlueScoreRequestMessage,
  GetSinkBlueScoreResponseMessage,
  GetSinkRequestMessage,
  GetSinkResponseMessage,
  GetSubnetworkRequestMessage,
  GetSubnetworkResponseMessage,
  GetSyncStatusRequestMessage,
  GetSyncStatusResponseMessage,
  GetSystemInfoRequestMessage,
  GetSystemInfoResponseMessage,
  GetUtxosByAddressesRequestMessage,
  GetUtxosByAddressesResponseMessage,
  GetVirtualChainFromBlockRequestMessage,
  GetVirtualChainFromBlockResponseMessage,
  JsonRpcRequest,
  JsonRpcResponse,
  NotifyBlockAddedRequestMessage,
  NotifyBlockAddedResponseMessage,
  NotifyFinalityConflictRequestMessage,
  NotifyFinalityConflictResponseMessage,
  NotifyNewBlockTemplateRequestMessage,
  NotifyNewBlockTemplateResponseMessage,
  NotifyPruningPointUtxoSetOverrideRequestMessage,
  NotifyPruningPointUtxoSetOverrideResponseMessage,
  NotifySinkBlueScoreChangedRequestMessage,
  NotifySinkBlueScoreChangedResponseMessage,
  NotifyUtxosChangedRequestMessage,
  NotifyUtxosChangedResponseMessage,
  NotifyVirtualChainChangedRequestMessage,
  NotifyVirtualChainChangedResponseMessage,
  NotifyVirtualDaaScoreChangedRequestMessage,
  NotifyVirtualDaaScoreChangedResponseMessage,
  PingRequestMessage,
  PingResponseMessage,
  ResolveFinalityConflictRequestMessage,
  ResolveFinalityConflictResponseMessage,
  RpcBlock,
  RPCError,
  ShutdownRequestMessage,
  ShutdownResponseMessage,
  StopNotifyingUtxosChangedRequestMessage,
  StopNotifyingUtxosChangedResponseMessage,
  SubmitBlockRequestMessage,
  SubmitBlockResponseMessage,
  SubmitTransactionReplacementRequestMessage,
  SubmitTransactionReplacementResponseMessage,
  SubmitTransactionRequestMessage,
  SubmitTransactionResponseMessage,
  UnbanRequestMessage,
  UnbanResponseMessage
} from './types';
import WebsocketHeartbeatJs from 'websocket-heartbeat-js';
import { NetworkId, Resolver } from '../';
import { RpcEventCallback, RpcEventMap, RpcEventObservable, RpcEventType } from './events.ts';

/**
 * A utility class that creates a promise and exposes its resolve and reject methods.
 * This can be useful for bridging between callback-based and promise-based APIs.
 *
 * @template T - The type of the value that the promise resolves to.
 */
class BridgePromise<T> {
  public resolve: (value: T) => void = () => {};
  public reject: (reason?: any) => void = () => {};
  public promise: Promise<T>;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

/**
 * Options for configuring the RPC client.
 *
 * @interface RpcOptions
 * @property {string} [endpoint] - The endpoint URL for the RPC server.
 * @property {Resolver} [resolver] - The resolver instance to use for resolving requests.
 * @property {NetworkId} [networkId] - The network identifier to use for the RPC client.
 */
interface RpcOptions {
  endpoint?: string;
  resolver?: Resolver;
  networkId?: NetworkId;
}

/**
 * RpcClient is a client for interacting with a Kaspa node via WebSocket RPC.
 * It manages WebSocket connections, sends requests, and handles event subscriptions.
 *
 * @remarks
 * This client supports automatic reconnection and heartbeat mechanisms through WebsocketHeartbeatJs.
 *
 * @example
 * ```typescript
 * const client = new RpcClient({
 *   endpoint: 'ws://localhost:16210',
 * });
 * await client.connect();
 * ```
 *
 * @example
 * ```typescript
 * const client = new RpcClient({
 *   resolver: new Resolver(),
 *   networkId: NetworkId.Mainnet
 * });
 * await client.connect();
 * ```
 */
export class RpcClient implements RpcEventObservable {
  public readonly networkId: NetworkId;

  private client?: WebsocketHeartbeatJs;
  private readonly resolver?: Resolver;
  private readonly endpoint?: string;
  private connectedPromise: BridgePromise<boolean>;
  private requestPromiseMap: Map<number, BridgePromise<any>> = new Map();
  private eventListeners: {
    event: keyof RpcEventMap | null;
    callback: (data: any) => void;
  }[] = [];
  private connected: boolean = false;
  private connecting: boolean = false;

  constructor(rpcOptions: RpcOptions) {
    const { endpoint, resolver, networkId } = rpcOptions;

    // validate options
    if (endpoint === undefined && resolver === undefined) throw new Error('No valid resolver or endpoint provided.');
    if (endpoint !== undefined && resolver !== undefined)
      throw new Error('Both resolver and endpoint provided. Only one should be provided.');
    if (resolver !== undefined && networkId === undefined)
      throw new Error('NetworkId is required when using a resolver.');

    this.resolver = resolver;
    this.networkId = networkId!;
    this.endpoint = endpoint;
    this.connectedPromise = new BridgePromise<boolean>();
  }

  /**
   * Establishes a secure WebSocket connection to the specified endpoint.
   * Sets up event handlers for open, message, close, and error events.
   *
   * @throws {Error} If no valid endpoint is provided.
   */
  connect = async () => {
    if (this.connected) {
      console.log('Already connected');
      return;
    }

    if (this.connecting) {
      console.log('Connection attempt already in progress');
      return;
    }

    this.connecting = true;

    let endpoint = this.endpoint;

    if (endpoint === undefined) {
      if (!this.resolver) {
        throw new Error('No valid resolver or endpoint provided.');
      }
      try {
        endpoint = await this.resolver.getNodeEndpoint(this.networkId);
      } catch (error: any) {
        this.connecting = false;
        throw new Error(`Failed to get node endpoint: ${error.message}`);
      }
    }

    this.client = new WebsocketHeartbeatJs({
      url: endpoint!,
      pingMsg: JSON.stringify(this.buildRequest('ping', {}))
    });

    this.setupWebSocketEventHandlers();
  };

  private setupWebSocketEventHandlers() {
    this.client!.onopen = this.handleConnectionOpen;
    this.client!.onmessage = this.handleMessage;
    this.client!.onclose = this.handleConnectionClose;
    this.client!.onerror = this.handleConnectionError;
  }

  private handleConnectionOpen = () => {
    this.connected = true;
    this.connecting = false;
    this.connectedPromise?.resolve(true);
  };

  private handleMessage = (event: MessageEvent) => {
    const res = JSON.parse(event.data) as JsonRpcResponse<any>;
    if (res.id) {
      this.handleResponse(res);
    } else if (res.method) {
      this.handleEvent(res);
    }
  };

  private handleConnectionClose = (event: CloseEvent) => {
    console.log('Connection closed: ', event);
    this.connected = false;
    this.connecting = false;
    this.requestPromiseMap.clear();
  };

  private handleConnectionError = (event: Event) => {
    console.error('WebSocket error: ', event);
    this.connecting = false;
  };

  /**
   * Retrieves the current network information.
   *
   * @returns {Promise<GetCurrentNetworkResponseMessage>} A promise that resolves to the current network response message.
   */
  getCurrentNetwork = async (): Promise<GetCurrentNetworkResponseMessage> => {
    return await this.sendRequest<GetCurrentNetworkRequestMessage, GetCurrentNetworkResponseMessage>(
      'getCurrentNetwork',
      {}
    );
  };
  /**
   * Submits a block to the RPC server.
   *
   * @param {SubmitBlockRequestMessage | RpcBlock} request - The block submission request, which can be either a `SubmitBlockRequestMessage` or a `RpcBlock`.
   * If the request is a `SubmitBlockRequestMessage`, it should contain the block and the `allowNonDAABlocks` flag.
   * If the request is a `RpcBlock`, it will be wrapped in a `SubmitBlockRequestMessage` with `allowNonDAABlocks` set to `false`.
   * @returns {Promise<SubmitBlockResponseMessage>} A promise that resolves to a `SubmitBlockResponseMessage` containing the response from the server.
   */
  submitBlock = async (request: SubmitBlockRequestMessage | RpcBlock): Promise<SubmitBlockResponseMessage> => {
    let req: SubmitBlockRequestMessage;
    if ((request as any).block !== undefined && (request as any).allowNonDAABlocks !== undefined) {
      req = request as SubmitBlockRequestMessage;
    } else {
      req = { block: request as any, allowNonDAABlocks: false };
    }

    return await this.sendRequest<SubmitBlockRequestMessage, SubmitBlockResponseMessage>('submitBlock', req);
  };

  /**
   * Sends a request to get a block template from the RPC server.
   *
   * @param {GetBlockTemplateRequestMessage} req - The request message containing parameters for getting the block template.
   * @returns {Promise<GetBlockTemplateResponseMessage>} A promise that resolves to the response message containing the block template.
   */
  getBlockTemplate = async (req: GetBlockTemplateRequestMessage): Promise<GetBlockTemplateResponseMessage> => {
    return await this.sendRequest<GetBlockTemplateRequestMessage, GetBlockTemplateResponseMessage>(
      'getBlockTemplate',
      req
    );
  };

  /**
   * Subscribes to the block added notifications.
   *
   * This method sends a request to start receiving notifications whenever a new block is added.
   * It constructs a `NotifyBlockAddedRequestMessage` with the command to start notifications,
   * sends the request, and ensures that a valid response is received.
   *
   * @returns {Promise<void>} A promise that resolves when the subscription is successfully initiated.
   */
  subscribeBlockAdded = async (): Promise<void> => {
    const res = await this.sendSubscribeRequest<NotifyBlockAddedRequestMessage, NotifyBlockAddedResponseMessage>(
      RpcEventType.BlockAdded,
      {}
    );
    this.ensureResponse(res);
  };

  /**
   * Unsubscribes from block added notifications.
   *
   * Sends a request to stop receiving notifications for block additions.
   * This method sends a `NotifyBlockAddedRequestMessage` with the `NOTIFY_STOP` command.
   *
   * @returns {Promise<void>} A promise that resolves when the unsubscribe request is completed.
   */
  unsubscribeBlockAdded = async (): Promise<void> => {
    const res = await this.sendUnsubscribeRequest<NotifyBlockAddedRequestMessage, NotifyBlockAddedResponseMessage>(
      RpcEventType.BlockAdded,
      {}
    );
    this.ensureResponse(res);
  };

  /**
   * Retrieves the peer addresses from the RPC server.
   *
   * @returns {Promise<GetPeerAddressesResponseMessage>} A promise that resolves to the response message containing peer addresses.
   */
  getPeerAddresses = async (): Promise<GetPeerAddressesResponseMessage> => {
    return await this.sendRequest<GetPeerAddressesRequestMessage, GetPeerAddressesResponseMessage>(
      'getPeerAddresses',
      {}
    );
  };

  /**
   * Retrieves the current sink block, which is the block with
   * the highest cumulative difficulty in the Kaspa BlockDAG.
   *
   * @returns {Promise<GetSinkResponseMessage>} A promise that resolves to the sink block information, including the sink block hash and sink block height.
   */
  getSink = async (): Promise<GetSinkResponseMessage> => {
    return await this.sendRequest<GetSinkRequestMessage, GetSinkResponseMessage>('getSink', {});
  };

  /**
   * Retrieves a specific mempool entry by transaction ID.
   *
   * @param req - The request message containing the transaction ID.
   * @returns A promise that resolves to the mempool entry information.
   */
  getMempoolEntry = async (req: GetMempoolEntryRequestMessage): Promise<GetMempoolEntryResponseMessage> => {
    return await this.sendRequest<GetMempoolEntryRequestMessage, GetMempoolEntryResponseMessage>(
      'getMempoolEntry',
      req
    );
  };

  /**
   * Retrieves information about the peers connected to the Kaspa node.
   *
   * @returns {Promise<GetConnectedPeerInfoResponseMessage>} A promise that resolves to an object containing information about the connected peers.
   *
   * The returned information includes:
   * - Peer ID
   * - IP address and port
   * - Connection status
   * - Protocol version
   */
  getConnectedPeerInfo = async (): Promise<GetConnectedPeerInfoResponseMessage> => {
    return await this.sendRequest<GetConnectedPeerInfoRequestMessage, GetConnectedPeerInfoResponseMessage>(
      'getConnectedPeerInfo',
      {}
    );
  };

  /**
   * Adds a new peer to the network.
   *
   * @param req - The request message containing the peer information to be added.
   * @returns A promise that resolves to the response message indicating the result of the add peer operation.
   */
  addPeer = async (req: AddPeerRequestMessage): Promise<AddPeerResponseMessage> => {
    return await this.sendRequest<AddPeerRequestMessage, AddPeerResponseMessage>('addPeer', req);
  };

  /**
   * Submits a transaction to the Kaspa network.
   *
   * This method sends a request to submit a transaction to the network.
   *
   * @param {SubmitTransactionRequestMessage} input - The request message containing the transaction details to be submitted.
   * @returns {Promise<SubmitTransactionResponseMessage>} A promise that resolves to the response message indicating the result of the transaction submission.
   */
  submitTransaction = async (input: SubmitTransactionRequestMessage): Promise<SubmitTransactionResponseMessage> => {
    return await this.sendRequest<SubmitTransactionRequestMessage, SubmitTransactionResponseMessage>(
      'submitTransaction',
      input
    );
  };

  /**
   * Subscribes to virtual chain changed notifications.
   *
   * Virtual chain changed notification event is produced when the virtual
   * chain changes in the Kaspa BlockDAG.
   *
   * @param {boolean} includeAcceptedTransactionIds - Whether to include accepted transaction IDs in the notification.
   * @returns {Promise<void>} A promise that resolves when the subscription is successfully initiated.
   */
  //{"id":16956029488558164974,"method":"subscribe","params":{"VirtualChainChanged":{"include_accepted_transaction_ids":true}}}
  subscribeVirtualChainChanged = async (includeAcceptedTransactionIds: boolean): Promise<void> => {
    const req: NotifyVirtualChainChangedRequestMessage = {
      include_accepted_transaction_ids: includeAcceptedTransactionIds
    };
    const res = await this.sendSubscribeRequest<
      NotifyVirtualChainChangedRequestMessage,
      NotifyVirtualChainChangedResponseMessage
    >(RpcEventType.VirtualChainChanged, req);

    this.ensureResponse(res);
  };

  /**
   * Unsubscribes from virtual chain changed notifications.
   *
   * Virtual chain changed notification event is produced when the virtual
   * chain changes in the Kaspa BlockDAG.
   *
   * @param {boolean} includeAcceptedTransactionIds - Whether to include accepted transaction IDs in the notification.
   * @returns {Promise<void>} A promise that resolves when the unsubscribe operation is successfully completed.
   */
  unsubscribeVirtualChainChanged = async (includeAcceptedTransactionIds: boolean): Promise<void> => {
    const req: NotifyVirtualChainChangedRequestMessage = {
      include_accepted_transaction_ids: includeAcceptedTransactionIds
    };
    const res = await this.sendUnsubscribeRequest<
      NotifyVirtualChainChangedRequestMessage,
      NotifyVirtualChainChangedResponseMessage
    >(RpcEventType.VirtualChainChanged, req);
    this.ensureResponse(res);
  };

  /**
   * Retrieves a specific block from the Kaspa BlockDAG.
   *
   * @param {GetBlockRequestMessage} req - The request message containing the block details to be retrieved.
   * @returns {Promise<GetBlockResponseMessage>} A promise that resolves to the response message containing the block information.
   */
  getBlock = async (req: GetBlockRequestMessage): Promise<GetBlockResponseMessage> => {
    return await this.sendRequest<GetBlockRequestMessage, GetBlockResponseMessage>('getBlock', req);
  };

  /**
   * Retrieves information about a sub-network in the Kaspa BlockDAG.
   *
   * @param {GetSubnetworkRequestMessage} req - The request message containing the subnetwork details to be retrieved.
   * @returns {Promise<GetSubnetworkResponseMessage>} A promise that resolves to the response message containing the subnetwork information.
   */
  getSubnetwork = async (req: GetSubnetworkRequestMessage): Promise<GetSubnetworkResponseMessage> => {
    return await this.sendRequest<GetSubnetworkRequestMessage, GetSubnetworkResponseMessage>('getSubnetwork', req);
  };

  /**
   * Retrieves the virtual chain corresponding to a specified block hash.
   *
   * @param {GetVirtualChainFromBlockRequestMessage} req - The request message containing the block hash details.
   * @returns {Promise<GetVirtualChainFromBlockResponseMessage>} A promise that resolves to the response message containing the virtual chain information.
   */
  getVirtualChainFromBlock = async (
    req: GetVirtualChainFromBlockRequestMessage
  ): Promise<GetVirtualChainFromBlockResponseMessage> => {
    return await this.sendRequest<GetVirtualChainFromBlockRequestMessage, GetVirtualChainFromBlockResponseMessage>(
      'getVirtualChainFromBlock',
      req
    );
  };

  /**
   * Retrieves multiple blocks from the Kaspa BlockDAG.
   *
   * @param {GetBlocksRequestMessage} req - The request message containing the block details to be retrieved.
   * @returns {Promise<GetBlocksResponseMessage>} A promise that resolves to the response message containing the list of block information.
   */
  getBlocks = async (req: GetBlocksRequestMessage): Promise<GetBlocksResponseMessage> => {
    return await this.sendRequest<GetBlocksRequestMessage, GetBlocksResponseMessage>('getBlocks', req);
  };

  /**
   * Retrieves the current number of blocks in the Kaspa BlockDAG.
   *
   * @returns {Promise<GetBlockCountResponseMessage>} A promise that resolves to the response message containing the current block count.
   */
  getBlockCount = async (): Promise<GetBlockCountResponseMessage> => {
    return await this.sendRequest<GetBlockCountRequestMessage, GetBlockCountResponseMessage>('getBlockCount', {});
  };

  /**
   * Provides information about the Directed Acyclic Graph (DAG) structure of the Kaspa BlockDAG.
   *
   * @returns {Promise<GetBlockDagInfoResponseMessage>} A promise that resolves to the response message containing the DAG information.
   */
  getBlockDagInfo = async (): Promise<GetBlockDagInfoResponseMessage> => {
    return await this.sendRequest<GetBlockDagInfoRequestMessage, GetBlockDagInfoResponseMessage>('getBlockDagInfo', {});
  };

  /**
   * Resolves a finality conflict in the Kaspa BlockDAG.
   *
   * @param {ResolveFinalityConflictRequestMessage} req - The request message containing the details of the finality conflict to be resolved.
   * @returns {Promise<ResolveFinalityConflictResponseMessage>} A promise that resolves to the response message indicating the result of the finality conflict resolution.
   */
  resolveFinalityConflict = async (
    req: ResolveFinalityConflictRequestMessage
  ): Promise<ResolveFinalityConflictResponseMessage> => {
    return await this.sendRequest<ResolveFinalityConflictRequestMessage, ResolveFinalityConflictResponseMessage>(
      'resolveFinalityConflict',
      req
    );
  };

  /**
   * Subscribes to new block template notifications.
   *
   * Finality conflict resolved notification event is produced when a finality conflict in the Kaspa BlockDAG is resolved.
   *
   * @returns {Promise<void>} A promise that resolves when the subscription is successfully initiated.
   */
  subscribeFinalityConflict = async (): Promise<void> => {
    const req: NotifyFinalityConflictRequestMessage = {};
    const res = await this.sendSubscribeRequest<
      NotifyFinalityConflictRequestMessage,
      NotifyFinalityConflictResponseMessage
    >(RpcEventType.FinalityConflict, req);
    this.ensureResponse(res);
  };

  /**
   * Unsubscribes from finality conflict notifications.
   *
   * Finality conflict notification event is produced when a finality conflict occurs in the Kaspa BlockDAG.
   *
   * @returns {Promise<void>} A promise that resolves when the unsubscribe operation is successfully completed.
   */
  unsubscribeFinalityConflict = async (): Promise<void> => {
    const req: NotifyFinalityConflictRequestMessage = {};
    const res = await this.sendUnsubscribeRequest<
      NotifyFinalityConflictRequestMessage,
      NotifyFinalityConflictResponseMessage
    >(RpcEventType.FinalityConflict, req);
    this.ensureResponse(res);
  };

  /**
   * Retrieves mempool entries from the Kaspa node's mempool.
   *
   * @param {GetMempoolEntriesRequestMessage} req - The request message containing the details of the mempool entries to be retrieved.
   * @returns {Promise<GetMempoolEntriesResponseMessage>} A promise that resolves to the response message containing the list of mempool entries.
   */
  getMempoolEntries = async (req: GetMempoolEntriesRequestMessage): Promise<GetMempoolEntriesResponseMessage> => {
    return await this.sendRequest<GetMempoolEntriesRequestMessage, GetMempoolEntriesResponseMessage>(
      'getMempoolEntries',
      req
    );
  };

  /**
   * Gracefully shuts down the Kaspa node.
   *
   * @returns {Promise<ShutdownResponseMessage>} A promise that resolves to the response message indicating the result of the shutdown request.
   */
  shutdown = async (): Promise<ShutdownResponseMessage> => {
    return await this.sendRequest<ShutdownRequestMessage, ShutdownResponseMessage>('shutdown', {});
  };

  /**
   * Retrieves block headers from the Kaspa BlockDAG.
   *
   * @param {GetHeadersRequestMessage} req - The request message containing the details of the block headers to be retrieved.
   * @returns {Promise<GetHeadersResponseMessage>} A promise that resolves to the response message containing the list of block headers.
   */
  getHeaders = async (req: GetHeadersRequestMessage): Promise<GetHeadersResponseMessage> => {
    return await this.sendRequest<GetHeadersRequestMessage, GetHeadersResponseMessage>('getHeaders', req);
  };

  /**
   * Subscribes to new block template notifications.
   *
   * UTXOs changed notification event is produced when the set of unspent transaction outputs (UTXOs) changes in the Kaspa BlockDAG. The event notification will be scoped to the provided list of addresses.
   *
   * @param {string[]} addresses - The list of addresses to be monitored for UTXO changes.
   * @returns {Promise<void>} A promise that resolves when the subscription is successfully initiated.
   */
  subscribeUtxosChanged = async (addresses: string[]): Promise<void> => {
    const req: NotifyUtxosChangedRequestMessage = { addresses };
    const res = await this.sendSubscribeRequest<NotifyUtxosChangedRequestMessage, NotifyUtxosChangedResponseMessage>(
      RpcEventType.UtxosChanged,
      req
    );
    this.ensureResponse(res);
  };

  /**
   * Unsubscribes from UTXO change notifications.
   *
   * @param {string[]} addresses - The list of addresses to be removed from monitoring for UTXO changes.
   * @returns {Promise<void>} A promise that resolves when the unsubscribe operation is successfully completed.
   */
  unsubscribeUtxosChanged = async (addresses: string[]): Promise<void> => {
    const req: StopNotifyingUtxosChangedRequestMessage = { addresses };
    const res = await this.sendUnsubscribeRequest<
      StopNotifyingUtxosChangedRequestMessage,
      StopNotifyingUtxosChangedResponseMessage
    >(RpcEventType.UtxosChanged, req);
    this.ensureResponse(res);
  };

  /**
   * Retrieves unspent transaction outputs (UTXOs) associated with specific addresses.
   *
   * @param {GetUtxosByAddressesRequestMessage | string[]} reqOrAddresses - The request message or an array of addresses.
   * @returns {Promise<GetUtxosByAddressesResponseMessage>} A promise that resolves to the response message containing the list of UTXOs.
   */
  getUtxosByAddresses = async (
    reqOrAddresses: GetUtxosByAddressesRequestMessage | string[]
  ): Promise<GetUtxosByAddressesResponseMessage> => {
    const req: GetUtxosByAddressesRequestMessage = Array.isArray(reqOrAddresses)
      ? { addresses: reqOrAddresses }
      : reqOrAddresses;
    return await this.sendRequest<GetUtxosByAddressesRequestMessage, GetUtxosByAddressesResponseMessage>(
      'getUtxosByAddresses',
      req
    );
  };

  /**
   * Returns the blue score of the current sink block, indicating the total amount of work that has been done on the main chain leading up to that block.
   *
   * @returns {Promise<GetSinkBlueScoreResponseMessage>} A promise that resolves to the response message containing the blue score of the sink block.
   */
  getSinkBlueScore = async (): Promise<GetSinkBlueScoreResponseMessage> => {
    return await this.sendRequest<GetSinkBlueScoreRequestMessage, GetSinkBlueScoreResponseMessage>(
      'getSinkBlueScore',
      {}
    );
  };

  /**
   * Subscribes to new block template notifications.
   *
   * Sink blue score changed notification event is produced when the blue score of the sink block changes in the Kaspa BlockDAG.
   *
   * @returns {Promise<void>} A promise that resolves when the subscription is successfully initiated.
   */
  subscribeSinkBlueScoreChanged = async (): Promise<void> => {
    const req: NotifySinkBlueScoreChangedRequestMessage = {};
    const res = await this.sendSubscribeRequest<
      NotifySinkBlueScoreChangedRequestMessage,
      NotifySinkBlueScoreChangedResponseMessage
    >(RpcEventType.SinkBlueScoreChanged, req);
    this.ensureResponse(res);
  };

  /**
   * Unsubscribes from sink blue score change notifications.
   *
   * @returns {Promise<void>} A promise that resolves when the unsubscribe operation is successfully completed.
   */
  unsubscribeSinkBlueScoreChanged = async (): Promise<void> => {
    const req: NotifySinkBlueScoreChangedRequestMessage = {};
    const res = await this.sendUnsubscribeRequest<
      NotifySinkBlueScoreChangedRequestMessage,
      NotifySinkBlueScoreChangedResponseMessage
    >(RpcEventType.SinkBlueScoreChanged, req);
    this.ensureResponse(res);
  };

  /**
   * Bans a peer from connecting to the Kaspa node for a specified duration.
   *
   * @param {BanRequestMessage} req - The request message containing the peer information to be banned.
   * @returns {Promise<BanResponseMessage>} A promise that resolves to the response message indicating the result of the ban operation.
   */
  ban = async (req: BanRequestMessage): Promise<BanResponseMessage> => {
    return await this.sendRequest<BanRequestMessage, BanResponseMessage>('ban', req);
  };

  /**
   * Unbans a previously banned peer, allowing it to reconnect to the Kaspa node.
   *
   * @param {UnbanRequestMessage} req - The request message containing the peer information to be unbanned.
   * @returns {Promise<UnbanResponseMessage>} A promise that resolves to the response message indicating the result of the unban operation.
   */
  unban = async (req: UnbanRequestMessage): Promise<UnbanResponseMessage> => {
    return await this.sendRequest<UnbanRequestMessage, UnbanResponseMessage>('unban', req);
  };

  /**
   * Retrieves general information about the Kaspa node.
   *
   * @returns {Promise<GetInfoResponseMessage>} A promise that resolves to the response message containing the node information.
   */
  getInfo = async (): Promise<GetInfoResponseMessage> => {
    return await this.sendRequest<GetInfoRequestMessage, GetInfoResponseMessage>('getInfo', {});
  };

  /**
   * Manages subscription for a pruning point UTXO set override notification event.
   *
   * Pruning point UTXO set override notification event is produced when the UTXO set override for the pruning point changes in the Kaspa BlockDAG.
   *
   * @returns {Promise<void>} A promise that resolves when the subscription is successfully initiated.
   */
  subscribePruningPointUtxoSetOverride = async (): Promise<void> => {
    const req: NotifyPruningPointUtxoSetOverrideRequestMessage = {};
    const res = await this.sendSubscribeRequest<
      NotifyPruningPointUtxoSetOverrideRequestMessage,
      NotifyPruningPointUtxoSetOverrideResponseMessage
    >(RpcEventType.PruningPointUtxoSetOverride, req);
    this.ensureResponse(res);
  };

  /**
   * Unsubscribes from pruning point UTXO set override notifications.
   *
   * @returns {Promise<void>} A promise that resolves when the unsubscribe operation is successfully completed.
   */
  unsubscribePruningPointUtxoSetOverride = async (): Promise<void> => {
    const req: NotifyPruningPointUtxoSetOverrideRequestMessage = {};
    const res = await this.sendUnsubscribeRequest<
      NotifyPruningPointUtxoSetOverrideRequestMessage,
      NotifyPruningPointUtxoSetOverrideResponseMessage
    >(RpcEventType.PruningPointUtxoSetOverride, req);
    this.ensureResponse(res);
  };

  /**
   * Estimates the network's current hash rate in hashes per second.
   *
   * @param {EstimateNetworkHashesPerSecondRequestMessage} req - The request message containing the estimation details.
   * @returns {Promise<EstimateNetworkHashesPerSecondResponseMessage>} A promise that resolves to the response message containing the estimated network hashes per second.
   */
  estimateNetworkHashesPerSecond = async (
    req: EstimateNetworkHashesPerSecondRequestMessage
  ): Promise<EstimateNetworkHashesPerSecondResponseMessage> => {
    return await this.sendRequest<
      EstimateNetworkHashesPerSecondRequestMessage,
      EstimateNetworkHashesPerSecondResponseMessage
    >('estimateNetworkHashesPerSecond', req);
  };

  /**
   * Subscribes to the UTXOs changed notification event.
   *
   * Virtual DAA score changed notification event is produced when the virtual Difficulty Adjustment Algorithm (DAA) score changes in the Kaspa BlockDAG.
   *
   * @returns {Promise<void>} A promise that resolves when the subscription is successfully initiated.
   */
  subscribeVirtualDaaScoreChanged = async (): Promise<void> => {
    const req: NotifyVirtualDaaScoreChangedRequestMessage = {};
    const res = await this.sendSubscribeRequest<
      NotifyVirtualDaaScoreChangedRequestMessage,
      NotifyVirtualDaaScoreChangedResponseMessage
    >(RpcEventType.VirtualDaaScoreChanged, req);
    this.ensureResponse(res);
  };

  /**
   * Unsubscribes from the virtual DAA score changed notification event.
   *
   * @returns {Promise<void>} A promise that resolves when the unsubscribe operation is successfully completed.
   */
  unsubscribeVirtualDaaScoreChanged = async (): Promise<void> => {
    const req: NotifyVirtualDaaScoreChangedRequestMessage = {};
    const res = await this.sendUnsubscribeRequest<
      NotifyVirtualDaaScoreChangedRequestMessage,
      NotifyVirtualDaaScoreChangedResponseMessage
    >(RpcEventType.VirtualDaaScoreChanged, req);
    this.ensureResponse(res);
  };

  /**
   * Retrieves the balance of a specific address in the Kaspa BlockDAG.
   *
   * @param {string | GetBalanceByAddressRequestMessage} addressOrRequest - The address or request message containing the address details.
   * @returns {Promise<GetBalanceByAddressResponseMessage>} A promise that resolves to the response message containing the balance information.
   */
  getBalanceByAddress = async (
    addressOrRequest: string | GetBalanceByAddressRequestMessage
  ): Promise<GetBalanceByAddressResponseMessage> => {
    const req: GetBalanceByAddressRequestMessage =
      typeof addressOrRequest === 'string' ? { address: addressOrRequest } : addressOrRequest;
    return await this.sendRequest<GetBalanceByAddressRequestMessage, GetBalanceByAddressResponseMessage>(
      'getBalanceByAddress',
      req
    );
  };

  /**
   * Retrieves balances for multiple addresses in the Kaspa BlockDAG.
   *
   * @param {string[] | GetBalancesByAddressesRequestMessage} addressesOrRequest - The array of addresses or the request message containing the addresses.
   * @returns {Promise<GetBalancesByAddressesResponseMessage>} A promise that resolves to the response message containing the balances information.
   */
  getBalancesByAddresses = async (
    addressesOrRequest: string[] | GetBalancesByAddressesRequestMessage
  ): Promise<GetBalancesByAddressesResponseMessage> => {
    const req: GetBalancesByAddressesRequestMessage = Array.isArray(addressesOrRequest)
      ? { addresses: addressesOrRequest }
      : addressesOrRequest;
    return await this.sendRequest<GetBalancesByAddressesRequestMessage, GetBalancesByAddressesResponseMessage>(
      'getBalancesByAddresses',
      req
    );
  };

  /**
   * Subscribes to new block template notifications.
   *
   * New block template notification event is produced when a new block template is generated for mining in the Kaspa BlockDAG.
   *
   * @returns {Promise<void>} A promise that resolves when the subscription is successfully initiated.
   */
  subscribeNewBlockTemplate = async (): Promise<void> => {
    const req: NotifyNewBlockTemplateRequestMessage = {};
    const res = await this.sendSubscribeRequest<
      NotifyNewBlockTemplateRequestMessage,
      NotifyNewBlockTemplateResponseMessage
    >(RpcEventType.NewBlockTemplate, req);
    this.ensureResponse(res);
  };

  /**
   * Unsubscribes from new block template notifications.
   *
   * @returns {Promise<void>} A promise that resolves when the unsubscribe operation is successfully completed.
   */
  unsubscribeNewBlockTemplate = async (): Promise<void> => {
    const req: NotifyNewBlockTemplateRequestMessage = {};
    const res = await this.sendUnsubscribeRequest<
      NotifyNewBlockTemplateRequestMessage,
      NotifyNewBlockTemplateResponseMessage
    >(RpcEventType.NewBlockTemplate, req);
    this.ensureResponse(res);
  };

  /**
   * Retrieves mempool entries associated with specific addresses.
   *
   * @param {GetMempoolEntriesByAddressesRequestMessage} req - The request message containing the addresses details.
   * @returns {Promise<GetMempoolEntriesByAddressesResponseMessage>} A promise that resolves to the response message containing the list of mempool entries.
   */
  getMempoolEntriesByAddresses = async (
    req: GetMempoolEntriesByAddressesRequestMessage
  ): Promise<GetMempoolEntriesByAddressesResponseMessage> => {
    return await this.sendRequest<
      GetMempoolEntriesByAddressesRequestMessage,
      GetMempoolEntriesByAddressesResponseMessage
    >('getMempoolEntriesByAddresses', req);
  };

  /**
   * Retrieves the total coin supply of the Kaspa network.
   *
   * @returns {Promise<GetCoinSupplyResponseMessage>} A promise that resolves to the response message containing the total coin supply.
   */
  getCoinSupply = async (): Promise<GetCoinSupplyResponseMessage> => {
    const req: GetCoinSupplyRequestMessage = {};
    return await this.sendRequest<GetCoinSupplyRequestMessage, GetCoinSupplyResponseMessage>('getCoinSupply', req);
  };

  /**
   * Tests the connection and responsiveness of a Kaspa node.
   *
   * @returns {Promise<PingResponseMessage>} A promise that resolves to the response message indicating the result of the ping request.
   */
  ping = async (): Promise<PingResponseMessage> => {
    return await this.sendRequest<PingRequestMessage, PingResponseMessage>('ping', {});
  };

  /**
   * Retrieves various metrics and statistics related to the performance and status of the Kaspa node.
   *
   * @param {GetMetricsRequestMessage} req - The request message containing the metrics details.
   * @returns {Promise<GetMetricsResponseMessage>} A promise that resolves to the response message containing the metrics information.
   */
  getMetrics = async (req: GetMetricsRequestMessage): Promise<GetMetricsResponseMessage> => {
    return await this.sendRequest<GetMetricsRequestMessage, GetMetricsResponseMessage>('getMetrics', req);
  };

  /**
   * Retrieves information about the Kaspa server.
   *
   * @returns {Promise<GetServerInfoResponseMessage>} A promise that resolves to the response message containing the server information.
   */
  getServerInfo = async (): Promise<GetServerInfoResponseMessage> => {
    const req: GetServerInfoRequestMessage = {};
    return await this.sendRequest<GetServerInfoRequestMessage, GetServerInfoResponseMessage>('getServerInfo', req);
  };

  /**
   * Obtains basic information about the synchronization status of the Kaspa node.
   *
   * @returns {Promise<GetSyncStatusResponseMessage>} A promise that resolves to the response message containing the sync status information.
   */
  getSyncStatus = async (): Promise<GetSyncStatusResponseMessage> => {
    const req: GetSyncStatusRequestMessage = {};
    return await this.sendRequest<GetSyncStatusRequestMessage, GetSyncStatusResponseMessage>('getSyncStatus', req);
  };

  /**
   * Retrieves the estimated DAA (Difficulty Adjustment Algorithm) score timestamp estimate.
   *
   * @param {number[] | GetDaaScoreTimestampEstimateRequestMessage} daaScoresOrReq - The array of DAA scores or the request message containing the DAA scores details.
   * @returns {Promise<GetDaaScoreTimestampEstimateResponseMessage>} A promise that resolves to the response message containing the DAA score timestamp estimate.
   */
  getDaaScoreTimestampEstimate = async (
    daaScoresOrReq: number[] | GetDaaScoreTimestampEstimateRequestMessage
  ): Promise<GetDaaScoreTimestampEstimateResponseMessage> => {
    const req: GetDaaScoreTimestampEstimateRequestMessage = Array.isArray(daaScoresOrReq)
      ? { daaScores: daaScoresOrReq }
      : daaScoresOrReq;
    return await this.sendRequest<
      GetDaaScoreTimestampEstimateRequestMessage,
      GetDaaScoreTimestampEstimateResponseMessage
    >('getDaaScoreTimestampEstimate', req);
  };

  /**
   * Submits an RBF (Replace-By-Fee) transaction to the Kaspa network.
   *
   * @param {SubmitTransactionReplacementRequestMessage} req - The request message containing the transaction replacement details.
   * @returns {Promise<SubmitTransactionReplacementResponseMessage>} A promise that resolves to the response message indicating the result of the transaction replacement submission.
   */
  submitTransactionReplacement = async (
    req: SubmitTransactionReplacementRequestMessage
  ): Promise<SubmitTransactionReplacementResponseMessage> => {
    return await this.sendRequest<
      SubmitTransactionReplacementRequestMessage,
      SubmitTransactionReplacementResponseMessage
    >('submitTransactionReplacement', req);
  };

  /**
   * Retrieves the current number of network connections.
   *
   * @returns {Promise<GetConnectionsResponseMessage>} A promise that resolves to the response message containing the connections information.
   */
  getConnections = async (): Promise<GetConnectionsResponseMessage> => {
    const req: GetConnectionsRequestMessage = { includeProfileData: false };
    return await this.sendRequest<GetConnectionsRequestMessage, GetConnectionsResponseMessage>('getConnections', req);
  };

  /**
   * Retrieves system information about the Kaspa node.
   *
   * @returns {Promise<GetSystemInfoResponseMessage>} A promise that resolves to the response message containing the system information.
   */
  getSystemInfo = async (): Promise<GetSystemInfoResponseMessage> => {
    const req: GetSystemInfoRequestMessage = {};
    return await this.sendRequest<GetSystemInfoRequestMessage, GetSystemInfoResponseMessage>('getSystemInfo', req);
  };

  /**
   * Retrieves fee estimates for transactions in the Kaspa network.
   *
   * @returns {Promise<GetFeeEstimateResponseMessage>} A promise that resolves to the response message containing the fee estimates.
   */
  getFeeEstimate = async (): Promise<GetFeeEstimateResponseMessage> => {
    return await this.sendRequest<GetFeeEstimateRequestMessage, GetFeeEstimateResponseMessage>('getFeeEstimate', {});
  };

  /**
   * Retrieves experimental fee estimates for transactions in the Kaspa network.
   *
   * @param {GetFeeEstimateExperimentalRequestMessage} req - The request message containing the experimental fee estimate details.
   * @returns {Promise<GetFeeEstimateExperimentalResponseMessage>} A promise that resolves to the response message containing the experimental fee estimates.
   */
  getFeeEstimateExperimental = async (
    req: GetFeeEstimateExperimentalRequestMessage
  ): Promise<GetFeeEstimateExperimentalResponseMessage> => {
    return await this.sendRequest<GetFeeEstimateExperimentalRequestMessage, GetFeeEstimateExperimentalResponseMessage>(
      'getFeeEstimateExperimental',
      req
    );
  };

  /**
   * Checks if a block is blue or not.
   *
   * @param {GetCurrentBlockColorRequestMessage} req - The request message containing the block details.
   * @returns {Promise<GetCurrentBlockColorResponseMessage>} A promise that resolves to the response message containing the block color information.
   */
  getCurrentBlockColor = async (
    req: GetCurrentBlockColorRequestMessage
  ): Promise<GetCurrentBlockColorResponseMessage> => {
    return await this.sendRequest<GetCurrentBlockColorRequestMessage, GetCurrentBlockColorResponseMessage>(
      'getCurrentBlockColor',
      req
    );
  };

  /**
   * Adds an event listener for RPC events.
   *
   * @param {RpcEventCallback} callback - The callback function to be invoked when an event occurs.
   */
  addEventListener(callback: RpcEventCallback): void;
  /**
   * Adds an event listener for a specific RPC event.
   *
   * @param {keyof RpcEventMap} event - The event to listen for.
   * @param {(eventData: RpcEventMap[M]) => void} callback - The callback function to be invoked when the event occurs.
   */
  addEventListener<M extends keyof RpcEventMap>(event: M, callback: (eventData: RpcEventMap[M]) => void): void;
  addEventListener(
    eventOrCallback: keyof RpcEventMap | RpcEventCallback,
    callback?: (eventData: unknown) => void
  ): void {
    if (typeof eventOrCallback === 'function') {
      // Handle the case where only a callback is provided
      this.eventListeners.push({ event: null, callback: eventOrCallback });
    } else {
      // Handle the case where an event and a callback are provided
      if (!callback) {
        throw new Error('Callback must be provided when specifying an event');
      }
      this.eventListeners.push({
        event: eventOrCallback,
        callback: callback as (data: unknown) => void
      });
    }
  }

  /**
   * Removes an event listener for a specific RPC event.
   *
   * @param {RpcEventType | string} event - The event to stop listening for.
   * @param {RpcEventCallback} [callback] - The callback function to be removed.
   */
  removeEventListener(event: RpcEventType | string, callback?: RpcEventCallback): void {
    this.eventListeners = this.eventListeners.filter((listener) => {
      if (callback) {
        return listener.event !== event || listener.callback !== callback;
      }
      return listener.event !== event;
    });
  }

  /**
   * Clears a specific event listener callback from all events.
   *
   * @param {RpcEventCallback} callback - The callback function to be removed.
   */
  clearEventListener(callback: RpcEventCallback): void {
    this.eventListeners = this.eventListeners.filter((listener) => listener.callback !== callback);
  }

  /**
   * Removes all event listeners for all events.
   */
  removeAllEventListeners(): void {
    this.eventListeners = [];
  }

  /**
   * Disposes the RPC client by closing the WebSocket connection.
   */
  dispose = () => {
    this.removeAllEventListeners();
    this.requestPromiseMap.clear();
    this.client?.close();
    this.client = undefined;
  };

  /**
   * Builds a JSON-RPC request object.
   *
   * @param {string} method - The RPC method to be called.
   * @param {T} params - The parameters for the RPC method.
   * @returns {JsonRpcRequest<T>} The JSON-RPC request object.
   */
  private buildRequest = <T>(method: string, params: T): JsonRpcRequest<T> => {
    return {
      id: this.generateRandomId(),
      method,
      params
    };
  };

  /**
   * Sends a JSON-RPC request to the server and returns the response.
   *
   * @param {string} method - The RPC method to be called.
   * @param {TParam} params - The parameters for the RPC method.
   * @returns {Promise<TRes>} A promise that resolves to the response of the RPC method.
   */
  private async sendRequest<TParam, TRes>(method: string, params: TParam): Promise<TRes> {
    if (this.client === undefined) {
      await this.connect();
    }

    await this.connectedPromise.promise;
    const request = this.buildRequest(method, params);
    const bridgePromise = new BridgePromise<TRes>();
    this.requestPromiseMap.set(request.id ?? 0, bridgePromise);
    this.client!.send(JSON.stringify(request));
    return bridgePromise.promise;
  }

  private buildSubscribeRequest = <T>(event: RpcEventType, params: T): JsonRpcRequest<T> => {
    let req: any = {
      id: this.generateRandomId(),
      method: 'subscribe'
    };
    req[event] = params;
    return req;
  };

  private buildUnsubscribeRequest = <T>(event: RpcEventType, params: T): JsonRpcRequest<T> => {
    let req: any = {
      id: this.generateRandomId(),
      method: 'unsubscribe'
    };
    req[event] = params;
    return req;
  };

  /**
   * Sends a JSON-RPC subscription request to the server.
   *
   * @param {RpcEventType} event - The RPC event to subscribe to.
   * @param {TParam} params - The parameters for the RPC method.
   */
  private async sendSubscribeRequest<TParam, TRes>(event: RpcEventType, params: TParam): Promise<TRes> {
    if (this.client === undefined) {
      await this.connect();
    }

    await this.connectedPromise.promise;
    const request = this.buildSubscribeRequest(event, params);
    const bridgePromise = new BridgePromise<TRes>();
    this.requestPromiseMap.set(request.id ?? 0, bridgePromise);
    this.client!.send(JSON.stringify(request));
    return bridgePromise.promise;
  }

  /**
   * Sends a JSON-RPC unsubscribe request to the server.
   *
   * @param {RpcEventType} event - The RPC event to unsubscribe from.
   * @param {TParam} params - The parameters for the RPC method.
   */
  private async sendUnsubscribeRequest<TParam, TRes>(event: RpcEventType, params: TParam): Promise<TRes> {
    if (this.client === undefined) {
      await this.connect();
    }

    await this.connectedPromise.promise;
    const request = this.buildUnsubscribeRequest(event, params);
    const bridgePromise = new BridgePromise<TRes>();
    this.requestPromiseMap.set(request.id ?? 0, bridgePromise);
    this.client!.send(JSON.stringify(request));
    return bridgePromise.promise;
  }

  /**
   * Handles the response from the server for a JSON-RPC request.
   *
   * @param {JsonRpcResponse<any>} res - The response from the server.
   */
  private handleResponse(res: JsonRpcResponse<any>) {
    const bridgePromise = this.requestPromiseMap.get(res.id!);
    if (bridgePromise) {
      if (res.error) {
        bridgePromise.reject(res.error);
      } else {
        bridgePromise.resolve(res.params);
      }
      this.requestPromiseMap.delete(res.id!);
    }
  }

  /**
   * Handles an event notification from the server.
   *
   * @param {JsonRpcResponse<any>} res - The event notification from the server.
   */
  private handleEvent(res: JsonRpcResponse<any>) {
    if (!res.method.endsWith('Notification')) throw new Error(`Invalid event name: ${res.method}`);

    for (const listener of this.eventListeners) {
      if (listener.event === null || res.params[listener.event]) {
        listener.callback(res.params);
      }
    }
  }

  /**
   * Ensures that the response from the server does not contain an error.
   *
   * @param {Res} response - The response from the server.
   * @throws {Error} If the response contains an error.
   */
  private ensureResponse<Res extends { error?: RPCError }>(response: Res): void {
    if (response.error) {
      throw new Error(`RPC Error: ${response.error.message}`);
    }
  }

  // generate a random id for the client u64
  private generateRandomId(): number {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  }
}

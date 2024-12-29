/**
 * RPCError represents a generic non-internal error.
 *
 * Receivers of any ResponseMessage are expected to check whether its error field is not null.
 */
export interface RPCError {
  message: string;
}

export interface RpcBlock {
  header: RpcBlockHeader | undefined;
  transactions: RpcTransaction[];
  verboseData: RpcBlockVerboseData | undefined;
}

export interface RpcBlockHeader {
  version: number;
  parents: RpcBlockLevelParents[];
  hashMerkleRoot: string;
  acceptedIdMerkleRoot: string;
  utxoCommitment: string;
  timestamp: number;
  bits: number;
  nonce: number;
  daaScore: number;
  blueWork: string;
  pruningPoint: string;
  blueScore: number;
}

export interface RpcBlockLevelParents {
  parentHashes: string[];
}

export interface RpcBlockVerboseData {
  hash: string;
  difficulty: number;
  selectedParentHash: string;
  transactionIds: string[];
  isHeaderOnly: boolean;
  blueScore: number;
  childrenHashes: string[];
  mergeSetBluesHashes: string[];
  mergeSetRedsHashes: string[];
  isChainBlock: boolean;
}

export interface RpcTransaction {
  version: number;
  inputs: RpcTransactionInput[];
  outputs: RpcTransactionOutput[];
  lockTime: number;
  subnetworkId: string;
  gas: number;
  payload: string;
  verboseData: RpcTransactionVerboseData | undefined;
  mass: number;
}

export interface RpcTransactionInput {
  previousOutpoint: RpcOutpoint | undefined;
  signatureScript: string;
  sequence: number;
  sigOpCount: number;
  verboseData: RpcTransactionInputVerboseData | undefined;
}

export interface RpcScriptPublicKey {
  version: number;
  scriptPublicKey: string;
}

export interface RpcTransactionOutput {
  amount: number;
  scriptPublicKey: RpcScriptPublicKey | undefined;
  verboseData: RpcTransactionOutputVerboseData | undefined;
}

export interface RpcOutpoint {
  transactionId: string;
  index: number;
}

export interface RpcUtxoEntry {
  amount: number;
  scriptPublicKey: string;
  blockDaaScore: number;
  isCoinbase: boolean;
}

export interface RpcTransactionVerboseData {
  transactionId: string;
  hash: string;
  computeMass: number;
  blockHash: string;
  blockTime: number;
}

export interface RpcTransactionInputVerboseData {}

export interface RpcTransactionOutputVerboseData {
  scriptPublicKeyType: string;
  scriptPublicKeyAddress: string;
}

/**
 * GetCurrentNetworkRequestMessage requests the network kaspad is currently running against.
 *
 * Possible networks are: Mainnet, Testnet, Simnet, Devnet
 */
export interface GetCurrentNetworkRequestMessage {}

export interface GetCurrentNetworkResponseMessage {
  currentNetwork: string;
  error: RPCError | undefined;
}

/**
 * SubmitBlockRequestMessage requests to submit a block into the DAG.
 * Blocks are generally expected to have been generated using the getBlockTemplate call.
 *
 * See: GetBlockTemplateRequestMessage
 */
export interface SubmitBlockRequestMessage {
  block: RpcBlock | undefined;
  allowNonDAABlocks: boolean;
}

export interface SubmitBlockResponseMessage {
  rejectReason: SubmitBlockResponseMessage_RejectReason;
  error: RPCError | undefined;
}

export enum SubmitBlockResponseMessage_RejectReason {
  NONE = 0,
  BLOCK_INVALID = 1,
  IS_IN_IBD = 2,
  UNRECOGNIZED = -1
}

/**
 * GetBlockTemplateRequestMessage requests a current block template.
 * Callers are expected to solve the block template and submit it using the submitBlock call
 *
 * See: SubmitBlockRequestMessage
 */
export interface GetBlockTemplateRequestMessage {
  /** Which kaspa address should the coinbase block reward transaction pay into */
  payAddress: string;
  extraData: string;
}

export interface GetBlockTemplateResponseMessage {
  block: RpcBlock | undefined;
  /**
   * Whether kaspad thinks that it's synced.
   * Callers are discouraged (but not forbidden) from solving blocks when kaspad is not synced.
   * That is because when kaspad isn't in sync with the rest of the network there's a high
   * chance the block will never be accepted, thus the solving effort would have been wasted.
   */
  isSynced: boolean;
  error: RPCError | undefined;
}

/**
 * NotifyBlockAddedRequestMessage registers this connection for blockAdded notifications.
 *
 * See: BlockAddedNotificationMessage
 */
export interface NotifyBlockAddedRequestMessage {}

export interface NotifyBlockAddedResponseMessage {
  error: RPCError | undefined;
}

/**
 * BlockAddedNotificationMessage is sent whenever a blocks has been added (NOT accepted)
 * into the DAG.
 *
 * See: NotifyBlockAddedRequestMessage
 */
export interface BlockAddedNotificationMessage {
  block: RpcBlock | undefined;
}

/**
 * GetPeerAddressesRequestMessage requests the list of known kaspad addresses in the
 * current network. (mainnet, testnet, etc.)
 */
export interface GetPeerAddressesRequestMessage {}

export interface GetPeerAddressesResponseMessage {
  addresses: GetPeerAddressesKnownAddressMessage[];
  bannedAddresses: GetPeerAddressesKnownAddressMessage[];
  error: RPCError | undefined;
}

export interface GetPeerAddressesKnownAddressMessage {
  Addr: string;
}

/**
 * GetSinkRequestMessage requests the hash of the current virtual's
 * selected parent.
 */
export interface GetSinkRequestMessage {}

export interface GetSinkResponseMessage {
  sink: string;
  error: RPCError | undefined;
}

/**
 * GetMempoolEntryRequestMessage requests information about a specific transaction
 * in the mempool.
 */
export interface GetMempoolEntryRequestMessage {
  /** The transaction's TransactionID. */
  transactionId: string;
  includeOrphanPool?: boolean;
  filterTransactionPool?: boolean;
}

export interface GetMempoolEntryResponseMessage {
  entry: RpcMempoolEntry | undefined;
  error: RPCError | undefined;
}

/**
 * GetMempoolEntriesRequestMessage requests information about all the transactions
 * currently in the mempool.
 */
export interface GetMempoolEntriesRequestMessage {
  includeOrphanPool: boolean;
  filterTransactionPool: boolean;
}

export interface GetMempoolEntriesResponseMessage {
  entries: RpcMempoolEntry[];
  error: RPCError | undefined;
}

export interface RpcMempoolEntry {
  fee: number;
  transaction: RpcTransaction | undefined;
  isOrphan: boolean;
}

/**
 * GetConnectedPeerInfoRequestMessage requests information about all the p2p peers
 * currently connected to this kaspad.
 */
export interface GetConnectedPeerInfoRequestMessage {}

export interface GetConnectedPeerInfoResponseMessage {
  infos: GetConnectedPeerInfoMessage[];
  error: RPCError | undefined;
}

export interface GetConnectedPeerInfoMessage {
  id: string;
  address: string;
  /** How long did the last ping/pong exchange take */
  lastPingDuration: number;
  /** Whether this kaspad initiated the connection */
  isOutbound: boolean;
  timeOffset: number;
  userAgent: string;
  /** The protocol version that this peer claims to support */
  advertisedProtocolVersion: number;
  /** The timestamp of when this peer connected to this kaspad */
  timeConnected: number;
  /** Whether this peer is the IBD peer (if IBD is running) */
  isIbdPeer: boolean;
}

/**
 * AddPeerRequestMessage adds a peer to kaspad's outgoing connection list.
 * This will, in most cases, result in kaspad connecting to said peer.
 */
export interface AddPeerRequestMessage {
  peerAddress: string;
  /** Whether to keep attempting to connect to this peer after disconnection */
  isPermanent: boolean;
}

export interface AddPeerResponseMessage {
  error: RPCError | undefined;
}

/** SubmitTransactionRequestMessage submits a transaction to the mempool */
export interface SubmitTransactionRequestMessage {
  transaction: RpcTransaction | undefined;
  allowOrphan?: boolean;
}

export interface SubmitTransactionResponseMessage {
  /** The transaction ID of the submitted transaction */
  transactionId: string;
  error: RPCError | undefined;
}

/** SubmitTransactionReplacementRequestMessage submits a transaction to the mempool, applying a mandatory Replace by Fee policy */
export interface SubmitTransactionReplacementRequestMessage {
  transaction: RpcTransaction | undefined;
}

export interface SubmitTransactionReplacementResponseMessage {
  /** The transaction ID of the submitted transaction */
  transactionId: string;
  /** The previous transaction replaced in the mempool by the newly submitted one */
  replacedTransaction: RpcTransaction | undefined;
  error: RPCError | undefined;
}

/**
 * NotifyVirtualChainChangedRequestMessage registers this connection for virtualChainChanged notifications.
 *
 * See: VirtualChainChangedNotificationMessage
 */
export interface NotifyVirtualChainChangedRequestMessage {
  include_accepted_transaction_ids: boolean;
}

export interface NotifyVirtualChainChangedResponseMessage {
  error: RPCError | undefined;
}

/**
 * VirtualChainChangedNotificationMessage is sent whenever the DAG's selected parent
 * chain had changed.
 *
 * See: NotifyVirtualChainChangedRequestMessage
 */
export interface VirtualChainChangedNotificationMessage {
  /** The chain blocks that were removed, in high-to-low order */
  removedChainBlockHashes: string[];
  /** The chain blocks that were added, in low-to-high order */
  addedChainBlockHashes: string[];
  /** Will be filled only if `includeAcceptedTransactionIds = true` in the notify request. */
  acceptedTransactionIds: RpcAcceptedTransactionIds[];
}

/** GetBlockRequestMessage requests information about a specific block */
export interface GetBlockRequestMessage {
  /** The hash of the requested block */
  hash: string;
  /** Whether to include transaction data in the response */
  includeTransactions: boolean;
}

export interface GetBlockResponseMessage {
  block: RpcBlock | undefined;
  error: RPCError | undefined;
}

/**
 * GetSubnetworkRequestMessage requests information about a specific subnetwork
 *
 * Currently unimplemented
 */
export interface GetSubnetworkRequestMessage {
  subnetworkId: string;
}

export interface GetSubnetworkResponseMessage {
  gasLimit: number;
  error: RPCError | undefined;
}

/**
 * / GetVirtualChainFromBlockRequestMessage requests the virtual selected
 * / parent chain from some startHash to this kaspad's current virtual
 * / Note:
 * /     this call batches the response to:
 * /         a. the network's `mergeset size limit * 10` amount of added chain blocks, if `includeAcceptedTransactionIds = false`
 * /         b. or `mergeset size limit * 10` amount of merged blocks, if `includeAcceptedTransactionIds = true`
 * /         c. it does not batch the removed chain blocks, only the added ones.
 */
export interface GetVirtualChainFromBlockRequestMessage {
  startHash: string;
  includeAcceptedTransactionIds: boolean;
}

export interface RpcAcceptedTransactionIds {
  acceptingBlockHash: string;
  acceptedTransactionIds: string[];
}

export interface GetVirtualChainFromBlockResponseMessage {
  /** The chain blocks that were removed, in high-to-low order */
  removedChainBlockHashes: string[];
  /** The chain blocks that were added, in low-to-high order */
  addedChainBlockHashes: string[];
  /**
   * The transactions accepted by each block in addedChainBlockHashes.
   * Will be filled only if `includeAcceptedTransactionIds = true` in the request.
   */
  acceptedTransactionIds: RpcAcceptedTransactionIds[];
  error: RPCError | undefined;
}

/**
 * GetBlocksRequestMessage requests blocks between a certain block lowHash up to this
 * kaspad's current virtual.
 */
export interface GetBlocksRequestMessage {
  lowHash: string;
  includeBlocks: boolean;
  includeTransactions: boolean;
}

export interface GetBlocksResponseMessage {
  blockHashes: string[];
  blocks: RpcBlock[];
  error: RPCError | undefined;
}

/**
 * GetBlockCountRequestMessage requests the current number of blocks in this kaspad.
 * Note that this number may decrease as pruning occurs.
 */
export interface GetBlockCountRequestMessage {}

export interface GetBlockCountResponseMessage {
  blockCount: number;
  headerCount: number;
  error: RPCError | undefined;
}

/**
 * GetBlockDagInfoRequestMessage requests general information about the current state
 * of this kaspad's DAG.
 */
export interface GetBlockDagInfoRequestMessage {}

export interface GetBlockDagInfoResponseMessage {
  networkName: string;
  blockCount: number;
  headerCount: number;
  tipHashes: string[];
  difficulty: number;
  pastMedianTime: number;
  virtualParentHashes: string[];
  pruningPointHash: string;
  virtualDaaScore: number;
  sink: string;
  error: RPCError | undefined;
}

export interface ResolveFinalityConflictRequestMessage {
  finalityBlockHash: string;
}

export interface ResolveFinalityConflictResponseMessage {
  error: RPCError | undefined;
}

export interface NotifyFinalityConflictRequestMessage {}

export interface NotifyFinalityConflictResponseMessage {
  error: RPCError | undefined;
}

export interface FinalityConflictNotificationMessage {
  violatingBlockHash: string;
}

export interface FinalityConflictResolvedNotificationMessage {
  finalityBlockHash: string;
}

/** ShutdownRequestMessage shuts down this kaspad. */
export interface ShutdownRequestMessage {}

export interface ShutdownResponseMessage {
  error: RPCError | undefined;
}

/**
 * GetHeadersRequestMessage requests headers between the given startHash and the
 * current virtual, up to the given limit.
 */
export interface GetHeadersRequestMessage {
  startHash: string;
  limit: number;
  isAscending: boolean;
}

export interface GetHeadersResponseMessage {
  headers: string[];
  error: RPCError | undefined;
}

/**
 * NotifyUtxosChangedRequestMessage registers this connection for utxoChanged notifications
 * for the given addresses.
 *
 * This call is only available when this kaspad was started with `--utxoindex`
 *
 * See: UtxosChangedNotificationMessage
 */
export interface NotifyUtxosChangedRequestMessage {
  /**
   * UTXOs addresses to start/stop getting notified about
   * Leave empty to start/stop all updates
   */
  addresses: string[];
}

export interface NotifyUtxosChangedResponseMessage {
  error: RPCError | undefined;
}

/**
 * UtxosChangedNotificationMessage is sent whenever the UTXO index had been updated.
 *
 * See: NotifyUtxosChangedRequestMessage
 */
export interface UtxosChangedNotificationMessage {
  added: RpcUtxosByAddressesEntry[];
  removed: RpcUtxosByAddressesEntry[];
}

export interface RpcUtxosByAddressesEntry {
  address: string;
  outpoint: RpcOutpoint | undefined;
  utxoEntry: RpcUtxoEntry | undefined;
}

/**
 * StopNotifyingUtxosChangedRequestMessage unregisters this connection for utxoChanged notifications
 * for the given addresses.
 *
 * This call is only available when this kaspad was started with `--utxoindex`
 *
 * See: UtxosChangedNotificationMessage
 *
 * This message only exists for backward compatibility reason with kaspad and is deprecated.
 * Use instead UtxosChangedNotificationMessage with command = NOTIFY_STOP.
 */
export interface StopNotifyingUtxosChangedRequestMessage {
  addresses: string[];
}

export interface StopNotifyingUtxosChangedResponseMessage {
  error: RPCError | undefined;
}

/**
 * GetUtxosByAddressesRequestMessage requests all current UTXOs for the given kaspad addresses
 *
 * This call is only available when this kaspad was started with `--utxoindex`
 */
export interface GetUtxosByAddressesRequestMessage {
  addresses: string[];
}

export interface GetUtxosByAddressesResponseMessage {
  entries: RpcUtxosByAddressesEntry[];
  error: RPCError | undefined;
}

/**
 * GetBalanceByAddressRequest returns the total balance in unspent transactions towards a given address
 *
 * This call is only available when this kaspad was started with `--utxoindex`
 */
export interface GetBalanceByAddressRequestMessage {
  address: string;
}

export interface GetBalanceByAddressResponseMessage {
  balance: number;
  error: RPCError | undefined;
}

export interface GetBalancesByAddressesRequestMessage {
  addresses: string[];
}

export interface RpcBalancesByAddressesEntry {
  address: string;
  balance: number;
  error: RPCError | undefined;
}

export interface GetBalancesByAddressesResponseMessage {
  entries: RpcBalancesByAddressesEntry[];
  error: RPCError | undefined;
}

/**
 * GetSinkBlueScoreRequestMessage requests the blue score of the current selected parent
 * of the virtual block.
 */
export interface GetSinkBlueScoreRequestMessage {}

export interface GetSinkBlueScoreResponseMessage {
  blueScore: number;
  error: RPCError | undefined;
}

/**
 * NotifySinkBlueScoreChangedRequestMessage registers this connection for
 * sinkBlueScoreChanged notifications.
 *
 * See: SinkBlueScoreChangedNotificationMessage
 */
export interface NotifySinkBlueScoreChangedRequestMessage {}

export interface NotifySinkBlueScoreChangedResponseMessage {
  error: RPCError | undefined;
}

/**
 * SinkBlueScoreChangedNotificationMessage is sent whenever the blue score
 * of the virtual's selected parent changes.
 *
 * See NotifySinkBlueScoreChangedRequestMessage
 */
export interface SinkBlueScoreChangedNotificationMessage {
  sinkBlueScore: number;
}

/**
 * NotifyVirtualDaaScoreChangedRequestMessage registers this connection for
 * virtualDaaScoreChanged notifications.
 *
 * See: VirtualDaaScoreChangedNotificationMessage
 */
export interface NotifyVirtualDaaScoreChangedRequestMessage {}

export interface NotifyVirtualDaaScoreChangedResponseMessage {
  error: RPCError | undefined;
}

/**
 * VirtualDaaScoreChangedNotificationMessage is sent whenever the DAA score
 * of the virtual changes.
 *
 * See NotifyVirtualDaaScoreChangedRequestMessage
 */
export interface VirtualDaaScoreChangedNotificationMessage {
  virtualDaaScore: number;
}

/**
 * NotifyPruningPointUtxoSetOverrideRequestMessage registers this connection for
 * pruning point UTXO set override notifications.
 *
 * This call is only available when this kaspad was started with `--utxoindex`
 *
 * See: NotifyPruningPointUtxoSetOverrideResponseMessage
 */
export interface NotifyPruningPointUtxoSetOverrideRequestMessage {}

export interface NotifyPruningPointUtxoSetOverrideResponseMessage {
  error: RPCError | undefined;
}

/**
 * PruningPointUtxoSetOverrideNotificationMessage is sent whenever the UTXO index
 * resets due to pruning point change via IBD.
 *
 * See NotifyPruningPointUtxoSetOverrideRequestMessage
 */
export interface PruningPointUtxoSetOverrideNotificationMessage {}

/**
 * StopNotifyingPruningPointUtxoSetOverrideRequestMessage unregisters this connection for
 * pruning point UTXO set override notifications.
 *
 * This call is only available when this kaspad was started with `--utxoindex`
 *
 * See: PruningPointUtxoSetOverrideNotificationMessage
 *
 * This message only exists for backward compatibility reason with kaspad and is deprecated.
 * Use instead NotifyPruningPointUtxoSetOverrideRequestMessage with command = NOTIFY_STOP.
 */
export interface StopNotifyingPruningPointUtxoSetOverrideRequestMessage {}

export interface StopNotifyingPruningPointUtxoSetOverrideResponseMessage {
  error: RPCError | undefined;
}

/** BanRequestMessage bans the given ip. */
export interface BanRequestMessage {
  ip: string;
}

export interface BanResponseMessage {
  error: RPCError | undefined;
}

/** UnbanRequestMessage unbans the given ip. */
export interface UnbanRequestMessage {
  ip: string;
}

export interface UnbanResponseMessage {
  error: RPCError | undefined;
}

/** GetInfoRequestMessage returns info about the node. */
export interface GetInfoRequestMessage {}

export interface GetInfoResponseMessage {
  p2pId: string;
  mempoolSize: number;
  serverVersion: string;
  isUtxoIndexed: boolean;
  isSynced: boolean;
  hasNotifyCommand: boolean;
  hasMessageId: boolean;
  error: RPCError | undefined;
}

export interface EstimateNetworkHashesPerSecondRequestMessage {
  windowSize: number;
  startHash: string;
}

export interface EstimateNetworkHashesPerSecondResponseMessage {
  networkHashesPerSecond: number;
  error: RPCError | undefined;
}

/**
 * NotifyNewBlockTemplateRequestMessage registers this connection for
 * NewBlockTemplate notifications.
 *
 * See: NewBlockTemplateNotificationMessage
 */
export interface NotifyNewBlockTemplateRequestMessage {}

export interface NotifyNewBlockTemplateResponseMessage {
  error: RPCError | undefined;
}

/**
 * NewBlockTemplateNotificationMessage is sent whenever a new updated block template is
 * available for miners.
 *
 * See NotifyNewBlockTemplateRequestMessage
 */
export interface NewBlockTemplateNotificationMessage {}

export interface RpcMempoolEntryByAddress {
  address: string;
  sending: RpcMempoolEntry[];
  receiving: RpcMempoolEntry[];
}

export interface GetMempoolEntriesByAddressesRequestMessage {
  addresses: string[];
  includeOrphanPool: boolean;
  filterTransactionPool: boolean;
}

export interface GetMempoolEntriesByAddressesResponseMessage {
  entries: RpcMempoolEntryByAddress[];
  error: RPCError | undefined;
}

export interface GetCoinSupplyRequestMessage {}

export interface GetCoinSupplyResponseMessage {
  /** note: this is a hard coded maxSupply, actual maxSupply is expected to deviate by upto -5%, but cannot be measured exactly. */
  maxSompi: number;
  circulatingSompi: number;
  error: RPCError | undefined;
}

export interface PingRequestMessage {}

export interface PingResponseMessage {
  error: RPCError | undefined;
}

export interface ProcessMetrics {
  residentSetSize: number;
  virtualMemorySize: number;
  coreNum: number;
  cpuUsage: number;
  fdNum: number;
  diskIoReadBytes: number;
  diskIoWriteBytes: number;
  diskIoReadPerSec: number;
  diskIoWritePerSec: number;
}

export interface ConnectionMetrics {
  borshLiveConnections: number;
  borshConnectionAttempts: number;
  borshHandshakeFailures: number;
  jsonLiveConnections: number;
  jsonConnectionAttempts: number;
  jsonHandshakeFailures: number;
  activePeers: number;
}

export interface BandwidthMetrics {
  borshBytesTx: number;
  borshBytesRx: number;
  jsonBytesTx: number;
  jsonBytesRx: number;
  grpcP2pBytesTx: number;
  grpcP2pBytesRx: number;
  grpcUserBytesTx: number;
  grpcUserBytesRx: number;
}

export interface ConsensusMetrics {
  blocksSubmitted: number;
  headerCounts: number;
  depCounts: number;
  bodyCounts: number;
  txsCounts: number;
  chainBlockCounts: number;
  massCounts: number;
  blockCount: number;
  headerCount: number;
  mempoolSize: number;
  tipHashesCount: number;
  difficulty: number;
  pastMedianTime: number;
  virtualParentHashesCount: number;
  virtualDaaScore: number;
}

export interface StorageMetrics {
  storageSizeBytes: number;
}

export interface GetConnectionsRequestMessage {
  includeProfileData: boolean;
}

export interface ConnectionsProfileData {
  cpuUsage: number;
  memoryUsage: number;
}

export interface GetConnectionsResponseMessage {
  clients: number;
  peers: number;
  profileData: ConnectionsProfileData | undefined;
  error: RPCError | undefined;
}

export interface GetSystemInfoRequestMessage {}

export interface GetSystemInfoResponseMessage {
  version: string;
  systemId: string;
  gitHash: string;
  coreNum: number;
  totalMemory: number;
  fdLimit: number;
  proxySocketLimitPerCpuCore: number;
  error: RPCError | undefined;
}

export interface GetMetricsRequestMessage {
  processMetrics: boolean;
  connectionMetrics: boolean;
  bandwidthMetrics: boolean;
  consensusMetrics: boolean;
  storageMetrics: boolean;
  customMetrics: boolean;
}

export interface GetMetricsResponseMessage {
  serverTime: number;
  processMetrics: ProcessMetrics | undefined;
  connectionMetrics: ConnectionMetrics | undefined;
  bandwidthMetrics: BandwidthMetrics | undefined;
  consensusMetrics: ConsensusMetrics | undefined;
  storageMetrics: StorageMetrics | undefined;
  error: RPCError | undefined;
}

export interface GetServerInfoRequestMessage {}

export interface GetServerInfoResponseMessage {
  rpcApiVersion: number;
  rpcApiRevision: number;
  serverVersion: string;
  networkId: string;
  hasUtxoIndex: boolean;
  isSynced: boolean;
  virtualDaaScore: number;
  error: RPCError | undefined;
}

export interface GetSyncStatusRequestMessage {}

export interface GetSyncStatusResponseMessage {
  isSynced: boolean;
  error: RPCError | undefined;
}

export interface GetDaaScoreTimestampEstimateRequestMessage {
  daaScores: number[];
}

export interface GetDaaScoreTimestampEstimateResponseMessage {
  timestamps: number[];
  error: RPCError | undefined;
}

export interface RpcFeerateBucket {
  /** Fee/mass of a transaction in `sompi/gram` units */
  feerate: number;
  estimatedSeconds: number;
}

/**
 * Data required for making fee estimates.
 *
 * Feerate values represent fee/mass of a transaction in `sompi/gram` units.
 * Given a feerate value recommendation, calculate the required fee by
 * taking the transaction mass and multiplying it by feerate: `fee = feerate * mass(tx)`
 */
export interface RpcFeeEstimate {
  /** Top-priority feerate bucket. Provides an estimation of the feerate required for sub-second DAG inclusion. */
  priorityBucket: RpcFeerateBucket | undefined;
  /**
   * A vector of *normal* priority feerate values. The first value of this vector is guaranteed to exist and
   * provide an estimation for sub-*minute* DAG inclusion. All other values will have shorter estimation
   * times than all `lowBucket` values. Therefor by chaining `[priority] | normal | low` and interpolating
   * between them, one can compose a complete feerate function on the client side. The API makes an effort
   * to sample enough "interesting" points on the feerate-to-time curve, so that the interpolation is meaningful.
   */
  normalBuckets: RpcFeerateBucket[];
  /**
   * A vector of *low* priority feerate values. The first value of this vector is guaranteed to
   * exist and provide an estimation for sub-*hour* DAG inclusion.
   */
  lowBuckets: RpcFeerateBucket[];
}

export interface RpcFeeEstimateVerboseExperimentalData {
  mempoolReadyTransactionsCount: number;
  mempoolReadyTransactionsTotalMass: number;
  networkMassPerSecond: number;
  nextBlockTemplateFeerateMin: number;
  nextBlockTemplateFeerateMedian: number;
  nextBlockTemplateFeerateMax: number;
}

export interface GetFeeEstimateRequestMessage {}

export interface GetFeeEstimateResponseMessage {
  estimate: RpcFeeEstimate | undefined;
  error: RPCError | undefined;
}

export interface GetFeeEstimateExperimentalRequestMessage {
  verbose: boolean;
}

export interface GetFeeEstimateExperimentalResponseMessage {
  estimate: RpcFeeEstimate | undefined;
  verbose: RpcFeeEstimateVerboseExperimentalData | undefined;
  error: RPCError | undefined;
}

export interface GetCurrentBlockColorRequestMessage {
  hash: string;
}

export interface GetCurrentBlockColorResponseMessage {
  blue: boolean;
  error: RPCError | undefined;
}

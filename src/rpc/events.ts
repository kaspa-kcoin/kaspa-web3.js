import {
  BlockAddedNotificationMessage,
  FinalityConflictNotificationMessage,
  NewBlockTemplateNotificationMessage,
  PruningPointUtxoSetOverrideNotificationMessage,
  SinkBlueScoreChangedNotificationMessage,
  UtxosChangedNotificationMessage,
  VirtualChainChangedNotificationMessage,
  VirtualDaaScoreChangedNotificationMessage
} from './types';
import { RpcClient } from './rpc-client.ts';

/**
 * RPC subscription topics.
 */
export enum RpcTopic {
  BlockAdded = 'BlockAdded',
  VirtualChainChanged = 'VirtualChainChanged',
  FinalityConflict = 'FinalityConflict',
  UtxosChanged = 'UtxosChanged',
  SinkBlueScoreChanged = 'SinkBlueScoreChanged',
  VirtualDaaScoreChanged = 'VirtualDaaScoreChanged',
  PruningPointUtxoSetOverride = 'PruningPointUtxoSetOverride',
  NewBlockTemplate = 'NewBlockTemplate'
}

/**
 * RPC notification events.
 *
 * @see {RpcClient.addEventListener}, {RpcClient.removeEventListener}
 */
export enum RpcEventType {
  Connect = 'connect',
  Disconnect = 'disconnect',
  BlockAdded = 'block-added',
  VirtualChainChanged = 'virtual-chain-changed',
  FinalityConflict = 'finality-conflict',
  FinalityConflictResolved = 'finality-conflict-resolved',
  UtxosChanged = 'utxos-changed',
  SinkBlueScoreChanged = 'sink-blue-score-changed',
  VirtualDaaScoreChanged = 'virtual-daa-score-changed',
  PruningPointUtxoSetOverride = 'pruning-point-utxo-set-override',
  NewBlockTemplate = 'new-block-template'
}

export type RpcEventMap = {
  connect: undefined;
  disconnect: undefined;
  'block-added': BlockAddedNotificationMessage;
  'virtual-chain-changed': VirtualChainChangedNotificationMessage;
  'finality-conflict': FinalityConflictNotificationMessage;
  'finality-conflict-resolved': FinalityConflictNotificationMessage;
  'utxos-changed': UtxosChangedNotificationMessage;
  'sink-blue-score-changed': SinkBlueScoreChangedNotificationMessage;
  'virtual-daa-score-changed': VirtualDaaScoreChangedNotificationMessage;
  'pruning-point-utxo-set-override': PruningPointUtxoSetOverrideNotificationMessage;
  'new-block-template': NewBlockTemplateNotificationMessage;
};

/**
 * RPC notification event.
 *
 * @category Node RPC
 */
export type RpcEvent = {
  [K in keyof RpcEventMap]: { event: K; data: RpcEventMap[K] };
}[keyof RpcEventMap];

/**
 * RPC notification callback type.
 *
 * This type is used to define the callback function that is called when an RPC notification is received.
 *
 * @see {@link RpcClient.subscribeVirtualDaaScoreChanged},
 * {@link RpcClient.subscribeUtxosChanged},
 * {@link RpcClient.subscribeVirtualChainChanged},
 * {@link RpcClient.subscribeBlockAdded},
 * {@link RpcClient.subscribeFinalityConflict},
 * {@link RpcClient.subscribeSinkBlueScoreChanged},
 * {@link RpcClient.subscribePruningPointUtxoSetOverride},
 * {@link RpcClient.subscribeNewBlockTemplate},
 *
 * @category Node RPC
 */
export type RpcEventCallback = (event: RpcEvent) => void;

export interface RpcEventObservable {
  /**
   * Adds an event listener for all RPC events.
   *
   * @param {RpcEventCallback} callback - The callback function to be called when an RPC event is received.
   */
  addEventListener(callback: RpcEventCallback): void;

  /**
   * Adds an event listener for a specific RPC event.
   *
   * @param {RpcEventType} event - The type of the RPC event to listen for.
   * @param {RpcEventCallback} callback - The callback function to be called when the specified RPC event is received.
   */
  addEventListener<M extends keyof RpcEventMap>(event: M, callback: (eventData: RpcEventMap[M]) => void): void;

  /**
   *
   * Unregister an event listener.
   * This function will remove the callback for the specified event.
   * If the `callback` is not supplied, all callbacks will be
   * removed for the specified event.
   *
   * @see {@link RpcClient.addEventListener}
   * @param {RpcEventType | string} event
   * @param {RpcEventCallback | undefined} [callback]
   */
  removeEventListener(event: RpcEventType | string, callback?: RpcEventCallback): void;
  /**
   *
   * Unregister a single event listener callback from all events.
   *
   *
   * @param {RpcEventCallback} callback
   */
  clearEventListener(callback: RpcEventCallback): void;
  /**
   *
   * Unregister all notification callbacks for all events.
   */
  removeAllEventListeners(): void;
}

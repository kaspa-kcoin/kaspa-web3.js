/**
 * Indicates the type of data yielded by the generator.
 *
 * @category Wallet SDK
 */
enum DataKind {
  /**
   * No operation should be performed (abort).
   * Used for handling exceptions, such as rejecting
   * to produce dust outputs during sweep transactions.
   */
  NoOp,

  /**
   * A "tree node" or "relay" transaction meant for multi-stage
   * operations. This transaction combines multiple UTXOs
   * into a single transaction to the supplied change address.
   */
  Node,

  /**
   * A "tree edge" transaction meant for multi-stage
   * processing. Signifies completion of the tree level (stage).
   * This operation will create a new tree level (stage).
   */
  Edge,

  /**
   * Final transaction combining the entire aggregated UTXO set
   * into a single set of supplied outputs.
   */
  Final
}

class DataKindHelper {
  static isFinal(kind: DataKind): boolean {
    return kind === DataKind.Final;
  }

  static isStageNode(kind: DataKind): boolean {
    return kind === DataKind.Node;
  }

  static isStageEdge(kind: DataKind): boolean {
    return kind === DataKind.Edge;
  }
}

export { DataKind, DataKindHelper };

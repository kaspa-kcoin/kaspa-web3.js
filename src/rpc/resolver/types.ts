/**
 * Interface representing a node descriptor.
 */
interface INodeDescriptor {
  /**
   * The unique identifier of the node.
   */
  uid: string;

  /**
   * The URL of the node WebSocket (wRPC URL).
   */
  url: string;
}

/**
 * Interface representing a resolver record.
 */
interface IResolverRecord {
  /**
   * The address of the resolver.
   */
  address: string;

  /**
   * Optional flag to enable the resolver.
   */
  enable?: boolean;
}

/**
 * Interface representing a resolver group.
 */
interface IResolverGroup {
  /**
   * The template of the resolver group.
   */
  template: string;

  /**
   * The list of node identifiers in the group.
   */
  nodes: string[];

  /**
   * Optional flag to enable the resolver group.
   */
  enable?: boolean;
}

/**
 * Interface representing the resolver configuration.
 */
interface IResolverConfig {
  /**
   * The list of resolver groups.
   */
  group: IResolverGroup[];

  /**
   * The list of resolver records.
   */
  resolver: IResolverRecord[];
}

export type { INodeDescriptor, IResolverRecord, IResolverGroup, IResolverConfig };

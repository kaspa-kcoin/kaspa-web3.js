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

interface IResolverRecord {
  address: string;
  enable?: boolean;
}

interface IResolverGroup {
  template: string;
  nodes: string[];
  enable?: boolean;
}

interface IResolverConfig {
  group: IResolverGroup[];
  resolver: IResolverRecord[];
}

export type { INodeDescriptor, IResolverRecord, IResolverGroup, IResolverConfig };

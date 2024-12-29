export type JsonRpcRequest<T> = {
  id?: number;
  method: string;
  params: T;
};

export type JsonRpcResponse<T> = {
  id?: number;
  method: string;
  params: T;
  error?: {
    code: number;
    message: string;
    data: any;
  };
};

export * from './rpc';
export type * from './rpc';

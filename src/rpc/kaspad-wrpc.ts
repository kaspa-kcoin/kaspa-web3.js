import {
  GetBalanceByAddressRequestMessage,
  GetBalanceByAddressResponseMessage,
  GetFeeEstimateRequestMessage,
  GetFeeEstimateResponseMessage,
  GetUtxosByAddressesRequestMessage,
  GetUtxosByAddressesResponseMessage,
  RpcFeeEstimate,
  RpcUtxosByAddressesEntry,
  SubmitTransactionRequestMessage,
  SubmitTransactionResponseMessage
} from './compiled_proto/rpc';
import { WrpcJsonRequest, WrpcJsonResponse } from './types';
import WebsocketHeartbeatJs from 'websocket-heartbeat-js';
import { JsonResolver, NetworkId } from '../';

class BridgePromise<T> {
  public resolve: (value: T) => void = () => {
  };
  public reject: (reason?: any) => void = () => {
  };
  public promise: Promise<T>;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

export class KaspadWrpcClient {
  public readonly network: NetworkId;

  private client?: WebsocketHeartbeatJs;
  private readonly resolver?: JsonResolver;
  private readonly endpoint?: string;
  private readonly fallbackEndpoint?: string;
  private connectedPromise: BridgePromise<boolean>;
  private idAutoIncrement = 1;
  private requestPromiseMap: Map<number, BridgePromise<any>> = new Map();

  constructor(network: NetworkId, endpointOrResolver: string | JsonResolver) {
    console.debug('network', network.toString());
    switch (network.toString()) {
      case 'mainnet':
        this.fallbackEndpoint = import.meta.env.VITE_KASPA_MAINNET_WRPC_ENDPOINT;
        break;
      case 'testnet-10':
        this.fallbackEndpoint = import.meta.env.VITE_KASPA_TESTNET_10_WRPC_ENDPOINT;
        break;
      case 'testnet-11':
        this.fallbackEndpoint = import.meta.env.VITE_KASPA_TESTNET_11_WRPC_ENDPOINT;
        break;
    }

    this.endpoint = typeof endpointOrResolver === 'string' ? endpointOrResolver : undefined;
    if (typeof endpointOrResolver === 'string') {
      this.endpoint = endpointOrResolver;
    } else if (endpointOrResolver instanceof JsonResolver) {
      this.resolver = endpointOrResolver;
    } else {
      throw new Error('Invalid endpointOrResolver: must be a string or JsonResolver');
    }
    this.network = network;
    this.connectedPromise = new BridgePromise<boolean>();
  }

  connect = async () => {
    let endpoint = this.endpoint;

    if (endpoint === undefined) {
      try {
        if (!this.resolver) {
          throw new Error('No valid resolver or endpoint provided. Cannot establish connection.');
        }
        endpoint = await this.resolver.getJsonUrl(this.network);
      } catch {
        if (this.fallbackEndpoint === undefined) {
          throw new Error('No endpoint provided');
        }
        endpoint = this.fallbackEndpoint;
      }
    }

    this.client = new WebsocketHeartbeatJs({
      url: endpoint!,
      pingMsg: JSON.stringify(this.buildRequest('ping', {}))
    });
    this.client.onopen = (event) => {
      console.log('Connection opened: ', event);
      this.connectedPromise?.resolve(true);
    };

    // Listen for messages
    this.client.onmessage = (event) => {
      console.debug('Received message: ', event);
      const res = JSON.parse(event.data) as WrpcJsonResponse<any>;
      if (res.id) {
        const bridgePromise = this.requestPromiseMap.get(res.id);
        if (bridgePromise) {
          if (res.error) {
            bridgePromise.reject(res.error);
          } else {
            bridgePromise.resolve(res.params);
          }
          this.requestPromiseMap.delete(res.id);
        }
      }
    };
    // Connection closed
    this.client.onclose = (event) => {
      console.log('Connection closed: ', event);
      this.idAutoIncrement = 1;
      this.requestPromiseMap.clear();
    };
    // Connection error
    this.client.onerror = (event) => {
      console.error('WebSocket error: ', event);
    };
  };

  dispose = () => {
    this.client?.close();
  };

  getBalanceByAddress = async (address: string): Promise<number> => {
    const res = await this.sendRequest<GetBalanceByAddressRequestMessage, GetBalanceByAddressResponseMessage>(
      'getBalanceByAddress',
      { address }
    );
    console.log('getBalanceByAddress', res);
    return res.balance;
  };

  getUtxosByAddress = async (address: string): Promise<RpcUtxosByAddressesEntry[]> => {
    const res = await this.sendRequest<GetUtxosByAddressesRequestMessage, GetUtxosByAddressesResponseMessage>(
      'getUtxosByAddresses',
      { addresses: [address] }
    );
    return res.entries;
  };

  getFeeEstimate = async (): Promise<RpcFeeEstimate | null> => {
    const res = await this.sendRequest<GetFeeEstimateRequestMessage, GetFeeEstimateResponseMessage>(
      'getFeeEstimate',
      {}
    );
    return res.estimate ?? null;
  };

  submitTransaction = async (input: SubmitTransactionRequestMessage): Promise<SubmitTransactionResponseMessage> => {
    const res = await this.sendRequest<SubmitTransactionRequestMessage, SubmitTransactionResponseMessage>(
      'submitTransaction',
      input
    );
    return res;
  };

  private buildRequest = <T>(method: string, params: T): WrpcJsonRequest<T> => {
    return {
      id: this.idAutoIncrement++,
      method,
      params
    };
  };

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
}

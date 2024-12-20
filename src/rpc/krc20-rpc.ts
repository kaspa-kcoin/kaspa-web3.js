import { HttpRequest } from './http-request';
import {
  GetKrc20AddressTokenListResponse,
  GetKrc20BalanceResponse,
  GetKrc20TokenInfoResponse,
  KaspaKrc20Response,
  KaspaNetwork
} from './types';

export class Krc20RpcClient {
  public readonly network: KaspaNetwork;
  private endpoint: string;
  private httpRequest: HttpRequest;

  constructor(network: KaspaNetwork) {
    this.network = network;
    switch (network) {
      case 'mainnet':
        this.endpoint = import.meta.env.VITE_KASPLEX_MAINNET_ENDPOINT;
        break;
      case 'testnet-10':
        this.endpoint = import.meta.env.VITE_KASPLEX_TESTNET_10_ENDPOINT;
        break;
      case 'testnet-11':
        this.endpoint = import.meta.env.VITE_KASPLEX_TESTNET_11_ENDPOINT;
        break;
    }
    this.httpRequest = new HttpRequest(this.endpoint);
  }

  getKrc20TokenInfo = async (tick: string): Promise<KaspaKrc20Response<GetKrc20TokenInfoResponse>> => {
    return await this.httpRequest.get<KaspaKrc20Response<GetKrc20TokenInfoResponse>>(`/krc20/token/${tick}`);
  };

  getKrc20AddressTokenList = async (address: string): Promise<KaspaKrc20Response<GetKrc20AddressTokenListResponse>> => {
    return await this.httpRequest.get<KaspaKrc20Response<GetKrc20AddressTokenListResponse>>(
      `/krc20/address/${address}/tokenlist`
    );
  };

  getKrc20Balance = async (address: string, tick: string): Promise<KaspaKrc20Response<GetKrc20BalanceResponse>> => {
    return await this.httpRequest.get<KaspaKrc20Response<GetKrc20BalanceResponse>>(
      `/krc20/address/${address}/token/${tick}`
    );
  };
}

export type KaspaNetwork = 'mainnet' | 'testnet-10' | 'testnet-11';

export type KaspaKrc20Response<T> = {
  message: string;
  prev?: string;
  next?: string;
  result: T;
};

export type Krc20TokenHolder = {
  address: string;
  amount: string;
};

export type Krc20TokenDetailsWithHolders = {
  tick: string;
  max: string;
  lim: string;
  pre: string;
  to: string;
  dec: string;
  minted: string;
  opScoreAdd: string;
  opScoreMod: string;
  state: string;
  hashRev: string;
  mtsAdd: string;
  holderTotal: string;
  transferTotal: string;
  mintTotal: string;
  holder: Krc20TokenHolder[];
};

export type GetKrc20TokenInfoResponse = Krc20TokenDetailsWithHolders[];

export type Krc20TokenBalanceInfo = {
  tick: string;
  balance: string;
  locked: string; // 0 or 1
  dec: string;
  opScoreMod: string;
};

export type GetKrc20AddressTokenListResponse = Krc20TokenBalanceInfo[];

export type GetKrc20BalanceResponse = GetKrc20AddressTokenListResponse;

export type WrpcJsonRequest<T> = {
  id?: number;
  method: string;
  params: T;
};

export type WrpcJsonResponse<T> = {
  id?: number;
  method: string;
  params: T;
  error?: {
    code: number;
    message: string;
    data: any;
  };
};

export interface Krc20PagerRequest {
  next?: string;
  prev?: string;
}

export interface Krc20TokenListRequest extends Krc20PagerRequest {
  address?: string;
  tick?: string;
}

export type Krc20Response<T> = {
  message: string;
  prev?: string;
  next?: string;
  result: T | null;
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

export type GetKrc20TokenListResponse = {
  tokens: Krc20TokenDetailsWithHolders[];
};

export type Krc20Operation = {
  operationId: string;
  type: string;
  timestamp: string;
  details: string;
};

export type GetKrc20OperationListResponse = Krc20Operation[];

export type GetKrc20OperationDetailsResponse = {
  operationId: string;
  type: string;
  timestamp: string;
  details: string;
  status: string;
};

export type GetKrc20VspcDetailsResponse = {
  vspcId: string;
  details: string;
  status: string;
};

export type GetKrc20DataByOPrangeResponse = {
  opscore: number;
  addressaffc: string;
  script: string;
  state: string;
  tickaffc: string;
  txid: string;
}[];

export type GetKrc20ListingListResponse = {
  tick: string;
  from: string;
  amount: string;
  uTxid: string;
  uAddr: string;
  uAmt: string;
  uScript: string;
  opScoreAdd: string;
}[];

export function makeQueryString(params: any): string {
  return Object.keys(params)
    .map((key) => `${key}=${encodeURIComponent(params[key].toString())}`)
    .join('&');
}

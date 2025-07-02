export interface Krc721PagerRequest {
  offset?: string;
  limit?: string;
  direction?: 'forward' | 'backward';
}

interface BaseResponse {
  message: string;
  prev?: string;
  next?: string;
}

export type Krc721Response<T> = BaseResponse & {
  result: T | null;
};

// Collection types
export type Krc721Collection = {
  deployer: string;
  buri?: string;
  max: string;
  daaMintStart: string;
  premint: string;
  tick: string;
  txIdRev: string;
  mtsAdd: string;
  minted: string;
  opScoreMod: string;
  state: string;
  mtsMod: string;
  opScoreAdd: string;
  royaltyTo?: string;
  royaltyFee?: string;
};

export type GetKrc721CollectionsResponse = Krc721Collection[];

export type GetKrc721CollectionDetailsResponse = Krc721Collection;

// Token types
export type Krc721Token = {
  tick: string;
  tokenId: string;
  owner: string;
  buri?: string;
};

export type GetKrc721TokenDetailsResponse = Krc721Token;

export type GetKrc721TokenOwnersResponse = {
  tick: string;
  tokenId: string;
  owner: string;
  opScoreMod: string;
}[];

// Address holdings
export type GetKrc721AddressHoldingsResponse = {
  tick: string;
  tokenId: string;
  buri?: string;
}[];

export type GetKrc721AddressCollectionHoldingResponse = {
  tick: string;
  tokenId: string;
  opScoreMod: string;
};

// Operations
export type Krc721Operation = {
  p: string;
  deployer: string;
  op: 'deploy' | 'mint' | 'transfer' | 'discount';
  tick: string;
  opData: Record<string, any>;
  opScore: string;
  txIdRev: string;
  mtsAdd: string;
  opError?: string;
  feeRev: string;
  royaltyTo?: string;
  to?: string;
};

export type GetKrc721OperationsResponse = Krc721Operation[];

export type GetKrc721OperationDetailsResponse = Krc721Operation;

export type GetKrc721RoyaltyFeesResponse = string;

export type GetKrc721RejectionResponse = string;

export type GetKrc721OwnershipHistoryResponse = {
  owner: string;
  opScoreMod: string;
  txIdRev: string;
}[];

export type GetKrc721TokenRangesResponse = string;

export function makeQueryString(params: Record<string, string | number | boolean | undefined>): string {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined)
    .map((key) => `${key}=${encodeURIComponent(params[key]!.toString())}`)
    .join('&');
}

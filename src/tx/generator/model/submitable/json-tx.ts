/**
 * Represents a submitable transaction.
 */
export interface ISubmitableJsonTransaction {
  id: string; // TransactionId
  version: number; // u16
  inputs: ISubmitableJsonTransactionInput[];
  outputs: ISubmitableJsonTransactionOutput[];
  lockTime: number; // u64
  gas: number; // u64
  subnetworkId: string; // SubnetworkId
  payload: string; // Hex-encoded string
  mass: number; // u64
}

/**
 * Represents a submitable transaction input.
 */
export interface ISubmitableJsonTransactionInput {
  previousOutpoint: ISubmitableJsonTransactionOutpoint;
  sequence: number; // u64
  sigOpCount: number; // u8
  signatureScript: string; // Hex-encoded string
}

/**
 * Represents a submitable transaction outpoint.
 */
export interface ISubmitableJsonTransactionOutpoint {
  /**
   * The ID of the transaction.
   */
  transactionId: string; // TransactionId

  /**
   * The index of the transaction output.
   */
  index: number; // SignedTransactionIndexType
}

/**
 * Represents a submitable transaction output.
 */
export interface ISubmitableJsonTransactionOutput {
  value: number; // u64
  scriptPublicKey: ISubmitableJsonScriptPublicKey;
}

/**
 * Represents a submitable script public key.
 */
export interface ISubmitableJsonScriptPublicKey {
  version: number; // u32
  script: string; // Hex-encoded string
}

/**
 * Represents a submittable transaction.
 */
export interface ISubmittableJsonTransaction {
  id: string; // TransactionId
  version: number; // u16
  inputs: ISubmittableJsonTransactionInput[];
  outputs: ISubmittableJsonTransactionOutput[];
  lockTime: number; // u64
  gas: number; // u64
  subnetworkId: string; // SubnetworkId
  payload: string; // Hex-encoded string
  mass: number; // u64
  verb;
}

/**
 * Represents a submittable transaction input.
 */
export interface ISubmittableJsonTransactionInput {
  previousOutpoint: ISubmittableJsonTransactionOutpoint;
  sequence: number; // u64
  sigOpCount: number; // u8
  signatureScript: string; // Hex-encoded string
}

/**
 * Represents a submittable transaction outpoint.
 */
export interface ISubmittableJsonTransactionOutpoint {
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
 * Represents a submittable transaction output.
 */
export interface ISubmittableJsonTransactionOutput {
  value: number; // u64
  scriptPublicKey: ISubmittableJsonScriptPublicKey;
}

/**
 * Represents a submittable script public key.
 */
export interface ISubmittableJsonScriptPublicKey {
  version: number; // u32
  script: string; // Hex-encoded string
}

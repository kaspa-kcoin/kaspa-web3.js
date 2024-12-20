/**
 * Represents a submitable transaction.
 */
export interface ISubmitableBorshTransaction {
  id: string; // TransactionId
  version: number; // u16
  inputs: ISubmitableBorshTransactionInput[];
  outputs: ISubmitableBorshTransactionOutput[];
  lockTime: string; // u64
  gas: string; // u64
  mass: string; // u64
  subnetworkId: string; // SubnetworkId
  payload: string; // Hex-encoded string
}

/**
 * Represents a submitable transaction input.
 */
export interface ISubmitableBorshTransactionInput {
  transactionId: string; // TransactionId
  index: number; // SignedTransactionIndexType
  sequence: string; // u64
  sigOpCount: number; // u8
  signatureScript: string; // Hex-encoded string
  utxo: ISubmitableBorshUtxoEntry;
}

/**
 * Represents a submitable transaction output.
 */
export interface ISubmitableBorshTransactionOutput {
  value: string; // u64
  scriptPublicKey: ISubmitableBorshScriptPublicKey;
}

/**
 * Represents a submitable UTXO (Unspent Transaction Output) entry.
 */
export interface ISubmitableBorshUtxoEntry {
  address: string | null; // Option<Address>
  amount: string; // u64
  scriptPublicKey: ISubmitableBorshScriptPublicKey;
  blockDaaScore: string; // u64
  isCoinbase: boolean;
}

/**
 * Represents a submitable script public key.
 */
export interface ISubmitableBorshScriptPublicKey {
  version: number; // u32
  script: string; // Hex-encoded string
}
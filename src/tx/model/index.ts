import { Hash } from '../hashing';

export { TransactionOutpoint } from './tx-outpoint';
export { UtxoEntry } from './utxo-entry';
export { TransactionInput } from './tx-input';
export { TransactionOutput } from './tx-output';
export { PaymentOutput } from './payment-output';
export { UtxoEntryReference } from './utxo-entry-ref';
export * from './fees';

/**
 * Represents a transaction ID as a Uint8Array.
 * @remarks This is a 32-byte array.
 */
export type TransactionId = Hash;

/**
 * Represents the mass of a transaction as a bigint.
 * @remarks This is a 64-bit unsigned integer.
 */
export type TransactionMass = bigint;

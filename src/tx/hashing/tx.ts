import { Transaction, TransactionId } from '../index';
import { Blake2bHashKey, Hash } from './index';
import { TransactionSerializer } from './tx-serializer';
import { TX_ENCODING_EXCLUDE_SIGNATURE_SCRIPT, TX_ENCODING_FULL } from './data-writer';
import { blake2b } from '@noble/hashes/blake2b';

/**
 * Class providing hashing utilities for transactions.
 */
class TransactionHashing {
  /**
   * Computes the hash of a transaction.
   *
   * @param {Transaction} tx - The transaction to hash.
   * @param {boolean} includeMassField - Whether to include the mass field in the hash.
   * @returns {Uint8Array} The computed hash as a Uint8Array.
   */
  static hash(tx: Transaction, includeMassField: boolean): Uint8Array {
    const txBytes = TransactionSerializer.serialize(tx, TX_ENCODING_FULL, includeMassField).buffer;
    return blake2b(txBytes, { dkLen: 32, key: Blake2bHashKey.TransactionHash });
  }

  /**
   * Computes the ID of a transaction.
   *
   * @param {Transaction} tx - The transaction to compute the ID for.
   * @returns {TransactionId} The computed transaction ID.
   */
  static id(tx: Transaction): TransactionId {
    const encodingFlags = tx.isCoinbase() ? TX_ENCODING_FULL : TX_ENCODING_EXCLUDE_SIGNATURE_SCRIPT;
    const txBytes = TransactionSerializer.serialize(tx, encodingFlags, false).buffer;
    const hash = blake2b(txBytes, { dkLen: 32, key: Blake2bHashKey.TransactionID });
    return new Hash(hash);
  }
}

export { TransactionHashing };

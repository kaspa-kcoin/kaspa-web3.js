import { TransactionId } from './index';
import { validateU32 } from '../../validator';
import { Hash } from '../hashing';

/**
 * Represents a transaction outpoint, which is a reference to a specific output in a transaction.
 */
class TransactionOutpoint {
  /**
   * The ID of the transaction.
   */
  transactionId: TransactionId;

  /**
   * The index of the output in the transaction.
   * @remarks This is a u32.
   */
  index: number;

  /**
   * Creates a new TransactionOutpoint.
   * @param transactionId - The ID of the transaction.
   * @param index - The index of the output in the transaction.
   */
  constructor(transactionId: TransactionId | string, index: number) {
    validateU32(index, 'index');
    this.transactionId = typeof transactionId === 'string' ? Hash.fromHex(transactionId) : transactionId;
    this.index = index;
  }

  static fromJson(json: string): TransactionOutpoint {
    const obj = JSON.parse(json);
    if (
      !obj ||
      (typeof obj.transactionId !== 'string' && !(obj.transactionId instanceof Hash)) ||
      typeof obj.index !== 'number'
    ) {
      throw new Error('Failed to deserialize TransactionOutpoint');
    }
    return new TransactionOutpoint(
      typeof obj.transactionId === 'string' ? Hash.fromHex(obj.transactionId) : obj.transactionId,
      obj.index
    );
  }

  /**
   * Checks if this transaction outpoint is equal to another transaction outpoint.
   * @param other - The other transaction outpoint to compare with.
   * @returns True if the transaction IDs and indices are equal, false otherwise.
   */
  equals(other: TransactionOutpoint): boolean {
    return this.transactionId.equals(other.transactionId) && this.index === other.index;
  }

  /**
   * Returns a string representation of the transaction outpoint.
   * @returns A string in the format (transactionId, index).
   */
  toString(): string {
    return `(${this.transactionId.toHex()}, ${this.index})`;
  }
}

export { TransactionOutpoint };

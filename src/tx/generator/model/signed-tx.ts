import { SignableTransaction } from './signable-tx';
import { ISubmitableBorshTransaction, ISubmitableJsonTransaction } from './submitable';

/**
 * Enum representing the signed state of a transaction.
 */
enum SignedType {
  Fully,
  Partially
}

class SignedTransaction {
  type: SignedType;
  transaction: SignableTransaction;

  constructor(type: SignedType, transaction: SignableTransaction) {
    this.type = type;
    this.transaction = transaction;
  }

  /**
   * Convert to a submitable transaction.
   * @returns {ISubmitableJsonTransaction} The submitable transaction.
   */
  toSubmitableJson(): ISubmitableJsonTransaction {
    return this.transaction.toSubmitableJson();
  }

  /**
   * Convert to a submitable transaction.
   * @returns {ISubmitableBorshTransaction} The submitable transaction.
   */
  toSubmitableBorsh(): ISubmitableBorshTransaction {
    return this.transaction.toSubmitableBorsh();
  }
}

export { SignedType, SignedTransaction };

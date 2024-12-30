import { SignableTransaction } from './signable-tx';
import { ISubmittableJsonTransaction } from './submittable';

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
   * Convert to a submittable transaction.
   * @returns {ISubmittableJsonTransaction} The submittable transaction.
   */
  toSubmittableJsonTx(): ISubmittableJsonTransaction {
    return this.transaction.toSubmittableJsonTx();
  }
}

export { SignedType, SignedTransaction };

import { validateU64 } from '../../validator';

/**
 * Represents the fees associated with a transaction.
 */
class Fees {
  /**
   * The amount of the fee
   * @remarks this is a 64-bit unsigned integer.
   */
  amount: bigint;

  /**
   * The source of the fee, which can be optional.
   */
  source: FeeSource;

  /**
   * Creates an instance of Fees.
   * @param amount - The amount of the fee in u64 format.
   * @param source - The source of the fee.
   */
  constructor(amount: bigint, source?: FeeSource) {
    validateU64(amount, 'amount');

    this.amount = amount;
    this.source = source ?? FeeSource.SenderPays;
  }

  /**
   * Checks if the fee is none.
   * @returns True if the fee is none, otherwise false.
   */
  isNone(): boolean {
    return this.source === FeeSource.None;
  }

  /**
   * Checks if the sender pays the fee.
   * @returns True if the sender pays the fee, otherwise false.
   */
  senderPays(): boolean {
    return this.source === FeeSource.SenderPays;
  }

  /**
   * Checks if the receiver pays the fee.
   * @returns True if the receiver pays the fee, otherwise false.
   */
  receiverPays(): boolean {
    return this.source === FeeSource.ReceiverPays;
  }

  /**
   * Returns the additional fee amount.
   * @returns The additional fee amount if the sender pays, otherwise 0.
   */
  additional(): bigint {
    return this.senderPays() ? this.amount : 0n;
  }

  /**
   * Converts a positive i64 value to Exclude fees and a negative i64 value to Include fees.
   * @param fee - The fee amount in i64 format.
   * @returns An instance of Fees.
   */
  static from(fee: bigint): Fees {
    if (fee < 0n) {
      return new Fees(-fee, FeeSource.ReceiverPays);
    } else {
      return new Fees(fee, FeeSource.SenderPays);
    }
  }
}

/**
 * Enum representing the source of the fees.
 */
enum FeeSource {
  None,
  SenderPays,
  ReceiverPays
}

export { Fees, FeeSource };

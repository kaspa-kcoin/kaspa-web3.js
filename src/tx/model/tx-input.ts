/**
 * Represents a transaction input.
 */
import { TransactionOutpoint } from './tx-outpoint';
import { validateU64, validateU8 } from '../../validator';

export class TransactionInput {
  /**
   * The previous transaction outpoint.
   */
  previousOutpoint: TransactionOutpoint;

  /**
   * The signature script.
   */
  signatureScript: Uint8Array;

  /**
   * The sequence number.
   * @remarks This field is a 64-bit unsigned integer.
   */
  sequence: bigint;

  /**
   * The number of signature operations in the signature script.
   * @remarks This field is a 8-bit unsigned integer.
   */
  // TODO: Since this field is used for calculating mass context free, and we already commit to the mass in a dedicated field (on the tx level), it follows that this field is no longer needed, and can be removed if we ever implement a v2 transaction.
  sigOpCount: number;

  /**
   * Creates an instance of TransactionInput.
   * @param previousOutpoint - The previous transaction outpoint.
   * @param signatureScript - The signature script.
   * @param sequence - The sequence number.
   * @param sigOpCount - The signature operation count.
   */
  constructor(
    previousOutpoint: TransactionOutpoint,
    signatureScript: Uint8Array,
    sequence: bigint,
    sigOpCount: number
  ) {
    validateU64(sequence, 'sequence');
    validateU8(sigOpCount, 'sigOpCount');

    this.previousOutpoint = previousOutpoint;
    this.signatureScript = signatureScript;
    this.sequence = sequence;
    this.sigOpCount = sigOpCount;
  }
}

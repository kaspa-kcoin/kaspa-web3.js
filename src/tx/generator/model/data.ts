import { TransactionInput, UtxoEntryReference } from '../../model';
import { UnsignedTxMassCalculator } from '../../mass/unsigned-tx-mass-calc';
import { Address } from '../../../address';

/**
 * Single transaction data accumulator.
 * This structure is used to accumulate and track all necessary transaction data
 * and is then used to create an actual transaction.
 */
class Data {
  /**
   * Transaction inputs accumulated during processing
   */
  inputs: TransactionInput[];

  /**
   * UTXO entries referenced by transaction inputs
   */
  utxoEntryReferences: UtxoEntryReference[];

  /**
   * Addresses referenced by transaction inputs
   */
  addresses: Set<string>;

  /**
   * Aggregate transaction mass
   */
  aggregateMass: bigint;

  /**
   * Transaction fees based on the aggregate mass
   */
  transactionFees: bigint;

  /**
   * Aggregate value of all inputs
   */
  aggregateInputValue: bigint;

  /**
   * Optional change output value
   */
  changeOutputValue?: bigint;

  /**
   * Constructs a new `Data` instance.
   *
   * @param {UnsignedTxMassCalculator} calc - The calculator used to compute the blank transaction mass.
   */
  constructor(calc: UnsignedTxMassCalculator) {
    this.inputs = [];
    this.utxoEntryReferences = [];
    this.addresses = new Set<string>();
    this.aggregateMass = BigInt(calc.blankTransactionComputeMass());
    this.transactionFees = 0n;
    this.aggregateInputValue = 0n;
    this.changeOutputValue = undefined;
  }
}

export { Data };

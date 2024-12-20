/**
 * [`Generator`] stage. A "tree level" processing stage, used to track
 * transactions processed during a stage.
 */
import { UtxoEntryReference } from 'src/tx/model';

class Stage {
  /**
   * Iterator containing UTXO entries from the previous tree stage
   */
  utxoIterator?: Iterator<UtxoEntryReference>;

  /**
   * UTXOs generated during this stage
   */
  utxoAccumulator: UtxoEntryReference[];

  /**
   * Total aggregate value of all inputs consumed during this stage
   * @remarks this is a 64-bit unsigned integer
   */
  aggregateInputValue: bigint;

  /**
   * Total aggregate value of all fees incurred during this stage
   * @remarks this is a 64-bit unsigned integer
   */
  aggregateFees: bigint;

  /**
   * Total number of transactions generated during this stage
   */
  numberOfTransactions: number;

  /**
   * Creates an instance of Stage.
   * @param {Stage} [previous] - The previous stage to initialize from.
   */
  constructor(previous?: Stage) {
    this.utxoIterator = previous ? previous.utxoAccumulator[Symbol.iterator]() : undefined;
    this.utxoAccumulator = [];
    this.aggregateInputValue = 0n;
    this.aggregateFees = 0n;
    this.numberOfTransactions = 0;
  }
}

export { Stage };

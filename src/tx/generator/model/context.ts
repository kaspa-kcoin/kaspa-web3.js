import { TransactionId, UtxoEntryReference } from '../../model';
import { Stage } from './stage';

/**
 * Mutable `Generator` state used to track the current transaction generation process.
 */
class GeneratorContext {
  /**
   * Iterator containing UTXO entries available for transaction generation.
   */
  utxoSourceIterator: Iterator<UtxoEntryReference>;

  /**
   * List of priority UTXO entries, that are consumed before polling the iterator.
   */
  priorityUtxoEntries?: UtxoEntryReference[];

  /**
   * HashSet containing priority UTXO entries, used for filtering for potential duplicates from the iterator.
   * content is utxo's `${utxo.outPoint.transactionId}_${utxo.outPoint.version}`
   */
  priorityUtxoEntryFilter?: Set<string>;

  /**
   * Total number of UTXOs consumed by the single generator instance.
   */
  aggregatedUtxos: number;

  /**
   * Total fees of all transactions issued by the single generator instance.
   */
  aggregateFees: bigint;

  /**
   * Number of generated transactions.
   */
  numberOfTransactions: number;

  /**
   * Current tree stage.
   */
  stage?: Stage;

  /**
   * Rejected or "stashed" UTXO entries that are consumed before polling the iterator.
   * This store is used in edge cases when UTXO entry from the iterator has been consumed but was rejected due to mass constraints or other conditions.
   */
  utxoStash: UtxoEntryReference[];

  /**
   * Final transaction id.
   */
  finalTransactionId?: TransactionId;

  /**
   * Signifies that the generator is finished. No more items will be produced in the iterator or a stream.
   */
  isDone: boolean;

  constructor(
    utxoSourceIterator: Iterator<UtxoEntryReference>,
    priorityUtxoEntries?: UtxoEntryReference[],
    priorityUtxoEntryFilter?: Set<string>,
    aggregatedUtxos: number = 0,
    aggregateFees: bigint = 0n,
    numberOfTransactions: number = 0,
    stage?: Stage,
    utxoStash: UtxoEntryReference[] = [],
    finalTransactionId?: TransactionId,
    isDone: boolean = false
  ) {
    this.utxoSourceIterator = utxoSourceIterator;
    this.priorityUtxoEntries = priorityUtxoEntries;
    this.priorityUtxoEntryFilter = priorityUtxoEntryFilter;
    this.aggregatedUtxos = aggregatedUtxos;
    this.aggregateFees = aggregateFees;
    this.numberOfTransactions = numberOfTransactions;
    this.stage = stage ?? new Stage();
    this.utxoStash = utxoStash ?? [];
    this.finalTransactionId = finalTransactionId;
    this.isDone = isDone;
  }
}

export { GeneratorContext };

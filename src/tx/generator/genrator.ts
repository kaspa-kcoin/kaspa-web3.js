import { MAXIMUM_STANDARD_TRANSACTION_MASS, UNACCEPTED_DAA_SCORE } from '../constants';
import { UnsignedTxMassCalculator } from '../mass/unsigned-tx-mass-calc';
import { Address, AddressPrefixHelper } from '../../address';
import { NetworkId, NetworkParams, Params, ScriptPublicKey, SUBNETWORK_ID_NATIVE } from '../../consensus';
import {
  Data,
  DataKind,
  FinalTransaction,
  GeneratorContext,
  GeneratorSettings,
  GeneratorSummary,
  MassDisposition,
  SignableTransaction,
  Stage
} from './model';
import { payToAddressScript } from '../../tx-script';
import {
  Fees,
  FeeSource,
  TransactionId,
  TransactionInput,
  TransactionOutpoint,
  TransactionOutput,
  UtxoEntryReference
} from '../model';
import { Transaction } from '../tx';

/**
 * Fee reduction - when a transaction has some storage mass
 * and the total mass is below this threshold (as well as
 * other conditions), we attempt to accumulate additional
 * inputs to reduce storage mass/fees.
 */
const TRANSACTION_MASS_BOUNDARY_FOR_ADDITIONAL_INPUT_ACCUMULATION: bigint =
  (MAXIMUM_STANDARD_TRANSACTION_MASS / 5n) * 4n;

/**
 * Optimization boundary - when aggregating inputs,
 * we don't perform any checks until we reach this mass
 * or the aggregate input amount reaches the requested
 * output amount.
 */
const TRANSACTION_MASS_BOUNDARY_FOR_STAGE_INPUT_ACCUMULATION: bigint = (MAXIMUM_STANDARD_TRANSACTION_MASS / 5n) * 4n;

/**
 * Transaction generator
 */
class Generator {
  // Internal mass calculator (pre-configured with network params)
  private readonly massCalculator: UnsignedTxMassCalculator;
  // Current network id
  private readonly networkId: NetworkId;
  // Current network params
  private readonly networkParams: NetworkParams;
  // Typically a number of keys required to sign the transaction
  private readonly sigOpCount: number;
  // Number of minimum signatures required to sign the transaction
  private readonly minimumSignatures: number;
  // Change address
  private readonly changeAddress: Address;
  // Standard change output compute mass
  private readonly standardChangeOutputComputeMass: bigint;
  // Signature mass per input
  private readonly signatureMassPerInput: bigint;
  // Final transaction amount and fees
  // `undefined` is used for sweep transactions
  private readonly finalTransaction?: FinalTransaction;
  // Applies only to the final transaction
  private finalTransactionPriorityFee?: Fees;
  // Issued only in the final transaction
  private readonly finalTransactionOutputs: TransactionOutput[];
  // Pre-calculated partial harmonic for user outputs (does not include change)
  private readonly finalTransactionOutputsHarmonic: bigint;
  // Mass of the final transaction
  private readonly finalTransactionOutputsComputeMass: bigint;
  // Final transaction payload
  private readonly finalTransactionPayload: Uint8Array;
  // Final transaction payload mass
  private readonly finalTransactionPayloadMass: bigint;
  // Execution context
  private readonly context: GeneratorContext;

  constructor(settings: GeneratorSettings) {
    const {
      networkId,
      outputs,
      entries: entriesSource,
      priorityEntries: priorityEntriesSource,
      sigOpCount,
      minimumSignatures,
      changeAddress,
      priorityFee,
      payload
    } = settings;

    let entries = [...entriesSource];
    let priorityEntries = priorityEntriesSource ? [...priorityEntriesSource] : undefined;

    let finalTransactionAmount = 0n;
    const finalTransactionOutputs = outputs.map((output) => {
      // sanity checks
      if (priorityFee === undefined)
        throw new Error('Transactions with output must have Fees::SenderPays or Fees::ReceiverPays');
      if (networkId.networkType !== AddressPrefixHelper.toNetworkType(output.address.prefix))
        throw new Error('Payment output address does not match supplied network type');
      if (output.amount === 0n) throw new Error('Invalid transaction amount');

      finalTransactionAmount += output.amount;
      return new TransactionOutput(output.amount, payToAddressScript(output.address));
    });

    // sanity checks
    if (finalTransactionOutputs.length === 0 && priorityFee?.source === FeeSource.ReceiverPays) {
      throw new Error('Priority fees can not be included into transactions with multiple outputs');
    }

    // sanity checks
    if (networkId.networkType !== AddressPrefixHelper.toNetworkType(changeAddress.prefix))
      throw new Error('Change address does not match supplied network type');

    this.networkId = networkId;
    this.networkParams = NetworkParams.from(networkId);
    this.massCalculator = new UnsignedTxMassCalculator(Params.fromNetworkId(networkId));
    this.sigOpCount = sigOpCount;
    this.minimumSignatures = minimumSignatures;
    this.changeAddress = changeAddress;

    this.standardChangeOutputComputeMass = this.massCalculator.calcComputeMassForClientTransactionOutput(
      new TransactionOutput(0n, payToAddressScript(changeAddress))
    );
    this.signatureMassPerInput = this.massCalculator.calcComputeMassForSignature(minimumSignatures);

    this.finalTransaction = new FinalTransaction(
      finalTransactionAmount,
      finalTransactionAmount + (priorityFee?.additional() ?? 0n)
    );

    this.finalTransactionPriorityFee = priorityFee;
    this.finalTransactionPayload = payload || new Uint8Array();
    this.finalTransactionOutputs = finalTransactionOutputs;
    this.finalTransactionOutputsComputeMass =
      this.massCalculator.calcComputeMassForClientTransactionOutputs(finalTransactionOutputs);
    this.finalTransactionPayloadMass = this.massCalculator.calcComputeMassForPayload(
      this.finalTransactionPayload.length
    );
    this.finalTransactionOutputsHarmonic = this.massCalculator.calcStorageMassOutputHarmonic(finalTransactionOutputs);

    const massSanityCheck =
      this.standardChangeOutputComputeMass + this.finalTransactionOutputsComputeMass + this.finalTransactionPayloadMass;
    if (massSanityCheck > (MAXIMUM_STANDARD_TRANSACTION_MASS / 5n) * 4n) {
      throw new Error(`Transaction outputs exceed the maximum allowed mass:${massSanityCheck}`);
    }

    const priorityUtxoEntryFilter = priorityEntries?.reduce((set, entry) => {
      set.add(`${entry.outpoint.transactionId.toHex()}_${entry.outpoint.index}`);
      return set;
    }, new Set<string>());
    this.context = new GeneratorContext(entries[Symbol.iterator](), priorityEntries, priorityUtxoEntryFilter);
  }

  /**
   * Generates a single transaction by draining the supplied UTXO iterator.
   * This function is used by the available async Stream and Iterator
   * implementations to generate a stream of transactions.
   *
   * This function returns `None` once the supplied UTXO iterator is depleted.
   *
   * This function runs a continuous loop by ingesting inputs from the UTXO
   * iterator, analyzing the resulting transaction mass, and either producing
   * an intermediate "batch" transaction sending funds to the change address
   * or creating a final transaction with the requested set of outputs and the
   * payload.
   *
   * @returns A promise that resolves to an optional PendingTransaction or an error if there are insufficient funds
   */
  public generateTransaction(): SignableTransaction | undefined {
    let context = this.context;

    if (context.isDone) {
      return undefined;
    }

    const [kind, data] = this.generateTransactionData(context.stage!);

    switch (kind) {
      case DataKind.NoOp:
        context.isDone = true;
        context.stage = undefined;
        return undefined;

      case DataKind.Final:
        context.isDone = true;
        context.stage = undefined;

        const { inputs, utxoEntryReferences, aggregateInputValue, changeOutputValue = 0n, transactionFees } = data;
        let finalOutputs = [...this.finalTransactionOutputs];

        if (this.finalTransactionPriorityFee?.receiverPays()) {
          let output = finalOutputs[0];
          if (aggregateInputValue < output.value) {
            output.value = aggregateInputValue - transactionFees;
          } else {
            output.value -= transactionFees;
          }
        }

        if (changeOutputValue > 0) {
          finalOutputs.push(new TransactionOutput(changeOutputValue, payToAddressScript(this.changeAddress)));
        }

        const aggregateOutputValue = finalOutputs.reduce((sum, output) => sum + output.value, 0n);
        if (aggregateOutputValue > aggregateInputValue) {
          throw new Error(
            `InsufficientFunds: additional_needed = ${aggregateOutputValue - aggregateInputValue}, origin = "final"`
          );
        }

        const tx = new Transaction(0, inputs, finalOutputs, 0n, SUBNETWORK_ID_NATIVE, 0n, this.finalTransactionPayload);

        const transactionMass = this.massCalculator.calcOverallMassForUnsignedConsensusTransaction(
          tx,
          utxoEntryReferences,
          this.minimumSignatures
        );
        if (transactionMass > MAXIMUM_STANDARD_TRANSACTION_MASS) {
          throw new Error('Mass calculation error');
        }
        tx.setMass(transactionMass);

        context.finalTransactionId = tx.id;
        context.numberOfTransactions += 1;

        return new SignableTransaction(
          tx,
          utxoEntryReferences,
          this.finalTransaction?.valueNoFees ?? 0n,
          changeOutputValue,
          aggregateInputValue,
          aggregateOutputValue,
          this.minimumSignatures,
          transactionMass,
          transactionFees,
          kind
        );
      default:
        const {
          inputs: batchInputs,
          utxoEntryReferences: batchUtxoEntryReferences,
          aggregateInputValue: batchAggregateInputValue,
          transactionFees: batchTransactionFees
        } = data;

        const outputValue = batchAggregateInputValue - batchTransactionFees;
        const scriptPublicKey = payToAddressScript(this.changeAddress);
        const output = new TransactionOutput(outputValue, scriptPublicKey);
        const batchTx = new Transaction(0, batchInputs, [output], 0n, SUBNETWORK_ID_NATIVE, 0n, new Uint8Array());

        let batchTransactionMass = this.massCalculator.calcOverallMassForUnsignedConsensusTransaction(
          batchTx,
          batchUtxoEntryReferences,
          this.minimumSignatures
        );
        batchTransactionMass += this.networkParams.additionalCompoundTransactionMass;
        if (batchTransactionMass > MAXIMUM_STANDARD_TRANSACTION_MASS) {
          throw new Error('MassCalculationError');
        }
        batchTx.setMass(batchTransactionMass);

        context.numberOfTransactions += 1;

        const previousBatchUtxoEntryReference = this.createBatchUtxoEntryReference(
          batchTx.id,
          outputValue,
          scriptPublicKey,
          this.changeAddress
        );

        if (kind === DataKind.Node) {
          context.stage!.utxoAccumulator.push(previousBatchUtxoEntryReference);
          context.stage!.numberOfTransactions += 1;
        } else if (kind === DataKind.Edge) {
          context.stage!.utxoAccumulator.push(previousBatchUtxoEntryReference);
          context.stage!.numberOfTransactions += 1;
          context.stage = new Stage(context.stage);
        }

        return new SignableTransaction(
          batchTx,
          batchUtxoEntryReferences,
          this.finalTransaction?.valueNoFees,
          outputValue,
          batchAggregateInputValue,
          outputValue,
          this.minimumSignatures,
          batchTransactionMass,
          batchTransactionFees,
          kind
        );
    }
  }

  /**
   * Creates a batch UTXO entry reference.
   * @param txId - The transaction ID
   * @param amount - The amount
   * @param scriptPublicKey - The script public key
   * @param address - The address
   * @returns The UTXO entry reference
   */
  private createBatchUtxoEntryReference(
    txId: TransactionId,
    amount: bigint,
    scriptPublicKey: ScriptPublicKey,
    address: Address
  ): UtxoEntryReference {
    const outpoint = new TransactionOutpoint(txId, 0);
    return new UtxoEntryReference(address, outpoint, amount, scriptPublicKey, UNACCEPTED_DAA_SCORE, false);
  }

  /// Main UTXO entry processing loop. This function sources UTXOs from [`Generator::get_utxo_entry()`] and
  /// accumulates consumed UTXO entry data within the [`Context`], [`Stage`] and [`Data`] structures.
  ///
  /// The general processing pattern can be described as follows:
  ///
  /**
   loop {
   1. Obtain UTXO entry from [`Generator::get_utxo_entry()`]
   2. Check if UTXO entries have been depleted, if so, handle sweep processing.
   3. Create a new Input for the transaction from the UTXO entry.
   4. Check if the transaction mass threshold has been reached, if so, yield the transaction.
   5. Register input with the [`Data`] structures.
   6. Check if the final transaction amount has been reached, if so, yield the transaction.

   }
   */

  private generateTransactionData(stage: Stage): [DataKind, Data] {
    const calc = this.massCalculator;
    let data = new Data(calc);

    while (true) {
      const utxoEntryReference = this.getUtxoEntry(stage);
      if (!utxoEntryReference) {
        if (this.finalTransaction) {
          throw new Error(
            `InsufficientFunds: additional_needed = ${
              this.finalTransaction.valueWithPriorityFee - stage.aggregateInputValue
            }, origin = "accumulator"`
          );
        } else {
          return this.finishRelayStageProcessing(stage, data);
        }
      }

      const node = this.aggregateUtxo(stage, data, utxoEntryReference);
      if (node) {
        return [node, data];
      }

      if (this.finalTransaction) {
        if (
          data.aggregateMass > TRANSACTION_MASS_BOUNDARY_FOR_STAGE_INPUT_ACCUMULATION ||
          (this.finalTransactionPriorityFee?.senderPays() &&
            stage.aggregateInputValue >= this.finalTransaction.valueWithPriorityFee) ||
          (this.finalTransactionPriorityFee?.receiverPays() &&
            stage.aggregateInputValue >= this.finalTransaction.valueNoFees - this.context.aggregateFees)
        ) {
          const kind = this.tryFinishStandardStageProcessing(stage, data, this.finalTransaction);
          if (kind) {
            return [kind, data];
          }
        }
      }
    }
  }

  /**
   * Check if the current state has sufficient funds for the final transaction,
   * initiate new stage if necessary, or finish stage processing creating the
   * final transaction.
   * @param stage - The current stage
   * @param data - The current transaction data
   * @param finalTransaction - The final transaction
   * @returns A promise that resolves to an optional DataKind or an error if there are insufficient funds
   */
  private tryFinishStandardStageProcessing(
    stage: Stage,
    data: Data,
    finalTransaction: FinalTransaction
  ): DataKind | undefined {
    const calc = this.massCalculator;

    // calculate storage mass
    const { transactionMass, storageMass, transactionFees, absorbChangeToFees } = this.calculateMass(
      stage,
      data,
      finalTransaction.valueWithPriorityFee
    );

    const totalStageValueNeeded = this.finalTransactionPriorityFee?.senderPays()
      ? finalTransaction.valueWithPriorityFee + stage.aggregateFees + transactionFees
      : finalTransaction.valueWithPriorityFee;

    const reject = (() => {
      switch (this.finalTransactionPriorityFee?.source) {
        case FeeSource.SenderPays:
          return stage.aggregateInputValue < totalStageValueNeeded;
        case FeeSource.ReceiverPays:
          return stage.aggregateInputValue + this.context.aggregateFees < totalStageValueNeeded;
        default:
          throw new Error('Fees::None cannot occur for final transaction');
      }
    })();

    if (reject) {
      // need more value, reject finalization (try adding more inputs)
      return undefined;
    } else if (transactionMass > MAXIMUM_STANDARD_TRANSACTION_MASS || stage.numberOfTransactions > 0) {
      return this.generateEdgeTransaction(stage, data);
    } else {
      // ---
      // attempt to aggregate additional UTXOs in an effort to have more inputs and lower storage mass
      // TODO - discuss:
      // this is of questionable value as this can result in both positive and negative impact,
      // also doing this can result in reduction of the wallet UTXO set, which later results
      // in additional fees for the user.
      if (
        storageMass > 0 &&
        data.inputs.length < this.finalTransactionOutputs.length * 2 &&
        transactionMass < TRANSACTION_MASS_BOUNDARY_FOR_ADDITIONAL_INPUT_ACCUMULATION
      ) {
        // fetch UTXO from the iterator and if exists, make it available on the next iteration via utxoStash.
        if (this.hasUtxoEntries(stage)) {
          return undefined;
        }
      }

      let [transactionFeesNew, changeOutputValue] = (() => {
        switch (this.finalTransactionPriorityFee.source) {
          case FeeSource.SenderPays:
            const fees = transactionFees + this.finalTransactionPriorityFee.amount;
            const changeValue = data.aggregateInputValue - finalTransaction.valueNoFees - fees;
            return [fees, changeValue];
          case FeeSource.ReceiverPays:
            const receiverFees = transactionFees + this.finalTransactionPriorityFee.amount;
            const receiverChangeValue = data.aggregateInputValue - finalTransaction.valueNoFees;
            return [receiverFees, receiverChangeValue];
          default:
            throw new Error('Fees::None is not allowed for final transactions');
        }
      })();

      if (absorbChangeToFees || changeOutputValue === 0n) {
        transactionFeesNew += changeOutputValue;

        // update the mass to make sure internal metrics and unit tests check out
        const computeMass =
          data.aggregateMass + this.finalTransactionOutputsComputeMass + this.finalTransactionPayloadMass;
        const storageMass = this.calcStorageMass(data, this.finalTransactionOutputsHarmonic);

        data.aggregateMass = calc.combineMass(computeMass, storageMass);

        transactionFeesNew += changeOutputValue;
        data.transactionFees = transactionFeesNew;
        stage.aggregateFees += transactionFeesNew;
        this.context.aggregateFees += transactionFeesNew;

        return DataKind.Final;
      } else {
        data.aggregateMass = transactionMass;
        data.transactionFees = transactionFeesNew;
        stage.aggregateFees += transactionFeesNew;
        this.context.aggregateFees += transactionFeesNew;
        data.changeOutputValue = changeOutputValue;

        return DataKind.Final;
      }
    }
  }

  /**
   * Get next UTXO entry. This function obtains UTXO in the following order:
   * 1. From the UTXO stash (used to store UTxOs that were consumed during previous transaction generation but were rejected due to various conditions, such as mass overflow)
   * 2. From the current stage
   * 3. From priority UTXO entries
   * 4. From the UTXO source iterator (while filtering against priority UTXO entries)
   * @param stage - The current stage
   * @returns The next UTXO entry or undefined if none are available
   */
  private getUtxoEntry(stage: Stage): UtxoEntryReference | undefined {
    return (
      this.context.utxoStash.shift() ||
      stage.utxoIterator?.next().value ||
      this.context.priorityUtxoEntries?.shift() ||
      (() => {
        while (true) {
          const utxoEntry = this.context.utxoSourceIterator.next().value as UtxoEntryReference | undefined;
          if (!utxoEntry) return undefined;

          if (
            this.context.priorityUtxoEntryFilter?.has(
              `${utxoEntry.outpoint.transactionId.toHex()}_${utxoEntry.outpoint.index}`
            )
          ) {
            // Skip the entry from the iterator intake if it has been supplied as a priority entry
            continue;
          }

          return utxoEntry;
        }
      })()
    );
  }

  /**
   * Calculate relay transaction mass for the current transaction `data`
   * @param data - The current transaction data
   * @returns The relay transaction mass
   */
  private calcRelayTransactionMass(data: Data): bigint {
    return data.aggregateMass + this.standardChangeOutputComputeMass;
  }

  /**
   * Calculate relay transaction fees for the current transaction `data`
   * @param data - The current transaction data
   * @returns The relay transaction fees
   */
  private calcRelayTransactionComputeFees(data: Data): bigint {
    return this.massCalculator.calcMinimumTransactionFeeFromMass(this.calcRelayTransactionMass(data));
  }

  /**
   * Test if the current state has additional UTXOs. Use with caution as this
   * function polls the iterator and relocates UTXO into UTXO stash.
   * @param stage - The current stage
   * @returns True if there are additional UTXO entries, otherwise false
   */
  private hasUtxoEntries(stage: Stage): boolean {
    const utxoEntryReference = this.getUtxoEntry(stage);
    if (utxoEntryReference) {
      this.context.utxoStash.push(utxoEntryReference);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Add a single input (UTXO) to the transaction accumulator.
   * @param stage - The current stage
   * @param data - The current transaction data
   * @param utxoEntryReference - The UTXO entry reference
   * @returns The data kind if the mass threshold is reached, otherwise undefined
   */
  private aggregateUtxo(stage: Stage, data: Data, utxoEntryReference: UtxoEntryReference): DataKind | undefined {
    const input = new TransactionInput(utxoEntryReference.outpoint, new Uint8Array(), 0n, this.sigOpCount);
    const inputAmount = utxoEntryReference.amount;
    const inputComputeMass =
      this.massCalculator.calcComputeMassForClientTransactionInput(input) + this.signatureMassPerInput;

    // NOTE: relay transactions have no storage mass
    // threshold reached, yield transaction
    if (
      data.aggregateMass +
        inputComputeMass +
        this.standardChangeOutputComputeMass +
        this.networkParams.additionalCompoundTransactionMass >
      MAXIMUM_STANDARD_TRANSACTION_MASS
    ) {
      // note, we've used input for mass boundary calc and now abandon it
      // while preserving the UTXO entry reference to be used in the next iteration

      this.context.utxoStash.push(utxoEntryReference);
      data.aggregateMass += this.standardChangeOutputComputeMass + this.networkParams.additionalCompoundTransactionMass;
      data.transactionFees = this.calcRelayTransactionComputeFees(data);
      stage.aggregateFees += data.transactionFees;
      this.context.aggregateFees += data.transactionFees;
      return DataKind.Node;
    } else {
      this.context.aggregatedUtxos += 1;
      stage.aggregateInputValue += inputAmount;
      data.aggregateInputValue += inputAmount;
      data.aggregateMass += inputComputeMass;
      data.utxoEntryReferences.push(utxoEntryReference);
      data.inputs.push(input);
      if (utxoEntryReference.address) {
        data.addresses.add(utxoEntryReference.address.toString());
      }
      return undefined;
    }
  }

  /**
   * Check current state and either 1) initiate a new stage or 2) finish stage accumulation processing
   * @param stage - The current stage
   * @param data - The current transaction data
   * @returns A tuple containing the data kind and the updated data, or an error if there are insufficient funds
   */
  private finishRelayStageProcessing(stage: Stage, data: Data): [DataKind, Data] {
    data.transactionFees = this.calcRelayTransactionComputeFees(data);
    stage.aggregateFees += data.transactionFees;
    this.context.aggregateFees += data.transactionFees;

    if (this.context.aggregatedUtxos < 2) {
      return [DataKind.NoOp, data];
    } else if (stage.numberOfTransactions > 0) {
      data.aggregateMass += this.standardChangeOutputComputeMass;
      return [DataKind.Edge, data];
    } else if (data.aggregateInputValue < data.transactionFees) {
      throw new Error(
        `InsufficientFunds: additional_needed = ${data.transactionFees - data.aggregateInputValue}, origin = "relay"`
      );
    } else {
      const changeOutputValue = data.aggregateInputValue - data.transactionFees;

      if (this.massCalculator.isDust(changeOutputValue)) {
        // sweep transaction resulting in dust output
        return [DataKind.NoOp, data];
      } else {
        data.aggregateMass += this.standardChangeOutputComputeMass;
        data.changeOutputValue = changeOutputValue;
        return [DataKind.Final, data];
      }
    }
  }

  /**
   * Calculate storage mass using inputs from `Data`
   * and `output_harmonics` supplied by the user
   * @param data - The current transaction data
   * @param outputHarmonics - The output harmonics
   * @returns The storage mass
   */
  private calcStorageMass(data: Data, outputHarmonics: bigint): bigint {
    const calc = this.massCalculator;
    return calc.calcStorageMass(outputHarmonics, data.aggregateInputValue, BigInt(data.inputs.length));
  }

  /**
   * Calculate mass for the transaction
   * @param stage - The current stage
   * @param data - The current transaction data
   * @param transactionTargetValue - The target value for the transaction
   * @returns A promise that resolves to the mass disposition or an error if the storage mass exceeds the maximum transaction mass
   */
  private calculateMass(stage: Stage, data: Data, transactionTargetValue: bigint): MassDisposition {
    const calc = this.massCalculator;
    let absorbChangeToFees = false;

    const computeMassWithChange =
      data.aggregateMass +
      this.standardChangeOutputComputeMass +
      this.finalTransactionOutputsComputeMass +
      this.finalTransactionPayloadMass;

    const storageMass = (() => {
      if (stage.numberOfTransactions > 0) {
        // calculate for edge transaction boundaries
        const edgeComputeMass = data.aggregateMass + this.standardChangeOutputComputeMass;
        const edgeFees = calc.calcMinimumTransactionFeeFromMass(edgeComputeMass);
        const edgeOutputValue = data.aggregateInputValue - edgeFees;
        if (edgeOutputValue !== 0n) {
          const edgeOutputHarmonic = calc.calcStorageMassOutputHarmonicSingle(edgeOutputValue);
          return this.calcStorageMass(data, edgeOutputHarmonic);
        } else {
          return 0n;
        }
      } else if (data.aggregateInputValue <= transactionTargetValue) {
        // calculate for final transaction boundaries
        return this.calcStorageMass(data, this.finalTransactionOutputsHarmonic);
      } else {
        // calculate for final transaction boundaries
        const changeValue = data.aggregateInputValue - transactionTargetValue;

        if (calc.isDust(changeValue)) {
          absorbChangeToFees = true;
          return this.calcStorageMass(data, this.finalTransactionOutputsHarmonic);
        } else {
          const outputHarmonicWithChange =
            calc.calcStorageMassOutputHarmonicSingle(changeValue) + this.finalTransactionOutputsHarmonic;
          const storageMassWithChange = this.calcStorageMass(data, outputHarmonicWithChange);

          if (storageMassWithChange === 0n || storageMassWithChange < computeMassWithChange) {
            return 0n;
          } else {
            const storageMassNoChange = this.calcStorageMass(data, this.finalTransactionOutputsHarmonic);
            if (storageMassWithChange < storageMassNoChange) {
              return storageMassWithChange;
            } else {
              const feesWithChange = calc.calcFeeForMass(storageMassWithChange);
              const feesNoChange = calc.calcFeeForMass(storageMassNoChange);
              const difference = feesWithChange - feesNoChange;

              if (difference > changeValue) {
                absorbChangeToFees = true;
                return storageMassNoChange;
              } else {
                return storageMassWithChange;
              }
            }
          }
        }
      }
    })();

    if (storageMass > MAXIMUM_STANDARD_TRANSACTION_MASS) {
      throw new Error(`Storage mass exceeds maximum: ${storageMass}`);
    } else {
      const transactionMass = calc.combineMass(computeMassWithChange, storageMass);
      const transactionFees = calc.calcMinimumTransactionFeeFromMass(transactionMass);

      return { transactionMass, transactionFees, storageMass, absorbChangeToFees };
    }
  }

  /**
   * Generate an `Edge` transaction. This function is called when the transaction
   * processing has aggregated sufficient inputs to match requested outputs.
   * @param stage - The current stage
   * @param data - The current transaction data
   * @returns A promise that resolves to an optional DataKind or an error if the transaction is too heavy
   */
  private generateEdgeTransaction(stage: Stage, data: Data): DataKind | undefined {
    const calc = this.massCalculator;

    const computeMass =
      data.aggregateMass + this.standardChangeOutputComputeMass + this.networkParams.additionalCompoundTransactionMass;
    const computeFees = calc.calcMinimumTransactionFeeFromMass(computeMass);

    // TODO - consider removing this as calculated storage mass should produce `0` value
    const edgeOutputHarmonic = calc.calcStorageMassOutputHarmonicSingle(data.aggregateInputValue - computeFees);
    const storageMass = this.calcStorageMass(data, edgeOutputHarmonic);
    const transactionMass = calc.combineMass(computeMass, storageMass);

    if (transactionMass > MAXIMUM_STANDARD_TRANSACTION_MASS) {
      // transaction mass is too high... if we have additional
      // UTXOs, reject and try to accumulate more inputs...
      if (this.hasUtxoEntries(stage)) {
        return undefined;
      } else {
        // otherwise we have insufficient funds
        throw new Error('Transaction exceeds the maximum allowed mass');
      }
    } else {
      data.aggregateMass = transactionMass;
      data.transactionFees = calc.calcMinimumTransactionFeeFromMass(transactionMass);
      stage.aggregateFees += data.transactionFees;
      this.context.aggregateFees += data.transactionFees;
      return DataKind.Edge;
    }
  }

  /**
   * Produces `GeneratorSummary` for the current state of the generator.
   * This method is useful for creation of transaction estimations.
   * @returns The generator summary
   */
  public summary(): GeneratorSummary {
    const context = this.context;

    return new GeneratorSummary(
      this.networkId,
      context.aggregatedUtxos,
      context.aggregateFees,
      context.numberOfTransactions,
      this.finalTransaction?.valueNoFees,
      context.finalTransactionId
    );
  }
}

export { Generator };

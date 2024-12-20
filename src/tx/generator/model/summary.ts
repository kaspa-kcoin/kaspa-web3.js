import { TransactionId } from '../../index';
import { validateU64 } from '../../../validator';
import { NetworkId } from '../../../consensus';

class GeneratorSummary {
  networkId: NetworkId;
  aggregatedUtxos: number;
  aggregatedFees: bigint;
  numberOfGeneratedTransactions: number;
  finalTransactionAmount?: bigint;
  finalTransactionId?: TransactionId;

  constructor(
    networkId: NetworkId,
    aggregatedUtxos: number,
    aggregatedFees: bigint,
    numberOfGeneratedTransactions: number,
    finalTransactionAmount?: bigint,
    finalTransactionId?: TransactionId
  ) {
    validateU64(aggregatedFees, 'aggregatedFees');
    if (finalTransactionAmount !== undefined) validateU64(finalTransactionAmount, 'finalTransactionAmount');

    this.networkId = networkId;
    this.aggregatedUtxos = aggregatedUtxos;
    this.aggregatedFees = aggregatedFees;
    this.numberOfGeneratedTransactions = numberOfGeneratedTransactions;
    this.finalTransactionAmount = finalTransactionAmount;
    this.finalTransactionId = finalTransactionId;
  }
}

export { GeneratorSummary };

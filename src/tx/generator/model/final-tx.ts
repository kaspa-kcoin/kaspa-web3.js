/**
 * FinalTransaction class
 */
class FinalTransaction {
  /**
   * Total output value required for the final transaction
   */
  valueNoFees: bigint;

  /**
   * Total output value required for the final transaction + priority fees
   */
  valueWithPriorityFee: bigint;

  constructor(valueNoFees: bigint, valueWithPriorityFee: bigint) {
    this.valueNoFees = valueNoFees;
    this.valueWithPriorityFee = valueWithPriorityFee;
  }
}

export { FinalTransaction };

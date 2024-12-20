/**
 * Helper class for obtaining properties related to
 * transaction mass calculations.
 */
class MassDisposition {
  /**
   * Transaction mass derived from compute and storage mass
   */
  transactionMass: bigint;

  /**
   * Calculated storage mass
   */
  storageMass: bigint;

  /**
   * Calculated transaction fees
   */
  transactionFees: bigint;

  /**
   * Flag signaling that computed values require change to be absorbed to fees.
   * This occurs when the change is dust or the change is below the fees
   * produced by the storage mass.
   */
  absorbChangeToFees: boolean;

  constructor(transactionMass: bigint, storageMass: bigint, transactionFees: bigint, absorbChangeToFees: boolean) {
    this.transactionMass = transactionMass;
    this.storageMass = storageMass;
    this.transactionFees = transactionFees;
    this.absorbChangeToFees = absorbChangeToFees;
  }
}

export { MassDisposition };

class StorageMassCalculator {
  /**
   * Calculates the storage mass for the provided input and output values.
   * Assumptions which must be verified before this call:
   * 1. All output values are non-zero
   * 2. At least one input (unless coinbase)
   * Otherwise this function should never fail.
   * @param {boolean} isCoinbase - Whether the transaction is a coinbase transaction.
   * @param {Iterable<number>} inputValues - The input values of the transaction.
   * @param {Iterable<number>} outputValues - The output values of the transaction.
   * @param {number} storageMassParameter - The storage mass parameter to use for the calculation.
   * @returns {number | undefined} The storage mass of the transaction, or undefined if it cannot be calculated.
   */
  static calcStorageMass(
    isCoinbase: boolean,
    inputValues: Iterable<bigint>,
    outputValues: Iterable<bigint>,
    storageMassParameter: bigint
  ): bigint | undefined {
    if (isCoinbase) {
      return 0n;
    }

    const outsLen = BigInt(Array.from(outputValues).length);
    const insLen = BigInt(Array.from(inputValues).length);

    const harmonicOuts = Array.from(outputValues)
      .map((out) => storageMassParameter / out)
      .reduce((total, current) => total + current, 0n);

    if (outsLen === 1n || insLen === 1n || (outsLen === 2n && insLen === 2n)) {
      const harmonicIns = Array.from(inputValues)
        .map((value) => storageMassParameter / value)
        .reduce((total, current) => total + current, 0n);
      const rtnVal = harmonicOuts - harmonicIns;
      return rtnVal > 0 ? rtnVal : 0n;
    }

    const sumIns = Array.from(inputValues).reduce((total, value) => total + value, 0n);
    const meanIns = sumIns / insLen;
    const arithmeticIns = insLen * (storageMassParameter / meanIns);
    const rtnVal = harmonicOuts - arithmeticIns;
    return rtnVal > 0 ? rtnVal : 0n;
  }
}

export { StorageMassCalculator };

import { Transaction, IVerifiableTransaction } from '../index';
import { TransactionCalculator, StorageMassCalculator } from './index';
import { validateU64 } from '../../validator';

/**
 * SignedTxMassCalculator class for calculating signed transaction mass.
 */
class SignedTxMassCalculator {
  /**
   * Mass per transaction byte.
   * @type {bigint} 64-bit unsigned integer
   */
  massPerTxByte: bigint;

  /**
   * Mass per script public key byte.
   * @type {bigint} 64-bit unsigned integer
   */
  massPerScriptPubKeyByte: bigint;

  /**
   * Mass per signature operation.
   * @type {bigint} 64-bit unsigned integer
   */
  massPerSigOp: bigint;

  /**
   * Storage mass parameter.
   * @type {bigint} 64-bit unsigned integer
   */
  storageMassParameter: bigint;

  constructor(
    massPerTxByte: bigint,
    massPerScriptPubKeyByte: bigint,
    massPerSigOp: bigint,
    storageMassParameter: bigint
  ) {
    validateU64(massPerTxByte, 'massPerTxByte');
    validateU64(storageMassParameter, 'storageMassParameter');

    this.massPerTxByte = massPerTxByte;
    this.massPerScriptPubKeyByte = massPerScriptPubKeyByte;
    this.massPerSigOp = massPerSigOp;
    this.storageMassParameter = storageMassParameter;
  }

  /**
   * Calculates the compute mass of this transaction. This does not include the storage mass calculation below which
   * requires full UTXO context.
   * @param {Transaction} tx - The transaction to calculate the compute mass for.
   * @returns {number} The compute mass of the transaction, it is a 64-bit unsigned integer.
   */
  calcTxComputeMass(tx: Transaction): bigint {
    if (tx.isCoinbase()) {
      return 0n;
    }

    const size = TransactionCalculator.transactionSerializedByteSize(tx);
    const massForSize = size * this.massPerTxByte;
    const totalScriptPublicKeySize = tx.outputs.reduce(
      (acc, output) => acc + 2 + output.scriptPublicKey.script.length,
      0
    );
    const totalScriptPublicKeyMass = BigInt(totalScriptPublicKeySize) * this.massPerScriptPubKeyByte;

    const totalSigOps = tx.inputs.reduce((acc, input) => acc + input.sigOpCount, 0);
    const totalSigOpsMass = BigInt(totalSigOps) * this.massPerSigOp;

    return massForSize + totalScriptPublicKeyMass + totalSigOpsMass;
  }

  /**
   * Calculates the storage mass for this populated transaction.
   * Assumptions which must be verified before this call:
   * 1. All output values are non-zero
   * 2. At least one input (unless coinbase)
   * Otherwise this function should never fail.
   * @param {IVerifiableTransaction} tx - The transaction to calculate the storage mass for.
   * @returns {bigint | undefined} The storage mass of the transaction, or undefined if it cannot be calculated.
   */
  calcTxStorageMass(tx: IVerifiableTransaction): bigint | undefined {
    return StorageMassCalculator.calcStorageMass(
      tx.isCoinbase(),
      tx.populatedInputs().map(([, entry]) => entry.amount),
      tx.outputs().map((out) => out.value),
      this.storageMassParameter
    );
  }

  /**
   * Calculates the overall mass of this transaction, combining both compute and storage masses.
   * The combination strategy depends on the version passed.
   * @param {IVerifiableTransaction} tx - The transaction to calculate the overall mass for.
   * @returns {bigint | undefined} The overall mass of the transaction, or undefined if it cannot be calculated.
   */
  calcTxOverallMass(tx: IVerifiableTransaction): bigint | undefined {
    const storageMass = this.calcTxStorageMass(tx);
    const computeMass = this.calcTxComputeMass(tx.tx());

    return storageMass !== undefined ? (storageMass > computeMass ? storageMass : computeMass) : undefined;
  }
}

export { SignedTxMassCalculator };

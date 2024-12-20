import {
  Transaction,
  TransactionInput,
  TransactionOutput,
  MINIMUM_RELAY_TRANSACTION_FEE,
  SIGNATURE_SIZE,
  UtxoEntryReference
} from '../index';
import { StorageMassCalculator } from './storage-mass-calc';
import { STANDARD_OUTPUT_SIZE_PLUS_INPUT_SIZE_3X, TransactionCalculator } from './tx-calc';
import { Params } from '../../consensus';

/**
 * Class to calculate the mass of unsigned transactions.
 */
class UnsignedTxMassCalculator {
  massPerTxByte: bigint;
  massPerScriptPubKeyByte: bigint;
  massPerSigOp: bigint;
  storageMassParameter: bigint;

  /**
   * Constructor for UnsignedTxMassCalculator.
   * @param consensusParams - Consensus parameters.
   */
  constructor(consensusParams: Params) {
    this.massPerTxByte = consensusParams.massPerTxByte;
    this.massPerScriptPubKeyByte = consensusParams.massPerScriptPubKeyByte;
    this.massPerSigOp = consensusParams.massPerSigOp;
    this.storageMassParameter = consensusParams.storageMassParameter;
  }

  /**
   * Checks if a value is considered dust.
   * @param value - The value to check.
   * @returns True if the value is dust, false otherwise.
   */
  isDust(value: bigint): boolean {
    const value1000 = value * 1000n;
    return value1000 / STANDARD_OUTPUT_SIZE_PLUS_INPUT_SIZE_3X < MINIMUM_RELAY_TRANSACTION_FEE;
  }

  /**
   * Calculates the compute mass for a signed consensus transaction.
   * @param tx - The transaction.
   * @returns The compute mass.
   */
  calcComputeMassForSignedConsensusTransaction(tx: Transaction): bigint {
    const payloadLen = tx.payload.length;
    return (
      this.blankTransactionComputeMass() +
      this.calcComputeMassForPayload(payloadLen) +
      this.calcComputeMassForClientTransactionOutputs(tx.outputs) +
      this.calcComputeMassForClientTransactionInputs(tx.inputs)
    );
  }

  /**
   * Calculates the mass for a blank transaction.
   * @returns The mass for a blank transaction.
   */
  blankTransactionComputeMass(): bigint {
    return TransactionCalculator.blankTransactionSerializedByteSize() * this.massPerTxByte;
  }

  /**
   * Calculates the compute mass for a payload.
   * @param payloadByteSize - The size of the payload in bytes.
   * @returns The compute mass for the payload.
   */
  calcComputeMassForPayload(payloadByteSize: number): bigint {
    return BigInt(payloadByteSize) * this.massPerTxByte;
  }

  /**
   * Calculates the compute mass for transaction outputs.
   * @param outputs - The transaction outputs.
   * @returns The compute mass for the outputs.
   */
  calcComputeMassForClientTransactionOutputs(outputs: TransactionOutput[]): bigint {
    return outputs.reduce((acc, output) => acc + this.calcComputeMassForClientTransactionOutput(output), 0n);
  }

  /**
   * Calculates the compute mass for transaction inputs.
   * @param inputs - The transaction inputs.
   * @returns The compute mass for the inputs.
   */
  calcComputeMassForClientTransactionInputs(inputs: TransactionInput[]): bigint {
    return inputs.reduce((acc, input) => acc + this.calcComputeMassForClientTransactionInput(input), 0n);
  }

  /**
   * Calculates the compute mass for a single transaction output.
   * @param output - The transaction output.
   * @returns The compute mass for the output.
   */
  calcComputeMassForClientTransactionOutput(output: TransactionOutput): bigint {
    return (
      this.massPerScriptPubKeyByte * (2n + BigInt(output.scriptPublicKey.script.length)) +
      TransactionCalculator.transactionOutputSerializedByteSize(output) * this.massPerTxByte
    );
  }

  /**
   * Calculates the compute mass for a single transaction input.
   * @param input - The transaction input.
   * @returns The compute mass for the input.
   */
  calcComputeMassForClientTransactionInput(input: TransactionInput): bigint {
    return (
      BigInt(input.sigOpCount) * this.massPerSigOp +
      TransactionCalculator.transactionInputSerializedByteSize(input) * this.massPerTxByte
    );
  }

  /**
   * Calculates the compute mass for signatures.
   * @param minimumSignatures - The minimum number of signatures.
   * @returns The compute mass for the signatures.
   */
  calcComputeMassForSignature(minimumSignatures: number): bigint {
    return SIGNATURE_SIZE * this.massPerTxByte * BigInt(Math.max(minimumSignatures, 1));
  }

  /**
   * Calculates the signature compute mass for inputs.
   * @param numberOfInputs - The number of inputs.
   * @param minimumSignatures - The minimum number of signatures.
   * @returns The signature compute mass for the inputs.
   */
  calcSignatureComputeMassForInputs(numberOfInputs: number, minimumSignatures: number): bigint {
    return SIGNATURE_SIZE * this.massPerTxByte * BigInt(Math.max(minimumSignatures, 1)) * BigInt(numberOfInputs);
  }

  /**
   * Calculates the minimum transaction fee from mass.
   * @param mass - The mass of the transaction.
   * @returns The minimum transaction fee.
   */
  calcMinimumTransactionFeeFromMass(mass: bigint): bigint {
    return TransactionCalculator.calcMinimumRequiredTransactionRelayFee(mass);
  }

  /**
   * Calculates the compute mass for an unsigned consensus transaction.
   * @param tx - The transaction.
   * @param minimumSignatures - The minimum number of signatures.
   * @returns The compute mass for the unsigned transaction.
   */
  calcComputeMassForUnsignedConsensusTransaction(tx: Transaction, minimumSignatures: number): bigint {
    return (
      this.calcComputeMassForSignedConsensusTransaction(tx) +
      this.calcSignatureComputeMassForInputs(tx.inputs.length, minimumSignatures)
    );
  }

  /**
   * Calculates the fee for a given mass.
   * @param mass - The mass of the transaction.
   * @returns The fee for the mass.
   */
  calcFeeForMass(mass: bigint): bigint {
    return mass;
  }

  /**
   * Combines compute mass and storage mass based on the KIP9 version.
   * @param computeMass - The compute mass.
   * @param storageMass - The storage mass.
   * @returns The combined mass.
   */
  combineMass(computeMass: bigint, storageMass: bigint): bigint {
    return computeMass > storageMass ? computeMass : storageMass;
  }

  /**
   * Calculates the overall mass for an unsigned consensus transaction.
   * @param tx - The transaction.
   * @param utxos - The UTXO entries.
   * @param minimumSignatures - The minimum number of signatures.
   * @returns The overall mass for the unsigned transaction.
   */
  calcOverallMassForUnsignedConsensusTransaction(
    tx: Transaction,
    utxos: UtxoEntryReference[],
    minimumSignatures: number
  ): bigint {
    const storageMass = this.calcStorageMassForTransactionParts(utxos, tx.outputs)!;
    const computeMass = this.calcComputeMassForUnsignedConsensusTransaction(tx, minimumSignatures);
    return this.combineMass(computeMass, BigInt(storageMass));
  }

  /**
   * Calculates the storage mass for transaction parts.
   * @param inputs - The UTXO entries.
   * @param outputs - The transaction outputs.
   * @returns The storage mass for the transaction parts.
   */
  calcStorageMassForTransactionParts(inputs: UtxoEntryReference[], outputs: TransactionOutput[]): bigint | undefined {
    return StorageMassCalculator.calcStorageMass(
      false,
      inputs.map((entry) => entry.amount),
      outputs.map((out) => out.value),
      this.storageMassParameter
    );
  }

  /**
   * Calculates the storage mass output harmonic.
   * @param outputs - The transaction outputs.
   * @returns The storage mass output harmonic.
   */
  calcStorageMassOutputHarmonic(outputs: TransactionOutput[]): bigint {
    return outputs.map((out) => this.storageMassParameter / out.value).reduce((total, current) => total + current, 0n);
  }

  /**
   * Calculates the storage mass output harmonic for a single output.
   * @param outputValue - The value of the output.
   * @returns The storage mass output harmonic for the single output.
   */
  calcStorageMassOutputHarmonicSingle(outputValue: bigint): bigint {
    return this.storageMassParameter / outputValue;
  }

  /**
   * Calculates the storage mass input mean arithmetic.
   * @param totalInputValue - The total input value.
   * @param numberOfInputs - The number of inputs.
   * @returns The storage mass input mean arithmetic.
   */
  calcStorageMassInputMeanArithmetic(totalInputValue: bigint, numberOfInputs: bigint): bigint {
    const meanInputValue = totalInputValue / numberOfInputs;
    return numberOfInputs * (this.storageMassParameter / meanInputValue);
  }

  /**
   * Calculates the storage mass.
   * @param outputHarmonic - The output harmonic.
   * @param totalInputValue - The total input value.
   * @param numberOfInputs - The number of inputs.
   * @returns The storage mass.
   */
  calcStorageMass(outputHarmonic: bigint, totalInputValue: bigint, numberOfInputs: bigint): bigint {
    const inputArithmetic = this.calcStorageMassInputMeanArithmetic(totalInputValue, numberOfInputs);
    return outputHarmonic - inputArithmetic;
  }
}

export { UnsignedTxMassCalculator };

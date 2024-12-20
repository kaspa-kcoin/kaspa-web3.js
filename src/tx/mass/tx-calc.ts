import { Transaction, TransactionInput, TransactionOutput } from '../index';
import { MAX_SOMPI, MINIMUM_RELAY_TRANSACTION_FEE, SCRIPT_VECTOR_SIZE } from '../constants';
import { SUBNETWORK_ID_SIZE } from '../../consensus';
import { HASH_SIZE } from '../hashing';

/**
 * Class responsible for transaction-related calculations.
 */
class TransactionCalculator {
  /**
   * Calculates the size of an outpoint in some serialization.
   * @returns {bigint} The size of outpoint, it is a 64-bit unsigned integer.
   */
  static outpointSerializedByteSize(): bigint {
    let size = 0n;
    size += BigInt(HASH_SIZE); // Previous tx ID
    size += 4n; // Index (u32)
    return size;
  }

  /**
   * Calculates the minimum required transaction relay fee based on the mass.
   * @param {bigint} mass - The mass of the transaction.
   * @returns {bigint} - The minimum required transaction relay fee.
   */
  static calcMinimumRequiredTransactionRelayFee(mass: bigint): bigint {
    let minimumFee = (mass * BigInt(MINIMUM_RELAY_TRANSACTION_FEE)) / 1000n;
    if (minimumFee === 0n) {
      minimumFee = BigInt(MINIMUM_RELAY_TRANSACTION_FEE);
    }
    return minimumFee < BigInt(MAX_SOMPI) ? minimumFee : BigInt(MAX_SOMPI);
  }

  /**
   * Checks if a transaction output is considered dust.
   * @param {TransactionOutput} transactionOutput - The transaction output to check.
   * @returns {boolean} - True if the transaction output is dust, false otherwise.
   */
  static isTransactionOutputDust(transactionOutput: TransactionOutput): boolean {
    if (transactionOutput.scriptPublicKey.script.length < 33) {
      return true;
    }
    const totalSerializedSize = this.transactionOutputSerializedByteSize(transactionOutput) + 148n;
    const value = BigInt(transactionOutput.value);
    const value1000 = value * 1000n;
    return value1000 / (3n * totalSerializedSize) < BigInt(MINIMUM_RELAY_TRANSACTION_FEE);
  }

  /**
   * Calculates the serialized byte size of a transaction.
   * @param {Transaction} tx - The transaction to calculate the size for.
   * @returns {bigint} - The serialized byte size of the transaction.
   */
  static transactionSerializedByteSize(tx: Transaction): bigint {
    let size = 0n;
    size += 2n; // Tx version (u16)
    size += 8n; // Number of inputs (u64)
    size += tx.inputs.reduce((acc, input) => acc + this.transactionInputSerializedByteSize(input), 0n);
    size += 8n; // number of outputs (u64)
    size += tx.outputs.reduce((acc, output) => acc + this.transactionOutputSerializedByteSize(output), 0n);
    size += 8n; // lock time (u64)
    size += BigInt(SUBNETWORK_ID_SIZE);
    size += 8n; // gas (u64)
    size += BigInt(HASH_SIZE); // payload hash
    size += 8n; // length of the payload (u64)
    size += BigInt(tx.payload.length);
    return size;
  }

  /**
   * Calculates the serialized byte size of a blank transaction.
   * @returns {bigint} - The serialized byte size of a blank transaction.
   */
  static blankTransactionSerializedByteSize(): bigint {
    let size = 0n;
    size += 2n; // Tx version (u16)
    size += 8n; // Number of inputs (u64)
    size += 8n; // number of outputs (u64)
    size += 8n; // lock time (u64)
    size += BigInt(SUBNETWORK_ID_SIZE);
    size += 8n; // gas (u64)
    size += BigInt(HASH_SIZE); // payload hash
    size += 8n; // length of the payload (u64)
    return size;
  }

  /**
   * Calculates the serialized byte size of a transaction input.
   * @param {TransactionInput} input - The transaction input to calculate the size for.
   * @returns {bigint} - The serialized byte size of the transaction input.
   */
  static transactionInputSerializedByteSize(input: TransactionInput): bigint {
    let size = 0n;
    size += this.outpointSerializedByteSize();
    size += 8n; // length of signature script (u64)
    size += BigInt(input.signatureScript.length);
    size += 8n; // sequence (uint64)
    return size;
  }

  /**
   * Calculates the serialized byte size of a transaction output.
   * @param {TransactionOutput} output - The transaction output to calculate the size for.
   * @returns {bigint} - The serialized byte size of the transaction output.
   */
  static transactionOutputSerializedByteSize(output: TransactionOutput): bigint {
    let size = 0n;
    size += 8n; // value (u64)
    size += 2n; // output.ScriptPublicKey.Version (u16)
    size += 8n; // length of script public key (u64)
    size += BigInt(output.scriptPublicKey.script.length);
    return size;
  }

  /**
   * Calculates the serialized byte size of a standard transaction output.
   * @returns {bigint} - The serialized byte size of a standard transaction output.
   */
  static transactionStandardOutputSerializedByteSize(): bigint {
    let size = 0n;
    size += 8n; // value (u64)
    size += 2n; // output.ScriptPublicKey.Version (u16)
    size += 8n; // length of script public key (u64)
    size += BigInt(SCRIPT_VECTOR_SIZE);
    return size;
  }
}

const STANDARD_OUTPUT_SIZE_PLUS_INPUT_SIZE = TransactionCalculator.transactionStandardOutputSerializedByteSize() + 148n;
const STANDARD_OUTPUT_SIZE_PLUS_INPUT_SIZE_3X = STANDARD_OUTPUT_SIZE_PLUS_INPUT_SIZE * 3n;
export { TransactionCalculator, STANDARD_OUTPUT_SIZE_PLUS_INPUT_SIZE, STANDARD_OUTPUT_SIZE_PLUS_INPUT_SIZE_3X };

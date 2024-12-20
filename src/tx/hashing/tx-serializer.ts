import { Transaction } from '../tx';
import { DataWriter, TxEncodingFlags } from './data-writer';

/**
 * Transaction serialize
 */
class TransactionSerializer extends DataWriter {
  constructor() {
    super();
  }

  /**
   * Serializers a transaction to the buffer.
   * @param {Transaction} tx - The transaction to serialize.
   * @param {TxEncodingFlags} encodingFlags - The encoding flags for the transaction.
   * @param {boolean} includeMassField - Whether to include the mass field.
   * @returns {TransactionSerializer} The serializer instance.
   */
  public static serialize(tx: Transaction, encodingFlags: TxEncodingFlags, includeMassField: boolean) {
    const serializer = new TransactionSerializer();
    serializer.writeUint16(tx.version);

    // inputs
    serializer.writeLength(tx.inputs.length);
    tx.inputs.forEach((input) => serializer.writeInput(input, encodingFlags));

    // outputs
    serializer.writeLength(tx.outputs.length);
    tx.outputs.forEach((output) => serializer.writeOutput(output));

    serializer.writeUint64(tx.lockTime);
    serializer.writeRawData(tx.subnetworkId.bytes);
    serializer.writeUint64(tx.gas);
    serializer.writeDataWithLength(tx.payload);

    // TODO:
    //      1. Avoid passing a boolean and hash the mass only if > 0 (requires setting the mass to 0 on BBT).
    //      2. Use TxEncodingFlags to avoid including the mass for tx ID

    if (includeMassField) {
      if (tx.mass > 0) serializer.writeUint64(tx.mass);
    }

    return serializer;
  }
}

export { TransactionSerializer };

import { Buffer } from 'buffer';
import { TransactionInput, TransactionOutpoint, TransactionOutput } from '../model';
import { ScriptPublicKey } from '../../consensus';

class DataWriter {
  private _buffer: Buffer;

  constructor() {
    this._buffer = Buffer.alloc(0);
  }

  /**
   * Getter for the buffer.
   * @returns {Buffer} The current buffer.
   */
  get buffer() {
    return this._buffer;
  }

  /**
   * Writes a boolean value to the buffer.
   * @param {boolean} data - The boolean value to write.
   * @returns {DataWriter} The writer instance.
   */
  // @ts-ignore
  public writeBool(data: boolean) {
    return this.writeUint8(data ? 1 : 0);
  }

  /**
   * Writes an 8-bit unsigned integer to the buffer.
   * @param {number} data - The 8-bit unsigned integer to write.
   * @returns {DataWriter} The writer instance.
   * @throws {Error} If the value is not a valid 8-bit unsigned integer.
   */
  public writeUint8(data: number) {
    if (data < 0 || data > 255) throw new Error(`Invalid uint 8 value: ${data}`);

    return this.writeRawData(Buffer.from([data]));
  }

  /**
   * Writes a 16-bit unsigned integer to the buffer.
   * @param {number} data - The 16-bit unsigned integer to write.
   * @returns {DataWriter} The writer instance.
   * @throws {Error} If the value is not a valid 16-bit unsigned integer.
   */
  public writeUint16(data: number) {
    if (data < 0 || data > 65535) throw new Error(`Invalid uint 16 value: ${data}`);

    return this.writeRawData(Buffer.from(new Uint16Array([data]).buffer));
  }

  /**
   * Writes a 32-bit unsigned integer to the buffer.
   * @param {number} data - The 32-bit unsigned integer to write.
   * @returns {DataWriter} The writer instance.
   * @throws {Error} If the value is not a valid 32-bit unsigned integer.
   */
  // @ts-ignore
  public writeUint32(data: number) {
    if (data < 0 || data > 4294967295) throw new Error(`Invalid uint 32 value: ${data}`);

    return this.writeRawData(Buffer.from(new Uint32Array([data]).buffer));
  }

  /**
   * Writes a length-prefixed value to the buffer.
   * @param {number} data - The length to write.
   * @returns {DataWriter} The writer instance.
   */
  public writeLength(data: number) {
    return this.writeUint64(BigInt(data));
  }

  /**
   * Writes a 64-bit unsigned integer to the buffer.
   * @param {bigint} data - The 64-bit unsigned integer to write.
   * @returns {DataWriter} The writer instance.
   * @throws {Error} If the value is not a valid 64-bit unsigned integer.
   */
  public writeUint64(data: bigint) {
    if (data < 0 || data > 18446744073709551615n) throw new Error(`Invalid uint 64 value: ${data}`);
    return this.writeRawData(Buffer.from(new BigUint64Array([data]).buffer));
  }

  /**
   * Writes data with a length prefix to the buffer.
   * @param {Uint8Array} data - The data to write.
   * @returns {DataWriter} The writer instance.
   */
  public writeDataWithLength(data: Uint8Array) {
    return this.writeLength(data.length).writeRawData(data);
  }

  /**
   * Writes raw data to the buffer.
   * @param {Uint8Array} buffer - The raw data to write.
   * @returns {DataWriter} The writer instance.
   */
  public writeRawData(buffer: Uint8Array) {
    this._buffer = Buffer.concat([this._buffer, buffer]);
    return this;
  }

  /**
   * Serializes a transaction input to the buffer.
   * @param {TransactionInput} input - The transaction input.
   * @param {TxEncodingFlags} encodingFlags - The encoding flags for the input.
   * @returns {DataWriter} The writer instance.
   */
  public writeInput(input: TransactionInput, encodingFlags: TxEncodingFlags) {
    this.writeOutpoint(input.previousOutpoint);
    if ((encodingFlags & TX_ENCODING_EXCLUDE_SIGNATURE_SCRIPT) !== TX_ENCODING_EXCLUDE_SIGNATURE_SCRIPT) {
      this.writeDataWithLength(input.signatureScript).writeUint8(input.sigOpCount);
    } else {
      this.writeDataWithLength(Buffer.from([]));
    }
    return this.writeUint64(input.sequence);
  }

  /**
   * Serializes a transaction outpoint to the buffer.
   * @param {TransactionOutpoint} outpoint - The transaction outpoint.
   * @returns {DataWriter} The writer instance.
   */
  public writeOutpoint(outpoint: TransactionOutpoint) {
    return this.writeRawData(outpoint.transactionId.toBytes()).writeRawData(
      new Uint8Array(new Uint32Array([outpoint.index]).buffer)
    );
  }

  /**
   * Serializes a transaction output to the buffer.
   * @param {TransactionOutput} output - The transaction output.
   * @returns {DataWriter} The writer instance.
   */
  public writeOutput(output: TransactionOutput) {
    return this.writeUint64(output.value).writeScriptPublicKey(output.scriptPublicKey);
  }

  /**
   * Serializes a script public key to the buffer.
   * @param {ScriptPublicKey} scriptPublicKey - The script public key.
   * @returns {DataWriter} The writer instance
   */
  public writeScriptPublicKey(scriptPublicKey: ScriptPublicKey) {
    return this.writeUint16(scriptPublicKey.version).writeDataWithLength(scriptPublicKey.script);
  }
}

/*
 * Transaction encoding flags
 * @remarks this is an 8-bit unsigned integer.
 */
export type TxEncodingFlags = number;

/**
 * Full transaction encoding flag.
 * @type {TxEncodingFlags}
 */
const TX_ENCODING_FULL: TxEncodingFlags = 0;

/**
 * Transaction encoding flag to exclude the signature script.
 * @type {TxEncodingFlags}
 */
const TX_ENCODING_EXCLUDE_SIGNATURE_SCRIPT: TxEncodingFlags = 1;
export { DataWriter, TX_ENCODING_FULL, TX_ENCODING_EXCLUDE_SIGNATURE_SCRIPT };

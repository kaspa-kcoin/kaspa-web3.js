import { ScriptBuilderError } from './error';
import { SizedEncodeInt } from './dataStack/sized-encode-int';
import { checkOpcodeRange, OpCodes } from './op-codes';
import * as C from './constants';
import { payToScriptHashScript, payToScriptHashSignatureScript } from './standard';
import { ScriptPublicKey } from '../consensus';
import { Buffer } from 'buffer';

/**
 * ScriptBuilder provides a facility for building custom scripts. It allows
 * you to push opcodes, ints, and data while respecting canonical encoding.
 */
class ScriptBuilder {
  private _script: Uint8Array[];

  /**
   * Getter for the script.
   */

  get script(): Uint8Array {
    const totalLength = this._script.reduce((acc, arr) => acc + arr.length, 0);
    const mergedArray = new Uint8Array(totalLength);
    let offset = 0;

    this._script.forEach((arr) => {
      mergedArray.set(arr, offset);
      offset += arr.length;
    });

    return mergedArray;
  }

  /**
   * Constructor to initialize the script list with default capacity.
   */
  constructor() {
    this._script = [];
  }

  /**
   * Method to add a single opcode to the script.
   * @param opcode - The opcode to add.
   * @returns The current instance of ScriptBuilder.
   * @throws ScriptBuilderError - Thrown when adding the opcode would exceed the maximum allowed script length.
   */
  addOp(opcode: number): ScriptBuilder {
    checkOpcodeRange(opcode);
    if (this._script.length >= C.MAX_SCRIPTS_SIZE) {
      throw new ScriptBuilderError(
        `Adding opcode ${opcode} would exceed the maximum allowed script length of ${C.MAX_SCRIPTS_SIZE}`
      );
    }

    this._script.push(new Uint8Array([opcode]));
    return this;
  }

  /**
   * Method to add multiple opcodes to the script.
   * @param opcodes - The opcodes to add.
   * @returns The current instance of ScriptBuilder.
   * @throws ScriptBuilderError - Thrown when adding the opcodes would exceed the maximum allowed script length.
   */
  addOps(opcodes: number[]): ScriptBuilder {
    opcodes.forEach((opcode) => checkOpcodeRange(opcode));

    if (this._script.length + opcodes.length > C.MAX_SCRIPTS_SIZE) {
      throw new ScriptBuilderError(
        `Adding ${opcodes.length} opcodes would exceed the maximum allowed script length of ${C.MAX_SCRIPTS_SIZE}`
      );
    }

    this._script.push(...opcodes.map((op) => new Uint8Array([op])));
    return this;
  }

  /**
   * Method to add data to the script.
   * @param data - The data to add.
   * @returns The current instance of ScriptBuilder.
   * @throws ScriptBuilderError - Thrown when adding the data would exceed the maximum allowed script length or element size.
   */
  addData(data: Uint8Array): ScriptBuilder {
    const dataSize = this.canonicalDataSize(data);

    // Pushes that would cause the script to exceed the largest allowed
    // script size would result in a non-canonical script.
    if (this._script.length + dataSize > C.MAX_SCRIPTS_SIZE) {
      throw new ScriptBuilderError(
        `Adding ${dataSize} bytes of data would exceed the maximum allowed script length of ${C.MAX_SCRIPTS_SIZE}`
      );
    }

    // Pushes larger than the max script element size would result in a
    // script that is not canonical.
    if (data.length > C.MAX_SCRIPT_ELEMENT_SIZE) {
      throw new ScriptBuilderError(
        `Adding a data element of ${data.length} bytes exceeds the maximum allowed script element size of ${C.MAX_SCRIPT_ELEMENT_SIZE}`
      );
    }

    this.addRawData(data);
    return this;
  }

  /**
   * Adds data to the script without checking the maximum script length.
   * @remarks This method may throw an exception with too large data.
   * @param data - The data to add.
   * @returns The current instance of ScriptBuilder.
   */
  public addDataUnchecked(data: Uint8Array): ScriptBuilder {
    this.addRawData(data);
    return this;
  }

  /**
   * Method to add a 64-bit integer to the script.
   * @param val - The integer value to add.
   * @returns The current instance of ScriptBuilder.
   * @throws ScriptBuilderError - Thrown when adding the integer would exceed the maximum allowed script length.
   */
  addI64(val: bigint): ScriptBuilder {
    // Pushes that would cause the script to exceed the largest allowed
    // script size would result in a non-canonical script.
    if (this._script.length + 1 > C.MAX_SCRIPTS_SIZE) {
      throw new ScriptBuilderError(
        `Adding integer ${val} would exceed the maximum allowed script length of ${C.MAX_SCRIPTS_SIZE}`
      );
    }

    // Fast path for small integers and Op1Negate.
    if (val === 0n) {
      this._script.push(new Uint8Array([OpCodes.Op0]));
      return this;
    }

    if (val === -1n || (val >= 1 && val <= 16)) {
      this._script.push(new Uint8Array([OpCodes.Op1 - 1 + Number(val)]));
      return this;
    }

    const bytes = new SizedEncodeInt(BigInt(val)).serialize();
    this.addData(bytes);
    return this;
  }

  /**
   * Method to add a 64-bit unsigned integer to the script.
   * @param val - The unsigned integer value to add.
   * @returns The current instance of ScriptBuilder.
   */
  addU64(val: bigint): ScriptBuilder {
    const buffer = new Uint8Array(8);
    new DataView(buffer.buffer).setBigUint64(0, val, true);

    const index = Array.from(buffer)
      .reverse()
      .findIndex((b) => b !== 0);
    const trimmedSize = 8 - (index !== -1 ? index : 8);
    const trimmed = buffer.slice(0, trimmedSize);
    return this.addData(trimmed);
  }

  /**
   * Method to add a lock time to the script.
   * @param lockTime - The lock time to add.
   * @returns The current instance of ScriptBuilder.
   */
  addLockTime(lockTime: bigint): ScriptBuilder {
    return this.addU64(lockTime);
  }

  /**
   * Method to add a sequence to the script.
   * @param sequence - The sequence to add.
   * @returns The current instance of ScriptBuilder.
   */
  addSequence(sequence: bigint): ScriptBuilder {
    return this.addU64(sequence);
  }

  /**
   * Converts the script to a hex string.
   * @returns {string} The hex string representation of the script.
   */
  toString(): string {
    return Buffer.from(this.script).toString('hex');
  }

  /**
   * Creates an equivalent pay-to-script-hash script.
   * Can be used to create a P2SH address.
   * @returns {ScriptPublicKey} The script public key for the transaction output.
   */
  createPayToScriptHashScript(): ScriptPublicKey {
    return payToScriptHashScript(this.script);
  }

  /**
   * Generates a signature script that fits a pay-to-script-hash script.
   * @param {Uint8Array} signature - The signature.
   * @returns {string} The hex string representation of the generated script.
   */
  encodePayToScriptHashSignatureScript(signature: Uint8Array): Uint8Array {
    const script = this.script;
    return payToScriptHashSignatureScript(script, signature);
  }

  /**
   * Internal method to add raw data to the script.
   * It automatically chooses canonical opcodes depending on the length of the data.
   * A zero length buffer will lead to a push of empty data onto the stack (OP_0).
   * No data limits are enforced with this function.
   * @param data - The raw data to add.
   */
  private addRawData(data: Uint8Array): void {
    const dataLen = data.length;

    // When the data consists of a single number that can be represented
    // by one of the "small integer" opcodes, use that opcode instead of
    // a data push opcode followed by the number.
    if (dataLen === 0 || (dataLen === 1 && data[0] === 0)) {
      this._script.push(new Uint8Array([OpCodes.Op0]));
      return;
    }

    if (dataLen === 1 && data[0] <= C.OP_SMALL_INT_MAX_VAL) {
      this._script.push(new Uint8Array([OpCodes.Op1 - 1 + data[0]]));
      return;
    }

    if (dataLen === 1 && data[0] === C.OP_1_NEGATE_VAL) {
      this._script.push(new Uint8Array([OpCodes.Op1Negate]));
      return;
    }

    // Use one of the OpData# opcodes if the length of the data is small
    // enough so the data push instruction is only a single byte.
    // Otherwise, choose the smallest possible OpPushData# opcode that
    // can represent the length of the data.
    if (dataLen <= C.OP_DATA_MAX_VAL) {
      this._script.push(new Uint8Array([C.OP_DATA_MIN_VAL - 1 + dataLen]));
    } else if (dataLen <= 0xff) {
      this._script.push(new Uint8Array([OpCodes.OpPushData1]));
      this._script.push(new Uint8Array([dataLen]));
    } else if (dataLen <= 0xffff) {
      this._script.push(new Uint8Array([OpCodes.OpPushData2]));
      this._script.push(
        ...Array.from(new Uint8Array(new Uint16Array([dataLen]).buffer)).map((b) => new Uint8Array([b]))
      );
    } else {
      this._script.push(new Uint8Array([OpCodes.OpPushData4]));
      this._script.push(
        ...Array.from(new Uint8Array(new Uint32Array([dataLen]).buffer)).map((b) => new Uint8Array([b]))
      );
    }

    this._script.push(...Array.from(data).map((b) => new Uint8Array([b])));
  }

  /**
   * Internal method to calculate the canonical data size.
   * @param data - The data to calculate the size for.
   * @returns The canonical size of the data.
   */
  private canonicalDataSize(data: Uint8Array): number {
    const dataLen = data.length;

    if (dataLen === 0 || (dataLen === 1 && (data[0] <= C.OP_SMALL_INT_MAX_VAL || data[0] === C.OP_1_NEGATE_VAL))) {
      return 1;
    }

    if (dataLen <= C.OP_DATA_MAX_VAL) {
      return 1 + dataLen;
    }
    if (dataLen <= 0xff) {
      return 2 + dataLen;
    }
    if (dataLen <= 0xffff) {
      return 3 + dataLen;
    }

    return 5 + dataLen;
  }
}

export { ScriptBuilder };

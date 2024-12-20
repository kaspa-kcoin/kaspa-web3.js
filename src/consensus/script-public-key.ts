import { Buffer } from 'buffer';

/**
 * Class representing a ScriptPublicKey.
 */
class ScriptPublicKey {
  /**
   * The version of the script.
   * @type {number}
   * @remarks This is a 16-bit unsigned integer.
   */
  public version: number;

  /**
   * The script as a Uint8Array.
   * @type {Uint8Array}
   * @remarks This is a max length of 36 bytes.
   */
  public script: Uint8Array;

  /**
   * Create a ScriptPublicKey.
   * @param {number} version - The version of the script.
   * @param {Uint8Array} script - The script as a Uint8Array.
   */
  constructor(version: number, script: Uint8Array) {
    this.version = version;
    this.script = script;
  }

  /**
   * Create a ScriptPublicKey from a hex string.
   * @param {string} hex - The hex string.
   * @returns {ScriptPublicKey} The ScriptPublicKey instance.
   * @throws {Error} If the hex string length is invalid.
   */
  static fromHex(hex: string): ScriptPublicKey {
    if (hex.length < 4) {
      throw new Error('Invalid hex length');
    }

    const bytes = new Uint8Array(Buffer.from(hex, 'hex'));
    const version = (bytes[1] << 8) | bytes[0];
    const script = bytes.slice(2);

    return new ScriptPublicKey(version, script);
  }

  /**
   * Convert the ScriptPublicKey to a hex string.
   * @returns {string} The hex string representation.
   */
  toHex(): string {
    const versionBytes = new Uint8Array([this.version & 0xff, (this.version >> 8) & 0xff]);
    const combined = new Uint8Array([...versionBytes, ...this.script]);
    return Buffer.from(combined).toString('hex');
  }

  /**
   * Get the script as a hex string.
   * @returns {string} The script hex string.
   */
  scriptHex(): string {
    return Buffer.from(this.script).toString('hex');
  }

  /**
   * Convert the ScriptPublicKey to a JSON string.
   * @returns {string} The JSON string representation.
   */
  toString(): string {
    return JSON.stringify(this);
  }

  /**
   * Create a ScriptPublicKey from a JSON string.
   * @param {string} json - The JSON string.
   * @returns {ScriptPublicKey} The ScriptPublicKey instance.
   * @throws {Error} If the JSON string cannot be parsed.
   */
  static fromJson(json: string): ScriptPublicKey {
    const obj = JSON.parse(json);
    if (!obj || typeof obj.version !== 'number' || !Array.isArray(obj.script)) {
      throw new Error('Failed to deserialize ScriptPublicKey');
    }
    return new ScriptPublicKey(obj.version, new Uint8Array(obj.script));
  }

  /**
   * Create a ScriptPublicKey from a version and script.
   * @param {number} version - The version of the script.
   * @param {Uint8Array} script - The script as a Uint8Array.
   * @returns {ScriptPublicKey} The ScriptPublicKey instance.
   */
  static fromVec(version: number, script: Uint8Array): ScriptPublicKey {
    return new ScriptPublicKey(version, script);
  }
}

export { ScriptPublicKey };

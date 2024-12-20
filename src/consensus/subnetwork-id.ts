import { Buffer } from 'buffer';

/**
 * Size of the Subnetwork ID in bytes.
 */
const SUBNETWORK_ID_SIZE = 20;

/**
 * Class representing a Subnetwork ID.
 */
class SubnetworkId {
  public readonly bytes: Uint8Array;

  /**
   * Creates an instance of SubnetworkId.
   * @param {Uint8Array} bytes - The bytes representing the Subnetwork ID.
   * @throws {Error} If the length of bytes is not equal to SUBNETWORK_ID_SIZE.
   */
  constructor(bytes: Uint8Array) {
    if (bytes.length !== SUBNETWORK_ID_SIZE) {
      throw new Error(`Invalid length: expected ${SUBNETWORK_ID_SIZE}, got ${bytes.length}`);
    }
    this.bytes = bytes;
  }

  /**
   * Creates a SubnetworkId from a single byte.
   * @param {number} b - The byte to create the Subnetwork ID from.
   * @returns {SubnetworkId} The created Subnetwork ID.
   */
  static fromByte(b: number): SubnetworkId {
    const bytes = new Uint8Array(SUBNETWORK_ID_SIZE);
    bytes[0] = b;
    return new SubnetworkId(bytes);
  }

  /**
   * Creates a SubnetworkId from an array of bytes.
   * @param {Uint8Array} bytes - The bytes to create the Subnetwork ID from.
   * @returns {SubnetworkId} The created Subnetwork ID.
   */
  static fromBytes(bytes: Uint8Array): SubnetworkId {
    return new SubnetworkId(bytes);
  }

  /**
   * Checks if the Subnetwork ID is a built-in ID.
   * @returns {boolean} True if the Subnetwork ID is built-in, otherwise false.
   */
  isBuiltin(): boolean {
    return this.equals(SUBNETWORK_ID_COINBASE) || this.equals(SUBNETWORK_ID_REGISTRY);
  }

  /**
   * Checks if the Subnetwork ID is a native ID.
   * @returns {boolean} True if the Subnetwork ID is native, otherwise false.
   */
  isNative(): boolean {
    return this.equals(SUBNETWORK_ID_NATIVE);
  }

  /**
   * Checks if the Subnetwork ID is either built-in or native.
   * @returns {boolean} True if the Subnetwork ID is built-in or native, otherwise false.
   */
  isBuiltinOrNative(): boolean {
    return this.isNative() || this.isBuiltin();
  }

  /**
   * Checks if this Subnetwork ID is equal to another Subnetwork ID.
   * @param {SubnetworkId} other - The other Subnetwork ID to compare with.
   * @returns {boolean} True if the Subnetwork IDs are equal, otherwise false.
   */
  equals(other: SubnetworkId): boolean {
    return this.bytes.every((byte, index) => byte === other.bytes[index]);
  }

  /**
   * Converts the Subnetwork ID to a hexadecimal string.
   * @returns {string} The hexadecimal representation of the Subnetwork ID.
   */
  toHex(): string {
    return Buffer.from(this.bytes).toString('hex');
  }

  /**
   * Creates a SubnetworkId from a hexadecimal string.
   * @param {string} hexStr - The hexadecimal string to create the Subnetwork ID from.
   * @returns {SubnetworkId} The created Subnetwork ID.
   */
  static fromHex(hexStr: string): SubnetworkId {
    const bytes = Buffer.from(hexStr, 'hex');
    return new SubnetworkId(bytes);
  }
  /**
   * Converts the Subnetwork ID to a string.
   * @returns {string} The string representation of the Subnetwork ID.
   */
  toString(): string {
    return this.toHex();
  }
}

/**
 * Predefined Subnetwork ID for native transactions.
 */
const SUBNETWORK_ID_NATIVE = SubnetworkId.fromByte(0);

/**
 * Predefined Subnetwork ID for coinbase transactions.
 */
const SUBNETWORK_ID_COINBASE = SubnetworkId.fromByte(1);

/**
 * Predefined Subnetwork ID for registry transactions.
 */
const SUBNETWORK_ID_REGISTRY = SubnetworkId.fromByte(2);

export { SubnetworkId, SUBNETWORK_ID_SIZE, SUBNETWORK_ID_NATIVE, SUBNETWORK_ID_COINBASE, SUBNETWORK_ID_REGISTRY };

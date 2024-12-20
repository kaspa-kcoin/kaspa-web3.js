import { AddressPrefix, AddressPrefixHelper } from './prefix';
import { AddressVersion, AddressVersionHelper } from './version';

/**
 * Class representing a Kaspa Address.
 */
class Address {
  public prefix: AddressPrefix;
  public version: AddressVersion;
  public payload: Uint8Array;

  /**
   * Create an Address.
   * @param {AddressPrefix} prefix - The address prefix.
   * @param {AddressVersion} version - The address version.
   * @param {Uint8Array} payload - The address payload.
   */
  constructor(prefix: AddressPrefix, version: AddressVersion, payload: Uint8Array) {
    if (!AddressPrefixHelper.isTest(prefix)) {
      if (payload.length !== AddressVersionHelper.publicKeyLen(version)) {
        throw new Error('Invalid payload length for the given version.');
      }
    }

    this.prefix = prefix;
    this.version = version;
    this.payload = payload;
  }

  /**
   * Create an Address from a string.
   * @param {string} addressStr - The address string.
   * @returns {Address} The Address instance.
   */
  public static fromString(addressStr: string): Address {
    const parts = addressStr.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid address format');
    }

    return this.decodePayload(AddressPrefixHelper.parse(parts[0]), parts[1]);
  }

  /**
   * Validate an address string.
   * @param {string} addressStr - The address string.
   * @returns {boolean} True if valid, false otherwise.
   */
  public static validate(addressStr: string): boolean {
    try {
      this.fromString(addressStr);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert the version to a string.
   * @returns {string} The version string.
   */
  public versionToString(): string {
    return this.version.toString();
  }

  /**
   * Convert the prefix to a string.
   * @returns {string} The prefix string.
   */
  public prefixToString(): string {
    return this.prefix;
  }

  /**
   * Convert the prefix to a string.
   * @returns {string} The prefix string.
   */
  public setPrefixFromStr(prefixStr: string): void {
    this.prefix = AddressPrefixHelper.parse(prefixStr);
  }

  /**
   * Convert the payload to a string.
   * @returns {string} The payload string.
   */
  public payloadToString(): string {
    return this.encodePayload();
  }

  /**
   * Get a shortened version of the address.
   * @param {number} n - The number of characters to show at the start and end.
   * @returns {string} The shortened address string.
   */
  public short(n: number): string {
    const payload = this.encodePayload();
    n = Math.min(n, payload.length / 4);
    return `${this.prefix}:${payload.substring(0, n)}....${payload.substring(payload.length - n)}`;
  }

  /**
   * Convert the address to a string.
   * @returns {string} The address string.
   */
  public toString(): string {
    return `${this.prefixToString()}:${this.encodePayload()}`;
  }

  /**
   * Check if this address is equal to another address.
   * @param {Address | null} other - The other address.
   * @returns {boolean} True if equal, false otherwise.
   */
  public equals(other: Address | null): boolean {
    if (other === null) {
      return false;
    }

    return (
      this.prefix === other.prefix &&
      this.version === other.version &&
      this.payload.every((value, index) => value === other.payload[index])
    );
  }

  /**
   * Encode the payload to a string.
   * @returns {string} The encoded payload string.
   */
  private encodePayload(): string {
    const fiveBitPayload = Address.conv8to5(new Uint8Array([this.version, ...this.payload]));
    const fiveBitPrefix = Array.from(this.prefix).map((c) => c.charCodeAt(0) & 0x1f);
    const checksum = Address.checksum(fiveBitPayload, fiveBitPrefix);
    // big endian
    const checksumBytes = new Uint8Array(new BigUint64Array([checksum]).buffer).reverse();

    const combined = new Uint8Array([...fiveBitPayload, ...Address.conv8to5(new Uint8Array(checksumBytes.slice(3)))]);

    const bytes = Array.from(combined).map((c) => Charset[c]);
    return String.fromCharCode(...bytes);
  }

  /**
   * Decode the payload from a string.
   * @param {AddressPrefix} prefix - The address prefix.
   * @param {string} address - The address string.
   * @returns {Address} The Address instance.
   */
  private static decodePayload(prefix: AddressPrefix, address: string): Address {
    const addressU5 = Array.from(address).map((c) => {
      const index = c.charCodeAt(0);
      if (index >= RevCharset.length) {
        throw new Error(`Character code ${index} is out of bounds`);
      }
      return RevCharset[index];
    });
    if (address.length < 8) {
      throw new Error('Bad payload');
    }

    const payloadU5 = new Uint8Array(addressU5.slice(0, address.length - 8));
    const checksumU5 = new Uint8Array(addressU5.slice(address.length - 8));
    const fiveBitPrefix = Array.from(prefix).map((c) => c.charCodeAt(0) & 0x1f);
    const checksumBytes = new Uint8Array([0, 0, 0, ...this.conv5to8(new Uint8Array(checksumU5))]);
    const checksum = new DataView(checksumBytes.buffer).getBigUint64(0, false);

    if (this.checksum(payloadU5, fiveBitPrefix) !== checksum) {
      throw new Error('Bad checksum');
    }

    const payloadU8 = this.conv5to8(payloadU5);
    return new Address(prefix, payloadU8[0] as AddressVersion, payloadU8.slice(1));
  }

  /**
   * Calculate the polymod of the values.
   * @param {Uint8Array} values - The values.
   * @returns {bigint} The polymod.
   */
  private static polymod(values: Uint8Array): bigint {
    let c = 1n;
    for (const d of values) {
      const c0 = c >> 35n;
      c = ((c & 0x07ffffffffn) << 5n) ^ BigInt(d);
      if ((c0 & 0x01n) !== 0n) c ^= 0x98f2bc8e61n;
      if ((c0 & 0x02n) !== 0n) c ^= 0x79b76d99e2n;
      if ((c0 & 0x04n) !== 0n) c ^= 0xf33e5fb3c4n;
      if ((c0 & 0x08n) !== 0n) c ^= 0xae2eabe2a8n;
      if ((c0 & 0x10n) !== 0n) c ^= 0x1e4f43e470n;
    }

    return c ^ 1n;
  }

  /**
   * Calculate the checksum of the payload and prefix.
   * @param {Uint8Array} payload - The payload.
   * @param {number[]} prefix - The prefix.
   * @returns {bigint} The checksum.
   */
  private static checksum(payload: Uint8Array, prefix: number[]): bigint {
    return this.polymod(new Uint8Array([...prefix, 0, ...payload, ...new Uint8Array(8)]));
  }

  /**
   * Convert 8-bit values to 5-bit values.
   * @param {Uint8Array} payload - The 8-bit payload.
   * @returns {Uint8Array} The 5-bit payload.
   */
  private static conv8to5(payload: Uint8Array): Uint8Array {
    const fiveBit = [];
    let buff = 0,
      bits = 0;
    for (const c of payload) {
      buff = (buff << 8) | c;
      bits += 8;
      while (bits >= 5) {
        bits -= 5;
        fiveBit.push((buff >> bits) & 0x1f);
        buff &= (1 << bits) - 1;
      }
    }

    if (bits > 0) {
      fiveBit.push((buff << (5 - bits)) & 0x1f);
    }
    return new Uint8Array(fiveBit);
  }

  /**
   * Convert 5-bit values to 8-bit values.
   * @param {Uint8Array} payload - The 5-bit payload.
   * @returns {Uint8Array} The 8-bit payload.
   */
  private static conv5to8(payload: Uint8Array): Uint8Array {
    const eightBit = [];
    let buff = 0,
      bits = 0;
    for (const c of payload) {
      buff = (buff << 5) | c;
      bits += 5;
      while (bits >= 8) {
        bits -= 8;
        eightBit.push((buff >> bits) & 0xff);
        buff &= (1 << bits) - 1;
      }
    }

    return new Uint8Array(eightBit);
  }
}

const Charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'.split('').map((c) => c.charCodeAt(0));

const RevCharset = [
  100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
  100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
  100, 100, 15, 100, 10, 17, 21, 20, 26, 30, 7, 5, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
  100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
  100, 100, 29, 100, 24, 13, 25, 9, 8, 23, 100, 18, 22, 31, 27, 19, 100, 1, 0, 3, 16, 11, 28, 12, 14, 6, 4, 2
];

export { Address, AddressPrefix, AddressPrefixHelper, AddressVersion, AddressVersionHelper };

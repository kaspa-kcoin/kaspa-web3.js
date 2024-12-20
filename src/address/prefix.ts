import { NetworkType } from '../consensus/network';

/**
 * Enum representing different address prefixes for various network types.
 */
enum AddressPrefix {
  Mainnet = 'kaspa',
  Testnet = 'kaspatest',
  Simnet = 'kaspasim',
  Devnet = 'kaspadev',
  A = 'a', // For testing
  B = 'b' // For testing
}

/**
 * Helper class for working with AddressPrefix.
 */
class AddressPrefixHelper {
  /**
   * Checks if the given prefix is a test prefix.
   * @param {AddressPrefix} prefix - The address prefix to check.
   * @returns {boolean} True if the prefix is a test prefix, false otherwise.
   */
  public static isTest(prefix: AddressPrefix): boolean {
    return prefix === AddressPrefix.A || prefix === AddressPrefix.B;
  }

  /**
   * Parses a string to an AddressPrefix.
   * @param {string} prefix - The string representation of the address prefix.
   * @returns {AddressPrefix} The corresponding AddressPrefix enum value.
   * @throws {Error} If the prefix is unknown.
   */
  public static parse(prefix: string): AddressPrefix {
    switch (prefix) {
      case 'kaspa':
        return AddressPrefix.Mainnet;
      case 'kaspatest':
        return AddressPrefix.Testnet;
      case 'kaspasim':
        return AddressPrefix.Simnet;
      case 'kaspadev':
        return AddressPrefix.Devnet;
      case 'a':
        return AddressPrefix.A;
      case 'b':
        return AddressPrefix.B;
      default:
        throw new Error(`Unknown prefix: ${prefix}`);
    }
  }

  /**
   * Converts an AddressPrefix to a NetworkType.
   * @param {AddressPrefix} addressPrefix - The address prefix to convert.
   * @returns {NetworkType} The corresponding NetworkType enum value.
   * @throws {Error} If the address prefix is unknown.
   */
  public static toNetworkType(addressPrefix: AddressPrefix): NetworkType {
    switch (addressPrefix) {
      case AddressPrefix.Mainnet:
        return NetworkType.Mainnet;
      case AddressPrefix.Testnet:
        return NetworkType.Testnet;
      case AddressPrefix.Simnet:
        return NetworkType.Simnet;
      case AddressPrefix.Devnet:
        return NetworkType.Devnet;
      default:
        throw new Error(`Unknown address prefix: ${addressPrefix}`);
    }
  }
}

export { AddressPrefix, AddressPrefixHelper };

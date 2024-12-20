import { AddressPrefix } from '../address';

/**
 * Enum representing different network types.
 */
enum NetworkType {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
  Devnet = 'devnet',
  Simnet = 'simnet'
}

/**
 * Class representing a network identifier.
 */
class NetworkId {
  public readonly networkType: NetworkType;
  public readonly suffix?: number;

  /**
   * Creates an instance of NetworkId.
   * @param {NetworkType} networkType - The type of the network.
   * @param {number} [suffix] - The optional suffix for the network.
   * @throws Will throw an error if the network type is Testnet and suffix is undefined.
   */
  constructor(networkType: NetworkType, suffix?: number) {
    if (networkType === NetworkType.Testnet && suffix === undefined) {
      throw new Error('Network suffix required for testnet');
    }

    this.networkType = networkType;
    this.suffix = suffix;
  }

  /**
   * Creates a new NetworkId instance with the given network type.
   * @param {NetworkType} networkType - The type of the network.
   * @returns {NetworkId} The new NetworkId instance.
   */
  public static from(networkType: NetworkType): NetworkId {
    return new NetworkId(networkType);
  }

  /**
   * Creates a new NetworkId instance with the given network type and suffix.
   * @param {NetworkType} networkType - The type of the network.
   * @param {number} suffix - The suffix for the network.
   * @returns {NetworkId} The new NetworkId instance.
   */
  public static withSuffix(networkType: NetworkType, suffix: number): NetworkId {
    return new NetworkId(networkType, suffix);
  }

  /**
   * Checks if the network type is Mainnet.
   * @returns {boolean} True if the network type is Mainnet, otherwise false.
   */
  public isMainnet(): boolean {
    return this.networkType === NetworkType.Mainnet;
  }

  /**
   * Gets the default P2P port for the network.
   * @returns {number} The default P2P port.
   * @throws Will throw an error if the network type is unknown.
   */
  public defaultP2PPort(): number {
    switch (this.networkType) {
      case NetworkType.Mainnet:
        return 16111;
      case NetworkType.Testnet:
        switch (this.suffix) {
          case 10:
            return 16211;
          case 11:
            return 16311;
          default:
            return 16411;
        }
      case NetworkType.Simnet:
        return 16511;
      case NetworkType.Devnet:
        return 16611;
      default:
        throw new Error('Unknown network type');
    }
  }

  /**
   * Converts the NetworkId to a string representation.
   * @returns {string} The string representation of the NetworkId.
   */
  public toString(): string {
    return this.suffix !== undefined ? `${this.networkType}-${this.suffix}` : this.networkType.toString();
  }

  /**
   * Creates a NetworkId instance from a string representation.
   * @param {string} networkName - The string representation of the network.
   * @returns {NetworkId} The NetworkId instance.
   */
  public static fromString(networkName: string): NetworkId {
    const parts = networkName.split('-');
    const networkType = NetworkType[parts[0] as keyof typeof NetworkType];
    const suffix = parts.length > 1 ? parseInt(parts[1]) : undefined;

    return new NetworkId(networkType, suffix);
  }

  /**
   * Iterates over all possible NetworkId instances.
   * @returns {NetworkId[]} An array of all possible NetworkId instances.
   */
  public static iter(): NetworkId[] {
    return [
      NetworkId.from(NetworkType.Mainnet),
      NetworkId.withSuffix(NetworkType.Testnet, 10),
      NetworkId.withSuffix(NetworkType.Testnet, 11),
      NetworkId.from(NetworkType.Devnet),
      NetworkId.from(NetworkType.Simnet)
    ];
  }

  /**
   * Checks if this NetworkId is equal to another NetworkId.
   * @param {NetworkId} other - The other NetworkId to compare with.
   * @returns {boolean} True if the NetworkIds are equal, otherwise false.
   */
  public equals(other: NetworkId): boolean {
    return this.networkType === other.networkType && this.suffix === other.suffix;
  }
}

/**
 * Helper class for NetworkType related operations.
 */
class NetworkTypeHelper {
  /**
   * Converts a NetworkType to an AddressPrefix.
   * @param {NetworkType} networkType - The type of the network.
   * @returns {AddressPrefix} The corresponding AddressPrefix.
   * @throws Will throw an error if the network type is unknown.
   */
  public static toAddressPrefix(networkType: NetworkType): AddressPrefix {
    switch (networkType) {
      case NetworkType.Mainnet:
        return AddressPrefix.Mainnet;
      case NetworkType.Testnet:
        return AddressPrefix.Testnet;
      case NetworkType.Simnet:
        return AddressPrefix.Simnet;
      case NetworkType.Devnet:
        return AddressPrefix.Devnet;
      default:
        throw new Error(`Unknown network type: ${networkType}`);
    }
  }
}

export { NetworkId, NetworkType, NetworkTypeHelper };

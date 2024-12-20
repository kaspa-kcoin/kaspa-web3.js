/**
 * Enum representing different address versions.
 */
enum AddressVersion {
  PubKey = 0,
  PubKeyECDSA = 1,
  ScriptHash = 8
}

/**
 * Helper class for AddressVersion related operations.
 */
class AddressVersionHelper {
  /**
   * Returns the length of the public key for a given address version.
   * @param {AddressVersion} version - The address version.
   * @returns {number} The length of the public key.
   * @throws Will throw an error if the version is unknown.
   */
  public static publicKeyLen(version: AddressVersion): number {
    switch (version) {
      case AddressVersion.PubKey:
        return 32;
      case AddressVersion.PubKeyECDSA:
        return 33;
      case AddressVersion.ScriptHash:
        return 32;
      default:
        throw new Error(`Unknown version: ${version}`);
    }
  }
}

export { AddressVersion, AddressVersionHelper };

import { AddressVersion } from '../address';
import { OpCodes } from './op-codes';
import { MAX_SCRIPT_PUBLIC_KEY_VERSION } from './constants';
import { ScriptPublicKey } from '../consensus';

/**
 * Enum representing different script classes.
 */
enum ScriptClass {
  /**
   * None of the recognized forms
   */
  NonStandard = 0,

  /**
   * Pay to pubkey
   */
  PubKey,

  /**
   * Pay to pubkey ECDSA
   */
  PubKeyECDSA,

  /**
   * Pay to script hash
   */
  ScriptHash
}

/**
 * Helper class for working with ScriptClass enums.
 */
class ScriptClassHelper {
  /**
   * Determines the script class from a ScriptPublicKey object.
   * @param {ScriptPublicKey} scriptPublicKey - The ScriptPublicKey object.
   * @returns {ScriptClass} - The determined ScriptClass.
   */
  static fromScriptPublicKey(scriptPublicKey: ScriptPublicKey): ScriptClass {
    const scriptPublicKeyBytes = scriptPublicKey.script;
    if (scriptPublicKey.version === MAX_SCRIPT_PUBLIC_KEY_VERSION) {
      if (this.isPayToPubKey(scriptPublicKeyBytes)) {
        return ScriptClass.PubKey;
      } else if (this.isPayToPubKeyECDSA(scriptPublicKeyBytes)) {
        return ScriptClass.PubKeyECDSA;
      } else if (this.isPayToScriptHash(scriptPublicKeyBytes)) {
        return ScriptClass.ScriptHash;
      } else {
        return ScriptClass.NonStandard;
      }
    } else {
      return ScriptClass.NonStandard;
    }
  }

  /**
   * Checks if the script is a pay-to-pubkey transaction.
   * @param {Uint8Array} scriptPublicKey - The script public key bytes.
   * @returns {boolean} - True if it is a pay-to-pubkey transaction, false otherwise.
   */
  static isPayToPubKey(scriptPublicKey: Uint8Array): boolean {
    return (
      scriptPublicKey.length === 34 &&
      scriptPublicKey[0] === OpCodes.OpData32 &&
      scriptPublicKey[33] === OpCodes.OpCheckSig
    );
  }

  /**
   * Checks if the script is an ECDSA pay-to-pubkey transaction.
   * @param {Uint8Array} scriptPublicKey - The script public key bytes.
   * @returns {boolean} - True if it is an ECDSA pay-to-pubkey transaction, false otherwise.
   */
  static isPayToPubKeyECDSA(scriptPublicKey: Uint8Array): boolean {
    return (
      scriptPublicKey.length === 35 &&
      scriptPublicKey[0] === OpCodes.OpData33 &&
      scriptPublicKey[34] === OpCodes.OpCheckSigECDSA
    );
  }

  /**
   * Checks if the script is in the standard pay-to-script-hash (P2SH) format.
   * @param {Uint8Array} scriptPublicKey - The script public key bytes.
   * @returns {boolean} - True if it is in the P2SH format, false otherwise.
   */
  static isPayToScriptHash(scriptPublicKey: Uint8Array): boolean {
    return (
      scriptPublicKey.length === 35 &&
      scriptPublicKey[0] === OpCodes.OpBlake2b &&
      scriptPublicKey[1] === OpCodes.OpData32 &&
      scriptPublicKey[34] === OpCodes.OpEqual
    );
  }

  /**
   * Converts the ScriptClass enum to its string representation.
   * @param {ScriptClass} scriptClass - The ScriptClass enum value.
   * @returns {string} - The string representation of the ScriptClass.
   */
  static asString(scriptClass: ScriptClass): string {
    switch (scriptClass) {
      case ScriptClass.NonStandard:
        return this.NON_STANDARD;
      case ScriptClass.PubKey:
        return this.PUB_KEY;
      case ScriptClass.PubKeyECDSA:
        return this.PUB_KEY_ECDSA;
      case ScriptClass.ScriptHash:
        return this.SCRIPT_HASH;
      default:
        throw new Error(`Invalid script class: ${scriptClass}`);
    }
  }

  /**
   * Parses a string to its corresponding ScriptClass enum value.
   * @param {string} scriptClass - The string representation of the ScriptClass.
   * @returns {ScriptClass} - The corresponding ScriptClass enum value.
   */
  static fromString(scriptClass: string): ScriptClass {
    switch (scriptClass.toLowerCase()) {
      case this.NON_STANDARD:
        return ScriptClass.NonStandard;
      case this.PUB_KEY:
        return ScriptClass.PubKey;
      case this.PUB_KEY_ECDSA:
        return ScriptClass.PubKeyECDSA;
      case this.SCRIPT_HASH:
        return ScriptClass.ScriptHash;
      default:
        throw new Error(`Invalid script class: ${scriptClass}`);
    }
  }

  /**
   * Converts a Version enum to its corresponding ScriptClass enum value.
   * @param {AddressVersion} version - The AddressVersion enum value.
   * @returns {ScriptClass} - The corresponding ScriptClass enum value.
   */
  static fromVersion(version: AddressVersion): ScriptClass {
    switch (version) {
      case AddressVersion.PubKey:
        return ScriptClass.PubKey;
      case AddressVersion.PubKeyECDSA:
        return ScriptClass.PubKeyECDSA;
      case AddressVersion.ScriptHash:
        return ScriptClass.ScriptHash;
      default:
        throw new Error(`Invalid address version: ${version}`);
    }
  }

  static versionOf(scriptClass: ScriptClass): number {
    switch (scriptClass) {
      case ScriptClass.NonStandard:
        return 0;
      case ScriptClass.PubKey:
      case ScriptClass.PubKeyECDSA:
      case ScriptClass.ScriptHash:
        return MAX_SCRIPT_PUBLIC_KEY_VERSION;
      default:
        throw new Error(`Invalid script class: ${scriptClass}`);
    }
  }

  private static readonly NON_STANDARD = 'nonstandard';
  private static readonly PUB_KEY = 'pubkey';
  private static readonly PUB_KEY_ECDSA = 'pubkeyecdsa';
  private static readonly SCRIPT_HASH = 'scripthash';
}

export { ScriptClass, ScriptClassHelper };

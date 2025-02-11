import { ScriptBuilder, TxScriptError, OpCodes, ScriptClass, ScriptClassHelper } from '../index.ts';
import { Address, AddressPrefix, AddressVersion } from '../../../address';
import { ScriptPublicKey } from '../../../consensus';
import { blake2b } from '@noble/hashes/blake2b';

export { multisigRedeemScriptSchnorr, multisigRedeemScriptECDSA } from './multisig.ts';

/**
 * Creates a new script to pay a transaction output to a 32-byte pubkey.
 *
 * @param {Uint8Array} addressPayload - The public key payload.
 * @returns {Uint8Array} The script for the transaction output.
 * @throws {Error} If the address payload length is not 32 bytes.
 */
function payToPubKey(addressPayload: Uint8Array): Uint8Array {
  if (addressPayload.length !== 32) {
    throw new Error('Invalid address payload length');
  }
  return new Uint8Array([OpCodes.OpData32, ...addressPayload, OpCodes.OpCheckSig]);
}

/**
 * Creates a new script to pay a transaction output to a 33-byte ECDSA pubkey.
 *
 * @param {Uint8Array} addressPayload - The public key payload.
 * @returns {Uint8Array} The script for the transaction output.
 * @throws {Error} If the address payload length is not 33 bytes.
 */
function payToPubKeyECDSA(addressPayload: Uint8Array): Uint8Array {
  if (addressPayload.length !== 33) {
    throw new Error('Invalid address payload length');
  }
  return new Uint8Array([OpCodes.OpData33, ...addressPayload, OpCodes.OpCheckSigECDSA]);
}

/**
 * Creates a new script to pay a transaction output to a script hash.
 * It is expected that the input is a valid hash.
 *
 * @param {Uint8Array} scriptHash - The script hash.
 * @returns {Uint8Array} The script for the transaction output.
 * @throws {Error} If the script hash length is not 32 bytes.
 */
function payToScriptHash(scriptHash: Uint8Array): Uint8Array {
  if (scriptHash.length !== 32) {
    throw new Error('Invalid script hash length');
  }
  return new Uint8Array([OpCodes.OpBlake2b, OpCodes.OpData32, ...scriptHash, OpCodes.OpEqual]);
}

/**
 * Creates a new script to pay a transaction output to the specified address.
 *
 * @param {Address} address - The address to which the transaction output will be paid.
 * @returns {ScriptPublicKey} The script for the transaction output.
 * @throws {Error} If the address version is unknown.
 */
function payToAddressScript(address: Address): ScriptPublicKey {
  let script: Uint8Array;
  switch (address.version) {
    case AddressVersion.PubKey:
      script = payToPubKey(address.payload);
      break;
    case AddressVersion.PubKeyECDSA:
      script = payToPubKeyECDSA(address.payload);
      break;
    case AddressVersion.ScriptHash:
      script = payToScriptHash(address.payload);
      break;
    default:
      throw new Error('Unknown address version');
  }

  const version = ScriptClassHelper.versionOf(ScriptClassHelper.fromVersion(address.version));
  return new ScriptPublicKey(version, script);
}

/**
 * Takes a script and returns an equivalent pay-to-script-hash script.
 *
 * @param {Uint8Array} redeemScript - The redeem script.
 * @returns {ScriptPublicKey} The script public key for the transaction output.
 */
function payToScriptHashScript(redeemScript: Uint8Array): ScriptPublicKey {
  const redeemScriptHash = blake2b(redeemScript, { dkLen: 32 });
  const script = payToScriptHash(redeemScriptHash);
  return new ScriptPublicKey(ScriptClassHelper.versionOf(ScriptClass.ScriptHash), script);
}

/**
 * Generates a signature script that fits a pay-to-script-hash script.
 *
 * @param {Uint8Array} redeemScript - The redeem script.
 * @param {Uint8Array} signature - The signature.
 * @returns {Uint8Array} The signature script for the transaction output.
 */
function payToScriptHashSignatureScript(redeemScript: Uint8Array, signature: Uint8Array): Uint8Array {
  const redeemScriptAsData = new ScriptBuilder().addData(redeemScript).script;
  return new Uint8Array([...signature, ...redeemScriptAsData]);
}

/**
 * Extracts the address encoded in a script public key.
 *
 * Notes:
 * - This function only works for 'standard' transaction script types.
 *   Any data such as public keys which are invalid will return the
 *   `TxScriptError.PubKeyFormat` error.
 * - In case a ScriptClass is needed by the caller, call `ScriptClassHelper.fromVersion(address.version)`
 *   or use `address.version` directly instead, where address is the successfully
 *   returned address.
 *
 * @param {ScriptPublicKey} scriptPublicKey - The script public key.
 * @param {AddressPrefix} prefix - The address prefix.
 * @returns {Address} The extracted address.
 * @throws {TxScriptError} If the script public key format is invalid.
 */
function extractScriptPubKeyAddress(scriptPublicKey: ScriptPublicKey, prefix: AddressPrefix): Address {
  const scriptClass = ScriptClassHelper.fromScriptPublicKey(scriptPublicKey);
  if (scriptPublicKey.version > ScriptClassHelper.versionOf(scriptClass)) {
    throw new TxScriptError('PubKeyFormat');
  }
  const script = scriptPublicKey.script;
  switch (scriptClass) {
    case ScriptClass.NonStandard:
      throw new TxScriptError('PubKeyFormat');
    case ScriptClass.PubKey:
      return new Address(prefix, AddressVersion.PubKey, script.slice(1, 33));
    case ScriptClass.PubKeyECDSA:
      return new Address(prefix, AddressVersion.PubKeyECDSA, script.slice(1, 34));
    case ScriptClass.ScriptHash:
      return new Address(prefix, AddressVersion.ScriptHash, script.slice(2, 34));
    default:
      throw new TxScriptError('PubKeyFormat');
  }
}

export { payToAddressScript, payToScriptHashScript, payToScriptHashSignatureScript, extractScriptPubKeyAddress };

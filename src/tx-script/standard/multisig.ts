import { OpCodes } from '../op-codes';
import { ScriptBuilder, MultisigCreateError } from '../index';

/**
 * Generates a multisig redeem script.
 *
 * @param {Iterable<Uint8Array>} pubKeys - The public keys for the multisig.
 * @param {number} required - The number of required signatures.
 * @returns {Uint8Array} The generated redeem script.
 * @throws {MultisigCreateError} If the number of required signatures is invalid.
 */
function multisigRedeemScriptInternal(pubKeys: Iterable<Uint8Array>, required: number): Uint8Array {
  const pubKeysArray = Array.from(pubKeys);
  if (pubKeysArray.length < required) {
    throw new MultisigCreateError('Too many required signatures');
  }

  const builder = new ScriptBuilder();
  builder.addI64(BigInt(required));

  let count = 0;
  for (const pubKey of pubKeysArray) {
    count += 1;
    builder.addData(pubKey);
  }

  if (count < required) {
    throw new MultisigCreateError('Too many required signatures');
  }
  if (count === 0) {
    throw new MultisigCreateError('Empty keys');
  }

  builder.addI64(BigInt(count));
  builder.addOp(OpCodes.OpCheckMultiSig);

  return builder.script;
}

/**
 * Generates a multisig redeem script for Schnorr signatures.
 *
 * @param {Iterable<Uint8Array>} pubKeys - The public keys for the multisig.
 * @param {number} required - The number of required signatures.
 * @returns {Uint8Array} The generated redeem script.
 * @throws {MultisigCreateError} If a public key has an invalid length.
 */
function multisigRedeemScriptSchnorr(pubKeys: Iterable<Uint8Array>, required: number): Uint8Array {
  // check pubKey's byte length is 32
  for (const pubKey of pubKeys) {
    if (pubKey.length !== 32) {
      throw new MultisigCreateError('Invalid public key length');
    }
  }

  return multisigRedeemScriptInternal(pubKeys, required);
}

/**
 * Generates a multisig redeem script for ECDSA signatures.
 *
 * @param {Iterable<Uint8Array>} pubKeys - The public keys for the multisig.
 * @param {number} required - The number of required signatures.
 * @returns {Uint8Array} The generated redeem script.
 * @throws {MultisigCreateError} If a public key has an invalid length.
 */
function multisigRedeemScriptECDSA(pubKeys: Iterable<Uint8Array>, required: number): Uint8Array {
  // check pubKey's byte length is 33
  for (const pubKey of pubKeys) {
    if (pubKey.length !== 33) {
      throw new MultisigCreateError('Invalid public key length');
    }
  }

  return multisigRedeemScriptInternal(pubKeys, required);
}

export { multisigRedeemScriptSchnorr, multisigRedeemScriptECDSA };

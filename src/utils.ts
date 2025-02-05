import { NetworkType, NetworkTypeHelper, ScriptPublicKey } from './consensus';
import { Address } from './address';
import { extractScriptPubKeyAddress } from './tx/script/standard';

/**
 * Constant representing the number of Sompi per Kaspa.
 */
const SOMPI_PER_KASPA = 100_000_000n;

/**
 * Converts a string representation of a Kaspa amount to its equivalent in Sompi.
 *
 * @param {string} amount - The amount in Kaspa as a string.
 * @returns {bigint} - The equivalent amount in Sompi as a bigint.
 */
function kaspaToSompi(amount: string | number): bigint {
  amount = amount.toString();
  const dotIdx = amount.indexOf('.');
  if (dotIdx === -1) {
    return BigInt(amount) * SOMPI_PER_KASPA;
  }

  const integer = BigInt(amount.slice(0, dotIdx)) * SOMPI_PER_KASPA;
  const decimal = amount.slice(dotIdx + 1);
  const decimalLen = decimal.length;
  let decimalValue: bigint;

  if (decimalLen === 0) {
    decimalValue = 0n;
  } else if (decimalLen <= 8) {
    decimalValue = BigInt(decimal) * 10n ** BigInt(8 - decimalLen);
  } else {
    // TODO - discuss how to handle values longer than 8 decimal places
    // (reject, truncate, ceil(), etc.)
    decimalValue = BigInt(decimal.slice(0, 8));
  }

  return integer + decimalValue;
}

function addressFromScriptPublicKey(scriptPublicKey: ScriptPublicKey, network: NetworkType): Address {
  return extractScriptPubKeyAddress(scriptPublicKey, NetworkTypeHelper.toAddressPrefix(network));
}

/**
 * Calculates the maximum value of an unsigned integer with the given number of bits.
 * @param {number} numberOfBits - The number of bits.
 * @returns {bigint} The maximum value of the unsigned integer.
 * @throws Will throw an error if the number of bits is not a positive multiple of 8 or exceeds 256.
 */
function maxValueOfU(numberOfBits: number): bigint {
  if (numberOfBits <= 0 || numberOfBits % 8 !== 0) {
    throw new Error('numberOfBits must be a positive multiple of 8');
  }
  if (numberOfBits > 256) {
    throw new Error('numberOfBits must not exceed 256');
  }
  return (1n << BigInt(numberOfBits)) - 1n;
}

export { SOMPI_PER_KASPA, kaspaToSompi, addressFromScriptPublicKey, maxValueOfU };

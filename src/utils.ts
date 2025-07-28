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
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) {
      throw new Error('Amount must be a finite number');
    }
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    amount = amount.toString();
  }

  // Trim whitespace and validate input
  amount = amount.trim();
  if (!amount || amount === '.') {
    throw new Error('Invalid amount format');
  }

  // Check for negative amounts
  if (amount.startsWith('-')) {
    throw new Error('Amount cannot be negative');
  }

  // Handle scientific notation by rejecting it
  if (amount.toLowerCase().includes('e')) {
    throw new Error('Scientific notation is not supported');
  }

  // Validate format (only digits and at most one decimal point)
  if (!/^\d*\.?\d*$/.test(amount)) {
    throw new Error('Invalid amount format');
  }

  const dotIdx = amount.indexOf('.');
  if (dotIdx === -1) {
    // No decimal point
    return BigInt(amount) * SOMPI_PER_KASPA;
  }

  const integer = amount.slice(0, dotIdx);
  const decimal = amount.slice(dotIdx + 1);

  // Validate that we don't have empty integer and decimal parts
  if (integer === '' && decimal === '') {
    throw new Error('Invalid amount format');
  }

  const integerPart = integer === '' ? 0n : BigInt(integer);
  const integerValue = integerPart * SOMPI_PER_KASPA;

  const decimalLen = decimal.length;
  let decimalValue: bigint;

  if (decimalLen === 0) {
    decimalValue = 0n;
  } else if (decimalLen <= 8) {
    decimalValue = BigInt(decimal) * 10n ** BigInt(8 - decimalLen);
  } else {
    // Truncate to 8 decimal places (Sompi precision)
    decimalValue = BigInt(decimal.slice(0, 8));
  }

  return integerValue + decimalValue;
}

/**
 * Converts an amount in Sompi to its equivalent in Kaspa as a number.
 *
 * @param {bigint} amount - The amount in Sompi as a bigint.
 * @returns {number} - The equivalent amount in Kaspa as a number with up to 8 decimal places.
 * @throws {Error} - Throws an error for negative amounts.
 */
function sompiToKaspa(amount: bigint): number {
  if (amount < 0n) {
    throw new Error('Amount cannot be negative');
  }

  const integerPart = amount / SOMPI_PER_KASPA;
  const remainder = amount % SOMPI_PER_KASPA;

  if (remainder === 0n) {
    return Number(integerPart.toString());
  }

  // Convert remainder to decimal string with proper padding
  const decimalStr = remainder.toString().padStart(8, '0');

  // Remove trailing zeros
  const trimmedDecimal = decimalStr.replace(/0+$/, '');

  const kaspaString = `${integerPart.toString()}.${trimmedDecimal}`;

  // Convert to number only at the final step
  return Number(kaspaString);
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

export { SOMPI_PER_KASPA, kaspaToSompi, sompiToKaspa, addressFromScriptPublicKey, maxValueOfU };

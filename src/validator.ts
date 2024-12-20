/**
 * Validates if a number is an 8-bit unsigned integer.
 * @param {number | bigint} value - The number to validate.
 * @param {string} variableName - The name of the variable being validated.
 * @throws Will throw an error if the number is not a valid 8-bit unsigned integer.
 */
function validateU8(value: number | bigint, variableName: string): void {
  if (BigInt(value) < 0n || BigInt(value) > maxValueOfU(8)) {
    throw new Error(`${variableName} is not a valid 8-bit unsigned integer`);
  }
}

/**
 * Validates if a number is a 16-bit unsigned integer.
 * @param {number | bigint} value - The number to validate.
 * @param {string} variableName - The name of the variable being validated.
 * @throws Will throw an error if the number is not a valid 16-bit unsigned integer.
 */
function validateU16(value: number | bigint, variableName: string): void {
  if (BigInt(value) < 0n || BigInt(value) > maxValueOfU(16)) {
    throw new Error(`${variableName} is not a valid 16-bit unsigned integer`);
  }
}

/**
 * Validates if a number is a 32-bit unsigned integer.
 * @param {number | bigint} value - The number to validate.
 * @param {string} variableName - The name of the variable being validated.
 * @throws Will throw an error if the number is not a valid 32-bit unsigned integer.
 */
function validateU32(value: number | bigint, variableName: string): void {
  if (BigInt(value) < 0n || BigInt(value) > maxValueOfU(32)) {
    throw new Error(`${variableName} is not a valid 32-bit unsigned integer`);
  }
}

/**
 * Validates if a number is a 64-bit unsigned integer.
 * @param {bigint} value - The number to validate.
 * @param {string} variableName - The name of the variable being validated.
 * @throws Will throw an error if the number is not a valid 64-bit unsigned integer.
 */
function validateU64(value: bigint, variableName: string): void {
  if (value < 0n || value > maxValueOfU(64)) {
    throw new Error(`${variableName} is not a valid 64-bit unsigned integer`);
  }
}

/**
 * Validates if a number is a 128-bit unsigned integer.
 * @param {bigint} value - The number to validate.
 * @param {string} variableName - The name of the variable being validated.
 * @throws Will throw an error if the number is not a valid 128-bit unsigned integer.
 */
function validateU128(value: bigint, variableName: string): void {
  if (value < 0n || value > maxValueOfU(128)) {
    throw new Error(`${variableName} is not a valid 128-bit unsigned integer`);
  }
}

/**
 * Validates if a number is a 256-bit unsigned integer.
 * @param {bigint} value - The number to validate.
 * @param {string} variableName - The name of the variable being validated.
 * @throws Will throw an error if the number is not a valid 256-bit unsigned integer.
 */
function validateU256(value: bigint, variableName: string): void {
  if (value < 0n || value > maxValueOfU(256)) {
    throw new Error(`${variableName} is not a valid 256-bit unsigned integer`);
  }
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

export { validateU8, validateU16, validateU32, validateU64, validateU128, validateU256 };

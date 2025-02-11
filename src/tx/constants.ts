import { OpCodes } from './script/op-codes/codes.ts';

/**
 * BLOCK_VERSION represents the current block version.
 * @remarks this is a 16-bit unsigned integer
 */
export const BLOCK_VERSION: number = 1;

/**
 * TX_VERSION is the current latest supported transaction version.
 * @remarks this is a 16-bit unsigned integer
 */
export const TX_VERSION: number = 0;

/**
 * LOCK_TIME_THRESHOLD is the threshold for lock time.
 * @remarks this is a 64-bit unsigned integer
 */
export const LOCK_TIME_THRESHOLD: bigint = 500_000_000_000n;

/**
 * MAX_SCRIPT_PUBLIC_KEY_VERSION is the current latest supported public key
 * script version.
 * @remarks this is a 16-bit unsigned integer
 */
export const MAX_SCRIPT_PUBLIC_KEY_VERSION: number = 0;

/**
 * SOMPI_PER_KASPA is the number of sompi in one kaspa (1 KAS).
 * @remarks this is a 64-bit unsigned integer
 */
export const SOMPI_PER_KASPA: bigint = 100_000_000n;

/**
 * STORAGE_MASS_PARAMETER is the parameter for scaling inverse KAS value to
 * mass units (KIP-0009).
 * @remarks this is a 64-bit unsigned integer
 */
export const STORAGE_MASS_PARAMETER: bigint = SOMPI_PER_KASPA * 10_000n;

/**
 * MAX_SOMPI is the maximum transaction amount allowed in sompi.
 * @remarks this is a 64-bit unsigned integer
 */
export const MAX_SOMPI: bigint = 29_000_000_000n * SOMPI_PER_KASPA;

/**
 * MAX_TX_IN_SEQUENCE_NUM is the maximum sequence number the sequence field
 * of a transaction input can be.
 * @remarks this is a 64-bit unsigned integer
 */
export const MAX_TX_IN_SEQUENCE_NUM: bigint = (1n << 64n) - 1n;

/**
 * SEQUENCE_LOCK_TIME_MASK is a mask that extracts the relative lock time
 * when masked against the transaction input sequence number.
 * @remarks this is a 64-bit unsigned integer
 */
export const SEQUENCE_LOCK_TIME_MASK: bigint = 0x00000000ffffffffn;

/**
 * SEQUENCE_LOCK_TIME_DISABLED is a flag that if set on a transaction input's
 * sequence number, the sequence number will not be interpreted as a relative
 * lock time.
 * @remarks this is a 64-bit unsigned integer
 */
export const SEQUENCE_LOCK_TIME_DISABLED: bigint = 1n << 63n;

/**
 * UNACCEPTED_DAA_SCORE is used for UtxoEntries that were created by
 * transactions in the mempool, or otherwise not-yet-accepted transactions.
 * @remarks this is a 64-bit unsigned integer
 */
export const UNACCEPTED_DAA_SCORE: bigint = (1n << 64n) - 1n;

/**
 * Size of the signature in bytes.
 * 1 byte for OP_DATA_65 + 64 bytes for the length of the signature + 1 byte for the signature hash type.
 */
export const SIGNATURE_SIZE: bigint = 1n + 64n + 1n;

/**
 * Minimum relay transaction fee in sompi.
 * This is the minimum fee required for a transaction to be accepted into the mempool and relayed.
 */
export const MINIMUM_RELAY_TRANSACTION_FEE: bigint = 1000n;

/**
 * Maximum standard transaction mass.
 * This is the maximum mass allowed for transactions that are considered standard and will be relayed and considered for mining.
 */
export const MAXIMUM_STANDARD_TRANSACTION_MASS: bigint = 100_000n;

/**
 * Size of the script vector in bytes.
 */
export const SCRIPT_VECTOR_SIZE: number = 520;

/**
 * Default script allocation size.
 */
export const DEFAULT_SCRIPT_ALLOC = 512;

/**
 * Maximum stack size.
 */
export const MAX_STACK_SIZE: number = 244;

/**
 * Maximum size of scripts.
 */
export const MAX_SCRIPTS_SIZE: number = 10000;

/**
 * Maximum size of a script element.
 */
export const MAX_SCRIPT_ELEMENT_SIZE: number = 520;

/**
 * Maximum number of operations per script.
 */
export const MAX_OPS_PER_SCRIPT: number = 201;

/**
 * Maximum number of public keys per multisig.
 */
export const MAX_PUB_KEYS_PER_MUTLTISIG: number = 20;

/**
 * The last opcode that does not count toward operations.
 * Note that this includes OP_RESERVED which counts as a push operation.
 */
export const NO_COST_OPCODE: number = 0x60;

/**
 * First value in the range formed by the "small integer" Op# opcodes.
 */
export const OP_SMALL_INT_MIN_VAL: number = 1;

/**
 * Last value in the range formed by the "small integer" Op# opcodes.
 */
export const OP_SMALL_INT_MAX_VAL: number = 16;

/**
 * First value in the range formed by OpData# opcodes (where opcode == value).
 */
export const OP_DATA_MIN_VAL: number = OpCodes.OpData1;

/**
 * Last value in the range formed by OpData# opcodes (where opcode == value).
 */
export const OP_DATA_MAX_VAL: number = OpCodes.OpData75;

/**
 * Minus 1 value.
 */
export const OP_1_NEGATE_VAL: number = 0x81;

import { OpCodes } from './op-codes';

/**
 * Maximum version of the script public key.
 */
export const MAX_SCRIPT_PUBLIC_KEY_VERSION: number = 0;

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
 * Maximum transaction input sequence number.
 */
export const MAX_TX_IN_SEQUENCE_NUM: bigint = BigInt('0xffffffffffffffff');

/**
 * Sequence lock time disabled flag.
 */
export const SEQUENCE_LOCK_TIME_DISABLED: bigint = BigInt(1) << BigInt(63);

/**
 * Sequence lock time mask.
 */
export const SEQUENCE_LOCK_TIME_MASK: bigint = BigInt('0x00000000ffffffff');

/**
 * Lock time threshold.
 */
export const LOCK_TIME_THRESHOLD: bigint = BigInt(500000000000);

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

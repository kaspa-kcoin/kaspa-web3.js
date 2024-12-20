/*
 * The type used to represent the GHOSTDAG K parameter
 * @remarks this is a 16-bit unsigned integer
 */
export type KType = number;

// ~~~~~~~~~~~~~~~~~~~~~~~~~ Network & Ghostdag ~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * Estimated upper bound on network delay in seconds
 * @remarks this is a 64-bit unsigned integer
 */
export const NETWORK_DELAY_BOUND: bigint = 5n;

/** **Desired** upper bound on the probability of anticones larger than k */
export const GHOSTDAG_TAIL_DELTA: number = 0.01;

/** **Legacy** default K for 1 BPS */
export const LEGACY_DEFAULT_GHOSTDAG_K: number = 18;

// ~~~~~~~~~~~~~~~~~~ Timestamp deviation & Median time ~~~~~~~~~~~~~~~~~~

/**
 * **Legacy** timestamp deviation tolerance (seconds)
 * @remarks this is a 64-bit unsigned integer
 */
export const LEGACY_TIMESTAMP_DEVIATION_TOLERANCE: bigint = 132n;

/**
 * **New** timestamp deviation tolerance (seconds).
 * @remarks this is a 64-bit unsigned integer
 */
export const NEW_TIMESTAMP_DEVIATION_TOLERANCE: bigint = 132n;

/**
 * The desired interval between samples of the median time window (seconds).
 * @remarks this is a 64-bit unsigned integer
 */
export const PAST_MEDIAN_TIME_SAMPLE_INTERVAL: bigint = 10n;

/**
 * Size of the **sampled** median time window (independent of BPS)
 * @remarks this is a 64-bit unsigned integer
 */
export const MEDIAN_TIME_SAMPLED_WINDOW_SIZE: bigint =
  (2n * NEW_TIMESTAMP_DEVIATION_TOLERANCE - 1n + PAST_MEDIAN_TIME_SAMPLE_INTERVAL - 1n) /
  PAST_MEDIAN_TIME_SAMPLE_INTERVAL;

// ~~~~~~~~~~~~~~~~~~~~~~~~~ Max difficulty target ~~~~~~~~~~~~~~~~~~~~~~~~~

/**
 * Highest proof of work difficulty target a Kaspa block can have for all networks.
 * This value is: 2^255 - 1.
 *
 * Computed value: `Uint256.from_u64(1).wrapping_shl(255) - 1.into()`
 */
export const MAX_DIFFICULTY_TARGET: bigint = (1n << 256n) - 1n;

/** Highest proof of work difficulty target as a floating number */
export const MAX_DIFFICULTY_TARGET_AS_F64: number = 5.78960446186581e76;

// ~~~~~~~~~~~~~~~~~~~ Difficulty Adjustment Algorithm (DAA) ~~~~~~~~~~~~~~~~~~~

/**
 * Minimal size of the difficulty window. Affects the DA algorithm only at the starting period of a new net
 */
export const MIN_DIFFICULTY_WINDOW_LEN: number = 10;

/**
 * **Legacy** difficulty adjustment window size corresponding to ~44 minutes with 1 BPS
 */
export const LEGACY_DIFFICULTY_WINDOW_SIZE: number = 2641;

/**
 * **New** difficulty window duration expressed in time units (seconds).
 * @remarks this is a 64-bit unsigned integer
 */
export const NEW_DIFFICULTY_WINDOW_DURATION: bigint = 2641n;

/**
 * The desired interval between samples of the difficulty window (seconds).
 * @remarks this is a 64-bit unsigned integer
 */
export const DIFFICULTY_WINDOW_SAMPLE_INTERVAL: bigint = 4n;

/**
 * Size of the **sampled** difficulty window (independent of BPS)
 * @remarks this is a 64-bit unsigned integer
 */
export const DIFFICULTY_SAMPLED_WINDOW_SIZE: bigint =
  (NEW_DIFFICULTY_WINDOW_DURATION + DIFFICULTY_WINDOW_SAMPLE_INTERVAL - 1n) / DIFFICULTY_WINDOW_SAMPLE_INTERVAL;

// ~~~~~~~~~~~~~~~~~~~ Finality & Pruning ~~~~~~~~~~~~~~~~~~~

/**
 * **Legacy** finality depth (in block units)
 * @remarks this is a 64-bit unsigned integer
 */
export const LEGACY_FINALITY_DEPTH: bigint = 86400n;

/**
 * **New** finality duration expressed in time units (seconds).
 * @remarks this is a 64-bit unsigned integer
 */
export const NEW_FINALITY_DURATION: bigint = 43200n; // 12 hours

/**
 * Merge depth bound duration (in seconds). For 1 BPS networks this equals the legacy depth
 * bound in block units. For higher BPS networks this should be scaled up.
 *
 * This number should be roughly equal to DAA window duration in order to prevent merging
 * low-difficulty side-chains (up to ~2x over DAA duration is still reasonable since creating
 * a mergeable low-difficulty side-chain within this bound requires a significant hashrate fraction)
 * @remarks this is a 64-bit unsigned integer
 */
export const MERGE_DEPTH_DURATION: bigint = 3600n;

/**
 * The value of the pruning proof `M` parameter
 * @remarks this is a 64-bit unsigned integer
 */
export const PRUNING_PROOF_M: bigint = 1000n;

// ~~~~~~~~~~~~~~~~~~~ Coinbase ~~~~~~~~~~~~~~~~~~~

/**
 * **Legacy** value of the coinbase maturity parameter for 1 BPS networks
 * @remarks this is a 64-bit unsigned integer
 */
export const LEGACY_COINBASE_MATURITY: bigint = 100n;

import { Consensus, KType } from './constants';

/**
 * Calculates the k parameter of the GHOSTDAG protocol such that anticones larger than k will be created
 * with probability less than `delta` (follows eq. 1 from section 4.2 of the PHANTOM paper)
 *
 * @param {number} x - Expected to be 2Dλ where D is the maximal network delay and λ is the block mining rate.
 * @param {number} delta - An upper bound for the probability of anticones larger than k.
 * @returns {bigint} The minimal k such that the above conditions hold, this is a 64-bit unsigned integer.
 */
function calculateGhostDagK(x: number, delta: number): bigint {
  if (x <= 0) throw new Error('x must be greater than 0');
  if (delta <= 0 || delta >= 1) throw new Error('delta must be between 0 and 1');

  let kHat = 0;
  let sigma = 0;
  let fraction = 1;
  const exp = Math.exp(-x);

  while (true) {
    sigma += exp * fraction;
    if (1 - sigma < delta) {
      return BigInt(kHat);
    }
    kHat += 1;
    fraction *= x / Number(kHat);
  }
}

/**
 * Struct representing network blocks-per-second. Provides a bunch of const functions
 * computing various constants which are functions of the BPS value
 */
class Bps {
  /*
   * The BPS value
   * @remarks this is a 64-bit unsigned integer
   */
  public readonly bps: bigint;

  /**
   * Constructs a new Bps instance.
   *
   * @param {bigint} bps - The blocks-per-second value, expected to be a 64-bit unsigned integer.
   */
  constructor(bps: bigint) {
    this.bps = bps;
  }

  /**
   * Returns the GHOSTDAG K value which was pre-computed for this BPS
   * (see `calculateGhostdagK` and `genGhostdagTable` for the full calculation)
   * @remarks This is a 16-bit unsigned integer
   */
  ghostDagK(): KType {
    switch (this.bps) {
      case 1n:
        return 18;
      case 2n:
        return 31;
      case 3n:
        return 43;
      case 4n:
        return 55;
      case 5n:
        return 67;
      case 6n:
        return 79;
      case 7n:
        return 90;
      case 8n:
        return 102;
      case 9n:
        return 113;
      case 10n:
        return 124;
      case 11n:
        return 135;
      case 12n:
        return 146;
      case 13n:
        return 157;
      case 14n:
        return 168;
      case 15n:
        return 179;
      case 16n:
        return 190;
      case 17n:
        return 201;
      case 18n:
        return 212;
      case 19n:
        return 223;
      case 20n:
        return 234;
      case 21n:
        return 244;
      case 22n:
        return 255;
      case 23n:
        return 266;
      case 24n:
        return 277;
      case 25n:
        return 288;
      case 26n:
        return 298;
      case 27n:
        return 309;
      case 28n:
        return 320;
      case 29n:
        return 330;
      case 30n:
        return 341;
      case 31n:
        return 352;
      case 32n:
        return 362;
      default:
        throw new Error('see genGhostdagTable for currently supported values');
    }
  }

  /**
   * Returns the target time per block in milliseconds
   * @remarks This is a 64-bit unsigned integer
   */
  targetTimePerBlock(): bigint {
    if (1000n % this.bps !== 0n) {
      throw new Error('targetTimePerBlock is in milliseconds hence BPS must divide 1000 with no remainder');
    }
    return 1000n / this.bps;
  }

  /**
   * Returns the max number of direct parents a block can have
   * @remarks This is a 8-bit unsigned integer
   */
  maxBlockParents(): number {
    const val = Math.floor(Number(this.ghostDagK()) / 2);
    if (val < 10) {
      return 10;
    } else if (val > 16) {
      return 16;
    } else {
      return val;
    }
  }

  /**
   * Returns the mergeset size limit
   * @remarks This is a 64-bit unsigned integer
   */
  mergesetSizeLimit(): bigint {
    const val = this.ghostDagK() * 2;
    if (val < 180n) {
      return 180n;
    } else if (val > 512n) {
      return 512n;
    } else {
      return BigInt(val);
    }
  }

  /**
   * Returns the merge depth bound
   * @remarks This is a 64-bit unsigned integer
   */
  mergeDepthBound(): bigint {
    return this.bps * BigInt(Consensus.MERGE_DEPTH_DURATION);
  }

  /**
   * Returns the finality depth
   * @remarks This is a 64-bit unsigned integer
   */
  finalityDepth(): bigint {
    return this.bps * Consensus.NEW_FINALITY_DURATION;
  }

  /**
   * Returns the previous mergeset size limit
   * @remarks This is a 64-bit unsigned integer
   */
  prevMergesetSizeLimit(): bigint {
    return BigInt(this.ghostDagK()) * 10n;
  }

  /**
   * Returns the pruning depth
   * @remarks This is a 64-bit unsigned integer
   */
  pruningDepth(): bigint {
    return (
      this.finalityDepth() +
      this.mergeDepthBound() * 2n +
      4n * this.prevMergesetSizeLimit() * BigInt(this.ghostDagK()) +
      2n * BigInt(this.ghostDagK()) +
      2n
    );
  }

  /**
   * Returns the pruning proof M value
   * @remarks This is a 64-bit unsigned integer
   */
  pruningProofM(): bigint {
    return Consensus.PRUNING_PROOF_M;
  }

  /**
   * Sample rate for sampling blocks to the median time window (in block units, hence dependent on BPS)
   * @remarks This is a 64-bit unsigned integer
   */
  pastMedianTimeSampleRate(): bigint {
    return this.bps * Consensus.PAST_MEDIAN_TIME_SAMPLE_INTERVAL;
  }

  /**
   * Sample rate for sampling blocks to the DA window (in block units, hence dependent on BPS)
   * @remarks This is a 64-bit unsigned integer
   */
  difficultyAdjustmentSampleRate(): bigint {
    return this.bps * Consensus.DIFFICULTY_WINDOW_SAMPLE_INTERVAL;
  }

  /**
   * Returns the coinbase maturity
   * @remarks This is a 64-bit unsigned integer
   */
  coinbaseMaturity(): bigint {
    return this.bps * Consensus.LEGACY_COINBASE_MATURITY;
  }

  /**
   * Returns the DAA score after which the pre-deflationary period switches to the deflationary period.
   * @remarks This is a 64-bit unsigned integer
   */
  deflationaryPhaseDaaScore(): bigint {
    return this.bps * (15778800n - 259200n);
  }

  /**
   * Returns the pre-deflationary phase base subsidy
   * @remarks This is a 64-bit unsigned integer
   */
  preDeflationaryPhaseBaseSubsidy(): bigint {
    return 50000000000n / this.bps;
  }
}

/**
 * Bps-related constants generator for testnet 11
 */
const Testnet11Bps = new Bps(10n);

export { calculateGhostDagK, Bps, Testnet11Bps };

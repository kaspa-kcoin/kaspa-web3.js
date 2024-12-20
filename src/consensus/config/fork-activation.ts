import { validateU64 } from '../../validator';

/**
 * Class representing a fork activation.
 */
class ForkActivation {
  private daaScore: bigint;

  /**
   * Constructs a new `ForkActivation` instance.
   * @param daaScore - The DAA score.
   */
  private constructor(daaScore: bigint) {
    this.daaScore = daaScore;
  }

  /**
   * Creates a new `ForkActivation` instance with the given DAA score.
   * @param daaScore - The DAA score.
   * @returns A new `ForkActivation` instance.
   * @remarks The `daaScore` must be a valid 64-bit unsigned integer.
   */
  /**
   * Creates a new `ForkActivation` instance with the given DAA score.
   * @param daaScore - The DAA score.
   * @returns A new `ForkActivation` instance.
   * @remarks The `daaScore` must be a valid 64-bit unsigned integer.
   */
  static new(daaScore: bigint): ForkActivation {
    validateU64(daaScore, 'daaScore');
    return new ForkActivation(daaScore);
  }

  /**
   * Creates a `ForkActivation` instance that represents a fork that never activates.
   * @returns A `ForkActivation` instance with the maximum possible DAA score.
   */
  /**
   * Creates a `ForkActivation` instance that represents a fork that never activates.
   * @returns A `ForkActivation` instance with the maximum possible DAA score.
   */
  static never(): ForkActivation {
    return new ForkActivation(BigInt('18446744073709551615'));
  }

  /**
   * Creates a `ForkActivation` instance that represents a fork that is always active.
   * @returns A `ForkActivation` instance with a DAA score of 0.
   */
  static always(): ForkActivation {
    return new ForkActivation(BigInt(0));
  }

  /**
   * Checks if the fork is active based on the current DAA score.
   * @param currentDaaScore - The current DAA score.
   * @returns `true` if the fork is active, `false` otherwise.
   */
  isActive(currentDaaScore: bigint): boolean {
    return currentDaaScore >= this.daaScore;
  }

  /**
   * Checks if the fork was "recently" activated, i.e., in the time frame of the provided range.
   * This function returns false for forks that were always active, since they were never activated.
   * @param currentDaaScore - The current DAA score.
   * @param range - The range to check.
   * @returns `true` if the fork was recently activated, `false` otherwise.
   */
  isWithinRangeFromActivation(currentDaaScore: bigint, range: bigint): boolean {
    return (
      !this.equals(ForkActivation.always()) && this.isActive(currentDaaScore) && currentDaaScore < this.daaScore + range
    );
  }

  /**
   * Checks if this `ForkActivation` instance is equal to another.
   * @param other - The other `ForkActivation` instance.
   * @returns `true` if the instances are equal, `false` otherwise.
   */
  equals(other: ForkActivation) {
    return this.daaScore === other.daaScore;
  }
}

export { ForkActivation };

import { NetworkId, NetworkType } from '../network';

/**
 * Class representing network parameters.
 */
class NetworkParams {
  coinbaseTransactionMaturityPeriodDaa: bigint;
  coinbaseTransactionStasisPeriodDaa: bigint;
  userTransactionMaturityPeriodDaa: bigint;
  additionalCompoundTransactionMass: bigint;

  /**
   * Creates an instance of NetworkParams.
   * @param {bigint} coinbaseTransactionMaturityPeriodDaa - The maturity period for coinbase transactions.
   * @param {bigint} coinbaseTransactionStasisPeriodDaa - The stasis period for coinbase transactions.
   * @param {bigint} userTransactionMaturityPeriodDaa - The maturity period for user transactions.
   * @param {bigint} additionalCompoundTransactionMass - The additional compound transaction mass.
   */
  constructor(
    coinbaseTransactionMaturityPeriodDaa: bigint,
    coinbaseTransactionStasisPeriodDaa: bigint,
    userTransactionMaturityPeriodDaa: bigint,
    additionalCompoundTransactionMass: bigint
  ) {
    this.coinbaseTransactionMaturityPeriodDaa = coinbaseTransactionMaturityPeriodDaa;
    this.coinbaseTransactionStasisPeriodDaa = coinbaseTransactionStasisPeriodDaa;
    this.userTransactionMaturityPeriodDaa = userTransactionMaturityPeriodDaa;
    this.additionalCompoundTransactionMass = additionalCompoundTransactionMass;
  }

  /**
   * Creates a NetworkParams instance from a NetworkId.
   * @param {NetworkId} value - The network ID.
   * @returns {NetworkParams} The network parameters.
   * @throws Will throw an error if the network type or testnet suffix is unsupported.
   */
  static from(value: NetworkId): NetworkParams {
    switch (value.networkType) {
      case NetworkType.Mainnet:
        return MAINNET_NETWORK_PARAMS;
      case NetworkType.Testnet:
        switch (value.suffix) {
          case 10:
            return TESTNET10_NETWORK_PARAMS;
          case 11:
            return TESTNET11_NETWORK_PARAMS;
          default:
            throw new Error(`Testnet suffix ${value.suffix} is not supported`);
        }
      case NetworkType.Devnet:
        return DEVNET_NETWORK_PARAMS;
      case NetworkType.Simnet:
        return SIMNET_NETWORK_PARAMS;
      default:
        throw new Error(`Unsupported NetworkType: ${value.networkType}`);
    }
  }
}

/**
 * Mainnet network parameters.
 * @type {NetworkParams}
 */
const MAINNET_NETWORK_PARAMS = new NetworkParams(100n, 50n, 10n, 100n);
/**
 * Testnet10 network parameters.
 * @type {NetworkParams}
 */
const TESTNET10_NETWORK_PARAMS = new NetworkParams(100n, 50n, 10n, 100n);
/**
 * Testnet11 network parameters.
 * @type {NetworkParams}
 */
const TESTNET11_NETWORK_PARAMS = new NetworkParams(1000n, 500n, 100n, 100n);
/**
 * Simnet network parameters.
 * @type {NetworkParams}
 */
const SIMNET_NETWORK_PARAMS = new NetworkParams(100n, 50n, 10n, 0n);
/**
 * Devnet network parameters.
 * @type {NetworkParams}
 */
const DEVNET_NETWORK_PARAMS = new NetworkParams(100n, 50n, 10n, 0n);

export {
  NetworkParams,
  MAINNET_NETWORK_PARAMS,
  TESTNET10_NETWORK_PARAMS,
  TESTNET11_NETWORK_PARAMS,
  SIMNET_NETWORK_PARAMS,
  DEVNET_NETWORK_PARAMS
};

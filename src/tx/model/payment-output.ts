import { Address } from '../../address';

class PaymentOutput {
  /**
   * Destination address. The address prefix must match the network
   * you are transacting on (e.g. `kaspa:` for mainnet, `kaspatest:` for testnet, etc).
   */
  address: Address;

  /**
   * Output amount in SOMPI.
   */
  amount: bigint;

  constructor(address: Address | string, amount: bigint) {
    this.address = address instanceof Address ? address : Address.fromString(address);
    this.amount = amount;
  }
}

export { PaymentOutput };

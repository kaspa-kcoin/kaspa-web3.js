import { Address } from './address';
import { Fees, GeneratorSettings, PaymentOutput, UtxoEntryReference } from './tx';
import { NetworkId } from './consensus';
import { RpcUtxosByAddressesEntry } from './rpc/types';

/**
 * Class representing parameters for sending Kaspa.
 */
class SendKasParams {
  sender: Address;
  amount: bigint;
  receiver: Address;
  networkId: NetworkId;
  payload?: Uint8Array;
  priorityFee?: Fees;

  /**
   * Creates an instance of SendKasPramas.
   * @param sender - The sender's address.
   * @param amount - The amount to send.
   * @param receiver - The receiver's address.
   * @param networkId - The network ID.
   * @param priorityFee - The optional priority fee.
   * @param payload - The optional payload.
   */
  constructor(
    sender: Address | string,
    amount: bigint,
    receiver: Address | string,
    networkId: NetworkId,
    priorityFee?: Fees,
    payload?: Uint8Array
  ) {
    this.sender = sender instanceof Address ? sender : Address.fromString(sender);
    this.amount = amount;
    this.receiver = receiver instanceof Address ? receiver : Address.fromString(receiver);
    this.networkId = networkId;
    this.payload = payload;
    this.priorityFee = priorityFee;
  }

  /**
   * Converts the parameters to generator settings.
   * @param uxtos - The UTXO entries.
   * @returns The generator settings.
   */
  toGeneratorSettings(uxtos: UtxoEntryReference[] | RpcUtxosByAddressesEntry[] = []): GeneratorSettings {
    const output = new PaymentOutput(this.receiver, this.amount);
    return new GeneratorSettings(
      output,
      this.sender,
      uxtos,
      this.networkId,
      this.priorityFee,
      undefined,
      undefined,
      undefined,
      this.payload
    );
  }
}

export { SendKasParams };

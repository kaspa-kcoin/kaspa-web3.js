import { NetworkId } from '../../../consensus';
import { Fees, PaymentOutput, UtxoEntryReference } from '../../model';
import { Address } from '../../../address';

class GeneratorSettings {
  outputs: PaymentOutput[];
  changeAddress: Address;
  priorityFee?: Fees;
  entries: UtxoEntryReference[];
  priorityEntries?: UtxoEntryReference[];
  sigOpCount: number;
  minimumSignatures: number;
  payload?: Uint8Array;
  networkId: NetworkId;

  constructor(
    outputs: PaymentOutput | PaymentOutput[],
    changeAddress: Address | string,
    entries: UtxoEntryReference[],
    networkId: NetworkId | string,
    priorityFee?: Fees | bigint,
    priorityEntries?: UtxoEntryReference[],
    sigOpCount?: number,
    minimumSignatures?: number,
    payload?: Uint8Array
  ) {
    this.outputs = outputs instanceof PaymentOutput ? [outputs] : outputs;
    this.changeAddress = changeAddress instanceof Address ? changeAddress : Address.fromString(changeAddress);
    this.entries = entries;
    this.networkId = networkId instanceof NetworkId ? networkId : NetworkId.fromString(networkId);
    this.priorityFee = this.priorityFee =
      priorityFee instanceof Fees ? priorityFee : priorityFee !== undefined ? new Fees(priorityFee) : undefined;
    this.priorityEntries = priorityEntries ? [...priorityEntries] : undefined;
    this.sigOpCount = sigOpCount ?? 1;
    this.minimumSignatures = minimumSignatures ?? 1;
    this.payload = payload;
  }

  setPriorityFee(priorityFee: Fees | bigint) {
    this.priorityFee = priorityFee instanceof Fees ? priorityFee : new Fees(priorityFee);
    return this;
  }
}

export { GeneratorSettings };

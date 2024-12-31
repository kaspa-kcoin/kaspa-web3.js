import { NetworkId, ScriptPublicKey } from '../../../consensus';
import { Fees, PaymentOutput, TransactionOutpoint, UtxoEntryReference } from '../../model';
import { Address } from '../../../address';
import { RpcUtxosByAddressesEntry } from '../../../rpc/types';
import { Hash } from '../../hashing';

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
    entries: UtxoEntryReference[] | RpcUtxosByAddressesEntry[],
    networkId: NetworkId | string,
    priorityFee?: Fees | bigint,
    priorityEntries?: UtxoEntryReference[] | RpcUtxosByAddressesEntry[],
    sigOpCount?: number,
    minimumSignatures?: number,
    payload?: Uint8Array
  ) {
    this.outputs = outputs instanceof PaymentOutput ? [outputs] : outputs;
    this.changeAddress = changeAddress instanceof Address ? changeAddress : Address.fromString(changeAddress);
    this.entries = [...entries].map((entry) => {
      return entry instanceof UtxoEntryReference ? entry : this.rpcUtxosByAddressesEntryToUtxoEntryReference(entry);
    });
    this.networkId = networkId instanceof NetworkId ? networkId : NetworkId.fromString(networkId);
    this.priorityFee = this.priorityFee =
      priorityFee instanceof Fees ? priorityFee : priorityFee !== undefined ? new Fees(priorityFee) : undefined;
    this.priorityEntries = priorityEntries
      ? [...priorityEntries].map((entry) => {
          return entry instanceof UtxoEntryReference ? entry : this.rpcUtxosByAddressesEntryToUtxoEntryReference(entry);
        })
      : undefined;
    this.sigOpCount = sigOpCount ?? 1;
    this.minimumSignatures = minimumSignatures ?? 1;
    this.payload = payload;
  }

  setPriorityFee(priorityFee: Fees | bigint) {
    this.priorityFee = priorityFee instanceof Fees ? priorityFee : new Fees(priorityFee);
    return this;
  }
  /**
   * Converts an RpcUtxosByAddressesEntry to a UtxoEntryReference.
   *
   * @param {RpcUtxosByAddressesEntry} utxo - The UTXO entry to convert.
   * @returns {UtxoEntryReference} The converted UTXO entry reference.
   */
  rpcUtxosByAddressesEntryToUtxoEntryReference = (utxo: RpcUtxosByAddressesEntry): UtxoEntryReference => {
    if (!utxo.outpoint?.transactionId || !utxo.utxoEntry?.scriptPublicKey) {
      throw new Error("Invalid RpcUtxosByAddressesEntry: Missing outpoint or script public key.");
    }
    return new UtxoEntryReference(
      Address.fromString(utxo.address),
      new TransactionOutpoint(Hash.fromString(utxo.outpoint.transactionId), utxo.outpoint.index),
      BigInt(utxo.utxoEntry.amount ?? 0),
      ScriptPublicKey.fromHex(utxo.utxoEntry.scriptPublicKey),
      BigInt(utxo.utxoEntry.blockDaaScore ?? 0),
      utxo.utxoEntry.isCoinbase ?? false
    );
  };
}

export { GeneratorSettings };

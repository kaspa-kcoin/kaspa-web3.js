import { Address } from '../../address';
import { TransactionOutpoint } from './tx-outpoint';
import { UtxoEntry } from './utxo-entry';
import { ScriptPublicKey } from '../../consensus';

class UtxoEntryReference extends UtxoEntry {
  address?: Address;
  outpoint: TransactionOutpoint;

  /**
   * Constructs a new ClientUtxoEntry.
   * @param address - The address associated with the UTXO.
   * @param outpoint - The transaction outpoint.
   * @param amount - The amount of the UTXO.
   * @param scriptPublicKey - The script public key.
   * @param blockDaaScore - The block DAA score.
   * @param isCoinbase - Indicates if the UTXO is from a coinbase transaction.
   */
  constructor(
    address: Address | undefined,
    outpoint: TransactionOutpoint,
    amount: bigint,
    scriptPublicKey: ScriptPublicKey,
    blockDaaScore: bigint,
    isCoinbase: boolean
  ) {
    super(amount, scriptPublicKey, blockDaaScore, isCoinbase);
    this.address = address;
    this.outpoint = outpoint;
  }

  toUtxoEntry(): UtxoEntry {
    return new UtxoEntry(this.amount, this.scriptPublicKey, this.blockDaaScore, this.isCoinbase);
  }
}

export { UtxoEntryReference };

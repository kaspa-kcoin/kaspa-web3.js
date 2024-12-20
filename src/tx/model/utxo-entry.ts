import { ScriptPublicKey } from '../../consensus';
import { validateU64 } from '../../validator';

/**
 * Holds details about an individual transaction output in a utxo
 * set such as whether it was contained in a coinbase tx, the daa
 * score of the block that accepts the tx, its public key script, and how
 * much it pays.
 * @category Consensus
 */
class UtxoEntry {
  /**
   * The amount of the transaction output.
   * @remarks This is a 64-bit unsigned integer.
   */
  amount: bigint;

  /**
   * The public key script of the transaction output.
   */
  scriptPublicKey: ScriptPublicKey;

  /**
   * The DAA score of the block that accepts the transaction.
   * @remarks This is a 64-bit unsigned integer.
   */
  blockDaaScore: bigint;

  /**
   * Indicates if the transaction is a coinbase transaction.
   */
  isCoinbase: boolean;

  /**
   * Creates an instance of UtxoEntry.
   * @param {bigint} amount - The amount of the transaction output.
   * @param {ScriptPublicKey} scriptPublicKey - The public key script of the transaction output.
   * @param {bigint} blockDaaScore - The DAA score of the block that accepts the transaction.
   * @param {boolean} isCoinbase - Indicates if the transaction is a coinbase transaction.
   */
  constructor(amount: bigint, scriptPublicKey: ScriptPublicKey, blockDaaScore: bigint, isCoinbase: boolean) {
    validateU64(amount, 'amount');
    validateU64(blockDaaScore, 'blockDaaScore');

    this.amount = amount;
    this.scriptPublicKey = scriptPublicKey;
    this.blockDaaScore = blockDaaScore;
    this.isCoinbase = isCoinbase;
  }
}

export { UtxoEntry };

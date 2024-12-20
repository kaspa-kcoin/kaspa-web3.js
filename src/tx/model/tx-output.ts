import { ScriptPublicKey } from '../../consensus';
import { validateU64 } from '../../validator';

/**
 * Represents a transaction output.
 */
class TransactionOutput {
  /**
   * The value of the transaction output.
   * @remarks this is a 64-bit unsigned integer
   */
  value: bigint;

  /**
   * The script public key associated with the transaction output.
   */
  scriptPublicKey: ScriptPublicKey;

  /**
   * Creates a new TransactionOutput instance.
   * @param value - The value of the transaction output.
   * @param scriptPublicKey - The script public key associated with the transaction output.
   */
  constructor(value: bigint, scriptPublicKey: ScriptPublicKey) {
    validateU64(value, 'value');

    this.value = value;
    this.scriptPublicKey = scriptPublicKey;
  }
}

export { TransactionOutput };

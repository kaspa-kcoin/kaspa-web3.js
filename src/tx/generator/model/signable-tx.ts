import { TransactionId, TransactionInput, UtxoEntry, UtxoEntryReference } from '../../model';
import { Transaction } from '../../tx';
import { ISubmittableJsonTransaction } from './submittable';
import { SignedTransaction, SignedType } from './signed-tx';
import { SIG_HASH_ALL, SigHashType } from '../../hashing';
import { signInput, signWithMultipleV2 } from '../../hashing/sign';
import { Buffer } from 'buffer';
import { DataKind } from './data-kind';

/**
 * Represents a transaction that can be signed.
 */
class SignableTransaction {
  id: TransactionId;
  tx: Transaction;
  entries: UtxoEntry[];
  paymentAmount: bigint;
  changeAmount: bigint;
  aggregateInputAmount: bigint;
  aggregateOutputAmount: bigint;
  minimumSignatures: number;
  mass: bigint;
  feeAmount: bigint;
  kind: DataKind;

  /**
   * Creates an instance of SignableTransaction.
   * @param {Transaction} tx - The transaction to be signed.
   * @param {UtxoEntry[]} entries - The UTXO entries associated with the transaction.
   * @param {bigint} paymentAmount - The payment amount of the transaction.
   * @param {bigint} changeAmount - The change amount of the transaction.
   * @param {bigint} aggregateInputAmount - The aggregate input amount of the transaction.
   * @param {bigint} aggregateOutputAmount - The aggregate output amount of the transaction.
   * @param {number} minimumSignatures - The minimum number of signatures required.
   * @param {bigint} mass - The mass of the transaction.
   * @param {bigint} feeAmount - The fee amount of the transaction.
   * @param {DataKind} kind - The kind of the transaction.
   */
  constructor(
    tx: Transaction,
    entries: UtxoEntry[],
    paymentAmount: bigint = 0n,
    changeAmount: bigint = 0n,
    aggregateInputAmount: bigint = 0n,
    aggregateOutputAmount: bigint = 0n,
    minimumSignatures: number = 0,
    mass: bigint = 0n,
    feeAmount: bigint = 0n,
    kind: DataKind = DataKind.NoOp
  ) {
    this.id = tx.id;
    this.tx = tx;
    this.entries = entries;
    this.paymentAmount = paymentAmount;
    this.changeAmount = changeAmount;
    this.aggregateInputAmount = aggregateInputAmount;
    this.aggregateOutputAmount = aggregateOutputAmount;
    this.minimumSignatures = minimumSignatures;
    this.mass = mass;
    this.feeAmount = feeAmount;
    this.kind = kind;
  }

  /**
   * Populates the input for the given index.
   * @param {number} index - The index of the input to populate.
   * @returns {[TransactionInput, UtxoEntry]} The populated transaction input and UTXO entry.
   * @throws Will throw an error if the UTXO entry at the given index is not populated.
   */
  populatedInput(index: number): [TransactionInput, UtxoEntry] {
    if (!this.entries[index]) {
      throw new Error('expected to be called only following full UTXO population');
    }
    return [this.tx.inputs[index], this.entries[index]!];
  }

  /**
   * Signs the transaction with the provided private keys.
   * @param {string[]} privHexKeys - The private keys in hexadecimal format.
   * @param {boolean} checkFullySigned - Whether to check if the transaction is fully signed.
   * @returns {SignedTransaction} The signed transaction.
   */
  sign(privHexKeys: string[], checkFullySigned = false): SignedTransaction {
    const signedTx = signWithMultipleV2(this, privHexKeys);

    if (checkFullySigned && signedTx.type === SignedType.Partially) {
      throw new Error('transaction is not fully signed');
    }

    return signedTx;
  }

  /**
   * Creates a signature for the specified input.
   * @param {number} inputIndex - The index of the input to sign.
   * @param {string} privateKeyHex - The private key in hexadecimal format.
   * @param {SigHashType} [hashType=SIG_HASH_ALL] - The type of hash to use for signing.
   * @returns {Uint8Array} The generated signature.
   */
  createInputSignature(inputIndex: number, privateKeyHex: string, hashType = SIG_HASH_ALL): Uint8Array {
    return signInput(this, inputIndex, privateKeyHex, hashType);
  }

  /**
   * Fills the signature for the specified input.
   * @param {number} inputIndex - The index of the input to fill the signature for.
   * @param {Uint8Array} signature - The signature to fill.
   */
  fillInputSignature(inputIndex: number, signature: Uint8Array): void {
    this.tx.inputs[inputIndex].signatureScript = signature;
  }

  /**
   * Signs the specified input with the provided private key.
   * @param {number} inputIndex - The index of the input to sign.
   * @param {string} privateKeyHex - The private key in hexadecimal format.
   * @param {SigHashType} [hashType=SIG_HASH_ALL] - The type of hash to use for signing.
   */
  signInput(inputIndex: number, privateKeyHex: string, hashType: SigHashType = SIG_HASH_ALL) {
    this.tx.inputs[inputIndex].signatureScript = signInput(this, inputIndex, privateKeyHex, hashType);
  }

  /**
   * Convert to a submittable tx.
   * @returns {ISubmittableJsonTransaction} The submittable transaction.
   */
  toSubmittableJsonTx(): ISubmittableJsonTransaction {
    return {
      verb: undefined,
      id: this.id.toString(),
      version: this.tx.version,
      inputs: this.tx.inputs.map((input) => ({
        previousOutpoint: {
          transactionId: input.previousOutpoint.transactionId.toString(),
          index: input.previousOutpoint.index
        },
        sequence: Number(input.sequence),
        sigOpCount: input.sigOpCount,
        signatureScript: Buffer.from(input.signatureScript).toString('hex')
      })),
      outputs: this.tx.outputs.map((output) => ({
        value: Number(output.value),
        scriptPublicKey: {
          version: output.scriptPublicKey.version,
          script: Buffer.from(output.scriptPublicKey.script).toString('hex')
        }
      })),
      lockTime: Number(this.tx.lockTime),
      gas: Number(this.tx.gas),
      subnetworkId: this.tx.subnetworkId.toString(),
      payload: Buffer.from(this.tx.payload).toString('hex'),
      mass: Number(this.tx.mass)
    };
  }
}

export { SignableTransaction };

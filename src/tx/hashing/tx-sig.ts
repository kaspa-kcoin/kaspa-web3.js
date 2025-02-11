import { Hash, ZERO_HASH } from './hash';
import { Blake2bHashKey, Sha256HashKey } from './hash-key';
import { SigHashType } from './sig-hash-type';
import { IVerifiableTransaction, Transaction } from '../tx';
import { DataWriter } from './data-writer';
import { Buffer } from 'buffer';
import { blake2b } from '@noble/hashes/blake2b';
import { sha256 } from '@noble/hashes/sha2';

/**
 * Class providing methods for calculating transaction signing hashes.
 */
class TransactionSigningHashing {
  /**
   * Calculates the hash of previous outputs for a transaction.
   * @param {Transaction} tx - The transaction object.
   * @param {SigHashType} hashType - The signature hash type.
   * @returns {Hash} - The calculated hash.
   */
  private static previousOutputsHash(tx: Transaction, hashType: SigHashType): Hash {
    if (hashType.isSighashAnyoneCanPay()) {
      return ZERO_HASH;
    }

    const writer = new DataWriter();
    for (const input of tx.inputs) {
      writer.writeOutpoint(input.previousOutpoint);
    }

    const hash = blake2b(writer.buffer, { dkLen: 32, key: Blake2bHashKey.TransactionSigning });
    return new Hash(hash);
  }

  /**
   * Calculates the hash of sequences for a transaction.
   * @param {Transaction} tx - The transaction object.
   * @param {SigHashType} hashType - The signature hash type.
   * @returns {Hash} - The calculated hash.
   */
  private static sequencesHash(tx: Transaction, hashType: SigHashType): Hash {
    if (hashType.isSighashSingle() || hashType.isSighashAnyoneCanPay() || hashType.isSighashNone()) {
      return ZERO_HASH;
    }

    const writer = new DataWriter();
    for (const input of tx.inputs) {
      writer.writeUint64(input.sequence);
    }

    const hash = blake2b(writer.buffer, { dkLen: 32, key: Blake2bHashKey.TransactionSigning });
    return new Hash(hash);
  }

  /**
   * Calculates the hash of signature operation counts for a transaction.
   * @param {Transaction} tx - The transaction object.
   * @param {SigHashType} hashType - The signature hash type.
   * @returns {Hash} - The calculated hash.
   */
  private static sigOpCountsHash(tx: Transaction, hashType: SigHashType): Hash {
    if (hashType.isSighashAnyoneCanPay()) {
      return ZERO_HASH;
    }

    const writer = new DataWriter();
    for (const input of tx.inputs) {
      writer.writeUint8(input.sigOpCount);
    }
    const hash = blake2b(writer.buffer, { dkLen: 32, key: Blake2bHashKey.TransactionSigning });
    return new Hash(hash);
  }

  /**
   * Calculates the hash of the payload for a transaction.
   * @param {Transaction} tx - The transaction object.
   * @returns {Hash} - The calculated hash.
   */
  private static payloadHash(tx: Transaction): Hash {
    if (tx.subnetworkId.isNative() && tx.payload.length === 0) {
      return ZERO_HASH;
    }

    const writer = new DataWriter();
    writer.writeDataWithLength(tx.payload);

    const hash = blake2b(writer.buffer, { dkLen: 32, key: Blake2bHashKey.TransactionSigning });
    return new Hash(hash);
  }

  /**
   * Calculates the hash of outputs for a transaction.
   * @param {Transaction} tx - The transaction object.
   * @param {SigHashType} hashType - The signature hash type.
   * @param {number} inputIndex - The index of the input.
   * @returns {Hash} - The calculated hash.
   */
  private static outputsHash(tx: Transaction, hashType: SigHashType, inputIndex: number): Hash {
    if (hashType.isSighashNone()) {
      return ZERO_HASH;
    }

    const writer = new DataWriter();
    if (hashType.isSighashSingle()) {
      if (inputIndex >= tx.outputs.length) {
        return ZERO_HASH;
      }

      writer.writeOutput(tx.outputs[inputIndex]);
      const hash = blake2b(writer.buffer, { dkLen: 32, key: Blake2bHashKey.TransactionSigning });
      return new Hash(hash);
    }

    for (const output of tx.outputs) {
      writer.writeOutput(output);
    }
    const hash = blake2b(writer.buffer, { dkLen: 32, key: Blake2bHashKey.TransactionSigning });
    return new Hash(hash);
  }

  /**
   * Calculates the Schnorr signature hash for a transaction.
   * @param {IVerifiableTransaction} verifiableTx - The verifiable transaction object.
   * @param {number} inputIndex - The index of the input.
   * @param {SigHashType} hashType - The signature hash type.
   * @returns {Hash} - The calculated hash.
   */
  static calcSchnorrSignatureHash(
    verifiableTx: IVerifiableTransaction,
    inputIndex: number,
    hashType: SigHashType
  ): Hash {
    const [input, utxo] = verifiableTx.populatedInput(inputIndex);
    const tx = verifiableTx.tx();
    const writer = new DataWriter();
    writer
      .writeUint16(tx.version)
      .writeRawData(this.previousOutputsHash(tx, hashType).toBytes())
      .writeRawData(this.sequencesHash(tx, hashType).toBytes())
      .writeRawData(this.sigOpCountsHash(tx, hashType).toBytes())
      .writeOutpoint(input.previousOutpoint)
      .writeScriptPublicKey(utxo.scriptPublicKey)
      .writeUint64(utxo.amount)
      .writeUint64(input.sequence)
      .writeUint8(input.sigOpCount)
      .writeRawData(this.outputsHash(tx, hashType, inputIndex).toBytes())
      .writeUint64(tx.lockTime)
      .writeRawData(tx.subnetworkId.bytes)
      .writeUint64(tx.gas)
      .writeRawData(this.payloadHash(tx).toBytes())
      .writeUint8(hashType.value);
    const hash = blake2b(writer.buffer, { dkLen: 32, key: Blake2bHashKey.TransactionSigning });
    return new Hash(hash);
  }

  /**
   * Calculates the ECDSA signature hash for a transaction.
   * @param {IVerifiableTransaction} tx - The verifiable transaction object.
   * @param {number} inputIndex - The index of the input.
   * @param {SigHashType} hashType - The signature hash type.
   * @returns {Hash} - The calculated hash.
   */
  static calcEcdsaSignatureHash(tx: IVerifiableTransaction, inputIndex: number, hashType: SigHashType): Hash {
    const hash = this.calcSchnorrSignatureHash(tx, inputIndex, hashType);
    const bytes = Buffer.concat([Sha256HashKey.TransactionSigningHashECDSA, hash.toBytes()]);
    return new Hash(sha256(bytes));
  }
}

export { TransactionSigningHashing };

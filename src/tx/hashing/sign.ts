import { SignableTransaction } from '../generator/model';
import { SignedTransaction, SignedType } from '../generator/model/signed-tx';
import { Keypair } from '../../keypair';
import { SIG_HASH_ALL, SigHashType } from './sig-hash-type';
import { TransactionSigningHashing } from './tx-sig';
import { Buffer } from 'buffer';

/**
 * Sign a transaction input with a sighash_type using Schnorr.
 * @param {SignableTransaction} tx - The transaction to be signed.
 * @param {number} inputIndex - The index of the input to sign.
 * @param {string} privateKeyHex - The private key to sign the transaction with.
 * @param {number} hashType - The sighash typeL.
 * @returns {Uint8Array} The signed input.
 */
function signInput(
  tx: SignableTransaction,
  inputIndex: number,
  privateKeyHex: string,
  hashType: SigHashType
): Uint8Array {
  const sigHash = TransactionSigningHashing.calcSchnorrSignatureHash(tx, inputIndex, hashType);
  const msg = new Uint8Array(sigHash.toBytes());
  const schnorrKey = Keypair.fromPrivateKeyHex(privateKeyHex);
  const sig = schnorrKey.sign(msg);

  // This represents OP_DATA_65 <SIGNATURE+SIGHASH_TYPE> (since signature length is 64 bytes and SIGHASH_TYPE is one byte)
  return new Uint8Array([65, ...sig, hashType.value]);
}

/**
 * Sign a transaction using Schnorr.
 * @param {SignableTransaction} signableTx - The transaction to be signed.
 * @param {string[]} privHexKeys - The private keys to sign the transaction with.
 * @returns {SignedTransaction} The signed transaction.
 */
function signWithMultipleV2(signableTx: SignableTransaction, privHexKeys: string[]): SignedTransaction {
  const map = new Map<string, Keypair>();
  for (const privkey of privHexKeys) {
    const keypair = Keypair.fromPrivateKeyHex(privkey);
    // same as payToPubKey(base.fromHex(keypair.xOnlyPublicKey!))
    const scriptPubKeyScript = new Uint8Array([0x20, ...Buffer.from(keypair.xOnlyPublicKey!, 'hex'), 0xac]);
    map.set(scriptPubKeyScript.toString(), keypair);
  }

  let additionalSignaturesRequired = false;
  for (let i = 0; i < signableTx.tx.inputs.length; i++) {
    const script = signableTx.entries[i].scriptPublicKey.script;
    const schnorrKey = map.get(script.toString());
    if (schnorrKey) {
      const sigHash = TransactionSigningHashing.calcSchnorrSignatureHash(signableTx, i, SIG_HASH_ALL);
      const sig = schnorrKey.sign(sigHash.toBytes());
      signableTx.tx.inputs[i].signatureScript = new Uint8Array([65, ...sig, SIG_HASH_ALL.value]);
    } else {
      additionalSignaturesRequired = true;
    }
  }

  const signedTxType = additionalSignaturesRequired ? SignedType.Partially : SignedType.Fully;
  return new SignedTransaction(signedTxType, signableTx);
}

export { signInput, signWithMultipleV2 };

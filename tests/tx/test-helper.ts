import {
  DataKind,
  Hash,
  SignableTransaction,
  Transaction,
  TransactionInput,
  TransactionOutpoint,
  TransactionOutput,
  UtxoEntryReference
} from '../../src/tx';
import { Address, ScriptPublicKey, SubnetworkId } from '../../src';
import * as fs from 'node:fs';

function parseTxsFromFile(file: string): SignableTransaction[] {
  const fileContent = fs.readFileSync(file, 'utf8');
  const txs = parseWithBigInt(fileContent);

  const result = new Array<SignableTransaction>();
  const lastSecondIndex = txs.length - 2;
  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    const transaction = new Transaction(
      tx.transaction.version,
      tx.transaction.inputs.map(
        (input: any) =>
          new TransactionInput(
            new TransactionOutpoint(Hash.fromHex(input.previousOutpoint.transactionId), input.previousOutpoint.index),
            new Uint8Array(Buffer.from(input.signatureScript, 'hex')),
            BigInt(input.sequence),
            input.sigOpCount
          )
      ),
      tx.transaction.outputs.map(
        (output: any) =>
          new TransactionOutput(
            BigInt(output.value),
            new ScriptPublicKey(
              output.scriptPublicKey.version,
              new Uint8Array(Buffer.from(output.scriptPublicKey.script, 'hex'))
            )
          )
      ),
      BigInt(tx.transaction.lockTime),
      new SubnetworkId(new Uint8Array(Buffer.from(tx.transaction.subnetworkId, 'hex'))),
      BigInt(tx.transaction.gas),
      new Uint8Array(Buffer.from(tx.transaction.payload, 'hex'))
    );

    const mass = BigInt(tx.mass | 0n);
    transaction.setMass(mass);

    const entries = tx.transaction.inputs.map((input: any) => {
      const utxo = input.utxo;
      return new UtxoEntryReference(
        Address.fromString(utxo.address.prefix + ':' + utxo.address.payload),
        new TransactionOutpoint(Hash.fromHex(utxo.outpoint.transactionId), utxo.outpoint.index),
        BigInt(utxo.amount),
        new ScriptPublicKey(
          utxo.scriptPublicKey.version,
          new Uint8Array(Buffer.from(utxo.scriptPublicKey.script, 'hex'))
        ),
        BigInt(utxo.blockDaaScore),
        utxo.isCoinbase
      );
    });

    result.push(
      new SignableTransaction(
        transaction,
        entries,
        BigInt(tx.paymentAmount),
        BigInt(tx.changeAmount),
        BigInt(tx.aggregateInputAmount),
        BigInt(tx.aggregateOutputAmount),
        Number(tx.minimumSignatures),
        BigInt(tx.mass),
        BigInt(tx.feeAmount),
        tx.type === 'final' ? DataKind.Final : i === lastSecondIndex ? DataKind.Edge : DataKind.Node
      )
    );
  }
  return result;
}

function parseUtxosFromFile(file: string): UtxoEntryReference[] {
  const fileContent = fs.readFileSync(file, 'utf8');
  const utxos = parseWithBigInt(fileContent);

  return utxos.map((utxo: any) => {
    return new UtxoEntryReference(
      Address.fromString(utxo.address.prefix + ':' + utxo.address.payload),
      new TransactionOutpoint(Hash.fromHex(utxo.outpoint.transactionId), utxo.outpoint.index),
      BigInt(utxo.amount),
      new ScriptPublicKey(
        utxo.scriptPublicKey.version,
        new Uint8Array(Buffer.from(utxo.scriptPublicKey.script, 'hex'))
      ),
      BigInt(utxo.blockDaaScore),
      utxo.isCoinbase
    );
  });
}

function parseWithBigInt(jsonString: string) {
  return JSON.parse(jsonString, (_, value) => {
    if (typeof value === 'string' && value.endsWith('n')) {
      return BigInt(value.slice(0, -1));
    }
    return value;
  });
}

export { parseTxsFromFile, parseUtxosFromFile };

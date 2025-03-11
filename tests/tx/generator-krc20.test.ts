import { describe, expect, it } from 'vitest';
import {
  Fees,
  Generator,
  SignableTransaction,
  kaspaToSompi,
  NetworkId,
  NetworkType,
  Krc20TransferParams,
  SignedType
} from '../../src';
import { parseTxsFromFile, parseUtxosFromFile } from './test-helper';
import * as fs from 'fs';
import * as path from 'path';
import { RpcUtxosByAddressesEntry } from '../../src/rpc/types';

const SENDDER_PK = '5cd51b74226a845b8c757494136659997db1aaedf34c528e297f849f0fe87faf';
const SENDER_ADDR = 'kaspatest:qzzzvv57j68mcv3rsd2reshhtv4rcw4xc8snhenp2k4wu4l30jfjxlgfr8qcz';
const RECEIVER_ADDR = 'kaspatest:qrjcg7hsgjapumpn8egyu6544qzdqs2lssas4nfwewl55lnenr5pyzd7cmyx6';
const TESTNET_10 = new NetworkId(NetworkType.Testnet, 10);
const COMMIT_PRIORITY_FEES = new Fees(kaspaToSompi(0.02));
const REVEAL_PRIORITY_FEES = new Fees(kaspaToSompi(0.02));

describe('Generator kas tx', () => {
  const sentKrc20CommitTx = new Krc20TransferParams(
    SENDER_ADDR,
    TESTNET_10,
    REVEAL_PRIORITY_FEES,
    {
      tick: 'KAST',
      to: RECEIVER_ADDR,
      amount: kaspaToSompi(101)
    },
    COMMIT_PRIORITY_FEES
  );
  const resultSendKrc20CommitTx = parseTxsFromFile(path.resolve(__dirname, './data/sendkrc20-commit-tx.json'));
  const resultSendKrc20RevealTx = parseTxsFromFile(path.resolve(__dirname, './data/sendkrc20-reveal-tx.json'));
  const resultSendKrc20RevealTxSigned = parseTxsFromFile(
    path.resolve(__dirname, './data/sendkrc20-reveal-signed-tx.json')
  );
  const utxos = parseUtxosFromFile(path.resolve(__dirname, './data/utxos.json'));

  it(`should successfully generate send krc20 transactions`, () => {
    const generatorCommit = new Generator(sentKrc20CommitTx.toCommitTxGeneratorSettings(utxos));
    const commitTxs = new Array<SignableTransaction>();

    // commit tx
    while (true) {
      const transaction = generatorCommit.generateTransaction();
      if (transaction === undefined) {
        break;
      }
      commitTxs.push(transaction);
    }
    expect(commitTxs).deep.equals(resultSendKrc20CommitTx);

    const finalCommitTx = commitTxs[commitTxs.length - 1];

    const newUtxos = utxos.filter((o) =>
      commitTxs.some(
        (tx) =>
          !tx.entries.some(
            (e: any) => e.outpoint.transactionId === o.outpoint.transactionId && e.outpoint.index === o.outpoint.index
          )
      )
    );

    // reveal tx
    const generatorReveal = new Generator(sentKrc20CommitTx.toRevealTxGeneratorSettings(newUtxos, finalCommitTx.id));
    const revealTxs = new Array<SignableTransaction>();

    while (true) {
      const transaction = generatorReveal.generateTransaction();
      if (transaction === undefined) {
        break;
      }
      revealTxs.push(transaction);
    }
    expect(revealTxs).deep.equals(resultSendKrc20RevealTx);

    const signedTx = revealTxs[0].sign([SENDDER_PK]);
    expect(signedTx.type).equals(SignedType.Partially);
    const unsignedInputIndex = signedTx.transaction.tx.inputs.findIndex((i) => i.signatureScript.length === 0);
    expect(unsignedInputIndex).equals(0);

    if (unsignedInputIndex !== -1) {
      const inputSig = signedTx.transaction.createInputSignature(unsignedInputIndex, SENDDER_PK);
      const encodedSig = sentKrc20CommitTx.script.encodePayToScriptHashSignatureScript(inputSig);
      signedTx.transaction.fillInputSignature(unsignedInputIndex, encodedSig);
    }

    expect(signedTx.transaction.tx.payload).deep.equals(resultSendKrc20RevealTxSigned[0].tx.payload);
    expect(signedTx.transaction.tx.inputs[unsignedInputIndex].signatureScript).deep.be.not.equals(
      resultSendKrc20RevealTxSigned[0].tx.inputs[0].signatureScript
    );

    const submitableTx = signedTx.toSubmittableJsonTx();

    expect(submitableTx.id).equals(resultSendKrc20RevealTxSigned[0].id.toHex());
  });
});

describe('Generator specific test cases', () => {
  it('should generate transactions without errors', () => {
    const sendKrc20Params = new Krc20TransferParams(
      'kaspatest:qzw9xtuu63l4q3kxpgseut2r9z3xp9t29uhz7smwymendlhptt5fs77lmj7ys',
      new NetworkId(NetworkType.Testnet, 10),
      new Fees(0n),
      {
        tick: 'KAST',
        to: 'kaspatest:qq5zy4rfsrzllchkd7myamqqe83k55qykmpc8exyt5a4qn798f3hjx24kkevw',
        amount: 200000000n
      },
      COMMIT_PRIORITY_FEES
    );
    const data = fs.readFileSync(path.resolve(__dirname, './data/single-utxo.json'), 'utf-8');
    const utxos = JSON.parse(data) as RpcUtxosByAddressesEntry[];
    const settings = sendKrc20Params.toCommitTxGeneratorSettings(utxos);
    const generator = new Generator(settings);
    const transactions = new Array<SignableTransaction>();

    while (true) {
      const transaction = generator.generateTransaction();
      if (transaction === undefined) {
        break;
      }
      transactions.push(transaction);
    }

    expect(transactions.length).toBeGreaterThan(0);
  });
});

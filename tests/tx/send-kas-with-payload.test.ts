import { describe, expect, it } from 'vitest';
import { Fees, Generator, SignableTransaction, kaspaToSompi, NetworkId, NetworkType, SendKasParams } from '../../src';
import { parseTxsFromFile, parseUtxosFromFile } from './test-helper';
import * as path from 'path';

const SENDER_ADDR = 'kaspatest:qrcln7p9ggre8wdmcvm85pqp083sqlrqwpayzrl4xwn4k42lcxlhx6e89pls9';
const RECEIVER_ADDR = 'kaspatest:qzzzvv57j68mcv3rsd2reshhtv4rcw4xc8snhenp2k4wu4l30jfjxlgfr8qcz';
const TESTNET_10 = new NetworkId(NetworkType.Testnet, 10);
const PRIORITY_FEES = new Fees(kaspaToSompi(0.02));

describe('Generate tx with payload', () => {
  // convert string to Uint8Array
  const payload = `deposit|${SENDER_ADDR}`;
  const payloadUint8Array = new TextEncoder().encode(payload);

  const sentKas = new SendKasParams(SENDER_ADDR, kaspaToSompi(1.23), RECEIVER_ADDR, TESTNET_10, PRIORITY_FEES);

  const sentKasWithPayload = new SendKasParams(
    SENDER_ADDR,
    kaspaToSompi(1.23),
    RECEIVER_ADDR,
    TESTNET_10,
    PRIORITY_FEES,
    payloadUint8Array
  );
  const result = parseTxsFromFile(path.resolve(__dirname, './data/sendkas.json'));
  const resultWithPayload = parseTxsFromFile(path.resolve(__dirname, './data/sendkas-with-payload.json'));
  const utxos = parseUtxosFromFile(path.resolve(__dirname, './data/utxos-payload.json'));

  it('should generate tx success for send kas without payload', () => {
    const generator = new Generator(sentKas.toGeneratorSettings(utxos));
    const txs = new Array<SignableTransaction>();

    while (true) {
      const transaction = generator.generateTransaction();
      if (transaction === undefined) {
        break;
      }
      txs.push(transaction);
    }

    expect(txs.length).equals(1);
    expect(txs[0]).deep.equals(result[0]);
  });

  it(`should generate transactions success for send kas with payload`, () => {
    const generator = new Generator(sentKasWithPayload.toGeneratorSettings(utxos));
    const txs = new Array<SignableTransaction>();

    while (true) {
      const transaction = generator.generateTransaction();
      if (transaction === undefined) {
        break;
      }
      txs.push(transaction);
    }

    expect(txs.length).equals(1);
    expect(txs[0]).deep.equals(resultWithPayload[0]);
  });
});

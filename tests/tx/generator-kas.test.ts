import { describe, expect, it } from 'vitest';
import { Fees, Generator, SignableTransaction } from '../../src/tx';
import { kaspaToSompi, NetworkId, NetworkType, SendKasParams } from '../../src';
import { parseTxsFromFile, parseUtxosFromFile } from './test-helper';
import path from 'path';

const SENDER_ADDR = 'kaspatest:qzzzvv57j68mcv3rsd2reshhtv4rcw4xc8snhenp2k4wu4l30jfjxlgfr8qcz';
const RECEIVER_ADDR = 'kaspatest:qrjcg7hsgjapumpn8egyu6544qzdqs2lssas4nfwewl55lnenr5pyzd7cmyx6';
const TESTNET_10 = new NetworkId(NetworkType.Testnet, 10);
const PRIORITY_FEES = new Fees(kaspaToSompi(0.02));

describe('Generator kas tx', () => {
  const sentKas10 = new SendKasParams(SENDER_ADDR, kaspaToSompi(10), RECEIVER_ADDR, TESTNET_10, PRIORITY_FEES);
  const send1Kas10K = new SendKasParams(SENDER_ADDR, kaspaToSompi(10000), RECEIVER_ADDR, TESTNET_10, PRIORITY_FEES);
  const sendKas1M = new SendKasParams(SENDER_ADDR, kaspaToSompi(1000000), RECEIVER_ADDR, TESTNET_10, PRIORITY_FEES);
  const testCases = [
    { name: '10 KAS', params: sentKas10 },
    { name: '10K KAS', params: send1Kas10K },
    { name: '1M KAS', params: sendKas1M }
  ];

  const resultSendKas10 = parseTxsFromFile(path.resolve(__dirname, './data/send10kas.json'));
  const resultSendKas10K = parseTxsFromFile(path.resolve(__dirname, './data/sendkas10k.json'));
  const resultSendKas1M = parseTxsFromFile(path.resolve(__dirname, './data/sendkas1m.json'));

  const utxos = parseUtxosFromFile(path.resolve(__dirname, './data/utxos.json'));
  const testReuslts = [resultSendKas10, resultSendKas10K, resultSendKas1M];

  for (let i = 0; i < testCases.length; i++) {
    it(`should generate transactions success for ${testCases[i].name}`, () => {
      const generator = new Generator(testCases[i].params.toGeneratorSettings(utxos));
      const txs = new Array<SignableTransaction>();

      while (true) {
        const transaction = generator.generateTransaction();
        if (transaction === undefined) {
          break;
        }
        txs.push(transaction);
      }
      expect(txs).deep.equals(testReuslts[i]);
    });

    it(`should generate transactions fail without utxos for ${testCases[i].name} with mass`, () => {
      const generator = new Generator(testCases[i].params.toGeneratorSettings());
      const txs = new Array<SignableTransaction>();

      expect(() => {
        while (true) {
          const transaction = generator.generateTransaction();
          if (transaction === undefined) {
            break;
          }
          txs.push(transaction);
        }
      }).toThrow(/InsufficientFunds/);
    });
  }
});

import { describe, it, expect } from 'vitest';
import { Fees, Generator, kaspaToSompi, NetworkId, SendKasParams } from '../../src';
import { parseRpcUtxosFromFile } from './test-helper';
import * as path from 'path';

const SENDER_ADDR = 'kaspa:qplg663uh4e2rjwd8vdkyufklq7549xuwk8fhxjhdclsnfshu4mmy0aj3qk8r';
const RECEIVER_ADDR = 'kaspa:qrr2ggg39z9uc308pw6r493k4sy5ujt8qu6lztg3qq99cuc9x2sh7xfaewc4t';
const PRIORITY_FEES = new Fees(kaspaToSompi(0.02));

describe('Generator kas tx', () => {
  it('should throw an error with message containing "Storage mass exceeds maximum"', () => {
    const sendAmount = 9569251n;
    const sentKasParam = new SendKasParams(SENDER_ADDR, sendAmount, RECEIVER_ADDR, NetworkId.Mainnet, PRIORITY_FEES);
    const utxos = parseRpcUtxosFromFile(path.resolve(__dirname, './data/send-small-kas-utxos.json'));
    const generator = new Generator(sentKasParam.toGeneratorSettings(utxos));

    expect(() => generator.generateTransaction()).toThrowError(/Storage mass exceeds maximum/);
  });
});

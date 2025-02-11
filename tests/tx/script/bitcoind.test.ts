import { describe, it, expect } from 'vitest';
import {
  Hash,
  i64Min,
  MAX_TX_IN_SEQUENCE_NUM,
  OpCodes,
  PopulatedTransaction,
  ScriptBuilder,
  ScriptPublicKey,
  SigCacheKey,
  SubnetworkId,
  Transaction,
  TransactionInput,
  TransactionOutpoint,
  TransactionOutput,
  TxScriptEngine,
  UtxoEntry
} from '../../../src';
import path from 'path';
import { readFileSync } from 'fs';

describe('TxScriptEngine bitcoind tests', () => {
  function createSpendingTransaction(sigScript: Uint8Array, scriptPublicKey: ScriptPublicKey): Transaction {
    const coinbase = new Transaction(
      1,
      [
        new TransactionInput(
          new TransactionOutpoint(Hash.fromBytes(new Uint8Array(32)), 0xffffffff),
          new Uint8Array([0, 0]),
          MAX_TX_IN_SEQUENCE_NUM,
          0
        )
      ],
      [new TransactionOutput(BigInt(0), scriptPublicKey)],
      BigInt(0),
      SubnetworkId.fromByte(0),
      0n,
      new Uint8Array([])
    );

    return new Transaction(
      1,
      [new TransactionInput(new TransactionOutpoint(coinbase.id, 0), sigScript, MAX_TX_IN_SEQUENCE_NUM, 0)],
      [new TransactionOutput(BigInt(0), new ScriptPublicKey(0, new Uint8Array([])))],
      BigInt(0),
      SubnetworkId.fromByte(0),
      0n,
      new Uint8Array([])
    );
  }

  const errMap = new Map<string, string[]>([
    ['script ran, but verification failed', ['VERIFY', 'EQUALVERIFY']],
    ['false stack entry at end of script execution', ['EVAL_FALSE']],
    ['Number too big', ['UNKNOWN_ERROR']],
    ['serialization error', ['UNKNOWN_ERROR']],
    ['unsupported public key type', ['PUBKEYFORMAT']],
    [
      'attempt to read from empty stack',
      ['EMPTY_STACK', 'EVAL_FALSE', 'UNBALANCED_CONDITIONAL', 'INVALID_ALTSTACK_OPERATION']
    ],
    ['signature is null', ['NULLFAIL']],
    ['invalid signature length', ['NULLFAIL']],
    ['invalid sighash type', ['SIG_HASHTYPE']],
    ['signature script is not push only', ['SIG_PUSHONLY']],
    ['clean stack', ['CLEANSTACK']],
    ['attempt to execute reserved opcode', ['BAD_OPCODE']],
    ['malformed push operation', ['BAD_OPCODE']],
    ['attempt to execute invalid opcode', ['BAD_OPCODE']],
    ['condition stack empty', ['UNBALANCED_CONDITIONAL']],
    ['end of script reached in conditional execution', ['UNBALANCED_CONDITIONAL']],
    ['script returned early', ['OP_RETURN']],
    ['verify failed', ['VERIFY', 'EQUALVERIFY']],
    ['invalid stack operation', ['INVALID_STACK_OPERATION', 'INVALID_ALTSTACK_OPERATION']],
    ['pick at an invalid location', ['INVALID_STACK_OPERATION']],
    ['roll at an invalid location', ['INVALID_STACK_OPERATION']],
    ['attempt to execute disabled opcode', ['DISABLED_OPCODE']],
    ['element too big', ['PUSH_SIZE']],
    ['too many operations', ['OP_COUNT']],
    ['stack size exceeded', ['STACK_SIZE']],
    ['invalid pubkey count', ['PUBKEY_COUNT']],
    ['invalid signature count', ['SIG_COUNT']],
    ['push encoding is not minimal', ['MINIMALDATA', 'UNKNOWN_ERROR']],
    ['unsatisfied locktime', ['UNSATISFIED_LOCKTIME']],
    ['expected boolean', ['MINIMALIF']],
    ['script size error', ['SCRIPT_SIZE']],
    ['element exceed max size', ['PUSH_SIZE']]
  ]);

  function runTest(sigScript: string, scriptPubKey: string) {
    const scriptSig = parseShortForm(sigScript);
    const scriptPubKeyParsed = new ScriptPublicKey(0, parseShortForm(scriptPubKey));

    const tx = createSpendingTransaction(scriptSig, scriptPubKeyParsed);
    const entry = new UtxoEntry(BigInt(0), scriptPubKeyParsed, BigInt(0), true);
    const populatedTx = new PopulatedTransaction(tx, [entry]);

    const sigCache = new Map<SigCacheKey, boolean>();
    const vm = TxScriptEngine.fromTransactionInput(
      populatedTx,
      populatedTx.tx().inputs[0],
      0,
      populatedTx.utxo(0)!,
      sigCache,
      true
    );

    vm.execute();
  }

  const filePath = path.resolve(__dirname, '../data/script_tests-kip10.json');
  const fileContent = readFileSync(filePath, 'utf-8');
  const tests: string[] = JSON.parse(fileContent);

  for (const row of tests) {
    if (row.length === 1) continue;
    if (row.length !== 4 && row.length !== 5) throw new Error(`Invalid test row: ${row}`);

    let [sigScript, scriptPubKey, , expectedResult] = row;
    it(`test kip10 enabled with sigScript: ${row}`, () => {
      if (expectedResult === 'OK') expect(() => runTest(sigScript, scriptPubKey)).not.toThrow();
      else {
        try {
          runTest(sigScript, scriptPubKey);
        } catch (error: any) {
          let errorMappedTypes = errMap.get(error.message);

          if (!errorMappedTypes) {
            if (error.message.includes('push encoding is not minimal'))
              errorMappedTypes = errMap.get('push encoding is not minimal');
            else if (/opcode requires \d+ bytes, but script only has \d+ remaining/.test(error.message))
              errorMappedTypes = errMap.get('malformed push operation');
            else if (error.message.includes('attempt to execute reserved opcode'))
              errorMappedTypes = errMap.get('attempt to execute reserved opcode');
            else if (error.message.includes('condition stack empty'))
              errorMappedTypes = errMap.get('condition stack empty');
            else if (error.message.includes('pick at an invalid location'))
              errorMappedTypes = errMap.get('pick at an invalid location');
            else if (error.message.includes('roll at an invalid location'))
              errorMappedTypes = errMap.get('roll at an invalid location');
            else if (error.message.includes('expected boolean')) errorMappedTypes = errMap.get('expected boolean');
            else if (/opcode requires at least \d+ but stack has only \d+/.test(error.message))
              errorMappedTypes = errMap.get('invalid stack operation');
            else if (error.message.includes('attempt to execute disabled opcode'))
              errorMappedTypes = errMap.get('attempt to execute disabled opcode');
            else if (error.message.includes('Number too big')) errorMappedTypes = errMap.get('Number too big');
            else if (error.message.includes('attempt to execute invalid opcode'))
              errorMappedTypes = errMap.get('attempt to execute invalid opcode');
            else if (error.message.includes('bytes exceed the maximum allowed script element size of'))
              errorMappedTypes = errMap.get('element exceed max size');
            else if (error.message.includes('exceeded max operation limit of'))
              errorMappedTypes = errMap.get('too many operations');
            else if (/combined stack size \d+ > max allowed \d+/.test(error.message))
              errorMappedTypes = errMap.get('stack size exceeded');
            else if (/script of size \d+ exceeded maximum allowed size of \d+/.test(error.message))
              errorMappedTypes = errMap.get('script size error');
            else if (error.message.includes('invalid pubkey count'))
              errorMappedTypes = errMap.get('invalid pubkey count');
            else if (error.message.includes('invalid signature count'))
              errorMappedTypes = errMap.get('invalid signature count');
            //stack contains 2 unexpected items
            else if (/stack contains \d+ unexpected items/.test(error.message))
              errorMappedTypes = errMap.get('clean stack');
            else if (error.message.includes('Unsatisfied lock time:'))
              errorMappedTypes = errMap.get('unsatisfied locktime');
            else if (error.message.includes('invalid signature length'))
              errorMappedTypes = errMap.get('invalid signature length');
            else throw new Error(`Unknown error: ${error.message}`);
          }

          expect(errorMappedTypes).includes(expectedResult);
        }
      }
    });
  }
});

function isWhitespace(char: string): boolean {
  const code = char.charCodeAt(0);
  return char === ' ' || (code >= 0x09 && code <= 0x0d) || (code > 0x7f && isUnicodeWhiteSpace(char));
}

function isUnicodeWhiteSpace(char: string): boolean {
  // Implement the logic to check if the character is a Unicode whitespace character
  // This is a placeholder function and needs to be implemented based on your requirements
  return /\s/.test(char);
}

function splitWhitespace(script: string): string[] {
  const result: string[] = [];
  let currentWord = '';

  for (const char of script) {
    if (isWhitespace(char)) {
      if (currentWord.length > 0) {
        result.push(currentWord);
        currentWord = '';
      }
    } else {
      currentWord += char;
    }
  }

  if (currentWord.length > 0) {
    result.push(currentWord);
  }

  return result;
}

function parseShortForm(script: string): Uint8Array {
  const builder = new ScriptBuilder();
  const tokens = splitWhitespace(script);

  for (const token of tokens) {
    if (!isNaN(Number(token)) && !token.startsWith('0x')) {
      const value = BigInt(token);
      if (value === i64Min) builder.addI64Min();
      else builder.addI64(value);
    } else if (token.startsWith('0x')) {
      const value = Uint8Array.from(Buffer.from(token.slice(2), 'hex'));
      builder.extend(value);
    } else if (token.startsWith("'") && token.endsWith("'")) {
      builder.addData(new TextEncoder().encode(token.slice(1, -1)));
    } else {
      const opCodeUpper = token.replace('_', '').toUpperCase();
      if (opCodeMap.hasOwnProperty(opCodeUpper)) {
        builder.addOp(opCodeMap[opCodeUpper]);
      } else {
        throw new Error(`Cannot parse: ${token}`);
      }
    }
  }

  return builder.script;
}

const opCodeMap: { [key: string]: number } = Object.fromEntries(
  Object.entries(OpCodes)
    .filter(([_, value]) => typeof value === 'number')
    .map(([key, value]) => {
      const upperKey = key.toUpperCase();
      const numValue = Number(value);
      const entries = [[upperKey, numValue]];

      if (
        upperKey === 'OpFalse'.toUpperCase() ||
        upperKey === 'OpTrue'.toUpperCase() ||
        (value !== OpCodes.Op0 && (numValue < OpCodes.Op1 || numValue > OpCodes.Op16))
      ) {
        const shortKey = upperKey.slice(2);
        entries.push([shortKey, numValue]);
      }

      return entries;
    })
    .flat()
);

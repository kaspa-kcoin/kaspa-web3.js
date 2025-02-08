import { describe, it, expect } from 'vitest';
import {
  getSigOpCount,
  Hash,
  isUnspendable,
  OpCodes,
  PopulatedTransaction,
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

describe('TxScriptEngine Tests', () => {
  interface ScriptTestCase {
    script: Uint8Array;
    errorMsg?: string;
  }

  interface KeyTestCase {
    name: string;
    key: Uint8Array;
    isValid: boolean;
  }

  interface TestVector {
    name: string;
    signatureScript: Uint8Array;
    expectedSigOps: number;
    prevScriptPublicKey: ScriptPublicKey;
  }

  interface Test {
    name: string;
    scriptPublicKey: Uint8Array;
    expected: boolean;
  }

  function runTestScriptCases(testCases: ScriptTestCase[]) {
    const sigCache = new Map<SigCacheKey, boolean>();

    for (const test of testCases) {
      const input = new TransactionInput(
        new TransactionOutpoint(
          Hash.fromBytes(
            new Uint8Array([
              0xc9, 0x97, 0xa5, 0xe5, 0x6e, 0x10, 0x41, 0x02, 0xfa, 0x20, 0x9c, 0x6a, 0x85, 0x2d, 0xd9, 0x06, 0x60,
              0xa2, 0x0b, 0x2d, 0x9c, 0x35, 0x24, 0x23, 0xed, 0xce, 0x25, 0x85, 0x7f, 0xcd, 0x37, 0x04
            ])
          ),
          0
        ),
        new Uint8Array([]),
        4294967295n,
        0
      );

      const output = new TransactionOutput(1000000000n, new ScriptPublicKey(0, test.script));
      const tx = new Transaction(1, [input], [output], 0n, SubnetworkId.fromByte(0), 0n, new Uint8Array([]));
      const utxoEntry = new UtxoEntry(output.value, output.scriptPublicKey, 0n, tx.isCoinbase());
      const populatedTx = new PopulatedTransaction(tx, [utxoEntry]);
      const vm = TxScriptEngine.fromTransactionInput(populatedTx, input, 0, utxoEntry, sigCache, true);

      if (test.errorMsg) expect(() => vm.execute()).toThrow(new Error(test.errorMsg));
      else expect(() => vm.execute()).not.toThrow();
    }
  }

  it('test_check_error_condition', () => {
    const testCases: ScriptTestCase[] = [
      { script: new Uint8Array([0x51]), errorMsg: undefined }, // OpTrue
      { script: new Uint8Array([0x61]), errorMsg: 'attempt to read from empty stack' }, // OpNop
      { script: new Uint8Array([0x51, 0x51]), errorMsg: 'stack contains 1 unexpected items' }, // OpTrue, OpTrue
      { script: new Uint8Array([0x00]), errorMsg: 'false stack entry at end of script execution' } // OpFalse
    ];

    runTestScriptCases(testCases);
  });

  it('test_check_opif', () => {
    const testCases: ScriptTestCase[] = [
      { script: new Uint8Array([0x63]), errorMsg: 'attempt to read from empty stack' }, // OpIf
      {
        script: new Uint8Array([0x52, 0x63]),
        errorMsg: 'encountered invalid state while running script: expected boolean'
      }, // Op2, OpIf
      {
        script: new Uint8Array([0x51, 0x63]),
        errorMsg: 'end of script reached in conditional execution'
      }, // OpTrue, OpIf
      {
        script: new Uint8Array([0x00, 0x63]),
        errorMsg: 'end of script reached in conditional execution'
      }, // OpFalse, OpIf
      { script: new Uint8Array([0x51, 0x63, 0x51, 0x68]), errorMsg: undefined }, // OpTrue, OpIf, OpTrue, OpEndIf
      { script: new Uint8Array([0x00, 0x63, 0x51, 0x68]), errorMsg: 'attempt to read from empty stack' } // OpFalse, OpIf, OpTrue, OpEndIf
    ];

    runTestScriptCases(testCases);
  });

  it('test_check_opelse', () => {
    const testCases: ScriptTestCase[] = [
      {
        script: new Uint8Array([0x67]),
        errorMsg: 'encountered invalid state while running script: condition stack empty'
      }, // OpElse
      {
        script: new Uint8Array([0x51, 0x63, 0x67]),
        errorMsg: 'end of script reached in conditional execution'
      }, // OpTrue, OpIf, OpElse
      {
        script: new Uint8Array([0x00, 0x63, 0x67]),
        errorMsg: 'end of script reached in conditional execution'
      }, // OpFalse, OpIf, OpElse
      { script: new Uint8Array([0x51, 0x63, 0x51, 0x67, 0x68]), errorMsg: undefined }, // OpTrue, OpIf, OpTrue, OpElse, OpEndIf
      { script: new Uint8Array([0x00, 0x63, 0x67, 0x51, 0x68]), errorMsg: undefined } // OpFalse, OpIf, OpElse, OpTrue, OpEndIf
    ];

    runTestScriptCases(testCases);
  });

  it('test_check_opnotif', () => {
    const testCases: ScriptTestCase[] = [
      { script: new Uint8Array([0x64]), errorMsg: 'attempt to read from empty stack' }, // OpNotIf
      {
        script: new Uint8Array([0x51, 0x64]),
        errorMsg: 'end of script reached in conditional execution'
      }, // OpTrue, OpNotIf
      {
        script: new Uint8Array([0x00, 0x64]),
        errorMsg: 'end of script reached in conditional execution'
      }, // OpFalse, OpNotIf
      { script: new Uint8Array([0x51, 0x64, 0x67, 0x51, 0x68]), errorMsg: undefined }, // OpTrue, OpNotIf, OpElse, OpTrue, OpEndIf
      {
        script: new Uint8Array([0x51, 0x64, 0x51, 0x67, 0x00, 0x68]),
        errorMsg: 'false stack entry at end of script execution'
      }, // OpTrue, OpNotIf, OpTrue, OpElse, OpFalse, OpEndIf
      { script: new Uint8Array([0x00, 0x64, 0x51, 0x68]), errorMsg: undefined } // OpFalse, OpNotIf, OpTrue, OpEndIf
    ];

    runTestScriptCases(testCases);
  });

  it('test_check_nestedif', () => {
    const testCases: ScriptTestCase[] = [
      {
        // OpTrue, OpIf, OpFalse, OpElse, OpTrue, OpIf, OpTrue, OpEndIf, OpEndIf
        script: new Uint8Array([0x51, 0x63, 0x00, 0x67, 0x51, 0x63, 0x51, 0x68, 0x68]),
        errorMsg: 'false stack entry at end of script execution'
      },
      {
        // OpTrue, OpIf, OpFalse, OpElse, OpFalse, OpIf, OpElse, OpTrue, OpEndIf, OpEndIf
        script: new Uint8Array([0x51, 0x63, 0x00, 0x67, 0x00, 0x63, 0x67, 0x51, 0x68, 0x68]),
        errorMsg: 'false stack entry at end of script execution'
      },
      {
        // OpTrue, OpNotIf, OpFalse, OpElse, OpTrue, OpIf, OpTrue, OpEndIf, OpEndIf
        script: new Uint8Array([0x51, 0x64, 0x00, 0x67, 0x51, 0x63, 0x51, 0x68, 0x68]),
        errorMsg: undefined
      },
      {
        // OpTrue, OpNotIf, OpFalse, OpElse, OpFalse, OpIf, OpElse, OpTrue, OpEndIf, OpEndIf
        script: new Uint8Array([0x51, 0x64, 0x00, 0x67, 0x00, 0x63, 0x67, 0x51, 0x68, 0x68]),
        errorMsg: undefined
      },
      {
        // OpTrue, OpNotIf, OpFalse, OpElse, OpFalse, OpNotIf, OpFalse, OpElse, OpTrue, OpEndIf, OpEndIf

        script: new Uint8Array([0x51, 0x64, 0x00, 0x67, 0x00, 0x64, 0x00, 0x67, 0x51, 0x68, 0x68]),
        errorMsg: 'false stack entry at end of script execution'
      },
      { script: new Uint8Array([0x51, 0x00, 0x63, 0x63, 0x00, 0x68, 0x68]), errorMsg: undefined }, // OpTrue, OpFalse, OpIf, OpIf, OpFalse, OpEndIf, OpEndIf
      {
        // OpTrue, OpFalse, OpIf, OpIf, OpIf, OpFalse, OpElse, OpFalse, OpEndIf, OpEndIf, OpEndIf

        script: new Uint8Array([0x51, 0x00, 0x63, 0x63, 0x63, 0x00, 0x67, 0x00, 0x68, 0x68, 0x68]),
        errorMsg: undefined
      },
      {
        // OpTrue, OpFalse, OpIf, OpIf, OpIf, OpIf, OpFalse, OpElse, OpFalse, OpEndIf, OpEndIf, OpEndIf, OpEndIf
        script: new Uint8Array([0x51, 0x00, 0x63, 0x63, 0x63, 0x63, 0x00, 0x67, 0x00, 0x68, 0x68, 0x68, 0x68]),
        errorMsg: undefined
      }
    ];

    runTestScriptCases(testCases);
  });

  it('test_check_pub_key_encode', () => {
    const testCases: KeyTestCase[] = [
      {
        name: 'uncompressed - invalid',
        key: new Uint8Array([
          0x04, 0x11, 0xdb, 0x93, 0xe1, 0xdc, 0xdb, 0x8a, 0x01, 0x6b, 0x49, 0x84, 0x0f, 0x8c, 0x53, 0xbc, 0x1e, 0xb6,
          0x8a, 0x38, 0x2e, 0x97, 0xb1, 0x48, 0x2e, 0xca, 0xd7, 0xb1, 0x48, 0xa6, 0x90, 0x9a, 0x5c, 0xb2, 0xe0, 0xea,
          0xdd, 0xfb, 0x84, 0xcc, 0xf9, 0x74, 0x44, 0x64, 0xf8, 0x2e, 0x16, 0x0b, 0xfa, 0x9b, 0x8b, 0x64, 0xf9, 0xd4,
          0xc0, 0x3f, 0x99, 0x9b, 0x86, 0x43, 0xf6, 0x56, 0xb4, 0x12, 0xa3
        ]),
        isValid: false
      },
      {
        name: 'compressed - invalid',
        key: new Uint8Array([
          0x02, 0xce, 0x0b, 0x14, 0xfb, 0x84, 0x2b, 0x1b, 0xa5, 0x49, 0xfd, 0xd6, 0x75, 0xc9, 0x80, 0x75, 0xf1, 0x2e,
          0x9c, 0x51, 0x0f, 0x8e, 0xf5, 0x2b, 0xd0, 0x21, 0xa9, 0xa1, 0xf4, 0x80, 0x9d, 0x3b, 0x4d
        ]),
        isValid: false
      },
      {
        name: 'compressed - invalid',
        key: new Uint8Array([
          0x03, 0x26, 0x89, 0xc7, 0xc2, 0xda, 0xb1, 0x33, 0x09, 0xfb, 0x14, 0x3e, 0x0e, 0x8f, 0xe3, 0x96, 0x34, 0x25,
          0x21, 0x88, 0x7e, 0x97, 0x66, 0x90, 0xb6, 0xb4, 0x7f, 0x5b, 0x2a, 0x4b, 0x7d, 0x44, 0x8e
        ]),
        isValid: false
      },
      {
        name: 'hybrid - invalid',
        key: new Uint8Array([
          0x06, 0x79, 0xbe, 0x66, 0x7e, 0xf9, 0xdc, 0xbb, 0xac, 0x55, 0xa0, 0x62, 0x95, 0xce, 0x87, 0x0b, 0x07, 0x02,
          0x9b, 0xfc, 0xdb, 0x2d, 0xce, 0x28, 0xd9, 0x59, 0xf2, 0x81, 0x5b, 0x16, 0xf8, 0x17, 0x98, 0x48, 0x3a, 0xda,
          0x77, 0x26, 0xa3, 0xc4, 0x65, 0x5d, 0xa4, 0xfb, 0xfc, 0x0e, 0x11, 0x08, 0xa8, 0xfd, 0x17, 0xb4, 0x48, 0xa6,
          0x85, 0x54, 0x19, 0x9c, 0x47, 0xd0, 0x8f, 0xfb, 0x10, 0xd4, 0xb8
        ]),
        isValid: false
      },
      {
        name: '32 bytes pubkey - Ok',
        key: new Uint8Array([
          0x26, 0x89, 0xc7, 0xc2, 0xda, 0xb1, 0x33, 0x09, 0xfb, 0x14, 0x3e, 0x0e, 0x8f, 0xe3, 0x96, 0x34, 0x25, 0x21,
          0x88, 0x7e, 0x97, 0x66, 0x90, 0xb6, 0xb4, 0x7f, 0x5b, 0x2a, 0x4b, 0x7d, 0x44, 0x8e
        ]),
        isValid: true
      },
      { name: 'empty', key: new Uint8Array([]), isValid: false }
    ];

    for (const test of testCases) {
      if (test.isValid) {
        expect(() => TxScriptEngine.checkPubKeyEncoding(test.key)).not.toThrow();
      } else {
        expect(() => TxScriptEngine.checkPubKeyEncoding(test.key)).toThrow(new Error('unsupported public key type'));
      }
    }
  });

  it('test_get_sig_op_count', () => {
    const scriptHash = Buffer.from('433ec2ac1ffa1b7b7d027f564529c57197f9ae88', 'hex');
    const prevScriptPubkeyP2shScript = new Uint8Array([
      OpCodes.OpBlake2b,
      OpCodes.OpData32,
      ...scriptHash,
      OpCodes.OpEqual
    ]);
    const prevScriptPubkeyP2sh = new ScriptPublicKey(0, prevScriptPubkeyP2shScript);

    const tests: TestVector[] = [
      {
        name: "scriptSig doesn't parse",
        signatureScript: new Uint8Array([OpCodes.OpPushData1, 0x02]),
        expectedSigOps: 0,
        prevScriptPublicKey: prevScriptPubkeyP2sh
      },
      {
        name: "scriptSig isn't push only",
        signatureScript: new Uint8Array([OpCodes.OpTrue, OpCodes.OpDup]),
        expectedSigOps: 0,
        prevScriptPublicKey: prevScriptPubkeyP2sh
      },
      {
        name: 'scriptSig length 0',
        signatureScript: new Uint8Array([]),
        expectedSigOps: 0,
        prevScriptPublicKey: prevScriptPubkeyP2sh
      },
      {
        name: 'No script at the end',
        signatureScript: new Uint8Array([OpCodes.OpTrue, OpCodes.OpTrue]),
        expectedSigOps: 0,
        prevScriptPublicKey: prevScriptPubkeyP2sh
      },
      {
        name: "pushed script doesn't parse",
        signatureScript: new Uint8Array([OpCodes.OpData2, OpCodes.OpPushData1, 0x02]),
        expectedSigOps: 0,
        prevScriptPublicKey: prevScriptPubkeyP2sh
      },
      {
        name: 'mainnet multisig transaction 487f94ffa63106f72644068765b9dc629bb63e481210f382667d4a93b69af412',
        signatureScript: Buffer.from(
          '41eb577889fa28283709201ef5b056745c6cf0546dd31666cecd41c40a581b256e885d941b86b14d44efacec12d614e7fcabf7b341660f95bab16b71d766ab010501411c0eeef117ca485d34e4bc0cf6d5b578aa250c5d13ebff0882a7e2eeea1f31e8ecb6755696d194b1b0fcb853afab28b61f3f7cec487bd611df7e57252802f535014c875220ab64c7691713a32ea6dfced9155c5c26e8186426f0697af0db7a4b1340f992d12041ae738d66fe3d21105483e5851778ad73c5cddf0819c5e8fd8a589260d967e72065120722c36d3fac19646258481dd3661fa767da151304af514cb30af5cb5692203cd7690ecb67cbbe6cafad00a7c9133da535298ab164549e0cce2658f7b3032754ae',
          'hex'
        ),
        prevScriptPublicKey: new ScriptPublicKey(
          0,
          Buffer.from('aa20f38031f61ca23d70844f63a477d07f0b2c2decab907c2e096e548b0e08721c7987', 'hex')
        ),
        expectedSigOps: 4
      },
      {
        name: 'a partially parseable script public key',
        signatureScript: new Uint8Array([]),
        prevScriptPublicKey: new ScriptPublicKey(
          0,
          new Uint8Array([OpCodes.OpCheckSig, OpCodes.OpCheckSig, OpCodes.OpData1])
        ),
        expectedSigOps: 2
      },
      {
        name: 'p2pk',
        signatureScript: Buffer.from(
          '416db0c0ce824a6d076c8e73aae9987416933df768e07760829cb0685dc0a2bbb11e2c0ced0cab806e111a11cbda19784098fd25db176b6a9d7c93e5747674d32301',
          'hex'
        ),
        prevScriptPublicKey: new ScriptPublicKey(
          0,
          Buffer.from('208a457ca74ade0492c44c440da1cab5b008d8449150fe2794f0d8f4cce7e8aa27ac', 'hex')
        ),
        expectedSigOps: 1
      }
    ];

    for (const test of tests) {
      expect(getSigOpCount(test.signatureScript, test.prevScriptPublicKey)).toEqual(test.expectedSigOps);
    }
  });

  it('test_is_unspendable', () => {
    const tests: Test[] = [
      { name: 'unspendable', scriptPublicKey: new Uint8Array([0x6a, 0x04, 0x74, 0x65, 0x73, 0x74]), expected: true },
      {
        name: 'spendable',
        scriptPublicKey: new Uint8Array([
          0x76, 0xa9, 0x14, 0x29, 0x95, 0xa0, 0xfe, 0x68, 0x43, 0xfa, 0x9b, 0x95, 0x45, 0x97, 0xf0, 0xdc, 0xa7, 0xa4,
          0x4d, 0xf6, 0xfa, 0x0b, 0x5c, 0x88, 0xac
        ]),
        expected: false
      }
    ];

    for (const test of tests) {
      expect(isUnspendable(test.scriptPublicKey)).toEqual(test.expected);
    }
  });
});

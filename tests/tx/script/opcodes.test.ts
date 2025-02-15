import { describe, expect, it } from 'vitest';
import {
  Address,
  AddressPrefix,
  Hash,
  IVerifiableTransaction,
  LOCK_TIME_THRESHOLD,
  OpCode,
  OpCodes,
  PopulatedTransaction,
  ScriptBuilder,
  ScriptPublicKey,
  SigCacheKey,
  SOMPI_PER_KASPA,
  SUBNETWORK_ID_NATIVE,
  Transaction,
  TransactionId,
  TransactionInput,
  TransactionOutpoint,
  TransactionOutput,
  TX_VERSION,
  TxScriptEngine,
  TxScriptError,
  UtxoEntry
} from '../../../src';
import { payToAddressScript, payToScriptHashScript } from '../../../src/tx/script/standard';
import { DataStack } from '../../../src/tx/script/dataStack';
import { SizedEncodeInt } from '../../../src/tx/script/dataStack/sized-encode-int';

interface TestCase {
  init: DataStack;
  code: OpCode;
  dstack: DataStack;
}

interface ErrorTestCase {
  init: DataStack;
  code: OpCode;
  errorMsg?: string;
}

function runSuccessTestCases(tests: TestCase[]) {
  const cache = new Map<SigCacheKey, boolean>();
  for (const { init, code, dstack } of tests) {
    const vm = new TxScriptEngine(cache, true);
    // Initialize the VM with the provided stack and code
    vm.dstack.push(...init);
    code.execute(vm);
    expect(vm.dstack).toEqual(dstack);
  }
}

function runErrorTestCases(tests: ErrorTestCase[]) {
  const cache = new Map<SigCacheKey, boolean>();
  for (const { init, code, errorMsg } of tests) {
    const vm = new TxScriptEngine(cache, true);
    // Initialize the VM with the provided stack and code
    vm.dstack.push(...init);
    expect(() => code.execute(vm)).toThrowError(errorMsg);
  }
}

describe('OpCode Tests', () => {
  it('test_opcode_disabled', () => {
    const tests = [
      OpCode.empty(OpCodes.OpCat),
      OpCode.empty(OpCodes.OpSubStr),
      OpCode.empty(OpCodes.OpLeft),
      OpCode.empty(OpCodes.OpRight),
      OpCode.empty(OpCodes.OpInvert),
      OpCode.empty(OpCodes.OpAnd),
      OpCode.empty(OpCodes.OpOr),
      OpCode.empty(OpCodes.OpXor),
      OpCode.empty(OpCodes.Op2Mul),
      OpCode.empty(OpCodes.Op2Div),
      OpCode.empty(OpCodes.OpMul),
      OpCode.empty(OpCodes.OpDiv),
      OpCode.empty(OpCodes.OpMod),
      OpCode.empty(OpCodes.OpLShift),
      OpCode.empty(OpCodes.OpRShift)
    ];

    const sigCache = new Map<SigCacheKey, boolean>();
    const vm = new TxScriptEngine(sigCache, true);

    for (const op of tests) {
      expect(() => op.execute(vm)).toThrow(new TxScriptError(`attempt to execute disabled opcode ${op.value()}`));
    }
  });

  it('test_opcode_reserved', () => {
    const tests = [
      OpCode.empty(OpCodes.OpReserved),
      OpCode.empty(OpCodes.OpVer),
      OpCode.empty(OpCodes.OpVerIf),
      OpCode.empty(OpCodes.OpVerNotIf),
      OpCode.empty(OpCodes.OpReserved1),
      OpCode.empty(OpCodes.OpReserved2),
      OpCode.empty(OpCodes.OpTxVersion),
      OpCode.empty(OpCodes.OpTxLockTime),
      OpCode.empty(OpCodes.OpTxSubnetId),
      OpCode.empty(OpCodes.OpTxGas),
      OpCode.empty(OpCodes.OpTxPayload),
      OpCode.empty(OpCodes.OpOutpointTxId),
      OpCode.empty(OpCodes.OpOutpointIndex),
      OpCode.empty(OpCodes.OpTxInputScriptSig),
      OpCode.empty(OpCodes.OpTxInputSeq),
      OpCode.empty(OpCodes.OpTxInputBlockDaaScore),
      OpCode.empty(OpCodes.OpTxInputIsCoinbase)
    ];

    const sigCache = new Map<SigCacheKey, boolean>();
    const vm = new TxScriptEngine(sigCache, true);

    for (const op of tests) {
      expect(() => op.execute(vm)).toThrow(new TxScriptError(`attempt to execute reserved opcode ${op.value()}`));
    }
  });

  it('test_opcode_invalid', () => {
    const tests = [
      OpCode.empty(OpCodes.OpUnknown166),
      OpCode.empty(OpCodes.OpUnknown167),
      OpCode.empty(OpCodes.OpUnknown196),
      OpCode.empty(OpCodes.OpUnknown197),
      OpCode.empty(OpCodes.OpUnknown198),
      OpCode.empty(OpCodes.OpUnknown199),
      OpCode.empty(OpCodes.OpUnknown200),
      OpCode.empty(OpCodes.OpUnknown201),
      OpCode.empty(OpCodes.OpUnknown202),
      OpCode.empty(OpCodes.OpUnknown203),
      OpCode.empty(OpCodes.OpUnknown204),
      OpCode.empty(OpCodes.OpUnknown205),
      OpCode.empty(OpCodes.OpUnknown206),
      OpCode.empty(OpCodes.OpUnknown207),
      OpCode.empty(OpCodes.OpUnknown208),
      OpCode.empty(OpCodes.OpUnknown209),
      OpCode.empty(OpCodes.OpUnknown210),
      OpCode.empty(OpCodes.OpUnknown211),
      OpCode.empty(OpCodes.OpUnknown212),
      OpCode.empty(OpCodes.OpUnknown213),
      OpCode.empty(OpCodes.OpUnknown214),
      OpCode.empty(OpCodes.OpUnknown215),
      OpCode.empty(OpCodes.OpUnknown216),
      OpCode.empty(OpCodes.OpUnknown217),
      OpCode.empty(OpCodes.OpUnknown218),
      OpCode.empty(OpCodes.OpUnknown219),
      OpCode.empty(OpCodes.OpUnknown220),
      OpCode.empty(OpCodes.OpUnknown221),
      OpCode.empty(OpCodes.OpUnknown222),
      OpCode.empty(OpCodes.OpUnknown223),
      OpCode.empty(OpCodes.OpUnknown224),
      OpCode.empty(OpCodes.OpUnknown225),
      OpCode.empty(OpCodes.OpUnknown226),
      OpCode.empty(OpCodes.OpUnknown227),
      OpCode.empty(OpCodes.OpUnknown228),
      OpCode.empty(OpCodes.OpUnknown229),
      OpCode.empty(OpCodes.OpUnknown230),
      OpCode.empty(OpCodes.OpUnknown231),
      OpCode.empty(OpCodes.OpUnknown232),
      OpCode.empty(OpCodes.OpUnknown233),
      OpCode.empty(OpCodes.OpUnknown234),
      OpCode.empty(OpCodes.OpUnknown235),
      OpCode.empty(OpCodes.OpUnknown236),
      OpCode.empty(OpCodes.OpUnknown237),
      OpCode.empty(OpCodes.OpUnknown238),
      OpCode.empty(OpCodes.OpUnknown239),
      OpCode.empty(OpCodes.OpUnknown240),
      OpCode.empty(OpCodes.OpUnknown241),
      OpCode.empty(OpCodes.OpUnknown242),
      OpCode.empty(OpCodes.OpUnknown243),
      OpCode.empty(OpCodes.OpUnknown244),
      OpCode.empty(OpCodes.OpUnknown245),
      OpCode.empty(OpCodes.OpUnknown246),
      OpCode.empty(OpCodes.OpUnknown247),
      OpCode.empty(OpCodes.OpUnknown248),
      OpCode.empty(OpCodes.OpUnknown249)
    ];

    const sigCache = new Map<SigCacheKey, boolean>();
    const vm = new TxScriptEngine(sigCache, true);

    for (const op of tests) {
      expect(() => op.execute(vm)).toThrow(new TxScriptError(`attempt to execute invalid opcode ${op.value()}`));
    }
  });

  it('test_push_data', () => {
    const testCases: TestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpFalse),
        dstack: [new Uint8Array(0)] as DataStack
      },
      {
        init: new DataStack(),
        code: new OpCode(OpCodes.OpData1, new Uint8Array(1).fill(1)),
        dstack: [new Uint8Array(1).fill(1)] as DataStack
      },
      // OpData2-OpData75
      ...Array.from({ length: 74 }, (_, i) => ({
        init: new DataStack(),
        code: new OpCode(OpCodes.OpData2 + i, new Uint8Array(i + 2).fill(1)),
        dstack: [new Uint8Array(i + 2).fill(1)] as DataStack
      })),
      // PushData tests
      {
        init: new DataStack(),
        code: new OpCode(OpCodes.OpPushData1, new Uint8Array(0x4).fill(1)),
        dstack: [new Uint8Array(0x4).fill(1)] as DataStack
      },
      {
        init: new DataStack(),
        code: new OpCode(OpCodes.OpPushData2, new Uint8Array(0x100).fill(1)),
        dstack: [new Uint8Array(0x100).fill(1)] as DataStack
      },
      {
        init: new DataStack(),
        code: new OpCode(OpCodes.OpPushData4, new Uint8Array(0x10000).fill(1)),
        dstack: [new Uint8Array(0x10000).fill(1)] as DataStack
      }
    ];
    runSuccessTestCases(testCases);
  });

  it('test_push_num', () => {
    const testCases: TestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.Op1Negate),
        dstack: [new Uint8Array([0x81])] as DataStack
      },
      // Op1 through Op16
      ...Array.from({ length: 16 }, (_, i) => ({
        init: new DataStack(),
        code: OpCode.empty(OpCodes.Op1 + i),
        dstack: [new Uint8Array([i + 1])] as DataStack
      }))
    ];

    runSuccessTestCases(testCases);
  });

  it('test_uniary_num_ops', () => {
    const testCases: TestCase[] = [
      // Op1Add tests
      {
        init: [new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.Op1Add),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.Op1Add),
        dstack: [new Uint8Array([2])] as DataStack
      },
      {
        init: [new Uint8Array([2, 1])] as DataStack,
        code: OpCode.empty(OpCodes.Op1Add),
        dstack: [new Uint8Array([3, 1])] as DataStack
      },
      {
        init: [new Uint8Array([0x81])] as DataStack,
        code: OpCode.empty(OpCodes.Op1Add),
        dstack: [new Uint8Array([])] as DataStack
      },

      // Op1Sub tests
      {
        init: [new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.Op1Sub),
        dstack: [new Uint8Array([0x81])] as DataStack
      },
      {
        init: [new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.Op1Sub),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([2])] as DataStack,
        code: OpCode.empty(OpCodes.Op1Sub),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([3, 1])] as DataStack,
        code: OpCode.empty(OpCodes.Op1Sub),
        dstack: [new Uint8Array([2, 1])] as DataStack
      },

      // OpNegate tests
      {
        init: [new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpNegate),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpNegate),
        dstack: [new Uint8Array([0x81])] as DataStack
      },
      {
        init: [new Uint8Array([0x81])] as DataStack,
        code: OpCode.empty(OpCodes.OpNegate),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([3, 1])] as DataStack,
        code: OpCode.empty(OpCodes.OpNegate),
        dstack: [new Uint8Array([3, 0x81])] as DataStack
      },

      // OpAbs tests
      {
        init: [new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpAbs),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([3, 1])] as DataStack,
        code: OpCode.empty(OpCodes.OpAbs),
        dstack: [new Uint8Array([3, 1])] as DataStack
      },
      {
        init: [new Uint8Array([3, 0x81])] as DataStack,
        code: OpCode.empty(OpCodes.OpAbs),
        dstack: [new Uint8Array([3, 1])] as DataStack
      },
      {
        init: [new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpAbs),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([0x81])] as DataStack,
        code: OpCode.empty(OpCodes.OpAbs),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1, 1, 0x82])] as DataStack,
        code: OpCode.empty(OpCodes.OpAbs),
        dstack: [new Uint8Array([1, 1, 2])] as DataStack
      },

      // OpNot tests
      {
        init: [new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpNot),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpNot),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([1, 2, 3])] as DataStack,
        code: OpCode.empty(OpCodes.OpNot),
        dstack: [new Uint8Array([])] as DataStack
      },

      // Op0NotEqual tests
      {
        init: [new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.Op0NotEqual),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.Op0NotEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([2])] as DataStack,
        code: OpCode.empty(OpCodes.Op0NotEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1, 2, 3])] as DataStack,
        code: OpCode.empty(OpCodes.Op0NotEqual),
        dstack: [new Uint8Array([1])] as DataStack
      }
    ];

    runSuccessTestCases(testCases);
  });

  it('test_binary_num_ops', () => {
    const testCases: TestCase[] = [
      // OpAdd tests
      {
        init: [new Uint8Array([]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpAdd),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpAdd),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpAdd),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpAdd),
        dstack: [new Uint8Array([2])] as DataStack
      },
      {
        init: [new Uint8Array([0x81]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpAdd),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([0x7f]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpAdd),
        dstack: [new Uint8Array([0x80, 0])] as DataStack
      },
      {
        init: [new Uint8Array([0x80, 0]), new Uint8Array([0x80, 0])] as DataStack,
        code: OpCode.empty(OpCodes.OpAdd),
        dstack: [new Uint8Array([0, 1])] as DataStack
      },
      {
        init: [new Uint8Array([0xff, 0]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpAdd),
        dstack: [new Uint8Array([0, 1])] as DataStack
      },

      // OpSub tests
      {
        init: [new Uint8Array([]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpSub),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpSub),
        dstack: [new Uint8Array([0x81])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpSub),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpSub),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([0x81]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpSub),
        dstack: [new Uint8Array([0x82])] as DataStack
      },
      {
        init: [new Uint8Array([0x80, 0]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpSub),
        dstack: [new Uint8Array([0x7f])] as DataStack
      },
      {
        init: [new Uint8Array([0, 1]), new Uint8Array([0x80, 0])] as DataStack,
        code: OpCode.empty(OpCodes.OpSub),
        dstack: [new Uint8Array([0x80, 0])] as DataStack
      },
      {
        init: [new Uint8Array([0, 1]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpSub),
        dstack: [new Uint8Array([0xff, 0])] as DataStack
      },

      // OpMax tests
      {
        init: [new Uint8Array([0, 1]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpMax),
        dstack: [new Uint8Array([0, 1])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([0, 1])] as DataStack,
        code: OpCode.empty(OpCodes.OpMax),
        dstack: [new Uint8Array([0, 1])] as DataStack
      },
      {
        init: [new Uint8Array([0, 0x81]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpMax),
        dstack: [new Uint8Array([1])] as DataStack
      },

      // OpMin tests
      {
        init: [new Uint8Array([0, 1]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpMin),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([0, 1])] as DataStack,
        code: OpCode.empty(OpCodes.OpMin),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([0, 0x81]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpMin),
        dstack: [new Uint8Array([0, 0x81])] as DataStack
      }
    ];

    runSuccessTestCases(testCases);
  });

  it('test_logical_ops', () => {
    const testCases: TestCase[] = [
      // OpEqual tests - 4 cases
      {
        init: [new Uint8Array([]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([0, 1, 1, 0]), new Uint8Array([0, 1, 1, 0])] as DataStack,
        code: OpCode.empty(OpCodes.OpEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([0])] as DataStack,
        code: OpCode.empty(OpCodes.OpEqual),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([0, 1, 1, 0]), new Uint8Array([0, 1, 1, 1])] as DataStack,
        code: OpCode.empty(OpCodes.OpEqual),
        dstack: [new Uint8Array([])] as DataStack
      },

      // OpBoolAnd tests - 5 cases
      {
        init: [new Uint8Array([]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpBoolAnd),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpBoolAnd),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpBoolAnd),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpBoolAnd),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([0x81])] as DataStack,
        code: OpCode.empty(OpCodes.OpBoolAnd),
        dstack: [new Uint8Array([1])] as DataStack
      },

      // OpBoolOr tests - 5 cases
      {
        init: [new Uint8Array([]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpBoolOr),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpBoolOr),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpBoolOr),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpBoolOr),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([0x81]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpBoolOr),
        dstack: [new Uint8Array([1])] as DataStack
      },

      // OpNumEqual tests - 4 cases
      {
        init: [new Uint8Array([1]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpNumEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpNumEqual),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([0x81]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpNumEqual),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpNumEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },

      // OpNumNotEqual tests - 4 cases
      {
        init: [new Uint8Array([1]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpNumNotEqual),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpNumNotEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([0x81]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpNumNotEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpNumNotEqual),
        dstack: [new Uint8Array([])] as DataStack
      },

      // OpLessThan tests - 7 cases
      {
        init: [new Uint8Array([1]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpLessThan),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpLessThan),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([0x81]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpLessThan),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpLessThan),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpLessThan),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([0x81])] as DataStack,
        code: OpCode.empty(OpCodes.OpLessThan),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([0x81])] as DataStack,
        code: OpCode.empty(OpCodes.OpLessThan),
        dstack: [new Uint8Array([])] as DataStack
      },

      // OpLessThanOrEqual tests - 7 cases
      {
        init: [new Uint8Array([1]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpLessThanOrEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpLessThanOrEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([0x81]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpLessThanOrEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpLessThanOrEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpLessThanOrEqual),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([0x81])] as DataStack,
        code: OpCode.empty(OpCodes.OpLessThanOrEqual),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([0x81])] as DataStack,
        code: OpCode.empty(OpCodes.OpLessThanOrEqual),
        dstack: [new Uint8Array([])] as DataStack
      },

      // OpGreaterThan tests - 7 cases
      {
        init: [new Uint8Array([1]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpGreaterThan),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpGreaterThan),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([0x81]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpGreaterThan),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpGreaterThan),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpGreaterThan),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([0x81])] as DataStack,
        code: OpCode.empty(OpCodes.OpGreaterThan),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([0x81])] as DataStack,
        code: OpCode.empty(OpCodes.OpGreaterThan),
        dstack: [new Uint8Array([1])] as DataStack
      },

      // OpGreaterThanOrEqual tests - 7 cases
      {
        init: [new Uint8Array([1]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpGreaterThanOrEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpGreaterThanOrEqual),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([0x81]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpGreaterThanOrEqual),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpGreaterThanOrEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpGreaterThanOrEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([0x81])] as DataStack,
        code: OpCode.empty(OpCodes.OpGreaterThanOrEqual),
        dstack: [new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([0x81])] as DataStack,
        code: OpCode.empty(OpCodes.OpGreaterThanOrEqual),
        dstack: [new Uint8Array([1])] as DataStack
      }
    ];

    runSuccessTestCases(testCases);
  });

  it('test_opdepth', () => {
    const testCases: TestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpDepth),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpDepth),
        dstack: [new Uint8Array([]), new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])] as DataStack,
        code: OpCode.empty(OpCodes.OpDepth),
        dstack: [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3]), new Uint8Array([3])] as DataStack
      }
    ];

    runSuccessTestCases(testCases);
  });

  it('test_opdrop', () => {
    const successCases: TestCase[] = [
      {
        init: [new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpDrop),
        dstack: new DataStack()
      },
      {
        init: [new Uint8Array([]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpDrop),
        dstack: [new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3]), new Uint8Array([3])] as DataStack,
        code: OpCode.empty(OpCodes.OpDrop),
        dstack: [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])] as DataStack
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpDrop),
        errorMsg: 'opcode requires at least 1 but stack has only 0'
      }
    ];
    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_op2drop', () => {
    const successCases: TestCase[] = [
      {
        init: [new Uint8Array([]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.Op2Drop),
        dstack: new DataStack()
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3]), new Uint8Array([3])] as DataStack,
        code: OpCode.empty(OpCodes.Op2Drop),
        dstack: [new Uint8Array([1]), new Uint8Array([2])] as DataStack
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.Op2Drop),
        errorMsg: 'opcode requires at least 2 but stack has only 0'
      },
      {
        init: [new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.Op2Drop),
        errorMsg: 'opcode requires at least 2 but stack has only 1'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_opdup', () => {
    const successCases: TestCase[] = [
      {
        init: [new Uint8Array([])] as DataStack,
        code: OpCode.empty(OpCodes.OpDup),
        dstack: [new Uint8Array([]), new Uint8Array([])] as DataStack
      },
      {
        init: [new Uint8Array([]), new Uint8Array([1])] as DataStack,
        code: OpCode.empty(OpCodes.OpDup),
        dstack: [new Uint8Array([]), new Uint8Array([1]), new Uint8Array([1])] as DataStack
      },
      {
        init: [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3]), new Uint8Array([3])] as DataStack,
        code: OpCode.empty(OpCodes.OpDup),
        dstack: [
          new Uint8Array([1]),
          new Uint8Array([2]),
          new Uint8Array([3]),
          new Uint8Array([3]),
          new Uint8Array([3])
        ] as DataStack
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpDup),
        errorMsg: 'opcode requires at least 1 but stack has only 0'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_op2dup', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([1])),
        code: OpCode.empty(OpCodes.Op2Dup),
        dstack: new DataStack(new Uint8Array([]), new Uint8Array([1]), new Uint8Array([]), new Uint8Array([1]))
      },
      {
        init: new DataStack(new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])),
        code: OpCode.empty(OpCodes.Op2Dup),
        dstack: new DataStack(
          new Uint8Array([1]),
          new Uint8Array([2]),
          new Uint8Array([3]),
          new Uint8Array([2]),
          new Uint8Array([3])
        )
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.Op2Dup),
        errorMsg: 'opcode requires at least 2 but stack has only 0'
      },
      {
        init: new DataStack(new Uint8Array([])),
        code: OpCode.empty(OpCodes.Op2Dup),
        errorMsg: 'opcode requires at least 2 but stack has only 1'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_op3dup', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([0x81]), new Uint8Array([]), new Uint8Array([1])),
        code: OpCode.empty(OpCodes.Op3Dup),
        dstack: new DataStack(
          new Uint8Array([0x81]),
          new Uint8Array([]),
          new Uint8Array([1]),
          new Uint8Array([0x81]),
          new Uint8Array([]),
          new Uint8Array([1])
        )
      },
      {
        init: new DataStack(new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])),
        code: OpCode.empty(OpCodes.Op3Dup),
        dstack: new DataStack(
          new Uint8Array([1]),
          new Uint8Array([2]),
          new Uint8Array([3]),
          new Uint8Array([1]),
          new Uint8Array([2]),
          new Uint8Array([3])
        )
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.Op3Dup),
        errorMsg: 'opcode requires at least 3 but stack has only 0'
      },
      {
        init: new DataStack(new Uint8Array([])),
        code: OpCode.empty(OpCodes.Op3Dup),
        errorMsg: 'opcode requires at least 3 but stack has only 1'
      },
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([])),
        code: OpCode.empty(OpCodes.Op3Dup),
        errorMsg: 'opcode requires at least 3 but stack has only 2'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_opnip', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([1])),
        code: OpCode.empty(OpCodes.OpNip),
        dstack: new DataStack(new Uint8Array([1]))
      },
      {
        init: new DataStack(new Uint8Array([1]), new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpNip),
        dstack: new DataStack(new Uint8Array([]))
      },
      {
        init: new DataStack(new Uint8Array([2]), new Uint8Array([]), new Uint8Array([1])),
        code: OpCode.empty(OpCodes.OpNip),
        dstack: new DataStack(new Uint8Array([2]), new Uint8Array([1]))
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpNip),
        errorMsg: 'opcode requires at least 2 but stack has only 0'
      },
      {
        init: new DataStack(new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpNip),
        errorMsg: 'opcode requires at least 2 but stack has only 1'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_opover', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([1])),
        code: OpCode.empty(OpCodes.OpOver),
        dstack: new DataStack(new Uint8Array([]), new Uint8Array([1]), new Uint8Array([]))
      },
      {
        init: new DataStack(new Uint8Array([1]), new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpOver),
        dstack: new DataStack(new Uint8Array([1]), new Uint8Array([]), new Uint8Array([1]))
      },
      {
        init: new DataStack(new Uint8Array([2]), new Uint8Array([]), new Uint8Array([1])),
        code: OpCode.empty(OpCodes.OpOver),
        dstack: new DataStack(new Uint8Array([2]), new Uint8Array([]), new Uint8Array([1]), new Uint8Array([]))
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpOver),
        errorMsg: 'opcode requires at least 2 but stack has only 0'
      },
      {
        init: new DataStack(new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpOver),
        errorMsg: 'opcode requires at least 2 but stack has only 1'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_op2over', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([0x81]), new Uint8Array([2]), new Uint8Array([]), new Uint8Array([1])),
        code: OpCode.empty(OpCodes.Op2Over),
        dstack: new DataStack(
          new Uint8Array([0x81]),
          new Uint8Array([2]),
          new Uint8Array([]),
          new Uint8Array([1]),
          new Uint8Array([0x81]),
          new Uint8Array([2])
        )
      },
      {
        init: new DataStack(
          new Uint8Array([]),
          new Uint8Array([0x81]),
          new Uint8Array([2]),
          new Uint8Array([]),
          new Uint8Array([1])
        ),
        code: OpCode.empty(OpCodes.Op2Over),
        dstack: new DataStack(
          new Uint8Array([]),
          new Uint8Array([0x81]),
          new Uint8Array([2]),
          new Uint8Array([]),
          new Uint8Array([1]),
          new Uint8Array([0x81]),
          new Uint8Array([2])
        )
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.Op2Over),
        errorMsg: 'opcode requires at least 4 but stack has only 0'
      },
      {
        init: new DataStack(new Uint8Array([])),
        code: OpCode.empty(OpCodes.Op2Over),
        errorMsg: 'opcode requires at least 4 but stack has only 1'
      },
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([])),
        code: OpCode.empty(OpCodes.Op2Over),
        errorMsg: 'opcode requires at least 4 but stack has only 2'
      },
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([]), new Uint8Array([])),
        code: OpCode.empty(OpCodes.Op2Over),
        errorMsg: 'opcode requires at least 4 but stack has only 3'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_oppick', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpPick),
        dstack: new DataStack(new Uint8Array([]), new Uint8Array([]))
      },
      {
        init: new DataStack(new Uint8Array([2]), new Uint8Array([]), new Uint8Array([1])),
        code: OpCode.empty(OpCodes.OpPick),
        dstack: new DataStack(new Uint8Array([2]), new Uint8Array([]), new Uint8Array([2]))
      },
      {
        init: new DataStack(
          new Uint8Array([5]),
          new Uint8Array([4]),
          new Uint8Array([3]),
          new Uint8Array([]),
          new Uint8Array([2])
        ),
        code: OpCode.empty(OpCodes.OpPick),
        dstack: new DataStack(
          new Uint8Array([5]),
          new Uint8Array([4]),
          new Uint8Array([3]),
          new Uint8Array([]),
          new Uint8Array([4])
        )
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(
          new Uint8Array([5]),
          new Uint8Array([4]),
          new Uint8Array([3]),
          new Uint8Array([]),
          new Uint8Array([4])
        ),
        code: OpCode.empty(OpCodes.OpPick),
        errorMsg: 'pick at an invalid location'
      },
      {
        init: new DataStack(
          new Uint8Array([5]),
          new Uint8Array([4]),
          new Uint8Array([3]),
          new Uint8Array([]),
          new Uint8Array([0x81])
        ),
        code: OpCode.empty(OpCodes.OpPick),
        errorMsg: 'pick at an invalid location'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_oproll', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpRoll),
        dstack: new DataStack(new Uint8Array([]))
      },
      {
        init: new DataStack(new Uint8Array([2]), new Uint8Array([]), new Uint8Array([1])),
        code: OpCode.empty(OpCodes.OpRoll),
        dstack: new DataStack(new Uint8Array([]), new Uint8Array([2]))
      },
      {
        init: new DataStack(
          new Uint8Array([5]),
          new Uint8Array([4]),
          new Uint8Array([3]),
          new Uint8Array([]),
          new Uint8Array([2])
        ),
        code: OpCode.empty(OpCodes.OpRoll),
        dstack: new DataStack(new Uint8Array([5]), new Uint8Array([3]), new Uint8Array([]), new Uint8Array([4]))
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(
          new Uint8Array([5]),
          new Uint8Array([4]),
          new Uint8Array([3]),
          new Uint8Array([]),
          new Uint8Array([4])
        ),
        code: OpCode.empty(OpCodes.OpRoll),
        errorMsg: 'roll at an invalid location'
      },
      {
        init: new DataStack(
          new Uint8Array([5]),
          new Uint8Array([4]),
          new Uint8Array([3]),
          new Uint8Array([]),
          new Uint8Array([0x81])
        ),
        code: OpCode.empty(OpCodes.OpRoll),
        errorMsg: 'roll at an invalid location'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_oprot', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])),
        code: OpCode.empty(OpCodes.OpRot),
        dstack: new DataStack(new Uint8Array([2]), new Uint8Array([3]), new Uint8Array([1]))
      },
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])),
        code: OpCode.empty(OpCodes.OpRot),
        dstack: new DataStack(new Uint8Array([]), new Uint8Array([2]), new Uint8Array([3]), new Uint8Array([1]))
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(new Uint8Array([2]), new Uint8Array([3])),
        code: OpCode.empty(OpCodes.OpRot),
        errorMsg: 'opcode requires at least 3 but stack has only 2'
      },
      {
        init: new DataStack(new Uint8Array([3])),
        code: OpCode.empty(OpCodes.OpRot),
        errorMsg: 'opcode requires at least 3 but stack has only 1'
      },
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpRot),
        errorMsg: 'opcode requires at least 3 but stack has only 0'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_op2rot', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(
          new Uint8Array([1]),
          new Uint8Array([2]),
          new Uint8Array([3]),
          new Uint8Array([4]),
          new Uint8Array([5]),
          new Uint8Array([6])
        ),
        code: OpCode.empty(OpCodes.Op2Rot),
        dstack: new DataStack(
          new Uint8Array([3]),
          new Uint8Array([4]),
          new Uint8Array([5]),
          new Uint8Array([6]),
          new Uint8Array([1]),
          new Uint8Array([2])
        )
      },
      {
        init: new DataStack(
          new Uint8Array([]),
          new Uint8Array([1]),
          new Uint8Array([2]),
          new Uint8Array([3]),
          new Uint8Array([4]),
          new Uint8Array([5]),
          new Uint8Array([6])
        ),
        code: OpCode.empty(OpCodes.Op2Rot),
        dstack: new DataStack(
          new Uint8Array([]),
          new Uint8Array([3]),
          new Uint8Array([4]),
          new Uint8Array([5]),
          new Uint8Array([6]),
          new Uint8Array([1]),
          new Uint8Array([2])
        )
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(
          new Uint8Array([1]),
          new Uint8Array([2]),
          new Uint8Array([3]),
          new Uint8Array([4]),
          new Uint8Array([5])
        ),
        code: OpCode.empty(OpCodes.Op2Rot),
        errorMsg: 'opcode requires at least 6 but stack has only 5'
      },
      {
        init: new DataStack(new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3]), new Uint8Array([4])),
        code: OpCode.empty(OpCodes.Op2Rot),
        errorMsg: 'opcode requires at least 6 but stack has only 4'
      },
      {
        init: new DataStack(new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])),
        code: OpCode.empty(OpCodes.Op2Rot),
        errorMsg: 'opcode requires at least 6 but stack has only 3'
      },
      {
        init: new DataStack(new Uint8Array([1]), new Uint8Array([2])),
        code: OpCode.empty(OpCodes.Op2Rot),
        errorMsg: 'opcode requires at least 6 but stack has only 2'
      },
      {
        init: new DataStack(new Uint8Array([1])),
        code: OpCode.empty(OpCodes.Op2Rot),
        errorMsg: 'opcode requires at least 6 but stack has only 1'
      },
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.Op2Rot),
        errorMsg: 'opcode requires at least 6 but stack has only 0'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_opswap', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([1]), new Uint8Array([2])),
        code: OpCode.empty(OpCodes.OpSwap),
        dstack: new DataStack(new Uint8Array([2]), new Uint8Array([1]))
      },
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([1]), new Uint8Array([5])),
        code: OpCode.empty(OpCodes.OpSwap),
        dstack: new DataStack(new Uint8Array([]), new Uint8Array([5]), new Uint8Array([1]))
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(new Uint8Array([1])),
        code: OpCode.empty(OpCodes.OpSwap),
        errorMsg: 'opcode requires at least 2 but stack has only 1'
      },
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpSwap),
        errorMsg: 'opcode requires at least 2 but stack has only 0'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_op2swap', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3]), new Uint8Array([4])),
        code: OpCode.empty(OpCodes.Op2Swap),
        dstack: new DataStack(new Uint8Array([3]), new Uint8Array([4]), new Uint8Array([1]), new Uint8Array([2]))
      },
      {
        init: new DataStack(
          new Uint8Array([]),
          new Uint8Array([1]),
          new Uint8Array([2]),
          new Uint8Array([3]),
          new Uint8Array([4])
        ),
        code: OpCode.empty(OpCodes.Op2Swap),
        dstack: new DataStack(
          new Uint8Array([]),
          new Uint8Array([3]),
          new Uint8Array([4]),
          new Uint8Array([1]),
          new Uint8Array([2])
        )
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([2]), new Uint8Array([1])),
        code: OpCode.empty(OpCodes.Op2Swap),
        errorMsg: 'opcode requires at least 4 but stack has only 3'
      },
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([1])),
        code: OpCode.empty(OpCodes.Op2Swap),
        errorMsg: 'opcode requires at least 4 but stack has only 2'
      },
      {
        init: new DataStack(new Uint8Array([1])),
        code: OpCode.empty(OpCodes.Op2Swap),
        errorMsg: 'opcode requires at least 4 but stack has only 1'
      },
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.Op2Swap),
        errorMsg: 'opcode requires at least 4 but stack has only 0'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_optuck', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([1]), new Uint8Array([2])),
        code: OpCode.empty(OpCodes.OpTuck),
        dstack: new DataStack(new Uint8Array([2]), new Uint8Array([1]), new Uint8Array([2]))
      },
      {
        init: new DataStack(new Uint8Array([3]), new Uint8Array([9]), new Uint8Array([2])),
        code: OpCode.empty(OpCodes.OpTuck),
        dstack: new DataStack(new Uint8Array([3]), new Uint8Array([2]), new Uint8Array([9]), new Uint8Array([2]))
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(new Uint8Array([3])),
        code: OpCode.empty(OpCodes.OpTuck),
        errorMsg: 'opcode requires at least 2 but stack has only 1'
      },
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpTuck),
        errorMsg: 'opcode requires at least 2 but stack has only 0'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_opequalverify', () => {
    const successCases: TestCase[] = [
      // OpEqualVerify success cases
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpEqualVerify),
        dstack: new DataStack()
      },
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([1, 0, 1]), new Uint8Array([1, 0, 1])),
        code: OpCode.empty(OpCodes.OpEqualVerify),
        dstack: new DataStack(new Uint8Array([]))
      },
      // OpNumEqualVerify success cases
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpNumEqualVerify),
        dstack: new DataStack()
      },
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([0, 0, 1]), new Uint8Array([0, 0, 1])),
        code: OpCode.empty(OpCodes.OpNumEqualVerify),
        dstack: new DataStack(new Uint8Array([]))
      }
    ];

    const errorCases: ErrorTestCase[] = [
      // OpEqualVerify error cases
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([2, 0, 1]), new Uint8Array([1, 0, 1])),
        code: OpCode.empty(OpCodes.OpEqualVerify),
        errorMsg: 'script ran, but verification failed'
      },
      {
        init: new DataStack(new Uint8Array([1]), new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpEqualVerify),
        errorMsg: 'script ran, but verification failed'
      },
      // OpNumEqualVerify error cases
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([2, 0, 1]), new Uint8Array([1, 0, 1])),
        code: OpCode.empty(OpCodes.OpNumEqualVerify),
        errorMsg: 'script ran, but verification failed'
      },
      {
        init: new DataStack(new Uint8Array([1]), new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpNumEqualVerify),
        errorMsg: 'script ran, but verification failed'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_opsize', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpSize),
        dstack: new DataStack(new Uint8Array([]), new Uint8Array([]))
      },
      {
        init: new DataStack(new Uint8Array([5])),
        code: OpCode.empty(OpCodes.OpSize),
        dstack: new DataStack(new Uint8Array([5]), new Uint8Array([1]))
      },
      {
        init: new DataStack(new Uint8Array([0x80, 1])),
        code: OpCode.empty(OpCodes.OpSize),
        dstack: new DataStack(new Uint8Array([0x80, 1]), new Uint8Array([2]))
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpSize),
        errorMsg: 'opcode requires at least 1 but stack has only 0'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_opwithin', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([]), new Uint8Array([1])),
        code: OpCode.empty(OpCodes.OpWithin),
        dstack: new DataStack(new Uint8Array([1]))
      },
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([]), new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpWithin),
        dstack: new DataStack(new Uint8Array([]))
      },
      {
        init: new DataStack(new Uint8Array([0x81]), new Uint8Array([0x91]), new Uint8Array([1])),
        code: OpCode.empty(OpCodes.OpWithin),
        dstack: new DataStack(new Uint8Array([1]))
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpWithin),
        errorMsg: 'opcode requires at least 3 but stack has only 2'
      },
      {
        init: new DataStack(new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpWithin),
        errorMsg: 'opcode requires at least 3 but stack has only 1'
      },
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpWithin),
        errorMsg: 'opcode requires at least 3 but stack has only 0'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_opsha256', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpSHA256),
        dstack: new DataStack(
          new Uint8Array([
            0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14, 0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f, 0xb9, 0x24, 0x27, 0xae,
            0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c, 0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55
          ])
        )
      },
      {
        init: new DataStack(new TextEncoder().encode('abc')),
        code: OpCode.empty(OpCodes.OpSHA256),
        dstack: new DataStack(
          new Uint8Array([
            0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea, 0x41, 0x41, 0x40, 0xde, 0x5d, 0xae, 0x22, 0x23, 0xb0, 0x03,
            0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c, 0xb4, 0x10, 0xff, 0x61, 0xf2, 0x00, 0x15, 0xad
          ])
        )
      },
      {
        init: new DataStack(
          new Uint8Array([
            0xde, 0x18, 0x89, 0x41, 0xa3, 0x37, 0x5d, 0x3a, 0x8a, 0x06, 0x1e, 0x67, 0x57, 0x6e, 0x92, 0x6d
          ])
        ),
        code: OpCode.empty(OpCodes.OpSHA256),
        dstack: new DataStack(
          new Uint8Array([
            0x06, 0x7c, 0x53, 0x12, 0x69, 0x73, 0x5c, 0xa7, 0xf5, 0x41, 0xfd, 0xac, 0xa8, 0xf0, 0xdc, 0x76, 0x30, 0x5d,
            0x3c, 0xad, 0xa1, 0x40, 0xf8, 0x93, 0x72, 0xa4, 0x10, 0xfe, 0x5e, 0xff, 0x6e, 0x4d
          ])
        )
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpSHA256),
        errorMsg: 'opcode requires at least 1 but stack has only 0'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_opblake2b', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpBlake2b),
        dstack: new DataStack(
          new Uint8Array([
            0x0e, 0x57, 0x51, 0xc0, 0x26, 0xe5, 0x43, 0xb2, 0xe8, 0xab, 0x2e, 0xb0, 0x60, 0x99, 0xda, 0xa1, 0xd1, 0xe5,
            0xdf, 0x47, 0x77, 0x8f, 0x77, 0x87, 0xfa, 0xab, 0x45, 0xcd, 0xf1, 0x2f, 0xe3, 0xa8
          ])
        )
      },
      {
        init: new DataStack(new TextEncoder().encode('abc')),
        code: OpCode.empty(OpCodes.OpBlake2b),
        dstack: new DataStack(
          new Uint8Array([
            0xbd, 0xdd, 0x81, 0x3c, 0x63, 0x42, 0x39, 0x72, 0x31, 0x71, 0xef, 0x3f, 0xee, 0x98, 0x57, 0x9b, 0x94, 0x96,
            0x4e, 0x3b, 0xb1, 0xcb, 0x3e, 0x42, 0x72, 0x62, 0xc8, 0xc0, 0x68, 0xd5, 0x23, 0x19
          ])
        )
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpBlake2b),
        errorMsg: 'opcode requires at least 1 but stack has only 0'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_opnop', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([]), new Uint8Array([1]), new Uint8Array([2])),
        code: OpCode.empty(OpCodes.OpNop),
        dstack: new DataStack(new Uint8Array([]), new Uint8Array([1]), new Uint8Array([2]))
      }
    ];

    runSuccessTestCases(successCases);
  });

  // Mock Transaction Class
  class VerifiableTransactionMock implements IVerifiableTransaction {
    private _tx: Transaction;

    constructor(tx: Transaction) {
      this._tx = tx;
    }

    tx(): Transaction {
      return this._tx;
    }

    id(): TransactionId {
      throw new Error('Not implemented');
    }

    inputs(): TransactionInput[] {
      throw new Error('Not implemented');
    }

    isCoinbase(): boolean {
      throw new Error('Not implemented');
    }

    outputs(): TransactionOutput[] {
      throw new Error('Not implemented');
    }

    populatedInput(_index: number): [TransactionInput, UtxoEntry] {
      throw new Error('Not implemented');
    }

    populatedInputs(): Array<[TransactionInput, UtxoEntry]> {
      throw new Error('Not implemented');
    }

    utxo(_index: number): UtxoEntry | undefined {
      throw new Error('Not implemented');
    }
  }

  // Helper function to create mock transaction
  function makeMockTransaction(lockTime: bigint): [VerifiableTransactionMock, TransactionInput, UtxoEntry] {
    const dummyPrevOut = new TransactionOutpoint(Hash.fromU64Word(1n), 1);
    const dummySigScript = new Uint8Array(65);
    const dummyTxInput = new TransactionInput(dummyPrevOut, dummySigScript, 10n, 1);

    const addrHash = new Uint8Array(32).fill(1);
    const addr = new Address(AddressPrefix.Testnet, 0, addrHash);
    const dummyScriptPubKey = payToAddressScript(addr);
    const dummyTxOut = new TransactionOutput(SOMPI_PER_KASPA, dummyScriptPubKey);

    const tx = new VerifiableTransactionMock(
      new Transaction(
        TX_VERSION + 1,
        [dummyTxInput],
        [dummyTxOut],
        lockTime,
        SUBNETWORK_ID_NATIVE,
        0n,
        new Uint8Array()
      )
    );

    const utxoEntry = new UtxoEntry(0n, new ScriptPublicKey(0, new Uint8Array(0)), 0n, false);

    return [tx, dummyTxInput, utxoEntry];
  }

  // Main test
  it('test_opchecklocktimeverify', () => {
    const [baseTx, input, utxoEntry] = makeMockTransaction(1n);
    const sigCache = new Map<SigCacheKey, boolean>();

    const testCases = [
      // [txLockTime, lockTime, shouldFail]
      [1n, new Uint8Array([]), false], // Case 1: 0 = locktime < txLockTime
      [0x800000n, new Uint8Array([0x7f, 0, 0]), false], // Case 2: 0 < locktime < txLockTime
      [0x800000n, new Uint8Array([0x7f, 0, 0, 0, 0, 0, 0, 0, 0]), true], // Case 3: locktime too big
      [LOCK_TIME_THRESHOLD * 2n, new Uint8Array([0x7f, 0, 0, 0]), true] // Case 4: inconsistent times
    ];

    for (const [txLockTime, lockTime, shouldFail] of testCases) {
      let newTx = baseTx.tx();
      newTx.lockTime = txLockTime as bigint;
      const tx = new VerifiableTransactionMock(newTx);

      const vm = TxScriptEngine.fromTransactionInput(tx, input, 0, utxoEntry, sigCache, true);
      vm.dstack = new DataStack(lockTime as Uint8Array);

      if (shouldFail) {
        expect(() => OpCode.empty(OpCodes.OpCheckLockTimeVerify).execute(vm)).toThrow();
      } else {
        expect(() => OpCode.empty(OpCodes.OpCheckLockTimeVerify).execute(vm)).not.toThrow();
      }
    }
  });

  it('test_opchecksequenceverify', () => {
    const [baseTx, baseInput, utxoEntry] = makeMockTransaction(1n);
    const sigCache = new Map<SigCacheKey, boolean>();

    const testCases = [
      // [txSequence, sequence, shouldFail]
      [1n, new Uint8Array([]), false], // Case 1: 0 = sequence < tx_sequence
      [0x800000n, new Uint8Array([0x7f, 0, 0]), false], // Case 2: 0 < sequence < tx_sequence
      [0x800000n, new Uint8Array([0x7f, 0, 0, 0, 0, 0, 0, 0, 0]), true], // Case 3: sequence too big
      [1n << 63n, new Uint8Array([0x7f, 0, 0]), true], // Case 4: disabled
      [(1n << 63n) | 0xffffn, new Uint8Array([0x7f, 0, 0]), true] // Case 5: another disabled
    ];

    for (const [txSequence, sequence, shouldFail] of testCases) {
      const input: TransactionInput = { ...baseInput, sequence: txSequence as bigint };
      const vm = TxScriptEngine.fromTransactionInput(baseTx, input, 0, utxoEntry, sigCache, false);
      vm.dstack = new DataStack(sequence as Uint8Array);

      if (shouldFail) {
        expect(() => OpCode.empty(OpCodes.OpCheckSequenceVerify).execute(vm)).toThrow();
      } else {
        expect(() => OpCode.empty(OpCodes.OpCheckSequenceVerify).execute(vm)).not.toThrow();
      }
    }
  });

  it('test_opreturn', () => {
    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpReturn),
        errorMsg: 'script returned early'
      }
    ];

    runErrorTestCases(errorCases);
  });

  it('test_opverify', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([1])),
        code: OpCode.empty(OpCodes.OpVerify),
        dstack: new DataStack()
      },
      {
        init: new DataStack(new Uint8Array([0x81])),
        code: OpCode.empty(OpCodes.OpVerify),
        dstack: new DataStack()
      },
      {
        init: new DataStack(new Uint8Array([0x80, 0])),
        code: OpCode.empty(OpCodes.OpVerify),
        dstack: new DataStack()
      },
      {
        init: new DataStack(new Uint8Array([1, 0, 0, 0, 0])),
        code: OpCode.empty(OpCodes.OpVerify),
        dstack: new DataStack()
      }
    ];

    const errorCases: ErrorTestCase[] = [
      {
        init: new DataStack(new Uint8Array([0, 0, 0, 0x80])),
        code: OpCode.empty(OpCodes.OpVerify),
        errorMsg: 'script ran, but verification failed'
      },
      {
        init: new DataStack(new Uint8Array([0, 0, 0, 0])),
        code: OpCode.empty(OpCodes.OpVerify),
        errorMsg: 'script ran, but verification failed'
      },
      {
        init: new DataStack(new Uint8Array([0x80])),
        code: OpCode.empty(OpCodes.OpVerify),
        errorMsg: 'script ran, but verification failed'
      },
      {
        init: new DataStack(new Uint8Array([0])),
        code: OpCode.empty(OpCodes.OpVerify),
        errorMsg: 'script ran, but verification failed'
      },
      {
        init: new DataStack(new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpVerify),
        errorMsg: 'script ran, but verification failed'
      },
      {
        init: new DataStack(),
        code: OpCode.empty(OpCodes.OpVerify),
        errorMsg: 'opcode requires at least 1 but stack has only 0'
      }
    ];

    runSuccessTestCases(successCases);
    runErrorTestCases(errorCases);
  });

  it('test_opifdup', () => {
    const successCases: TestCase[] = [
      {
        init: new DataStack(new Uint8Array([1])),
        code: OpCode.empty(OpCodes.OpIfDup),
        dstack: new DataStack(new Uint8Array([1]), new Uint8Array([1]))
      },
      {
        init: new DataStack(new Uint8Array([0x80, 0])),
        code: OpCode.empty(OpCodes.OpIfDup),
        dstack: new DataStack(new Uint8Array([0x80, 0]), new Uint8Array([0x80, 0]))
      },
      {
        init: new DataStack(new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpIfDup),
        dstack: new DataStack(new Uint8Array([]))
      },
      {
        init: new DataStack(new Uint8Array([0x80])),
        code: OpCode.empty(OpCodes.OpIfDup),
        dstack: new DataStack(new Uint8Array([0x80]))
      },
      {
        init: new DataStack(new Uint8Array([0, 0x80])),
        code: OpCode.empty(OpCodes.OpIfDup),
        dstack: new DataStack(new Uint8Array([0, 0x80]))
      },
      {
        init: new DataStack(new Uint8Array([])),
        code: OpCode.empty(OpCodes.OpIfDup),
        dstack: new DataStack(new Uint8Array([]))
      }
    ];

    runSuccessTestCases(successCases);
  });
});

describe('OpCode KIP10 Tests', () => {
  // Mock structures
  interface Kip10Mock {
    spk: ScriptPublicKey;
    amount: bigint;
  }

  // Helper functions
  function createMockSpk(value: number): ScriptPublicKey {
    const pubKey = new Uint8Array(32).fill(value);
    const addr = new Address(AddressPrefix.Testnet, 0, pubKey);
    return payToAddressScript(addr);
  }

  function kip10TxMock(inputs: Kip10Mock[], outputs: Kip10Mock[]): [Transaction, UtxoEntry[]] {
    const dummyPrevOut = new TransactionOutpoint(Hash.fromU64Word(1n), 1);
    const dummySigScript = new Uint8Array(65);

    const utxos: UtxoEntry[] = inputs.map(({ spk, amount }) => new UtxoEntry(amount, spk, 0n, false));

    const txInputs = inputs.map(() => new TransactionInput(dummyPrevOut, dummySigScript, 10n, 0));

    const txOutputs = outputs.map(({ spk, amount }) => new TransactionOutput(amount, spk));

    const tx = new Transaction(TX_VERSION + 1, txInputs, txOutputs, 0n, SUBNETWORK_ID_NATIVE, 0n, new Uint8Array());

    return [tx, utxos];
  }

  // Test Groups
  interface TestGroup {
    name: string;
    //kip10Enabled: boolean; // kip10 enabled
    testCases: TestCase[];
  }

  enum Operation {
    InputSpk,
    OutputSpk,
    InputAmount,
    OutputAmount
  }

  interface SuccessCase {
    operation: Operation;
    index: number;
    expectedResult: {
      expectedSpk?: Uint8Array;
      expectedAmount?: Uint8Array;
    };
  }

  interface ErrorCase {
    operation: Operation;
    index?: number;
    expectedError: string;
  }

  interface TestCase {
    type: 'success' | 'error';
    case: SuccessCase | ErrorCase;
  }

  function executeTestGroup(group: TestGroup) {
    const inputSpk1 = createMockSpk(1);
    const inputSpk2 = createMockSpk(2);
    const outputSpk1 = createMockSpk(3);
    const outputSpk2 = createMockSpk(4);

    const inputs = [
      { spk: inputSpk1, amount: 1111n },
      { spk: inputSpk2, amount: 2222n }
    ];

    const outputs = [
      { spk: outputSpk1, amount: 3333n },
      { spk: outputSpk2, amount: 4444n }
    ];

    const [tx, utxoEntries] = kip10TxMock(inputs, outputs);
    const sigCache = new Map<SigCacheKey, boolean>();

    for (let currentIdx = 0; currentIdx < tx.inputs.length; currentIdx++) {
      const signableTx = new PopulatedTransaction(tx, utxoEntries);
      const vm = TxScriptEngine.fromTransactionInput(
        signableTx,
        tx.inputs[currentIdx],
        currentIdx,
        utxoEntries[currentIdx],
        sigCache,
        true
      );

      // Check input index opcode first
      const opInputIdx = OpCode.empty(OpCodes.OpTxInputIndex);
      const expected = new DataStack(...vm.dstack);
      expected.pushItem(SizedEncodeInt.from(BigInt(currentIdx)));
      opInputIdx.execute(vm);
      expect(vm.dstack).deep.eq(expected);
      vm.dstack = new DataStack();

      // Prepare opcodes
      const opInputSpk = OpCode.empty(OpCodes.OpTxInputSpk);
      const opOutputSpk = OpCode.empty(OpCodes.OpTxOutputSpk);
      const opInputAmount = OpCode.empty(OpCodes.OpTxInputAmount);
      const opOutputAmount = OpCode.empty(OpCodes.OpTxOutputAmount);

      // Execute each test case
      for (const testCase of group.testCases) {
        if (testCase.type === 'success') {
          vm.dstack.push(SizedEncodeInt.from(BigInt(testCase.case.index!)).serialize());
          let successCase = testCase.case as SuccessCase;
          let successOp;
          switch (successCase.operation) {
            case Operation.InputSpk:
              successOp = () => opInputSpk.execute(vm);
              break;
            case Operation.OutputSpk:
              successOp = () => opOutputSpk.execute(vm);
              break;
            case Operation.InputAmount:
              successOp = () => opInputAmount.execute(vm);
              break;
            case Operation.OutputAmount:
              successOp = () => opOutputAmount.execute(vm);
              break;
          }

          expect(successOp).not.toThrow();

          if (successCase.expectedResult.expectedSpk) {
            expect(vm.dstack).deep.eq(new DataStack(successCase.expectedResult.expectedSpk));
          }
          if (successCase.expectedResult.expectedAmount) {
            expect(vm.dstack).deep.eq(new DataStack(successCase.expectedResult.expectedAmount));
          }
          vm.dstack = new DataStack();
        } else {
          let errorCase = testCase.case as ErrorCase;
          if (errorCase.index !== undefined) {
            vm.dstack.push(SizedEncodeInt.from(BigInt(errorCase.index)).serialize());
          }

          let failedOp;
          switch (errorCase.operation) {
            case Operation.InputSpk:
              failedOp = () => opInputSpk.execute(vm);
              break;
            case Operation.OutputSpk:
              failedOp = () => opOutputSpk.execute(vm);
              break;
            case Operation.InputAmount:
              failedOp = () => opInputAmount.execute(vm);
              break;
            case Operation.OutputAmount:
              failedOp = () => opOutputAmount.execute(vm);
              break;
          }

          expect(failedOp).toThrowError(errorCase.expectedError);
          vm.dstack = new DataStack();
        }
      }
    }
  }

  it('test_unary_introspection_ops', () => {
    const testGroups: TestGroup[] = [
      {
        name: 'Valid input indices',
        testCases: [
          {
            type: 'success',
            case: {
              operation: Operation.InputSpk,
              index: 0,
              expectedResult: {
                expectedSpk: createMockSpk(1).toBytes(),
                expectedAmount: undefined
              }
            }
          },
          {
            type: 'success',
            case: {
              operation: Operation.InputSpk,
              index: 1,
              expectedResult: {
                expectedSpk: createMockSpk(2).toBytes(),
                expectedAmount: undefined
              }
            }
          },
          {
            type: 'success',
            case: {
              operation: Operation.InputAmount,
              index: 0,
              expectedResult: {
                expectedSpk: undefined,
                expectedAmount: SizedEncodeInt.from(1111n).serialize()
              }
            }
          },
          {
            type: 'success',
            case: {
              operation: Operation.InputAmount,
              index: 1,
              expectedResult: {
                expectedSpk: undefined,
                expectedAmount: SizedEncodeInt.from(2222n).serialize()
              }
            }
          }
        ]
      },
      {
        name: 'Valid output indices',
        testCases: [
          {
            type: 'success',
            case: {
              operation: Operation.OutputSpk,
              index: 0,
              expectedResult: {
                expectedSpk: createMockSpk(3).toBytes(),
                expectedAmount: undefined
              }
            }
          },
          {
            type: 'success',
            case: {
              operation: Operation.OutputSpk,
              index: 1,
              expectedResult: {
                expectedSpk: createMockSpk(4).toBytes(),
                expectedAmount: undefined
              }
            }
          },
          {
            type: 'success',
            case: {
              operation: Operation.OutputAmount,
              index: 0,
              expectedResult: {
                expectedSpk: undefined,
                expectedAmount: SizedEncodeInt.from(3333n).serialize()
              }
            }
          },
          {
            type: 'success',
            case: {
              operation: Operation.OutputAmount,
              index: 1,
              expectedResult: {
                expectedSpk: undefined,
                expectedAmount: SizedEncodeInt.from(4444n).serialize()
              }
            }
          }
        ]
      },
      {
        name: 'Error cases',
        testCases: [
          {
            type: 'error',
            case: { operation: Operation.InputAmount, expectedError: 'opcode requires at least 1 but stack has only 0' }
          },
          {
            type: 'error',
            case: {
              operation: Operation.InputAmount,
              index: -1,
              expectedError: 'transaction input -1 is out of bounds, should be non-negative below 2'
            }
          },
          {
            type: 'error',
            case: {
              operation: Operation.InputAmount,
              index: 2,
              expectedError: 'transaction input 2 is out of bounds, should be non-negative below 2'
            }
          },
          {
            type: 'error',
            case: {
              operation: Operation.OutputAmount,
              expectedError: 'opcode requires at least 1 but stack has only 0'
            }
          },
          {
            type: 'error',
            case: {
              operation: Operation.OutputAmount,
              index: -1,
              expectedError: 'transaction output -1 is out of bounds, should be non-negative below 2'
            }
          },
          {
            type: 'error',
            case: {
              operation: Operation.OutputAmount,
              index: 2,
              expectedError: 'transaction output 2 is out of bounds, should be non-negative below 2'
            }
          }
        ]
      }
    ];

    for (const group of testGroups) {
      executeTestGroup(group);
    }
  });

  function createMockTx(inputCount: number, outputCount: number): [Transaction, UtxoEntry[]] {
    const dummyPrevOut = new TransactionOutpoint(Hash.fromU64Word(1n), 1);
    const dummySigScript = new Uint8Array(65);

    // Create inputs with different SPKs and amounts
    const inputs: Kip10Mock[] = Array.from({ length: inputCount }, (_, i) => ({
      spk: createMockSpk(i),
      amount: BigInt(1000 + i)
    }));

    // Create outputs with different SPKs and amounts
    const outputs: Kip10Mock[] = Array.from({ length: outputCount }, (_, i) => ({
      spk: createMockSpk(100 + i),
      amount: BigInt(2000 + i)
    }));

    // Create utxos and inputs from mock inputs
    const utxos: UtxoEntry[] = inputs.map(({ spk, amount }) => new UtxoEntry(amount, spk, 0n, false));

    const txInputs = inputs.map(() => new TransactionInput(dummyPrevOut, dummySigScript, 10n, 0));

    const txOutputs = outputs.map(({ spk, amount }) => new TransactionOutput(amount, spk));

    const tx = new Transaction(TX_VERSION + 1, txInputs, txOutputs, 0n, SUBNETWORK_ID_NATIVE, 0n, new Uint8Array());

    return [tx, utxos];
  }

  it('test_op_input_output_count', () => {
    // Test cases with different input/output combinations
    const testCases = [
      [1, 0], // Minimum inputs, no outputs
      [1, 1], // Minimum inputs, one output
      [1, 2], // Minimum inputs, multiple outputs
      [2, 1], // Multiple inputs, one output
      [3, 2], // Multiple inputs, multiple outputs
      [5, 3], // More inputs than outputs
      [2, 4] // More outputs than inputs
    ];

    for (const [inputCount, outputCount] of testCases) {
      const [tx, utxoEntries] = createMockTx(inputCount, outputCount);
      const sigCache = new Map<SigCacheKey, boolean>();

      const signableTx = new PopulatedTransaction(tx, utxoEntries);

      // Test with KIP-10 enabled and disabled
      const vm = TxScriptEngine.fromTransactionInput(
        signableTx,
        tx.inputs[0], // Use first input
        0,
        utxoEntries[0],
        sigCache,
        true
      );

      const opInputCount = OpCode.empty(OpCodes.OpTxInputCount);
      const opOutputCount = OpCode.empty(OpCodes.OpTxOutputCount);

      // Test input count
      opInputCount.execute(vm);
      expect(vm.dstack).deep.eq(new DataStack(SizedEncodeInt.from(BigInt(inputCount)).serialize()));
      vm.dstack = new DataStack();

      // Test output count
      opOutputCount.execute(vm);
      expect(vm.dstack).toEqual(new DataStack(SizedEncodeInt.from(BigInt(outputCount)).serialize()));
      vm.dstack = new DataStack();
    }
  });

  it('test_output_amount', () => {
    // Create script: 0 OP_OUTPUTAMOUNT 100 EQUAL
    const redeemScript = new ScriptBuilder()
      .addOp(OpCodes.Op0)
      .addOp(OpCodes.OpTxOutputAmount)
      .addI64(100n)
      .addOp(OpCodes.OpEqual).script;

    const spk = payToScriptHashScript(redeemScript);

    // Create transaction with output amount 100
    const inputMock: Kip10Mock = {
      spk: spk,
      amount: 200n
    };

    const outputMock: Kip10Mock = {
      spk: createMockSpk(1),
      amount: 100n
    };

    // Test success case
    {
      const [tx, utxoEntries] = kip10TxMock([inputMock], [outputMock]);
      tx.inputs[0].signatureScript = new ScriptBuilder().addData(redeemScript).script;

      const sigCache = new Map<SigCacheKey, boolean>();
      const vm = TxScriptEngine.fromTransactionInput(
        new PopulatedTransaction(tx, utxoEntries),
        tx.inputs[0],
        0,
        utxoEntries[0],
        sigCache,
        true
      );

      expect(() => vm.execute()).not.toThrow();
    }

    // Test failure case with wrong amount
    {
      const wrongOutputMock: Kip10Mock = {
        spk: createMockSpk(1),
        amount: 99n // Wrong amount
      };

      const [tx, utxoEntries] = kip10TxMock([inputMock], [wrongOutputMock]);
      tx.inputs[0].signatureScript = new ScriptBuilder().addData(redeemScript).script;

      const sigCache = new Map<SigCacheKey, boolean>();
      const vm = TxScriptEngine.fromTransactionInput(
        new PopulatedTransaction(tx, utxoEntries),
        tx.inputs[0],
        0,
        utxoEntries[0],
        sigCache,
        true
      );

      expect(() => vm.execute()).toThrowError('false stack entry at end of script execution');
    }
  });

  it('test_input_amount', () => {
    // Create script: 0 OP_INPUTAMOUNT 200 EQUAL
    const redeemScript = new ScriptBuilder()
      .addOp(OpCodes.Op0)
      .addOp(OpCodes.OpTxInputAmount)
      .addI64(200n)
      .addOp(OpCodes.OpEqual).script;

    const spk = payToScriptHashScript(redeemScript);
    const sigCache = new Map<SigCacheKey, boolean>();

    // Test success case
    {
      const inputMock: Kip10Mock = {
        spk: spk,
        amount: 200n
      };

      const outputMock: Kip10Mock = {
        spk: createMockSpk(1),
        amount: 100n
      };

      const [tx, utxoEntries] = kip10TxMock([inputMock], [outputMock]);
      tx.inputs[0].signatureScript = new ScriptBuilder().addData(redeemScript).script;

      const vm = TxScriptEngine.fromTransactionInput(
        new PopulatedTransaction(tx, utxoEntries),
        tx.inputs[0],
        0,
        utxoEntries[0],
        sigCache,
        true
      );

      expect(() => vm.execute()).not.toThrow();
    }

    // Test failure case
    {
      const inputMock: Kip10Mock = {
        spk: spk,
        amount: 199n // Wrong amount
      };

      const outputMock: Kip10Mock = {
        spk: createMockSpk(1),
        amount: 100n
      };

      const [tx, utxoEntries] = kip10TxMock([inputMock], [outputMock]);
      tx.inputs[0].signatureScript = new ScriptBuilder().addData(redeemScript).script;

      const vm = TxScriptEngine.fromTransactionInput(
        new PopulatedTransaction(tx, utxoEntries),
        tx.inputs[0],
        0,
        utxoEntries[0],
        sigCache,
        true
      );

      expect(() => vm.execute()).toThrowError('false stack entry at end of script execution');
    }
  });

  it('test_input_spk_basic', () => {
    const sigCache = new Map<SigCacheKey, boolean>();

    // Create script: 0 OP_INPUTSPK OpNop
    const redeemScript = new ScriptBuilder().addOps([OpCodes.Op0, OpCodes.OpTxInputSpk, OpCodes.OpNop]).script;

    const spk = payToScriptHashScript(redeemScript);
    const [tx, utxoEntries] = kip10TxMock([{ spk, amount: 100n }], []);

    tx.inputs[0].signatureScript = new ScriptBuilder().addData(redeemScript).script;

    const vm = TxScriptEngine.fromTransactionInput(
      new PopulatedTransaction(tx, utxoEntries),
      tx.inputs[0],
      0,
      utxoEntries[0],
      sigCache,
      true
    );

    expect(() => vm.execute()).not.toThrow();
  });

  it('test_input_spk_different', () => {
    const sigCache = new Map<SigCacheKey, boolean>();

    // Create script: 0 OP_INPUTSPK 1 OP_INPUTSPK OP_EQUAL OP_NOT
    const redeemScript = new ScriptBuilder().addOps([
      OpCodes.Op0,
      OpCodes.OpTxInputSpk,
      OpCodes.Op1,
      OpCodes.OpTxInputSpk,
      OpCodes.OpEqual,
      OpCodes.OpNot
    ]).script;

    const spk = payToScriptHashScript(redeemScript);
    const [tx, utxoEntries] = kip10TxMock(
      [
        { spk, amount: 100n },
        { spk: createMockSpk(2), amount: 100n }
      ],
      []
    );

    tx.inputs[0].signatureScript = new ScriptBuilder().addData(redeemScript).script;

    const vm = TxScriptEngine.fromTransactionInput(
      new PopulatedTransaction(tx, utxoEntries),
      tx.inputs[0],
      0,
      utxoEntries[0],
      sigCache,
      true
    );

    expect(() => vm.execute()).not.toThrow();
  });

  it('test_input_spk_same', () => {
    const sigCache = new Map<SigCacheKey, boolean>();

    // Create script: 0 OP_INPUTSPK 1 OP_INPUTSPK OP_EQUAL
    const redeemScript = new ScriptBuilder().addOps([
      OpCodes.Op0,
      OpCodes.OpTxInputSpk,
      OpCodes.Op1,
      OpCodes.OpTxInputSpk,
      OpCodes.OpEqual
    ]).script;

    const spk = payToScriptHashScript(redeemScript);
    const [tx, utxoEntries] = kip10TxMock(
      [
        { spk, amount: 100n },
        { spk, amount: 100n }
      ],
      []
    );

    tx.inputs[0].signatureScript = new ScriptBuilder().addData(redeemScript).script;

    const vm = TxScriptEngine.fromTransactionInput(
      new PopulatedTransaction(tx, utxoEntries),
      tx.inputs[0],
      0,
      utxoEntries[0],
      sigCache,
      true
    );

    expect(() => vm.execute()).not.toThrow();
  });

  it('test_output_spk', () => {
    const expectedSpk = createMockSpk(42);
    const expectedSpkBytes = expectedSpk.toBytes();
    const sigCache = new Map<SigCacheKey, boolean>();

    // Create script: 0 OP_OUTPUTSPK <expected_spk_bytes> EQUAL
    const redeemScript = new ScriptBuilder()
      .addOp(OpCodes.Op0)
      .addOp(OpCodes.OpTxOutputSpk)
      .addData(expectedSpkBytes)
      .addOp(OpCodes.OpEqual).script;

    const spk = payToScriptHashScript(redeemScript);

    // Test success case
    {
      const [tx, utxoEntries] = kip10TxMock([{ spk, amount: 200n }], [{ spk: expectedSpk, amount: 100n }]);

      tx.inputs[0].signatureScript = new ScriptBuilder().addData(redeemScript).script;

      const vm = TxScriptEngine.fromTransactionInput(
        new PopulatedTransaction(tx, utxoEntries),
        tx.inputs[0],
        0,
        utxoEntries[0],
        sigCache,
        true
      );

      expect(() => vm.execute()).not.toThrow();
    }

    // Test failure case
    {
      const [tx, utxoEntries] = kip10TxMock(
        [{ spk, amount: 200n }],
        [{ spk: createMockSpk(43), amount: 100n }] // Different SPK
      );

      tx.inputs[0].signatureScript = new ScriptBuilder().addData(redeemScript).script;

      const vm = TxScriptEngine.fromTransactionInput(
        new PopulatedTransaction(tx, utxoEntries),
        tx.inputs[0],
        0,
        utxoEntries[0],
        sigCache,
        true
      );

      expect(() => vm.execute()).toThrowError('false stack entry at end of script execution');
    }
  });

  it('test_input_index', () => {
    // Create script: OP_INPUTINDEX 0 EQUAL
    const redeemScript = new ScriptBuilder().addOp(OpCodes.OpTxInputIndex).addI64(0n).addOp(OpCodes.OpEqual).script;

    const spk = payToScriptHashScript(redeemScript);
    const sigCache = new Map<SigCacheKey, boolean>();

    // Test first input (success case)
    {
      const [tx, utxoEntries] = kip10TxMock([{ spk, amount: 200n }], [{ spk: createMockSpk(1), amount: 100n }]);

      tx.inputs[0].signatureScript = new ScriptBuilder().addData(redeemScript).script;

      const vm = TxScriptEngine.fromTransactionInput(
        new PopulatedTransaction(tx, utxoEntries),
        tx.inputs[0],
        0,
        utxoEntries[0],
        sigCache,
        true
      );

      expect(() => vm.execute()).not.toThrow();
    }

    // Test second input (failure case)
    {
      const [tx, utxoEntries] = kip10TxMock(
        [
          { spk: createMockSpk(1), amount: 100n },
          { spk, amount: 200n }
        ],
        [{ spk: createMockSpk(2), amount: 100n }]
      );

      tx.inputs[1].signatureScript = new ScriptBuilder().addData(redeemScript).script;

      const vm = TxScriptEngine.fromTransactionInput(
        new PopulatedTransaction(tx, utxoEntries),
        tx.inputs[1],
        1,
        utxoEntries[1],
        sigCache,
        true
      );

      expect(() => vm.execute()).toThrowError('false stack entry at end of script execution');
    }
  });

  it('test_counts', () => {
    const sigCache = new Map<SigCacheKey, boolean>();

    // Test OpInputCount: "OP_INPUTCOUNT 2 EQUAL"
    const inputCountScript = new ScriptBuilder().addOp(OpCodes.OpTxInputCount).addI64(2n).addOp(OpCodes.OpEqual).script;

    // Test OpOutputCount: "OP_OUTPUTCOUNT 3 EQUAL"
    const outputCountScript = new ScriptBuilder()
      .addOp(OpCodes.OpTxOutputCount)
      .addI64(3n)
      .addOp(OpCodes.OpEqual).script;

    const inputSpk = payToScriptHashScript(inputCountScript);
    const outputSpk = payToScriptHashScript(outputCountScript);

    // Create transaction with 2 inputs and 3 outputs
    const [tx, utxoEntries] = kip10TxMock(
      [
        { spk: inputSpk, amount: 100n },
        { spk: outputSpk, amount: 200n }
      ],
      [
        { spk: createMockSpk(1), amount: 50n },
        { spk: createMockSpk(2), amount: 100n },
        { spk: createMockSpk(3), amount: 150n }
      ]
    );

    // Test InputCount
    {
      tx.inputs[0].signatureScript = new ScriptBuilder().addData(inputCountScript).script;

      const vm = TxScriptEngine.fromTransactionInput(
        new PopulatedTransaction(tx, utxoEntries),
        tx.inputs[0],
        0,
        utxoEntries[0],
        sigCache,
        true
      );

      expect(() => vm.execute()).not.toThrow();
    }

    // Test OutputCount
    {
      tx.inputs[1].signatureScript = new ScriptBuilder().addData(outputCountScript).script;

      const vm = TxScriptEngine.fromTransactionInput(
        new PopulatedTransaction(tx, utxoEntries),
        tx.inputs[1],
        1,
        utxoEntries[1],
        sigCache,
        true
      );

      expect(() => vm.execute()).not.toThrow();
    }

    // Test failure cases with wrong counts
    {
      // Wrong input count script: "OP_INPUTCOUNT 3 EQUAL"
      const wrongInputCountScript = new ScriptBuilder()
        .addOp(OpCodes.OpTxInputCount)
        .addI64(3n)
        .addOp(OpCodes.OpEqual).script;

      tx.inputs[0].signatureScript = new ScriptBuilder().addData(wrongInputCountScript).script;

      const vm = TxScriptEngine.fromTransactionInput(
        new PopulatedTransaction(tx, utxoEntries),
        tx.inputs[0],
        0,
        utxoEntries[0],
        sigCache,
        true
      );

      expect(() => vm.execute()).toThrowError('false stack entry at end of script execution');
    }

    {
      // Wrong output count script: "OP_OUTPUTCOUNT 2 EQUAL"
      const wrongOutputCountScript = new ScriptBuilder()
        .addOp(OpCodes.OpTxOutputCount)
        .addI64(2n)
        .addOp(OpCodes.OpEqual).script;

      tx.inputs[1].signatureScript = new ScriptBuilder().addData(wrongOutputCountScript).script;

      const vm = TxScriptEngine.fromTransactionInput(
        new PopulatedTransaction(tx, utxoEntries),
        tx.inputs[1],
        1,
        utxoEntries[1],
        sigCache,
        true
      );

      expect(() => vm.execute()).toThrowError('false stack entry at end of script execution');
    }
  });
});

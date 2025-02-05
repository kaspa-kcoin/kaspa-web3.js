import { ScriptBuilderError } from '../error.ts';
import {
  IVerifiableTransaction,
  MAX_TX_IN_SEQUENCE_NUM,
  SigHashType,
  LOCK_TIME_THRESHOLD,
  SEQUENCE_LOCK_TIME_DISABLED,
  SEQUENCE_LOCK_TIME_MASK,
  OP_SMALL_INT_MIN_VAL,
  OP_SMALL_INT_MAX_VAL,
  OP_1_NEGATE_VAL,
  OP_DATA_MAX_VAL,
  NO_COST_OPCODE,
  i64Max
} from '../../index.ts';
import { TxScriptEngine } from '../index.ts';
import { SizedEncodeInt } from '../dataStack/sized-encode-int.ts';
import { OpCodes, getDataLengthOfCode } from './codes.ts';
import { OpCond } from './op-cond.ts';
import { OpcodeDataBool } from '../dataStack';
import { sha256 } from '@noble/hashes/sha2';
import { blake2b } from '@noble/hashes/blake2b';

class OpCode {
  private readonly code: OpCodes;
  private readonly data: Uint8Array;

  constructor(code: OpCodes, data: Uint8Array) {
    const dataLength = getDataLengthOfCode(code);

    if (code === OpCodes.OpPushData1 || code === OpCodes.OpPushData2 || code === OpCodes.OpPushData4) {
      if (data.length > dataLength) this.throwMalformedPushError(code, dataLength);
    } else {
      if (data.length !== dataLength) this.throwMalformedPushError(code, dataLength);
    }

    this.code = code;
    this.data = data;
  }

  empty(code: OpCodes) {
    return {
      code,
      data: new Uint8Array(0)
    } as any as OpCode;
  }

  execute<T extends IVerifiableTransaction>(vm: TxScriptEngine<T>): void {
    switch (this.code) {
      case OpCodes.OpFalse:
        pushData(new Uint8Array(), vm);
        break;
      case OpCodes.OpData1:
      case OpCodes.OpData2:
      case OpCodes.OpData3:
      case OpCodes.OpData4:
      case OpCodes.OpData5:
      case OpCodes.OpData6:
      case OpCodes.OpData7:
      case OpCodes.OpData8:
      case OpCodes.OpData9:
      case OpCodes.OpData10:
      case OpCodes.OpData11:
      case OpCodes.OpData12:
      case OpCodes.OpData13:
      case OpCodes.OpData14:
      case OpCodes.OpData15:
      case OpCodes.OpData16:
      case OpCodes.OpData17:
      case OpCodes.OpData18:
      case OpCodes.OpData19:
      case OpCodes.OpData20:
      case OpCodes.OpData21:
      case OpCodes.OpData22:
      case OpCodes.OpData23:
      case OpCodes.OpData24:
      case OpCodes.OpData25:
      case OpCodes.OpData26:
      case OpCodes.OpData27:
      case OpCodes.OpData28:
      case OpCodes.OpData29:
      case OpCodes.OpData30:
      case OpCodes.OpData31:
      case OpCodes.OpData32:
      case OpCodes.OpData33:
      case OpCodes.OpData34:
      case OpCodes.OpData35:
      case OpCodes.OpData36:
      case OpCodes.OpData37:
      case OpCodes.OpData38:
      case OpCodes.OpData39:
      case OpCodes.OpData40:
      case OpCodes.OpData41:
      case OpCodes.OpData42:
      case OpCodes.OpData43:
      case OpCodes.OpData44:
      case OpCodes.OpData45:
      case OpCodes.OpData46:
      case OpCodes.OpData47:
      case OpCodes.OpData48:
      case OpCodes.OpData49:
      case OpCodes.OpData50:
      case OpCodes.OpData51:
      case OpCodes.OpData52:
      case OpCodes.OpData53:
      case OpCodes.OpData54:
      case OpCodes.OpData55:
      case OpCodes.OpData56:
      case OpCodes.OpData57:
      case OpCodes.OpData58:
      case OpCodes.OpData59:
      case OpCodes.OpData60:
      case OpCodes.OpData61:
      case OpCodes.OpData62:
      case OpCodes.OpData63:
      case OpCodes.OpData64:
      case OpCodes.OpData65:
      case OpCodes.OpData66:
      case OpCodes.OpData67:
      case OpCodes.OpData68:
      case OpCodes.OpData69:
      case OpCodes.OpData70:
      case OpCodes.OpData71:
      case OpCodes.OpData72:
      case OpCodes.OpData73:
      case OpCodes.OpData74:
      case OpCodes.OpData75:
      case OpCodes.OpPushData1:
      case OpCodes.OpPushData2:
      case OpCodes.OpPushData4:
        pushData(this.data, vm);
        break;

      case OpCodes.OpReserved:
        throw new Error(`TxScriptError: Encountered reserved opcode ${this.code}`);

      case OpCodes.Op1Negate:
      case OpCodes.OpTrue:
      case OpCodes.Op2:
      case OpCodes.Op3:
      case OpCodes.Op4:
      case OpCodes.Op5:
      case OpCodes.Op6:
      case OpCodes.Op7:
      case OpCodes.Op8:
      case OpCodes.Op9:
      case OpCodes.Op10:
      case OpCodes.Op11:
      case OpCodes.Op12:
      case OpCodes.Op13:
      case OpCodes.Op14:
      case OpCodes.Op15:
      case OpCodes.Op16:
        pushNumber(this.code - OpCodes.Op1Negate - 1, vm);
        break;

      case OpCodes.OpNop:
        break;

      case OpCodes.OpVer:
        throw new Error(`TxScriptError: Encountered reserved opcode ${this.code}`);

      case OpCodes.OpIf:
      case OpCodes.OpNotIf: {
        let cond = OpCond.Skip;
        if (vm.isExecuting()) {
          const condBuf = vm.dstack.pop();
          if (!condBuf) {
            this.throwEmptyStackError();
            break;
          }
          if (condBuf.length > 1) {
            this.throwInvalidStateError('expected boolean');
          }

          const stackCond = condBuf[0];
          if (this.code === OpCodes.OpIf) {
            if (stackCond === 1) cond = OpCond.True;
            else if (stackCond === undefined) cond = OpCond.False;
            else this.throwInvalidStateError('expected boolean');
          } else if (this.code === OpCodes.OpNotIf) {
            if (stackCond === 1) cond = OpCond.False;
            else if (stackCond === undefined) cond = OpCond.True;
            else this.throwInvalidStateError('expected boolean');
          }
        }

        vm.condStack.push(cond);
        break;
      }

      case OpCodes.OpVerIf:
      case OpCodes.OpVerNotIf: {
        this.throwOpcodeReservedError(this.code);
        break;
      }

      case OpCodes.OpElse: {
        const lastCond = vm.condStack[vm.condStack.length - 1];
        if (lastCond === undefined) {
          this.throwInvalidStateError('condition stack empty');
          break;
        }

        if (lastCond === OpCond.True) vm.condStack[vm.condStack.length - 1] = OpCond.False;
        else if (lastCond === OpCond.False) vm.condStack[vm.condStack.length - 1] = OpCond.True;
        break;
      }

      case OpCodes.OpEndIf:
        if (vm.condStack.pop() === undefined) {
          this.throwInvalidStateError('condition stack empty');
        }
        break;

      case OpCodes.OpVerify: {
        const result = vm.dstack.pop();
        if (!result || result[0] !== 1) {
          throw new Error('TxScriptError: Verify error');
        }
        break;
      }

      case OpCodes.OpReturn:
        throw new Error('TxScriptError: Early return');

      case OpCodes.OpToAltStack: {
        const item = vm.dstack.pop();
        if (!item) {
          this.throwEmptyStackError();
          break;
        }
        vm.astack.push(item);
        break;
      }

      case OpCodes.OpFromAltStack: {
        const last = vm.astack.pop();
        if (!last) {
          this.throwEmptyStackError();
          break;
        }
        vm.dstack.push(last);
        break;
      }

      case OpCodes.Op2Drop:
        vm.dstack.dropItems(2);
        break;

      case OpCodes.Op2Dup:
        vm.dstack.dupItems(2);
        break;

      case OpCodes.Op3Dup:
        vm.dstack.dupItems(3);
        break;

      case OpCodes.Op2Over:
        vm.dstack.overItems(2);
        break;

      case OpCodes.Op2Rot:
        vm.dstack.rotItems(2);
        break;

      case OpCodes.Op2Swap:
        vm.dstack.swapItems(2);
        break;

      case OpCodes.OpIfDup: {
        const [result] = vm.dstack.peekRaw(1);
        if (OpcodeDataBool.deserialize(result)) {
          vm.dstack.push(result);
        }
        break;
      }

      case OpCodes.OpDepth:
        pushNumber(vm.dstack.length, vm);
        break;

      case OpCodes.OpDrop:
        vm.dstack.dropItems(1);
        break;

      case OpCodes.OpDup:
        vm.dstack.dupItems(1);
        break;

      case OpCodes.OpNip:
        if (vm.dstack.length < 2) {
          throw new Error(`opcode requires at least 2 but stack has only ${vm.dstack.length}`);
        }
        vm.dstack.splice(vm.dstack.length - 2, 1);
        break;

      case OpCodes.OpOver:
        vm.dstack.overItems(1);
        break;

      case OpCodes.OpPick: {
        const [loc] = vm.dstack.popItems(1);
        const locValue = new DataView(loc.serialize().buffer).getInt32(0, true);
        if (locValue < 0 || locValue >= vm.dstack.length) {
          throw new Error('TxScriptError: pick at an invalid location');
        }
        vm.dstack.push(vm.dstack[vm.dstack.length - locValue - 1]);
        break;
      }

      case OpCodes.OpRoll: {
        const [loc] = vm.dstack.popItems(1);
        const locValue = new DataView(loc.serialize().buffer).getInt32(0, true);
        if (locValue < 0 || locValue >= vm.dstack.length) {
          throw new Error('TxScriptError: roll at an invalid location');
        }
        const item = vm.dstack.splice(vm.dstack.length - locValue - 1, 1)[0];
        vm.dstack.push(item);
        break;
      }

      case OpCodes.OpRot:
        vm.dstack.rotItems(1);
        break;

      case OpCodes.OpSwap:
        vm.dstack.swapItems(1);
        break;

      case OpCodes.OpTuck:
        if (vm.dstack.length < 2)
          throw new Error(
            `TxScriptError: Invalid stack operation, requires at least 2 items but stack has only ${vm.dstack.length}`
          );

        const item = vm.dstack[vm.dstack.length - 1];
        vm.dstack.splice(vm.dstack.length - 2, 0, item);

        break;

      // Splice opcodes.
      case OpCodes.OpCat:
      case OpCodes.OpSubStr:
      case OpCodes.OpLeft:
      case OpCodes.OpRight:
        throw new Error(`TxScriptError: attempt to execute disabled opcode ${this.code}`);

      case OpCodes.OpSize: {
        const last = vm.dstack[vm.dstack.length - 1];
        if (!last)
          throw new Error('TxScriptError: Invalid stack operation, requires at least 1 item but stack is empty');

        const size = last.length;
        if (size > i64Max) {
          throw new Error(`TxScriptError: Number too big: ${size}`);
        }
        vm.dstack.pushItem(new SizedEncodeInt(BigInt(size)));

        break;
      }

      // Bitwise logic opcodes.
      case OpCodes.OpInvert:
      case OpCodes.OpAnd:
      case OpCodes.OpOr:
      case OpCodes.OpXor:
        throw new Error(`TxScriptError: attempt to execute disabled opcode ${this.code}`);

      case OpCodes.OpEqual: {
        if (vm.dstack.length < 2)
          throw new Error(
            `TxScriptError: Invalid stack operation, requires at least 2 items but stack has only ${vm.dstack.length}`
          );

        const newStack = vm.dstack.splice(vm.dstack.length - 2);
        if (areUint8ArraysEqual(vm.dstack, newStack)) vm.dstack.push(new Uint8Array([1]));
        else vm.dstack.push(new Uint8Array());

        break;
      }

      case OpCodes.OpEqualVerify:
        {
          if (vm.dstack.length < 2)
            throw new Error(
              `TxScriptError: Invalid stack operation, requires at least 2 items but stack has only ${vm.dstack.length}`
            );

          const newStack = vm.dstack.splice(vm.dstack.length - 2);

          if (!areUint8ArraysEqual(vm.dstack, newStack)) this.throwVerifyError();
        }
        break;

      case OpCodes.OpReserved1:
      case OpCodes.OpReserved2:
        throw new Error(`TxScriptError: attempt to execute reserved opcode ${this.code}`);

      case OpCodes.Op1Add: {
        const [value] = vm.dstack.popItems(1);
        const result = value.value + 1n;
        if (result > i64Max) {
          throw new Error(`TxScriptError: Result of addition exceeds 64-bit signed integer range`);
        }
        vm.dstack.pushItem(value);
        break;
      }

      case OpCodes.Op1Sub: {
        const [value] = vm.dstack.popItems(1);
        const result = value.value - 1n;
        if (result < -i64Max) {
          throw new Error('TxScriptError: Result of subtraction exceeds 64-bit signed integer range');
        }
        vm.dstack.pushItem(value);
        break;
      }

      case OpCodes.Op2Mul:
      case OpCodes.Op2Div:
        throw new Error(`TxScriptError: Opcode disabled: ${this.code}`);

      case OpCodes.OpNegate: {
        const [value] = vm.dstack.popItems(1);
        const result = -value.value;
        if (result < -i64Max || result > i64Max) {
          throw new Error('TxScriptError: Negation result exceeds 64-bit signed integer range');
        }
        vm.dstack.pushItem(value);
        break;
      }

      case OpCodes.OpAbs: {
        const [value] = vm.dstack.popItems(1);
        const result = value.value < 0n ? -value.value : value.value;
        if (result > i64Max) {
          throw new Error('TxScriptError: Absolute value exceeds 64-bit signed integer range');
        }
        vm.dstack.pushItem(value);
        break;
      }

      case OpCodes.OpNot: {
        const [m] = vm.dstack.popItems(1);
        vm.dstack.pushItem(SizedEncodeInt.from(m.value === 0n ? 1n : 0n));
        break;
      }

      case OpCodes.Op0NotEqual: {
        const [m] = vm.dstack.popItems(1);
        vm.dstack.pushItem(SizedEncodeInt.from(m.value !== 0n ? 1n : 0n));
        break;
      }

      case OpCodes.OpAdd: {
        const [a, b] = vm.dstack.popItems(2);
        const result = a.value + b.value;
        if (result > i64Max || result < -i64Max) {
          throw new Error('TxScriptError: Sum exceeds 64-bit signed integer range');
        }
        vm.dstack.pushItem(SizedEncodeInt.from(result));
        break;
      }

      case OpCodes.OpSub: {
        const [a, b] = vm.dstack.popItems(2);
        const result = a.value - b.value;
        if (result > i64Max || result < -i64Max) {
          throw new Error('TxScriptError: Difference exceeds 64-bit signed integer range');
        }
        vm.dstack.pushItem(SizedEncodeInt.from(result));
        break;
      }

      case OpCodes.OpMul:
      case OpCodes.OpDiv:
      case OpCodes.OpMod:
      case OpCodes.OpLShift:
      case OpCodes.OpRShift:
        throw new Error(`TxScriptError: Opcode disabled: ${this.code}`);

      case OpCodes.OpBoolAnd: {
        const [a, b] = vm.dstack.popItems(2);
        const result = a.value !== 0n && b.value !== 0n ? 1n : 0n;
        vm.dstack.pushItem(SizedEncodeInt.from(result));
        break;
      }

      case OpCodes.OpBoolOr: {
        const [a, b] = vm.dstack.popItems(2);
        const result = a.value !== 0n || b.value !== 0n ? 1n : 0n;
        vm.dstack.pushItem(SizedEncodeInt.from(result));
        break;
      }

      case OpCodes.OpNumEqual: {
        const [a, b] = vm.dstack.popItems(2);
        const result = a.value === b.value ? 1n : 0n;
        vm.dstack.pushItem(SizedEncodeInt.from(result));
        break;
      }

      case OpCodes.OpNumEqualVerify: {
        const [a, b] = vm.dstack.popItems(2);
        if (a.value !== b.value) this.throwVerifyError();
        break;
      }

      case OpCodes.OpNumNotEqual: {
        const [a, b] = vm.dstack.popItems(2);
        const result = a.value !== b.value ? 1n : 0n;
        vm.dstack.pushItem(SizedEncodeInt.from(result));
        break;
      }

      case OpCodes.OpLessThan: {
        const [a, b] = vm.dstack.popItems(2);
        const result = a.value < b.value ? 1n : 0n;
        vm.dstack.pushItem(SizedEncodeInt.from(result));
        break;
      }

      case OpCodes.OpGreaterThan: {
        const [a, b] = vm.dstack.popItems(2);
        const result = a.value > b.value ? 1n : 0n;
        vm.dstack.pushItem(SizedEncodeInt.from(result));
        break;
      }

      case OpCodes.OpLessThanOrEqual: {
        const [a, b] = vm.dstack.popItems(2);
        const result = a.value <= b.value ? 1n : 0n;
        vm.dstack.pushItem(SizedEncodeInt.from(result));
        break;
      }

      case OpCodes.OpGreaterThanOrEqual: {
        const [a, b] = vm.dstack.popItems(2);
        const result = a.value >= b.value ? 1n : 0n;
        vm.dstack.pushItem(SizedEncodeInt.from(result));
        break;
      }

      case OpCodes.OpMin: {
        const [a, b] = vm.dstack.popItems(2);
        const result = a.value < b.value ? a.value : b.value;
        vm.dstack.pushItem(SizedEncodeInt.from(result));
        break;
      }

      case OpCodes.OpMax: {
        const [a, b] = vm.dstack.popItems(2);
        const result = a.value > b.value ? a.value : b.value;
        vm.dstack.pushItem(SizedEncodeInt.from(result));
        break;
      }

      case OpCodes.OpWithin: {
        const [x, l, u] = vm.dstack.popItems(3);
        const r = x >= l && x < u ? 1n : 0n;
        vm.dstack.pushItem(SizedEncodeInt.from(r));
        break;
      }

      // Undefined opcodes.
      case OpCodes.OpUnknown166:
      case OpCodes.OpUnknown167:
        throw new Error(`TxScriptError: attempt to execute invalid opcode ${this.code}`);

      // Crypto opcodes.
      case OpCodes.OpSHA256: {
        const [last] = vm.dstack.popRaw(1);
        vm.dstack.push(sha256(last));
        break;
      }

      case OpCodes.OpCheckMultiSigECDSA: {
        vm.opCheckMultisigSchnorrOrEcdsa(true);
        break;
      }

      case OpCodes.OpBlake2b: {
        const [last] = vm.dstack.popRaw(1);
        const hash = blake2b(last, { dkLen: 32 });
        vm.dstack.push(hash);
        break;
      }

      case OpCodes.OpCheckSigECDSA: {
        const [sig, key] = vm.dstack.popRaw(2);
        const typ = sig[sig.length - 1];
        const realSig = sig.slice(0, -1);

        if (typ === undefined) {
          vm.dstack.push(OpcodeDataBool.serialize(false));
          break;
        }

        const hashType = SigHashType.fromU8(typ);
        const valid = vm.checkEcdsaSignature(hashType, key, realSig);
        vm.dstack.push(OpcodeDataBool.serialize(valid));
        break;
      }

      case OpCodes.OpCheckSig: {
        const [sigSchnorr, key] = vm.dstack.popRaw(2);

        // Hash type
        const typ = sigSchnorr[sigSchnorr.length - 1];
        const realSig = sigSchnorr.slice(0, -1);

        if (typ === undefined) {
          vm.dstack.push(OpcodeDataBool.serialize(false));
          break;
        }

        const hashType = SigHashType.fromU8(typ);
        const valid = vm.checkSchnorrSignature(hashType, key, realSig);
        vm.dstack.push(OpcodeDataBool.serialize(valid));
        break;
      }

      case OpCodes.OpCheckSigVerify: {
        const opCheckSig = new OpCode(OpCodes.OpCheckSig, this.data.slice());
        opCheckSig.execute(vm);
        let [valid] = vm.dstack.popItems(1);
        if (!valid) this.throwVerifyError();
        break;
      }

      case OpCodes.OpCheckMultiSig: {
        vm.opCheckMultisigSchnorrOrEcdsa(false);
        break;
      }

      case OpCodes.OpCheckMultiSigVerify: {
        const opCheckMultiSig = new OpCode(OpCodes.OpCheckMultiSig, this.data.slice());
        opCheckMultiSig.execute(vm);
        let [valid] = vm.dstack.popItems(1);
        if (!valid) this.throwVerifyError();
        break;
      }

      case OpCodes.OpCheckLockTimeVerify: {
        if (vm.scriptSource.type !== 'TxInput') {
          this.throwInvalidSourceError('OpCheckLockTimeVerify');
          break;
        }

        const { input, tx } = vm.scriptSource;

        let [lockTimeBytes] = vm.dstack.popRaw(1);

        // Make sure lockTimeBytes is exactly 8 bytes.
        // If more - return ErrNumberTooBig
        // If less - pad with 0's
        if (lockTimeBytes.length > 8) {
          throw new Error(
            `TxScriptError: lockTime value represented as ${Buffer.from(lockTimeBytes).toString('hex')} is longer than 8 bytes`
          );
        }

        while (lockTimeBytes.length < 8) {
          lockTimeBytes = Buffer.concat([lockTimeBytes, Buffer.from([0])]);
        }
        const stackLockTime = new DataView(lockTimeBytes.buffer).getBigInt64(0, true);

        // The lock time field of a transaction is either a DAA score at
        // which the transaction is finalized or a timestamp depending on if the
        // value is before the constants.LockTimeThreshold. When it is under the
        // threshold it is a DAA score.
        if (
          !(
            (tx.tx().lockTime < LOCK_TIME_THRESHOLD && stackLockTime < LOCK_TIME_THRESHOLD) ||
            (tx.tx().lockTime >= LOCK_TIME_THRESHOLD && stackLockTime >= LOCK_TIME_THRESHOLD)
          )
        ) {
          throw new Error(
            `TxScriptError: mismatched locktime types -- tx locktime ${tx.tx().lockTime}, stack locktime ${stackLockTime}`
          );
        }

        if (stackLockTime > tx.tx().lockTime) {
          throw new Error(
            `TxScriptError: locktime requirement not satisfied -- locktime is greater than the transaction locktime: ${stackLockTime} > ${tx.tx().lockTime}`
          );
        }

        // The lock time feature can also be disabled, thereby bypassing
        // OP_CHECKLOCKTIMEVERIFY, if every transaction input has been finalized by
        // setting its sequence to the maximum value (constants.MaxTxInSequenceNum). This
        // condition would result in the transaction being allowed into the blockDAG
        // making the opcode ineffective.
        //
        // This condition is prevented by enforcing that the input being used by
        // the opcode is unlocked (its sequence number is less than the max
        // value). This is sufficient to prove correctness without having to
        // check every input.
        //
        // NOTE: This implies that even if the transaction is not finalized due to
        // another input being unlocked, the opcode execution will still fail when the
        // input being used by the opcode is locked.
        if (input.sequence === MAX_TX_IN_SEQUENCE_NUM) {
          throw new Error('TxScriptError： transaction input is finalized');
        }

        break;
      }

      case OpCodes.OpCheckSequenceVerify: {
        if (vm.scriptSource.type !== 'TxInput') {
          this.throwInvalidSourceError('OpCheckSequenceVerify');
          break;
        }

        const { input } = vm.scriptSource;

        let [sequenceBytes] = vm.dstack.popRaw(1);

        // Make sure sequenceBytes is exactly 8 bytes.
        // If more - return ErrNumberTooBig
        // If less - pad with 0's
        if (sequenceBytes.length > 8) {
          throw new Error(
            `TxScriptError: sequence value represented as ${Buffer.from(sequenceBytes).toString('hex')} is longer than 8 bytes`
          );
        }

        while (sequenceBytes.length < 8) {
          sequenceBytes = Buffer.concat([sequenceBytes, Buffer.from([0])]);
        }
        const stackSequence = new DataView(sequenceBytes.buffer).getBigInt64(0, true);

        // To provide for future soft-fork extensibility, if the
        // operand has the disabled lock-time flag set,
        // CHECKSEQUENCEVERIFY behaves as a NOP.
        if ((stackSequence & SEQUENCE_LOCK_TIME_DISABLED) != 0n) {
          break;
        }

        // Sequence numbers with their most significant bit set are not
        // consensus constrained. Testing that the transaction's sequence
        // number does not have this bit set prevents using this property
        // to get around a CHECKSEQUENCEVERIFY check.
        if ((input.sequence & SEQUENCE_LOCK_TIME_DISABLED) != 0n) {
          throw new Error(
            `TxScriptError: transaction sequence has sequence locktime disabled bit set ${input.sequence.toString(16)}`
          );
        }

        // Mask off non-consensus bits before doing comparisons.
        if ((stackSequence & SEQUENCE_LOCK_TIME_MASK) > (input.sequence & SEQUENCE_LOCK_TIME_MASK)) {
          throw new Error(
            `TxScriptError: locktime requirement not satisfied -- locktime is greater than the transaction locktime: ${(stackSequence & SEQUENCE_LOCK_TIME_MASK).toString()} > ${(input.sequence & SEQUENCE_LOCK_TIME_MASK).toString()}`
          );
        }

        break;
      }

      // Introspection opcodes
      // Transaction level opcodes (following Transaction struct field order)
      case OpCodes.OpTxVersion: {
        this.throwOpcodeReservedError(this.code);
        break;
      }

      case OpCodes.OpTxInputCount: {
        if (vm.scriptSource.type !== 'TxInput') {
          this.throwInvalidSourceError('OpTxInputCount');
          break;
        }

        const { tx } = vm.scriptSource;
        pushNumber(tx.tx().inputs.length, vm);
        break;
      }

      case OpCodes.OpTxLockTime:
      case OpCodes.OpTxSubnetId:
      case OpCodes.OpTxGas:
      case OpCodes.OpTxPayload: {
        this.throwOpcodeReservedError(this.code);
        break;
      }

      case OpCodes.OpTxInputIndex: {
        if (vm.scriptSource.type !== 'TxInput') {
          this.throwInvalidSourceError('OpTxInputIndex');
          break;
        }

        const { idx } = vm.scriptSource;
        pushNumber(idx, vm);

        break;
      }

      case OpCodes.OpOutpointTxId:
      case OpCodes.OpOutpointIndex:
      case OpCodes.OpTxInputScriptSig:
      case OpCodes.OpTxInputSeq: {
        this.throwOpcodeReservedError(this.code);
        break;
      }

      case OpCodes.OpTxInputAmount: {
        if (vm.scriptSource.type !== 'TxInput') {
          this.throwInvalidSourceError('OpTxInputAmount');
          break;
        }
        const { tx } = vm.scriptSource;
        const [idx] = vm.dstack.popItems(1);
        const utxo = tx.utxo(Number(idx.value));
        if (!utxo) {
          throw new Error(`TxScriptError: Invalid input index: ${idx}, transaction inputs length: ${tx.inputs.length}`);
        }

        if (utxo.amount > i64Max) throw new Error(`TxScriptError: Number too big: ${utxo.amount}`);

        pushNumber(Number(utxo.amount), vm);
        break;
      }

      case OpCodes.OpTxInputSpk: {
        if (vm.scriptSource.type !== 'TxInput') {
          this.throwInvalidSourceError('OpTxInputSpk');
          break;
        }
        const { tx } = vm.scriptSource;
        const [idx] = vm.dstack.popItems(1);
        const utxo = tx.utxo(Number(idx));
        if (!utxo) {
          throw new Error(`TxScriptError: Invalid input index: ${idx}, transaction inputs length: ${tx.inputs.length}`);
        }
        vm.dstack.push(utxo.scriptPublicKey.toBytes());
        break;
      }

      case OpCodes.OpTxInputBlockDaaScore:
      case OpCodes.OpTxInputIsCoinbase: {
        this.throwOpcodeReservedError(this.code);
        break;
      }

      case OpCodes.OpTxOutputAmount: {
        if (vm.scriptSource.type !== 'TxInput') {
          this.throwInvalidSourceError('OpTxOutputAmount');
          break;
        }
        const { tx } = vm.scriptSource;
        const [idx] = vm.dstack.popItems(1);
        const output = tx.outputs()[Number(idx)];
        if (!output) {
          throw new Error(
            `TxScriptError: Invalid output index: ${idx}, transaction outputs length: ${tx.outputs().length}`
          );
        }
        if (output.value > i64Max) throw new Error(`TxScriptError: Number too big: ${output.value}`);
        pushNumber(Number(output.value), vm);
        break;
      }

      case OpCodes.OpTxOutputSpk: {
        if (vm.scriptSource.type !== 'TxInput') {
          this.throwInvalidSourceError('OpTxOutputSpk');
          break;
        }
        const { tx } = vm.scriptSource;
        const [idx] = vm.dstack.popItems(1);
        const output = tx.outputs()[Number(idx)];
        if (!output) {
          throw new Error(
            `TxScriptError: Invalid output index: ${idx}, transaction outputs length: ${tx.outputs().length}`
          );
        }
        vm.dstack.push(output.scriptPublicKey.toBytes());
        break;
      }

      case OpCodes.OpUnknown196:
      case OpCodes.OpUnknown197:
      case OpCodes.OpUnknown198:
      case OpCodes.OpUnknown199:
      case OpCodes.OpUnknown200:
      case OpCodes.OpUnknown201:
      case OpCodes.OpUnknown202:
      case OpCodes.OpUnknown203:
      case OpCodes.OpUnknown204:
      case OpCodes.OpUnknown205:
      case OpCodes.OpUnknown206:
      case OpCodes.OpUnknown207:
      case OpCodes.OpUnknown208:
      case OpCodes.OpUnknown209:
      case OpCodes.OpUnknown210:
      case OpCodes.OpUnknown211:
      case OpCodes.OpUnknown212:
      case OpCodes.OpUnknown213:
      case OpCodes.OpUnknown214:
      case OpCodes.OpUnknown215:
      case OpCodes.OpUnknown216:
      case OpCodes.OpUnknown217:
      case OpCodes.OpUnknown218:
      case OpCodes.OpUnknown219:
      case OpCodes.OpUnknown220:
      case OpCodes.OpUnknown221:
      case OpCodes.OpUnknown222:
      case OpCodes.OpUnknown223:
      case OpCodes.OpUnknown224:
      case OpCodes.OpUnknown225:
      case OpCodes.OpUnknown226:
      case OpCodes.OpUnknown227:
      case OpCodes.OpUnknown228:
      case OpCodes.OpUnknown229:
      case OpCodes.OpUnknown230:
      case OpCodes.OpUnknown231:
      case OpCodes.OpUnknown232:
      case OpCodes.OpUnknown233:
      case OpCodes.OpUnknown234:
      case OpCodes.OpUnknown235:
      case OpCodes.OpUnknown236:
      case OpCodes.OpUnknown237:
      case OpCodes.OpUnknown238:
      case OpCodes.OpUnknown239:
      case OpCodes.OpUnknown240:
      case OpCodes.OpUnknown241:
      case OpCodes.OpUnknown242:
      case OpCodes.OpUnknown243:
      case OpCodes.OpUnknown244:
      case OpCodes.OpUnknown245:
      case OpCodes.OpUnknown246:
      case OpCodes.OpUnknown247:
      case OpCodes.OpUnknown248:
      case OpCodes.OpUnknown249:
      case OpCodes.OpSmallInteger:
      case OpCodes.OpPubKeys:
      case OpCodes.OpUnknown252:
      case OpCodes.OpPubKeyHash:
      case OpCodes.OpPubKey:
      case OpCodes.OpInvalidOpCode: {
        this.throwOpcodeReservedError(this.code);
        break;
      }

      default:
        throw new Error(`TxScriptError: Unknown opcode: ${this.code}`);
    }
  }
  value(): number {
    return this.code;
  }

  isDisabled(): boolean {
    return [
      OpCodes.OpCat,
      OpCodes.OpSubStr,
      OpCodes.OpLeft,
      OpCodes.OpRight,
      OpCodes.OpInvert,
      OpCodes.OpAnd,
      OpCodes.OpOr,
      OpCodes.OpXor,
      OpCodes.Op2Mul,
      OpCodes.Op2Div,
      OpCodes.OpMul,
      OpCodes.OpDiv,
      OpCodes.OpMod,
      OpCodes.OpLShift,
      OpCodes.OpRShift
    ].includes(this.code);
  }

  alwaysIllegal(): boolean {
    return [OpCodes.OpVerIf, OpCodes.OpVerNotIf].includes(this.code);
  }

  isPushOpcode(): boolean {
    return this.code <= NO_COST_OPCODE;
  }

  len(): number {
    return this.data.length;
  }

  isConditional(): boolean {
    return this.value() >= 0x63 && this.value() <= 0x68;
  }

  checkMinimalDataPush(): void {
    const dataLen = this.len();
    const opcode = this.value();

    if (dataLen === 0) {
      if (opcode !== OpCodes.OpFalse) {
        throw new Error(`TxScriptError: Zero length data push is encoded with opcode ${this} instead of OpFalse`);
      }
    } else if (dataLen === 1 && this.data[0] >= OP_SMALL_INT_MIN_VAL && this.data[0] <= OP_SMALL_INT_MAX_VAL) {
      if (opcode !== OpCodes.OpTrue + this.data[0] - 1) {
        throw new Error(
          `TxScriptError: Data push of the value ${this.data[0]} encoded with opcode ${this} instead of Op_${this.data[0]}`
        );
      }
    } else if (dataLen === 1 && this.data[0] === OP_1_NEGATE_VAL) {
      if (opcode !== OpCodes.Op1Negate) {
        throw new Error(`TxScriptError: Data push of the value -1 encoded with opcode ${this} instead of Op1Negate`);
      }
    } else if (dataLen <= OP_DATA_MAX_VAL) {
      if (opcode !== dataLen) {
        throw new Error(
          `TxScriptError: Data push of ${dataLen} bytes encoded with opcode ${this} instead of OpData${dataLen}`
        );
      }
    } else if (dataLen <= 255) {
      if (opcode !== OpCodes.OpPushData1) {
        throw new Error(
          `TxScriptError: Data push of ${dataLen} bytes encoded with opcode ${this} instead of OpPushData1`
        );
      }
    } else if (dataLen <= 65535) {
      if (opcode !== OpCodes.OpPushData2) {
        throw new Error(
          `TxScriptError: Data push of ${dataLen} bytes encoded with opcode ${this} instead of OpPushData2`
        );
      }
    }
  }

  getData(): Uint8Array {
    return this.data;
  }

  isEmpty(): boolean {
    return this.len() === 0;
  }

  serialize(): Uint8Array {
    if (this.code === OpCodes.OpPushData1 || this.code === OpCodes.OpPushData2 || this.code === OpCodes.OpPushData4)
      return new Uint8Array([this.value(), this.len(), ...this.data]);

    return new Uint8Array([this.value(), ...this.data]);
  }

  static deserialize(it: Iterator<number>): OpCode | undefined {
    const result = it.next();
    if (result.done) return undefined;

    const code = result.value;
    validateOpcodeRange(code);
    let dataLen = getDataLengthOfCode(code);

    switch (code) {
      case OpCodes.OpPushData1:
        dataLen = it.next().value as number;
        break;
      case OpCodes.OpPushData2:
        const bytesOfOpPushData2 = new Uint8Array([it.next().value, it.next().value]);
        dataLen = new DataView(new Uint8Array(bytesOfOpPushData2).buffer).getUint16(0, true);
        break;
      case OpCodes.OpPushData4:
        const bytesOfOpPushData4 = new Uint8Array([it.next().value, it.next().value, it.next().value, it.next().value]);
        dataLen = new DataView(new Uint8Array(bytesOfOpPushData4).buffer).getUint32(0, true);
        break;
      default:
        break;
    }

    const data = new Uint8Array(dataLen);
    for (let i = 0; i < dataLen; i++) {
      data[i] = it.next().value;
    }
    return new OpCode(code, data);
  }

  private throwMalformedPushError(code: OpCodes, length: number) {
    throw new Error(`opcode requires ${code.valueOf()} bytes, but script only has ${length} remaining`);
  }

  private throwVerifyError() {
    throw new Error('TxScriptError: script ran, but verification failed');
  }

  private throwOpcodeReservedError(code: OpCodes) {
    throw new Error(`TxScriptError: Opcode reserved: ${code}`);
  }

  private throwInvalidSourceError(codeName: string) {
    throw new Error(
      `TxScriptError: opcode not supported on current source: ${codeName} only applies to transaction inputs`
    );
  }

  private throwEmptyStackError() {
    throw new Error('TxScriptError: attempt to read from empty stack');
  }

  private throwInvalidStateError(msg: string) {
    throw new Error(`TxScriptError: encountered invalid state while running script ${msg}`);
  }
}

/**
 * Internal method to check if the opcode is within the valid range.
 */

/**
 * Validate if the opcode is within the valid range (0-255).
 *
 * @param {number} opcode - The opcode to check.
 * @throws {ScriptBuilderError} If the opcode is out of range.
 */
function validateOpcodeRange(opcode: number): void {
  if (opcode < 0 || opcode > 255) {
    throw new ScriptBuilderError(`Opcode ${opcode} is out of range. Must be between 0 and 255.`);
  }
}

function pushData<T extends IVerifiableTransaction>(data: Uint8Array, vm: TxScriptEngine<T>) {
  vm.dstack.push(data);
}

function pushNumber<T extends IVerifiableTransaction>(number: number, vm: TxScriptEngine<T>) {
  const sizeEncodeInt = SizedEncodeInt.from(BigInt(number));
  vm.dstack.pushItem(sizeEncodeInt);
}

function areUint8ArraysEqual(arr1: Uint8Array[], arr2: Uint8Array[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (!areUint8ArraysEqualSingle(arr1[i], arr2[i])) {
      return false;
    }
  }
  return true;
}

function areUint8ArraysEqualSingle(arr1: Uint8Array, arr2: Uint8Array): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

function toSmallInt(opcode: OpCode): number {
  const value = opcode.value();
  if (value === OpCodes.OpFalse) {
    return 0;
  }

  if (value < OpCodes.OpTrue || value > OpCodes.Op16) {
    throw new Error('expected op codes between from the list of Op0 to Op16');
  }

  return value - (OpCodes.OpTrue - 1);
}

export { OpCode, validateOpcodeRange, toSmallInt };

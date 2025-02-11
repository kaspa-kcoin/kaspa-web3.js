import { maxValueOfU } from '../../../utils.ts';

/**
 * OpCodes enum.
 */
enum OpCodes {
  OpFalse = 0x00,
  Op0 = 0x00,
  OpData1 = 0x01,
  OpData2 = 0x02,
  OpData3 = 0x03,
  OpData4 = 0x04,
  OpData5 = 0x05,
  OpData6 = 0x06,
  OpData7 = 0x07,
  OpData8 = 0x08,
  OpData9 = 0x09,
  OpData10 = 0x0a,
  OpData11 = 0x0b,
  OpData12 = 0x0c,
  OpData13 = 0x0d,
  OpData14 = 0x0e,
  OpData15 = 0x0f,
  OpData16 = 0x10,
  OpData17 = 0x11,
  OpData18 = 0x12,
  OpData19 = 0x13,
  OpData20 = 0x14,
  OpData21 = 0x15,
  OpData22 = 0x16,
  OpData23 = 0x17,
  OpData24 = 0x18,
  OpData25 = 0x19,
  OpData26 = 0x1a,
  OpData27 = 0x1b,
  OpData28 = 0x1c,
  OpData29 = 0x1d,
  OpData30 = 0x1e,
  OpData31 = 0x1f,
  OpData32 = 0x20,
  OpData33 = 0x21,
  OpData34 = 0x22,
  OpData35 = 0x23,
  OpData36 = 0x24,
  OpData37 = 0x25,
  OpData38 = 0x26,
  OpData39 = 0x27,
  OpData40 = 0x28,
  OpData41 = 0x29,
  OpData42 = 0x2a,
  OpData43 = 0x2b,
  OpData44 = 0x2c,
  OpData45 = 0x2d,
  OpData46 = 0x2e,
  OpData47 = 0x2f,
  OpData48 = 0x30,
  OpData49 = 0x31,
  OpData50 = 0x32,
  OpData51 = 0x33,
  OpData52 = 0x34,
  OpData53 = 0x35,
  OpData54 = 0x36,
  OpData55 = 0x37,
  OpData56 = 0x38,
  OpData57 = 0x39,
  OpData58 = 0x3a,
  OpData59 = 0x3b,
  OpData60 = 0x3c,
  OpData61 = 0x3d,
  OpData62 = 0x3e,
  OpData63 = 0x3f,
  OpData64 = 0x40,
  OpData65 = 0x41,
  OpData66 = 0x42,
  OpData67 = 0x43,
  OpData68 = 0x44,
  OpData69 = 0x45,
  OpData70 = 0x46,
  OpData71 = 0x47,
  OpData72 = 0x48,
  OpData73 = 0x49,
  OpData74 = 0x4a,
  OpData75 = 0x4b,
  OpPushData1 = 0x4c,
  OpPushData2 = 0x4d,
  OpPushData4 = 0x4e,
  Op1Negate = 0x4f,
  OpReserved = 0x50,
  OpTrue = 0x51,
  Op1 = 0x51,
  Op2 = 0x52,
  Op3 = 0x53,
  Op4 = 0x54,
  Op5 = 0x55,
  Op6 = 0x56,
  Op7 = 0x57,
  Op8 = 0x58,
  Op9 = 0x59,
  Op10 = 0x5a,
  Op11 = 0x5b,
  Op12 = 0x5c,
  Op13 = 0x5d,
  Op14 = 0x5e,
  Op15 = 0x5f,
  Op16 = 0x60,
  OpNop = 0x61,
  OpVer = 0x62,
  OpIf = 0x63,
  OpNotIf = 0x64,
  OpVerIf = 0x65,
  OpVerNotIf = 0x66,
  OpElse = 0x67,
  OpEndIf = 0x68,
  OpVerify = 0x69,
  OpReturn = 0x6a,
  OpToAltStack = 0x6b,
  OpFromAltStack = 0x6c,
  Op2Drop = 0x6d,
  Op2Dup = 0x6e,
  Op3Dup = 0x6f,
  Op2Over = 0x70,
  Op2Rot = 0x71,
  Op2Swap = 0x72,
  OpIfDup = 0x73,
  OpDepth = 0x74,
  OpDrop = 0x75,
  OpDup = 0x76,
  OpNip = 0x77,
  OpOver = 0x78,
  OpPick = 0x79,
  OpRoll = 0x7a,
  OpRot = 0x7b,
  OpSwap = 0x7c,
  OpTuck = 0x7d,
  OpCat = 0x7e,
  OpSubStr = 0x7f,
  OpLeft = 0x80,
  OpRight = 0x81,
  OpSize = 0x82,
  OpInvert = 0x83,
  OpAnd = 0x84,
  OpOr = 0x85,
  OpXor = 0x86,
  OpEqual = 0x87,
  OpEqualVerify = 0x88,
  OpReserved1 = 0x89,
  OpReserved2 = 0x8a,
  Op1Add = 0x8b,
  Op1Sub = 0x8c,
  Op2Mul = 0x8d,
  Op2Div = 0x8e,
  OpNegate = 0x8f,
  OpAbs = 0x90,
  OpNot = 0x91,
  Op0NotEqual = 0x92,
  OpAdd = 0x93,
  OpSub = 0x94,
  OpMul = 0x95,
  OpDiv = 0x96,
  OpMod = 0x97,
  OpLShift = 0x98,
  OpRShift = 0x99,
  OpBoolAnd = 0x9a,
  OpBoolOr = 0x9b,
  OpNumEqual = 0x9c,
  OpNumEqualVerify = 0x9d,
  OpNumNotEqual = 0x9e,
  OpLessThan = 0x9f,
  OpGreaterThan = 0xa0,
  OpLessThanOrEqual = 0xa1,
  OpGreaterThanOrEqual = 0xa2,
  OpMin = 0xa3,
  OpMax = 0xa4,
  OpWithin = 0xa5,
  OpUnknown166 = 0xa6,
  OpUnknown167 = 0xa7,
  OpSHA256 = 0xa8,
  OpCheckMultiSigECDSA = 0xa9,
  OpBlake2b = 0xaa,
  OpCheckSigECDSA = 0xab,
  OpCheckSig = 0xac,
  OpCheckSigVerify = 0xad,
  OpCheckMultiSig = 0xae,
  OpCheckMultiSigVerify = 0xaf,
  OpCheckLockTimeVerify = 0xb0,
  OpCheckSequenceVerify = 0xb1,
  OpTxVersion = 0xb2,
  OpTxInputCount = 0xb3,
  OpTxOutputCount = 0xb4,
  OpTxLockTime = 0xb5,
  OpTxSubnetId = 0xb6,
  OpTxGas = 0xb7,
  OpTxPayload = 0xb8,
  OpTxInputIndex = 0xb9,
  OpOutpointTxId = 0xba,
  OpOutpointIndex = 0xbb,
  OpTxInputScriptSig = 0xbc,
  OpTxInputSeq = 0xbd,
  OpTxInputAmount = 0xbe,
  OpTxInputSpk = 0xbf,
  OpTxInputBlockDaaScore = 0xc0,
  OpTxInputIsCoinbase = 0xc1,
  OpTxOutputAmount = 0xc2,
  OpTxOutputSpk = 0xc3,
  OpUnknown196 = 0xc4,
  OpUnknown197 = 0xc5,
  OpUnknown198 = 0xc6,
  OpUnknown199 = 0xc7,
  OpUnknown200 = 0xc8,
  OpUnknown201 = 0xc9,
  OpUnknown202 = 0xca,
  OpUnknown203 = 0xcb,
  OpUnknown204 = 0xcc,
  OpUnknown205 = 0xcd,
  OpUnknown206 = 0xce,
  OpUnknown207 = 0xcf,
  OpUnknown208 = 0xd0,
  OpUnknown209 = 0xd1,
  OpUnknown210 = 0xd2,
  OpUnknown211 = 0xd3,
  OpUnknown212 = 0xd4,
  OpUnknown213 = 0xd5,
  OpUnknown214 = 0xd6,
  OpUnknown215 = 0xd7,
  OpUnknown216 = 0xd8,
  OpUnknown217 = 0xd9,
  OpUnknown218 = 0xda,
  OpUnknown219 = 0xdb,
  OpUnknown220 = 0xdc,
  OpUnknown221 = 0xdd,
  OpUnknown222 = 0xde,
  OpUnknown223 = 0xdf,
  OpUnknown224 = 0xe0,
  OpUnknown225 = 0xe1,
  OpUnknown226 = 0xe2,
  OpUnknown227 = 0xe3,
  OpUnknown228 = 0xe4,
  OpUnknown229 = 0xe5,
  OpUnknown230 = 0xe6,
  OpUnknown231 = 0xe7,
  OpUnknown232 = 0xe8,
  OpUnknown233 = 0xe9,
  OpUnknown234 = 0xea,
  OpUnknown235 = 0xeb,
  OpUnknown236 = 0xec,
  OpUnknown237 = 0xed,
  OpUnknown238 = 0xee,
  OpUnknown239 = 0xef,
  OpUnknown240 = 0xf0,
  OpUnknown241 = 0xf1,
  OpUnknown242 = 0xf2,
  OpUnknown243 = 0xf3,
  OpUnknown244 = 0xf4,
  OpUnknown245 = 0xf5,
  OpUnknown246 = 0xf6,
  OpUnknown247 = 0xf7,
  OpUnknown248 = 0xf8,
  OpUnknown249 = 0xf9,
  OpSmallInteger = 0xfa,
  OpPubKeys = 0xfb,
  OpUnknown252 = 0xfc,
  OpPubKeyHash = 0xfd,
  OpPubKey = 0xfe,
  OpInvalidOpCode = 0xff
}

const getDataLengthOfCode = (opcode: OpCodes): number => {
  switch (opcode) {
    case OpCodes.OpFalse:
      return 0;
    case OpCodes.OpData1:
      return 1;
    case OpCodes.OpData2:
      return 2;
    case OpCodes.OpData3:
      return 3;
    case OpCodes.OpData4:
      return 4;
    case OpCodes.OpData5:
      return 5;
    case OpCodes.OpData6:
      return 6;
    case OpCodes.OpData7:
      return 7;
    case OpCodes.OpData8:
      return 8;
    case OpCodes.OpData9:
      return 9;
    case OpCodes.OpData10:
      return 10;
    case OpCodes.OpData11:
      return 11;
    case OpCodes.OpData12:
      return 12;
    case OpCodes.OpData13:
      return 13;
    case OpCodes.OpData14:
      return 14;
    case OpCodes.OpData15:
      return 15;
    case OpCodes.OpData16:
      return 16;
    case OpCodes.OpData17:
      return 17;
    case OpCodes.OpData18:
      return 18;
    case OpCodes.OpData19:
      return 19;
    case OpCodes.OpData20:
      return 20;
    case OpCodes.OpData21:
      return 21;
    case OpCodes.OpData22:
      return 22;
    case OpCodes.OpData23:
      return 23;
    case OpCodes.OpData24:
      return 24;
    case OpCodes.OpData25:
      return 25;
    case OpCodes.OpData26:
      return 26;
    case OpCodes.OpData27:
      return 27;
    case OpCodes.OpData28:
      return 28;
    case OpCodes.OpData29:
      return 29;
    case OpCodes.OpData30:
      return 30;
    case OpCodes.OpData31:
      return 31;
    case OpCodes.OpData32:
      return 32;
    case OpCodes.OpData33:
      return 33;
    case OpCodes.OpData34:
      return 34;
    case OpCodes.OpData35:
      return 35;
    case OpCodes.OpData36:
      return 36;
    case OpCodes.OpData37:
      return 37;
    case OpCodes.OpData38:
      return 38;
    case OpCodes.OpData39:
      return 39;
    case OpCodes.OpData40:
      return 40;
    case OpCodes.OpData41:
      return 41;
    case OpCodes.OpData42:
      return 42;
    case OpCodes.OpData43:
      return 43;
    case OpCodes.OpData44:
      return 44;
    case OpCodes.OpData45:
      return 45;
    case OpCodes.OpData46:
      return 46;
    case OpCodes.OpData47:
      return 47;
    case OpCodes.OpData48:
      return 48;
    case OpCodes.OpData49:
      return 49;
    case OpCodes.OpData50:
      return 50;
    case OpCodes.OpData51:
      return 51;
    case OpCodes.OpData52:
      return 52;
    case OpCodes.OpData53:
      return 53;
    case OpCodes.OpData54:
      return 54;
    case OpCodes.OpData55:
      return 55;
    case OpCodes.OpData56:
      return 56;
    case OpCodes.OpData57:
      return 57;
    case OpCodes.OpData58:
      return 58;
    case OpCodes.OpData59:
      return 59;
    case OpCodes.OpData60:
      return 60;
    case OpCodes.OpData61:
      return 61;
    case OpCodes.OpData62:
      return 62;
    case OpCodes.OpData63:
      return 63;
    case OpCodes.OpData64:
      return 64;
    case OpCodes.OpData65:
      return 65;
    case OpCodes.OpData66:
      return 66;
    case OpCodes.OpData67:
      return 67;
    case OpCodes.OpData68:
      return 68;
    case OpCodes.OpData69:
      return 69;
    case OpCodes.OpData70:
      return 70;
    case OpCodes.OpData71:
      return 71;
    case OpCodes.OpData72:
      return 72;
    case OpCodes.OpData73:
      return 73;
    case OpCodes.OpData74:
      return 74;
    case OpCodes.OpData75:
      return 75;
    case OpCodes.OpPushData1:
      return Number(maxValueOfU(8));
    case OpCodes.OpPushData2:
      return Number(maxValueOfU(16));
    case OpCodes.OpPushData4:
      return Number(maxValueOfU(32));

    case OpCodes.Op1Negate:
    case OpCodes.OpReserved:
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
    case OpCodes.OpNop:
    case OpCodes.OpVer:
    case OpCodes.OpIf:
    case OpCodes.OpNotIf:
    case OpCodes.OpVerIf:
    case OpCodes.OpVerNotIf:
    case OpCodes.OpElse:
    case OpCodes.OpEndIf:
    case OpCodes.OpVerify:
    case OpCodes.OpReturn:
    case OpCodes.OpToAltStack:
    case OpCodes.OpFromAltStack:
    case OpCodes.Op2Drop:
    case OpCodes.Op2Dup:
    case OpCodes.Op3Dup:
    case OpCodes.Op2Over:
    case OpCodes.Op2Rot:
    case OpCodes.Op2Swap:
    case OpCodes.OpIfDup:
    case OpCodes.OpDepth:
    case OpCodes.OpDrop:
    case OpCodes.OpDup:
    case OpCodes.OpNip:
    case OpCodes.OpOver:
    case OpCodes.OpPick:
    case OpCodes.OpRoll:
    case OpCodes.OpRot:
    case OpCodes.OpSwap:
    case OpCodes.OpTuck:
    case OpCodes.OpCat:
    case OpCodes.OpSubStr:
    case OpCodes.OpLeft:
    case OpCodes.OpRight:
    case OpCodes.OpSize:
    case OpCodes.OpInvert:
    case OpCodes.OpAnd:
    case OpCodes.OpOr:
    case OpCodes.OpXor:
    case OpCodes.OpEqual:
    case OpCodes.OpEqualVerify:
    case OpCodes.OpReserved1:
    case OpCodes.OpReserved2:
    case OpCodes.Op1Add:
    case OpCodes.Op1Sub:
    case OpCodes.Op2Mul:
    case OpCodes.Op2Div:
    case OpCodes.OpNegate:
    case OpCodes.OpAbs:
    case OpCodes.OpNot:
    case OpCodes.Op0NotEqual:
    case OpCodes.OpAdd:
    case OpCodes.OpSub:
    case OpCodes.OpMul:
    case OpCodes.OpDiv:
    case OpCodes.OpMod:
    case OpCodes.OpLShift:
    case OpCodes.OpRShift:
    case OpCodes.OpBoolAnd:
    case OpCodes.OpBoolOr:
    case OpCodes.OpNumEqual:
    case OpCodes.OpNumEqualVerify:
    case OpCodes.OpNumNotEqual:
    case OpCodes.OpLessThan:
    case OpCodes.OpGreaterThan:
    case OpCodes.OpLessThanOrEqual:
    case OpCodes.OpGreaterThanOrEqual:
    case OpCodes.OpMin:
    case OpCodes.OpMax:
    case OpCodes.OpWithin:
    case OpCodes.OpUnknown166:
    case OpCodes.OpUnknown167:
    case OpCodes.OpSHA256:
    case OpCodes.OpCheckMultiSigECDSA:
    case OpCodes.OpBlake2b:
    case OpCodes.OpCheckSigECDSA:
    case OpCodes.OpCheckSig:
    case OpCodes.OpCheckSigVerify:
    case OpCodes.OpCheckMultiSig:
    case OpCodes.OpCheckMultiSigVerify:
    case OpCodes.OpCheckLockTimeVerify:
    case OpCodes.OpCheckSequenceVerify:
    case OpCodes.OpTxVersion:
    case OpCodes.OpTxInputCount:
    case OpCodes.OpTxOutputCount:
    case OpCodes.OpTxLockTime:
    case OpCodes.OpTxSubnetId:
    case OpCodes.OpTxGas:
    case OpCodes.OpTxPayload:
    case OpCodes.OpTxInputIndex:
    case OpCodes.OpOutpointTxId:
    case OpCodes.OpOutpointIndex:
    case OpCodes.OpTxInputScriptSig:
    case OpCodes.OpTxInputSeq:
    case OpCodes.OpTxInputAmount:
    case OpCodes.OpTxInputSpk:
    case OpCodes.OpTxInputBlockDaaScore:
    case OpCodes.OpTxInputIsCoinbase:
    case OpCodes.OpTxOutputAmount:
    case OpCodes.OpTxOutputSpk:
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
      return 0;
    }
    default:
      throw new Error(`Unknown opcode: ${opcode}`);
  }
};

export { OpCodes, getDataLengthOfCode };

import { describe, it, expect } from 'vitest';
import { Constants as C, ScriptBuilder, OpCodes, ScriptBuilderError } from '../../../src';

describe('ScriptBuilder', () => {
  it.each([
    ['push OP_FALSE', [OpCodes.OpFalse], [OpCodes.OpFalse]],
    ['push OP_TRUE', [OpCodes.OpTrue], [OpCodes.OpTrue]],
    ['push OP_0', [OpCodes.Op0], [OpCodes.Op0]],
    ['push OP_1 OP_2', [OpCodes.Op1, OpCodes.Op2], [OpCodes.Op1, OpCodes.Op2]],
    ['push OP_BLAKE2B OP_EQUAL', [OpCodes.OpBlake2b, OpCodes.OpEqual], [OpCodes.OpBlake2b, OpCodes.OpEqual]]
  ])('AddOp_ShouldAddOpCorrectly %s', (_name, opcodes, expected) => {
    const builder1 = new ScriptBuilder();
    opcodes.forEach((opcode) => builder1.addOp(opcode));
    expect(builder1.script).toEqual(new Uint8Array(expected));

    const builder2 = new ScriptBuilder();
    builder2.addOps(opcodes);
    expect(builder2.script).toEqual(new Uint8Array(expected));
  });

  it.each([
    ['push -1', -1, [OpCodes.Op1Negate]],
    ['push small int 0', 0, [OpCodes.Op0]],
    ['push small int 1', 1, [OpCodes.Op1]],
    ['push small int 2', 2, [OpCodes.Op2]],
    ['push small int 3', 3, [OpCodes.Op3]],
    ['push small int 4', 4, [OpCodes.Op4]],
    ['push small int 5', 5, [OpCodes.Op5]],
    ['push small int 6', 6, [OpCodes.Op6]],
    ['push small int 7', 7, [OpCodes.Op7]],
    ['push small int 8', 8, [OpCodes.Op8]],
    ['push small int 9', 9, [OpCodes.Op9]],
    ['push small int 10', 10, [OpCodes.Op10]],
    ['push small int 11', 11, [OpCodes.Op11]],
    ['push small int 12', 12, [OpCodes.Op12]],
    ['push small int 13', 13, [OpCodes.Op13]],
    ['push small int 14', 14, [OpCodes.Op14]],
    ['push small int 15', 15, [OpCodes.Op15]],
    ['push small int 16', 16, [OpCodes.Op16]],
    ['push 17', 17, [OpCodes.OpData1, 0x11]],
    ['push 65', 65, [OpCodes.OpData1, 0x41]],
    ['push 127', 127, [OpCodes.OpData1, 0x7f]],
    ['push 128', 128, [OpCodes.OpData2, 0x80, 0]],
    ['push 255', 255, [OpCodes.OpData2, 0xff, 0]],
    ['push 256', 256, [OpCodes.OpData2, 0, 0x01]],
    ['push 32767', 32767, [OpCodes.OpData2, 0xff, 0x7f]],
    ['push 32768', 32768, [OpCodes.OpData3, 0, 0x80, 0]],
    ['push -2', -2, [OpCodes.OpData1, 0x82]],
    ['push -3', -3, [OpCodes.OpData1, 0x83]],
    ['push -4', -4, [OpCodes.OpData1, 0x84]],
    ['push -5', -5, [OpCodes.OpData1, 0x85]],
    ['push -17', -17, [OpCodes.OpData1, 0x91]],
    ['push -65', -65, [OpCodes.OpData1, 0xc1]],
    ['push -127', -127, [OpCodes.OpData1, 0xff]],
    ['push -128', -128, [OpCodes.OpData2, 0x80, 0x80]],
    ['push -255', -255, [OpCodes.OpData2, 0xff, 0x80]],
    ['push -256', -256, [OpCodes.OpData2, 0x00, 0x81]],
    ['push -32767', -32767, [OpCodes.OpData2, 0xff, 0xff]],
    ['push -32768', -32768, [OpCodes.OpData3, 0x00, 0x80, 0x80]],
    [
      'push 9223372036854775807',
      9223372036854775807n,
      [OpCodes.OpData8, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f]
    ]
  ])('AddI64_ShouldAddI64Correctly %s', (_name, val, expected) => {
    const builder = new ScriptBuilder();
    builder.addI64(BigInt(val));
    expect(builder.script).toEqual(new Uint8Array(expected));
  });

  const addDataTestCases = [
    {
      name: 'push empty byte sequence',
      data: new Uint8Array([]),
      expected: [OpCodes.Op0]
    },
    {
      name: 'push 1 byte 0x00',
      data: new Uint8Array([0x00]),
      expected: [OpCodes.Op0]
    },
    {
      name: 'push 1 byte 0x01',
      data: new Uint8Array([0x01]),
      expected: [OpCodes.Op1]
    },
    {
      name: 'push 1 byte 0x02',
      data: new Uint8Array([0x02]),
      expected: [OpCodes.Op2]
    },
    {
      name: 'push 1 byte 0x03',
      data: new Uint8Array([0x03]),
      expected: [OpCodes.Op3]
    },
    {
      name: 'push 1 byte 0x04',
      data: new Uint8Array([0x04]),
      expected: [OpCodes.Op4]
    },
    {
      name: 'push 1 byte 0x05',
      data: new Uint8Array([0x05]),
      expected: [OpCodes.Op5]
    },
    {
      name: 'push 1 byte 0x06',
      data: new Uint8Array([0x06]),
      expected: [OpCodes.Op6]
    },
    {
      name: 'push 1 byte 0x07',
      data: new Uint8Array([0x07]),
      expected: [OpCodes.Op7]
    },
    {
      name: 'push 1 byte 0x08',
      data: new Uint8Array([0x08]),
      expected: [OpCodes.Op8]
    },
    {
      name: 'push 1 byte 0x09',
      data: new Uint8Array([0x09]),
      expected: [OpCodes.Op9]
    },
    {
      name: 'push 1 byte 0x0a',
      data: new Uint8Array([0x0a]),
      expected: [OpCodes.Op10]
    },
    {
      name: 'push 1 byte 0x0b',
      data: new Uint8Array([0x0b]),
      expected: [OpCodes.Op11]
    },
    {
      name: 'push 1 byte 0x0c',
      data: new Uint8Array([0x0c]),
      expected: [OpCodes.Op12]
    },
    {
      name: 'push 1 byte 0x0d',
      data: new Uint8Array([0x0d]),
      expected: [OpCodes.Op13]
    },
    {
      name: 'push 1 byte 0x0e',
      data: new Uint8Array([0x0e]),
      expected: [OpCodes.Op14]
    },
    {
      name: 'push 1 byte 0x0f',
      data: new Uint8Array([0x0f]),
      expected: [OpCodes.Op15]
    },
    {
      name: 'push 1 byte 0x10',
      data: new Uint8Array([0x10]),
      expected: [OpCodes.Op16]
    },
    {
      name: 'push 1 byte 0x81',
      data: new Uint8Array([0x81]),
      expected: [OpCodes.Op1Negate]
    },
    {
      name: 'push 1 byte 0x11',
      data: new Uint8Array([0x11]),
      expected: [OpCodes.OpData1, 0x11]
    },
    {
      name: 'push 1 byte 0x80',
      data: new Uint8Array([0x80]),
      expected: [OpCodes.OpData1, 0x80]
    },
    {
      name: 'push 1 byte 0x82',
      data: new Uint8Array([0x82]),
      expected: [OpCodes.OpData1, 0x82]
    },
    {
      name: 'push 1 byte 0xff',
      data: new Uint8Array([0xff]),
      expected: [OpCodes.OpData1, 0xff]
    },
    {
      name: 'push data len 17',
      data: new Uint8Array(17).fill(0x49),
      expected: [OpCodes.OpData17, ...new Uint8Array(17).fill(0x49)]
    },
    {
      name: 'push data len 75',
      data: new Uint8Array(75).fill(0x49),
      expected: [OpCodes.OpData75, ...new Uint8Array(75).fill(0x49)]
    },
    {
      name: 'push data len 76',
      data: new Uint8Array(76).fill(0x49),
      expected: [OpCodes.OpPushData1, 76, ...new Uint8Array(76).fill(0x49)]
    },
    {
      name: 'push data len 255',
      data: new Uint8Array(255).fill(0x49),
      expected: [OpCodes.OpPushData1, 255, ...new Uint8Array(255).fill(0x49)]
    },
    {
      name: 'push data len 256',
      data: new Uint8Array(256).fill(0x49),
      expected: [OpCodes.OpPushData2, 0, 1, ...new Uint8Array(256).fill(0x49)]
    },
    {
      name: 'push data len 520',
      data: new Uint8Array(520).fill(0x49),
      expected: [OpCodes.OpPushData2, 8, 2, ...new Uint8Array(520).fill(0x49)]
    },
    {
      name: 'push data len 521',
      data: new Uint8Array(521).fill(0x49),
      expected: [OpCodes.OpPushData2, 9, 2, ...new Uint8Array(521).fill(0x49)],
      unchecked: true
    },
    {
      name: 'push data len 32767 (canonical)',
      data: new Uint8Array(32767).fill(0x49),
      expected: [OpCodes.OpPushData2, 255, 127, ...new Uint8Array(32767).fill(0x49)],
      unchecked: true
    },
    {
      name: 'push data len 65536 (canonical)',
      data: new Uint8Array(65536).fill(0x49),
      expected: [OpCodes.OpPushData4, 0, 0, 1, 0, ...new Uint8Array(65536).fill(0x49)],
      unchecked: true
    },
    {
      name: 'push data len 32767 (non-canonical)',
      data: new Uint8Array(32767).fill(0x49),
      expected: [OpCodes.OpPushData2, 255, 127, ...new Uint8Array(32767).fill(0x49)],
      unchecked: true
    },
    {
      name: 'push data len 65536 (non-canonical)',
      data: new Uint8Array(65536).fill(0x49),
      expected: [OpCodes.OpPushData4, 0, 0, 1, 0, ...new Uint8Array(65536).fill(0x49)],
      unchecked: true
    }
  ];

  addDataTestCases.forEach(({ name, data, expected, unchecked }) => {
    it(`AddData_ShouldAddDataCorrectly ${name}`, () => {
      const builder = new ScriptBuilder();
      if (unchecked) {
        builder.addDataUnchecked(data);
      } else {
        builder.addData(data);
      }
      expect(builder.script).toEqual(new Uint8Array(expected));
    });
  });

  it.each([
    ['0x00', 0x00n, [OpCodes.Op0]],
    ['0x01', 0x01n, [OpCodes.Op1]],
    ['0xff', 0xffn, [OpCodes.OpData1, 0xff]],
    ['0xffee', 0xffeen, [OpCodes.OpData2, 0xee, 0xff]],
    ['0xffeedd', 0xffeeddn, [OpCodes.OpData3, 0xdd, 0xee, 0xff]],
    ['0xffeeddcc', 0xffeeddccn, [OpCodes.OpData4, 0xcc, 0xdd, 0xee, 0xff]],
    ['0xffeeddccbb', 0xffeeddccbbn, [OpCodes.OpData5, 0xbb, 0xcc, 0xdd, 0xee, 0xff]],
    ['0xffeeddccbbaa', 0xffeeddccbbaan, [OpCodes.OpData6, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff]],
    ['0xffeeddccbbaa99', 0xffeeddccbbaa99n, [OpCodes.OpData7, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff]],
    ['0xffeeddccbbaa9988', 0xffeeddccbbaa9988n, [OpCodes.OpData8, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff]],
    ['0xffffffffffffffff', 0xffffffffffffffffn, [OpCodes.OpData8, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]]
  ])('AddU64_ShouldAddU64Correctly %s', (_name, value, expected) => {
    expect(new ScriptBuilder().addU64(value).script).toEqual(new Uint8Array(expected));
    expect(new ScriptBuilder().addLockTime(value).script).toEqual(new Uint8Array(expected));
    expect(new ScriptBuilder().addSequence(value).script).toEqual(new Uint8Array(expected));
  });

  it.each([
    [
      'adding data that would exceed the maximum size of the script must fail',
      new Uint8Array([0x00]),
      ScriptBuilderError
    ],
    [
      'adding an opcode that would exceed the maximum size of the script must fail',
      new Uint8Array([OpCodes.Op0]),
      ScriptBuilderError
    ],
    [
      'adding an opcode array that would exceed the maximum size of the script must fail',
      new Uint8Array([OpCodes.OpCheckSig]),
      ScriptBuilderError
    ],
    [
      'adding an integer that would exceed the maximum size of the script must fail',
      new Uint8Array([0x00]),
      ScriptBuilderError
    ],
    [
      'adding a lock time that would exceed the maximum size of the script must fail',
      new Uint8Array([0x00]),
      ScriptBuilderError
    ],
    [
      'adding a sequence that would exceed the maximum size of the script must fail',
      new Uint8Array([0x00]),
      ScriptBuilderError
    ]
  ])('ExceedMaxScriptSize_ShouldThrowException %s', (_name, data, expectedException) => {
    const builder = new ScriptBuilder();
    builder.addDataUnchecked(new Uint8Array(C.MAX_SCRIPTS_SIZE - 3));
    expect(() => builder.addData(data)).toThrow(expectedException);
  });
});

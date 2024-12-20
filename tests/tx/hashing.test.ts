import { describe, it, expect } from 'vitest';
import {
  Transaction,
  TransactionInput,
  TransactionOutput,
  TransactionOutpoint,
  SubnetworkId,
  ScriptPublicKey,
  Hash,
  SUBNETWORK_ID_COINBASE,
  SUBNETWORK_ID_REGISTRY,
  TransactionHashing
} from '../../src';

describe('Transaction Hashing', () => {
  interface Test {
    name: string;
    tx: Transaction;
    expectedId: string;
    expectedHash: string;
  }

  let testCases: Test[] = [];
  const emptyUint8Array = new Uint8Array([]);
  const uint8Array1_5 = new Uint8Array([1, 2, 3, 4, 5]);

  testCases.push({
    name: 'Test #1',
    tx: new Transaction(0, [], [], 0n, SubnetworkId.fromByte(0), 0n, emptyUint8Array),
    expectedId: '2c18d5e59ca8fc4c23d9560da3bf738a8f40935c11c162017fbf2c907b7e665c',
    expectedHash: 'c9e29784564c269ce2faaffd3487cb4684383018ace11133de082dce4bb88b0b'
  });

  const input1 = new TransactionInput(new TransactionOutpoint(Hash.fromU64Word(0n), 2), new Uint8Array([1, 2]), 7n, 5);

  testCases.push({
    name: 'Test #2',
    tx: new Transaction(1, [input1], [], 0n, SubnetworkId.fromByte(0), 0n, emptyUint8Array),
    expectedId: 'dafa415216d26130a899422203559c809d3efe72e20d48505fb2f08787bc4f49',
    expectedHash: 'e4045023768d98839c976918f80c9419c6a93003724eda97f7c61a5b68de851b'
  });

  const output1 = new TransactionOutput(1564n, new ScriptPublicKey(7, uint8Array1_5));

  testCases.push({
    name: 'Test #3',
    tx: new Transaction(1, [input1], [output1], 0n, SubnetworkId.fromByte(0), 0n, emptyUint8Array),
    expectedId: 'd1cd9dc1f26955832ccd12c27afaef4b71443aa7e7487804baf340952ca927e5',
    expectedHash: 'e5523c70f6b986cad9f6959e63f080e6ac5f93bc2a9e0e01a89ca9bf6908f51c'
  });

  testCases.push({
    name: 'Test #4',

    tx: new Transaction(2, [input1], [output1], 54n, SubnetworkId.fromByte(0), 3n, emptyUint8Array),
    expectedId: '59b3d6dc6cdc660c389c3fdb5704c48c598d279cdf1bab54182db586a4c95dd5',
    expectedHash: 'b70f2f14c2f161a29b77b9a78997887a8e727bb57effca38cd246cb270b19cd5'
  });

  const input2 = new TransactionInput(
    new TransactionOutpoint(Hash.fromString('59b3d6dc6cdc660c389c3fdb5704c48c598d279cdf1bab54182db586a4c95dd5'), 2),
    new Uint8Array([1, 2]),
    7n,
    5
  );

  testCases.push({
    name: 'Test #5',
    tx: new Transaction(2, [input2], [output1], 54n, SubnetworkId.fromByte(0), 3n, emptyUint8Array),
    expectedId: '9d106623860567915b19cea33af486286a31b4bfc68627c6d4d377287afb40ad',
    expectedHash: 'cd575e69fbf5f97fbfd4afb414feb56f8463b3948d6ac30f0ecdd9622672fab9'
  });

  testCases.push({
    name: 'Test #6',
    tx: new Transaction(2, [input2], [output1], 54n, SUBNETWORK_ID_COINBASE, 3n, emptyUint8Array),
    expectedId: '3fad809b11bd5a4af027aa4ac3fbde97e40624fd40965ba3ee1ee1b57521ad10',
    expectedHash: 'b4eb5f0cab5060bf336af5dcfdeb2198cc088b693b35c87309bd3dda04f1cfb9'
  });

  testCases.push({
    name: 'Test #7',
    tx: new Transaction(2, [input2], [output1], 54n, SUBNETWORK_ID_REGISTRY, 3n, emptyUint8Array),
    expectedId: 'c542a204ab9416df910b01540b0c51b85e6d4e1724e081e224ea199a9e54e1b3',
    expectedHash: '31da267d5c34f0740c77b8c9ebde0845a01179ec68074578227b804bac306361'
  });

  testCases.push({
    name: 'Test #8',
    tx: new Transaction(2, [input2], [output1], 54n, SUBNETWORK_ID_REGISTRY, 3n, new Uint8Array([1, 2, 3])),
    expectedId: '1f18b18ab004ff1b44dd915554b486d64d7ebc02c054e867cc44e3d746e80b3b',
    expectedHash: 'a2029ebd66d29d41aa7b0c40230c1bfa7fe8e026fb44b7815dda4e991b9a5fad'
  });

  testCases.forEach(({ name, tx, expectedId, expectedHash }) => {
    it(`Test transaction hashing ${name}`, () => {
      expect(tx.id.equals(Hash.fromString(expectedId))).toBe(true);
      expect(TransactionHashing.hash(tx, false)).deep.equals(Hash.fromString(expectedHash).toBytes());
    });
  });
});

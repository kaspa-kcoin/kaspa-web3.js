import { describe, it, expect, beforeEach } from 'vitest';
import {
  Hash,
  PopulatedTransaction,
  ScriptPublicKey,
  SIG_HASH_ALL,
  SIG_HASH_ANY_ONE_CAN_PAY,
  SIG_HASH_NONE,
  SIG_HASH_SINGLE,
  SigHashType,
  SUBNETWORK_ID_NATIVE,
  SubnetworkId,
  Transaction,
  TransactionInput,
  TransactionOutpoint,
  TransactionOutput,
  UtxoEntry
} from '../../src';
import { SignableTransaction } from '../../src/tx/generator/model';
import { TransactionSigningHashing } from '../../src/tx/hashing/tx-sig';

const prevTxId = Hash.fromHex('880eb9819a31821d9d2399e2f35e2433b72637e393d71ecc9b8d0250f49153c3');
const scriptPubKey1 = Buffer.from('208325613d2eeaf7176ac6c670b13c0043156c427438ed72d74b7800862ad884e8ac', 'hex');
const scriptPubKey2 = Buffer.from('20fcef4c106cf11135bbd70f02a726a92162d2fb8b22f0469126f800862ad884e8ac', 'hex');
const SIG_HASH_ALL_ANYONE_CAN_PAY = new SigHashType(SIG_HASH_ALL.value | SIG_HASH_ANY_ONE_CAN_PAY.value);
const SIG_HASH_NONE_ANYONE_CAN_PAY = new SigHashType(SIG_HASH_NONE.value | SIG_HASH_ANY_ONE_CAN_PAY.value);
const SIG_HASH_SINGLE_ANYONE_CAN_PAY = new SigHashType(SIG_HASH_SINGLE.value | SIG_HASH_ANY_ONE_CAN_PAY.value);

describe('TransactionSigningHashing', () => {
  let nativePopulatedTx: SignableTransaction = new SignableTransaction(createNativeTx(), createUtoxs() as any);
  let subnetworkTx = createNativeTx();
  let subnetworkPopulatedTx: SignableTransaction = new SignableTransaction(subnetworkTx, createUtoxs() as any);
  let tests = createTestCases(nativePopulatedTx, subnetworkPopulatedTx);

  beforeEach(() => {
    // reset the txs
    nativePopulatedTx = new SignableTransaction(createNativeTx(), createUtoxs() as any);
    subnetworkTx.subnetworkId = new SubnetworkId(
      Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    );
    subnetworkTx.gas = 250n;
    subnetworkTx.payload = Buffer.from([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    subnetworkPopulatedTx = new SignableTransaction(subnetworkTx, createUtoxs() as any);
    tests = createTestCases(nativePopulatedTx, subnetworkPopulatedTx);
  });

  let caseIndex = 0;
  it.each(tests.map((test) => test.name))('test_signature_hash %s', (_name) => {
    const test = tests[caseIndex++];
    const { tx, entries } = { ...test.populatedTx };
    const index = test.action.data;

    switch (test.action.type) {
      case 'NoAction':
        break;
      case 'Output':
        tx.outputs[index!].value = 100n;
        break;
      case 'Input':
        tx.inputs[index!].previousOutpoint.index = 2;
        break;
      case 'AmountSpent':
        entries[index!].amount = 666n;
        break;
      case 'PrevScriptPublicKey':
        let newScript = Uint8Array.from([...entries[index!].scriptPublicKey.script, ...[1, 2, 3]]);
        entries[index!].scriptPublicKey = new ScriptPublicKey(entries[index!].scriptPublicKey.version, newScript);
        break;
      case 'Sequence':
        tx.inputs[index!].sequence = 12345n;
        break;
      case 'Payload':
        tx.payload = Buffer.from([6, 6, 6, 4, 2, 0, 1, 3, 3, 7]);
        break;
      case 'Gas':
        tx.gas = 1234n;
        break;
      case 'SubnetworkId':
        tx.subnetworkId = new SubnetworkId(Buffer.from([6, 6, 6, 4, 2, 0, 1, 3, 3, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
        break;
    }

    const populatedTx = new PopulatedTransaction(tx, entries);
    expect(
      TransactionSigningHashing.calcSchnorrSignatureHash(populatedTx, test.inputIndex, test.hashType).toString()
    ).toBe(test.expectedHash);
  });
});

function createNativeTx() {
  return new Transaction(
    0,
    [
      new TransactionInput(new TransactionOutpoint(prevTxId, 0), Buffer.alloc(0), 0n, 0),
      new TransactionInput(new TransactionOutpoint(prevTxId, 1), Buffer.alloc(0), 1n, 0),
      new TransactionInput(new TransactionOutpoint(prevTxId, 2), Buffer.alloc(0), 2n, 0)
    ],
    [
      new TransactionOutput(300n, new ScriptPublicKey(0, scriptPubKey2)),
      new TransactionOutput(300n, new ScriptPublicKey(0, scriptPubKey1))
    ],
    1615462089000n,
    SUBNETWORK_ID_NATIVE,
    0n,
    Buffer.alloc(0)
  );
}

function createUtoxs() {
  return [
    new UtxoEntry(100n, new ScriptPublicKey(0, scriptPubKey1), 0n, false),
    new UtxoEntry(200n, new ScriptPublicKey(0, scriptPubKey2), 0n, false),
    new UtxoEntry(300n, new ScriptPublicKey(0, scriptPubKey2), 0n, false)
  ];
}

function createTestCases(nativePopulatedTx: SignableTransaction, subnetworkPopulatedTx: SignableTransaction) {
  return [
    {
      name: 'native-all-0',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_ALL,
      inputIndex: 0,
      action: ModifyAction.NoAction,
      expectedHash: '03b7ac6927b2b67100734c3cc313ff8c2e8b3ce3e746d46dd660b706a916b1f5'
    },
    {
      name: 'native-all-0-modify-input-1',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_ALL,
      inputIndex: 0,
      action: ModifyAction.Input(1),
      expectedHash: 'a9f563d86c0ef19ec2e4f483901d202e90150580b6123c3d492e26e7965f488c'
    },
    {
      name: 'native-all-0-modify-output-1',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_ALL,
      inputIndex: 0,
      action: ModifyAction.Output(1),
      expectedHash: 'aad2b61bd2405dfcf7294fc2be85f325694f02dda22d0af30381cb50d8295e0a'
    },
    {
      name: 'native-all-0-modify-sequence-1',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_ALL,
      inputIndex: 0,
      action: ModifyAction.Sequence(1),
      expectedHash: '0818bd0a3703638d4f01014c92cf866a8903cab36df2fa2506dc0d06b94295e8'
    },
    {
      name: 'native-all-anyonecanpay-0',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_ALL_ANYONE_CAN_PAY,
      inputIndex: 0,
      action: ModifyAction.NoAction,
      expectedHash: '24821e466e53ff8e5fa93257cb17bb06131a48be4ef282e87f59d2bdc9afebc2'
    },
    {
      name: 'native-all-anyonecanpay-0-modify-input-0',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_ALL_ANYONE_CAN_PAY,
      inputIndex: 0,
      action: ModifyAction.Input(0),
      expectedHash: 'd09cb639f335ee69ac71f2ad43fd9e59052d38a7d0638de4cf989346588a7c38'
    },
    {
      name: 'native-all-anyonecanpay-0-modify-input-1',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_ALL_ANYONE_CAN_PAY,
      inputIndex: 0,
      action: ModifyAction.Input(1),
      expectedHash: '24821e466e53ff8e5fa93257cb17bb06131a48be4ef282e87f59d2bdc9afebc2'
    },
    {
      name: 'native-all-anyonecanpay-0-modify-sequence',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_ALL_ANYONE_CAN_PAY,
      inputIndex: 0,
      action: ModifyAction.Sequence(1),
      expectedHash: '24821e466e53ff8e5fa93257cb17bb06131a48be4ef282e87f59d2bdc9afebc2'
    },
    {
      name: 'native-none-0',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_NONE,
      inputIndex: 0,
      action: ModifyAction.NoAction,
      expectedHash: '38ce4bc93cf9116d2e377b33ff8449c665b7b5e2f2e65303c543b9afdaa4bbba'
    },
    {
      name: 'native-none-0-modify-output-1',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_NONE,
      inputIndex: 0,
      action: ModifyAction.Output(1),
      expectedHash: '38ce4bc93cf9116d2e377b33ff8449c665b7b5e2f2e65303c543b9afdaa4bbba'
    },
    {
      name: 'native-none-0-modify-sequence-0',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_NONE,
      inputIndex: 0,
      action: ModifyAction.Sequence(0),
      expectedHash: 'd9efdd5edaa0d3fd0133ee3ab731d8c20e0a1b9f3c0581601ae2075db1109268'
    },
    {
      name: 'native-none-0-modify-sequence-1',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_NONE,
      inputIndex: 0,
      action: ModifyAction.Sequence(1),
      expectedHash: '38ce4bc93cf9116d2e377b33ff8449c665b7b5e2f2e65303c543b9afdaa4bbba'
    },
    {
      name: 'native-none-anyonecanpay-0',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_NONE_ANYONE_CAN_PAY,
      inputIndex: 0,
      action: ModifyAction.NoAction,
      expectedHash: '06aa9f4239491e07bb2b6bda6b0657b921aeae51e193d2c5bf9e81439cfeafa0'
    },
    {
      name: 'native-none-anyonecanpay-0-modify-amount-spent',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_NONE_ANYONE_CAN_PAY,
      inputIndex: 0,
      action: ModifyAction.AmountSpent(0),
      expectedHash: 'f07f45f3634d3ea8c0f2cb676f56e20993edf9be07a83bf0dfdb3debcf1441bf'
    },
    {
      name: 'native-none-anyonecanpay-0-modify-script-public-key',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_NONE_ANYONE_CAN_PAY,
      inputIndex: 0,
      action: ModifyAction.PrevScriptPublicKey(0),
      expectedHash: '20a525c54dc33b2a61201f05233c086dbe8e06e9515775181ed96550b4f2d714'
    },
    {
      name: 'native-single-0',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_SINGLE,
      inputIndex: 0,
      action: ModifyAction.NoAction,
      expectedHash: '44a0b407ff7b239d447743dd503f7ad23db5b2ee4d25279bd3dffaf6b474e005'
    },
    {
      name: 'native-single-0-modify-output-1',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_SINGLE,
      inputIndex: 0,
      action: ModifyAction.Output(1),
      expectedHash: '44a0b407ff7b239d447743dd503f7ad23db5b2ee4d25279bd3dffaf6b474e005'
    },
    {
      name: 'native-single-0-modify-sequence-0',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_SINGLE,
      inputIndex: 0,
      action: ModifyAction.Sequence(0),
      expectedHash: '83796d22879718eee1165d4aace667bb6778075dab579c32c57be945f466a451'
    },
    {
      name: 'native-single-0-modify-sequence-1',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_SINGLE,
      inputIndex: 0,
      action: ModifyAction.Sequence(1),
      expectedHash: '44a0b407ff7b239d447743dd503f7ad23db5b2ee4d25279bd3dffaf6b474e005'
    },
    {
      name: 'native-single-2-no-corresponding-output',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_SINGLE,
      inputIndex: 2,
      action: ModifyAction.NoAction,
      expectedHash: '022ad967192f39d8d5895d243e025ec14cc7a79708c5e364894d4eff3cecb1b0'
    },
    {
      name: 'native-single-2-no-corresponding-output-modify-output-1',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_SINGLE,
      inputIndex: 2,
      action: ModifyAction.Output(1),
      expectedHash: '022ad967192f39d8d5895d243e025ec14cc7a79708c5e364894d4eff3cecb1b0'
    },
    {
      name: 'native-single-anyonecanpay-0',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_SINGLE_ANYONE_CAN_PAY,
      inputIndex: 0,
      action: ModifyAction.NoAction,
      expectedHash: '43b20aba775050cf9ba8d5e48fc7ed2dc6c071d23f30382aea58b7c59cfb8ed7'
    },
    {
      name: 'native-single-anyonecanpay-2-no-corresponding-output',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_SINGLE_ANYONE_CAN_PAY,
      inputIndex: 2,
      action: ModifyAction.NoAction,
      expectedHash: '846689131fb08b77f83af1d3901076732ef09d3f8fdff945be89aa4300562e5f'
    },
    {
      name: 'native-all-0-modify-payload',
      populatedTx: nativePopulatedTx,
      hashType: SIG_HASH_ALL,
      inputIndex: 0,
      action: ModifyAction.Payload,
      expectedHash: '72ea6c2871e0f44499f1c2b556f265d9424bfea67cca9cb343b4b040ead65525'
    },
    {
      name: 'subnetwork-all-0',
      populatedTx: subnetworkPopulatedTx,
      hashType: SIG_HASH_ALL,
      inputIndex: 0,
      action: ModifyAction.NoAction,
      expectedHash: 'b2f421c933eb7e1a91f1d9e1efa3f120fe419326c0dbac487752189522550e0c'
    },
    {
      name: 'subnetwork-all-modify-payload',
      populatedTx: subnetworkPopulatedTx,
      hashType: SIG_HASH_ALL,
      inputIndex: 0,
      action: ModifyAction.Payload,
      expectedHash: '12ab63b9aea3d58db339245a9b6e9cb6075b2253615ce0fb18104d28de4435a1'
    },
    {
      name: 'subnetwork-all-modify-gas',
      populatedTx: subnetworkPopulatedTx,
      hashType: SIG_HASH_ALL,
      inputIndex: 0,
      action: ModifyAction.Gas,
      expectedHash: '2501edfc0068d591160c4bd98646c6e6892cdc051182a8be3ccd6d67f104fd17'
    },
    {
      name: 'subnetwork-all-subnetwork-id',
      populatedTx: subnetworkPopulatedTx,
      hashType: SIG_HASH_ALL,
      inputIndex: 0,
      action: ModifyAction.SubnetworkId,
      expectedHash: 'a5d1230ede0dfcfd522e04123a7bcd721462fed1d3a87352031a4f6e3c4389b6'
    }
  ];
}

class ModifyAction {
  static NoAction = new ModifyAction('NoAction');
  static Output = (size: number) => new ModifyAction('Output', size);
  static Input = (size: number) => new ModifyAction('Input', size);
  static AmountSpent = (size: number) => new ModifyAction('AmountSpent', size);
  static PrevScriptPublicKey = (size: number) => new ModifyAction('PrevScriptPublicKey', size);
  static Sequence = (size: number) => new ModifyAction('Sequence', size);
  static Payload = new ModifyAction('Payload');
  static Gas = new ModifyAction('Gas');
  static SubnetworkId = new ModifyAction('SubnetworkId');

  private constructor(
    public type: string,
    public data?: number
  ) {}
}

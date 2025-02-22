import { describe, it, expect } from 'vitest';
import { extractScriptPubKeyAddress, payToAddressScript, payToScriptHashScript } from '../../../src/tx/script/standard';
import { multisigRedeemScriptEcdsa, multisigRedeemScript } from '../../../src/tx/script/standard/multisig';
import {
  ScriptPublicKey,
  Address,
  AddressPrefix,
  AddressVersion,
  Keypair,
  Hash,
  Transaction,
  TransactionInput,
  TransactionOutpoint,
  SUBNETWORK_ID_NATIVE,
  UtxoEntry,
  SigCacheKey,
  SIG_HASH_ALL,
  PopulatedTransaction
} from '../../../src';
import { Buffer } from 'buffer';
import { TransactionSigningHashing } from '../../../src/tx/hashing/tx-sig';
import {
  TxScriptEngine,
  ScriptClass,
  OpCodes,
  ScriptBuilder,
  ScriptClassHelper,
  TxScriptError
} from '../../../src/tx/script';

interface Test {
  name: string;
  scriptPubKey: ScriptPublicKey;
  prefix: AddressPrefix;
  expectedAddress: Address | TxScriptError;
}

describe('extractScriptPubKeyAddress and payToAddressScript', () => {
  const testCases: Test[] = [
    {
      name: 'Mainnet PubKey script and address',
      scriptPubKey: new ScriptPublicKey(
        AddressVersion.PubKey,
        Buffer.from('207bc04196f1125e4f2676cd09ed14afb77223b1f62177da5488346323eaa91a69ac', 'hex')
      ),
      prefix: AddressPrefix.Mainnet,
      expectedAddress: Address.fromString('kaspa:qpauqsvk7yf9unexwmxsnmg547mhyga37csh0kj53q6xxgl24ydxjsgzthw5j')
    },
    {
      name: 'Testnet PubKeyECDSA script and address',
      scriptPubKey: new ScriptPublicKey(
        ScriptClassHelper.versionOf(ScriptClass.PubKeyECDSA),
        Buffer.from('21ba01fc5f4e9d9879599c69a3dafdb835a7255e5f2e934e9322ecd3af190ab0f60eab', 'hex')
      ),
      prefix: AddressPrefix.Testnet,
      expectedAddress: Address.fromString('kaspatest:qxaqrlzlf6wes72en3568khahq66wf27tuhfxn5nytkd8tcep2c0vrse6gdmpks')
    }
  ];

  testCases.forEach((test) => {
    it(`extract address test: ${test.name}`, () => {
      const extracted = extractScriptPubKeyAddress(test.scriptPubKey, test.prefix);
      expect(extracted.toString()).toBe((test.expectedAddress as Address).toString());
      const encoded = payToAddressScript(extracted);

      expect(encoded.version).toEqual(test.scriptPubKey.version);
      expect(encoded.script).deep.eq(test.scriptPubKey.script);
    });
  });
  const throwCases: Test[] = [
    {
      name: 'Testnet non standard script',
      scriptPubKey: new ScriptPublicKey(
        AddressVersion.PubKey,
        Buffer.from('2001fc5f4e9d9879599c69a3dafdb835a7255e5f2e934e9322ecd3af190ab0f60eab', 'hex')
      ),
      prefix: AddressPrefix.Testnet,
      expectedAddress: new TxScriptError('PubKeyFormat')
    },
    {
      name: 'Mainnet script with unknown version',
      scriptPubKey: new ScriptPublicKey(
        AddressVersion.PubKey + 1,
        Buffer.from('207bc04196f1125e4f2676cd09ed14afb77223b1f62177da5488346323eaa91a69ac', 'hex')
      ),
      prefix: AddressPrefix.Mainnet,
      expectedAddress: new TxScriptError('PubKeyFormat')
    }
  ];

  throwCases.forEach((test) => {
    it(`extract address test: ${test.name}`, () => {
      expect(() => extractScriptPubKeyAddress(test.scriptPubKey, test.prefix)).toThrowError(
        test.expectedAddress as Error
      );
    });
  });
});

describe('Multisig Tests', () => {
  interface Input {
    kp: Keypair;
    required: boolean;
    sign: boolean;
  }

  function kp(): [Keypair, Keypair, Keypair] {
    const kp1 = Keypair.fromPrivateKeyHex('1d99c236b1f37b3b845336e6c568ba37e9ced4769d83b7a096eec446b940d160');
    const kp2 = Keypair.fromPrivateKeyHex('349ca0c824948fed8c2c568ce205e9d9be4468ef099cad76e3e5ec918954aca4');
    const kp3 = Keypair.random();
    return [kp1, kp2, kp3];
  }

  function checkMultisigScenario(inputs: Input[], required: number, isOk: boolean, isEcdsa: boolean) {
    // Create tx with 1 input
    const prevTxId = Hash.fromString('63020db736215f8b1105a9281f7bcbb6473d965ecc45bb2fb5da59bd35e6ff84');
    const filtered = inputs.filter((input) => input.required);

    // Generate script
    const script = isEcdsa
      ? multisigRedeemScriptEcdsa(
          [...filtered].map((input) => Buffer.from(input.kp.publicKey!, 'hex')),
          required
        )
      : multisigRedeemScript(
          [...filtered].map((input) => Buffer.from(input.kp.xOnlyPublicKey!, 'hex')),
          required
        );

    const tx = new Transaction(
      0,
      [new TransactionInput(new TransactionOutpoint(prevTxId, 0), new Uint8Array(), 0n, 4)],
      [],
      0n,
      SUBNETWORK_ID_NATIVE,
      0n,
      new Uint8Array()
    );

    const entries = [new UtxoEntry(12793000000000n, payToScriptHashScript(script), 36151168n, false)];

    // Sign transaction
    const sigCache = new Map<SigCacheKey, boolean>();
    const verifiableTx = new PopulatedTransaction(tx, [...entries]);
    const sigHash = (
      isEcdsa
        ? TransactionSigningHashing.calcEcdsaSignatureHash(verifiableTx, 0, SIG_HASH_ALL)
        : TransactionSigningHashing.calcSchnorrSignatureHash(verifiableTx, 0, SIG_HASH_ALL)
    ).toBytes();

    const signatures = inputs
      .filter((input) => input.sign)
      .flatMap((input) => {
        const sig = isEcdsa ? input.kp.signEcdsa(sigHash) : input.kp.sign(sigHash);
        return [OpCodes.OpData65, ...sig, SIG_HASH_ALL.value];
      });

    verifiableTx.tx().inputs[0].signatureScript = new Uint8Array([
      ...signatures,
      ...new ScriptBuilder().addData(script).script
    ]);

    const vm = TxScriptEngine.fromTransactionInput(verifiableTx, tx.inputs[0], 0, entries[0], sigCache, true);

    if (isOk) {
      expect(() => vm.execute()).not.toThrow();
    } else {
      expect(() => vm.execute()).toThrow();
    }
  }

  it('test_too_many_required_sigs', () => {
    expect(() => multisigRedeemScript([new Uint8Array(32)], 2)).toThrow('Too many required signatures');
    expect(() => multisigRedeemScriptEcdsa([new Uint8Array(33)], 2)).toThrow('Too many required signatures');
  });

  it('test_empty_keys', () => {
    expect(() => multisigRedeemScript([], 0)).toThrow('Empty keys');
  });

  it('test_multisig_1_2', () => {
    const [kp1, kp2] = kp();

    // Schnorr
    checkMultisigScenario(
      [
        { kp: kp1, required: true, sign: false },
        { kp: kp2, required: true, sign: true }
      ],
      1,
      true,
      false
    );

    checkMultisigScenario(
      [
        { kp: kp1, required: true, sign: true },
        { kp: kp2, required: true, sign: false }
      ],
      1,
      true,
      false
    );

    // ECDSA
    checkMultisigScenario(
      [
        { kp: kp1, required: true, sign: false },
        { kp: kp2, required: true, sign: true }
      ],
      1,
      true,
      true
    );

    checkMultisigScenario(
      [
        { kp: kp1, required: true, sign: true },
        { kp: kp2, required: true, sign: false }
      ],
      1,
      true,
      true
    );
  });

  // Additional test cases follow same pattern...
});

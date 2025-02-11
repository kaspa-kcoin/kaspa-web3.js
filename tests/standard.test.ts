import { describe, it, expect } from 'vitest';
import { extractScriptPubKeyAddress, payToAddressScript } from '../src/tx/script/standard';
import {
  ScriptPublicKey,
  Address,
  AddressPrefix,
  AddressVersion,
  TxScriptError,
  ScriptClassHelper,
  ScriptClass
} from '../src';
import { Buffer } from 'buffer';

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

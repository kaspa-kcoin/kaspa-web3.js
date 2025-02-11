import { describe, expect, it } from 'vitest';
import { Constants, ScriptClass, ScriptClassHelper, ScriptPublicKey } from '../../../src';

describe('ScriptClassTests', () => {
  const testCases = [
    {
      name: 'valid pubkey script',
      scriptHex: '204a23f5eef4b2dead811c7efb4f1afbd8df845e804b6c36a4001fc096e13f8151ac',
      version: Constants.MAX_SCRIPT_PUBLIC_KEY_VERSION,
      expectedClass: ScriptClass.PubKey
    },
    {
      name: 'valid pubkey ecdsa script',
      scriptHex: '21fd4a23f5eef4b2dead811c7efb4f1afbd8df845e804b6c36a4001fc096e13f8151ab',
      version: Constants.MAX_SCRIPT_PUBLIC_KEY_VERSION,
      expectedClass: ScriptClass.PubKeyECDSA
    },
    {
      name: 'valid scripthash script',
      scriptHex: 'aa204a23f5eef4b2dead811c7efb4f1afbd8df845e804b6c36a4001fc096e13f815187',
      version: Constants.MAX_SCRIPT_PUBLIC_KEY_VERSION,
      expectedClass: ScriptClass.ScriptHash
    },
    {
      name: 'non standard script (unexpected version)',
      scriptHex: '204a23f5eef4b2dead811c7efb4f1afbd8df845e804b6c36a4001fc096e13f8151ac',
      version: Constants.MAX_SCRIPT_PUBLIC_KEY_VERSION + 1,
      expectedClass: ScriptClass.NonStandard
    },
    {
      name: 'non standard script (unexpected key len)',
      scriptHex: '1f4a23f5eef4b2dead811c7efb4f1afbd8df845e804b6c36a4001fc096e13f81ac',
      version: Constants.MAX_SCRIPT_PUBLIC_KEY_VERSION,
      expectedClass: ScriptClass.NonStandard
    },
    {
      name: 'non standard script (unexpected final check sig op)',
      scriptHex: '204a23f5eef4b2dead811c7efb4f1afbd8df845e804b6c36a4001fc096e13f8151ad',
      version: Constants.MAX_SCRIPT_PUBLIC_KEY_VERSION,
      expectedClass: ScriptClass.NonStandard
    }
  ];

  testCases.forEach(({ name, scriptHex, version, expectedClass }) => {
    it(`fromScriptPublicKey ${name}`, () => {
      const script = Buffer.from(scriptHex, 'hex');
      const scriptPublicKey = new ScriptPublicKey(version, script);
      const scriptClass = ScriptClassHelper.fromScriptPublicKey(scriptPublicKey);
      expect(scriptClass).toBe(expectedClass);
    });
  });
});

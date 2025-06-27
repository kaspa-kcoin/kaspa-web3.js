import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Keypair, PSKT, TransactionOutpoint, UtxoEntry, Hash } from '../../src';
import { multisigRedeemScript, payToScriptHashScript } from '../../src/tx/script/standard';
import { InputBuilder } from '../../src/pskt/input';
import { maxValueOfU } from '../../src/utils';

describe('PSKT', () => {
  function loadJson(name: string) {
    return readFileSync(join(__dirname, `data/pskt/${name}.json`), 'utf8');
  }

  it('should handle complete multisig PSKT workflow', () => {
    // Create keypairs
    const kp1 = Keypair.fromPrivateKeyHex('0f84b953df0f20d979c8cbd9a1ec65e73978a6a06cbfa00e3f9a86f8db8fda0d');
    const kp2 = Keypair.fromPrivateKeyHex('3b6d3c2a052d584e9615f219f24abea77ef3a9d1198f45bc5c47fd5ffd98ef49');
    const kps = [kp1, kp2];
    // Generate multisig redeem script
    const redeemScript = multisigRedeemScript(
      kps.map((kp) => Buffer.from(kp.xOnlyPublicKey!, 'hex')),
      2
    );

    // Creation phase
    const pskt = new PSKT().toCreator().inputsModifiable().outputsModifiable();
    const fromJson = PSKT.fromJSON(loadJson('created'));
    const psktCreatorJson = pskt.toJSON();
    expect(pskt.state!.equals(fromJson.state!)).to.toBeTruthy();

    // Add input
    const input = new InputBuilder()
      .setUtxoEntry(new UtxoEntry(12793000000000n, payToScriptHashScript(redeemScript), 36151168n, false))
      .setPreviousOutpoint(
        new TransactionOutpoint(Hash.fromString('63020db736215f8b1105a9281f7bcbb6473d965ecc45bb2fb5da59bd35e6ff84'), 0)
      )
      .setSigOpCount(2)
      .setRedeemScript(redeemScript)
      .build();

    const psktWithInput = pskt.toConstructor().addInput(input);
    const psktWithInputFromJson = PSKT.fromJSON(loadJson('first-input'));

    expect(psktWithInput.state!.equals(psktWithInputFromJson.state!)).to.toBeTruthy();

    // Combine phase
    const combinerPskt = PSKT.fromJSON(psktCreatorJson);
    const combined = psktWithInput.toCombiner().combine(combinerPskt);
    const combinedJson = combined.toJSON();
    expect(combined.state!.equals(PSKT.fromJSON(loadJson('combined')).state!)).to.toBeTruthy();

    // Update phase
    const updated = PSKT.fromJSON(combinedJson).toUpdater().setSequence(maxValueOfU(64), 0);
    expect(updated.state!.equals(PSKT.fromJSON(loadJson('updated')).state!)).to.toBeTruthy();

    // // Sign phase
    // const reusedValues = new SigHashReusedValues();
    // const sign = (pskt: PSKT, kp: Secp256k1.KeyPair) => {
    //   return pskt.sign((tx, sighash) => {
    //     return tx.inputs.map((_, idx) => {
    //       const hash = calcSchnorrSignatureHash(tx, idx, sighash[idx], reusedValues);
    //       return {
    //         signature: kp.signSchnorr(hash),
    //         publicKey: kp.publicKey
    //       };
    //     });
    //   });
    // };

    // const signed1 = sign(updated, kps[0]);
    // const signed2 = sign(updated, kps[1]);
    // const combinedSigned = PSKT.combine(PSKT.combine(updated, signed1), signed2);
    // expect(combinedSigned.toJSON()).toEqual(loadFixture('combined-signed'));

    // // Finalize phase
    // const finalized = combinedSigned.finalize((inner) => {
    //   return inner.inputs.map((input) => {
    //     const signatures = kps.flatMap((kp) => {
    //       const sig = input.partialSigs.get(kp.publicKey)!;
    //       return [OpCodes.OpData65, ...sig, input.sighashType];
    //     });

    //     return new Uint8Array([...signatures, ...new ScriptBuilder().addData(input.redeemScript!).script]);
    //   });
    // });
    // expect(finalized.toJSON()).toEqual(loadFixture('finalized'));

    // // Extract phase
    // const { transaction } = finalized.extractTransaction()(10);
    // expect(transaction.toJSON()).toEqual(loadFixture('extracted-tx'));
  });
});

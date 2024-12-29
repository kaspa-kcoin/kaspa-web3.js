import { describe, expect, it } from 'vitest';
import { Keypair, NetworkType } from '../src';
import { Buffer } from 'buffer';

describe('Keypair Tests', () => {
  it('BasicSignAndVerifySign', () => {
    const message = new TextEncoder().encode('Hello Kaspa!');
    const privkeyHex = '0000000000000000000000000000000000000000000000000000000000000003';
    const keypair = Keypair.fromPrivateKeyHex(privkeyHex);

    const signatureWithAuxRand = keypair.signMessageWithAuxData(message, new Uint8Array(32));
    const signatureWithoutAuxRand = keypair.signMessageWithAuxData(message, new Uint8Array(32).fill(0));

    expect(keypair.verifyMessage(signatureWithAuxRand, message)).toBe(true);
    expect(keypair.verifyMessage(signatureWithoutAuxRand, message)).toBe(true);
  });

  it('BasicSignWithoutRandTwiceShouldGetSameSignature', () => {
    const message = new TextEncoder().encode('Hello Kaspa!');
    const privkeyHex = '0000000000000000000000000000000000000000000000000000000000000003';
    const keypair = Keypair.fromPrivateKeyHex(privkeyHex);

    const signature = keypair.signMessageWithAuxData(message, new Uint8Array(32).fill(0));
    const signatureTwice = keypair.signMessageWithAuxData(message, new Uint8Array(32).fill(0));

    expect(signature).toEqual(signatureTwice);
  });

  it('KanjiSignAndVerifySign', () => {
    const message = new TextEncoder().encode('こんにちは世界');
    const privkeyHex = 'b7e151628aed2a6abf7158809cf4f3c762e7160f38b4da56a784d9045190cfef';
    const keypair = Keypair.fromPrivateKeyHex(privkeyHex);

    const signatureWithAuxRand = keypair.signMessageWithAuxData(message, new Uint8Array(32));
    const signatureWithoutAuxRand = keypair.signMessageWithAuxData(message, new Uint8Array(32).fill(0));

    expect(keypair.verifyMessage(signatureWithAuxRand, message)).toBe(true);
    expect(keypair.verifyMessage(signatureWithoutAuxRand, message)).toBe(true);
  });

  it('LongTextSignAndVerifySign', () => {
    const message = new TextEncoder().encode(
      'Lorem ipsum dolor sit amet. Aut omnis amet id voluptatem eligendi sit accusantium dolorem 33 corrupti necessitatibus hic consequatur quod et maiores alias non molestias suscipit? Est voluptatem magni qui odit eius est eveniet cupiditate id eius quae aut molestiae nihil eum excepturi voluptatem qui nisi architecto?\n\nEt aliquid ipsa ut quas enim et dolorem deleniti ut eius dicta non praesentium neque est velit numquam. Ut consectetur amet ut error veniam et officia laudantium ea velit nesciunt est explicabo laudantium sit totam aperiam.\n\nUt omnis magnam et accusamus earum rem impedit provident eum commodi repellat qui dolores quis et voluptate labore et adipisci deleniti. Est nostrum explicabo aut quibusdam labore et molestiae voluptate. Qui omnis nostrum At libero deleniti et quod quia.'
    );
    const privkeyHex = 'b7e151628aed2a6abf7158809cf4f3c762e7160f38b4da56a784d9045190cfef';
    const keypair = Keypair.fromPrivateKeyHex(privkeyHex);

    const signatureWithAuxRand = keypair.signMessageWithAuxData(message, new Uint8Array(32));
    const signatureWithoutAuxRand = keypair.signMessageWithAuxData(message, new Uint8Array(32).fill(0));

    expect(keypair.verifyMessage(signatureWithAuxRand, message)).toBe(true);
    expect(keypair.verifyMessage(signatureWithoutAuxRand, message)).toBe(true);
  });

  it('FailVerify', () => {
    const message = new TextEncoder().encode('Not Hello Kaspa!');
    const pubkeyHex = 'f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9';
    const fakeSig = new Uint8Array(64).fill(0);

    const keypair = Keypair.fromXOnlyPublicKeyHex(pubkeyHex);
    const verifyResult = keypair.verifyMessage(fakeSig, message);

    expect(verifyResult).toBe(false);
  });

  it('SignAndVerifyTestCase0', () => {
    const message = new TextEncoder().encode('Hello Kaspa!');
    const privkeyHex = '0000000000000000000000000000000000000000000000000000000000000003';
    const auxRand = new Uint8Array(32);
    const expectedSig = Buffer.from(
      '40b9bb2be0ae02607279eda64015a8d86e3763279170340b8243f7ce5344d77aff1191598baf2fd26149cac3b4b12c2c433261c00834db6098cb172aa48ef522',
      'hex'
    );

    const keypair = Keypair.fromPrivateKeyHex(privkeyHex);
    const signature = keypair.signMessageWithAuxData(message, auxRand);

    expect(signature).toEqual(new Uint8Array(expectedSig));
    expect(keypair.verifyMessage(signature, message)).toBe(true);
  });

  it('SignAndVerifyTestCase1', () => {
    const message = new TextEncoder().encode('Hello Kaspa!');
    const privkeyHex = 'b7e151628aed2a6abf7158809cf4f3c762e7160f38b4da56a784d9045190cfef';
    const auxRand = new Uint8Array(32).fill(0);
    auxRand[31] = 1;
    const expectedSig = Buffer.from(
      'eb9e8a3c547eb91b6a7592644f328f0648bdd21aba3cd44787d429d4d790aa8b962745691f3b472ed8d65f3b770ecb4f777bd17b1d309100919b53e0e206b4c6',
      'hex'
    );

    const keypair = Keypair.fromPrivateKeyHex(privkeyHex);
    const signature = keypair.signMessageWithAuxData(message, auxRand);

    expect(signature).toEqual(new Uint8Array(expectedSig));
    expect(keypair.verifyMessage(signature, message)).toBe(true);
  });

  it('SignAndVerifyTestCase2', () => {
    const message = new TextEncoder().encode('こんにちは世界');
    const privkeyHex = 'b7e151628aed2a6abf7158809cf4f3c762e7160f38b4da56a784d9045190cfef';
    const auxRand = new Uint8Array(32).fill(0);
    auxRand[31] = 1;
    const expectedSig = Buffer.from(
      '810653d5f80206db519672362add6c98dad378844e5ba4d89a22c9f0c7092e8cecba734fff7922b656b4be3f4b1f098899c95cb5c1023dce3519208afafb59bc',
      'hex'
    );

    const keypair = Keypair.fromPrivateKeyHex(privkeyHex);
    const signature = keypair.signMessageWithAuxData(message, auxRand);

    expect(signature).toEqual(new Uint8Array(expectedSig));
    expect(keypair.verifyMessage(signature, message)).toBe(true);
  });

  it('KeypairFromPublicKey', () => {
    const keypair = Keypair.fromPrivateKeyHex('5cd51b74226a845b8c757494136659997db1aaedf34c528e297f849f0fe87faf');
    const address = keypair.toAddress(NetworkType.Mainnet);

    expect(address.toString()).toBe('kaspa:qzzzvv57j68mcv3rsd2reshhtv4rcw4xc8snhenp2k4wu4l30jfjx7w0cg7fx');

    const keypair2 = Keypair.fromXOnlyPublicKeyHex(keypair.xOnlyPublicKey!);
    expect(keypair2.toAddress(NetworkType.Mainnet).toString()).toBe(
      'kaspa:qzzzvv57j68mcv3rsd2reshhtv4rcw4xc8snhenp2k4wu4l30jfjx7w0cg7fx'
    );
  });
});

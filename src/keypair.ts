import { Address, AddressVersion } from './address';
import { NetworkType, NetworkTypeHelper } from './consensus/network';
import { Blake2bHashKey } from './tx/hashing';
import { schnorr, secp256k1 } from '@noble/curves/secp256k1';
import {Buffer} from 'buffer';
import { randomBytes } from '@noble/hashes/utils';
import { blake2b } from '@noble/hashes/blake2b';

/**
 * Represents a keypair with methods for address generation and message signing.
 */
class Keypair {
  public readonly privateKey?: string; // hex string
  public readonly publicKey?: string;
  public readonly xOnlyPublicKey?: string;

  /**
   * Constructs a Keypair instance.
   * @param privateKey - The private key as a hex string.
   * @param publicKey - The public key as a hex string.
   * @param xOnlyPublicKey - The x-only public key as a hex string.
   */
  private constructor(privateKey?: string, publicKey?: string, xOnlyPublicKey?: string) {
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.xOnlyPublicKey = xOnlyPublicKey;
  }

  /**
   * Generates an address from the x-only public key.
   * @param network - The network type.
   * @returns The generated address.
   * @throws If the x-only public key is not available.
   */
  public toAddress(network: NetworkType): Address {
    if (!this.xOnlyPublicKey) {
      throw new Error('X-only public key is not available for address generation');
    }
    const payload =  Buffer.from(this.xOnlyPublicKey, 'hex');
    return new Address(NetworkTypeHelper.toAddressPrefix(network), AddressVersion.PubKey, payload);
  }

  /**
   * Generates an ECDSA address from the public key.
   * @param network - The network type.
   * @returns The generated ECDSA address.
   * @throws If the public key is not available.
   */
  //@ts-ignore
  public toAddressECDSA(network: NetworkType): Address {
    if (!this.publicKey) {
      throw new Error('Ecdsa public key is not available for ECDSA address generation');
    }
    const payload =  Buffer.from(this.publicKey, 'hex');
    return new Address(NetworkTypeHelper.toAddressPrefix(network), AddressVersion.PubKeyECDSA, payload);
  }

  /**
   * Generates a random Keypair instance.
   * @returns A new Keypair instance with randomly generated private and public keys.
   */
  public static random(): Keypair {
    const privateKeyBytes = randomBytes(32);
    const privateKeyHex =  Buffer.from(privateKeyBytes).toString('hex');
    const publicKey = Buffer.from( secp256k1.getPublicKey(privateKeyBytes, true)) .toString('hex');
    const xOnlyPublicKey = Buffer.from( schnorr.getPublicKey(privateKeyBytes)).toString('hex');

    return new Keypair(privateKeyHex, publicKey, xOnlyPublicKey);
  }

  /**
   * Creates a Keypair instance from a private key hex string.
   * @param key - The private key as a hex string.
   * @returns The created Keypair instance.
   */
  public static fromPrivateKeyHex(key: string): Keypair {
    return new Keypair(
      key,
      Buffer.from(secp256k1.getPublicKey(Buffer.from(key, 'hex'), true)).toString('hex'),
      Buffer.from(schnorr.getPublicKey(Buffer.from(key, 'hex'))).toString('hex')
    );
  }

  /**
   * Creates a Keypair instance from a public key hex string.
   * @param pubKey - The public key as a hex string.
   * @returns The created Keypair instance.
   */
  public static fromPublicKeyHex(pubKey: string): Keypair {
    // Extract the x-coordinate from the public key
    const x = schnorr.utils.bytesToNumberBE(Uint8Array.from(Buffer.from(pubKey,"hex")) .slice(1, 33));
    // Convert the x-coordinate to an elliptic curve point
    const p = schnorr.utils.lift_x(x);
    // The x-only public key is the x-coordinate of the point
    const xOnlyPubKey = p.toRawBytes(true).slice(1);
    return new Keypair(undefined, pubKey, Buffer.from(xOnlyPubKey).toString('hex'));
  }

  /**
   * Creates a Keypair instance from an x-only public key hex string.
   * @param xOnlyPublicKeyHex - The x-only public key as a hex string.
   * @returns The created Keypair instance.
   */
  public static fromXOnlyPublicKeyHex(xOnlyPublicKeyHex: string): Keypair {
    return new Keypair(undefined, undefined, xOnlyPublicKeyHex);
  }

  public sign(data: Uint8Array): Uint8Array {
    if (!this.privateKey) {
      throw new Error('Secret key is not available for signing');
    }

    if (data.length !== 32) throw new Error('Invalid data length');
    return  schnorr.sign(data, this.privateKey, undefined);
  }

  /**
   * Signs a message with auxiliary data using the private key.
   * @param message - The message to sign.
   * @param auxData32 - The auxiliary data.
   * @returns The signature as a Uint8Array.
   * @throws If the private key is not available.
   */
  public signMessageWithAuxData(message: Uint8Array, auxData32: Uint8Array): Uint8Array {
    if (!this.privateKey) {
      throw new Error('Secret key is not available for signing');
    }

    const bytes = Buffer.from(message);
    const hash= blake2b(bytes, { dkLen: 32, key: Blake2bHashKey.PersonalMessageSigning });
    return  schnorr.sign(hash, this.privateKey, auxData32);
  }

  /**
   * Verifies a message signature using the x-only public key.
   * @param signature - The signature to verify.
   * @param message - The message that was signed.
   * @returns True if the signature is valid, false otherwise.
   */
  public verifyMessage(signature: Uint8Array, message: Uint8Array): boolean {
    const bytes = Buffer.from(message);
    const hashedMsg= blake2b(bytes, { dkLen: 32, key: Blake2bHashKey.PersonalMessageSigning });
    return schnorr.verify(signature, hashedMsg, this.xOnlyPublicKey!);
  }
}

export { Keypair };

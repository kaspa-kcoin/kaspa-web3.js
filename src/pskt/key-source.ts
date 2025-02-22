/**
 * Type definition for key fingerprint - 4 bytes fixed length array
 */
export type KeyFingerprint = Uint8Array;

/**
 * Type definition for derivation path
 */
export type DerivationPath = string;

/**
 * Full information on the used extended public key: fingerprint of the
 * master extended public key and a derivation path from it.
 */
export class KeySource {
  keyFingerprint: KeyFingerprint;
  derivationPath: DerivationPath;

  constructor(keyFingerprint: KeyFingerprint, derivationPath: DerivationPath) {
    this.keyFingerprint = keyFingerprint;
    this.derivationPath = derivationPath;
  }

  equals(other: KeySource): boolean {
    for (let i = 0; i < this.keyFingerprint.length; i++) {
      if (this.keyFingerprint[i] !== other.keyFingerprint[i]) return false;
    }
    return this.derivationPath === other.derivationPath;
  }
}

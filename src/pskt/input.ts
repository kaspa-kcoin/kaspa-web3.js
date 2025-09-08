import { PartialSigs, PSKT } from '.';
import { UtxoEntry, TransactionOutpoint, SigHashType, SIG_HASH_ALL } from '../tx';
import { KeySource } from './key-source';
import { isEqual } from './utils';

/**
 * Input structure for PSKT
 */
export class Input {
  utxoEntry?: UtxoEntry;
  previousOutpoint: TransactionOutpoint;
  sequence?: bigint;
  minTime?: number;
  partialSigs: PartialSigs;
  sighashType: SigHashType;
  redeemScript?: Uint8Array;
  sigOpCount?: number;
  bip32Derivations: Map<string, KeySource | undefined>;
  finalScriptSig?: Uint8Array;
  proprietaries: Map<string, any>;
  unknowns: Map<string, any>;

  constructor(previousOutpoint: TransactionOutpoint) {
    this.previousOutpoint = previousOutpoint;
    this.partialSigs = new Map();
    this.sighashType = SIG_HASH_ALL;
    this.bip32Derivations = new Map();
    this.proprietaries = new Map();
    this.unknowns = new Map();
  }

  static fromJson(json: string): Input {
    const obj = JSON.parse(json, PSKT.reviver);
    if (!obj || typeof obj.previousOutpoint !== 'object') {
      throw new Error('Failed to deserialize Input');
    }
    const previousOutpoint = TransactionOutpoint.fromJson(JSON.stringify(obj.previousOutpoint, PSKT.replacer));
    const result = new Input(previousOutpoint);

    if (obj.sequence) result.sequence = BigInt(obj.sequence);

    if (typeof obj.minTime === 'number') {
      result.minTime = obj.minTime;
    }
    if (Array.isArray(obj.partialSigs)) {
      for (const [key, value] of obj.partialSigs) {
        result.partialSigs.set(key, value);
      }
    }
    if (typeof obj.sighashType === 'number') {
      result.sighashType = obj.sighashType;
    }
    if (Array.isArray(obj.redeemScript)) {
      result.redeemScript = new Uint8Array(obj.redeemScript);
    }
    if (typeof obj.sigOpCount === 'number') {
      result.sigOpCount = obj.sigOpCount;
    }
    if (Array.isArray(obj.bip32Derivations)) {
      for (const [key, value] of obj.bip32Derivations) {
        result.bip32Derivations.set(key, value);
      }
    }
    if (Array.isArray(obj.proprietaries)) {
      for (const [key, value] of obj.proprietaries) {
        result.proprietaries.set(key, value);
      }
    }
    if (Array.isArray(obj.unknowns)) {
      for (const [key, value] of obj.unknowns) {
        result.unknowns.set(key, value);
      }
    }
    return result;
  }

  equals(other: Input): boolean {
    if (!this.previousOutpoint.equals(other.previousOutpoint)) return false;
    if (this.sequence !== other.sequence) return false;
    if (this.minTime !== other.minTime) return false;
    if (!this.sighashType.equals(other.sighashType)) return false;
    if (
      this.redeemScript &&
      other.redeemScript &&
      !Buffer.from(this.redeemScript).equals(Buffer.from(other.redeemScript))
    )
      return false;
    if (this.sigOpCount !== other.sigOpCount) return false;
    if (
      this.finalScriptSig &&
      other.finalScriptSig &&
      !Buffer.from(this.finalScriptSig).equals(Buffer.from(other.finalScriptSig))
    )
      return false;
    if (this.partialSigs.size !== other.partialSigs.size) return false;
    for (const [key, value] of this.partialSigs) {
      if (!other.partialSigs.has(key)) return false;
      if (!isEqual(value, other.partialSigs.get(key)!)) return false;
    }
    if (this.bip32Derivations.size !== other.bip32Derivations.size) return false;
    for (const [key, value] of this.bip32Derivations) {
      if (!other.bip32Derivations.has(key)) return false;
      if (!isEqual(value, other.bip32Derivations.get(key)!)) return false;
    }
    if (this.proprietaries.size !== other.proprietaries.size) return false;
    for (const [key, value] of this.proprietaries) {
      if (!other.proprietaries.has(key)) return false;
      if (!isEqual(value, other.proprietaries.get(key)!)) return false;
    }
    if (this.unknowns.size !== other.unknowns.size) return false;
    for (const [key, value] of this.unknowns) {
      if (!other.unknowns.has(key)) return false;
      if (!isEqual(value, other.unknowns.get(key)!)) return false;
    }
    return true;
  }
}

/**
 * Input builder with validation
 */
export class InputBuilder {
  private input: Partial<Input>;

  constructor() {
    this.input = {
      partialSigs: new Map(),
      sighashType: SIG_HASH_ALL,
      bip32Derivations: new Map(),
      proprietaries: new Map(),
      unknowns: new Map()
    };
  }

  setUtxoEntry(utxoEntry: UtxoEntry): InputBuilder {
    this.input.utxoEntry = utxoEntry;
    return this;
  }

  setPreviousOutpoint(outpoint: TransactionOutpoint): InputBuilder {
    this.input.previousOutpoint = outpoint;
    return this;
  }

  setSigOpCount(sigOpCount: number): InputBuilder {
    this.input.sigOpCount = sigOpCount;
    return this;
  }

  setRedeemScript(redeemScript: Uint8Array): InputBuilder {
    this.input.redeemScript = redeemScript;
    return this;
  }

  build(): Input {
    if (!this.input.previousOutpoint) {
      throw new Error('Missing required field: previousOutpoint');
    }
    return Input.fromJson(JSON.stringify(this.input, PSKT.replacer));
  }
}

/**
 * Input combine error types
 */
export class CombineError extends Error {
  constructor(
    public readonly type:
      | 'PreviousTxidMismatch'
      | 'SpentOutputIndexMismatch'
      | 'NotCompatibleRedeemScripts'
      | 'NotCompatibleUtxos'
      | 'NotCompatibleBip32Derivations'
      | 'NotCompatibleUnknownField'
      | 'NotCompatibleProprietary',
    public readonly details: any
  ) {
    super(`Input combine error: ${type}`);
    this.name = 'InputCombineError';
  }
}

/**
 * Combine two inputs
 */
export function combineInputs(lhs: Input, rhs: Input): Input {
  // Check previous outpoint
  if (!lhs.previousOutpoint.transactionId.equals(rhs.previousOutpoint.transactionId)) {
    throw new CombineError('PreviousTxidMismatch', {
      this: lhs.previousOutpoint.transactionId,
      that: rhs.previousOutpoint.transactionId
    });
  }

  if (lhs.previousOutpoint.index !== rhs.previousOutpoint.index) {
    throw new CombineError('SpentOutputIndexMismatch', {
      this: lhs.previousOutpoint.index,
      that: rhs.previousOutpoint.index
    });
  }

  // Combine fields
  const result: Input = {
    ...lhs,
    sequence: (lhs.sequence || 0n) > (rhs.sequence || 0n) ? lhs.sequence : rhs.sequence,
    minTime: Math.max(lhs.minTime || 0, rhs.minTime || 0),
    partialSigs: new Map([...lhs.partialSigs, ...rhs.partialSigs]),
    equals: lhs.equals,
    fromJson: lhs.fromJson
  };

  // Handle utxo entry
  if (lhs.utxoEntry && rhs.utxoEntry && !lhs.utxoEntry.equals(rhs.utxoEntry)) {
    throw new CombineError('NotCompatibleUtxos', { this: lhs.utxoEntry, that: rhs.utxoEntry });
  }
  result.utxoEntry = lhs.utxoEntry || rhs.utxoEntry;

  return result;
}

import { Version } from './version';
import { KeySource } from './key-source';
import { Hash, TransactionId, TX_VERSION } from '../tx';
import { isEqual } from './utils';

/**
 * Global PSKT data
 */
export class Global {
  version: number;
  txVersion: number;
  fallbackLockTime?: bigint;
  inputsModifiable: boolean;
  outputsModifiable: boolean;
  inputCount: number;
  outputCount: number;
  xpubs: Map<string, KeySource>;
  id?: TransactionId;
  proprietaries: Map<string, any>;

  constructor() {
    this.version = Version.Zero;
    this.txVersion = TX_VERSION;
    this.inputsModifiable = false;
    this.outputsModifiable = false;
    this.inputCount = 0;
    this.outputCount = 0;
    this.xpubs = new Map();
    this.proprietaries = new Map();
  }

  static fromJson(json: string): Global {
    const obj = JSON.parse(json);
    if (!obj || typeof obj.version !== 'number' || typeof obj.txVersion !== 'number') {
      throw new Error('Failed to deserialize Global');
    }
    const result = new Global();
    result.version = obj.version;
    result.txVersion = obj.txVersion;
    result.fallbackLockTime = obj.fallbackLockTime;
    result.inputsModifiable = obj.inputsModifiable;
    result.outputsModifiable = obj.outputsModifiable;
    result.inputCount = obj.inputCount;
    result.outputCount = obj.outputCount;
    result.xpubs = new Map(Object.entries(obj.xpubs));
    result.id = obj.id ? Hash.fromHex(obj.id) : undefined;
    result.proprietaries = new Map(Object.entries(obj.proprietaries));
    return result;
  }

  equals(other: Global): boolean {
    if (this.version !== other.version) return false;
    if (this.txVersion !== other.txVersion) return false;
    if (this.fallbackLockTime !== other.fallbackLockTime) return false;
    if (this.inputsModifiable !== other.inputsModifiable) return false;
    if (this.outputsModifiable !== other.outputsModifiable) return false;
    if (this.inputCount !== other.inputCount) return false;
    if (this.outputCount !== other.outputCount) return false;
    for (const [key, value] of this.xpubs) {
      if (!other.xpubs.has(key)) return false;
      if (!value.equals(other.xpubs.get(key)!)) return false;
    }
    if (this.id && other.id && !this.id.equals(other.id)) return false;
    for (const [key, value] of this.proprietaries) {
      if (!other.proprietaries.has(key)) return false;
      if (!isEqual(value, other.proprietaries.get(key)!)) return false;
    }
    return true;
  }
}

export class CombineError extends Error {
  constructor(
    public readonly type:
      | 'VersionMismatch'
      | 'TxVersionMismatch'
      | 'LockTimeMismatch'
      | 'TransactionIdMismatch'
      | 'InconsistentKeySources'
      | 'NotCompatibleUnknownField'
      | 'NotCompatibleProprietary',
    public readonly details: any
  ) {
    super(`Global combine error: ${type}`);
    this.name = 'CombineError';
  }
}

export function combineGlobals(lhs: Global, rhs: Global): Global {
  if (lhs.version !== rhs.version) {
    throw new CombineError('VersionMismatch', { this: lhs.version, that: rhs.version });
  }

  if (lhs.txVersion !== rhs.txVersion) {
    throw new CombineError('TxVersionMismatch', { this: lhs.txVersion, that: rhs.txVersion });
  }

  // Combine logic...
  const result: Global = {
    ...lhs,
    inputsModifiable: lhs.inputsModifiable && rhs.inputsModifiable,
    outputsModifiable: lhs.outputsModifiable && rhs.outputsModifiable,
    inputCount: Math.max(lhs.inputCount, rhs.inputCount),
    outputCount: Math.max(lhs.outputCount, rhs.outputCount),
    equals: lhs.equals
  };

  // Handle fallback lock time
  if (
    lhs.fallbackLockTime !== undefined &&
    rhs.fallbackLockTime !== undefined &&
    lhs.fallbackLockTime !== rhs.fallbackLockTime
  ) {
    throw new CombineError('LockTimeMismatch', { this: lhs.fallbackLockTime, that: rhs.fallbackLockTime });
  }
  result.fallbackLockTime = lhs.fallbackLockTime ?? rhs.fallbackLockTime;

  // Handle transaction ID
  if (lhs.id && rhs.id && !lhs.id.equals(rhs.id)) {
    throw new CombineError('TransactionIdMismatch', { this: lhs.id, that: rhs.id });
  }
  result.id = lhs.id || rhs.id;

  return result;
}

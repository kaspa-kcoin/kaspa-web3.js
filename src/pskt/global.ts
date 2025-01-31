import { Version } from './version';
import { KeySource } from './key-source';
import { TransactionId, TX_VERSION } from '../tx';

/**
 * Global PSKT data
 */
export class Global {
  version: Version;
  txVersion: number;
  fallbackLockTime?: bigint;
  inputsModifiable: boolean;
  outputsModifiable: boolean;
  inputCount: number;
  outputCount: number;
  xpubs: Map<string, KeySource>;
  id?: TransactionId;
  proprietaries: Map<string, any>;
  unknowns: Map<string, any>;

  constructor() {
    this.version = Version.Zero;
    this.txVersion = TX_VERSION;
    this.inputsModifiable = false;
    this.outputsModifiable = false;
    this.inputCount = 0;
    this.outputCount = 0;
    this.xpubs = new Map();
    this.proprietaries = new Map();
    this.unknowns = new Map();
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
    outputCount: Math.max(lhs.outputCount, rhs.outputCount)
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

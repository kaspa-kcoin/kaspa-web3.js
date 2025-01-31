import { PartialSigs } from '.';
import { UtxoEntry, TransactionOutpoint, SigHashType, SIG_HASH_ALL } from '../tx';
import { KeySource } from './key-source';

/**
 * Input structure for PSKT
 */
export interface Input {
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

  build(): Input {
    if (!this.input.previousOutpoint) {
      throw new Error('Missing required field: previousOutpoint');
    }
    return this.input as Input;
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
    partialSigs: new Map([...lhs.partialSigs, ...rhs.partialSigs])
  };

  // Handle utxo entry
  if (lhs.utxoEntry && rhs.utxoEntry && !lhs.utxoEntry.equals(rhs.utxoEntry)) {
    throw new CombineError('NotCompatibleUtxos', { this: lhs.utxoEntry, that: rhs.utxoEntry });
  }
  result.utxoEntry = lhs.utxoEntry || rhs.utxoEntry;

  return result;
}

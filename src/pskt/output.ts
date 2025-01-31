import { ScriptPublicKey } from '..';
import { KeySource } from './key-source';

/**
 * Output structure for PSKT
 */
export interface Output {
  amount: bigint;
  scriptPublicKey: ScriptPublicKey;
  redeemScript?: Uint8Array;
  bip32Derivations: Map<string, KeySource | undefined>;
  proprietaries: Map<string, any>;
  unknowns: Map<string, any>;
}

/**
 * Output builder with validation
 */
export class OutputBuilder {
  private output: Partial<Output>;

  constructor() {
    this.output = {
      bip32Derivations: new Map(),
      proprietaries: new Map(),
      unknowns: new Map()
    };
  }

  setAmount(amount: bigint): OutputBuilder {
    this.output.amount = amount;
    return this;
  }

  setScriptPublicKey(script: ScriptPublicKey): OutputBuilder {
    this.output.scriptPublicKey = script;
    return this;
  }

  build(): Output {
    if (typeof this.output.amount !== 'number') {
      throw new Error('Missing required field: amount');
    }
    if (!this.output.scriptPublicKey) {
      throw new Error('Missing required field: scriptPublicKey');
    }
    return this.output as Output;
  }
}

/**
 * Output combine error types
 */
export class CombineError extends Error {
  constructor(
    public readonly type:
      | 'AmountMismatch'
      | 'ScriptPubkeyMismatch'
      | 'NotCompatibleRedeemScripts'
      | 'NotCompatibleBip32Derivations'
      | 'NotCompatibleUnknownField'
      | 'NotCompatibleProprietary',
    public readonly details: any
  ) {
    super(`Output combine error: ${type}`);
    this.name = 'OutputCombineError';
  }
}

/**
 * Combine two outputs
 */
export function combineOutputs(lhs: Output, rhs: Output): Output {
  // Check amounts match
  if (lhs.amount !== rhs.amount) {
    throw new CombineError('AmountMismatch', {
      this: lhs.amount,
      that: rhs.amount
    });
  }

  // Check script pub keys match
  if (!lhs.scriptPublicKey.equals(rhs.scriptPublicKey)) {
    throw new CombineError('ScriptPubkeyMismatch', {
      this: lhs.scriptPublicKey,
      that: rhs.scriptPublicKey
    });
  }

  // Handle redeem scripts
  if (lhs.redeemScript && rhs.redeemScript && !Buffer.from(lhs.redeemScript).equals(Buffer.from(rhs.redeemScript))) {
    throw new CombineError('NotCompatibleRedeemScripts', {
      this: lhs.redeemScript,
      that: rhs.redeemScript
    });
  }

  // Combine the outputs
  const result: Output = {
    ...lhs,
    redeemScript: lhs.redeemScript || rhs.redeemScript,
    bip32Derivations: new Map([...lhs.bip32Derivations, ...rhs.bip32Derivations]),
    proprietaries: new Map([...lhs.proprietaries, ...rhs.proprietaries]),
    unknowns: new Map([...lhs.unknowns, ...rhs.unknowns])
  };

  return result;
}

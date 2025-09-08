import { Input } from './input';
import { Output } from './output.ts';

/**
 * Error type for conflicting values in maps
 */
export class CombineError<K, V> extends Error {
  constructor(
    public readonly field: K,
    public readonly lhs: V,
    public readonly rhs: V
  ) {
    super('Conflict');
    this.name = 'CombineError';
  }
}

/**
 * Combines two maps if there are no conflicts in values for same keys
 * @param lhs Left hand side map
 * @param rhs Right hand side map
 * @returns Combined map if no conflicts, otherwise throws CombineError
 */
export function combineIfNoConflicts<K, V>(lhs: Map<K, V>, rhs: Map<K, V>): Map<K, V> {
  // Optimize by using the larger map as base
  if (lhs.size < rhs.size) {
    return combineIfNoConflicts(rhs, lhs);
  }

  // Clone the left map
  const result = new Map(lhs);

  // Check for conflicts and combine
  for (const [key, value] of rhs) {
    const existing = result.get(key);
    if (existing !== undefined && !isEqual(existing, value)) {
      throw new CombineError(key, existing, value);
    }
    result.set(key, value);
  }

  return result;
}

/**
 * Deep equality check for values
 */
export function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  if (a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => isEqual(a[key], b[key]));
}

export function isOutputEqual(a: Output, b: Output): boolean {
  if (a.amount !== b.amount) return false;
  if (a.scriptPublicKey.equals(b.scriptPublicKey)) return false;
  if (a.redeemScript && b.redeemScript && !Buffer.from(a.redeemScript).equals(Buffer.from(b.redeemScript)))
    return false;
  if (a.bip32Derivations.size !== b.bip32Derivations.size) return false;
  for (const [key, value] of a.bip32Derivations) {
    if (!b.bip32Derivations.has(key)) return false;
    const bValue = b.bip32Derivations.get(key);
    if (value === undefined && bValue === undefined) return true;
    if (value !== undefined && bValue === undefined) return false;
    if (value === undefined && bValue !== undefined) return false;
    if (value?.equals(bValue!)) return true;
  }
  if (a.proprietaries.size !== b.proprietaries.size) return false;
  for (const [key, value] of a.proprietaries) {
    if (!b.proprietaries.has(key)) return false;
    if (!isEqual(value, b.proprietaries.get(key)!)) return false;
  }
  if (a.unknowns.size !== b.unknowns.size) return false;
  for (const [key, value] of a.unknowns) {
    if (!b.unknowns.has(key)) return false;
    if (!isEqual(value, b.unknowns.get(key)!)) return false;
  }
  return true;
}

export function isHexString(str: string): boolean {
  const hexRegExp = /^[0-9a-fA-F]+$/;
  return hexRegExp.test(str);
}

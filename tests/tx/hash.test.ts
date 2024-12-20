import { describe, it, expect } from 'vitest';
import { Hash } from '../../src';

describe('Hash Basics', () => {
  it('should create a hash from a string and convert it back to a string', () => {
    const hashStr = '8e40af02265360d59f4ecf9ae9ebf8f00a3118408f5a9cdcbcc9c0f93642f3af';
    const hash = Hash.fromString(hashStr);
    expect(hash.toString()).toBe(hashStr);
    const hash2 = Hash.fromString(hashStr);
    expect(hash.equals(hash2)).toBe(true);
  });

  it('should compare two different hashes', () => {
    const hashStr = '8e40af02265360d59f4ecf9ae9ebf8f00a3118408f5a9cdcbcc9c0f93642f3af';
    const hash = Hash.fromString(hashStr);
    const hash3 = Hash.fromString('8e40af02265360d59f4ecf9ae9ebf8f00a3118408f5a9cdcbcc9c0f93642f3ab');
    expect(hash.equals(hash3)).toBe(false);
  });

  it('should throw an error for invalid hash lengths', () => {
    const oddStr = '8e40af02265360d59f4ecf9ae9ebf8f00a3118408f5a9cdcbcc9c0f93642f3a';
    const shortStr = '8e40af02265360d59f4ecf9ae9ebf8f00a3118408f5a9cdcbcc9c0f93642f3';

    expect(() => Hash.fromString(oddStr)).toThrow('Slice must have the length of 32');
    expect(() => Hash.fromString(shortStr)).toThrow('Slice must have the length of 32');
  });
});

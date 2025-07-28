import { describe, it, expect } from 'vitest';
import { SOMPI_PER_KASPA, kaspaToSompi, sompiToKaspa, maxValueOfU } from '../src/utils';

describe('Utils Tests', () => {
  describe('SOMPI_PER_KASPA constant', () => {
    it('should equal 100,000,000', () => {
      expect(SOMPI_PER_KASPA).toBe(100_000_000n);
    });
  });

  describe('kaspaToSompi', () => {
    describe('valid inputs', () => {
      it('should convert integer Kaspa amounts to Sompi', () => {
        expect(kaspaToSompi('1')).toBe(100_000_000n);
        expect(kaspaToSompi('0')).toBe(0n);
        expect(kaspaToSompi('10')).toBe(1_000_000_000n);
        expect(kaspaToSompi('100')).toBe(10_000_000_000n);
      });

      it('should convert decimal Kaspa amounts to Sompi', () => {
        expect(kaspaToSompi('1.5')).toBe(150_000_000n);
        expect(kaspaToSompi('0.1')).toBe(10_000_000n);
        expect(kaspaToSompi('0.12345678')).toBe(12_345_678n);
        expect(kaspaToSompi('1.00000001')).toBe(100_000_001n);
      });

      it('should handle leading/trailing decimal points', () => {
        expect(kaspaToSompi('.5')).toBe(50_000_000n);
        expect(kaspaToSompi('1.')).toBe(100_000_000n);
      });

      it('should handle amounts with fewer than 8 decimal places', () => {
        expect(kaspaToSompi('1.1')).toBe(110_000_000n);
        expect(kaspaToSompi('1.12')).toBe(112_000_000n);
        expect(kaspaToSompi('1.123')).toBe(112_300_000n);
        expect(kaspaToSompi('1.1234')).toBe(112_340_000n);
        expect(kaspaToSompi('1.12345')).toBe(112_345_000n);
        expect(kaspaToSompi('1.123456')).toBe(112_345_600n);
        expect(kaspaToSompi('1.1234567')).toBe(112_345_670n);
      });

      it('should truncate amounts with more than 8 decimal places', () => {
        expect(kaspaToSompi('1.123456789')).toBe(112_345_678n);
        expect(kaspaToSompi('1.123456789012345')).toBe(112_345_678n);
      });

      it('should handle number inputs', () => {
        expect(kaspaToSompi(1)).toBe(100_000_000n);
        expect(kaspaToSompi(1.5)).toBe(150_000_000n);
        expect(kaspaToSompi(0)).toBe(0n);
        expect(kaspaToSompi(0.1)).toBe(10_000_000n);
      });

      it('should handle whitespace in string inputs', () => {
        expect(kaspaToSompi(' 1 ')).toBe(100_000_000n);
        expect(kaspaToSompi(' 1.5 ')).toBe(150_000_000n);
        expect(kaspaToSompi('\t0.1\n')).toBe(10_000_000n);
      });
    });

    describe('invalid inputs', () => {
      it('should reject negative amounts', () => {
        expect(() => kaspaToSompi('-1')).toThrow('Amount cannot be negative');
        expect(() => kaspaToSompi('-0.1')).toThrow('Amount cannot be negative');
        expect(() => kaspaToSompi(-1)).toThrow('Amount cannot be negative');
      });

      it('should reject invalid string formats', () => {
        expect(() => kaspaToSompi('')).toThrow('Invalid amount format');
        expect(() => kaspaToSompi('.')).toThrow('Invalid amount format');
        expect(() => kaspaToSompi('abc')).toThrow('Invalid amount format');
        expect(() => kaspaToSompi('1.2.3')).toThrow('Invalid amount format');
        expect(() => kaspaToSompi('1a')).toThrow('Invalid amount format');
        expect(() => kaspaToSompi('a1')).toThrow('Invalid amount format');
      });

      it('should reject scientific notation', () => {
        expect(() => kaspaToSompi('1e5')).toThrow('Scientific notation is not supported');
        expect(() => kaspaToSompi('1E5')).toThrow('Scientific notation is not supported');
        expect(() => kaspaToSompi('1.5e2')).toThrow('Scientific notation is not supported');
      });

      it('should reject non-finite numbers', () => {
        expect(() => kaspaToSompi(Infinity)).toThrow('Amount must be a finite number');
        expect(() => kaspaToSompi(-Infinity)).toThrow('Amount must be a finite number');
        expect(() => kaspaToSompi(NaN)).toThrow('Amount must be a finite number');
      });
    });
  });

  describe('sompiToKaspa', () => {
    describe('valid inputs', () => {
      it('should convert integer Sompi amounts to Kaspa', () => {
        expect(sompiToKaspa(0n)).toBe(0);
        expect(sompiToKaspa(100_000_000n)).toBe(1);
        expect(sompiToKaspa(1_000_000_000n)).toBe(10);
        expect(sompiToKaspa(10_000_000_000n)).toBe(100);
      });

      it('should convert decimal Sompi amounts to Kaspa', () => {
        expect(sompiToKaspa(150_000_000n)).toBe(1.5);
        expect(sompiToKaspa(10_000_000n)).toBe(0.1);
        expect(sompiToKaspa(12_345_678n)).toBe(0.12345678);
        expect(sompiToKaspa(100_000_001n)).toBe(1.00000001);
      });

      it('should handle small amounts correctly', () => {
        expect(sompiToKaspa(1n)).toBe(0.00000001);
        expect(sompiToKaspa(10n)).toBe(0.0000001);
        expect(sompiToKaspa(100n)).toBe(0.000001);
        expect(sompiToKaspa(1_000n)).toBe(0.00001);
        expect(sompiToKaspa(10_000n)).toBe(0.0001);
        expect(sompiToKaspa(100_000n)).toBe(0.001);
        expect(sompiToKaspa(1_000_000n)).toBe(0.01);
      });

      it('should trim trailing zeros', () => {
        expect(sompiToKaspa(110_000_000n)).toBe(1.1);
        expect(sompiToKaspa(112_000_000n)).toBe(1.12);
        expect(sompiToKaspa(112_300_000n)).toBe(1.123);
        expect(sompiToKaspa(112_340_000n)).toBe(1.1234);
        expect(sompiToKaspa(112_345_000n)).toBe(1.12345);
        expect(sompiToKaspa(112_345_600n)).toBe(1.123456);
        expect(sompiToKaspa(112_345_670n)).toBe(1.1234567);
      });

      it('should handle large amounts', () => {
        const largeSompi = 9_007_199_254_740_991n; // Close to Number.MAX_SAFE_INTEGER
        expect(sompiToKaspa(largeSompi)).toBe(90071992.54740991);
      });
    });

    describe('invalid inputs', () => {
      it('should reject negative amounts', () => {
        expect(() => sompiToKaspa(-1n)).toThrow('Amount cannot be negative');
        expect(() => sompiToKaspa(-100_000_000n)).toThrow('Amount cannot be negative');
      });
    });

    describe('round-trip conversions', () => {
      it('should maintain precision in round-trip conversions', () => {
        const testCases = ['1', '1.5', '0.1', '0.12345678', '100.87654321'];

        testCases.forEach(kaspaAmount => {
          const sompi = kaspaToSompi(kaspaAmount);
          const backToKaspa = sompiToKaspa(sompi);
          expect(backToKaspa).toBe(Number(kaspaAmount));
        });
      });

      it('should handle edge cases in round-trip conversions', () => {
        // Test with the smallest unit
        const smallestSompi = 1n;
        const kaspa = sompiToKaspa(smallestSompi);
        // Use toFixed to avoid scientific notation when converting back to string
        const backToSompi = kaspaToSompi(kaspa.toFixed(8));
        expect(backToSompi).toBe(smallestSompi);

        // Test with exactly 8 decimal places
        const exactDecimal = '1.12345678';
        const sompi = kaspaToSompi(exactDecimal);
        const backToKaspa = sompiToKaspa(sompi);
        expect(backToKaspa).toBe(Number(exactDecimal));
      });
    });
  });

  describe('maxValueOfU', () => {
    describe('valid inputs', () => {
      it('should calculate correct max values for valid bit sizes', () => {
        expect(maxValueOfU(8)).toBe(255n);
        expect(maxValueOfU(16)).toBe(65535n);
        expect(maxValueOfU(32)).toBe(4294967295n);
        expect(maxValueOfU(64)).toBe(18446744073709551615n);
        expect(maxValueOfU(128)).toBe(340282366920938463463374607431768211455n);
        expect(maxValueOfU(256)).toBe(115792089237316195423570985008687907853269984665640564039457584007913129639935n);
      });

      it('should handle edge case of 8 bits', () => {
        expect(maxValueOfU(8)).toBe((1n << 8n) - 1n);
      });

      it('should handle maximum allowed bits (256)', () => {
        expect(maxValueOfU(256)).toBe((1n << 256n) - 1n);
      });
    });

    describe('invalid inputs', () => {
      it('should reject non-positive bit sizes', () => {
        expect(() => maxValueOfU(0)).toThrow('numberOfBits must be a positive multiple of 8');
        expect(() => maxValueOfU(-8)).toThrow('numberOfBits must be a positive multiple of 8');
      });

      it('should reject non-multiple of 8 bit sizes', () => {
        expect(() => maxValueOfU(7)).toThrow('numberOfBits must be a positive multiple of 8');
        expect(() => maxValueOfU(9)).toThrow('numberOfBits must be a positive multiple of 8');
        expect(() => maxValueOfU(15)).toThrow('numberOfBits must be a positive multiple of 8');
        expect(() => maxValueOfU(17)).toThrow('numberOfBits must be a positive multiple of 8');
      });

      it('should reject bit sizes exceeding 256', () => {
        expect(() => maxValueOfU(264)).toThrow('numberOfBits must not exceed 256');
        expect(() => maxValueOfU(512)).toThrow('numberOfBits must not exceed 256');
      });
    });
  });

  describe('edge cases and integration', () => {
    it('should handle zero amounts correctly', () => {
      expect(kaspaToSompi('0')).toBe(0n);
      expect(kaspaToSompi('0.0')).toBe(0n);
      expect(kaspaToSompi('0.00000000')).toBe(0n);
      expect(sompiToKaspa(0n)).toBe(0);
    });

    it('should handle very small amounts', () => {
      const smallestKaspa = '0.00000001';
      const sompi = kaspaToSompi(smallestKaspa);
      expect(sompi).toBe(1n);
      expect(sompiToKaspa(sompi)).toBe(0.00000001);
    });

    it('should maintain consistency between string and number inputs for kaspaToSompi', () => {
      const testValues = [1, 1.5, 0.1, 10.25];

      testValues.forEach(value => {
        const fromNumber = kaspaToSompi(value);
        const fromString = kaspaToSompi(value.toString());
        expect(fromNumber).toBe(fromString);
      });
    });
  });
});

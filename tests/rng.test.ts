// ============================================================
// RNG Tests — Mulberry32 reproducibility + SeedManager
// ============================================================

import { describe, it, expect } from 'vitest';
import { mulberry32, hashSeed, SeedManager } from '@/core/rng';

describe('mulberry32', () => {
  it('should produce the same sequence for the same seed', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);

    const seq1 = Array.from({ length: 100 }, () => rng1());
    const seq2 = Array.from({ length: 100 }, () => rng2());

    expect(seq1).toEqual(seq2);
  });

  it('should produce different sequences for different seeds', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(54321);

    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());

    expect(seq1).not.toEqual(seq2);
  });

  it('should produce values in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 10000; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('should have reasonable distribution', () => {
    const rng = mulberry32(99999);
    const buckets = new Array(10).fill(0);
    const N = 10000;

    for (let i = 0; i < N; i++) {
      const bucket = Math.floor(rng() * 10);
      buckets[bucket]++;
    }

    // Each bucket should have roughly N/10 = 1000 items
    // Allow 20% deviation
    for (const count of buckets) {
      expect(count).toBeGreaterThan(800);
      expect(count).toBeLessThan(1200);
    }
  });
});

describe('hashSeed', () => {
  it('should produce consistent hash for same input', () => {
    expect(hashSeed('ABCD1234')).toBe(hashSeed('ABCD1234'));
  });

  it('should produce different hashes for different inputs', () => {
    expect(hashSeed('ABCD1234')).not.toBe(hashSeed('WXYZ9876'));
  });
});

describe('SeedManager', () => {
  it('should derive independent sub-seeds', () => {
    const sm = new SeedManager('TESTRUN1');
    const shopVals = Array.from({ length: 5 }, () => sm.random('shop'));
    const packVals = Array.from({ length: 5 }, () => sm.random('pack'));

    expect(shopVals).not.toEqual(packVals);
  });

  it('should be fully reproducible with same master seed', () => {
    const sm1 = new SeedManager('TESTRUN1');
    const sm2 = new SeedManager('TESTRUN1');

    for (let i = 0; i < 20; i++) {
      expect(sm1.random('shop')).toBe(sm2.random('shop'));
      expect(sm1.random('deck')).toBe(sm2.random('deck'));
    }
  });

  it('randomInt should return values in range', () => {
    const sm = new SeedManager('INTTEST');
    for (let i = 0; i < 100; i++) {
      const val = sm.randomInt('loot', 1, 10);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(10);
    }
  });

  it('shuffle should be deterministic', () => {
    const sm1 = new SeedManager('SHUFFLE');
    const sm2 = new SeedManager('SHUFFLE');

    const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const arr2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    sm1.shuffle('deck', arr1);
    sm2.shuffle('deck', arr2);

    expect(arr1).toEqual(arr2);
    expect(arr1).not.toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

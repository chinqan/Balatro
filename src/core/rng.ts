// ============================================================
// RNG — Mulberry32 PRNG + Seed Management
// From GDD Phase 9 §2.2: Deterministic, shareable seeds
// ============================================================

/**
 * Mulberry32: 32-bit PRNG, high quality and fast.
 * Returns a function that generates numbers in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return function next(): number {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Convert an alphanumeric seed string to a 32-bit integer seed.
 * Uses FNV-1a hash for good distribution.
 */
export function hashSeed(str: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return hash >>> 0;
}

/**
 * Generate a random 8-character alphanumeric seed string.
 */
export function generateSeedString(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/** All sub-seed categories as defined in GDD Phase 9 §2.1 */
export type SeedCategory = 'shop' | 'pack' | 'boss' | 'loot' | 'event' | 'deck';

/**
 * SeedManager: derives deterministic sub-seeds from a master seed.
 * Each category gets its own independent PRNG stream.
 */
export class SeedManager {
  readonly masterSeedString: string;
  readonly masterSeed: number;
  private readonly _rngs = new Map<SeedCategory, () => number>();

  constructor(seedString?: string) {
    this.masterSeedString = seedString ?? generateSeedString();
    this.masterSeed = hashSeed(this.masterSeedString);
    this._initSubSeeds();
  }

  private _initSubSeeds(): void {
    const categories: SeedCategory[] = ['shop', 'pack', 'boss', 'loot', 'event', 'deck'];
    for (const cat of categories) {
      // Derive sub-seed by hashing master + category name
      const subSeed = hashSeed(this.masterSeedString + ':' + cat);
      this._rngs.set(cat, mulberry32(subSeed));
    }
  }

  /** Get the next random number [0, 1) for a specific category */
  random(category: SeedCategory): number {
    const rng = this._rngs.get(category);
    if (!rng) throw new Error(`Unknown seed category: ${category}`);
    return rng();
  }

  /** Get a random integer in [min, max] (inclusive) for a category */
  randomInt(category: SeedCategory, min: number, max: number): number {
    return Math.floor(this.random(category) * (max - min + 1)) + min;
  }

  /** Shuffle an array in-place using Fisher-Yates with a specific category's RNG */
  shuffle<T>(category: SeedCategory, array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.random(category) * (i + 1));
      const tmp = array[i];
      array[i] = array[j];
      array[j] = tmp;
    }
    return array;
  }
}

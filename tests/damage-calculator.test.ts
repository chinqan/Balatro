// ============================================================
// Damage Calculator Tests — 4-phase settlement verification
// ============================================================

import { describe, it, expect } from 'vitest';
import { calculateDamage } from '@/systems/damage-calculator';
import type { Card, HandType, RelicInstance } from '@/types';
import { SeedManager } from '@/core/rng';

// Helper to create a simple card
function card(rank: number, suit: string, opts?: Partial<Card>): Card {
  return {
    id: `${rank}${suit[0].toUpperCase()}`,
    rank: rank as Card['rank'],
    suit: suit as Card['suit'],
    enhancement: opts?.enhancement,
    edition: opts?.edition,
    seal: opts?.seal,
    chipBonus: opts?.chipBonus ?? 0,
    isDebuffed: opts?.isDebuffed ?? false,
  };
}

const defaultLevels: Record<HandType, number> = {
  high_card: 1, pair: 1, two_pair: 1, three_of_a_kind: 1,
  straight: 1, flush: 1, full_house: 1, four_of_a_kind: 1,
  straight_flush: 1, royal_flush: 1,
};

const noRelics: RelicInstance[] = [];
const rng = new SeedManager('TESTDMG1');

describe('calculateDamage', () => {
  it('should calculate basic Pair damage correctly', () => {
    // Pair of Kings: Hand base = (10 ATK, ×2 DMG)
    // + King face value 10 + King face value 10
    // Total ATK = 10 + 10 + 10 = 30, DMG = 2
    // Final = 30 × 2 = 60
    const played = [card(13, 'hearts'), card(13, 'spades')];
    const result = calculateDamage(played, [], noRelics, defaultLevels, rng);

    expect(result.handType).toBe('pair');
    expect(result.finalDamage).toBe(60);
  });

  it('should calculate High Card damage', () => {
    // High Card (Ace): Hand base = (5 ATK, ×1 DMG)
    // + Ace face value = 11
    // Total ATK = 5 + 11 = 16, DMG = 1
    // Final = 16 × 1 = 16
    const played = [card(14, 'hearts')];
    const result = calculateDamage(played, [], noRelics, defaultLevels, rng);

    expect(result.handType).toBe('high_card');
    expect(result.finalDamage).toBe(16);
  });

  it('should apply Bonus enhancement (+30 ATK)', () => {
    // Pair of 5s with one Bonus card
    // Base: 10 ATK, ×2 DMG
    // + 5 face (5) + 5 face (5) + 30 bonus
    // Total ATK = 10 + 5 + 5 + 30 = 50, DMG = 2
    // Final = 50 × 2 = 100
    const played = [
      card(5, 'hearts', { enhancement: 'bonus' }),
      card(5, 'spades'),
    ];
    const result = calculateDamage(played, [], noRelics, defaultLevels, rng);

    expect(result.handType).toBe('pair');
    expect(result.finalDamage).toBe(100);
  });

  it('should apply Foil edition (+50 ATK)', () => {
    // Pair of 5s with one Foil card
    // Base: 10 ATK, ×2 DMG
    // + 5 (5) + 50 foil + 5 (5)
    // Total ATK = 10 + 5 + 50 + 5 = 70, DMG = 2
    // Final = 70 × 2 = 140
    const played = [
      card(5, 'hearts', { edition: 'foil' }),
      card(5, 'spades'),
    ];
    const result = calculateDamage(played, [], noRelics, defaultLevels, rng);

    expect(result.handType).toBe('pair');
    expect(result.finalDamage).toBe(140);
  });

  it('should apply Polychrome edition (×1.5 DMG)', () => {
    // Pair of 5s with one Polychrome card
    // Base: 10 ATK, ×2 DMG
    // + 5 (5) → DMG ×1.5 = 3 + 5 (5)
    // Total ATK = 10 + 5 + 5 = 20, DMG = 2 × 1.5 = 3
    // Final = 20 × 3 = 60
    const played = [
      card(5, 'hearts', { edition: 'polychrome' }),
      card(5, 'spades'),
    ];
    const result = calculateDamage(played, [], noRelics, defaultLevels, rng);

    expect(result.handType).toBe('pair');
    expect(result.finalDamage).toBe(60);
  });

  it('should apply Glass enhancement (×2 DMG Mult)', () => {
    // Pair of 5s with one Glass card
    // Base: 10 ATK, ×2 DMG
    // + 5 (5) → ×2 DMG = 4 + 5 (5)
    // Total ATK = 10 + 5 + 5 = 20, DMG = 2 × 2 = 4
    // Final = 20 × 4 = 80
    const played = [
      card(5, 'hearts', { enhancement: 'glass' }),
      card(5, 'spades'),
    ];
    const result = calculateDamage(played, [], noRelics, defaultLevels, rng);

    expect(result.handType).toBe('pair');
    expect(result.finalDamage).toBe(80);
  });

  it('should apply Steel passive (×1.5 DMG from held cards)', () => {
    // High Card (Ace): 5 ATK × 1 DMG + 11 face = 16 ATK
    // + Steel card in hand: ×1.5 DMG → DMG = 1.5
    // Final = 16 × 1.5 = 24
    const played = [card(14, 'hearts')];
    const held = [card(3, 'clubs', { enhancement: 'steel' })];
    const result = calculateDamage(played, held, noRelics, defaultLevels, rng);

    expect(result.finalDamage).toBe(24);
  });

  it('should record settlement steps', () => {
    const played = [card(13, 'hearts'), card(13, 'spades')];
    const result = calculateDamage(played, [], noRelics, defaultLevels, rng);

    // Should have at least: hand type step + 2 card face value steps
    expect(result.steps.length).toBeGreaterThanOrEqual(3);

    // Phase 1 step
    expect(result.steps[0].phase).toBe(1);
    expect(result.steps[0].source).toBe('hand_type');

    // Phase 2 steps
    const phase2Steps = result.steps.filter(s => s.phase === 2);
    expect(phase2Steps.length).toBe(2); // Two Kings face value
  });

  it('should skip debuffed cards', () => {
    // Pair of 5s, but one is debuffed
    const played = [
      card(5, 'hearts', { isDebuffed: true }),
      card(5, 'spades'),
    ];
    // Only one 5 scores, so it's treated as high card (single card)
    const result = calculateDamage(played, [], noRelics, defaultLevels, rng);

    // The debuffed card shouldn't add its face value
    // Non-debuffed 5: contributes to scoring
    // With pair detected but one debuffed, scoring still recognizes pair hand type,
    // but debuffed card doesn't add ATK.
    // Pair base: 10 ATK, 2 DMG. Only one 5 scores: 10+5 = 15, 15×2 = 30
    expect(result.finalDamage).toBe(30);
  });
});

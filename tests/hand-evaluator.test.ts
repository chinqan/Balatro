// ============================================================
// Hand Evaluator Tests — All 10 hand types + edge cases
// ============================================================

import { describe, it, expect } from 'vitest';
import { evaluateHand } from '@/systems/hand-evaluator';
import type { Card, HandType } from '@/types';

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

// Default hand levels: all at 1
const defaultLevels: Record<HandType, number> = {
  high_card: 1, pair: 1, two_pair: 1, three_of_a_kind: 1,
  straight: 1, flush: 1, full_house: 1, four_of_a_kind: 1,
  straight_flush: 1, royal_flush: 1,
};

describe('evaluateHand', () => {
  it('should detect High Card', () => {
    const result = evaluateHand([card(5, 'hearts')], defaultLevels);
    expect(result.handType).toBe('high_card');
    expect(result.baseATK).toBe(5);
    expect(result.baseDMG).toBe(1);
  });

  it('should detect Pair', () => {
    const result = evaluateHand([
      card(10, 'hearts'), card(10, 'spades'),
    ], defaultLevels);
    expect(result.handType).toBe('pair');
    expect(result.scoringCards.length).toBe(2);
    expect(result.baseATK).toBe(10);
    expect(result.baseDMG).toBe(2);
  });

  it('should detect Two Pair', () => {
    const result = evaluateHand([
      card(10, 'hearts'), card(10, 'spades'),
      card(5, 'diamonds'), card(5, 'clubs'),
    ], defaultLevels);
    expect(result.handType).toBe('two_pair');
    expect(result.scoringCards.length).toBe(4);
  });

  it('should detect Three of a Kind', () => {
    const result = evaluateHand([
      card(7, 'hearts'), card(7, 'spades'), card(7, 'diamonds'),
    ], defaultLevels);
    expect(result.handType).toBe('three_of_a_kind');
    expect(result.scoringCards.length).toBe(3);
  });

  it('should detect Straight (consecutive ranks)', () => {
    const result = evaluateHand([
      card(5, 'hearts'), card(6, 'spades'), card(7, 'diamonds'),
      card(8, 'clubs'), card(9, 'hearts'),
    ], defaultLevels);
    expect(result.handType).toBe('straight');
  });

  it('should detect Straight with A-low (wheel: A-2-3-4-5)', () => {
    const result = evaluateHand([
      card(14, 'hearts'), card(2, 'spades'), card(3, 'diamonds'),
      card(4, 'clubs'), card(5, 'hearts'),
    ], defaultLevels);
    expect(result.handType).toBe('straight');
  });

  it('should detect Flush (5 same suit)', () => {
    const result = evaluateHand([
      card(2, 'hearts'), card(5, 'hearts'), card(8, 'hearts'),
      card(10, 'hearts'), card(14, 'hearts'),
    ], defaultLevels);
    expect(result.handType).toBe('flush');
    expect(result.baseATK).toBe(35);
    expect(result.baseDMG).toBe(4);
  });

  it('should detect Full House', () => {
    const result = evaluateHand([
      card(10, 'hearts'), card(10, 'spades'), card(10, 'diamonds'),
      card(5, 'clubs'), card(5, 'hearts'),
    ], defaultLevels);
    expect(result.handType).toBe('full_house');
    expect(result.scoringCards.length).toBe(5);
  });

  it('should detect Four of a Kind', () => {
    const result = evaluateHand([
      card(13, 'hearts'), card(13, 'spades'), card(13, 'diamonds'), card(13, 'clubs'),
    ], defaultLevels);
    expect(result.handType).toBe('four_of_a_kind');
    expect(result.baseATK).toBe(60);
    expect(result.baseDMG).toBe(7);
  });

  it('should detect Straight Flush', () => {
    const result = evaluateHand([
      card(5, 'hearts'), card(6, 'hearts'), card(7, 'hearts'),
      card(8, 'hearts'), card(9, 'hearts'),
    ], defaultLevels);
    expect(result.handType).toBe('straight_flush');
    expect(result.baseATK).toBe(100);
    expect(result.baseDMG).toBe(8);
  });

  it('should detect Royal Flush', () => {
    const result = evaluateHand([
      card(10, 'spades'), card(11, 'spades'), card(12, 'spades'),
      card(13, 'spades'), card(14, 'spades'),
    ], defaultLevels);
    expect(result.handType).toBe('royal_flush');
  });

  it('should prioritize higher hand types', () => {
    // Full house cards also contain a pair and three of a kind
    const result = evaluateHand([
      card(10, 'hearts'), card(10, 'spades'), card(10, 'diamonds'),
      card(5, 'clubs'), card(5, 'hearts'),
    ], defaultLevels);
    expect(result.handType).toBe('full_house');
    // Not 'three_of_a_kind' or 'pair'
  });

  it('should handle Wild cards (count as all suits) for Flush', () => {
    const result = evaluateHand([
      card(2, 'hearts'), card(5, 'hearts'), card(8, 'spades', { enhancement: 'wild' }),
      card(10, 'hearts'), card(14, 'hearts'),
    ], defaultLevels);
    // The wild 8♠ should count as hearts → flush
    expect(result.handType).toBe('flush');
  });

  it('should apply hand level bonuses', () => {
    const levels = { ...defaultLevels, pair: 3 };
    const result = evaluateHand([
      card(10, 'hearts'), card(10, 'spades'),
    ], levels);
    expect(result.handType).toBe('pair');
    // Level 3 pair: base 10 + 15*(3-1) = 40 ATK, base 2 + 1*(3-1) = 4 DMG
    expect(result.baseATK).toBe(40);
    expect(result.baseDMG).toBe(4);
  });
});

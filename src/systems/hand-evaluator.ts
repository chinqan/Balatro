// ============================================================
// Hand Evaluator — Determine the best poker hand from cards
// GDD Phase 1 §2: 10 hand types, priority-ordered
// ============================================================

import type { Card, HandType, Suit } from '@/types';
import { ALL_SUITS, HAND_TYPE_PRIORITY } from '@/types';
import { getHandTypeValues } from '@/data/hand-types';

/**
 * Result of hand evaluation.
 */
export interface EvalResult {
  handType: HandType;
  /** The cards that contribute to scoring */
  scoringCards: Card[];
  /** Base ATK from hand type definition (at given level) */
  baseATK: number;
  /** Base DMG Mult from hand type definition (at given level) */
  baseDMG: number;
}

/**
 * Evaluate the best poker hand from a set of played cards.
 * @param playedCards - Cards the player chose to play (1-5 cards)
 * @param handLevels - Current level for each hand type
 * @returns The best hand type and scoring cards
 */
export function evaluateHand(
  playedCards: Card[],
  handLevels: Record<HandType, number>,
): EvalResult {
  if (playedCards.length === 0) {
    const vals = getHandTypeValues('high_card', handLevels.high_card);
    return { handType: 'high_card', scoringCards: [], baseATK: vals.atk, baseDMG: vals.dmg };
  }

  // Get the effective suits for each card (wild = all suits)
  const effectiveSuits = playedCards.map(c =>
    c.enhancement === 'wild' ? [...ALL_SUITS] : [c.suit]
  );

  // Try each hand type in priority order (highest first)
  for (const ht of HAND_TYPE_PRIORITY) {
    const scoring = checkHandType(ht, playedCards, effectiveSuits);
    if (scoring) {
      const vals = getHandTypeValues(ht, handLevels[ht]);
      return { handType: ht, scoringCards: scoring, baseATK: vals.atk, baseDMG: vals.dmg };
    }
  }

  // Fallback: high card (always matches)
  const vals = getHandTypeValues('high_card', handLevels.high_card);
  // Scoring card = highest rank card
  const sorted = [...playedCards].sort((a, b) => b.rank - a.rank);
  return { handType: 'high_card', scoringCards: [sorted[0]], baseATK: vals.atk, baseDMG: vals.dmg };
}

// ─── Internal hand type checks ──────────────────────────────

function checkHandType(
  handType: HandType,
  cards: Card[],
  effectiveSuits: Suit[][],
): Card[] | null {
  switch (handType) {
    case 'royal_flush': return checkRoyalFlush(cards, effectiveSuits);
    case 'straight_flush': return checkStraightFlush(cards, effectiveSuits);
    case 'four_of_a_kind': return checkNOfAKind(cards, 4);
    case 'full_house': return checkFullHouse(cards);
    case 'flush': return checkFlush(cards, effectiveSuits);
    case 'straight': return checkStraight(cards);
    case 'three_of_a_kind': return checkNOfAKind(cards, 3);
    case 'two_pair': return checkTwoPair(cards);
    case 'pair': return checkNOfAKind(cards, 2);
    case 'high_card': return cards.length >= 1 ? [cards.sort((a, b) => b.rank - a.rank)[0]] : null;
    default: return null;
  }
}

/** Group cards by rank, returns Map<rank, Card[]> */
function groupByRank(cards: Card[]): Map<number, Card[]> {
  const groups = new Map<number, Card[]>();
  for (const card of cards) {
    // Stone cards have no rank for grouping purposes, skip
    if (card.enhancement === 'stone') continue;
    const existing = groups.get(card.rank) ?? [];
    existing.push(card);
    groups.set(card.rank, existing);
  }
  return groups;
}

/** Check if cards share a common suit (considering wild cards) */
function findCommonSuit(cards: Card[], effectiveSuits: Suit[][]): Suit | null {
  if (cards.length === 0) return null;

  for (const suit of ALL_SUITS) {
    let allMatch = true;
    for (let i = 0; i < cards.length; i++) {
      if (!effectiveSuits[i].includes(suit)) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return suit;
  }
  return null;
}

/** Check for N cards of the same rank. Returns scoring cards if found. */
function checkNOfAKind(cards: Card[], n: number): Card[] | null {
  if (cards.length < n) return null;
  const groups = groupByRank(cards);
  for (const [, group] of groups) {
    if (group.length >= n) {
      // Return exactly N cards (highest rank group)
      return group.slice(0, n);
    }
  }
  return null;
}

/** Check for Full House (3 of a kind + pair) */
function checkFullHouse(cards: Card[]): Card[] | null {
  if (cards.length < 5) return null;
  const groups = groupByRank(cards);
  let threeGroup: Card[] | null = null;
  let pairGroup: Card[] | null = null;

  // Sort groups by size descending, then by rank descending
  const sortedGroups = [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length || b[0] - a[0]);

  for (const [, group] of sortedGroups) {
    if (!threeGroup && group.length >= 3) {
      threeGroup = group.slice(0, 3);
    } else if (!pairGroup && group.length >= 2) {
      pairGroup = group.slice(0, 2);
    }
  }

  if (threeGroup && pairGroup) {
    return [...threeGroup, ...pairGroup];
  }
  return null;
}

/** Check for Two Pair */
function checkTwoPair(cards: Card[]): Card[] | null {
  if (cards.length < 4) return null;
  const groups = groupByRank(cards);
  const pairs: Card[][] = [];

  // Find pairs, sorted by rank descending
  const sortedGroups = [...groups.entries()]
    .filter(([, g]) => g.length >= 2)
    .sort((a, b) => b[0] - a[0]);

  for (const [, group] of sortedGroups) {
    pairs.push(group.slice(0, 2));
    if (pairs.length === 2) break;
  }

  if (pairs.length === 2) {
    return [...pairs[0], ...pairs[1]];
  }
  return null;
}

/** Check for Straight (5 consecutive ranks). A can be high or low. */
function checkStraight(cards: Card[]): Card[] | null {
  if (cards.length < 5) return null;

  // Get unique ranks (excluding stone cards)
  const ranks = [...new Set(
    cards.filter(c => c.enhancement !== 'stone').map(c => c.rank)
  )].sort((a, b) => b - a);

  // Check for runs of 5
  // Special case: A-2-3-4-5 (wheel) — A=14, 2, 3, 4, 5
  if (ranks.includes(14) && ranks.includes(2) && ranks.includes(3) && ranks.includes(4) && ranks.includes(5)) {
    return findCardsForRanks(cards, [14, 2, 3, 4, 5]);
  }

  for (let i = 0; i <= ranks.length - 5; i++) {
    const run = ranks.slice(i, i + 5);
    if (run[0] - run[4] === 4) {
      return findCardsForRanks(cards, run);
    }
  }
  return null;
}

/** Check for Flush (5 cards of same suit) */
function checkFlush(cards: Card[], effectiveSuits: Suit[][]): Card[] | null {
  if (cards.length < 5) return null;
  const commonSuit = findCommonSuit(cards, effectiveSuits);
  if (commonSuit) {
    return [...cards]; // All cards contribute
  }
  return null;
}

/** Check for Straight Flush */
function checkStraightFlush(cards: Card[], effectiveSuits: Suit[][]): Card[] | null {
  if (cards.length < 5) return null;
  const flushResult = checkFlush(cards, effectiveSuits);
  if (!flushResult) return null;
  const straightResult = checkStraight(cards);
  if (!straightResult) return null;
  return straightResult; // Return straight cards (they're also flush)
}

/** Check for Royal Flush (10-J-Q-K-A of same suit) */
function checkRoyalFlush(cards: Card[], effectiveSuits: Suit[][]): Card[] | null {
  if (cards.length < 5) return null;
  const sfResult = checkStraightFlush(cards, effectiveSuits);
  if (!sfResult) return null;
  const ranks = sfResult.map(c => c.rank).sort((a, b) => a - b);
  // Royal: 10, 11(J), 12(Q), 13(K), 14(A)
  if (ranks[0] === 10 && ranks[4] === 14) {
    return sfResult;
  }
  return null;
}

/** Find one card per rank from the card list */
function findCardsForRanks(cards: Card[], targetRanks: number[]): Card[] {
  const result: Card[] = [];
  const used = new Set<string>();
  for (const rank of targetRanks) {
    for (const card of cards) {
      if (card.rank === rank && !used.has(card.id) && card.enhancement !== 'stone') {
        result.push(card);
        used.add(card.id);
        break;
      }
    }
  }
  return result;
}

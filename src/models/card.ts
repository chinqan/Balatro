// ============================================================
// Card Model — Factory functions for creating cards
// ============================================================

import type { Card, Suit, Rank } from '@/types';
import { ALL_SUITS, ALL_RANKS, RANK_NAMES, SUIT_SYMBOLS } from '@/types';

/**
 * Create a unique card ID string, e.g. "5S", "KH", "AD"
 */
export function makeCardId(rank: Rank, suit: Suit): string {
  return `${RANK_NAMES[rank]}${SUIT_SYMBOLS[suit]}`;
}

/**
 * Create a single card.
 */
export function createCard(rank: Rank, suit: Suit): Card {
  return {
    id: makeCardId(rank, suit),
    suit,
    rank,
    enhancement: undefined,
    edition: undefined,
    seal: undefined,
    chipBonus: 0,
    isDebuffed: false,
  };
}

/**
 * Create a standard 52-card poker deck (no jokers).
 */
export function createStandardDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      deck.push(createCard(rank, suit));
    }
  }
  return deck;
}

/**
 * Get display string for a card, e.g. "K♥" or "A♠ [Glass|Holo|Red]"
 */
export function cardToString(card: Card): string {
  let str = `${RANK_NAMES[card.rank]}${SUIT_SYMBOLS[card.suit]}`;
  const mods: string[] = [];
  if (card.enhancement) mods.push(card.enhancement);
  if (card.edition) mods.push(card.edition);
  if (card.seal) mods.push(card.seal);
  if (mods.length > 0) {
    str += ` [${mods.join('|')}]`;
  }
  return str;
}

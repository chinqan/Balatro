// ============================================================
// Deck Manager — Draw pile, hand, discard pile management
// GDD Phase 9 §3: Fisher-Yates shuffle, draw, discard, etc.
// ============================================================

import type { Card, Suit, Rank } from '@/types';
import { ALL_RANKS } from '@/types';
import type { SeedManager } from '@/core/rng';

export interface DeckState {
  drawPile: Card[];
  hand: Card[];
  discardPile: Card[];
  destroyed: Card[];
}

export class DeckManager {
  private _state: DeckState;

  constructor(initialDeck: Card[]) {
    this._state = {
      drawPile: [...initialDeck],
      hand: [],
      discardPile: [],
      destroyed: [],
    };
  }

  get state(): Readonly<DeckState> {
    return this._state;
  }

  get drawPileSize(): number { return this._state.drawPile.length; }
  get handSize(): number { return this._state.hand.length; }
  get discardPileSize(): number { return this._state.discardPile.length; }
  get totalCards(): number {
    return this._state.drawPile.length + this._state.hand.length + this._state.discardPile.length;
  }

  /**
   * Shuffle the draw pile using Fisher-Yates with the given RNG.
   */
  shuffle(rng: SeedManager): void {
    rng.shuffle('deck', this._state.drawPile);
  }

  /**
   * Draw N cards from draw pile to hand.
   * If draw pile runs out, shuffle discard pile back into draw pile.
   */
  draw(count: number, rng: SeedManager): Card[] {
    const drawn: Card[] = [];
    for (let i = 0; i < count; i++) {
      if (this._state.drawPile.length === 0) {
        if (this._state.discardPile.length === 0) break; // No cards left anywhere
        // Move discard pile → draw pile and shuffle
        this._state.drawPile = [...this._state.discardPile];
        this._state.discardPile = [];
        this.shuffle(rng);
      }
      const card = this._state.drawPile.pop()!;
      this._state.hand.push(card);
      drawn.push(card);
    }
    return drawn;
  }

  /**
   * Play specific cards from hand (by indices). Returns played cards.
   * Cards are removed from hand (they go to settlement, then discard).
   */
  playCards(indices: number[]): Card[] {
    // Sort descending to remove from end first (avoids index shifting)
    const sorted = [...indices].sort((a, b) => b - a);
    const played: Card[] = [];
    for (const idx of sorted) {
      if (idx >= 0 && idx < this._state.hand.length) {
        played.unshift(this._state.hand.splice(idx, 1)[0]);
      }
    }
    return played;
  }

  /**
   * Move played cards to discard pile (called after settlement).
   */
  discardCards(cards: Card[]): void {
    this._state.discardPile.push(...cards);
  }

  /**
   * Discard specific hand cards by indices (player's discard action).
   */
  discardFromHand(indices: number[]): Card[] {
    const sorted = [...indices].sort((a, b) => b - a);
    const discarded: Card[] = [];
    for (const idx of sorted) {
      if (idx >= 0 && idx < this._state.hand.length) {
        discarded.unshift(this._state.hand.splice(idx, 1)[0]);
      }
    }
    this._state.discardPile.push(...discarded);
    return discarded;
  }

  /**
   * Permanently remove a card from wherever it is (deck compression).
   */
  removeCard(cardId: string): Card | null {
    for (const pile of [this._state.drawPile, this._state.hand, this._state.discardPile]) {
      const idx = pile.findIndex(c => c.id === cardId);
      if (idx !== -1) {
        const [removed] = pile.splice(idx, 1);
        this._state.destroyed.push(removed);
        return removed;
      }
    }
    return null;
  }

  /**
   * Add a new card to the discard pile (deck expansion).
   */
  addCard(card: Card): void {
    this._state.discardPile.push(card);
  }

  /**
   * Move all hand cards to discard pile (round reset).
   */
  discardAllHand(): void {
    this._state.discardPile.push(...this._state.hand);
    this._state.hand = [];
  }

  /**
   * Get suit distribution across all active piles (draw + hand + discard).
   */
  getSuitDistribution(): Record<Suit, number> {
    const dist: Record<Suit, number> = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
    const allCards = [...this._state.drawPile, ...this._state.hand, ...this._state.discardPile];
    for (const card of allCards) {
      // Stone cards have no suit, skip them
      if (card.enhancement === 'stone') continue;
      dist[card.suit]++;
    }
    return dist;
  }

  /**
   * Get rank distribution across all active piles.
   */
  getRankDistribution(): Record<Rank, number> {
    const dist = {} as Record<Rank, number>;
    for (const rank of ALL_RANKS) {
      dist[rank] = 0;
    }
    const allCards = [...this._state.drawPile, ...this._state.hand, ...this._state.discardPile];
    for (const card of allCards) {
      if (card.enhancement === 'stone') continue;
      dist[card.rank]++;
    }
    return dist;
  }

  /**
   * Get full list of all active cards grouped by suit.
   */
  getAllActiveCards(): Card[] {
    return [...this._state.drawPile, ...this._state.hand, ...this._state.discardPile];
  }

  /**
   * Serialize state for save/load.
   */
  serialize(): DeckState {
    return JSON.parse(JSON.stringify(this._state));
  }

  /**
   * Restore from serialized state.
   */
  static deserialize(state: DeckState): DeckManager {
    const dm = new DeckManager([]);
    dm._state = JSON.parse(JSON.stringify(state));
    return dm;
  }
}

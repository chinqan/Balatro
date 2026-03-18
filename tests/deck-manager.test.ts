// ============================================================
// Deck Manager Tests — Draw, discard, shuffle, compression
// ============================================================

import { describe, it, expect } from 'vitest';
import { DeckManager } from '@/systems/deck-manager';
import { createStandardDeck } from '@/models/card';
import { SeedManager } from '@/core/rng';

describe('DeckManager', () => {
  const createTestDeck = () => new DeckManager(createStandardDeck());
  const rng = () => new SeedManager('DECKTEST');

  it('should initialize with 52 cards in draw pile', () => {
    const dm = createTestDeck();
    expect(dm.drawPileSize).toBe(52);
    expect(dm.handSize).toBe(0);
    expect(dm.discardPileSize).toBe(0);
  });

  it('should shuffle deterministically with same seed', () => {
    const dm1 = createTestDeck();
    const dm2 = createTestDeck();

    dm1.shuffle(rng());
    dm2.shuffle(rng());

    expect(dm1.state.drawPile.map(c => c.id))
      .toEqual(dm2.state.drawPile.map(c => c.id));
  });

  it('should draw cards from draw pile to hand', () => {
    const dm = createTestDeck();
    dm.shuffle(rng());
    const drawn = dm.draw(8, rng());

    expect(drawn.length).toBe(8);
    expect(dm.handSize).toBe(8);
    expect(dm.drawPileSize).toBe(44);
  });

  it('should auto-shuffle discard pile when draw pile is empty', () => {
    const dm = createTestDeck();
    const r = rng();
    dm.shuffle(r);

    // Draw all 52
    dm.draw(52, r);
    expect(dm.drawPileSize).toBe(0);
    expect(dm.handSize).toBe(52);

    // Discard all
    dm.discardAllHand();
    expect(dm.discardPileSize).toBe(52);
    expect(dm.handSize).toBe(0);

    // Draw again — should auto-reshuffle
    const drawn = dm.draw(8, r);
    expect(drawn.length).toBe(8);
    expect(dm.handSize).toBe(8);
    expect(dm.drawPileSize).toBe(44);
    expect(dm.discardPileSize).toBe(0);
  });

  it('should play cards from hand', () => {
    const dm = createTestDeck();
    dm.shuffle(rng());
    dm.draw(8, rng());

    const played = dm.playCards([0, 2, 4]);
    expect(played.length).toBe(3);
    expect(dm.handSize).toBe(5);
  });

  it('should discard from hand', () => {
    const dm = createTestDeck();
    dm.shuffle(rng());
    dm.draw(8, rng());

    const discarded = dm.discardFromHand([1, 3]);
    expect(discarded.length).toBe(2);
    expect(dm.handSize).toBe(6);
    expect(dm.discardPileSize).toBe(2);
  });

  it('should remove card permanently (deck compression)', () => {
    const dm = createTestDeck();
    dm.shuffle(rng());
    dm.draw(8, rng());

    const firstCard = dm.state.hand[0];
    const removed = dm.removeCard(firstCard.id);
    expect(removed).not.toBeNull();
    expect(removed!.id).toBe(firstCard.id);
    expect(dm.handSize).toBe(7);
    expect(dm.totalCards).toBe(51);
    expect(dm.state.destroyed.length).toBe(1);
  });

  it('should add card to discard pile (deck expansion)', () => {
    const dm = createTestDeck();
    dm.addCard({
      id: 'EXTRA', rank: 14, suit: 'hearts',
      chipBonus: 0, isDebuffed: false,
    });
    expect(dm.totalCards).toBe(53);
    expect(dm.discardPileSize).toBe(1);
  });

  it('should calculate suit distribution', () => {
    const dm = createTestDeck();
    const dist = dm.getSuitDistribution();

    expect(dist.spades).toBe(13);
    expect(dist.hearts).toBe(13);
    expect(dist.diamonds).toBe(13);
    expect(dist.clubs).toBe(13);
  });

  it('should calculate rank distribution', () => {
    const dm = createTestDeck();
    const dist = dm.getRankDistribution();

    // Each rank appears 4 times (one per suit)
    expect(dist[14]).toBe(4); // Aces
    expect(dist[2]).toBe(4);  // Twos
    expect(dist[13]).toBe(4); // Kings
  });

  it('should serialize and deserialize', () => {
    const dm = createTestDeck();
    dm.shuffle(rng());
    dm.draw(8, rng());

    const serialized = dm.serialize();
    const restored = DeckManager.deserialize(serialized);

    expect(restored.drawPileSize).toBe(dm.drawPileSize);
    expect(restored.handSize).toBe(dm.handSize);
    expect(restored.state.hand.map(c => c.id))
      .toEqual(dm.state.hand.map(c => c.id));
  });
});

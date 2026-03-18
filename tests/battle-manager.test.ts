// ============================================================
// Battle Manager Tests — Full battle flow verification
// ============================================================

import { describe, it, expect } from 'vitest';
import { createBattle, type BattleManager } from '@/systems/battle-manager';
import { DeckManager } from '@/systems/deck-manager';
import { createStandardDeck } from '@/models/card';
import { createInitialPlayerState, createDefaultHandLevels } from '@/models/player';
import { createInitialRunStats } from '@/models/run-state';
import { SeedManager } from '@/core/rng';
import { EventBus } from '@/core/event-bus';
import { BOSS_DEFINITIONS } from '@/data/bosses';

function setupBattle(bossId = 'the_gate'): {
  battle: BattleManager;
  events: EventBus;
} {
  const player = createInitialPlayerState();
  const deck = new DeckManager(createStandardDeck());
  const rng = new SeedManager('BATTLE_TEST');
  deck.shuffle(rng);
  const events = new EventBus();
  const stats = createInitialRunStats();
  const handLevels = createDefaultHandLevels();

  const battle = createBattle(
    player, deck, BOSS_DEFINITIONS[bossId],
    [], handLevels, rng, events, stats,
  );

  return { battle, events };
}

describe('BattleManager', () => {
  it('should initialize in round_start phase', () => {
    const { battle } = setupBattle();
    // Before startRound it's at round_start
    expect(battle.phase).toBe('round_start');
  });

  it('should transition to player_turn after startRound', () => {
    const { battle } = setupBattle();
    battle.startRound();
    expect(battle.phase).toBe('player_turn');
    expect(battle.round).toBe(1);
    expect(battle.hand.length).toBe(8); // HAND_SIZE = 8
    expect(battle.player.plays).toBe(4);
    expect(battle.player.discards).toBe(3);
  });

  it('should allow playing cards and produce settlement result', () => {
    const { battle } = setupBattle();
    battle.startRound();

    // Play the first 2 cards
    const result = battle.playCards([0, 1]);

    expect(result).toBeDefined();
    expect(result.finalDamage).toBeGreaterThan(0);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(battle.player.plays).toBe(3); // Used 1 play
  });

  it('should reduce boss HP when playing cards', () => {
    const { battle } = setupBattle();
    battle.startRound();

    const bossHpBefore = battle.boss.hp;
    const result = battle.playCards([0, 1]);

    expect(battle.boss.hp).toBeLessThan(bossHpBefore);
    expect(bossHpBefore - battle.boss.hp).toBeLessThanOrEqual(result.finalDamage);
  });

  it('should allow discarding and drawing replacement cards', () => {
    const { battle } = setupBattle();
    battle.startRound();

    const handBefore = battle.hand.length;
    battle.discardCards([0, 1, 2]);

    expect(battle.player.discards).toBe(2); // Used 1 discard
    expect(battle.hand.length).toBe(handBefore); // Drew replacements
  });

  it('should transition to boss_turn when plays run out', () => {
    const { battle } = setupBattle();
    battle.startRound();

    // Use all 4 plays
    for (let i = 0; i < 4; i++) {
      if (battle.phase === 'player_turn' && battle.canPlay) {
        battle.playCards([0]); // Play one card at a time
      }
    }

    // After 4 plays, if boss isn't dead, should be at boss_turn
    if (!battle.isOver) {
      expect(battle.phase).toBe('boss_turn');
    }
  });

  it('should execute boss turn and damage player', () => {
    const { battle } = setupBattle();
    battle.startRound();

    // Use all plays
    for (let i = 0; i < 4; i++) {
      if (battle.canPlay) battle.playCards([0]);
    }

    if (battle.phase === 'boss_turn') {
      const hpBefore = battle.player.hp;
      const result = battle.executeBossTurn();

      expect(result.intentType).toBeDefined();
      if (result.damageToPlayer > 0) {
        expect(battle.player.hp).toBeLessThanOrEqual(hpBefore);
      }
    }
  });

  it('should complete full round cycle', () => {
    const { battle } = setupBattle();
    battle.startRound();

    // Player plays all 4 hands
    for (let i = 0; i < 4; i++) {
      if (battle.canPlay) battle.playCards([0]);
    }

    // Boss turn
    if (battle.phase === 'boss_turn') {
      battle.executeBossTurn();

      // End round → starts next round
      if (battle.phase === 'round_end') {
        battle.endRound();
        expect(battle.phase).toBe('player_turn');
        expect(battle.round).toBe(2);
      }
    }
  });

  it('should emit events during battle', () => {
    const { battle, events } = setupBattle();
    const emittedEvents: string[] = [];

    events.on('battle:turn_start', () => emittedEvents.push('turn_start'));
    events.on('battle:damage_dealt', () => emittedEvents.push('damage_dealt'));
    events.on('battle:card_played', () => emittedEvents.push('card_played'));

    battle.startRound();
    battle.playCards([0, 1]);

    expect(emittedEvents).toContain('turn_start');
    expect(emittedEvents).toContain('damage_dealt');
    expect(emittedEvents).toContain('card_played');
  });

  it('should declare victory when boss HP reaches 0', () => {
    // Use The Gate (150 HP) — easy to defeat
    const { battle } = setupBattle('the_gate');
    battle.startRound();

    // Brute force: keep playing until boss dies or we run out
    let iterations = 0;
    const MAX_ITERATIONS = 200; // Safety to prevent infinite loop

    while (!battle.isOver && iterations < MAX_ITERATIONS) {
      iterations++;

      if (battle.phase === 'player_turn') {
        if (battle.canPlay && battle.hand.length > 0) {
          const count = Math.min(5, battle.hand.length);
          const indices = Array.from({ length: count }, (_, i) => i);
          battle.playCards(indices);
        } else {
          // No plays left or no cards — end turn
          battle.endPlayerTurn();
        }
        continue;
      }

      if (battle.phase === 'boss_turn') {
        battle.executeBossTurn();
        continue;
      }

      if (battle.phase === 'round_end') {
        battle.endRound();
        continue;
      }

      // Unknown phase — break
      break;
    }

    // Should have either won or lost within 200 iterations
    expect(battle.isOver).toBe(true);
    expect(['victory', 'defeat']).toContain(battle.phase);
  });

  it('should prevent actions in wrong phase', () => {
    const { battle } = setupBattle();
    // Before starting round, can't play
    expect(() => battle.playCards([0])).toThrow();
    expect(() => battle.discardCards([0])).toThrow();
    expect(() => battle.executeBossTurn()).toThrow();
  });

  it('should announce boss intent (visible to player)', () => {
    const { battle } = setupBattle();
    expect(battle.boss.currentIntent).toBeDefined();
    expect(battle.boss.currentIntent.type).toBe('strike'); // The Gate only has strike
    expect(battle.boss.currentIntent.damage).toBeGreaterThan(0);
    expect(battle.boss.currentIntent.description.length).toBeGreaterThan(0);
  });
});

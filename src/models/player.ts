// ============================================================
// Player State Model — HP, Shield, Money, Resources
// GDD Phase 1 §3: Player defense & resources
// ============================================================

import type { PlayerState, HandType } from '@/types';
import { CONFIG } from '@/data/config';

/**
 * Create the initial player state for a new Run.
 */
export function createInitialPlayerState(): PlayerState {
  return {
    hp: CONFIG.INITIAL_HP,
    maxHp: CONFIG.INITIAL_HP,
    shield: 0,
    money: 0,
    plays: CONFIG.INITIAL_PLAYS,
    discards: CONFIG.INITIAL_DISCARDS,
    handSize: CONFIG.HAND_SIZE,
  };
}

/**
 * Create default hand levels (all Lv.1).
 */
export function createDefaultHandLevels(): Record<HandType, number> {
  return {
    high_card: 1,
    pair: 1,
    two_pair: 1,
    three_of_a_kind: 1,
    straight: 1,
    flush: 1,
    full_house: 1,
    four_of_a_kind: 1,
    straight_flush: 1,
    royal_flush: 1,
  };
}

/**
 * Apply damage to player, accounting for shield first.
 * Returns actual HP lost.
 */
export function applyDamageToPlayer(
  player: PlayerState,
  rawDamage: number,
): { hpLost: number; shieldAbsorbed: number } {
  let remaining = rawDamage;
  let shieldAbsorbed = 0;

  // Shield absorbs first
  if (player.shield > 0) {
    shieldAbsorbed = Math.min(player.shield, remaining);
    player.shield -= shieldAbsorbed;
    remaining -= shieldAbsorbed;
  }

  // Remaining damage hits HP
  const hpLost = Math.min(player.hp, remaining);
  player.hp -= hpLost;

  return { hpLost, shieldAbsorbed };
}

/**
 * Add shield to player (capped at SHIELD_HARD_CAP).
 */
export function addShield(player: PlayerState, amount: number): number {
  const before = player.shield;
  player.shield = Math.min(player.shield + amount, CONFIG.SHIELD_HARD_CAP);
  return player.shield - before; // Actual amount added
}

/**
 * Heal player HP (capped at maxHp).
 */
export function healPlayer(player: PlayerState, amount: number): number {
  const before = player.hp;
  player.hp = Math.min(player.hp + amount, player.maxHp);
  return player.hp - before;
}

/**
 * Reset per-round resources (plays, discards, shield).
 */
export function resetRoundResources(player: PlayerState): void {
  player.plays = CONFIG.INITIAL_PLAYS;
  player.discards = CONFIG.INITIAL_DISCARDS;
  if (CONFIG.SHIELD_RESET_PER_ROUND) {
    player.shield = 0;
  }
}

/**
 * Calculate interest from held money.
 * +1 per 5 gold, max 5.
 */
export function calculateInterest(money: number): number {
  return Math.min(Math.floor(money / 5) * CONFIG.INTEREST_PER_5_GOLD, CONFIG.INTEREST_CAP);
}

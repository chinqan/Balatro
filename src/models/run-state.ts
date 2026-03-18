// ============================================================
// Run State — Complete state for a single game run
// GDD Phase 9 §1.2: Everything needed for save/load
// ============================================================

import type { PlayerState, HandType, RelicInstance } from '@/types';
import type { DeckState } from '@/systems/deck-manager';
import type { BossState } from '@/models/boss';

export type EncounterType = 'standard' | 'elite' | 'boss';

export interface RunState {
  /** Seed string for reproducibility */
  seed: string;
  /** Current dungeon floor (1-8) */
  floor: number;
  /** Current encounter within the floor (0-2) */
  encounter: number;
  /** Current encounter type */
  encounterType: EncounterType;
  /** Player state */
  player: PlayerState;
  /** Deck state (serializable) */
  deck: DeckState;
  /** Hand type levels */
  handLevels: Record<HandType, number>;
  /** Active relics */
  relics: RelicInstance[];
  /** Active blessings IDs */
  blessings: string[];
  /** Boss state (only during battle) */
  boss: BossState | null;
  /** Per-run statistics */
  stats: RunStats;
  /** Timestamp */
  timestamp: number;
}

export interface RunStats {
  highestSingleDamage: number;
  totalDamage: number;
  longestChain: number;
  mostUsedHandType: HandType;
  handTypeUsage: Record<HandType, number>;
  bossesDefeated: number;
  moneyEarned: number;
  moneySpent: number;
  currentFloor: number;
}

export function createInitialRunStats(): RunStats {
  const handTypeUsage: Record<HandType, number> = {
    high_card: 0, pair: 0, two_pair: 0, three_of_a_kind: 0,
    straight: 0, flush: 0, full_house: 0, four_of_a_kind: 0,
    straight_flush: 0, royal_flush: 0,
  };

  return {
    highestSingleDamage: 0,
    totalDamage: 0,
    longestChain: 0,
    mostUsedHandType: 'high_card',
    handTypeUsage,
    bossesDefeated: 0,
    moneyEarned: 0,
    moneySpent: 0,
    currentFloor: 1,
  };
}

/**
 * Update run stats after a damage settlement.
 */
export function updateStatsAfterSettlement(
  stats: RunStats,
  damage: number,
  handType: HandType,
  chainLength: number,
): void {
  stats.highestSingleDamage = Math.max(stats.highestSingleDamage, damage);
  stats.totalDamage += damage;
  stats.longestChain = Math.max(stats.longestChain, chainLength);
  stats.handTypeUsage[handType]++;

  // Recalculate most used hand type
  let maxUse = 0;
  for (const [ht, count] of Object.entries(stats.handTypeUsage)) {
    if (count > maxUse) {
      maxUse = count;
      stats.mostUsedHandType = ht as HandType;
    }
  }
}

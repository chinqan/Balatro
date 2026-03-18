// ============================================================
// Hand Type Data — Base values + level-up curves
// GDD Phase 1 §1.3 + §1.4
// ============================================================

import type { HandType } from '@/types';

export interface HandTypeDefinition {
  name: string;
  baseATK: number;
  baseDMG: number;
  /** ATK added per level-up */
  levelUpATK: number;
  /** DMG Mult added per level-up */
  levelUpDMG: number;
  /** Minimum number of cards to form this hand */
  minCards: number;
}

export const HAND_TYPE_DATA: Record<HandType, HandTypeDefinition> = {
  high_card: {
    name: '高牌 (High Card)',
    baseATK: 5,
    baseDMG: 1,
    levelUpATK: 10,
    levelUpDMG: 1,
    minCards: 1,
  },
  pair: {
    name: '對子 (Pair)',
    baseATK: 10,
    baseDMG: 2,
    levelUpATK: 15,
    levelUpDMG: 1,
    minCards: 2,
  },
  two_pair: {
    name: '兩對 (Two Pair)',
    baseATK: 20,
    baseDMG: 2,
    levelUpATK: 20,
    levelUpDMG: 1,
    minCards: 4,
  },
  three_of_a_kind: {
    name: '三條 (Three of a Kind)',
    baseATK: 30,
    baseDMG: 3,
    levelUpATK: 20,
    levelUpDMG: 2,
    minCards: 3,
  },
  straight: {
    name: '順子 (Straight)',
    baseATK: 30,
    baseDMG: 4,
    levelUpATK: 30,
    levelUpDMG: 3,
    minCards: 5,
  },
  flush: {
    name: '同花 (Flush)',
    baseATK: 35,
    baseDMG: 4,
    levelUpATK: 15,
    levelUpDMG: 2,
    minCards: 5,
  },
  full_house: {
    name: '葫蘆 (Full House)',
    baseATK: 40,
    baseDMG: 4,
    levelUpATK: 25,
    levelUpDMG: 2,
    minCards: 5,
  },
  four_of_a_kind: {
    name: '四條 (Four of a Kind)',
    baseATK: 60,
    baseDMG: 7,
    levelUpATK: 30,
    levelUpDMG: 3,
    minCards: 4,
  },
  straight_flush: {
    name: '同花順 (Straight Flush)',
    baseATK: 100,
    baseDMG: 8,
    levelUpATK: 40,
    levelUpDMG: 4,
    minCards: 5,
  },
  royal_flush: {
    name: '皇家同花順 (Royal Flush)',
    baseATK: 100,
    baseDMG: 8,
    levelUpATK: 40,
    levelUpDMG: 4,
    minCards: 5,
  },
};

/**
 * Calculate hand type base values at a given level.
 * Level 1 = base values, each level adds levelUp amounts.
 */
export function getHandTypeValues(
  handType: HandType,
  level: number,
): { atk: number; dmg: number } {
  const def = HAND_TYPE_DATA[handType];
  const lvl = Math.max(1, level);
  return {
    atk: def.baseATK + def.levelUpATK * (lvl - 1),
    dmg: def.baseDMG + def.levelUpDMG * (lvl - 1),
  };
}

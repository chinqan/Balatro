// ============================================================
// Boss Definitions — 8 Floor Bosses
// GDD Phase 2 §2.3: Boss Type Matrix
// ============================================================

import type { BossDefinition } from '@/types';

export const BOSS_DEFINITIONS: Record<string, BossDefinition> = {
  the_gate: {
    id: 'the_gate',
    name: 'The Gate',
    floor: 1,
    baseHp: 150,
    baseAtk: 10,
    mechanics: [],
    intents: ['strike'],
  },
  the_mask: {
    id: 'the_mask',
    name: 'The Mask',
    floor: 2,
    baseHp: 300,
    baseAtk: 15,
    mechanics: ['face_down'],
    intents: ['strike', 'debuff'],
  },
  the_mirror: {
    id: 'the_mirror',
    name: 'The Mirror',
    floor: 3,
    baseHp: 600,
    baseAtk: 20,
    mechanics: ['suit_block'],
    intents: ['strike', 'shield'],
  },
  the_chain: {
    id: 'the_chain',
    name: 'The Chain',
    floor: 4,
    baseHp: 1200,
    baseAtk: 30,
    mechanics: ['action_limit'],
    intents: ['heavy'],
  },
  the_tyrant: {
    id: 'the_tyrant',
    name: 'The Tyrant',
    floor: 5,
    baseHp: 2500,
    baseAtk: 40,
    mechanics: ['hand_block'],
    intents: ['aoe', 'strike'],
  },
  the_void: {
    id: 'the_void',
    name: 'The Void',
    floor: 6,
    baseHp: 5000,
    baseAtk: 55,
    mechanics: ['relic_silence'],
    intents: ['debuff', 'heavy'],
  },
  the_scale: {
    id: 'the_scale',
    name: 'The Scale',
    floor: 7,
    baseHp: 10000,
    baseAtk: 70,
    mechanics: ['damage_cap'],
    intents: ['shield', 'heal', 'strike'],
  },
  the_end: {
    id: 'the_end',
    name: 'The End',
    floor: 8,
    baseHp: 25000,
    baseAtk: 100,
    mechanics: ['suit_block', 'action_limit'],
    intents: ['strike', 'heavy', 'aoe'],
  },
};

/**
 * Standard enemy HP by floor (GDD Phase 2 §1.2)
 */
export const FLOOR_ENEMY_HP: Record<number, { standard: number; elite: number; boss: number }> = {
  1: { standard: 50,   elite: 0,     boss: 150 },
  2: { standard: 80,   elite: 120,   boss: 300 },
  3: { standard: 120,  elite: 200,   boss: 600 },
  4: { standard: 200,  elite: 350,   boss: 1200 },
  5: { standard: 350,  elite: 600,   boss: 2500 },
  6: { standard: 600,  elite: 1000,  boss: 5000 },
  7: { standard: 1000, elite: 1800,  boss: 10000 },
  8: { standard: 1800, elite: 3000,  boss: 25000 },
};

/** Get the boss definition for a given floor */
export function getBossForFloor(floor: number): BossDefinition | undefined {
  return Object.values(BOSS_DEFINITIONS).find(b => b.floor === floor);
}

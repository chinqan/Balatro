// ============================================================
// Boss State Model — Runtime boss instance during battle
// ============================================================

import type { BossDefinition, BossIntentType, BossMechanic, Suit, HandType } from '@/types';
import type { SeedManager } from '@/core/rng';

export interface BossState {
  definition: BossDefinition;
  hp: number;
  maxHp: number;
  shield: number;
  /** The current announced intent for next turn */
  currentIntent: BossIntent;
  /** Active mechanics applied to this battle */
  activeMechanics: BossMechanicState[];
  /** Turn counter */
  turn: number;
}

export interface BossIntent {
  type: BossIntentType;
  /** Damage value (for strike/heavy/aoe) */
  damage: number;
  /** Description for UI display */
  description: string;
}

export interface BossMechanicState {
  type: BossMechanic;
  /** Extra data: e.g. which suit is blocked, which hand type is blocked */
  value?: string;
}

/**
 * Create a boss instance for battle from a definition.
 */
export function createBossState(def: BossDefinition, rng: SeedManager): BossState {
  const state: BossState = {
    definition: def,
    hp: def.baseHp,
    maxHp: def.baseHp,
    shield: 0,
    currentIntent: { type: 'strike', damage: 0, description: '' },
    activeMechanics: [],
    turn: 0,
  };

  // Apply permanent mechanics
  for (const mech of def.mechanics) {
    state.activeMechanics.push(createMechanicState(mech, rng));
  }

  // Generate first intent
  state.currentIntent = generateNextIntent(state, rng);

  return state;
}

/**
 * Create a mechanic state with randomized parameters.
 */
function createMechanicState(type: BossMechanic, _rng: SeedManager): BossMechanicState {
  switch (type) {
    case 'suit_block': {
      const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
      const blocked = suits[Math.floor(_rng.random('boss') * suits.length)];
      return { type, value: blocked };
    }
    case 'hand_block': {
      const hands: HandType[] = ['pair', 'two_pair', 'three_of_a_kind', 'flush'];
      const blocked = hands[Math.floor(_rng.random('boss') * hands.length)];
      return { type, value: blocked };
    }
    case 'face_down':
      return { type, value: '2' }; // Number of face-down cards
    case 'action_limit':
      return { type, value: '-1' }; // Reduce plays by 1
    case 'damage_cap':
      return { type, value: '500' }; // Max damage per play
    case 'relic_silence': {
      return { type, value: '3' }; // Number of silenced relics
    }
    default:
      return { type };
  }
}

/**
 * Generate the boss's next intent based on available patterns.
 */
export function generateNextIntent(boss: BossState, _rng: SeedManager): BossIntent {
  const def = boss.definition;
  const availableIntents = def.intents;

  // Simple weighting: cycle through intents based on turn number, with some randomness
  const idx = boss.turn % availableIntents.length;
  const intentType = availableIntents[idx];

  return createIntent(intentType, def.baseAtk, boss.turn);
}

/**
 * Create a specific intent with calculated damage.
 */
function createIntent(type: BossIntentType, baseAtk: number, turn: number): BossIntent {
  // Slight scaling per turn (+10% per turn after turn 3)
  const scaling = turn > 3 ? 1 + (turn - 3) * 0.1 : 1;

  switch (type) {
    case 'strike':
      return {
        type: 'strike',
        damage: Math.floor(baseAtk * scaling),
        description: `普攻 — 造成 ${Math.floor(baseAtk * scaling)} 傷害`,
      };
    case 'heavy':
      return {
        type: 'heavy',
        damage: Math.floor(baseAtk * 2 * scaling),
        description: `重擊 — 蓄力，造成 ${Math.floor(baseAtk * 2 * scaling)} 傷害`,
      };
    case 'aoe':
      return {
        type: 'aoe',
        damage: Math.floor(baseAtk * 1.5 * scaling),
        description: `AOE — 對 HP 與護盾造成 ${Math.floor(baseAtk * 1.5 * scaling)} 傷害`,
      };
    case 'debuff':
      return {
        type: 'debuff',
        damage: 0,
        description: '減益 — 施加負面狀態',
      };
    case 'shield':
      return {
        type: 'shield',
        damage: 0,
        description: `護盾 — 為自己添加 ${Math.floor(baseAtk * 2)} 護盾`,
      };
    case 'heal':
      return {
        type: 'heal',
        damage: 0,
        description: `回復 — 回復 ${Math.floor(baseAtk * 1.5)} HP`,
      };
  }
}

/**
 * Apply damage to boss. Returns actual damage dealt.
 */
export function applyDamageToBoss(boss: BossState, damage: number): {
  damageDealt: number;
  shieldBroken: number;
  overkill: number;
} {
  let remaining = damage;
  let shieldBroken = 0;

  // Check damage cap mechanic
  const damageCap = boss.activeMechanics.find(m => m.type === 'damage_cap');
  if (damageCap) {
    remaining = Math.min(remaining, parseInt(damageCap.value ?? '9999'));
  }

  // Shield absorbs first
  if (boss.shield > 0) {
    shieldBroken = Math.min(boss.shield, remaining);
    boss.shield -= shieldBroken;
    remaining -= shieldBroken;
  }

  // Remaining hits HP
  const damageDealt = Math.min(boss.hp, remaining);
  boss.hp -= damageDealt;

  const overkill = Math.max(0, remaining - damageDealt);

  return { damageDealt, shieldBroken, overkill };
}

/**
 * Execute boss intent (boss takes its turn action).
 */
export function executeBossIntent(boss: BossState): {
  type: BossIntentType;
  damage: number;
  shieldAdded: number;
  hpHealed: number;
} {
  const intent = boss.currentIntent;
  let damage = 0;
  let shieldAdded = 0;
  let hpHealed = 0;

  switch (intent.type) {
    case 'strike':
    case 'heavy':
    case 'aoe':
      damage = intent.damage;
      break;
    case 'shield':
      shieldAdded = Math.floor(boss.definition.baseAtk * 2);
      boss.shield += shieldAdded;
      break;
    case 'heal':
      hpHealed = Math.floor(boss.definition.baseAtk * 1.5);
      boss.hp = Math.min(boss.hp + hpHealed, boss.maxHp);
      break;
    case 'debuff':
      // Debuff effects handled by battle manager
      break;
  }

  return { type: intent.type, damage, shieldAdded, hpHealed };
}

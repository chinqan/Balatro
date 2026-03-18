// ============================================================
// Relic Data — Stub definitions for prototype relics
// GDD Phase 1 §2: Relic tiers &amp; effects
// ============================================================

import type { RelicDefinition } from '@/types';

export const RELIC_DEFINITIONS: RelicDefinition[] = [
  // ─── Common ──────────────────────────────────────────
  {
    id: 'iron_knuckle',
    name: '鐵拳',
    description: '每次出牌後 ATK +10',
    rarity: 'common',
    tier: 1,
    effect: { type: 'on_play', stat: 'atk', value: 10 },
    price: 4,
  },
  {
    id: 'lucky_coin',
    name: '幸運硬幣',
    description: '每場戰鬥結束後 +3 金',
    rarity: 'common',
    tier: 1,
    effect: { type: 'on_battle_end', stat: 'money', value: 3 },
    price: 5,
  },
  {
    id: 'pocket_watch',
    name: '懷錶',
    description: '每回合開始時棄牌次數 +1',
    rarity: 'common',
    tier: 1,
    effect: { type: 'on_round_start', stat: 'discards', value: 1 },
    price: 5,
  },
  {
    id: 'shield_amulet',
    name: '護盾護符',
    description: '每回合開始時獲得 5 護盾',
    rarity: 'common',
    tier: 1,
    effect: { type: 'on_round_start', stat: 'shield', value: 5 },
    price: 6,
  },
  {
    id: 'magnifying_glass',
    name: '放大鏡',
    description: '手牌判定時 +20 ATK',
    rarity: 'common',
    tier: 1,
    effect: { type: 'on_hand_evaluated', stat: 'atk', value: 20 },
    price: 4,
  },

  // ─── Uncommon ────────────────────────────────────────
  {
    id: 'berserker_axe',
    name: '狂戰士之斧',
    description: 'HP 低於 50% 時，DMG ×1.5',
    rarity: 'uncommon',
    tier: 2,
    effect: { type: 'conditional', stat: 'dmg_mult', value: 1.5, condition: 'hp_below_50' },
    price: 7,
  },
  {
    id: 'golden_goblet',
    name: '黃金聖杯',
    description: '利息上限從 5 提升到 8',
    rarity: 'uncommon',
    tier: 2,
    effect: { type: 'passive', stat: 'interest_cap', value: 8 },
    price: 8,
  },
  {
    id: 'crystal_ball',
    name: '水晶球',
    description: '每回合開始時可看到牌庫頂 3 張牌',
    rarity: 'uncommon',
    tier: 2,
    effect: { type: 'passive', stat: 'foresight', value: 3 },
    price: 7,
  },
  {
    id: 'battle_drum',
    name: '戰鼓',
    description: '每次出牌 +1 DMG（可疊加）',
    rarity: 'uncommon',
    tier: 2,
    effect: { type: 'on_play', stat: 'dmg', value: 1 },
    price: 8,
  },

  // ─── Rare ────────────────────────────────────────────
  {
    id: 'phoenix_feather',
    name: '鳳凰羽毛',
    description: '每局 Run 死亡時復活一次（HP=50%）',
    rarity: 'rare',
    tier: 3,
    effect: { type: 'on_death', stat: 'revive', value: 0.5 },
    price: 10,
  },
  {
    id: 'infinity_mirror',
    name: '無限之鏡',
    description: '最終 DMG 倍率再 ×1.25',
    rarity: 'rare',
    tier: 3,
    effect: { type: 'on_final_damage', stat: 'dmg_mult', value: 1.25 },
    price: 10,
  },

  // ─── Legendary ───────────────────────────────────────
  {
    id: 'void_heart',
    name: '虛空之心',
    description: '所有打出的牌計分時 ATK +50',
    rarity: 'legendary',
    tier: 4,
    effect: { type: 'on_score', stat: 'atk', value: 50 },
    price: 15,
  },
];

/** Get relics by rarity */
export function getRelicsByRarity(rarity: string): RelicDefinition[] {
  return RELIC_DEFINITIONS.filter(r => r.rarity === rarity);
}

/** Get a random relic weighted by rarity */
export function getRandomRelic(rng: () => number, tier?: number): RelicDefinition {
  const pool = tier
    ? RELIC_DEFINITIONS.filter(r => r.tier === tier)
    : RELIC_DEFINITIONS;
  return pool[Math.floor(rng() * pool.length)];
}

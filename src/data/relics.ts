// ============================================================
// Relic Data — Complete R001-R050 + existing common stubs
// GDD registry_relics_part1.md: Relics #001-050
// ============================================================

import type { RelicDefinition } from '@/types';

// ─── Relic Effect Type ───────────────────────────────────────
// Kept minimal to avoid breaking existing type definitions.
// Full engine integration handled by relic-manager.ts

export const RELIC_DEFINITIONS: RelicDefinition[] = [

  // ════ +ATK Relics ════════════════════════════════════════
  {
    id: 'R001', name: '戰錘',      rarity: 'common',    tier: 1, price: 4,
    description: '每次出牌 +15 ATK',
    effect: { type: 'on_play', stat: 'atk', value: 15 },
  },
  {
    id: 'R002', name: '碎石拳',    rarity: 'common',    tier: 1, price: 4,
    description: '包含增強牌時 +50 ATK',
    effect: { type: 'conditional', stat: 'atk', value: 50, condition: 'has_enhanced_card' },
  },
  {
    id: 'R003', name: '獵鷹之眼',  rarity: 'common',    tier: 1, price: 4,
    description: '打出順子時 +40 ATK',
    effect: { type: 'on_hand_type', stat: 'atk', value: 40, condition: 'straight' },
  },
  {
    id: 'R004', name: '鐵匠之錘',  rarity: 'common',    tier: 1, price: 4,
    description: '打出對子時 +25 ATK',
    effect: { type: 'on_hand_type', stat: 'atk', value: 25, condition: 'pair' },
  },
  {
    id: 'R005', name: '雷鳴棒',    rarity: 'uncommon',  tier: 2, price: 7,
    description: '打出三條時 +60 ATK',
    effect: { type: 'on_hand_type', stat: 'atk', value: 60, condition: 'three_of_a_kind' },
  },
  {
    id: 'R006', name: '穿甲箭',    rarity: 'common',    tier: 1, price: 5,
    description: '無視 Boss 護盾的 20 點',
    effect: { type: 'passive', stat: 'pierce', value: 20 },
  },
  {
    id: 'R007', name: '戰場號角',  rarity: 'uncommon',  tier: 2, price: 8,
    description: '首次出牌 +80 ATK（本場僅一次）',
    effect: { type: 'on_first_play', stat: 'atk', value: 80 },
  },
  {
    id: 'R008', name: '血染短刀',  rarity: 'common',    tier: 1, price: 5,
    description: '+30 ATK，玩家 -5 HP',
    effect: { type: 'on_play', stat: 'atk', value: 30, sideEffect: { stat: 'hp', value: -5 } },
  },
  {
    id: 'R009', name: '骨骼之牙',  rarity: 'common',    tier: 1, price: 5,
    description: '每張被銷毀的牌永久 +10 ATK',
    effect: { type: 'on_card_destroy', stat: 'atk', value: 10 },
  },
  {
    id: 'R010', name: '巨人手套',  rarity: 'uncommon',  tier: 2, price: 8,
    description: '手牌 ≥7 張時 +100 ATK',
    effect: { type: 'conditional', stat: 'atk', value: 100, condition: 'hand_size_gte_7' },
  },

  // ════ +DMG Relics ════════════════════════════════════════
  {
    id: 'R011', name: '火焰印記',  rarity: 'common',    tier: 1, price: 4,
    description: '每次出牌 +4 DMG Mult',
    effect: { type: 'on_play', stat: 'dmg', value: 4 },
  },
  {
    id: 'R012', name: '蝕刻符文',  rarity: 'common',    tier: 1, price: 5,
    description: '打出同花時 +8 DMG Mult',
    effect: { type: 'on_hand_type', stat: 'dmg', value: 8, condition: 'flush' },
  },
  {
    id: 'R013', name: '毒蛇之牙',  rarity: 'uncommon',  tier: 2, price: 7,
    description: '打出 ≥3 張牌時 +12 DMG Mult',
    effect: { type: 'conditional', stat: 'dmg', value: 12, condition: 'cards_played_gte_3' },
  },
  {
    id: 'R014', name: '月牙刃',    rarity: 'common',    tier: 1, price: 5,
    description: '棄牌後下次出牌 +10 DMG',
    effect: { type: 'after_discard', stat: 'dmg', value: 10 },
  },
  {
    id: 'R015', name: '深海之心',  rarity: 'uncommon',  tier: 2, price: 8,
    description: '持有 ≥3 個 DEF 型遺物時 +15 DMG',
    effect: { type: 'conditional', stat: 'dmg', value: 15, condition: 'def_relics_gte_3' },
  },

  // ════ ×DMG Relics ════════════════════════════════════════
  {
    id: 'R016', name: '乘法之王',  rarity: 'rare',      tier: 3, price: 10,
    description: '×2 DMG Mult',
    effect: { type: 'on_play', stat: 'dmg_mult', value: 2 },
  },
  {
    id: 'R017', name: '深淵之眼',  rarity: 'rare',      tier: 3, price: 10,
    description: '打出對子時 ×1.5 DMG',
    effect: { type: 'on_hand_type', stat: 'dmg_mult', value: 1.5, condition: 'pair' },
  },
  {
    id: 'R018', name: '連鎖反應',  rarity: 'rare',      tier: 3, price: 10,
    description: '打出葫蘆時 ×2 DMG',
    effect: { type: 'on_hand_type', stat: 'dmg_mult', value: 2, condition: 'full_house' },
  },
  {
    id: 'R019', name: '超新星',    rarity: 'legendary', tier: 4, price: 15,
    description: '×3 DMG，但每場 1/10 機率碎裂',
    effect: { type: 'on_play', stat: 'dmg_mult', value: 3, breakChance: 0.1 },
  },
  {
    id: 'R020', name: '黑洞透鏡',  rarity: 'rare',      tier: 3, price: 10,
    description: '打出同花順時 ×2.5 DMG',
    effect: { type: 'on_hand_type', stat: 'dmg_mult', value: 2.5, condition: 'straight_flush' },
  },
  {
    id: 'R021', name: '稜鏡分裂',  rarity: 'uncommon',  tier: 2, price: 8,
    description: '打出 ≥4 不同花色時 ×1.5 DMG',
    effect: { type: 'conditional', stat: 'dmg_mult', value: 1.5, condition: 'suits_gte_4' },
  },
  {
    id: 'R022', name: '時間膨脹',  rarity: 'rare',      tier: 3, price: 10,
    description: '第 3 回合開始 ×2 DMG',
    effect: { type: 'on_round_start', stat: 'dmg_mult', value: 2, condition: 'round_gte_3' },
  },
  {
    id: 'R023', name: '量子疊加',  rarity: 'rare',      tier: 3, price: 11,
    description: '50% 機率 ×3 DMG 或 ×0 DMG',
    effect: { type: 'on_play', stat: 'dmg_mult', value: 3, chance: 0.5 },
  },

  // ════ $$ Economy Relics ════════════════════════════════
  {
    id: 'R024', name: '金鑰匙',    rarity: 'common',    tier: 1, price: 5,
    description: '每場戰鬥結束 +5 金',
    effect: { type: 'on_battle_end', stat: 'money', value: 5 },
  },
  {
    id: 'R025', name: '海盜旗',    rarity: 'common',    tier: 1, price: 5,
    description: '擊敗菁英怪時 +8 金',
    effect: { type: 'on_elite_defeated', stat: 'money', value: 8 },
  },
  {
    id: 'R026', name: '稅務官',    rarity: 'uncommon',  tier: 2, price: 8,
    description: '每回合獲得利息（5金/+1，上限 5）',
    effect: { type: 'on_round_start', stat: 'interest', value: 5 },
  },
  {
    id: 'R027', name: '典當商',    rarity: 'common',    tier: 1, price: 5,
    description: '售出遺物時額外 +3 金',
    effect: { type: 'on_sell_relic', stat: 'money', value: 3 },
  },
  {
    id: 'R028', name: '黃金魚鉤',  rarity: 'uncommon',  tier: 2, price: 7,
    description: '棄牌時每張 +2 金',
    effect: { type: 'on_discard', stat: 'money', value: 2 },
  },
  {
    id: 'R029', name: '鍊金壺',    rarity: 'rare',      tier: 3, price: 10,
    description: '每 3 回合產出 1 瓶隨機靈藥',
    effect: { type: 'every_n_rounds', stat: 'consumable', value: 1, condition: 'every_3' },
  },
  {
    id: 'R030', name: '搖錢樹',    rarity: 'uncommon',  tier: 2, price: 8,
    description: '持有金錢 ≥20 時每回合 +3 金',
    effect: { type: 'on_round_start', stat: 'money', value: 3, condition: 'money_gte_20' },
  },

  // ════ FX Relics ══════════════════════════════════════════
  {
    id: 'R031', name: '鏡像',      rarity: 'rare',      tier: 3, price: 10,
    description: '遺物結算順序反轉（右→左）',
    effect: { type: 'passive', stat: 'relic_order_reverse', value: 1 },
  },
  {
    id: 'R032', name: '透視者',    rarity: 'uncommon',  tier: 2, price: 7,
    description: '可查看面朝下的手牌',
    effect: { type: 'passive', stat: 'reveal_facedown', value: 1 },
  },
  {
    id: 'R033', name: '時間旅人',  rarity: 'rare',      tier: 3, price: 10,
    description: '每局 Run 提供 1 次撤銷出牌',
    effect: { type: 'passive', stat: 'undo_count', value: 1 },
  },
  {
    id: 'R034', name: '牌組壓縮機', rarity: 'uncommon', tier: 2, price: 7,
    description: '每場戰鬥自動移除 1 張最低面值牌',
    effect: { type: 'on_battle_start', stat: 'remove_lowest', value: 1 },
  },
  {
    id: 'R035', name: '花色染坊',  rarity: 'uncommon',  tier: 2, price: 7,
    description: '每回合隨機 1 張手牌改變花色',
    effect: { type: 'on_draw', stat: 'change_suit_random', value: 1 },
  },
  {
    id: 'R036', name: '複製儀',    rarity: 'rare',      tier: 3, price: 10,
    description: '每場戰鬥複製 1 張隨機手牌',
    effect: { type: 'on_battle_start', stat: 'duplicate_card', value: 1 },
  },
  {
    id: 'R037', name: '貪食者',    rarity: 'uncommon',  tier: 2, price: 7,
    description: '棄掉的牌有 1/3 機率永久銷毀',
    effect: { type: 'on_discard', stat: 'destroy_chance', value: 0.333 },
  },
  {
    id: 'R038', name: '賭徒骰子',  rarity: 'uncommon',  tier: 2, price: 7,
    description: '出牌前擲骰，1-3: -10 ATK, 4-6: +30 ATK',
    effect: { type: 'on_play', stat: 'atk_gamble', value: 30, sideEffect: { stat: 'atk', value: -10 } },
  },

  // ════ RT (Retrigger) Relics ════════════════════════════
  {
    id: 'R039', name: '回聲石',    rarity: 'rare',      tier: 3, price: 10,
    description: '重觸發結算順序中最後一個遺物 1 次',
    effect: { type: 'retrigger', stat: 'last_relic', value: 1 },
  },
  {
    id: 'R040', name: '共鳴晶',    rarity: 'rare',      tier: 3, price: 10,
    description: '重觸發所有 +ATK 型遺物 1 次',
    effect: { type: 'retrigger', stat: 'all_atk_relics', value: 1 },
  },
  {
    id: 'R041', name: '時間迴圈',  rarity: 'legendary', tier: 4, price: 15,
    description: '重觸發所有遺物 1 次',
    effect: { type: 'retrigger', stat: 'all_relics', value: 1 },
  },
  {
    id: 'R042', name: '連擊紋章',  rarity: 'uncommon',  tier: 2, price: 8,
    description: '打出 ≥4 張牌時重觸發最後 1 張牌',
    effect: { type: 'conditional', stat: 'retrigger_card', value: 1, condition: 'cards_played_gte_4' },
  },
  {
    id: 'R043', name: '影分身',    rarity: 'rare',      tier: 3, price: 10,
    description: '50% 機率重觸發本次出牌的第 1 張',
    effect: { type: 'on_play', stat: 'retrigger_first_card', value: 1, chance: 0.5 },
  },

  // ════ DEF Relics ══════════════════════════════════════
  {
    id: 'R044', name: '聖盾',      rarity: 'common',    tier: 1, price: 5,
    description: '每回合 +10 Shield',
    effect: { type: 'on_round_start', stat: 'shield', value: 10 },
  },
  {
    id: 'R045', name: '生命之泉',  rarity: 'common',    tier: 1, price: 5,
    description: '每回合回復 5 HP',
    effect: { type: 'on_round_start', stat: 'hp', value: 5 },
  },
  {
    id: 'R046', name: '鐵皮護甲',  rarity: 'uncommon',  tier: 2, price: 7,
    description: '打出對子時 +20 Shield',
    effect: { type: 'on_hand_type', stat: 'shield', value: 20, condition: 'pair' },
  },
  {
    id: 'R047', name: '吸血符印',  rarity: 'uncommon',  tier: 2, price: 8,
    description: '造成傷害的 5% 轉為 HP 回復',
    effect: { type: 'on_damage_dealt', stat: 'life_steal', value: 0.05 },
  },
  {
    id: 'R048', name: '格擋護腕',  rarity: 'rare',      tier: 3, price: 10,
    description: 'Boss 攻擊時 30% 機率格擋全部傷害',
    effect: { type: 'on_boss_attack', stat: 'full_block_chance', value: 0.3 },
  },
  {
    id: 'R049', name: '獻血之刃',  rarity: 'rare',      tier: 3, price: 10,
    description: '-10 HP，×3 DMG（HP 賭博）',
    effect: { type: 'on_play', stat: 'dmg_mult', value: 3, sideEffect: { stat: 'hp', value: -10 } },
  },
  {
    id: 'R050', name: '不死鳥羽',  rarity: 'legendary', tier: 4, price: 15,
    description: 'HP 歸零時 1 次復活（回復 50% HP）',
    effect: { type: 'on_death', stat: 'revive', value: 0.5 },
  },

  // ════ Legacy stubs (keep for backwards compat) ═══════
  {
    id: 'iron_knuckle',  name: '鐵拳（舊）',   rarity: 'common', tier: 1, price: 4,
    description: '每次出牌後 ATK +10',
    effect: { type: 'on_play', stat: 'atk', value: 10 },
  },
  {
    id: 'lucky_coin',    name: '幸運硬幣（舊）', rarity: 'common', tier: 1, price: 5,
    description: '每場戰鬥結束後 +3 金',
    effect: { type: 'on_battle_end', stat: 'money', value: 3 },
  },
  {
    id: 'phoenix_feather', name: '鳳凰羽毛（舊）', rarity: 'rare', tier: 3, price: 10,
    description: '每局 Run 死亡時復活一次（HP=50%）',
    effect: { type: 'on_death', stat: 'revive', value: 0.5 },
  },
  {
    id: 'infinity_mirror', name: '無限之鏡（舊）', rarity: 'rare', tier: 3, price: 10,
    description: '最終 DMG 倍率再 ×1.25',
    effect: { type: 'on_final_damage', stat: 'dmg_mult', value: 1.25 },
  },
  {
    id: 'void_heart', name: '虛空之心（舊）', rarity: 'legendary', tier: 4, price: 15,
    description: '所有打出的牌計分時 ATK +50',
    effect: { type: 'on_score', stat: 'atk', value: 50 },
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

/** Get relic by ID */
export function getRelicById(id: string): RelicDefinition | undefined {
  return RELIC_DEFINITIONS.find(r => r.id === id);
}

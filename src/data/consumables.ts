// ============================================================
// Consumables Data — Scrolls (捲軸) / Elixirs (靈藥) / Pacts (契約)
// GDD Phase 1 §3.5, registry_consumables.md
// ============================================================

import type { ConsumableDefinition } from '@/types';

// ─── Scrolls (捲軸) S01-S22 ─────────────────────────────────
export const SCROLL_DEFINITIONS: ConsumableDefinition[] = [
  { id: 'S01', name: '吊人捲軸',   type: 'scroll', description: '將 1 張手牌變為「野生牌」（任意花色）',        price: 3, targetMode: 'select_card', targetCount: 1, fxKey: 'hanged_glow', sfxKey: 'sfx_hanged' },
  { id: 'S02', name: '月亮捲軸',   type: 'scroll', description: '將 1 張手牌的數值 +1',                        price: 3, targetMode: 'select_card', targetCount: 1, fxKey: 'moon_glow',   sfxKey: 'sfx_moon' },
  { id: 'S03', name: '力量捲軸',   type: 'scroll', description: '將 1 張手牌的數值 +2',                        price: 3, targetMode: 'select_card', targetCount: 1, fxKey: 'strength',    sfxKey: 'sfx_power' },
  { id: 'S04', name: '審判捲軸',   type: 'scroll', description: '將 3 張牌升級為「Bonus」版（+30 ATK）',        price: 4, targetMode: 'select_card', targetCount: 3, fxKey: 'judgment',    sfxKey: 'sfx_judge' },
  { id: 'S05', name: '愚者捲軸',   type: 'scroll', description: '複製最後使用的捲軸（除自身）',                price: 3, targetMode: 'none',        fxKey: 'fool_copy',   sfxKey: 'sfx_fool' },
  { id: 'S06', name: '魔術師捲軸', type: 'scroll', description: '給 1 張手牌加上「重觸發」封印（紅色封印）',   price: 4, targetMode: 'select_card', targetCount: 1, fxKey: 'magician',    sfxKey: 'sfx_magic' },
  { id: 'S07', name: '女皇捲軸',   type: 'scroll', description: '給 1 張手牌加上「金色」增強（回合結束 +3金）', price: 4, targetMode: 'select_card', targetCount: 1, fxKey: 'empress',     sfxKey: 'sfx_empress' },
  { id: 'S08', name: '倒吊捲軸',   type: 'scroll', description: '銷毀 2 張手牌（牌庫壓縮）',                   price: 3, targetMode: 'select_card', targetCount: 2, fxKey: 'consume',     sfxKey: 'sfx_hang' },
  { id: 'S09', name: '黑桃捲軸',   type: 'scroll', description: '將 3 張手牌改為黑桃 ♠',                      price: 3, targetMode: 'select_card', targetCount: 3, fxKey: 'suit_spade',  sfxKey: 'sfx_suit' },
  { id: 'S10', name: '紅心捲軸',   type: 'scroll', description: '將 3 張手牌改為紅心 ♥',                      price: 3, targetMode: 'select_card', targetCount: 3, fxKey: 'suit_heart',  sfxKey: 'sfx_suit' },
  { id: 'S11', name: '方塊捲軸',   type: 'scroll', description: '將 3 張手牌改為方塊 ♦',                      price: 3, targetMode: 'select_card', targetCount: 3, fxKey: 'suit_diamond', sfxKey: 'sfx_suit' },
  { id: 'S12', name: '梅花捲軸',   type: 'scroll', description: '將 3 張手牌改為梅花 ♣',                      price: 3, targetMode: 'select_card', targetCount: 3, fxKey: 'suit_club',   sfxKey: 'sfx_suit' },
  { id: 'S13', name: '太陽捲軸',   type: 'scroll', description: '將 1 張手牌升級為「鋼鐵牌」（持有時 ×1.5）',  price: 4, targetMode: 'select_card', targetCount: 1, fxKey: 'sun_glow',    sfxKey: 'sfx_sun' },
  { id: 'S14', name: '死神捲軸',   type: 'scroll', description: '銷毀 1 張牌，複製另 1 張牌加入牌庫',          price: 4, targetMode: 'select_card', targetCount: 2, fxKey: 'death_flash', sfxKey: 'sfx_death' },
  { id: 'S15', name: '節制捲軸',   type: 'scroll', description: '給 1 張手牌加上「玻璃牌」增強（×2 DMG，1/4碎）', price: 4, targetMode: 'select_card', targetCount: 1, fxKey: 'temp_glow',   sfxKey: 'sfx_temp' },
  { id: 'S16', name: '星界捲軸',   type: 'scroll', description: '給 1 張手牌加上「幸運牌」增強',               price: 4, targetMode: 'select_card', targetCount: 1, fxKey: 'star_glow',   sfxKey: 'sfx_star' },
  { id: 'S17', name: '世界捲軸',   type: 'scroll', description: '將 5 張手牌全部改為同一花色（隨機）',          price: 5, targetMode: 'none',        fxKey: 'world_spin',  sfxKey: 'sfx_world' },
  { id: 'S18', name: '戰車捲軸',   type: 'scroll', description: '將 1 張手牌升級為「石頭牌」（+50 ATK，無花色）', price: 4, targetMode: 'select_card', targetCount: 1, fxKey: 'stone_aura',  sfxKey: 'sfx_chariot' },
  { id: 'S19', name: '女祭司捲軸', type: 'scroll', description: '給 2 張手牌加上藍色封印（回合結束生成靈藥）',  price: 4, targetMode: 'select_card', targetCount: 2, fxKey: 'blue_seal',   sfxKey: 'sfx_priestess' },
  { id: 'S20', name: '命運之輪捲軸', type: 'scroll', description: '隨機增強 1 張手牌（隨機類型）',              price: 3, targetMode: 'select_card', targetCount: 1, fxKey: 'wheel_spin',  sfxKey: 'sfx_wheel' },
  { id: 'S21', name: '惡魔捲軸',   type: 'scroll', description: '給 1 張手牌加上紫色封印（銷毀時觸發契約效果）', price: 4, targetMode: 'select_card', targetCount: 1, fxKey: 'devil_seal',  sfxKey: 'sfx_devil' },
  { id: 'S22', name: '高塔捲軸',   type: 'scroll', description: '銷毀 1 張點數最低的手牌（無法選擇）',          price: 3, targetMode: 'none',        fxKey: 'tower_fall',  sfxKey: 'sfx_tower' },
];

// ─── Elixirs (靈藥) E01-E12 ─────────────────────────────────
export const ELIXIR_DEFINITIONS: ConsumableDefinition[] = [
  { id: 'E01', name: '水星靈藥',     type: 'elixir', description: '「對子」牌型等級 +1',          price: 3, targetMode: 'none', fxKey: 'planet_glow', sfxKey: 'sfx_mercury' },
  { id: 'E02', name: '金星靈藥',     type: 'elixir', description: '「兩對」牌型等級 +1',          price: 3, targetMode: 'none', fxKey: 'planet_glow', sfxKey: 'sfx_venus' },
  { id: 'E03', name: '地球靈藥',     type: 'elixir', description: '「三條」牌型等級 +1',          price: 3, targetMode: 'none', fxKey: 'planet_glow', sfxKey: 'sfx_earth' },
  { id: 'E04', name: '火星靈藥',     type: 'elixir', description: '「順子」牌型等級 +1',          price: 3, targetMode: 'none', fxKey: 'planet_glow', sfxKey: 'sfx_mars' },
  { id: 'E05', name: '木星靈藥',     type: 'elixir', description: '「同花」牌型等級 +1',          price: 3, targetMode: 'none', fxKey: 'planet_glow', sfxKey: 'sfx_jupiter' },
  { id: 'E06', name: '土星靈藥',     type: 'elixir', description: '「葫蘆」牌型等級 +1',          price: 3, targetMode: 'none', fxKey: 'planet_glow', sfxKey: 'sfx_saturn' },
  { id: 'E07', name: '天王星靈藥',   type: 'elixir', description: '「四條」牌型等級 +1',          price: 4, targetMode: 'none', fxKey: 'planet_glow', sfxKey: 'sfx_uranus' },
  { id: 'E08', name: '海王星靈藥',   type: 'elixir', description: '「同花順」牌型等級 +1',        price: 4, targetMode: 'none', fxKey: 'planet_glow', sfxKey: 'sfx_neptune' },
  { id: 'E09', name: '冥王星靈藥',   type: 'elixir', description: '「高牌」牌型等級 +1',          price: 3, targetMode: 'none', fxKey: 'planet_glow', sfxKey: 'sfx_pluto' },
  { id: 'E10', name: '太陽系靈藥',   type: 'elixir', description: '「皇家同花順」牌型等級 +1',    price: 4, targetMode: 'none', fxKey: 'solar_glow',  sfxKey: 'sfx_solar' },
  { id: 'E11', name: '歐若拉靈藥',   type: 'elixir', description: '隨機 1 種牌型等級 +2',         price: 4, targetMode: 'none', fxKey: 'aurora',      sfxKey: 'sfx_aurora' },
  { id: 'E12', name: '黑洞靈藥',     type: 'elixir', description: '所有牌型等級 +1（極稀有）',    price: 6, targetMode: 'none', fxKey: 'vortex',      sfxKey: 'sfx_blackhole' },
];

// ─── Pacts (契約) P01-P17 ────────────────────────────────────
export const PACT_DEFINITIONS: ConsumableDefinition[] = [
  { id: 'P01', name: '血契',       type: 'pact', description: '失去 10 HP，造成 ×3 DMG Mult（本回合）',       price: 4, targetMode: 'none',        fxKey: 'blood_pact',   sfxKey: 'sfx_blood' },
  { id: 'P02', name: '獻祭誓約',   type: 'pact', description: '銷毀 1 個遺物，獲得 1 個傳奇遺物',            price: 5, targetMode: 'select_relic', targetCount: 1, fxKey: 'sacrifice',    sfxKey: 'sfx_sacrifice' },
  { id: 'P03', name: '靈魂呼喚',   type: 'pact', description: '直接獲得 1 個傳奇遺物，-1 手牌上限',           price: 6, targetMode: 'none',        fxKey: 'soul_summon',  sfxKey: 'sfx_soul' },
  { id: 'P04', name: '血肉重塑',   type: 'pact', description: '牌庫所有牌變為同一花色，失去 30 HP',           price: 5, targetMode: 'none',        fxKey: 'blood_shift',  sfxKey: 'sfx_reshape' },
  { id: 'P05', name: '數字統一',   type: 'pact', description: '牌庫所有牌變為同一面值，失去 30 HP',           price: 5, targetMode: 'none',        fxKey: 'number_shift', sfxKey: 'sfx_unify' },
  { id: 'P06', name: '虛空洗禮',   type: 'pact', description: '銷毀手牌中 3 張，餘下獲得彩色版本',           price: 5, targetMode: 'select_card', targetCount: 3, fxKey: 'void_wash',    sfxKey: 'sfx_baptize' },
  { id: 'P07', name: '混沌之種',   type: 'pact', description: '手牌所有牌隨機獲得一種增強',                  price: 5, targetMode: 'none',        fxKey: 'chaos_seed',   sfxKey: 'sfx_chaos' },
  { id: 'P08', name: '時光倒流',   type: 'pact', description: '將 1 個遺物恢復為商店價格，扣 15 金',         price: 4, targetMode: 'select_relic', targetCount: 1, fxKey: 'distort',      sfxKey: 'sfx_rewind' },
  { id: 'P09', name: '惡魔交易',   type: 'pact', description: '立即獲得 20 金，但下一場戰鬥 Boss 攻擊力 ×2', price: 4, targetMode: 'none',        fxKey: 'deal_glow',    sfxKey: 'sfx_trade' },
  { id: 'P10', name: '靈魂複製',   type: 'pact', description: '複製 1 張手牌加入牌庫（永久）',               price: 4, targetMode: 'select_card', targetCount: 1, fxKey: 'copy_flash',   sfxKey: 'sfx_mirror' },
  { id: 'P11', name: '空間扭曲',   type: 'pact', description: '商店出現次數 +1（額外商店回合），-1 棄牌次數', price: 5, targetMode: 'none',        fxKey: 'warp',         sfxKey: 'sfx_warp' },
  { id: 'P12', name: '惡魔低語',   type: 'pact', description: '本回合所有卡牌計為同花色',                    price: 4, targetMode: 'none',        fxKey: 'whisper',      sfxKey: 'sfx_whisper' },
  { id: 'P13', name: '死亡凝視',   type: 'pact', description: 'Boss 本回合攻擊力 -50%，失去 15 HP',          price: 5, targetMode: 'none',        fxKey: 'gaze',         sfxKey: 'sfx_gaze' },
  { id: 'P14', name: '煉金術',     type: 'pact', description: '將手中所有消耗品轉換為 4 金/個',              price: 4, targetMode: 'none',        fxKey: 'alchemy',      sfxKey: 'sfx_alch' },
  { id: 'P15', name: '永恆誓言',   type: 'pact', description: '本 Run 所有靈藥效果 ×2（一次性），失去 25 HP', price: 6, targetMode: 'none',        fxKey: 'eternal',      sfxKey: 'sfx_eternal' },
  { id: 'P16', name: '黑暗契約',   type: 'pact', description: '獲得 1 張隨機負片版遺物（消耗 1 格遺物位）',   price: 5, targetMode: 'none',        fxKey: 'dark_glow',    sfxKey: 'sfx_dark' },
  { id: 'P17', name: '毀滅之種',   type: 'pact', description: '銷毀牌庫一半的牌（隨機）',                   price: 4, targetMode: 'none',        fxKey: 'destruction',  sfxKey: 'sfx_destroy' },
];

// ─── Combined Map ────────────────────────────────────────────
export const CONSUMABLE_DEFINITIONS: Record<string, ConsumableDefinition> = Object.fromEntries(
  [...SCROLL_DEFINITIONS, ...ELIXIR_DEFINITIONS, ...PACT_DEFINITIONS].map(c => [c.id, c]),
);

export function getConsumable(id: string): ConsumableDefinition | undefined {
  return CONSUMABLE_DEFINITIONS[id];
}

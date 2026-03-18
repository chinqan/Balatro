// ============================================================
// Starter Decks — 15 unique starter deck configurations
// GDD Phase 10 §2.1: Deck list with modifiers
// ============================================================

import type { UnlockId } from '@/systems/unlock-manager';

// ─── Deck Modifiers ──────────────────────────────────────────

/** Modifiers applied at run initialization */
export interface DeckModifiers {
  playsBonus?:        number;   // Extra plays per round
  discardsBonus?:     number;   // Extra discards per round
  handSizeBonus?:     number;   // Extra hand size
  startingGold?:      number;   // Additional starting gold
  startingHp?:        number;   // HP adjustment (+/-)
  startingShield?:    number;   // Starting shield
  relicSlotsBonus?:   number;   // Extra relic slots
  deckSizeOverride?:  number;   // Override standard 52-card deck
  includeExtraFaces?: boolean;  // Include extra face cards (巨人牌組)
  cursedCards?:       number;   // Start with N cursed cards
  enhancementLevel?:  number;   // Enhancement +N levels (鍛造牌組)
  enhanceProbBonus?:  number;   // Lucky/probability +% (幸運牌組)
  relicOrderReversed?: boolean; // Reverse relic order (鏡像牌組)
  noInitialRelicSlots?: boolean;// No relic slots, higher rewards (虛空牌組)
  pactChanceMulti?:   number;   // Pact encounter rate multiplier (鬼魂牌組)
  rewardMulti?:       number;   // Battle reward multiplier (虛空牌組)
  noQuitAllowed?:     boolean;  // Cannot quit mid-run (placeholder for hardcore)
}

// ─── Starter Deck Definition ─────────────────────────────────

export interface StarterDeck {
  id: string;
  name: string;
  description: string;
  unlockId: UnlockId;        // Which unlock gates this deck
  modifiers: DeckModifiers;
  strategy: string;          // One-line strategy hint for UI
  color: number;             // Card background accent color
  icon: string;              // Emoji icon for UI
}

// ─── 15 Starter Decks ────────────────────────────────────────

export const STARTER_DECKS: StarterDeck[] = [
  {
    id: 'deck_standard',
    name: '標準牌組',
    description: '一副完整的 52 張撲克牌，無任何修改。',
    unlockId: 'deck_standard',
    modifiers: {},
    strategy: '通用均衡，適合熟悉基礎機制',
    color: 0x2a3a4a,
    icon: '🃏',
  },
  {
    id: 'deck_warrior',
    name: '戰士牌組',
    description: '每回合多 1 次出牌機會，適合多次進攻策略。',
    unlockId: 'deck_warrior',
    modifiers: { playsBonus: 1 },
    strategy: '密集出牌，每回合多一次打擊機會',
    color: 0x4a2a1a,
    icon: '⚔️',
  },
  {
    id: 'deck_explorer',
    name: '探索牌組',
    description: '每回合多 1 次棄牌機會，尋找完美手牌的利器。',
    unlockId: 'deck_explorer',
    modifiers: { discardsBonus: 1 },
    strategy: '快速篩選手牌，尋找高倍率組合',
    color: 0x1a3a2a,
    icon: '🧭',
  },
  {
    id: 'deck_greedy',
    name: '貪婪牌組',
    description: '起始追加 +10 金錢，經濟優勢搶先佈局。',
    unlockId: 'deck_greedy',
    modifiers: { startingGold: 10 },
    strategy: '搶先購買高價遺物，建立經濟引擎',
    color: 0x3a3a0a,
    icon: '💰',
  },
  {
    id: 'deck_ghost',
    name: '鬼魂牌組',
    description: '契約卡出現率 ×2，高風險高報酬的黑暗交易。',
    unlockId: 'deck_ghost',
    modifiers: { pactChanceMulti: 2 },
    strategy: '大量使用契約疊加效果，承受代價',
    color: 0x2a1a3a,
    icon: '👻',
  },
  {
    id: 'deck_alchemist',
    name: '煉金牌組',
    description: 'ATK 與 DMG 計算共用同一乘法池。',
    unlockId: 'deck_alchemist',
    modifiers: {},  // Special logic applied in scoring engine
    strategy: '數學特化：最大化 ATK×DMG 交叉乘算',
    color: 0x3a2a0a,
    icon: '⚗️',
  },
  {
    id: 'deck_painter',
    name: '畫家牌組',
    description: '+2 手牌上限，持有更多牌形成複雜組合。',
    unlockId: 'deck_painter',
    modifiers: { handSizeBonus: 2 },
    strategy: '大手牌策略，組合同花順或滿堂紅',
    color: 0x1a2a4a,
    icon: '🎨',
  },
  {
    id: 'deck_forger',
    name: '鍛造牌組',
    description: '所有增強效果 +1 等級，增強牌性能翻倍。',
    unlockId: 'deck_forger',
    modifiers: { enhancementLevel: 1 },
    strategy: '全面增強牌庫，讓每張牌都發揮最大效益',
    color: 0x3a3a3a,
    icon: '🔨',
  },
  {
    id: 'deck_cursed',
    name: '詛咒牌組',
    description: '起始 5 張詛咒牌 / HP -20，硬核挑戰者的選擇。',
    unlockId: 'deck_cursed',
    modifiers: { cursedCards: 5, startingHp: -20 },
    strategy: '克服詛咒牌劣勢，越戰越強',
    color: 0x2a0a0a,
    icon: '💀',
  },
  {
    id: 'deck_minimal',
    name: '極簡牌組',
    description: '起始牌庫僅 26 張，精準壓縮出最強陣容。',
    unlockId: 'deck_minimal',
    modifiers: { deckSizeOverride: 26 },
    strategy: '高度壓縮卡組，抽到好牌的機率倍增',
    color: 0x1a1a1a,
    icon: '✂️',
  },
  {
    id: 'deck_giant',
    name: '巨人牌組',
    description: '起始牌庫 78 張（含額外花牌），海量資源池。',
    unlockId: 'deck_giant',
    modifiers: { deckSizeOverride: 78, includeExtraFaces: true },
    strategy: '龐大牌庫提供更多花色選擇和同花機會',
    color: 0x1a3a4a,
    icon: '🏔️',
  },
  {
    id: 'deck_mirror',
    name: '鏡像牌組',
    description: '遺物結算順序反轉（右→左），逆向思考排版。',
    unlockId: 'deck_mirror',
    modifiers: { relicOrderReversed: true },
    strategy: '將重觸發遺物放在左邊，創造不同連鎖效果',
    color: 0x2a1a4a,
    icon: '🪞',
  },
  {
    id: 'deck_lucky',
    name: '幸運牌組',
    description: '所有概率效果 +10%，讓運氣變成實力。',
    unlockId: 'deck_lucky',
    modifiers: { enhanceProbBonus: 0.1 },
    strategy: '最大化幸運/玻璃等概率效果的觸發率',
    color: 0x2a4a1a,
    icon: '🍀',
  },
  {
    id: 'deck_iron',
    name: '鐵壁牌組',
    description: '+30 初始護盾 / -1 出牌次數，以防換攻。',
    unlockId: 'deck_iron',
    modifiers: { startingShield: 30, playsBonus: -1 },
    strategy: '護盾導向，搭配防禦遺物構建堅壁',
    color: 0x3a3a4a,
    icon: '🛡️',
  },
  {
    id: 'deck_void',
    name: '虛空牌組',
    description: '無初始遺物欄 / 戰鬥獎勵 ×1.5，純粹考驗基礎機制。',
    unlockId: 'deck_void',
    modifiers: { noInitialRelicSlots: true, rewardMulti: 1.5 },
    strategy: '零遺物出發，靠牌型和增強征服一切',
    color: 0x0a0a1a,
    icon: '🌑',
  },
];

// ─── Utility ─────────────────────────────────────────────────

export function getStarterDeckById(id: string): StarterDeck | undefined {
  return STARTER_DECKS.find(d => d.id === id);
}

export function getUnlockedDecks(unlockedIds: ReadonlySet<string>): StarterDeck[] {
  return STARTER_DECKS.filter(d => unlockedIds.has(d.unlockId));
}

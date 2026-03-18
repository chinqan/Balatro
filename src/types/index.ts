// ============================================================
// Types — Shared enums and interfaces for the game
// ============================================================

// ─── Card Suits ─────────────────────────────────────────────
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export const ALL_SUITS: readonly Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'] as const;

// ─── Card Ranks ─────────────────────────────────────────────
// 2-14, where 11=J, 12=Q, 13=K, 14=A
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export const ALL_RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;

/** Map rank to display name */
export const RANK_NAMES: Record<Rank, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

/** Map rank to ATK chip value (GDD Phase 1 §2) */
export const RANK_ATK_VALUES: Record<Rank, number> = {
  2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
  11: 10, 12: 10, 13: 10, 14: 11,
};

/** Map suit to display symbol */
export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
};

// ─── Hand Types (Poker Hands) ───────────────────────────────
export type HandType =
  | 'high_card'
  | 'pair'
  | 'two_pair'
  | 'three_of_a_kind'
  | 'straight'
  | 'flush'
  | 'full_house'
  | 'four_of_a_kind'
  | 'straight_flush'
  | 'royal_flush';

// Priority order (highest first)
export const HAND_TYPE_PRIORITY: readonly HandType[] = [
  'royal_flush',
  'straight_flush',
  'four_of_a_kind',
  'full_house',
  'flush',
  'straight',
  'three_of_a_kind',
  'two_pair',
  'pair',
  'high_card',
] as const;

// ─── Card Enhancements (GDD Phase 1 §4.3) ──────────────────
export type Enhancement =
  | 'bonus'       // +30 ATK
  | 'glass'       // ×2 DMG Mult (1/4 shatter)
  | 'steel'       // ×1.5 DMG when held in hand
  | 'stone'       // +50 ATK, no suit/rank
  | 'gold'        // +3 money at round end
  | 'lucky'       // 1/5 +20 DMG or 1/15 +money
  | 'wild';       // Counts as all suits

// ─── Card Editions (GDD Phase 1 §4.3 versions) ─────────────
export type Edition =
  | 'foil'        // +50 ATK
  | 'holographic' // +10 DMG Mult
  | 'polychrome'  // ×1.5 DMG Mult
  | 'negative';   // +1 relic slot

// ─── Card Seals (GDD Phase 1 §4.3 seals) ───────────────────
export type Seal =
  | 'red'         // Re-trigger card 1 time
  | 'blue'        // Generate 1 random elixir
  | 'gold_seal'   // +3 money at round end
  | 'purple';     // On destroy: trigger random pact effect

// ─── Card Data Structure ────────────────────────────────────
export interface Card {
  /** Unique identifier, e.g. "5S" for 5 of Spades */
  id: string;
  suit: Suit;
  rank: Rank;
  enhancement?: Enhancement;
  edition?: Edition;
  seal?: Seal;
  /** Bonus ATK from external sources */
  chipBonus: number;
  /** Whether this card is currently debuffed (by Boss mechanic) */
  isDebuffed: boolean;
}

// ─── Relic Types (GDD Phase 1 §5.2) ────────────────────────
export type RelicCategory = 'attack' | 'multiplier' | 'defense' | 'economy' | 'utility' | 'retrigger';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface RelicEffect {
  type: string;           // 'on_play', 'on_round_start', 'passive', 'conditional', etc.
  stat: string;           // 'atk', 'dmg', 'dmg_mult', 'shield', 'money', etc.
  value: number;
  condition?: string;     // e.g. 'hp_below_50'
  chance?: number;        // 0-1 probability (e.g. R023 量子疊加 50%)
  breakChance?: number;   // 0-1 chance to destroy relic on trigger (e.g. R019 超新星)
  sideEffect?: { stat: string; value: number };  // secondary stat effect (e.g. R008 血染短刀)
}

export interface RelicDefinition {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  tier: number;           // 1-4 matching rarity tiers
  effect: RelicEffect;
  price: number;          // Shop base price
  category?: RelicCategory;
}

export interface RelicInstance {
  definitionId: string;
  order: number;
  charges?: number;
  isActive: boolean; // false when silenced by Boss
}

// ─── Boss Types (GDD Phase 2 §2) ───────────────────────────
export type BossIntentType = 'strike' | 'heavy' | 'aoe' | 'debuff' | 'shield' | 'heal';
export type BossMechanic = 'suit_block' | 'hand_block' | 'face_down' | 'action_limit' | 'damage_cap' | 'relic_silence';

export interface BossDefinition {
  id: string;
  name: string;
  floor: number;
  baseHp: number;
  baseAtk: number;
  mechanics: BossMechanic[];
  intents: BossIntentType[];
}

// ─── Card Sort Order ────────────────────────────────────────
/** Hand always sorted — either by rank (desc) or by suit (♠♥♦♣). */
export type CardSortOrder = 'rank' | 'suit';

// ─── Consumable Types (GDD Phase 1 §3.5) ────────────────────
export type ConsumableType = 'scroll' | 'elixir' | 'pact';

export type ConsumableTargetMode =
  | 'none'       // No target needed (elixirs)
  | 'select_card'  // Must pick 1+ cards from hand
  | 'select_relic'; // Must pick a relic

export interface ConsumableDefinition {
  id: string;
  name: string;
  type: ConsumableType;
  description: string;
  /** Shop price */
  price: number;
  targetMode: ConsumableTargetMode;
  /** Max targets if targetMode !== 'none' */
  targetCount?: number;
  /** FX / SFX keys */
  fxKey: string;
  sfxKey: string;
}

export interface ConsumableInstance {
  definitionId: string;
}

// ─── Tag Types (GDD Phase 2 §3.5) ────────────────────────────
export type TagId =
  | 'tag_rare'       // Next shop guaranteed rare relic
  | 'tag_economy'    // Immediately gain 10 gold
  | 'tag_negative'   // Next relic gained has negative edition
  | 'tag_elixir'     // Gain 2 free elixirs
  | 'tag_challenge'; // Next battle ×1.5 DMG, boss ATK also ×1.5

export interface TagDefinition {
  id: TagId;
  name: string;
  description: string;
  /** Is immediate (economy) or triggered later */
  immediate: boolean;
}

export interface TagInstance {
  tagId: TagId;
  /** false until consumed/applied */
  consumed: boolean;
}

// ─── Player State ───────────────────────────────────────────
export interface PlayerState {
  hp: number;
  maxHp: number;
  shield: number;
  money: number;
  plays: number;       // Remaining plays this round
  discards: number;    // Remaining discards this round
  handSize: number;    // Max hand size
  /** Current consumable inventory (max 2 by default, extendable by blessings) */
  consumables: ConsumableInstance[];
  /** Max number of consumable slots */
  maxConsumables: number;
  /** Hand sort order — always sorted, default 'rank' */
  sortOrder: CardSortOrder;
}

// ─── Settlement Step Record (for animation playback) ────────
export interface SettlementStep {
  phase: 1 | 2 | 3 | 4;
  source: string;           // e.g. "hand_type", "card:KH", "relic:042"
  description: string;      // Human-readable: "+30 ATK (Bonus Card)"
  atkBefore: number;
  atkAfter: number;
  dmgMultBefore: number;
  dmgMultAfter: number;
  shieldGenerated?: number;
}

export interface SettlementResult {
  handType: HandType;
  finalDamage: number;
  totalShield: number;
  steps: SettlementStep[];
}

// ─── Hand Evaluation Result ─────────────────────────────────
export interface HandResult {
  handType: HandType;
  /** Cards that participate in scoring */
  scoringCards: Card[];
  /** Base ATK from hand type + level */
  baseATK: number;
  /** Base DMG Mult from hand type + level */
  baseDMG: number;
}

// ============================================================
// Game Config — Global tuning constants
// GDD Phase 1 §3, Phase 2 §1.3, Phase 1 §5.1
// ============================================================

export const CONFIG = {
  // ─── Player Defaults ────────────────────────────────────
  INITIAL_HP: 100,
  INITIAL_PLAYS: 4,
  INITIAL_DISCARDS: 3,
  HAND_SIZE: 8,

  // ─── Relic Slots ────────────────────────────────────────
  INITIAL_RELIC_SLOTS: 5,
  MAX_RELIC_SLOTS: 8,        // Hard cap (GDD Phase 1 §5.1)

  // ─── Consumable Slots ──────────────────────────────────
  INITIAL_CONSUMABLE_SLOTS: 2,
  MAX_CONSUMABLE_SLOTS: 4,

  // ─── Shield ─────────────────────────────────────────────
  SHIELD_HARD_CAP: 100,      // (GDD Phase 1 §3)
  SHIELD_RESET_PER_ROUND: true, // Default: clear at round end

  // ─── Standard Deck ──────────────────────────────────────
  STANDARD_DECK_SIZE: 52,

  // ─── Economy ────────────────────────────────────────────
  INTEREST_PER_5_GOLD: 1,    // +1 per 5 gold held
  INTEREST_CAP: 5,           // Max interest per round
  REROLL_COST: 5,
  SELL_RATIO: 0.5,           // Sell price = buy price × 0.5

  // ─── Battle Rewards (GDD Phase 2 §3.1) ─────────────────
  STANDARD_REWARD_MIN: 3,
  STANDARD_REWARD_MAX: 5,
  ELITE_BONUS: 2,
  BOSS_BONUS: 5,

  // ─── Dungeon Structure ─────────────────────────────────
  TOTAL_FLOORS: 8,
  ENCOUNTERS_PER_FLOOR: 3,

  // ─── Animation Timing (ms) ─────────────────────────────
  CARD_FLIGHT_INTERVAL: 200,
  PASSIVE_AURA_DELAY: 200,
  RELIC_TRIGGER_DELAY: 400,
  FINAL_DAMAGE_DELAY: 300,
  BOSS_HP_DRAIN_DELAY: 200,
  BOSS_RECOVERY_DELAY: 500,
} as const;

// ============================================================
// Damage Calculator — 4-Phase Settlement Engine
// GDD Phase 1 §2: The core combat resolution system
// ============================================================

import type { Card, HandType, RelicInstance, SettlementStep, SettlementResult } from '@/types';
import { RANK_ATK_VALUES } from '@/types';
import { evaluateHand } from '@/systems/hand-evaluator';
import type { SeedManager } from '@/core/rng';

/**
 * Context for a single settlement pass.
 */
interface SettlementContext {
  atk: number;
  dmgMult: number;
  shield: number;
  steps: SettlementStep[];
  rng: SeedManager;
}

/**
 * Add a settlement step and update ATK/DMG values.
 */
function addStep(
  ctx: SettlementContext,
  phase: 1 | 2 | 3 | 4,
  source: string,
  description: string,
  newAtk: number,
  newDmgMult: number,
  shieldGen?: number,
): void {
  ctx.steps.push({
    phase,
    source,
    description,
    atkBefore: ctx.atk,
    atkAfter: newAtk,
    dmgMultBefore: ctx.dmgMult,
    dmgMultAfter: newDmgMult,
    shieldGenerated: shieldGen,
  });
  ctx.atk = newAtk;
  ctx.dmgMult = newDmgMult;
  if (shieldGen) ctx.shield += shieldGen;
}

/**
 * Calculate damage from a set of played cards.
 *
 * @param playedCards - Cards the player chose to play (in order, left to right)
 * @param heldCards - Cards remaining in hand (for passive aura effects)
 * @param relics - Player's relic instances (in order, left to right)
 * @param handLevels - Current level for each hand type
 * @param rng - RNG seed manager for probability effects
 * @returns Complete settlement result with step-by-step breakdown
 */
export function calculateDamage(
  playedCards: Card[],
  heldCards: Card[],
  relics: RelicInstance[],
  handLevels: Record<HandType, number>,
  rng: SeedManager,
): SettlementResult {
  const ctx: SettlementContext = {
    atk: 0,
    dmgMult: 0,
    shield: 0,
    steps: [],
    rng,
  };

  // ════════════════════════════════════════════════════════════
  // Phase 1: 起手式 — Determine hand type and base values
  // ════════════════════════════════════════════════════════════
  const evalResult = evaluateHand(playedCards, handLevels);
  ctx.atk = evalResult.baseATK;
  ctx.dmgMult = evalResult.baseDMG;

  addStep(ctx, 1, 'hand_type', `${evalResult.handType}: Base ATK ${evalResult.baseATK}, DMG ×${evalResult.baseDMG}`,
    evalResult.baseATK, evalResult.baseDMG);

  // ════════════════════════════════════════════════════════════
  // Phase 2: 連擊 — Score each played card left to right
  // ════════════════════════════════════════════════════════════
  const scoringSet = new Set(evalResult.scoringCards.map(c => c.id));

  for (const card of playedCards) {
    if (card.isDebuffed) continue; // Debuffed cards don't score

    const isScoring = scoringSet.has(card.id);

    // Only scoring cards add their face value
    if (isScoring) {
      const chipValue = RANK_ATK_VALUES[card.rank] + card.chipBonus;
      addStep(ctx, 2, `card:${card.id}`, `+${chipValue} ATK (${card.rank} face value)`,
        ctx.atk + chipValue, ctx.dmgMult);
    }

    // Enhancement effects (all played non-debuffed cards, not just scoring)
    if (card.enhancement && isScoring) {
      processEnhancement(ctx, card);
    }

    // Edition effects
    if (card.edition && isScoring) {
      processEdition(ctx, card);
    }

    // Seal effects
    if (card.seal && isScoring) {
      processSeal(ctx, card);
    }
  }

  // ════════════════════════════════════════════════════════════
  // Phase 3: 被動光環 — Held cards passive effects
  // ════════════════════════════════════════════════════════════
  for (const card of heldCards) {
    if (card.isDebuffed) continue;

    if (card.enhancement === 'steel') {
      // Steel cards: ×1.5 DMG Mult when held
      const newDmg = ctx.dmgMult * 1.5;
      addStep(ctx, 3, `held:${card.id}`, `×1.5 DMG Mult (Steel in hand)`,
        ctx.atk, newDmg);
    }
  }

  // ════════════════════════════════════════════════════════════
  // Phase 4: 神器追擊 — Resolve relics left to right
  // ════════════════════════════════════════════════════════════
  for (const relic of relics) {
    if (!relic.isActive) continue; // Silenced relics don't trigger

    // TODO: Resolve actual relic effects from relic definitions
    // For now, relics are placeholder — will be implemented in Sprint 5
    // Example: addStep(ctx, 4, `relic:${relic.definitionId}`, ...);
  }

  // ════════════════════════════════════════════════════════════
  // Calculate final damage
  // ════════════════════════════════════════════════════════════
  const finalDamage = Math.floor(ctx.atk * ctx.dmgMult);

  return {
    handType: evalResult.handType,
    finalDamage,
    totalShield: ctx.shield,
    steps: ctx.steps,
  };
}

// ─── Enhancement Processing (GDD Phase 1 §4.3) ─────────────

function processEnhancement(ctx: SettlementContext, card: Card): void {
  switch (card.enhancement) {
    case 'bonus': {
      // +30 ATK
      addStep(ctx, 2, `card:${card.id}:enh`, '+30 ATK (Bonus)',
        ctx.atk + 30, ctx.dmgMult);
      break;
    }
    case 'glass': {
      // ×2 DMG Mult
      addStep(ctx, 2, `card:${card.id}:enh`, '×2 DMG Mult (Glass)',
        ctx.atk, ctx.dmgMult * 2);
      // 1/4 chance to shatter — handled by caller after settlement
      break;
    }
    case 'lucky': {
      // 1/5 chance: +20 DMG Mult
      const roll = ctx.rng.random('deck');
      if (roll < 0.2) {
        addStep(ctx, 2, `card:${card.id}:enh`, '+20 DMG Mult (Lucky!)',
          ctx.atk, ctx.dmgMult + 20);
      }
      // 1/15 chance: +money (handled by economy, not damage)
      break;
    }
    case 'stone': {
      // +50 ATK (stone cards always score regardless of hand type)
      addStep(ctx, 2, `card:${card.id}:enh`, '+50 ATK (Stone)',
        ctx.atk + 50, ctx.dmgMult);
      break;
    }
    // gold, wild, steel — no direct damage effect during Phase 2
    // gold: +3 money at round end (economy)
    // wild: suit matching (handled in hand evaluator)
    // steel: handled in Phase 3 (held cards)
  }
}

// ─── Edition Processing (GDD Phase 1 §4.3 versions) ────────

function processEdition(ctx: SettlementContext, card: Card): void {
  switch (card.edition) {
    case 'foil': {
      // +50 ATK
      addStep(ctx, 2, `card:${card.id}:ed`, '+50 ATK (Foil)',
        ctx.atk + 50, ctx.dmgMult);
      break;
    }
    case 'holographic': {
      // +10 DMG Mult
      addStep(ctx, 2, `card:${card.id}:ed`, '+10 DMG Mult (Holographic)',
        ctx.atk, ctx.dmgMult + 10);
      break;
    }
    case 'polychrome': {
      // ×1.5 DMG Mult
      addStep(ctx, 2, `card:${card.id}:ed`, '×1.5 DMG Mult (Polychrome)',
        ctx.atk, ctx.dmgMult * 1.5);
      break;
    }
    case 'negative': {
      // +1 relic slot — no direct damage effect
      break;
    }
  }
}

// ─── Seal Processing (GDD Phase 1 §4.3 seals) ──────────────

function processSeal(ctx: SettlementContext, card: Card): void {
  switch (card.seal) {
    case 'red': {
      // Re-trigger this card (process its enhancement + edition again)
      if (card.enhancement) processEnhancement(ctx, card);
      if (card.edition) processEdition(ctx, card);
      break;
    }
    // blue, gold_seal, purple — non-damage effects
    // blue: generate random elixir (consumable system)
    // gold_seal: +3 money at round end (economy)
    // purple: on destroy trigger random pact (destruction system)
  }
}

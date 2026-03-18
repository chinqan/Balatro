// ============================================================
// Relic Manager — Phase 4 of 4-stage battle settlement
// GDD Phase 1 §2: Relic resolution (Left-to-Right, RT chains)
// ============================================================
//
// 結算順序（GDD 階段四：神器追擊）：
//   遺物由左至右依序觸發，RT 型遺物觸發後立即重觸發目標，
//   連鎖次數硬上限 = 50（防無限循環）。
// ============================================================

import type { PlayerState, RelicInstance, RelicEffect, HandType } from '@/types';
import { getRelicById } from '@/data/relics';
import { EventBus } from '@/core/event-bus';
import type { SeedManager } from '@/core/rng';

const CHAIN_LIMIT = 50;  // GDD Phase 6 §1.1: 防無限循環

export interface RelicTriggerContext {
  handType: HandType;
  cardsPlayed: number;
  suitsCount: number;            // distinct suits in played hand
  hasEnhancedCard: boolean;
  currentRound: number;
  firstPlayThisBattle: boolean;
  moneyBefore: number;
}

export interface RelicSettlementResult {
  atkBonus: number;
  dmgBonus: number;
  dmgMult: number;               // multiplicative, starts at 1
  shieldBonus: number;
  hpBonus: number;
  moneyBonus: number;
  retriggeredCount: number;
  chainCount: number;
  steps: Array<{ relicId: string; atkBonus: number; dmgBonus: number; dmgMult: number }>;
}

export class RelicManager {
  private _firstPlayDone = new Set<string>();  // definitionId → fired this battle

  constructor(
    private readonly _rng: SeedManager,
    private readonly _events: EventBus,
  ) {}

  onBattleStart(): void {
    this._firstPlayDone.clear();
  }

  /**
   * Run the full Phase 4 relic settlement.
   */
  settleRelics(
    relics: RelicInstance[],
    ctx: RelicTriggerContext,
    reverse = false,
  ): RelicSettlementResult {
    const result: RelicSettlementResult = {
      atkBonus: 0, dmgBonus: 0, dmgMult: 1,
      shieldBonus: 0, hpBonus: 0, moneyBonus: 0,
      retriggeredCount: 0, chainCount: 0, steps: [],
    };

    const ordered = reverse ? [...relics].reverse() : [...relics];
    let chainCount = 0;

    const triggerRelic = (instance: RelicInstance): void => {
      if (chainCount >= CHAIN_LIMIT) return;
      chainCount++;

      // Skip silenced relics (Boss mechanic: relic_silence)
      if (!instance.isActive) return;

      const def = getRelicById(instance.definitionId);
      if (!def) return;

      const eff: RelicEffect = def.effect;

      // ── Check if this relic fires in this context ──
      if (!this._shouldTrigger(eff, ctx, instance.definitionId)) return;

      // ── Probabilistic checks ──
      if (eff.chance !== undefined && this._rng.random('loot') > eff.chance) return;

      // ── Break check (e.g. R019 超新星 1/10 碎裂) ──
      if (eff.breakChance !== undefined && this._rng.random('loot') < eff.breakChance) {
        instance.isActive = false;  // Permanently deactivate
        return;
      }

      // ── Apply primary effect ──
      const step = { relicId: instance.definitionId, atkBonus: 0, dmgBonus: 0, dmgMult: 1 };

      if (eff.stat === 'atk') {
        result.atkBonus += eff.value;
        step.atkBonus = eff.value;
      } else if (eff.stat === 'atk_gamble') {
        // R038: 1-3 → -10 ATK, 4-6 → +30 ATK (50/50 coin flip)
        const roll = this._rng.random('loot') < 0.5 ? -(eff.sideEffect?.value ?? 10) : eff.value;
        result.atkBonus += roll;
        step.atkBonus = roll;
      } else if (eff.stat === 'dmg') {
        result.dmgBonus += eff.value;
        step.dmgBonus = eff.value;
      } else if (eff.stat === 'dmg_mult') {
        result.dmgMult *= eff.value;
        step.dmgMult = eff.value;
      } else if (eff.stat === 'shield') {
        result.shieldBonus += eff.value;
      } else if (eff.stat === 'hp') {
        result.hpBonus += eff.value;
      } else if (eff.stat === 'money' || eff.stat === 'interest') {
        result.moneyBonus += eff.value;
      }

      // ── Side effects (e.g. R008 血染短刀: +30 ATK but -5 HP) ──
      if (eff.sideEffect) {
        const side = eff.sideEffect;
        if (side.stat === 'hp')  result.hpBonus += side.value;
        if (side.stat === 'atk') { result.atkBonus += side.value; step.atkBonus += side.value; }
      }

      // ── RT: retrigger logic ──
      if (eff.type === 'retrigger') {
        this._handleRetrigger(eff.stat, ordered, triggerRelic, result);
      }

      result.steps.push(step);
    };

    for (const relic of ordered) {
      triggerRelic(relic);
    }

    result.chainCount = chainCount;
    return result;
  }

  /**
   * Apply round-start relic effects (shield/hp/money per round).
   */
  applyRoundStartEffects(relics: RelicInstance[], player: PlayerState, round: number): void {
    for (const instance of relics) {
      if (!instance.isActive) continue;
      const def = getRelicById(instance.definitionId);
      if (!def || def.effect.type !== 'on_round_start') continue;
      const eff = def.effect;
      if (eff.condition === 'round_gte_3' && round < 3) continue;
      if (eff.condition === 'money_gte_20' && player.money < 20) continue;

      this._applyStatToPlayer(player, eff.stat, eff.value);
    }
  }

  /** Apply battle-start relic effects. */
  applyBattleStartEffects(relics: RelicInstance[], player: PlayerState): void {
    for (const instance of relics) {
      if (!instance.isActive) continue;
      const def = getRelicById(instance.definitionId);
      if (!def || def.effect.type !== 'on_battle_start') continue;
      this._applyStatToPlayer(player, def.effect.stat, def.effect.value);
    }
  }

  /** Apply end-of-battle relic effects (money rewards, heal). */
  applyBattleEndEffects(relics: RelicInstance[], player: PlayerState): void {
    for (const instance of relics) {
      if (!instance.isActive) continue;
      const def = getRelicById(instance.definitionId);
      if (!def || def.effect.type !== 'on_battle_end') continue;
      const eff = def.effect;
      if (eff.stat === 'money') {
        player.money += eff.value;
        this._events.emit('economy:money_changed', { current: player.money, delta: eff.value });
      } else {
        this._applyStatToPlayer(player, eff.stat, eff.value);
      }
    }
  }

  /** Life-steal: called after damage is dealt. */
  applyLifeSteal(relics: RelicInstance[], player: PlayerState, damageDealt: number): void {
    for (const instance of relics) {
      if (!instance.isActive) continue;
      const def = getRelicById(instance.definitionId);
      if (!def || def.effect.stat !== 'life_steal') continue;
      const heal = Math.floor(damageDealt * def.effect.value);
      if (heal > 0) {
        player.hp = Math.min(player.maxHp, player.hp + heal);
        this._events.emit('battle:hp_changed', { current: player.hp, max: player.maxHp, delta: heal });
      }
    }
  }

  // ─── Private Helpers ──────────────────────────────────────

  private _applyStatToPlayer(player: PlayerState, stat: string, value: number): void {
    if (stat === 'shield')   player.shield   = Math.min(100, player.shield + value);
    else if (stat === 'hp')  player.hp       = Math.min(player.maxHp, player.hp + value);
    else if (stat === 'money') player.money  += value;
    else if (stat === 'discards') player.discards += value;
  }

  private _shouldTrigger(
    eff: RelicEffect,
    ctx: RelicTriggerContext,
    definitionId: string,
  ): boolean {
    switch (eff.type) {
      case 'on_play':         return true;
      case 'on_final_damage': return true;
      case 'on_score':        return true;
      case 'retrigger':       return true;

      case 'on_first_play':
        if (this._firstPlayDone.has(definitionId)) return false;
        this._firstPlayDone.add(definitionId);
        return ctx.firstPlayThisBattle;

      case 'after_discard':   return false;  // triggered separately

      case 'on_hand_type': {
        const c = eff.condition ?? '';
        if (c === 'pair')             return ctx.handType === 'pair';
        if (c === 'two_pair')         return ctx.handType === 'two_pair';
        if (c === 'three_of_a_kind')  return ctx.handType === 'three_of_a_kind';
        if (c === 'straight')         return ctx.handType === 'straight';
        if (c === 'flush')            return ctx.handType === 'flush';
        if (c === 'full_house')       return ctx.handType === 'full_house';
        if (c === 'straight_flush')   return ctx.handType === 'straight_flush' || ctx.handType === 'royal_flush';
        return false;
      }

      case 'conditional': {
        const c = eff.condition ?? '';
        if (c === 'has_enhanced_card')   return ctx.hasEnhancedCard;
        if (c === 'cards_played_gte_3')  return ctx.cardsPlayed >= 3;
        if (c === 'cards_played_gte_4')  return ctx.cardsPlayed >= 4;
        if (c === 'hand_size_gte_7')     return ctx.cardsPlayed >= 7;
        if (c === 'suits_gte_4')         return ctx.suitsCount >= 4;
        if (c === 'money_gte_20')        return ctx.moneyBefore >= 20;
        if (c === 'round_gte_3')         return ctx.currentRound >= 3;
        return false;
      }

      case 'on_round_start':  return false;  // handled by applyRoundStartEffects
      case 'on_battle_start': return false;  // handled by applyBattleStartEffects
      case 'on_battle_end':   return false;  // handled by applyBattleEndEffects
      case 'passive':         return false;  // passive, no trigger
      default:                return false;
    }
  }

  private _handleRetrigger(
    stat: string,
    relics: RelicInstance[],
    triggerFn: (r: RelicInstance) => void,
    result: RelicSettlementResult,
  ): void {
    result.retriggeredCount++;
    if (stat === 'last_relic') {
      const last = [...relics].reverse().find(r => {
        const def = getRelicById(r.definitionId);
        return def && def.effect.type !== 'retrigger';
      });
      if (last) triggerFn(last);
    } else if (stat === 'all_atk_relics') {
      for (const r of relics) {
        const def = getRelicById(r.definitionId);
        if (def && def.effect.stat === 'atk') triggerFn(r);
      }
    } else if (stat === 'all_relics') {
      for (const r of relics) triggerFn(r);
    }
  }
}

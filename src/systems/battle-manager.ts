// ============================================================
// Battle Manager — The complete battle state machine
// GDD Phase 1 §3: Player Turn → Settlement → Boss Turn → ...
// ============================================================

import type { Card, HandType, RelicInstance, SettlementResult, PlayerState, BossDefinition } from '@/types';
import type { SeedManager } from '@/core/rng';
import { EventBus } from '@/core/event-bus';
import { DeckManager } from '@/systems/deck-manager';
import { calculateDamage } from '@/systems/damage-calculator';
import { type BossState, createBossState, applyDamageToBoss, executeBossIntent, generateNextIntent } from '@/models/boss';
import { applyDamageToPlayer, addShield, resetRoundResources } from '@/models/player';
import { updateStatsAfterSettlement, type RunStats } from '@/models/run-state';

// ─── Battle Phases ──────────────────────────────────────────

export type BattlePhase =
  | 'round_start'     // Draw cards, reset resources
  | 'player_turn'     // Player selects and plays/discards cards
  | 'settlement'      // 4-phase damage calculation + animation data
  | 'boss_turn'       // Boss executes intent, takes damage
  | 'round_end'       // Check win/lose, prepare next round
  | 'victory'         // Boss defeated
  | 'defeat';         // Player HP <= 0

// ─── Battle Manager ─────────────────────────────────────────

export class BattleManager {
  private _phase: BattlePhase = 'round_start';
  private _round = 0;
  private _lastSettlement: SettlementResult | null = null;

  // ── Debug / Test Mode ──────────────────────────────────────
  /** When true: discards are not consumed; plays are not consumed */
  debugMode = false;
  infiniteDiscards = false;
  infinitePlays = false;

  constructor(
    private readonly _player: PlayerState,
    private readonly _deck: DeckManager,
    private readonly _boss: BossState,
    private readonly _relics: RelicInstance[],
    private readonly _handLevels: Record<HandType, number>,
    private readonly _rng: SeedManager,
    private readonly _events: EventBus,
    private readonly _stats: RunStats,
  ) {}

  // ═══ Accessors ═══════════════════════════════════════════

  get phase(): BattlePhase { return this._phase; }
  get round(): number { return this._round; }
  get player(): Readonly<PlayerState> { return this._player; }
  get boss(): Readonly<BossState> { return this._boss; }
  get hand(): readonly Card[] { return this._deck.state.hand; }
  get lastSettlement(): SettlementResult | null { return this._lastSettlement; }

  /** Return all cards across draw/hand/discard for deck viewer (GDD Phase 4 §1.2) */
  getAllCards(): Card[] { return this._deck.getAllActiveCards(); }

  // ── Debug helpers ──────────────────────────────────────────

  /** Add money directly (debug mode only) */
  debugAddMoney(amount: number): void {
    this._player.money += amount;
    this._events.emit('economy:money_changed', {
      current: this._player.money,
      delta: amount,
    });
  }

  /** Restore plays and discards to initial values */
  debugRefillResources(): void {
    // Re-read initial values from config defaults
    this._player.plays    = Math.max(4, this._player.plays);
    this._player.discards = Math.max(3, this._player.discards);
    // HUD will re-read player state on next poll
  }

  /** Force boss defeat (debug) — properly sets phase and emits event */
  debugForceVictory(): void {
    this._boss.hp = 0;
    this._phase = 'victory';
    this._stats.bossesDefeated++;
    this._events.emit('battle:boss_defeated', {
      bossId: this._boss.definition.id,
      floor: this._boss.definition.floor,
    });
  }

  /** Force player defeat (debug) */
  debugForceDefeat(): void {
    this._player.hp = 0;
    this._phase = 'defeat';
    this._events.emit('battle:player_defeated', {});
  }

  // ═══ Phase: Round Start ══════════════════════════════════

  /**
   * Begin a new round: reset resources + draw cards.
   */
  startRound(): void {
    this._phase = 'round_start';
    this._round++;

    // Reset plays/discards/shield
    resetRoundResources(this._player);

    // Apply mechanic: action_limit → reduce plays
    for (const mech of this._boss.activeMechanics) {
      if (mech.type === 'action_limit') {
        const reduction = parseInt(mech.value ?? '1');
        this._player.plays = Math.max(1, this._player.plays - reduction);
      }
    }

    // Draw up to hand size
    const toDraw = this._player.handSize - this._deck.state.hand.length;
    if (toDraw > 0) {
      this._deck.draw(toDraw, this._rng);
    }

    this._events.emit('battle:turn_start', { turn: this._round, phase: 'player' });
    this._phase = 'player_turn';
  }

  // ═══ Phase: Player Turn ══════════════════════════════════

  /**
   * Player plays selected cards. Transitions to settlement.
   * @returns The settlement result for animation playback.
   */
  playCards(selectedIndices: number[]): SettlementResult {
    if (this._phase !== 'player_turn') {
      throw new Error(`Cannot play cards in phase: ${this._phase}`);
    }
    if (this._player.plays <= 0) {
      throw new Error('No plays remaining');
    }
    if (selectedIndices.length === 0) {
      throw new Error('Must select at least 1 card');
    }

    // Remove selected cards from hand
    const playedCards = this._deck.playCards(selectedIndices);
    const heldCards = [...this._deck.state.hand]; // Remaining cards in hand

    // Check suit_block mechanic — debuff blocked-suit cards
    for (const mech of this._boss.activeMechanics) {
      if (mech.type === 'suit_block' && mech.value) {
        for (const card of playedCards) {
          if (card.suit === mech.value) {
            card.isDebuffed = true;
          }
        }
      }
    }

    // Consume a play
    this._player.plays--;

    // Run 4-phase settlement
    this._phase = 'settlement';
    const result = calculateDamage(
      playedCards,
      heldCards,
      this._relics,
      this._handLevels,
      this._rng,
    );

    this._lastSettlement = result;

    // Update stats
    updateStatsAfterSettlement(
      this._stats,
      result.finalDamage,
      result.handType,
      result.steps.length,
    );

    // Apply shield generated
    if (result.totalShield > 0) {
      addShield(this._player, result.totalShield);
      this._events.emit('battle:shield_gained', {
        amount: result.totalShield,
        source: 'settlement',
      });
    }

    // Apply damage to boss
    const bossResult = applyDamageToBoss(this._boss, result.finalDamage);

    this._events.emit('battle:damage_dealt', {
      damage: bossResult.damageDealt,
      targetHp: this._boss.hp,
      steps: result.steps,
    });
    this._events.emit('battle:card_played', {
      cardIds: playedCards.map(c => c.id),
      handType: result.handType,
    });

    // Reset debuffed state on played cards
    for (const card of playedCards) {
      card.isDebuffed = false;
    }

    // Move played cards to discard pile
    this._deck.discardCards(playedCards);

    // Handle glass card shattering (1/4 chance)
    for (const card of playedCards) {
      if (card.enhancement === 'glass') {
        if (this._rng.random('deck') < 0.25) {
          this._deck.removeCard(card.id);
          this._events.emit('deck:card_destroyed', { cardId: card.id });
        }
      }
    }

    // Draw replacement cards to refill hand
    const toDraw = Math.min(
      this._player.handSize - this._deck.state.hand.length,
      this._deck.state.drawPile.length,
    );
    if (toDraw > 0) {
      this._deck.draw(toDraw, this._rng);
      this._events.emit('deck:cards_drawn', { count: toDraw });
    }

    // Check if boss is defeated
    if (this._boss.hp <= 0) {
      this._phase = 'victory';
      this._events.emit('battle:boss_defeated', {
        bossId: this._boss.definition.id,
        floor: this._boss.definition.floor,
      });
      this._stats.bossesDefeated++;
      return result;
    }

    // If player still has plays, return to player_turn
    if (this._player.plays > 0) {
      this._phase = 'player_turn';
    } else {
      // No more plays → boss turn
      this._phase = 'boss_turn';
    }

    return result;
  }

  /**
   * Player discards selected cards (to draw better ones).
   */
  discardCards(selectedIndices: number[]): void {
    if (this._phase !== 'player_turn') {
      throw new Error(`Cannot discard in phase: ${this._phase}`);
    }
    if (this._player.discards <= 0) {
      throw new Error('No discards remaining');
    }
    if (selectedIndices.length === 0) {
      throw new Error('Must select at least 1 card');
    }

    const discarded = this._deck.discardFromHand(selectedIndices);
    if (!this.infiniteDiscards) {
      this._player.discards--;
    }

    this._events.emit('deck:cards_discarded', {
      cardIds: discarded.map(c => c.id),
    });

    // Draw replacement cards
    const toDraw = Math.min(
      discarded.length,
      this._player.handSize - this._deck.state.hand.length,
    );
    if (toDraw > 0) {
      this._deck.draw(toDraw, this._rng);
      this._events.emit('deck:cards_drawn', { count: toDraw });
    }
  }

  /**
   * Player ends their turn voluntarily (even with plays remaining).
   */
  endPlayerTurn(): void {
    if (this._phase !== 'player_turn') {
      throw new Error(`Cannot end turn in phase: ${this._phase}`);
    }
    this._phase = 'boss_turn';
  }

  // ═══ Phase: Boss Turn ════════════════════════════════════

  /**
   * Execute the boss's announced intent.
   * Returns the damage dealt to the player.
   */
  executeBossTurn(): {
    intentType: string;
    damageToPlayer: number;
    shieldAbsorbed: number;
    hpLost: number;
    bossShieldAdded: number;
    bossHpHealed: number;
  } {
    if (this._phase !== 'boss_turn') {
      throw new Error(`Cannot execute boss turn in phase: ${this._phase}`);
    }

    this._events.emit('battle:turn_start', { turn: this._round, phase: 'boss' });

    // Execute intent
    const bossAction = executeBossIntent(this._boss);

    let damageToPlayer = 0;
    let shieldAbsorbed = 0;
    let hpLost = 0;

    if (bossAction.damage > 0) {
      // AOE damages both shield and HP simultaneously (ignoring shield)
      if (bossAction.type === 'aoe') {
        hpLost = Math.min(this._player.hp, bossAction.damage);
        this._player.hp -= hpLost;
        this._player.shield = Math.max(0, this._player.shield - bossAction.damage);
        damageToPlayer = bossAction.damage;
      } else {
        // Standard: shield absorbs first
        const result = applyDamageToPlayer(this._player, bossAction.damage);
        shieldAbsorbed = result.shieldAbsorbed;
        hpLost = result.hpLost;
        damageToPlayer = bossAction.damage;
      }

      this._events.emit('battle:boss_attack', {
        damage: damageToPlayer,
        type: bossAction.type,
      });
      this._events.emit('battle:hp_changed', {
        current: this._player.hp,
        max: this._player.maxHp,
        delta: -hpLost,
      });
    }

    // Check player defeat
    if (this._player.hp <= 0) {
      this._phase = 'defeat';
      this._events.emit('battle:player_defeated', {});
      return {
        intentType: bossAction.type,
        damageToPlayer,
        shieldAbsorbed,
        hpLost,
        bossShieldAdded: bossAction.shieldAdded,
        bossHpHealed: bossAction.hpHealed,
      };
    }

    this._events.emit('battle:turn_end', { turn: this._round, phase: 'boss' });

    // Advance boss turn counter and generate next intent
    this._boss.turn++;
    this._boss.currentIntent = generateNextIntent(this._boss, this._rng);

    // Transition to round end → next round
    this._phase = 'round_end';

    return {
      intentType: bossAction.type,
      damageToPlayer,
      shieldAbsorbed,
      hpLost,
      bossShieldAdded: bossAction.shieldAdded,
      bossHpHealed: bossAction.hpHealed,
    };
  }

  // ═══ Phase: Round End ════════════════════════════════════

  /**
   * End the round: discard remaining hand, prepare next round.
   */
  endRound(): void {
    if (this._phase !== 'round_end') {
      throw new Error(`Cannot end round in phase: ${this._phase}`);
    }

    // Handle gold card / gold seal money at round end
    for (const card of this._deck.state.hand) {
      if (card.enhancement === 'gold' || card.seal === 'gold_seal') {
        this._player.money += 3;
        this._events.emit('economy:money_changed', {
          current: this._player.money,
          delta: 3,
        });
      }
    }

    // ── Remaining plays/discards → money (GDD Phase 2 §3.1 + Phase 8 §4.1) ──
    const bonusFromPlays = this._player.plays;
    const bonusFromDiscards = this._player.discards;
    const totalBonus = bonusFromPlays + bonusFromDiscards;
    if (totalBonus > 0) {
      this._player.money += totalBonus;
      this._events.emit('economy:settlement_bonus', {
        remainingPlays: bonusFromPlays,
        remainingDiscards: bonusFromDiscards,
        totalBonus,
        moneyAfter: this._player.money,
      });
    }

    // Discard all hand cards
    this._deck.discardAllHand();

    // Start next round
    this.startRound();
  }

  // ═══ Utility ═════════════════════════════════════════════

  /**
   * Check if player can play cards.
   */
  get canPlay(): boolean {
    return this._phase === 'player_turn' && this._player.plays > 0;
  }

  /**
   * Check if player can discard cards.
   */
  get canDiscard(): boolean {
    return this._phase === 'player_turn' && this._player.discards > 0;
  }

  /**
   * Check if battle is over.
   */
  get isOver(): boolean {
    return this._phase === 'victory' || this._phase === 'defeat';
  }

  /**
   * Get the damage ratio for the last settlement (for animation intensity).
   */
  get lastDamageRatio(): number {
    if (!this._lastSettlement) return 0;
    return this._lastSettlement.finalDamage / this._boss.maxHp;
  }
}

// ─── Factory ────────────────────────────────────────────────

/**
 * Create a new battle from a boss definition.
 */
export function createBattle(
  player: PlayerState,
  deck: DeckManager,
  bossDef: BossDefinition,
  relics: RelicInstance[],
  handLevels: Record<HandType, number>,
  rng: SeedManager,
  events: EventBus,
  stats: RunStats,
): BattleManager {
  const boss = createBossState(bossDef, rng);
  return new BattleManager(player, deck, boss, relics, handLevels, rng, events, stats);
}

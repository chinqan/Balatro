// ============================================================
// Run Manager — Orchestrates Floor → Battle → Shop → Next cycle
// GDD Phase 2 §1: Dungeon structure & Phase 8: Game flow
// ============================================================

import type { PlayerState, HandType, RelicInstance } from '@/types';
import type { SeedManager } from '@/core/rng';
import { EventBus } from '@/core/event-bus';
import { DeckManager } from '@/systems/deck-manager';
import { BattleManager, createBattle } from '@/systems/battle-manager';
import { ShopManager, calculateBattleRewards } from '@/systems/shop-manager';
import { createInitialPlayerState, createDefaultHandLevels } from '@/models/player';
import { createStandardDeck } from '@/models/card';
import { createInitialRunStats, type RunStats } from '@/models/run-state';
import { getBossForFloor, FLOOR_ENEMY_HP } from '@/data/bosses';

// ─── Skip Reward ─────────────────────────────────────────────
export interface SkipReward {
  kind: 'gold' | 'consumable' | 'relic_random';
  amount: number;
  label: string;
  icon: string;
}

// ─── Run Phase ──────────────────────────────────────────────

export type RunPhase =
  | 'map'            // Viewing dungeon map, selecting next encounter
  | 'pre_battle'     // Brief transition / encounter intro
  | 'battle'         // Active battle (BattleManager handles sub-phases)
  | 'post_battle'    // Victory rewards & transition
  | 'shop'           // Shopping
  | 'game_over'      // Player died
  | 'victory';       // Completed floor 8

export type EncounterType = 'standard' | 'elite' | 'boss';

export interface FloorData {
  floor: number;
  encounters: EncounterType[];
  currentEncounter: number;
  completed: boolean;
}

// ─── Run Manager ────────────────────────────────────────────

export class RunManager {
  private _phase: RunPhase = 'map';
  private _floors: FloorData[] = [];
  private _currentFloor = 0;

  readonly player: PlayerState;
  readonly deck: DeckManager;
  readonly handLevels: Record<HandType, number>;
  readonly relics: RelicInstance[] = [];
  readonly stats: RunStats;

  private _battle: BattleManager | null = null;
  private _shop: ShopManager | null = null;

  constructor(
    private readonly _rng: SeedManager,
    private readonly _events: EventBus,
    _seed?: string,
  ) {
    this.player = createInitialPlayerState();
    this.deck = new DeckManager(createStandardDeck());
    this.deck.shuffle(this._rng);
    this.handLevels = createDefaultHandLevels();
    this.stats = createInitialRunStats();

    // Generate dungeon structure (GDD Phase 2 §1.1)
    this._generateDungeon();
  }

  // ═══ Accessors ═══════════════════════════════════════════

  get phase(): RunPhase { return this._phase; }
  get currentFloor(): number { return this._currentFloor; }
  get floors(): readonly FloorData[] { return this._floors; }
  get battle(): BattleManager | null { return this._battle; }
  get shop(): ShopManager | null { return this._shop; }

  get currentFloorData(): FloorData | undefined {
    return this._floors[this._currentFloor];
  }

  // ═══ Dungeon Generation ══════════════════════════════════

  private _generateDungeon(): void {
    this._floors = [];
    for (let f = 0; f < 8; f++) {
      const encounters: EncounterType[] = [];

      if (f === 0) {
        // Floor 1: standard → standard → boss
        encounters.push('standard', 'standard', 'boss');
      } else {
        // Floor 2+: standard → elite → boss
        encounters.push('standard', 'elite', 'boss');
      }

      this._floors.push({
        floor: f + 1,
        encounters,
        currentEncounter: 0,
        completed: false,
      });
    }
    this._currentFloor = 0;
  }

  // ═══ Flow Control ════════════════════════════════════════

  /**
   * Start the next encounter on the current floor.
   */
  startNextEncounter(): void {
    const floorData = this._floors[this._currentFloor];
    if (!floorData) {
      this._phase = 'victory';
      return;
    }

    if (floorData.currentEncounter >= floorData.encounters.length) {
      // Floor completed — advance
      floorData.completed = true;
      this._currentFloor++;

      if (this._currentFloor >= 8) {
        this._phase = 'victory';
        this._events.emit('run:victory', {});
        return;
      }

      this._phase = 'map';
      return;
    }

    const encounterType = floorData.encounters[floorData.currentEncounter];
    this._phase = 'pre_battle';

    // Create battle
    const floor = floorData.floor;
    const bossDef = getBossForFloor(floor);

    if (!bossDef) {
      // Fallback: create a generic enemy battle using floor HP
      const hp = FLOOR_ENEMY_HP[floor];
      const enemyHp = encounterType === 'standard' ? hp?.standard :
                      encounterType === 'elite' ? hp?.elite :
                      hp?.boss;

      // Use floor boss as template with adjusted HP
      const templateBoss = getBossForFloor(Math.min(floor, 8)) ?? getBossForFloor(1)!;
      const adjustedBoss = {
        ...templateBoss,
        baseHp: enemyHp ?? 100,
        name: encounterType === 'boss' ? templateBoss.name :
              encounterType === 'elite' ? `菁英怪 F${floor}` : `普通怪 F${floor}`,
        mechanics: encounterType === 'boss' ? templateBoss.mechanics : [],
      };

      this._battle = createBattle(
        this.player, this.deck, adjustedBoss,
        this.relics, this.handLevels, this._rng, this._events, this.stats,
      );
    } else {
      this._battle = createBattle(
        this.player, this.deck, bossDef,
        this.relics, this.handLevels, this._rng, this._events, this.stats,
      );
    }

    this._phase = 'battle';
    this._events.emit('run:encounter_start', {
      floor,
      encounter: floorData.currentEncounter,
      type: encounterType,
    });
  }

  /**
   * Called when a battle ends (victory).
   * Awards rewards and transitions to shop.
   */
  onBattleVictory(): void {
    const floorData = this._floors[this._currentFloor];
    if (!floorData) return;

    const encounterType = floorData.encounters[floorData.currentEncounter];

    // Calculate and award rewards
    const rewards = calculateBattleRewards(
      encounterType,
      this.player.money,
    );

    this.player.money += rewards.total;
    this.stats.moneyEarned += rewards.total;

    this._events.emit('economy:money_changed', {
      current: this.player.money,
      delta: rewards.total,
    });

    floorData.currentEncounter++;
    this._battle = null;

    // After ANY encounter, go to shop
    this._phase = 'shop';
    this._shop = new ShopManager(this._rng, floorData.floor);
  }

  /**
   * Called when a battle ends (defeat).
   */
  onBattleDefeat(): void {
    this._phase = 'game_over';
    this._battle = null;
    this._events.emit('run:game_over', {
      floor: this._currentFloor + 1,
      stats: this.stats,
    });
  }

  // ─── Skip Reward ────────────────────────────────────────────
  /** What the player gets for skipping an encounter */
  lastSkipReward: SkipReward | null = null;

  /**
   * Skip the current encounter and immediately grant a skip reward.
   * Standard skip → minor reward; Elite skip → better reward.
   * Only non-boss encounters can be skipped.
   */
  skipEncounter(): boolean {
    const floorData = this._floors[this._currentFloor];
    if (!floorData) return false;

    const encounterType = floorData.encounters[floorData.currentEncounter];
    if (encounterType === 'boss') return false; // Can't skip boss

    // Determine and apply reward
    const reward = this._generateSkipReward(encounterType);
    this._applySkipReward(reward);
    this.lastSkipReward = reward;

    floorData.currentEncounter++;
    this._phase = 'map';

    this._events.emit('run:encounter_skipped', { type: encounterType } as any);
    return true;
  }

  private _generateSkipReward(type: 'standard' | 'elite'): SkipReward {
    const roll = this._rng.random('skip');
    if (type === 'elite') {
      // Elite skip: 40% gold, 35% consumable slot, 25% random relic
      if (roll < 0.40) return { kind: 'gold',       amount: 8,  label: '+8 金',       icon: '💰' };
      if (roll < 0.75) return { kind: 'consumable',  amount: 1,  label: '消耗品槽 +1', icon: '🧪' };
      return                  { kind: 'relic_random', amount: 0,  label: '隨機遺物',    icon: '🔮' };
    } else {
      // Standard skip: 55% gold, 30% consumable slot, 15% small gold bonus
      if (roll < 0.55) return { kind: 'gold',      amount: 4, label: '+4 金',       icon: '💰' };
      if (roll < 0.85) return { kind: 'consumable', amount: 1, label: '消耗品槽 +1', icon: '🧪' };
      return                  { kind: 'gold',       amount: 6, label: '+6 金（幸運）', icon: '💰' };
    }
  }

  private _applySkipReward(reward: SkipReward): void {
    if (reward.kind === 'gold') {
      this.player.money += reward.amount;
      this.stats.moneyEarned += reward.amount;
      this._events.emit('economy:money_changed', { current: this.player.money, delta: reward.amount });
    } else if (reward.kind === 'consumable') {
      this.player.maxConsumables = Math.min(this.player.maxConsumables + 1, 5);
    }
    // relic_random: applied externally by game.ts after getRandomRelic()
  }

  /**
   * Leave the shop and continue the run.
   */
  leaveShop(): void {
    this._shop = null;

    const floorData = this._floors[this._currentFloor];
    if (floorData && floorData.currentEncounter >= floorData.encounters.length) {
      // Floor complete → advance
      floorData.completed = true;
      this._currentFloor++;

      if (this._currentFloor >= 8) {
        this._phase = 'victory';
        this._events.emit('run:victory', {});
        return;
      }
    }

    this._phase = 'map';
  }

  /**
   * Proceed from post-battle (non-boss) to next encounter.
   */
  proceedToNextEncounter(): void {
    if (this._phase !== 'post_battle') return;
    this._phase = 'map';
  }
}

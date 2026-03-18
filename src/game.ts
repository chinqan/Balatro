// ============================================================
// Game — Main orchestrator: RunManager + Scene transitions
// GDD Phase 8 §1.1: Complete state flow
// ============================================================

import { Application } from 'pixi.js';
import { createClock, runFixedTimestep, type ClockController } from '@/core/clock';
import { EventBus } from '@/core/event-bus';
import { SceneManager } from '@/scenes/scene-manager';
import { AudioManager } from '@/audio/audio-manager';
import { SeedManager } from '@/core/rng';
import { RunManager } from '@/systems/run-manager';
import { BattleScene } from '@/scenes/battle-scene';
import { MapScene } from '@/scenes/map-scene';
import { ShopScene } from '@/scenes/shop-scene';
import { TitleScene } from '@/scenes/title-scene';
import { StakeSelectScene } from '@/scenes/stake-select-scene';
import { SettlementScene } from '@/scenes/settlement-scene';
import { CollectionScene } from '@/scenes/collection-scene';
import { SettingsScene } from '@/scenes/settings-scene';
import { saveManager, buildSaveData } from '@/systems/save-manager';
import '@/systems/unlock-manager';  // ensure singleton is initialized

export class Game {
  readonly clock: ClockController;
  readonly events: EventBus;
  readonly scenes: SceneManager;
  readonly audio: AudioManager;
  readonly rng: SeedManager;

  private _accumulator = 0;
  private _started = false;
  private _run!: RunManager;
  private _currentStakeId = 0;
  private _currentDeckId = 'standard';

  // Scene references
  private _titleScene!: TitleScene;
  private _stakeScene!: StakeSelectScene;
  private _battleScene!: BattleScene;
  private _mapScene!: MapScene;
  private _shopScene!: ShopScene;
  private _settlementScene!: SettlementScene;
  private _collectionScene!: CollectionScene;
  private _settingsScene!: SettingsScene;

  constructor(private readonly _app: Application) {
    this.clock = createClock();
    this.events = new EventBus();
    this.scenes = new SceneManager(_app);
    this.audio = new AudioManager();
    this.rng = new SeedManager();
  }

  async init(): Promise<void> {
    // Audio: defer until first user interaction (iOS requirement)
    const initAudio = async () => {
      await this.audio.init();
      await this.audio.resume();
      document.removeEventListener('pointerdown', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    document.addEventListener('pointerdown', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    // ── Create and register scenes ──
    this._titleScene      = new TitleScene();
    this._stakeScene      = new StakeSelectScene();
    this._battleScene     = new BattleScene();
    this._mapScene        = new MapScene();
    this._shopScene       = new ShopScene();
    this._settlementScene = new SettlementScene();
    this._collectionScene = new CollectionScene();
    this._settingsScene   = new SettingsScene();

    this.scenes.register(this._titleScene);
    this.scenes.register(this._stakeScene);
    this.scenes.register(this._battleScene);
    this.scenes.register(this._mapScene);
    this.scenes.register(this._shopScene);
    this.scenes.register(this._settlementScene);
    this.scenes.register(this._collectionScene);
    this.scenes.register(this._settingsScene);

    // ── Wire Title Scene ──
    const hasSave = saveManager.hasSave();
    this._titleScene.setCallbacks({
      onNewRun: () => this._goToStakeSelect(),
      onContinue: hasSave ? () => this._continueRun() : null,
      onCollection: () => this.scenes.switchTo('collection'),
      onSettings: () => this.scenes.switchTo('settings'),
    });

    // ── Wire Collection Scene ──
    this._collectionScene.setOnBack(() => this.scenes.switchTo('title'));

    // ── Wire Settings Scene ──
    this._settingsScene.setOnBack(() => this.scenes.switchTo('title'));

    // ── Wire Stake Select Scene ──
    this._stakeScene.setCallbacks({
      onConfirm: (stakeId, deckId) => this._startNewRun(deckId, stakeId),
      onBack: () => this.scenes.switchTo('title'),
    });

    // ── Wire Settlement Scene ──
    this._settlementScene.setOnContinue(() => {
      this._mapScene.setRunManager(this._run);
      this._mapScene.refreshMap();
      this.scenes.switchTo('map');
    });
    this._settlementScene.setOnRestart(() => this._goToStakeSelect());

    // Start at title
    await this.scenes.switchTo('title');
  }

  // ─── Flow Helpers ─────────────────────────────────────────

  private _goToStakeSelect(): void {
    this.scenes.switchTo('stake_select');
  }

  private _startNewRun(deckId = 'standard', stakeId = 0): void {
    this._currentDeckId = deckId;
    this._currentStakeId = stakeId;
    saveManager.clear()          // Clear any old save

    this._run = new RunManager(this.rng, this.events, deckId);

    // Register beforeunload auto-save
    saveManager.registerBeforeUnload(() => this._buildSave());

    // Wire up map scene
    this._mapScene.setRunManager(this._run);
    this._mapScene.setOnStartEncounter(() => this._onStartEncounter());
    this._mapScene.setOnSkipEncounter(() => this._onSkipEncounter());

    // Wire up shop scene
    this._shopScene.setOnLeave(() => this._onLeaveShop());

    this.scenes.switchTo('map');
  }

  /** Restore a run from localStorage save */
  private _continueRun(): void {
    const save = saveManager.load();
    if (!save) {
      // Save invalid; go to stake select as fallback
      this._goToStakeSelect();
      return;
    }
    this._currentDeckId = save.deckId;
    this._currentStakeId = save.stakeId;
    this._run = new RunManager(this.rng, this.events, save.deckId);

    // Register beforeunload auto-save
    saveManager.registerBeforeUnload(() => this._buildSave());

    // Wire scenes
    this._mapScene.setRunManager(this._run);
    this._mapScene.setOnStartEncounter(() => this._onStartEncounter());
    this._mapScene.setOnSkipEncounter(() => this._onSkipEncounter());
    this._shopScene.setOnLeave(() => this._onLeaveShop());

    this.scenes.switchTo('map');
  }

  /** Build a save snapshot from current run state */
  private _buildSave() {
    return buildSaveData({
      phase: this._run.phase,
      currentFloor: this._run.currentFloor,
      floors: [...this._run.floors],
      player: this._run.player,
      deck: this._run.deck.state,
      handLevels: this._run.handLevels,
      relics: [...this._run.relics],
      blessings: [],
      stats: this._run.stats,
      stakeId: this._currentStakeId,
      deckId: this._currentDeckId,
    });
  }

  private async _onStartEncounter(): Promise<void> {
    this._run.startNextEncounter();

    if (this._run.phase === 'battle' && this._run.battle) {
      // Recreate battle scene for fresh state
      this._battleScene = new BattleScene();
      this.scenes.register(this._battleScene);

      this._battleScene.setBattleManager(this._run.battle);
      this._battleScene.setOnBattleEnd((result) => {
        if (result === 'victory') {
          this._run.onBattleVictory();
          saveManager.save(this._buildSave());  // Auto-save after victory

          if (this._run.phase === 'victory') {
            // Full run complete! Clear save.
            saveManager.clear();
            this._settlementScene.showComplete({
              stats: this._run.stats,
              seedCode: this.rng.masterSeedString,
            });
            this.scenes.switchTo('settlement');
          } else if (this._run.phase === 'shop' && this._run.shop) {
            // Show brief victory settlement then go to shop
            const encounterType = this._run.currentFloorData?.encounters[
              (this._run.currentFloorData?.currentEncounter ?? 1) - 1
            ] ?? 'standard';
            const eliteBonus = encounterType === 'elite' ? 2 : 0;
            const bossBonus  = encounterType === 'boss'  ? 5 : 0;
            this._settlementScene.showVictory({
              baseReward: 3,
              eliteBonus,
              bossBonus,
              remainingPlays: this._run.player.plays,
              remainingDiscards: this._run.player.discards,
              currentMoney: this._run.player.money,
              rewardChoices: [
                { type: 'relic', label: '隨機遺物', icon: '🔮' },
                { type: 'pack',  label: '卡包',     icon: '📦' },
                { type: 'skip',  label: '跳過',     icon: '⏩' },
              ],
            });
            this._settlementScene.setOnContinue(() => {
              if (this._run.shop) {
                this._shopScene.setShopManager(this._run.shop);
                this._shopScene.setPlayer(this._run.player);
                this.scenes.switchTo('shop');
              }
            });
            this.scenes.switchTo('settlement');
          } else {
            this._mapScene.refreshMap();
            this.scenes.switchTo('map');
          }
        } else {
          // Defeat
          this._run.onBattleDefeat();
          saveManager.clear();   // Clear save on defeat
          this._run.stats.currentFloor = this._run.currentFloor + 1;
          this._settlementScene.showDefeat({
            stats: this._run.stats,
            isNewRecord: false,
          });
          this._settlementScene.setOnContinue(() => this.scenes.switchTo('title'));
          this._settlementScene.setOnRestart(() => this._goToStakeSelect());
          this.scenes.switchTo('settlement');
        }
      });

      await this.scenes.switchTo('battle');
      this._battleScene.startBattle();
    } else if (this._run.phase === 'victory') {
      this._settlementScene.showComplete({
        stats: this._run.stats,
        seedCode: 'UNKNOWN',
      });
      this.scenes.switchTo('settlement');
    }
  }

  private _onSkipEncounter(): void {
    this._run.skipEncounter();
    this._mapScene.refreshMap();
  }

  private _onLeaveShop(): void {
    this._run.leaveShop();
    saveManager.save(this._buildSave());  // Auto-save on leaving shop

    if (this._run.phase === 'victory') {
      saveManager.clear();
      this._settlementScene.showComplete({
        stats: this._run.stats,
        seedCode: this.rng.masterSeedString,
      });
      this.scenes.switchTo('settlement');
    } else {
      this._mapScene.setRunManager(this._run);
      this._mapScene.refreshMap();
      this.scenes.switchTo('map');
    }
  }

  // ─── Main Loop ────────────────────────────────────────────

  start(): void {
    if (this._started) return;
    this._started = true;

    this._app.ticker.add(() => {
      const wallDelta = this._app.ticker.deltaMS / 1000;

      const [newAccum, _alpha] = runFixedTimestep(
        this._accumulator,
        this.clock,
        wallDelta,
        () => this._fixedUpdate(),
      );
      this._accumulator = newAccum;

      this.scenes.update(wallDelta);
    });
  }

  private _fixedUpdate(): void {
    // Fixed-rate logic (60Hz)
  }

  get app(): Application { return this._app; }
}

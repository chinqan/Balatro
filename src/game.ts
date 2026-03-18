// ============================================================
// Game — Main orchestrator: RunManager + Scene transitions
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

export class Game {
  readonly clock: ClockController;
  readonly events: EventBus;
  readonly scenes: SceneManager;
  readonly audio: AudioManager;
  readonly rng: SeedManager;

  private _accumulator = 0;
  private _started = false;
  private _run!: RunManager;

  // Scene references
  private _battleScene!: BattleScene;
  private _mapScene!: MapScene;
  private _shopScene!: ShopScene;

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

    // Create scenes
    this._battleScene = new BattleScene();
    this._mapScene = new MapScene();
    this._shopScene = new ShopScene();

    this.scenes.register(this._battleScene);
    this.scenes.register(this._mapScene);
    this.scenes.register(this._shopScene);

    // Start a new run
    this._startNewRun();
  }

  private _startNewRun(): void {
    this._run = new RunManager(this.rng, this.events);

    // Wire up map scene
    this._mapScene.setRunManager(this._run);
    this._mapScene.setOnStartEncounter(() => this._onStartEncounter());
    this._mapScene.setOnSkipEncounter(() => this._onSkipEncounter());

    // Wire up shop scene
    this._shopScene.setOnLeave(() => this._onLeaveShop());

    // Start at the map
    this.scenes.switchTo('map');
  }

  private async _onStartEncounter(): Promise<void> {
    this._run.startNextEncounter();

    if (this._run.phase === 'battle' && this._run.battle) {
      // Destroy old battle scene and create a new one
      this._battleScene = new BattleScene();
      this.scenes.register(this._battleScene);

      // Override battle scene to use the RunManager's battle
      this._battleScene.setBattleManager(this._run.battle);
      this._battleScene.setOnBattleEnd((result) => {
        if (result === 'victory') {
          this._run.onBattleVictory();

          if (this._run.phase === 'shop' && this._run.shop) {
            this._shopScene.setShopManager(this._run.shop);
            this._shopScene.setPlayer(this._run.player);
            this.scenes.switchTo('shop');
          } else {
            // Non-boss victory: go back to map
            this._mapScene.refreshMap();
            this.scenes.switchTo('map');
          }
        } else {
          this._run.onBattleDefeat();
          // TODO: Show game over scene
          this._startNewRun(); // Restart for now
        }
      });

      await this.scenes.switchTo('battle');
      this._battleScene.startBattle();
    } else if (this._run.phase === 'victory') {
      // TODO: Show victory scene
      this._startNewRun(); // Restart for now
    }
  }

  private _onSkipEncounter(): void {
    this._run.skipEncounter();
    this._mapScene.refreshMap();
  }

  private _onLeaveShop(): void {
    this._run.leaveShop();

    if (this._run.phase === 'victory') {
      this._startNewRun(); // Restart for now
    } else {
      this._mapScene.setRunManager(this._run);
      this._mapScene.refreshMap();
      this.scenes.switchTo('map');
    }
  }

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
    // Fixed-rate logic (60Hz) — extendable for AI timers, etc.
  }

  get app(): Application { return this._app; }
}

// ============================================================
// Battle Scene — The main game screen
// Orchestrates BattleManager, UI components, and animations
// GDD Phase 4 §1.1: Full battle layout
// ============================================================

import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Scene } from '@/scenes/scene-manager';
import { Viewport, DESIGN_W, DESIGN_H } from '@/rendering/viewport';
import { COLORS, LAYOUT } from '@/rendering/design-tokens';
import { HpBar } from '@/ui/hp-bar';
import { HandDisplay } from '@/ui/hand-display';
import { BattleHud } from '@/ui/hud';
import { FloorIndicator } from '@/ui/floor-indicator';
import { ConsumableSlot } from '@/ui/consumable-slot';
import { RunInfoPanel } from '@/ui/run-info-panel';
import { DeckViewer } from '@/ui/deck-viewer';
import { PauseMenu } from '@/scenes/pause-menu';
import { DebugPanel } from '@/ui/debug-panel';
import { DamageNumberSystem } from '@/rendering/damage-number';
import { RelicBar, RELIC_CARD_W, RELIC_CARD_GAP } from '@/ui/relic-card';
import { playSettlement } from '@/rendering/settlement-animator';
import { BattleManager, createBattle } from '@/systems/battle-manager';
import { DeckManager } from '@/systems/deck-manager';
import { createStandardDeck } from '@/models/card';
import { createInitialPlayerState, createDefaultHandLevels } from '@/models/player';
import { createInitialRunStats } from '@/models/run-state';
import type { EncounterType } from '@/models/run-state';
import { SeedManager } from '@/core/rng';
import { EventBus } from '@/core/event-bus';
import { BOSS_DEFINITIONS } from '@/data/bosses';
import { HAND_TYPE_DATA } from '@/data/hand-types';
import { evaluateHand } from '@/systems/hand-evaluator';
import type { RelicInstance } from '@/types';

export class BattleScene implements Scene {
  readonly name = 'battle';

  private _viewport!: Viewport;
  private _battle!: BattleManager;
  private _events!: EventBus;

  // External injection (from RunManager via Game)
  private _externalBattle: BattleManager | null = null;
  private _onBattleEnd?: (result: 'victory' | 'defeat') => void;

  // UI components
  private _bossHpBar!: HpBar;
  private _playerHpBar!: HpBar;
  private _handDisplay!: HandDisplay;
  private _hud!: BattleHud;
  private _floorIndicator!: FloorIndicator;
  private _consumableSlot!: ConsumableSlot;
  private _runInfoPanel!: RunInfoPanel;
  private _deckViewer!: DeckViewer;
  private _pauseMenu!: PauseMenu;
  private _debugPanel!: DebugPanel;
  private _damageNumbers!: DamageNumberSystem;
  /** Always-visible Balatro-style relic bar (top-right horizontal strip of relic cards) */
  private _relicBar!: RelicBar;
  /** Tooltip layer above everything (for relic card hover tooltips) */
  private _tooltipLayer!: Container;
  /** Whether a settlement animation is currently playing (locks UI) */
  private _animating = false;

  // Encounter info (set externally or defaults)
  private _currentFloor = 1;
  private _currentEncounterType: EncounterType = 'standard';

  // Boss area
  private _bossNameText!: Text;
  private _bossIntentText!: Text;

  // Debug
  private _phaseText!: Text;

  // Battle-end guard (防止 phase watcher 多次觸發結算)
  private _battleEnded = false;

  /** Set an external BattleManager (from RunManager). Call before init(). */
  setBattleManager(battle: BattleManager): void {
    this._externalBattle = battle;
  }

  /** Set callback when battle ends. */
  setOnBattleEnd(cb: (result: 'victory' | 'defeat') => void): void {
    this._onBattleEnd = cb;
  }

  async init(app: Application, container: Container): Promise<void> {
    this._viewport = new Viewport(app, container);
    const root = this._viewport.root;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, DESIGN_H);
    bg.fill(COLORS.BG_DARK);
    root.addChild(bg);

    // ────────── Boss Area ──────────
    const bossArea = new Container();
    bossArea.position.set(DESIGN_W / 2, LAYOUT.BOSS_AREA_Y);
    root.addChild(bossArea);

    this._bossNameText = new Text({
      text: 'BOSS',
      style: new TextStyle({ fontSize: 20, fill: COLORS.TEXT_PRIMARY, fontWeight: 'bold' }),
    });
    this._bossNameText.anchor.set(0.5, 0);
    bossArea.addChild(this._bossNameText);

    this._bossHpBar = new HpBar({
      width: LAYOUT.BOSS_HP_W, height: LAYOUT.BOSS_HP_H,
      fillColor: COLORS.BOSS_HP_FILL, shieldColor: COLORS.BOSS_SHIELD_FILL,
      bgColor: COLORS.HP_BAR_BG, showText: true,
    });
    this._bossHpBar.position.set(-LAYOUT.BOSS_HP_W / 2, 30);
    bossArea.addChild(this._bossHpBar);

    this._bossIntentText = new Text({
      text: '',
      style: new TextStyle({ fontSize: 14, fill: COLORS.DMG }),
    });
    this._bossIntentText.anchor.set(0.5, 0);
    this._bossIntentText.position.set(0, 60);
    bossArea.addChild(this._bossIntentText);

    // Boss sprite placeholder
    const bossSprite = new Container();
    const bossGfx = new Graphics();
    bossGfx.roundRect(-LAYOUT.BOSS_SPRITE_SIZE / 2, 0, LAYOUT.BOSS_SPRITE_SIZE, LAYOUT.BOSS_SPRITE_SIZE, 12);
    bossGfx.fill(0x2a1a3a);
    bossGfx.stroke({ width: 3, color: COLORS.DMG });
    bossSprite.addChild(bossGfx);
    const bossEmoji = new Text({ text: '👹', style: new TextStyle({ fontSize: 64 }) });
    bossEmoji.anchor.set(0.5);
    bossEmoji.position.set(0, LAYOUT.BOSS_SPRITE_SIZE / 2);
    bossSprite.addChild(bossEmoji);
    bossSprite.position.set(0, 80);
    bossArea.addChild(bossSprite);

    // ────────── Hand Area ──────────
    this._handDisplay = new HandDisplay();
    this._handDisplay.position.set(DESIGN_W / 2, LAYOUT.HAND_AREA_Y);
    root.addChild(this._handDisplay);

    // ────────── Player HP ──────────
    this._playerHpBar = new HpBar({
      width: 200, height: 18,
      fillColor: COLORS.HP_BAR_FILL, shieldColor: COLORS.HP_BAR_SHIELD,
      bgColor: COLORS.HP_BAR_BG, showText: true, label: 'HP',
    });
    this._playerHpBar.position.set(20, LAYOUT.HAND_AREA_Y + 70);
    root.addChild(this._playerHpBar);

    // ────────── HUD ──────────
    this._hud = new BattleHud();
    this._hud.position.set(0, DESIGN_H - LAYOUT.HUD_H);
    root.addChild(this._hud);

    // ────────── Floor Indicator (top-left HUD) ──────────
    this._floorIndicator = new FloorIndicator();
    this._floorIndicator.position.set(8, 6);
    root.addChild(this._floorIndicator);

    // ────────── Consumable Slot (left, below player HP bar) ──────────
    this._consumableSlot = new ConsumableSlot();
    this._consumableSlot.position.set(20, LAYOUT.HAND_AREA_Y + 94);
    root.addChild(this._consumableSlot);
    this._consumableSlot.setOnUse((slotIdx) => this._onUseConsumable(slotIdx));

    // ────────── Run Info Panel (left overlay) ──────────
    this._runInfoPanel = new RunInfoPanel();
    this._runInfoPanel.position.set(4, 40);
    root.addChild(this._runInfoPanel);

    // ────────── Tooltip Layer (above everything — for relic tooltips) ──────────
    this._tooltipLayer = new Container();
    root.addChild(this._tooltipLayer);

    // ────────── Relic Bar (Balatro-style horizontal card strip, top-right) ──────────
    this._relicBar = new RelicBar(this._tooltipLayer);
    this._relicBar.position.set(DESIGN_W - 8 - 5 * (RELIC_CARD_W + RELIC_CARD_GAP), 26);
    root.addChild(this._relicBar);
    // Relic bar label
    const relicBarLabel = new Text({
      text: '🔮 遺物',
      style: new TextStyle({ fontSize: 10, fill: COLORS.GOLD }),
    });
    relicBarLabel.anchor.set(1, 0);
    relicBarLabel.position.set(DESIGN_W - 8, 12);
    root.addChild(relicBarLabel);

    // ── Run Info toggle button ──
    const runInfoBtn = new Container();
    runInfoBtn.eventMode = 'static';
    runInfoBtn.cursor = 'pointer';
    const runInfoBg = new Graphics();
    runInfoBg.roundRect(0, 0, 80, 24, 6);
    runInfoBg.fill({ color: 0x1a1a2e });
    runInfoBg.stroke({ width: 1, color: COLORS.GOLD, alpha: 0.6 });
    runInfoBtn.addChild(runInfoBg);
    const runInfoTxt = new Text({
      text: '📋 Run Info',
      style: new TextStyle({ fontSize: 11, fill: COLORS.GOLD }),
    });
    runInfoTxt.anchor.set(0.5);
    runInfoTxt.position.set(40, 12);
    runInfoBtn.addChild(runInfoTxt);
    runInfoBtn.position.set(DESIGN_W / 2 - 40, 6);
    runInfoBtn.on('pointerdown', () => this._runInfoPanel.toggle());
    root.addChild(runInfoBtn);

    // ── Deck Viewer button ──
    const deckBtn = new Container();
    deckBtn.eventMode = 'static';
    deckBtn.cursor = 'pointer';
    const deckBtnBg = new Graphics();
    deckBtnBg.roundRect(0, 0, 80, 24, 6);
    deckBtnBg.fill({ color: 0x1a2e1a });
    deckBtnBg.stroke({ width: 1, color: 0x44FF88, alpha: 0.6 });
    deckBtn.addChild(deckBtnBg);
    const deckBtnTxt = new Text({
      text: '🃏 牌庫',
      style: new TextStyle({ fontSize: 11, fill: 0x44FF88 }),
    });
    deckBtnTxt.anchor.set(0.5);
    deckBtnTxt.position.set(40, 12);
    deckBtn.addChild(deckBtnTxt);
    deckBtn.position.set(DESIGN_W / 2 + 50, 6);
    deckBtn.on('pointerdown', () => {
      if (this._battle) {
        this._deckViewer.open(this._battle.getAllCards());
      }
    });
    root.addChild(deckBtn);

    // ────────── Deck Viewer Overlay ──────────
    this._deckViewer = new DeckViewer();
    root.addChild(this._deckViewer);

    // ────────── Pause Menu ──────────
    this._pauseMenu = new PauseMenu();
    this._pauseMenu.setCallbacks({
      onResume: () => this._pauseMenu.hide(),
      onQuitRun: () => this._onBattleEnd?.('defeat'),
    });
    root.addChild(this._pauseMenu);

    // ESC toggles pause
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this._pauseMenu.visible) {
        this._pauseMenu.show();
      }
    });

    // ────────── Damage Numbers ──────────
    this._damageNumbers = new DamageNumberSystem(root);

    // ────────── Debug Panel (Ctrl+D / ⌘D) ──────────
    this._debugPanel = new DebugPanel();
    this._debugPanel.position.set(DESIGN_W - 230, 40); // 右上角
    root.addChild(this._debugPanel);

    // ────────── Debug ──────────
    this._phaseText = new Text({
      text: '',
      style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_DIM }),
    });
    this._phaseText.position.set(DESIGN_W - 200, 4);
    root.addChild(this._phaseText);

    // ────────── Battle Logic ──────────
    if (this._externalBattle) {
      // Use injected battle from RunManager
      this._battle = this._externalBattle;
      this._events = new EventBus(); // Local event bus for UI
    } else {
      // Standalone mode (for testing)
      this._events = new EventBus();
      const rng = new SeedManager();
      const player = createInitialPlayerState();
      const deck = new DeckManager(createStandardDeck());
      deck.shuffle(rng);
      this._battle = createBattle(
        player, deck, BOSS_DEFINITIONS['the_gate'],
        [], createDefaultHandLevels(), rng, this._events, createInitialRunStats(),
      );
      this._battle.startRound();
    }

    // ────────── Wire UI ──────────
    this._hud.setOnPlay(() => this._onPlayCards());
    this._hud.setOnDiscard(() => this._onDiscardCards());
    this._handDisplay.onSelectionChange((indices) => this._updateHandPreview(indices));

    // ────────── Debug Panel ── wire 到 battle ──────────
    this._debugPanel.setBattle(this._battle);
    this._debugPanel.setHudRefresh(() => this._refreshAllUI());

    this._refreshAllUI();
  }

  update(dt: number): void {
    if (!this._battle) return;
    this._bossHpBar.update(dt);
    this._playerHpBar.update(dt);
    this._damageNumbers.update(dt);
    this._phaseText.text = `Phase: ${this._battle.phase} | Round: ${this._battle.round}`;

    // ── Phase watcher: 持續輪詢確保 victory/defeat 任一路徑都能進結算 ──
    if (!this._battleEnded) {
      const phase = this._battle.phase;
      if (phase === 'victory') {
        this._battleEnded = true;
        console.log(`[DEBUG] Phase watcher triggered: VICTORY, _onBattleEnd=${typeof this._onBattleEnd}`);
        this._showMessage('🎉 BOSS DEFEATED!');
        this._refreshAllUI();
        setTimeout(() => {
          console.log('[DEBUG] setTimeout firing _onBattleEnd(victory)');
          this._onBattleEnd?.('victory');
        }, 1500);
      } else if (phase === 'defeat') {
        this._battleEnded = true;
        console.log(`[DEBUG] Phase watcher triggered: DEFEAT, _onBattleEnd=${typeof this._onBattleEnd}`);
        this._showMessage('💀 DEFEATED...');
        this._refreshAllUI();
        setTimeout(() => {
          console.log('[DEBUG] setTimeout firing _onBattleEnd(defeat)');
          this._onBattleEnd?.('defeat');
        }, 1500);
      }
    }
  }

  /**
   * Start the battle (call after scene is initialized).
   * Triggers startRound on the BattleManager and refreshes UI.
   */
  startBattle(): void {
    if (this._battle && this._battle.phase === 'round_start') {
      this._battle.startRound();
    }
    this._refreshAllUI();
  }

  destroy(): void {
    this._events?.clear();
    this._viewport?.destroy();
  }

  // ─── Actions ──────────────────────────────────────────────

  private async _onPlayCards(): Promise<void> {
    if (!this._battle.canPlay) return;
    if (this._animating) return; // Block if animation still plays
    const indices = this._handDisplay.getSelectedIndices();
    if (indices.length === 0) return;

    this._animating = true;
    this._hud.setEnabled(false); // Lock UI during animation

    try {
      const result = this._battle.playCards(indices);
      console.log(`[DEBUG] playCards done → phase=${this._battle.phase}, bossHP=${this._battle.boss.hp}, damage=${result.finalDamage}`);

      // Refresh bars immediately so current HP is visible before animation
      this._refreshAllUI();

      // Run 4-phase settlement animation
      const relics: RelicInstance[] = this._battle['_relics'] ?? [];
      await playSettlement({
        root: this._viewport.root,
        result,
        relics,
        relicBarContainer: this._relicBar,
        onPartialHpDrain: (fraction) => {
          // Gradually drag HP bar down during relic chain
          const phase4Steps = result.steps.filter(s => s.phase === 4);
          if (phase4Steps.length > 0) {
            const partial = Math.floor(result.finalDamage * fraction);
            this._bossHpBar.setValue(
              Math.max(0, this._battle.boss.hp + result.finalDamage - partial),
              this._battle.boss.maxHp,
              this._battle.boss.shield,
            );
          }
        },
        onFinalDamage: (_total) => {
          this._bossHpBar.setValue(this._battle.boss.hp, this._battle.boss.maxHp, this._battle.boss.shield);
        },
        bossX: DESIGN_W / 2,
        bossY: LAYOUT.BOSS_AREA_Y + 120,
      });

      // Victory/defeat handled by update() phase watcher
      if (this._battle.phase === 'victory' || this._battle.phase === 'defeat') {
        console.log(`[DEBUG] playCards detected ${this._battle.phase}, waiting for phase watcher`);
        this._refreshAllUI();
        return;
      }

      this._refreshAllUI();

      // Auto-trigger boss turn when no plays left
      if (this._battle.phase === 'boss_turn') {
        setTimeout(() => this._executeBossTurn(), 600);
      } else if (this._battle.player.plays <= 0 && this._battle.player.discards <= 0) {
        this._battle.endPlayerTurn();
        this._refreshAllUI();
        setTimeout(() => this._executeBossTurn(), 600);
      }
    } catch (e) {
      console.warn('Play failed:', e);
    } finally {
      this._animating = false;
      this._hud.setEnabled(true);
    }
  }

  private _onDiscardCards(): void {
    if (!this._battle.canDiscard) return;
    const indices = this._handDisplay.getSelectedIndices();
    if (indices.length === 0) return;
    try {
      this._battle.discardCards(indices);
      this._refreshAllUI();

      // After discard, if no plays AND no discards remain, auto-end turn
      if (this._battle.player.plays <= 0 && this._battle.player.discards <= 0) {
        this._battle.endPlayerTurn();
        this._refreshAllUI();
        setTimeout(() => this._executeBossTurn(), 600);
      }
    } catch (e) {
      console.warn('Discard failed:', e);
    }
  }

  private _executeBossTurn(): void {
    if (this._battle.phase !== 'boss_turn') return;
    const result = this._battle.executeBossTurn();
    const phaseAfter = this._battle.phase as string;

    if (result.hpLost > 0) {
      this._damageNumbers.spawn(120, LAYOUT.HAND_AREA_Y + 70, result.hpLost, COLORS.BOSS_DMG as number);
    }

    // 勝負由 update() phase watcher 統一處理，此處不再重複判斷
    if (phaseAfter === 'defeat' || phaseAfter === 'victory') {
      this._refreshAllUI();
      return;
    }

    if (phaseAfter === 'round_end') {
      setTimeout(() => {
        this._battle.endRound();
        this._refreshAllUI();
      }, 400);
    }
  }

  // ─── UI ───────────────────────────────────────────────────

  /** Set current floor/encounter for the FloorIndicator. Call before startBattle(). */
  setEncounterInfo(floor: number, encounterType: EncounterType): void {
    this._currentFloor = floor;
    this._currentEncounterType = encounterType;
  }

  private _onUseConsumable(slotIndex: number): void {
    // TODO: integrate with ConsumableManager when target selection UI is ready
    // For now, log the intent
    console.log(`[BattleScene] Use consumable at slot ${slotIndex}`);
  }

  private _refreshAllUI(): void {
    const player = this._battle.player;
    const boss = this._battle.boss;

    this._bossNameText.text = boss.definition.name;
    this._bossHpBar.setValue(boss.hp, boss.maxHp, boss.shield);
    this._bossIntentText.text = boss.currentIntent.description;
    this._playerHpBar.setValue(player.hp, player.maxHp, player.shield);
    this._hud.update(player.plays, player.discards, player.money);

    // Update new UI elements
    this._floorIndicator.update(this._currentFloor, this._currentEncounterType);
    this._consumableSlot.update(player.consumables, player.maxConsumables);
    this._runInfoPanel.setData(
      this._battle['_handLevels'],
      this._battle['_stats'],
      this._battle['_relics'],
    );

    this._handDisplay.clearSelection();
    this._handDisplay.setCards([...this._battle.hand]);
    this._hud.setHandTypePreview('');

    // Update always-visible relic bar (Balatro card style)
    const relics: RelicInstance[] = this._battle['_relics'] ?? [];
    this._relicBar.setRelics(relics);
    this._tooltipLayer.removeChildren(); // Clear any stale tooltips
  }

  private _updateHandPreview(indices: number[]): void {
    if (indices.length === 0) { this._hud.setHandTypePreview(''); return; }
    const selectedCards = indices.map(i => this._battle.hand[i]).filter(Boolean);
    if (selectedCards.length === 0) return;

    const result = evaluateHand(selectedCards, createDefaultHandLevels());
    const data = HAND_TYPE_DATA[result.handType];
    this._hud.setHandTypePreview(`${data.name} — ATK ${result.baseATK} × DMG ${result.baseDMG}`);
  }

  private _showMessage(text: string): void {
    const msg = new Text({
      text,
      style: new TextStyle({
        fontSize: 36, fontWeight: 'bold', fill: COLORS.GOLD,
        stroke: { color: 0x000000, width: 4 },
      }),
    });
    msg.anchor.set(0.5);
    msg.position.set(DESIGN_W / 2, DESIGN_H / 2);
    this._viewport.root.addChild(msg);
    setTimeout(() => {
      msg.alpha = 0;
      this._viewport.root.removeChild(msg);
    }, 2000);
  }
}

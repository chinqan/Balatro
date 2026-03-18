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
import { DamageNumberSystem } from '@/rendering/damage-number';
import { BattleManager, createBattle } from '@/systems/battle-manager';
import { DeckManager } from '@/systems/deck-manager';
import { createStandardDeck } from '@/models/card';
import { createInitialPlayerState, createDefaultHandLevels } from '@/models/player';
import { createInitialRunStats } from '@/models/run-state';
import { SeedManager } from '@/core/rng';
import { EventBus } from '@/core/event-bus';
import { BOSS_DEFINITIONS } from '@/data/bosses';
import { HAND_TYPE_DATA } from '@/data/hand-types';
import { evaluateHand } from '@/systems/hand-evaluator';

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
  private _damageNumbers!: DamageNumberSystem;

  // Boss area
  private _bossNameText!: Text;
  private _bossIntentText!: Text;

  // Debug
  private _phaseText!: Text;

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

    // ────────── Damage Numbers ──────────
    this._damageNumbers = new DamageNumberSystem(root);

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

    this._refreshAllUI();
  }

  update(dt: number): void {
    if (!this._battle) return;
    this._bossHpBar.update(dt);
    this._playerHpBar.update(dt);
    this._damageNumbers.update(dt);
    this._phaseText.text = `Phase: ${this._battle.phase} | Round: ${this._battle.round}`;
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

  private _onPlayCards(): void {
    if (!this._battle.canPlay) return;
    const indices = this._handDisplay.getSelectedIndices();
    if (indices.length === 0) return;

    try {
      const result = this._battle.playCards(indices);
      this._damageNumbers.spawn(DESIGN_W / 2, LAYOUT.BOSS_AREA_Y + 120, result.finalDamage, COLORS.ATK);

      if (this._battle.phase === 'victory') {
        this._showMessage('🎉 BOSS DEFEATED!');
        this._refreshAllUI();
        setTimeout(() => this._onBattleEnd?.('victory'), 1500);
        return;
      }

      this._refreshAllUI();

      // Auto-trigger boss turn when no plays left
      if (this._battle.phase === 'boss_turn') {
        setTimeout(() => this._executeBossTurn(), 600);
      } else if (this._battle.player.plays <= 0 && this._battle.player.discards <= 0) {
        // No plays AND no discards left — force end turn
        this._battle.endPlayerTurn();
        this._refreshAllUI();
        setTimeout(() => this._executeBossTurn(), 600);
      }
    } catch (e) {
      console.warn('Play failed:', e);
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

    if (phaseAfter === 'defeat') {
      this._showMessage('💀 DEFEATED...');
      this._refreshAllUI();
      setTimeout(() => this._onBattleEnd?.('defeat'), 1500);
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

  private _refreshAllUI(): void {
    const player = this._battle.player;
    const boss = this._battle.boss;

    this._bossNameText.text = boss.definition.name;
    this._bossHpBar.setValue(boss.hp, boss.maxHp, boss.shield);
    this._bossIntentText.text = boss.currentIntent.description;
    this._playerHpBar.setValue(player.hp, player.maxHp, player.shield);
    this._hud.update(player.plays, player.discards, player.money);

    this._handDisplay.clearSelection();
    this._handDisplay.setCards([...this._battle.hand]);
    this._hud.setHandTypePreview('');
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

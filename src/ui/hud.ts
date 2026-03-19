// ============================================================
// HUD — Bottom bar: plays, discards, HP, money, buttons
// GDD Phase 4 §1.1: Always visible info layer
// ============================================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS, LAYOUT } from '@/rendering/design-tokens';
import { DESIGN_W } from '@/rendering/viewport';

export class BattleHud extends Container {
  private readonly _playsText: Text;
  private readonly _discardsText: Text;
  private readonly _moneyText: Text;
  private readonly _handTypeText: Text;
  private readonly _playBtn: Container;
  private readonly _discardBtn: Container;
  private readonly _playBtnBg: Graphics;
  private readonly _discardBtnBg: Graphics;

  private _onPlay?: () => void;
  private _onDiscard?: () => void;

  constructor() {
    super();

    // Background panel
    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, LAYOUT.HUD_H);
    bg.fill({ color: COLORS.BG_PANEL, alpha: 0.85 });
    this.addChild(bg);

    const textStyle = new TextStyle({
      fontSize: 16,
      fill: COLORS.TEXT_PRIMARY,
      fontWeight: 'bold',
    });

    // Plays counter
    this._playsText = new Text({ text: '🎴 出牌: 4', style: textStyle });
    this._playsText.position.set(20, 8);
    this.addChild(this._playsText);

    // Discards counter
    this._discardsText = new Text({ text: '🗑 棄牌: 3', style: textStyle });
    this._discardsText.position.set(160, 8);
    this.addChild(this._discardsText);

    // Money
    const moneyStyle = new TextStyle({
      fontSize: 16,
      fill: COLORS.GOLD,
      fontWeight: 'bold',
    });
    this._moneyText = new Text({ text: '💰 0', style: moneyStyle });
    this._moneyText.position.set(320, 8);
    this.addChild(this._moneyText);

    // Hand type display (shows evaluated hand after selection)
    const handTypeStyle = new TextStyle({
      fontSize: 14,
      fill: COLORS.ATK,
    });
    this._handTypeText = new Text({ text: '', style: handTypeStyle });
    this._handTypeText.position.set(20, 34);
    this.addChild(this._handTypeText);

    // Play button
    this._playBtn = new Container();
    this._playBtn.eventMode = 'static';
    this._playBtn.cursor = 'pointer';
    this._playBtnBg = new Graphics();
    this._drawButton(this._playBtnBg, COLORS.BUTTON_PRIMARY, '出牌');
    this._playBtn.addChild(this._playBtnBg);
    const playLabel = new Text({ text: '出牌', style: new TextStyle({ fontSize: 14, fill: 0xFFFFFF, fontWeight: 'bold' }) });
    playLabel.anchor.set(0.5);
    playLabel.position.set(LAYOUT.BUTTON_W / 2, LAYOUT.BUTTON_H / 2);
    this._playBtn.addChild(playLabel);
    this._playBtn.position.set(DESIGN_W - 230, 10);
    this._playBtn.on('pointerdown', () => this._onPlay?.());
    this.addChild(this._playBtn);

    // Discard button
    this._discardBtn = new Container();
    this._discardBtn.eventMode = 'static';
    this._discardBtn.cursor = 'pointer';
    this._discardBtnBg = new Graphics();
    this._drawButton(this._discardBtnBg, COLORS.BUTTON_DANGER, '棄牌');
    this._discardBtn.addChild(this._discardBtnBg);
    const discLabel = new Text({ text: '棄牌', style: new TextStyle({ fontSize: 14, fill: 0xFFFFFF, fontWeight: 'bold' }) });
    discLabel.anchor.set(0.5);
    discLabel.position.set(LAYOUT.BUTTON_W / 2, LAYOUT.BUTTON_H / 2);
    this._discardBtn.addChild(discLabel);
    this._discardBtn.position.set(DESIGN_W - 120, 10);
    this._discardBtn.on('pointerdown', () => this._onDiscard?.());
    this.addChild(this._discardBtn);
  }

  private _drawButton(gfx: Graphics, color: number, _label: string): void {
    gfx.roundRect(0, 0, LAYOUT.BUTTON_W, LAYOUT.BUTTON_H, LAYOUT.BUTTON_R);
    gfx.fill(color);
  }

  setOnPlay(callback: () => void): void { this._onPlay = callback; }
  setOnDiscard(callback: () => void): void { this._onDiscard = callback; }

  update(plays: number, discards: number, money: number): void {
    this._playsText.text = `🎴 出牌: ${plays}`;
    this._discardsText.text = `🗑 棄牌: ${discards}`;
    this._moneyText.text = `💰 ${money}`;

    // Disable buttons visually when no resources
    this._playBtnBg.clear();
    this._drawButton(this._playBtnBg, plays > 0 ? COLORS.BUTTON_PRIMARY : COLORS.BUTTON_DISABLED, '出牌');
    this._discardBtnBg.clear();
    this._drawButton(this._discardBtnBg, discards > 0 ? COLORS.BUTTON_DANGER : COLORS.BUTTON_DISABLED, '棄牌');
  }

  setHandTypePreview(text: string): void {
    this._handTypeText.text = text;
  }

  /** Lock or unlock the action buttons during animations */
  setEnabled(enabled: boolean): void {
    this._playBtn.eventMode = enabled ? 'static' : 'none';
    this._discardBtn.eventMode = enabled ? 'static' : 'none';
    this._playBtn.alpha = enabled ? 1 : 0.4;
    this._discardBtn.alpha = enabled ? 1 : 0.4;
  }
}

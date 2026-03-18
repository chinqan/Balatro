// ============================================================
// HP Bar — Visual health/shield bar component
// GDD Phase 4 §1: Always visible, top priority
// ============================================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export interface HpBarOptions {
  width: number;
  height: number;
  fillColor: number;
  shieldColor: number;
  bgColor: number;
  showText?: boolean;
  label?: string;
}

export class HpBar extends Container {
  private readonly _bg: Graphics;
  private readonly _fill: Graphics;
  private readonly _shieldFill: Graphics;
  private readonly _labelText: Text;
  private readonly _valueText: Text;
  private readonly _opts: HpBarOptions;

  private _current = 100;
  private _max = 100;
  private _shield = 0;
  private _targetFill = 1;
  private _displayFill = 1;

  constructor(opts: HpBarOptions) {
    super();
    this._opts = opts;

    // Background
    this._bg = new Graphics();
    this._bg.roundRect(0, 0, opts.width, opts.height, opts.height / 2);
    this._bg.fill(opts.bgColor);
    this.addChild(this._bg);

    // HP fill
    this._fill = new Graphics();
    this.addChild(this._fill);

    // Shield fill
    this._shieldFill = new Graphics();
    this.addChild(this._shieldFill);

    // Label (e.g. "Boss" or "HP")
    const labelStyle = new TextStyle({
      fontSize: Math.min(14, opts.height - 2),
      fill: 0xFFFFFF,
      fontWeight: 'bold',
    });
    this._labelText = new Text({ text: opts.label ?? '', style: labelStyle });
    this._labelText.anchor.set(0, 0.5);
    this._labelText.position.set(8, opts.height / 2);
    this.addChild(this._labelText);

    // Value text
    const valueStyle = new TextStyle({
      fontSize: Math.min(12, opts.height - 4),
      fill: 0xFFFFFF,
    });
    this._valueText = new Text({ text: '', style: valueStyle });
    this._valueText.anchor.set(1, 0.5);
    this._valueText.position.set(opts.width - 8, opts.height / 2);
    if (opts.showText !== false) {
      this.addChild(this._valueText);
    }

    this._draw();
  }

  /** Update HP/Shield values */
  setValue(current: number, max: number, shield = 0): void {
    this._current = current;
    this._max = max;
    this._shield = shield;
    this._targetFill = max > 0 ? current / max : 0;
    this._draw();
  }

  /** Smooth animation tick */
  update(_dt: number): void {
    // Lerp towards target
    this._displayFill += (this._targetFill - this._displayFill) * 0.15;
    if (Math.abs(this._displayFill - this._targetFill) < 0.001) {
      this._displayFill = this._targetFill;
    }
    this._draw();
  }

  private _draw(): void {
    const { width, height, fillColor, shieldColor } = this._opts;
    const r = height / 2;

    // HP fill
    this._fill.clear();
    const fillW = Math.max(0, width * this._displayFill);
    if (fillW > 0) {
      this._fill.roundRect(0, 0, fillW, height, r);
      this._fill.fill(fillColor);
    }

    // Shield overlay (stacked on top of HP)
    this._shieldFill.clear();
    if (this._shield > 0 && this._max > 0) {
      const shieldRatio = Math.min(this._shield / this._max, 1);
      const shieldW = width * shieldRatio;
      if (shieldW > 0) {
        this._shieldFill.roundRect(0, 0, shieldW, height, r);
        this._shieldFill.fill({ color: shieldColor, alpha: 0.5 });
      }
    }

    // Value text
    if (this._shield > 0) {
      this._valueText.text = `${this._current}/${this._max} 🛡${this._shield}`;
    } else {
      this._valueText.text = `${this._current}/${this._max}`;
    }
  }
}

// ============================================================
// Floor Indicator — Shows current floor + encounter type in HUD
// GDD Phase 4 §1: "F2 🛡️菁英怪" always visible in battle
// ============================================================

import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import type { EncounterType } from '@/models/run-state';
import { COLORS } from '@/rendering/design-tokens';

const ENCOUNTER_ICON: Record<EncounterType, string> = {
  standard: '⚔️',
  elite: '🛡️',
  boss: '💀',
};

const ENCOUNTER_LABEL: Record<EncounterType, string> = {
  standard: '普通怪',
  elite: '菁英怪',
  boss: 'Boss',
};

const ENCOUNTER_COLOR: Record<EncounterType, number> = {
  standard: 0xCCCCCC,
  elite: 0x4AFF7A,   // green
  boss: 0xFF4A5E,    // red
};

export class FloorIndicator extends Container {
  private readonly _bg: Graphics;
  private readonly _label: Text;

  constructor() {
    super();

    this._bg = new Graphics();
    this.addChild(this._bg);

    this._label = new Text({
      text: '',
      style: new TextStyle({
        fontSize: 13,
        fill: COLORS.TEXT_PRIMARY,
        fontWeight: 'bold',
      }),
    });
    this._label.anchor.set(0, 0.5);
    this._label.position.set(8, 0);
    this.addChild(this._label);

    this._draw('F1', 'standard');
  }

  /**
   * Update the indicator text and color.
   * @param floor — 1-8
   * @param encounterType — 'standard' | 'elite' | 'boss'
   */
  update(floor: number, encounterType: EncounterType): void {
    this._draw(`F${floor}`, encounterType);
  }

  private _draw(floorLabel: string, encounterType: EncounterType): void {
    const icon = ENCOUNTER_ICON[encounterType];
    const name = ENCOUNTER_LABEL[encounterType];
    const color = ENCOUNTER_COLOR[encounterType];

    this._label.text = `${floorLabel} ${icon} ${name}`;
    this._label.style.fill = color;

    // Pill background
    const w = this._label.width + 16;
    const h = 26;
    this._bg.clear();
    this._bg.roundRect(0, -h / 2, w, h, 6);
    this._bg.fill({ color: 0x000000, alpha: 0.5 });
    this._bg.stroke({ width: 1, color, alpha: 0.7 });
  }
}

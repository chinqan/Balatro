// ============================================================
// RelicCard — Balatro-style relic display card for battle HUD
// GDD Phase 4 §1: 遺物欄位，小丑牌橫排，懸停顯示完整效果
// ============================================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { RelicInstance } from '@/types';
import { getRelicById } from '@/data/relics';
import { COLORS } from '@/rendering/design-tokens';

export const RELIC_CARD_W = 64;
export const RELIC_CARD_H = 90;
export const RELIC_CARD_GAP = 6;

// Rarity border colors (matching GDD §5.3)
const RARITY_BORDER: Record<string, number> = {
  common:    0x4466EE,   // Blue
  uncommon:  0x33CC66,   // Green
  rare:      0xFF4444,   // Red
  legendary: 0xBB44FF,   // Purple-gold
};

// Emoji icons per relic type pattern (fallback)
const EFFECT_ICON: Record<string, string> = {
  atk:      '⚔️',
  dmg:      '🔥',
  dmg_mult: '✨',
  shield:   '🛡️',
  money:    '💰',
  pierce:   '🏹',
};

export class RelicCard extends Container {
  private _tooltip: Container | null = null;
  private _relicDef: ReturnType<typeof getRelicById> | null = null;

  constructor(private readonly _relicInstance: RelicInstance, private readonly _tooltipParent: Container) {
    super();
    this._build();
  }

  /** Call to refresh active/inactive glow */
  refresh(instance: RelicInstance): void {
    this._relicInstance.isActive = instance.isActive;
    this._build();
  }

  private _build(): void {
    this.removeChildren();
    const def = getRelicById(this._relicInstance.definitionId);
    this._relicDef = def;

    const w = RELIC_CARD_W;
    const h = RELIC_CARD_H;
    const isActive = this._relicInstance.isActive;

    // ── Card background ───────────────────────────────────
    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 8);
    bg.fill({ color: 0x12101C, alpha: isActive ? 0.96 : 0.55 });

    const borderColor = def ? (RARITY_BORDER[def.rarity] ?? 0xD98C00) : 0x333355;
    bg.stroke({ width: isActive ? 2 : 1, color: isActive ? borderColor : 0x333344 });
    this.addChild(bg);
    // _bg stored for future tint/pulse access if needed

    // ── Inactive overlay ─────────────────────────────────
    if (!isActive) {
      const overlay = new Graphics();
      overlay.roundRect(0, 0, w, h, 8);
      overlay.fill({ color: 0x000000, alpha: 0.52 });
      this.addChild(overlay);

      const silence = new Text({ text: '🔇', style: new TextStyle({ fontSize: 14 }) });
      silence.anchor.set(0.5);
      silence.position.set(w / 2, h / 2 - 6);
      this.addChild(silence);
    } else {
      // ── Effect type icon ─────────────────────────────
      const iconStr = def ? (EFFECT_ICON[def.effect.stat] ?? '🗝️') : '❓';
      const icon = new Text({ text: iconStr, style: new TextStyle({ fontSize: 28 }) });
      icon.anchor.set(0.5);
      icon.position.set(w / 2, h / 2 - 14);
      this.addChild(icon);
    }

    // ── Relic name (truncated) ────────────────────────
    const nameStr = def ? def.name.slice(0, 6) : this._relicInstance.definitionId.slice(0, 6);
    const name = new Text({
      text: nameStr,
      style: new TextStyle({ fontSize: 9, fill: isActive ? 0xFFE4B0 : 0x556655, align: 'center' }),
    });
    name.anchor.set(0.5, 0);
    name.position.set(w / 2, h - 22);
    this.addChild(name);

    // ── Mini effect value ─────────────────────────────
    if (def && isActive) {
      const effStr = def.effect.stat === 'dmg_mult'
        ? `×${def.effect.value}`
        : `+${def.effect.value}`;
      const effLabel = new Text({
        text: effStr,
        style: new TextStyle({ fontSize: 8, fill: COLORS.GOLD }),
      });
      effLabel.anchor.set(0.5, 0);
      effLabel.position.set(w / 2, h - 11);
      this.addChild(effLabel);
    }

    // ── Hover interactions ────────────────────────────
    this.eventMode = 'static';
    this.cursor = 'default';
    this.on('pointerover', () => this._showTooltip());
    this.on('pointerout',  () => this._hideTooltip());
  }

  private _showTooltip(): void {
    if (!this._relicDef) return;
    this._hideTooltip();

    const def = this._relicDef;
    const tooltipW = 160;

    const bg = new Graphics();
    bg.roundRect(0, 0, tooltipW, 68, 8);
    bg.fill({ color: 0x0e0e1e, alpha: 0.97 });
    bg.stroke({ width: 1, color: 0xD98C00 });

    const title = new Text({
      text: def.name,
      style: new TextStyle({ fontSize: 12, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    title.position.set(8, 8);

    const desc = new Text({
      text: def.description,
      style: new TextStyle({
        fontSize: 10, fill: 0xBBCCDD,
        wordWrap: true, wordWrapWidth: tooltipW - 16,
      }),
    });
    desc.position.set(8, 28);

    const t = new Container();
    t.addChild(bg, title, desc);

    // Position above the card in the global (stage) coordinate space
    const globalPos = this.toGlobal({ x: 0, y: 0 });
    t.position.set(globalPos.x - 48, globalPos.y - 78);
    this._tooltipParent.addChild(t);
    this._tooltip = t;
  }

  private _hideTooltip(): void {
    if (this._tooltip) {
      this._tooltipParent.removeChild(this._tooltip);
      this._tooltip = null;
    }
  }
}

/** Strip of relic cards, horizontal, left-to-right */
export class RelicBar extends Container {
  private _cards: RelicCard[] = [];
  private readonly _tooltipParent: Container;

  constructor(tooltipParent: Container) {
    super();
    this._tooltipParent = tooltipParent;
  }

  /**
   * Rebuild the bar from current relic instances.
   * Call this inside _refreshAllUI().
   */
  setRelics(relics: RelicInstance[]): void {
    this.removeChildren();
    this._cards = [];

    const displayRelics = relics.slice(0, 8); // hard cap at 8

    for (let i = 0; i < displayRelics.length; i++) {
      const card = new RelicCard(displayRelics[i], this._tooltipParent);
      card.position.set(i * (RELIC_CARD_W + RELIC_CARD_GAP), 0);
      this.addChild(card);
      this._cards.push(card);
    }

    // +N more label if capped
    if (relics.length > 8) {
      const more = new Text({
        text: `+${relics.length - 8}`,
        style: new TextStyle({ fontSize: 9, fill: 0x888888 }),
      });
      more.position.set(displayRelics.length * (RELIC_CARD_W + RELIC_CARD_GAP), RELIC_CARD_H / 2 - 5);
      this.addChild(more);
    }

    if (displayRelics.length === 0) {
      const noneText = new Text({
        text: '（無遺物）',
        style: new TextStyle({ fontSize: 10, fill: 0x444466 }),
      });
      this.addChild(noneText);
    }
  }

  /** Returns the inner PixiJS container for a given relic slot (for animation pulse). */
  getCardContainer(index: number): Container | null {
    return this._cards[index] ?? null;
  }
}

// ============================================================
// Deck Viewer — In-game deck inspection overlay
// GDD Phase 4 §1.2: Non-pause deck viewer (shows distribution)
// ============================================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Card, Suit } from '@/types';
import { SUIT_SYMBOLS } from '@/types';
import { COLORS } from '@/rendering/design-tokens';

const SUIT_COLORS: Record<Suit, number> = {
  hearts:   COLORS.SUIT_RED,
  diamonds: COLORS.SUIT_RED,
  spades:   COLORS.SUIT_BLACK,
  clubs:    COLORS.SUIT_BLACK,
};

const SUIT_ORDER: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

export class DeckViewer extends Container {
  private _onClose?: () => void;
  private _cards: Card[] = [];

  // Dimensions
  private static readonly W = 560;
  private static readonly H = 520;

  constructor() {
    super();
    this.visible = false;
  }

  setOnClose(cb: () => void): void { this._onClose = cb; }

  /** Open the overlay with current deck contents */
  open(cards: Card[]): void {
    this._cards = cards;
    this._rebuild();
    this.visible = true;
  }

  close(): void {
    this.visible = false;
    this._onClose?.();
  }

  private _rebuild(): void {
    this.removeChildren();

    const W = DeckViewer.W;
    const H = DeckViewer.H;

    // ── Background overlay (dimmed full-screen, click to close) ──
    const dimmer = new Graphics();
    dimmer.rect(-640, -360, 1280 + 640, 720 + 360); // over-sized
    dimmer.fill({ color: 0x000000, alpha: 0.65 });
    dimmer.eventMode = 'static';
    dimmer.on('pointerdown', () => this.close());
    this.addChild(dimmer);

    // ── Main panel ──
    const panel = new Container();
    panel.eventMode = 'static'; // Prevents click-through

    const bg = new Graphics();
    bg.roundRect(-W / 2, -H / 2, W, H, 14);
    bg.fill({ color: 0x0d1117 });
    bg.stroke({ width: 2, color: COLORS.GOLD, alpha: 0.7 });
    panel.addChild(bg);

    // Title
    const title = new Text({
      text: '🃏  牌庫查看',
      style: new TextStyle({ fontSize: 18, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(0, -H / 2 + 14);
    panel.addChild(title);

    // Close button
    const closeBtn = new Container();
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    const closeBg = new Graphics();
    closeBg.roundRect(-20, -14, 40, 28, 6);
    closeBg.fill(0x333355);
    closeBtn.addChild(closeBg);
    const closeTxt = new Text({
      text: '✕',
      style: new TextStyle({ fontSize: 16, fill: 0xCCCCCC }),
    });
    closeTxt.anchor.set(0.5);
    closeBtn.addChild(closeTxt);
    closeBtn.position.set(W / 2 - 26, -H / 2 + 24);
    closeBtn.on('pointerdown', () => this.close());
    closeBtn.on('pointerover', () => { closeBg.tint = 0xcccccc; });
    closeBtn.on('pointerout',  () => { closeBg.tint = 0xffffff; });
    panel.addChild(closeBtn);

    // ── Stats row ──
    const statY = -H / 2 + 52;
    this._buildStatsRow(panel, statY);

    // ── Suit distribution ──
    const suitY = statY + 38;
    this._buildSuitBars(panel, suitY);

    // ── Enhancement breakdown ──
    const enhY = suitY + 130;
    this._buildEnhGrid(panel, enhY);

    // ── Card mini-grid (scrollable rows) ──
    const gridY = enhY + 100;
    this._buildCardGrid(panel, gridY);

    this.addChild(panel);
  }

  private _buildStatsRow(parent: Container, y: number): void {
    const total    = this._cards.length;
    const drawPile = total; // All cards treated as draw pile for display
    const enhanced = this._cards.filter(c => c.enhancement).length;
    const editions = this._cards.filter(c => c.edition).length;

    const stats = [
      { label: '總張數',   value: `${total}` },
      { label: '有增強',   value: `${enhanced}` },
      { label: '有版本',   value: `${editions}` },
      { label: '手牌(顯示)', value: `${drawPile}` },
    ];

    const W = DeckViewer.W;
    const colW = (W - 60) / stats.length;
    let x = -W / 2 + 30;

    for (const s of stats) {
      const lbl = new Text({ text: s.label, style: new TextStyle({ fontSize: 11, fill: COLORS.TEXT_DIM }) });
      lbl.anchor.set(0.5, 0);
      lbl.position.set(x + colW / 2, y);
      parent.addChild(lbl);

      const val = new Text({ text: s.value, style: new TextStyle({ fontSize: 18, fill: COLORS.TEXT_PRIMARY, fontWeight: 'bold' }) });
      val.anchor.set(0.5, 0);
      val.position.set(x + colW / 2, y + 16);
      parent.addChild(val);

      x += colW;
    }
  }

  private _buildSuitBars(parent: Container, y: number): void {
    const W = DeckViewer.W;
    const suitCounts: Record<Suit, number> = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
    for (const c of this._cards) suitCounts[c.suit]++;

    const maxCount = Math.max(...Object.values(suitCounts), 1);
    const barMaxW = (W - 100) / SUIT_ORDER.length - 16;

    const suitLabel = new Text({
      text: '花色分布',
      style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_DIM }),
    });
    suitLabel.position.set(-W / 2 + 16, y);
    parent.addChild(suitLabel);

    let bx = -W / 2 + 30;
    for (const suit of SUIT_ORDER) {
      const count = suitCounts[suit];
      const barW = (count / maxCount) * barMaxW;
      const color = SUIT_COLORS[suit];

      // Suit symbol
      const sym = new Text({ text: SUIT_SYMBOLS[suit], style: new TextStyle({ fontSize: 18, fill: color }) });
      sym.anchor.set(0.5, 0);
      sym.position.set(bx + barMaxW / 2, y + 16);
      parent.addChild(sym);

      // Bar
      const bar = new Graphics();
      bar.roundRect(bx, y + 40, barW, 16, 4);
      bar.fill({ color, alpha: 0.8 });
      parent.addChild(bar);

      // Track
      const track = new Graphics();
      track.roundRect(bx, y + 40, barMaxW, 16, 4);
      track.stroke({ width: 1, color: 0x334455, alpha: 0.6 });
      parent.addChild(track);

      // Count
      const cnt = new Text({ text: `${count}`, style: new TextStyle({ fontSize: 11, fill: COLORS.TEXT_PRIMARY }) });
      cnt.anchor.set(0.5, 0);
      cnt.position.set(bx + barMaxW / 2, y + 60);
      parent.addChild(cnt);

      bx += barMaxW + 16;
    }
  }

  private _buildEnhGrid(parent: Container, y: number): void {
    const W = DeckViewer.W;
    // Count enhancements
    const enhCount: Record<string, number> = {};
    const edCount:  Record<string, number> = {};
    for (const c of this._cards) {
      if (c.enhancement) enhCount[c.enhancement] = (enhCount[c.enhancement] ?? 0) + 1;
      if (c.edition)     edCount[c.edition]       = (edCount[c.edition] ?? 0)       + 1;
    }

    const enhLabel = new Text({
      text: '增強 / 版本分布',
      style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_DIM }),
    });
    enhLabel.position.set(-W / 2 + 16, y);
    parent.addChild(enhLabel);

    const items = [
      ...Object.entries(enhCount).map(([k, v]) => ({ label: k, count: v, color: 0x4A9EFF })),
      ...Object.entries(edCount).map(([k, v]) => ({ label: k, count: v, color: 0xFFB347 })),
    ];

    let ix = -W / 2 + 30;
    const itemW = 80;
    for (const item of items.slice(0, 6)) {
      const chip = new Graphics();
      chip.roundRect(ix, y + 18, itemW, 28, 6);
      chip.fill({ color: item.color, alpha: 0.2 });
      chip.stroke({ width: 1, color: item.color, alpha: 0.6 });
      parent.addChild(chip);

      const lbl = new Text({
        text: `${item.label} ×${item.count}`,
        style: new TextStyle({ fontSize: 10, fill: item.color, fontWeight: 'bold' }),
      });
      lbl.anchor.set(0.5);
      lbl.position.set(ix + itemW / 2, y + 32);
      parent.addChild(lbl);

      ix += itemW + 8;
    }

    if (items.length === 0) {
      const noEnh = new Text({
        text: '（無增強/版本牌）',
        style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_DIM }),
      });
      noEnh.position.set(-W / 2 + 30, y + 22);
      parent.addChild(noEnh);
    }
  }

  private _buildCardGrid(parent: Container, y: number): void {
    const W = DeckViewer.W;
    const H = DeckViewer.H;

    const tileW = 48;
    const tileH = 28;
    const cols  = Math.floor((W - 60) / (tileW + 4));
    const maxRows = Math.floor((H / 2 - y - 24) / (tileH + 3));

    const gridLabel = new Text({
      text: '牌庫細節（點數 × 花色圖）',
      style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_DIM }),
    });
    gridLabel.position.set(-W / 2 + 16, y);
    parent.addChild(gridLabel);

    const startX = -W / 2 + 30;
    let row = 0;
    let col = 0;

    for (const card of this._cards) {
      if (row >= maxRows) break;

      const tx = startX + col * (tileW + 4);
      const ty = y + 18 + row * (tileH + 3);

      const tile = new Graphics();
      tile.roundRect(tx, ty, tileW, tileH, 4);
      tile.fill({ color: 0x0d1117 });
      tile.stroke({ width: 1, color: card.enhancement
        ? 0x4A9EFF
        : card.edition ? 0xFFB347 : 0x334455, alpha: 0.7 });
      parent.addChild(tile);

      const suitColor = SUIT_COLORS[card.suit];
      const cardTxt = new Text({
        text: `${_rankLabel(card.rank)}${SUIT_SYMBOLS[card.suit]}`,
        style: new TextStyle({ fontSize: 12, fill: suitColor, fontWeight: 'bold' }),
      });
      cardTxt.anchor.set(0.5);
      cardTxt.position.set(tx + tileW / 2, ty + tileH / 2);
      parent.addChild(cardTxt);

      col++;
      if (col >= cols) { col = 0; row++; }
    }
  }
}

function _rankLabel(rank: number): string {
  const names: Record<number, string> = {
    1: 'A', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
  };
  return names[rank] ?? `${rank}`;
}

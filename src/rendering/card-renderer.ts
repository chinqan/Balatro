// ============================================================
// Card Renderer — Procedural card drawing with PIXI.Graphics
// No textures needed; everything is drawn programmatically
// ============================================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Card, Suit } from '@/types';
import { RANK_NAMES, SUIT_SYMBOLS } from '@/types';
import { COLORS, LAYOUT } from '@/rendering/design-tokens';

const SUIT_COLORS: Record<Suit, number> = {
  hearts: COLORS.SUIT_RED,
  diamonds: COLORS.SUIT_RED,
  spades: COLORS.SUIT_BLACK,
  clubs: COLORS.SUIT_BLACK,
};

const ENHANCEMENT_BORDER_COLORS: Record<string, number> = {
  bonus: 0x4A9EFF,
  glass: 0xAA88FF,
  steel: 0x888888,
  stone: 0x666666,
  gold: 0xFFD700,
  lucky: 0x44FF44,
  wild: 0xFF44FF,
};

/**
 * Create a card visual container from card data.
 */
export function createCardSprite(card: Card): Container {
  const container = new Container();
  container.label = `card_${card.id}`;

  const { CARD_W, CARD_H, CARD_CORNER_R } = LAYOUT;

  // Card background
  const bg = new Graphics();

  // Enhancement border glow
  if (card.enhancement) {
    const color = ENHANCEMENT_BORDER_COLORS[card.enhancement] ?? 0xFFFFFF;
    bg.roundRect(-3, -3, CARD_W + 6, CARD_H + 6, CARD_CORNER_R + 2);
    bg.fill({ color, alpha: 0.6 });
  }

  // Main card body
  bg.roundRect(0, 0, CARD_W, CARD_H, CARD_CORNER_R);
  bg.fill(card.isDebuffed ? 0x3a3a3a : 0xF5F5DC);
  bg.stroke({ width: 2, color: 0x333333 });

  container.addChild(bg);

  // Suit color
  const suitColor = SUIT_COLORS[card.suit];

  // Rank text (top-left)
  const rankStyle = new TextStyle({
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: 'bold',
    fill: suitColor,
  });
  const rankText = new Text({ text: RANK_NAMES[card.rank], style: rankStyle });
  rankText.position.set(8, 6);
  container.addChild(rankText);

  // Suit symbol (below rank)
  const suitStyle = new TextStyle({
    fontFamily: 'serif',
    fontSize: 16,
    fill: suitColor,
  });
  const suitText = new Text({ text: SUIT_SYMBOLS[card.suit], style: suitStyle });
  suitText.position.set(8, 28);
  container.addChild(suitText);

  // Large center suit
  const centerStyle = new TextStyle({
    fontFamily: 'serif',
    fontSize: 36,
    fill: suitColor,
  });
  const centerSuit = new Text({ text: SUIT_SYMBOLS[card.suit], style: centerStyle });
  centerSuit.anchor.set(0.5);
  centerSuit.position.set(CARD_W / 2, CARD_H / 2);
  container.addChild(centerSuit);

  // Edition indicator (bottom-right)
  if (card.edition) {
    const edStyle = new TextStyle({ fontSize: 10, fill: 0x888888 });
    const edText = new Text({ text: card.edition.substring(0, 4).toUpperCase(), style: edStyle });
    edText.position.set(CARD_W - 36, CARD_H - 16);
    container.addChild(edText);
  }

  // Seal indicator (small circle bottom-left)
  if (card.seal) {
    const sealColors: Record<string, number> = {
      red: 0xFF4444, blue: 0x4488FF, gold_seal: 0xFFD700, purple: 0xAA44FF,
    };
    const sealGfx = new Graphics();
    sealGfx.circle(16, CARD_H - 16, 6);
    sealGfx.fill(sealColors[card.seal] ?? 0xFFFFFF);
    container.addChild(sealGfx);
  }

  // Debuffed overlay
  if (card.isDebuffed) {
    const overlay = new Graphics();
    overlay.roundRect(0, 0, CARD_W, CARD_H, CARD_CORNER_R);
    overlay.fill({ color: 0x000000, alpha: 0.4 });
    container.addChild(overlay);
  }

  // Make interactive
  container.eventMode = 'static';
  container.cursor = 'pointer';

  // Set pivot to center for easier positioning
  container.pivot.set(CARD_W / 2, CARD_H / 2);

  return container;
}

/**
 * Update the selection visual on a card.
 */
export function setCardSelected(container: Container, selected: boolean): void {
  // Remove existing selection highlight
  const existing = container.getChildByLabel('selection_glow');
  if (existing) {
    container.removeChild(existing);
  }

  if (selected) {
    const { CARD_W, CARD_H, CARD_CORNER_R } = LAYOUT;
    const glow = new Graphics();
    glow.label = 'selection_glow';
    glow.roundRect(-4, -4, CARD_W + 8, CARD_H + 8, CARD_CORNER_R + 3);
    glow.stroke({ width: 3, color: COLORS.CARD_SELECTED });
    container.addChildAt(glow, 0); // Behind everything

    // Lift card up
    container.y -= 20;
  }
}

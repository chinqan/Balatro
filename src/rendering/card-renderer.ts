// ============================================================
// Card Renderer — Rich procedural card drawing
// GDD Phase 1 §2 + Phase 5 §1: Enhancement/Edition/Seal visuals
// ============================================================
//
// Enhancement visual cues (GDD Phase 1 §2.2):
//   bonus   → 藍色光暈 + "+" 攻擊標記
//   glass   → 透明玻璃感 + 紫邊
//   steel   → 銀色金屬邊框 (不被選入加乘)
//   stone   → 深灰石紋 + 零點數
//   gold    → 金邊 + 回合末增加金錢
//   lucky   → 綠色 + 幸運觸發機率
//   wild    → 彩虹框 + 任意花色
//
// Edition visual cues (GDD Phase 1 §2.3):
//   foil       → 橙金色光澤 + "FOIL" 標籤
//   holo       → 全彩虹框 + "HOLO" 標籤
//   polychrome → 多彩旋流 + "POLY" 標籤 (×1.5)
//   negative   → 反色（牌面黑底白字）
//
// Seal visual cues (GDD Phase 1 §2.4):
//   red_seal    → 紅色印章
//   blue_seal   → 藍色印章
//   gold_seal   → 金色印章
//   purple_seal → 紫色印章
// ============================================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Card, Suit } from '@/types';
import { RANK_NAMES, SUIT_SYMBOLS } from '@/types';
import { COLORS, LAYOUT } from '@/rendering/design-tokens';

// ─── Color Maps ──────────────────────────────────────────────

const SUIT_COLORS: Record<Suit, number> = {
  hearts:   COLORS.SUIT_RED,
  diamonds: COLORS.SUIT_RED,
  spades:   COLORS.SUIT_BLACK,
  clubs:    COLORS.SUIT_BLACK,
};

const ENHANCEMENT_COLORS: Record<string, number> = {
  bonus:  0x4A9EFF,
  glass:  0xAA88FF,
  steel:  0x9DB0C4,
  stone:  0x666666,
  gold:   0xFFD700,
  lucky:  0x44FF88,
  wild:   0xFF44FF,
};

const EDITION_COLORS: Record<string, number> = {
  foil:         0xFFB347,
  holographic:  0x00FFEE,
  polychrome:   0xFF88FF,
  negative:     0xFFFFFF,
};

const SEAL_COLORS: Record<string, number> = {
  red_seal:    0xFF4444,
  blue_seal:   0x4488FF,
  gold_seal:   0xFFD700,
  purple_seal: 0xAA44FF,
};

// Legacy seal names mapping
const SEAL_ALIASES: Record<string, string> = {
  red: 'red_seal', blue: 'blue_seal', gold: 'gold_seal', purple: 'purple_seal',
};

// ─── Build Card Face ─────────────────────────────────────────

/**
 * Create a card visual container from card data.
 * Includes enhancement glow, edition badge, seal dot.
 */
export function createCardSprite(card: Card): Container {
  const container = new Container();
  container.label = `card_${card.id}`;

  const { CARD_W, CARD_H, CARD_CORNER_R } = LAYOUT;

  // ── Step 1: Edition outer glow (behind card body) ──
  if (card.edition) {
    const edColor = EDITION_COLORS[card.edition] ?? 0xFFFFFF;
    const edGlow = new Graphics();
    edGlow.label = 'edition_glow';
    edGlow.roundRect(-5, -5, CARD_W + 10, CARD_H + 10, CARD_CORNER_R + 4);
    edGlow.fill({ color: edColor, alpha: 0.35 });
    container.addChild(edGlow);
  }

  // ── Step 2: Enhancement outer ring ──
  if (card.enhancement) {
    const enhColor = ENHANCEMENT_COLORS[card.enhancement] ?? 0xFFFFFF;
    const enhGlow = new Graphics();
    enhGlow.label = 'enhancement_glow';
    enhGlow.roundRect(-3, -3, CARD_W + 6, CARD_H + 6, CARD_CORNER_R + 2);
    enhGlow.fill({ color: enhColor, alpha: 0.55 });
    container.addChild(enhGlow);
  }

  // ── Step 3: Card face ──
  const isNegative = card.edition === 'negative';
  const bgColor = isNegative ? 0x111111 : (card.isDebuffed ? 0x3a3a3a : 0xF5F5DC);
  const textColor = isNegative ? 0xFFFFFF : SUIT_COLORS[card.suit];

  const bg = new Graphics();
  bg.label = 'card_bg';
  bg.roundRect(0, 0, CARD_W, CARD_H, CARD_CORNER_R);
  bg.fill(bgColor);

  // Border: steel/edition colored vs standard
  let borderColor = 0x333333;
  let borderWidth = 1.5;
  if (card.enhancement === 'steel') { borderColor = ENHANCEMENT_COLORS['steel']; borderWidth = 2.5; }
  if (card.edition === 'foil')          { borderColor = EDITION_COLORS['foil'];        borderWidth = 2; }
  if (card.edition === 'holographic')   { borderColor = EDITION_COLORS['holographic']; borderWidth = 2; }
  if (card.edition === 'polychrome')    { borderColor = EDITION_COLORS['polychrome'];  borderWidth = 2; }

  bg.stroke({ width: borderWidth, color: borderColor });
  container.addChild(bg);

  // ── Step 4: Rank text (top-left) ──
  const rankStyle = new TextStyle({
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: 'bold',
    fill: textColor,
  });
  const rankText = new Text({ text: RANK_NAMES[card.rank], style: rankStyle });
  rankText.position.set(7, 5);
  container.addChild(rankText);

  // ── Step 5: Suit symbol (below rank) ──
  const suitStyle = new TextStyle({ fontFamily: 'serif', fontSize: 15, fill: textColor });
  const suitText = new Text({ text: SUIT_SYMBOLS[card.suit], style: suitStyle });
  suitText.position.set(7, 26);
  container.addChild(suitText);

  // ── Step 6: Center suit ──
  const centerStyle = new TextStyle({
    fontFamily: 'serif',
    fontSize: card.enhancement === 'stone' ? 18 : 34,
    fill: card.enhancement === 'stone' ? 0x888888 : textColor,
  });
  const centerSuit = new Text({
    text: card.enhancement === 'stone' ? '石' : SUIT_SYMBOLS[card.suit],
    style: centerStyle,
  });
  centerSuit.anchor.set(0.5);
  centerSuit.position.set(CARD_W / 2, CARD_H / 2 + 2);
  container.addChild(centerSuit);

  // ── Step 7: Enhancement badge (bottom-right corner) ──
  if (card.enhancement) {
    _addEnhancementBadge(container, card.enhancement, CARD_W, CARD_H);
  }

  // ── Step 8: Edition badge (top-right) ──
  if (card.edition) {
    const edLabel = _editionLabel(card.edition);
    const edTxt = new Text({
      text: edLabel,
      style: new TextStyle({ fontSize: 9, fill: EDITION_COLORS[card.edition] ?? 0xCCCCCC, fontWeight: 'bold' }),
    });
    edTxt.anchor.set(1, 0);
    edTxt.position.set(CARD_W - 5, 5);
    container.addChild(edTxt);
  }

  // ── Step 9: Seal dot (bottom-left) ──
  if (card.seal) {
    const sealKey = SEAL_ALIASES[card.seal] ?? card.seal;
    const sealColor = SEAL_COLORS[sealKey] ?? 0xFFFFFF;
    const sealGfx = new Graphics();
    sealGfx.circle(14, CARD_H - 14, 7);
    sealGfx.fill(sealColor);
    // Inner dot
    sealGfx.circle(14, CARD_H - 14, 3.5);
    sealGfx.fill({ color: 0xFFFFFF, alpha: 0.6 });
    container.addChild(sealGfx);

    const sealChar = _sealChar(sealKey);
    const sealTxt = new Text({
      text: sealChar,
      style: new TextStyle({ fontSize: 8, fill: 0xFFFFFF }),
    });
    sealTxt.anchor.set(0.5);
    sealTxt.position.set(14, CARD_H - 14);
    container.addChild(sealTxt);
  }

  // ── Step 10: Debuffed overlay ──
  if (card.isDebuffed) {
    const overlay = new Graphics();
    overlay.roundRect(0, 0, CARD_W, CARD_H, CARD_CORNER_R);
    overlay.fill({ color: 0x000000, alpha: 0.45 });
    container.addChild(overlay);

    const debuffTxt = new Text({
      text: '✕',
      style: new TextStyle({ fontSize: 28, fill: 0xFF4444, fontWeight: 'bold' }),
    });
    debuffTxt.anchor.set(0.5);
    debuffTxt.position.set(CARD_W / 2, CARD_H / 2);
    container.addChild(debuffTxt);
  }

  // ── Step 11: Glass overlay (transparency effect) ──
  if (card.enhancement === 'glass') {
    const glassOverlay = new Graphics();
    glassOverlay.roundRect(0, 0, CARD_W, CARD_H, CARD_CORNER_R);
    glassOverlay.fill({ color: 0xAA88FF, alpha: 0.12 });
    container.addChild(glassOverlay);

    // Reflection streak
    const streak = new Graphics();
    streak.moveTo(10, 8);
    streak.lineTo(CARD_W - 16, 8);
    streak.stroke({ width: 3, color: 0xFFFFFF, alpha: 0.25 });
    container.addChild(streak);
  }

  // ── Step 12: Polychrome swirl hint ──
  if (card.edition === 'polychrome') {
    const swirl = new Graphics();
    swirl.circle(CARD_W / 2, CARD_H / 2, CARD_W * 0.28);
    swirl.stroke({ width: 1.5, color: 0xFF88FF, alpha: 0.4 });
    container.addChild(swirl);
  }

  // Make interactive
  container.eventMode = 'static';
  container.cursor = 'pointer';
  container.pivot.set(CARD_W / 2, CARD_H / 2);
  return container;
}

// ─── Private Helpers ──────────────────────────────────────────

function _addEnhancementBadge(container: Container, enhancement: string, cardW: number, cardH: number): void {
  const badgeInfo: Record<string, { icon: string; color: number }> = {
    bonus:  { icon: '✦',   color: 0x4A9EFF },
    glass:  { icon: '◈',   color: 0xAA88FF },
    steel:  { icon: '⬡',   color: 0x9DB0C4 },
    stone:  { icon: '◆',   color: 0x888888 },
    gold:   { icon: '$',   color: 0xFFD700 },
    lucky:  { icon: '★',   color: 0x44FF88 },
    wild:   { icon: '∞',   color: 0xFF44FF },
  };

  const info = badgeInfo[enhancement];
  if (!info) return;

  const txt = new Text({
    text: info.icon,
    style: new TextStyle({ fontSize: 12, fill: info.color, fontWeight: 'bold' }),
  });
  txt.anchor.set(1, 1);
  txt.position.set(cardW - 5, cardH - 5);
  container.addChild(txt);
}

function _editionLabel(edition: string): string {
  switch (edition) {
    case 'foil':         return 'FOIL';
    case 'holographic':  return 'HOLO';
    case 'polychrome':   return 'POLY';
    case 'negative':     return 'NEG';
    default:             return edition.toUpperCase().substring(0, 4);
  }
}

function _sealChar(sealKey: string): string {
  switch (sealKey) {
    case 'red_seal':    return 'R';
    case 'blue_seal':   return 'B';
    case 'gold_seal':   return 'G';
    case 'purple_seal': return 'P';
    default:            return '●';
  }
}

// ─── Selection Helper ─────────────────────────────────────────

/**
 * Update the selection visual on a card container.
 */
export function setCardSelected(container: Container, selected: boolean): void {
  const existing = container.getChildByLabel('selection_glow');
  if (existing) container.removeChild(existing);

  if (selected) {
    const { CARD_W, CARD_H, CARD_CORNER_R } = LAYOUT;
    const glow = new Graphics();
    glow.label = 'selection_glow';
    glow.roundRect(-5, -5, CARD_W + 10, CARD_H + 10, CARD_CORNER_R + 4);
    glow.stroke({ width: 3, color: COLORS.CARD_SELECTED });
    container.addChildAt(glow, 0);
  }
}

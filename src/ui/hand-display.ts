// ============================================================
// Hand Display — Manages the visual hand of cards
// GDD Phase 4 §1.1: Cards arranged in a fan below center
// ============================================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Card, Suit } from '@/types';
import { createCardSprite, setCardSelected } from '@/rendering/card-renderer';
import { COLORS, LAYOUT } from '@/rendering/design-tokens';

export type SortMode = 'suit' | 'rank';

const SUIT_ORDER: Record<Suit, number> = {
  spades: 0, hearts: 1, diamonds: 2, clubs: 3,
};

export class HandDisplay extends Container {
  private readonly _cardContainers: Container[] = [];
  private readonly _selectedIndices = new Set<number>();
  private _onSelectionChange?: (indices: number[]) => void;
  private _sortMode: SortMode = 'rank';
  private _currentCards: Card[] = [];

  // Sort toggle button
  private _sortToggleBtn!: Container;

  constructor() {
    super();
    this._createSortButtons();
    this._updateSortButton();
  }

  onSelectionChange(callback: (indices: number[]) => void): void {
    this._onSelectionChange = callback;
  }

  get sortMode(): SortMode { return this._sortMode; }

  /**
   * Rebuild the hand display from card data.
   */
  setCards(cards: Card[]): void {
    this._clearCards();
    this._currentCards = [...cards];

    // Apply sorting
    const sorted = this._getSortedCards();

    const { CARD_W, CARD_GAP } = LAYOUT;
    const totalWidth = sorted.length * (CARD_W + CARD_GAP) - CARD_GAP;
    const startX = -totalWidth / 2;

    for (let i = 0; i < sorted.length; i++) {
      const card = sorted[i].card;
      const originalIndex = sorted[i].originalIndex;
      const cardContainer = createCardSprite(card);

      cardContainer.x = startX + i * (CARD_W + CARD_GAP) + CARD_W / 2;
      cardContainer.y = 0;

      // Store original index for selection mapping
      (cardContainer as unknown as Record<string, unknown>)['_baseY'] = 0;
      (cardContainer as unknown as Record<string, unknown>)['_origIdx'] = originalIndex;

      // Click handler
      const displayIdx = i;
      cardContainer.on('pointerdown', () => this._toggleSelection(displayIdx));

      // Hover effects
      cardContainer.on('pointerover', () => {
        if (!this._selectedIndices.has(displayIdx)) {
          cardContainer.scale.set(1.05);
        }
      });
      cardContainer.on('pointerout', () => {
        if (!this._selectedIndices.has(displayIdx)) {
          cardContainer.scale.set(1.0);
        }
      });

      this._cardContainers.push(cardContainer);
      this.addChild(cardContainer);
    }
  }

  /**
   * Toggle selection of a card at display index.
   */
  private _toggleSelection(displayIndex: number): void {
    const container = this._cardContainers[displayIndex];
    if (!container) return;

    const baseY = ((container as unknown as Record<string, unknown>)['_baseY'] as number) ?? 0;

    if (this._selectedIndices.has(displayIndex)) {
      this._selectedIndices.delete(displayIndex);
      container.y = baseY;
      container.scale.set(1.0);
      setCardSelected(container, false);
    } else {
      this._selectedIndices.add(displayIndex);
      container.y = baseY - 20;
      container.scale.set(1.08);
      setCardSelected(container, true);
    }

    // Map display indices back to original card indices
    this._onSelectionChange?.(this._getOriginalIndices());
  }

  /**
   * Get selected card indices in the ORIGINAL (unsorted) order.
   */
  getSelectedIndices(): number[] {
    return this._getOriginalIndices();
  }

  private _getOriginalIndices(): number[] {
    const result: number[] = [];
    for (const displayIdx of this._selectedIndices) {
      const container = this._cardContainers[displayIdx];
      if (container) {
        const origIdx = (container as unknown as Record<string, unknown>)['_origIdx'] as number;
        result.push(origIdx);
      }
    }
    return result.sort((a, b) => a - b);
  }

  clearSelection(): void {
    for (const idx of this._selectedIndices) {
      const container = this._cardContainers[idx];
      if (container) {
        const baseY = ((container as unknown as Record<string, unknown>)['_baseY'] as number) ?? 0;
        container.y = baseY;
        container.scale.set(1.0);
        setCardSelected(container, false);
      }
    }
    this._selectedIndices.clear();
    this._onSelectionChange?.([]);
  }

  clear(): void {
    this._clearCards();
    this._currentCards = [];
  }

  private _clearCards(): void {
    for (const c of this._cardContainers) {
      this.removeChild(c);
    }
    this._cardContainers.length = 0;
    this._selectedIndices.clear();
  }

  // ─── Sorting ──────────────────────────────────────────────

  private _getSortedCards(): { card: Card; originalIndex: number }[] {
    const indexed = this._currentCards.map((card, i) => ({ card, originalIndex: i }));

    switch (this._sortMode) {
      case 'suit':
        indexed.sort((a, b) => {
          const suitDiff = SUIT_ORDER[a.card.suit] - SUIT_ORDER[b.card.suit];
          if (suitDiff !== 0) return suitDiff;
          return b.card.rank - a.card.rank; // Descending rank
        });
        break;
      case 'rank':
        indexed.sort((a, b) => {
          const rankDiff = b.card.rank - a.card.rank; // Descending rank
          if (rankDiff !== 0) return rankDiff;
          return SUIT_ORDER[a.card.suit] - SUIT_ORDER[b.card.suit];
        });
        break;
    }

    return indexed;
  }

  /** Toggle between 'rank' and 'suit' sorting. Always sorted. */
  toggleSortMode(): void {
    this._sortMode = this._sortMode === 'rank' ? 'suit' : 'rank';
    this._updateSortButton();
    // Re-render cards with new sort
    if (this._currentCards.length > 0) {
      this.clearSelection();
      this.setCards(this._currentCards);
    }
  }

  private _createSortButtons(): void {
    const BUTTON_W = 110;
    const BUTTON_H = 26;

    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(0, 0, BUTTON_W, BUTTON_H, 6);
    bg.fill(0x2E86AB);
    bg.stroke({ width: 1, color: COLORS.GOLD });
    btn.addChild(bg);

    const label = this._sortMode === 'rank' ? '數字' : '花色';
    const text = new Text({
      text: `🔀 排序: ${label}`,
      style: new TextStyle({ fontSize: 10, fill: '#FFFFFF' }),
    });
    text.anchor.set(0.5);
    text.position.set(BUTTON_W / 2, BUTTON_H / 2);
    btn.addChild(text);

    btn.position.set(-BUTTON_W / 2, 80); // Centered below cards
    btn.on('pointerdown', () => this.toggleSortMode());

    this._sortToggleBtn = btn;
    this.addChild(this._sortToggleBtn);
  }

  private _updateSortButton(): void {
    const btn = this._sortToggleBtn;
    const BUTTON_W = 110;
    const BUTTON_H = 26;

    // Update background
    const bg = btn.getChildAt(0) as Graphics;
    bg.clear();
    bg.roundRect(0, 0, BUTTON_W, BUTTON_H, 6);
    bg.fill(0x2E86AB);
    bg.stroke({ width: 1, color: COLORS.GOLD });

    // Update label text
    const text = btn.getChildAt(1) as Text;
    const label = this._sortMode === 'rank' ? '數字' : '花色';
    text.text = `🔀 排序: ${label}`;
  }
}

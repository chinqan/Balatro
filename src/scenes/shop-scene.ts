// ============================================================
// Shop Scene — Buy relics, consumables, reroll
// GDD Phase 2 §3: Shop content & economy
// ============================================================

import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Scene } from '@/scenes/scene-manager';
import { Viewport, DESIGN_W, DESIGN_H } from '@/rendering/viewport';
import { COLORS } from '@/rendering/design-tokens';
import { ShopManager, type ShopItem } from '@/systems/shop-manager';
import type { PlayerState } from '@/types';

export class ShopScene implements Scene {
  readonly name = 'shop';

  private _viewport!: Viewport;
  private _shop!: ShopManager;
  private _player!: PlayerState;
  private _onLeave?: () => void;

  setShopManager(shop: ShopManager): void {
    this._shop = shop;
  }

  setPlayer(player: PlayerState): void {
    this._player = player;
  }

  setOnLeave(cb: () => void): void { this._onLeave = cb; }

  async init(app: Application, container: Container): Promise<void> {
    this._viewport = new Viewport(app, container);
    this._rebuildShop();
  }

  update(_dt: number): void {}

  destroy(): void {
    this._viewport?.destroy();
  }

  refreshShop(): void {
    this._rebuildShop();
  }

  private _rebuildShop(): void {
    const root = this._viewport.root;
    root.removeChildren();

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, DESIGN_H);
    bg.fill(0x0d1117);
    root.addChild(bg);

    // Title
    const title = new Text({
      text: '🏪 商店',
      style: new TextStyle({ fontSize: 28, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(DESIGN_W / 2, 20);
    root.addChild(title);

    // Money display
    const moneyText = new Text({
      text: `💰 ${this._player?.money ?? 0} 金`,
      style: new TextStyle({ fontSize: 18, fill: COLORS.GOLD }),
    });
    moneyText.anchor.set(0.5, 0);
    moneyText.position.set(DESIGN_W / 2, 60);
    root.addChild(moneyText);

    if (!this._shop) return;

    // Shop items
    const items = this._shop.state.items;
    const startX = 80;
    const startY = 120;
    const cardW = 240;
    const cardH = 180;
    const gap = 20;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const col = i % 4;
      const x = startX + col * (cardW + gap);
      const y = startY;

      // Item card
      const card = new Container();
      const cardBg = new Graphics();
      cardBg.roundRect(0, 0, cardW, cardH, 10);

      if (item.sold) {
        cardBg.fill(0x1a1a1a);
        cardBg.stroke({ width: 1, color: 0x333333 });
      } else {
        cardBg.fill(0x1a2a3a);
        cardBg.stroke({ width: 2, color: this._getItemBorderColor(item) });
      }
      card.addChild(cardBg);

      // Item type icon
      const typeIcon = item.type === 'relic' ? '🔮' :
                       item.type === 'card' ? '🃏' : '✨';
      const iconText = new Text({
        text: typeIcon,
        style: new TextStyle({ fontSize: 32 }),
      });
      iconText.position.set(10, 10);
      card.addChild(iconText);

      // Item name
      const nameText = new Text({
        text: item.sold ? `${item.name} (已售出)` : item.name,
        style: new TextStyle({
          fontSize: 14,
          fill: item.sold ? COLORS.TEXT_DIM : COLORS.TEXT_PRIMARY,
          fontWeight: 'bold',
          wordWrap: true,
          wordWrapWidth: cardW - 60,
        }),
      });
      nameText.position.set(50, 14);
      card.addChild(nameText);

      // Description
      const descText = new Text({
        text: item.description,
        style: new TextStyle({
          fontSize: 11,
          fill: COLORS.TEXT_DIM,
          wordWrap: true,
          wordWrapWidth: cardW - 20,
        }),
      });
      descText.position.set(10, 55);
      card.addChild(descText);

      // Price
      if (!item.sold) {
        const canAfford = (this._player?.money ?? 0) >= item.price;
        const priceText = new Text({
          text: `💰 ${item.price}`,
          style: new TextStyle({
            fontSize: 14,
            fill: canAfford ? COLORS.GOLD : 0xFF4444,
            fontWeight: 'bold',
          }),
        });
        priceText.position.set(10, cardH - 40);
        card.addChild(priceText);

        // Buy button
        const buyBtn = new Container();
        buyBtn.eventMode = 'static';
        buyBtn.cursor = canAfford ? 'pointer' : 'not-allowed';
        const buyBg = new Graphics();
        buyBg.roundRect(0, 0, 60, 26, 6);
        buyBg.fill(canAfford ? COLORS.BUTTON_PRIMARY : COLORS.BUTTON_DISABLED);
        buyBtn.addChild(buyBg);
        const buyLabel = new Text({
          text: '購買',
          style: new TextStyle({ fontSize: 12, fill: 0xFFFFFF }),
        });
        buyLabel.anchor.set(0.5);
        buyLabel.position.set(30, 13);
        buyBtn.addChild(buyLabel);
        buyBtn.position.set(cardW - 72, cardH - 36);

        if (canAfford) {
          const idx = i;
          buyBtn.on('pointerdown', () => {
            if (this._shop.purchase(idx, this._player)) {
              this._rebuildShop(); // Refresh UI
            }
          });
        }
        card.addChild(buyBtn);
      }

      card.position.set(x, y);
      root.addChild(card);
    }

    // Reroll button
    const rerollY = startY + cardH + 30;
    const rerollBtn = new Container();
    rerollBtn.eventMode = 'static';
    rerollBtn.cursor = 'pointer';
    const rerollBg = new Graphics();
    rerollBg.roundRect(0, 0, 200, 40, 8);
    const canReroll = (this._player?.money ?? 0) >= this._shop.state.rerollCost;
    rerollBg.fill(canReroll ? 0x5E3A98 : COLORS.BUTTON_DISABLED);
    rerollBtn.addChild(rerollBg);
    const rerollLabel = new Text({
      text: `🔄 重新整理 (💰${this._shop.state.rerollCost})`,
      style: new TextStyle({ fontSize: 14, fill: 0xFFFFFF }),
    });
    rerollLabel.anchor.set(0.5);
    rerollLabel.position.set(100, 20);
    rerollBtn.addChild(rerollLabel);
    rerollBtn.position.set(DESIGN_W / 2 - 220, rerollY);
    if (canReroll) {
      rerollBtn.on('pointerdown', () => {
        if (this._shop.reroll(this._player)) {
          this._rebuildShop();
        }
      });
    }
    root.addChild(rerollBtn);

    // Leave button
    const leaveBtn = new Container();
    leaveBtn.eventMode = 'static';
    leaveBtn.cursor = 'pointer';
    const leaveBg = new Graphics();
    leaveBg.roundRect(0, 0, 200, 40, 8);
    leaveBg.fill(COLORS.BUTTON_DANGER);
    leaveBtn.addChild(leaveBg);
    const leaveLabel = new Text({
      text: '➡ 離開商店',
      style: new TextStyle({ fontSize: 14, fill: 0xFFFFFF, fontWeight: 'bold' }),
    });
    leaveLabel.anchor.set(0.5);
    leaveLabel.position.set(100, 20);
    leaveBtn.addChild(leaveLabel);
    leaveBtn.position.set(DESIGN_W / 2 + 20, rerollY);
    leaveBtn.on('pointerdown', () => this._onLeave?.());
    root.addChild(leaveBtn);
  }

  private _getItemBorderColor(item: ShopItem): number {
    if (item.type === 'relic' && item.relic) {
      switch (item.relic.rarity) {
        case 'common': return COLORS.RARITY_COMMON;
        case 'uncommon': return COLORS.RARITY_UNCOMMON;
        case 'rare': return COLORS.RARITY_RARE;
        case 'legendary': return COLORS.RARITY_LEGENDARY;
      }
    }
    return 0x4488AA;
  }
}

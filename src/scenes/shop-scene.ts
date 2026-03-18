// ============================================================
// Shop Scene — Buy relics, consumables, card packs, blessings
// GDD Phase 8 §3.5 + Phase 2 §3.2: Full shop layout
// ============================================================

import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Scene } from '@/scenes/scene-manager';
import { Viewport, DESIGN_W, DESIGN_H } from '@/rendering/viewport';
import { COLORS } from '@/rendering/design-tokens';
import { ShopManager, type ShopItem, type ShopItemType } from '@/systems/shop-manager';
import type { PlayerState } from '@/types';

// Section layout constants
const SECTION_MARGIN = 12;
const ITEM_W = 150;
const ITEM_H = 130;
const ITEM_GAP = 10;

// Section title colors by zone
const ZONE_COLOR: Record<string, number> = {
  relic:    0x9B59B6,
  card:     0x3498DB,
  blessing: 0xF39C12,
  sell:     0xE74C3C,
};

export class ShopScene implements Scene {
  readonly name = 'shop';

  private _viewport!: Viewport;
  private _shop!: ShopManager;
  private _player!: PlayerState;
  private _onLeave?: () => void;

  setShopManager(shop: ShopManager): void { this._shop = shop; }
  setPlayer(player: PlayerState): void { this._player = player; }
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

    // ─── Background ──────────────────────────────────────
    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, DESIGN_H);
    bg.fill(0x0d1117);
    root.addChild(bg);

    // ─── Header ──────────────────────────────────────────
    const title = new Text({
      text: '🏪 商店',
      style: new TextStyle({ fontSize: 26, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(DESIGN_W / 2, 14);
    root.addChild(title);

    const moneyText = new Text({
      text: `💰 ${this._player?.money ?? 0} 金`,
      style: new TextStyle({ fontSize: 16, fill: COLORS.GOLD }),
    });
    moneyText.anchor.set(0, 0);
    moneyText.position.set(SECTION_MARGIN, 16);
    root.addChild(moneyText);

    if (!this._shop) return;

    const items = this._shop.state.items;

    // ─── Categorise items ─────────────────────────────────
    const relics     = items.filter(i => i.type === 'relic');
    const cards      = items.filter(i => i.type === 'card');
    const blessings  = items.filter(i => i.type === 'blessing');

    // ─── Layout sections top-to-bottom ───────────────────
    let y = 58;

    // RELICS section
    y = this._drawSection(root, '🔮 遺物', 'relic', relics, y);

    // CONSUMABLES / CARD PACKS section
    y = this._drawSection(root, '📦 卡包 / 消耗品', 'card', cards, y);

    // BLESSINGS section
    y = this._drawSection(root, '✨ 加持（永久增益）', 'blessing', blessings, y);

    // ─── SELL ZONE ────────────────────────────────────────
    y += 6;
    const sellZoneH = 48;
    const sellBg = new Graphics();
    sellBg.roundRect(SECTION_MARGIN, y, DESIGN_W - SECTION_MARGIN * 2, sellZoneH, 8);
    sellBg.fill({ color: 0x1a0808 });
    sellBg.stroke({ width: 1, color: ZONE_COLOR.sell, alpha: 0.5 });
    root.addChild(sellBg);

    const sellLabel = new Text({
      text: '💰 售出區 — 拖曳遺物或消耗品到此處售出（原價 ÷ 2）',
      style: new TextStyle({ fontSize: 12, fill: 0xFF8888 }),
    });
    sellLabel.anchor.set(0.5);
    sellLabel.position.set(DESIGN_W / 2, y + sellZoneH / 2);
    root.addChild(sellLabel);

    y += sellZoneH + 12;

    // ─── Reroll + Leave buttons ──────────────────────────
    const rerollCost = this._shop.state.rerollCost;
    const canReroll = (this._player?.money ?? 0) >= rerollCost;
    const rerollBtn = this._buildButton(
      `🔄 重新整理   💰 ${rerollCost}金 (+5/次)`,
      210, 40,
      canReroll ? 0x5E3A98 : COLORS.BUTTON_DISABLED,
      () => {
        if (this._shop.reroll(this._player)) this._rebuildShop();
      },
    );
    rerollBtn.position.set(DESIGN_W / 2 - 230, y);
    root.addChild(rerollBtn);

    const leaveBtn = this._buildButton('➡ 離開商店', 160, 40, COLORS.BUTTON_DANGER, () => this._onLeave?.());
    leaveBtn.position.set(DESIGN_W / 2 + 60, y);
    root.addChild(leaveBtn);
  }

  // ─── Section Renderer ────────────────────────────────────

  private _drawSection(
    root: Container,
    sectionTitle: string,
    type: ShopItemType | string,
    items: ShopItem[],
    startY: number,
  ): number {
    if (items.length === 0) return startY;

    const color = ZONE_COLOR[type] ?? 0x555555;

    const titleTxt = new Text({
      text: sectionTitle,
      style: new TextStyle({ fontSize: 13, fill: color, fontWeight: 'bold' }),
    });
    titleTxt.position.set(SECTION_MARGIN, startY);
    root.addChild(titleTxt);

    const itemY = startY + 20;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const x = SECTION_MARGIN + i * (ITEM_W + ITEM_GAP);
      const card = this._buildItemCard(item, x, itemY, this._shop.state.items.indexOf(item));
      root.addChild(card);
    }

    return itemY + ITEM_H + SECTION_MARGIN;
  }

  // ─── Item Card ───────────────────────────────────────────

  private _buildItemCard(item: ShopItem, x: number, y: number, globalIndex: number): Container {
    const c = new Container();
    const bgColor = item.sold ? 0x111111 : 0x1a2030;
    const borderColor = item.sold ? 0x222222 : this._getBorderColor(item);
    const canAfford = !item.sold && (this._player?.money ?? 0) >= item.price;

    const bg = new Graphics();
    bg.roundRect(0, 0, ITEM_W, ITEM_H, 10);
    bg.fill(bgColor);
    bg.stroke({ width: 2, color: borderColor, alpha: item.sold ? 0.3 : 0.9 });
    c.addChild(bg);

    // Type icon
    const typeIcon = item.type === 'relic'    ? '🔮' :
                     item.type === 'card'     ? '📦' :
                     item.type === 'blessing' ? '✨' : '?';
    const iconTxt = new Text({ text: typeIcon, style: new TextStyle({ fontSize: 26 }) });
    iconTxt.anchor.set(0.5);
    iconTxt.position.set(ITEM_W / 2, 28);
    if (item.sold) iconTxt.alpha = 0.3;
    c.addChild(iconTxt);

    // Name
    const nameTxt = new Text({
      text: item.sold ? `${item.name}\n(已售出)` : item.name,
      style: new TextStyle({
        fontSize: 12,
        fill: item.sold ? 0x444444 : COLORS.TEXT_PRIMARY,
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: ITEM_W - 12,
        align: 'center',
      }),
    });
    nameTxt.anchor.set(0.5, 0);
    nameTxt.position.set(ITEM_W / 2, 54);
    c.addChild(nameTxt);

    // Price
    if (!item.sold) {
      const priceTxt = new Text({
        text: `💰 ${item.price}`,
        style: new TextStyle({ fontSize: 12, fill: canAfford ? COLORS.GOLD : 0xFF4444, fontWeight: 'bold' }),
      });
      priceTxt.anchor.set(0.5, 0);
      priceTxt.position.set(ITEM_W / 2, ITEM_H - 38);
      c.addChild(priceTxt);

      // Buy button
      const buyBtnBg = new Graphics();
      buyBtnBg.roundRect(0, 0, ITEM_W - 20, 24, 6);
      buyBtnBg.fill(canAfford ? this._getBorderColor(item) : COLORS.BUTTON_DISABLED);
      c.addChild(buyBtnBg);

      const buyTxt = new Text({
        text: canAfford ? '購買' : '金不足',
        style: new TextStyle({ fontSize: 11, fill: 0xFFFFFF }),
      });
      buyTxt.anchor.set(0.5);
      buyTxt.position.set((ITEM_W - 20) / 2, 12);
      buyBtnBg.addChild(buyTxt);
      buyBtnBg.position.set(10, ITEM_H - 28);

      if (canAfford) {
        c.eventMode = 'static';
        c.cursor = 'pointer';
        c.on('pointerdown', () => {
          if (this._shop.purchase(globalIndex, this._player)) this._rebuildShop();
        });
        c.on('pointerover', () => { bg.tint = 0xcccccc; });
        c.on('pointerout',  () => { bg.tint = 0xffffff; });
      }
    }

    c.position.set(x, y);
    return c;
  }

  // ─── Helpers ─────────────────────────────────────────────

  private _getBorderColor(item: ShopItem): number {
    if (item.type === 'relic' && item.relic) {
      switch (item.relic.rarity) {
        case 'common':    return COLORS.RARITY_COMMON;
        case 'uncommon':  return COLORS.RARITY_UNCOMMON;
        case 'rare':      return COLORS.RARITY_RARE;
        case 'legendary': return COLORS.RARITY_LEGENDARY;
      }
    }
    if (item.type === 'card')     return 0x3498DB;
    if (item.type === 'blessing') return 0xF39C12;
    return 0x4488AA;
  }

  private _buildButton(label: string, w: number, h: number, color: number, action: () => void): Container {
    const c = new Container();
    c.eventMode = 'static';
    c.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 8);
    bg.fill(color);
    c.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({ fontSize: 13, fill: 0xFFFFFF, fontWeight: 'bold' }),
    });
    txt.anchor.set(0.5);
    txt.position.set(w / 2, h / 2);
    c.addChild(txt);

    c.on('pointerdown', action);
    c.on('pointerover', () => { bg.tint = 0xdddddd; });
    c.on('pointerout',  () => { bg.tint = 0xffffff; });

    return c;
  }
}

// ============================================================
// Stake Select Scene — Choose difficulty + starter deck
// GDD Phase 8 §2.2 + Phase 10 §2
// ============================================================

import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Scene } from '@/scenes/scene-manager';
import { Viewport, DESIGN_W, DESIGN_H } from '@/rendering/viewport';
import { COLORS } from '@/rendering/design-tokens';

// ─── Stake Definitions ──────────────────────────────────────
export interface StakeDefinition {
  id: number;
  name: string;
  color: number;
  description: string;
  locked: boolean;
}

const STAKES: StakeDefinition[] = [
  { id: 0, name: '白注',   color: 0xEEEEEE, description: '入門難度 — 推薦新手',        locked: false },
  { id: 1, name: '紅注',   color: 0xFF4444, description: '強化 Boss 攻擊力 +20%',      locked: true },
  { id: 2, name: '綠注',   color: 0x44FF88, description: '商店物品價格上漲',            locked: true },
  { id: 3, name: '藍注',   color: 0x4488FF, description: '初始 HP -20',                locked: true },
  { id: 4, name: '紫注',   color: 0xAA44FF, description: '出牌次數 -1',                locked: true },
  { id: 5, name: '金注',   color: 0xFFD700, description: 'Boss 機制限制 +1',            locked: true },
  { id: 6, name: '橙注',   color: 0xFF8800, description: '遺物欄位 -1',                locked: true },
  { id: 7, name: '黑注',   color: 0x333333, description: '所有負面效果疊加（極限）',    locked: true },
];

// ─── Starter Deck Definitions ────────────────────────────────
export interface StarterDeckDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  locked: boolean;
}

const STARTER_DECKS: StarterDeckDef[] = [
  { id: 'standard',   name: '標準牌組', icon: '🃏', description: '52 張標準撲克牌，無特殊效果', locked: false },
  { id: 'warrior',    name: '戰士牌組', icon: '⚔️', description: '出牌次數 +1（5 次）',           locked: false },
  { id: 'explorer',   name: '探索牌組', icon: '🔍', description: '棄牌次數 +1（4 次）',           locked: false },
  { id: 'greedy',     name: '貪婪牌組', icon: '💰', description: '初始 +10 金',                  locked: true },
  { id: 'ghost',      name: '鬼魂牌組', icon: '👻', description: '契約出現率 ×2',               locked: true },
];

export interface StakeSelectCallbacks {
  onConfirm: (stakeId: number, deckId: string) => void;
  onBack: () => void;
}

export class StakeSelectScene implements Scene {
  readonly name = 'stake_select';

  private _viewport!: Viewport;
  private _callbacks: StakeSelectCallbacks = {
    onConfirm: () => {},
    onBack: () => {},
  };

  private _selectedStake = 0;
  private _selectedDeck = 'standard';

  setCallbacks(cb: StakeSelectCallbacks): void {
    this._callbacks = cb;
  }

  /** Unlock a stake (from meta-progression) */
  unlockStake(stakeId: number): void {
    const s = STAKES[stakeId];
    if (s) s.locked = false;
  }

  async init(app: Application, container: Container): Promise<void> {
    this._viewport = new Viewport(app, container);
    this._rebuild();
  }

  update(_dt: number): void {}

  destroy(): void {
    this._viewport?.destroy();
  }

  private _rebuild(): void {
    const root = this._viewport.root;
    root.removeChildren();

    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, DESIGN_H);
    bg.fill(0x050a0f);
    root.addChild(bg);

    // Title
    const title = new Text({
      text: '選擇難度與牌組',
      style: new TextStyle({ fontSize: 22, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(DESIGN_W / 2, 18);
    root.addChild(title);

    // ── Stake row ──
    const stakeLabel = new Text({
      text: '🎲 賭注難度',
      style: new TextStyle({ fontSize: 14, fill: COLORS.TEXT_DIM }),
    });
    stakeLabel.position.set(20, 58);
    root.addChild(stakeLabel);

    const stakeY = 82;
    const stakeW = (DESIGN_W - 40) / STAKES.length - 4;
    for (let i = 0; i < STAKES.length; i++) {
      const stake = STAKES[i];
      const x = 20 + i * (stakeW + 4);
      const btn = this._buildStakeBtn(stake, stakeW, x, stakeY, i === this._selectedStake);
      root.addChild(btn);
    }

    // Selected stake detail
    const sel = STAKES[this._selectedStake];
    const stakeDetail = new Text({
      text: `${sel.name} — ${sel.description}`,
      style: new TextStyle({ fontSize: 12, fill: sel.locked ? 0x555555 : COLORS.TEXT_PRIMARY }),
    });
    stakeDetail.anchor.set(0.5, 0);
    stakeDetail.position.set(DESIGN_W / 2, stakeY + 58);
    root.addChild(stakeDetail);

    // ── Starter Deck row ──
    const deckLabel = new Text({
      text: '🃏 起始牌組',
      style: new TextStyle({ fontSize: 14, fill: COLORS.TEXT_DIM }),
    });
    deckLabel.position.set(20, stakeY + 86);
    root.addChild(deckLabel);

    const deckY = stakeY + 110;
    const deckW = 120;
    const deckH = 90;
    const deckGap = 12;
    const deckTotalW = STARTER_DECKS.length * (deckW + deckGap) - deckGap;
    let deckX = DESIGN_W / 2 - deckTotalW / 2;

    for (const deck of STARTER_DECKS) {
      const isSelected = deck.id === this._selectedDeck;
      const card = this._buildDeckCard(deck, deckW, deckH, isSelected);
      card.position.set(deckX, deckY);
      root.addChild(card);
      deckX += deckW + deckGap;
    }

    // ── Action buttons ──
    const btnY = DESIGN_H - 68;
    const backBtn = this._buildActionBtn('← 返回', 130, 42, 0x334455, () => this._callbacks.onBack());
    backBtn.position.set(DESIGN_W / 2 - 290, btnY);
    root.addChild(backBtn);

    const selectedStake = STAKES[this._selectedStake];
    const canStart = !selectedStake.locked;
    const confirmBtn = this._buildActionBtn(
      canStart ? `▶ 挑戰 [${selectedStake.name}]` : '🔒 需先解鎖',
      200, 42,
      canStart ? COLORS.BUTTON_PRIMARY : COLORS.BUTTON_DISABLED,
      () => {
        if (!canStart) return;
        this._callbacks.onConfirm(this._selectedStake, this._selectedDeck);
      },
    );
    confirmBtn.position.set(DESIGN_W / 2 - 100, btnY);
    root.addChild(confirmBtn);
  }

  private _buildStakeBtn(stake: StakeDefinition, w: number, x: number, y: number, selected: boolean): Container {
    const c = new Container();
    const h = 50;

    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 6);
    bg.fill({ color: stake.locked ? 0x111111 : 0x1a1a2e });
    bg.stroke({ width: selected ? 2 : 1, color: selected ? stake.color : (stake.locked ? 0x222222 : stake.color), alpha: stake.locked ? 0.3 : 0.8 });
    c.addChild(bg);

    const txt = new Text({
      text: stake.locked ? '🔒' : stake.name,
      style: new TextStyle({ fontSize: 12, fill: stake.locked ? 0x444444 : stake.color, fontWeight: 'bold' }),
    });
    txt.anchor.set(0.5);
    txt.position.set(w / 2, h / 2);
    c.addChild(txt);

    if (!stake.locked) {
      c.eventMode = 'static';
      c.cursor = 'pointer';
      c.on('pointerdown', () => {
        this._selectedStake = stake.id;
        this._rebuild();
      });
    }

    c.position.set(x, y);
    return c;
  }

  private _buildDeckCard(deck: StarterDeckDef, w: number, h: number, selected: boolean): Container {
    const c = new Container();

    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 10);
    bg.fill({ color: deck.locked ? 0x111111 : 0x1a1a2e });
    bg.stroke({ width: selected ? 2 : 1, color: selected ? COLORS.GOLD : (deck.locked ? 0x222222 : 0x445566), alpha: deck.locked ? 0.3 : 0.9 });
    c.addChild(bg);

    const icon = new Text({ text: deck.locked ? '🔒' : deck.icon, style: new TextStyle({ fontSize: 28 }) });
    icon.anchor.set(0.5);
    icon.position.set(w / 2, 26);
    if (deck.locked) icon.alpha = 0.4;
    c.addChild(icon);

    const name = new Text({
      text: deck.name,
      style: new TextStyle({
        fontSize: 11,
        fill: deck.locked ? 0x444444 : (selected ? COLORS.GOLD : COLORS.TEXT_PRIMARY),
        fontWeight: selected ? 'bold' : 'normal',
        wordWrap: true,
        wordWrapWidth: w - 8,
        align: 'center',
      }),
    });
    name.anchor.set(0.5, 0);
    name.position.set(w / 2, 52);
    c.addChild(name);

    const desc = new Text({
      text: deck.locked ? '未解鎖' : deck.description,
      style: new TextStyle({ fontSize: 9, fill: 0x666666, wordWrap: true, wordWrapWidth: w - 8, align: 'center' }),
    });
    desc.anchor.set(0.5, 0);
    desc.position.set(w / 2, 72);
    c.addChild(desc);

    if (!deck.locked) {
      c.eventMode = 'static';
      c.cursor = 'pointer';
      c.on('pointerdown', () => {
        this._selectedDeck = deck.id;
        this._rebuild();
      });
    }

    return c;
  }

  private _buildActionBtn(label: string, w: number, h: number, color: number, action: () => void): Container {
    const c = new Container();
    c.eventMode = 'static';
    c.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 8);
    bg.fill(color);
    c.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({ fontSize: 14, fill: 0xFFFFFF, fontWeight: 'bold' }),
    });
    txt.anchor.set(0.5);
    txt.position.set(w / 2, h / 2);
    c.addChild(txt);

    c.on('pointerdown', action);
    c.on('pointerover', () => { bg.tint = 0xdddddd; });
    c.on('pointerout',  () => { bg.tint = 0xffffff; });

    return c;
  }

  get selectedStake(): number { return this._selectedStake; }
  get selectedDeck(): string { return this._selectedDeck; }
}

// ============================================================
// Run Info Panel — 3-tab overlay: Hand Types / Run Stats / Relics
// GDD Phase 1 §7.3: Non-pausing overlay, slide from left
// ============================================================

import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import type { HandType, RelicInstance } from '@/types';
import { HAND_TYPE_DATA } from '@/data/hand-types';
import { COLORS } from '@/rendering/design-tokens';
import type { RunStats } from '@/models/run-state';

const PANEL_W = 320;
const PANEL_H = 480;
const TAB_H = 36;
const TAB_COUNT = 3;

type TabId = 'hand_types' | 'stats' | 'relics';
const TABS: { id: TabId; label: string }[] = [
  { id: 'hand_types', label: '牌型等級' },
  { id: 'stats',      label: '本局統計' },
  { id: 'relics',     label: '遺物一覽' },
];

export class RunInfoPanel extends Container {
  private _visible = false;
  private _activeTab: TabId = 'hand_types';
  private _content!: Container;
  private _tabButtons: Container[] = [];

  private _handLevels: Record<HandType, number> = {} as Record<HandType, number>;
  private _stats: RunStats | null = null;
  private _relics: RelicInstance[] = [];

  constructor() {
    super();
    this.visible = false;
    this._build();
  }

  // ─── Public API ────────────────────────────────────────────

  toggle(): void {
    if (this._visible) this.hide();
    else this.show();
  }

  show(): void {
    this._visible = true;
    this.visible = true;
    this._refresh();
  }

  hide(): void {
    this._visible = false;
    this.visible = false;
  }

  /** Feed latest data before showing */
  setData(
    handLevels: Record<HandType, number>,
    stats: RunStats,
    relics: RelicInstance[],
  ): void {
    this._handLevels = handLevels;
    this._stats = stats;
    this._relics = relics;
    if (this._visible) this._refresh();
  }

  // ─── Build ──────────────────────────────────────────────

  private _build(): void {
    // Background panel
    const bg = new Graphics();
    bg.roundRect(0, 0, PANEL_W, PANEL_H, 10);
    bg.fill({ color: 0x0d1117, alpha: 0.95 });
    bg.stroke({ width: 2, color: COLORS.GOLD, alpha: 0.7 });
    this.addChild(bg);

    // Title
    const title = new Text({
      text: '📋 Run Info',
      style: new TextStyle({ fontSize: 16, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    title.position.set(12, 10);
    this.addChild(title);

    // Close button
    const closeBtn = new Text({
      text: '✕',
      style: new TextStyle({ fontSize: 16, fill: 0xFF4444 }),
    });
    closeBtn.position.set(PANEL_W - 28, 10);
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointerdown', () => this.hide());
    this.addChild(closeBtn);

    // Tab buttons
    const tabY = 36;
    const tabW = PANEL_W / TAB_COUNT;
    for (let i = 0; i < TABS.length; i++) {
      const tab = TABS[i];
      const btn = this._buildTab(tab.label, tabW, tabY + i, i);
      btn.position.set(i * tabW, tabY);
      this.addChild(btn);
      this._tabButtons.push(btn);
    }

    // Content area
    this._content = new Container();
    this._content.position.set(0, tabY + TAB_H + 4);
    this.addChild(this._content);
  }

  private _buildTab(label: string, _w: number, _y: number, index: number): Container {
    const c = new Container();
    const tab = TABS[index];

    const bg = new Graphics();
    bg.roundRect(2, 0, PANEL_W / TAB_COUNT - 4, TAB_H, 6);
    const isActive = this._activeTab === tab.id;
    bg.fill({ color: isActive ? 0x2a1a3a : 0x111111 });
    bg.stroke({ width: 1, color: isActive ? COLORS.GOLD : 0x333333 });
    c.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({ fontSize: 12, fill: isActive ? COLORS.GOLD : COLORS.TEXT_DIM, fontWeight: isActive ? 'bold' : 'normal' }),
    });
    txt.anchor.set(0.5);
    txt.position.set((PANEL_W / TAB_COUNT) / 2, TAB_H / 2);
    c.addChild(txt);

    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointerdown', () => {
      this._activeTab = tab.id;
      this._rebuildTabs();
      this._refresh();
    });

    return c;
  }

  private _rebuildTabs(): void {
    for (const btn of this._tabButtons) {
      this.removeChild(btn);
    }
    this._tabButtons = [];
    const tabY = 36;
    for (let i = 0; i < TABS.length; i++) {
      const btn = this._buildTab(TABS[i].label, PANEL_W / TAB_COUNT, tabY, i);
      btn.position.set(i * (PANEL_W / TAB_COUNT), tabY);
      this.addChild(btn);
      this._tabButtons.push(btn);
    }
  }

  private _refresh(): void {
    this._content.removeChildren();

    switch (this._activeTab) {
      case 'hand_types': this._buildHandTypes(); break;
      case 'stats':      this._buildStats(); break;
      case 'relics':     this._buildRelics(); break;
    }
  }

  private _buildHandTypes(): void {
    const handOrder: HandType[] = [
      'royal_flush', 'straight_flush', 'four_of_a_kind', 'full_house',
      'flush', 'straight', 'three_of_a_kind', 'two_pair', 'pair', 'high_card',
    ];

    let y = 8;
    for (const ht of handOrder) {
      const lv = this._handLevels[ht] ?? 1;
      const data = HAND_TYPE_DATA[ht];
      const isUpgraded = lv > 1;

      const row = new Container();

      const name = new Text({
        text: data.name,
        style: new TextStyle({
          fontSize: 12,
          fill: isUpgraded ? COLORS.GOLD : COLORS.TEXT_PRIMARY,
          fontWeight: isUpgraded ? 'bold' : 'normal',
        }),
      });
      name.position.set(10, 0);
      row.addChild(name);

      const lvTxt = new Text({
        text: `Lv.${lv}`,
        style: new TextStyle({ fontSize: 11, fill: isUpgraded ? 0xFFC107 : COLORS.TEXT_DIM }),
      });
      lvTxt.position.set(138, 0);
      row.addChild(lvTxt);

      // ATK / DMG — base + per-level increment
      const baseATK = data.baseATK + (lv - 1) * data.levelUpATK;
      const baseDMG = data.baseDMG + (lv - 1) * data.levelUpDMG;

      const statTxt = new Text({
        text: `ATK ${baseATK}  ×${baseDMG.toFixed(1)}`,
        style: new TextStyle({ fontSize: 10, fill: COLORS.ATK }),
      });
      statTxt.position.set(180, 0);
      row.addChild(statTxt);

      row.position.set(0, y);
      this._content.addChild(row);
      y += 40;
    }
  }

  private _buildStats(): void {
    if (!this._stats) return;
    const s = this._stats;
    const rows: [string, string][] = [
      ['當前樓層', `F${s.currentFloor}`],
      ['擊敗 Boss', `${s.bossesDefeated} 位`],
      ['最高單次傷害', `${s.highestSingleDamage}`],
      ['總傷害', `${s.totalDamage}`],
      ['累計收入', `${s.moneyEarned} 金`],
      ['累計支出', `${s.moneySpent} 金`],
      ['最常用牌型', s.mostUsedHandType],
    ];

    let y = 8;
    for (const [label, value] of rows) {
      const row = new Container();

      const lbl = new Text({ text: label, style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_DIM }) });
      lbl.position.set(10, 0);
      row.addChild(lbl);

      const val = new Text({ text: value, style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_PRIMARY, fontWeight: 'bold' }) });
      val.position.set(180, 0);
      row.addChild(val);

      row.position.set(0, y);
      this._content.addChild(row);
      y += 36;
    }
  }

  private _buildRelics(): void {
    if (this._relics.length === 0) {
      const empty = new Text({
        text: '尚未持有遺物',
        style: new TextStyle({ fontSize: 13, fill: COLORS.TEXT_DIM }),
      });
      empty.position.set(20, 20);
      this._content.addChild(empty);
      return;
    }

    let y = 8;
    for (let i = 0; i < this._relics.length; i++) {
      const r = this._relics[i];
      const row = new Container();

      const order = new Text({
        text: `${i + 1}.`,
        style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_DIM }),
      });
      order.position.set(6, 0);
      row.addChild(order);

      const id = new Text({
        text: r.definitionId,
        style: new TextStyle({ fontSize: 12, fill: r.isActive ? COLORS.TEXT_PRIMARY : 0x555555 }),
      });
      id.position.set(28, 0);
      row.addChild(id);

      if (!r.isActive) {
        const silenced = new Text({ text: '(沉默)', style: new TextStyle({ fontSize: 10, fill: 0x555555 }) });
        silenced.position.set(180, 0);
        row.addChild(silenced);
      }

      row.position.set(0, y);
      this._content.addChild(row);
      y += 32;
    }
  }
}

// ============================================================
// Collection Scene — Meta-progression viewer
// GDD Phase 10 §1.3: Progress visualization with tabs
// Tabs: 起始牌組 / 神器 / 成就 / 挑戰
// ============================================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Scene } from '@/scenes/scene-manager';
import { Application } from 'pixi.js';
import { Viewport, DESIGN_W, DESIGN_H } from '@/rendering/viewport';
import { COLORS } from '@/rendering/design-tokens';
import { unlockManager } from '@/systems/unlock-manager';
import { STARTER_DECKS } from '@/data/starter-decks';
import { RELIC_DEFINITIONS } from '@/data/relics';

// ─── Tab Types ───────────────────────────────────────────────

type CollectionTab = 'decks' | 'relics' | 'achievements' | 'challenges';

const TABS: Array<{ id: CollectionTab; label: string; icon: string }> = [
  { id: 'decks',        label: '起始牌組', icon: '🃏' },
  { id: 'relics',       label: '神器',     icon: '🔮' },
  { id: 'achievements', label: '成就',     icon: '⭐' },
  { id: 'challenges',   label: '挑戰',     icon: '⚡' },
];

// ─── Achievement Definitions ─────────────────────────────────

const ACHIEVEMENTS = [
  { id: 'ach_first_win',      name: '初心者',     desc: '首次通關',                   icon: '🏆' },
  { id: 'ach_million_damage', name: '百萬傷害',   desc: '單次傷害超過 1,000,000',      icon: '💥' },
  { id: 'ach_full_collection', name: '全收集',   desc: '發現所有 234 種特殊內容',      icon: '👑' },
  { id: 'ach_perfect_run',    name: '不敗將軍',   desc: '不損失 HP 完整通關',          icon: '🛡️' },
  { id: 'ach_broke_win',      name: '破產通關',   desc: '以 0 金錢狀態擊敗最終 Boss',  icon: '💸' },
];

const CHALLENGES = [
  { id: 'challenge_naked',        name: '裸奔',    desc: '不能購買任何遺物',       icon: '🏃' },
  { id: 'challenge_one_type',     name: '單型限定', desc: '只能使用對子牌型',       icon: '🎯' },
  { id: 'challenge_undying',      name: '不死者',  desc: '玩家 HP = 1（不可回復）', icon: '💀' },
  { id: 'challenge_burning',      name: '燃燒殆盡', desc: '每回合棄牌堆自動銷毀',   icon: '🔥' },
  { id: 'challenge_preservative', name: '防腐劑',  desc: '所有神器不可售出',       icon: '🔒' },
];

// ─── Scene ───────────────────────────────────────────────────

export class CollectionScene implements Scene {
  readonly name = 'collection';

  private _viewport!: Viewport;
  private _onBack?: () => void;
  private _currentTab: CollectionTab = 'decks';
  private _tabBg: Container[] = [];
  private _contentArea!: Container;

  setOnBack(cb: () => void): void { this._onBack = cb; }

  async init(app: Application, container: Container): Promise<void> {
    this._viewport = new Viewport(app, container);
    const root = this._viewport.root;

    // ── Background ──
    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, DESIGN_H);
    bg.fill(COLORS.BG_DARK);
    root.addChild(bg);

    // Subtle grid pattern
    const grid = new Graphics();
    for (let x = 0; x < DESIGN_W; x += 40) {
      grid.moveTo(x, 0); grid.lineTo(x, DESIGN_H);
    }
    for (let y = 0; y < DESIGN_H; y += 40) {
      grid.moveTo(0, y); grid.lineTo(DESIGN_W, y);
    }
    grid.stroke({ width: 0.5, color: 0x1a2a3a, alpha: 0.5 });
    root.addChild(grid);

    // ── Header ──
    const header = this._buildHeader();
    root.addChild(header);

    // ── Tab Bar ──
    const tabBar = this._buildTabBar();
    root.addChild(tabBar);

    // ── Progress Bar ──
    this._buildProgressSummary(root);

    // ── Content Area ──
    this._contentArea = new Container();
    this._contentArea.position.set(0, 140);
    root.addChild(this._contentArea);

    this._renderTab();
  }

  private _buildHeader(): Container {
    const h = new Container();

    // Back button
    const backBtn = new Container();
    backBtn.eventMode = 'static';
    backBtn.cursor = 'pointer';
    const backBg = new Graphics();
    backBg.roundRect(0, 0, 80, 32, 8);
    backBg.fill(0x1a2a3a);
    backBg.stroke({ width: 1, color: COLORS.GOLD, alpha: 0.5 });
    backBtn.addChild(backBg);
    const backTxt = new Text({ text: '← 返回', style: new TextStyle({ fontSize: 13, fill: COLORS.GOLD }) });
    backTxt.anchor.set(0.5);
    backTxt.position.set(40, 16);
    backBtn.addChild(backTxt);
    backBtn.position.set(16, 10);
    backBtn.on('pointerdown', () => this._onBack?.());
    backBtn.on('pointerover', () => { backBg.tint = 0xcccccc; });
    backBtn.on('pointerout',  () => { backBg.tint = 0xffffff; });
    h.addChild(backBtn);

    // Title
    const title = new Text({
      text: '📚  收藏庫',
      style: new TextStyle({ fontSize: 22, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(DESIGN_W / 2, 8);
    h.addChild(title);

    return h;
  }

  private _buildTabBar(): Container {
    const bar = new Container();
    bar.position.set(0, 50);

    const tabW = DESIGN_W / TABS.length;
    this._tabBg = [];

    for (let i = 0; i < TABS.length; i++) {
      const tab = TABS[i];
      const c = new Container();
      c.eventMode = 'static';
      c.cursor = 'pointer';

      const bg = new Graphics();
      bg.rect(0, 0, tabW, 44);
      bg.fill(this._currentTab === tab.id ? 0x1a3a5a : 0x0d1117);
      bg.stroke({ width: 1, color: 0x1a2a3a });
      c.addChild(bg);
      this._tabBg.push(c);

      const lbl = new Text({
        text: `${tab.icon} ${tab.label}`,
        style: new TextStyle({
          fontSize: 14,
          fill: this._currentTab === tab.id ? COLORS.GOLD : COLORS.TEXT_DIM,
          fontWeight: this._currentTab === tab.id ? 'bold' : 'normal',
        }),
      });
      lbl.anchor.set(0.5);
      lbl.position.set(tabW / 2, 22);
      c.addChild(lbl);

      // Progress count
      const count = this._getTabProgress(tab.id);
      if (count) {
        const pTxt = new Text({
          text: count,
          style: new TextStyle({ fontSize: 10, fill: COLORS.TEXT_DIM }),
        });
        pTxt.anchor.set(0.5, 0);
        pTxt.position.set(tabW / 2, 34);
        // hide if it would overflow
      }

      c.position.set(i * tabW, 0);
      c.on('pointerdown', () => this._switchTab(tab.id));
      bar.addChild(c);
    }

    return bar;
  }

  private _buildProgressSummary(root: Container): void {
    // Overall progress
    const totalItems = STARTER_DECKS.length + RELIC_DEFINITIONS.length + ACHIEVEMENTS.length + CHALLENGES.length;
    const unlocked = unlockManager.unlockedIds;
    let unlockedCount = 0;
    for (const d of STARTER_DECKS) { if (unlocked.has(d.unlockId)) unlockedCount++; }
    for (const a of ACHIEVEMENTS) { if (unlocked.has(a.id as never)) unlockedCount++; }
    for (const c of CHALLENGES)   { if (unlocked.has(c.id as never)) unlockedCount++; }

    const pct = Math.min(1, unlockedCount / totalItems);

    const pLabel = new Text({
      text: `收藏進度: ${Math.floor(pct * 100)}%  (${unlockedCount}/${totalItems})`,
      style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_DIM }),
    });
    pLabel.position.set(16, 100);
    root.addChild(pLabel);

    const trackBg = new Graphics();
    trackBg.roundRect(16, 116, DESIGN_W - 32, 10, 5);
    trackBg.fill(0x1a2a3a);
    root.addChild(trackBg);

    const fill = new Graphics();
    fill.roundRect(16, 116, (DESIGN_W - 32) * pct, 10, 5);
    fill.fill(COLORS.GOLD);
    root.addChild(fill);
  }

  private _getTabProgress(tab: CollectionTab): string {
    const unlocked = unlockManager.unlockedIds;
    switch (tab) {
      case 'decks':
        return `${STARTER_DECKS.filter(d => unlocked.has(d.unlockId)).length}/${STARTER_DECKS.length}`;
      case 'relics':
        return `${unlockManager.stats.relicsDiscovered.length}/${RELIC_DEFINITIONS.length}`;
      case 'achievements':
        return `${ACHIEVEMENTS.filter(a => unlocked.has(a.id as never)).length}/${ACHIEVEMENTS.length}`;
      case 'challenges':
        return `${CHALLENGES.filter(c => unlocked.has(c.id as never)).length}/${CHALLENGES.length}`;
    }
  }

  private _switchTab(tab: CollectionTab): void {
    this._currentTab = tab;
    this._contentArea.removeChildren();

    // Rebuild tab bar highlights
    const tabW = DESIGN_W / TABS.length;
    for (let i = 0; i < TABS.length; i++) {
      const c = this._tabBg[i];
      const bg = c.getChildAt(0) as Graphics;
      bg.clear();
      bg.rect(0, 0, tabW, 44);
      bg.fill(this._currentTab === TABS[i].id ? 0x1a3a5a : 0x0d1117);
      bg.stroke({ width: 1, color: 0x1a2a3a });

      const lbl = c.getChildAt(1) as Text;
      lbl.style.fill = this._currentTab === TABS[i].id ? '#FFD700' : COLORS.TEXT_DIM.toString();
    }

    this._renderTab();
  }

  private _renderTab(): void {
    switch (this._currentTab) {
      case 'decks':        this._renderDecks();        break;
      case 'relics':       this._renderRelics();       break;
      case 'achievements': this._renderAchievements(); break;
      case 'challenges':   this._renderChallenges();   break;
    }
  }

  private _renderDecks(): void {
    const unlocked = unlockManager.unlockedIds;
    const tileW = 200;
    const tileH = 100;
    const cols = Math.floor((DESIGN_W - 20) / (tileW + 12));
    let row = 0, col = 0;

    for (const deck of STARTER_DECKS) {
      const isUnlocked = unlocked.has(deck.unlockId);
      const tx = 10 + col * (tileW + 12);
      const ty = 10 + row * (tileH + 10);

      const tile = new Container();
      tile.position.set(tx, ty);

      const bg = new Graphics();
      bg.roundRect(0, 0, tileW, tileH, 10);
      bg.fill({ color: isUnlocked ? deck.color : 0x111111, alpha: isUnlocked ? 0.6 : 0.3 });
      bg.stroke({ width: 1.5, color: isUnlocked ? deck.color : 0x333333 });
      tile.addChild(bg);

      if (isUnlocked) {
        const icon = new Text({ text: deck.icon, style: new TextStyle({ fontSize: 24 }) });
        icon.position.set(10, 10);
        tile.addChild(icon);

        const name = new Text({ text: deck.name, style: new TextStyle({ fontSize: 13, fill: COLORS.TEXT_PRIMARY, fontWeight: 'bold' }) });
        name.position.set(44, 12);
        tile.addChild(name);

        const desc = new Text({
          text: deck.description,
          style: new TextStyle({ fontSize: 10, fill: COLORS.TEXT_DIM, wordWrap: true, wordWrapWidth: tileW - 16 }),
        });
        desc.position.set(10, 42);
        tile.addChild(desc);

        if (unlockManager.isNew(deck.unlockId)) {
          const badge = new Text({ text: 'NEW!', style: new TextStyle({ fontSize: 10, fill: 0xFF4444, fontWeight: 'bold' }) });
          badge.position.set(tileW - 38, 8);
          tile.addChild(badge);
        }
      } else {
        const lock = new Text({ text: '🔒', style: new TextStyle({ fontSize: 24 }) });
        lock.anchor.set(0.5);
        lock.position.set(tileW / 2, tileH / 2 - 10);
        tile.addChild(lock);

        const hint = new Text({
          text: '???',
          style: new TextStyle({ fontSize: 11, fill: COLORS.TEXT_DIM, wordWrap: true, wordWrapWidth: tileW - 16 }),
        });
        hint.anchor.set(0.5, 0);
        hint.position.set(tileW / 2, tileH - 22);
        tile.addChild(hint);
      }

      this._contentArea.addChild(tile);
      col++;
      if (col >= cols) { col = 0; row++; }
    }
  }

  private _renderRelics(): void {
    const discovered = new Set(unlockManager.stats.relicsDiscovered);
    const tileW = 180;
    const tileH = 72;
    const cols = Math.floor((DESIGN_W - 20) / (tileW + 8));
    let row = 0, col = 0;

    for (const relic of RELIC_DEFINITIONS) {
      const isFound = discovered.has(relic.id);
      const tx = 10 + col * (tileW + 8);
      const ty = 10 + row * (tileH + 6);

      const tile = new Container();
      tile.position.set(tx, ty);

      const bg = new Graphics();
      bg.roundRect(0, 0, tileW, tileH, 8);
      bg.fill({ color: 0x0d1117, alpha: isFound ? 0.9 : 0.4 });
      bg.stroke({ width: 1, color: isFound ? COLORS.GOLD : 0x333333, alpha: 0.7 });
      tile.addChild(bg);

      if (isFound) {
        const name = new Text({ text: relic.name, style: new TextStyle({ fontSize: 11, fill: COLORS.TEXT_PRIMARY, fontWeight: 'bold' }) });
        name.position.set(8, 8);
        tile.addChild(name);

        const desc = new Text({
          text: relic.description,
          style: new TextStyle({ fontSize: 9, fill: COLORS.TEXT_DIM, wordWrap: true, wordWrapWidth: tileW - 14 }),
        });
        desc.position.set(8, 24);
        tile.addChild(desc);

        const rarityColors: Record<string, number> = { common: 0x888888, uncommon: 0x44AAFF, rare: 0xFF44FF, legendary: 0xFFD700 };
        const rarityTxt = new Text({
          text: relic.rarity,
          style: new TextStyle({ fontSize: 9, fill: rarityColors[relic.rarity] ?? 0x888888 }),
        });
        rarityTxt.position.set(8, tileH - 16);
        tile.addChild(rarityTxt);
      } else {
        const unk = new Text({ text: '???', style: new TextStyle({ fontSize: 12, fill: 0x444444 }) });
        unk.anchor.set(0.5);
        unk.position.set(tileW / 2, tileH / 2);
        tile.addChild(unk);
      }

      this._contentArea.addChild(tile);
      col++;
      if (col >= cols) { col = 0; row++; }
    }
  }

  private _renderAchievements(): void {
    const unlocked = unlockManager.unlockedIds;
    for (let i = 0; i < ACHIEVEMENTS.length; i++) {
      const a = ACHIEVEMENTS[i];
      const isUnlocked = unlocked.has(a.id as never);
      const tile = this._buildListTile(a.icon, a.name, a.desc, isUnlocked, i);
      this._contentArea.addChild(tile);
    }
  }

  private _renderChallenges(): void {
    const unlocked = unlockManager.unlockedIds;
    for (let i = 0; i < CHALLENGES.length; i++) {
      const c = CHALLENGES[i];
      const isUnlocked = unlocked.has(c.id as never);
      const tile = this._buildListTile(c.icon, c.name, c.desc, isUnlocked, i);
      this._contentArea.addChild(tile);
    }
  }

  private _buildListTile(icon: string, name: string, desc: string, unlocked: boolean, index: number): Container {
    const W = DESIGN_W - 40;
    const H = 56;
    const c = new Container();
    c.position.set(20, 10 + index * (H + 8));

    const bg = new Graphics();
    bg.roundRect(0, 0, W, H, 8);
    bg.fill({ color: unlocked ? 0x1a2a1a : 0x111111, alpha: 0.8 });
    bg.stroke({ width: 1, color: unlocked ? 0x44FF88 : 0x333333 });
    c.addChild(bg);

    const iconTxt = new Text({ text: unlocked ? icon : '🔒', style: new TextStyle({ fontSize: 20 }) });
    iconTxt.anchor.set(0.5);
    iconTxt.position.set(30, H / 2);
    c.addChild(iconTxt);

    const nameTxt = new Text({
      text: unlocked ? name : '???',
      style: new TextStyle({ fontSize: 14, fill: unlocked ? COLORS.TEXT_PRIMARY : COLORS.TEXT_DIM, fontWeight: 'bold' }),
    });
    nameTxt.position.set(60, 10);
    c.addChild(nameTxt);

    if (unlocked) {
      const descTxt = new Text({
        text: desc,
        style: new TextStyle({ fontSize: 11, fill: COLORS.TEXT_DIM }),
      });
      descTxt.position.set(60, 30);
      c.addChild(descTxt);
    }

    return c;
  }

  update(): void {}
  destroy(): void {}
}

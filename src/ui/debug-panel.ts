// ============================================================
// Debug Panel — Test mode overlay for development
// Hotkey: Ctrl+D (or Cmd+D on Mac) to toggle
// Features:
//   - 加錢（+10、+50、+100、自定義）
//   - 無限棄牌開關（棄牌次數不遞減）
//   - 無限出牌開關
//   - 補充棄牌/出牌次數
//   - 秒殺 Boss（調試用）
// ============================================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { BattleManager } from '@/systems/battle-manager';
import { COLORS } from '@/rendering/design-tokens';

// ─── Debug Panel ─────────────────────────────────────────────

export class DebugPanel extends Container {
  private _battle: BattleManager | null = null;
  private _isTestMode = false;
  private _onHudRefresh?: () => void;

  // 面板寬高
  private static readonly W = 220;

  constructor() {
    super();
    this.visible = false;
    this._setupKeyboard();
  }

  // ─── Public API ────────────────────────────────────────────

  /** 設定當前戰鬥管理器（場景切換時呼叫） */
  setBattle(battle: BattleManager | null): void {
    this._battle = battle;
    if (battle) {
      // 同步狀態到舊有 battle
      battle.infiniteDiscards = this._isTestMode;
      battle.infinitePlays    = this._isTestMode;
    }
    if (this.visible) this._rebuild();
  }

  /** 設定 HUD 更新回調（讓面板操作後能立即更新 HUD 顯示） */
  setHudRefresh(cb: () => void): void {
    this._onHudRefresh = cb;
  }

  toggle(): void {
    if (this.visible) this.hide();
    else this.show();
  }

  show(): void {
    this._rebuild();
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  get isTestMode(): boolean { return this._isTestMode; }

  // ─── Build UI ──────────────────────────────────────────────

  private _rebuild(): void {
    this.removeChildren();

    const W = DebugPanel.W;

    // 背景面板
    const bg = new Graphics();
    bg.roundRect(0, 0, W, this._panelHeight(), 10);
    bg.fill({ color: 0x0a0e14, alpha: 0.92 });
    bg.stroke({ width: 1.5, color: this._isTestMode ? 0xFF4444 : 0x334455 });
    this.addChild(bg);

    let y = 8;

    // ── 標題列 ──
    const modeColor = this._isTestMode ? 0xFF4444 : 0x888888;
    const titleTxt = new Text({
      text: `🛠️  測試模式  ${this._isTestMode ? '【ON】' : '【OFF】'}`,
      style: new TextStyle({ fontSize: 12, fill: modeColor, fontWeight: 'bold' }),
    });
    titleTxt.position.set(10, y);
    this.addChild(titleTxt);
    y += 22;

    // Toggle 測試模式
    const toggleBtn = this._makeButton(
      this._isTestMode ? '關閉測試模式' : '啟用測試模式',
      W - 20, 28,
      this._isTestMode ? 0x4a1a1a : 0x1a3a1a,
      () => {
        this._isTestMode = !this._isTestMode;
        if (this._battle) {
          this._battle.infiniteDiscards = this._isTestMode;
          this._battle.infinitePlays    = this._isTestMode;
        }
        this._rebuild();
        this._onHudRefresh?.();
      },
    );
    toggleBtn.position.set(10, y);
    this.addChild(toggleBtn);
    y += 36;

    // ── 分隔線 ──
    this._addDivider(y);
    y += 14;

    // ── 金錢區 ──
    const moneyLabel = new Text({
      text: '💰 加錢',
      style: new TextStyle({ fontSize: 11, fill: COLORS.GOLD }),
    });
    moneyLabel.position.set(10, y);
    this.addChild(moneyLabel);
    y += 18;

    // +10 / +50 / +100 按鈕列
    const moneyAmounts = [10, 50, 100];
    let mx = 10;
    for (const amount of moneyAmounts) {
      const btn = this._makeButton(`+${amount}`, 60, 26, 0x1a2a0a, () => {
        this._battle?.debugAddMoney(amount);
        this._onHudRefresh?.();
      });
      btn.position.set(mx, y);
      this.addChild(btn);
      mx += 68;
    }
    y += 34;

    // +500 按鈕（快速滿錢）
    const bigMoneyBtn = this._makeButton('+500 (大量)', W - 20, 26, 0x2a3a0a, () => {
      this._battle?.debugAddMoney(500);
      this._onHudRefresh?.();
    });
    bigMoneyBtn.position.set(10, y);
    this.addChild(bigMoneyBtn);
    y += 34;

    // ── 分隔線 ──
    this._addDivider(y);
    y += 14;

    // ── 棄牌/出牌控制 ──
    const resourceLabel = new Text({
      text: '♻️  回合資源',
      style: new TextStyle({ fontSize: 11, fill: 0xAADDFF }),
    });
    resourceLabel.position.set(10, y);
    this.addChild(resourceLabel);
    y += 18;

    // 無限棄牌 toggle
    const infDiscardBtn = this._makeToggleButton(
      '無限棄牌',
      this._isTestMode,
      W - 20, 28,
      () => {
        if (!this._isTestMode) return;  // 只在測試模式下可切換
        // 已由 isTestMode 控制
      },
    );
    infDiscardBtn.position.set(10, y);
    this.addChild(infDiscardBtn);
    y += 36;

    // 補充棄牌/出牌次數
    const refillBtn = this._makeButton('🔄 補充棄牌 & 出牌次數', W - 20, 28, 0x1a2a3a, () => {
      this._battle?.debugRefillResources();
      this._onHudRefresh?.();
    });
    refillBtn.position.set(10, y);
    this.addChild(refillBtn);
    y += 36;

    // ── 分隔線 ──
    this._addDivider(y);
    y += 14;

    // ── 快速測試 ──
    const quickLabel = new Text({
      text: '⚡ 快速測試',
      style: new TextStyle({ fontSize: 11, fill: 0xFFAAAA }),
    });
    quickLabel.position.set(10, y);
    this.addChild(quickLabel);
    y += 18;

    // 秒殺 Boss
    const killBossBtn = this._makeButton('💀 秒殺 Boss (觸發結算)', W - 20, 28, 0x3a0a0a, () => {
      if (this._battle) {
        this._battle.debugForceVictory();
        this._onHudRefresh?.();
      }
    });
    killBossBtn.position.set(10, y);
    this.addChild(killBossBtn);
    y += 36;

    // ── 浮水印 (關閉提示) ──
    const hint = new Text({
      text: 'Ctrl+D / ⌘D 關閉面板',
      style: new TextStyle({ fontSize: 9, fill: 0x444455 }),
    });
    hint.position.set(10, y + 4);
    this.addChild(hint);

    // 更新總高度
    const newH = this._panelHeight();
    bg.clear();
    bg.roundRect(0, 0, W, newH, 10);
    bg.fill({ color: 0x0a0e14, alpha: 0.92 });
    bg.stroke({ width: 1.5, color: this._isTestMode ? 0xFF4444 : 0x334455 });
  }

  private _panelHeight(): number {
    // 固定高度計算
    return 360;
  }

  private _addDivider(y: number): void {
    const W = DebugPanel.W;
    const div = new Graphics();
    div.moveTo(10, y).lineTo(W - 10, y);
    div.stroke({ width: 1, color: 0x223344 });
    this.addChild(div);
  }

  private _makeButton(label: string, w: number, h: number, color: number, action: () => void): Container {
    const c = new Container();
    c.eventMode = 'static';
    c.cursor = 'pointer';
    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 6);
    bg.fill(color);
    bg.stroke({ width: 1, color: 0x334455 });
    c.addChild(bg);
    const txt = new Text({ text: label, style: new TextStyle({ fontSize: 11, fill: 0xCCCCCC, align: 'center' }) });
    txt.anchor.set(0.5);
    txt.position.set(w / 2, h / 2);
    c.addChild(txt);
    c.on('pointerdown', action);
    c.on('pointerover', () => { bg.tint = 0xbbbbbb; });
    c.on('pointerout',  () => { bg.tint = 0xffffff; });
    return c;
  }

  private _makeToggleButton(label: string, active: boolean, w: number, h: number, _action: () => void): Container {
    const c = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 6);
    bg.fill(active ? 0x0a3a1a : 0x1a1a1a);
    bg.stroke({ width: 1, color: active ? 0x44FF88 : 0x334455 });
    c.addChild(bg);
    const dot = new Text({
      text: active ? '● ON' : '○ OFF',
      style: new TextStyle({ fontSize: 11, fill: active ? 0x44FF88 : 0x555555 }),
    });
    dot.position.set(8, h / 2 - 7);
    c.addChild(dot);
    const txt = new Text({ text: label, style: new TextStyle({ fontSize: 11, fill: active ? 0xCCCCCC : 0x555555 }) });
    txt.position.set(40, h / 2 - 7);
    c.addChild(txt);
    return c;
  }

  // ─── Keyboard ──────────────────────────────────────────────

  private _setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      // Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        this.toggle();
      }
    });
  }
}

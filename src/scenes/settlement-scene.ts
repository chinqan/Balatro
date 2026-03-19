// ============================================================
// Settlement Scene — Post-battle reward screen
// GDD Phase 8 §4: Victory / Defeat / Full-Run-Complete
// ============================================================

import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Scene } from '@/scenes/scene-manager';
import { Viewport, DESIGN_W, DESIGN_H } from '@/rendering/viewport';
import { COLORS } from '@/rendering/design-tokens';
import type { RunStats } from '@/models/run-state';
import { calculateInterest } from '@/models/player';

export type SettlementType = 'victory' | 'defeat' | 'complete';

export interface VictoryPayload {
  baseReward: number;          // Base battle reward (3-5 gold)
  eliteBonus: number;          // +2 if elite encounter
  bossBonus: number;           // +5 if boss encounter
  remainingPlays: number;      // Each → +1 gold
  remainingDiscards: number;   // Each → +1 gold
  currentMoney: number;        // Money BEFORE settlement
  /** Reward choices (relics/packs/skip). Usually 2 options + skip. */
  rewardChoices: RewardChoice[];
}

export interface RewardChoice {
  type: 'relic' | 'pack' | 'skip';
  label: string;
  icon: string;
  definitionId?: string;
}

export interface DefeatPayload {
  stats: RunStats;
  isNewRecord: boolean;
}

export interface CompletePayload {
  stats: RunStats;
  seedCode: string;
}

export class SettlementScene implements Scene {
  readonly name = 'settlement';

  private _viewport!: Viewport;
  private _onContinue?: () => void;
  private _onRestart?: () => void;
  private _onChooseReward?: (choice: RewardChoice) => void;

  // Pending data (set before switchTo, rendered in init)
  private _pendingType: SettlementType | null = null;
  private _pendingVictory: VictoryPayload | null = null;
  private _pendingDefeat: DefeatPayload | null = null;
  private _pendingComplete: CompletePayload | null = null;

  // ─── External Setup ──────────────────────────────────────

  setOnContinue(cb: () => void): void { this._onContinue = cb; }
  setOnRestart(cb: () => void): void { this._onRestart = cb; }
  setOnChooseReward(cb: (choice: RewardChoice) => void): void { this._onChooseReward = cb; }

  async init(app: Application, container: Container): Promise<void> {
    this._viewport = new Viewport(app, container);

    // Render pending data (set before switchTo)
    if (this._pendingType === 'victory' && this._pendingVictory) {
      this._rebuildVictory(this._pendingVictory);
    } else if (this._pendingType === 'defeat' && this._pendingDefeat) {
      this._rebuildDefeat(this._pendingDefeat);
    } else if (this._pendingType === 'complete' && this._pendingComplete) {
      this._rebuildComplete(this._pendingComplete);
    }
  }

  update(_dt: number): void {}

  destroy(): void {
    this._viewport?.destroy();
  }

  // ─── Show Methods ────────────────────────────────────────
  // Call these BEFORE switchTo('settlement'). Data is stored and rendered in init().

  showVictory(payload: VictoryPayload): void {
    this._pendingType = 'victory';
    this._pendingVictory = payload;
    // If viewport already exists (scene re-entered without switchTo), render immediately
    if (this._viewport) this._rebuildVictory(payload);
  }

  showDefeat(payload: DefeatPayload): void {
    this._pendingType = 'defeat';
    this._pendingDefeat = payload;
    if (this._viewport) this._rebuildDefeat(payload);
  }

  showComplete(payload: CompletePayload): void {
    this._pendingType = 'complete';
    this._pendingComplete = payload;
    if (this._viewport) this._rebuildComplete(payload);
  }

  // ─── Victory Screen ──────────────────────────────────────

  private _rebuildVictory(p: VictoryPayload): void {
    const root = this._viewport.root;
    root.removeChildren();

    // Dark background overlay
    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, DESIGN_H);
    bg.fill({ color: 0x0f1f1a });
    root.addChild(bg);

    // Title
    const title = new Text({
      text: '⚔️  勝  利  ⚔️',
      style: new TextStyle({ fontSize: 32, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(DESIGN_W / 2, 40);
    root.addChild(title);

    // ── Reward breakdown card ──
    const cardX = DESIGN_W / 2 - 160;
    const cardY = 100;
    const cardW = 320;
    const cardH = 200;

    const rewardCard = new Graphics();
    rewardCard.roundRect(cardX, cardY, cardW, cardH, 12);
    rewardCard.fill({ color: 0x0d1117 });
    rewardCard.stroke({ width: 2, color: COLORS.GOLD, alpha: 0.6 });
    root.addChild(rewardCard);

    const rewardTitle = new Text({
      text: '💰 戰利品獎勵',
      style: new TextStyle({ fontSize: 16, fill: COLORS.GOLD }),
    });
    rewardTitle.position.set(cardX + 12, cardY + 10);
    root.addChild(rewardTitle);

    const interest = calculateInterest(p.currentMoney);
    const bonusPlays = p.remainingPlays;
    const bonusDiscards = p.remainingDiscards;
    const total = p.baseReward + p.eliteBonus + p.bossBonus + bonusPlays + bonusDiscards + interest;

    const rows: Array<[string, number]> = [
      ['基礎獎勵', p.baseReward],
      ...(p.eliteBonus > 0 ? [['菁英怪獎勵', p.eliteBonus]] as Array<[string, number]> : []),
      ...(p.bossBonus > 0 ? [['Boss 獎勵', p.bossBonus]] as Array<[string, number]> : []),
      ...(bonusPlays > 0 ? [[`剩餘出牌 (${bonusPlays}次)`, bonusPlays]] as Array<[string, number]> : []),
      ...(bonusDiscards > 0 ? [[`剩餘棄牌 (${bonusDiscards}次)`, bonusDiscards]] as Array<[string, number]> : []),
      ...(interest > 0 ? [[`利息 (${p.currentMoney}金)`, interest]] as Array<[string, number]> : []),
    ];

    let rowY = cardY + 38;
    for (const [label, value] of rows) {
      const lbl = new Text({ text: label, style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_DIM }) });
      lbl.position.set(cardX + 14, rowY);
      root.addChild(lbl);

      const val = new Text({ text: `+${value} 金`, style: new TextStyle({ fontSize: 12, fill: COLORS.GOLD }) });
      val.anchor.set(1, 0);
      val.position.set(cardX + cardW - 14, rowY);
      root.addChild(val);

      rowY += 22;
    }

    // Divider
    const divider = new Graphics();
    divider.moveTo(cardX + 14, rowY + 2);
    divider.lineTo(cardX + cardW - 14, rowY + 2);
    divider.stroke({ width: 1, color: COLORS.TEXT_DIM, alpha: 0.4 });
    root.addChild(divider);

    const totalTxt = new Text({
      text: `合計: ${total} 金   💰 [${p.currentMoney}→${p.currentMoney + total}]`,
      style: new TextStyle({ fontSize: 13, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    totalTxt.position.set(cardX + 14, rowY + 8);
    root.addChild(totalTxt);

    // ── Reward choices ──
    const choiceY = cardY + cardH + 30;
    const choiceW = 110;
    const choiceH = 90;
    const totalW = p.rewardChoices.length * (choiceW + 16) - 16;
    let choiceX = DESIGN_W / 2 - totalW / 2;

    for (const choice of p.rewardChoices) {
      const choiceBtn = new Container();
      choiceBtn.eventMode = 'static';
      choiceBtn.cursor = 'pointer';

      const bg2 = new Graphics();
      bg2.roundRect(0, 0, choiceW, choiceH, 10);
      bg2.fill({ color: 0x1a1a2e });
      bg2.stroke({ width: 2, color: choice.type === 'skip' ? 0x555555 : COLORS.GOLD, alpha: 0.7 });
      choiceBtn.addChild(bg2);

      const ico = new Text({ text: choice.icon, style: new TextStyle({ fontSize: 28 }) });
      ico.anchor.set(0.5);
      ico.position.set(choiceW / 2, 28);
      choiceBtn.addChild(ico);

      const lbl = new Text({
        text: choice.label,
        style: new TextStyle({ fontSize: 11, fill: choice.type === 'skip' ? COLORS.TEXT_DIM : COLORS.TEXT_PRIMARY, wordWrap: true, wordWrapWidth: choiceW - 10 }),
      });
      lbl.anchor.set(0.5, 0);
      lbl.position.set(choiceW / 2, 58);
      choiceBtn.addChild(lbl);

      choiceBtn.position.set(choiceX, choiceY);
      choiceBtn.on('pointerdown', () => this._onChooseReward?.(choice));
      choiceBtn.on('pointerover', () => { bg2.tint = 0xcccccc; });
      choiceBtn.on('pointerout',  () => { bg2.tint = 0xffffff; });
      root.addChild(choiceBtn);

      choiceX += choiceW + 16;
    }

    // Continue button (greyed until reward chosen, or always visible)
    const continueBtn = this._buildButton('繼續 →', DESIGN_H - 70, COLORS.BUTTON_PRIMARY, () => this._onContinue?.());
    root.addChild(continueBtn);
  }

  // ─── Defeat Screen ───────────────────────────────────────

  private _rebuildDefeat(p: DefeatPayload): void {
    const root = this._viewport.root;
    root.removeChildren();

    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, DESIGN_H);
    bg.fill({ color: 0x1a0a0a });
    root.addChild(bg);

    const title = new Text({
      text: '💀  敗  退  💀',
      style: new TextStyle({ fontSize: 32, fill: 0xFF4444, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(DESIGN_W / 2, 40);
    root.addChild(title);

    // Stats card
    const cardX = DESIGN_W / 2 - 160;
    const cardY = 100;
    const cardW = 320;
    const card = new Graphics();
    card.roundRect(cardX, cardY, cardW, 240, 12);
    card.fill({ color: 0x0d1117 });
    card.stroke({ width: 2, color: 0xFF4444, alpha: 0.5 });
    root.addChild(card);

    const statTitle = new Text({ text: '📋 本局統計', style: new TextStyle({ fontSize: 15, fill: 0xFF4444 }) });
    statTitle.position.set(cardX + 12, cardY + 10);
    root.addChild(statTitle);

    const s = p.stats;
    const statRows: [string, string][] = [
      ['到達樓層',     `F${s.currentFloor}`],
      ['擊敗 Boss',    `${s.bossesDefeated} 位`],
      ['最高單次傷害', `${s.highestSingleDamage}`],
      ['總傷害',       `${s.totalDamage}`],
      ['累計收入',     `${s.moneyEarned} 金`],
    ];

    let y = cardY + 38;
    for (const [label, value] of statRows) {
      const lbl = new Text({ text: label, style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_DIM }) });
      lbl.position.set(cardX + 14, y);
      root.addChild(lbl);

      const val = new Text({ text: value, style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_PRIMARY, fontWeight: 'bold' }) });
      val.anchor.set(1, 0);
      val.position.set(cardX + cardW - 14, y);
      root.addChild(val);

      y += 30;
    }

    if (p.isNewRecord) {
      const record = new Text({
        text: '🏆 新紀錄！',
        style: new TextStyle({ fontSize: 18, fill: COLORS.GOLD, fontWeight: 'bold' }),
      });
      record.anchor.set(0.5, 0);
      record.position.set(DESIGN_W / 2, y + 10);
      root.addChild(record);
    }

    // Action buttons
    const restartBtn = this._buildButton('⚡ 快速重啟', DESIGN_H - 110, 0x2a1a3a, () => this._onRestart?.());
    const menuBtn = this._buildButton('返回主選單', DESIGN_H - 60, COLORS.BUTTON_DANGER, () => this._onContinue?.());
    root.addChild(restartBtn);
    root.addChild(menuBtn);
  }

  // ─── Full-Run-Complete Screen ────────────────────────────

  private _rebuildComplete(p: CompletePayload): void {
    const root = this._viewport.root;
    root.removeChildren();

    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, DESIGN_H);
    bg.fill({ color: 0x0f0f1a });
    root.addChild(bg);

    const title = new Text({
      text: '👑  通  關  👑',
      style: new TextStyle({ fontSize: 32, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(DESIGN_W / 2, 40);
    root.addChild(title);

    // Seed code box
    const seedBox = new Container();
    seedBox.eventMode = 'static';
    seedBox.cursor = 'pointer';
    const seedBg = new Graphics();
    seedBg.roundRect(DESIGN_W / 2 - 140, 370, 280, 48, 8);
    seedBg.fill({ color: 0x1a1a2e });
    seedBg.stroke({ width: 1, color: COLORS.TEXT_DIM });
    seedBox.addChild(seedBg);

    const seedTxt = new Text({
      text: `種子碼: ${p.seedCode}`,
      style: new TextStyle({ fontSize: 13, fill: COLORS.TEXT_DIM }),
    });
    seedTxt.anchor.set(0.5);
    seedTxt.position.set(DESIGN_W / 2, 394);
    seedBox.addChild(seedTxt);

    const copyHint = new Text({ text: '（點擊複製）', style: new TextStyle({ fontSize: 10, fill: 0x555555 }) });
    copyHint.anchor.set(0.5);
    copyHint.position.set(DESIGN_W / 2, 412);
    seedBox.addChild(copyHint);

    seedBox.on('pointerdown', () => {
      navigator.clipboard?.writeText(p.seedCode).catch(() => {});
      copyHint.text = '✓ 已複製！';
    });
    root.addChild(seedBox);

    const continueBtn = this._buildButton('繼續', DESIGN_H - 70, COLORS.BUTTON_PRIMARY, () => this._onContinue?.());
    root.addChild(continueBtn);
  }

  // ─── Helpers ─────────────────────────────────────────────

  private _buildButton(label: string, y: number, color: number, action: () => void): Container {
    const c = new Container();
    c.eventMode = 'static';
    c.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(0, 0, 180, 42, 8);
    bg.fill(color);
    c.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({ fontSize: 15, fill: 0xFFFFFF, fontWeight: 'bold' }),
    });
    txt.anchor.set(0.5);
    txt.position.set(90, 21);
    c.addChild(txt);

    c.position.set(DESIGN_W / 2 - 90, y);
    c.on('pointerdown', action);
    c.on('pointerover', () => { bg.tint = 0xdddddd; });
    c.on('pointerout',  () => { bg.tint = 0xffffff; });

    return c;
  }
}

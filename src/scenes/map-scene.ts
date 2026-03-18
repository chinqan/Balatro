// ============================================================
// Map Scene — Dungeon floor map with encounter nodes
// GDD Phase 8 §2.3: Map layout, skip confirm, Boss preview
// ============================================================

import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Scene } from '@/scenes/scene-manager';
import { Viewport, DESIGN_W, DESIGN_H } from '@/rendering/viewport';
import { COLORS } from '@/rendering/design-tokens';
import { RunManager } from '@/systems/run-manager';
import { getBossForFloor, FLOOR_ENEMY_HP } from '@/data/bosses';
import type { BossDefinition } from '@/types';

// ─── Mechanic labels ─────────────────────────────────────────
const MECHANIC_LABELS: Record<string, string> = {
  suit_block:   '🚫 花色封鎖 — 隨機 1 種花色不計分',
  hand_block:   '🚫 牌型封鎖 — 隨機 1 種牌型不計分',
  face_down:    '❓ 正面朝下 — 攻擊前手牌全部蓋牌',
  action_limit: '⚡ 行動限制 — 出牌次數 -1',
  damage_cap:   '📉 傷害封頂 — 每回合傷害上限 8000',
  relic_silence:'🔇 遺物沉默 — 隨機 3 個遺物失效',
};

const MECHANIC_COUNTER: Record<string, string> = {
  suit_block:   '準備萬能牌 / 改變花色的捲軸',
  hand_block:   '多樣化牌型，避免單一依賴',
  face_down:    '靠記憶或「遺物顯示牌値」配件',
  action_limit: '高傷牌型，單次出牌最大化',
  damage_cap:   '多回合積累，優先護盾護體',
  relic_silence:'重要遺物放後方或依賴手牌傷害',
};

export class MapScene implements Scene {
  readonly name = 'map';

  private _viewport!: Viewport;
  private _run!: RunManager;
  private _onStartEncounter?: () => void;
  private _onSkipEncounter?: () => void;

  // Overlay containers
  private _skipOverlay: Container | null = null;
  private _bossPreviewOverlay: Container | null = null;

  setRunManager(run: RunManager): void { this._run = run; }
  setOnStartEncounter(cb: () => void): void { this._onStartEncounter = cb; }
  setOnSkipEncounter(cb: () => void): void { this._onSkipEncounter = cb; }

  async init(app: Application, container: Container): Promise<void> {
    this._viewport = new Viewport(app, container);
    this._rebuildMap();
  }

  update(_dt: number): void {}

  destroy(): void {
    this._viewport?.destroy();
  }

  refreshMap(): void {
    this._rebuildMap();
  }

  // ─── Main Map Layout ─────────────────────────────────────

  private _rebuildMap(): void {
    const root = this._viewport.root;
    root.removeChildren();
    this._skipOverlay = null;
    this._bossPreviewOverlay = null;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, DESIGN_H);
    bg.fill(0x0d1117);
    root.addChild(bg);

    // Title
    const title = new Text({
      text: '🏰 地城地圖',
      style: new TextStyle({ fontSize: 26, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(DESIGN_W / 2, 16);
    root.addChild(title);

    if (!this._run) return;

    // Player info bar
    const infoText = new Text({
      text: `❤️ ${this._run.player.hp}/${this._run.player.maxHp}  |  💰 ${this._run.player.money}  |  🔮 遺物: ${this._run.relics.length}`,
      style: new TextStyle({ fontSize: 13, fill: COLORS.TEXT_PRIMARY }),
    });
    infoText.anchor.set(0.5, 0);
    infoText.position.set(DESIGN_W / 2, 52);
    root.addChild(infoText);

    // Floor nodes
    const startY = 90;
    const nodeH = 58;
    const floors = this._run.floors;

    for (let f = 0; f < floors.length; f++) {
      const floorData = floors[f];
      const y = startY + f * nodeH;
      const isCurrent = f === this._run.currentFloor;

      // Floor label
      const floorLabel = new Text({
        text: `F${floorData.floor}`,
        style: new TextStyle({
          fontSize: 13,
          fill: isCurrent ? COLORS.GOLD : floorData.completed ? 0x4AFF7A : COLORS.TEXT_DIM,
          fontWeight: isCurrent ? 'bold' : 'normal',
        }),
      });
      floorLabel.position.set(22, y + 10);
      root.addChild(floorLabel);

      // Encounter nodes
      for (let e = 0; e < floorData.encounters.length; e++) {
        const encounterType = floorData.encounters[e];
        const x = 100 + e * 180;
        const isCurrentEncounter = isCurrent && e === floorData.currentEncounter;
        const isPast = floorData.completed || (isCurrent && e < floorData.currentEncounter);

        const nodeW = 155;
        const nodeNodeH = 42;

        const node = new Container();
        const nodeBg = new Graphics();
        nodeBg.roundRect(0, 0, nodeW, nodeNodeH, 8);

        if (isCurrentEncounter) {
          nodeBg.fill(0x1E3A5F);
          nodeBg.stroke({ width: 2, color: COLORS.GOLD });
        } else if (isPast) {
          nodeBg.fill(0x112211);
          nodeBg.stroke({ width: 1, color: 0x2a6a2a });
        } else {
          nodeBg.fill(0x111120);
          nodeBg.stroke({ width: 1, color: 0x222233 });
        }
        node.addChild(nodeBg);

        const icon = encounterType === 'boss'     ? '💀' :
                     encounterType === 'elite'    ? '🛡️' : '⚔️';
        const label = encounterType === 'boss'    ? ` Boss F${floorData.floor}` :
                      encounterType === 'elite'   ? ' 菁英怪' : ' 普通怪';

        const nodeTxt = new Text({
          text: isPast ? `✓ ${label.trim()}` : `${icon}${label}`,
          style: new TextStyle({
            fontSize: 12,
            fill: isPast ? 0x446644 : isCurrentEncounter ? 0xFFFFFF : COLORS.TEXT_DIM,
          }),
        });
        nodeTxt.position.set(8, 7);
        node.addChild(nodeTxt);

        // Sub-info (HP for current, next hint)
        const floorHp = FLOOR_ENEMY_HP[floorData.floor];
        const hp = floorHp
          ? (encounterType === 'boss'   ? floorHp.boss :
             encounterType === 'elite'  ? floorHp.elite : floorHp.standard)
          : '?';

        const hpTxt = new Text({
          text: isCurrentEncounter ? `→ HP: ${hp}` : '',
          style: new TextStyle({ fontSize: 10, fill: 0xFFAA00 }),
        });
        hpTxt.position.set(8, 26);
        node.addChild(hpTxt);

        node.position.set(x, y);
        node.eventMode = 'static';
        node.cursor = isCurrentEncounter ? 'pointer' : 'default';

        // Click Boss node → show Boss preview
        if (isCurrentEncounter && encounterType === 'boss') {
          node.on('pointerdown', () => this._showBossPreview(floorData.floor));
          node.on('pointerover', () => { nodeBg.tint = 0xdddddd; });
          node.on('pointerout',  () => { nodeBg.tint = 0xffffff; });
        }

        root.addChild(node);

        // Connector
        if (e < floorData.encounters.length - 1) {
          const line = new Graphics();
          line.moveTo(x + nodeW, y + nodeNodeH / 2);
          line.lineTo(x + nodeW + 25, y + nodeNodeH / 2);
          line.stroke({ width: 1, color: isPast ? 0x2a6a2a : 0x222233 });
          root.addChild(line);
        }
      }
    }

    // ─── Action buttons ──────────────────────────────────
    const buttonY = DESIGN_H - 72;

    // Start Battle
    const BTN_H = 44;
    const startBtn = this._buildButton('⚔️ 開始戰鬥', 160, BTN_H, COLORS.BUTTON_PRIMARY, () => this._onStartEncounter?.());
    startBtn.position.set(DESIGN_W / 2 - 185, buttonY);
    root.addChild(startBtn);

    // Skip (non-boss only)
    const currentFloor = this._run.currentFloorData;
    if (currentFloor) {
      const currentType = currentFloor.encounters[currentFloor.currentEncounter];
      if (currentType && currentType !== 'boss') {
        const skipBtn = this._buildButton('⏩ 跳過遭遇', 160, BTN_H, 0x334455, () => this._openSkipConfirm(currentType));
        skipBtn.position.set(DESIGN_W / 2 + 25, buttonY);
        root.addChild(skipBtn);
      }

      // Boss preview hint button
      if (currentType === 'boss') {
        const previewBtn = this._buildButton('👁 Boss 預覽', 160, BTN_H, 0x3a1a4a, () => this._showBossPreview(currentFloor.floor));
        previewBtn.position.set(DESIGN_W / 2 + 25, buttonY);
        root.addChild(previewBtn);
      }
    }
  }

  // ─── Skip Confirm Overlay ─────────────────────────────

  private _openSkipConfirm(encounterType: 'standard' | 'elite'): void {
    const root = this._viewport.root;

    // Remove old overlay if exists
    if (this._skipOverlay) root.removeChild(this._skipOverlay);

    const overlay = new Container();
    this._skipOverlay = overlay;

    // Dim background
    const dim = new Graphics();
    dim.rect(0, 0, DESIGN_W, DESIGN_H);
    dim.fill({ color: 0x000000, alpha: 0.65 });
    dim.eventMode = 'static';
    overlay.addChild(dim);

    // Dialog box
    const dlgW = 340;
    const dlgH = 260;
    const dlgX = DESIGN_W / 2 - dlgW / 2;
    const dlgY = DESIGN_H / 2 - dlgH / 2;

    const dlg = new Graphics();
    dlg.roundRect(dlgX, dlgY, dlgW, dlgH, 12);
    dlg.fill(0x0d1117);
    dlg.stroke({ width: 2, color: COLORS.GOLD, alpha: 0.7 });
    overlay.addChild(dlg);

    const dlgTitle = new Text({
      text: '⏩ 確定跳過？',
      style: new TextStyle({ fontSize: 18, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    dlgTitle.anchor.set(0.5, 0);
    dlgTitle.position.set(DESIGN_W / 2, dlgY + 14);
    overlay.addChild(dlgTitle);

    // Forfeited section
    const forfeitLabel = new Text({
      text: '❌ 放棄：',
      style: new TextStyle({ fontSize: 13, fill: 0xFF6666 }),
    });
    forfeitLabel.position.set(dlgX + 16, dlgY + 52);
    overlay.addChild(forfeitLabel);

    const goldAmt = encounterType === 'elite' ? '5-7 金' : '3-5 金';
    const forfeitItems = [`  • ${goldAmt} 獎勵`, '  • 進入商店機會'];
    let fy = dlgY + 72;
    for (const item of forfeitItems) {
      const t = new Text({ text: item, style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_DIM }) });
      t.position.set(dlgX + 16, fy);
      overlay.addChild(t);
      fy += 20;
    }

    // Gained section
    const gainLabel = new Text({
      text: '✅ 獲得：',
      style: new TextStyle({ fontSize: 13, fill: 0x4AFF7A }),
    });
    gainLabel.position.set(dlgX + 16, fy + 8);
    overlay.addChild(gainLabel);

    const tagDesc = encounterType === 'elite'
      ? '1 個稀有標籤（負片/挑戰/稀有）\n或 30% 機率：銅/銀/金 寶箱'
      : '1 個隨機標籤（經濟/靈藥/稀有）';

    const gainedTxt = new Text({
      text: `  • ${tagDesc}`,
      style: new TextStyle({
        fontSize: 12,
        fill: 0x88EE88,
        wordWrap: true,
        wordWrapWidth: dlgW - 32,
      }),
    });
    gainedTxt.position.set(dlgX + 16, fy + 28);
    overlay.addChild(gainedTxt);

    // Buttons
    const btnY = dlgY + dlgH - 52;

    const confirmBtn = this._buildButton('確定跳過', 130, 36, 0xFF4444, () => {
      this._closeSkipOverlay();
      this._onSkipEncounter?.();
    });
    confirmBtn.position.set(dlgX + 16, btnY);
    overlay.addChild(confirmBtn);

    const cancelBtn = this._buildButton('取消', 130, 36, 0x334455, () => this._closeSkipOverlay());
    cancelBtn.position.set(dlgX + dlgW - 146, btnY);
    overlay.addChild(cancelBtn);

    root.addChild(overlay);
  }

  private _closeSkipOverlay(): void {
    if (this._skipOverlay) {
      this._viewport.root.removeChild(this._skipOverlay);
      this._skipOverlay = null;
    }
  }

  // ─── Boss Preview Overlay ─────────────────────────────

  private _showBossPreview(floor: number): void {
    const root = this._viewport.root;
    if (this._bossPreviewOverlay) root.removeChild(this._bossPreviewOverlay);

    const boss: BossDefinition | undefined = getBossForFloor(floor);
    const floorHp = FLOOR_ENEMY_HP[floor];

    const overlay = new Container();
    this._bossPreviewOverlay = overlay;

    const dim = new Graphics();
    dim.rect(0, 0, DESIGN_W, DESIGN_H);
    dim.fill({ color: 0x000000, alpha: 0.7 });
    dim.eventMode = 'static';
    overlay.addChild(dim);

    const panelW = 340;
    const panelH = boss ? 300 + boss.mechanics.length * 56 : 200;
    const panelX = DESIGN_W / 2 - panelW / 2;
    const panelY = Math.max(20, DESIGN_H / 2 - panelH / 2);

    const panel = new Graphics();
    panel.roundRect(panelX, panelY, panelW, panelH, 12);
    panel.fill(0x0d1117);
    panel.stroke({ width: 2, color: 0xFF4444, alpha: 0.8 });
    overlay.addChild(panel);

    const bossName = boss ? `💀 ${boss.name}` : `💀 Floor ${floor} Boss`;
    const titleTxt = new Text({
      text: bossName,
      style: new TextStyle({ fontSize: 18, fill: 0xFF4444, fontWeight: 'bold' }),
    });
    titleTxt.anchor.set(0.5, 0);
    titleTxt.position.set(DESIGN_W / 2, panelY + 14);
    overlay.addChild(titleTxt);

    // Stats
    const hp = floorHp?.boss ?? (boss?.baseHp ?? '?');
    const atk = boss?.baseAtk ?? '?';
    const statsText = `❤️ HP: ${hp}   ⚔️ 攻擊力: ${atk}`;
    const statsTxt = new Text({
      text: statsText,
      style: new TextStyle({ fontSize: 13, fill: COLORS.TEXT_PRIMARY }),
    });
    statsTxt.anchor.set(0.5, 0);
    statsTxt.position.set(DESIGN_W / 2, panelY + 44);
    overlay.addChild(statsTxt);

    // Mechanics
    let mechY = panelY + 76;

    if (boss && boss.mechanics.length > 0) {
      const mechLabel = new Text({
        text: '⚠️ 機制限制：',
        style: new TextStyle({ fontSize: 13, fill: 0xFFAA44, fontWeight: 'bold' }),
      });
      mechLabel.position.set(panelX + 14, mechY);
      overlay.addChild(mechLabel);
      mechY += 24;

      for (const mech of boss.mechanics) {
        const mechBg = new Graphics();
        mechBg.roundRect(panelX + 12, mechY, panelW - 24, 48, 6);
        mechBg.fill({ color: 0x2a0000 });
        mechBg.stroke({ width: 1, color: 0xFF4444, alpha: 0.5 });
        overlay.addChild(mechBg);

        const mechDesc = new Text({
          text: MECHANIC_LABELS[mech] ?? `🚫 ${mech}`,
          style: new TextStyle({ fontSize: 11, fill: 0xFF8888, wordWrap: true, wordWrapWidth: panelW - 36 }),
        });
        mechDesc.position.set(panelX + 18, mechY + 4);
        overlay.addChild(mechDesc);

        const counter = MECHANIC_COUNTER[mech];
        if (counter) {
          const counterTxt = new Text({
            text: `💡 ${counter}`,
            style: new TextStyle({ fontSize: 10, fill: COLORS.TEXT_DIM, wordWrap: true, wordWrapWidth: panelW - 36 }),
          });
          counterTxt.position.set(panelX + 18, mechY + 28);
          overlay.addChild(counterTxt);
        }
        mechY += 56;
      }
    } else {
      const noMech = new Text({
        text: '✅ 無特殊機制限制',
        style: new TextStyle({ fontSize: 13, fill: 0x4AFF7A }),
      });
      noMech.position.set(panelX + 14, mechY);
      overlay.addChild(noMech);
      mechY += 28;
    }

    // First-turn warning
    const firstTurnNote = new Text({
      text: '⚠️ 首回合攻擊模式：進入戰鬥後揭曉',
      style: new TextStyle({ fontSize: 11, fill: COLORS.TEXT_DIM, fontStyle: 'italic' }),
    });
    firstTurnNote.anchor.set(0.5, 0);
    firstTurnNote.position.set(DESIGN_W / 2, mechY + 8);
    overlay.addChild(firstTurnNote);

    // Challenge button
    const challengeBtn = this._buildButton('⚔️ 挑戰！', 130, 38, COLORS.BUTTON_PRIMARY, () => {
      this._closeBossPreview();
      this._onStartEncounter?.();
    });
    challengeBtn.position.set(panelX + panelW / 2 - 65, panelY + panelH - 52);
    overlay.addChild(challengeBtn);

    // Close button (×)
    const closeBtn = new Text({
      text: '✕',
      style: new TextStyle({ fontSize: 18, fill: 0xFF4444 }),
    });
    closeBtn.position.set(panelX + panelW - 28, panelY + 10);
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointerdown', () => this._closeBossPreview());
    overlay.addChild(closeBtn);

    root.addChild(overlay);
  }

  private _closeBossPreview(): void {
    if (this._bossPreviewOverlay) {
      this._viewport.root.removeChild(this._bossPreviewOverlay);
      this._bossPreviewOverlay = null;
    }
  }

  // ─── Helper ──────────────────────────────────────────

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
}

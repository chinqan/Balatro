// ============================================================
// Map Scene — Dungeon floor map with encounter nodes
// GDD Phase 8: Game Flow — Floor progression
// ============================================================

import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Scene } from '@/scenes/scene-manager';
import { Viewport, DESIGN_W, DESIGN_H } from '@/rendering/viewport';
import { COLORS } from '@/rendering/design-tokens';
import { RunManager } from '@/systems/run-manager';

export class MapScene implements Scene {
  readonly name = 'map';

  private _viewport!: Viewport;
  private _run!: RunManager;
  private _onStartEncounter?: () => void;
  private _onSkipEncounter?: () => void;

  setRunManager(run: RunManager): void {
    this._run = run;
  }

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

  private _rebuildMap(): void {
    const root = this._viewport.root;
    root.removeChildren();

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, DESIGN_H);
    bg.fill(0x0d1117);
    root.addChild(bg);

    // Title
    const title = new Text({
      text: '🏰 地城地圖',
      style: new TextStyle({ fontSize: 28, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(DESIGN_W / 2, 20);
    root.addChild(title);

    if (!this._run) return;

    // Player info bar
    const infoText = new Text({
      text: `HP: ${this._run.player.hp}/${this._run.player.maxHp}  |  💰 ${this._run.player.money}  |  遺物: ${this._run.relics.length}`,
      style: new TextStyle({ fontSize: 14, fill: COLORS.TEXT_PRIMARY }),
    });
    infoText.anchor.set(0.5, 0);
    infoText.position.set(DESIGN_W / 2, 60);
    root.addChild(infoText);

    // Draw floor nodes
    const startY = 100;
    const nodeH = 65;
    const floors = this._run.floors;

    for (let f = 0; f < floors.length; f++) {
      const floorData = floors[f];
      const y = startY + f * nodeH;
      const isCurrent = f === this._run.currentFloor;

      // Floor label
      const floorLabel = new Text({
        text: `F${floorData.floor}`,
        style: new TextStyle({
          fontSize: 14,
          fill: isCurrent ? COLORS.GOLD : floorData.completed ? COLORS.SHIELD : COLORS.TEXT_DIM,
          fontWeight: isCurrent ? 'bold' : 'normal',
        }),
      });
      floorLabel.position.set(30, y + 10);
      root.addChild(floorLabel);

      // Encounter nodes
      for (let e = 0; e < floorData.encounters.length; e++) {
        const encounterType = floorData.encounters[e];
        const x = 120 + e * 180;
        const isCurrentEncounter = isCurrent && e === floorData.currentEncounter;
        const isPast = floorData.completed || (isCurrent && e < floorData.currentEncounter);

        const node = new Graphics();
        const nodeW = 150;
        const nodeNodeH = 44;
        const r = 8;

        // Node background
        node.roundRect(x, y, nodeW, nodeNodeH, r);
        if (isCurrentEncounter) {
          node.fill(0x2E86AB);
          node.stroke({ width: 2, color: COLORS.GOLD });
        } else if (isPast) {
          node.fill(0x1a3a2a);
          node.stroke({ width: 1, color: COLORS.SHIELD });
        } else {
          node.fill(0x1a1a2e);
          node.stroke({ width: 1, color: 0x333333 });
        }
        root.addChild(node);

        // Encounter label
        const label = encounterType === 'boss' ? '★ Boss' :
                      encounterType === 'elite' ? '⚔ 菁英怪' : '🐾 普通怪';
        const nodeText = new Text({
          text: label,
          style: new TextStyle({
            fontSize: 12,
            fill: isPast ? COLORS.TEXT_DIM : COLORS.TEXT_PRIMARY,
          }),
        });
        nodeText.position.set(x + 10, y + 6);
        root.addChild(nodeText);

        // HP hint
        const hpText = new Text({
          text: isPast ? '✓ 已完成' : isCurrentEncounter ? '→ 下一場' : '',
          style: new TextStyle({ fontSize: 10, fill: isCurrentEncounter ? COLORS.GOLD : COLORS.TEXT_DIM }),
        });
        hpText.position.set(x + 10, y + 26);
        root.addChild(hpText);

        // Connection line to next node
        if (e < floorData.encounters.length - 1) {
          const line = new Graphics();
          line.moveTo(x + nodeW, y + nodeNodeH / 2);
          line.lineTo(x + nodeW + 30, y + nodeNodeH / 2);
          line.stroke({ width: 1, color: isPast ? COLORS.SHIELD : 0x333333 });
          root.addChild(line);
        }
      }
    }

    // Action buttons
    const buttonY = DESIGN_H - 80;

    // "Start Battle" button
    const startBtn = new Container();
    startBtn.eventMode = 'static';
    startBtn.cursor = 'pointer';
    const startBg = new Graphics();
    startBg.roundRect(0, 0, 160, 44, 8);
    startBg.fill(COLORS.BUTTON_PRIMARY);
    startBtn.addChild(startBg);
    const startLabel = new Text({
      text: '⚔ 開始戰鬥',
      style: new TextStyle({ fontSize: 16, fill: 0xFFFFFF, fontWeight: 'bold' }),
    });
    startLabel.anchor.set(0.5);
    startLabel.position.set(80, 22);
    startBtn.addChild(startLabel);
    startBtn.position.set(DESIGN_W / 2 - 200, buttonY);
    startBtn.on('pointerdown', () => this._onStartEncounter?.());
    root.addChild(startBtn);

    // "Skip" button (only for non-boss encounters)
    const currentFloor = this._run.currentFloorData;
    if (currentFloor) {
      const currentType = currentFloor.encounters[currentFloor.currentEncounter];
      if (currentType && currentType !== 'boss') {
        const skipBtn = new Container();
        skipBtn.eventMode = 'static';
        skipBtn.cursor = 'pointer';
        const skipBg = new Graphics();
        skipBg.roundRect(0, 0, 160, 44, 8);
        skipBg.fill(0x555555);
        skipBtn.addChild(skipBg);
        const skipLabel = new Text({
          text: '⏩ 跳過遭遇',
          style: new TextStyle({ fontSize: 16, fill: 0xFFFFFF }),
        });
        skipLabel.anchor.set(0.5);
        skipLabel.position.set(80, 22);
        skipBtn.addChild(skipLabel);
        skipBtn.position.set(DESIGN_W / 2 + 40, buttonY);
        skipBtn.on('pointerdown', () => this._onSkipEncounter?.());
        root.addChild(skipBtn);
      }
    }
  }
}

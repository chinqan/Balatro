// ============================================================
// Title Scene — Main menu of Boss-Attack RPG
// GDD Phase 8 §2.1: Title Screen
// ============================================================

import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Scene } from '@/scenes/scene-manager';
import { Viewport, DESIGN_W, DESIGN_H } from '@/rendering/viewport';
import { COLORS } from '@/rendering/design-tokens';

export interface TitleSceneCallbacks {
  onNewRun: () => void;
  onContinue: (() => void) | null;  // null if no save exists
  onCollection: () => void;
  onSettings: () => void;
}

export class TitleScene implements Scene {
  readonly name = 'title';

  private _viewport!: Viewport;
  private _callbacks: TitleSceneCallbacks = {
    onNewRun: () => {},
    onContinue: null,
    onCollection: () => {},
    onSettings: () => {},
  };

  setCallbacks(cb: TitleSceneCallbacks): void {
    this._callbacks = cb;
  }

  async init(app: Application, container: Container): Promise<void> {
    this._viewport = new Viewport(app, container);
    this._build();
  }

  update(_dt: number): void {}

  destroy(): void {
    this._viewport?.destroy();
  }

  private _build(): void {
    const root = this._viewport.root;
    root.removeChildren();

    // ─── Background ──────────────────────────────────────
    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, DESIGN_H);
    bg.fill(0x050a0f);
    root.addChild(bg);

    // Decorative grid lines (CRT feel)
    for (let y = 0; y < DESIGN_H; y += 40) {
      const line = new Graphics();
      line.moveTo(0, y);
      line.lineTo(DESIGN_W, y);
      line.stroke({ width: 0.5, color: 0x112233, alpha: 0.4 });
      root.addChild(line);
    }

    // ─── Title ───────────────────────────────────────────
    const titleTop = new Text({
      text: 'BOSS',
      style: new TextStyle({
        fontSize: 72,
        fill: COLORS.GOLD,
        fontWeight: 'bold',
        letterSpacing: 12,
      }),
    });
    titleTop.anchor.set(0.5, 0);
    titleTop.position.set(DESIGN_W / 2, 60);
    root.addChild(titleTop);

    const titleBottom = new Text({
      text: 'ATTACK  RPG',
      style: new TextStyle({
        fontSize: 28,
        fill: 0xCCCCCC,
        letterSpacing: 8,
      }),
    });
    titleBottom.anchor.set(0.5, 0);
    titleBottom.position.set(DESIGN_W / 2, 145);
    root.addChild(titleBottom);

    // Separator
    const sep = new Graphics();
    sep.moveTo(DESIGN_W / 2 - 120, 188);
    sep.lineTo(DESIGN_W / 2 + 120, 188);
    sep.stroke({ width: 1, color: COLORS.GOLD, alpha: 0.5 });
    root.addChild(sep);

    // ─── Menu Buttons ─────────────────────────────────────
    const menuItems: Array<{ label: string; enabled: boolean; action: () => void }> = [
      { label: '▶  開始新局', enabled: true, action: () => this._callbacks.onNewRun() },
      {
        label: '◉  繼續遊戲',
        enabled: this._callbacks.onContinue !== null,
        action: () => this._callbacks.onContinue?.(),
      },
      { label: '📚  收藏庫', enabled: true, action: () => this._callbacks.onCollection() },
      { label: '⚙  設定', enabled: true, action: () => this._callbacks.onSettings() },
    ];

    let menuY = 220;
    for (const item of menuItems) {
      const btn = this._buildMenuButton(item.label, item.enabled, item.action);
      btn.position.set(DESIGN_W / 2 - 110, menuY);
      root.addChild(btn);
      menuY += 60;
    }

    // ─── Version ──────────────────────────────────────────
    const version = new Text({
      text: 'v0.1.0-dev',
      style: new TextStyle({ fontSize: 11, fill: 0x444444 }),
    });
    version.anchor.set(0.5, 1);
    version.position.set(DESIGN_W / 2, DESIGN_H - 10);
    root.addChild(version);
  }

  private _buildMenuButton(label: string, enabled: boolean, action: () => void): Container {
    const c = new Container();
    const w = 220;
    const h = 44;

    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 8);
    bg.fill({ color: enabled ? 0x1a1a2e : 0x111111 });
    bg.stroke({ width: 1.5, color: enabled ? COLORS.GOLD : 0x333333, alpha: enabled ? 0.6 : 0.3 });
    c.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontSize: 16,
        fill: enabled ? COLORS.TEXT_PRIMARY : 0x444444,
        fontWeight: enabled ? 'bold' : 'normal',
      }),
    });
    txt.anchor.set(0.5);
    txt.position.set(w / 2, h / 2);
    c.addChild(txt);

    if (enabled) {
      c.eventMode = 'static';
      c.cursor = 'pointer';
      c.on('pointerdown', action);
      c.on('pointerover', () => { bg.tint = 0xcccccc; });
      c.on('pointerout',  () => { bg.tint = 0xffffff; });
    }

    return c;
  }
}

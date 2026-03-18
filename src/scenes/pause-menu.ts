// ============================================================
// Pause Menu — In-game pause overlay (ESC to toggle)
// GDD Phase 8 §1.1: Pause screen
// Options: 繼續遊戲 / 設定 / 放棄本局 Run
// ============================================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLORS } from '@/rendering/design-tokens';

export interface PauseMenuCallbacks {
  onResume:    () => void;
  onSettings?: () => void;
  onQuitRun:   () => void;   // Abandon run → title screen
}

export class PauseMenu extends Container {
  private _callbacks: PauseMenuCallbacks = {
    onResume:  () => {},
    onQuitRun: () => {},
  };

  // Quit confirmation step
  private _confirmingQuit = false;

  constructor() {
    super();
    this.visible = false;
    this._build();
    this._setupKeyboard();
  }

  setCallbacks(cb: PauseMenuCallbacks): void {
    this._callbacks = cb;
  }

  toggle(): void {
    if (this.visible) this.hide();
    else this.show();
  }

  show(): void {
    this._confirmingQuit = false;
    this._build(); // Rebuild fresh
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  // ─── Build ─────────────────────────────────────────────────

  private _build(): void {
    this.removeChildren();

    // Dim background
    const dim = new Graphics();
    dim.rect(-640, -360, 1280 + 640, 720 + 360);
    dim.fill({ color: 0x000000, alpha: 0.7 });
    dim.eventMode = 'static';
    this.addChild(dim);

    // Panel
    const panel = new Container();
    panel.eventMode = 'static';
    const W = 280;
    const H = this._confirmingQuit ? 240 : 320;

    const bg = new Graphics();
    bg.roundRect(-W / 2, -H / 2, W, H, 14);
    bg.fill({ color: 0x0d1117 });
    bg.stroke({ width: 2, color: COLORS.GOLD, alpha: 0.6 });
    panel.addChild(bg);

    // Title
    const titleTxt = this._confirmingQuit ? '⚠  確定放棄本局？' : '⏸  暫停';
    const title = new Text({
      text: titleTxt,
      style: new TextStyle({ fontSize: 18, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(0, -H / 2 + 16);
    panel.addChild(title);

    if (this._confirmingQuit) {
      this._buildQuitConfirm(panel, H);
    } else {
      this._buildMainMenu(panel, H);
    }

    this.addChild(panel);
  }

  private _buildMainMenu(panel: Container, H: number): void {
    const btnY = -H / 2 + 70;
    const gap = 60;

    const items: Array<{ label: string; color: number; action: () => void }> = [
      {
        label: '▶  繼續遊戲',
        color: COLORS.BUTTON_PRIMARY,
        action: () => { this.hide(); this._callbacks.onResume(); },
      },
      {
        label: '⚙  設定',
        color: 0x2a3a4a,
        action: () => { this._callbacks.onSettings?.(); },
      },
      {
        label: '✕  放棄本局 Run',
        color: COLORS.BUTTON_DANGER,
        action: () => {
          this._confirmingQuit = true;
          this._build();
        },
      },
    ];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const btn = this._buildButton(item.label, 220, 44, item.color, item.action);
      btn.position.set(-110, btnY + i * gap);
      panel.addChild(btn);
    }

    // ESC hint
    const hint = new Text({
      text: 'ESC 繼續',
      style: new TextStyle({ fontSize: 10, fill: COLORS.TEXT_DIM }),
    });
    hint.anchor.set(0.5, 1);
    hint.position.set(0, H / 2 - 10);
    panel.addChild(hint);
  }

  private _buildQuitConfirm(panel: Container, H: number): void {
    const warning = new Text({
      text: '放棄後此局所有進度將\n無法恢復，確定繼續嗎？',
      style: new TextStyle({
        fontSize: 13,
        fill: 0xFFAAAA,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 220,
      }),
    });
    warning.anchor.set(0.5, 0.5);
    warning.position.set(0, -H / 2 + 100);
    panel.addChild(warning);

    // Confirm row
    const confirmBtn = this._buildButton('✓ 確定放棄', 100, 40, COLORS.BUTTON_DANGER, () => {
      this.hide();
      this._callbacks.onQuitRun();
    });
    confirmBtn.position.set(-115, H / 2 - 76);
    panel.addChild(confirmBtn);

    const cancelBtn = this._buildButton('← 取消', 100, 40, 0x2a3a4a, () => {
      this._confirmingQuit = false;
      this._build();
    });
    cancelBtn.position.set(14, H / 2 - 76);
    panel.addChild(cancelBtn);
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
      style: new TextStyle({ fontSize: 14, fill: 0xFFFFFF, fontWeight: 'bold', align: 'center' }),
    });
    txt.anchor.set(0.5);
    txt.position.set(w / 2, h / 2);
    c.addChild(txt);

    c.on('pointerdown', action);
    c.on('pointerover',  () => { bg.tint = 0xcccccc; });
    c.on('pointerout',   () => { bg.tint = 0xffffff; });

    return c;
  }

  // ─── Keyboard ────────────────────────────────────────────

  private _setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.visible) {
          this.hide();
          this._callbacks.onResume();
        }
        // Note: showing the pause menu is handled by the battle-scene
      }
    });
  }
}

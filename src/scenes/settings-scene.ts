// ============================================================
// Settings Scene — Audio/Display/Key bindings settings
// GDD Phase 8 §1.1: Settings screen
// ============================================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Scene } from '@/scenes/scene-manager';
import { Application } from 'pixi.js';
import { Viewport, DESIGN_W, DESIGN_H } from '@/rendering/viewport';
import { COLORS } from '@/rendering/design-tokens';

// ─── Settings Data ───────────────────────────────────────────

const SETTINGS_KEY = 'boss_attack_settings';

export interface GameSettings {
  masterVolume: number;    // 0-1
  musicVolume:  number;    // 0-1
  sfxVolume:    number;    // 0-1
  screenShake:  boolean;
  animSpeed:    'slow' | 'normal' | 'fast';
  colorblind:   boolean;
  language:     'zh_tw' | 'en';
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultSettings();
}

export function saveSettings(s: GameSettings): void {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function defaultSettings(): GameSettings {
  return {
    masterVolume: 0.8,
    musicVolume:  0.6,
    sfxVolume:    0.9,
    screenShake:  true,
    animSpeed:    'normal',
    colorblind:   false,
    language:     'zh_tw',
  };
}

// ─── Scene ───────────────────────────────────────────────────

export class SettingsScene implements Scene {
  readonly name = 'settings';

  private _viewport!: Viewport;
  private _onBack?: () => void;
  private _settings: GameSettings = loadSettings();

  setOnBack(cb: () => void): void { this._onBack = cb; }

  async init(app: Application, container: Container): Promise<void> {
    this._viewport = new Viewport(app, container);
    const root = this._viewport.root;

    // Background
    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, DESIGN_H);
    bg.fill(COLORS.BG_DARK);
    root.addChild(bg);

    // Panel
    const PW = 480;
    const pH = DESIGN_H - 80;
    const px = (DESIGN_W - PW) / 2;
    const py = 40;

    const panel = new Graphics();
    panel.roundRect(px, py, PW, pH, 16);
    panel.fill({ color: 0x0d1117 });
    panel.stroke({ width: 2, color: COLORS.GOLD, alpha: 0.5 });
    root.addChild(panel);

    // Back button
    const back = this._makeButton('← 返回', 80, 30, 0x1a2a3a, () => {
      saveSettings(this._settings);
      this._onBack?.();
    });
    back.position.set(px + 10, py + 10);
    root.addChild(back);

    // Title
    const title = new Text({
      text: '⚙️  設定',
      style: new TextStyle({ fontSize: 20, fill: COLORS.GOLD, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(DESIGN_W / 2, py + 12);
    root.addChild(title);

    // Settings rows
    let yOffset = py + 60;
    const rowW = PW - 48;
    const rowX = px + 24;

    // ── Volume sliders ──
    yOffset = this._addSectionLabel(root, '🔊 音量', rowX, yOffset);
    yOffset = this._addSlider(root, '主音量', rowX, yOffset, rowW,
      this._settings.masterVolume,
      v => { this._settings.masterVolume = v; });
    yOffset = this._addSlider(root, '音樂',   rowX, yOffset, rowW,
      this._settings.musicVolume,
      v => { this._settings.musicVolume = v; });
    yOffset = this._addSlider(root, '音效',   rowX, yOffset, rowW,
      this._settings.sfxVolume,
      v => { this._settings.sfxVolume = v; });

    yOffset += 16;

    // ── Display options ──
    yOffset = this._addSectionLabel(root, '🖥️  畫面', rowX, yOffset);
    yOffset = this._addToggle(root, '屏幕震動', rowX, yOffset, rowW,
      this._settings.screenShake,
      v => { this._settings.screenShake = v; });
    yOffset = this._addToggle(root, '色盲模式', rowX, yOffset, rowW,
      this._settings.colorblind,
      v => { this._settings.colorblind = v; });
    yOffset = this._addCycleButton(root, '動畫速度', rowX, yOffset, rowW,
      ['slow', 'normal', 'fast'],
      ['慢', '標準', '快'],
      this._settings.animSpeed,
      (v) => { this._settings.animSpeed = v as GameSettings['animSpeed']; });

    yOffset += 16;

    // ── Language ──
    yOffset = this._addSectionLabel(root, '🌐 語言', rowX, yOffset);
    this._addCycleButton(root, '語言', rowX, yOffset, rowW,
      ['zh_tw', 'en'],
      ['繁體中文', 'English'],
      this._settings.language,
      (v) => { this._settings.language = v as GameSettings['language']; });

    yOffset += 60;

    // ── Reset button ──
    const resetBtn = this._makeButton('🔄 重置所有設定', 180, 36, 0x4a1a1a, () => {
      this._settings = defaultSettings();
      saveSettings(this._settings);
      // Re-init scene to refresh sliders
      container.removeChildren();
      void this.init(app, container);
    });
    resetBtn.position.set(px + (PW - 180) / 2, yOffset);
    root.addChild(resetBtn);
  }

  private _addSectionLabel(root: Container, text: string, x: number, y: number): number {
    const lbl = new Text({ text, style: new TextStyle({ fontSize: 13, fill: COLORS.GOLD, fontWeight: 'bold' }) });
    lbl.position.set(x, y);
    root.addChild(lbl);
    return y + 24;
  }

  private _addSlider(
    root: Container, label: string,
    x: number, y: number, rowW: number,
    initialValue: number,
    onChange: (v: number) => void,
  ): number {
    const lbl = new Text({ text: label, style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_DIM }) });
    lbl.position.set(x, y + 4);
    root.addChild(lbl);

    const TRACK_W = rowW - 120;
    const TRACK_X = x + 100;

    const track = new Graphics();
    track.roundRect(TRACK_X, y + 8, TRACK_W, 8, 4);
    track.fill(0x1a2a3a);
    root.addChild(track);

    let currentVal = initialValue;
    const fillGfx = new Graphics();
    root.addChild(fillGfx);

    const thumb = new Graphics();
    root.addChild(thumb);

    const valTxt = new Text({ text: '', style: new TextStyle({ fontSize: 11, fill: COLORS.TEXT_PRIMARY }) });
    valTxt.position.set(TRACK_X + TRACK_W + 10, y + 4);
    root.addChild(valTxt);

    const redraw = () => {
      fillGfx.clear();
      fillGfx.roundRect(TRACK_X, y + 8, TRACK_W * currentVal, 8, 4);
      fillGfx.fill(COLORS.BUTTON_PRIMARY);

      thumb.clear();
      thumb.circle(TRACK_X + TRACK_W * currentVal, y + 12, 8);
      thumb.fill(COLORS.GOLD);

      valTxt.text = `${Math.round(currentVal * 100)}%`;
    };
    redraw();

    // Drag
    const hitArea = new Graphics();
    hitArea.rect(TRACK_X - 8, y, TRACK_W + 16, 24);
    hitArea.fill({ color: 0x000000, alpha: 0.001 });
    hitArea.eventMode = 'static';
    hitArea.cursor = 'pointer';
    let dragging = false;

    hitArea.on('pointerdown', (e) => {
      dragging = true;
      const local = hitArea.toLocal(e.global);
      currentVal = Math.max(0, Math.min(1, (local.x - 8) / TRACK_W));
      redraw();
      onChange(currentVal);
    });
    hitArea.on('pointermove', (e) => {
      if (!dragging) return;
      const local = hitArea.toLocal(e.global);
      currentVal = Math.max(0, Math.min(1, (local.x - 8) / TRACK_W));
      redraw();
      onChange(currentVal);
    });
    hitArea.on('pointerup', () => { dragging = false; });
    hitArea.on('pointerupoutside', () => { dragging = false; });
    root.addChild(hitArea);

    return y + 36;
  }

  private _addToggle(
    root: Container, label: string,
    x: number, y: number, rowW: number,
    initialValue: boolean,
    onChange: (v: boolean) => void,
  ): number {
    const lbl = new Text({ text: label, style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_DIM }) });
    lbl.position.set(x, y + 4);
    root.addChild(lbl);

    let current = initialValue;
    const pill = new Container();
    pill.position.set(x + rowW - 56, y);
    pill.eventMode = 'static';
    pill.cursor = 'pointer';

    const pillBg = new Graphics();
    const pillThumb = new Graphics();
    pill.addChild(pillBg);
    pill.addChild(pillThumb);

    const redraw = () => {
      pillBg.clear();
      pillBg.roundRect(0, 0, 48, 24, 12);
      pillBg.fill(current ? COLORS.BUTTON_PRIMARY : 0x333333);

      pillThumb.clear();
      pillThumb.circle(current ? 36 : 12, 12, 10);
      pillThumb.fill(0xFFFFFF);
    };
    redraw();

    pill.on('pointerdown', () => {
      current = !current;
      redraw();
      onChange(current);
    });
    root.addChild(pill);

    return y + 36;
  }

  private _addCycleButton(
    root: Container,
    label: string,
    x: number,
    y: number,
    rowW: number,
    values: string[],
    labels: string[],
    initialValue: string,
    onChange: (v: string) => void,
  ): number {
    const lbl = new Text({ text: label, style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_DIM }) });
    lbl.position.set(x, y + 4);
    root.addChild(lbl);

    let idx = values.indexOf(initialValue);
    if (idx < 0) idx = 0;

    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.position.set(x + rowW - 120, y);

    const btnBg = new Graphics();
    const btnTxt = new Text({ text: '', style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_PRIMARY, align: 'center' }) });
    btnTxt.anchor.set(0.5);
    btnTxt.position.set(60, 14);
    btn.addChild(btnBg);
    btn.addChild(btnTxt);

    const redraw = () => {
      btnBg.clear();
      btnBg.roundRect(0, 0, 120, 28, 8);
      btnBg.fill(0x1a2a3a);
      btnBg.stroke({ width: 1, color: COLORS.GOLD, alpha: 0.5 });
      btnTxt.text = `← ${labels[idx]} →`;
    };
    redraw();

    btn.on('pointerdown', () => {
      idx = (idx + 1) % values.length;
      redraw();
      onChange(values[idx]);
    });
    root.addChild(btn);

    return y + 36;
  }

  private _makeButton(label: string, w: number, h: number, color: number, action: () => void): Container {
    const c = new Container();
    c.eventMode = 'static';
    c.cursor = 'pointer';
    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 8);
    bg.fill(color);
    bg.stroke({ width: 1, color: COLORS.GOLD, alpha: 0.4 });
    c.addChild(bg);
    const txt = new Text({ text: label, style: new TextStyle({ fontSize: 12, fill: COLORS.GOLD }) });
    txt.anchor.set(0.5);
    txt.position.set(w / 2, h / 2);
    c.addChild(txt);
    c.on('pointerdown', action);
    c.on('pointerover', () => { bg.tint = 0xcccccc; });
    c.on('pointerout',  () => { bg.tint = 0xffffff; });
    return c;
  }

  update(): void {}
  destroy(): void {}
}

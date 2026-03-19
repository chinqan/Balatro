// ============================================================
// Map Scene — Dungeon floor map with encounter nodes
// GDD Phase 8 §2.3: Map layout, skip confirm, Boss preview
// ============================================================

import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Scene } from '@/scenes/scene-manager';
import { Viewport, DESIGN_W, DESIGN_H } from '@/rendering/viewport';
import { COLORS } from '@/rendering/design-tokens';
import { RunManager } from '@/systems/run-manager';
import type { SkipReward } from '@/systems/run-manager'; // used by _previewSkipReward
import { getBossForFloor, FLOOR_ENEMY_HP } from '@/data/bosses';
import type { BossDefinition } from '@/types';

// (3-card Balatro-style layout uses full DESIGN_W)

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

  // ─── Main Map Layout — Balatro 3-card style ──────────────

  private _rebuildMap(): void {
    const root = this._viewport.root;
    root.removeChildren();
    this._bossPreviewOverlay = null;

    // ─── Background ─────────────────────────────────────
    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_W, DESIGN_H);
    bg.fill(0x1a2a1a);   // Balatro's dark green felt
    root.addChild(bg);

    // Subtle grid texture overlay
    for (let gx = 0; gx < DESIGN_W; gx += 32) {
      const gl = new Graphics();
      gl.moveTo(gx, 0); gl.lineTo(gx, DESIGN_H);
      gl.stroke({ width: 0.5, color: 0x1f3a1f, alpha: 0.5 });
      root.addChild(gl);
    }
    for (let gy = 0; gy < DESIGN_H; gy += 32) {
      const gl = new Graphics();
      gl.moveTo(0, gy); gl.lineTo(DESIGN_W, gy);
      gl.stroke({ width: 0.5, color: 0x1f3a1f, alpha: 0.5 });
      root.addChild(gl);
    }

    if (!this._run) return;

    const currentFloorData = this._run.currentFloorData;
    if (!currentFloorData) return;

    const floorNum    = currentFloorData.floor;
    const encIdx      = currentFloorData.currentEncounter;
    const encounters  = currentFloorData.encounters;

    // ─── Header ─────────────────────────────────────────
    const headerBg = new Graphics();
    headerBg.rect(0, 0, DESIGN_W, 56);
    headerBg.fill({ color: 0x000000, alpha: 0.45 });
    root.addChild(headerBg);

    // Floor progress pips
    const TOTAL_FLOORS = this._run.floors.length;
    const pipW = 18; const pipGap = 8;
    const pipTotalW = TOTAL_FLOORS * (pipW + pipGap) - pipGap;
    let pipX = DESIGN_W / 2 - pipTotalW / 2;
    for (let i = 0; i < TOTAL_FLOORS; i++) {
      const fd = this._run.floors[i];
      const pip = new Graphics();
      let pipColor: number;
      if (fd.completed)       pipColor = 0x4AFF7A;
      else if (i === this._run.currentFloor) pipColor = COLORS.GOLD;
      else                    pipColor = 0x334455;
      pip.roundRect(pipX, 8, pipW, 8, 4);
      pip.fill(pipColor);
      root.addChild(pip);

      const pipLabel = new Text({
        text: `F${fd.floor}`,
        style: new TextStyle({ fontSize: 8, fill: i === this._run.currentFloor ? COLORS.GOLD : 0x556677 }),
      });
      pipLabel.anchor.set(0.5, 0);
      pipLabel.position.set(pipX + pipW / 2, 18);
      root.addChild(pipLabel);

      pipX += pipW + pipGap;
    }

    // Player info
    const infoTxt = new Text({
      text: `❤️ ${this._run.player.hp}/${this._run.player.maxHp}   💰 ${this._run.player.money}   🔮 遺物: ${this._run.relics.length}`,
      style: new TextStyle({ fontSize: 12, fill: COLORS.TEXT_PRIMARY }),
    });
    infoTxt.anchor.set(1, 0);
    infoTxt.position.set(DESIGN_W - 16, 8);
    root.addChild(infoTxt);

    // ─── 3-Card layout — all encounters of this floor ──────
    // Cards are FIXED: left=enc0, center=enc1, right=enc2(Boss)
    // Current encounter gets the gold "Select" frame.
    const CARD_W = 210;
    const CARD_H = 520;
    const GAP    = 24;
    const CARD_Y = 72;
    const totalW = CARD_W * 3 + GAP * 2;
    const startX = DESIGN_W / 2 - totalW / 2;

    for (let i = 0; i < encounters.length; i++) {
      const cardX = startX + i * (CARD_W + GAP);
      const encType = encounters[i];

      // Determine role for this card
      let role: 'previous' | 'current' | 'upcoming';
      if (i < encIdx)      role = 'previous';
      else if (i === encIdx) role = 'current';
      else                 role = 'upcoming';

      const onStart = (role === 'current')
        ? () => this._onStartEncounter?.()
        : null;

      this._drawEncounterCard(root, role, encType, floorNum,
        i, cardX, CARD_Y, CARD_W, CARD_H, onStart);
    }

    // ─── Floor progress bar at bottom ───────────────────
    this._drawFloorProgressBar(root, floorNum, encIdx, encounters.length);
  }

  // ─── Single encounter card ───────────────────────────────

  private _drawEncounterCard(
    root: Container,
    role: 'previous' | 'current' | 'upcoming',
    encType: 'standard' | 'elite' | 'boss' | null,
    floor: number,
    _encIdx: number | undefined,
    x: number, y: number, w: number, h: number,
    onStart: (() => void) | null,
  ): void {
    const isPrev    = role === 'previous';
    const isCurrent = role === 'current';
    const isNext    = role === 'upcoming';

    // Card background + border
    const card = new Container();
    const cardBg = new Graphics();
    let borderColor: number;
    let bgColor: number;
    if (isCurrent) {
      bgColor     = 0x1a2630;
      borderColor = COLORS.GOLD;
    } else if (isPrev) {
      bgColor     = 0x111111;
      borderColor = 0x334433;
    } else {
      bgColor     = 0x111820;
      borderColor = 0x334455;
    }

    cardBg.roundRect(0, 0, w, h, 14);
    cardBg.fill(bgColor);
    cardBg.stroke({ width: isCurrent ? 3 : 1.5, color: borderColor, alpha: isCurrent ? 1 : 0.55 });
    card.addChild(cardBg);
    card.position.set(x, y);
    root.addChild(card);

    // Role label badge (top pill)
    const ROLE_LABELS: Record<typeof role, string> = {
      previous: '✓ 已完成',
      current:  'Select',
      upcoming: 'Upcoming',
    };
    const ROLE_BG: Record<typeof role, number> = {
      previous: 0x334433,
      current:  0xD98C00,
      upcoming: 0x334455,
    };
    const ROLE_FG: Record<typeof role, number> = {
      previous: 0x668866,
      current:  0xFFFFFF,
      upcoming: 0x8899BB,
    };

    const badgeBg = new Graphics();
    const badgeW = w - 32; const badgeH = 30;
    badgeBg.roundRect(16, -15, badgeW, badgeH, 8);
    badgeBg.fill(ROLE_BG[role]);
    if (isCurrent) badgeBg.stroke({ width: 2, color: COLORS.GOLD });
    card.addChild(badgeBg);

    const badgeTxt = new Text({
      text: ROLE_LABELS[role],
      style: new TextStyle({ fontSize: isCurrent ? 16 : 13, fill: ROLE_FG[role], fontWeight: 'bold' }),
    });
    badgeTxt.anchor.set(0.5, 0.5);
    badgeTxt.position.set(w / 2, -15 + badgeH / 2);
    card.addChild(badgeTxt);

    if (encType === null) {
      // Empty state
      const emptyTxt = new Text({
        text: role === 'previous' ? '—\n最後遭遇' : '🎉\n本層完畢',
        style: new TextStyle({ fontSize: 14, fill: 0x445544, align: 'center' }),
      });
      emptyTxt.anchor.set(0.5);
      emptyTxt.position.set(w / 2, h / 2);
      card.addChild(emptyTxt);
      return;
    }

    // ── Encounter type chip ──────────────────────────────
    const encMeta = this._getEncounterMeta(encType, floor);
    const chipBg = new Graphics();
    chipBg.roundRect(w / 2 - 56, 30, 112, 24, 6);
    chipBg.fill(encMeta.chipColor);
    card.addChild(chipBg);

    const chipTxt = new Text({
      text: encMeta.typeName,
      style: new TextStyle({ fontSize: 12, fill: 0xFFFFFF, fontWeight: 'bold' }),
    });
    chipTxt.anchor.set(0.5, 0.5);
    chipTxt.position.set(w / 2, 30 + 12);
    card.addChild(chipTxt);

    // ── Big icon ─────────────────────────────────────────
    const iconBg = new Graphics();
    iconBg.circle(w / 2, 110, 44);
    iconBg.fill({ color: encMeta.iconBgColor, alpha: isPrev ? 0.35 : 0.9 });
    iconBg.stroke({ width: 2, color: encMeta.borderColor, alpha: isPrev ? 0.2 : 0.7 });
    if (isCurrent && encType === 'boss') {
      iconBg.eventMode = 'static';
      iconBg.cursor = 'pointer';
      iconBg.on('pointerdown', () => this._showBossPreview(floor));
      iconBg.on('pointerover', () => { iconBg.tint = 0xdddddd; });
      iconBg.on('pointerout',  () => { iconBg.tint = 0xffffff; });
    }
    card.addChild(iconBg);

    const iconTxt = new Text({
      text: encMeta.icon,
      style: new TextStyle({ fontSize: 36 }),
    });
    iconTxt.anchor.set(0.5);
    iconTxt.position.set(w / 2, 110);
    card.addChild(iconTxt);

    // ── Name ─────────────────────────────────────────────
    const nameTxt = new Text({
      text: encMeta.name,
      style: new TextStyle({
        fontSize: 15,
        fill: isPrev ? 0x556655 : isCurrent ? 0xFFFFFF : 0x8899BB,
        fontWeight: 'bold',
        align: 'center',
        wordWrap: true,
        wordWrapWidth: w - 24,
      }),
    });
    nameTxt.anchor.set(0.5, 0);
    nameTxt.position.set(w / 2, 162);
    card.addChild(nameTxt);

    // ── HP bar + ATK stats ─────────────────────────────────
    const statsBoxY = 196;
    const statsBoxH = 52;
    const statsBg = new Graphics();
    statsBg.roundRect(12, statsBoxY, w - 24, statsBoxH, 8);
    statsBg.fill({ color: 0x000000, alpha: isPrev ? 0.15 : 0.4 });
    card.addChild(statsBg);

    // HP bar track
    const hpBarX = 20; const hpBarY = statsBoxY + 8;
    const hpBarW = w - 40; const hpBarH = 10;
    const hpVal = typeof encMeta.hp === 'number' ? encMeta.hp : 0;
    // Bar background
    const hpTrack = new Graphics();
    hpTrack.roundRect(hpBarX, hpBarY, hpBarW, hpBarH, 3);
    hpTrack.fill(0x330000);
    card.addChild(hpTrack);
    // Bar fill (always full — showing max HP for a fresh encounter)
    const hpFill = new Graphics();
    hpFill.roundRect(hpBarX, hpBarY, hpBarW, hpBarH, 3);
    hpFill.fill(isPrev ? 0x335533 : 0xCC2222);
    card.addChild(hpFill);

    // HP label
    const hpLabel = new Text({
      text: `HP  ${hpVal.toLocaleString()}`,
      style: new TextStyle({ fontSize: 11, fill: isPrev ? 0x557755 : 0xFF9999, fontWeight: 'bold' }),
    });
    hpLabel.anchor.set(0, 0.5);
    hpLabel.position.set(hpBarX, statsBoxY + 35);
    card.addChild(hpLabel);

    // ATK label (right-aligned)
    const atkLabel = new Text({
      text: `⚔ ATK  ${encMeta.atk}`,
      style: new TextStyle({ fontSize: 11, fill: isPrev ? 0x557755 : 0xFFAA44, fontWeight: 'bold' }),
    });
    atkLabel.anchor.set(1, 0.5);
    atkLabel.position.set(w - 20, statsBoxY + 35);
    card.addChild(atkLabel);

    // ── Mechanics (for boss/upcoming) ─────────────────────
    let mechY = 252;
    if (!isPrev && encMeta.mechanics && encMeta.mechanics.length > 0) {
      for (const mech of encMeta.mechanics.slice(0, 2)) {
        const mechBg = new Graphics();
        mechBg.roundRect(10, mechY, w - 20, 38, 6);
        mechBg.fill({ color: 0x2a0000, alpha: 0.85 });
        mechBg.stroke({ width: 1, color: 0xFF4444, alpha: 0.4 });
        card.addChild(mechBg);

        const mechTxt = new Text({
          text: MECHANIC_LABELS[mech] ?? `🚫 ${mech}`,
          style: new TextStyle({ fontSize: 9.5, fill: 0xFF9999, wordWrap: true, wordWrapWidth: w - 30 }),
        });
        mechTxt.position.set(14, mechY + 5);
        card.addChild(mechTxt);

        mechY += 44;
      }
    } else if (!isPrev) {
      // Reward preview for non-boss
      const rewardBg = new Graphics();
      rewardBg.roundRect(10, mechY, w - 20, 34, 6);
      rewardBg.fill({ color: 0x0a2a0a, alpha: 0.8 });
      rewardBg.stroke({ width: 1, color: 0x4AFF7A, alpha: 0.35 });
      card.addChild(rewardBg);

      const rewardTxt = new Text({
        text: `🏆 勝利: +${encType === 'elite' ? '5-7' : '3-5'} 金 + 商店`,
        style: new TextStyle({ fontSize: 10.5, fill: 0x88DDAA }),
      });
      rewardTxt.position.set(16, mechY + 9);
      card.addChild(rewardTxt);
      mechY += 40;
    }

    // ── Upcoming: Up the Ante callout ────────────────────
    if (isNext && encType === 'boss') {
      const anteBg = new Graphics();
      anteBg.roundRect(10, mechY + 4, w - 20, 46, 6);
      anteBg.fill(0x2a1800);
      anteBg.stroke({ width: 1, color: COLORS.GOLD, alpha: 0.5 });
      card.addChild(anteBg);

      const anteTxt = new Text({
        text: `⚠️ Up the Ante\n所有遭遇難度提升，商店刷新`,
        style: new TextStyle({ fontSize: 10, fill: COLORS.GOLD, wordWrap: true, wordWrapWidth: w - 30, leading: 3 }),
      });
      anteTxt.position.set(14, mechY + 10);
      card.addChild(anteTxt);
      mechY += 54;
    }

    // ── Current card: action buttons ────────────────────
    if (isCurrent && onStart) {
      const btnAreaY = h - 128;

      // Start Battle button (Balatro "Select" style)
      const startBg = new Graphics();
      startBg.roundRect(14, btnAreaY, w - 28, 44, 10);
      startBg.fill(COLORS.BUTTON_PRIMARY);
      card.addChild(startBg);

      const startTxt = new Text({
        text: '⚔️ 開始戰鬥',
        style: new TextStyle({ fontSize: 15, fill: 0xFFFFFF, fontWeight: 'bold' }),
      });
      startTxt.anchor.set(0.5);
      startTxt.position.set(w / 2, btnAreaY + 22);
      card.addChild(startTxt);

      // Click events on cardBg area for start button
      const startArea = new Container();
      startArea.eventMode = 'static';
      startArea.cursor = 'pointer';
      startArea.hitArea = { contains: (px: number, py: number) => px >= 14 && px <= w - 14 && py >= btnAreaY && py <= btnAreaY + 44 } as any;
      startArea.on('pointerdown', onStart);
      startArea.on('pointerover', () => { startBg.tint = 0xdddddd; });
      startArea.on('pointerout',  () => { startBg.tint = 0xffffff; });
      card.addChild(startArea);

      if (encType !== 'boss') {
        const skipEncType = encType as 'standard' | 'elite';
        const reward = this._previewSkipReward(skipEncType);

        // "or" divider
        const orTxt = new Text({
          text: 'or',
          style: new TextStyle({ fontSize: 13, fill: 0x667788, fontStyle: 'italic' }),
        });
        orTxt.anchor.set(0.5, 0);
        orTxt.position.set(w / 2, btnAreaY + 52);
        card.addChild(orTxt);

        // ── Inline skip reward preview ──────────────────
        const skipRewardBg = new Graphics();
        skipRewardBg.roundRect(14, btnAreaY + 68, w - 28, 38, 8);
        skipRewardBg.fill({ color: 0x1a0a0a, alpha: 0.9 });
        skipRewardBg.stroke({ width: 1.5, color: 0xCC3333, alpha: 0.7 });
        card.addChild(skipRewardBg);

        const rewardIconTxt = new Text({
          text: reward.icon,
          style: new TextStyle({ fontSize: 16 }),
        });
        rewardIconTxt.anchor.set(0, 0.5);
        rewardIconTxt.position.set(24, btnAreaY + 68 + 19);
        card.addChild(rewardIconTxt);

        const rewardLabelTxt = new Text({
          text: `跳過獎勵：${reward.label}`,
          style: new TextStyle({ fontSize: 11, fill: 0xFFAAAA }),
        });
        rewardLabelTxt.anchor.set(0, 0.5);
        rewardLabelTxt.position.set(46, btnAreaY + 68 + 13);
        card.addChild(rewardLabelTxt);

        const rewardDescTxt = new Text({
          text: reward.kind === 'gold' ? '即時獲得金幣'
            : reward.kind === 'consumable' ? '消耗品槽上限 +1'
            : '隨機獲得一個遺物',
          style: new TextStyle({ fontSize: 9.5, fill: 0x996666 }),
        });
        rewardDescTxt.anchor.set(0, 0.5);
        rewardDescTxt.position.set(46, btnAreaY + 68 + 27);
        card.addChild(rewardDescTxt);

        // Skip button — directly below reward preview
        const skipBg = new Graphics();
        skipBg.roundRect(14, btnAreaY + 112, w - 28, 40, 10);
        skipBg.fill(0xCC2222);
        card.addChild(skipBg);

        const skipIcon = new Text({
          text: '⏩',
          style: new TextStyle({ fontSize: 14 }),
        });
        skipIcon.anchor.set(0, 0.5);
        skipIcon.position.set(26, btnAreaY + 112 + 20);
        card.addChild(skipIcon);

        const skipTxt = new Text({
          text: '跳過遭遇',
          style: new TextStyle({ fontSize: 14, fill: 0xFFFFFF, fontWeight: 'bold' }),
        });
        skipTxt.anchor.set(0.5);
        skipTxt.position.set(w / 2 + 8, btnAreaY + 112 + 20);
        card.addChild(skipTxt);

        // Direct skip — no dialog
        const skipArea = new Container();
        skipArea.eventMode = 'static';
        skipArea.cursor = 'pointer';
        skipArea.hitArea = { contains: (px: number, py: number) => px >= 14 && px <= w - 14 && py >= btnAreaY + 112 && py <= btnAreaY + 152 } as any;
        skipArea.on('pointerdown', () => this._onSkipEncounter?.());
        skipArea.on('pointerover', () => { skipBg.tint = 0xdddddd; });
        skipArea.on('pointerout',  () => { skipBg.tint = 0xffffff; });
        card.addChild(skipArea);
      }
    }

    // Dimming overlay for previous cards
    if (isPrev) {
      const dim = new Graphics();
      dim.roundRect(0, 0, w, h, 14);
      dim.fill({ color: 0x000000, alpha: 0.45 });
      card.addChild(dim);
    }
  }

  // ─── Encounter metadata helper ───────────────────────────

  private _getEncounterMeta(type: 'standard' | 'elite' | 'boss', floor: number) {
    const floorHp = FLOOR_ENEMY_HP[floor];
    const boss = type === 'boss' ? getBossForFloor(floor) : undefined;

    const hp  = floorHp
      ? (type === 'boss'  ? floorHp.boss
       : type === 'elite' ? floorHp.elite
       : floorHp.standard)
      : '?';
    const atk = type === 'boss' && boss ? boss.baseAtk
      : type === 'elite' ? Math.max(8, Math.round(floor * 5))
      : Math.max(5, Math.round(floor * 3.5));

    switch (type) {
      case 'standard': return {
        icon: '⚔️', name: '普通怪', typeName: '⚔️  普通遭遇',
        hp, atk,
        borderColor: 0x4488CC, chipColor: 0x1a3a6a, iconBgColor: 0x112240,
        mechanics: [],
      };
      case 'elite': return {
        icon: '🛡️', name: '菁英怪', typeName: '🛡️  菁英遭遇',
        hp, atk,
        borderColor: 0xCC8822, chipColor: 0x4a2a00, iconBgColor: 0x3a1800,
        mechanics: [],
      };
      case 'boss': {
        const bossName = boss ? boss.name : `Boss F${floor}`;
        return {
          icon: '💀', name: `Boss:\n${bossName}`, typeName: '💀  BOSS',
          hp, atk,
          borderColor: 0xFF4444, chipColor: 0x4a0000, iconBgColor: 0x2a0000,
          mechanics: boss?.mechanics ?? [],
        };
      }
    }
  }

  // ─── Floor progress bar ──────────────────────────────────

  private _drawFloorProgressBar(root: Container, floor: number, encIdx: number, totalEnc: number): void {
    const barY = DESIGN_H - 52;

    const barBg = new Graphics();
    barBg.rect(0, barY - 4, DESIGN_W, 56);
    barBg.fill({ color: 0x000000, alpha: 0.5 });
    root.addChild(barBg);

    // Encounter progress dots
    const dotW = 28; const dotGap = 10;
    const dotsTotal = dotW * totalEnc + dotGap * (totalEnc - 1);
    let dx = DESIGN_W / 2 - dotsTotal / 2;

    for (let i = 0; i < totalEnc; i++) {
      const encData = this._run.currentFloorData?.encounters[i];
      const isCurrentDot = i === encIdx;
      const isPastDot    = i < encIdx;
      const color = isPastDot ? 0x4AFF7A : isCurrentDot ? COLORS.GOLD : 0x334455;

      const dot = new Graphics();
      dot.roundRect(dx, barY + 4, dotW, dotW, 6);
      dot.fill(color);
      if (isCurrentDot) dot.stroke({ width: 2, color: COLORS.GOLD });
      root.addChild(dot);

      const dotTxt = new Text({
        text: encData === 'boss' ? '💀' : encData === 'elite' ? '🛡️' : '⚔️',
        style: new TextStyle({ fontSize: 12 }),
      });
      dotTxt.anchor.set(0.5);
      dotTxt.position.set(dx + dotW / 2, barY + 4 + dotW / 2);
      root.addChild(dotTxt);

      dx += dotW + dotGap;
    }

    // Floor number label
    const floorTxt = new Text({
      text: `F${floor}  遭遇 ${encIdx + 1} / ${totalEnc}`,
      style: new TextStyle({ fontSize: 11, fill: COLORS.TEXT_DIM }),
    });
    floorTxt.anchor.set(0.5, 0);
    floorTxt.position.set(DESIGN_W / 2, barY + dotW + 8);
    root.addChild(floorTxt);
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

  /** Preview skip reward for inline display (uses Math.random for UI variety) */
  private _previewSkipReward(type: 'standard' | 'elite'): SkipReward {
    const roll = Math.random();
    if (type === 'elite') {
      if (roll < 0.40) return { kind: 'gold',        amount: 8, label: '+8 金',       icon: '💰' };
      if (roll < 0.75) return { kind: 'consumable',  amount: 1, label: '消耗品槽 +1', icon: '🧪' };
      return               { kind: 'relic_random',  amount: 0, label: '隨機遺物',    icon: '🔮' };
    } else {
      if (roll < 0.55) return { kind: 'gold',       amount: 4, label: '+4 金',       icon: '💰' };
      if (roll < 0.85) return { kind: 'consumable', amount: 1, label: '消耗品槽 +1', icon: '🧪' };
      return               { kind: 'gold',          amount: 6, label: '+6 金（幸運）', icon: '💰' };
    }
  }
}

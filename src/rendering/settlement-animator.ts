// ============================================================
// Settlement Animator — 4-Phase Balatro-style Attack VFX Chain
// GDD Phase 1 §2: 四階段結算  |  GDD Phase 4 §3.1: VFX rules
//
// Play order:
//  Phase 1 (Hand Type)   → Banner pops up, scales 1.3→1
//  Phase 2 (Cards)       → Each played card flies toward boss
//  Phase 3 (Held)        → Steel cards in hand glow green
//  Phase 4 (Relics)      → Each relic pulses gold, damage ticks
//  Final                 → Big gold number explodes on boss
// ============================================================

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { RelicInstance, SettlementResult } from '@/types';
import { COLORS } from '@/rendering/design-tokens';

// ─── Timing constants (ms) ───────────────────────────────────
const BANNER_DURATION  = 700;   // Phase 1 banner display
const CARD_STEP_MS     = 180;   // Interval between card hits
const HELD_STEP_MS     = 100;   // Held card glow pulse
const RELIC_STEP_MS    = 350;   // Interval between relic triggers
const FINAL_WAIT_MS    = 500;   // Pause before final big number

// ─── Color palette ───────────────────────────────────────────
const C_PHASE_ATK   = 0x6699FF; // Blue: base ATK steps
const C_PHASE_HELD  = 0x44DD88; // Green: held card passives
const C_PHASE_RELIC = 0xFF8833; // Orange: relic steps
const C_FINAL       = 0xFFD700; // Gold: final total

/**
 * Options passed to SettlementAnimator.play()
 */
export interface AnimationOptions {
  /** Parent PixiJS container (root of the battle scene) */
  root: Container;
  /** Result of calculateDamage — provides steps and final damage */
  result: SettlementResult;
  /** Relic instances (for identifying relic cards in the bar) */
  relics: RelicInstance[];
  /** Reference containers: pass null if not available */
  relicBarContainer: Container | null;
  /** Called after each Phase 4 relic step with partial Boss HP drain */
  onPartialHpDrain: (fraction: number) => void;
  /** Called at the very end with final total damage */
  onFinalDamage: (total: number) => void;
  /** Canvas center x for boss area */
  bossX: number;
  /** Boss area y position */
  bossY: number;
}

// ─── Helper: sleep ──────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

// ─── Helper: animated number popup ──────────────────────────
function spawnDamageLabel(
  root: Container,
  x: number, y: number,
  text: string,
  color: number,
  fontSize = 28,
  durationMs = 900,
): void {
  const label = new Text({
    text,
    style: new TextStyle({
      fontSize,
      fontWeight: 'bold',
      fill: color,
      stroke: { color: 0x000000, width: 4 },
    }),
  });
  label.anchor.set(0.5);
  label.position.set(x, y);
  label.alpha = 0;
  root.addChild(label);

  // Entry: fade in + scale up
  let elapsed = 0;
  const tick = () => {
    elapsed += 16;
    const t = Math.min(elapsed / durationMs, 1);
    label.y = y - t * 40;
    label.alpha = t < 0.2 ? t / 0.2 : t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
    label.scale.set(0.6 + 0.4 * Math.min(t * 5, 1));
    if (t < 1) requestAnimationFrame(tick);
    else root.removeChild(label);
  };
  requestAnimationFrame(tick);
}

// ─── Helper: banner (Phase 1) ────────────────────────────────
function spawnBanner(root: Container, text: string, y: number): Promise<void> {
  return new Promise(res => {
    const bg = new Graphics();
    bg.roundRect(-180, -22, 360, 44, 10);
    bg.fill({ color: 0x1a1000, alpha: 0.92 });
    bg.stroke({ width: 2, color: COLORS.GOLD });

    const label = new Text({
      text,
      style: new TextStyle({
        fontSize: 24, fontWeight: 'bold', fill: COLORS.GOLD,
        stroke: { color: 0x000000, width: 4 },
      }),
    });
    label.anchor.set(0.5);

    const banner = new Container();
    banner.addChild(bg, label);
    banner.position.set(root.width / 2 || 480, y);
    banner.scale.set(1.3);
    root.addChild(banner);

    // Tween scale 1.3 → 1 over 200ms, then hold, then fade
    let elapsed = 0;
    const tick = () => {
      elapsed += 16;
      if (elapsed < 220) {
        banner.scale.set(1.3 - 0.3 * Math.min(elapsed / 220, 1));
      } else if (elapsed > BANNER_DURATION - 180) {
        banner.alpha = Math.max(0, 1 - (elapsed - (BANNER_DURATION - 180)) / 180);
      }
      if (elapsed < BANNER_DURATION) {
        requestAnimationFrame(tick);
      } else {
        root.removeChild(banner);
        res();
      }
    };
    requestAnimationFrame(tick);
  });
}

// ─── Helper: relic card pulse ────────────────────────────────
function pulseRelicCard(relicBarContainer: Container | null, relicIndex: number): void {
  if (!relicBarContainer) return;
  const child = relicBarContainer.getChildAt(relicIndex) as Container | null;
  if (!child) return;

  const originalScale = child.scale.x;
  let t = 0;
  const tick = () => {
    t += 16;
    const pulse = Math.sin(t / 60 * Math.PI * 2);
    child.scale.set(originalScale + 0.12 * Math.abs(pulse));
    if (t < 400) requestAnimationFrame(tick);
    else child.scale.set(originalScale);
  };
  requestAnimationFrame(tick);
}

/**
 * Main entry point.
 * Plays the full 4-phase settlement animation sequence.
 * Returns a Promise that resolves when all animations are complete.
 */
export async function playSettlement(opts: AnimationOptions): Promise<void> {
  const { root, result, relics, relicBarContainer, onPartialHpDrain, onFinalDamage, bossX, bossY } = opts;
  const { steps, finalDamage } = result;

  // ── Phase 1: Hand Type Banner ─────────────────────────────
  const phase1Steps = steps.filter(s => s.phase === 1);
  if (phase1Steps.length > 0) {
    const handTypeName = phase1Steps[0].source.replace('hand_type', '').trim() || '出牌！';
    await spawnBanner(root, handTypeName, bossY - 80);
  }

  // ── Phase 2: Cards fly toward boss (one by one) ───────────
  const phase2Steps = steps.filter(s => s.phase === 2);
  for (const step of phase2Steps) {
    const deltaAtk = step.atkAfter - step.atkBefore;
    const deltaDmg = step.dmgMultAfter - step.dmgMultBefore;
    const labelText = deltaAtk > 0
      ? `+${deltaAtk} ATK`
      : deltaDmg > 0
      ? `+${deltaDmg.toFixed(1)} DMG`
      : `×${step.dmgMultAfter.toFixed(1)} DMG`;
    spawnDamageLabel(root, bossX + (Math.random() - 0.5) * 80, bossY - 20, labelText, C_PHASE_ATK, 22);
    await sleep(CARD_STEP_MS);
  }

  // ── Phase 3: Held card passives (steel cards glow) ────────
  const phase3Steps = steps.filter(s => s.phase === 3);
  for (const step of phase3Steps) {
    const deltaDmg = (step.dmgMultAfter - step.dmgMultBefore).toFixed(1);
    spawnDamageLabel(root, bossX - 60, bossY - 50, `×${deltaDmg} DMG`, C_PHASE_HELD, 18, 700);
    await sleep(HELD_STEP_MS);
  }

  // ── Phase 4: Relics trigger one by one ────────────────────
  const phase4Steps = steps.filter(s => s.phase === 4);
  const totalRelicSteps = phase4Steps.length;

  for (let i = 0; i < totalRelicSteps; i++) {
    const step = phase4Steps[i];

    // Find relic index in bar for visual pulse
    const relicIdMatch = step.source.match(/^relic:(.+)$/);
    if (relicIdMatch) {
      const relicIdx = relics.findIndex(r => r.definitionId === relicIdMatch[1]);
      pulseRelicCard(relicBarContainer, relicIdx);
    }

    // Build label text
    const deltaAtk = step.atkAfter - step.atkBefore;
    const dmgBefore = step.dmgMultBefore;
    const dmgAfter = step.dmgMultAfter;
    let labelText: string;
    if (deltaAtk > 0) {
      labelText = `+${deltaAtk} ATK`;
    } else if (dmgAfter > dmgBefore && Math.abs(dmgAfter / dmgBefore - 1) > 0.001) {
      labelText = `×${(dmgAfter / dmgBefore).toFixed(2)} DMG`;
    } else if (dmgAfter > dmgBefore) {
      labelText = `+${(dmgAfter - dmgBefore).toFixed(1)} DMG`;
    } else {
      labelText = `♦ ${step.description.slice(0, 12)}`;
    }

    // Show combo label at slightly offset position each time
    const offsetX = bossX + (i % 2 === 0 ? 30 : -30);
    const offsetY = bossY - 40 - i * 8;
    spawnDamageLabel(root, offsetX, offsetY, labelText, C_PHASE_RELIC, 24, 800);

    // Partial Boss HP drain: drain proportional share after each relic step
    if (phase4Steps.length > 0) {
      onPartialHpDrain(1 / phase4Steps.length);
    }

    await sleep(RELIC_STEP_MS);
  }

  // ── Final: Big gold explosion number ─────────────────────
  await sleep(FINAL_WAIT_MS);

  const finalText = finalDamage.toLocaleString();
  spawnDamageLabel(
    root, bossX, bossY - 60,
    `💥 ${finalText}`,
    C_FINAL,
    48,
    1400,
  );
  onFinalDamage(finalDamage);
}

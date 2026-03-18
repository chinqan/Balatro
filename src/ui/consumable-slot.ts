// ============================================================
// Consumable Slot — Shows consumable inventory in battle HUD
// GDD Phase 4 §1: Consumable bar (right side of relic bar)
// GDD Phase 8 §3.4: Click to use, target selection mode
// ============================================================

import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import type { ConsumableInstance } from '@/types';
import { getConsumable } from '@/data/consumables';
import { COLORS } from '@/rendering/design-tokens';

const SLOT_SIZE = 44;
const SLOT_GAP = 6;

const TYPE_COLOR: Record<string, number> = {
  scroll: 0xA855F7,  // purple
  elixir: 0x3B82F6,  // blue
  pact:   0xEF4444,  // red
};

const TYPE_ICON: Record<string, string> = {
  scroll: '📜',
  elixir: '🧪',
  pact:   '📋',
};

export class ConsumableSlot extends Container {
  private _slots: Container[] = [];
  private _onUse?: (slotIndex: number) => void;
  private _maxSlots = 2;

  constructor() {
    super();
  }

  setOnUse(cb: (slotIndex: number) => void): void {
    this._onUse = cb;
  }

  /**
   * Refresh the display from current consumable state.
   */
  update(consumables: ConsumableInstance[], maxSlots: number): void {
    this._maxSlots = maxSlots;

    // Remove old slot containers
    for (const s of this._slots) this.removeChild(s);
    this._slots = [];

    for (let i = 0; i < maxSlots; i++) {
      const slot = this._buildSlot(i, consumables[i]);
      slot.position.set(i * (SLOT_SIZE + SLOT_GAP), 0);
      this.addChild(slot);
      this._slots.push(slot);
    }
  }

  private _buildSlot(index: number, item: ConsumableInstance | undefined): Container {
    const c = new Container();

    // Slot background
    const bg = new Graphics();
    bg.roundRect(0, 0, SLOT_SIZE, SLOT_SIZE, 8);

    if (item) {
      const def = getConsumable(item.definitionId);
      const color = def ? TYPE_COLOR[def.type] ?? 0x888888 : 0x888888;
      bg.fill({ color: 0x1a1a2e });
      bg.stroke({ width: 2, color });
      c.addChild(bg);

      // Icon
      const icon = new Text({
        text: def ? TYPE_ICON[def.type] : '?',
        style: new TextStyle({ fontSize: 22 }),
      });
      icon.anchor.set(0.5);
      icon.position.set(SLOT_SIZE / 2, SLOT_SIZE / 2 - 4);
      c.addChild(icon);

      // Tooltip on hover (name)
      const tooltip = new Text({
        text: def?.name ?? '?',
        style: new TextStyle({ fontSize: 9, fill: COLORS.TEXT_DIM }),
      });
      tooltip.anchor.set(0.5, 0);
      tooltip.position.set(SLOT_SIZE / 2, SLOT_SIZE - 13);
      c.addChild(tooltip);

      // Click to use
      c.eventMode = 'static';
      c.cursor = 'pointer';
      c.on('pointerdown', () => this._onUse?.(index));

      // Hover effect
      c.on('pointerover', () => { bg.tint = 0xdddddd; });
      c.on('pointerout',  () => { bg.tint = 0xffffff; });
    } else {
      // Empty slot
      bg.fill({ color: 0x111111 });
      bg.stroke({ width: 1, color: 0x333333, alpha: 0.5 });
      c.addChild(bg);

      const empty = new Text({
        text: '—',
        style: new TextStyle({ fontSize: 14, fill: 0x444444 }),
      });
      empty.anchor.set(0.5);
      empty.position.set(SLOT_SIZE / 2, SLOT_SIZE / 2);
      c.addChild(empty);
    }

    return c;
  }

  /** Total width of all slots */
  get totalWidth(): number {
    return this._maxSlots * SLOT_SIZE + (this._maxSlots - 1) * SLOT_GAP;
  }
}

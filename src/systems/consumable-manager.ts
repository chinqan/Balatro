// ============================================================
// Consumable Manager — Use Scrolls / Elixirs / Pacts
// GDD Phase 1 §3.5: Free action, player's turn only
// ============================================================

import type {
  PlayerState,
  HandType,
  ConsumableInstance,
  RelicInstance,
} from '@/types';
import type { EventBus } from '@/core/event-bus';
import { getConsumable } from '@/data/consumables';

export type ConsumableUseResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/** Context available when resolving a consumable's effect */
export interface ConsumableContext {
  player: PlayerState;
  hand: string[];                     // Current card IDs in hand
  selectedCardIds: string[];          // Cards chosen as targets (for scrolls)
  selectedRelicIndex?: number;        // Relic chosen as target (for pacts)
  handLevels: Record<HandType, number>;
  relics: RelicInstance[];
  events: EventBus;
}

/**
 * Use a consumable from the player's inventory.
 * This is always a FREE ACTION (does not consume plays/discards).
 *
 * @param slotIndex — Index in player.consumables[]
 */
export function useConsumable(
  slotIndex: number,
  ctx: ConsumableContext,
): ConsumableUseResult {
  const { player } = ctx;

  const instance = player.consumables[slotIndex];
  if (!instance) {
    return { ok: false, error: `No consumable in slot ${slotIndex}` };
  }

  const def = getConsumable(instance.definitionId);
  if (!def) {
    return { ok: false, error: `Unknown consumable: ${instance.definitionId}` };
  }

  // Validate target requirements
  if (def.targetMode === 'select_card') {
    const needed = def.targetCount ?? 1;
    if (ctx.selectedCardIds.length < needed) {
      return { ok: false, error: `Must select ${needed} card(s)` };
    }
  }
  if (def.targetMode === 'select_relic') {
    if (ctx.selectedRelicIndex === undefined) {
      return { ok: false, error: 'Must select a relic as target' };
    }
  }

  // Apply effect
  const message = applyConsumableEffect(def.id, ctx);

  // Remove used consumable from inventory
  player.consumables.splice(slotIndex, 1);

  ctx.events.emit('consumable:used', {
    definitionId: def.id,
    name: def.name,
    type: def.type,
  });

  return { ok: true, message };
}

/**
 * Add a consumable to player's inventory.
 * Returns false if inventory is full.
 */
export function addConsumable(
  player: PlayerState,
  definitionId: string,
): boolean {
  if (player.consumables.length >= player.maxConsumables) {
    return false;
  }
  player.consumables.push({ definitionId });
  return true;
}

/**
 * Remove a consumable from the inventory (discard/sell).
 */
export function removeConsumable(
  player: PlayerState,
  slotIndex: number,
): ConsumableInstance | undefined {
  return player.consumables.splice(slotIndex, 1)[0];
}

// ─── Internal Effect Router ──────────────────────────────────

function applyConsumableEffect(id: string, ctx: ConsumableContext): string {
  const { player, handLevels, events } = ctx;

  switch (id) {
    // Elixirs — upgrade hand type levels
    case 'E01': return upgradeHandLevel(handLevels, 'pair', 1, events);
    case 'E02': return upgradeHandLevel(handLevels, 'two_pair', 1, events);
    case 'E03': return upgradeHandLevel(handLevels, 'three_of_a_kind', 1, events);
    case 'E04': return upgradeHandLevel(handLevels, 'straight', 1, events);
    case 'E05': return upgradeHandLevel(handLevels, 'flush', 1, events);
    case 'E06': return upgradeHandLevel(handLevels, 'full_house', 1, events);
    case 'E07': return upgradeHandLevel(handLevels, 'four_of_a_kind', 1, events);
    case 'E08': return upgradeHandLevel(handLevels, 'straight_flush', 1, events);
    case 'E09': return upgradeHandLevel(handLevels, 'high_card', 1, events);
    case 'E10': return upgradeHandLevel(handLevels, 'royal_flush', 1, events);
    case 'E11': {
      // Aurora — random hand type +2
      const types = Object.keys(handLevels) as HandType[];
      const picked = types[Math.floor(Math.random() * types.length)];
      return upgradeHandLevel(handLevels, picked, 2, events);
    }
    case 'E12': {
      // Black Hole — ALL hand types +1
      for (const ht of Object.keys(handLevels) as HandType[]) {
        handLevels[ht]++;
      }
      events.emit('consumable:hand_levels_changed', { handLevels });
      return '所有牌型等級 +1';
    }

    // Pacts — economy / bold effects
    case 'P01': {
      const hpCost = 10;
      player.hp = Math.max(1, player.hp - hpCost);
      events.emit('consumable:pact_effect', { id, effect: 'dmg_mult_x3' });
      return `失去 ${hpCost} HP，本回合 DMG ×3`;
    }
    case 'P09': {
      player.money += 20;
      events.emit('consumable:pact_effect', { id, effect: 'boss_atk_x2_next' });
      return '獲得 20 金，下場 Boss 攻擊力 ×2';
    }
    case 'P13': {
      player.hp = Math.max(1, player.hp - 15);
      events.emit('consumable:pact_effect', { id, effect: 'boss_atk_half_this_round' });
      return '失去 15 HP，Boss 本回合攻擊力 -50%';
    }
    case 'P14': {
      // Convert all consumables → 4 gold each
      const count = player.consumables.length - 1; // -1 because current is already being removed
      player.money += count * 4;
      player.consumables = []; // Clear remaining consumables
      return `消耗品全部轉換為 ${count * 4} 金`;
    }

    // Scrolls — card modifications (full implementation deferred to card-mutation system)
    default:
      events.emit('consumable:effect_pending', { id, ctx });
      return `使用了 ${id}（效果待實作）`;
  }
}

function upgradeHandLevel(
  handLevels: Record<HandType, number>,
  handType: HandType,
  amount: number,
  events: EventBus,
): string {
  handLevels[handType] = (handLevels[handType] ?? 1) + amount;
  events.emit('consumable:hand_level_up', { handType, newLevel: handLevels[handType] });
  const MAX_LEVEL = 10;
  handLevels[handType] = Math.min(handLevels[handType], MAX_LEVEL);
  return `${handType} Lv.${handLevels[handType]}`;
}

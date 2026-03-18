// ============================================================
// Blessing Manager — Apply permanent upgrades (Blessings)
// GDD registry_blessings.md: B01-B32, Tier1+Tier2
// ============================================================

import type { PlayerState } from '@/types';
import { BLESSING_DEFINITIONS, getBlessingById, isTier2Unlocked, type BlessingDefinition } from '@/data/blessings';
import { EventBus } from '@/core/event-bus';
import { CONFIG } from '@/data/config';

export interface BlessingState {
  owned: string[];   // IDs of purchased blessings
}

export function createInitialBlessingState(): BlessingState {
  return { owned: [] };
}

export class BlessingManager {
  constructor(
    private readonly _state: BlessingState,
    private readonly _player: PlayerState,
    private readonly _events: EventBus,
  ) {}

  get ownedIds(): readonly string[] { return this._state.owned; }

  /** Check if a blessing has been purchased */
  isOwned(id: string): boolean { return this._state.owned.includes(id); }

  /** Check if a blessing is available to purchase */
  isAvailable(id: string): boolean {
    const b = getBlessingById(id);
    if (!b) return false;
    if (this.isOwned(id)) return false;
    if (b.tier === 2) return isTier2Unlocked(id, this._state.owned);
    return true;
  }

  /** Purchase a blessing. Returns true on success. */
  purchase(id: string): boolean {
    if (!this.isAvailable(id)) return false;
    const b = getBlessingById(id);
    if (!b) return false;
    if (this._player.money < b.price) return false;

    this._player.money -= b.price;
    this._state.owned.push(id);

    this._applyEffect(b);

    this._events.emit('economy:money_changed', {
      current: this._player.money,
      delta: -b.price,
    });

    return true;
  }

  /**
   * Get the shop discount provided by current blessings.
   */
  getShopDiscount(): number {
    let total = 0;
    if (this.isOwned('B09')) total += 1;
    if (this.isOwned('B10')) total += 2;
    return total;
  }

  /**
   * Get current reroll cost reduction.
   */
  getRerollCostReduce(): number {
    let total = 0;
    if (this.isOwned('B11')) total += 1;
    return total;
  }

  /**
   * Whether the first reroll is free (B12).
   */
  get isFirstRerollFree(): boolean { return this.isOwned('B12'); }

  /**
   * Get interest cap bonus.
   */
  getInterestCapBonus(): number {
    let total = 0;
    if (this.isOwned('B13')) total += 2;
    if (this.isOwned('B14')) total += 3;
    return total;
  }

  /**
   * Per-battle-end heal from blessings (B27/B28).
   */
  getBattleEndHeal(): number {
    // B28 supersedes B27 (cumulative per GDD)
    let total = 0;
    if (this.isOwned('B27')) total += 5;
    if (this.isOwned('B28')) total += 10;
    return total;
  }

  /**
   * Apply a blessing effect immediately on purchase.
   */
  private _applyEffect(b: BlessingDefinition): void {
    const eff = b.effect;
    if (!eff.oneTime) return;

    switch (eff.stat) {
      case 'plays':          this._player.plays          += eff.value; break;
      case 'discards':       this._player.discards        += eff.value; break;
      case 'handSize':       this._player.handSize        += eff.value; break;
      case 'maxConsumables': this._player.maxConsumables  += eff.value; break;
      case 'maxHp':
        this._player.maxHp += eff.value;
        this._player.hp     = Math.min(this._player.hp + eff.value, this._player.maxHp);
        break;
      case 'shield':
        this._player.shield = Math.min(
          CONFIG.SHIELD_HARD_CAP,
          this._player.shield + eff.value,
        );
        break;
    }
  }

  /**
   * Get all available (purchasable) blessings for the shop, sorted by tier.
   */
  getShopBlessings(): BlessingDefinition[] {
    return BLESSING_DEFINITIONS.filter(b => this.isAvailable(b.id));
  }
}

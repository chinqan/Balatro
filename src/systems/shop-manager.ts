// ============================================================
// Shop Manager — Generates shop inventory, handles purchases
// GDD Phase 2 §3: Shop content & economy
// ============================================================

import type { RelicDefinition, Card, PlayerState } from '@/types';
import type { SeedManager } from '@/core/rng';
import { getRandomRelic } from '@/data/relics';
import { CONFIG } from '@/data/config';

export type ShopItemType = 'relic' | 'card' | 'blessing';

export interface ShopItem {
  type: ShopItemType;
  /** Relic definition (if type is 'relic') */
  relic?: RelicDefinition;
  /** Card to add to deck (if type is 'card') */
  card?: Card;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Price in gold */
  price: number;
  /** Whether the item has been purchased already */
  sold: boolean;
}

export interface ShopState {
  items: ShopItem[];
  rerollCost: number;
  rerollCount: number;
}

export class ShopManager {
  private _state: ShopState;

  constructor(
    private readonly _rng: SeedManager,
    private readonly _floor: number,
  ) {
    this._state = this._generateShop();
  }

  get state(): Readonly<ShopState> { return this._state; }

  /**
   * Generate shop inventory for the current floor.
   */
  private _generateShop(): ShopState {
    const items: ShopItem[] = [];

    // 2 random relics
    for (let i = 0; i < 2; i++) {
      const relic = getRandomRelic(() => this._rng.random('shop'), Math.min(this._floor, 3));
      items.push({
        type: 'relic',
        relic,
        name: relic.name,
        description: relic.description,
        price: relic.price,
        sold: false,
      });
    }

    // 1 card pack (simplified: just a standard card for now)
    items.push({
      type: 'card',
      name: '標準卡包',
      description: '抽取 1 張隨機撲克牌加入牌組',
      price: 4,
      sold: false,
    });

    // 1 blessing (simplified)
    items.push({
      type: 'blessing',
      name: this._getRandomBlessing(),
      description: '永久增益',
      price: 10,
      sold: false,
    });

    return {
      items,
      rerollCost: 5,
      rerollCount: 0,
    };
  }

  private _getRandomBlessing(): string {
    const blessings = [
      '出牌次數 +1', '棄牌次數 +1', '手牌上限 +1',
      'HP 上限 +20', '護盾硬頂 +25', '初始金錢 +5',
    ];
    const idx = Math.floor(this._rng.random('shop') * blessings.length);
    return blessings[idx];
  }

  /**
   * Purchase an item at the given index.
   * Returns true if purchase succeeds.
   */
  purchase(index: number, player: PlayerState): boolean {
    const item = this._state.items[index];
    if (!item || item.sold) return false;
    if (player.money < item.price) return false;

    player.money -= item.price;
    item.sold = true;
    return true;
  }

  /**
   * Reroll the shop inventory.
   * Returns true if reroll succeeds.
   */
  reroll(player: PlayerState): boolean {
    if (player.money < this._state.rerollCost) return false;

    player.money -= this._state.rerollCost;
    this._state.rerollCount++;
    this._state.rerollCost = 5 * (this._state.rerollCount + 1); // Increasing cost

    // Regenerate items (keep sold items)
    const newState = this._generateShop();
    this._state.items = newState.items;

    return true;
  }
}

/**
 * Calculate battle rewards.
 * GDD Phase 2 §3.1
 */
export function calculateBattleRewards(
  encounterType: 'standard' | 'elite' | 'boss',
  currentMoney: number,
  interestCap = CONFIG.INTEREST_CAP,
): { base: number; bonus: number; interest: number; total: number } {
  let base = 3;
  let bonus = 0;

  switch (encounterType) {
    case 'standard':
      base = 3 + Math.floor(Math.random() * 3); // 3-5
      break;
    case 'elite':
      base = 4;
      bonus = 2;
      break;
    case 'boss':
      base = 5;
      bonus = 5;
      break;
  }

  const interest = Math.min(
    Math.floor(currentMoney / 5),
    interestCap,
  );

  return {
    base,
    bonus,
    interest,
    total: base + bonus + interest,
  };
}

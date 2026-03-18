// ============================================================
// Event Bus — Type-safe publish/subscribe for decoupling
// Logic layer emits events, rendering layer subscribes
// ============================================================

/** All game events and their payload types */
export interface GameEvents {
  // Battle events
  'battle:card_played': { cardIds: string[]; handType: string };
  'battle:damage_dealt': { damage: number; targetHp: number; steps: unknown[] };
  'battle:boss_attack': { damage: number; type: string };
  'battle:shield_gained': { amount: number; source: string };
  'battle:hp_changed': { current: number; max: number; delta: number };
  'battle:turn_start': { turn: number; phase: 'player' | 'boss' };
  'battle:turn_end': { turn: number; phase: 'player' | 'boss' };
  'battle:boss_defeated': { bossId: string; floor: number };
  'battle:player_defeated': Record<string, never>;

  // Deck events
  'deck:cards_drawn': { count: number };
  'deck:cards_discarded': { cardIds: string[] };
  'deck:card_destroyed': { cardId: string };
  'deck:shuffled': Record<string, never>;

  // Economy events
  'economy:money_changed': { current: number; delta: number };
  'economy:item_purchased': { itemId: string; cost: number };

  // Relic events
  'relic:triggered': { relicId: string; effect: string };
  'relic:acquired': { relicId: string };

  // Scene events
  'scene:transition': { from: string; to: string };

  // Audio cues
  'audio:play_sfx': { id: string; pitch?: number };
  'audio:set_music_state': { state: string };

  // Run flow events
  'run:encounter_start': { floor: number; encounter: number; type: string };
  'run:encounter_skipped': { type: string };
  'run:victory': Record<string, never>;
  'run:game_over': { floor: number; stats: unknown };
}

type EventCallback<T> = (payload: T) => void;

export class EventBus {
  private readonly _listeners = new Map<string, Set<EventCallback<unknown>>>();

  on<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(callback as EventCallback<unknown>);
  }

  off<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void {
    this._listeners.get(event)?.delete(callback as EventCallback<unknown>);
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    const listeners = this._listeners.get(event);
    if (listeners) {
      for (const cb of listeners) {
        cb(payload);
      }
    }
  }

  /** Remove all listeners (for cleanup) */
  clear(): void {
    this._listeners.clear();
  }
}

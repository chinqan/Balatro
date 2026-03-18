// ============================================================
// Save Manager — Serialise / deserialise a full run to localStorage
// GDD Phase 9 §1: Auto-save & session persistence
//
// Auto-save 時機（GDD §1.3）：
//   1. 每場戰鬥結束後（勝利/失敗）
//   2. 進入商店時
//   3. 離開商店時
//   4. window.beforeunload
//
// 存檔格式：localStorage key = 'boss_attack_save'
// ============================================================

import type { PlayerState, HandType, RelicInstance, ConsumableInstance } from '@/types';
import type { DeckState } from '@/systems/deck-manager';
import type { RunStats } from '@/models/run-state';
import type { FloorData, RunPhase } from '@/systems/run-manager';

// ─── Save Schema ─────────────────────────────────────────────

const SAVE_KEY    = 'boss_attack_save';
const SAVE_VER   = 1;

/** The root JSON blob written to localStorage */
export interface SaveData {
  version: number;
  timestamp: number;

  // Run meta
  phase: RunPhase;
  currentFloor: number;
  floors: FloorData[];
  stakeId: number;
  deckId: string;

  // Entity state
  player: PlayerState;
  deck: DeckState;
  handLevels: Record<HandType, number>;
  relics: RelicInstance[];
  consumables: ConsumableInstance[];
  blessings: string[];
  stats: RunStats;
}

// ─── Save Manager ────────────────────────────────────────────

export class SaveManager {
  private _beforeUnloadHandler: (() => void) | null = null;

  /**
   * Write the current run to localStorage.
   * Silently ignores errors (e.g. storage quota exceeded).
   */
  save(data: SaveData): boolean {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(SAVE_KEY, json);
      return true;
    } catch {
      console.warn('[SaveManager] Failed to write save:', SAVE_KEY);
      return false;
    }
  }

  /**
   * Load a save from localStorage.
   * Returns null if no valid save exists.
   */
  load(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw) as SaveData;
      if (data.version !== SAVE_VER) {
        console.warn('[SaveManager] Incompatible save version:', data.version);
        this.clear();
        return null;
      }
      return data;
    } catch {
      console.warn('[SaveManager] Failed to parse save data.');
      return null;
    }
  }

  /** Check if a valid save exists (without fully parsing). */
  hasSave(): boolean {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const partial = JSON.parse(raw) as { version?: number };
      return partial.version === SAVE_VER;
    } catch {
      return false;
    }
  }

  /** Delete the save (called on run completion or new game). */
  clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  /**
   * Register a beforeunload handler that auto-saves.
   * Call this once when a run starts.
   * @param getSaveData  Function that returns the current SaveData snapshot.
   */
  registerBeforeUnload(getSaveData: () => SaveData): void {
    // Remove existing handler first to avoid duplicates
    this.unregisterBeforeUnload();

    this._beforeUnloadHandler = () => {
      const data = getSaveData();
      this.save(data);
    };
    window.addEventListener('beforeunload', this._beforeUnloadHandler);
  }

  /** Remove the beforeunload handler (call on run end / navigate away). */
  unregisterBeforeUnload(): void {
    if (this._beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
      this._beforeUnloadHandler = null;
    }
  }
}

// ─── Singleton ───────────────────────────────────────────────

/** Global singleton save manager */
export const saveManager = new SaveManager();

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Build a SaveData snapshot from the current game state.
 * Called by game.ts after major state transitions.
 */
export function buildSaveData(params: {
  phase: RunPhase;
  currentFloor: number;
  floors: FloorData[];
  player: PlayerState;
  deck: DeckState;
  handLevels: Record<HandType, number>;
  relics: RelicInstance[];
  blessings: string[];
  stats: RunStats;
  stakeId?: number;
  deckId?: string;
}): SaveData {
  return {
    version: SAVE_VER,
    timestamp: Date.now(),
    phase: params.phase,
    currentFloor: params.currentFloor,
    floors: params.floors,
    stakeId: params.stakeId ?? 0,
    deckId: params.deckId ?? 'standard',
    player: params.player,
    deck: params.deck,
    handLevels: params.handLevels,
    relics: params.relics,
    consumables: params.player.consumables ?? [],
    blessings: params.blessings,
    stats: params.stats,
  };
}

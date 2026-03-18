// ============================================================
// Unlock Manager — Meta-progression unlock tracking
// GDD Phase 10 §1: Stakes, Starter Decks, Challenges, Relics
// ============================================================
// Persistent storage: localStorage key = 'boss_attack_unlocks'
// ============================================================

const UNLOCKS_KEY = 'boss_attack_unlocks';

// ─── Unlock Targets ──────────────────────────────────────────

/** All things that can be unlocked */
export type UnlockId =
  // Stakes (difficulty) — 8 total
  | 'stake_white'    // Always unlocked (default)
  | 'stake_red'      // Win with white stake once
  | 'stake_green'
  | 'stake_black'
  | 'stake_blue'
  | 'stake_purple'
  | 'stake_orange'
  | 'stake_gold'
  // Starter decks — 15 total
  | 'deck_standard'  // Always unlocked
  | 'deck_warrior'   // Always unlocked
  | 'deck_explorer'  // Always unlocked
  | 'deck_greedy'    // Earn 500 total gold
  | 'deck_ghost'     // Use pacts 10 times
  | 'deck_alchemist' // Deal >10,000 in a single hit
  | 'deck_painter'   // Win with 3 different decks
  | 'deck_forger'    // Discover 50 different relics
  | 'deck_cursed'    // Win with gold stake
  | 'deck_minimal'   // Delete 50 cards total
  | 'deck_giant'     // Complete 10 runs
  | 'deck_mirror'    // Win with 5 different decks
  | 'deck_lucky'     // Trigger lucky effect 100 times
  | 'deck_iron'      // Defeat 30 bosses
  | 'deck_void'      // Win with 4 different stakes
  // Challenges — 5 initially
  | 'challenge_naked'
  | 'challenge_one_type'
  | 'challenge_undying'
  | 'challenge_burning'
  | 'challenge_preservative'
  // Achievements
  | 'ach_first_win'
  | 'ach_million_damage'
  | 'ach_full_collection'
  | 'ach_perfect_run'
  | 'ach_broke_win';

// ─── Stats Tracked for Unlock Conditions ─────────────────────

export interface UnlockStats {
  totalRuns: number;
  totalWins: number;
  totalGoldEarned: number;
  totalBossesDefeated: number;
  totalCardsDeleted: number;
  pactsUsed: number;
  luckyTriggered: number;
  relicsDiscovered: string[];    // discovered relic IDs
  decksWonWith: string[];        // deck IDs used to win
  stakesWonWith: string[];       // stake IDs used to win
  highestSingleDamage: number;
}

export function createInitialUnlockStats(): UnlockStats {
  return {
    totalRuns: 0,
    totalWins: 0,
    totalGoldEarned: 0,
    totalBossesDefeated: 0,
    totalCardsDeleted: 0,
    pactsUsed: 0,
    luckyTriggered: 0,
    relicsDiscovered: [],
    decksWonWith: [],
    stakesWonWith: [],
    highestSingleDamage: 0,
  };
}

// ─── Saved Unlock Data ───────────────────────────────────────

interface UnlockSave {
  version: 1;
  unlocked: UnlockId[];
  stats: UnlockStats;
  newItems: UnlockId[];          // Items with "NEW!" badge
}

// ─── Unlock Manager ──────────────────────────────────────────

export class UnlockManager {
  private _unlocked: Set<UnlockId>;
  private _stats: UnlockStats;
  private _newItems: Set<UnlockId>;

  constructor() {
    const saved = this._load();
    if (saved) {
      this._unlocked = new Set(saved.unlocked);
      this._stats    = saved.stats;
      this._newItems = new Set(saved.newItems);
    } else {
      this._unlocked = new Set(this._defaultUnlocked());
      this._stats    = createInitialUnlockStats();
      this._newItems = new Set();
      this._save();
    }
  }

  // ─── Query ──────────────────────────────────────────────

  isUnlocked(id: UnlockId): boolean {
    return this._unlocked.has(id);
  }

  isNew(id: UnlockId): boolean {
    return this._newItems.has(id);
  }

  clearNew(id: UnlockId): void {
    this._newItems.delete(id);
    this._save();
  }

  get stats(): Readonly<UnlockStats> { return this._stats; }
  get unlockedIds(): ReadonlySet<UnlockId> { return this._unlocked; }

  // ─── Progress ───────────────────────────────────────────

  /** Call at the end of every run (win or lose) */
  recordRunEnd(params: {
    won: boolean;
    stakeId: string;
    deckId: string;
    goldEarned: number;
    bossesDefeated: number;
    highestSingleDamage: number;
    relicsFound: string[];
  }): UnlockId[] {
    const s = this._stats;
    s.totalRuns++;
    if (params.won) {
      s.totalWins++;
      if (!s.stakesWonWith.includes(params.stakeId)) s.stakesWonWith.push(params.stakeId);
      if (!s.decksWonWith.includes(params.deckId))   s.decksWonWith.push(params.deckId);
    }
    s.totalGoldEarned        += params.goldEarned;
    s.totalBossesDefeated    += params.bossesDefeated;
    if (params.highestSingleDamage > s.highestSingleDamage) {
      s.highestSingleDamage   = params.highestSingleDamage;
    }
    // Merge newly discovered relics
    for (const rid of params.relicsFound) {
      if (!s.relicsDiscovered.includes(rid)) s.relicsDiscovered.push(rid);
    }

    const newUnlocks = this._evaluateAll();
    this._save();
    return newUnlocks;
  }

  /** Increment pact usage and re-evaluate */
  recordPactUsed(): UnlockId[] {
    this._stats.pactsUsed++;
    const news = this._evaluateAll();
    this._save();
    return news;
  }

  /** Increment lucky trigger count and re-evaluate */
  recordLuckyTrigger(): UnlockId[] {
    this._stats.luckyTriggered++;
    const news = this._evaluateAll();
    this._save();
    return news;
  }

  /** Record card deletion */
  recordCardDeleted(): UnlockId[] {
    this._stats.totalCardsDeleted++;
    const news = this._evaluateAll();
    this._save();
    return news;
  }

  // ─── Unlock Evaluation ──────────────────────────────────

  /** Check all conditions and unlock any newly met ones. Returns newly unlocked IDs. */
  private _evaluateAll(): UnlockId[] {
    const s = this._stats;
    const newlyUnlocked: UnlockId[] = [];

    const tryUnlock = (id: UnlockId, condition: boolean) => {
      if (condition && !this._unlocked.has(id)) {
        this._unlocked.add(id);
        this._newItems.add(id);
        newlyUnlocked.push(id);
      }
    };

    // ── Stakes ──
    tryUnlock('stake_red',    s.stakesWonWith.includes('stake_white'));
    tryUnlock('stake_green',  s.stakesWonWith.includes('stake_red'));
    tryUnlock('stake_black',  s.stakesWonWith.includes('stake_green'));
    tryUnlock('stake_blue',   s.stakesWonWith.includes('stake_black'));
    tryUnlock('stake_purple', s.stakesWonWith.includes('stake_blue'));
    tryUnlock('stake_orange', s.stakesWonWith.includes('stake_purple'));
    tryUnlock('stake_gold',   s.stakesWonWith.includes('stake_orange'));

    // ── Decks ──
    tryUnlock('deck_greedy',   s.totalGoldEarned >= 500);
    tryUnlock('deck_ghost',    s.pactsUsed >= 10);
    tryUnlock('deck_alchemist', s.highestSingleDamage >= 10000);
    tryUnlock('deck_painter',  s.decksWonWith.length >= 3);
    tryUnlock('deck_forger',   s.relicsDiscovered.length >= 50);
    tryUnlock('deck_cursed',   s.stakesWonWith.includes('stake_gold'));
    tryUnlock('deck_minimal',  s.totalCardsDeleted >= 50);
    tryUnlock('deck_giant',    s.totalRuns >= 10);
    tryUnlock('deck_mirror',   s.decksWonWith.length >= 5);
    tryUnlock('deck_lucky',    s.luckyTriggered >= 100);
    tryUnlock('deck_iron',     s.totalBossesDefeated >= 30);
    tryUnlock('deck_void',     s.stakesWonWith.length >= 4);

    // ── Challenges ──
    tryUnlock('challenge_naked',        s.stakesWonWith.includes('stake_white'));
    tryUnlock('challenge_one_type',     s.stakesWonWith.includes('stake_white'));
    tryUnlock('challenge_undying',      s.stakesWonWith.includes('stake_white'));
    tryUnlock('challenge_burning',      s.stakesWonWith.includes('stake_white'));
    tryUnlock('challenge_preservative', s.stakesWonWith.includes('stake_white'));

    // ── Achievements ──
    tryUnlock('ach_first_win',      s.totalWins >= 1);
    tryUnlock('ach_million_damage', s.highestSingleDamage >= 1_000_000);
    tryUnlock('ach_perfect_run',    false);  // Tracked in-game: no HP loss
    tryUnlock('ach_broke_win',      false);  // Tracked in-game: 0 gold on final boss
    tryUnlock('ach_full_collection', s.relicsDiscovered.length >= 234);

    return newlyUnlocked;
  }

  // ─── Persistence ────────────────────────────────────────

  private _defaultUnlocked(): UnlockId[] {
    return [
      'stake_white',
      'deck_standard', 'deck_warrior', 'deck_explorer',
    ];
  }

  private _save(): void {
    try {
      const data: UnlockSave = {
        version: 1,
        unlocked: [...this._unlocked],
        stats: this._stats,
        newItems: [...this._newItems],
      };
      localStorage.setItem(UNLOCKS_KEY, JSON.stringify(data));
    } catch {
      console.warn('[UnlockManager] Failed to save unlock data.');
    }
  }

  private _load(): UnlockSave | null {
    try {
      const raw = localStorage.getItem(UNLOCKS_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as UnlockSave;
      if (data.version !== 1) return null;
      return data;
    } catch {
      return null;
    }
  }

  /** Debugging helper: reset all unlock progress */
  reset(): void {
    localStorage.removeItem(UNLOCKS_KEY);
    this._unlocked = new Set(this._defaultUnlocked());
    this._stats    = createInitialUnlockStats();
    this._newItems = new Set();
    this._save();
  }
}

/** Global singleton unlock manager */
export const unlockManager = new UnlockManager();

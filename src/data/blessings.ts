// ============================================================
// Blessings Data — B01-B32 (Tier1 + Tier2 pairs)
// GDD registry_blessings.md: 32 permanent upgrades
// Corresponds to Balatro's Voucher system
// ============================================================

export interface BlessingDefinition {
  id: string;           // B01-B32
  name: string;
  tier: 1 | 2;
  requires?: string;   // Parent blessing ID (Tier2 requires Tier1)
  description: string;
  price: number;       // Always 10 gold per GDD
  effect: BlessingEffect;
}

export interface BlessingEffect {
  stat: string;
  value: number;
  target?: 'player' | 'shop' | 'run';
  oneTime?: boolean;   // Apply once on purchase
}

export const BLESSING_DEFINITIONS: BlessingDefinition[] = [
  // ── Plays ──────────────────────────────────────────────
  { id:'B01', name:'額外攻勢',   tier:1, price:10, description:'+1 出牌次數',
    effect:{ stat:'plays', value:1, target:'player', oneTime:true } },
  { id:'B02', name:'猛攻',       tier:2, price:10, requires:'B01', description:'再 +1 出牌次數',
    effect:{ stat:'plays', value:1, target:'player', oneTime:true } },

  // ── Discards ────────────────────────────────────────────
  { id:'B03', name:'額外偵查',   tier:1, price:10, description:'+1 棄牌次數',
    effect:{ stat:'discards', value:1, target:'player', oneTime:true } },
  { id:'B04', name:'精準偵查',   tier:2, price:10, requires:'B03', description:'再 +1 棄牌次數',
    effect:{ stat:'discards', value:1, target:'player', oneTime:true } },

  // ── Hand Size ───────────────────────────────────────────
  { id:'B05', name:'擴展背包',   tier:1, price:10, description:'+1 手牌上限',
    effect:{ stat:'handSize', value:1, target:'player', oneTime:true } },
  { id:'B06', name:'超級背包',   tier:2, price:10, requires:'B05', description:'再 +2 手牌上限',
    effect:{ stat:'handSize', value:2, target:'player', oneTime:true } },

  // ── Relic Slots ─────────────────────────────────────────
  { id:'B07', name:'遺物擴展',   tier:1, price:10, description:'+1 遺物欄位',
    effect:{ stat:'relicSlots', value:1, target:'player', oneTime:true } },
  { id:'B08', name:'遺物大師',   tier:2, price:10, requires:'B07', description:'再 +1 遺物欄位',
    effect:{ stat:'relicSlots', value:1, target:'player', oneTime:true } },

  // ── Shop Price ──────────────────────────────────────────
  { id:'B09', name:'折扣卡',     tier:1, price:10, description:'商店價格 -1 金',
    effect:{ stat:'shopDiscount', value:1, target:'shop' } },
  { id:'B10', name:'VIP會員',    tier:2, price:10, requires:'B09', description:'商店價格 -2 金',
    effect:{ stat:'shopDiscount', value:2, target:'shop' } },

  // ── Reroll Cost ─────────────────────────────────────────
  { id:'B11', name:'重新整理',   tier:1, price:10, description:'Reroll 費用 -1 金',
    effect:{ stat:'rerollCostReduce', value:1, target:'shop' } },
  { id:'B12', name:'免費整理',   tier:2, price:10, requires:'B11', description:'首次 Reroll 免費',
    effect:{ stat:'firstRerollFree', value:1, target:'shop' } },

  // ── Interest Cap ────────────────────────────────────────
  { id:'B13', name:'利息帳戶',   tier:1, price:10, description:'利息上限 +2（7）',
    effect:{ stat:'interestCap', value:2, target:'player' } },
  { id:'B14', name:'高利貸',     tier:2, price:10, requires:'B13', description:'利息上限 +3（10）',
    effect:{ stat:'interestCap', value:3, target:'player' } },

  // ── Consumable Slots ────────────────────────────────────
  { id:'B15', name:'捲軸擴充',   tier:1, price:10, description:'消耗品欄位 +1',
    effect:{ stat:'maxConsumables', value:1, target:'player', oneTime:true } },
  { id:'B16', name:'消耗品大師', tier:2, price:10, requires:'B15', description:'再 +1 消耗品欄位',
    effect:{ stat:'maxConsumables', value:1, target:'player', oneTime:true } },

  // ── Shield ─────────────────────────────────────────────
  { id:'B17', name:'護甲強化',   tier:1, price:10, description:'初始護盾 +10',
    effect:{ stat:'shield', value:10, target:'player', oneTime:true } },
  { id:'B18', name:'鐵壁',       tier:2, price:10, requires:'B17', description:'初始護盾 +20',
    effect:{ stat:'shield', value:20, target:'player', oneTime:true } },

  // ── HP ──────────────────────────────────────────────────
  { id:'B19', name:'生命力',     tier:1, price:10, description:'HP 上限 +15',
    effect:{ stat:'maxHp', value:15, target:'player', oneTime:true } },
  { id:'B20', name:'頑強生命',   tier:2, price:10, requires:'B19', description:'HP 上限 +25',
    effect:{ stat:'maxHp', value:25, target:'player', oneTime:true } },

  // ── Shop Info ───────────────────────────────────────────
  { id:'B21', name:'鑑定術',     tier:1, price:10, description:'商店遺物顯示完整說明',
    effect:{ stat:'shopRevealFull', value:1, target:'shop' } },
  { id:'B22', name:'預知術',     tier:2, price:10, requires:'B21', description:'提前顯示下一場 Boss 機制',
    effect:{ stat:'previewNextBoss', value:1, target:'run' } },

  // ── Pack Size ───────────────────────────────────────────
  { id:'B23', name:'卡包加大',   tier:1, price:10, description:'每個卡包 +1 張可選',
    effect:{ stat:'packExtraChoice', value:1, target:'shop' } },
  { id:'B24', name:'豪華卡包',   tier:2, price:10, requires:'B23', description:'卡包售價 -2 金',
    effect:{ stat:'packDiscount', value:2, target:'shop' } },

  // ── Rarity Boost ────────────────────────────────────────
  { id:'B25', name:'稀有提升',   tier:1, price:10, description:'稀有遺物出現率 +5%',
    effect:{ stat:'rareChance', value:5, target:'shop' } },
  { id:'B26', name:'傳奇契機',   tier:2, price:10, requires:'B25', description:'傳奇遺物出現率 +2%',
    effect:{ stat:'legendaryChance', value:2, target:'shop' } },

  // ── HP Recovery ─────────────────────────────────────────
  { id:'B27', name:'快速回復',   tier:1, price:10, description:'每場戰鬥結束回復 5 HP',
    effect:{ stat:'battleEndHeal', value:5, target:'player' } },
  { id:'B28', name:'戰場醫療',   tier:2, price:10, requires:'B27', description:'每場戰鬥結束回復 10 HP',
    effect:{ stat:'battleEndHeal', value:10, target:'player' } },

  // ── Seed ────────────────────────────────────────────────
  { id:'B29', name:'種子記憶',   tier:1, price:10, description:'結算畫面顯示本局種子碼',
    effect:{ stat:'showSeed', value:1, target:'run' } },
  { id:'B30', name:'種子控制',   tier:2, price:10, requires:'B29', description:'可在開局輸入自定種子碼',
    effect:{ stat:'customSeed', value:1, target:'run' } },

  // ── Challenge ───────────────────────────────────────────
  { id:'B31', name:'挑戰者徽章', tier:1, price:10, description:'解鎖挑戰模式入口',
    effect:{ stat:'unlockChallenge', value:1, target:'run' } },
  { id:'B32', name:'大師徽章',   tier:2, price:10, requires:'B31', description:'挑戰模式獎勵 ×2',
    effect:{ stat:'challengeRewardMult', value:2, target:'run' } },
];

/** Get blessing by ID */
export function getBlessingById(id: string): BlessingDefinition | undefined {
  return BLESSING_DEFINITIONS.find(b => b.id === id);
}

/** Get all Tier 1 blessings (for shop display) */
export function getTier1Blessings(): BlessingDefinition[] {
  return BLESSING_DEFINITIONS.filter(b => b.tier === 1);
}

/** Check if Tier 2 blessing is unlocked (player has its Tier 1 parent) */
export function isTier2Unlocked(blessingId: string, ownedIds: string[]): boolean {
  const b = getBlessingById(blessingId);
  if (!b || b.tier !== 2) return false;
  return b.requires ? ownedIds.includes(b.requires) : true;
}

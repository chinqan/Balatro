# Phase 9: 核心基礎建設規格

**負責 Agent**: 🃏 Game Designer (`balatro-game-designer`)
**核心技術**: PixiJS 8 / localStorage / IndexedDB

---

## 1. 存檔/讀檔系統 (Save/Load)

### 1.1 持久化方案

| 數據類型 | 存儲方式 | 原因 |
|---------|---------|------|
| Run 進度（單局狀態） | `localStorage` | 數據量小（<100KB），讀寫快 |
| 全局 Meta 進度（解鎖、統計） | `IndexedDB` | 數據量可能較大，支援結構化查詢 |
| 設定 | `localStorage` | 鍵值對即可 |

### 1.2 Run 狀態序列化

每次自動存檔時，序列化以下完整狀態：

```json
{
  "version": "1.0.0",
  "seed": "ABCD1234",
  "floor": 3,
  "encounter": 2,
  "player": {
    "hp": 85,
    "maxHp": 100,
    "shield": 0,
    "money": 23,
    "plays": 4,
    "discards": 3,
    "handSize": 8
  },
  "deck": {
    "drawPile": ["5S_bonus", "KH_holo", ...],
    "hand": [],
    "discardPile": ["3D", "7C_steel", ...],
    "destroyed": ["QS_glass"],
    "suitDistribution": {"spades": 10, "hearts": 18, "diamonds": 12, "clubs": 12},
    "rankDistribution": {"A": 4, "K": 5, "Q": 3, ...}
  },
  "handLevels": {
    "high_card": 1, "pair": 3, "two_pair": 1, "three_of_a_kind": 2,
    "straight": 1, "flush": 5, "full_house": 1, "four_of_a_kind": 1,
    "straight_flush": 1, "royal_flush": 1
  },
  "relics": [
    {"id": "relic_042", "order": 0, "charges": 3},
    ...
  ],
  "blessings": ["blessing_01", "blessing_15"],
  "bossState": {
    "hp": 600,
    "shield": 0,
    "mechanics": ["suit_block_hearts"],
    "nextIntent": "heavy_strike"
  },
  "stats": { ... },
  "timestamp": 1710000000000
}
```

### 1.3 自動存檔時機

| 時機 | 說明 |
|------|------|
| 每場戰鬥結束 | 勝利結算完成後 |
| 進入商店 | 商店畫面載入時 |
| 離開遊戲 | `beforeunload` 事件 |
| 手動存檔 | 暫停選單中（未來可選） |

---

## 2. 隨機種子系統 (RNG/Seed)

### 2.1 種子架構

```
主種子 (Master Seed: "ABCD1234")
  ├── 商店種子 (Shop Seed) → 決定商品內容
  ├── 卡包種子 (Pack Seed) → 決定卡包內容
  ├── Boss 種子 (Boss Seed) → 決定 Boss 機制限制
  ├── 戰利品種子 (Loot Seed) → 決定掉落物
  └── 事件種子 (Event Seed) → 決定隨機事件
```

### 2.2 PRNG 演算法

採用 **Mulberry32**（32-bit，高效且分佈均勻）：

```javascript
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
```

### 2.3 種子碼分享

- 主選單設定中可輸入種子碼（8 位英數組合）
- 結算畫面顯示本局種子碼 + 複製按鈕
- 相同種子碼 + 相同牌組 + 相同賭注 = 完全相同的 Run

---

## 3. 牌庫管理引擎 (Deck Management)

### 3.1 數據結構

```
┌─────────────┐    抽牌     ┌──────┐    出牌/棄牌    ┌─────────────┐
│  抽牌堆      │ ──────────→ │ 手牌 │ ──────────────→ │  棄牌堆      │
│  (Draw Pile) │            │(Hand)│               │(Discard Pile)│
└─────────────┘            └──────┘               └─────────────┘
       ↑                                                  │
       └──────────── 洗牌 (當抽牌堆為空) ─────────────────┘
```

### 3.2 核心操作

| 操作 | 說明 | 觸發時機 |
|------|------|---------|
| 洗牌 (Shuffle) | Fisher-Yates 演算法，使用牌庫專用子種子 | 抽牌堆為空時 |
| 抽牌 (Draw) | 從抽牌堆頂部取 N 張至手牌 | 每回合開始 |
| 出牌 (Play) | 從手牌移至結算區 → 結算後移至棄牌堆 | 玩家確認出牌 |
| 棄牌 (Discard) | 從手牌直接移至棄牌堆 | 玩家確認棄牌 |
| 刪牌 (Remove) | 從牌庫永久移除（壓縮） | 捲軸效果 |
| 加牌 (Add) | 加入新牌至棄牌堆（膨脹） | 商店購買/契約效果 |
| 增強 (Enhance) | 修改卡牌屬性（不移動位置） | 捲軸/契約效果 |

### 3.3 卡牌狀態追蹤

每張撲克牌攜帶以下可變狀態：

```json
{
  "id": "KH",
  "suit": "hearts",
  "rank": 13,
  "enhancement": "glass",
  "edition": "holographic",
  "seal": "red",
  "chipBonus": 0,
  "isDebuffed": false
}
```

---

## 4. 統計數據追蹤 (Statistics)

### 4.1 單局數據 (Per-Run Stats)

| 指標 | 說明 | 用途 |
|------|------|------|
| 最高單次傷害 | 單次出牌的最大傷害值 | 結算畫面展示 |
| 總造成傷害 | 本局累計傷害 | 結算畫面展示 |
| 最長連擊 | 單次結算中觸發的最多效果數 | 成就條件 |
| 使用最多牌型 | 出牌次數最多的牌型 | 結算畫面展示 |
| 擊殺 Boss 數 | 本局擊敗的 Boss 數量 | 結算 + 解鎖條件 |
| 金錢收入/支出 | 經濟流水 | 平衡性分析 |
| 最終樓層 | Run 結束時的樓層 | 結算畫面展示 |

### 4.2 全局數據 (Global Stats)

| 指標 | 說明 | 存儲位置 |
|------|------|---------|
| 總 Run 次數 | 玩家進行的總局數 | IndexedDB |
| 勝率 | 通關次數 / 總次數 | IndexedDB |
| 最高難度通關 | 最高賭注等級通關紀錄 | IndexedDB |
| 每種遺物使用次數 | 各遺物被購買的次數 | IndexedDB |
| 神器發現率 | 已遇到 / 總數 | IndexedDB |

### 4.3 數據流向

```
單局數據 ──→ 結算畫面（展示）
          ──→ 全局數據（累加）
          ──→ 解鎖系統（觸發條件檢查）
          ──→ 收藏庫（更新發現狀態）
```

# Boss-Attack Roguelike — 程式開發實作計劃

## 專案概覽

基於 [GDD 規格書](file:///Users/chinqan-mac/Balatro/docs/gdd/) 開始實作 Boss-Attack Roguelike 牌組構築遊戲。技術棧：**Vite + TypeScript + PixiJS 8 + Web Audio API**。

本計劃採用 **Sprint 制**，先建立核心遊戲邏輯（純數據層、無 UI），再逐步疊加渲染與互動層。

> [!IMPORTANT]
> **Sprint 0 + Sprint 1** 為本次首批實作範圍。完成後提交驗證，通過後再進入 Sprint 2。

---

## 開發策略

| 原則 | 說明 |
|------|------|
| **邏輯與渲染分離** | `core/` 與 `systems/` 不依賴 PixiJS，純 TypeScript 邏輯可單元測試 |
| **數據驅動** | 所有卡牌、Boss、遺物定義在 `data/` 目錄，程式碼讀取定義而非硬編碼 |
| **程序化佔位圖** | 原型期使用 `PIXI.Graphics` + `PIXI.Text` 繪製所有實體，無需美術資源 |
| **固定時間步長** | 採用 pixi-vector-arcade 的 Fixed Timestep 模式，確保結算一致性 |
| **物件池** | 傷害數字、粒子等高頻物件採用 Pool 模式，避免 GC 停頓 |

---

## 📁 專案目錄結構

```
/Users/chinqan-mac/Balatro/
├── src/
│   ├── index.ts                  # 入口：初始化 PixiJS Application
│   ├── game.ts                   # Game 類：場景調度、主迴圈
│   │
│   ├── core/                     # 引擎層（不依賴 PixiJS）
│   │   ├── clock.ts              # 遊戲時鐘 + 慢動作/暫停
│   │   ├── rng.ts                # Mulberry32 PRNG + 子種子派生
│   │   ├── pool.ts               # 泛型物件池
│   │   ├── event-bus.ts          # 遊戲事件匯流排（發佈/訂閱）
│   │   └── state-machine.ts      # 通用有限狀態機
│   │
│   ├── models/                   # 遊戲數據模型（純資料結構）
│   │   ├── card.ts               # 撲克牌：花色、點數、增強、版本、封印
│   │   ├── deck.ts               # 牌庫：抽牌堆、手牌、棄牌堆
│   │   ├── relic.ts              # 遺物數據結構
│   │   ├── boss.ts               # Boss 數據結構
│   │   ├── player.ts             # 玩家狀態 (HP, Shield, Money, etc.)
│   │   └── run-state.ts          # 整局 Run 的完整狀態
│   │
│   ├── systems/                  # 遊戲邏輯系統（操作 models）
│   │   ├── hand-evaluator.ts     # 撲克牌型判定（10 種牌型）
│   │   ├── damage-calculator.ts  # 四階段傷害結算引擎
│   │   ├── deck-manager.ts       # 洗牌/抽牌/棄牌/刪牌/加牌
│   │   ├── battle-manager.ts     # 戰鬥回合狀態機
│   │   ├── shop-manager.ts       # 商店邏輯
│   │   ├── boss-ai.ts            # Boss 意圖選擇 + 攻擊執行
│   │   └── relic-resolver.ts     # 遺物效果結算（由左至右）
│   │
│   ├── data/                     # 靜態遊戲數據定義
│   │   ├── hand-types.ts         # 10 種牌型基礎值 + 升級曲線
│   │   ├── enhancements.ts       # 7 種增強效果定義
│   │   ├── editions.ts           # 4 種版本效果定義
│   │   ├── seals.ts              # 4 種封印效果定義
│   │   ├── bosses.ts             # 8 個 Boss 定義（HP、攻擊模式、機制限制）
│   │   ├── relics/               # 150 神器分卷定義
│   │   ├── consumables.ts        # 捲軸(22)+靈藥(12)+契約(18)
│   │   └── config.ts             # 全局配置常量
│   │
│   ├── rendering/                # PixiJS 渲染層
│   │   ├── layers.ts             # Container 層級管理
│   │   ├── viewport.ts           # 全畫面自適應縮放
│   │   ├── card-renderer.ts      # 卡牌程序化繪製
│   │   ├── boss-renderer.ts      # Boss 程序化繪製
│   │   ├── damage-number.ts      # 傷害數字噴射（含物件池）
│   │   ├── particles.ts          # 粒子系統
│   │   └── shaders/              # GLSL Shader 文件
│   │
│   ├── audio/                    # Web Audio API
│   │   ├── audio-manager.ts      # 匯流排 + DynamicsCompressor
│   │   ├── sfx.ts                # 音效觸發 + Pitch Shifting
│   │   └── music.ts              # Stem 動態音樂
│   │
│   ├── scenes/                   # 場景/畫面
│   │   ├── scene-manager.ts      # 場景調度
│   │   ├── title-scene.ts        # 主選單
│   │   ├── battle-scene.ts       # 戰鬥畫面
│   │   ├── shop-scene.ts         # 商店畫面
│   │   ├── map-scene.ts          # 地城地圖
│   │   └── result-scene.ts       # 結算畫面
│   │
│   ├── ui/                       # UI 元件
│   │   ├── hp-bar.ts             # HP/Shield 條
│   │   ├── hand-display.ts       # 手牌展示區
│   │   ├── relic-bar.ts          # 遺物欄
│   │   └── hud.ts                # 底部 HUD (金錢、出牌次數等)
│   │
│   └── types/                    # TypeScript 型別宣告
│       └── index.ts              # 共用介面與列舉
│
├── public/                       # 靜態資源
│   └── index.html
│
├── tests/                        # 單元測試
│   ├── hand-evaluator.test.ts
│   ├── damage-calculator.test.ts
│   ├── deck-manager.test.ts
│   └── rng.test.ts
│
├── docs/                         # 設計文件（已有）
│   ├── gdd/
│   └── plan/
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Sprint 0: 專案腳手架與核心基建

### [NEW] [package.json](file:///Users/chinqan-mac/Balatro/package.json)
- 使用 `npm create vite@latest ./ -- --template vanilla-ts` 建立專案
- 安裝依賴：`pixi.js@^8.6.6`, `@pixi/layout@^2.0.0`
- 開發依賴：`vitest`, `typescript`, `eslint`

### [NEW] [src/index.ts](file:///Users/chinqan-mac/Balatro/src/index.ts)
- 初始化 `PIXI.Application`（`await app.init({ resizeTo: window, backgroundColor: 0x0a0a0a })`）
- 將 Canvas 掛載至 DOM
- 建立 `Game` 實例並啟動主迴圈

### [NEW] [src/game.ts](file:///Users/chinqan-mac/Balatro/src/game.ts)
- `Game` 類：持有 Clock、SceneManager、AudioManager
- Fixed Timestep 主迴圈（60Hz 物理 tick + 渲染插值）
- 暫停/恢復/慢動作支援

### [NEW] [src/core/clock.ts](file:///Users/chinqan-mac/Balatro/src/core/clock.ts)
- `Clock` 介面：`elapsed`, `delta`, `scale`, `wallDelta`
- `ClockController`：`pause()`, `resume()`, `setScale()`, `step()`

### [NEW] [src/core/rng.ts](file:///Users/chinqan-mac/Balatro/src/core/rng.ts)
- `Mulberry32` PRNG 實作（來自 GDD Phase 9 §2.2）
- `SeedManager`：主種子 → 派生子種子（shop, pack, boss, loot, event）
- `hashSeed(str)` 將英數字串轉為 32-bit 種子

### [NEW] [src/core/pool.ts](file:///Users/chinqan-mac/Balatro/src/core/pool.ts)
- 泛型 `ObjectPool<T>`：`acquire()`, `release()`, `prewarm()`
- `factory`, `reset`, `dispose` 回調
- 參照 pixi-vector-arcade SKILL.md 的 Pool 規範

### [NEW] [src/core/event-bus.ts](file:///Users/chinqan-mac/Balatro/src/core/event-bus.ts)
- 簡易的發佈/訂閱事件系統
- 型別安全的事件名稱與 payload
- 用於解耦「邏輯層 → 渲染層」的通訊（例如 `'damage_dealt'`, `'card_played'`）

### [NEW] [src/core/state-machine.ts](file:///Users/chinqan-mac/Balatro/src/core/state-machine.ts)
- 泛型有限狀態機：`StateMachine<StateType>`
- `onEnter()`, `onUpdate()`, `onExit()` 生命週期
- 用於 Battle 流程（PlayerTurn → Settlement → BossTurn → NextRound）

### [NEW] [src/audio/audio-manager.ts](file:///Users/chinqan-mac/Balatro/src/audio/audio-manager.ts)
- `AudioContext` 初始化（含 iOS Safari `resume()` 處理）
- 3 條匯流排：`sfxBus`, `musicBus`, `uiBus`
- `DynamicsCompressor` 插入主輸出前（防爆音）
- 各匯流排 `GainNode` 獨立音量控制

### [NEW] [src/scenes/scene-manager.ts](file:///Users/chinqan-mac/Balatro/src/scenes/scene-manager.ts)
- `Scene` 介面：`init()`, `update()`, `destroy()`
- `SceneManager`：`switchTo(sceneName)`，處理過場動畫
- 場景生命週期管理（進場、退場、資源釋放）

---

## Sprint 1: 牌庫引擎 + 傷害計算

### [NEW] [src/types/index.ts](file:///Users/chinqan-mac/Balatro/src/types/index.ts)
- `Suit` 列舉：`spades | hearts | diamonds | clubs`
- `Rank` 列舉：`2-14` (2-A)
- `Enhancement` 列舉：7 種增強
- `Edition` 列舉：4 種版本
- `Seal` 列舉：4 種封印
- `HandType` 列舉：10 種牌型
- `RelicType`, `BossIntentType` 等共用型別

### [NEW] [src/models/card.ts](file:///Users/chinqan-mac/Balatro/src/models/card.ts)
- `Card` 介面：`{ id, suit, rank, enhancement?, edition?, seal?, chipBonus, isDebuffed }`
- `createStandardDeck()` 工廠函式：產生 52 張標準牌
- 面值 → ATK 對照表（2→2, ..., K→10, A→11）

### [NEW] [src/models/deck.ts](file:///Users/chinqan-mac/Balatro/src/models/deck.ts)
- `DeckState` 介面：`drawPile`, `hand`, `discardPile`, `destroyed`
- 花色/點數分佈計算器

### [NEW] [src/systems/deck-manager.ts](file:///Users/chinqan-mac/Balatro/src/systems/deck-manager.ts)
- `DeckManager` 類：
  - `shuffle(rng)` — Fisher-Yates 演算法
  - `draw(n)` — 抽 n 張到手牌（堆空時自動洗牌）
  - `playCards(indices)` — 從手牌移到結算區
  - `discardCards(indices)` — 從手牌移到棄牌堆
  - `removeCard(id)` — 永久刪除（牌庫壓縮）
  - `addCard(card)` — 加入棄牌堆（牌庫膨脹）
  - `getSuitDistribution()` / `getRankDistribution()`

### [NEW] [src/data/hand-types.ts](file:///Users/chinqan-mac/Balatro/src/data/hand-types.ts)
- 10 種牌型的 `{ baseATK, baseDMG, levelUpATK, levelUpDMG }` 表
- 嚴格對應 GDD Phase 1 §1.3 的數值

### [NEW] [src/systems/hand-evaluator.ts](file:///Users/chinqan-mac/Balatro/src/systems/hand-evaluator.ts)
- `evaluateHand(cards: Card[]): HandResult`
- 回傳 `{ handType, scoringCards, baseATK, baseDMG }`
- 判定優先級：Royal Flush > Straight Flush > Four of a Kind > ... > High Card
- 處理萬能牌 (Wild Card) — 同時計算所有花色

### [NEW] [src/data/enhancements.ts](file:///Users/chinqan-mac/Balatro/src/data/enhancements.ts)
- 7 種增強效果的定義與觸發邏輯

### [NEW] [src/data/editions.ts](file:///Users/chinqan-mac/Balatro/src/data/editions.ts)
- 4 種版本效果的定義

### [NEW] [src/data/seals.ts](file:///Users/chinqan-mac/Balatro/src/data/seals.ts)
- 4 種封印效果的定義

### [NEW] [src/systems/damage-calculator.ts](file:///Users/chinqan-mac/Balatro/src/systems/damage-calculator.ts)
- `DamageCalculator` 類：四階段結算主引擎
  - **Phase 1 — 起手式**：判定牌型 → 設定基礎 ATK/DMG（含等級加成）
  - **Phase 2 — 連擊**：由左至右逐張牌，加面值 ATK → 觸發增強 → 觸發版本 → 觸發封印
  - **Phase 3 — 被動光環**：結算手中未打出的牌效果（鋼鐵牌 ×1.5）
  - **Phase 4 — 神器追擊**：由左至右結算所有遺物
- 回傳 `SettlementResult`：`{ finalDamage, steps[], shieldGenerated }`
- `steps[]` 記錄每一步的計算過程（供動畫回放使用）

### [NEW] [src/data/config.ts](file:///Users/chinqan-mac/Balatro/src/data/config.ts)
- 全局常量：`INITIAL_HP = 100`, `INITIAL_PLAYS = 4`, `INITIAL_DISCARDS = 3`, `HAND_SIZE = 8`, `MAX_RELIC_SLOTS = 8`, `SHIELD_HARD_CAP = 100` 等

---

## User Review Required

> [!IMPORTANT]
> **開發策略決策**：本計劃採用「邏輯先行、渲染後接」策略。Sprint 0 + 1 完成後，遊戲的核心邏輯（出牌 → 判定 → 結算 → 傷害）已可用單元測試完整驗證，但**尚無畫面**。Sprint 2 起才接入 PixiJS 渲染。此策略的優點是確保核心數學模型正確後再做視覺化。

> [!WARNING]
> **後續 Sprint (2-5+) 不在本次實作範圍**。每個 Sprint 完成並驗證後，會再提交下一階段的計劃。

---

## Verification Plan

### 自動化測試（Vitest）

所有測試命令：
```bash
cd /Users/chinqan-mac/Balatro && npx vitest run
```

#### [NEW] tests/rng.test.ts
- **可復現性**：同一種子產生完全相同的數列
- **子種子獨立性**：不同子種子產生不同數列
- **分佈均勻性**：10000 次調用的值在 [0, 1) 範圍中合理分佈

#### [NEW] tests/hand-evaluator.test.ts
- **10 種牌型正確判定**：為每種牌型（High Card 到 Royal Flush）提供至少 1 組測資
- **優先級正確性**：同時滿足多種牌型時（如 Full House 的牌也包含 Pair），回傳最高優先級
- **萬能牌處理**：帶有 Wild 增強的牌能正確匹配所有花色

#### [NEW] tests/damage-calculator.test.ts
- **基礎傷害公式**：打出 Pair (Lv.1) + 兩張面值 K = `(10 + 10 + 10) × 2 = 60`
- **增強效果**：包含 Bonus 牌 (+30 ATK) 的計算
- **版本效果**：包含 Foil (+50 ATK) 和 Polychrome (×1.5 DMG) 的計算
- **被動光環**：手中持有鋼鐵牌提供 ×1.5 DMG 的計算
- **結算步驟記錄**：`steps[]` 陣列正確記錄每一步

#### [NEW] tests/deck-manager.test.ts
- **洗牌 (Fisher-Yates)**：同一 RNG 種子洗牌結果一致
- **抽牌**：抽到手牌後 drawPile 數量正確減少
- **自動洗牌**：drawPile 不足時，discardPile 自動洗入 drawPile
- **壓縮/膨脹**：`removeCard()` 和 `addCard()` 正確改變牌庫組成
- **分佈統計**：`getSuitDistribution()` 正確計算四花色數量

### 手動驗證（Sprint 3 後）

由於 Sprint 0 + 1 沒有 UI，驗證完全依賴上述自動化測試。Sprint 3 加入 PixiJS 渲染後，將新增以下手動驗證項目：
- 在瀏覽器中啟動 `npm run dev`，確認卡牌渲染正確
- 點擊卡牌選取/取消選取
- 按出牌按鈕觸發結算動畫

---
description: 製作 Boss-Attack Roguelike 牌組構築遊戲完整規格書的工作流 — 調用 8 個 Agent 協同完成從核心戰鬥引擎到視覺/音頻/敘事的全方位設計文件
---

# Boss-Attack 牌組構築 RPG 規格書實作工作流

這個工作流結合 **8 位專業 Agent** 與 **NotebookLM「Balatro設計原理」筆記**，為一款「將撲克計分轉化為 Boss 戰傷害」的 Roguelike 牌組構築遊戲，產出完整的遊戲製作規格書。

## 🎯 核心設計轉換

```
Balatro                         →  Boss-Attack RPG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
分數 = Chips × Mult             →  傷害 = 基礎攻擊力 × 傷害倍率
目標分數門檻                     →  Boss HP 條
出牌次數耗盡=失敗                →  玩家 HP 歸零=失敗
盲注（小/大/Boss）               →  地城層級（普通怪/菁英怪/Boss）
小丑牌                           →  遺物/神器
跳過盲注=標籤                    →  潛行繞路=寶箱
四階段結算                       →  起手式→連擊→光環→神器追擊
技術棧架構                       →  PixiJS 8 + Web Audio API + GLSL
```

## 🧠 八大 Agent 分工

| # | Agent | Skill | 職責範圍 |
|---|-------|-------|---------|
| 1 | 🃏 Game Designer | `balatro-game-designer` | 戰鬥引擎、卡牌/遺物系統、攻防公式、風險框架 |
| 2 | 🎰 Level Designer | `balatro-level-designer` | 地城結構、Boss HP 曲線、Boss 攻擊模式、商店經濟 |
| 3 | 🎭 Narrative Designer | `balatro-narrative-designer` | 世界觀氛圍、卡牌/Boss 命名、極簡文案 |
| 4 | ✨ UI Designer | `balatro-ui-designer` | 戰鬥介面、HP 條、傷害 Juice、視覺設計系統 |
| 5 | 🧩 UX Architect | `balatro-ux-architect` | 攻防決策流程、資訊架構、心流/懸念 |
| 6 | 🔧 Technical Artist | `balatro-tech-artist` | Shader、物理動畫、CRT、效能預算 |
| 7 | 🔊 Audio Engineer | `balatro-audio-engineer` | Pitch Shifting、動態音樂、攻擊/防禦音效 |
| 8 | 🧩 UX Architect (驗證) | `balatro-ux-architect` | 跨系統認知連結、無障礙驗證 |

## 📁 目錄結構

```
docs/
├── plan/                              ← 專案管理文件
│   ├── implementation_plan.md         ← 製作計劃（總綱、技術棧、Phase 定義）
│   ├── boss-attack-design-workflow.md ← 本工作流文件
│   └── task.md                        ← 進度追蹤清單
│
└── gdd/                               ← 遊戲設計規格書（GDD）
    ├── phase1_boss_attack_engine.md   ← 核心戰鬥引擎
    ├── phase2_boss_attack_level.md    ← 關卡進程與經濟
    ├── phase3_boss_attack_narrative.md← 世界觀與敘事
    ├── phase4_boss_attack_uiux.md     ← 介面與體驗設計
    ├── phase5_boss_attack_techaudio.md← 技術美術與音頻
    ├── phase6_boss_attack_final.md    ← 跨系統驗證
    ├── phase8_game_flow.md            ← 遊戲流程與畫面
    ├── phase9_infrastructure.md       ← 核心基礎建設
    ├── phase10_meta_progression.md    ← 局外進度與耐玩性
    ├── registry_relics_part1.md       ← 神器 #001-050
    ├── registry_relics_part2.md       ← 神器 #051-100
    ├── registry_relics_part3.md       ← 神器 #101-150
    ├── registry_consumables.md        ← 捲軸(22)+靈藥(12)+契約(18)
    └── registry_blessings.md          ← 永久加持(32)
```

---

## 📋 執行步驟

> **每個步驟開始前**：先 `view_file` 對應的 `SKILL.md`，確保 Agent 角色正確切入。
> **查詢設計原理**：使用 `mcp_notebooklm_ask_question` 查詢「Balatro設計原理」筆記中的具體案例。
> **品質關卡**：每個 Phase 完成後，必須通過以下 4 道品質關卡再進入下一 Phase。

### 🛡️ 品質關卡 (Quality Gates)

每個 Phase 完成後，Agent 必須逐項檢查以下 4 道關卡。未通過的項目必須修正後才能進入下一 Phase。

#### Gate 1: 預設行為定義 (Default Behavior)
> 每個新系統/機制必須回答：「沒有任何修改時，它的行為是什麼？」

- [ ] 所有資源（護盾、Buff、Debuff）是否定義了**預設持續時間**？（每回合清零？持續到觸發？永久？）
- [ ] 遊戲開始時（Run 開始、Floor 開始、回合開始）的**初始狀態**是否明確？
- [ ] Boss 的首次行動（第一回合）是否有定義？（玩家還沒有「上一回合」可參考時怎麼辦？）

#### Gate 2: 邊界值與硬上限 (Boundary Values)
> 所有數值欄位必須定義「最小值 / 最大值 / 硬上限」。

- [ ] 所有可疊加的欄位（遺物欄、消耗品欄、手牌上限）是否都有**硬上限**？
- [ ] 多個來源疊加後是否可能「突破上限」？若有，是否已加入 clamp？
- [ ] 概率型效果是否定義了 `0%` 和 `100%` 時的邊界行為？

#### Gate 3: 完整枚舉 (Exhaustive Enumeration)
> 引入一組類型時，必須**列舉所有子類型**並為每一個定義效果。

- [ ] 引入的分類系統（增強、版本、封印、牌型、卡包）是否**每一種都有完整定義**？
- [ ] 數值表（面值、等級提升）是否覆蓋**所有數值範圍**（2-A、Level 1-10）？
- [ ] 商品/消耗品是否定義了**內容物與價格**？

#### Gate 4: 跨文件一致性 (Cross-File Consistency)
> 同一概念在不同文件中的**命名、數值、措辭**必須完全一致。

- [ ] 同一實體的名稱是否在所有文件中統一？（例如 Boss 名稱只能有一種寫法）
- [ ] 位置描述（「最左邊」「最右邊」）在考慮反轉效果後是否仍然正確？應使用**「結算順序中的第一個/最後一個」**
- [ ] 不同 Phase 中引用的同一數值（遺物欄上限、出牌次數等）是否一致？
- [ ] 攻擊力/傷害等數值是否區分了不同模式（普攻 vs 技能 vs AOE）？

### Phase 1: 核心戰鬥引擎與卡牌系統
**Agent**: 🃏 Game Designer
**查詢 NotebookLM**: 計分引擎、小丑牌機制、風險/回報

1. **戰鬥引擎規格書** — 定義傷害公式 `傷害 = Base ATK × DMG Mult`、四階段結算流程（起手式→連擊→光環→神器追擊）、攻防回合制、Boss HP/護盾、玩家 HP/護盾/回復、消耗品使用規則（免費動作/使用時機/目標選擇/三種差異）
2. **卡牌系統規格** — 定義 234 張卡牌/遺物總量分配（150神器/22捲軸/12靈藥/18契約/32加持）、七大機制類型基礎規範、消耗品獲取管道彙整（商店/卡包/封印/遺物/標籤）。
3. **遺物系統規格** — 設計遺物欄位排版、分類（攻擊/防禦/經濟/功能/重觸發）、由左至右結算規則
4. **風險與報酬框架** — 五種風險模型：概率自毀、資源犧牲、條件鎖定、貪婪連鎖、HP 賭博
5. **牌庫組成追蹤與觀察系統** — 牌庫動態變化機制（花色轉換/壓縮/複製/同質化對機率影響）、Deck Viewer UI（花色分佈/點數分佈/卡牌縮圖/篩選花色/操作互動）、Run Info 3 分頁（牌型等級/本局統計/遺物一覽+操作互動）、觀察介面動畫規格

### Phase 2: 關卡進程與經濟設計
**Agent**: 🎰 Level Designer
**查詢 NotebookLM**: 底注膨脹、Boss 盲注、商店經濟

5. **地城結構與 Boss HP 曲線** — 設計地城層級（普通怪→菁英怪→Boss）、HP 指數成長曲線、Run 戲劇弧線
6. **Boss 設計矩陣** — 設計 Boss 攻擊模式（普攻/AOE/Debuff/護盾）、機制限制（封鎖花色/牌型/行動）、反制策略
7. **商店、跳過與經濟** — 戰利品+商店循環、利息機制、跳過（潛行岔路）的風險/收益、戰利品掉落表
8. **賭注難度分層** — 8 層疊加難度，每層針對不同舒適區（經濟/攻擊/防禦/操作）

### Phase 3: 世界觀與敘事設計
**Agent**: 🎭 Narrative Designer
**查詢 NotebookLM**: 命名隱喻、Boss 擬人化、氛圍

9. **氛圍定位** — 一句話世界觀、視覺/聽覺/觸覺三要素、風格紅線
10. **卡牌命名隱喻系統** — 為代表卡牌設計命名（歷史/科學/機制擬人）、消耗品主題
11. **Boss 擬人化** — Boss 命名+視覺意象（「The + 具體名詞」格式）
12. **極簡文案指南** — 字數限制、色彩即語法、機械化語氣

### Phase 4: 介面與體驗設計
**Agent**: ✨ UI Designer + 🧩 UX Architect

13. **戰鬥介面佈局** — Boss HP 條位置、玩家 HP 條、遺物欄、消耗品欄位（遺物欄右側）、手牌、Boss 攻擊意圖預覽
14. **視覺設計系統** — 色彩（ATK=藍/DMG=紅/Shield=綠/$=金）、稀有度、版本 Shader
15. **戰鬥動畫 Juice** — 傷害演出時間軸、Boss 受擊動畫分級、火焰/爆炸門檻、防禦格擋特效、消耗品使用動畫時間軸
16. **決策流程地圖** — 攻防決策循環（觀察Boss意圖→選牌→攻/防→排版→執行→見證）
17. **心流與再來一局** — Boss擊敗勝利演出、死亡≤5秒重啟、懸念（不預覽傷害值）

### Phase 5: 技術美術與音頻
**Agent**: 🔧 Technical Artist + 🔊 Audio Engineer

182. **PixiJS Shader 技術規格** — 利用 `PIXI.Filter` 實作傷害特效、Boss 受擊、卡牌版本（閃箔/全像/負片）、CRT 後處理
83. **程序化動畫與效能** — `PIXI.Container` 物理彈簧動畫、物件池 (Object Pooling) 管理大量傷害數字、60 FPS 效能預算
84. **音頻架構 + Pitch Shifting** — Web Audio API 實作 AudioManager、計分連鎖 Pitch 公式、防爆音拓撲
85. **動態音樂 + 音畫同步** — 5 Stem 場景矩陣（Boss HP<20%=高潮模式）、幀級同步規格

### Phase 6: 跨系統驗證與彙整
**Agent**: 全 Agent 協同

22. **極端推演** — 最高難度 Boss 的破局策略、效能壓力測試規格、認知負荷評估
23. **無障礙規格** — 色弱/減少動態/行動端退化/Safari 音頻兼容
92. **Master GDD 彙整** — 19 章節 + 術語表 + 快速參考卡

### Phase 7: 完整卡牌與遺物註冊表
**Agent**: 🃏 Game Designer + 🎰 Level Designer

93. **全量規格撰寫** — 為 234 項特殊卡牌/遺物撰寫獨立規格（150神器/22捲軸/12靈藥/18契約/32加持）。
94. **分卷管理** — 依照 ID 與類別進行文件分拆，確保開發讀取效能。

### Phase 8: 遊戲流程與畫面操作規格
**Agent**: ✨ UI Designer + 🧩 UX Architect

95. **畫面流程圖** — 繪製完整的遊戲狀態轉換圖（主選單→難度選擇→地城地圖→戰鬥→商店→結算→重啟）、過場動畫規格
96. **主選單與進入遊戲** — Title Screen 按鈕佈局、難度選擇互動、地城地圖 ASCII 佈局（垂直路徑 Floor 1→8 + 7 種節點）+跳過確認彈窗+標籤/寶箱岔路獎勵+Boss 預覽面板（HP/機制限制/反制提示）
97. **戰鬥中操作細節** — 手牌選取/切換排序、消耗品使用（點擊/選目標/免費）、遺物排版、Boss 意圖查看、商店（ASCII佈局/操作表/Reroll遞增/購買限制）、特殊卡牌獲取與選擇面板（卡包開啟/戰鬥獲取 ASCII 佈局+選擇操作+滿位替換/售出機制）
98. **結算與重啟畫面** — 勝利結算 ASCII 佈局+獎勵揀取操作+動畫時間軸、失敗結算 ASCII 佈局+統計逐項淡入+新紀錄/解鎖、全通關 ASCII 佈局+種子碼複製+解鎖翻面動畫、≤5秒快速重啟
99. **輔助畫面** — 暫停/設定、收藏庫/圖鑑瀏覽與篩選、新手分步教學（可跳過）

> **跨 Phase 補充 — 卡牌視覺狀態分層 (Card VFX Layering)**
> - Phase 4 新增步驟：定義 5 層視覺疊加規則（增強底紋→版本Shader→封印圖標→觸發動畫），含渲染優先順序。
> - Phase 7 註冊表擴充：每張卡牌新增 `trigger_vfx`、`trigger_sfx_id`、`destroy_anim`、`edition_shader` 欄位。

### Phase 9: 核心基礎建設規格
**Agent**: 🃏 Game Designer

100. **存檔/讀檔系統** — 持久化方案（localStorage/IndexedDB）、Run 狀態序列化、自動存檔觸發時機
101. **隨機種子系統** — 主種子→子種子架構、PRNG 演算法選擇、種子碼分享與 Bug 復現
102. **牌庫管理引擎** — 抽牌/手牌/棄牌堆狀態機、洗牌演算法（Fisher-Yates）、刪牌/加牌/增強追蹤
103. **統計數據追蹤** — 單局/全局數據記錄規格、數據餵入結算畫面與收藏庫的流向

### Phase 10: 局外進度與耐玩性
**Agent**: 🃏 Game Designer + 🎰 Level Designer

104. **局外解鎖系統** — 解鎖層級與條件、收藏庫進度視覺化
105. **起始牌組多樣性** — 15+ 種起始牌組設計、各自策略偏向與解鎖條件
106. **挑戰與成就系統** — 20 種特殊規則挑戰模式、成就觸發與獎勵
107. **平衡性測試框架** — 數值模擬規範、破局檢測閾值、回歸測試流程

---

## 🔗 Agent 依賴關係

```
Phase 1 (Game Designer) ───────────────────┐
    │ 傷害公式/卡牌/遺物                    │
    ▼                                       ▼
Phase 2 (Level Designer)            Phase 3 (Narrative)
    │ Boss矩陣/經濟                         │ 命名/氛圍
    └───────────┬──────────────────────────┘
                ▼
        Phase 4 (UI + UX) ─────────────┐
                │ 介面/Juice/VFX分層    │
                ▼                       │
        Phase 5 (Tech + Audio)         │
                │                       │
                ▼                       ▼
        Phase 7 (Registry)      Phase 8 (Game Flow)
          需要 Phase 1 機制       需要 Phase 4 佈局
          + Phase 4 VFX 欄位      + Phase 2 地城結構
                │                       │
                └───────────┬──────────┘
                            ▼
                    Phase 9 (Infrastructure)
                      需要 Phase 7 牌庫結構
                      + Phase 8 存檔時機
                            │
                            ▼
                    Phase 10 (Meta-Progression)
                      需要 Phase 9 統計/存檔
                      + Phase 7 解鎖內容
                            │
                            ▼
                    Phase 6 (全Agent驗證)
                            ▼
                       Master GDD
```

---

## ⚡ 快速啟動

```
開始執行 Boss-Attack RPG 規格書工作流，從 Phase [N] 開始
```

或針對特定系統的深度設計：

```
請用 Game Designer 的視角，設計本遊戲的戰鬥引擎規格書，
核心轉換是把 Balatro 的 Chips×Mult 改為 BaseATK×DMGMult 對 Boss 造成傷害
```

---
description: 製作 Balatro 遊戲完整規格書的工作流 — 調用 8 個 Agent 協同完成從核心機制到視覺/音頻/敘事的全方位設計文件
---

# Balatro 完整規格書實作工作流 (Full Design Specs Workflow)

這個工作流結合 **8 位專業 Agent** 與 **NotebookLM「Balatro設計原理」筆記**，將《Balatro》的底層設計到外層表現組合成一套完整的遊戲設計文件群。

## 🧠 八大 Agent 的設計領域比對

在開始實作前，必須先釐清八位 Agent 的分工邊界與協作關係：

| # | Agent 名稱 | Skill 路徑 | 核心關注點 | 掌控的交付物 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Game Designer** | `balatro-game-designer` | 計分引擎、卡牌機制矩陣、風險/回報框架、數值平衡 | 計分引擎規格書、卡牌規格文件 (MDD)、難度曲線數值表 |
| 2 | **Level Designer** | `balatro-level-designer` | 底注膨脹曲線、Boss 盲注生態、商店經濟迴圈、賭注難度 | Run 結構書、Boss 設計矩陣、商店經濟書、賭注分層書 |
| 3 | **UI Designer** | `balatro-ui-designer` | 卡牌視覺語言、計分動畫 Juice、介面佈局、CRT 美學 | 視覺設計系統、卡牌視覺語言書、Juice 規格書、佈局規格書 |
| 4 | **UX Architect** | `balatro-ux-architect` | 資訊架構、認知負荷管理、決策流程、心流懸念、再來一局 | 決策流程地圖、資訊架構書、認知負荷策略、心流規格書 |
| 5 | **Technical Artist** | `balatro-tech-artist` | GLSL Shader、程序化動畫、CRT 後處理、WebGL 效能 | Shader 規格書、物理動畫系統、CRT 管線書、效能預算表 |
| 6 | **Audio Engineer** | `balatro-audio-engineer` | Pitch Shifting、動態 Stem 音樂、音畫同步、防爆音 | AudioManager 架構、Pitch 系統書、動態音樂書、音效矩陣 |
| 7 | **Narrative Designer** | `balatro-narrative-designer` | 無對白世界觀、卡牌命名隱喻、Boss 擬人化、極簡文案 | 氛圍定位文件、命名隱喻系統、Boss 擬人化矩陣、文案指南 |
| 8 | **UX Architect (驗證)** | `balatro-ux-architect` | 跨系統認知連結、決策疲勞預防、行為心理學驗證 | 跨系統驗證報告、無障礙審計 |

---

## 📋 規格書實作工作流 (Workflow Steps)

依照以下 **6 個階段**，透過提示詞調用對應的 Agent 產出各區塊內容，最終彙整成完整規格書。

> **重要**：每個階段開始前，請先讀取對應的 Skill 檔案（`view_file` 對應的 `SKILL.md`），確保 Agent 角色正確切入。
> 每個步驟都應參考 NotebookLM「Balatro設計原理」筆記中的具體案例與數據。

---

### Phase 1: 核心引擎與機制定義 (Game Designer)

**調用 Agent**: 🃏 Game Designer (`balatro-game-designer/SKILL.md`)
**參考資料**: NotebookLM — 計分引擎、小丑牌機制

在此階段確立遊戲的「物理法則」，確保底層微觀機制穩定。

1. **定義計分引擎 (Scoring Engine)**
   - 確立四階段結算流程（基礎牌型 → 打出的牌 → 手中的牌 → 小丑牌）
   - 定義 +Chips, +Mult, ×Mult 的計算先後順序與排版黃金法則
   - 建立基準數值表：每種牌型的基礎 Chips 與 Mult

2. **制定卡牌機制矩陣 (Card Matrix)**
   - 列出六大機制類型（+C, +M, ×M, $$, FX, RT）並給予前期/後期價值評估
   - 納入代表性小丑（大麥克、吸血鬼、特技演員、尤里克、藍圖、啞劇者、男爵、費波那契、懸吊查德、DNA）作為設計範本
   - 為每張代表性小丑填寫完整的「卡牌規格文件」模板

3. **設計風險與報酬框架 (Risk/Reward Framework)**
   - 定義四種卡牌風險類型：概率自毀、資源犧牲、條件鎖定、貪婪連鎖
   - 為每種風險類型提供 NotebookLM 中的代表案例

---

### Phase 2: 宏觀進程與經濟設計 (Level Designer)

**調用 Agent**: 🎰 Level Designer (`balatro-level-designer/SKILL.md`)
**參考資料**: NotebookLM — 進程曲線、Boss 設計、經濟模型

有了強大的引擎後，設計跑道與障礙物。

4. **建立 Run 結構與底注曲線 (Ante Scaling)**
   - 設計 8 個底注的成長倍率與三階段盲注節奏
   - 定位從「序幕（教學）」到「高潮（轉折）」的階段目標

5. **設計 Boss 盲注池 (Boss Blinds Ecosystem)**
   - 將 Boss 分為：數值檢定、機制封鎖、行動限制、經濟破壞四類
   - 為各流派設計「天敵」與「解法」
   - 設計 5 種 Ante 8 終局 Boss

6. **建構商店與跳過博弈 (Shop & Skip Mechanics)**
   - 設計經濟收入/支出模型、利息機制
   - 制定標籤 (Tag) 獎勵階級與跳過盲注的機會成本

7. **規劃賭注難度分層 (Stake Difficulty)**
   - 設計 8 層疊加難度（白到金）
   - 定義每層擠壓的「舒適區」與催生的新策略

---

### Phase 3: 敘事與世界觀建構 (Narrative Designer)

**調用 Agent**: 🃏 Narrative Designer (`balatro-narrative-designer/SKILL.md`)
**參考資料**: NotebookLM — 命名隱喻、文化符號、氛圍設計

以「系統即敘事」哲學，將機制溶解為故事與氛圍。

8. **定義氛圍定位 (Atmosphere Brief)**
   - 撰寫「一句話世界觀」（不是劇情，是「感覺」）
   - 定義視覺/聽覺/觸覺三要素與風格紅線

9. **設計卡牌命名隱喻系統 (Naming Metaphor System)**
   - 為 Phase 1 中的代表性小丑牌設計命名隱喻（歷史典故、科學概念、機制擬人）
   - 建立消耗品主題敘事矩陣（塔羅、星球、幻靈、代金券）

10. **Boss 盲注擬人化設計**
    - 為 Phase 2 中的所有 Boss 設計命名與隱喻
    - 使用「The + 具體名詞」格式，確保名字可視覺化

11. **撰寫極簡文案風格指南**
    - 定義字數限制、色彩即語法規則、語氣標準
    - 為所有卡牌撰寫不超過 2 行的效果描述

---

### Phase 4: 視覺與體驗設計 (UI Designer + UX Architect)

**調用 Agent**: ✨ UI Designer (`balatro-ui-designer/SKILL.md`) + 🧩 UX Architect (`balatro-ux-architect/SKILL.md`)
**參考資料**: NotebookLM — 視覺回饋、資訊架構、心流設計

將數學引擎的運算轉化為感官體驗。

12. **UI Designer — 視覺設計系統 (Design Token System)**
    - 定義色彩系統（氛圍色 + 數值類型色 + 稀有度色）
    - 定義版本（Edition）與增強牌的 Shader 視覺效果層級
    - 設計封蠟 (Seal) 的視覺效果與疊加規則

13. **UI Designer — 計分動畫 Juice 規格書**
    - 定義計分結算的時間軸（觸發間隔、數字彈跳、火焰門檻）
    - 設計重觸發 (Retrigger) 的加速節奏曲線（間隔＋音高＋震動）
    - 定義懸念規則（不預覽精確分數）

14. **UI Designer — 介面佈局與過渡動畫**
    - 繪製主遊戲畫面、盲注選擇、商店的區域劃分
    - 定義場景間的滑入/滑出過渡動畫規格

15. **UX Architect — 決策流程與資訊架構**
    - 繪製三層決策流程地圖（回合/經濟/戰略循環）
    - 定義三層資訊金字塔（始終可見 / 按需顯示 / 情境觸發）
    - 設計認知負荷管理的五階段漸進式揭示

16. **UX Architect — 心流懸念與再來一局循環**
    - 定義「表演式計分結算」的排程規格
    - 設計失敗→重啟 ≤5 秒的 UX 時間線
    - 設計商店博弈的決策壓力梯度（低/中/高壓力）

---

### Phase 5: 技術美術與音頻實現 (Technical Artist + Audio Engineer)

**調用 Agent**: 🔧 Technical Artist (`balatro-tech-artist/SKILL.md`) + 🔊 Audio Engineer (`balatro-audio-engineer/SKILL.md`)
**參考資料**: NotebookLM — Shader 技術、音畫同步

將設計規格轉化為可實現的 PixiJS/WebGL/Web Audio API 技術方案。

17. **Technical Artist — 卡牌版本 Shader 規格書**
    - 為閃箔/全像/彩色/負片設計 GLSL Fragment Shader
    - 定義效能退化策略（桌面/行動端/低性能分級）

18. **Technical Artist — 火焰 Shader + CRT 後處理管線**
    - 設計程序化火焰 Shader（Noise + 顏色梯度 + 強度驅動）
    - 合併 CRT 效果為單一 Filter（桶形畸變 + 掃描線 + 色差 + 暗角）

19. **Technical Artist — 程序化物理動畫系統**
    - 建立彈簧阻尼系統（懸停彈起、選取跳起、數字彈跳）
    - 定義卡牌動畫效果矩陣與參數表

20. **Audio Engineer — AudioManager 架構 + Pitch Shifting 系統**
    - 設計 Web Audio API 音頻節點拓撲（匯流排 + 壓縮器）
    - 定義計分連鎖的 Pitch Shifting 公式與行為表

21. **Audio Engineer — 動態音樂 (Stem-Based) + 音效矩陣**
    - 設計 5 條 Stem 的場景音量矩陣
    - 為所有操作（卡牌/UI/計分/材質）定義音效規格
    - 定義音畫同步的幀級時序規格

---

### Phase 6: 跨系統驗證與最終整合 (全 Agent 協同)

**調用所有 Agent 進行交叉驗證**

22. **極端狀況推演 (Edge Case Simulations)**
    - (Level Designer + Game Designer)：金色賭注 + 終局 Boss 的破局推演
    - (Technical Artist + Audio Engineer)：計分高潮時的效能壓力測試規格
    - (UX Architect)：認知負荷在極端連鎖觸發時的玩家體驗評估

23. **無障礙與跨平台驗證 (Accessibility)**
    - (UI Designer)：色弱模式、減少動態模式的完整規格
    - (Technical Artist)：低性能裝置退化策略
    - (Audio Engineer)：行動端 Safari 音頻兼容性規格

24. **彙整最終規格書 (Final Master Output)**
    - 將所有交付物統整為多章節的 Master Markdown 文件
    - 文件結構：
      ```
      1. 計分引擎規格書 (Game Designer)
      2. 卡牌機制矩陣與規格文件 (Game Designer)
      3. Run 結構與難度曲線 (Level Designer)
      4. Boss 盲注設計矩陣 (Level Designer)
      5. 商店與經濟迴圈 (Level Designer)
      6. 氛圍定位與命名系統 (Narrative Designer)
      7. 極簡文案風格指南 (Narrative Designer)
      8. 視覺設計系統 (UI Designer)
      9. 計分動畫 Juice 規格 (UI Designer)
      10. 決策流程與資訊架構 (UX Architect)
      11. Shader 技術規格 (Technical Artist)
      12. 音頻系統規格 (Audio Engineer)
      13. 無障礙與跨平台規格 (UI + Tech + Audio)
      14. 極端狀況推演報告 (全 Agent)
      ```

---

## 🔗 Agent 間的依賴關係

```
Phase 1 (Game Designer) ──────────────────┐
    │                                      │
    ▼                                      ▼
Phase 2 (Level Designer)            Phase 3 (Narrative Designer)
    │       需要 Phase 1 的卡牌矩陣        │  需要 Phase 1 的小丑牌列表
    │       來設計 Boss 反制               │  來設計命名隱喻
    │                                      │
    └──────────┬───────────────────────────┘
               │
               ▼
       Phase 4 (UI Designer + UX Architect)
               │  需要 Phase 1-3 的所有機制定義
               │  來設計視覺語言與決策流程
               │
               ▼
       Phase 5 (Technical Artist + Audio Engineer)
               │  需要 Phase 4 的視覺/Juice 規格
               │  來實現 Shader 與音效
               │
               ▼
       Phase 6 (全 Agent 協同驗證)
               │  交叉驗證所有系統的一致性
               ▼
          最終規格書輸出
```

---

## ⚡ 快速啟動指令

要開始這個工作流，只需對我說：

```
開始執行 Balatro 完整規格書工作流，從 Phase [N] 開始
```

或是針對特定小丑牌的深度拆解：

```
請用 Game Designer + Narrative Designer 的視角，
為 [小丑牌名稱] 產出完整的卡牌規格文件
```

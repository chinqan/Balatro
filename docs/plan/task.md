# Boss-Attack Card Game — 完整規格書製作計劃

- [x] Planning: 製作完整的 Implementation Plan
  - [x] 查詢 NotebookLM 收集參考設計原理
  - [x] 設計核心機制轉換（Score → Attack Boss）
  - [x] 撰寫 Implementation Plan 並提交審閱
- [x] Phase 1: 核心玩法規格書 (Game Designer)
- [x] Phase 2: 關卡與進程設計 (Level Designer)
- [x] Phase 3: 敘事與世界觀 (Narrative Designer)
- [x] Phase 4: 介面與體驗設計 (UI Designer + UX Architect)
- [x] Phase 5: 技術美術與音頻 (Tech Artist + Audio Engineer)
- [x] Phase 6: 跨系統驗證與最終彙整
- [x] Phase 7: 完整卡牌與遺物註冊表 (Registry)
- [x] Phase 8: 遊戲流程與畫面操作規格 (Game Flow & Screen Specs)
  - [x] 畫面流程圖 (Screen Flow Diagram)
  - [x] 主選單與進入遊戲
  - [x] 戰鬥中玩家操作細節
  - [x] 結算與重啟畫面
  - [x] 輔助畫面（暫停/設定/收藏庫/教學）
  - [x] 卡牌視覺狀態分層系統（增強/版本/封印/觸發 VFX 疊加規則）
  - [x] 卡牌註冊表 VFX 欄位擴充（trigger_vfx、sfx_id、destroy_anim）
- [x] Phase 9: 核心基礎建設規格 (Core Infrastructure)
  - [x] 存檔/讀檔系統
  - [x] 隨機種子系統
  - [x] 牌庫管理引擎
  - [x] 統計數據追蹤
- [x] Phase 10: 局外進度與耐玩性 (Meta-Progression)
  - [x] 局外解鎖系統
  - [x] 起始牌組多樣性 (15+)
  - [x] 挑戰與成就系統
  - [x] 平衡性測試框架

---

## 🎨 UI/UX 改版記錄（實作後修正）

- [x] **地城地圖 Balatro 風格重設計** *(2026-03-19)*
  - [x] 改為 3 張卡牌並排固定佈局（enc[0]/enc[1]/enc[2]），取代舊版垂直節點樹
  - [x] 黃框（Select badge）隨 `currentEncounter` 索引移動
  - [x] 頂部 Header：F1-F8 樓層進度點 + 玩家資訊
  - [x] 底部進度條：本層遭遇圖示點 + 「F1 遭遇 1/3」
  - [x] 深綠氈布背景 (#1a2a1a) + 32px grid 紋理
  - [x] 移除舊版底部分離式按鈕列，行動按鈕整合至 Current 卡中

- [x] **跳過遭遇獎勵 Inline 顯示** *(2026-03-19)*
  - [x] 廢棄確認彈窗（`_openSkipConfirm`）
  - [x] 跳過獎勵（icon + label + desc）直接呈現在 Current 卡內
  - [x] 點擊「⏩ 跳過遭遇」立即執行 `_onSkipEncounter()`，無二次確認
  - [x] 更新 GDD：`phase8_game_flow.md §2.3`、`phase4_boss_attack_uiux.md §7`
  - [x] 更新計劃書：`implementation_plan.md §4.7`、`§Steps 8.2`

# Boss-Attack Roguelike — 程式開發任務追蹤

## Sprint 0: 專案初始化與核心基建
- [x] 撰寫 implementation_plan.md 並提交用戶審閱
- [x] 使用 Vite + TypeScript 腳手架建立專案
- [x] 安裝 PixiJS 8 + 設定 ESLint/tsconfig
- [x] 建立目錄結構 (core/, systems/, data/, rendering/, ui/)
- [x] 實作 Game Clock + Fixed Timestep Game Loop
- [x] 實作 RNG Seed 系統 (Mulberry32)
- [x] 實作 Object Pool 系統
- [x] 實作 AudioManager 骨架 (Bus + DynamicsCompressor)
- [x] 實作 Scene/State Manager (Title → Battle → Shop → etc.)

## Sprint 1: 牌庫引擎 + 傷害公式
- [x] 實作 Card 數據模型 (suit, rank, enhancement, edition, seal)
- [x] 實作 Deck Manager (draw, discard, shuffle, remove, add)
- [x] 實作 Hand Evaluator (撲克牌型判定 — 10 種牌型)
- [x] 實作 Damage Calculator (4 階段結算引擎)
- [x] 實作 Relic 系統骨架 (slot manager + left-to-right resolution)
- [x] 單元測試：牌型判定 + 傷害公式

## Sprint 2: 戰鬥流程 + Boss AI
- [x] 實作 Battle State Machine (Player Turn → Settlement → Boss Turn)
- [x] 實作 Boss 數據模型 (HP, Shield, ATK, mechanics, intents)
- [x] 實作 Boss Intent 系統 (預告下回合攻擊)
- [x] 實作 Player State (HP, Shield, Money, Plays, Discards)
- [x] 實作 Turn Resolution Loop (出牌 → 結算 → Boss 反擊 → 下回合)

## Sprint 3: PixiJS 渲染 + 戰鬥 UI
- [x] PixiJS Application 初始化 + Viewport Scaling
- [x] 卡牌 Sprite 渲染 (程序化佔位圖 — PIXI.Graphics + Text)
- [x] 戰鬥畫面佈局 (Boss HP 條, 手牌區, 遺物欄, 底部 HUD)
- [x] 手牌互動 (點擊選牌, 出牌/棄牌按鈕)
- [x] 傷害結算動畫 (卡牌飛向 Boss, 數字彈出, HP 條扣減)

## Sprint 4: 商店 + 地城流程
- [x] 商店畫面 (購買遺物/消耗品, Reroll)
- [x] 地城地圖畫面 (Floor 1-8 路徑圖)
- [x] Run 狀態管理 (Floor -> Encounter -> Battle/Shop 循環)
- [x] 經濟系統 (金錢收入, 利息, 售出)

## Sprint 5+: 內容填充 + 打磨
- [ ] 150 神器效果實作
- [ ] 消耗品 (捲軸/靈藥/契約) 效果
- [ ] Boss 機制限制 (花色封鎖, 牌型封鎖, etc.)
- [ ] Shader 特效 (版本 Shader, CRT 後處理)
- [ ] Pitch Shifting 音效連鎖
- [ ] Stem 動態音樂系統
- [ ] 存檔/讀檔
- [ ] Meta 進度 + 解鎖

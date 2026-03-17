# 消耗品註冊表 — 捲軸(22) + 靈藥(12) + 契約(18)

---

## 奧術捲軸 (Scrolls) — 對應 Balatro 塔羅牌

| ID | 名稱 | 效果 | 費用 | trigger_vfx | trigger_sfx_id |
|:--:|------|------|:----:|:-----------:|:--------------:|
| S01 | 審判捲軸 | 將 1 張牌增強為獎勵牌 | 3金 | scroll_glow | sfx_scroll |
| S02 | 月光捲軸 | 將 1 張牌增強為萬能牌 | 3金 | scroll_glow | sfx_moon |
| S03 | 星辰捲軸 | 將 1 張牌增強為幸運牌 | 3金 | scroll_glow | sfx_star |
| S04 | 力量捲軸 | 將 2 張牌增強為玻璃牌 | 3金 | scroll_glow | sfx_power |
| S05 | 戰車捲軸 | 將 1 張牌增強為鋼鐵牌 | 3金 | scroll_glow | sfx_chariot |
| S06 | 皇帝捲軸 | 將 1 張牌增強為黃金牌 | 3金 | scroll_glow | sfx_emperor |
| S07 | 隱士捲軸 | 將 1 張牌增強為石頭牌 | 3金 | scroll_glow | sfx_hermit |
| S08 | 倒吊捲軸 | 銷毀 2 張手牌（牌庫壓縮） | 3金 | consume | sfx_hang |
| S09 | 太陽捲軸 | 改變 3 張牌的花色為 ♥ | 3金 | sun_glow | sfx_sun |
| S10 | 月亮捲軸 | 改變 3 張牌的花色為 ♣ | 3金 | moon_glow | sfx_moon |
| S11 | 閃電捲軸 | 改變 3 張牌的花色為 ♠ | 3金 | lightning | sfx_bolt |
| S12 | 火焰捲軸 | 改變 3 張牌的花色為 ♦ | 3金 | flame | sfx_fire |
| S13 | 命運捲軸 | 為 1 張牌添加隨機封印 | 4金 | fate_glow | sfx_fate |
| S14 | 死神捲軸 | 銷毀 1 張牌，複製另 1 張牌加入牌庫 | 4金 | death_flash | sfx_death |
| S15 | 節制捲軸 | 所有手牌 +10 面值 | 3金 | calm_glow | sfx_temperate |
| S16 | 正義捲軸 | 為 1 張牌添加閃箔版本 | 5金 | foil_flash | sfx_justice |
| S17 | 教皇捲軸 | 為 2 張牌添加全像版本 | 5金 | holo_flash | sfx_hierophant |
| S18 | 女祭司捲軸 | 從抽牌堆頂抽 2 張至手牌 | 3金 | draw_glow | sfx_priestess |
| S19 | 魔術師捲軸 | 將 1 張牌面值改為任意數字 | 4金 | magic_flash | sfx_magician |
| S20 | 愚者捲軸 | 複製上一張使用的消耗品效果 | 3金 | fool_glow | sfx_fool |
| S21 | 世界捲軸 | 將 1 張牌同時增強+添加封印 | 6金 | world_glow | sfx_world |
| S22 | 塔捲軸 | 銷毀所有面值 ≤4 的手牌（激進壓縮） | 3金 | tower_crash | sfx_tower |

---

## 星辰靈藥 (Elixirs) — 對應 Balatro 星球牌

| ID | 名稱 | 效果 | 費用 | trigger_vfx | trigger_sfx_id |
|:--:|------|------|:----:|:-----------:|:--------------:|
| E01 | 水星靈藥 | 「對子」牌型等級 +1 | 3金 | planet_glow | sfx_mercury |
| E02 | 金星靈藥 | 「兩對」牌型等級 +1 | 3金 | planet_glow | sfx_venus |
| E03 | 地球靈藥 | 「三條」牌型等級 +1 | 3金 | planet_glow | sfx_earth |
| E04 | 火星靈藥 | 「順子」牌型等級 +1 | 3金 | planet_glow | sfx_mars |
| E05 | 木星靈藥 | 「同花」牌型等級 +1 | 3金 | planet_glow | sfx_jupiter |
| E06 | 土星靈藥 | 「葫蘆」牌型等級 +1 | 3金 | planet_glow | sfx_saturn |
| E07 | 天王星靈藥 | 「四條」牌型等級 +1 | 4金 | planet_glow | sfx_uranus |
| E08 | 海王星靈藥 | 「同花順」牌型等級 +1 | 4金 | planet_glow | sfx_neptune |
| E09 | 冥王星靈藥 | 「高牌」牌型等級 +1 | 3金 | planet_glow | sfx_pluto |
| E10 | 賽勒斯靈藥 | 「皇家同花順」等級 +1 | 5金 | planet_glow | sfx_ceres |
| E11 | 歐若拉靈藥 | 隨機 1 種牌型等級 +2 | 4金 | aurora | sfx_aurora |
| E12 | 黑洞靈藥 | 所有牌型等級 +1（極稀有） | 6金 | vortex | sfx_blackhole |

---

## 虛空契約 (Pacts) — 對應 Balatro 幻靈牌

| ID | 名稱 | 效果 | 代價 | trigger_vfx | trigger_sfx_id | destroy_anim |
|:--:|------|------|------|:-----------:|:--------------:|:------------:|
| P01 | 深淵契約 | 為 1 個遺物添加負片版本 | -20 金 | dark_rift | sfx_abyss | — |
| P02 | 獻祭誓約 | 銷毀 1 個遺物，獲得 1 個傳奇遺物 | 失去遺物 | sacrifice | sfx_sacrifice | dissolve |
| P03 | 靈魂呼喚 | 直接獲得 1 個傳奇遺物 | -1 手牌上限 | soul_summon | sfx_soul | — |
| P04 | 血肉重塑 | 牌庫所有牌變為同一花色 | -30 HP | blood_shift | sfx_reshape | — |
| P05 | 數字統一 | 牌庫所有牌變為同一面值 | -30 HP | number_shift | sfx_unify | — |
| P06 | 虛空洗禮 | 銷毀手牌中 3 張，餘下獲得彩色版本 | 失去牌 | void_wash | sfx_baptize | dissolve |
| P07 | 熵增裂隙 | +2 遺物欄上限 | -1 出牌次數 | rift | sfx_entropy | — |
| P08 | 時光倒流 | 將 1 個遺物恢復為商店價格 | -15 金 | distort | sfx_rewind | — |
| P09 | 惡魔之觸 | 為所有手牌添加隨機增強 | HP 上限 -10 | demon_touch | sfx_demon | — |
| P10 | 複製裂變 | 複製 1 個遺物（帶所有效果） | -25 金 + -10 HP | clone_flash | sfx_fission | — |
| P11 | 空間扭曲 | 商店出現次數 +1（額外商店回合） | -1 棄牌次數 | warp | sfx_warp | — |
| P12 | 命運改寫 | 重新隨機生成本場 Boss 機制限制 | -20 金 | fate_rewrite | sfx_rewrite | — |
| P13 | 死亡交易 | +50 ATK（永久），但 HP 上限 -20 | HP上限 | death_deal | sfx_death_deal | — |
| P14 | 狂暴灌注 | +30 DMG Mult（永久） | -2 手牌上限 | rage_infuse | sfx_infuse | — |
| P15 | 虛空護盾 | +50 永久護盾上限 | -20 金 | void_shield | sfx_void_shield | — |
| P16 | 貪婪之手 | 本場每次出牌 +5 金 | 本場 ATK ÷2 | greed_hand | sfx_greed | — |
| P17 | 毀滅之種 | 銷毀牌庫一半的牌（隨機） | 失去牌 | destruction | sfx_destroy | burn |
| P18 | 終焉封印 | 下 3 場戰鬥所有傷害 ×2 | 之後 3 場 ×0.5 | seal_final | sfx_end_seal | — |

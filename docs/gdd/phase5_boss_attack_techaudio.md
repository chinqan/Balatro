# Phase 5: 技術美術與音頻系統

**負責 Agent**: 🔧 Technical Artist + 🔊 Audio Engineer
**Skill**: `balatro-tech-artist` + `balatro-audio-engineer`
**核心技術**: PixiJS 8 / WebGL / Web Audio API / GLSL

---

## 1. PixiJS 渲染架構與 Shader 規格

### 1.1 Shader 掛載系統

所有卡牌、Boss 實體與 UI 繼承自 `PIXI.Container`，統一掛載 `PIXI.Filter`：

| Shader 類型 | 用途 | 關鍵 Uniform |
|------------|------|-------------|
| **衝擊波** | 卡牌擊中 Boss 時的螢幕擴散變形 | `u_center`, `u_time`, `u_force` |
| **Boss 護甲碎裂** | Voronoi Noise 裂紋遮罩，隨受擊增長 | `u_crack_level`, `u_seed` |
| **閃箔 (Foil)** | 微光粒子 + 動態偏移 | `u_tint`, `u_offset` |
| **全像 (Holo)** | UV 扭曲 + 色散 | `u_time`, `u_distortion` |
| **負片 (Negative)** | RGB 反轉 + 噪點 | `u_glow`, `u_noise` |
| **CRT 後處理** | 掃描線 + 桶形畸變 + 色差 | `u_scanline_intensity`, `u_curvature` |
| **動態背景** | `PIXI.TilingSprite` + 程序化火焰 | `u_boss_hp_ratio`, `u_beat` |

### 1.2 CRT 後處理管線

套用於整個 `app.stage` 的最高層 Filter：
- 掃描線密度：每 2 像素一條半透明黑線
- 桶形畸變：邊緣像素偏移 ≤ 3%
- 色差偏移：RGB 各偏 1-2 像素
- 可在設定中關閉（無障礙考量）

---

## 2. 程序化動畫系統

### 2.1 彈簧阻尼系統 (Spring Physics)

所有 UI 元素動畫採用物理模擬，不使用傳統 Tween：

```
acceleration = -stiffness × displacement - damping × velocity
velocity += acceleration × deltaTime
position += velocity × deltaTime
```

| 元素 | stiffness | damping | 觸發時機 |
|------|:---------:|:-------:|---------|
| 卡牌懸停 | 300 | 20 | 滑鼠 hover |
| Boss 受擊 | 500 | 15 | 傷害命中 |
| 遺物觸發 | 400 | 18 | 結算亮起 |
| 畫面震動 | 800 | 25 | 暴擊/毀滅 |

### 2.2 物件池管理 (Object Pooling)

傷害數字與粒子採用物件池，避免 GC 卡頓：

| 池 | 預分配數量 | 最大擴展 |
|---|:--------:|:-------:|
| 傷害數字 | 50 | 200 |
| 粒子 (圓點) | 200 | 1000 |
| 衝擊波 | 5 | 10 |

### 2.3 效能預算

| 指標 | 目標 |
|------|:----:|
| 穩定幀率 | 60 FPS |
| 同屏粒子上限 | 500 |
| Shader 切換次數/幀 | ≤ 8 |
| Draw Call 上限 | ≤ 50 |

---

## 3. 音頻系統架構 (Web Audio API)

### 3.1 AudioManager 拓撲

```
源節點 (Source)
  ↓
匯流排 (Bus): SFX / Music / UI
  ↓
DynamicsCompressor (防爆音)
  ↓
GainNode (主音量)
  ↓
AudioContext.destination
```

### 3.2 Pitch Shifting 連鎖公式

傷害連鎖時，每張牌的音效 Pitch 遞增：

```
pitch = basePitch × (1 + chainIndex × 0.05)
上限 clamp 至 basePitch × 2.0
```

| 連擊數 | Pitch 倍率 | 感受 |
|:------:|:--------:|------|
| 1 | 1.00 | 基礎音 |
| 5 | 1.25 | 明顯升高 |
| 10 | 1.50 | 緊張感 |
| 15 | 1.75 | 高潮前奏 |
| 20 | 2.00 | 最高音（鎖定） |

### 3.3 材質專屬音色

| 卡牌類型 | 音色特徵 | 範例描述 |
|---------|---------|---------|
| 普通撲克牌 | 清脆短促 | 紙牌拍打聲 |
| 增強牌（玻璃） | 高頻玻璃碰撞 | 水晶碰杯 |
| 增強牌（鋼鐵） | 金屬迴響 | 鐵砧敲擊 |
| 版本牌（全像） | 電子嗡鳴 | 合成器 pad |
| Boss 攻擊 | 低頻衝擊波 | 深沉鼓聲 |

---

## 4. 動態音樂 + 音畫同步

### 4.1 五軌 Stem 場景矩陣

| Stem | 普通戰 | Boss 戰 | Boss HP<20% | 商店 |
|------|:------:|:------:|:-----------:|:---:|
| 鼓組 | 40% | 80% | 100% | 20% |
| 貝斯 | 50% | 70% | 100% | 30% |
| Lead | 0% | 50% | 100% | 60% |
| Pad | 80% | 40% | 20% | 100% |
| FX | 20% | 60% | 80% | 10% |

### 4.2 幀級音畫同步

| 事件 | 音效觸發時機 | 容差 |
|------|:---------:|:---:|
| 卡牌擊中 Boss | 卡牌到達 Boss 的第 1 幀 | ±1 幀 |
| HP 條扣減 | 數字開始下降的第 1 幀 | ±2 幀 |
| Boss 受擊震動 | 與衝擊波 Shader 同幀 | ±0 幀 |

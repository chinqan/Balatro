// ============================================================
// Design Tokens — Colors, fonts, sizes from GDD Phase 4
// ============================================================

export const COLORS = {
  // Background
  BG_DARK: 0x0a0a0a,
  BG_PANEL: 0x1a1a2e,
  BG_CARD: 0x16213e,

  // Functional colors (GDD Phase 4 §2.1)
  ATK: 0x4A9EFF,        // Blue — ATK values
  DMG: 0xFF4A5E,        // Red — DMG multiplier
  SHIELD: 0x4AFF7A,     // Green — Shield
  GOLD: 0xFFD700,       // Gold — Money
  HEAL: 0xFFFFFF,       // White — HP Heal
  BOSS_DMG: 0xFF0000,   // Deep red — Boss damage

  // Suit colors
  SUIT_RED: 0xFF4A5E,   // Hearts, Diamonds
  SUIT_BLACK: 0x1a1a1a, // Spades, Clubs — deep black

  // Rarity (GDD Phase 4 §2.2)
  RARITY_COMMON: 0x6699CC,
  RARITY_UNCOMMON: 0x44BB66,
  RARITY_RARE: 0xFF6644,
  RARITY_LEGENDARY: 0xFFAA00,

  // UI
  TEXT_PRIMARY: 0xFFFFFF,
  TEXT_DIM: 0x888888,
  BUTTON_PRIMARY: 0x2E86AB,
  BUTTON_DANGER: 0xE74C3C,
  BUTTON_DISABLED: 0x333333,
  HP_BAR_BG: 0x333333,
  HP_BAR_FILL: 0xE74C3C,
  HP_BAR_SHIELD: 0x4AFF7A,
  BOSS_HP_FILL: 0xCC3333,
  BOSS_SHIELD_FILL: 0x4AFF7A,

  // Card selection
  CARD_SELECTED: 0xFFDD44,
  CARD_HOVER: 0x66AAFF,
} as const;

export const LAYOUT = {
  // Card dimensions
  CARD_W: 80,
  CARD_H: 112,
  CARD_GAP: 8,
  CARD_CORNER_R: 8,

  // Battle screen zones (in design coordinates 1280×720)
  BOSS_AREA_Y: 40,
  BOSS_HP_W: 400,
  BOSS_HP_H: 24,

  HAND_AREA_Y: 480,
  HAND_AREA_CENTER_X: 640,

  RELIC_BAR_Y: 420,
  RELIC_SIZE: 40,
  RELIC_GAP: 6,

  HUD_Y: 640,
  HUD_H: 60,

  // Boss sprite area
  BOSS_SPRITE_Y: 180,
  BOSS_SPRITE_SIZE: 160,

  // Button
  BUTTON_W: 100,
  BUTTON_H: 40,
  BUTTON_R: 8,
} as const;

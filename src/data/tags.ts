// ============================================================
// Tags Data — Skip rewards (GDD Phase 2 §3.4-3.5)
// ============================================================

import type { TagDefinition, TagId } from '@/types';

export const TAG_DEFINITIONS: Record<TagId, TagDefinition> = {
  tag_rare: {
    id: 'tag_rare',
    name: '稀有標籤',
    description: '下次商店必出稀有遺物',
    immediate: false,
  },
  tag_economy: {
    id: 'tag_economy',
    name: '經濟標籤',
    description: '立即獲得 10 金',
    immediate: true,
  },
  tag_negative: {
    id: 'tag_negative',
    name: '負片標籤',
    description: '下次獲得的遺物自帶負片版本（+1 遺物格）',
    immediate: false,
  },
  tag_elixir: {
    id: 'tag_elixir',
    name: '靈藥標籤',
    description: '免費獲得 2 瓶隨機靈藥',
    immediate: true,
  },
  tag_challenge: {
    id: 'tag_challenge',
    name: '挑戰標籤',
    description: '下場戰鬥傷害 ×1.5，但 Boss 攻擊力也 ×1.5',
    immediate: false,
  },
};

/** Standard tag pool for skipping standard encounters */
export const STANDARD_SKIP_TAG_POOL: TagId[] = [
  'tag_economy',
  'tag_elixir',
  'tag_rare',
];

/** Elite skip tag pool (stronger) */
export const ELITE_SKIP_TAG_POOL: TagId[] = [
  'tag_negative',
  'tag_challenge',
  'tag_rare',
];

// The complete persistent game state. Pure data (JSON serialisable), no DOM.
// Gold is stored as an integer number of thousandths ("milli gold") so that
// fractional prices never accumulate floating point errors.

import { TIERS, type TierId } from '../config';
import { Rng, type RngState } from './rng';

export const SAVE_VERSION = 1;

export interface Buff {
  /** `${source}:${ref}`; one buff per potion/item, stacking extends it. */
  id: string;
  source: 'potion' | 'item';
  ref: string;
  /** Absolute end time (ms) for timed effects. */
  endsAt?: number;
  /** Remaining charges for roll based effects. */
  rolls?: number;
}

export interface DiscoveryEntry {
  /** First time obtained (ms). */
  first: number;
  /** Total ever obtained (rolled or crafted). */
  total: number;
  /** Player has looked at it in the collection ("NEU" marker cleared). */
  seen: boolean;
}

export interface QuestProgress {
  id: string;
  progress: number;
  claimed: boolean;
}

export interface ChainProgress {
  level: number;
  progress: number;
}

export interface PendingRoll {
  aura: string;
  lucky: boolean;
  luck: number;
  biome: string | null;
  startedAt: number;
  auto: boolean;
}

export interface HistoryEntry {
  aura: string;
  at: number;
  lucky: boolean;
}

export interface Stats {
  rolls: number;
  luckyRolls: number;
  /** Milli gold. */
  goldEarned: number;
  /** Milli gold. */
  goldSpent: number;
  sold: number;
  brewed: number;
  drunk: number;
  crafted: number;
  purchases: number;
  rebirths: number;
  cutscenes: number;
  playMs: number;
  biomesSeen: string[];
  /** Rarest aura ever rolled. */
  bestAura: string | null;
  bestLuck: number;
  offlineRolls: number;
  tierCounts: Partial<Record<TierId, number>>;
}

export interface GameState {
  version: number;
  seed: number;
  rng: RngState;
  createdAt: number;
  /** Last time the game was actively running (offline catch-up reference). */
  lastActiveAt: number;
  gold: number;
  rollCounter: number;
  rollsSinceRebirth: number;
  auras: Record<string, number>;
  discovered: Record<string, DiscoveryEntry>;
  locked: Record<string, boolean>;
  equippedAura: string | null;
  equippedItem: string | null;
  potions: Record<string, number>;
  items: Record<string, number>;
  buffs: Buff[];
  rebirth: number;
  shop: { rotation: number; bought: Record<string, number>; seen: number };
  quests: { day: string; daily: QuestProgress[]; chains: Record<string, ChainProgress> };
  achievements: Record<string, number>;
  stats: Stats;
  history: HistoryEntry[];
  pendingRoll: PendingRoll | null;
  auto: boolean;
  tutorial: { done: boolean; step: number };
}

export function createStats(): Stats {
  return {
    rolls: 0,
    luckyRolls: 0,
    goldEarned: 0,
    goldSpent: 0,
    sold: 0,
    brewed: 0,
    drunk: 0,
    crafted: 0,
    purchases: 0,
    rebirths: 0,
    cutscenes: 0,
    playMs: 0,
    biomesSeen: [],
    bestAura: null,
    bestLuck: 1,
    offlineRolls: 0,
    tierCounts: Object.fromEntries(TIERS.map((t) => [t.id, 0])),
  };
}

export function createInitialState(seed: number, now: number): GameState {
  const rng = new Rng(seed);
  return {
    version: SAVE_VERSION,
    seed: seed >>> 0,
    rng: rng.getState(),
    createdAt: now,
    lastActiveAt: now,
    gold: 0,
    rollCounter: 0,
    rollsSinceRebirth: 0,
    auras: {},
    discovered: {},
    locked: {},
    equippedAura: null,
    equippedItem: null,
    potions: {},
    items: {},
    buffs: [],
    rebirth: 0,
    shop: { rotation: -1, bought: {}, seen: -1 },
    quests: { day: '', daily: [], chains: {} },
    achievements: {},
    stats: createStats(),
    history: [],
    pendingRoll: null,
    auto: false,
    tutorial: { done: false, step: 0 },
  };
}

export const MILLI = 1000;

export function toMilli(gold: number): number {
  return Math.round(gold * MILLI);
}

export function fromMilli(milli: number): number {
  return milli / MILLI;
}

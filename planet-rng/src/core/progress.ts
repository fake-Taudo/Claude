// Quests (daily + repeatable chains) and achievements.

import {
  ACHIEVEMENTS,
  AURA_BY_ID,
  DAILY_QUEST_COUNT,
  POTION_BY_ID,
  QUEST_CHAINS,
  QUEST_TEMPLATES,
  TIER_BY_ID,
  type AchievementDef,
  type QuestChainDef,
  type QuestTemplate,
  type QuestType,
  type Reward,
  type StatKey,
} from '../config';
import { Rng, hash32 } from './rng';
import { toMilli, type GameState } from './state';

export type ProgressEvent =
  | { type: 'achievement'; id: string }
  | { type: 'questReady'; id: string };

export interface ProgressSignal {
  type: QuestType;
  amount: number;
  /** Tier rank of the rolled aura (rollTier quests). */
  rank?: number;
}

/** Local calendar day key, e.g. 2026-10-22. */
export function dayKey(now: number, resetHour = 0): string {
  const d = new Date(now - resetHour * 3600_000);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function nextDayStart(now: number): number {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

export function pickDailyTemplates(seed: number, day: string): QuestTemplate[] {
  const dayNum = Number(day.replace(/-/g, ''));
  const rng = new Rng(hash32(seed, dayNum, 0xda11));
  const pool = [...QUEST_TEMPLATES];
  const result: QuestTemplate[] = [];
  // Draw without replacement and keep the quest types distinct.
  while (result.length < DAILY_QUEST_COUNT && pool.length) {
    const [t] = pool.splice(Math.floor(rng.next() * pool.length), 1);
    if (result.some((r) => r.type === t.type)) continue;
    result.push(t);
  }
  return result;
}

/** Refreshes the daily quests when the day changed. Returns true when refreshed. */
export function ensureDailyQuests(state: GameState, now: number): boolean {
  const day = dayKey(now);
  if (state.quests.day === day && state.quests.daily.length) return false;
  state.quests.day = day;
  state.quests.daily = pickDailyTemplates(state.seed, day).map((t) => ({ id: t.id, progress: 0, claimed: false }));
  return true;
}

export const QUEST_BY_ID: Record<string, QuestTemplate> = Object.fromEntries(QUEST_TEMPLATES.map((q) => [q.id, q]));
export const CHAIN_BY_ID: Record<string, QuestChainDef> = Object.fromEntries(QUEST_CHAINS.map((q) => [q.id, q]));

export function chainTarget(def: QuestChainDef, level: number): number {
  return Math.max(1, Math.round(def.base * Math.pow(def.growth, level)));
}

export function chainReward(def: QuestChainDef, level: number): Reward {
  const gold = Math.round(def.gold * Math.pow(def.goldGrowth, level) * 10) / 10;
  return { gold, potions: def.potions };
}

export function questText(text: string, target: number, tier?: string): string {
  const tierName = tier ? TIER_BY_ID[tier as keyof typeof TIER_BY_ID]?.name ?? tier : '';
  return text.replace('{n}', target.toLocaleString('de-DE')).replace('{tier}', tierName);
}

function matches(type: QuestType, tier: string | undefined, signal: ProgressSignal): boolean {
  if (type !== signal.type) return false;
  if (type === 'rollTier') {
    const need = tier ? TIER_BY_ID[tier as keyof typeof TIER_BY_ID]?.rank ?? 0 : 0;
    return (signal.rank ?? -1) >= need;
  }
  return true;
}

/** Applies a progress signal to quests; returns quests that just became claimable. */
export function trackQuests(state: GameState, signal: ProgressSignal): ProgressEvent[] {
  const events: ProgressEvent[] = [];
  for (const q of state.quests.daily) {
    const def = QUEST_BY_ID[q.id];
    if (!def || q.claimed || q.progress >= def.target) continue;
    if (!matches(def.type, def.tier, signal)) continue;
    q.progress = Math.min(def.target, q.progress + signal.amount);
    if (q.progress >= def.target) events.push({ type: 'questReady', id: q.id });
  }
  for (const def of QUEST_CHAINS) {
    const c = (state.quests.chains[def.id] ??= { level: 0, progress: 0 });
    const target = chainTarget(def, c.level);
    if (c.progress >= target || !matches(def.type, def.tier, signal)) continue;
    c.progress = Math.min(target, c.progress + signal.amount);
    if (c.progress >= target) events.push({ type: 'questReady', id: def.id });
  }
  return events;
}

export function grantReward(state: GameState, reward: Reward): void {
  if (reward.gold) {
    const milli = toMilli(reward.gold);
    state.gold += milli;
    state.stats.goldEarned += milli;
  }
  if (reward.potions) {
    for (const [id, n] of Object.entries(reward.potions)) {
      if (POTION_BY_ID[id]) state.potions[id] = (state.potions[id] ?? 0) + n;
    }
  }
}

export function statValue(state: GameState, stat: StatKey): number {
  const s = state.stats;
  switch (stat) {
    case 'rolls': return s.rolls;
    case 'discovered': return Object.keys(state.discovered).filter((id) => AURA_BY_ID[id]).length;
    case 'goldEarned': return s.goldEarned / 1000;
    case 'sold': return s.sold;
    case 'brewed': return s.brewed;
    case 'drunk': return s.drunk;
    case 'crafted': return s.crafted;
    case 'rebirths': return s.rebirths;
    case 'purchases': return s.purchases;
    case 'cutscenes': return s.cutscenes;
    case 'playMinutes': return s.playMs / 60000;
    case 'biomesSeen': return s.biomesSeen.length;
    case 'luckyRolls': return s.luckyRolls;
  }
}

export function achievementProgress(state: GameState, def: AchievementDef): { value: number; target: number } {
  const c = def.condition;
  if (c.type === 'stat') return { value: Math.min(statValue(state, c.stat), c.value), target: c.value };
  if (c.type === 'tier') {
    const rank = TIER_BY_ID[c.tier].rank;
    const has = Object.keys(state.discovered).some((id) => {
      const a = AURA_BY_ID[id];
      return a && TIER_BY_ID[a.tier].rank >= rank;
    });
    return { value: has ? 1 : 0, target: 1 };
  }
  return { value: state.discovered[c.aura] ? 1 : 0, target: 1 };
}

/** Unlocks every achievement whose condition is met and pays its reward. */
export function checkAchievements(state: GameState, now: number): ProgressEvent[] {
  const events: ProgressEvent[] = [];
  for (const def of ACHIEVEMENTS) {
    if (state.achievements[def.id]) continue;
    const { value, target } = achievementProgress(state, def);
    if (value >= target) {
      state.achievements[def.id] = now;
      grantReward(state, { gold: def.reward.gold, potions: def.reward.potions });
      events.push({ type: 'achievement', id: def.id });
    }
  }
  return events;
}

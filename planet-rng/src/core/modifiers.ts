// Luck / speed / gold multipliers with a full, displayable breakdown.
//
// Stacking rule (shown in the UI):
//  * Trank:       only the strongest active potion counts (per stat).
//  * Amulette:    timed item boosts add up (1 + sum).
//  * Ausrüstung:  the equipped item's bonus (1 + bonus).
//  * Erfolge:     permanent achievement bonuses add up (1 + sum).
//  * Rebirth, Biom, Glücks-Roll: plain multipliers.
// The categories multiply with each other.

import { ACHIEVEMENTS, BIOME_BY_ID, GAME, ITEM_BY_ID, POTION_BY_ID, REBIRTHS } from '../config';
import type { Buff, GameState } from './state';

export type ModCategory = 'potion' | 'amulet' | 'equipment' | 'achievement' | 'rebirth' | 'biome' | 'lucky';

export interface ModPart {
  label: string;
  /** Multiplier (potion/rebirth/biome/lucky) or additive bonus (amulet/equipment/achievement). */
  value: number;
  /** False when overridden (weaker potion). */
  active: boolean;
  /** Remaining time / charges for display. */
  buffId?: string;
}

export interface ModCategoryResult {
  category: ModCategory;
  label: string;
  mode: 'max' | 'add' | 'mult';
  factor: number;
  parts: ModPart[];
}

export interface ModResult {
  total: number;
  categories: ModCategoryResult[];
  /** Buff id of the potion that provides the luck (for charge consumption). */
  potionBuffId?: string;
}

const CATEGORY_LABEL: Record<ModCategory, string> = {
  potion: 'Trank',
  amulet: 'Amulette',
  equipment: 'Ausrüstung',
  achievement: 'Erfolge',
  rebirth: 'Rebirth',
  biome: 'Biom',
  lucky: 'Glücks-Roll',
};

export function isBuffActive(buff: Buff, now: number): boolean {
  if (buff.endsAt !== undefined) return buff.endsAt > now;
  if (buff.rolls !== undefined) return buff.rolls > 0;
  return false;
}

function potionCategory(state: GameState, now: number, stat: 'luck' | 'speed'): { cat: ModCategoryResult; buffId?: string } {
  const parts: ModPart[] = [];
  let best = 1;
  let bestId: string | undefined;
  for (const buff of state.buffs) {
    if (buff.source !== 'potion' || !isBuffActive(buff, now)) continue;
    const def = POTION_BY_ID[buff.ref];
    const value = def?.effect[stat];
    if (!def || value === undefined) continue;
    parts.push({ label: def.name, value, active: false, buffId: buff.id });
    if (value > best) {
      best = value;
      bestId = buff.id;
    }
  }
  for (const p of parts) p.active = p.buffId === bestId;
  return { cat: { category: 'potion', label: CATEGORY_LABEL.potion, mode: 'max', factor: best, parts }, buffId: bestId };
}

function amuletCategory(state: GameState, now: number, stat: 'luckAdd' | 'speedAdd'): ModCategoryResult {
  const parts: ModPart[] = [];
  let sum = 0;
  for (const buff of state.buffs) {
    if (buff.source !== 'item' || !isBuffActive(buff, now)) continue;
    const def = ITEM_BY_ID[buff.ref];
    const value = def?.use?.[stat];
    if (!def || !value) continue;
    parts.push({ label: def.name, value, active: true, buffId: buff.id });
    sum += value;
  }
  return { category: 'amulet', label: CATEGORY_LABEL.amulet, mode: 'add', factor: 1 + sum, parts };
}

function equipmentCategory(state: GameState, stat: 'luckAdd' | 'speedAdd'): ModCategoryResult {
  const parts: ModPart[] = [];
  let sum = 0;
  const def = state.equippedItem ? ITEM_BY_ID[state.equippedItem] : undefined;
  const value = def?.equip?.[stat];
  if (def && value) {
    parts.push({ label: def.name, value, active: true });
    sum += value;
  }
  return { category: 'equipment', label: CATEGORY_LABEL.equipment, mode: 'add', factor: 1 + sum, parts };
}

function achievementCategory(state: GameState): ModCategoryResult {
  const parts: ModPart[] = [];
  let sum = 0;
  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id] && a.reward.luckAdd) {
      parts.push({ label: a.name, value: a.reward.luckAdd, active: true });
      sum += a.reward.luckAdd;
    }
  }
  return { category: 'achievement', label: CATEGORY_LABEL.achievement, mode: 'add', factor: 1 + sum, parts };
}

function rebirthCategory(state: GameState, key: 'luck' | 'speed' | 'goldMult'): ModCategoryResult {
  const level = REBIRTHS.find((r) => r.level === state.rebirth);
  const value = level ? level[key] : 1;
  return {
    category: 'rebirth',
    label: CATEGORY_LABEL.rebirth,
    mode: 'mult',
    factor: value,
    parts: level ? [{ label: `Rebirth ${level.level}`, value, active: true }] : [],
  };
}

function biomeCategory(biomeId: string | null, key: 'luck' | 'speed'): ModCategoryResult {
  const biome = biomeId ? BIOME_BY_ID[biomeId] : undefined;
  const value = biome ? biome[key] ?? 1 : 1;
  return {
    category: 'biome',
    label: CATEGORY_LABEL.biome,
    mode: 'mult',
    factor: value,
    parts: biome && value !== 1 ? [{ label: biome.name, value, active: true }] : [],
  };
}

function finish(categories: ModCategoryResult[], potionBuffId?: string): ModResult {
  const total = categories.reduce((t, c) => t * c.factor, 1);
  return { total, categories, potionBuffId };
}

export function computeLuck(state: GameState, now: number, opts: { lucky: boolean; biome: string | null }): ModResult {
  const potion = potionCategory(state, now, 'luck');
  const categories: ModCategoryResult[] = [
    potion.cat,
    amuletCategory(state, now, 'luckAdd'),
    equipmentCategory(state, 'luckAdd'),
    achievementCategory(state),
    rebirthCategory(state, 'luck'),
    biomeCategory(opts.biome, 'luck'),
    {
      category: 'lucky',
      label: CATEGORY_LABEL.lucky,
      mode: 'mult',
      factor: opts.lucky ? GAME.roll.luckyMultiplier : 1,
      parts: opts.lucky ? [{ label: `Jeder ${GAME.roll.luckyEvery}. Roll`, value: GAME.roll.luckyMultiplier, active: true }] : [],
    },
  ];
  return finish(categories, potion.buffId);
}

export function computeSpeed(state: GameState, now: number, biome: string | null): ModResult {
  const categories: ModCategoryResult[] = [
    potionCategory(state, now, 'speed').cat,
    amuletCategory(state, now, 'speedAdd'),
    equipmentCategory(state, 'speedAdd'),
    rebirthCategory(state, 'speed'),
    biomeCategory(biome, 'speed'),
  ];
  return finish(categories);
}

export function computeGoldMult(state: GameState): ModResult {
  return finish([rebirthCategory(state, 'goldMult')]);
}

/** Whether the next roll (rollCounter + 1) is a lucky roll. */
export function isNextRollLucky(state: GameState): boolean {
  return (state.rollCounter + 1) % GAME.roll.luckyEvery === 0;
}

/** Rolls until (and including) the next lucky roll: 1 means the next roll is lucky. */
export function rollsUntilLucky(state: GameState): number {
  const every = GAME.roll.luckyEvery;
  return every - (state.rollCounter % every);
}

/** Duration of one roll cycle in ms for the given speed. */
export function rollDurationMs(speed: number, auto: boolean): number {
  const base = GAME.roll.baseMs * (auto ? GAME.roll.autoFactor : 1);
  return Math.max(GAME.roll.minMs, base / speed);
}

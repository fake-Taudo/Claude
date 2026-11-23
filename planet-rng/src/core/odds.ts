// Roll model.
//
// Every aura has a nominal "1 in X" (odds). A roll checks the auras of the active
// pool from the rarest to the most common. Aura i succeeds with probability
//     min(1, Luck * c_i),   c_i = (1 / odds_i) / R_i
// where R_i is the probability mass that is still "left" when aura i is checked at
// Luck 1 (R_i = 1 - sum of 1/odds_j over all rarer auras j). The fallback aura
// (the most common one) is awarded when every check fails.
//
// Properties:
//  * At Luck 1 every non-fallback aura has probability exactly 1/odds and the fallback
//    receives the exact remainder, so the distribution sums to exactly 100 %.
//  * For rare auras R_i is practically 1, so Luck 1.5 really means 1.5x the chance.
//  * High luck pushes probability mass from common to rare auras without flattening
//    the distribution (unlike the prototype's chance^(1/Luck) model).

import { AURAS, type AuraDef } from '../config';
import type { Rng } from './rng';

export interface RollEntry {
  aura: AuraDef;
  /** Conditional success probability at Luck 1. */
  cond: number;
}

export interface RollTable {
  biome: string | null;
  /** Rarest first, fallback excluded. */
  entries: RollEntry[];
  fallback: AuraDef;
}

const tableCache = new Map<string, RollTable>();

export function poolFor(biome: string | null, auras: AuraDef[] = AURAS): AuraDef[] {
  return auras.filter((a) => !a.biome || a.biome === biome);
}

export function buildRollTable(biome: string | null, auras: AuraDef[] = AURAS): RollTable {
  const pool = poolFor(biome, auras);
  const fallbacks = pool.filter((a) => a.fallback);
  if (fallbacks.length !== 1) throw new Error('Exactly one fallback aura is required');
  const fallback = fallbacks[0];
  const rest = pool.filter((a) => !a.fallback).sort((a, b) => b.odds - a.odds);
  let remaining = 1;
  const entries: RollEntry[] = [];
  for (const aura of rest) {
    const p = 1 / aura.odds;
    if (remaining - p <= 0) throw new Error(`Aura odds exceed 100 % in pool ${biome ?? 'base'}`);
    entries.push({ aura, cond: p / remaining });
    remaining -= p;
  }
  return { biome, entries, fallback };
}

export function getRollTable(biome: string | null): RollTable {
  const key = biome ?? '';
  let table = tableCache.get(key);
  if (!table) {
    table = buildRollTable(biome);
    tableCache.set(key, table);
  }
  return table;
}

/** Draws one aura. Uses one random number per check (deterministic with a seeded rng). */
export function rollAura(table: RollTable, luck: number, rng: Rng): AuraDef {
  for (const entry of table.entries) {
    const p = Math.min(1, luck * entry.cond);
    if (rng.next() < p) return entry.aura;
  }
  return table.fallback;
}

/** Exact probability of every aura in the table at the given luck. Sums to 1. */
export function distribution(table: RollTable, luck: number): Map<string, number> {
  const result = new Map<string, number>();
  let notYet = 1;
  for (const entry of table.entries) {
    const p = Math.min(1, luck * entry.cond);
    result.set(entry.aura.id, notYet * p);
    notYet *= 1 - p;
  }
  result.set(table.fallback.id, notYet);
  return result;
}

/** Exact probability of a single aura at the given luck (0 if not in the pool). */
export function auraProbability(table: RollTable, luck: number, auraId: string): number {
  let notYet = 1;
  for (const entry of table.entries) {
    const p = Math.min(1, luck * entry.cond);
    if (entry.aura.id === auraId) return notYet * p;
    notYet *= 1 - p;
  }
  return table.fallback.id === auraId ? notYet : 0;
}

/**
 * The "1 in X" shown to the player at Luck 1. For normal auras this is the configured
 * odds. For the fallback aura it is the exact remainder of the base pool.
 */
export function displayOdds(aura: AuraDef): number {
  if (!aura.fallback) return aura.odds;
  const p = auraProbability(getRollTable(null), 1, aura.id);
  return 1 / p;
}

/** Expected number of rolls until an aura of at least `minRank` appears, at the given luck. */
export function expectedRollsForRank(table: RollTable, luck: number, minRank: number, rankOf: (a: AuraDef) => number): number {
  const dist = distribution(table, luck);
  let p = 0;
  for (const [id, prob] of dist) {
    const aura = AURAS.find((a) => a.id === id);
    if (aura && rankOf(aura) >= minRank) p += prob;
  }
  return p > 0 ? 1 / p : Infinity;
}

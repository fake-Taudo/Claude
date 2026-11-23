// AFK catch-up: when auto roll was running while the tab was hidden or the game was
// closed, the missed rolls are simulated with the real rules (buff expiry, biomes and
// lucky cadence follow the simulated clock).

import { AURA_BY_ID, GAME, tierOf } from '../config';
import { activeBiome } from './biomes';
import { beginRoll, completeRoll, tick, type GameEvent } from './engine';
import { computeSpeed, rollDurationMs } from './modifiers';
import type { Rng } from './rng';
import type { GameState } from './state';

export interface OfflineSummary {
  from: number;
  to: number;
  rolls: number;
  efficiency: number;
  /** Count per aura id. */
  auras: Record<string, number>;
  newAuras: string[];
  best: string | null;
  goldBonus: number;
  events: GameEvent[];
}

export function simulateAutoRolls(state: GameState, rng: Rng, from: number, to: number, efficiency: number, maxRolls = 250_000): OfflineSummary {
  const summary: OfflineSummary = { from, to, rolls: 0, efficiency, auras: {}, newAuras: [], best: null, goldBonus: 0, events: [] };
  if (efficiency <= 0 || to <= from) return summary;
  let t = from;
  let prevBiome = activeBiome(from)?.id ?? null;
  const goldBefore = state.gold;
  while (summary.rolls < maxRolls) {
    const biome = activeBiome(t)?.id ?? null;
    const speed = computeSpeed(state, t, biome).total;
    const dur = rollDurationMs(speed, true) / efficiency;
    if (t + dur > to) break;
    t += dur;
    if (biome !== prevBiome) {
      tick(state, t, prevBiome, 0);
      prevBiome = biome;
    }
    beginRoll(state, { now: t, rng }, true);
    const events = completeRoll(state, { now: t, rng });
    summary.rolls += 1;
    for (const e of events) {
      if (e.type === 'rollCompleted') {
        summary.auras[e.aura] = (summary.auras[e.aura] ?? 0) + 1;
        if (e.isNew) summary.newAuras.push(e.aura);
        const best = summary.best ? AURA_BY_ID[summary.best] : null;
        if (!best || AURA_BY_ID[e.aura].odds > best.odds) summary.best = e.aura;
      } else if (e.type === 'achievement' || e.type === 'questReady') {
        summary.events.push(e);
      }
    }
  }
  summary.goldBonus = state.gold - goldBefore;
  state.stats.offlineRolls += summary.rolls;
  return summary;
}

/** Catch-up window length for a gap, honouring the configured cap and minimum. */
export function catchUpWindow(gapMs: number): number {
  if (gapMs < GAME.offline.minSeconds * 1000) return 0;
  return Math.min(gapMs, GAME.offline.maxHours * 3600_000);
}

export function bestTierRank(summary: OfflineSummary): number {
  return summary.best ? tierOf(AURA_BY_ID[summary.best]).rank : -1;
}

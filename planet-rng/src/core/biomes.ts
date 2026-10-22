// Deterministic world weather derived purely from absolute time.

import { BIOMES, type BiomeDef } from '../config';
import { Rng, hash32 } from './rng';

/** Fixed world seed: everybody (and every reload) sees the same schedule. */
export const WORLD_SEED = 0x51a7e7;

export interface BiomeWindow {
  biome: BiomeDef | null;
  slot: number;
  slotStart: number;
  slotEnd: number;
  /** Start / end of the biome inside the slot (equal to slot bounds when clear). */
  start: number;
  end: number;
}

const slotMs = () => BIOMES.slotSec * 1000;

export function biomeWindow(slot: number): BiomeWindow {
  const ms = slotMs();
  const slotStart = slot * ms;
  const slotEnd = slotStart + ms;
  const rng = new Rng(hash32(WORLD_SEED, slot));
  const total = BIOMES.clearWeight + BIOMES.biomes.reduce((s, b) => s + b.weight, 0);
  let r = rng.next() * total;
  let picked: BiomeDef | null = null;
  if (r >= BIOMES.clearWeight) {
    r -= BIOMES.clearWeight;
    for (const b of BIOMES.biomes) {
      if (r < b.weight) {
        picked = b;
        break;
      }
      r -= b.weight;
    }
    picked ??= BIOMES.biomes[BIOMES.biomes.length - 1];
  }
  if (!picked) return { biome: null, slot, slotStart, slotEnd, start: slotStart, end: slotEnd };
  const dur = Math.min(picked.durationSec * 1000, ms);
  const start = slotStart + Math.floor(rng.next() * (ms - dur));
  return { biome: picked, slot, slotStart, slotEnd, start, end: start + dur };
}

export function slotAt(now: number): number {
  return Math.floor(now / slotMs());
}

/** The biome active at the given time, or null for a clear sky. */
export function activeBiome(now: number): BiomeDef | null {
  const w = biomeWindow(slotAt(now));
  return w.biome && now >= w.start && now < w.end ? w.biome : null;
}

export interface BiomeStatus {
  biome: BiomeDef | null;
  /** When the current biome ends (if active). */
  endsAt: number | null;
  /** The next biome and when it starts (within the scan horizon). */
  next: { biome: BiomeDef; startsAt: number } | null;
}

export function biomeStatus(now: number, horizonSlots = 24): BiomeStatus {
  const slot = slotAt(now);
  const current = biomeWindow(slot);
  const active = current.biome && now >= current.start && now < current.end ? current : null;
  let next: BiomeStatus['next'] = null;
  for (let s = slot; s <= slot + horizonSlots && !next; s++) {
    const w = s === slot ? current : biomeWindow(s);
    if (w.biome && w.start > now) next = { biome: w.biome, startsAt: w.start };
  }
  return { biome: active?.biome ?? null, endsAt: active ? active.end : null, next };
}

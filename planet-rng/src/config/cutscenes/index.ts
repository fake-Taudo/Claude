// Cutscene registry: all definitions, looked up by id or by aura.

import { T1 } from './t1';
import type { CutsceneDef, Track } from './types';

export * from './types';
export { CUTSCENE, tierByOdds } from './constants';
export { beatsIn, flashEvents, maxFlashRate, trackFlashes } from './flash';
export { SYMBOLS } from './symbols';
export { T1_TIMES, accelerating, beatGrid } from './template';

const RAW: CutsceneDef[] = [...T1];
const RAW_BY_ID: Record<string, CutsceneDef> = Object.fromEntries(RAW.map((d) => [d.id, d]));

/**
 * Resolves `extends`: the first `until` seconds of the base cutscene (tracks cut off at
 * `until`, cues before it) are put underneath the own tracks. Used for fakeouts.
 */
function resolve(def: CutsceneDef, depth = 0): CutsceneDef {
  if (!def.extends || depth > 3) return def;
  const base = RAW_BY_ID[def.extends.id];
  if (!base) return def;
  const b = resolve(base, depth + 1);
  const until = def.extends.until;
  const inherited: Track[] = b.tracks
    .filter((tr) => tr.t < until)
    .map((tr) => ({ ...tr, dur: Math.min(tr.dur, until - tr.t), hold: false, name: `${tr.name ?? tr.block} (${b.id})` }) as Track);
  return {
    ...def,
    tracks: [...inherited, ...def.tracks],
    audio: {
      ...def.audio,
      cues: [...(b.audio.cues ?? []).filter((c) => c.t < until), ...(def.audio.cues ?? [])],
    },
  };
}

export const CUTSCENES: CutsceneDef[] = RAW.map((d) => resolve(d));
export const CUTSCENE_BY_ID: Record<string, CutsceneDef> = Object.fromEntries(CUTSCENES.map((d) => [d.id, d]));
export const CUTSCENE_BY_AURA: Record<string, CutsceneDef> = Object.fromEntries(CUTSCENES.map((d) => [d.auraId, d]));

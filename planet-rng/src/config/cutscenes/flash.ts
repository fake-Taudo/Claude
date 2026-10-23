// Photosensitivity guard: lists every flash-like event of a cutscene definition and measures
// the highest count inside any sliding 1 s window. Used by a unit test over all definitions
// and by the lab's flash counter.

import type { CutsceneDef, Track } from './types';

/** Beat times (absolute) inside [from, to). */
export function beatsIn(def: CutsceneDef, from: number, to: number): number[] {
  return (def.audio.beats ?? []).filter((b) => b >= from - 1e-6 && b < to - 1e-6);
}

/** Absolute times of the flashes, inversions and bright cuts of one track. */
export function trackFlashes(def: CutsceneDef, tr: Track): number[] {
  switch (tr.block) {
    case 'Flash': {
      const p = tr.params;
      if (p.at === 'beats') return beatsIn(def, tr.t, tr.t + tr.dur).filter((_, i) => i % (p.every ?? 1) === 0);
      return (p.at ?? [0]).map((a) => tr.t + a);
    }
    case 'WhiteOut':
      return [tr.t + tr.dur];
    case 'BeatInvert': {
      const p = tr.params;
      const local = p.beats ? p.beats.map((b) => tr.t + b) : beatsIn(def, tr.t, tr.t + tr.dur);
      return local.filter((_, i) => i % (p.every ?? 1) === 0);
    }
    case 'SceneCut':
      return tr.params.scenes.filter((s, i) => i > 0 && s.bright).map((s) => tr.t + s.at);
    default:
      return [];
  }
}

/** All flash events of a cutscene, sorted. */
export function flashEvents(def: CutsceneDef): number[] {
  return def.tracks.flatMap((tr) => trackFlashes(def, tr)).sort((a, b) => a - b);
}

/** Highest number of events inside any window of `window` seconds, and where it starts. */
export function maxFlashRate(times: number[], window = 1): { count: number; at: number } {
  const t = [...times].sort((a, b) => a - b);
  let best = { count: 0, at: 0 };
  let j = 0;
  for (let i = 0; i < t.length; i++) {
    // Window [t[j], t[j] + window): events closer than `window` share one second.
    while (t[i] - t[j] >= window - 1e-9) j++;
    const count = i - j + 1;
    if (count > best.count) best = { count, at: t[j] };
  }
  return best;
}

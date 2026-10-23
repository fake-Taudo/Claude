// T1 template ("Kreis-Stern" flow) and small helpers for writing cutscene definitions.
// The template only fills in defaults: every value can be overridden per aura in t1.ts.

import { GAME } from '../game';
import { SYMBOLS } from './symbols';
import type { AudioSpec, CoreMotifParams, Cue, CutsceneDef, EchoSpec, EdgeGlowParams, FogParams, ParticleParams, PulseParams, Theme, Track } from './types';

const C = GAME.cutscene;

/** Timings of the T1 template in seconds (the prototype's flow). */
export const T1_TIMES = {
  /** World fades to black. */
  veil: 0.4,
  /** Fog starts to rise (very faint until the motif appears). */
  fogAt: 1.5,
  fogIn: 4,
  /** Black phase ends, the motif appears and grows linearly. */
  motifAt: C.blackMs / 1000,
  grow: C.growMs / 1000,
  /** Pulse symbol behind the motif. */
  pulseAt: 9.5,
  /** Edges glow up. */
  edgeAt: 12,
  /** White-out length (the motif fills the screen meanwhile). */
  white: C.fillMs / 1000,
};

/** The prototype's Kreis-Stern motif: linear growth, accelerating spin, then it covers the screen. */
export function kreisStern(aura: string, over: Partial<CoreMotifParams> = {}, times = T1_TIMES): CoreMotifParams {
  const sym = SYMBOLS[aura];
  return {
    kind: 'circleStar',
    layers: sym?.layers,
    palette: sym?.palette,
    size: [
      [0, C.scaleFrom],
      [times.grow, C.scaleTo],
    ],
    spin: { from: C.rotStartDegPerSec, to: C.rotEndDegPerSec, over: times.grow, curve: C.rotCurve },
    alpha: [
      [0, 0],
      [0.6, 1],
    ],
    progress: [
      [times.grow, 0],
      [times.grow + times.white, 1],
    ],
    ...over,
  };
}

export interface T1Options {
  aura: string;
  theme: Theme;
  /** Core motif (default: Kreis-Stern with the aura's symbol). */
  motif?: CoreMotifParams;
  particles?: ParticleParams[];
  fog?: FogParams | false;
  pulse?: PulseParams | false;
  edge?: EdgeGlowParams | false;
  /** The small signature break: tracks with absolute times, drawn above the motif. */
  brk: { name: string; at: number; tracks: Track[] };
  /** Tracks drawn below the particles (backdrops). */
  under?: Track[];
  /** Tracks drawn between the particles and the motif (lens, rays behind the motif). */
  mid?: Track[];
  reveal?: 'whiteout' | 'edgeglow' | 'cut';
  audio?: Partial<AudioSpec>;
  cues?: Cue[];
  echo?: EchoSpec;
  times?: Partial<typeof T1_TIMES>;
  /** Replace the white-out (e.g. by an edge-glow reveal); absolute times. */
  outro?: Track[];
}

/** Builds a T1 cutscene from the template. */
export function t1(o: T1Options): CutsceneDef {
  const T = { ...T1_TIMES, ...o.times };
  const end = T.motifAt + T.grow;
  const duration = end + T.white;
  const motif = o.motif ?? kreisStern(o.aura, {}, T);
  const tracks: Track[] = [
    { t: 0, dur: T.veil, block: 'FadeVeil', params: { color: 'black', from: 0, to: 1 }, ease: 'outQuad', hold: true, name: 'Entzug' },
  ];
  if (o.fog !== false) {
    tracks.push({
      t: T.fogAt,
      dur: duration - T.fogAt,
      block: 'FogLayers',
      params: { layers: 3, colors: ['fog', 'dark'], speed: 1.2, ...o.fog, density: o.fog?.density ?? [[0, 0], [T.fogIn, 0.55, 'inQuad'], [duration - T.fogAt, 0.8]] },
      name: 'Nebel',
    });
  }
  tracks.push(...(o.under ?? []));
  for (const p of o.particles ?? []) {
    tracks.push({ t: T.motifAt, dur: duration - T.motifAt, block: 'ThemeParticles', params: p, fade: [1.2, 0], name: 'Partikel' });
  }
  tracks.push(...(o.mid ?? []));
  if (o.pulse !== false) {
    const pulse: PulseParams = { symbol: 'star4', count: 2, interval: 0.75, size: 34, color: 'primary', ...o.pulse };
    const times = pulse.at ?? Array.from({ length: pulse.count ?? 2 }, (_, i) => i * (pulse.interval ?? 0.75));
    const dur = Math.max(...times) + (pulse.life ?? Math.max(0.5, (pulse.interval ?? 0.75) * 1.15));
    tracks.push({ t: T.pulseAt, dur: Math.min(dur, duration - T.pulseAt), block: 'DoublePulse', params: pulse, name: 'Doppelpuls' });
  }
  tracks.push({ t: T.motifAt, dur: duration - T.motifAt, block: 'CoreMotif', params: motif, name: 'Kernmotiv' });
  tracks.push(...o.brk.tracks);
  if (o.edge !== false) {
    tracks.push({ t: T.edgeAt, dur: duration - T.edgeAt, block: 'EdgeGlow', params: { colors: ['primary'], inset: 0.45, ...o.edge, intensity: o.edge?.intensity ?? [[0, 0], [0.6, 0.85, 'outQuad']] }, name: 'Randglühen' });
  }
  if (o.outro) tracks.push(...o.outro);
  else tracks.push({ t: end, dur: T.white, block: 'WhiteOut', params: { color: 'white', peak: 1 }, ease: 'inQuad', name: 'Weißblende' });
  return {
    id: o.aura,
    auraId: o.aura,
    tier: 1,
    duration,
    theme: o.theme,
    audio: { bed: 'deepBoom', jingle: 0, wind: 0.5, ...o.audio, cues: [...(o.audio?.cues ?? []), ...(o.cues ?? [])] },
    tracks,
    reveal: { at: end, style: o.reveal ?? 'whiteout' },
    signature: { name: o.brk.name, at: o.brk.at },
    echo: o.echo ?? { strength: 1, mode: 'mono' },
  };
}

/** Beat times: `count` beats at `bpm` starting at `t0`. */
export function beatGrid(t0: number, bpm: number, count: number): number[] {
  const step = 60 / bpm;
  return Array.from({ length: count }, (_, i) => Math.round((t0 + i * step) * 1000) / 1000);
}

/** Times that accelerate from `startGap` to `endGap` seconds between events inside [t0, t1]. */
export function accelerating(t0: number, t1: number, startGap: number, endGap: number): number[] {
  const out: number[] = [];
  let t = t0;
  while (t < t1 - 1e-6) {
    out.push(Math.round(t * 1000) / 1000);
    const k = (t - t0) / Math.max(1e-6, t1 - t0);
    t += startGap + (endGap - startGap) * k;
  }
  return out;
}

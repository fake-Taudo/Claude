import { describe, expect, it } from 'vitest';
import { AURAS, AURA_BY_ID, GAME } from '../src/config';
import { CUTSCENE, CUTSCENES, flashEvents, maxFlashRate, tierByOdds, type CutsceneDef } from '../src/config/cutscenes';
import { curve, spinAngle } from '../src/render/cutscene/core';

// Cutscene definitions (src/config/cutscenes): photosensitivity limit, structure, tiers.

const base: CutsceneDef = {
  id: 'test',
  auraId: 'test',
  tier: 1,
  duration: 10,
  theme: { primary: '#ffffff', secondary: '#888888', fog: '#444444', dark: '#000000' },
  audio: {},
  tracks: [],
  reveal: { at: 9, style: 'whiteout' },
  signature: { name: 'test', at: 5 },
};

describe('flash limit validator', () => {
  it('counts flashes, white-outs, inversions and bright cuts in a sliding 1 s window', () => {
    const def: CutsceneDef = {
      ...base,
      audio: { beats: [2, 2.25, 2.5, 2.75, 3] },
      tracks: [
        { t: 1, dur: 3, block: 'Flash', params: { at: [0, 0.4] } },
        { t: 2, dur: 1.5, block: 'BeatInvert', params: {} },
        { t: 9, dur: 0.5, block: 'WhiteOut', params: {} },
        { t: 5, dur: 2, block: 'SceneCut', params: { scenes: [{ at: 0, kind: 'void' }, { at: 1, kind: 'sky', bright: true }] } },
      ],
    };
    expect(flashEvents(def)).toEqual([1, 1.4, 2, 2.25, 2.5, 2.75, 3, 6, 9.5]);
    // 2, 2.25, 2.5, 2.75 lie inside one second.
    expect(maxFlashRate(flashEvents(def)).count).toBe(4);
  });

  it('accepts three flashes per second but not four', () => {
    expect(maxFlashRate([0, 0.34, 0.67, 1.0, 1.34]).count).toBe(3);
    expect(maxFlashRate([0, 0.3, 0.6, 0.9]).count).toBe(4);
  });

  it('keeps every cutscene at or below 3 flashes per second', () => {
    for (const def of CUTSCENES) {
      const worst = maxFlashRate(flashEvents(def));
      expect(worst.count, `${def.id} at ${worst.at.toFixed(2)} s`).toBeLessThanOrEqual(CUTSCENE.flashLimitPerSecond);
    }
  });
});

describe('cutscene definitions', () => {
  it('gives every aura from 1 in 10.000 exactly one cutscene', () => {
    const withCutscene = AURAS.filter((a) => a.odds >= GAME.cutscene.minOdds).map((a) => a.id).sort();
    expect(CUTSCENES.map((d) => d.auraId).sort()).toEqual(withCutscene);
    expect(new Set(CUTSCENES.map((d) => d.id)).size).toBe(CUTSCENES.length);
  });

  it('assigns the tier from the odds unless the aura overrides it', () => {
    for (const def of CUTSCENES) {
      const aura = AURA_BY_ID[def.auraId];
      expect(aura.cutscene?.tier, def.id).toBe(aura.cutsceneTier ?? tierByOdds(aura.odds));
    }
  });

  it('keeps every track, the break and the reveal inside the cutscene', () => {
    for (const def of CUTSCENES) {
      expect(def.reveal.at, def.id).toBeLessThanOrEqual(def.duration);
      expect(def.signature.at, def.id).toBeLessThanOrEqual(def.duration);
      for (const tr of def.tracks) {
        expect(tr.t, `${def.id} ${tr.block}`).toBeGreaterThanOrEqual(0);
        expect(tr.dur, `${def.id} ${tr.block}`).toBeGreaterThanOrEqual(0);
        expect(tr.t + tr.dur, `${def.id} ${tr.block}`).toBeLessThanOrEqual(def.duration + 0.001);
      }
      for (const c of def.audio.cues ?? []) expect(c.t, `${def.id} ${c.sfx}`).toBeLessThanOrEqual(def.duration);
    }
  });
});

/** Everything of a definition except its colours (theme slots, hex values, spectrum). */
function shape(def: CutsceneDef): string {
  const colorish = /^(#[0-9a-f]{3,8}|primary|secondary|fog|dark|white|black|spectrum)$/i;
  const strip = (v: unknown): unknown => {
    if (typeof v === 'string') return colorish.test(v) ? 'C' : v;
    if (Array.isArray(v)) return v.map(strip);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, strip(x)]));
    return v;
  };
  return JSON.stringify(strip(def.tracks));
}

const DESIGNED = CUTSCENES;

describe('cutscene dramaturgy', () => {
  it('keeps every tier inside its expected length', () => {
    for (const def of DESIGNED) {
      const [lo, hi] = CUTSCENE.durations[def.tier];
      expect(def.duration, def.id).toBeGreaterThanOrEqual(lo);
      expect(def.duration, def.id).toBeLessThanOrEqual(hi);
    }
  });

  it('never lets two cutscenes differ only in colour', () => {
    const seen = new Map<string, string>();
    for (const def of DESIGNED) {
      const key = shape(def);
      expect(seen.get(key), `${def.id} looks like ${seen.get(key)}`).toBeUndefined();
      seen.set(key, def.id);
    }
  });

  it('gives every cutscene its own break with 0.3–0.6 s of silence and an impact right before it', () => {
    const names = new Set<string>();
    for (const def of DESIGNED) {
      expect(names.has(def.signature.name), def.id).toBe(false);
      names.add(def.signature.name);
      const pause = (def.audio.silence ?? []).find(([a, b]) => Math.abs(b - def.signature.at) <= 0.05 && b - a >= 0.3 - 1e-9 && b - a <= 0.6 + 1e-9);
      expect(pause, `${def.id}: silence before ${def.signature.at} s`).toBeDefined();
      expect(def.audio.sting, def.id).toBeDefined();
    }
  });

  it('puts T3 films on beat markers with music', () => {
    for (const def of DESIGNED.filter((d) => d.tier === 3)) {
      expect(def.audio.music, def.id).toBeDefined();
      expect((def.audio.beats ?? []).length, def.id).toBeGreaterThan(16);
    }
  });

  it('has text cards and a frequency ramp from T2 on', () => {
    for (const def of DESIGNED.filter((d) => d.tier >= 2)) {
      expect(def.tracks.filter((tr) => tr.block === 'TextCard').length, def.id).toBeGreaterThanOrEqual(1);
      const ramp = def.tracks.some((tr) => tr.block === 'Counter' || tr.block === 'Ticker' || tr.block === 'SceneCut' || tr.block === 'BeatInvert' || (tr.block === 'CoreMotif' && tr.params.rate !== undefined)) || (def.audio.cues ?? []).length > 6;
      expect(ramp, def.id).toBe(true);
    }
  });
});

describe('timeline math', () => {
  it('evaluates keyframe curves with eases and holds the ends', () => {
    const c = [
      [1, 0],
      [3, 10],
      [4, 20, 'inQuad'],
    ] as const;
    expect(curve(c, 0)).toBe(0);
    expect(curve(c, 2)).toBe(5);
    expect(curve(c, 3.5)).toBeCloseTo(12.5);
    expect(curve(c, 9)).toBe(20);
    expect(curve(7, 3)).toBe(7);
  });

  it('spins at `from` first, accelerates to `to`, then keeps that speed', () => {
    const s = { from: 100, to: 300, over: 10, curve: 1 };
    const speed = (t: number) => (spinAngle(s, t + 0.001) - spinAngle(s, t)) / 0.001;
    expect(speed(0)).toBeCloseTo(100, 0);
    expect(speed(5)).toBeCloseTo(200, 0);
    expect(speed(12)).toBeCloseTo(300, 0);
  });
});

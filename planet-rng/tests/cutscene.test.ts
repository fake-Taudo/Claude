import { describe, expect, it } from 'vitest';
import { AURAS, AURA_BY_ID, GAME, tierOf } from '../src/config';
import { cutsceneAngle } from '../src/render/cutscene';
import { counterValue, cutsceneCues, cutsceneLines, cutsceneStage, cutsceneTimeline, formatCounter, pulseTimes, rampTimes } from '../src/render/cutscene-acts';

describe('cutscene timeline', () => {
  it('spins about 5.5 turns during the grow phase', () => {
    const turns = cutsceneAngle(1) / 360;
    expect(turns).toBeGreaterThan(5.4);
    expect(turns).toBeLessThan(5.6);
  });

  it('starts at about 110°/s and ends at about 260°/s, always accelerating', () => {
    const grow = GAME.cutscene.growMs / 1000;
    const speed = (tau: number) => (cutsceneAngle(tau + 0.0005) - cutsceneAngle(tau)) / (0.0005 * grow);
    expect(speed(0)).toBeCloseTo(110, -1);
    expect(speed(0.999)).toBeCloseTo(260, -1);
    let prev = 0;
    for (let k = 0; k <= 20; k++) {
      const s = speed((k / 20) * 0.999);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });
});

describe('cutscene dramaturgy (five acts, three template stages)', () => {
  const withCutscene = AURAS.filter((a) => a.cutscene);
  const rankOf = (id: string) => tierOf(AURA_BY_ID[id]).rank;
  const extraOf = (id: string) => tierOf(AURA_BY_ID[id]).staging.cutsceneExtraMs;

  it('maps rarity to the template stage', () => {
    expect(cutsceneStage(6)).toBe('high');
    expect(cutsceneStage(GAME.cutscene.plusFromRank)).toBe('plus');
    expect(cutsceneStage(GAME.cutscene.topFromRank)).toBe('top');
  });

  it('gives every cutscene a break window, atmosphere and own text from the plus stage on', () => {
    for (const a of withCutscene) {
      expect(extraOf(a.id), a.id).toBeGreaterThan(0);
      const def = a.cutscene!;
      expect(def.fog !== false || !!def.particles, `${a.id} atmosphere`).toBe(true);
      if (cutsceneStage(rankOf(a.id)) !== 'high') expect(def.lines?.length, `${a.id} lines`).toBeGreaterThan(0);
    }
  });

  it('places text cards: none at the high stage, one during the build-up at plus, all at top', () => {
    for (const a of withCutscene) {
      const def = a.cutscene!;
      const stage = cutsceneStage(rankOf(a.id));
      const lines = cutsceneLines(def, rankOf(a.id), extraOf(a.id));
      const tl = cutsceneTimeline(extraOf(a.id));
      if (stage === 'high') expect(lines, a.id).toEqual([]);
      if (stage === 'plus') {
        expect(lines.length, a.id).toBe(1);
        expect(lines[0].from, a.id).toBeGreaterThanOrEqual(tl.black);
      }
      if (stage === 'top') {
        expect(lines.length, a.id).toBe(def.lines!.length);
        expect(lines[0].to, a.id).toBeLessThanOrEqual(tl.black);
      }
      for (let i = 0; i < lines.length; i++) {
        expect(lines[i].to, a.id).toBeGreaterThan(lines[i].from);
        expect(lines[i].to, a.id).toBeLessThanOrEqual(tl.growEnd);
        if (i > 0) expect(lines[i].from, a.id).toBeGreaterThanOrEqual(lines[i - 1].to);
      }
    }
  });

  it('accelerates the ramp but never flickers faster than 3 Hz', () => {
    const times = rampTimes();
    expect(times.length).toBeGreaterThan(5);
    for (let i = 2; i < times.length; i++) {
      const gap = times[i] - times[i - 1];
      expect(gap).toBeLessThanOrEqual(times[i - 1] - times[i - 2] + 1e-6);
      expect(gap).toBeGreaterThanOrEqual(GAME.cutscene.flashMinMs);
      expect(1000 / gap).toBeLessThanOrEqual(3);
    }
    expect(times[times.length - 1]).toBeLessThan(pulseTimes()[0]);
  });

  it('orders the acts: jingle first, ramp, double pulse, then the break inside its window', () => {
    for (const a of withCutscene) {
      const def = a.cutscene!;
      const cues = cutsceneCues(def, extraOf(a.id));
      const tl = cutsceneTimeline(extraOf(a.id));
      expect(cues[0], a.id).toEqual({ t: 0, cue: 'jingle' });
      const pulses = cues.filter((c) => c.cue === 'pulse');
      expect(pulses.length, a.id).toBe(2);
      for (const p of pulses) expect(p.t, a.id).toBeLessThan(tl.growEnd);
      const breaks = cues.filter((c) => c.cue === 'break');
      if (def.climax !== 'none') expect(breaks.length, a.id).toBeGreaterThan(0);
      for (const b of breaks) {
        expect(b.t, a.id).toBeGreaterThanOrEqual(tl.growEnd);
        expect(b.t, a.id).toBeLessThan(tl.fillStart);
      }
      for (let i = 1; i < cues.length; i++) expect(cues[i].t).toBeGreaterThanOrEqual(cues[i - 1].t);
    }
  });

  it('runs a counter from its start value to its end value over the build-up', () => {
    const r = { kind: 'counter' as const, from: 10, to: 0, label: 'T MINUS', unit: 's', decimals: 1 };
    const tl = cutsceneTimeline(0);
    expect(counterValue(r, tl.black)).toBe(10);
    expect(counterValue(r, tl.growEnd)).toBe(0);
    expect(counterValue(r, tl.growEnd + 5000)).toBe(0);
    expect(formatCounter(r, 3.25)).toBe('T MINUS 3,3 s');
  });

  it('keeps every ring out of the cutscene symbols', () => {
    for (const a of withCutscene) {
      for (const l of a.cutscene!.layers) {
        expect(l.kind, a.id).not.toBe('prismRings');
        if (l.kind === 'circle') expect(l.width, `${a.id}: only solid discs`).toBe(0);
      }
    }
  });
});

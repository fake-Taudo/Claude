import { describe, expect, it } from 'vitest';
import { AURAS, AURA_BY_ID } from '../src/config';
import { VFX_SPECS, VTIERS, VTIER_OF } from '../src/config/vfx';
import type { AuraVfxSpec, LayerSpec } from '../src/config/vfx/types';

// Checklist per aura (see DECISIONS.md, "Aura-VFX"): hero, ground, smoke, vertical element,
// accent event, budgets and the calm budget for rotation speeds.

const roles = (s: AuraVfxSpec, role: LayerSpec['role']) => s.layers.filter((l) => l.role === role);
const hexOk = (c: string) => !c.startsWith('#') || /^#[0-9a-fA-F]{6}$/.test(c);

function colorsOf(l: LayerSpec): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(l)) {
    if ((k === 'color' || k === 'color2' || k === 'fadeTo') && typeof v === 'string') out.push(v);
    if ((k === 'color' || k === 'colors') && Array.isArray(v)) out.push(...(v as string[]));
  }
  return out;
}

describe('aura VFX specs', () => {
  it('belong to existing auras, once each, with the tier of their rarity', () => {
    const seen = new Set<string>();
    for (const s of VFX_SPECS) {
      expect(AURA_BY_ID[s.id], s.id).toBeDefined();
      expect(seen.has(s.id), s.id).toBe(false);
      seen.add(s.id);
      expect(s.tier, s.id).toBe(VTIER_OF[AURA_BY_ID[s.id].tier]);
    }
  });

  it('give every aura exactly one hero with a motif no other aura uses', () => {
    const motifs = new Map<string, string>();
    for (const s of VFX_SPECS) {
      const heroes = roles(s, 'hero');
      expect(heroes.length, s.id).toBe(1);
      const motif = heroes[0].motif;
      expect(motif, s.id).toBeTruthy();
      expect(motifs.get(motif!), `${s.id} shares ${motif}`).toBeUndefined();
      motifs.set(motif!, s.id);
    }
  });

  it('follow the recipe per tier: ground from V1, smoke, vertical element and accent from V2', () => {
    for (const s of VFX_SPECS) {
      if (s.tier >= 1) expect(roles(s, 'ground').length, `${s.id} ground`).toBeGreaterThan(0);
      if (s.tier >= 2) {
        expect(roles(s, 'smoke').length, `${s.id} smoke`).toBeGreaterThan(0);
        expect(roles(s, 'vertical').length, `${s.id} vertical`).toBeGreaterThan(0);
        const every = s.motion.accent.every;
        expect(every, `${s.id} accent`).toBeDefined();
        expect(every![0], s.id).toBeGreaterThanOrEqual(5);
        expect(every![1], s.id).toBeLessThanOrEqual(9);
      }
    }
  });

  it('stay within the particle and layer budget of their tier', () => {
    for (const s of VFX_SPECS) {
      const t = VTIERS[s.tier];
      let steady = 0;
      let burst = 0;
      for (const l of s.layers) {
        if (l.type === 'particles') {
          steady += l.count;
          burst += l.burst ?? 0;
        }
      }
      expect(steady, `${s.id} particles`).toBeLessThanOrEqual(t.particles);
      expect(steady + burst, `${s.id} particles incl. bursts`).toBeLessThanOrEqual(Math.round(t.particles * 1.35));
      // Accent-only layers (shockwaves, lightning, flares) do not count as standing layers.
      const standing = s.layers.filter((l) => l.type !== 'shockwave' && l.type !== 'lightning' && !(l.type === 'flare' && !l.base));
      expect(standing.length, `${s.id} layers`).toBeLessThanOrEqual(t.layers + 2);
    }
  });

  it('keep the calm budget: slow large elements, moderate rings, soft breathing, no fast flicker', () => {
    for (const s of VFX_SPECS) {
      expect(s.motion.breatheHz, s.id).toBeGreaterThanOrEqual(0.1);
      expect(s.motion.breatheHz, s.id).toBeLessThanOrEqual(0.3);
      const bands = s.layers.filter((l) => l.type === 'band');
      expect(bands.length, `${s.id} rings`).toBeLessThanOrEqual(3);
      for (const l of s.layers) {
        if ((l.type === 'sigil' || l.type === 'rays' || l.type === 'nebula') && l.radius >= 1) expect(Math.abs(l.spin), `${s.id} ${l.name}`).toBeLessThanOrEqual(10);
        if (l.type === 'band') expect(Math.abs(l.spin), `${s.id} ${l.name}`).toBeLessThanOrEqual(35);
        if (l.type === 'particles' && l.twinkle) expect(l.twinkle, `${s.id} ${l.name}`).toBeLessThanOrEqual(3);
        if (l.type === 'flare' && l.twinkle) expect(l.twinkle, `${s.id} ${l.name}`).toBeLessThanOrEqual(3);
      }
    }
  });

  it('use valid colours', () => {
    for (const s of VFX_SPECS) {
      for (const c of Object.values(s.palette)) expect(/^#[0-9a-fA-F]{6}$/.test(c) || /^(main|glow|accent|p\d)$/.test(c), `${s.id} ${c}`).toBe(true);
      for (const l of s.layers) for (const c of colorsOf(l)) expect(hexOk(c), `${s.id} ${l.name} ${c}`).toBe(true);
    }
  });

  // Enabled once every aura has its spec (phase 5 of the VFX rebuild).
  it.skip('cover every aura of the roster', () => {
    const ids = new Set(VFX_SPECS.map((s) => s.id));
    const missing = AURAS.filter((a) => !ids.has(a.id)).map((a) => a.id);
    expect(missing).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { AURAS, AURA_BY_ID, BIOMES, GAME, TIER_BY_ID } from '../src/config';
import { auraProbability, buildRollTable, displayOdds, distribution, getRollTable, poolFor, rollAura } from '../src/core/odds';
import { Rng } from '../src/core/rng';

describe('roster', () => {
  it('has at least 50 auras with unique ids and names', () => {
    expect(AURAS.length).toBeGreaterThanOrEqual(50);
    expect(new Set(AURAS.map((a) => a.id)).size).toBe(AURAS.length);
    expect(new Set(AURAS.map((a) => a.name)).size).toBe(AURAS.length);
  });

  it('keeps the 18 prototype auras in their original order of rarity', () => {
    const proto = ['staub', 'moos', 'flut', 'asche', 'frost', 'sturm', 'sonnenkern', 'nebula', 'eklipse', 'urlicht', 'singularitaet', 'ewigkeit', 'quasar', 'multiversum', 'urknall', 'entropie', 'paradoxon', 'omniversum'];
    const odds = proto.map((id) => displayOdds(AURA_BY_ID[id]));
    for (let i = 1; i < odds.length; i++) expect(odds[i]).toBeGreaterThan(odds[i - 1]);
    expect(AURA_BY_ID.urlicht.odds).toBe(5000);
    expect(AURA_BY_ID.omniversum.odds).toBe(100_000_000);
  });

  it('extends the odds scale beyond 1 in 100.000.000', () => {
    expect(Math.max(...AURAS.map((a) => a.odds))).toBeGreaterThan(1e9);
  });

  it('gives every aura from 1 in 10.000 a cutscene and no aura below', () => {
    for (const a of AURAS) {
      expect(!!a.cutscene, a.id).toBe(a.odds >= GAME.cutscene.minOdds);
      expect(a.vfx.rings.length, a.id).toBeLessThanOrEqual(3);
    }
  });

  it('assigns each biome aura to an existing biome', () => {
    const ids = new Set(BIOMES.biomes.map((b) => b.id));
    for (const a of AURAS.filter((x) => x.biome)) expect(ids.has(a.biome!), a.id).toBe(true);
    for (const b of BIOMES.biomes) expect(AURAS.some((a) => a.biome === b.id), b.id).toBe(true);
  });

  it('sells rarer auras for at least as much', () => {
    const base = poolFor(null).sort((a, b) => displayOdds(a) - displayOdds(b));
    for (let i = 1; i < base.length; i++) expect(base[i].sell, base[i].id).toBeGreaterThanOrEqual(base[i - 1].sell);
  });
});

describe('roll table', () => {
  it('normalises to exactly 100 % at luck 1 in every pool', () => {
    for (const biome of [null, ...BIOMES.biomes.map((b) => b.id)]) {
      const dist = distribution(buildRollTable(biome), 1);
      const sum = [...dist.values()].reduce((s, p) => s + p, 0);
      expect(Math.abs(sum - 1)).toBeLessThan(1e-12);
    }
  });

  it('gives every non-fallback aura exactly 1/odds at luck 1', () => {
    const table = getRollTable(null);
    for (const e of table.entries) {
      expect(auraProbability(table, 1, e.aura.id) * e.aura.odds).toBeCloseTo(1, 10);
    }
    expect(displayOdds(AURA_BY_ID.staub)).toBeGreaterThan(2.5);
    expect(displayOdds(AURA_BY_ID.staub)).toBeLessThan(2.7);
  });

  it('turns +50 % luck into 1.5x the chance for rare auras', () => {
    const table = getRollTable(null);
    for (const id of ['eklipse', 'urlicht', 'singularitaet', 'ewigkeit', 'omniversum']) {
      const ratio = auraProbability(table, 1.5, id) / auraProbability(table, 1, id);
      expect(ratio).toBeGreaterThan(1.49);
      expect(ratio).toBeLessThanOrEqual(1.5);
    }
  });

  it('does not flatten the distribution at high luck (unlike chance^(1/L))', () => {
    const table = getRollTable(null);
    const d = distribution(table, 500);
    // At 500x luck everything is at least legendary, but the steps above stay steep:
    // the prototype gave every aura roughly the same 7-8 % here.
    let legendaryPlus = 0;
    for (const [id, p] of d) if (TIER_BY_ID[AURA_BY_ID[id].tier].rank >= 4) legendaryPlus += p;
    expect(legendaryPlus).toBeGreaterThan(0.99);
    expect(d.get('omniversum')!).toBeLessThan(1e-4);
    expect(d.get('ewigkeit')! / d.get('urlicht')!).toBeLessThan(0.1);
    expect(d.get('staub')!).toBe(0);
  });

  it('biome auras only appear in their biome and cost the fallback, not other auras', () => {
    const base = getRollTable(null);
    const meteor = getRollTable('meteorschauer');
    expect(auraProbability(base, 1, 'meteorit')).toBe(0);
    expect(auraProbability(meteor, 1, 'meteorit')).toBeCloseTo(1 / 1500, 12);
    expect(auraProbability(meteor, 1, 'urlicht')).toBeCloseTo(auraProbability(base, 1, 'urlicht'), 12);
    expect(auraProbability(meteor, 1, 'staub')).toBeLessThan(auraProbability(base, 1, 'staub'));
  });

  it('sampling matches the analytic distribution', () => {
    const table = getRollTable(null);
    const rng = new Rng(2024);
    const n = 400_000;
    const luck = 3;
    const counts = new Map<string, number>();
    for (let i = 0; i < n; i++) {
      const a = rollAura(table, luck, rng);
      counts.set(a.id, (counts.get(a.id) ?? 0) + 1);
    }
    const dist = distribution(table, luck);
    for (const [id, p] of dist) {
      if (p * n < 200) continue;
      const observed = (counts.get(id) ?? 0) / n;
      const sigma = Math.sqrt((p * (1 - p)) / n);
      expect(Math.abs(observed - p), id).toBeLessThan(5 * sigma);
    }
  });

  it('stays monotonic: more luck never lowers the chance of a rare tier', () => {
    const table = getRollTable(null);
    const rareShare = (l: number) => {
      let s = 0;
      for (const [id, p] of distribution(table, l)) if (TIER_BY_ID[AURA_BY_ID[id].tier].rank >= 4) s += p;
      return s;
    };
    let prev = 0;
    for (const l of [1, 1.5, 2, 3, 10, 100, 500]) {
      const s = rareShare(l);
      expect(s).toBeGreaterThan(prev);
      prev = s;
    }
  });
});

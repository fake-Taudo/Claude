import { describe, expect, it } from 'vitest';
import { BIOMES } from '../src/config';
import { activeBiome, biomeStatus, biomeWindow, slotAt } from '../src/core/biomes';
import { beginRoll, completeRoll, drinkPotion } from '../src/core/engine';
import { formatClock, formatCompact, formatGold, formatMult, formatOdds, formatPercent } from '../src/core/format';
import { catchUpWindow, simulateAutoRolls } from '../src/core/offline';
import { Rng } from '../src/core/rng';
import { SaveError, decodeExport, deserialize, encodeExport, migrate, sanitize, serialize } from '../src/core/save';
import { SAVE_VERSION } from '../src/core/state';
import { T0, fresh } from './helpers';

describe('save', () => {
  it('round-trips a played state', () => {
    const { state, rng } = fresh(5);
    for (let i = 0; i < 50; i++) {
      beginRoll(state, { now: T0, rng }, false);
      completeRoll(state, { now: T0, rng });
    }
    state.potions = { sun: 1 };
    drinkPotion(state, 'sun', 1, T0);
    const back = deserialize(serialize(state), T0);
    expect(back).toEqual(state);
  });

  it('migrates old versions step by step and refuses newer ones', () => {
    const migrations = { 0: (r: Record<string, unknown>) => ({ ...r, a: 1 }), 1: (r: Record<string, unknown>) => ({ ...r, b: (r.a as number) + 1 }) };
    expect(migrate({ version: 0 }, migrations, 2)).toEqual({ version: 2, a: 1, b: 2 });
    expect(() => migrate({ version: 9 }, migrations, 2)).toThrow(SaveError);
    expect(() => migrate({ version: 0 }, {}, 1)).toThrow(SaveError);
    expect(deserialize(JSON.stringify({ seed: 3 }), T0).version).toBe(SAVE_VERSION);
  });

  it('sanitises broken or hostile data instead of crashing', () => {
    const s = sanitize(
      {
        seed: 1,
        gold: -500,
        auras: { staub: -3, moos: 2.7, unbekannt: 9, frost: 'x' },
        potions: { sun: 2, nope: 1 },
        equippedAura: 'eklipse',
        buffs: [{ source: 'potion', ref: 'sun', endsAt: T0 + 1000 }, { source: 'potion', ref: 'sun', endsAt: T0 + 5000 }, { source: 'hack', ref: 'x' }],
        rebirth: 99,
        stats: { rolls: -1, biomesSeen: ['nebelfeld', 'mars'] },
      },
      T0,
    );
    expect(s.gold).toBe(0);
    expect(s.auras).toEqual({ moos: 2 });
    expect(s.potions).toEqual({ sun: 2 });
    expect(s.equippedAura).toBeNull();
    expect(s.buffs).toHaveLength(1);
    expect(s.rebirth).toBe(3);
    expect(s.stats.rolls).toBe(0);
    expect(s.stats.biomesSeen).toEqual(['nebelfeld']);
  });

  it('rejects invalid JSON with a SaveError', () => {
    expect(() => deserialize('{nope', T0)).toThrow(SaveError);
    expect(() => deserialize('[1,2]', T0)).toThrow(SaveError);
  });

  it('exports and imports a text code with checksum', () => {
    const { state } = fresh(8);
    state.gold = 12345;
    state.auras = { nebula: 3 };
    const code = encodeExport(state);
    expect(code.startsWith('PRNG1.')).toBe(true);
    expect(decodeExport(code, T0).gold).toBe(12345);
    const tampered = code.replace(/\.([0-9a-f]{8})$/, '.00000000');
    expect(() => decodeExport(tampered, T0)).toThrow(SaveError);
    expect(() => decodeExport('hallo', T0)).toThrow(SaveError);
  });
});

describe('biomes', () => {
  it('is deterministic and stays inside its slot', () => {
    for (let slot = 1000; slot < 1400; slot++) {
      const w = biomeWindow(slot);
      expect(biomeWindow(slot)).toEqual(w);
      expect(w.start).toBeGreaterThanOrEqual(w.slotStart);
      expect(w.end).toBeLessThanOrEqual(w.slotEnd);
    }
  });

  it('roughly matches the configured weights', () => {
    const counts = new Map<string, number>();
    const n = 50_000;
    for (let slot = 0; slot < n; slot++) {
      const id = biomeWindow(slot).biome?.id ?? 'clear';
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const total = BIOMES.clearWeight + BIOMES.biomes.reduce((s, b) => s + b.weight, 0);
    expect((counts.get('clear') ?? 0) / n).toBeCloseTo(BIOMES.clearWeight / total, 1);
    for (const b of BIOMES.biomes) expect((counts.get(b.id) ?? 0) / n).toBeCloseTo(b.weight / total, 1);
  });

  it('reports the active biome and its end time', () => {
    let found = false;
    for (let slot = slotAt(T0); slot < slotAt(T0) + 200 && !found; slot++) {
      const w = biomeWindow(slot);
      if (!w.biome) continue;
      const mid = (w.start + w.end) / 2;
      expect(activeBiome(mid)?.id).toBe(w.biome.id);
      expect(biomeStatus(mid).endsAt).toBe(w.end);
      expect(activeBiome(w.end)).toBeNull();
      found = true;
    }
    expect(found).toBe(true);
  });
});

describe('offline catch-up', () => {
  it('simulates auto rolls at the configured efficiency', () => {
    const { state } = fresh(21);
    const rng = new Rng(21);
    const hour = 3600_000;
    const s = simulateAutoRolls(state, rng, T0, T0 + hour, 0.5);
    // 1125 ms per auto roll at speed 1 (biomes may add speed), half efficiency.
    expect(s.rolls).toBeGreaterThan(1500);
    expect(s.rolls).toBeLessThan(1800);
    expect(state.stats.rolls).toBe(s.rolls);
    expect(state.stats.offlineRolls).toBe(s.rolls);
    expect(state.pendingRoll).toBeNull();
  });

  it('lets timed buffs expire on the simulated clock', () => {
    const { state } = fresh(4);
    state.potions = { divine: 1, sun: 1 };
    drinkPotion(state, 'sun', 1, T0);
    drinkPotion(state, 'divine', 1, T0);
    simulateAutoRolls(state, new Rng(4), T0, T0 + 600_000, 1);
    expect(state.buffs.find((b) => b.id === 'potion:divine')).toBeUndefined();
    expect(state.stats.bestLuck).toBeGreaterThanOrEqual(500);
  });

  it('caps the catch-up window', () => {
    expect(catchUpWindow(5_000)).toBe(0);
    expect(catchUpWindow(48 * 3600_000)).toBe(8 * 3600_000);
  });
});

describe('format (de-DE)', () => {
  it('formats odds like the prototype', () => {
    expect(formatOdds(2.5)).toBe('1 in 2,5');
    expect(formatOdds(100 / 15)).toBe('1 in 6,7');
    expect(formatOdds(100 / 3)).toBe('1 in 33');
    expect(formatOdds(100 / 0.006)).toBe('1 in 16.667');
    expect(formatOdds(1e8)).toBe('1 in 100.000.000');
  });

  it('formats gold, compact numbers and multipliers', () => {
    expect(formatGold(10)).toBe('0,01');
    expect(formatGold(1500)).toBe('1,5');
    expect(formatGold(1234_000)).toBe('1.234');
    expect(formatGold(25_000_000)).toBe('25K');
    expect(formatCompact(3_400_000)).toBe('3,4 Mio.');
    expect(formatCompact(2e9)).toBe('2 Mrd.');
    expect(formatMult(3.2)).toBe('3,2x');
    expect(formatPercent(0.75)).toBe('+75 %');
    expect(formatClock(75_000)).toBe('1:15');
  });
});

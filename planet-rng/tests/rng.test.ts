import { describe, expect, it } from 'vitest';
import { Rng, hash32 } from '../src/core/rng';

describe('Rng', () => {
  it('is deterministic for the same seed', () => {
    const a = new Rng(123);
    const b = new Rng(123);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  it('differs for different seeds', () => {
    const a = new Rng(1);
    const b = new Rng(2);
    const same = Array.from({ length: 20 }, () => a.next() === b.next()).filter(Boolean).length;
    expect(same).toBe(0);
  });

  it('can be saved and restored mid-stream', () => {
    const a = new Rng(99);
    for (let i = 0; i < 37; i++) a.next();
    const b = new Rng(a.getState());
    for (let i = 0; i < 50; i++) expect(b.next()).toBe(a.next());
  });

  it('produces uniform floats in [0, 1) with 53-bit resolution', () => {
    const r = new Rng(7);
    let sum = 0;
    let min = 1;
    let max = 0;
    let fractional = 0;
    const n = 200_000;
    for (let i = 0; i < n; i++) {
      const x = r.next();
      sum += x;
      min = Math.min(min, x);
      max = Math.max(max, x);
      // A 32-bit generator would always give multiples of 2^-32.
      if ((x * 2 ** 32) % 1 !== 0) fractional++;
    }
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThan(1);
    expect(sum / n).toBeCloseTo(0.5, 2);
    expect(fractional / n).toBeGreaterThan(0.99);
  });

  it('int() covers the inclusive range evenly', () => {
    const r = new Rng(5);
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 40_000; i++) counts[r.int(3, 6) - 3]++;
    for (const c of counts) expect(c / 40_000).toBeCloseTo(0.25, 1);
  });

  it('hash32 is stable and sensitive to every input', () => {
    expect(hash32(1, 2)).toBe(hash32(1, 2));
    expect(hash32(1, 2)).not.toBe(hash32(2, 1));
    expect(hash32(1_700_000_000_000)).not.toBe(hash32(1_700_000_000_001));
  });
});

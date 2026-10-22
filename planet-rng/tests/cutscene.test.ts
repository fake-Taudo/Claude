import { describe, expect, it } from 'vitest';
import { GAME } from '../src/config';
import { cutsceneAngle } from '../src/render/cutscene';

describe('cutscene timeline', () => {
  it('spins about 11 turns during the grow phase', () => {
    const turns = cutsceneAngle(1) / 360;
    expect(turns).toBeGreaterThan(10.8);
    expect(turns).toBeLessThan(11.2);
  });

  it('starts at about 220°/s and ends at about 520°/s, always accelerating', () => {
    const grow = GAME.cutscene.growMs / 1000;
    const speed = (tau: number) => (cutsceneAngle(tau + 0.0005) - cutsceneAngle(tau)) / (0.0005 * grow);
    expect(speed(0)).toBeCloseTo(220, -1);
    expect(speed(0.999)).toBeCloseTo(520, -1);
    let prev = 0;
    for (let k = 0; k <= 20; k++) {
      const s = speed((k / 20) * 0.999);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });
});

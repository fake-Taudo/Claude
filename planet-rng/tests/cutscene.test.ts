import { describe, expect, it } from 'vitest';
import { GAME } from '../src/config';
import { cutsceneAngle } from '../src/render/cutscene';

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

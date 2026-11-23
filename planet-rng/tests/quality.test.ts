import { describe, expect, it } from 'vitest';
import { DPR_OF_QUALITY } from '../src/config/vfx';
import { QualityGuard } from '../src/render/quality';

// Automatic effect quality (src/render/quality.ts): thins effects on slow devices, ignores
// a capped frame rate, recovers, and never goes above the player's setting.

/** Feeds `seconds` of frames: interval from `frame(i)`, JS render time `work` ms. */
function run(g: QualityGuard, seconds: number, frame: (i: number) => number, work: number, setting: 'low' | 'medium' | 'high' = 'high'): void {
  let t = 0;
  for (let i = 0; t < seconds * 1000; i++) {
    const dt = frame(i);
    g.tick(dt, work, setting);
    t += dt;
  }
}

describe('quality guard', () => {
  it('leaves a browser alone that caps the frame rate at 30 fps', () => {
    const g = new QualityGuard();
    run(g, 30, () => 33.3, 3);
    expect(g.effective('high')).toBe('high');
  });

  it('thins out the effects when frames are long and irregular', () => {
    const g = new QualityGuard();
    run(g, 5, (i) => (i % 2 ? 70 : 110), 2);
    expect(g.effective('high')).toBe('medium');
    run(g, 5, (i) => (i % 2 ? 70 : 110), 2);
    expect(g.effective('high')).toBe('low');
  });

  it('thins out the effects when the JS work itself is too heavy', () => {
    const g = new QualityGuard();
    run(g, 5, () => 16.7, 18);
    expect(g.effective('high')).toBe('medium');
  });

  it('recovers after a comfortable stretch, but never above the setting', () => {
    const g = new QualityGuard();
    run(g, 10, (i) => (i % 2 ? 70 : 110), 2);
    expect(g.effective('medium')).toBe('low');
    run(g, 40, () => 16.7, 2, 'medium');
    expect(g.effective('medium')).toBe('medium');
    expect(g.ceiling).toBe('medium');
  });

  it('ignores a single long pause (tab switch, hitch)', () => {
    const g = new QualityGuard();
    run(g, 2, () => 16.7, 3);
    g.tick(5000, 3, 'high');
    run(g, 5, () => 16.7, 3);
    expect(g.effective('high')).toBe('high');
  });

  it('keeps the render resolution a matter of the setting alone', () => {
    expect(DPR_OF_QUALITY.low).toBeGreaterThanOrEqual(1.5);
    expect(DPR_OF_QUALITY.medium).toBeGreaterThanOrEqual(2);
    expect(DPR_OF_QUALITY.high).toBe(3);
  });
});

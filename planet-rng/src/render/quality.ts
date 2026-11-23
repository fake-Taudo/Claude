// Automatic effect quality. Thins out the effects (particles, optional layers, bloom) when
// rendering stays slow and restores them after a comfortable stretch, never above the
// player's setting. The render resolution is not its business: that follows the setting.

import { VFX } from '../config/vfx';
import type { Quality } from '../config/vfx/types';

const QUALITIES: Quality[] = ['low', 'medium', 'high'];

export class QualityGuard {
  /** Effect quality ceiling (the effective quality is min(setting, ceiling)). */
  ceiling: Quality = 'high';
  /** Averages in ms: frame interval, its jitter and the JS time spent rendering. */
  frameAvg = 16;
  jitterAvg = 0;
  workAvg = 4;
  private slowFor = 0;
  private fastFor = 0;

  reset(): void {
    this.ceiling = 'high';
    this.slowFor = 0;
    this.fastFor = 0;
  }

  effective(setting: Quality): Quality {
    return QUALITIES[Math.min(QUALITIES.indexOf(setting), QUALITIES.indexOf(this.ceiling))];
  }

  /**
   * One frame: interval and render time in ms. Rendering counts as slow when the JS work is
   * heavy, or when frames are long and either the work is substantial or the intervals are
   * irregular. Long but steady frames (a browser capping at 30 fps to save power) are fine.
   * Canvas rasterisation happens outside JS, so long irregular frames are the usual sign of
   * a device that cannot keep up.
   */
  tick(intervalMs: number, workMs: number, setting: Quality): void {
    const g = VFX.autoQuality;
    const dtMs = Math.min(100, intervalMs);
    this.jitterAvg = this.jitterAvg * 0.95 + Math.abs(dtMs - this.frameAvg) * 0.05;
    this.frameAvg = this.frameAvg * 0.95 + dtMs * 0.05;
    this.workAvg = this.workAvg * 0.95 + Math.min(100, workMs) * 0.05;
    const dt = dtMs / 1000;
    const long = this.frameAvg > g.slowFrameMs;
    const slow = this.workAvg > g.slowWorkMs || (long && (this.workAvg > g.busyWorkMs || this.jitterAvg > g.jitterMs));
    const fast = this.workAvg < g.fastWorkMs && this.frameAvg < g.fastFrameMs;
    this.slowFor = slow ? this.slowFor + dt : Math.max(0, this.slowFor - dt * 0.5);
    this.fastFor = fast ? this.fastFor + dt : 0;
    const i = QUALITIES.indexOf(this.effective(setting));
    if (this.slowFor > g.slowSec) {
      if (i > 0) this.ceiling = QUALITIES[i - 1];
      this.slowFor = 0;
      this.fastFor = 0;
    } else if (this.fastFor > g.recoverSec && i < QUALITIES.indexOf(setting)) {
      this.ceiling = QUALITIES[i + 1];
      this.fastFor = 0;
    }
  }
}

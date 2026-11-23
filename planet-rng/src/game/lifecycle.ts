// Time and page lifecycle: periodic tick, autosave, tab visibility (AFK catch-up)
// and offline catch-up on start.

import { GAME } from '../config';
import { activeBiome } from '../core/biomes';
import { completeRoll, tick as engineTick } from '../core/engine';
import { catchUpWindow, simulateAutoRolls, type OfflineSummary } from '../core/offline';
import type { GameStore } from '../store/store';
import type { UiStore } from '../store/ui';
import type { RollController } from './controller';

const TICK_MS = 1000;

export class Lifecycle {
  private prevBiome: string | null;
  private lastTick: number;
  private hiddenAt: number | null = null;
  private intervals: ReturnType<typeof setInterval>[] = [];

  constructor(
    private game: GameStore,
    private ui: UiStore,
    private controller: RollController,
  ) {
    this.prevBiome = activeBiome(game.now())?.id ?? null;
    this.lastTick = game.now();
  }

  /** Finishes an interrupted roll and simulates offline auto rolls. Call once before start(). */
  restore(): void {
    if (this.game.state.pendingRoll) this.game.apply((s, ctx) => completeRoll(s, ctx), 'none');
    if (this.game.state.auto) {
      const now = this.game.now();
      const window = catchUpWindow(now - this.game.state.lastActiveAt);
      if (window > 0) this.catchUp(now - window, now, GAME.offline.closedEfficiency);
    }
  }

  start(): void {
    this.tick();
    this.intervals.push(setInterval(() => this.tick(), TICK_MS));
    this.intervals.push(setInterval(() => this.game.autosave(), GAME.save.autosaveMs));
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pagehide', this.onLeave);
    window.addEventListener('beforeunload', this.onLeave);
  }

  stop(): void {
    for (const i of this.intervals) clearInterval(i);
    this.intervals = [];
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pagehide', this.onLeave);
    window.removeEventListener('beforeunload', this.onLeave);
  }

  tick(): void {
    if (document.hidden) return;
    const now = this.game.now();
    const active = Math.min(now - this.lastTick, TICK_MS * 5);
    this.lastTick = now;
    const prev = this.prevBiome;
    this.game.apply((s, ctx) => engineTick(s, ctx.now, prev, active), 'none', true);
    this.prevBiome = activeBiome(now)?.id ?? null;
  }

  private onVisibility = (): void => {
    if (document.hidden) {
      this.hiddenAt = this.game.now();
      this.controller.suspend();
      this.game.saveNow();
    } else {
      const hiddenAt = this.hiddenAt;
      this.hiddenAt = null;
      this.lastTick = this.game.now();
      if (hiddenAt !== null && this.game.state.auto && this.controller.phase !== 'cutscene') {
        const now = this.game.now();
        const window = catchUpWindow(now - hiddenAt);
        if (window > 0) this.catchUp(now - window, now, GAME.offline.hiddenEfficiency);
      }
      this.tick();
      this.controller.resume();
    }
  };

  private onLeave = (): void => {
    this.game.state.lastActiveAt = this.game.now();
    this.game.saveNow();
  };

  private catchUp(from: number, to: number, efficiency: number): void {
    let summary: OfflineSummary | null = null;
    this.game.apply((s) => {
      summary = simulateAutoRolls(s, this.game.rng, from, to, efficiency);
      return summary.events;
    }, 'now');
    const result = summary as OfflineSummary | null;
    if (result && result.rolls > 0) {
      this.ui.offline = result;
      this.ui.changed();
    }
  }
}

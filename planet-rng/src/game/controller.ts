// Roll loop: manual roll, auto roll, quick roll, suspense timing and cutscene gating.
// The engine decides *what* is rolled, this controller decides *when* things happen.

import { AURA_BY_ID, GAME, tierOf } from '../config';
import { activeBiome } from '../core/biomes';
import { beginRoll, completeRoll, markCutsceneSeen } from '../core/engine';
import { computeSpeed, rollDurationMs } from '../core/modifiers';
import type { GameStore } from '../store/store';
import type { UiStore } from '../store/ui';

export interface CutscenePlayer {
  /** Plays the cutscene of an aura. Resolves at the moment the aura is revealed. */
  play(auraId: string): Promise<void>;
}

export type RollPhase = 'idle' | 'rolling' | 'cutscene' | 'cooldown';

export class RollController {
  phase: RollPhase = 'idle';
  /** Start and length of the current cycle (for the button's progress ring). */
  cycleStart = 0;
  cycleMs = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private suspended = false;
  private listeners = new Set<() => void>();
  cutscenes: CutscenePlayer = { play: () => Promise.resolve() };

  constructor(
    private game: GameStore,
    private ui: UiStore,
  ) {}

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private setPhase(phase: RollPhase): void {
    this.phase = phase;
    for (const fn of this.listeners) fn();
  }

  get auto(): boolean {
    return this.game.state.auto;
  }

  get quick(): boolean {
    return this.game.settings.quickRoll;
  }

  get busy(): boolean {
    return this.phase !== 'idle';
  }

  setAuto(on: boolean): void {
    if (this.game.state.auto === on) return;
    this.game.state.auto = on;
    this.game.touch();
    for (const fn of this.listeners) fn();
    if (on && this.phase === 'idle') this.roll(true);
  }

  toggleAuto(): void {
    this.setAuto(!this.auto);
  }

  toggleQuick(): void {
    this.game.setSettings({ quickRoll: !this.quick });
    for (const fn of this.listeners) fn();
  }

  /** Starts a roll if possible. Returns false while busy. */
  roll(auto = false): boolean {
    if (this.phase !== 'idle' || this.suspended) return false;
    const now = this.game.now();
    const events = this.game.apply((s, ctx) => beginRoll(s, ctx, auto), 'soon');
    const pending = this.game.state.pendingRoll;
    if (!pending || events.some((e) => e.type === 'error')) return false;

    const aura = AURA_BY_ID[pending.aura];
    const tier = tierOf(aura);
    const biome = activeBiome(now)?.id ?? null;
    const speed = computeSpeed(this.game.state, now, biome).total;
    const base = rollDurationMs(speed, auto);
    const needsCutscene = !!aura.cutscene && this.game.settings.cutscenes;

    this.cycleStart = now;
    if (this.quick) {
      this.cycleMs = base * GAME.roll.quickFactor;
      this.setPhase('cooldown');
      if (needsCutscene) {
        this.playCutscene(pending.aura, true);
      } else {
        this.complete(true, false);
        this.schedule(this.cycleMs, () => this.cycleDone());
      }
      return true;
    }

    const duration = base + tier.staging.suspenseMs;
    this.cycleMs = duration;
    this.setPhase('rolling');
    this.game.bus.emit('rollAnim', { duration, aura: pending.aura, lucky: pending.lucky });
    this.schedule(duration, () => {
      if (needsCutscene) this.playCutscene(pending.aura, false);
      else {
        this.complete(false, false);
        this.cycleDone();
      }
    });
    return true;
  }

  private playCutscene(auraId: string, quick: boolean): void {
    this.setPhase('cutscene');
    this.ui.cutsceneActive = true;
    this.ui.changed();
    this.game.bus.emit('cutscene', { aura: auraId, phase: 'start' });
    this.cutscenes
      .play(auraId)
      .catch(() => undefined)
      .then(() => {
        this.game.apply((s, ctx) => markCutsceneSeen(s, ctx.now), 'none');
        this.complete(quick, true);
        this.game.bus.emit('cutscene', { aura: auraId, phase: 'reveal' });
        this.ui.cutsceneActive = false;
        this.ui.changed();
        this.cycleDone();
      });
  }

  /** Grants the pending aura and announces the reveal. */
  private complete(quick: boolean, afterCutscene: boolean): void {
    const pending = this.game.state.pendingRoll;
    if (!pending) return;
    const events = this.game.apply((s, ctx) => completeRoll(s, ctx), 'soon');
    const done = events.find((e) => e.type === 'rollCompleted');
    if (done && done.type === 'rollCompleted') {
      this.game.bus.emit('reveal', { aura: done.aura, isNew: done.isNew, lucky: done.lucky, luck: done.luck, quick, afterCutscene });
    }
  }

  private cycleDone(): void {
    this.timer = null;
    this.setPhase('idle');
    if (this.auto && !this.suspended) this.roll(true);
  }

  private schedule(ms: number, fn: () => void): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(fn, Math.max(0, ms));
  }

  /** Called when the tab is hidden: stop timers, finish a running roll silently. */
  suspend(): void {
    this.suspended = true;
    if (this.phase === 'cutscene') return; // the cutscene pauses with the frame loop
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (this.game.state.pendingRoll) this.game.apply((s, ctx) => completeRoll(s, ctx), 'now');
    this.setPhase('idle');
  }

  resume(): void {
    this.suspended = false;
    if (this.phase === 'idle' && this.auto) this.roll(true);
  }

  get isSuspended(): boolean {
    return this.suspended;
  }
}

// Roll loop: manual roll, auto roll, quick roll, suspense timing and cutscene gating.
// The engine decides *what* is rolled, this controller decides *when* things happen.

import { AURA_BY_ID, GAME, tierOf, type AuraDef } from '../config';
import { activeBiome } from '../core/biomes';
import { beginRoll, completeRoll, markCutsceneSeen, type GameEvent } from '../core/engine';
import { computeSpeed, rollDurationMs } from '../core/modifiers';
import type { Settings } from '../store/settings';
import type { GameStore } from '../store/store';
import type { UiStore } from '../store/ui';

/** Whether rolling this aura plays its cutscene with these settings. */
export function wantsCutscene(aura: AuraDef, settings: Settings): boolean {
  return !!aura.cutscene && settings.cutscenes && aura.odds >= settings.cutsceneSkipBelow;
}

type RollResult = Extract<GameEvent, { type: 'rollCompleted' }>;

export interface CutscenePlayer {
  /**
   * Plays the cutscene of an aura. Resolves at the moment the aura is revealed.
   * `replay`: watched again from the collection (always skippable by tapping).
   */
  play(auraId: string, opts?: { replay?: boolean }): Promise<void>;
}

export type RollPhase = 'idle' | 'rolling' | 'cutscene' | 'cooldown';

export class RollController {
  phase: RollPhase = 'idle';
  /** Start and length of the current cycle (for the button's progress ring). */
  cycleStart = 0;
  cycleMs = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private suspended = false;
  /** Cutscene the player wants to watch again; starts as soon as no roll is running. */
  private pendingReplay: string | null = null;
  private listeners = new Set<() => void>();
  cutscenes: CutscenePlayer = { play: () => Promise.resolve() };
  /** Admin: aura the next roll will land on (one roll only). */
  forceNext: string | null = null;

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
    if (this.forceNext) {
      // Admin: the next roll lands on the chosen aura.
      pending.aura = this.forceNext;
      this.forceNext = null;
    }

    const aura = AURA_BY_ID[pending.aura];
    const tier = tierOf(aura);
    const biome = activeBiome(now)?.id ?? null;
    const speed = computeSpeed(this.game.state, now, biome).total;
    const base = rollDurationMs(speed, auto);
    const needsCutscene = wantsCutscene(aura, this.game.settings);

    this.cycleStart = now;
    this.game.bus.emit('rollStart', {
      aura: pending.aura,
      quick: this.quick,
      auto,
      suspenseMs: this.quick ? 0 : tier.staging.suspenseMs,
      duration: this.quick ? 0 : base + tier.staging.suspenseMs,
    });
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

  /**
   * Logic first: the aura is granted, counted and saved before the cutscene starts. The
   * cutscene is presentation only; skipping or a closed tab cannot lose the roll. The game
   * events (toasts, equip) are held back until the reveal so nothing spoils it.
   */
  private playCutscene(auraId: string, quick: boolean): void {
    this.setPhase('cutscene');
    const held: GameEvent[] = [];
    const done = this.grant(held);
    held.push(...this.game.apply((s, ctx) => markCutsceneSeen(s, ctx.now), 'none', false, false));
    this.game.saveNow();
    this.ui.cutsceneActive = true;
    this.ui.changed();
    this.game.bus.emit('cutscene', { aura: auraId, phase: 'start' });
    this.cutscenes
      .play(auraId)
      .catch(() => undefined)
      .then(() => {
        this.game.dispatch(held);
        if (done) this.announce(done, quick, true);
        this.game.bus.emit('cutscene', { aura: auraId, phase: 'reveal' });
        this.ui.cutsceneActive = false;
        this.ui.changed();
        this.cycleDone();
      });
  }

  /** Grants the pending aura. With `held`, its events are collected instead of announced. */
  private grant(held?: GameEvent[]): RollResult | null {
    if (!this.game.state.pendingRoll) return null;
    const events = this.game.apply((s, ctx) => completeRoll(s, ctx), 'soon', false, !held);
    held?.push(...events);
    return (events.find((e) => e.type === 'rollCompleted') as RollResult | undefined) ?? null;
  }

  private announce(done: RollResult, quick: boolean, afterCutscene: boolean): void {
    this.game.bus.emit('reveal', { aura: done.aura, isNew: done.isNew, lucky: done.lucky, luck: done.luck, quick, afterCutscene });
  }

  /** Grants the pending aura and announces the reveal. */
  private complete(quick: boolean, afterCutscene: boolean): void {
    const done = this.grant();
    if (done) this.announce(done, quick, afterCutscene);
  }

  private cycleDone(): void {
    this.timer = null;
    this.setPhase('idle');
    if (this.pendingReplay && !this.suspended) {
      const id = this.pendingReplay;
      this.pendingReplay = null;
      this.replayCutscene(id);
      return;
    }
    if (this.auto && !this.suspended) this.roll(true);
  }

  /**
   * Watches the cutscene of an aura again (collection). Grants and counts nothing. While a
   * roll is running (e.g. Auto Roll) it starts right after that roll; Auto Roll continues
   * afterwards. Returns false if the aura has no cutscene.
   */
  replayCutscene(auraId: string): boolean {
    if (!AURA_BY_ID[auraId]?.cutscene) return false;
    if (this.phase !== 'idle' || this.suspended) {
      this.pendingReplay = auraId;
      return true;
    }
    this.setPhase('cutscene');
    this.ui.cutsceneActive = true;
    this.ui.changed();
    this.game.bus.emit('cutscene', { aura: auraId, phase: 'start' });
    this.cutscenes
      .play(auraId, { replay: true })
      .catch(() => undefined)
      .then(() => {
        this.game.bus.emit('cutscene', { aura: auraId, phase: 'reveal' });
        this.ui.cutsceneActive = false;
        this.ui.changed();
        this.cycleDone();
      });
    return true;
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

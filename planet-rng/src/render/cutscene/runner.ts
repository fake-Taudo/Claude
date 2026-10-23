// Plays cutscenes in the game: overlay canvas above everything, audio clock as time base,
// skip button / long press, tab-switch handling and the seamless handover to the reveal.
// The roll is already granted and saved before play() is called (see game/controller.ts);
// nothing here changes the game state.

import { AURA_BY_ID } from '../../config';
import { CUTSCENE, type CutsceneDef } from '../../config/cutscenes';
import { CutsceneSound } from '../../audio/cutscene';
import type { AudioEngine } from '../../audio/engine';
import type { CutscenePlayer } from '../../game/controller';
import type { GameStore } from '../../store/store';
import { mix } from '../color';
import { QualityGuard } from '../quality';
import { clamp01 } from '../vfx/math';
import { Timeline } from './timeline';

const FLASH_HINT = 'Enthält Lichtblitze. In den Einstellungen reduzierbar.';

/** True when the player's system asks for less motion. */
export function prefersReducedMotion(): boolean {
  try {
    return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

interface Tail {
  start: number;
  dur: number;
  snap: HTMLCanvasElement | null;
  flash: string | null;
}

export class CutsceneRunner implements CutscenePlayer {
  private root: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private skipBtn: HTMLButtonElement | null = null;
  private hint: HTMLDivElement | null = null;
  private tl: Timeline | null = null;
  private def: CutsceneDef | null = null;
  private sound: CutsceneSound;
  private raf = 0;
  private resolve: (() => void) | null = null;
  private replay = false;
  private handedOver = false;
  private tail: Tail | null = null;
  // Clock: performance.now() mapped to cutscene time, pulled towards the audio clock.
  private base = 0;
  private perf0 = 0;
  private off = 0;
  private lastT = 0;
  private paused = false;
  private hiddenAt: number | null = null;
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private downAt = 0;
  private hintShown = false;
  private guard = new QualityGuard();
  private lastFrame = 0;
  /** Current cutscene time (debug / tests). */
  t = 0;

  constructor(
    private game: GameStore,
    private host: HTMLElement,
    audio: AudioEngine | null,
  ) {
    this.sound = new CutsceneSound(audio);
  }

  get playing(): boolean {
    return !!this.root;
  }

  /** True while the overlay covers the stage completely (the stage may skip rendering). */
  get covering(): boolean {
    return !!this.root && !this.tail && this.t > 0.5;
  }

  play(auraId: string, opts: { replay?: boolean } = {}): Promise<void> {
    const def = AURA_BY_ID[auraId]?.cutscene;
    if (!def) return Promise.resolve();
    // A previous overlay still fading out ends now (its 'end' is covered by this start).
    this.finish(false);
    this.def = def;
    this.replay = !!opts.replay;
    this.handedOver = false;
    this.tail = null;
    this.hintShown = false;
    this.guard.reset();
    this.build();
    this.tl = new Timeline(def, this.canvas!, {
      quality: () => this.guard.effective(this.game.settings.vfxQuality),
      reduceFlashes: () => this.game.settings.reduceFlashes || this.game.settings.reducedEffects,
      reduceMotion: () => this.game.settings.reducedEffects || prefersReducedMotion(),
    });
    this.resize();
    this.sound.load(def, this.tl.blockCues());
    this.sound.setVolume(this.game.settings.cutsceneVolume);
    this.base = 0;
    this.perf0 = performance.now();
    this.off = 0;
    this.lastT = 0;
    this.t = 0;
    this.paused = false;
    this.hiddenAt = null;
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('keydown', this.onKey, true);
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  private get skippable(): boolean {
    return this.replay || this.game.settings.cutsceneSkip || this.def?.tier === 3;
  }

  /** Jumps to the reveal with a short flash in the aura colour. */
  skip = (): void => {
    if (!this.def || this.handedOver || !this.skippable) return;
    this.handover(true);
  };

  // -------------------------------------------------------------------------
  // DOM
  // -------------------------------------------------------------------------

  private build(): void {
    const root = document.createElement('div');
    root.className = 'cutscene-layer';
    root.setAttribute('aria-label', 'Cutscene');
    root.setAttribute('role', 'presentation');
    const canvas = document.createElement('canvas');
    canvas.className = 'cutscene-canvas';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cutscene-skip';
    btn.textContent = 'Überspringen';
    btn.dataset.testid = 'cutscene-skip';
    btn.hidden = true;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.skip();
    });
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    const hint = document.createElement('div');
    hint.className = 'cutscene-hint';
    hint.setAttribute('role', 'status');
    hint.hidden = true;
    root.append(canvas, btn, hint);
    root.addEventListener('pointerdown', this.onDown);
    root.addEventListener('pointerup', this.onUp);
    root.addEventListener('pointercancel', this.cancelHold);
    root.addEventListener('pointerleave', this.cancelHold);
    this.host.appendChild(root);
    this.root = root;
    this.canvas = canvas;
    this.skipBtn = btn;
    this.hint = hint;
  }

  private onDown = (): void => {
    this.downAt = performance.now();
    if (!this.skippable || this.handedOver) return;
    this.root?.classList.add('is-holding');
    this.cancelTimer();
    this.holdTimer = setTimeout(() => this.skip(), CUTSCENE.skip.holdSeconds * 1000);
  };

  private onUp = (): void => {
    const quick = performance.now() - this.downAt < 350;
    this.cancelHold();
    // Watching again from the collection: a tap is enough.
    if (this.replay && quick) this.skip();
  };

  private cancelHold = (): void => {
    this.cancelTimer();
    this.root?.classList.remove('is-holding');
  };

  private cancelTimer(): void {
    if (this.holdTimer) clearTimeout(this.holdTimer);
    this.holdTimer = null;
  }

  private onKey = (e: KeyboardEvent): void => {
    if (!this.root || this.handedOver) return;
    if (e.key === 'Escape' && this.skippable) {
      e.preventDefault();
      e.stopPropagation();
      this.skip();
    }
  };

  private resize = (): void => {
    if (!this.canvas || !this.tl) return;
    const q = this.guard.effective(this.game.settings.vfxQuality);
    const dpr = Math.min(window.devicePixelRatio || 1, CUTSCENE.maxDpr, q === 'low' ? 1.5 : 2);
    const w = Math.round(window.innerWidth * dpr);
    const h = Math.round(window.innerHeight * dpr);
    this.tl.resize(w, h);
  };

  // -------------------------------------------------------------------------
  // Clock and tab switches
  // -------------------------------------------------------------------------

  private now(): number {
    if (this.paused) return this.lastT;
    const perfT = this.base + (performance.now() - this.perf0) / 1000;
    const audioT = this.sound.time();
    if (audioT !== null) {
      // Follow the audio clock: snap on big jumps, glide on small drift.
      const d = audioT - (perfT + this.off);
      this.off += Math.abs(d) > 0.2 ? d : d * 0.1;
    }
    const t = Math.max(this.lastT, perfT + this.off);
    this.lastT = t;
    return t;
  }

  private onVisibility = (): void => {
    if (!this.root || this.tail) return;
    if (document.hidden) {
      this.lastT = this.now();
      this.paused = true;
      this.hiddenAt = performance.now();
      cancelAnimationFrame(this.raf);
      return;
    }
    const away = this.hiddenAt === null ? 0 : (performance.now() - this.hiddenAt) / 1000;
    this.hiddenAt = null;
    this.paused = false;
    this.base = this.lastT;
    this.perf0 = performance.now();
    this.off = 0;
    this.lastFrame = performance.now();
    // Long away: the moment is gone, jump straight to the reveal.
    if (away > CUTSCENE.hiddenJumpSeconds && !this.handedOver) this.handover(true);
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.frame);
  };

  // -------------------------------------------------------------------------
  // Frame loop
  // -------------------------------------------------------------------------

  private frame = (): void => {
    if (!this.root || !this.tl || !this.def) return;
    this.raf = requestAnimationFrame(this.frame);
    const start = performance.now();
    if (this.tail) {
      this.drawTail(start);
      return;
    }
    const t = this.now();
    this.t = t;
    this.sound.pump(t);
    if (t >= this.def.duration) {
      this.handover(false);
      this.drawTail(performance.now());
      return;
    }
    this.tl.render(t);
    this.updateUi(t);
    const work = performance.now() - start;
    this.guard.tick(start - this.lastFrame, work, this.game.settings.vfxQuality);
    this.lastFrame = start;
  };

  private updateUi(t: number): void {
    const btn = this.skipBtn;
    if (btn) {
      const show = this.skippable && t >= CUTSCENE.skip.showAfter;
      if (btn.hidden === show) btn.hidden = !show;
    }
    const hint = this.hint;
    if (hint) {
      // One-time hint before the first cutscene, during the black opening.
      const want = !this.game.settings.flashHintShown && !this.replay && t < 3.2;
      if (want && !this.hintShown) {
        this.hintShown = true;
        hint.textContent = FLASH_HINT;
        hint.hidden = false;
      }
      if (this.hintShown && !hint.hidden && t >= 3.2) {
        hint.hidden = true;
        this.game.setSettings({ flashHintShown: true });
      }
    }
  }

  /** Hands over to the reveal: the promise resolves, the overlay fades out. */
  private handover(skipped: boolean): void {
    if (this.handedOver || !this.def || !this.tl || !this.root) return;
    this.handedOver = true;
    this.cancelHold();
    if (this.skipBtn) this.skipBtn.hidden = true;
    if (this.hint && !this.hint.hidden) {
      this.hint.hidden = true;
      this.game.setSettings({ flashHintShown: true });
    }
    this.root.style.pointerEvents = 'none';
    const def = this.def;
    if (skipped) {
      this.sound.stop(0.35);
      const flash = mix(def.theme.primary, '#ffffff', this.game.settings.reduceFlashes ? 0.2 : 0.45);
      this.tail = { start: performance.now(), dur: CUTSCENE.skip.flashSeconds, snap: null, flash };
    } else {
      this.sound.release();
      this.tl.render(def.duration);
      const snap = this.tl.env.grab();
      this.tail = { start: performance.now(), dur: CUTSCENE.tailSeconds[def.reveal.style], snap, flash: null };
    }
    const r = this.resolve;
    this.resolve = null;
    r?.();
  }

  private drawTail(now: number): void {
    const tail = this.tail;
    const c = this.canvas;
    if (!tail || !c) return;
    const k = clamp01((now - tail.start) / 1000 / tail.dur);
    const ctx = c.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, c.width, c.height);
    const a = 1 - k * k * (3 - 2 * k);
    if (tail.snap) {
      ctx.globalAlpha = a;
      ctx.drawImage(tail.snap, 0, 0, c.width, c.height);
    } else if (tail.flash) {
      ctx.globalAlpha = a * a;
      ctx.fillStyle = tail.flash;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.globalAlpha = 1;
    if (k >= 1) this.finish();
  }

  /** Removes the overlay (end of the tail, or a new cutscene starts). */
  private finish(announce = true): void {
    cancelAnimationFrame(this.raf);
    this.cancelHold();
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('keydown', this.onKey, true);
    const def = this.def;
    const hadOverlay = !!this.root;
    if (!this.handedOver) this.sound.stop(0.2);
    this.root?.remove();
    this.root = null;
    this.canvas = null;
    this.skipBtn = null;
    this.hint = null;
    this.tl?.dispose();
    this.tl = null;
    this.tail = null;
    // A cutscene cut short by a new one still hands over.
    const r = this.resolve;
    this.resolve = null;
    r?.();
    if (announce && hadOverlay && def) this.game.bus.emit('cutscene', { aura: def.auraId, phase: 'end' });
    this.def = null;
  }
}

// Renders a cutscene definition at any point in time. Every block is a pure function of its
// track's progress (plus state baked at the start), so a frame can be drawn for any time:
// playback, skipping and the lab's scrubber all use render(t). Only frame snapshots
// (Shatter, SplitSlash, TimeFreeze) depend on an earlier frame; ensureSnapshots() renders
// those frames first when jumping.

import { CUTSCENE, type Cue, type CutsceneDef, type Track } from '../../config/cutscenes';
import { BLOCKS } from './blocks';
import { clamp01 } from '../vfx/math';
import { DEG, ease, type AnyBlock, type Env, type Quality } from './core';

interface TrackState {
  track: Track;
  block: AnyBlock;
  state: unknown;
  /** Snapshot buffer and whether it holds the frame of this track's start. */
  buf: HTMLCanvasElement | null;
  taken: boolean;
}

export interface TimelineOptions {
  quality: () => Quality;
  reduceFlashes: () => boolean;
  reduceMotion: () => boolean;
  /** Random variant seed (texts, etc.). */
  seed?: number;
}

function offscreen(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export class Timeline {
  readonly env: Env;
  private states: TrackState[];
  /** Tracks switched off in the lab. */
  muted = new Set<number>();
  /** Highest track count drawn in the last frame (lab). */
  activeTracks = 0;

  constructor(
    readonly def: CutsceneDef,
    readonly canvas: HTMLCanvasElement,
    private opts: TimelineOptions,
  ) {
    const ctx = canvas.getContext('2d')!;
    this.env = {
      ctx,
      W: canvas.width,
      H: canvas.height,
      cx: canvas.width / 2,
      cy: canvas.height / 2,
      u: Math.min(canvas.width, canvas.height) / 100,
      diag: Math.hypot(canvas.width, canvas.height) / 2,
      time: 0,
      local: 0,
      dur: 0,
      alpha: 1,
      theme: def.theme,
      def,
      quality: 'high',
      q: 1,
      reduceFlashes: false,
      reduceMotion: false,
      cam: { x: 0, y: 0, zoom: 1, roll: 0, flip: 1 },
      grab: (into) => this.grab(into),
      stats: { particles: 0, flashes: 0 },
      seed: opts.seed ?? Math.floor(Math.random() * 1e9),
    };
    this.states = def.tracks.map((track) => {
      const block = BLOCKS[track.block] as AnyBlock;
      let state: unknown = null;
      try {
        state = block.init ? block.init(track.params, track, this.env) : null;
      } catch {
        state = null;
      }
      return { track, block, state, buf: null, taken: false };
    });
  }

  /** Sounds produced by the blocks (ticks, pulses, ...), absolute times. */
  blockCues(): Cue[] {
    const out: Cue[] = [];
    for (const s of this.states) {
      const tr = s.track;
      if (tr.sfx) out.push(typeof tr.sfx === 'string' ? { t: tr.t, sfx: tr.sfx } : tr.sfx);
      if (s.block.cues) {
        try {
          out.push(...s.block.cues(tr.params, tr, this.def));
        } catch {
          /* ignore */
        }
      }
    }
    return out;
  }

  resize(w: number, h: number): void {
    if (this.canvas.width === w && this.canvas.height === h) return;
    this.canvas.width = w;
    this.canvas.height = h;
    // Snapshot buffers no longer match; they are re-taken on the next jump.
    for (const s of this.states) {
      s.buf = null;
      s.taken = false;
    }
  }

  private grab(into?: HTMLCanvasElement): HTMLCanvasElement {
    const c = into && into.width === this.canvas.width && into.height === this.canvas.height ? into : offscreen(this.canvas.width, this.canvas.height);
    const g = c.getContext('2d')!;
    g.globalCompositeOperation = 'copy';
    g.globalAlpha = 1;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(this.canvas, 0, 0);
    g.globalCompositeOperation = 'source-over';
    return c;
  }

  /** Before jumping to t: draws the start frames of snapshot tracks that t depends on. */
  ensureSnapshots(t: number): void {
    const list = this.states.filter((s) => s.block.snapshot === 'once').sort((a, b) => a.track.t - b.track.t);
    for (const s of list) {
      if (s.track.t > t) s.taken = false;
    }
    for (const s of list) {
      if (s.track.t <= t && !s.taken) this.render(s.track.t + 1e-4);
    }
  }

  /** Draws the frame at cutscene time t. */
  render(t: number): void {
    const env = this.env;
    const ctx = env.ctx;
    const c = this.canvas;
    env.W = c.width;
    env.H = c.height;
    env.cx = c.width / 2;
    env.cy = c.height / 2;
    env.u = Math.min(c.width, c.height) / 100;
    env.diag = Math.hypot(c.width, c.height) / 2;
    env.time = t;
    env.quality = this.opts.quality();
    env.q = CUTSCENE.quality[env.quality].particles;
    env.reduceFlashes = this.opts.reduceFlashes();
    env.reduceMotion = this.opts.reduceMotion();
    env.stats.particles = 0;
    env.stats.flashes = 0;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, c.width, c.height);

    // Camera pre-pass: shake and zoom tracks move every world-space block.
    const cam = env.cam;
    cam.x = 0;
    cam.y = 0;
    cam.zoom = 1;
    cam.roll = 0;
    cam.flip = 1;
    for (let i = 0; i < this.states.length; i++) {
      const s = this.states[i];
      if (s.track.block !== 'ScreenShake' || this.muted.has(i) || !this.active(s.track, t)) continue;
      this.prepare(s, t);
      s.block.draw(ctx, this.progress(s.track, t), s.track.params, this.def.theme, env, s.state, null);
    }

    let active = 0;
    for (let i = 0; i < this.states.length; i++) {
      const s = this.states[i];
      const tr = s.track;
      if (tr.block === 'ScreenShake' || this.muted.has(i) || !this.active(tr, t)) continue;
      active++;
      this.prepare(s, t);
      if (env.alpha <= 0.001) continue;
      let snap: HTMLCanvasElement | null = null;
      if (s.block.snapshot === 'once') {
        if (!s.taken) {
          s.buf = this.grab(s.buf ?? undefined);
          s.taken = true;
        }
        snap = s.buf;
      } else if (s.block.snapshot === 'live') {
        s.buf = this.grab(s.buf ?? undefined);
        snap = s.buf;
      }
      ctx.save();
      try {
        if (tr.clip) this.clipHalf(ctx, tr.clip.angle, tr.clip.side);
        if (s.block.space === 'world') this.applyCamera(ctx);
        ctx.globalAlpha = env.alpha;
        s.block.draw(ctx, this.progress(tr, t), tr.params, this.def.theme, env, s.state, snap);
      } catch {
        /* a broken block must not stop the cutscene */
      }
      ctx.restore();
    }
    this.activeTracks = active;
  }

  private active(tr: Track, t: number): boolean {
    return t >= tr.t && (t <= tr.t + tr.dur || !!tr.hold);
  }

  private progress(tr: Track, t: number): number {
    const p = tr.dur > 0 ? clamp01((t - tr.t) / tr.dur) : 1;
    return ease(tr.ease, p);
  }

  private prepare(s: TrackState, t: number): void {
    const tr = s.track;
    const env = this.env;
    env.local = t - tr.t;
    env.dur = tr.dur;
    let a = 1;
    if (tr.fade) {
      const [fi, fo] = tr.fade;
      const local = Math.min(env.local, tr.dur);
      if (fi > 0) a *= clamp01(local / fi);
      if (fo > 0) a *= clamp01((tr.dur - local) / fo);
    }
    env.alpha = a;
  }

  private applyCamera(ctx: CanvasRenderingContext2D): void {
    const { cam, cx, cy } = this.env;
    if (cam.x === 0 && cam.y === 0 && cam.zoom === 1 && cam.roll === 0 && cam.flip === 1) return;
    ctx.translate(cx + cam.x, cy + cam.y);
    if (cam.roll) ctx.rotate(cam.roll * DEG);
    ctx.scale(cam.zoom * cam.flip, cam.zoom);
    ctx.translate(-cx, -cy);
  }

  /** Clips to one side of a line through the centre. */
  private clipHalf(ctx: CanvasRenderingContext2D, angleDeg: number, side: 1 | -1): void {
    const { cx, cy, diag } = this.env;
    const a = angleDeg * DEG;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const nx = -dy * side;
    const ny = dx * side;
    const R = diag * 2;
    ctx.beginPath();
    ctx.moveTo(cx - dx * R, cy - dy * R);
    ctx.lineTo(cx + dx * R, cy + dy * R);
    ctx.lineTo(cx + dx * R + nx * R, cy + dy * R + ny * R);
    ctx.lineTo(cx - dx * R + nx * R, cy - dy * R + ny * R);
    ctx.closePath();
    ctx.clip();
  }

  /** Releases snapshot buffers. */
  dispose(): void {
    for (const s of this.states) {
      if (s.buf) {
        s.buf.width = 0;
        s.buf.height = 0;
      }
      s.buf = null;
    }
  }
}

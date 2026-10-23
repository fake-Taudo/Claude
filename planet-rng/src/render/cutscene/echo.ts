// GlobalEcho: the after-effect of a cutscene on the main stage once the aura is revealed.
// A short monochrome / colour-swap / tint filter on the stage, a thunder or impact, a shockwave
// over the stage; T3 adds a vertical beam of light and rising particles for a few seconds.
// Strength by tier (1 small, 2 medium, 3 full); "Lichtblitze reduzieren" softens it.

import { CutsceneSound } from '../../audio/cutscene';
import type { AudioEngine } from '../../audio/engine';
import type { CutsceneDef } from '../../config/cutscenes';
import type { GameStore } from '../../store/store';
import { hue, mix, rgba } from '../color';
import { hash } from '../vfx/math';
import { glowTex } from '../vfx/tex';
import { color, TAU } from './core';

const HOLD = [0.5, 0.75, 1];

export class GlobalEcho {
  private sound: CutsceneSound;
  private canvas: HTMLCanvasElement | null = null;
  private raf = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private game: GameStore,
    audio: AudioEngine | null,
  ) {
    this.sound = new CutsceneSound(audio);
  }

  play(def: CutsceneDef): void {
    const spec = def.echo ?? { strength: def.tier, mode: 'mono' as const };
    const strength = spec.strength;
    const reduced = this.game.settings.reduceFlashes || this.game.settings.reducedEffects;
    const hold = spec.dur ?? HOLD[strength - 1];
    const col = color(def.theme, spec.color ?? 'primary');
    this.stop();

    // 1) Filter on the stage.
    const stage = document.querySelector<HTMLCanvasElement>('canvas.stage');
    if (stage) {
      const k = reduced ? 0.45 : 1;
      const filter =
        spec.mode === 'swap'
          ? `hue-rotate(${Math.round(180 * k)}deg) saturate(${1 + 0.4 * k})`
          : spec.mode === 'tint'
            ? `sepia(${0.8 * k}) hue-rotate(${Math.round(hue(col) - 40)}deg) saturate(${1 + 1.2 * k})`
            : `grayscale(${k}) contrast(${1 + 0.2 * k})`;
      stage.style.transition = `filter ${reduced ? 0.4 : 0.12}s ease-out`;
      stage.style.filter = filter;
      this.timer = setTimeout(() => {
        stage.style.transition = 'filter 0.8s ease-in-out';
        stage.style.filter = '';
      }, hold * 1000);
    }

    // 2) Sound.
    this.sound.setVolume(this.game.settings.cutsceneVolume);
    this.sound.load({ ...def, audio: { bed: 'none', silence: [] } }, [{ t: 0, sfx: strength >= 2 ? 'thunder' : 'impact', gain: strength >= 2 ? 0.7 : 0.4 }]);
    this.sound.pump(0);
    this.sound.release();

    // 3) Shockwave (and for T3 a beam with particles) over the stage.
    const host = stage?.parentElement;
    if (!host) return;
    const c = document.createElement('canvas');
    c.className = 'cutscene-echo';
    c.setAttribute('aria-hidden', 'true');
    stage!.after(c);
    this.canvas = c;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(window.innerWidth * dpr);
    c.height = Math.round(window.innerHeight * dpr);
    const ctx = c.getContext('2d')!;
    const total = strength === 3 ? 3.2 : 1.6;
    const start = performance.now();
    const rings = strength;
    const frame = () => {
      const t = (performance.now() - start) / 1000;
      if (t > total) {
        this.stop(false);
        return;
      }
      this.raf = requestAnimationFrame(frame);
      const W = c.width;
      const H = c.height;
      const cx = W / 2;
      const cy = H * 0.45;
      const u = Math.min(W, H) / 100;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < rings; i++) {
        const k = (t - i * 0.15) / 1.2;
        if (k <= 0 || k >= 1) continue;
        const r = (1 - Math.pow(1 - k, 2.2)) * Math.hypot(W, H) * 0.6;
        const a = (1 - k) * (reduced ? 0.4 : 0.8);
        for (const [w, al, cc] of [
          [u * 3, 0.15, col],
          [u * 1.2, 0.4, col],
          [u * 0.4, 0.9, mix(col, '#ffffff', 0.6)],
        ] as [number, number, string][]) {
          ctx.strokeStyle = rgba(cc, al * a);
          ctx.lineWidth = w * (1 - 0.5 * k);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, TAU);
          ctx.stroke();
        }
      }
      if (strength === 3) {
        // A vertical beam of light that fades, and particles rising from the stage.
        const b = Math.min(1, t / 0.25) * Math.max(0, 1 - Math.max(0, t - 1.6) / 1.6);
        const bw = u * 9 * (0.7 + 0.3 * Math.sin(t * 9));
        const g = ctx.createLinearGradient(cx - bw, 0, cx + bw, 0);
        g.addColorStop(0, rgba(col, 0));
        g.addColorStop(0.5, rgba(mix(col, '#ffffff', 0.5), (reduced ? 0.35 : 0.7) * b));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(cx - bw, 0, bw * 2, H);
        const tex = glowTex(col, 'core');
        for (let i = 0; i < 60; i++) {
          const life = 1.4 + hash(i) * 1.2;
          const f = ((t + hash(i + 7) * life) % life) / life;
          const x = cx + (hash(i + 3) - 0.5) * W * 0.8;
          const y = H * (0.9 - f * 0.9);
          const s = u * (0.5 + hash(i + 11));
          ctx.globalAlpha = (1 - f) * Math.min(1, t / 0.4) * Math.max(0, 1 - Math.max(0, t - 2.4) / 0.8);
          ctx.drawImage(tex, x - s, y - s, s * 2, s * 2);
        }
        ctx.globalAlpha = 1;
      }
    };
    this.raf = requestAnimationFrame(frame);
  }

  /** Ends a running echo (a new cutscene starts, or it is done). */
  stop(resetFilter = true): void {
    cancelAnimationFrame(this.raf);
    this.canvas?.remove();
    this.canvas = null;
    if (resetFilter && this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      const stage = document.querySelector<HTMLCanvasElement>('canvas.stage');
      if (stage) stage.style.filter = '';
    }
  }
}

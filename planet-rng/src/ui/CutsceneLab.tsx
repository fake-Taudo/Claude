// Cutscene lab (only with ?cutscene=<id> in the URL): pick a cutscene, play, pause, scrub,
// change the speed, switch tracks off, see beats, flashes, FPS and particles.

import { useEffect, useRef, useState } from 'preact/hooks';
import { audio } from '../audio';
import { CutsceneSound } from '../audio/cutscene';
import { CUTSCENE, CUTSCENES, CUTSCENE_BY_ID, flashEvents, maxFlashRate, type CutsceneDef } from '../config/cutscenes';
import { AURA_BY_ID } from '../config';
import { game } from '../game/app';
import { Timeline } from '../render/cutscene';
import type { Quality } from '../render/cutscene/core';

const PARAM = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('cutscene') : null;
export const CUTSCENE_LAB = PARAM !== null;

const SPEEDS = [0.25, 0.5, 1, 1.5, 2];

interface LabHook {
  ids: string[];
  select(id: string): void;
  seek(t: number): void;
  play(): void;
  pause(): void;
  setQuality(q: Quality): void;
  def(): CutsceneDef;
  t(): number;
  /** Draws `frames` frames at time t and returns the average render time in ms. */
  bench(t: number, frames: number): number;
  /** Lowest canvas alpha (0..255) sampled on a grid at time t: 255 = fully covering. */
  minAlpha(t: number): number;
  /** Render cost per track at time t (ms saved when the track is switched off). */
  profile(t: number): { track: string; ms: number }[];
}

export function CutsceneLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [id, setId] = useState(PARAM && CUTSCENE_BY_ID[PARAM] ? PARAM : CUTSCENES[0].id);
  const [playing, setPlaying] = useState(!/[?&]paused/.test(location.search));
  const [speed, setSpeed] = useState(1);
  const [t, setT] = useState(0);
  const [muted, setMuted] = useState<Set<number>>(new Set());
  const [bg, setBg] = useState<'dark' | 'light' | 'game'>('dark');
  const [sound, setSound] = useState(true);
  const [loop, setLoop] = useState(true);
  const [quality, setQuality] = useState<Quality>(game.settings.vfxQuality);
  const [stats, setStats] = useState({ fps: 0, particles: 0, flashes: 0, tracks: 0 });
  const st = useRef({ t: 0, playing, speed, tl: null as Timeline | null, last: 0, frames: 0, fpsAt: 0, fps: 0, sound: new CutsceneSound(audio), soundOn: sound, loop, quality, seekTo: null as number | null });
  const def = CUTSCENE_BY_ID[id];

  // Build the timeline for the selected cutscene.
  useEffect(() => {
    const c = canvasRef.current!;
    const tl = new Timeline(def, c, {
      quality: () => st.current.quality,
      reduceFlashes: () => game.settings.reduceFlashes,
      reduceMotion: () => game.settings.reducedEffects,
      seed: 1,
    });
    const s = st.current;
    s.tl = tl;
    s.t = 0;
    s.sound.load(def, tl.blockCues());
    setMuted(new Set());
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, CUTSCENE.maxDpr);
      tl.resize(Math.round(c.clientWidth * dpr), Math.round(c.clientHeight * dpr));
      tl.ensureSnapshots(s.t);
      tl.render(s.t);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      s.sound.stop(0.05);
      tl.dispose();
    };
  }, [id]);

  // Frame loop.
  useEffect(() => {
    let raf = 0;
    const s = st.current;
    s.last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const tl = s.tl;
      if (!tl) return;
      const dt = Math.min(0.1, (now - s.last) / 1000);
      s.last = now;
      if (s.seekTo !== null) {
        s.t = s.seekTo;
        s.seekTo = null;
        tl.ensureSnapshots(s.t);
        s.sound.seek(s.t);
      } else if (s.playing) {
        s.t += dt * s.speed;
        if (s.t > tl.def.duration + 0.8) {
          if (s.loop) {
            s.t = 0;
            tl.ensureSnapshots(0);
            s.sound.seek(0);
          } else {
            s.t = tl.def.duration + 0.8;
            s.playing = false;
            setPlaying(false);
          }
        }
      }
      if (s.playing && s.soundOn && s.speed === 1) s.sound.pump(s.t);
      tl.render(Math.min(s.t, tl.def.duration));
      s.frames++;
      if (now - s.fpsAt > 500) {
        s.fps = Math.round((s.frames * 1000) / (now - s.fpsAt));
        s.frames = 0;
        s.fpsAt = now;
        const fl = flashEvents(tl.def).filter((x) => x <= s.t && x > s.t - 1).length;
        setStats({ fps: s.fps, particles: tl.env.stats.particles, flashes: fl, tracks: tl.activeTracks });
      }
      setT(s.t);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Keep the loop's view of the controls in sync.
  useEffect(() => {
    const s = st.current;
    s.playing = playing;
    s.speed = speed;
    s.soundOn = sound;
    s.loop = loop;
    s.quality = quality;
    if (!playing || speed !== 1 || !sound) s.sound.seek(s.t);
    if (s.tl) s.tl.muted = muted;
  }, [playing, speed, sound, loop, muted, quality]);

  // Script hook (contact sheets, smoke tests).
  useEffect(() => {
    const hook: LabHook = {
      ids: CUTSCENES.map((d) => d.id),
      select: (x) => setId(x),
      seek: (x) => {
        st.current.seekTo = x;
        st.current.playing = false;
        setPlaying(false);
      },
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      setQuality: (q) => setQuality(q),
      def: () => st.current.tl!.def,
      t: () => st.current.t,
      bench: (t, frames) => {
        const tl = st.current.tl!;
        tl.ensureSnapshots(t);
        const t0 = performance.now();
        for (let i = 0; i < frames; i++) tl.render(t + i / 60);
        // Force the GPU work to finish so the time is real.
        tl.canvas.getContext('2d')!.getImageData(0, 0, 1, 1);
        return (performance.now() - t0) / frames;
      },
      profile: (t) => {
        const tl = st.current.tl!;
        const run = () => {
          tl.ensureSnapshots(t);
          const t0 = performance.now();
          for (let i = 0; i < 8; i++) tl.render(t);
          tl.canvas.getContext('2d')!.getImageData(0, 0, 1, 1);
          return (performance.now() - t0) / 8;
        };
        const keep = tl.muted;
        const full = run();
        const out = tl.def.tracks.map((tr, i) => {
          tl.muted = new Set([...keep, i]);
          return { track: `${i} ${tr.name ?? tr.block}`, ms: +(full - run()).toFixed(2) };
        });
        tl.muted = keep;
        return out.sort((a, b) => b.ms - a.ms);
      },
      minAlpha: (t) => {
        const tl = st.current.tl!;
        tl.ensureSnapshots(t);
        tl.render(t);
        const c = tl.canvas;
        const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
        let min = 255;
        for (let y = 2; y < c.height; y += Math.max(1, Math.floor(c.height / 24))) {
          for (let x = 2; x < c.width; x += Math.max(1, Math.floor(c.width / 16))) min = Math.min(min, d[(y * c.width + x) * 4 + 3]);
        }
        return min;
      },
    };
    (window as unknown as Record<string, unknown>).__cutsceneLab = hook;
  }, []);

  const D = def.duration;
  const flashes = flashEvents(def);
  const worst = maxFlashRate(flashes);
  const beats = def.audio.beats ?? [];
  const pct = (x: number) => `${(Math.min(x, D + 0.8) / (D + 0.8)) * 100}%`;
  const scrub = (e: Event) => {
    const v = Number((e.target as HTMLInputElement).value);
    st.current.seekTo = v;
  };

  return (
    <div class={`cutscene-lab cutscene-lab--${bg}`}>
      <div class="cutscene-lab__stage">
        <canvas ref={canvasRef} class="cutscene-canvas" />
      </div>
      <div class="lab cutscene-lab__panel" role="region" aria-label="Cutscene-Labor">
        <div class="lab__row">
          <select value={id} onChange={(e) => setId((e.target as HTMLSelectElement).value)} aria-label="Cutscene">
            {CUTSCENES.map((d) => (
              <option key={d.id} value={d.id}>
                T{d.tier} · {AURA_BY_ID[d.auraId]?.name ?? d.id} ({d.duration.toFixed(1)} s)
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setPlaying(!playing)} data-testid="lab-play">
            {playing ? 'Pause' : 'Abspielen'}
          </button>
          <button
            type="button"
            onClick={() => {
              st.current.seekTo = 0;
              setPlaying(true);
            }}
          >
            Neu
          </button>
        </div>
        <div class="lab__row cutscene-lab__scrub">
          <div class="cutscene-lab__marks" aria-hidden="true">
            {beats.map((b, i) => (
              <span key={`b${i}`} class="mark mark--beat" style={{ left: pct(b) }} />
            ))}
            {flashes.map((f, i) => (
              <span key={`f${i}`} class="mark mark--flash" style={{ left: pct(f) }} />
            ))}
            <span class="mark mark--sig" style={{ left: pct(def.signature.at) }} title={def.signature.name} />
            <span class="mark mark--reveal" style={{ left: pct(def.reveal.at) }} />
            <span class="mark mark--end" style={{ left: pct(D) }} />
          </div>
          <input type="range" min={0} max={D + 0.8} step={0.01} value={t} onInput={scrub} aria-label="Zeit" />
          <span class="cutscene-lab__time">
            {t.toFixed(2)} / {D.toFixed(2)} s
          </span>
        </div>
        <div class="lab__row">
          <label>
            Tempo
            <select value={speed} onChange={(e) => setSpeed(Number((e.target as HTMLSelectElement).value))}>
              {SPEEDS.map((x) => (
                <option key={x} value={x}>
                  {x}×
                </option>
              ))}
            </select>
          </label>
          <label>
            Qualität
            <select value={quality} onChange={(e) => setQuality((e.target as HTMLSelectElement).value as Quality)}>
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
            </select>
          </label>
          <label>
            Hintergrund
            <select value={bg} onChange={(e) => setBg((e.target as HTMLSelectElement).value as 'dark' | 'light' | 'game')}>
              <option value="dark">dunkel</option>
              <option value="light">hell</option>
              <option value="game">Spiel</option>
            </select>
          </label>
          <label class="lab__check">
            <input type="checkbox" checked={sound} onChange={(e) => setSound((e.target as HTMLInputElement).checked)} /> Ton (1×)
          </label>
          <label class="lab__check">
            <input type="checkbox" checked={loop} onChange={(e) => setLoop((e.target as HTMLInputElement).checked)} /> Schleife
          </label>
        </div>
        <div class="lab__stats" data-testid="lab-stats">
          {stats.fps} FPS · {stats.particles} Partikel · {stats.tracks} Tracks aktiv · Blitze/s jetzt {stats.flashes} · max {worst.count}/s (Grenze {CUTSCENE.flashLimitPerSecond}) · Bruch „{def.signature.name}“ bei {def.signature.at} s
        </div>
        <div class="lab__layers">
          {def.tracks.map((tr, i) => (
            <label class="lab__check" key={`${id}-${i}`} title={`${tr.t}–${(tr.t + tr.dur).toFixed(2)} s`}>
              <input
                type="checkbox"
                checked={!muted.has(i)}
                onChange={(e) => {
                  const next = new Set(muted);
                  if ((e.target as HTMLInputElement).checked) next.delete(i);
                  else next.add(i);
                  setMuted(next);
                }}
              />
              <span class={t >= tr.t && (t <= tr.t + tr.dur || tr.hold || (tr.until !== undefined && t <= tr.until)) ? 'is-on' : ''}>
                {tr.name ?? tr.block} <small>{tr.t}s</small>
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useReducer, useState } from 'preact/hooks';
import { AURAS, AURA_BY_ID, TIER_BY_ID } from '../config';
import { vfxOf } from '../config/vfx';
import type { Quality, VTier } from '../config/vfx/types';
import { game } from '../game/app';
import { textureStats } from '../render/vfx/tex';
import { stageRef } from './App';
import { LAB_ENABLED, labState } from './lab';

// Aura lab (?lab=1): pick an aura, switch tier and quality, replay the intro, fire the
// accent, toggle layers, read FPS and particle counts, switch the backdrop.
// window.__lab offers the same for scripted, deterministic screenshots.

function stage() {
  return stageRef();
}

function show(id: string, opts: { settle?: number; quality?: Quality; tier?: VTier | null; clock?: number } = {}): void {
  const st = stage();
  if (!st) return;
  if (opts.quality) game.setSettings({ vfxQuality: opts.quality });
  if (opts.tier !== undefined) st.vfx.tierOverride = opts.tier ?? undefined;
  st.autoQualityEnabled = false;
  st.noBiome = true;
  st.stop();
  st.manual = true;
  st.manualClock = opts.clock ?? 1000;
  st.labAura = id;
  st.vfx.disabledLayers.clear();
  st.vfx.setAura(AURA_BY_ID[id] ?? null, { force: true });
  st.updateDprCap();
  labState.set(id);
  const inst = st.vfx.current;
  st.step((inst?.introDur ?? 1) + 0.6 + (opts.settle ?? 4));
}

function install(): void {
  (window as unknown as Record<string, unknown>).__lab = {
    show,
    step: (s: number) => stage()?.step(s),
    /** Fires the accent `lead` seconds from now and steps `after` seconds. */
    accent: (after = 0.5, lead = 0) => {
      const st = stage();
      if (!st) return;
      st.vfx.triggerAccent(st.clock() + lead);
      st.step(after);
    },
    intro: (after = 0) => {
      const st = stage();
      if (!st) return;
      st.vfx.replayIntro();
      st.step(after);
    },
    freeze: (on: boolean) => {
      const st = stage();
      if (!st) return;
      st.manual = on;
      if (on) st.stop();
      else st.start();
    },
    setLayer: (i: number, on: boolean) => {
      stage()?.vfx.setLayerEnabled(i, on);
      stage()?.step(0);
    },
    layers: () => stage()?.vfx.current?.layers.map((l) => l.name) ?? [],
    backdrop: (b: 'normal' | 'dark' | 'light') => {
      const st = stage();
      if (!st) return;
      st.backdrop = b;
      st.step(0);
    },
    stats: () => ({ ...stage()?.vfx.stats(), textures: textureStats(), frameMs: stage()?.frameTime }),
    /** Cost of `frames` simulated frames in ms (update + draw, rasterisation forced by a 1 px readback). */
    perf: (frames = 120) => {
      const st = stage();
      if (!st) return null;
      const t: number[] = [];
      for (let i = 0; i < frames; i++) {
        const t0 = performance.now();
        st.step(1 / 60);
        st.ctx.getImageData(0, 0, 1, 1);
        t.push(performance.now() - t0);
      }
      t.sort((a, b) => a - b);
      const avg = t.reduce((s, v) => s + v, 0) / t.length;
      return { avg: +avg.toFixed(2), p95: +t[Math.floor(t.length * 0.95)].toFixed(2), canvas: `${st.canvas.width}x${st.canvas.height}` };
    },
    /** Time to equip an aura and draw its first frame (texture baking included), in ms. */
    equipCost: (id: string) => {
      const st = stage();
      if (!st) return null;
      st.stop();
      st.manual = true;
      const t0 = performance.now();
      st.vfx.setAura(AURA_BY_ID[id] ?? null, { force: true });
      st.step(1 / 60);
      st.ctx.getImageData(0, 0, 1, 1);
      return +(performance.now() - t0).toFixed(1);
    },
    meta: (id: string) => {
      const a = AURA_BY_ID[id];
      return a ? { name: a.name, title: a.title ?? '', tier: TIER_BY_ID[a.tier].name, vtier: vfxOf(a).tier } : null;
    },
  };
}

if (LAB_ENABLED) install();

export function AuraLab() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [id, setId] = useState<string>(labState.aura ?? game.state.equippedAura ?? AURAS[0].id);
  const [hideUi, setHideUi] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const t = setInterval(force, 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const st = stage();
    if (!st) return;
    st.labAura = id;
    st.vfx.disabledLayers.clear();
    st.vfx.setAura(AURA_BY_ID[id] ?? null, { force: true });
    labState.set(id);
  }, [id]);

  useEffect(() => {
    document.body.classList.toggle('lab-clean', hideUi);
  }, [hideUi]);

  const st = stage();
  const inst = st?.vfx.current;
  const stats = st?.vfx.stats();
  const idx = AURAS.findIndex((a) => a.id === id);
  const go = (d: number) => setId(AURAS[(idx + d + AURAS.length) % AURAS.length].id);
  const fps = st ? Math.round(1000 / Math.max(1, st.frameTime)) : 0;
  const tex = textureStats();

  return (
    <div class="lab" role="region" aria-label="Aura-Labor">
      <div class="lab__row">
        <button onClick={() => go(-1)} aria-label="Vorherige Aura">‹</button>
        <select value={id} onChange={(e) => setId((e.target as HTMLSelectElement).value)}>
          {AURAS.map((a) => (
            <option value={a.id} key={a.id}>
              {a.name} · {TIER_BY_ID[a.tier].name} · V{vfxOf(a).tier}
            </option>
          ))}
        </select>
        <button onClick={() => go(1)} aria-label="Nächste Aura">›</button>
      </div>
      <div class="lab__row">
        <label>
          Qualität
          <select value={game.settings.vfxQuality} onChange={(e) => game.setSettings({ vfxQuality: (e.target as HTMLSelectElement).value as Quality })}>
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
          </select>
        </label>
        <label>
          Stufe
          <select
            value={st?.vfx.tierOverride ?? 'auto'}
            onChange={(e) => {
              const v = (e.target as HTMLSelectElement).value;
              if (!st) return;
              st.vfx.tierOverride = v === 'auto' ? undefined : (Number(v) as VTier);
              st.vfx.setAura(AURA_BY_ID[id] ?? null, { force: true });
            }}
          >
            <option value="auto">auto</option>
            {[0, 1, 2, 3, 4, 5, 6].map((t) => (
              <option value={t} key={t}>
                V{t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hintergrund
          <select
            value={st?.backdrop ?? 'normal'}
            onChange={(e) => {
              if (st) st.backdrop = (e.target as HTMLSelectElement).value as 'normal' | 'dark' | 'light';
            }}
          >
            <option value="normal">Bühne</option>
            <option value="dark">Dunkel</option>
            <option value="light">Hell</option>
          </select>
        </label>
      </div>
      <div class="lab__row">
        <button onClick={() => st?.vfx.replayIntro()}>Intro</button>
        <button onClick={() => st && st.vfx.triggerAccent(st.clock() + 1.6)}>Akzent</button>
        <button
          onClick={() => {
            if (!st) return;
            const next = !paused;
            setPaused(next);
            st.manualClock = st.clock();
            st.manual = next;
            if (next) st.stop();
            else st.start();
          }}
        >
          {paused ? 'Weiter' : 'Pause'}
        </button>
        {paused && <button onClick={() => st?.step(1 / 30)}>+1 Bild</button>}
        <label class="lab__check">
          <input type="checkbox" checked={game.settings.reducedEffects} onChange={(e) => game.setSettings({ reducedEffects: (e.target as HTMLInputElement).checked })} />
          Reduziert
        </label>
        <label class="lab__check">
          <input type="checkbox" checked={hideUi} onChange={(e) => setHideUi((e.target as HTMLInputElement).checked)} />
          UI aus
        </label>
      </div>
      <div class="lab__stats">
        {fps} FPS · {stats?.particles ?? 0} Partikel · {stats?.layers ?? 0} Schichten · {tex.megapixels} MP Texturen · Qualität {st?.effectiveQuality()}
      </div>
      <div class="lab__layers">
        {inst?.layers.map((l, i) => (
          <label class="lab__check" key={`${id}-${i}`}>
            <input type="checkbox" checked={l.enabled} onChange={(e) => st?.vfx.setLayerEnabled(i, (e.target as HTMLInputElement).checked)} />
            {l.name}
          </label>
        ))}
      </div>
    </div>
  );
}

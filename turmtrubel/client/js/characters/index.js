// Figuren-Laufzeit (docs/CHAR_SYSTEM.md §9.7): lädt Manifest und SVG-Quellen, backt Animationsbilder in Atlanten
// und zeichnet jede Einheit mit einem drawImage. Fehlt ein Bild und ist das Bau-Budget erschöpft, wird das
// nächstgelegene schon gebackene Bild genutzt; existiert keines, wird sofort gebacken (nie unsichtbar).
import { parseFigure } from './svg.js';
import { FigureModel } from './model.js';
import { evalPose } from './anim.js';
import { configureMaterials, hueShift } from './shade.js';
import { Atlas, makeCanvas } from './atlas.js';
export { CharacterAnimator, DEATH_DURATION } from './animator.js';

const DEF_STATES = {
  idle: { dur: 1.6, loop: true, frames: [3, 6, 8] },
  walk: { dur: 0.8, loop: true, frames: [4, 8, 10] },
  attack: { dur: 0.8, loop: false, frames: [4, 8, 10] },
  hit: { dur: 0.24, loop: false, frames: [2, 3, 3] },
  spawn: { dur: 0.5, loop: false, frames: [3, 5, 6] },
  death: { dur: 0.7, loop: false, frames: [4, 6, 8] },
  ability: { dur: 0.9, loop: false, frames: [4, 6, 8] },
  stun: { dur: 0.9, loop: true, frames: [2, 4, 4] },
  sleep: { dur: 2, loop: true, frames: [2, 4, 4] },
  charge: { dur: 0.5, loop: true, frames: [4, 6, 6] },
  fidget: { dur: 1.2, loop: false, frames: [3, 6, 8] },
};
const DEF_QUALITY = {
  low: { frameIndex: 0, maxLod: 1, res: 0.75, atlas: 1024, budgetMB: 12, bakeMs: 3 },
  medium: { frameIndex: 1, maxLod: 2, res: 1, atlas: 2048, budgetMB: 24, bakeMs: 4 },
  high: { frameIndex: 2, maxLod: 2, res: 1, atlas: 2048, budgetMB: 48, bakeMs: 5 },
};
const DEF_TEAM = {
  blue: { main: '#3d8bff', light: '#9cc8ff', shade: '#1f5fc9', deep: '#0f3a85', symbol: '#f4f9ff' },
  red: { main: '#ff4d57', light: '#ffb0b5', shade: '#c42233', deep: '#7a1020', symbol: '#fff4f4' },
};
const FALLBACK = { stun: 'idle', sleep: 'idle', charge: 'walk', fidget: 'idle', ability: 'attack', hit: 'idle', spawn: 'idle', death: 'hit', walk: 'idle', attack: 'idle' };

const S = {
  base: '/assets/characters/',
  manifest: null,
  models: new Map(),
  loading: new Map(),
  failed: new Set(),
  quality: 'high',
  atlases: new Map(),
  frames: new Map(),
  latest: new Map(),
  big: new Map(),
  queue: [],
  queued: new Set(),
  t0: 0,
  used: 0,
  forced: 0,
  stats: { baked: 0, bakeMs: 0, fallbacks: 0, draws: 0, forced: 0 },
  gradCache: new WeakMap(),
  colorblind: false,
};

const sys = () => S.manifest?.system || {};
const states = () => sys().states || DEF_STATES;
const qual = () => (sys().quality || DEF_QUALITY)[S.quality] || DEF_QUALITY.high;
const teams = () => sys().team || DEF_TEAM;

// ───────────── Laden ─────────────
export async function initCharacters(base = S.base) {
  S.base = base.endsWith('/') ? base : base + '/';
  const res = await fetch(S.base + 'manifest.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('Figuren-Manifest fehlt');
  S.manifest = await res.json();
  configureMaterials(S.manifest.system);
  return S.manifest;
}
export const charactersReady = () => !!S.manifest;
export const characterManifest = () => S.manifest;

/** Spieltyp → { figure, form } (oder null, wenn der Typ keine neue Figur hat). */
export function figureForType(type) {
  return S.manifest?.types?.[type] || null;
}
export function figureEntry(id) {
  return S.manifest?.figures?.[id] || null;
}
export const isLoaded = (id) => S.models.has(id);

export function loadFigure(id) {
  if (S.models.has(id)) return Promise.resolve(S.models.get(id));
  if (S.loading.has(id)) return S.loading.get(id);
  const entry = figureEntry(id);
  if (!entry || S.failed.has(id)) return Promise.resolve(null);
  const p = fetch(`${S.base}${entry.file}?v=${entry.hash || ''}`)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
    .then((text) => {
      const model = new FigureModel(id, entry, parseFigure(text));
      model.hueSet = new Set([entry.main, entry.accent].filter(Boolean).map((c) => c.toLowerCase()));
      S.models.set(id, model);
      S.loading.delete(id);
      return model;
    })
    .catch((e) => {
      S.loading.delete(id);
      S.failed.add(id);
      console.warn('Figur nicht ladbar', id, e);
      return null;
    });
  S.loading.set(id, p);
  return p;
}
export function loadFigures(ids) {
  return Promise.all([...new Set(ids)].filter(Boolean).map(loadFigure));
}
/** Alle übrigen Figuren nacheinander im Leerlauf laden (Gegnerfiguren, Kartenbilder). */
export function prefetchAllFigures() {
  const ids = Object.keys(S.manifest?.figures || {}).filter((id) => !S.models.has(id));
  let i = 0;
  const next = () => {
    if (i >= ids.length) return;
    loadFigure(ids[i++]).then(() => (typeof requestIdleCallback === 'function' ? requestIdleCallback(next, { timeout: 400 }) : setTimeout(next, 30)));
  };
  next();
}

// ───────────── Qualität ─────────────
export function setCharacterQuality(q) {
  const name = typeof q === 'number' ? ['low', 'medium', 'high'][q] || 'high' : q;
  if (name === S.quality) return;
  S.quality = name;
}
export function setCharacterColorblind(on) {
  S.colorblind = !!on;
}

function atlasFor() {
  const Q = qual();
  let a = S.atlases.get(S.quality);
  if (!a) {
    a = new Atlas({
      size: Q.atlas,
      budgetMB: Q.budgetMB,
      onEvict: (page) => {
        for (const [k, f] of S.frames) if (f.page === page) S.frames.delete(k);
        for (const [k, f] of S.latest) if (f.page === page) S.latest.delete(k);
      },
    });
    S.atlases.set(S.quality, a);
  }
  return a;
}

// ───────────── Zustände und Bilder ─────────────
function stateEntry(model, state) {
  const anim = model.entry.anim || {};
  let s = state;
  for (let i = 0; i < 4 && !anim[s]; i++) s = FALLBACK[s] || 'idle';
  return { name: anim[s] ? s : 'idle', entry: anim[s] || anim.idle || { prog: 'still' } };
}
function frameCount(name, entry) {
  const Q = qual();
  const f = entry.frames || states()[name]?.frames || DEF_STATES[name]?.frames || [2, 4, 6];
  return Math.max(1, f[Q.frameIndex] ?? f[f.length - 1]);
}
/** Dauer eines Zustands (s). */
export function stateDuration(figure, state) {
  const model = S.models.get(figure);
  const st = states();
  if (!model) return st[state]?.dur ?? 1;
  const { name, entry } = stateEntry(model, state);
  return entry.dur ?? st[name]?.dur ?? 1;
}
export function stateLoops(state) {
  return (states()[state] || DEF_STATES[state] || {}).loop ?? false;
}
/** Normierte Event-Zeiten eines Zustands (z. B. { strike: 0.55 }). */
export function stateEvents(figure, state) {
  const model = S.models.get(figure);
  if (!model) return null;
  const { name, entry } = stateEntry(model, state);
  return { ...(states()[name]?.events || {}), ...(entry.ev || {}), ...(entry.hit != null ? { strike: entry.hit } : {}) };
}

const ringCacheOff = new Map();
/** Ganzzahlige Versätze auf einem Ring mit Radius r (für die Außenkontur), ohne Doppelte. */
function ringOffsets(r) {
  const k = Math.round(r * 4);
  let list = ringCacheOff.get(k);
  if (list) return list;
  const R = Math.max(1, r);
  const n = R > 2.6 ? 16 : R > 1.6 ? 12 : 8;
  const seen = new Set();
  list = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const dx = Math.round(Math.cos(a) * R);
    const dy = Math.round(Math.sin(a) * R);
    const key = dx + ',' + dy;
    if (seen.has(key) || (!dx && !dy)) continue;
    seen.add(key);
    list.push([dx, dy]);
  }
  ringCacheOff.set(k, list);
  return list;
}

const SCR = [];
// Arbeitsflächen fürs Backen: CPU-Canvas (willReadFrequently), weil viele kleine Zeichenaufrufe dort
// deutlich billiger sind als auf einem GPU-Canvas; der fertige Frame wird einmal in den Atlas kopiert.
function scratch(i, w, h) {
  let c = SCR[i];
  if (!c) {
    c = SCR[i] = makeCanvas(Math.max(64, w), Math.max(64, h));
    c.ctx = c.getContext('2d', { willReadFrequently: true });
  }
  if (c.width < w || c.height < h) {
    c.width = Math.max(c.width, w);
    c.height = Math.max(c.height, h);
    c.ctx = c.getContext('2d', { willReadFrequently: true });
  }
  c.ctx.setTransform(1, 0, 0, 1, 0, 0);
  c.ctx.globalCompositeOperation = 'source-over';
  c.ctx.globalAlpha = 1;
  c.ctx.clearRect(0, 0, w + 2, h + 2);
  return c;
}

function paintContext(model, sel) {
  const pal = teams()[sel.team] || DEF_TEAM.blue;
  const tier = (sys().outline?.tiers || {})[model.entry.outline || 2] || { innerMu: 1.8 };
  return {
    team: pal,
    teamKey: sel.team,
    grads: model.grads,
    gradCache: S.gradCache,
    innerMu: tier.innerMu ?? 1.8,
    hue: sel.hue || 0,
    hueSet: model.hueSet,
  };
}

/** Ein Bild backen. Liefert { canvas|page, x, y, w, h, ax, ay, ppm, alpha, top }. */
function bake(model, req) {
  const t0 = performance.now();
  const { entry } = stateEntry(model, req.state);
  const pose = evalPose(entry, req.u);
  const sel = req.sel;
  const mats = model.matrices(pose);
  const bb = model.bounds(mats, sel, pose);
  const ppm = req.ppm;
  const pad = Math.ceil(req.outlinePx + 2);
  const w = Math.min(4096, Math.ceil((bb[2] - bb[0]) * ppm) + pad * 2);
  const h = Math.min(4096, Math.ceil((bb[3] - bb[1]) * ppm) + pad * 2);
  const ax = -bb[0] * ppm + pad;
  const ay = -bb[1] * ppm + pad;
  const P = paintContext(model, sel);
  const base = [ppm, 0, 0, ppm, ax, ay];
  const body = scratch(0, w, h);
  const tb = performance.now();
  model.draw(body.ctx, base, mats, sel, pose, 'body', P);
  S.stats.drawMs = (S.stats.drawMs || 0) + performance.now() - tb;
  const tOut = performance.now();
  const out = scratch(1, w, h);
  const o = out.ctx;
  // Außenkontur: Silhouette in Konturfarbe, im Kreis versetzt
  const ink = sys().outline?.ink || '#1c1830';
  const sil = scratch(2, w, h);
  sil.ctx.drawImage(body, 0, 0);
  sil.ctx.globalCompositeOperation = 'source-in';
  sil.ctx.fillStyle = ink;
  sil.ctx.fillRect(0, 0, w, h);
  // ganzzahlige Versätze ohne Glättung: in Software-Rastern 5–8× schneller als Subpixel-Kopien
  const r = req.outlinePx;
  o.imageSmoothingEnabled = false;
  for (const [dx, dy] of ringOffsets(r)) o.drawImage(sil, 0, 0, w, h, dx, dy, w, h);
  o.drawImage(body, 0, 0, w, h, 0, 0, w, h);
  // Rim-Light: schmaler warmer Saum an der Schattenkante (unten rechts)
  if (sel.lod >= 1) {
    const rim = scratch(2, w, h);
    const rc = rim.ctx;
    rc.drawImage(body, 0, 0);
    rc.globalCompositeOperation = 'source-in';
    rc.fillStyle = 'rgba(255,246,224,0.34)';
    rc.fillRect(0, 0, w, h);
    rc.globalCompositeOperation = 'destination-out';
    rc.imageSmoothingEnabled = false;
    const rp = Math.max(1, Math.round(r * 0.75));
    rc.drawImage(body, 0, 0, w, h, -rp, -rp, w, h);
    rc.imageSmoothingEnabled = true;
    o.globalCompositeOperation = 'source-atop';
    o.drawImage(rim, 0, 0, w, h, 0, 0, w, h);
    o.globalCompositeOperation = 'source-over';
  }
  S.stats.outlineMs = (S.stats.outlineMs || 0) + performance.now() - tOut;
  const tOv = performance.now();
  model.draw(o, base, mats, sel, pose, 'over', P);
  o.globalCompositeOperation = 'lighter';
  model.draw(o, base, mats, sel, pose, 'glow', P);
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.globalCompositeOperation = 'source-over';
  S.stats.overMs = (S.stats.overMs || 0) + performance.now() - tOv;
  const tCp = performance.now();
  const frame = { w, h, ax, ay, ppm, alpha: pose.alpha, top: bb[1], bottom: bb[3], at: performance.now() };
  const atlas = atlasFor();
  const slot = req.big ? null : atlas.alloc(w, h, frame.at);
  if (slot) {
    const pc = slot.page.ctx;
    pc.clearRect(slot.x, slot.y, w, h);
    pc.imageSmoothingEnabled = false;
    pc.drawImage(out, 0, 0, w, h, slot.x, slot.y, w, h);
    Object.assign(frame, { page: slot.page, src: slot.page.canvas, sx: slot.x, sy: slot.y });
  } else {
    const c = makeCanvas(w, h);
    c.getContext('2d').drawImage(out, 0, 0, w, h, 0, 0, w, h);
    Object.assign(frame, { src: c, sx: 0, sy: 0 });
    S.big.set(req.key, frame);
    if (S.big.size > 48) S.big.delete(S.big.keys().next().value);
  }
  S.stats.copyMs = (S.stats.copyMs || 0) + performance.now() - tCp;
  const dt = performance.now() - t0;
  S.used += dt;
  S.stats.baked++;
  S.stats.bakeMs += dt;
  return frame;
}

/** Zu Beginn jedes Frames: Budget zurücksetzen und vorgemerkte Bilder backen. */
export function bakeTick() {
  S.t0 = performance.now();
  S.used = 0;
  S.forced = 0;
  const Q = qual();
  while (S.queue.length && S.used < Q.bakeMs * 0.6) {
    const req = S.queue.shift();
    S.queued.delete(req.key);
    if (S.frames.has(req.key)) continue;
    const model = S.models.get(req.figure);
    if (!model) continue;
    const f = bake(model, req);
    if (f.page) S.frames.set(req.key, f);
  }
  if (S.queue.length > 400) {
    for (const r of S.queue.splice(0, S.queue.length - 400)) S.queued.delete(r.key);
  }
}

function quantPpm(ppm) {
  return Math.pow(2, Math.round(Math.log2(Math.max(0.05, ppm)) * 12) / 12);
}

function frameKey(o, team, cb, view, state, idx, variant, hue, ppm, lod) {
  return `${o.figure}|${o.form || ''}|${o.evo ? 1 : 0}|${team}${cb}|${view}|${state}|${idx}|${variant}|${hue}|${ppm.toFixed(4)}|${lod}`;
}
function frameReq(model, o, p) {
  const Q = qual();
  const tier = (sys().outline?.tiers || {})[model.entry.outline || 2] || { px: 1.9 };
  const zoom = Math.min(1.8, Math.max(0.8, Math.sqrt((o.scale || 26) / (sys().outline?.refTile || 26))));
  return {
    key: frameKey(o, p.team, p.cb, p.view, p.state, p.idx, p.variant, p.hue, p.ppm, p.lod),
    figure: o.figure,
    state: p.state,
    u: p.u,
    ppm: p.ppm,
    big: !!o.big,
    outlinePx: tier.px * zoom * p.dpr * (o.big ? 1 : Q.res),
    sel: { view: p.view, evo: !!o.evo, form: o.form || null, variant: p.variant, lod: p.lod, team: p.team, state: p.state, hue: p.hue, cb: p.cb },
  };
}

/**
 * Bilder vorab in den Atlas backen (Ladescreen), ohne Bau-Budget. o: figure, form, evo, scale, dpr, variant,
 * teams, views, states. Rückgabe: Anzahl neu gebackener Bilder.
 */
export function prebakeCharacter(o) {
  const model = S.models.get(o.figure);
  if (!model) return 0;
  const Q = qual();
  const dpr = o.dpr || 1;
  const ppm = quantPpm(((o.scale || 26) / 50) * dpr * Q.res);
  const lod = Math.min(Q.maxLod, model.restH * ppm >= 110 ? 2 : model.restH * ppm >= 46 ? 1 : 0);
  const cb = S.colorblind ? 1 : 0;
  const variant = o.variant || 0;
  const before = S.used;
  let n = 0;
  for (const team of o.teams || ['blue'])
    for (const v of o.views || ['front'])
      for (const st of o.states || ['idle']) {
        const view = v === 'back' && model.hasBack ? 'back' : 'front';
        const { name, entry } = stateEntry(model, st);
        const cnt = frameCount(name, entry);
        const loop = entry.loop ?? states()[name]?.loop ?? false;
        for (let i = 0; i < cnt; i++) {
          const req = frameReq(model, { ...o, big: false }, { team, cb, view, state: name, idx: i, u: loop ? i / cnt : cnt > 1 ? i / (cnt - 1) : 0, variant, hue: 0, ppm, lod, dpr });
          if (S.frames.has(req.key)) continue;
          const f = bake(model, req);
          if (f.page) S.frames.set(req.key, f);
          n++;
        }
      }
  S.used = before;
  return n;
}

/**
 * Figur zeichnen. o: figure, form, evo, team, x, y (Fußpunkt, CSS-px), scale (px pro Feld), dpr, face (1/-1),
 * view ('front'/'back'), state, time (s im Zustand), variant, alpha, lift (px), flash (0–1), squash (0–1), hue (Grad),
 * big (true: eigenes Canvas statt Atlas, für Kartenbilder).
 * Rückgabe: { top, bottom } in CSS-px (y), oder null, solange die Quelle lädt.
 */
export function drawCharacter(ctx, o) {
  const model = S.models.get(o.figure);
  if (!model) {
    loadFigure(o.figure);
    return null;
  }
  const { name, entry } = stateEntry(model, o.state || 'idle');
  const n = frameCount(name, entry);
  const dur = entry.dur ?? states()[name]?.dur ?? 1;
  const loop = entry.loop ?? states()[name]?.loop ?? false;
  // o.u: normierte Zeit im Zustand (vom CharacterAnimator), sonst o.time in Sekunden
  const tt = o.u != null ? o.u : Math.max(0, o.time || 0) / dur;
  const u = loop ? ((tt % 1) + 1) % 1 : Math.min(0.9999, Math.max(0, tt));
  const fi = Math.min(n - 1, Math.floor(u * n));
  const uq = loop ? fi / n : n > 1 ? fi / (n - 1) : 0;
  const dpr = o.dpr || 1;
  const Q = qual();
  const ppmExact = ((o.scale || 26) / 50) * dpr * (o.big ? 1 : Q.res);
  const ppm = quantPpm(ppmExact);
  const H = model.restH * ppm;
  const lod = Math.min(Q.maxLod, H >= 110 ? 2 : H >= 46 ? 1 : 0);
  const view = o.view === 'back' && model.hasBack ? 'back' : 'front';
  const team = o.team === 'red' ? 'red' : 'blue';
  const variant = o.variant || 0;
  const hue = o.hue ? Math.round(o.hue) : 0;
  const cb = S.colorblind ? 1 : 0;
  const key = frameKey(o, team, cb, view, name, fi, variant, hue, ppm, lod);
  const famKey = `${o.figure}|${o.form || ''}|${o.evo ? 1 : 0}|${team}${cb}|${view}|${variant}|${hue}|${ppm.toFixed(4)}`;
  // gröbere Familie (ohne Ansicht und Variante): Notbild, bis das passende gebacken ist – Teamfarbe stimmt immer
  const famKey2 = `${o.figure}|${o.form || ''}|${o.evo ? 1 : 0}|${team}${cb}|${hue}|${ppm.toFixed(4)}`;
  let frame = o.big ? S.big.get(key) : S.frames.get(key);
  const mk = (st, idx, uu) => frameReq(model, o, { team, cb, view, state: st, idx, u: uu, variant, hue, ppm, lod, dpr });
  if (!frame) {
    const Qb = Q.bakeMs;
    const exact = S.latest.get(famKey + '|' + name) || S.latest.get(famKey + '|idle');
    const fallback = exact || S.latest.get(famKey2 + '|' + name) || S.latest.get(famKey2 + '|idle');
    // Über dem Budget nur backen, wenn gar kein Notbild existiert oder (einmal pro Frame) nur eins aus anderer Ansicht/Variante
    if (o.big || S.used < Qb || !fallback || (!exact && S.forced < 1)) {
      if (S.used >= Qb && fallback) S.forced++;
      frame = bake(model, mk(name, fi, uq));
      if (frame.page) S.frames.set(key, frame);
      if (S.used >= Qb) S.stats.forced++;
    } else {
      frame = fallback;
      S.stats.fallbacks++;
      const req = mk(name, fi, uq);
      if (!S.queued.has(req.key)) {
        S.queued.add(req.key);
        S.queue.unshift(req);
      }
    }
  }
  if (frame.page) frame.page.used = performance.now();
  if (!o.big) {
    S.latest.set(famKey + '|' + name, frame);
    S.latest.set(famKey2 + '|' + name, frame);
    // übrige Bilder dieses Zustands vormerken
    if (n > 1 && !S.queued.has(key + '#all')) {
      S.queued.add(key + '#all');
      for (let i = 0; i < n; i++) {
        if (i === fi) continue;
        const req = mk(name, i, loop ? i / n : i / (n - 1));
        if (S.frames.has(req.key) || S.queued.has(req.key)) continue;
        S.queued.add(req.key);
        S.queue.push(req);
      }
    }
  }
  S.stats.draws++;
  // Kopieren: Fußpunkt (x, y), Spiegeln, Squash und Aufhellen
  const k = ppmExact / frame.ppm / dpr;
  const fw = frame.w * k;
  const fh = frame.h * k;
  const sq = o.squash || 0;
  const sx = 1 + sq * 0.16;
  const sy = 1 - sq * 0.24;
  const lift = o.lift || 0;
  // Formen mit eigener Deckkraft (z. B. halb durchsichtiger Lockvogel)
  const a = (o.alpha ?? 1) * (frame.alpha ?? 1) * (o.form ? model.entry.formLook?.[o.form]?.alpha ?? 1 : 1);
  if (a <= 0.01) return { top: o.y - lift + frame.top * k * frame.ppm, bottom: o.y - lift + frame.bottom * k * frame.ppm };
  ctx.save();
  ctx.translate(o.x, o.y - lift);
  if ((o.face || 1) < 0) ctx.scale(-sx, sy);
  else if (sq) ctx.scale(sx, sy);
  if (a < 1) ctx.globalAlpha *= a;
  ctx.drawImage(frame.src, frame.sx, frame.sy, frame.w, frame.h, -frame.ax * k, -frame.ay * k, fw, fh);
  if (o.flash > 0.02) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha *= Math.min(1, o.flash) * 0.55;
    ctx.drawImage(frame.src, frame.sx, frame.sy, frame.w, frame.h, -frame.ax * k, -frame.ay * k, fw, fh);
  }
  ctx.restore();
  const top = o.y - lift + frame.top * frame.ppm * k * sy;
  return { top, bottom: o.y - lift + frame.bottom * frame.ppm * k };
}

/** Vektor-Ansicht ohne Atlas (Prüfskript, Kartenbilder in großer Auflösung). */
export function renderCharacterCanvas(o) {
  const before = S.used;
  const c = makeCanvas(1, 1);
  const tmp = c.getContext('2d');
  tmp.save();
  const r = drawCharacter(tmp, { ...o, big: true, x: 0, y: 0 });
  tmp.restore();
  S.used = before;
  return r;
}

// ───────────── Bodenschatten und Teamring ─────────────
const ringCache = new Map();
/** Bodenschatten mit formcodiertem Teamring (eigene Seite: Kreis, Gegner: Zackenring). */
export function characterShadow(ctx, o) {
  const rx = Math.max(4, o.r);
  const ry = rx * 0.42;
  const dpr = o.dpr || 1;
  const key = `${Math.round(rx * dpr)}|${o.team || ''}|${o.ring ? 1 : 0}|${S.colorblind ? 1 : 0}`;
  let c = ringCache.get(key);
  if (!c) {
    const R = Math.round(rx * dpr);
    const W = R * 2 + 8;
    const Hh = Math.round(R * 0.42) * 2 + 8;
    c = makeCanvas(W, Hh);
    const g = c.getContext('2d');
    g.translate(W / 2, Hh / 2);
    g.scale(1, 0.42);
    const grd = g.createRadialGradient(0, 0, 0, 0, 0, R);
    grd.addColorStop(0, 'rgba(10,14,28,0.40)');
    grd.addColorStop(0.6, 'rgba(10,14,28,0.28)');
    grd.addColorStop(1, 'rgba(10,14,28,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(0, 0, R, 0, Math.PI * 2);
    g.fill();
    if (o.ring && o.team) {
      const col = (teams()[o.team] || DEF_TEAM.blue).main;
      g.strokeStyle = col;
      g.fillStyle = col;
      g.globalAlpha = S.colorblind ? 0.95 : 0.7;
      g.lineWidth = Math.max(1.4, R * 0.075) * (S.colorblind ? 1.4 : 1);
      g.beginPath();
      g.arc(0, 0, R * 0.78, 0, Math.PI * 2);
      g.stroke();
      if (o.team === 'red') {
        // sechs nach außen zeigende Zacken
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
          const r0 = R * 0.78;
          const r1 = R * (S.colorblind ? 1.02 : 0.96);
          const w = 0.16;
          g.beginPath();
          g.moveTo(Math.cos(a - w) * r0, Math.sin(a - w) * r0);
          g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          g.lineTo(Math.cos(a + w) * r0, Math.sin(a + w) * r0);
          g.closePath();
          g.fill();
        }
      }
    }
    ringCache.set(key, c);
    if (ringCache.size > 160) ringCache.delete(ringCache.keys().next().value);
  }
  const w = c.width / dpr;
  const h = c.height / dpr;
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.drawImage(c, o.x - w / 2 + (o.dx || 0), o.y - h / 2 + (o.dy || 0), w, h);
  if (o.alpha != null) ctx.globalAlpha = 1;
}

export function characterStats() {
  let bytes = 0;
  let pages = 0;
  for (const a of S.atlases.values()) {
    bytes += a.bytes;
    pages += a.pages.length;
  }
  return { ...S.stats, frames: S.frames.size, queue: S.queue.length, pages, mb: +(bytes / 1048576).toFixed(1), models: S.models.size, quality: S.quality };
}
export function resetCharacterStats() {
  S.stats = { baked: 0, bakeMs: 0, fallbacks: 0, draws: 0, forced: 0 };
}
/** Alle gebackenen Bilder verwerfen (Qualitäts- oder Farbmodus-Wechsel, Tests). */
export function clearCharacterCache() {
  for (const a of S.atlases.values()) a.clear();
  S.atlases.clear();
  S.frames.clear();
  S.latest.clear();
  S.big.clear();
  S.queue = [];
  S.queued.clear();
}
export { hueShift };

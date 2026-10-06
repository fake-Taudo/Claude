// Client-Seite eines Kampfes: Snapshot-Puffer + Interpolation, Eingaben, Effekte, Zeichenschleife.
import { ARENA_W, ARENA_H, RIVER_Y0, RIVER_Y1, isPlacementValid, forwardDir, formation } from '/shared/arena.js';
import { EF, EMOTES, C2S, REJECTS } from '/shared/protocol.js';
import { View, Renderer, ZONE_COLORS, projZ } from './renderer.js';
import { Hud } from './hud.js';
import { Vfx } from '../vfx/engine.js';
import { text as ctext } from './canvastext.js';
import { cardArt } from '../ui/art.js';
import { safeInsets, reducedMotion } from '../ui/tokens.js';
import { sprites } from '../design/spritecache.js';
import { drawTower, drawUnit } from './sprites.js';
import { mixHex } from '../design/light.js';

const INTERP_MS = 110;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const QUALITY_LEVEL = { low: 0, medium: 1, high: 2 };
// Zauber-Effektnamen (cards.json → spell.fx) → VFX-Preset, wo der Name abweicht
const SPELL_PRESET = { barrelRoll: 'spell.log', log: 'spell.log' };
const SPELL_SFX = { arrows: 'arrows', fire: 'boom', comet: 'bigBoom', shock: 'zap', frost: 'freeze', poison: 'poison', heal: 'heal', rage: 'rage', barrel: 'barrel', grave: 'spooky', log: 'roll', barrelRoll: 'roll', quake: 'crumble', snow: 'splat', tornado: 'whoosh', curse: 'spooky', clone: 'cast', crate: 'barrel', vines: 'splat', void: 'spooky' };
const BLAST_PRESET = { blast: 'blast.fire', cannonball: 'blast.bomb', recoil: 'blast.bomb', rune: 'blast.gold', levelup: 'blast.gold', banner: 'blast.gold', barrelRoll: 'spell.barrel' };
const BLAST_SFX = { shock: ['zap', 1], frost: ['freeze', 0.6], fire: ['boom', 0.8], blast: ['boom', 0.8], rock: ['crumble', 0.6], slam: ['thud', 1], heal: ['heal', 1], rage: ['rage', 1], time: ['freeze', 1], build: ['build', 1], bomb: ['boom', 0.6], cannonball: ['boom', 0.6], recoil: ['boom', 0.6], rune: ['build', 0.6], banner: ['build', 0.6], levelup: ['crown', 0.6], taunt: ['king', 0.6], spin: ['swing', 0.7], firewhirl: ['swing', 0.7], barrelRoll: ['barrel', 0.6] };
const DASH_STAR = { count: 1, scaleCount: false, shape: 'star', colors: ['#9ff5e6', '#ffffff'], life: 0.35, size: 0.28, sizeEnd: 0.04, alpha: [1, 0], blend: 'add', prio: 0 };
// Partikel aktiver Zonen (Gift, Heilung, Brand …): pro Frame mit Wahrscheinlichkeit p ein Partikel
const ZONE_FX = {
  poison: { p: 0.35, it: { count: 1, scaleCount: false, shape: 'bubble', colors: ['#c9f07a', '#9ad44f', '#7cc43a'], spread: 0.9, up: [0.5, 1.1], drag: 0.3, life: [0.6, 1], size: [0.12, 0.2], alpha: [1, 0], prio: 0 } },
  heal: { p: 0.3, it: { count: 1, scaleCount: false, shape: 'plus', colors: ['#9dff8a', '#ffe066'], spread: 0.8, z: [0.1, 0.5], up: [0.8, 1.4], drag: 0.3, life: [0.6, 0.9], size: [0.18, 0.26], sizeEnd: 0.08, alpha: [1, 0], prio: 0 } },
  burn: { p: 0.45, it: { count: 1, scaleCount: false, shape: 'flame', colors: ['#fff3b0', '#ffc23d', '#ff6a2b'], spread: 0.85, up: [0.8, 1.8], drag: 0.2, life: [0.3, 0.6], size: [0.3, 0.45], sizeEnd: 0.06, alpha: [1, 0], blend: 'add', prio: 0 } },
  rage: { p: 0.3, it: { count: 1, scaleCount: false, shape: 'flame', colors: ['#ffd0ff', '#e07bff'], spread: 0.85, up: [0.8, 1.6], drag: 0.2, life: [0.4, 0.7], size: [0.24, 0.34], sizeEnd: 0.05, alpha: [0.9, 0], blend: 'add', prio: 0 } },
  rageTrail: { p: 0.2, it: { count: 1, scaleCount: false, shape: 'flame', colors: ['#ffd0ff', '#e07bff'], spread: 0.8, up: [0.6, 1.2], life: [0.3, 0.5], size: [0.2, 0.3], sizeEnd: 0.05, alpha: [0.9, 0], blend: 'add', prio: 0 } },
  glue: { p: 0.2, it: { count: 1, scaleCount: false, shape: 'drop', colors: ['#e8c547', '#f5dc7a'], spread: 0.85, life: [0.5, 0.8], size: [0.12, 0.18], alpha: [1, 0], prio: 0 } },
  curse: { p: 0.25, it: { count: 1, scaleCount: false, shape: 'wisp', colors: ['#a6e05a', '#7cc36b', '#5b2d82'], spread: 0.85, up: [0.4, 1], spin: [-4, 4], life: [0.6, 1], size: [0.3, 0.45], alpha: [0.8, 0], prio: 0 } },
  void: { p: 0.3, it: { count: 1, scaleCount: false, shape: 'wisp', colors: ['#c9a2ff', '#9a5cf0'], spread: 0.85, up: [0.3, 0.8], spin: [5, 9], life: [0.5, 0.8], size: [0.35, 0.5], alpha: [0.8, 0], blend: 'add', prio: 0 } },
  grave: { p: 0.2, it: { count: 1, scaleCount: false, shape: 'wisp', colors: ['#c9d2e6', '#8a9ab8'], spread: 0.85, up: [0.4, 0.9], spin: [-4, 4], life: [0.6, 1], size: [0.35, 0.5], alpha: [0.6, 0], prio: 0 } },
  storm: { p: 0.2, it: { count: 1, scaleCount: false, shape: 'smoke', colors: ['#4a5578', '#3a4466'], spread: 0.9, z: [5.5, 6.5], speed: [0.1, 0.3], life: [0.8, 1.2], size: [0.9, 1.3], sizeEnd: 1.6, alpha: [0.55, 0], prio: 0 } },
  frost: { p: 0.15, it: { count: 1, scaleCount: false, shape: 'flake', colors: ['#ffffff', '#d4f4ff'], spread: 0.9, z: [0.8, 1.6], up: [-0.4, -0.1], spin: [-2, 2], drag: 0.5, life: [0.8, 1.2], size: [0.12, 0.2], alpha: [0.9, 0], prio: 0 } },
};
// Projektil-Art → Spur-Preset / Einschlag-Preset
const PROJ_TRAIL = { fireball: 'fire', fire: 'fire', rocket: 'rocket', magic: 'magic', ice: 'ice', spit: 'spit', firework: 'firework', spark: 'spark', spirit: 'spark', cannonball: 'smoke', bomb: 'smoke', boulder: 'smoke', dynamite: 'smoke', roll: 'dust', arrow: 'streak', bolt: 'streak', dart: 'streak', spear: 'streak', snipe: 'streak' };
const PROJ_IMPACT = { fireball: 'fire', fire: 'fire', magic: 'magic', ice: 'ice', spit: 'spit', firework: 'firework', spark: 'spark', spirit: 'spark', cannonball: 'cannon', arrow: 'small', bolt: 'small', dart: 'small', spear: 'small', bullet: 'small', pellet: 'small', snipe: 'small', axe: 'small', pebble: 'small' };

export class Game {
  constructor(app, init) {
    this.app = app;
    this.db = app.db;
    this.net = app.net;
    this.audio = app.audio;
    this.side = init.side;
    this.names = init.names;
    this.types = init.types;
    this.rules = init.rules;
    this.training = !!init.training;
    this.matchNo = init.matchNo;
    this.deck = init.deck;
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.view = new View();
    this.view.flip = this.side === 1;
    this.renderer = new Renderer(this);
    this.hud = new Hud(this);
    this.fx = new Vfx();
    this.fx.setPresets(app.vfxPresets || {});
    this.applyFxSettings();
    // Sound-Hook der VFX-Presets (z. B. Geröll im Nachhall des Turm-Einsturzes)
    this.fx.onSound = (name, vol) => this.audio.sfx(name, vol);
    this.projPrev = new Map();
    this.snaps = [];
    this.offset = null;
    this.me = null;
    this.latest = null;
    this.latestAt = 0;
    this.vis = new Map();
    this.proj = new Map();
    this.zones = [];
    this.typeCache = new Map();
    this.sel = -1;
    this.drag = null;
    this.pointer = null;
    this.pendingSlot = new Map();
    this.ghosts = [];
    this.markers = [];
    this.emotes = [];
    this.seq = 0;
    this.clock = performance.now() / 1000;
    this.crowns = [0, 0];
    this.phase = 'r';
    this.snapMult = 1;
    this.ended = false;
    this.ping = null;
    this.oppDisconnected = false;
    this.running = false;
    this.firstSnap = true;
    this.cw = 0;
    this.ch = 0;
    this.dpr = 1;
    this.frame = this.frame.bind(this);
    this.onResize = () => (this.needResize = true);
    this.onPointerDown = this.pointerDown.bind(this);
    this.onPointerMove = this.pointerMove.bind(this);
    this.onPointerUp = this.pointerUp.bind(this);
    this.onKey = this.keyDown.bind(this);
    this.onContext = (e) => e.preventDefault();
  }

  // ───────────── Lebenszyklus ─────────────
  start() {
    if (this.running) return;
    this.running = true;
    this.needResize = true;
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('keydown', this.onKey);
    this.canvas.addEventListener('contextmenu', this.onContext);
    requestAnimationFrame(this.frame);
  }

  destroy() {
    this.running = false;
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('keydown', this.onKey);
    this.canvas.removeEventListener('contextmenu', this.onContext);
    this.fx.clear();
    for (const k of ['--toast-x', '--toast-y', '--toast-w']) document.body.style.removeProperty(k);
    this.canvas.title = '';
  }

  /** Vor dem Kampf (Ladescreen): Layout berechnen und Arena-Hintergrund vorzeichnen. */
  prepare() {
    this.resize();
    this.renderer.renderBackground(this.cw, this.ch, this.renderer.bgLayer ? this.bgDpr : this.dpr);
    this.fx.prewarm();
    this.prewarmTowers();
  }

  /**
   * Figuren einer eigenen Deckkarte im Ladescreen vorrendern (Ruhe, Lauf, Angriff; Vorder-/Rückansicht,
   * beide Blickrichtungen), damit das erste Ausspielen keinen Sprite-Bau-Ruckler kostet.
   */
  prewarmUnits(id, evo = false) {
    if (typeof document === 'undefined') return;
    let def = null;
    try {
      def = this.db.unit(id, evo);
    } catch {
      def = null;
    }
    if (!def || def.isBuilding) return;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 4;
    const ctx = cv.getContext('2d');
    const U = this.view.s * (0.42 + def.radius * 0.8) * (def.look?.scale || 1);
    const quality = QUALITY_LEVEL[this.app.settings.quality] ?? 2;
    const poses = [{}, { walk: true, t: 0.02 }, { walk: true, t: 0.32 }, { atk: 0.9 }, { atk: 0.4 }];
    const backs = this.view.mode !== 'rotated' ? [false, true] : [false];
    for (const p of poses) for (const back of backs) for (const fx of [1, -1]) drawUnit(ctx, def.look || {}, { x: 0, y: 0, U, fx, team: 'blue', evo, quality, back, dpr: this.spriteDpr, force: true, seed: 0, ...p });
  }

  /** Türme samt Figuren im Ladescreen vorrendern (sonst kostet der erste Kampf-Frame mehrere hundert ms). */
  prewarmTowers() {
    if (typeof document === 'undefined') return;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 4;
    const ctx = cv.getContext('2d');
    const s = this.view.s;
    const q = QUALITY_LEVEL[this.app.settings.quality] ?? 2;
    for (const king of [true, false]) {
      const size = this.rules.towers?.[king ? 'king' : 'princess']?.size ?? (king ? 4 : 3);
      for (const team of ['blue', 'red']) {
        const back = team === 'blue' && this.view.mode !== 'rotated';
        for (const atk of [0, 0.9]) for (const aim of [0, Math.PI]) drawTower(ctx, { x: 0, y: 0, U: (size / 2) * s, t: 0, king, active: atk > 0, team, atk, aim, quality: q, dpr: this.spriteDpr, stage: 0, back });
        drawTower(ctx, { x: 0, y: 0, U: (size / 2) * s, destroyed: true, team, dpr: this.spriteDpr });
      }
    }
  }

  settingsChanged() {
    this.applyFxSettings();
    // Automatik aus → abgesenkte Auflösung und Effektmenge sofort zurücknehmen
    if (this.app.settings.autoQuality === false) {
      this.dynDpr = null;
      this.fx.loadScale = 1;
    }
    this.needResize = true;
  }

  /** Grafik-Einstellungen an die VFX-Engine weitergeben (Qualität, Wackeln, reduzierte Effekte/Bewegung). */
  applyFxSettings() {
    const st = this.app.settings;
    this.fx.setQuality(st.quality);
    this.fx.setOptions({ shake: st.shake ?? 1, reducedMotion: reducedMotion(), reduceEffects: !!st.reduceFx });
  }

  /** Werte für das Debug-Overlay und den Benchmark. */
  debugStats() {
    return { ...this.fx.debugStats(), sprites: sprites.info(), prof: this.prof, dpr: this.dpr };
  }

  resize() {
    this.needResize = false;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const q = this.app.settings.quality;
    const maxDpr = q === 'high' ? 2 : q === 'medium' ? 1.5 : 1;
    // Dynamische Auflösung (siehe adaptQuality) begrenzt zusätzlich
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr, this.dynDpr || 99);
    this.cw = cw;
    this.ch = ch;
    this.dpr = dpr;
    // Hintergrund-Ebene und Sprites behalten die volle Auflösung der Qualitätsstufe – ein Wechsel der
    // dynamischen Auflösung erzeugt so keine Neuzeichnungen (Sprites werden beim Kopieren skaliert)
    this.bgDpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    this.spriteDpr = this.bgDpr;
    this.canvas.width = Math.round(cw * dpr);
    this.canvas.height = Math.round(ch * dpr);
    this.canvas.style.width = cw + 'px';
    this.canvas.style.height = ch + 'px';
    this.hud.layout(cw, ch, this.app.settings.orientation, safeInsets());
    // bgKey enthält Größe, Maßstab und Versatz → Hintergrund wird nur bei echter Änderung neu gezeichnet
    this.renderer.overlayKey = '';
    this.placeDomHud();
  }

  /** DOM-Teile des HUD an das Canvas-Layout koppeln: Menüknopf und Toast-Position (B-03). */
  placeDomHud() {
    const L = this.hud.L;
    const ui = document.querySelector('#s-game .game-ui');
    if (ui) {
      ui.style.left = `${L.menuBtn.x}px`;
      ui.style.top = `${L.menuBtn.y}px`;
      ui.classList.toggle('right', L.menuBtn.x > L.w / 2);
    }
    const t = this.hud.toastAnchor();
    const b = document.body.style;
    b.setProperty('--toast-x', `${t.x}px`);
    b.setProperty('--toast-y', `${t.y}px`);
    b.setProperty('--toast-w', `${t.w}px`);
  }

  // ───────────── Netzwerk ─────────────
  onSnapshot(s) {
    const now = performance.now();
    s.tms = s.t * 1000;
    const off = s.tms - now;
    if (this.offset === null || off > this.offset || Math.abs(off - this.offset) > 1500) this.offset = off;
    else this.offset += (off - this.offset) * 0.01;
    s.done = false;
    this.snaps.push(s);
    if (this.snaps.length > 40) this.snaps.shift();
    this.latest = s;
    this.latestAt = now;
    this.me = s.me;
    this.crowns = s.cr;
    this.phase = s.ph;
    // Kampfbeginn: „Kampf!“-Banner (nur am Anfang, nicht beim Wiederverbinden mitten im Kampf)
    if (!this.startShown) {
      this.startShown = true;
      if (s.t < 3) this.hud.banner('Kampf!', '#ffffff', '', { kind: 'phase', base: '#f5a623', onShow: () => this.phaseFx('phase.start') });
    }
    if (s.em !== this.snapMult) {
      if (this.snapMult != null && s.em > this.snapMult && s.em >= 2) {
        const triple = s.em >= 3;
        this.hud.banner(triple ? 'Dreifaches Elixier!' : 'Doppeltes Elixier!', '#ffe9fd', triple ? 'Elixier fließt 3× so schnell' : 'Letzte Minute', {
          kind: 'phase',
          base: '#c43cf0',
          drop: triple ? '×3' : '×2',
          onShow: () => {
            this.audio.sfx('double');
            this.phaseFx('phase.elixir');
          },
        });
      }
      this.snapMult = s.em;
    }
    for (const [slot, p] of this.pendingSlot) {
      if (s.me.h[slot] !== p.card || now > p.until) this.pendingSlot.delete(slot);
    }
  }

  onReject(msg) {
    for (const [slot, p] of this.pendingSlot) if (p.seq === msg.seq) this.pendingSlot.delete(slot);
    this.ghosts = this.ghosts.filter((g) => g.seq !== msg.seq);
    this.app.toast(msg.message, 'warn', 1400);
    this.audio.sfx('error');
  }

  onEnd(res) {
    this.ended = true;
    this.sel = -1;
    this.drag = null;
    const win = res.winner === this.side;
    const draw = res.winner == null;
    this.hud.banner(draw ? 'Unentschieden' : win ? 'Sieg!' : 'Niederlage', '#ffffff', res.reasonText, { kind: 'end', base: draw ? '#3652b3' : win ? '#f5a623' : '#e5484d' });
    if (win) this.fx.emit('phase.win', { x: ARENA_W / 2, y: ARENA_H / 2 });
  }

  /** Ambiente nur bei Qualität Hoch, ohne „Effekte reduzieren“ und ohne reduzierte Bewegung. */
  ambientOn() {
    const st = this.app.settings;
    return st.quality === 'high' && !st.reduceFx && !reducedMotion() && (this.fx.loadScale ?? 1) >= 1;
  }

  /** Glitzern auf dem Fluss und vereinzelt treibende Blätter (Deko-Partikel, Priorität 0). */
  ambientFx(dt) {
    if (!this.ambientOn() || !(dt > 0)) return;
    this.glintT = (this.glintT ?? 0) - dt;
    this.leafT = (this.leafT ?? 1.5) - dt;
    if (this.glintT <= 0) {
      this.glintT = 0.12 + Math.random() * 0.2;
      this.fx.emit('ambient.glint', { x: Math.random() * ARENA_W, y: RIVER_Y0 + 0.25 + Math.random() * (RIVER_Y1 - RIVER_Y0 - 0.5) });
    }
    if (this.leafT <= 0) {
      this.leafT = 2.2 + Math.random() * 2.5;
      this.fx.emit('ambient.leaf', { x: -0.5 + Math.random() * ARENA_W * 0.5, y: Math.random() * ARENA_H * 0.8 });
    }
  }

  /** Phasen-Effekt auf Höhe des Banners (Bildschirmmitte der Arena → Weltkoordinaten). */
  phaseFx(name) {
    const A = this.hud.L?.arena;
    if (!A) return;
    // Die Presets fliegen in ~5 Feldern Höhe (z) → Bodenpunkt entsprechend tiefer wählen
    const [x, y] = this.view.toWorld(A.x + A.w / 2, A.y + A.h * 0.4 + 5 * this.view.s);
    this.fx.emit(name, { x, y, team: 'blue' });
  }

  elixirNow() {
    if (!this.me) return 0;
    const E = this.rules.elixir;
    const dt = (performance.now() - this.latestAt) / 1000;
    let el = Math.min(E.max, this.me.el + (dt * this.snapMult) / E.regenSeconds);
    for (const p of this.pendingSlot.values()) el -= p.cost;
    return Math.max(0, el);
  }

  timeLeftNow() {
    if (!this.latest) return this.rules.regularSeconds;
    if (this.ended) return this.latest.tl;
    return Math.max(0, this.latest.tl - (performance.now() - this.latestAt) / 1000);
  }

  // ───────────── Typen ─────────────
  typeInfo(idx, evo) {
    const k = idx * 2 + (evo ? 1 : 0);
    let info = this.typeCache.get(k);
    if (info) return info;
    const key = this.types[idx];
    if (key === 'tower_king' || key === 'tower_princess') {
      const size = this.rules.towers?.[key === 'tower_king' ? 'king' : 'princess']?.size ?? (key === 'tower_king' ? 4 : 3);
      info = { key, kind: 'tower', king: key === 'tower_king', half: size / 2, radius: size / 2, flying: false, look: {}, cls: 'tower', uf: 1 };
    } else {
      let def = null;
      try {
        def = this.db.unit(key, evo);
      } catch {
        def = null;
      }
      if (!def) {
        const card = this.db.card(key);
        info = { key, kind: 'spell', card, half: 0.5, radius: 0.5, look: card?.look || {}, label: card?.name || key };
      } else {
        const radius = def.radius;
        info = {
          key,
          kind: def.isBuilding ? 'building' : 'unit',
          def,
          look: def.look || {},
          radius,
          half: def.isBuilding ? def.size / 2 : radius,
          flying: !!def.flying,
          cls: def.class,
          beam: def.projectile?.kind === 'beam',
          lightning: def.projectile?.kind === 'lightning',
          ranged: !!def.projectile,
          uf: (0.42 + radius * 0.8) * (def.look?.scale || 1),
          cardId: def.cardId || key,
          label: def.name || this.db.card(key)?.name || key,
        };
      }
    }
    this.typeCache.set(k, info);
    return info;
  }

  // ───────────── Welt-Update ─────────────
  updateWorld(renderT, now, dt) {
    const snaps = this.snaps;
    if (!snaps.length) return;
    let ai = 0;
    for (let i = snaps.length - 1; i >= 0; i--) {
      if (snaps[i].tms <= renderT) {
        ai = i;
        break;
      }
    }
    const a = snaps[ai];
    const b = snaps[ai + 1] || null;
    const alpha = b ? clamp((renderT - a.tms) / (b.tms - a.tms), 0, 1) : 0;
    const bMap = b ? b.eMap || (b.eMap = new Map(b.e.map((e) => [e[0], e]))) : null;
    const view = this.view;
    const seen = new Set();
    for (const e of a.e) {
      const id = e[0];
      seen.add(id);
      let v = this.vis.get(id);
      if (!v) v = this.createVis(e, now);
      const eb = bMap && bMap.get(id);
      const x = eb ? e[3] + (eb[3] - e[3]) * alpha : e[3];
      const y = eb ? e[4] + (eb[4] - e[4]) * alpha : e[4];
      const [px, py] = view.toScreen(v.x, v.y);
      const [nx, ny] = view.toScreen(x, y);
      const moved = Math.hypot(x - v.x, y - v.y);
      v.moving = dt > 0 && moved / dt > 0.25;
      if (v.moving) {
        if (Math.abs(nx - px) > 0.05) v.face = nx > px ? 1 : -1;
        // Rückansicht, solange die Figur deutlich nach oben (vom Betrachter weg) läuft
        const ddx = nx - px;
        const ddy = ny - py;
        if (Math.abs(ddx) + Math.abs(ddy) > 0.05) v.back = ddy < 0 && Math.abs(ddy) > Math.abs(ddx) * 0.4;
      }
      v.x = x;
      v.y = y;
      v.hp = e[5];
      v.maxHp = e[6];
      v.flags = e[7];
      if (v.kind === 'unit') v.flying = !!(e[7] & EF.FLY);
      v.ice = !!(e[7] & EF.FREEZE);
      v.shield = e[8];
      if (e[8] > (v.maxShield || 0)) v.maxShield = e[8];
      v.target = e[9];
      v.aux = e[11];
      v.hpDisp += (v.hp - v.hpDisp) * Math.min(1, dt * 12);
      if (Math.abs(v.hpDisp - v.hp) < 1) v.hpDisp = v.hp;
      // LP-Nachlauf: verlorener Anteil bleibt kurz stehen und läuft dann sanft ab
      if (v.trail == null || v.hp >= v.trail) {
        v.trail = v.hp;
        v.trailT = now;
      } else if (now - v.trailT > 0.4) v.trail = Math.max(v.hp, v.trail - v.maxHp * 0.8 * dt);
      v.atk = Math.max(0, v.atk - dt / 0.35);
      v.hurt = Math.max(0, v.hurt - dt / 0.16);
      v.U = view.s * v.uf;
    }
    for (const id of this.vis.keys()) if (!seen.has(id)) this.vis.delete(id);
    for (const v of this.vis.values()) {
      v.targetV = v.target ? this.vis.get(v.target) || null : null;
      if (v.targetV && v.flags & EF.ATTACK && v.kind === 'unit') {
        const [tx, ty] = view.toScreen(v.targetV.x, v.targetV.y);
        const [sx, sy] = view.toScreen(v.x, v.y);
        if (Math.abs(tx - sx) > 1) v.face = tx > sx ? 1 : -1;
        v.back = ty < sy && Math.abs(ty - sy) > Math.abs(tx - sx) * 0.4;
      }
    }
    this.firstSnap = false;

    // Projektile
    const pb = b ? b.pMap || (b.pMap = new Map(b.p.map((p) => [p[0], p]))) : null;
    const plist = [];
    for (const p of a.p) {
      const q = pb && pb.get(p[0]);
      plist.push({
        id: p[0],
        kind: p[1],
        x: q ? p[2] + (q[2] - p[2]) * alpha : p[2],
        y: q ? p[3] + (q[3] - p[3]) * alpha : p[3],
        owner: p[4],
        sx: p[5],
        sy: p[6],
        tx: q ? q[7] : p[7],
        ty: q ? q[8] : p[8],
      });
    }
    this.projList = plist;
    // Spuren hinter Projektilen; verschwundene Projektile = Einschlag an der letzten Position
    const seenP = new Map();
    for (const p of plist) {
      const z = projZ(p);
      const tr = PROJ_TRAIL[p.kind];
      if (tr) {
        const it = this.fx.presets['proj.trail.' + tr];
        if (it) this.fx.trail(p.id, p.x, p.y, z, it, { team: this.teamOf(p.owner) });
      }
      seenP.set(p.id, { kind: p.kind, x: p.x, y: p.y, z, owner: p.owner });
    }
    for (const [id, q] of this.projPrev) {
      if (seenP.has(id)) continue;
      const im = PROJ_IMPACT[q.kind];
      if (im) this.fx.emit('proj.impact.' + im, { x: q.x, y: q.y, z: q.z, team: this.teamOf(q.owner) });
    }
    this.projPrev = seenP;

    // Zonen
    const zb = b ? b.zMap || (b.zMap = new Map(b.z.map((z) => [z[0], z]))) : null;
    this.zones = a.z.map((z) => {
      const q = zb && zb.get(z[0]);
      const info = z[1] >= 0 ? this.typeInfo(z[1], false) : null;
      const fx = z[8] || info?.card?.spell?.fx || '';
      return {
        id: z[0],
        x: q ? z[2] + (q[2] - z[2]) * alpha : z[2],
        y: q ? z[3] + (q[3] - z[3]) * alpha : z[3],
        r: z[4],
        active: z[5] === 1,
        prog: q && q[5] === z[5] ? z[6] + (q[6] - z[6]) * alpha : z[6],
        owner: z[7],
        fx,
        fromX: z[9],
        fromY: z[10],
        fade: z[5] === 1 ? Math.min(1, (1 - z[6]) * 5) : 1,
      };
    });
    for (const z of this.zones) {
      if (!z.active) continue;
      const zf = ZONE_FX[z.fx];
      if (zf && Math.random() < zf.p) this.fx.burst(zf.it, { x: z.x, y: z.y, k: z.r, team: this.teamOf(z.owner) });
    }

    // Ereignisse aller Snapshots bis zur Renderzeit abspielen
    for (let i = 0; i <= ai; i++) {
      const s = snaps[i];
      if (!s.done) {
        s.done = true;
        if (s.ev && s.ev.length) this.processEvents(s.ev, now);
      }
    }
    // alte Snapshots entsorgen
    while (this.snaps.length > 2 && this.snaps[1].tms < renderT - 300) this.snaps.shift();
  }

  createVis(e, now) {
    const evo = !!(e[7] & EF.EVO);
    const info = this.typeInfo(e[1], evo);
    const v = {
      id: e[0],
      type: e[1],
      owner: e[2],
      x: e[3],
      y: e[4],
      hp: e[5],
      maxHp: e[6],
      hpDisp: e[5],
      flags: e[7],
      shield: e[8],
      maxShield: e[8],
      target: e[9],
      aux: e[11],
      kind: info.kind,
      king: info.king,
      half: info.half,
      radius: info.radius,
      flying: info.flying,
      look: info.look,
      cls: info.cls,
      beam: info.beam,
      lightning: info.lightning,
      ranged: info.ranged,
      uf: info.uf || 1,
      evo,
      info,
      born: this.firstSnap ? now - 5 : now,
      seed: (e[0] * 1.37) % 6.28,
      atk: 0,
      hurt: 0,
      face: e[2] === this.side ? 1 : -1,
      // Eigene Einheiten laufen anfangs nach oben (Rücken zum Betrachter), gegnerische auf ihn zu
      back: e[2] === this.side && this.view.mode !== 'rotated',
      moving: false,
      U: this.view.s * (info.uf || 1),
    };
    this.vis.set(v.id, v);
    return v;
  }

  // ───────────── Ereignisse → Effekte ─────────────
  teamOf(owner) {
    return owner === this.side ? 'blue' : 'red';
  }
  /** Trefferhöhe einer Figur (Felder). */
  hitZ(v) {
    return v.kind === 'tower' ? v.half * 1.4 : (v.flying ? 1.1 : 0) + (v.kind === 'building' ? v.half : 0.5);
  }
  /** Schwungbogen beim Nahkampf: Sichel zwischen Angreifer und Ziel, zum Ziel gewölbt. */
  swingFx(src, tgt) {
    const [ax, ay] = this.view.toScreen(src.x, src.y);
    const [bx, by] = this.view.toScreen(tgt.x, tgt.y);
    const d = Math.hypot(tgt.x - src.x, tgt.y - src.y) || 1;
    const k = Math.min(0.55, d * 0.5) / d;
    this.fx.emit('unit.swing', { x: src.x + (tgt.x - src.x) * k, y: src.y + (tgt.y - src.y) * k, z: src.flying ? 1.1 : 0, rot: Math.atan2(by - ay, bx - ax) - Math.PI / 2 });
  }
  /** Blitz-/Seil-Linie zwischen zwei Punkten (Weltkoordinaten mit Höhe). */
  line(from, to, color, width, life, jag = 0.3, segments = 8, branches = 1) {
    this.fx.bolt({ color, width, life, segments, jag, branches }, { x: to[0], y: to[1], from, to });
  }
  /** Turm-Schadenstufen (> 66 %, > 33 %, darunter): beim Unterschreiten Brocken und Staub. */
  towerStage(v) {
    const stage = v.hp > v.maxHp * 0.66 ? 0 : v.hp > v.maxHp * 0.33 ? 1 : 2;
    if (stage > (v.stage || 0)) this.fx.emit('tower.damage', { x: v.x, y: v.y, team: this.teamOf(v.owner) });
    v.stage = Math.max(v.stage || 0, stage);
  }

  processEvents(evs, now) {
    const fx = this.fx;
    const A = this.audio;
    const showDmg = this.app.settings.dmgNumbers;
    // Schwärme: Treffer- und Todeseffekte pro Frame begrenzen (Lesbarkeit + Performance)
    let hits = 0;
    let deaths = 0;
    for (const ev of evs) {
      switch (ev[0]) {
        case 'a': {
          const src = this.vis.get(ev[1]);
          const tgt = this.vis.get(ev[2]);
          if (!src) break;
          src.atk = 1;
          if (tgt && src.lightning) {
            const z0 = src.kind === 'building' ? src.half * 1.9 : (src.flying ? 1.1 : 0) + 0.8;
            const z1 = (tgt.flying ? 1.1 : 0) + 0.5;
            this.line([src.x, src.y, z0], [tgt.x, tgt.y, z1], '#9ff0ff', 0.1, 0.2, 0.3, 8, 1);
            fx.emit('proj.impact.spark', { x: tgt.x, y: tgt.y, z: z1 });
            A.sfx('zap', 0.4);
          } else if (src.kind === 'tower') A.sfx(src.king ? 'cannon' : 'bow', 0.35);
          else if (src.ranged && !src.beam) {
            A.sfx('shoot', 0.35);
            if (tgt) fx.emit('unit.muzzle', { x: src.x, y: src.y, z: src.flying ? 1.1 : 0, dir: Math.atan2(tgt.y - src.y, tgt.x - src.x) });
          } else if (!src.beam) {
            A.sfx('swing', 0.35);
            if (tgt && src.kind === 'unit' && hits < 14) this.swingFx(src, tgt);
          }
          break;
        }
        case 'h': {
          const v = this.vis.get(ev[1]);
          if (!v) break;
          v.hurt = 1;
          const z = this.hitZ(v);
          const amount = ev[2] || 0;
          if (v.kind === 'tower') {
            fx.emit(amount >= 180 ? 'tower.hit.heavy' : 'tower.hit', { x: v.x, y: v.y, z: 0, team: this.teamOf(v.owner) });
            this.towerStage(v);
          } else if (hits++ < 12) {
            fx.emit(amount >= 250 ? 'unit.hit.heavy' : 'unit.hit', { x: v.x, y: v.y, z, team: this.teamOf(v.owner) });
          }
          if (showDmg && amount >= 40) {
            // Start über dem LP-Balken, leicht teamfarbig getönt, max. 8 gleichzeitig
            const zBar = v.kind === 'tower' ? v.half * 1.6 : v.kind === 'building' ? v.half * 2.1 : (v.flying ? 1.1 : 0) + (v.U * 1.9) / this.view.s + 0.25;
            fx.damage(v.id, v.x + (Math.random() - 0.5) * 0.4, v.y, amount, v.owner === this.side ? '#dcebff' : '#ffe1e3', zBar + 0.35);
          }
          A.sfx(v.kind === 'unit' ? 'hit' : 'hitStone', 0.3);
          break;
        }
        case 'hl': {
          const v = this.vis.get(ev[1]);
          if (v) fx.emit('unit.heal', { x: v.x, y: v.y, z: this.hitZ(v) - 0.3 });
          break;
        }
        case 'd': {
          const [, , type, owner, x, y, flying, silent] = ev;
          if (silent) break;
          const info = this.typeInfo(type, false);
          const team = this.teamOf(owner);
          if (info.kind === 'building') {
            fx.emit('building.death', { x, y, team });
            A.sfx('crumble', 0.6);
          } else if (info.kind === 'unit') {
            if (flying) fx.emit('unit.death.flying', { x, y, z: 1.1, team });
            else fx.emit(deaths++ < 6 ? 'unit.death' : 'unit.death.swarm', { x, y, team });
            A.sfx('pop', 0.45);
          }
          break;
        }
        case 'tw': {
          const [, , owner, isKing, x, y] = ev;
          fx.emit('tower.destroy', { x, y, team: this.teamOf(owner), scale: isKing ? 1.3 : 1 });
          A.sfx('towerDown');
          this.app.haptic(20);
          const [sx, sy] = this.view.toScreen(x, y);
          this.hud.flyCrown(sx, sy - this.view.s * 2, owner !== this.side);
          break;
        }
        case 'ka': {
          const v = this.vis.get(ev[1]);
          if (v) fx.emit('king.awake', { x: v.x, y: v.y, team: this.teamOf(v.owner) });
          A.sfx('king');
          break;
        }
        case 'sp':
          this.spellFx(ev);
          break;
        case 'bl': {
          const [, x, y, r, owner, kind] = ev;
          this.blastFx(x, y, r, kind, owner);
          break;
        }
        case 'ch': {
          const [, , x0, y0, pts] = ev;
          let prev = [x0, y0, 6];
          for (let i = 0; i < pts.length; i += 2) {
            const next = [pts[i], pts[i + 1], 0.5];
            this.line(prev, next, '#d7b5ff', 0.13, 0.35, 0.35, 9, 1);
            fx.emit('proj.impact.spark', { x: next[0], y: next[1], z: 0.5 });
            prev = next;
          }
          A.sfx('zap');
          break;
        }
        case 'st': {
          const [, x, y] = ev;
          fx.emit('spell.strike', { x, y });
          A.sfx('thunder');
          break;
        }
        case 'ms': {
          const [, , x0, y0, pts] = ev;
          for (let i = 0; i < pts.length; i += 2) {
            this.line([x0, y0, 1.2], [pts[i], pts[i + 1], 0.5], '#ffe066', 0.07, 0.28, 0.08, 4, 0);
            fx.emit('blast.sparks', { x: pts[i], y: pts[i + 1], r: 0.6 });
          }
          A.sfx('shoot');
          break;
        }
        case 'ds': {
          const [, , x0, y0, x1, y1] = ev;
          fx.emit('unit.dash', { x: x0, y: y0 });
          for (let k = 0; k <= 6; k++) {
            const t = k / 6;
            fx.burst(DASH_STAR, { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, z: 0.5, k: 1 });
          }
          A.sfx('whoosh', 0.6);
          break;
        }
        case 'el': {
          const [, owner, x, y] = ev;
          fx.emit('elixir.collect', { x, y });
          if (owner === this.side) {
            fx.text(x, y, '+1', '#ff9af0', 0.6, 1, 2, 0.8);
            A.sfx('elixir', 0.5);
          }
          break;
        }
        case 'rf': {
          const v = this.vis.get(ev[1]);
          if (v) fx.emit('unit.reflect', { x: v.x, y: v.y, z: this.hitZ(v) });
          break;
        }
        case 'sb': {
          const v = this.vis.get(ev[1]);
          if (v) fx.emit('unit.shieldBreak', { x: v.x, y: v.y, z: this.hitZ(v) });
          break;
        }
        case 'dp': {
          const v = this.vis.get(ev[1]);
          if (!v) break;
          const team = this.teamOf(v.owner);
          if (v.kind === 'unit' && !v.flying) {
            const heavy = v.info.def?.mass >= 12;
            const env = { x: v.x, y: v.y, team, r: v.radius };
            fx.emit(this.skinFx(v.info.key, heavy ? 'unit.deploy.heavy' : 'unit.deploy', env), env);
            if (heavy) A.sfx('thud', 0.6);
          } else if (v.kind === 'unit') {
            const env = { x: v.x, y: v.y, team };
            fx.emit(this.skinFx(v.info.key, 'unit.deploy.air', env), env);
          }
          break;
        }
        case 'a2': {
          // Zweitangriff (Speer der Koboldriesen, Bola des Widderreiters …)
          const src = this.vis.get(ev[1]);
          if (src) A.sfx('shoot', 0.3);
          break;
        }
        case 'dw': {
          // Ausholen vor Sprint/Sprung/Haken
          const v = this.vis.get(ev[1]);
          if (v) fx.emit('unit.windup', { x: v.x, y: v.y, z: v.flying ? 1.1 : 0 });
          break;
        }
        case 'lp': {
          const [, id, , , , , dur] = ev;
          const v = this.vis.get(id);
          if (v) v.arc = { t0: performance.now() / 1000, dur: Math.max(0.2, dur), h: 2.2 };
          A.sfx('whoosh', 0.6);
          break;
        }
        case 'th': {
          const [, id, , , , , dur] = ev;
          const v = this.vis.get(id);
          if (v) v.arc = { t0: performance.now() / 1000, dur: Math.max(0.2, dur), h: 2.6 };
          A.sfx('whoosh', 0.5);
          break;
        }
        case 'hk': {
          const [, , , x0, y0, x1, y1] = ev;
          this.line([x0, y0, 0.8], [x1, y1, 0.5], '#c9d2dc', 0.05, 0.35, 0.02, 2, 0);
          A.sfx('whoosh', 0.5);
          break;
        }
        case 'tp': {
          const [, , x0, y0, x1, y1] = ev;
          fx.emit('unit.teleport', { x: x0, y: y0 });
          fx.emit('unit.teleport', { x: x1, y: y1 });
          A.sfx('whoosh', 0.6);
          break;
        }
        case 'pa': {
          const v = this.vis.get(ev[1]);
          if (v) fx.emit('unit.hit.heavy', { x: v.x, y: v.y, z: this.hitZ(v) });
          A.sfx('hitStone', 0.6);
          break;
        }
        case 'zb': {
          const a = this.vis.get(ev[1]);
          const b = this.vis.get(ev[2]);
          if (a && b) this.line([a.x, a.y, 1.2], [b.x, b.y, 0.5], '#9ff0ff', 0.1, 0.22, 0.3, 8, 1);
          A.sfx('zap', 0.4);
          break;
        }
        case 'su': {
          const v = this.vis.get(ev[1]);
          if (v) fx.emit('blast.build', { x: v.x, y: v.y, team: this.teamOf(v.owner) });
          break;
        }
        case 'nt': {
          const a = this.vis.get(ev[1]);
          const b = this.vis.get(ev[2]);
          if (a && b) this.line([a.x, a.y, 0.8], [b.x, b.y, 0.4], '#e8dcc0', 0.06, 0.4, 0.05, 3, 0);
          break;
        }
        case 'en': {
          const b = this.vis.get(ev[2]);
          if (b) fx.emit('unit.enchant', { x: b.x, y: b.y });
          break;
        }
        case 'tr': {
          const v = this.vis.get(ev[1]);
          if (v) fx.emit('unit.teleport', { x: v.x, y: v.y });
          A.sfx('pop', 0.5);
          break;
        }
        case 'vn': {
          const v = this.vis.get(ev[1]);
          if (v) fx.emit('spell.vines', { x: v.x, y: v.y, r: 0.9 });
          break;
        }
        case 'zp': {
          const [, , x, y, r, kind] = ev;
          fx.ring({ radius: [r * 0.85, r], width: [0.12, 0.01], color: ZONE_COLORS[kind] || '#ffffff', life: 0.35, alpha: 0.55 }, { x, y, k: 1 });
          if (kind === 'quake') fx.shake(0.14);
          break;
        }
        case 'lk': {
          const [, , x0, y0, x1, y1] = ev;
          this.line([x0, y0, 0.8], [x1, y1, 0.8], '#7fe9ff', 0.08, 0.25, 0.2, 6, 0);
          break;
        }
        case 'ax': {
          const v = this.vis.get(ev[1]);
          if (v) fx.emit('blast.gold', { x: v.x, y: v.y, r: 1.2 });
          break;
        }
        case 'em':
          if (ev[1] !== this.side && this.app.settings.muteEmotes) break;
          this.emotes = this.emotes.filter((e) => e.owner !== ev[1]);
          this.emotes.push({ owner: ev[1], index: ev[2], at: now });
          A.sfx('emote');
          break;
        case 'ab': {
          const v = this.vis.get(ev[1]);
          const info = this.typeInfo(ev[3], false);
          const card = this.db.card(info.cardId || info.key);
          const mine = ev[2] === this.side;
          if (card?.ability) this.hud.banner(card.ability.name + '!', '#ffffff', '', { kind: 'card', team: mine ? 'blue' : 'red', cardId: card.id });
          if (v) fx.emit('ability.activate', { x: v.x, y: v.y, z: v.flying ? 1.1 : 0, team: this.teamOf(v.owner) });
          A.sfx('ability');
          break;
        }
        case 'pl': {
          const [, owner, type, x, y, evo] = ev;
          const key = this.types[type];
          if (owner !== this.side) this.markers.push({ owner, cardId: key, x, y, evo: !!evo, at: now });
          else this.ghosts = this.ghosts.filter((g) => !(g.card === key && Math.hypot(g.x - x, g.y - y) < 0.1));
          const card = this.db.card(key);
          if (card?.type !== 'spell') A.sfx('deploy', owner === this.side ? 0.7 : 0.4);
          else A.sfx('cast', owner === this.side ? 0.7 : 0.4);
          if (evo) fx.emit('evo.deploy', { x, y, team: this.teamOf(owner) });
          if (key === 'mirror') fx.emit('spell.mirror', { x, y, team: this.teamOf(owner) });
          break;
        }
        case 'ot':
          this.hud.banner('Verlängerung!', '#ffffff', this.rules.suddenDeath === 'firstHit' ? 'Erster Turmtreffer gewinnt' : 'Erster zerstörter Turm gewinnt', {
            kind: 'phase',
            base: '#ff7a1a',
            onShow: () => {
              this.phaseFx('phase.overtime');
              A.sfx('overtime');
            },
          });
          A.music('overtime');
          break;
        default:
          break;
      }
    }
  }

  /** skin.json → fx: { preset, tint } einer Karte auf Effektname und Umgebung anwenden (nur Darstellung). */
  skinFx(key, name, env) {
    const sk = key != null ? this.db.card(key)?.skinFx : null;
    if (!sk) return name;
    if (sk.tint) {
      env.teamColor = sk.tint;
      env.teamLight = mixHex(sk.tint, '#ffffff', 0.5);
    }
    return sk.preset && this.fx.has(sk.preset) ? sk.preset : name;
  }

  spellFx(ev) {
    const [, typeIdx, x, y, r, owner, fxName] = ev;
    const fx = this.fx;
    const A = this.audio;
    const team = this.teamOf(owner);
    const base = SPELL_PRESET[fxName] || 'spell.' + fxName;
    const env = { x, y, r: Math.max(0.8, r || 1), team };
    const name = this.skinFx(this.types[typeIdx], base, env);
    fx.emit(fx.has(name) ? name : 'spell.default', env);
    if (fxName === 'frost') {
      for (const v of this.vis.values()) {
        if (v.owner !== owner && Math.hypot(v.x - x, v.y - y) <= r + v.radius) v.ice = true;
      }
    }
    const sfx = SPELL_SFX[fxName];
    if (sfx) A.sfx(sfx);
  }

  blastFx(x, y, r, kind, owner) {
    const name = BLAST_PRESET[kind] || 'blast.' + kind;
    this.fx.emit(this.fx.has(name) ? name : 'blast.default', { x, y, r: Math.max(0.5, r || 1), team: owner == null ? 'blue' : this.teamOf(owner) });
    const sfx = BLAST_SFX[kind];
    if (sfx) this.audio.sfx(sfx[0], sfx[1]);
  }

  // ───────────── Eingabe ─────────────
  cssPoint(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  pointerDown(e) {
    if (!this.me || this.ended) return;
    this.audio.unlock();
    const p = this.cssPoint(e);
    this.pointer = p;
    const hit = this.hud.hit(p.x, p.y);
    if (hit.type !== 'emote' && hit.type !== 'emoteItem') this.hud.emoteOpen = false;
    switch (hit.type) {
      case 'card': {
        const wasSelected = this.sel === hit.index;
        this.sel = hit.index;
        this.drag = { start: p, active: false, wasSelected, pointerId: e.pointerId };
        this.audio.sfx('select', 0.5);
        try {
          this.canvas.setPointerCapture(e.pointerId);
        } catch {}
        e.preventDefault();
        break;
      }
      case 'ability':
        this.useAbility();
        break;
      case 'emote':
        this.hud.emoteOpen = !this.hud.emoteOpen;
        this.audio.sfx('click', 0.5);
        break;
      case 'emoteItem':
        this.sendEmote(hit.index);
        break;
      case 'oppName':
        // Gekürzter Name → voller Name per Tippen (Langdruck-Ersatz auf Touch)
        if (this.hud.oppCut) this.app.toast(this.hud.oppFull, 'info', 1800);
        break;
      case 'arena':
        if (this.sel >= 0) {
          const [wx, wy] = this.view.toWorld(p.x, p.y);
          if (this.tryPlay(wx, wy)) this.sel = -1;
        }
        break;
      default:
        break;
    }
  }

  pointerMove(e) {
    const p = this.cssPoint(e);
    this.pointer = p;
    if (e.pointerType === 'mouse' && this.hud.L) {
      const hit = this.hud.hit(p.x, p.y);
      const t = this.hud.oppCut && hit.type === 'oppName' ? this.hud.oppFull : '';
      if (this.canvas.title !== t) this.canvas.title = t;
      // Emote unter dem Mauszeiger hervorheben
      this.hud.hoverEmote = this.hud.emoteOpen && hit.type === 'emoteItem' ? hit.index : -1;
    }
    if (this.drag && !this.drag.active && Math.hypot(p.x - this.drag.start.x, p.y - this.drag.start.y) > 10) this.drag.active = true;
  }

  pointerUp(e) {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    const p = this.cssPoint(e);
    if (d.active) {
      if (this.hud.inArena(p.x, p.y) && this.sel >= 0) {
        const [wx, wy] = this.view.toWorld(p.x, p.y);
        if (this.tryPlay(wx, wy)) this.sel = -1;
      } else if (this.hud.hit(p.x, p.y).type === 'card') {
        // zurück auf die Hand gezogen → Auswahl behalten
      } else this.sel = -1;
    } else if (d.wasSelected) {
      this.sel = -1;
    }
  }

  keyDown(e) {
    // F3: Debug-Overlay (FPS, Partikel, Sprite-Cache) – auch nach Kampfende
    if (e.key === 'F3') {
      e.preventDefault();
      this.debug = !this.debug;
      return;
    }
    if (!this.me || this.ended) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key >= '1' && e.key <= '4') {
      const i = Number(e.key) - 1;
      this.sel = this.sel === i ? -1 : i;
      this.audio.sfx('select', 0.5);
    } else if (e.key === 'Escape') {
      this.sel = -1;
      this.hud.emoteOpen = false;
    } else if (e.key === ' ' || e.key === 'q' || e.key === 'Q') {
      e.preventDefault();
      this.useAbility();
    } else if (e.key === 'e' || e.key === 'E') {
      this.hud.emoteOpen = !this.hud.emoteOpen;
    }
  }

  placementContext() {
    const obstacles = [];
    const enemyDown = [true, true];
    for (const v of this.vis.values()) {
      if (v.kind === 'unit') continue;
      obstacles.push({ x: v.x, y: v.y, half: v.half });
      if (v.kind === 'tower' && !v.king && v.owner !== this.side) enemyDown[v.x < ARENA_W / 2 ? 0 : 1] = false;
    }
    return { obstacles, enemyDown };
  }

  /** Aktuelle Kosten einer Handkarte laut Server (Spiegel, Spirit Empress); null = gerade nicht spielbar. */
  handCost(slot, card) {
    const hc = this.me?.hc?.[slot];
    if (card?.elixirRule === 'mirror') return hc ?? null;
    return hc ?? card?.elixir ?? 0;
  }

  /** Karte, deren Platzierungsregeln gelten (Spiegel → zuletzt gespielte Karte). */
  effectiveCard(card) {
    if (card?.elixirRule === 'mirror') return this.me?.lp ? this.db.card(this.me.lp) : null;
    return card;
  }

  /** Platzier-Art: Zauber überall, „eigene Seite“-Zauber wie Truppen, Bohrer/Mineur überall außer im Fluss. */
  placeKind(card) {
    if (card.type === 'spell') return card.spell?.ownSide ? 'troop' : 'spell';
    const def = this.db.unit(this.db.unitRefOf(card));
    if (def.traits.deployAnywhere) return 'anywhere';
    return card.type === 'building' ? 'building' : 'troop';
  }

  placementFor(card, wx, wy) {
    const eff = this.effectiveCard(card);
    if (!eff) return { x: wx, y: wy, valid: false, kind: 'spell' };
    const pk = this.placeKind(eff);
    if (pk === 'spell') {
      return { x: clamp(wx, 0, ARENA_W), y: clamp(wy, 0, ARENA_H), valid: true, kind: 'spell', card: eff };
    }
    const def = eff.type === 'spell' ? null : this.db.unit(this.db.unitRefOf(eff));
    const kind = eff.type === 'building' ? 'building' : eff.type === 'spell' ? 'spell' : 'troop';
    const anywhere = pk === 'anywhere';
    const half = kind === 'building' ? def.size / 2 : 0;
    const snapEven = kind === 'building' && Number.isInteger(def.size) && def.size % 2 === 0;
    const snap = (v) => (snapEven ? Math.round(v) : Math.floor(v) + 0.5);
    const { obstacles, enemyDown } = this.placementContext();
    // Wie auf dem Server: Gebäude „überall“ (Koboldbohrer) prüfen wie Truppen, Hindernisse um die halbe Kante vergrößert
    const anyBuilding = anywhere && kind === 'building';
    const obst = anyBuilding ? obstacles.map((o) => ({ ...o, half: o.half + half })) : obstacles;
    const testKind = anyBuilding || kind === 'spell' ? 'troop' : kind;
    const test = (x, y) => isPlacementValid({ side: this.side, x, y, kind: testKind, anywhere, half: testKind === 'building' ? half : 0, obstacles: obst, enemyPrincessDown: enemyDown });
    let x = snap(clamp(wx, 0.01, ARENA_W - 0.01));
    let y = snap(clamp(wy, 0.01, ARENA_H - 0.01));
    if (test(x, y)) return { x, y, valid: true, kind, def, anywhere, card: eff };
    if (!anywhere) {
      const m = kind === 'building' ? half : 0.5;
      const y0 = this.side === 0 ? (kind === 'building' ? 17 + half : 17.5) : m;
      const y1 = this.side === 0 ? ARENA_H - m : kind === 'building' ? 15 - half : 14.5;
      const cx = snap(clamp(wx, m, ARENA_W - m));
      let cy = clamp(wy, y0, y1);
      cy = snap(cy);
      if (cy < y0) cy += 1;
      if (cy > y1) cy -= 1;
      if (test(cx, cy)) return { x: cx, y: cy, valid: true, kind, def, clamped: true, anywhere, card: eff };
    }
    return { x, y, valid: false, kind, def, anywhere, card: eff };
  }

  tryPlay(wx, wy) {
    const me = this.me;
    const slot = this.sel;
    if (!me || slot < 0) return false;
    const id = me.h[slot];
    const card = this.db.card(id);
    if (!card) return false;
    if (me.hr[slot] > 0.01 || this.pendingSlot.has(slot)) return false;
    const cost = this.handCost(slot, card);
    if (cost == null) {
      this.app.toast(REJECTS.MIRROR_EMPTY, 'warn', 1600);
      this.audio.sfx('error');
      return false;
    }
    const pos = this.placementFor(card, wx, wy);
    if (!pos.valid) {
      this.app.toast('Hier nicht möglich!', 'warn', 1400);
      this.audio.sfx('error');
      this.app.haptic(15);
      return false;
    }
    if (this.elixirNow() + 1e-6 < cost) {
      this.hud.flashElixir(slot);
      this.app.toast('Nicht genug Elixier!', 'warn', 1400);
      this.audio.sfx('error');
      this.app.haptic(15);
      return false;
    }
    const seq = ++this.seq;
    this.net.send(C2S.PLAY, { slot, card: id, x: pos.x, y: pos.y, seq });
    this.app.haptic(10);
    this.pendingSlot.set(slot, { card: id, cost, seq, until: performance.now() + 1500 });
    this.ghosts.push({ ...this.ghostFor(card, pos, cost), seq, card: id, until: this.clock + 1.2 });
    return true;
  }

  useAbility() {
    const ab = this.me?.ab;
    if (!ab || this.ended) return;
    if (ab.dep) return this.app.toast('Die Einheit landet noch.', 'warn', 1400);
    if (!(ab.u > 0)) {
      this.audio.sfx('error');
      return this.app.toast('Die Fähigkeit wurde bereits eingesetzt.', 'warn', 1400);
    }
    if (ab.cd > 0) {
      this.audio.sfx('error');
      return this.app.toast('Die Fähigkeit lädt noch.', 'warn', 1400);
    }
    if (this.elixirNow() < ab.cost) {
      this.hud.flashElixir();
      this.audio.sfx('error');
      return this.app.toast('Nicht genug Elixier!', 'warn', 1400);
    }
    this.net.send(C2S.ABILITY, { seq: ++this.seq });
  }

  sendEmote(i) {
    this.hud.emoteOpen = false;
    if ((this.me?.emo || 0) > 0) return;
    this.net.send(C2S.EMOTE, { id: i });
  }

  ghostFor(card, pos, cost = null) {
    const g = { x: pos.x, y: pos.y, valid: pos.valid, kind: pos.kind };
    const eff = pos.card || this.effectiveCard(card) || card;
    if (eff.type === 'spell') {
      g.kind = 'spell';
      g.look = eff.look;
      g.label = eff.name;
      g.radius = eff.spell?.radius || 1;
      g.roll = eff.spell?.roll || null;
      g.dir = forwardDir(this.side);
      return g;
    }
    // Spirit Empress: Form nach den aktuellen Kosten
    let ref = this.db.unitRefOf(eff);
    if (eff.forms) {
      const c = cost ?? this.handCost(this.sel, card);
      ref = (eff.forms.find((f) => f.elixir === c) || eff.forms[0]).unit;
    }
    const def = eff.forms ? this.db.unit(ref) : pos.def || this.db.unit(ref);
    g.look = def.look;
    g.label = eff.name;
    if (eff.type === 'building') {
      g.kind = 'building';
      g.half = def.size / 2;
      return g;
    }
    g.kind = 'troop';
    g.flying = def.flying;
    g.U = this.view.s * (0.42 + def.radius * 0.8) * (def.look?.scale || 1);
    g.range = def.range >= 2 ? def.range + def.radius : 0;
    const n = eff.forms ? 1 : this.db.groupsOf(eff).reduce((sum, gr) => sum + (gr.count || 1), 0);
    g.offsets = formationOffsets(n, def.radius, this.side, eff.formation || null);
    return g;
  }

  // ───────────── Zeichnen ─────────────
  frame(ts) {
    if (!this.running) return;
    requestAnimationFrame(this.frame);
    const now = ts / 1000;
    const dt = Math.min(0.05, Math.max(0, now - (this.lastFrame ?? now)));
    this.lastFrame = now;
    this.clock = now;
    this.adaptQuality(dt);
    if (this.needResize) this.resize();
    this.checkConnection();
    // Hit-Stop verzögert nur die Darstellungszeit (Simulation und Eingaben bleiben unberührt)
    const t0 = performance.now();
    const renderT = t0 + (this.offset ?? 0) - INTERP_MS - this.fx.stopDebt;
    this.updateWorld(renderT, now, dt);
    const t1 = performance.now();
    if (!this.ended) this.ambientFx(dt);
    this.fx.update(dt);
    const t2 = performance.now();
    this.draw(now, dt);
    const t3 = performance.now();
    // Zeitmessung für das Debug-Overlay (F3) und Benchmarks: langsamster Frame mit Aufteilung
    const P = (this.prof ||= { n: 0, worst: null, sum: { world: 0, fx: 0, draw: 0 } });
    const cur = { world: t1 - t0, fx: t2 - t1, draw: t3 - t2, total: t3 - t0, sprites: sprites.stats.built, parts: this.fx.count, dpr: this.dpr, at: now, ...this.drawParts };
    P.n++;
    P.acc ||= {};
    for (const k of ['world', 'fx', 'draw', 'ground', 'units', 'hud', 'pre']) P.acc[k] = (P.acc[k] || 0) + (cur[k] || 0);
    P.sum.world += cur.world;
    P.sum.fx += cur.fx;
    P.sum.draw += cur.draw;
    if (!P.worst || cur.total > P.worst.total) P.worst = cur;
    P.last = cur;
    this.fps = this.fps == null ? 60 : this.fps * 0.95 + (dt > 0 ? 1 / dt : 60) * 0.05;
    if (this.debug) this.drawDebug();
  }

  /** Debug-Overlay (F3): FPS, Bildzeit-Aufteilung, Partikel, Sprite-Cache, Auflösung. */
  drawDebug() {
    const ctx = this.ctx;
    const st = this.fx.debugStats();
    const sp = sprites.info();
    const L = this.prof?.last || {};
    const lines = [
      `${Math.round(this.fps)} fps · ${(this.ft ?? 0).toFixed(1)} ms · DPR ${this.dpr}${this.dynDpr ? ' (dyn.)' : ''}`,
      `Welt ${L.world?.toFixed(1)} · FX ${L.fx?.toFixed(1)} · Zeichnen ${L.draw?.toFixed(1)} ms`,
      `Partikel ${st.particles}/${this.fx.max}${this.fx.loadScale < 1 ? ' ×' + this.fx.loadScale.toFixed(1) : ''} · Decals ${st.decals} · Spuren ${st.trails}`,
      `Sprites ${sp.entries} · ${sp.mb} MB · gebaut ${sp.built} · verschoben ${sp.deferred}`,
      `Einheiten ${this.vis.size} · Hit-Stop ${Math.round(this.fx.stopDebt)} ms`,
    ];
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = 'rgba(8,10,30,0.78)';
    ctx.fillRect(8, 60, 300, lines.length * 16 + 10);
    ctx.font = '12px monospace';
    ctx.fillStyle = '#9dff8a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, 14, 66 + i * 16));
  }

  /**
   * Dynamische Qualitätsstufe: geglättete Bildzeit messen; bei anhaltend langsamen Frames Renderauflösung
   * (DPR 2 → 1,5 → 1,25 → 1) und Partikelbudget senken, bei flüssigem Lauf wieder anheben (mit Hysterese).
   */
  adaptQuality(dt) {
    if (!(dt > 0) || this.app.settings.autoQuality === false) return;
    const ms = Math.min(250, dt * 1000);
    this.ft = this.ft == null ? 16 : this.ft * 0.92 + ms * 0.08;
    this.slowT = this.ft > 24 ? (this.slowT || 0) + dt : 0;
    this.fastT = this.ft < 15 ? (this.fastT || 0) + dt : 0;
    const steps = [2, 1.5, 1.25, 1];
    const cur = this.dynDpr || 99;
    if (this.slowT > 1.2) {
      this.slowT = 0;
      const next = steps.find((v) => v < Math.min(cur, this.dpr));
      if (next) {
        this.dynDpr = next;
        this.needResize = true;
      }
      this.fx.loadScale = Math.max(0.4, (this.fx.loadScale ?? 1) - 0.2);
    } else if (this.fastT > 5) {
      this.fastT = 0;
      if (this.fx.loadScale < 1) this.fx.loadScale = Math.min(1, this.fx.loadScale + 0.2);
      else if (this.dynDpr) {
        const i = steps.indexOf(this.dynDpr);
        this.dynDpr = i > 0 ? steps[i - 1] : null;
        this.needResize = true;
      }
    }
  }

  /** Verbindung instabil (Snapshots bleiben aus oder Ping sehr hoch) → Ping rot + einmaliger Hinweis. */
  checkConnection() {
    const t = performance.now();
    const stale = this.latestAt > 0 && !this.ended && t - this.latestAt > 700;
    const unstable = stale || (this.ping ?? 0) >= 250;
    if (unstable && !this.netUnstable && t - (this.unstableToastAt || -1e9) > 8000) {
      this.unstableToastAt = t;
      this.app.toast('Verbindung instabil …', 'warn', 2200);
    }
    this.netUnstable = unstable;
  }

  draw(now, dt) {
    const ctx = this.ctx;
    this.drawT0 = performance.now();
    sprites.newFrame();
    const { cw, ch, dpr } = this;
    const R = this.renderer;
    const fx = this.fx;
    const q = QUALITY_LEVEL[this.app.settings.quality] ?? 2;
    // Wackeln aus der VFX-Engine (Trauma-Modell; aus bei reduzierter Bewegung oder Regler 0)
    const [ox, oy] = fx.shakeOffset(this.view.s);
    const base = [dpr, ox, oy];
    fx.setView(this.view);
    R.renderBackground(cw, ch, R.bgLayer ? this.bgDpr : dpr);
    if (R.bgLayer) {
      // Hintergrund liegt als eigene Ebene darunter: hier nur leeren; Wackeln per CSS-Transform (Compositor)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const sh = ox || oy ? `translate(${ox.toFixed(1)}px,${oy.toFixed(1)}px)` : '';
      if (sh !== this.bgShake) R.bgLayer.style.transform = this.bgShake = sh;
      ctx.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);
    } else {
      ctx.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);
      ctx.drawImage(R.bg, 0, 0, cw, ch);
    }
    R.drawRiverAnim(ctx, now);

    // Auswahl & Vorschau
    let preview = null;
    const selCard = this.sel >= 0 && this.me ? this.db.card(this.me.h[this.sel]) : null;
    // Platzierungs-Overlay blendet in 150 ms ein und aus
    let ov = null;
    const selEff = selCard ? this.effectiveCard(selCard) : null;
    const selKind = selEff ? this.placeKind(selEff) : 'spell';
    if (selEff && !this.ended && selKind !== 'spell') {
      const { obstacles, enemyDown } = this.placementContext();
      ov = { kind: selKind, enemyDown, obstacles };
      this.lastOverlay = ov;
    }
    this.ovAlpha = Math.max(0, Math.min(1, (this.ovAlpha || 0) + (ov ? dt : -dt) / 0.15));
    const ovDraw = ov || this.lastOverlay;
    if (this.ovAlpha > 0 && ovDraw) {
      ctx.save();
      ctx.globalAlpha = this.ovAlpha;
      R.drawPlacementOverlay(ctx, cw, ch, dpr, ovDraw.kind, this.side, ovDraw.enemyDown, ovDraw.obstacles);
      ctx.restore();
    }
    if (selCard && !this.ended) {
      const p = this.pointer;
      if (p && this.hud.inArena(p.x, p.y) && (this.drag?.active || !this.drag)) {
        const [wx, wy] = this.view.toWorld(p.x, p.y);
        preview = this.ghostFor(selCard, this.placementFor(selCard, wx, wy));
        preview.hint = !!this.drag?.active;
      }
    }

    const tA = performance.now();
    // Boden: Decals → Zauberzonen → Trümmer → Boden-Ringe und -Partikel
    fx.drawDecals(ctx);
    R.drawZonesGround(ctx, this.zones, now);
    const list = [...this.vis.values()];
    if (this.latest) R.drawRubble(ctx, list, this.rules.towers);
    fx.drawRings(ctx, true);
    fx.drawParticles(ctx, 0, base);
    const tB = performance.now();
    // Figuren, Strahlen, Projektile, Luftzonen
    R.drawEntities(ctx, list, now, q);
    if (this.ambientOn()) R.drawClouds(ctx, now);
    R.drawBeams(ctx, list, now);
    R.drawProjectiles(ctx, this.projList || [], now);
    R.drawZonesAir(ctx, this.zones, now);
    const tC = performance.now();
    // Effekte: normal geblendet (Rauch, Splitter) → additiv (Feuer, Funken, Glühen) → Blitze → Ringe in der Luft
    fx.drawParticles(ctx, 1, base);
    fx.drawParticles(ctx, 2, base);
    fx.drawRings(ctx, false);
    fx.drawBolts(ctx);
    R.drawBars(ctx, list);
    fx.drawTexts(ctx, (c, str, x, y, size, color) => ctext(c, str, x, y, size, color, 'center', Math.max(3, size * 0.16)));

    this.ghosts = this.ghosts.filter((g) => g.until > now);
    for (const g of this.ghosts) R.drawGhost(ctx, { ...g, valid: true }, now);
    if (preview) R.drawGhost(ctx, preview, now);
    this.markers = this.markers.filter((m) => now - m.at < 1.3);
    R.drawPlayedMarkers(ctx, this.markers, now, (id, evo) => cardArt(this.db, id, evo));
    this.emotes = this.emotes.filter((e) => now - e.at < 2.6);
    R.drawEmotes(ctx, this.emotes, now);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.drawFlash(ctx, cw, ch);
    const tD = performance.now();
    this.hud.draw(ctx, now, dt);
    const tE = performance.now();
    this.drawParts = { ground: tB - tA, units: tC - tB, fx: tD - tC, hud: tE - tD, pre: tA - (this.drawT0 || tA) };

    // Gezogene Karte: Kartenbild über dem Finger
    this.hud.drawDrag(ctx);
  }
}

/** Gleiche Formation wie auf dem Server (server/sim/match.js → formation). */
export function formationOffsets(n, r, side, kind = null) {
  const flip = side === 0 ? 1 : -1;
  return formation(n, r, kind).map(([x, y]) => [x * flip, y * flip]);
}

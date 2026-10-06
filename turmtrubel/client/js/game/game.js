// Client-Seite eines Kampfes: Snapshot-Puffer + Interpolation, Eingaben, Effekte, Zeichenschleife.
import { ARENA_W, ARENA_H, isPlacementValid, forwardDir, formation } from '/shared/arena.js';
import { EF, EMOTES, C2S, REJECTS } from '/shared/protocol.js';
import { View, Renderer, ZONE_COLORS } from './renderer.js';
import { Hud } from './hud.js';
import { Particles } from './particles.js';
import { cardArt } from '../ui/art.js';
import { safeInsets, reducedMotion } from '../ui/tokens.js';

const INTERP_MS = 110;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const QUALITY_LEVEL = { low: 0, medium: 1, high: 2 };

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
    this.fx = new Particles();
    this.fx.setQuality(app.settings.quality);
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
    this.shake = 0;
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
    this.renderer.renderBackground(this.cw, this.ch, this.dpr);
  }

  settingsChanged() {
    this.fx.setQuality(this.app.settings.quality);
    this.needResize = true;
  }

  resize() {
    this.needResize = false;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const q = this.app.settings.quality;
    const maxDpr = q === 'high' ? 2 : q === 'medium' ? 1.5 : 1;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    this.cw = cw;
    this.ch = ch;
    this.dpr = dpr;
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
    if (s.em !== this.snapMult) {
      if (s.em === 2 && this.snapMult === 1) {
        this.hud.banner('Doppeltes Elixier!', '#ffd0fb', 'Letzte Minute', { kind: 'phase' });
        this.audio.sfx('double');
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
    this.hud.banner(draw ? 'Unentschieden' : win ? 'Sieg!' : 'Niederlage', draw ? '#ffffff' : win ? '#ffe066' : '#ff8a8a', res.reasonText, { kind: 'end' });
    if (win) {
      const [x, y] = [ARENA_W / 2, ARENA_H / 2];
      this.fx.confetti(x, y);
    }
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
      const [px] = view.toScreen(v.x, v.y);
      const [nx] = view.toScreen(x, y);
      const moved = Math.hypot(x - v.x, y - v.y);
      v.moving = dt > 0 && moved / dt > 0.25;
      if (Math.abs(nx - px) > 0.05 && v.moving) v.face = nx > px ? 1 : -1;
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
        const [tx] = view.toScreen(v.targetV.x, v.targetV.y);
        const [sx] = view.toScreen(v.x, v.y);
        if (Math.abs(tx - sx) > 1) v.face = tx > sx ? 1 : -1;
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
      if (z.fx === 'poison' && Math.random() < 0.3) this.fx.poison(z.x, z.y, z.r);
      if (z.fx === 'heal' && Math.random() < 0.3) this.fx.heal(z.x, z.y, z.r * 0.6);
      if (z.fx === 'burn' && Math.random() < 0.4) this.fx.burst(z.x, z.y, 1, { spread: z.r, colors: ['#ff8a3d', '#ffcf3d'], speed: [0, 0.2], vz: [0.8, 1.6], life: [0.3, 0.6], size: [0.1, 0.18], g: -0.5 });
      if (z.fx === 'rage' && Math.random() < 0.2) this.fx.sparkle(z.x + (Math.random() - 0.5) * z.r, z.y + (Math.random() - 0.5) * z.r, 0.2, '#e39bff');
      if (z.fx === 'glue' && Math.random() < 0.2) this.fx.burst(z.x, z.y, 1, { spread: z.r, colors: ['#e8c547'], speed: [0, 0.1], vz: [0, 0], life: [0.5, 0.8], size: [0.12, 0.2], shape: 'drop', g: 0 });
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
      moving: false,
      U: this.view.s * (info.uf || 1),
    };
    this.vis.set(v.id, v);
    return v;
  }

  // ───────────── Ereignisse ─────────────
  processEvents(evs, now) {
    const fx = this.fx;
    const A = this.audio;
    const showDmg = this.app.settings.dmgNumbers;
    for (const ev of evs) {
      switch (ev[0]) {
        case 'a': {
          const src = this.vis.get(ev[1]);
          const tgt = this.vis.get(ev[2]);
          if (!src) break;
          src.atk = 1;
          if (tgt && src.lightning) {
            const z0 = src.kind === 'building' ? src.half * 1.9 : (src.flying ? 1.1 : 0) + 0.8;
            fx.bolt([[src.x, src.y, z0], [tgt.x, tgt.y, (tgt.flying ? 1.1 : 0) + 0.5]], '#bff4ff', 0.18, 0.1);
            A.sfx('zap', 0.4);
          } else if (src.kind === 'tower') A.sfx(src.king ? 'cannon' : 'bow', 0.35);
          else if (src.ranged && !src.beam) A.sfx('shoot', 0.35);
          else if (!src.beam) A.sfx('swing', 0.35);
          break;
        }
        case 'h': {
          const v = this.vis.get(ev[1]);
          if (!v) break;
          v.hurt = 1;
          const z = v.kind === 'tower' ? v.half * 1.4 : (v.flying ? 1.1 : 0) + (v.kind === 'building' ? v.half : 0.5);
          fx.hit(v.x, v.y, z);
          if (showDmg && ev[2] >= 40) {
            // Start über dem LP-Balken, leicht teamfarbig getönt, max. 8 gleichzeitig (siehe Particles.damage)
            const zBar = v.kind === 'tower' ? v.half * 1.6 : v.kind === 'building' ? v.half * 2.1 : (v.flying ? 1.1 : 0) + (v.U * 1.9) / this.view.s + 0.25;
            fx.damage(v.id, v.x + (Math.random() - 0.5) * 0.4, v.y, ev[2], v.owner === this.side ? '#dcebff' : '#ffe1e3', zBar + 0.35);
          }
          A.sfx(v.kind === 'unit' ? 'hit' : 'hitStone', 0.3);
          break;
        }
        case 'hl': {
          const v = this.vis.get(ev[1]);
          if (v) fx.heal(v.x, v.y, 0.3);
          break;
        }
        case 'd': {
          const [, , type, , x, y, flying, silent] = ev;
          if (silent) break;
          const info = this.typeInfo(type, false);
          if (info.kind === 'building') {
            fx.debris(x, y, info.half);
            A.sfx('crumble', 0.6);
          } else if (info.kind === 'unit') {
            fx.poof(x, y, Math.max(0.6, info.radius * 1.6));
            if (flying) fx.burst(x, y, 6, { z: 1.1, colors: ['#ffffff'], speed: [0.5, 1.5], g: 4, life: [0.3, 0.5] });
            A.sfx('pop', 0.45);
          }
          break;
        }
        case 'tw': {
          const [, , owner, isKing, x, y] = ev;
          fx.explosion(x, y, isKing ? 3.5 : 2.5);
          fx.debris(x, y, isKing ? 2.2 : 1.6);
          this.shake = isKing ? 22 : 14;
          A.sfx('towerDown');
          this.app.haptic(20);
          const [sx, sy] = this.view.toScreen(x, y);
          this.hud.flyCrown(sx, sy - this.view.s * 2, owner !== this.side);
          break;
        }
        case 'ka': {
          const v = this.vis.get(ev[1]);
          if (v) fx.text(v.x, v.y, '!', '#ffe066', 1.1, 1.2, 3.5);
          A.sfx('king');
          break;
        }
        case 'sp':
          this.spellFx(ev);
          break;
        case 'bl': {
          const [, x, y, r, , kind] = ev;
          this.blastFx(x, y, r, kind);
          break;
        }
        case 'ch': {
          const [, , x0, y0, pts] = ev;
          const path = [[x0, y0, 6]];
          for (let i = 0; i < pts.length; i += 2) path.push([pts[i], pts[i + 1], 0.5]);
          if (path.length > 1) fx.bolt(path, '#d7b5ff', 0.35, 0.14);
          A.sfx('zap');
          break;
        }
        case 'st': {
          const [, x, y] = ev;
          fx.bolt([[x + 0.5, y - 0.5, 9], [x, y, 0]], '#fff3a0', 0.3, 0.2);
          fx.explosion(x, y, 1.2, ['#fff3a0', '#ffe14d', '#ffffff']);
          this.shake = Math.max(this.shake, 6);
          A.sfx('thunder');
          break;
        }
        case 'ms': {
          const [, , x0, y0, pts] = ev;
          for (let i = 0; i < pts.length; i += 2) {
            fx.bolt([[x0, y0, 1.2], [pts[i], pts[i + 1], 0.5]], '#ffe066', 0.3, 0.08);
            fx.burst(pts[i], pts[i + 1], 4, { colors: ['#ffe066', '#ffffff'], shape: 'star', life: [0.3, 0.6] });
          }
          A.sfx('shoot');
          break;
        }
        case 'ds': {
          const [, , x0, y0, x1, y1] = ev;
          for (let k = 0; k <= 6; k++) {
            const t = k / 6;
            fx.add({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, z: 0.5, life: 0.35, size: 0.18, color: '#9ff5e6', g: 0, drag: 1, shape: 'star' });
          }
          A.sfx('whoosh', 0.6);
          break;
        }
        case 'el': {
          const [, owner, x, y] = ev;
          fx.elixir(x, y);
          if (owner === this.side) {
            fx.text(x, y, '+1', '#ff9af0', 0.6, 1, 2);
            A.sfx('elixir', 0.5);
          }
          break;
        }
        case 'rf': {
          const v = this.vis.get(ev[1]);
          if (v) fx.sparkle(v.x, v.y, 0.6, '#e8fbff');
          break;
        }
        case 'sb': {
          const v = this.vis.get(ev[1]);
          if (v) fx.burst(v.x, v.y, 8, { z: 0.6, colors: ['#e8eef4', '#b9c3cf'], shape: 'shard', spin: 8 });
          break;
        }
        case 'dp': {
          const v = this.vis.get(ev[1]);
          if (v && v.kind === 'unit' && !v.flying) {
            fx.deployDust(v.x, v.y, v.radius);
            if (v.info.def?.mass >= 12) {
              A.sfx('thud', 0.6);
              this.shake = Math.max(this.shake, 3);
            }
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
          if (v) fx.text(v.x, v.y, '!', '#ffffff', 0.7, 0.5, 2.4);
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
          fx.bolt([[x0, y0, 0.8], [x1, y1, 0.5]], '#c9d2dc', 0.35, 0.06);
          A.sfx('whoosh', 0.5);
          break;
        }
        case 'tp': {
          const [, , x0, y0, x1, y1] = ev;
          fx.poof(x0, y0, 0.9);
          fx.burst(x1, y1, 12, { z: 0.6, colors: ['#d7b5ff', '#ffffff'], shape: 'star', speed: [0.5, 2] });
          A.sfx('whoosh', 0.6);
          break;
        }
        case 'pa': {
          const v = this.vis.get(ev[1]);
          if (v) fx.burst(v.x, v.y, 10, { z: 0.8, colors: ['#ffffff', '#c9d2dc'], shape: 'spark', speed: [1, 3] });
          A.sfx('hitStone', 0.6);
          break;
        }
        case 'zb': {
          const a = this.vis.get(ev[1]);
          const b = this.vis.get(ev[2]);
          if (a && b) fx.bolt([[a.x, a.y, 1.2], [b.x, b.y, 0.5]], '#bff4ff', 0.2, 0.1);
          A.sfx('zap', 0.4);
          break;
        }
        case 'su': {
          const v = this.vis.get(ev[1]);
          if (v) fx.deployDust(v.x, v.y, v.half || 1);
          break;
        }
        case 'nt': {
          const a = this.vis.get(ev[1]);
          const b = this.vis.get(ev[2]);
          if (a && b) fx.bolt([[a.x, a.y, 0.8], [b.x, b.y, 0.4]], '#e8dcc0', 0.4, 0.08);
          break;
        }
        case 'en': {
          const b = this.vis.get(ev[2]);
          if (b) fx.sparkle(b.x, b.y, 0.6, '#ffd54a');
          break;
        }
        case 'tr': {
          const v = this.vis.get(ev[1]);
          if (v) fx.poof(v.x, v.y, 1.2);
          A.sfx('pop', 0.5);
          break;
        }
        case 'vn': {
          const v = this.vis.get(ev[1]);
          if (v) fx.burst(v.x, v.y, 8, { colors: ['#4f9a3a', '#7fcf5a'], shape: 'square', speed: [0.5, 1.5], vz: [1, 2] });
          break;
        }
        case 'zp': {
          const [, , x, y, r, kind] = ev;
          fx.ring(x, y, r, ZONE_COLORS[kind] || '#ffffff', 0.35, 0.15, 0.08);
          if (kind === 'quake') this.shake = Math.max(this.shake, 4);
          break;
        }
        case 'lk': {
          const [, , x0, y0, x1, y1] = ev;
          fx.bolt([[x0, y0, 0.8], [x1, y1, 0.8]], '#7fe9ff', 0.25, 0.08);
          break;
        }
        case 'ax': {
          const v = this.vis.get(ev[1]);
          if (v) fx.ring(v.x, v.y, 1.2, '#ffe066', 0.4, 0.2, 0.1);
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
          if (v) fx.burst(v.x, v.y, 14, { z: 0.8, colors: ['#ffe066', '#ffffff', '#fff3a0'], shape: 'star', speed: [1, 3] });
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
          if (evo) fx.burst(x, y, 20, { colors: ['#d7b5ff', '#ffffff', '#b98cff'], shape: 'star', speed: [1, 3], vz: [1, 3] });
          break;
        }
        case 'ot':
          this.hud.banner('Verlängerung!', '#ff9a3d', this.rules.suddenDeath === 'firstHit' ? 'Erster Turmtreffer gewinnt' : 'Erster zerstörter Turm gewinnt', { kind: 'phase' });
          A.sfx('overtime');
          A.music('overtime');
          break;
        default:
          break;
      }
    }
  }

  spellFx(ev) {
    const [, type, x, y, r, owner, fxName] = ev;
    const fx = this.fx;
    const A = this.audio;
    switch (fxName) {
      case 'arrows':
        fx.burst(x, y, 30, { spread: r * 0.9, colors: ['#8a5a32', '#dfe6ee'], shape: 'spark', speed: [0.5, 1.5], vz: [-6, -3], z: 3, life: [0.2, 0.35], g: 0 });
        fx.ring(x, y, r, '#f3e0b0', 0.45, 0.15, 0.15);
        A.sfx('arrows');
        break;
      case 'fire':
        fx.explosion(x, y, r);
        this.shake = Math.max(this.shake, 6);
        A.sfx('boom');
        break;
      case 'comet':
        fx.explosion(x, y, r * 1.4);
        fx.debris(x, y, r * 0.6);
        this.shake = Math.max(this.shake, 12);
        A.sfx('bigBoom');
        break;
      case 'shock':
        fx.shock(x, y, r);
        A.sfx('zap');
        break;
      case 'frost':
        fx.frost(x, y, r);
        for (const v of this.vis.values()) {
          if (v.owner !== owner && Math.hypot(v.x - x, v.y - y) <= r + v.radius) v.ice = true;
        }
        A.sfx('freeze');
        break;
      case 'poison':
        fx.ring(x, y, r, '#7ccf3a', 0.6, 0.3, 0.2);
        A.sfx('poison');
        break;
      case 'heal':
        fx.ring(x, y, r, '#ffe66b', 0.6, 0.3, 0.2);
        fx.heal(x, y, r);
        A.sfx('heal');
        break;
      case 'rage':
        fx.ring(x, y, r, '#c25bd6', 0.6, 0.3, 0.25);
        A.sfx('rage');
        break;
      case 'barrel':
        fx.poof(x, y, 1.4);
        fx.burst(x, y, 10, { colors: ['#8b5a2b', '#6b4226'], shape: 'square', spin: 8, speed: [1, 3], vz: [2, 4], g: 10 });
        A.sfx('barrel');
        break;
      case 'grave':
        fx.ring(x, y, r, '#7d8ca3', 0.8, 0.3, 0.2);
        A.sfx('spooky');
        break;
      case 'log':
      case 'barrelRoll':
        A.sfx('roll');
        break;
      case 'quake':
        fx.ring(x, y, r, '#a0703a', 0.6, 0.3, 0.2);
        fx.debris(x, y, r * 0.4);
        this.shake = Math.max(this.shake, 6);
        A.sfx('crumble');
        break;
      case 'snow':
        fx.frost(x, y, r);
        fx.burst(x, y, 14, { colors: ['#ffffff', '#e8f4ff'], speed: [1, 3], vz: [1, 3], g: 8 });
        A.sfx('splat');
        break;
      case 'tornado':
        fx.ring(x, y, r, '#9fb3c8', 0.8, 0.35, 0.15);
        A.sfx('whoosh');
        break;
      case 'curse':
        fx.ring(x, y, r, '#7cc36b', 0.6, 0.3, 0.2);
        A.sfx('spooky', 0.7);
        break;
      case 'clone':
        fx.ring(x, y, r, '#5ecbff', 0.6, 0.3, 0.25);
        fx.burst(x, y, 16, { spread: r, colors: ['#5ecbff', '#ffffff'], shape: 'star', speed: [0, 0.5], vz: [0.5, 1.5], g: 0 });
        A.sfx('cast');
        break;
      case 'crate':
        fx.poof(x, y, 1.6);
        fx.burst(x, y, 10, { colors: ['#b07a3e', '#8b5a2b'], shape: 'square', spin: 8, speed: [1, 3], vz: [2, 4], g: 10 });
        this.shake = Math.max(this.shake, 5);
        A.sfx('barrel');
        break;
      case 'vines':
        fx.ring(x, y, r, '#4f9a3a', 0.6, 0.3, 0.2);
        A.sfx('splat', 0.6);
        break;
      case 'void':
        fx.ring(x, y, r, '#7a3fc0', 0.8, 0.35, 0.3);
        A.sfx('spooky');
        break;
      case 'storm':
        break;
      default:
        fx.ring(x, y, Math.max(1, r), '#ffffff', 0.4, 0.2, 0.1);
    }
  }

  blastFx(x, y, r, kind) {
    const fx = this.fx;
    const A = this.audio;
    switch (kind) {
      case 'shock':
        fx.shock(x, y, r);
        A.sfx('zap');
        break;
      case 'frost':
        fx.frost(x, y, r);
        A.sfx('freeze', 0.6);
        break;
      case 'fire':
      case 'blast':
        fx.explosion(x, y, r);
        A.sfx('boom', 0.8);
        break;
      case 'rock':
        fx.debris(x, y, r * 0.5);
        A.sfx('crumble', 0.6);
        break;
      case 'slam':
        fx.ring(x, y, r, '#f3e0b0', 0.5, 0.4, 0.2);
        fx.deployDust(x, y, r);
        this.shake = Math.max(this.shake, 7);
        A.sfx('thud');
        break;
      case 'heal':
        fx.ring(x, y, r, '#9dff8a', 0.6, 0.3, 0.2);
        fx.heal(x, y, r);
        A.sfx('heal');
        break;
      case 'rage':
        fx.ring(x, y, r, '#c25bd6', 0.6, 0.3, 0.2);
        A.sfx('rage');
        break;
      case 'pull':
        fx.ring(x, y, r, '#a8f0ff', 0.35, 0.2, 0.1);
        break;
      case 'time':
        fx.ring(x, y, r, '#d2b4ff', 0.9, 0.35, 0.3);
        fx.burst(x, y, 16, { spread: r, colors: ['#d2b4ff', '#ffffff'], shape: 'star', speed: [0, 0.5], vz: [0.3, 1], g: 0, life: [0.8, 1.4] });
        A.sfx('freeze');
        break;
      case 'build':
        fx.deployDust(x, y, 1.2);
        A.sfx('build');
        break;
      case 'bomb':
      case 'cannonball':
      case 'recoil':
        fx.explosion(x, y, Math.max(0.8, r));
        A.sfx('boom', 0.6);
        break;
      case 'curse':
      case 'ghost':
        fx.burst(x, y, 10, { colors: kind === 'curse' ? ['#7cc36b', '#5b2d82'] : ['#e8f0ff', '#d7b5ff'], shape: 'star', speed: [0.3, 1.2], vz: [0.5, 1.5], g: 0 });
        break;
      case 'rune':
      case 'levelup':
      case 'banner':
        fx.ring(x, y, Math.max(0.8, r), '#ffd54a', 0.6, 0.25, 0.15);
        fx.sparkle(x, y, 0.6, '#ffd54a');
        A.sfx(kind === 'levelup' ? 'crown' : 'build', 0.6);
        break;
      case 'taunt':
        fx.ring(x, y, r, '#ff7a5c', 0.6, 0.3, 0.15);
        A.sfx('king', 0.6);
        break;
      case 'spin':
      case 'firewhirl':
        fx.ring(x, y, r, kind === 'firewhirl' ? '#ff8a3d' : '#ffffff', 0.4, 0.3, 0.1);
        A.sfx('swing', 0.7);
        break;
      case 'butterfly':
      case 'sparks':
        fx.burst(x, y, 10, { spread: r, colors: kind === 'sparks' ? ['#ffe066', '#ffffff'] : ['#ff9af0', '#b98cff'], shape: 'star', speed: [0.3, 1], vz: [0.5, 1.5], g: 0 });
        break;
      case 'barrelRoll':
        fx.poof(x, y, 1.2);
        A.sfx('barrel', 0.6);
        break;
      default:
        fx.ring(x, y, r, '#ffffff', 0.4, 0.2, 0.1);
    }
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
      const t = this.hud.oppCut && this.hud.hit(p.x, p.y).type === 'oppName' ? this.hud.oppFull : '';
      if (this.canvas.title !== t) this.canvas.title = t;
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
    if (this.needResize) this.resize();
    this.checkConnection();
    const renderT = performance.now() + (this.offset ?? 0) - INTERP_MS;
    this.updateWorld(renderT, now, dt);
    this.fx.update(dt);
    this.draw(now, dt);
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
    const { cw, ch, dpr } = this;
    const R = this.renderer;
    const q = QUALITY_LEVEL[this.app.settings.quality] ?? 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let ox = 0;
    let oy = 0;
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 40);
      // Reduzierte Bewegung: kein Bildschirmwackeln
      if (!reducedMotion()) {
        ox = (Math.random() - 0.5) * this.shake;
        oy = (Math.random() - 0.5) * this.shake;
      }
    }
    ctx.save();
    ctx.translate(ox, oy);
    R.renderBackground(cw, ch, dpr);
    ctx.drawImage(R.bg, 0, 0, cw, ch);
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

    R.drawZonesGround(ctx, this.zones, now);
    const list = [...this.vis.values()];
    if (this.latest) R.drawRubble(ctx, list, this.rules.towers);
    this.fx.drawRings(ctx, this.view);
    R.drawEntities(ctx, list, now, q);
    R.drawBeams(ctx, list, now);
    R.drawProjectiles(ctx, this.projList || [], now);
    R.drawZonesAir(ctx, this.zones, now);
    this.fx.draw(ctx, this.view);

    this.ghosts = this.ghosts.filter((g) => g.until > now);
    for (const g of this.ghosts) R.drawGhost(ctx, { ...g, valid: true }, now);
    if (preview) R.drawGhost(ctx, preview, now);
    this.markers = this.markers.filter((m) => now - m.at < 1.3);
    R.drawPlayedMarkers(ctx, this.markers, now, (id, evo) => cardArt(this.db, id, evo));
    this.emotes = this.emotes.filter((e) => now - e.at < 2.6);
    R.drawEmotes(ctx, this.emotes, now);
    ctx.restore();

    this.hud.draw(ctx, now, dt);

    // Gezogene Karte: Kartenbild über dem Finger
    this.hud.drawDrag(ctx);
  }
}

/** Gleiche Formation wie auf dem Server (server/sim/match.js → formation). */
export function formationOffsets(n, r, side, kind = null) {
  const flip = side === 0 ? 1 : -1;
  return formation(n, r, kind).map(([x, y]) => [x * flip, y * flip]);
}

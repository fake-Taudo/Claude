// VFX-Engine: Partikel mit Objekt-Pool, Emitter, Shockwave-Ringe, Boden-Decals, Zickzack-Blitze, Bildschirm-Flash,
// Wackeln (Trauma-Modell), Hit-Stop (nur Darstellungszeit) und schwebende Texte. Gesteuert über datengetriebene
// Presets (vfx/presets.json) mit den Schichten Vorlauf (pre) → Kern (core) → Nachhall (post).
// Koordinaten: Welt in Feldern (x, y), Höhe z in Feldern; gezeichnet über die View des Spiels.
import { tex, decalTex } from './textures.js';
import { EASE } from '../design/easing.js';
import { QUALITY } from '../design/tokens.js';

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const val = (v, d) => (Array.isArray(v) ? rnd(v[0], v[1]) : v ?? d);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const LIN = (t) => t;
const easeFn = (name) => (name && EASE[name]) || LIN;
const LAYER = { ground: 0, normal: 1, add: 2 };
const SHAKE = { light: 0.28, medium: 0.5, heavy: 0.85 };
const TEX_PX = { dot: 48, ball: 40, spark: 64, smoke: 64, flame: 56, shard: 40, chunk: 40, star: 40, bubble: 40, drop: 40, plus: 40, leaf: 40, flake: 48, confetti: 32, arrow: 72, wisp: 56, ring: 48 };

export class Vfx {
  /** opts.tex / opts.decalTex: Textur-Lieferanten (Tests können Platzhalter ohne Canvas übergeben). */
  constructor(opts = {}) {
    this.texFn = opts.tex || tex;
    this.decalFn = opts.decalTex || decalTex;
    this.parts = [];
    this.free = [];
    this.rings = [];
    this.decals = [];
    this.bolts = [];
    this.texts = [];
    this.emitters = [];
    this.timers = [];
    this.flashes = [];
    this.trails = new Map();
    this.presets = {};
    this.time = 0;
    this.max = 900;
    this.loadScale = 1;
    this.maxDecals = 24;
    this.countScale = 1;
    this.qualityName = 'high';
    this.shakeAmt = 1;
    this.reduced = false;
    this.reduceFx = false;
    this.trauma = 0;
    this.stopHold = 0;
    this.stopDebt = 0;
    this.stats = { spawned: 0, dropped: 0, emitted: 0, peak: 0 };
    this.dmgSeen = new Map();
    // Optionaler Sound-Hook: (name, lautstärke, env) → z. B. audio.sfx; Preset-Eintrag { type: 'sound', name, vol }
    this.onSound = opts.onSound || null;
  }

  // ───────────── Konfiguration ─────────────
  setPresets(p) {
    this.presets = p || {};
  }
  setQuality(name) {
    const q = QUALITY[name] || QUALITY.high;
    this.qualityName = name;
    this.max = q.particles;
    this.maxDecals = q.decals;
    this.countScale = q.level === 0 ? 0.4 : q.level === 1 ? 0.7 : 1;
  }
  /** shake: 0–1 (Regler), reducedMotion: kein Wackeln/Hit-Stop/Flash, reduceEffects: weniger Partikel, keine Deko. */
  setOptions({ shake = 1, reducedMotion = false, reduceEffects = false } = {}) {
    this.shakeAmt = Math.max(0, Math.min(1, shake));
    this.reduced = !!reducedMotion;
    this.reduceFx = !!reduceEffects;
  }
  get count() {
    return this.parts.length;
  }
  clear() {
    for (const p of this.parts) this.free.push(p);
    this.parts.length = 0;
    this.rings.length = 0;
    this.decals.length = 0;
    this.bolts.length = 0;
    this.texts.length = 0;
    this.emitters.length = 0;
    this.timers.length = 0;
    this.flashes.length = 0;
    this.trails.clear();
    this.trauma = 0;
    this.stopHold = 0;
    this.stopDebt = 0;
  }

  /**
   * Alle Texturen der Presets vorab erzeugen (im Ladescreen), damit im Kampf keine Erzeugung ruckelt.
   * Teamfarben werden für beide Seiten vorbereitet.
   */
  prewarm() {
    const teamCols = ['#3d8bff', '#ff4d57', '#9cc8ff', '#ffb0b5'];
    const cols = (arr) => (arr || []).flatMap((c) => (c === 'team' || c === 'teamLight' || c === 'enemy' ? teamCols : [c]));
    const burstTex = (it) => {
      const shape = it.shape || 'dot';
      const S = TEX_PX[shape] || 48;
      for (const c of cols(it.colors)) this.texFn(shape, c, S);
      for (const c of cols(it.colorLife)) this.texFn(shape, c, S);
    };
    let n = 0;
    for (const [name, pr] of Object.entries(this.presets)) {
      if (name.startsWith('proj.trail.')) {
        burstTex(pr);
        continue;
      }
      for (const items of Object.values(pr.layers || {})) {
        for (const it of items) {
          n++;
          if (it.type === 'burst') burstTex(it);
          else if (it.type === 'emitter') burstTex(it.item || {});
          else if (it.type === 'glow') for (const c of cols([it.color || '#fff6c8'])) this.texFn('dot', c, 64);
          else if (it.type === 'decal') for (const c of cols([it.color || '#2a1a12'])) for (let v = 0; v < 4; v++) this.decalFn(it.shape || 'scorch', c, 128, v);
        }
      }
    }
    return n;
  }

  // ───────────── Presets ─────────────
  has(name) {
    return !!this.presets[name];
  }
  /**
   * Preset abspielen. P = { x, y, z, r (Radius in Feldern), team ('blue'|'red'), teamColor, from:[x,y,z], to:[x,y,z], dir (Winkel), scale }
   */
  emit(name, P) {
    const pr = this.presets[name];
    if (!pr || !P) return false;
    this.stats.emitted++;
    // Radius-Presets: Strecken (Streuung, Ringe, Decals, Glows) in Vielfachen des Wirkradius r;
    // Anzahl wächst mit √(r / baseRadius), Tempo leicht mit r, damit Partikel die Fläche ausfüllen.
    const radial = pr.scaleWith === 'radius';
    const r = Math.max(0.3, P.r ?? pr.baseRadius ?? 1);
    const k = radial ? r : P.scale || 1;
    const kc = radial ? Math.max(0.4, r / (pr.baseRadius || 1)) : P.scale || 1;
    const ks = radial ? Math.max(1, r * 0.6) : 1;
    const env = { ...P, k, kc, ks, z: P.z || 0 };
    const layers = pr.layers || {};
    const delays = pr.delays || {};
    for (const L of ['pre', 'core', 'post']) {
      const items = layers[L];
      if (!items || !items.length) continue;
      const d = delays[L] || 0;
      if (d > 0) this.timers.push({ at: this.time + d, items, env });
      else this.runItems(items, env);
    }
    return true;
  }

  runItems(items, env) {
    for (const it of items) {
      if (it.prio === 0 && this.reduceFx) continue;
      if (it.delay > 0) {
        this.timers.push({ at: this.time + it.delay, items: [{ ...it, delay: 0 }], env });
        continue;
      }
      switch (it.type) {
        case 'burst':
          this.burst(it, env);
          break;
        case 'glow':
          this.glow(it, env);
          break;
        case 'ring':
          this.ring(it, env);
          break;
        case 'decal':
          this.decal(it, env);
          break;
        case 'bolt':
          this.bolt(it, env);
          break;
        case 'flash':
          this.flash(it.color || '#ffffff', it.alpha ?? 0.2, it.life ?? 0.12);
          break;
        case 'shake':
          this.shake(it.strength || 'light');
          break;
        case 'hitstop':
          this.hitstop(it.ms || 40);
          break;
        case 'emitter':
          this.emitter(it, env);
          break;
        case 'text':
          this.text(env.x, env.y, it.str || '!', it.color || '#ffffff', it.size ?? 0.6, it.life ?? 0.8, (env.z || 0) + (it.z ?? 1.2), it.rise ?? 0.6);
          break;
        case 'sound':
          this.onSound?.(it.name, it.vol ?? 1, env);
          break;
        default:
          break;
      }
    }
  }

  colorOf(c, env) {
    if (c === 'team') return env.teamColor || (env.team === 'red' ? '#ff4d57' : '#3d8bff');
    if (c === 'teamLight') return env.teamLight || (env.team === 'red' ? '#ffb0b5' : '#9cc8ff');
    if (c === 'enemy') return env.team === 'red' ? '#3d8bff' : '#ff4d57';
    return c;
  }

  // ───────────── Partikel ─────────────
  spawn(prio) {
    // loadScale < 1: dynamische Qualitätsstufe hat das Budget gesenkt (Deko zuerst)
    const max = this.loadScale < 1 ? Math.round(this.max * this.loadScale) : this.max;
    if (this.parts.length >= max) {
      if (prio < 2) {
        this.stats.dropped++;
        return null;
      }
      // Wichtiges Partikel verdrängt ein Deko-Partikel (Suche von hinten, begrenzt)
      for (let i = this.parts.length - 1, n = 0; i >= 0 && n < 64; i--, n++) {
        if (this.parts[i].prio === 0) {
          const old = this.parts[i];
          this.parts[i] = this.parts[this.parts.length - 1];
          this.parts.pop();
          this.free.push(old);
          break;
        }
      }
      if (this.parts.length >= max) {
        this.stats.dropped++;
        return null;
      }
    }
    const p = this.free.pop() || {};
    this.parts.push(p);
    this.stats.spawned++;
    return p;
  }

  /** Partikel-Explosion nach Spezifikation (siehe docs/STYLE_GUIDE.md §11, Preset-Format). */
  burst(it, env) {
    const k = env.k || 1;
    let n = (it.count ?? 10) * this.countScale * (it.scaleCount === false ? 1 : Math.sqrt(env.kc || 1));
    if (this.reduceFx) n *= 0.5;
    n = Math.max(it.min ?? 1, Math.round(n));
    const colors = (it.colors || ['#ffffff']).map((c) => this.colorOf(c, env));
    const shape = it.shape || 'dot';
    const S = TEX_PX[shape] || 48;
    const life = it.life ?? [0.3, 0.6];
    const prio = it.prio ?? 1;
    const blend = it.blend === 'add' ? 2 : it.layer === 'ground' ? 0 : 1;
    const layer = it.layer ? LAYER[it.layer] ?? blend : blend;
    const colorLife = it.colorLife ? it.colorLife.map((c) => this.texFn(shape, this.colorOf(c, env), S)) : null;
    const spread = (it.spread ?? 0) * (it.spreadAbs ? 1 : k);
    const dir = env.dir ?? 0;
    for (let i = 0; i < n; i++) {
      const p = this.spawn(prio);
      if (!p) return;
      const a = it.cone != null ? dir + rnd(-it.cone, it.cone) : it.angle ? rnd(it.angle[0], it.angle[1]) : Math.random() * TAU;
      const d = spread * (it.ring ? 1 : Math.sqrt(Math.random()));
      const sa = it.ring ? (i / n) * TAU : Math.random() * TAU;
      p.x = env.x + Math.cos(sa) * d;
      p.y = env.y + Math.sin(sa) * d;
      p.z = (env.z || 0) + val(it.z, 0);
      const sp = val(it.speed, 0) * (it.speedScale === false ? 1 : env.ks || 1);
      // radial: vom Zentrum weg (bei Spawn-Kreis), sonst Richtung a
      const ra = it.radial && d > 0 ? sa : a;
      p.vx = Math.cos(ra) * sp;
      p.vy = Math.sin(ra) * sp;
      p.vz = val(it.up, 0);
      p.g = it.gravity ?? 0;
      p.drag = it.drag ?? 1;
      p.max = p.life = val(life, 0.5);
      const s0 = val(it.size, 0.2) * (it.sizeScale ? Math.sqrt(env.kc || 1) : 1);
      p.s0 = s0;
      p.s1 = it.sizeEnd != null ? (typeof it.sizeEnd === 'number' ? it.sizeEnd * (it.sizeEndRel ? s0 : 1) : s0) : s0;
      p.se = easeFn(it.sizeEase || 'outCubic');
      const al = it.alpha ?? [1, 0];
      p.a0 = al[0];
      p.a1 = al[1];
      p.ae = easeFn(it.alphaEase || 'inQuad');
      p.fadeIn = it.fadeIn ?? 0;
      p.rot = (it.rotFromEnv ? env.rot || 0 : 0) + (it.rot != null ? val(it.rot, 0) : it.spin ? Math.random() * TAU : 0);
      p.spin = val(it.spin, 0);
      p.align = it.align ?? 0;
      p.bounce = it.bounce ?? 0;
      p.wx = it.wind ? it.wind[0] : 0;
      p.wy = it.wind ? it.wind[1] : 0;
      p.layer = layer;
      p.prio = prio;
      p.texs = colorLife;
      p.tex = colorLife ? colorLife[0] : this.texFn(shape, pick(colors), S);
      p.ratio = p.tex.height / p.tex.width;
      p.flat = !!it.flat;
    }
    if (this.parts.length > this.stats.peak) this.stats.peak = this.parts.length;
  }

  /** Großer weicher Leuchtfleck (additiv) an der Position. */
  glow(it, env) {
    const p = this.spawn(it.prio ?? 1);
    if (!p) return;
    const k = env.k || 1;
    const r = (it.radius ?? 1) * k;
    p.x = env.x;
    p.y = env.y;
    p.z = (env.z || 0) + (it.z ?? 0.2);
    p.vx = p.vy = p.vz = 0;
    p.g = 0;
    p.drag = 1;
    p.max = p.life = it.life ?? 0.3;
    p.s0 = r * 2 * (it.grow ? 0.6 : 1);
    p.s1 = r * 2 * (it.grow ?? 1);
    p.se = easeFn(it.sizeEase || 'outCubic');
    const al = it.alpha ?? [0.9, 0];
    p.a0 = al[0];
    p.a1 = al[1];
    p.ae = easeFn(it.alphaEase || 'outQuad');
    p.fadeIn = it.fadeIn ?? 0;
    p.rot = 0;
    p.spin = 0;
    p.align = 0;
    p.bounce = 0;
    p.wx = p.wy = 0;
    p.layer = it.blend === 'normal' ? (it.layer === 'ground' ? 0 : 1) : 2;
    p.prio = it.prio ?? 1;
    p.texs = null;
    p.tex = this.texFn('dot', this.colorOf(it.color || '#fff6c8', env), 64);
    p.ratio = 1;
    p.flat = true;
  }

  /** Shockwave-Ring (Kreis am Boden bzw. in Höhe z). */
  ring(it, env) {
    const k = env.k || 1;
    const rr = it.radius ?? [0.2, 1];
    const w = it.width ?? [0.25, 0.02];
    this.rings.push({
      x: env.x,
      y: env.y,
      z: (env.z || 0) + (it.z ?? 0),
      r0: rr[0] * k,
      r1: rr[1] * k,
      w0: w[0],
      w1: w[1],
      color: this.colorOf(it.color || '#ffffff', env),
      fill: it.fill ?? 0,
      life: it.life ?? 0.35,
      max: it.life ?? 0.35,
      e: easeFn(it.ease || 'outExpo'),
      add: it.blend === 'add',
      alpha: it.alpha ?? 0.95,
    });
  }

  /** Boden-Decal (Brandfleck, Riss, Pfütze …) mit Ein-/Ausblenden. */
  decal(it, env) {
    if (this.decals.length >= this.maxDecals) this.decals.shift();
    const k = env.k || 1;
    const size = (it.size ?? 1) * k;
    this.decals.push({
      x: env.x,
      y: env.y,
      r: size,
      tex: this.decalFn(it.shape || 'scorch', this.colorOf(it.color || '#2a1a12', env), 128, (Math.random() * 4) | 0),
      rot: it.rotate === false ? 0 : Math.random() * TAU,
      life: it.life ?? 2,
      max: it.life ?? 2,
      fadeIn: it.fadeIn ?? 0.06,
      alpha: it.alpha ?? 0.85,
      grow: it.grow ?? 0,
      add: it.blend === 'add',
    });
  }

  /** Zickzack-Blitz von from nach to (Weltkoordinaten mit Höhe). */
  bolt(it, env) {
    const k = env.k || 1;
    const center = it.from === 'center';
    const from = it.from === 'sky' ? [env.x + 0.6, env.y - 0.8, 10] : center ? [env.x, env.y, (env.z || 0) + (it.fromZ ?? 0.8)] : env.from || [env.x, env.y, (env.z || 0) + 1];
    const to = env.to || [env.x, env.y, it.toZ ?? 0.3];
    const n = it.count ?? 1;
    for (let i = 0; i < n; i++) {
      // 'center': Entladung strahlt aus der Mitte zu zufälligen Punkten im Wirkradius
      const ang = Math.random() * TAU;
      const dist = k * (it.reach ?? 1) * (0.55 + Math.random() * 0.45);
      this.bolts.push({
        a: from,
        b: center ? [env.x + Math.cos(ang) * dist, env.y + Math.sin(ang) * dist, it.toZ ?? 0.2] : i ? [to[0] + rnd(-0.6, 0.6), to[1] + rnd(-0.6, 0.6), to[2]] : to,
        color: this.colorOf(it.color || '#bff4ff', env),
        width: it.width ?? 0.12,
        life: it.life ?? 0.25,
        max: it.life ?? 0.25,
        segs: it.segments ?? 9,
        jag: it.jag ?? 0.35,
        branches: it.branches ?? 1,
        pts: null,
        next: 0,
      });
    }
  }

  /** Dauer-Emitter (z. B. Glut am Boden, Aura). env.follow() → [x, y, z] oder null (beendet). */
  emitter(it, env) {
    this.emitters.push({ it: it.item || it, env, rate: (it.rate ?? 20) * this.countScale, acc: 0, until: this.time + (it.duration ?? 1), follow: env.follow || null });
  }

  /** Bildschirm-Flash (über der Arena, unter dem HUD). */
  flash(color, alpha, life) {
    if (this.reduced) alpha = Math.min(alpha, 0.08);
    this.flashes.push({ color, alpha, life, max: life });
  }

  /** Wackeln addieren (Trauma 0–1). */
  shake(strength) {
    const s = typeof strength === 'number' ? strength : SHAKE[strength] ?? SHAKE.light;
    this.trauma = Math.min(1, this.trauma + s);
  }

  /** Hit-Stop: Darstellung hält kurz an (Simulation läuft weiter, Aufholen danach). */
  hitstop(ms) {
    if (this.reduced) return;
    this.stopHold = Math.max(this.stopHold, Math.min(90, ms));
  }

  /** Schwebender Text (Ausrufe, Werte). rise = Aufstieg in Feldern. */
  text(x, y, str, color = '#ffffff', size = 0.55, life = 0.9, z = 1.2, rise = 0.6) {
    this.texts.push({ x, y, z, str, color, size, life, max: life, rise, key: null, amount: 0 });
  }

  /** Schadenszahl; Treffer aufs selbe Ziel innerhalb 0,25 s werden addiert, höchstens 8 gleichzeitig. */
  damage(key, x, y, amount, color, z) {
    const prev = this.texts.find((t) => t.key === key && t.max - t.life < 0.25);
    if (prev) {
      prev.amount += amount;
      prev.str = String(Math.round(prev.amount));
      prev.life = prev.max;
      return;
    }
    if (this.texts.filter((t) => t.key != null).length >= 8) return;
    this.texts.push({ x, y, z, str: String(Math.round(amount)), color, size: 0.55, life: 0.55, max: 0.55, rise: 0.9, key, amount });
  }

  /**
   * Spur hinter einem Projektil: pro Projektil-ID werden mit 'rate' Partikel nach Spezifikation ausgestoßen.
   * Aufruf jeden Frame mit der aktuellen Position; nicht mehr gemeldete IDs verfallen von selbst.
   */
  trail(id, x, y, z, it, env = {}) {
    let t = this.trails.get(id);
    if (!t) {
      t = { acc: 0, seen: this.time };
      this.trails.set(id, t);
    }
    t.seen = this.time;
    t.x = x;
    t.y = y;
    t.z = z;
    t.it = it;
    t.env = env;
  }

  // ───────────── Simulation ─────────────
  update(dt) {
    // Hit-Stop: Darstellungszeit anhalten, danach mit 1,5-facher Geschwindigkeit aufholen
    if (this.stopHold > 0) {
      this.stopHold -= dt * 1000;
      this.stopDebt = Math.min(140, this.stopDebt + dt * 1000);
    } else if (this.stopDebt > 0) this.stopDebt = Math.max(0, this.stopDebt - dt * 500);
    const pdt = this.stopHold > 0 ? dt * 0.15 : dt;
    this.time += pdt;
    this.trauma = Math.max(0, this.trauma - dt * 1.5);

    // Verzögerte Schichten
    if (this.timers.length) {
      for (let i = this.timers.length - 1; i >= 0; i--) {
        const tm = this.timers[i];
        if (tm.at <= this.time) {
          this.timers.splice(i, 1);
          this.runItems(tm.items, tm.env);
        }
      }
    }
    // Emitter
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const em = this.emitters[i];
      let pos = null;
      if (em.follow) {
        pos = em.follow();
        if (!pos) {
          this.emitters.splice(i, 1);
          continue;
        }
      }
      if (this.time > em.until) {
        this.emitters.splice(i, 1);
        continue;
      }
      em.acc += pdt * em.rate * (this.reduceFx ? 0.5 : 1);
      if (em.acc >= 1) {
        const n = em.acc | 0;
        em.acc -= n;
        const env = pos ? { ...em.env, x: pos[0], y: pos[1], z: pos[2] ?? em.env.z } : em.env;
        this.burst({ ...em.it, count: n, scaleCount: false, min: n }, env);
      }
    }
    // Projektil-Spuren
    for (const [id, t] of this.trails) {
      if (this.time - t.seen > 0.25) {
        this.trails.delete(id);
        continue;
      }
      t.acc += pdt * (t.it.rate ?? 40) * this.countScale * (this.reduceFx ? 0.5 : 1);
      if (t.acc >= 1) {
        const n = t.acc | 0;
        t.acc -= n;
        this.burst({ ...t.it, count: n, scaleCount: false, min: n }, { ...t.env, x: t.x, y: t.y, z: t.z, k: 1 });
      }
    }
    // Partikel
    const parts = this.parts;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= pdt;
      if (p.life <= 0) {
        parts[i] = parts[parts.length - 1];
        parts.pop();
        this.free.push(p);
        continue;
      }
      if (p.drag !== 1) {
        const r = Math.pow(p.drag, pdt);
        p.vx *= r;
        p.vy *= r;
      }
      p.vx += p.wx * pdt;
      p.vy += p.wy * pdt;
      p.x += p.vx * pdt;
      p.y += p.vy * pdt;
      p.vz -= p.g * pdt;
      p.z += p.vz * pdt;
      if (p.z < 0) {
        if (p.bounce > 0 && p.vz < -0.6) {
          p.z = 0;
          p.vz = -p.vz * p.bounce;
          p.vx *= 0.55;
          p.vy *= 0.55;
          p.spin *= 0.5;
        } else if (p.g > 0) {
          p.z = 0;
          p.vz = 0;
          p.vx *= 0.8;
          p.vy *= 0.8;
          p.spin *= 0.8;
        }
      }
      p.rot += p.spin * pdt;
    }
    for (let i = this.rings.length - 1; i >= 0; i--) if ((this.rings[i].life -= pdt) <= 0) this.rings.splice(i, 1);
    for (let i = this.decals.length - 1; i >= 0; i--) if ((this.decals[i].life -= pdt) <= 0) this.decals.splice(i, 1);
    for (let i = this.bolts.length - 1; i >= 0; i--) if ((this.bolts[i].life -= pdt) <= 0) this.bolts.splice(i, 1);
    for (let i = this.flashes.length - 1; i >= 0; i--) if ((this.flashes[i].life -= dt) <= 0) this.flashes.splice(i, 1);
    for (let i = this.texts.length - 1; i >= 0; i--) if ((this.texts[i].life -= pdt) <= 0) this.texts.splice(i, 1);
  }

  /** Aktueller Wackel-Versatz in px (tile = Pixel pro Feld). */
  shakeOffset(tile) {
    if (this.reduced || this.shakeAmt <= 0 || this.trauma <= 0) return [0, 0];
    const t = this.time;
    const m = this.trauma * this.trauma * this.shakeAmt * tile * 0.38;
    return [m * (Math.sin(t * 47.3) * 0.6 + Math.sin(t * 91.7 + 1.3) * 0.4), m * (Math.sin(t * 53.9 + 2.1) * 0.6 + Math.sin(t * 77.1 + 0.4) * 0.4)];
  }

  // ───────────── Zeichnen ─────────────
  /** Projektion vorbereiten: View → affine Koeffizienten (keine Array-Allokation pro Partikel). */
  setView(view) {
    const [x0, y0] = view.toScreen(0, 0);
    const [x1, y1] = view.toScreen(1, 0);
    const [x2, y2] = view.toScreen(0, 1);
    this.m = [x1 - x0, x2 - x0, x0, y1 - y0, y2 - y0, y0];
    this.s = view.s;
  }

  drawDecals(ctx) {
    if (!this.decals.length) return;
    const [a, b, c, d, e, f] = this.m;
    const s = this.s;
    for (const dc of this.decals) {
      const age = dc.max - dc.life;
      const fin = dc.fadeIn > 0 ? Math.min(1, age / dc.fadeIn) : 1;
      const fout = Math.min(1, dc.life / Math.min(0.8, dc.max * 0.5));
      ctx.globalAlpha = dc.alpha * fin * fout;
      if (dc.add) ctx.globalCompositeOperation = 'lighter';
      const X = a * dc.x + b * dc.y + c;
      const Y = d * dc.x + e * dc.y + f;
      const R = dc.r * s * (1 + dc.grow * (age / dc.max));
      ctx.save();
      ctx.translate(X, Y);
      ctx.rotate(dc.rot);
      ctx.drawImage(dc.tex, -R, -R, R * 2, R * 2);
      ctx.restore();
      if (dc.add) ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }

  drawRings(ctx, ground) {
    if (!this.rings.length) return;
    const [a, b, c, d, e, f] = this.m;
    const s = this.s;
    for (const r of this.rings) {
      if (ground !== r.z <= 0.05) continue;
      const k = 1 - r.life / r.max;
      const ek = r.e(k);
      const X = a * r.x + b * r.y + c;
      const Y = d * r.x + e * r.y + f - r.z * s;
      const R = (r.r0 + (r.r1 - r.r0) * ek) * s;
      const w = Math.max(1, (r.w0 + (r.w1 - r.w0) * ek) * s);
      const al = r.alpha * (1 - k * k);
      if (r.add) ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.arc(X, Y, Math.max(0.5, R), 0, TAU);
      if (r.fill) {
        ctx.globalAlpha = al * r.fill;
        ctx.fillStyle = r.color;
        ctx.fill();
      }
      ctx.globalAlpha = al;
      ctx.lineWidth = w;
      ctx.strokeStyle = r.color;
      ctx.stroke();
      if (r.add) ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }

  /** Partikel einer Ebene zeichnen (0 Boden, 1 normal, 2 additiv). base = Grund-Transformation [dpr, ox, oy]. */
  drawParticles(ctx, layer, base) {
    const parts = this.parts;
    if (!parts.length) return;
    const [a, b, c, d, e, f] = this.m;
    const s = this.s;
    const [dpr, ox, oy] = base;
    if (layer === 2) ctx.globalCompositeOperation = 'lighter';
    let rotated = false;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.layer !== layer) continue;
      const k = 1 - p.life / p.max;
      const size = (p.s0 + (p.s1 - p.s0) * p.se(k)) * s;
      if (size < 0.4) continue;
      let al = p.a0 + (p.a1 - p.a0) * p.ae(k);
      if (p.fadeIn > 0 && k < p.fadeIn) al *= k / p.fadeIn;
      if (al <= 0.01) continue;
      const X = a * p.x + b * p.y + c;
      const Y = d * p.x + e * p.y + f - p.z * s;
      const t = p.texs ? p.texs[Math.min(p.texs.length - 1, (k * p.texs.length) | 0)] : p.tex;
      ctx.globalAlpha = al > 1 ? 1 : al;
      let w = size;
      let h = size * p.ratio;
      let rot = p.rot;
      if (p.align > 0) {
        const vx = a * p.vx + b * p.vy;
        const vy = d * p.vx + e * p.vy - p.vz * s;
        const sp = Math.hypot(vx, vy);
        rot = Math.atan2(vy, vx);
        w *= 1 + Math.min(3, (sp / s) * p.align * 0.25);
      }
      if (rot) {
        const cs = Math.cos(rot) * dpr;
        const sn = Math.sin(rot) * dpr;
        ctx.setTransform(cs, sn, -sn, cs, (X + ox) * dpr, (Y + oy) * dpr);
        ctx.drawImage(t, -w / 2, -h / 2, w, h);
        rotated = true;
      } else {
        if (rotated) {
          ctx.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);
          rotated = false;
        }
        ctx.drawImage(t, X - w / 2, Y - h / 2, w, h);
      }
    }
    if (rotated) ctx.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);
    ctx.globalAlpha = 1;
    if (layer === 2) ctx.globalCompositeOperation = 'source-over';
  }

  drawBolts(ctx) {
    if (!this.bolts.length) return;
    const [a, b, c, d, e, f] = this.m;
    const s = this.s;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'lighter';
    for (const bl of this.bolts) {
      // Alle ~45 ms neue Zacken (Flackern)
      if (!bl.pts || this.time >= bl.next) {
        bl.next = this.time + 0.045;
        bl.pts = jag(bl.a, bl.b, bl.segs, bl.jag);
        bl.br = [];
        for (let i = 0; i < bl.branches; i++) {
          const j = 2 + ((Math.random() * (bl.pts.length - 4)) | 0);
          const p0 = bl.pts[j];
          const len = Math.hypot(bl.b[0] - bl.a[0], bl.b[1] - bl.a[1]) * 0.25 + 0.5;
          const ang = Math.random() * TAU;
          bl.br.push(jag(p0, [p0[0] + Math.cos(ang) * len, p0[1] + Math.sin(ang) * len, Math.max(0, p0[2] - len * 0.6)], 4, bl.jag * 0.8));
        }
      }
      const k = bl.life / bl.max;
      const flick = 0.75 + Math.random() * 0.25;
      const paths = [bl.pts, ...bl.br];
      for (const [lw, col, al] of [
        [bl.width * s * 3.2, bl.color, 0.28],
        [bl.width * s * 1.4, bl.color, 0.65],
        [Math.max(1.2, bl.width * s * 0.55), '#ffffff', 1],
      ]) {
        ctx.globalAlpha = Math.min(1, k * 1.6) * al * flick;
        ctx.strokeStyle = col;
        for (let pi = 0; pi < paths.length; pi++) {
          const pts = paths[pi];
          ctx.lineWidth = Math.max(1, pi ? lw * 0.55 : lw);
          ctx.beginPath();
          for (let i = 0; i < pts.length; i++) {
            const q = pts[i];
            const X = a * q[0] + b * q[1] + c;
            const Y = d * q[0] + e * q[1] + f - q[2] * s;
            if (i) ctx.lineTo(X, Y);
            else ctx.moveTo(X, Y);
          }
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  /** Texte (Schadenszahlen, Ausrufe) über einen Text-Zeichner (gecachte Text-Sprites). */
  drawTexts(ctx, drawText) {
    if (!this.texts.length) return;
    const [a, b, c, d, e, f] = this.m;
    const s = this.s;
    for (const t of this.texts) {
      const age = t.max - t.life;
      const k = Math.min(1, age / t.max);
      const X = a * t.x + b * t.y + c;
      const Y = d * t.x + e * t.y + f - (t.z + t.rise * EASE.outCubic(k)) * s;
      const pop = age < 0.12 ? 0.6 + (age / 0.12) * 0.6 : age < 0.22 ? 1.2 - ((age - 0.12) / 0.1) * 0.2 : 1;
      ctx.globalAlpha = Math.min(1, t.life / (t.max * 0.35));
      drawText(ctx, t.str, X, Y, Math.max(12, Math.round(t.size * s * pop)), t.color);
    }
    ctx.globalAlpha = 1;
  }

  drawFlash(ctx, w, h) {
    for (const fl of this.flashes) {
      const k = fl.life / fl.max;
      ctx.globalAlpha = fl.alpha * k * k;
      ctx.fillStyle = fl.color;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;
  }

  debugStats() {
    return { particles: this.parts.length, pool: this.free.length, decals: this.decals.length, rings: this.rings.length, bolts: this.bolts.length, emitters: this.emitters.length, trails: this.trails.size, ...this.stats };
  }
}

/** Zickzack-Polylinie zwischen zwei 3D-Punkten (Welt), seitlicher Versatz jag (Felder). */
function jag(A, B, segs, amp) {
  const pts = [A];
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    const o = (Math.random() - 0.5) * 2 * amp * Math.sin(t * Math.PI);
    pts.push([A[0] + dx * t + nx * o, A[1] + dy * t + ny * o, A[2] + (B[2] - A[2]) * t + (Math.random() - 0.5) * amp]);
  }
  pts.push(B);
  return pts;
}

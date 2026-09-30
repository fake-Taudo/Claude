// Autoritative Match-Simulation. Läuft ausschließlich auf dem Server mit festem Tick.
// Clients schicken nur Eingaben; alle Regeln (Elixier, Platzierung, Cooldowns) werden hier geprüft.
import {
  ARENA_W,
  ARENA_H,
  RIVER_Y0,
  RIVER_Y1,
  BRIDGES,
  TOWER_SLOTS,
  blockedByRiver,
  halfOf,
  forwardDir,
  isPlacementValid,
} from '../../shared/arena.js';
import { EVO_SLOTS } from '../../shared/cards.js';
import { REJECTS, EF, EMOTES } from '../../shared/protocol.js';
import { NavGrid, MODE_GROUND, MODE_JUMP } from './nav.js';
import { mulberry32, shuffle } from './rng.js';

const TAU = Math.PI * 2;
const r2 = (v) => Math.round(v * 100) / 100;
const r1 = (v) => Math.round(v * 10) / 10;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function isStruct(e) {
  return e.kind !== 'unit';
}

/** Abstand eines Punktes zur "Oberfläche" einer Entität (Gebäude = Quadrat, Einheit = Kreis). */
export function surfaceDist(px, py, e) {
  if (e.kind !== 'unit') {
    const dx = Math.max(Math.abs(px - e.x) - e.half, 0);
    const dy = Math.max(Math.abs(py - e.y) - e.half, 0);
    return Math.hypot(dx, dy);
  }
  return Math.hypot(px - e.x, py - e.y) - e.radius;
}

function rangeDist(a, t) {
  return surfaceDist(a.x, a.y, t) - (a.kind === 'unit' ? a.radius : 0);
}

function affects(targets, o) {
  if (targets === 'both') return true;
  if (targets === 'air') return !!o.flying;
  return !o.flying; // ground, buildings
}

export function formation(n, r) {
  if (n <= 1) return [[0, 0]];
  const s = Math.max(0.65, r * 2 + 0.15);
  if (n === 2) return [[-s / 2, 0], [s / 2, 0]];
  if (n === 3) return [[0, -s * 0.55], [-s * 0.6, s * 0.45], [s * 0.6, s * 0.45]];
  const out = [];
  if (n <= 6) {
    const R = s * (n <= 4 ? 0.75 : 0.95);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (TAU * i) / n + (n === 4 ? Math.PI / 4 : 0);
      out.push([Math.cos(a) * R, Math.sin(a) * R]);
    }
    return out;
  }
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const rr = Math.floor(i / cols);
    out.push([(c - (cols - 1) / 2) * s, (rr - (rows - 1) / 2) * s]);
  }
  return out;
}

export class Match {
  /**
   * @param {object} o
   * @param {object} o.db     – Karten-DB (shared/cards.js createDb)
   * @param {object} o.rules  – rules.json
   * @param {string[][]} o.decks – zwei Decks à 8 Karten-IDs
   * @param {number} [o.seed]
   */
  constructor({ db, rules, decks, seed = 1 }) {
    this.db = db;
    this.rules = rules;
    this.dt = 1 / rules.tickRate;
    this.rng = mulberry32(seed);
    this.maxEntities = rules.maxEntities || 260;
    this.tick = 0;
    this.time = 0;
    this.phase = 'regular';
    this.started = false;
    this.result = null;
    this.nextId = 1;
    this.entities = [];
    this.byId = new Map();
    this.projectiles = [];
    this.zones = [];
    this.events = [];
    this.crowns = [0, 0];
    this.stats = [0, 1].map(() => ({ played: 0, spent: 0, towerDamage: 0, abilities: 0 }));
    this.nav = new NavGrid();
    this.structDirty = true;
    this.players = [0, 1].map((side) => this.makePlayer(side, decks[side]));
    this.towers = [];
    this.createTowers();
    this.rebuildNav();
  }

  // ───────────────────────────── Aufbau ─────────────────────────────

  makePlayer(side, slots) {
    const order = shuffle(slots.slice(), this.rng);
    const evoCards = new Set();
    const evoCharge = {};
    for (const i of EVO_SLOTS) {
      const c = this.db.card(slots[i]);
      if (c && c.evo) {
        evoCards.add(c.id);
        evoCharge[c.id] = this.rules.evo?.startCharged ? c.evo.cycles : 0;
      }
    }
    const handSize = this.rules.hand?.size ?? 4;
    return {
      side,
      deck: slots.slice(),
      hand: order.slice(0, handSize),
      queue: order.slice(handSize),
      handReady: new Array(handSize).fill(0),
      elixir: this.rules.elixir.start,
      evoCards,
      evoCharge,
      championOut: null,
      emoteReadyAt: 0,
    };
  }

  createTowers() {
    for (const slot of TOWER_SLOTS) {
      const cfg = this.rules.towers[slot.key];
      const key = 'tower_' + slot.key;
      const def = {
        key,
        name: cfg.name,
        hp: cfg.hp,
        damage: cfg.damage,
        hitSpeed: cfg.hitSpeed,
        firstHit: cfg.hitSpeed * 0.5,
        range: cfg.range,
        minRange: 0,
        sight: cfg.range,
        targets: 'both',
        size: cfg.size,
        radius: cfg.size / 2,
        projectile: cfg.projectile || null,
        splash: 0,
        towerDamage: 1,
        isBuilding: true,
        traits: {},
        class: 'tower',
        look: {},
      };
      const e = this.addEntity(def, slot.side, slot.x, slot.y, { deployTime: 0, kind: 'tower' });
      e.towerKey = slot.key;
      e.lane = slot.lane;
      e.active = slot.key === 'princess';
      this.towers.push(e);
    }
  }

  addEntity(def, owner, x, y, opts = {}) {
    const tr = def.traits || {};
    const kind = opts.kind || (def.isBuilding ? 'building' : 'unit');
    const e = {
      id: this.nextId++,
      def,
      owner,
      kind,
      typeIdx: this.db.typeIndex.get(def.key) ?? -1,
      cardId: opts.cardId || def.cardId || null,
      x,
      y,
      hp: def.hp,
      maxHp: def.hp,
      shield: tr.shield || 0,
      flying: !!def.flying,
      radius: def.radius,
      half: kind === 'unit' ? def.radius : def.size / 2,
      mass: def.mass,
      evo: !!opts.evo,
      deployT: opts.deployTime ?? def.deployTime ?? 1,
      targetId: 0,
      locked: false,
      cd: 0,
      stunT: 0,
      slowT: 0,
      slowAmt: 0,
      rageT: 0,
      rageMult: 1,
      cloakT: 0,
      cloakDmg: 1,
      cloakSpeed: 1,
      reflectT: 0,
      buffT: 0,
      buffSpeed: 1,
      nextHitMult: 1,
      chargeDist: 0,
      charging: false,
      movedTick: -10,
      jumping: false,
      spawnT: tr.spawner ? tr.spawner.firstDelay ?? tr.spawner.interval : 0,
      genT: tr.elixirGen ? tr.elixirGen.interval : 0,
      healT: 0.5,
      rampT: 0,
      rampTargetId: 0,
      rampStage: 0,
      spawnedCount: 0,
      abilityCd: 0,
      abilityUsed: false,
      dash: null,
      path: null,
      pathTargetId: 0,
      pathT: -10,
      pathVer: -1,
      fx: owner === 0 ? 1 : -1,
      dead: false,
      removed: false,
    };
    this.entities.push(e);
    this.byId.set(e.id, e);
    if (kind !== 'unit') this.structDirty = true;
    return e;
  }

  structures() {
    return this.entities.filter((e) => !e.dead && e.kind !== 'unit');
  }

  rebuildNav() {
    this.nav.rebuild(this.structures().map((s) => ({ id: s.id, x: s.x, y: s.y, half: s.half })));
    this.structDirty = false;
  }

  kingOf(side) {
    return this.towers.find((t) => t.owner === side && t.towerKey === 'king' && !t.dead) || null;
  }

  // ───────────────────────────── Zeit & Elixier ─────────────────────────────

  elixirMultiplier() {
    const R = this.rules;
    if (this.phase === 'overtime') return R.elixir.overtimeMultiplier;
    if (this.time >= R.regularSeconds - R.doubleElixirLastSeconds) return R.elixir.doubleMultiplier;
    return 1;
  }

  timeLeft() {
    const R = this.rules;
    const end = this.phase === 'overtime' ? R.regularSeconds + R.overtimeSeconds : R.regularSeconds;
    return Math.max(0, end - this.time);
  }

  updateElixir(dt) {
    const E = this.rules.elixir;
    const rate = this.elixirMultiplier() / E.regenSeconds;
    for (const p of this.players) p.elixir = Math.min(E.max, p.elixir + rate * dt);
  }

  updateClock() {
    const R = this.rules;
    if (this.phase === 'regular' && this.time >= R.regularSeconds - 1e-9) {
      if (this.crowns[0] !== this.crowns[1] || !(R.overtimeSeconds > 0)) {
        this.finishByScore('time');
      } else {
        this.phase = 'overtime';
        this.events.push(['ot']);
      }
    } else if (this.phase === 'overtime' && this.time >= R.regularSeconds + R.overtimeSeconds - 1e-9) {
      this.finishByScore('time');
    }
  }

  // ───────────────────────────── Haupt-Tick ─────────────────────────────

  step() {
    if (this.result) return;
    const dt = this.dt;
    this.tick++;
    this.time = this.tick * dt;
    if (this.structDirty) this.rebuildNav();
    this.updateClock();
    if (this.result) return;
    this.updateElixir(dt);
    this.updateZones(dt);
    for (let i = 0; i < this.entities.length; i++) {
      const e = this.entities[i];
      if (!e.dead) this.updateEntity(e, dt);
    }
    this.updateProjectiles(dt);
    this.resolveCollisions();
    this.processDeaths();
    this.checkEnd();
  }

  checkEnd() {
    if (this.result) return;
    if (this.phase === 'overtime' && this.crowns[0] !== this.crowns[1]) {
      this.end(this.crowns[0] > this.crowns[1] ? 0 : 1, 'suddenDeath');
    }
  }

  /** Ende nach Zeitablauf: mehr Kronen gewinnen, sonst entscheidet der schwächste Turm. */
  finishByScore(reason) {
    if (this.crowns[0] !== this.crowns[1]) {
      this.end(this.crowns[0] > this.crowns[1] ? 0 : 1, reason);
      return;
    }
    const low = [Infinity, Infinity];
    for (const t of this.towers) {
      if (t.dead) continue;
      low[t.owner] = Math.min(low[t.owner], Math.ceil(t.hp));
    }
    if (low[0] < low[1]) this.end(1, 'tiebreak');
    else if (low[1] < low[0]) this.end(0, 'tiebreak');
    else this.end(null, 'draw');
  }

  end(winner, reason) {
    if (this.result) return;
    this.result = {
      winner,
      reason,
      crowns: this.crowns.slice(),
      time: r1(this.time),
      towerHp: [0, 1].map((side) =>
        this.towers
          .filter((t) => t.owner === side)
          .map((t) => ({ key: t.towerKey, lane: t.lane, hp: t.dead ? 0 : Math.ceil(t.hp), max: t.maxHp })),
      ),
      stats: this.stats.map((s) => ({ ...s, towerDamage: Math.round(s.towerDamage) })),
    };
    this.events.push(['end', winner ?? -1, reason]);
  }

  /** Aufgabe oder endgültige Trennung eines Spielers. */
  forfeit(side, reason = 'forfeit') {
    if (this.result) return;
    const w = 1 - side;
    this.crowns[w] = 3;
    this.end(w, reason);
  }

  // ───────────────────────────── Eingaben ─────────────────────────────

  canPlace(side, card, x, y) {
    let kind = 'troop';
    let half = 0;
    let anywhere = false;
    if (card.type === 'spell') kind = 'spell';
    else {
      const def = this.db.unit(this.db.unitRefOf(card));
      if (card.type === 'building') {
        kind = 'building';
        half = def.size / 2;
      }
      anywhere = !!def.traits.deployAnywhere;
    }
    const obstacles = this.structures().map((s) => ({ x: s.x, y: s.y, half: s.half }));
    const enemyPrincessDown = [0, 1].map(
      (lane) => !this.towers.some((t) => t.owner !== side && t.towerKey === 'princess' && t.lane === lane && !t.dead),
    );
    return isPlacementValid({ side, x, y, kind, half, anywhere, obstacles, enemyPrincessDown });
  }

  /** Karte ausspielen. Gibt { ok } oder { ok:false, code, message } zurück. */
  play(side, slot, cardId, x, y) {
    const fail = (code) => ({ ok: false, code, message: REJECTS[code] });
    if (!this.started || this.result) return fail('NOT_RUNNING');
    const p = this.players[side];
    if (!p) return fail('NOT_RUNNING');
    if (!Number.isInteger(slot) || slot < 0 || slot >= p.hand.length) return fail('BAD_SLOT');
    if (typeof cardId !== 'string' || p.hand[slot] !== cardId) return fail('NOT_IN_HAND');
    if (this.time + 1e-9 < p.handReady[slot]) return fail('NOT_READY');
    const card = this.db.card(cardId);
    if (!card) return fail('NOT_IN_HAND');
    if (p.elixir + 1e-9 < card.elixir) return fail('ELIXIR');
    x = Number(x);
    y = Number(y);
    if (!this.canPlace(side, card, x, y)) return fail('PLACEMENT');
    if (card.type !== 'spell' && this.entities.length + (card.count || 1) > this.maxEntities) return fail('LIMIT');

    // Bezahlen
    p.elixir -= card.elixir;
    this.stats[side].played++;
    this.stats[side].spent += card.elixir;

    // Evo-Ladung
    let evo = false;
    if (p.evoCards.has(cardId)) {
      if (p.evoCharge[cardId] >= card.evo.cycles) {
        evo = true;
        p.evoCharge[cardId] = 0;
      } else {
        p.evoCharge[cardId]++;
      }
    }

    // Rotation wie im Original: gespielte Karte ans Ende der Warteschlange,
    // die nächste Karte rückt in den frei gewordenen Handplatz.
    p.hand[slot] = p.queue.shift();
    p.handReady[slot] = this.time + (this.rules.hand?.arrivalDelay ?? 0.3);
    if (card.class === 'champion') p.championOut = cardId; // kommt erst nach seinem Tod zurück
    else p.queue.push(cardId);

    if (card.type === 'spell') this.castSpell(side, card, x, y, evo);
    else this.spawnCard(side, card, x, y, evo);

    this.events.push(['pl', side, this.db.typeIndex.get(cardId), r2(x), r2(y), evo ? 1 : 0]);
    return { ok: true, evo };
  }

  spawnCard(side, card, x, y, evo) {
    const ref = this.db.unitRefOf(card);
    const def = this.db.unit(ref, evo);
    const offs = formation(card.count || 1, def.radius);
    const flip = side === 0 ? 1 : -1;
    for (const [ox, oy] of offs) {
      const px = clamp(x + ox * flip, def.radius, ARENA_W - def.radius);
      const py = clamp(y + oy * flip, def.radius, ARENA_H - def.radius);
      this.addEntity(def, side, px, py, { deployTime: def.deployTime, evo: def.evo, cardId: card.id });
    }
  }

  abilityEntity(side) {
    let best = null;
    for (const e of this.entities) {
      if (e.dead || e.owner !== side || !e.def.ability) continue;
      if (e.def.class === 'hero' && e.abilityUsed) continue;
      if (!best || e.id > best.id) best = e;
    }
    return best;
  }

  useAbility(side) {
    const fail = (code) => ({ ok: false, code, message: REJECTS[code] });
    if (!this.started || this.result) return fail('NOT_RUNNING');
    const e = this.abilityEntity(side);
    if (!e) return fail('NO_ABILITY');
    if (e.deployT > 0) return fail('DEPLOYING');
    const ab = e.def.ability;
    const p = this.players[side];
    if (e.def.class === 'champion') {
      if (e.abilityCd > 1e-9) return fail('COOLDOWN');
      if (p.elixir + 1e-9 < (ab.cost || 0)) return fail('ELIXIR');
      p.elixir -= ab.cost || 0;
      e.abilityCd = ab.cooldown || 0;
    } else {
      if (e.abilityUsed) return fail('USED');
      e.abilityUsed = true;
    }
    this.stats[side].abilities++;
    this.executeAbility(e, ab);
    this.events.push(['ab', e.id, side, e.typeIdx]);
    return { ok: true };
  }

  emote(side, index) {
    const fail = (code) => ({ ok: false, code, message: REJECTS[code] });
    if (!this.started || this.result) return fail('NOT_RUNNING');
    if (!Number.isInteger(index) || index < 0 || index >= EMOTES.length) return fail('EMOTE_COOLDOWN');
    const p = this.players[side];
    if (this.time + 1e-9 < p.emoteReadyAt) return fail('EMOTE_COOLDOWN');
    p.emoteReadyAt = this.time + (this.rules.emoteCooldown ?? 3);
    this.events.push(['em', side, index]);
    return { ok: true };
  }

  // ───────────────────────────── Entitäten ─────────────────────────────

  updateEntity(e, dt) {
    if (e.stunT > 0) e.stunT = Math.max(0, e.stunT - dt);
    if (e.slowT > 0) {
      e.slowT -= dt;
      if (e.slowT <= 0) e.slowAmt = 0;
    }
    if (e.rageT > 0) {
      e.rageT -= dt;
      if (e.rageT <= 0) e.rageMult = 1;
    }
    if (e.cloakT > 0) e.cloakT -= dt;
    if (e.reflectT > 0) e.reflectT -= dt;
    if (e.buffT > 0) {
      e.buffT -= dt;
      if (e.buffT <= 0) e.buffSpeed = 1;
    }
    if (e.abilityCd > 0) e.abilityCd = Math.max(0, e.abilityCd - dt);

    if (e.deployT > 0) {
      e.deployT -= dt;
      if (e.deployT <= 0) this.onDeployed(e);
      return;
    }
    // Gebäude verlieren über ihre Lebensdauer Leben
    if (e.kind === 'building' && e.def.lifetime > 0) {
      e.hp -= (e.maxHp / e.def.lifetime) * dt;
      if (e.hp <= 0) {
        e.hp = 0;
        e.dead = true;
        return;
      }
    }
    if (e.dash) {
      this.updateDash(e, dt);
      return;
    }
    if (e.stunT > 0) return;
    e.cd = Math.max(0, e.cd - dt * this.attackRate(e));
    this.updateTraits(e, dt);
    if (e.kind === 'tower' && !e.active) return;
    if (!(e.def.damage > 0) && !e.def.traits.ramp) return;
    this.updateCombat(e, dt);
  }

  speedMult(e) {
    return (1 - e.slowAmt) * e.rageMult * e.buffSpeed * (e.cloakT > 0 ? e.cloakSpeed : 1);
  }

  attackRate(e) {
    return (1 - e.slowAmt) * e.rageMult;
  }

  onDeployed(e) {
    const b = e.def.traits.deployBlast;
    if (b) this.areaBlast(e.owner, e.x, e.y, b, e);
    this.events.push(['dp', e.id]);
  }

  updateTraits(e, dt) {
    const tr = e.def.traits;
    if (tr.spawner) {
      e.spawnT -= dt;
      if (e.spawnT <= 0) {
        e.spawnT += tr.spawner.interval;
        const fwd = forwardDir(e.owner);
        const off = e.kind === 'unit' ? 0 : e.half + 0.6;
        this.spawnAround(tr.spawner.unit, tr.spawner.count, e.owner, e.x, e.y + fwd * off, 0.4);
      }
    }
    if (tr.elixirGen) {
      e.genT -= dt;
      if (e.genT <= 0) {
        e.genT += tr.elixirGen.interval;
        const p = this.players[e.owner];
        p.elixir = Math.min(this.rules.elixir.max, p.elixir + tr.elixirGen.amount);
        this.events.push(['el', e.owner, r2(e.x), r2(e.y)]);
      }
    }
    if (tr.healAura) {
      e.healT -= dt;
      if (e.healT <= 0) {
        e.healT += 0.5;
        const R = tr.healAura.radius;
        for (const o of this.entities) {
          if (o.dead || o.owner !== e.owner || o.kind !== 'unit' || o.hp >= o.maxHp) continue;
          if (Math.hypot(o.x - e.x, o.y - e.y) <= R) this.heal(o, tr.healAura.amount * 0.5);
        }
      }
    }
  }

  canTarget(e, t) {
    if (!t || t.dead || t.owner === e.owner) return false;
    if (t.cloakT > 0 || t.dash) return false;
    const tg = e.def.targets;
    if (tg === 'buildings') return t.kind !== 'unit';
    if (t.flying) return tg === 'both' || tg === 'air';
    return tg !== 'air';
  }

  /** Weglänge unter Berücksichtigung der Brücken (grobe, schnelle Schätzung). */
  pathDist(e, t) {
    const direct = Math.hypot(t.x - e.x, t.y - e.y);
    if (e.flying || e.def.traits.riverJump) return direct;
    const he = halfOf(e.y);
    const ht = halfOf(t.y);
    if (he === -1 || ht === -1 || he === ht) return direct;
    const nearY = he === 0 ? RIVER_Y1 : RIVER_Y0;
    const farY = he === 0 ? RIVER_Y0 : RIVER_Y1;
    let best = Infinity;
    for (const b of BRIDGES) {
      const d = Math.hypot(e.x - b.cx, e.y - nearY) + (RIVER_Y1 - RIVER_Y0) + Math.hypot(t.x - b.cx, t.y - farY);
      if (d < best) best = d;
    }
    return best;
  }

  acquireTarget(e) {
    const struct = isStruct(e);
    const buildingsOnly = e.def.targets === 'buildings';
    let best = null;
    let bestScore = Infinity;
    for (const t of this.entities) {
      if (!this.canTarget(e, t)) continue;
      let score;
      if (struct) {
        score = rangeDist(e, t);
        if (score > e.def.range) continue;
        if (e.def.minRange && Math.hypot(t.x - e.x, t.y - e.y) < e.def.minRange) continue;
      } else if (buildingsOnly) {
        score = this.pathDist(e, t);
      } else {
        score = rangeDist(e, t);
        if (score > e.def.sight) continue;
      }
      if (score < bestScore) {
        bestScore = score;
        best = t;
      }
    }
    if (!best && !struct && !buildingsOnly) {
      // Nichts in Sicht → zum nächsten gegnerischen Gebäude/Turm laufen
      for (const t of this.entities) {
        if (t.dead || t.owner === e.owner || t.kind === 'unit') continue;
        const score = this.pathDist(e, t);
        if (score < bestScore) {
          bestScore = score;
          best = t;
        }
      }
    }
    return best;
  }

  updateCombat(e, dt) {
    let t = e.targetId ? this.byId.get(e.targetId) : null;
    if (t && (!this.canTarget(e, t) || (isStruct(e) && rangeDist(e, t) > e.def.range + 0.05))) {
      t = null;
      e.locked = false;
    }
    if (!e.locked) {
      const nt = this.acquireTarget(e);
      if (nt !== t) e.path = null;
      t = nt;
    }
    e.targetId = t ? t.id : 0;
    if (!t) return;

    const d = rangeDist(e, t);
    const inRange =
      d <= e.def.range + (e.locked ? 0.35 : 0) &&
      (!e.def.minRange || Math.hypot(t.x - e.x, t.y - e.y) >= e.def.minRange);
    if (inRange) {
      if (!e.locked) {
        e.locked = true;
        e.cd = Math.max(e.cd, e.def.firstHit);
      }
      if (Math.abs(t.x - e.x) > 0.05) e.fx = t.x > e.x ? 1 : -1;
      if (e.def.traits.ramp) {
        if (e.rampTargetId === t.id) e.rampT += dt;
        else {
          e.rampTargetId = t.id;
          e.rampT = 0;
        }
      }
      if (e.cd <= 0) {
        this.attack(e, t);
        e.cd = e.def.hitSpeed;
      }
    } else {
      e.locked = false;
      if (e.kind === 'unit') this.moveTowards(e, t, dt);
    }
  }

  waypoint(e, t) {
    const mode = e.def.traits.riverJump ? MODE_JUMP : MODE_GROUND;
    if (this.nav.lineClear(e.x, e.y, t.x, t.y, mode, t.id)) {
      e.path = null;
      return t;
    }
    const moved = e.path && e.pathGoal ? Math.hypot(e.pathGoal.x - t.x, e.pathGoal.y - t.y) > 1.5 : true;
    if (!e.path || e.pathTargetId !== t.id || e.pathVer !== this.nav.version || this.time - e.pathT > 1 || moved) {
      e.path = this.nav.findPath(e.x, e.y, t.x, t.y, mode, t.id) || [];
      e.pathTargetId = t.id;
      e.pathVer = this.nav.version;
      e.pathT = this.time;
      e.pathGoal = { x: t.x, y: t.y };
    }
    const path = e.path;
    while (path.length && Math.hypot(path[0].x - e.x, path[0].y - e.y) < 0.3) path.shift();
    if (path.length > 1 && this.nav.lineClear(e.x, e.y, path[1].x, path[1].y, mode, t.id)) path.shift();
    return path.length ? path[0] : t;
  }

  moveTowards(e, t, dt) {
    let spd = e.def.speed * this.speedMult(e);
    const ch = e.def.traits.charge;
    if (e.charging && ch) spd *= ch.speedMult;
    const goal = e.flying ? t : this.waypoint(e, t);
    const dx = goal.x - e.x;
    const dy = goal.y - e.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6) return;
    const step = Math.min(d, spd * dt);
    e.x += (dx / d) * step;
    e.y += (dy / d) * step;
    e.movedTick = this.tick;
    if (Math.abs(dx) > 0.02) e.fx = dx > 0 ? 1 : -1;
    if (ch && !e.charging) {
      e.chargeDist += step;
      if (e.chargeDist >= ch.distance) e.charging = true;
    }
  }

  attack(e, t) {
    const def = e.def;
    const tr = def.traits;
    let dmg = def.damage;
    if (tr.ramp) {
      const st = Math.min(tr.ramp.stages.length - 1, Math.floor(e.rampT / tr.ramp.stageTime));
      e.rampStage = st;
      dmg = tr.ramp.stages[st];
    }
    if (e.charging && tr.charge) {
      dmg *= tr.charge.damageMult;
      e.charging = false;
      e.chargeDist = 0;
    }
    if (e.cloakT > 0) dmg *= e.cloakDmg;
    if (e.nextHitMult > 1) {
      dmg *= e.nextHitMult;
      e.nextHitMult = 1;
    }
    if (tr.longRangeBonus && Math.hypot(t.x - e.x, t.y - e.y) >= tr.longRangeBonus.minDist) dmg *= tr.longRangeBonus.mult;

    const targets = [t];
    if (tr.multiTarget > 1) {
      const others = this.entities
        .filter((o) => o !== t && this.canTarget(e, o) && rangeDist(e, o) <= def.range)
        .sort((a, b) => rangeDist(e, a) - rangeDist(e, b));
      targets.push(...others.slice(0, tr.multiTarget - 1));
    }
    const proj = def.projectile;
    for (const tt of targets) {
      const payload = {
        owner: e.owner,
        srcId: e.id,
        damage: dmg,
        splash: def.splash,
        splashSelf: def.splashSelf,
        sx: e.x,
        sy: e.y,
        targets: def.targets,
        towerDamage: def.towerDamage ?? 1,
        onHit: tr.onHit || null,
      };
      if (proj && proj.speed > 0 && !def.splashSelf) this.spawnProjectile(e, tt, payload, proj);
      else this.applyAttack(payload, tt, tt.x, tt.y);
      this.events.push(['a', e.id, tt.id]);
    }
    if (tr.kamikaze) {
      e.x = t.x + (e.x - t.x) * 0.3;
      e.y = t.y + (e.y - t.y) * 0.3;
      e.hp = 0;
      e.dead = true;
    }
  }

  spawnProjectile(src, target, payload, proj) {
    this.projectiles.push({
      id: this.nextId++,
      kind: proj.kind || 'rock',
      owner: src.owner,
      x: src.x,
      y: src.y,
      sx: src.x,
      sy: src.y,
      tx: target.x,
      ty: target.y,
      targetId: target.id,
      homing: !proj.arc,
      speed: proj.speed,
      payload,
      flying: src.flying,
    });
  }

  updateProjectiles(dt) {
    const keep = [];
    for (const pr of this.projectiles) {
      let target = null;
      if (pr.homing) {
        target = this.byId.get(pr.targetId);
        if (target && !target.dead) {
          pr.tx = target.x;
          pr.ty = target.y;
        } else target = null;
      }
      const dx = pr.tx - pr.x;
      const dy = pr.ty - pr.y;
      const d = Math.hypot(dx, dy);
      const step = pr.speed * dt;
      if (d <= step + 0.05) {
        pr.x = pr.tx;
        pr.y = pr.ty;
        this.applyAttack(pr.payload, target, pr.tx, pr.ty);
      } else {
        pr.x += (dx / d) * step;
        pr.y += (dy / d) * step;
        keep.push(pr);
      }
    }
    this.projectiles = keep;
  }

  /** Schaden eines Angriffs anwenden (Einzelziel oder Fläche) inkl. Treffer-Effekten. */
  applyAttack(p, target, ix, iy) {
    const hits = [];
    if (p.splash > 0) {
      const cx = p.splashSelf ? p.sx : ix;
      const cy = p.splashSelf ? p.sy : iy;
      for (const o of this.entities) {
        if (o.dead || o.owner === p.owner || !affects(p.targets, o)) continue;
        if (surfaceDist(cx, cy, o) <= p.splash) hits.push(o);
      }
    } else if (target && !target.dead) hits.push(target);

    const src = this.byId.get(p.srcId);
    const srcAlive = src && !src.dead;
    const oh = p.onHit;
    let total = 0;
    let killed = 0;
    for (const o of hits) {
      const amt = o.kind === 'tower' ? p.damage * p.towerDamage : p.damage;
      total += this.damage(o, amt, src, p.owner);
      if (o.dead) killed++;
      if (oh) {
        if (oh.stun) this.stun(o, oh.stun);
        if (oh.slow) this.slow(o, oh.slow.amount, oh.slow.duration);
        if (oh.knockback) this.knockback(o, p.sx, p.sy, oh.knockback);
      }
    }
    if (oh) {
      if (oh.burn) {
        this.addZone(
          p.owner,
          { radius: oh.burn.radius, duration: oh.burn.duration, pulse: 0.5, damage: oh.burn.dps * 0.5, towerDamage: 0.5, targets: 'ground', fx: 'burn' },
          ix,
          iy,
          {},
        );
      }
      if (oh.pull && srcAlive) {
        for (const o of this.entities) {
          if (o.dead || o.owner === p.owner || o.kind !== 'unit' || o.flying) continue;
          if (Math.hypot(o.x - src.x, o.y - src.y) <= oh.pull.radius) this.pull(o, src.x, src.y, oh.pull.strength);
        }
        this.events.push(['bl', r2(src.x), r2(src.y), oh.pull.radius, p.owner, 'pull']);
      }
      if (oh.lifesteal && srcAlive && total > 0) this.heal(src, total * oh.lifesteal);
      if (oh.spawn && srcAlive && hits.length && src.spawnedCount < (oh.spawn.max ?? 99)) {
        src.spawnedCount++;
        this.spawnAround(oh.spawn.unit, oh.spawn.count, p.owner, src.x, src.y, 0.2);
      }
    }
    if (srcAlive) {
      const tr = src.def.traits;
      if (tr.rageOnHit && hits.length) this.rage(src, tr.rageOnHit.mult, tr.rageOnHit.duration);
      if (tr.healOnKill && killed) this.heal(src, tr.healOnKill * killed);
    }
    return total;
  }

  damage(o, amount, src, srcOwner, depth = 0) {
    if (!o || o.dead || !(amount > 0)) return 0;
    if (o.dash) return 0;
    if (o.reflectT > 0) {
      if (src && !src.dead && depth < 1 && src.owner !== o.owner) this.damage(src, amount, o, o.owner, depth + 1);
      this.events.push(['rf', o.id]);
      return 0;
    }
    const armor = o.def.traits.movingArmor;
    if (armor && o.movedTick >= this.tick - 1) amount *= 1 - armor;
    const dealt = amount;
    if (o.shield > 0) {
      const s = Math.min(o.shield, amount);
      o.shield -= s;
      amount -= s;
      if (o.shield <= 0) this.events.push(['sb', o.id]);
    }
    o.hp -= amount;
    if (o.kind === 'tower') {
      if (srcOwner === 0 || srcOwner === 1) this.stats[srcOwner].towerDamage += dealt;
      if (o.towerKey === 'king' && !o.active) this.activateKing(o);
      if (this.phase === 'overtime' && this.rules.suddenDeath === 'firstHit' && srcOwner !== o.owner) {
        this.end(1 - o.owner, 'suddenDeath');
      }
    }
    if (o.hp <= 0) {
      o.hp = 0;
      o.dead = true;
    }
    this.events.push(['h', o.id, Math.round(dealt)]);
    return dealt;
  }

  heal(o, amount) {
    if (!o || o.dead || o.kind !== 'unit' || !(amount > 0)) return;
    const before = o.hp;
    o.hp = Math.min(o.maxHp, o.hp + amount);
    if (o.hp > before + 0.5) this.events.push(['hl', o.id, Math.round(o.hp - before)]);
  }

  stun(o, t) {
    if (!o || o.dead || o.dash || !(t > 0)) return;
    o.stunT = Math.max(o.stunT, t);
    o.cd = Math.max(o.cd, o.def.firstHit);
    o.rampT = 0;
    o.charging = false;
    o.chargeDist = 0;
  }

  slow(o, amount, duration) {
    if (!o || o.dead) return;
    o.slowAmt = o.slowT > 0 ? Math.max(o.slowAmt, amount) : amount;
    o.slowT = Math.max(o.slowT, duration);
  }

  rage(o, mult, duration) {
    if (!o || o.dead || o.kind !== 'unit') return;
    o.rageMult = Math.max(o.rageT > 0 ? o.rageMult : 1, mult);
    o.rageT = Math.max(o.rageT, duration);
  }

  knockback(o, fx, fy, dist) {
    if (!o || o.dead || o.kind !== 'unit' || o.mass >= 12 || o.dash) return;
    let dx = o.x - fx;
    let dy = o.y - fy;
    let l = Math.hypot(dx, dy);
    if (l < 1e-3) {
      dx = 0;
      dy = -forwardDir(o.owner);
      l = 1;
    }
    o.x += (dx / l) * dist;
    o.y += (dy / l) * dist;
    o.path = null;
  }

  pull(o, tx, ty, strength) {
    if (!o || o.dead || o.kind !== 'unit' || o.mass >= 15) return;
    const dx = tx - o.x;
    const dy = ty - o.y;
    const l = Math.hypot(dx, dy);
    if (l < 0.6) return;
    const m = Math.min(strength, l - 0.6);
    o.x += (dx / l) * m;
    o.y += (dy / l) * m;
    o.path = null;
  }

  activateKing(k) {
    if (k.active || k.dead) return;
    k.active = true;
    this.events.push(['ka', k.id]);
  }

  /** Flächeneffekt um einen Punkt (Aufstell-Explosion, Todesschaden, Fähigkeiten). */
  areaBlast(owner, x, y, b, src) {
    for (const o of this.entities) {
      if (o.dead || o.owner === owner) continue;
      if (surfaceDist(x, y, o) > b.radius) continue;
      if (b.damage) this.damage(o, o.kind === 'tower' ? b.damage * (b.towerDamage ?? 1) : b.damage, src, owner);
      if (b.stun) this.stun(o, b.stun);
      if (b.slow) this.slow(o, b.slow.amount, b.slow.duration);
      if (b.knockback) this.knockback(o, x, y, b.knockback);
    }
    this.events.push(['bl', r2(x), r2(y), b.radius, owner, b.fx || 'blast']);
  }

  spawnAround(ref, count, owner, x, y, deployTime = 0.5) {
    const def = this.db.unit(ref);
    const offs = formation(count, def.radius);
    const flip = owner === 0 ? 1 : -1;
    const out = [];
    for (const [ox, oy] of offs) {
      if (this.entities.length >= this.maxEntities) break;
      const px = clamp(x + ox * flip, def.radius, ARENA_W - def.radius);
      const py = clamp(y + oy * flip, def.radius, ARENA_H - def.radius);
      out.push(this.addEntity(def, owner, px, py, { deployTime }));
    }
    return out;
  }

  // ───────────────────────────── Fähigkeiten ─────────────────────────────

  executeAbility(e, ab) {
    const R = ab.radius || 0;
    if (ab.dash) {
      e.dash = { left: ab.dash.count, radius: ab.dash.radius, damage: ab.dash.damage, interval: ab.dash.interval || 0.3, t: 0, hit: new Set() };
      e.locked = false;
    }
    if (ab.reflect) e.reflectT = ab.reflect;
    if (ab.cloak) {
      e.cloakT = ab.cloak.duration;
      e.cloakDmg = ab.cloak.damageMult || 1;
      e.cloakSpeed = ab.cloak.speedMult || 1;
    }
    if (ab.buff) {
      e.buffT = ab.buff.duration || 0;
      e.buffSpeed = ab.buff.speedMult || 1;
      if (ab.buff.nextHitMult) e.nextHitMult = ab.buff.nextHitMult;
    }
    if (R && (ab.damage || ab.stun || ab.knockback)) {
      this.areaBlast(e.owner, e.x, e.y, { damage: ab.damage, radius: R, stun: ab.stun, knockback: ab.knockback, towerDamage: ab.towerDamage ?? 1, fx: ab.fx || 'slam' }, e);
    }
    if (R && (ab.heal || ab.rage)) {
      for (const o of this.entities) {
        if (o.dead || o.owner !== e.owner || o.kind !== 'unit') continue;
        if (Math.hypot(o.x - e.x, o.y - e.y) > R) continue;
        if (ab.heal) this.heal(o, ab.heal);
        if (ab.rage) this.rage(o, ab.rage.mult, ab.rage.duration);
      }
      this.events.push(['bl', r2(e.x), r2(e.y), R, e.owner, ab.rage ? 'rage' : 'heal']);
    }
    if (ab.summon) this.spawnAround(ab.summon.unit, ab.summon.count, e.owner, e.x, e.y, 0.4);
    if (ab.shots) {
      const list = this.entities
        .filter((o) => !o.dead && o.owner !== e.owner && o.cloakT <= 0 && surfaceDist(e.x, e.y, o) <= ab.shots.radius)
        .sort((a, b) => surfaceDist(e.x, e.y, a) - surfaceDist(e.x, e.y, b))
        .slice(0, ab.shots.count);
      const pts = [];
      for (const o of list) {
        this.damage(o, o.kind === 'tower' ? ab.shots.damage * (ab.towerDamage ?? 1) : ab.shots.damage, e, e.owner);
        pts.push(r2(o.x), r2(o.y));
      }
      this.events.push(['ms', e.id, r2(e.x), r2(e.y), pts]);
    }
    if (ab.build) {
      const def = this.db.unit(ab.build);
      const back = -forwardDir(e.owner);
      const h = def.size / 2;
      const bx = clamp(e.x, h, ARENA_W - h);
      const by = clamp(e.y + back * 0.8, h, ARENA_H - h);
      this.addEntity(def, e.owner, bx, by, { deployTime: def.deployTime });
      this.events.push(['bl', r2(bx), r2(by), 1.5, e.owner, 'build']);
    }
  }

  updateDash(e, dt) {
    const d = e.dash;
    d.t -= dt;
    if (d.t > 0) return;
    d.t = d.interval;
    if (d.left <= 0) {
      e.dash = null;
      return;
    }
    let best = null;
    let bd = Infinity;
    for (const o of this.entities) {
      if (o.dead || o.owner === e.owner || d.hit.has(o.id) || o.cloakT > 0) continue;
      const dd = surfaceDist(e.x, e.y, o);
      if (dd <= d.radius && dd < bd) {
        bd = dd;
        best = o;
      }
    }
    if (!best) {
      e.dash = null;
      return;
    }
    const x0 = e.x;
    const y0 = e.y;
    const dx = e.x - best.x;
    const dy = e.y - best.y;
    const l = Math.hypot(dx, dy) || 1;
    const off = (isStruct(best) ? best.half * 1.15 : best.radius) + e.radius + 0.05;
    e.x = clamp(best.x + (dx / l) * off, e.radius, ARENA_W - e.radius);
    e.y = clamp(best.y + (dy / l) * off, e.radius, ARENA_H - e.radius);
    if (Math.abs(best.x - e.x) > 0.02) e.fx = best.x > e.x ? 1 : -1;
    d.hit.add(best.id);
    d.left--;
    this.events.push(['ds', e.id, r2(x0), r2(y0), r2(e.x), r2(e.y)]);
    this.damage(best, best.kind === 'tower' ? d.damage * 0.3 : d.damage, e, e.owner);
  }

  // ───────────────────────────── Zauber ─────────────────────────────

  castSpell(owner, card, x, y, evo) {
    const s = this.db.spell(card, evo);
    const king = this.kingOf(owner);
    return this.addZone(owner, s, x, y, {
      typeIdx: this.db.typeIndex.get(card.id),
      fromX: king ? king.x : x,
      fromY: king ? king.y : y,
      evo,
    });
  }

  addZone(owner, s, x, y, o = {}) {
    const z = {
      id: this.nextId++,
      owner,
      s,
      x,
      y,
      typeIdx: o.typeIdx ?? -1,
      fx: s.fx || null,
      fromX: o.fromX ?? x,
      fromY: o.fromY ?? y,
      evo: !!o.evo,
      t: 0,
      delay: s.delay || 0,
      impacted: false,
      activeT: 0,
      nextPulse: 0,
      done: false,
      echoAt: s.echo ? (s.delay || 0) + s.echo.delay : -1,
      graveSpawned: 0,
      traveled: 0,
      hit: null,
    };
    if (s.roll) {
      z.dir = forwardDir(owner);
      z.hit = new Set();
      z.impacted = true;
    }
    this.zones.push(z);
    return z;
  }

  inZone(z, o) {
    return surfaceDist(z.x, z.y, o) <= (z.s.radius || 0);
  }

  updateZones(dt) {
    for (const z of this.zones) {
      if (z.done) continue;
      z.t += dt;
      const s = z.s;
      if (s.roll) {
        this.updateRoll(z, dt);
        continue;
      }
      if (!z.impacted) {
        if (z.t + 1e-9 < z.delay) continue;
        z.impacted = true;
        this.spellImpact(z);
      } else {
        z.activeT += dt;
      }
      if (z.echoAt >= 0 && z.t + 1e-9 >= z.echoAt) {
        z.echoAt = -1;
        this.spellImpact(z);
      }
      if (s.duration > 0) {
        if (s.pulse) {
          while (z.nextPulse <= z.activeT + 1e-9 && z.nextPulse < s.duration - 1e-9) {
            this.spellPulse(z);
            z.nextPulse += s.pulse;
          }
        }
        if (s.slow && s.slow.duration == null) {
          for (const o of this.entities) {
            if (o.dead || o.owner === z.owner || !affects(s.targets || 'both', o)) continue;
            if (this.inZone(z, o)) this.slow(o, s.slow.amount, 0.3);
          }
        }
        if (s.rage) {
          for (const o of this.entities) {
            if (o.dead || o.owner !== z.owner || o.kind !== 'unit') continue;
            if (this.inZone(z, o)) this.rage(o, s.rage.mult, 1.5);
          }
        }
        if (s.graveyard) this.updateGraveyard(z);
        if (z.activeT + 1e-9 >= s.duration) z.done = true;
      } else if (z.echoAt < 0) {
        z.done = true;
      }
    }
    this.zones = this.zones.filter((z) => !z.done);
  }

  spellImpact(z) {
    const s = z.s;
    const tg = s.targets || 'both';
    if (s.strikes) this.lightningStrikes(z);
    else if (s.chain) this.chainLightning(z);
    else if (!s.pulse && (s.damage || s.stun || s.knockback || (s.slow && s.slow.duration != null))) {
      for (const o of this.entities) {
        if (o.dead || o.owner === z.owner || !affects(tg, o)) continue;
        if (!this.inZone(z, o)) continue;
        if (s.damage) this.damage(o, o.kind === 'tower' ? s.damage * (s.towerDamage ?? 1) : s.damage, null, z.owner);
        if (s.stun) this.stun(o, s.stun);
        if (s.slow && s.slow.duration != null) this.slow(o, s.slow.amount, s.slow.duration);
        if (s.knockback) this.knockback(o, z.x, z.y, s.knockback);
      }
    }
    if (s.spawn) this.spawnAround(s.spawn.unit, s.spawn.count, z.owner, z.x, z.y, 0.3);
    this.events.push(['sp', z.typeIdx, r2(z.x), r2(z.y), s.radius || 0, z.owner, z.fx || '', z.evo ? 1 : 0]);
  }

  spellPulse(z) {
    const s = z.s;
    const tg = s.targets || 'both';
    for (const o of this.entities) {
      if (o.dead || !this.inZone(z, o)) continue;
      if (s.damage && o.owner !== z.owner && affects(tg, o)) {
        const f = o.kind === 'tower' ? s.towerDamage ?? 1 : 1;
        if (f > 0) this.damage(o, s.damage * f, null, z.owner);
      }
      if (s.heal && o.owner === z.owner) this.heal(o, s.heal);
    }
  }

  updateGraveyard(z) {
    const g = z.s.graveyard;
    const interval = (z.s.duration - g.firstDelay) / g.count;
    while (z.graveSpawned < g.count && z.activeT + 1e-9 >= g.firstDelay + z.graveSpawned * interval) {
      z.graveSpawned++;
      for (let tries = 0; tries < 6; tries++) {
        const a = this.rng() * TAU;
        const r = Math.sqrt(this.rng()) * z.s.radius;
        const x = clamp(z.x + Math.cos(a) * r, 0.5, ARENA_W - 0.5);
        const y = clamp(z.y + Math.sin(a) * r, 0.5, ARENA_H - 0.5);
        if (this.nav.cells[this.nav.index(x, y)] !== 0) continue;
        this.spawnAround(g.unit, 1, z.owner, x, y, 0.5);
        break;
      }
    }
  }

  updateRoll(z, dt) {
    const s = z.s;
    const r = s.roll;
    const step = r.speed * dt;
    z.y += z.dir * step;
    z.traveled += step;
    for (const o of this.entities) {
      if (o.dead || o.owner === z.owner || o.flying || z.hit.has(o.id)) continue;
      const half = isStruct(o) ? o.half : o.radius;
      if (Math.abs(o.x - z.x) <= r.width / 2 + half && Math.abs(o.y - z.y) <= 0.6 + half) {
        z.hit.add(o.id);
        this.damage(o, o.kind === 'tower' ? s.damage * (s.towerDamage ?? 1) : s.damage, null, z.owner);
        if (s.knockback) this.knockback(o, o.x, o.y - z.dir, s.knockback);
      }
    }
    if (z.traveled >= r.length || z.y < 0 || z.y > ARENA_H) z.done = true;
  }

  lightningStrikes(z) {
    const s = z.s;
    const cands = this.entities
      .filter((o) => !o.dead && o.owner !== z.owner && affects(s.targets || 'both', o) && this.inZone(z, o))
      .sort((a, b) => b.hp - a.hp)
      .slice(0, s.strikes);
    for (const o of cands) {
      this.damage(o, o.kind === 'tower' ? s.damage * (s.towerDamage ?? 1) : s.damage, null, z.owner);
      if (s.stun) this.stun(o, s.stun);
      this.events.push(['st', r2(o.x), r2(o.y)]);
    }
    if (!cands.length) this.events.push(['st', r2(z.x), r2(z.y)]);
  }

  chainLightning(z) {
    const s = z.s;
    const pick = (px, py, range, hit) => {
      let best = null;
      let bd = Infinity;
      for (const o of this.entities) {
        if (o.dead || o.owner === z.owner || hit.has(o.id) || !affects(s.targets || 'both', o)) continue;
        const d = surfaceDist(px, py, o);
        if (d <= range && d < bd) {
          bd = d;
          best = o;
        }
      }
      return best;
    };
    const hit = new Set();
    const pts = [];
    let cur = pick(z.x, z.y, s.radius, hit);
    while (cur && hit.size < s.chain.count) {
      hit.add(cur.id);
      pts.push(r2(cur.x), r2(cur.y));
      this.damage(cur, cur.kind === 'tower' ? s.damage * (s.towerDamage ?? 1) : s.damage, null, z.owner);
      if (s.stun) this.stun(cur, s.stun);
      cur = pick(cur.x, cur.y, s.chain.radius, hit);
    }
    this.events.push(['ch', z.owner, r2(z.x), r2(z.y), pts]);
  }

  // ───────────────────────────── Kollision & Tod ─────────────────────────────

  resolveCollisions() {
    const ground = [];
    const air = [];
    const structs = [];
    for (const e of this.entities) {
      if (e.dead) continue;
      if (e.kind !== 'unit') structs.push(e);
      else if (!e.dash) (e.flying ? air : ground).push(e);
    }
    separate(ground);
    separate(air);
    for (const u of ground) {
      for (const s of structs) pushOutOfRect(u, s);
      if (u.def.traits.riverJump) {
        u.jumping = blockedByRiver(u.x, u.y);
      } else if (blockedByRiver(u.x, u.y)) {
        const cands = [
          [u.x, RIVER_Y0 - 0.02],
          [u.x, RIVER_Y1 + 0.02],
        ];
        for (const b of BRIDGES) cands.push([b.x0 + 0.02, u.y], [b.x1 - 0.02, u.y]);
        let best = cands[0];
        let bd = Infinity;
        for (const c of cands) {
          const d = Math.hypot(c[0] - u.x, c[1] - u.y);
          if (d < bd) {
            bd = d;
            best = c;
          }
        }
        u.x = best[0];
        u.y = best[1];
      }
      u.x = clamp(u.x, u.radius, ARENA_W - u.radius);
      u.y = clamp(u.y, u.radius, ARENA_H - u.radius);
    }
    for (const u of air) {
      u.x = clamp(u.x, u.radius, ARENA_W - u.radius);
      u.y = clamp(u.y, u.radius, ARENA_H - u.radius);
    }
  }

  processDeaths() {
    let any = false;
    for (let i = 0; i < this.entities.length; i++) {
      const e = this.entities[i];
      if (!e.dead || e.removed) continue;
      e.removed = true;
      any = true;
      const tr = e.def.traits;
      if (tr.deathDamage) this.areaBlast(e.owner, e.x, e.y, tr.deathDamage, e);
      if (tr.deathSpawn) this.spawnAround(tr.deathSpawn.unit, tr.deathSpawn.count, e.owner, e.x, e.y, 0.3);
      if (tr.deathSpell) this.addZone(e.owner, tr.deathSpell, e.x, e.y, { evo: e.evo });
      if (e.kind !== 'unit') this.structDirty = true;
      if (e.kind === 'tower') this.onTowerDestroyed(e);
      if (e.def.class === 'champion') {
        const p = this.players[e.owner];
        if (p.championOut === e.cardId) {
          p.queue.push(p.championOut);
          p.championOut = null;
        }
      }
      this.events.push(['d', e.id, e.typeIdx, e.owner, r2(e.x), r2(e.y), e.flying ? 1 : 0]);
    }
    if (!any) return;
    const alive = [];
    for (const e of this.entities) {
      if (e.removed) this.byId.delete(e.id);
      else alive.push(e);
    }
    this.entities = alive;
  }

  onTowerDestroyed(t) {
    const opp = 1 - t.owner;
    this.events.push(['tw', t.id, t.owner, t.towerKey === 'king' ? 1 : 0, r2(t.x), r2(t.y)]);
    if (t.towerKey === 'king') {
      this.crowns[opp] = 3;
      for (const o of this.towers) {
        if (o.owner === t.owner && !o.dead) {
          o.dead = true;
          o.hp = 0;
        }
      }
      this.end(opp, 'king');
    } else {
      this.crowns[opp] = Math.min(3, this.crowns[opp] + 1);
      const king = this.kingOf(t.owner);
      if (king) this.activateKing(king);
    }
  }

  // ───────────────────────────── Snapshots ─────────────────────────────

  flagsOf(e) {
    let f = 0;
    if (e.deployT > 0) f |= EF.DEPLOY;
    if (e.locked && e.targetId) f |= EF.ATTACK;
    if (e.stunT > 0) f |= EF.STUN;
    if (e.slowT > 0) f |= EF.SLOW;
    if (e.rageT > 0) f |= EF.RAGE;
    if (e.evo) f |= EF.EVO;
    if (e.cloakT > 0) f |= EF.CLOAK;
    if (e.reflectT > 0) f |= EF.REFLECT;
    if (e.charging) f |= EF.CHARGE;
    if (e.active) f |= EF.ACTIVE;
    if (e.dash) f |= EF.DASH;
    if (e.jumping) f |= EF.JUMP;
    if (e.buffT > 0 || e.nextHitMult > 1) f |= EF.BUFF;
    return f;
  }

  /** Gemeinsamer Teil des Snapshots (einmal pro Tick berechnet). */
  snapshotCommon() {
    if (this._snapTick === this.tick && this._snap) return this._snap;
    const e = [];
    for (const en of this.entities) {
      if (en.removed) continue;
      e.push([
        en.id,
        en.typeIdx,
        en.owner,
        r2(en.x),
        r2(en.y),
        Math.ceil(en.hp),
        en.maxHp,
        this.flagsOf(en),
        Math.ceil(en.shield),
        en.targetId,
        en.fx,
        en.def.traits.ramp ? en.rampStage : 0,
      ]);
    }
    const p = this.projectiles.map((pr) => [pr.id, pr.kind, r2(pr.x), r2(pr.y), pr.owner, r2(pr.sx), r2(pr.sy), r2(pr.tx), r2(pr.ty)]);
    const z = this.zones.map((zz) => {
      const prog = zz.s.roll
        ? zz.traveled / zz.s.roll.length
        : zz.impacted
          ? zz.s.duration > 0
            ? Math.min(1, zz.activeT / zz.s.duration)
            : 1
          : zz.delay > 0
            ? Math.min(1, zz.t / zz.delay)
            : 1;
      return [zz.id, zz.typeIdx, r2(zz.x), r2(zz.y), zz.s.radius || 0, zz.impacted ? 1 : 0, r2(prog), zz.owner, zz.fx || '', r2(zz.fromX), r2(zz.fromY), zz.evo ? 1 : 0];
    });
    this._snap = {
      k: this.tick,
      t: r2(this.time),
      tl: r1(this.timeLeft()),
      ph: this.phase === 'overtime' ? 'o' : 'r',
      em: this.elixirMultiplier(),
      cr: this.crowns.slice(),
      e,
      p,
      z,
      ev: this.events,
    };
    this._snapTick = this.tick;
    return this._snap;
  }

  meState(side) {
    const p = this.players[side];
    const evoInfo = (id) => (id && p.evoCards.has(id) ? [p.evoCharge[id], this.db.card(id).evo.cycles] : 0);
    const ab = this.abilityEntity(side);
    const next = p.queue[0] ?? null;
    return {
      el: Math.floor(p.elixir * 100) / 100,
      h: p.hand.slice(),
      n: next,
      hr: p.handReady.map((t) => Math.max(0, r2(t - this.time))),
      ev: p.hand.map(evoInfo),
      nev: evoInfo(next),
      ab: ab
        ? {
            id: ab.id,
            card: ab.def.cardId,
            cls: ab.def.class,
            cost: ab.def.ability.cost || 0,
            cd: r1(Math.max(0, ab.abilityCd)),
            max: ab.def.ability.cooldown || 0,
            dep: ab.deployT > 0 ? 1 : 0,
          }
        : null,
      emo: r1(Math.max(0, p.emoteReadyAt - this.time)),
      co: p.championOut,
    };
  }

  snapshot(side) {
    return { type: 's', ...this.snapshotCommon(), me: this.meState(side) };
  }

  /** Nach dem Versand eines Ticks aufrufen. */
  flushEvents() {
    this.events = [];
    this._snap = null;
  }
}

function separate(list) {
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      const min = a.radius + b.radius;
      const dx = b.x - a.x;
      if (dx >= min || dx <= -min) continue;
      const dy = b.y - a.y;
      if (dy >= min || dy <= -min) continue;
      const d2 = dx * dx + dy * dy;
      if (d2 >= min * min) continue;
      let d = Math.sqrt(d2);
      let nx;
      let ny;
      if (d < 1e-4) {
        const ang = (((a.id * 7 + b.id * 13) % 360) * Math.PI) / 180;
        nx = Math.cos(ang);
        ny = Math.sin(ang);
        d = 0;
      } else {
        nx = dx / d;
        ny = dy / d;
      }
      const overlap = (min - d) * 0.5;
      const ma = a.deployT > 0 ? a.mass * 3 : a.mass;
      const mb = b.deployT > 0 ? b.mass * 3 : b.mass;
      const wa = mb / (ma + mb);
      const wb = ma / (ma + mb);
      a.x -= nx * overlap * wa;
      a.y -= ny * overlap * wa;
      b.x += nx * overlap * wb;
      b.y += ny * overlap * wb;
    }
  }
}

function pushOutOfRect(u, s) {
  const h = s.half;
  const r = u.radius;
  const dx = u.x - s.x;
  const dy = u.y - s.y;
  const ox = h + r - Math.abs(dx);
  const oy = h + r - Math.abs(dy);
  if (ox <= 0 || oy <= 0) return;
  const cx = clamp(u.x, s.x - h, s.x + h);
  const cy = clamp(u.y, s.y - h, s.y + h);
  const ddx = u.x - cx;
  const ddy = u.y - cy;
  const d2 = ddx * ddx + ddy * ddy;
  if (d2 > 1e-12) {
    if (d2 >= r * r) return;
    const d = Math.sqrt(d2);
    u.x = cx + (ddx / d) * r;
    u.y = cy + (ddy / d) * r;
    return;
  }
  if (ox < oy) u.x += (dx >= 0 ? 1 : -1) * ox;
  else u.y += (dy >= 0 ? 1 : -1) * oy;
}

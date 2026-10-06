// Autoritative Match-Simulation. Läuft ausschließlich auf dem Server mit festem Tick.
// Clients schicken nur Eingaben; alle Regeln (Elixier, Platzierung, Cooldowns) werden hier geprüft.
//
// Aufbau: Dieser Kern (Aufbau, Tick, Eingaben, Snapshots) wird um wiederverwendbare Bausteine ergänzt:
//   combat.js     – Zielwahl, Angriffe, Geschosse, Schaden, Statuseffekte
//   motion.js     – Bewegung, Ansturm, Sprint, Sprung, Haken, Rückstoß, Kollision
//   spells.js     – Zauberzonen (Fläche, Puls, Rollen, Beschwörung, Spezialzauber)
//   traits.js     – laufende Eigenschaften (Spawner, Auren, Tarnung …) und Tod/Verwandlung
//   abilities.js  – Champion- und Heldenfähigkeiten
import { ARENA_W, ARENA_H, TOWER_SLOTS, forwardDir, isPlacementValid } from '../../shared/arena.js';
import { EVO_SLOTS } from '../../shared/cards.js';
import { REJECTS, EF, EMOTES } from '../../shared/protocol.js';
import { NavGrid } from './nav.js';
import { mulberry32, shuffle } from './rng.js';
import { r1, r2, clamp, formation, surfaceDist } from './geom.js';
import { Combat } from './combat.js';
import { Motion } from './motion.js';
import { Spells } from './spells.js';
import { Traits } from './traits.js';
import { Abilities } from './abilities.js';

export { surfaceDist, formation };

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
    this.nextGroup = 1;
    this.entities = [];
    this.byId = new Map();
    this.projectiles = [];
    this.lines = [];
    this.zones = [];
    this.timers = [];
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
    const handSize = this.rules.hand?.size ?? 4;
    // „Nie in der Starthand“ (Spiegel, Elixiersammler): nach hinten tauschen
    for (let i = 0; i < Math.min(handSize, order.length); i++) {
      if (!this.db.card(order[i])?.notInStartingHand) continue;
      const j = order.findIndex((id, k) => k >= handSize && !this.db.card(id)?.notInStartingHand);
      if (j > 0) [order[i], order[j]] = [order[j], order[i]];
    }
    const evoCards = new Set();
    const evoCharge = {};
    for (const i of EVO_SLOTS) {
      const c = this.db.card(slots[i]);
      if (c && c.evo) {
        evoCards.add(c.id);
        evoCharge[c.id] = this.rules.evo?.startCharged ? c.evo.cycles : 0;
      }
    }
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
      lastPlayed: null,
      lastCost: 0,
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
    const clone = !!opts.clone;
    const shield = tr.shield ? (clone ? 1 : tr.shield) : 0;
    const e = {
      id: this.nextId++,
      def,
      owner,
      kind,
      typeIdx: this.db.typeIndex.get(def.key) ?? -1,
      cardId: opts.cardId || def.cardId || null,
      groupId: opts.groupId || 0,
      x,
      y,
      hp: clone ? 1 : def.hp,
      maxHp: clone ? 1 : def.hp,
      shield,
      maxShield: shield,
      flying: !!def.flying,
      radius: def.radius,
      half: kind === 'unit' ? def.radius : def.size / 2,
      mass: def.mass,
      evo: !!opts.evo,
      clone,
      deployT: opts.deployTime ?? def.deployTime ?? 1,
      // Kampf
      targetId: 0,
      locked: false,
      cd: 0,
      attacks: 0,
      lastAttackT: -99,
      rampT: 0,
      rampTargetId: 0,
      rampStage: 0,
      rampKeepT: 0,
      stage: 0,
      stageShots: 0,
      stillT: 0,
      secCd: tr.secondary ? tr.secondary.firstHit ?? 0.5 : 0,
      secTargetId: 0,
      sniperAmmo: tr.sniper ? tr.sniper.ammo : 0,
      // Status
      stunT: 0,
      frozen: false,
      slowT: 0,
      slowAmt: 0,
      rageT: 0,
      rageMult: 1,
      cloakT: 0,
      invulnT: 0,
      rootT: 0,
      grounded: false,
      curse: null,
      tauntId: 0,
      tauntT: 0,
      buffs: [],
      enchant: null,
      revealT: tr.stealth ? 99 : 0,
      hidden: false,
      underT: 0,
      // Bewegung
      charging: false,
      chargeDist: 0,
      dash: null,
      leap: null,
      hook: null,
      thrown: null,
      movedTick: -10,
      jumping: false,
      path: null,
      pathTargetId: 0,
      pathT: -10,
      pathVer: -1,
      fx: owner === 0 ? 1 : -1,
      // Eigenschaften
      spawnT: tr.spawner ? tr.spawner.firstDelay ?? tr.spawner.interval : 0,
      genT: tr.elixirGen ? tr.elixirGen.interval : 0,
      spawnedCount: 0,
      souls: 0,
      pancakeT: 0,
      triggered: {},
      // Fähigkeiten (Champions/Helden)
      ability: opts.ability !== undefined ? opts.ability : def.ability || null,
      cls: opts.cls || def.class || 'normal',
      abilityCard: opts.abilityCard || def.cardId || null,
      abilityUses: 0,
      abilityCd: 0,
      cast: null,
      championOf: opts.championOf || null,
      levelBonus: opts.levelBonus || 0,
      dead: false,
      removed: false,
      expired: false,
      selfDestruct: false,
      lastHitBy: 0,
    };
    if (e.ability) e.abilityUses = e.ability.uses || 1;
    if (kind === 'unit' && tr.hidden) e.underT = 0;
    if (kind !== 'unit' && tr.hidden) e.hidden = true;
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

  /** Verzögerte Aktion (z. B. Kettenblitz-Sprünge, gestaffelte Spawns). */
  later(delay, fn) {
    this.timers.push({ at: this.time + delay, fn });
  }

  updateTimers() {
    if (!this.timers.length) return;
    const due = [];
    const keep = [];
    for (const t of this.timers) (t.at <= this.time + 1e-9 ? due : keep).push(t);
    this.timers = keep;
    for (const t of due) t.fn();
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

  addElixir(side, amount, x, y) {
    const p = this.players[side];
    if (!p) return;
    p.elixir = Math.min(this.rules.elixir.max, p.elixir + amount);
    this.events.push(['el', side, r2(x), r2(y), amount]);
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
    this.updateTimers();
    this.updateZones(dt);
    for (let i = 0; i < this.entities.length; i++) {
      const e = this.entities[i];
      if (!e.dead) this.updateEntity(e, dt);
    }
    this.updateProjectiles(dt);
    this.updateLines(dt);
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

  /** Welche Form einer Karte gespielt wird (Spirit Empress) – abhängig vom Elixier. */
  formOf(card, elixir) {
    if (!card.forms) return null;
    return card.forms.find((f) => elixir + 1e-9 >= (f.minElixir ?? 0)) || card.forms[card.forms.length - 1];
  }

  /** Aktuelle Kosten einer Handkarte (Spiegel = letzte Karte + 1, Spirit Empress je nach Elixier). */
  costOf(side, card) {
    const p = this.players[side];
    if (card.elixirRule === 'mirror') return p.lastPlayed ? Math.min(10, p.lastCost + 1) : null;
    const f = this.formOf(card, p.elixir);
    return f ? f.elixir : card.elixir;
  }

  /** Karte, deren Regeln beim Platzieren gelten (Spiegel → zuletzt gespielte Karte). */
  effectiveCard(side, card) {
    if (card.elixirRule === 'mirror') return this.db.card(this.players[side].lastPlayed);
    return card;
  }

  canPlace(side, card, x, y) {
    card = this.effectiveCard(side, card);
    if (!card) return false;
    let kind = 'troop';
    let half = 0;
    let anywhere = false;
    if (card.type === 'spell') kind = card.spell?.ownSide ? 'troop' : 'spell';
    else {
      const def = this.db.unit(this.db.unitRefOf(card));
      if (card.type === 'building') {
        kind = 'building';
        half = def.size / 2;
      }
      anywhere = !!def.traits.deployAnywhere;
    }
    const obstacles = kind === 'spell' ? [] : this.structures().map((s) => ({ x: s.x, y: s.y, half: s.half }));
    const enemyPrincessDown = [0, 1].map(
      (lane) => !this.towers.some((t) => t.owner !== side && t.towerKey === 'princess' && t.lane === lane && !t.dead),
    );
    if (anywhere && kind === 'building') {
      // Koboldbohrer: überall außer Fluss und Hindernissen
      return isPlacementValid({ side, x, y, kind: 'troop', anywhere: true, obstacles: obstacles.map((o) => ({ ...o, half: o.half + half })) });
    }
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
    const cost = this.costOf(side, card);
    if (cost == null) return fail('MIRROR_EMPTY');
    if (p.elixir + 1e-9 < cost) return fail('ELIXIR');
    x = Number(x);
    y = Number(y);
    if (!this.canPlace(side, card, x, y)) return fail('PLACEMENT');
    const eff = this.effectiveCard(side, card);
    if (eff.type !== 'spell' && this.entities.length + this.countOf(eff) > this.maxEntities) return fail('LIMIT');
    const form = this.formOf(eff, p.elixir);

    // Bezahlen
    p.elixir -= cost;
    this.stats[side].played++;
    this.stats[side].spent += cost;

    // Evo-Ladung (der Spiegel kopiert keine Evolution)
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

    // Spiegel: letzte Karte eine Stufe stärker
    const levelBonus = card.elixirRule === 'mirror' ? 1 : 0;
    if (card.elixirRule !== 'mirror') {
      p.lastPlayed = cardId;
      p.lastCost = cost;
    }

    if (eff.type === 'spell') this.castSpell(side, eff, x, y, evo, levelBonus);
    else this.spawnCard(side, eff, x, y, evo, levelBonus, form);

    this.events.push(['pl', side, this.db.typeIndex.get(cardId), r2(x), r2(y), evo ? 1 : 0]);
    return { ok: true, evo };
  }

  countOf(card) {
    return this.db.groupsOf(card).reduce((s, g) => s + (g.count || 1), 0);
  }

  /** Einheiten einer Truppen-/Gebäudekarte erzeugen (inkl. gemischter Gruppen und Evo-Zusätze). */
  spawnCard(side, card, x, y, evo, levelBonus = 0, form = null) {
    const groups = form ? [{ unit: form.unit, count: 1 }] : this.db.groupsOf(card, evo);
    const fwd = forwardDir(side);
    const flip = side === 0 ? 1 : -1;
    const groupId = this.nextGroup++;
    const out = [];
    const isChampion = card.class === 'champion';
    for (const g of groups) {
      const own = g.unit === card.id || g.unit === this.db.unitRefOf(card) || !!form;
      const ref = own && !form ? card.id : g.unit;
      let def = this.db.unit(ref, evo && own, levelBonus);
      const offs = formation(g.count || 1, def.radius, card.formation);
      const by = y - fwd * (g.behind || 0);
      for (const [ox, oy] of offs) {
        if (this.entities.length >= this.maxEntities) break;
        const px = clamp(x + ox * flip, def.radius, ARENA_W - def.radius);
        const py = clamp(by + oy * flip, def.radius, ARENA_H - def.radius);
        const e = this.addEntity(def, side, px, py, {
          deployTime: def.deployTime,
          evo: def.evo,
          cardId: card.id,
          groupId,
          levelBonus,
          championOf: isChampion ? card.id : null,
          // Fähigkeit nur an der Einheit der Karte selbst (nicht am Goblinstein-Monster)
          ability: own ? def.ability : null,
        });
        out.push(e);
      }
    }
    // Helden-Kobolde: Fähigkeit gehört zur ganzen Gruppe (der letzte Kobold lässt das Banner fallen)
    if (card.class === 'hero') for (const e of out) e.heroGroup = groupId;
    return out;
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
    this.updateStatus(e, dt);
    if (e.cast) this.updateCast(e, dt);
    if (e.deployT > 0) {
      e.deployT -= dt;
      if (e.deployT <= 0) this.onDeployed(e);
      return;
    }
    // Gebäude (und Einheiten mit Lebensdauer) verlieren über ihre Lebensdauer Leben
    if (e.def.lifetime > 0 && e.kind !== 'tower') {
      e.hp -= (e.maxHp / e.def.lifetime) * dt;
      if (e.hp <= 0) {
        e.hp = 0;
        e.dead = true;
        e.expired = true;
        return;
      }
    }
    if (e.thrown) {
      this.updateThrown(e, dt);
      return;
    }
    if (e.dash) {
      this.updateDash(e, dt);
      return;
    }
    if (e.leap) {
      this.updateLeap(e, dt);
      return;
    }
    if (e.hook) {
      this.updateHook(e, dt);
      return;
    }
    this.updateAbilityEffects(e, dt);
    if (e.stunT > 0 || e.rootT > 0 || e.underT > 0) {
      if (e.underT > 0) this.updateUnderground(e, dt);
      if (e.rootT > 0 && e.stunT <= 0) this.updateTraits(e, dt, true);
      return;
    }
    e.cd = Math.max(0, e.cd - dt * this.attackRate(e));
    this.updateTraits(e, dt);
    if (e.dead) return;
    if (e.kind === 'tower' && !e.active) return;
    if (e.def.traits.secondary) this.updateSecondary(e, dt);
    if (e.def.traits.sniper && e.sniperAmmo > 0) this.updateSniper(e, dt);
    if (!(e.def.damage > 0) && !e.def.traits.ramp && !this.hasAttackOverride(e)) {
      // reine Läufer/Spawner (z. B. Skelettfass, Busch): trotzdem zum Ziel bewegen
      if (e.kind === 'unit' && (e.def.speed > 0 || e.buffs.length)) this.updateCombat(e, dt);
      return;
    }
    this.updateCombat(e, dt);
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
    if (e.cloakT > 0 || e.hidden) f |= EF.CLOAK;
    if (this.hasBuff(e, 'reflect')) f |= EF.REFLECT;
    if (e.charging) f |= EF.CHARGE;
    if (e.active) f |= EF.ACTIVE;
    if (e.dash || e.leap) f |= EF.DASH;
    if (e.jumping || e.thrown) f |= EF.JUMP;
    if (e.buffs.length) f |= EF.BUFF;
    if (e.underT > 0) f |= EF.UNDER;
    if (e.curse) f |= EF.CURSE;
    if (e.frozen && e.stunT > 0) f |= EF.FREEZE;
    if (e.rootT > 0) f |= EF.ROOT;
    if (e.enchant) f |= EF.ENCHANT;
    if (e.def.traits.untargetable) f |= EF.GHOST;
    if (e.clone) f |= EF.CLONE;
    if (e.flying) f |= EF.FLY;
    return f;
  }

  /** Zusatzwert je Entität (Strahlstufe, Seelen, Pfannkuchen, Munition …). */
  auxOf(e) {
    const t = e.def.traits;
    if (t.ramp) return e.rampStage;
    if (t.souls) return e.souls;
    if (e.ability?.pancakes) return Math.min(e.ability.pancakes.bars, Math.floor(e.pancakeT / e.ability.pancakes.fillTime));
    if (t.sniper) return e.sniperAmmo;
    if (t.attackRamp) return e.stage;
    return 0;
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
        this.auxOf(en),
      ]);
    }
    const p = this.projectiles.map((pr) => [pr.id, pr.kind, r2(pr.x), r2(pr.y), pr.owner, r2(pr.sx), r2(pr.sy), r2(pr.tx), r2(pr.ty)]);
    for (const l of this.lines) if (l.kind) p.push([l.id, l.kind, r2(l.x), r2(l.y), l.owner, r2(l.sx), r2(l.sy), r2(l.x + l.dx), r2(l.y + l.dy)]);
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
      return [zz.id, zz.typeIdx, r2(zz.x), r2(zz.y), zz.r ?? zz.s.radius ?? 0, zz.impacted ? 1 : 0, r2(prog), zz.owner, zz.fx || '', r2(zz.fromX), r2(zz.fromY), zz.evo ? 1 : 0];
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
      hc: p.hand.map((id) => {
        const c = this.db.card(id);
        return c && (c.elixirRule || c.forms) ? this.costOf(side, c) : null;
      }),
      n: next,
      hr: p.handReady.map((t) => Math.max(0, r2(t - this.time))),
      ev: p.hand.map(evoInfo),
      nev: evoInfo(next),
      ab: ab
        ? {
            id: ab.id,
            card: ab.abilityCard,
            cls: ab.cls,
            cost: ab.ability.cost || 0,
            cd: r1(Math.max(0, ab.abilityCd)),
            max: ab.ability.cooldown || 0,
            dep: ab.deployT > 0 || ab.cast ? 1 : 0,
            u: ab.abilityUses,
          }
        : null,
      emo: r1(Math.max(0, p.emoteReadyAt - this.time)),
      co: p.championOut,
      lp: p.lastPlayed,
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

Object.assign(Match.prototype, Combat, Motion, Spells, Traits, Abilities);

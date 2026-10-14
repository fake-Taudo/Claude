// Chaos-Perks in der Simulation. Ein Perk gehört genau einer Karte eines Spielers und gilt ab der Wahl bis zum
// Ende des Kampfs (für jedes weitere Ausspielen dieser Karte). Die Wirkung wird nie auf die gemeinsamen
// Kartenwerte (db) gelegt, sondern auf Matchkopien (structuredClone) je Spieler und Karte.
//
// Bausteine (data/chaos_perks.json → effectParameters):
//   statBoost       mult / add / set auf Einheitenwerte, spell.mult / spell.set auf Zauberwerte, ability.set
//   behaviorChange  set (targets, flying, projectile …), vorhandene traits (Sprint, Sprung, Durchschuss …),
//                   replaceAttack (Zauber statt Angriff), Strahl, Flammenkegel, mehrere Strahlen, Laufen beim Angriff
//   newAbility      Haken onSpawn / onAttack / onHit / onDeath / onPeriodicTick / onKill / onTransform
//   spawnChange     count, groups/replaceGroups/groupTraits, replaceUnit, randomGroups, deliverAs, Tod-/Treffer-Spawns,
//                   Zauber-Spawns (spell.spawn, spell.spawnAtEnd)
//
// Laufzeit: Einheiten aus einer Perk-Kopie tragen e.px (Konfiguration des Perks) und e.ps (eigener Zustand).
// Alle Haken in combat/motion/spells/traits sind an e.px, s.px oder this.perkOn gebunden – ohne Perks laufen
// genau die bisherigen Codepfade (klassischer Kampf bitgenau unverändert).
import { ARENA_W, ARENA_H, forwardDir } from '../../shared/arena.js';
import { PERK_TIER_CODE } from '../../shared/chaos.js';
import { TAU, r2, clamp, formation, surfaceDist, rangeDist, affects } from './geom.js';

/** Pfad-Zugriff mit Punkten („roll.length“, „dash.count“). */
function getPath(o, path) {
  return path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
}
function setPath(o, path, v) {
  const ks = path.split('.');
  let cur = o;
  for (let i = 0; i < ks.length - 1; i++) {
    if (cur[ks[i]] == null || typeof cur[ks[i]] !== 'object') cur[ks[i]] = {};
    cur = cur[ks[i]];
  }
  cur[ks[ks.length - 1]] = v;
}
function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function merge(a, b) {
  const out = { ...(a || {}) };
  for (const [k, v] of Object.entries(b || {})) out[k] = isObj(v) && isObj(out[k]) ? merge(out[k], v) : structuredClone(v);
  return out;
}

/** Trait-Namen, die keine vorhandenen Simulations-Eigenschaften sind, sondern Perk-Laufzeitverhalten (→ px). */
const RUNTIME_TRAITS = new Set([
  'launchOnHit',
  'leapOnly',
  'lastStand',
  'cloneOnDash',
  'pullOnAttack',
  'attackWhileMoving',
  'rechargeAfterHit',
  'permanentCharge',
  'shoveOnPath',
  'ccImmune',
  'bombOnImpact',
  'spawnOnKill',
  'beam',
  'periodicStun',
  'castOnHit',
  'blastOnTransform',
  'flameCone',
  'burn',
  'multiBeam',
  'shareDamage',
  'spawnOnHit',
  'pulse',
  'weakenOnHit',
  'deathSpawnGroups',
  'impactBlast',
  'alsoOnExpire',
]);

export const Perks = {
  // ───────────────────────────── Zuweisung ─────────────────────────────

  /** Perk für die Karte eines Spielers festlegen (nur Karten des eigenen Decks, höchstens ein Perk je Karte). */
  assignPerk(pl, perk) {
    const p = this.players[pl];
    if (!perk || !p || !p.deck.includes(perk.cardId) || this.perks[pl][perk.cardId]) return false;
    this.perks[pl][perk.cardId] = perk;
    this.perkOn = true;
    this.events.push(['pk', pl, this.db.typeIndex.get(perk.cardId) ?? -1, PERK_TIER_CODE[perk.rarityTier] || 0]);
    return true;
  },

  perkOf(pl, cardId) {
    return (cardId && this.perks[pl]?.[cardId]) || null;
  },

  /** Snapshot-Zusatz „pe“: flach [id, Stufe, Größe×10, …] für Einheiten mit Perk (Abzeichen, Glow, Größe). */
  perkMarks() {
    const out = [];
    for (const e of this.entities) if (!e.removed && e.perkTier) out.push(e.id, e.perkTier, Math.round((e.px?.scale || 1) * 10));
    return out;
  },

  // ───────────────────────────── Matchkopien ─────────────────────────────

  /**
   * Einheitenwerte mit Perk (Kopie, gecacht je Spieler/Karte/Einheit). part = 'own' (die Einheit der Karte) oder
   * die ID einer Gruppen-Einheit (groupTraits). Ohne passende Änderung: die gemeinsame Basis (kein Klon).
   */
  perkDef(pl, perk, ref, evo, levelBonus, part = 'own') {
    const key = `${pl}|${perk.id}|${ref}|${evo ? 1 : 0}|${levelBonus}|${part}`;
    this.perkDefs = this.perkDefs || new Map();
    let d = this.perkDefs.get(key);
    if (!d) {
      d = this.buildPerkDef(this.db.unit(ref, evo, levelBonus), perk, part);
      this.perkDefs.set(key, d);
    }
    return d;
  },

  buildPerkDef(base, perk, part) {
    const ep = perk.effectParameters;
    const d = structuredClone(base);
    const px = { id: perk.id, tier: PERK_TIER_CODE[perk.rarityTier] || 1, scale: 1 };
    d.px = px;
    if (part !== 'own') {
      const gt = ep.groupTraits?.[part];
      if (gt) d.traits = merge(d.traits, gt);
      return d;
    }
    const unitMult = ep.unitMult || null;
    for (const [k, v] of Object.entries({ ...(ep.mult || {}), ...(unitMult || {}) })) this.perkMultField(d, k, v);
    for (const [k, v] of Object.entries(ep.add || {})) {
      if (k === 'shield') d.traits.shield = (d.traits.shield || 0) + v;
      else d[k] = (d[k] || 0) + v;
    }
    for (const [k, v] of Object.entries(ep.set || {})) {
      if (k === 'targets' && v === 'towers') {
        d.targets = 'buildings';
        px.towersOnly = true;
      } else d[k] = structuredClone(v);
    }
    if (ep.unitScale) {
      d.radius *= ep.unitScale;
      px.scale = ep.unitScale;
    }
    if (ep.visualScale) px.scale = ep.visualScale;
    if (ep.ability && d.ability) {
      const ab = structuredClone(d.ability);
      for (const [k, v] of Object.entries(ep.ability.set || {})) setPath(ab, k, structuredClone(v));
      if (ep.ability.preferTowardTower) ab.preferTowardTower = true;
      if (ep.ability.dashUntilTower) ab.dashUntilTower = true;
      d.ability = ab;
    }
    if (ep.noAbility) d.ability = null;
    // Eigenschaften: vorhandene Bausteine zusammenführen, Laufzeitverhalten in px
    const tr = ep.traits || {};
    for (const [k, v] of Object.entries(tr)) {
      if (RUNTIME_TRAITS.has(k)) continue;
      if (k === 'deathSpawn' && (v.childTraits || v.scale || v.noAbility)) {
        px.deathSpawn = [v];
        delete d.traits.deathSpawn;
      } else if (k === 'deathSpell' && (v.freezeOnEnter || v.refreezeEvery)) {
        const { freezeOnEnter, refreezeEvery, ...zone } = v;
        d.traits.deathSpell = { ...zone, px: { id: perk.id, freeze: { duration: freezeOnEnter, every: refreezeEvery } } };
      } else if (k === 'stealth' && v.permanent) d.traits.stealth = { always: true, reveal: 0 };
      else if (k === 'pierce' && !d.traits.pierce) d.traits.pierce = structuredClone(v);
      else d.traits[k] = isObj(v) && isObj(d.traits[k]) ? merge(d.traits[k], v) : structuredClone(v);
    }
    if (tr.launchOnHit) px.launch = tr.launchOnHit;
    if (tr.leapOnly) px.leapOnly = tr.leapOnly;
    if (tr.lastStand) {
      px.lastStand = tr.lastStand;
      px.tick = true;
    }
    if (tr.cloneOnDash) px.cloneOnDash = tr.cloneOnDash;
    if (tr.pullOnAttack) px.pull = tr.pullOnAttack;
    if (tr.attackWhileMoving) px.moveAttack = true;
    if (tr.rechargeAfterHit) {
      px.recharge = tr.rechargeAfterHit;
      px.chargeHit = { knockback: tr.charge?.knockback || 0, stun: tr.charge?.stun || 0 };
    }
    if (tr.permanentCharge) {
      px.permCharge = true;
      px.tick = true;
    }
    if (tr.shoveOnPath) px.shove = tr.shoveOnPath;
    if (tr.ccImmune) px.cc = Object.fromEntries(tr.ccImmune.map((k) => [k, true]));
    if (tr.bombOnImpact) px.bomb = tr.bombOnImpact;
    if (tr.spawnOnKill) px.spawnOnKill = tr.spawnOnKill;
    if (tr.beam) {
      // Dauerstrahl: kurze Treffer im Takt tick auf bis zu `targets` Ziele (Betäubung nur periodisch)
      d.damage = tr.beam.dps * tr.beam.tick;
      d.hitSpeed = tr.beam.tick;
      d.firstHit = Math.min(d.firstHit, tr.beam.tick);
      d.projectile = { kind: 'beam', speed: 0 };
      d.traits.multiTarget = tr.beam.targets;
      delete d.traits.onHit;
    }
    if (tr.periodicStun) {
      px.beamStun = { ...tr.periodicStun, targets: tr.beam?.targets || 1 };
      px.tick = true;
    }
    if (tr.castOnHit) px.castOnHit = tr.castOnHit;
    if (tr.blastOnTransform) px.blastOnTransform = tr.blastOnTransform;
    if (tr.flameCone) {
      const f = tr.flameCone;
      px.attack = { kind: 'flame', ...f, burn: tr.burn || null };
      d.damage = f.dps * f.tick;
      d.hitSpeed = f.tick;
      d.firstHit = Math.min(d.firstHit, f.tick);
      d.range = Math.max(d.range, f.length * 0.8);
      d.projectile = null;
      d.splash = 0;
    }
    if (tr.multiBeam) px.attack = { kind: 'multiBeam', targets: tr.multiBeam.targets };
    if (tr.shareDamage) px.share = tr.shareDamage;
    if (tr.spawnOnHit) px.spawnOnHit = tr.spawnOnHit;
    if (tr.pulse) {
      px.pulse = tr.pulse;
      px.tick = true;
    }
    if (tr.weakenOnHit) px.weaken = tr.weakenOnHit;
    if (tr.deathSpawnGroups) px.deathSpawn = tr.deathSpawnGroups.map((g) => ({ ...g, noAbility: !!ep.noAbility }));
    if (tr.impactBlast) px.impactBlast = tr.impactBlast;
    if (ep.replaceAttack) px.attack = { kind: 'spell', spell: ep.replaceAttack.castSpell };
    if (ep.randomDeathSpawn) px.randomDeath = ep.randomDeathSpawn;
    if (tr.onHit?.fx && d.splash > 0) px.hitFx = tr.onHit.fx;
    // Königsriese (Episch): schießt aus großer Distanz, läuft aber weiter bis zur normalen Reichweite
    if (ep.set?.range && perk.cardId === 'royal-giant') px.walkRange = base.range;
    return d;
  },

  perkMultField(d, k, v) {
    if (k === 'hitSpeed') {
      d.hitSpeed *= v;
      d.firstHit = Math.min(d.firstHit, d.hitSpeed);
    } else if (k === 'radius') {
      d.radius *= v;
      if (d.isBuilding) d.size *= v;
    } else if (k === 'hp' || k === 'damage') d[k] = Math.round(d[k] * v);
    else if (typeof d[k] === 'number') d[k] *= v;
  },

  /** Zauberwerte mit Perk (Kopie, gecacht). */
  perkSpell(pl, perk, card, evo) {
    const key = `${pl}|${perk.id}|spell|${evo ? 1 : 0}`;
    this.perkDefs = this.perkDefs || new Map();
    let s = this.perkDefs.get(key);
    if (!s) {
      s = this.buildPerkSpell(this.db.spell(card, evo), perk);
      this.perkDefs.set(key, s);
    }
    return s;
  },

  buildPerkSpell(base, perk) {
    const sp = perk.effectParameters.spell || {};
    const s = structuredClone(base);
    for (const [k, v] of Object.entries(sp.mult || {})) {
      const cur = getPath(s, k);
      if (typeof cur === 'number') setPath(s, k, cur * v);
    }
    for (const [k, v] of Object.entries(sp.set || {})) setPath(s, k, structuredClone(v));
    const px = { id: perk.id, tier: PERK_TIER_CODE[perk.rarityTier] || 1 };
    if (sp.onHitTarget) px.onHitTarget = sp.onHitTarget;
    if (sp.after) px.after = sp.after;
    if (sp.before) px.before = sp.before;
    if (sp.repeat) px.repeat = sp.repeat;
    if (sp.onEnter) px.onEnter = sp.onEnter;
    if (sp.impact) {
      const { fx, ...hit } = sp.impact;
      Object.assign(s, hit);
      px.impactFx = fx || null;
    }
    if (sp.spawn) {
      // Zauber bringt andere Einheiten (ersetzt eine vorhandene Beschwörung)
      delete s.spawn;
      px.spawn = { ...sp.spawn, noAbility: !!perk.effectParameters.noAbility };
    }
    if (sp.spawnAtEnd) s.spawnAtEnd = structuredClone(sp.spawnAtEnd);
    s.px = px;
    return s;
  },

  // ───────────────────────────── Ausspielen ─────────────────────────────

  /** Gruppen einer Karte mit Perk (Anzahl, Ersatz, zusätzliche oder zufällige Einheiten). */
  perkGroups(card, evo, perk) {
    const ep = perk.effectParameters;
    let groups = this.db.groupsOf(card, evo);
    const ownRef = this.db.unitRefOf(card);
    if (ep.replaceGroups) groups = structuredClone(ep.groups);
    else if (ep.groups) groups = [...groups, ...structuredClone(ep.groups).map((g) => ({ ...g, extra: true }))];
    if (ep.replaceUnit) groups = [{ unit: ep.replaceUnit, count: ep.count ?? 1, replaced: true }];
    else if (ep.count) {
      const own = groups.find((g) => g.unit === ownRef || g.unit === card.id) || groups[0];
      own.count = ep.count;
    }
    return groups;
  },

  /** Truppen-/Gebäudekarte mit Perk erzeugen (Gegenstück zu spawnCard). */
  spawnPerkCard(side, card, x, y, evo, levelBonus, perk) {
    const ep = perk.effectParameters;
    const pl = this.ctxPl ?? this.plFor(side);
    const tier = PERK_TIER_CODE[perk.rarityTier] || 1;
    // Luftpost: die Einheit kommt nach einer Verzögerung vom Himmel (wie Königliche Luftpost)
    if (ep.deliverAs) {
      const dv = ep.deliverAs;
      const king = this.kingOf(side);
      this.addZone(
        side,
        { radius: dv.radius, delay: dv.delay, damage: dv.damage, towerDamage: dv.towerDamage, targets: dv.targets || 'both', fx: 'crate', px: { id: perk.id, tier, spawn: { unit: card.id, count: 1, deployTime: 0.25, mark: true } } },
        x,
        y,
        { typeIdx: this.db.typeIndex.get(dv.spell) ?? this.db.typeIndex.get(card.id), fromX: king ? king.x : x, fromY: king ? king.y : y, delay: dv.delay },
      );
      return [];
    }
    const fwd = forwardDir(side);
    const flip = side === 0 ? 1 : -1;
    const groupId = this.nextGroup++;
    const out = [];
    const isChampion = card.class === 'champion';
    const ownRef = this.db.unitRefOf(card);
    const forceEvo = !!ep.forceEvo;
    if (ep.randomGroups) return this.spawnRandomGroups(side, card, x, y, ep.randomGroups, groupId, tier);
    for (const g of this.perkGroups(card, evo, perk)) {
      const own = !g.extra && !g.replaced && (g.unit === card.id || g.unit === ownRef);
      const ref = own ? card.id : g.unit;
      const ev = own ? evo || forceEvo : false;
      let def;
      if (own) def = this.perkDef(pl, perk, ref, ev, levelBonus, 'own');
      else if (g.replaced && (ep.unitMult || ep.unitScale)) def = this.perkDef(pl, perk, ref, false, levelBonus, 'own');
      else if (ep.groupTraits?.[g.unit]) def = this.perkDef(pl, perk, ref, false, levelBonus, g.unit);
      else def = this.db.unit(ref, false, levelBonus);
      const offs = formation(g.count || 1, def.radius, ep.formation === 'side' ? 'line' : card.formation);
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
          championOf: isChampion && own ? card.id : null,
          ability: own ? def.ability : null,
        });
        if (!g.extra) e.perkTier = tier;
        out.push(e);
      }
    }
    if (card.class === 'hero') for (const e of out) e.heroGroup = groupId;
    return out;
  },

  /** Skelettarmee (Episch): zufällige Skelett-Einheiten nach Gewicht, schwere höchstens einmal. */
  spawnRandomGroups(side, card, x, y, rg, groupId, tier) {
    const picks = [];
    const used = {};
    for (let i = 0; i < rg.count; i++) {
      const cands = rg.pool.filter((p) => p.max == null || (used[p.unit] || 0) < p.max);
      const total = cands.reduce((s, p) => s + p.weight, 0);
      let r = this.rng() * total;
      let pick = cands[cands.length - 1];
      for (const p of cands) {
        if (r < p.weight) {
          pick = p;
          break;
        }
        r -= p.weight;
      }
      used[pick.unit] = (used[pick.unit] || 0) + 1;
      picks.push(pick);
    }
    const defs = picks.map((p) => this.db.unit(p.unit));
    const maxR = Math.max(...defs.map((d) => d.radius));
    const offs = formation(picks.length, maxR);
    const flip = side === 0 ? 1 : -1;
    const out = [];
    picks.forEach((p, i) => {
      if (this.entities.length >= this.maxEntities) return;
      const def = defs[i];
      const [ox, oy] = offs[i];
      const e = this.addEntity(def, side, clamp(x + ox * flip, def.radius, ARENA_W - def.radius), clamp(y + oy * flip, def.radius, ARENA_H - def.radius), {
        deployTime: def.deployTime,
        cardId: card.id,
        groupId,
        ability: p.noAbility ? null : undefined,
      });
      e.perkTier = tier;
      out.push(e);
    });
    return out;
  },

  /** Einheitenwerte, die beim Platzieren gelten (Perk „überall platzierbar“). */
  placeDef(pl, card) {
    const perk = this.perkOf(pl, card.id);
    return perk ? this.perkDef(pl, perk, card.id, false, 0, 'own') : this.db.unit(this.db.unitRefOf(card));
  },

  /** Zauber mit Perk wirken (Wiederholungen, Vorab-Zauber). */
  castPerkSpell(owner, card, x, y, evo, levelBonus, perk) {
    const s = this.perkSpell(this.ctxPl ?? this.plFor(owner), perk, card, evo);
    const px = s.px;
    if (px.before?.castSpell) {
      const pre = this.db.card(px.before.castSpell);
      if (pre) this.castSpellFrom(owner, pre, this.db.spell(pre), x, y, null, null, 0);
    }
    const rep = px.repeat;
    if (!rep) return this.castSpellFrom(owner, card, s, x, y, null, null, 0, evo);
    const fwd = forwardDir(owner);
    const n = rep.count || 1;
    let first = null;
    for (let k = 0; k < n; k++) {
      const off = rep.direction === 'forward' ? k * (rep.spacing || 0) : 0;
      const px2 = x;
      const py2 = clamp(y + fwd * off, 0.5, ARENA_H - 0.5);
      const delay = rep.offsets ? rep.offsets[k] : k * (rep.interval || 0);
      if (s.roll && delay > 0) this.later(delay, () => this.castSpellFrom(owner, card, s, px2, py2, null, null, 0, evo));
      else {
        const z = this.castSpellFrom(owner, card, s, px2, py2, null, null, delay, evo, !!rep.offsets);
        if (!first) first = z;
      }
    }
    return first;
  },

  /**
   * Zauberzone mit gegebenen Werten erzeugen (wie castSpell). fromX/fromY = Abwurfpunkt (Standard: eigener Burgturm),
   * extraDelay verschiebt den Einschlag; fixed = Verzögerung ersetzt die Flugzeit (Feuerbälle in den Tornado).
   */
  castSpellFrom(owner, card, s, x, y, fromX, fromY, extraDelay = 0, evo = false, fixed = false) {
    const king = this.kingOf(owner);
    const fx0 = fromX ?? (king ? king.x : x);
    const fy0 = fromY ?? (king ? king.y : y);
    let delay = s.delay || 0;
    if (s.travel && !fixed) delay += Math.hypot(x - fx0, y - fy0) / s.travel;
    if (fixed) delay = extraDelay;
    else delay += extraDelay;
    const typeIdx = this.db.typeIndex.get(card.id);
    return this.addZone(owner, s, x, y, { typeIdx, fromX: fx0, fromY: fy0, evo, delay });
  },

  // ───────────────────────────── Angriffe ─────────────────────────────

  /** Ersetzter Angriff (Zauber, Flammenkegel, mehrere Strahlen). true = erledigt. */
  perkAttack(e, t, P) {
    const a = e.px.attack;
    e.attacks++;
    e.lastAttackT = this.time;
    if (a.kind === 'spell') {
      const card = this.db.card(a.spell);
      if (!card) return false;
      this.castSpellFrom(e.owner, card, this.db.spell(card), t.x, t.y, e.x, e.y, 0);
      this.events.push(['a', e.id, t.id]);
      return true;
    }
    if (a.kind === 'flame') {
      this.flameCone(e, t, a);
      this.events.push(['a', e.id, t.id]);
      return true;
    }
    if (a.kind === 'multiBeam') {
      this.multiBeam(e, t, P, a);
      return true;
    }
    return false;
  },

  /** Megalakai (Selten): Flammenkegel auf alle Gegner vor ihm, mit Verlangsamung und Nachbrennen. */
  flameCone(e, t, f) {
    const dir = Math.atan2(t.y - e.y, t.x - e.x);
    const half = (f.angle * Math.PI) / 360;
    const dmg = e.def.damage * (e.dmgMult || 1);
    for (const o of this.entities) {
      if (o.dead || o.owner === e.owner || o.underT > 0 || !affects(f.targets || 'both', o)) continue;
      const dx = o.x - e.x;
      const dy = o.y - e.y;
      const dist = Math.hypot(dx, dy) - (o.kind === 'unit' ? o.radius : o.half);
      if (dist > f.length) continue;
      let da = Math.abs(Math.atan2(dy, dx) - dir);
      if (da > Math.PI) da = TAU - da;
      if (da > half && o !== t) continue;
      this.damage(o, o.kind === 'tower' ? dmg * (e.def.towerDamage ?? 1) : dmg, e, e.owner, { ranged: true });
      if (f.slow && o.kind === 'unit') this.slow(o, f.slow.amount, f.slow.duration);
      if (f.burn && o.kind !== 'tower') this.ignite(o, f.burn, e.owner);
    }
    this.events.push(['pv', 'flame', e.id, r2(t.x), r2(t.y)]);
  },

  /** Infernodrache/-turm (Selten): mehrere Strahlen, jeder mit eigener Stufe. */
  multiBeam(e, t, P, a) {
    const r = e.def.traits.ramp;
    const targets = [t];
    const others = this.entities
      .filter((o) => o !== t && this.canTarget(e, o) && rangeDist(e, o) <= P.range)
      .sort((x, y) => rangeDist(e, x) - rangeDist(e, y));
    targets.push(...others.slice(0, a.targets - 1));
    const beams = (e.ps.beams = e.ps.beams || new Map());
    const keep = new Map();
    for (const tt of targets) {
      const b = beams.get(tt.id) || { t0: this.time };
      keep.set(tt.id, b);
      const at = r.stageAt || r.stages.map((_, i) => i * r.stageTime);
      let st = 0;
      for (let i = 0; i < at.length; i++) if (this.time - b.t0 + 1e-9 >= at[i]) st = i;
      const dmg = r.stages[st] * (e.dmgMult || 1);
      const payload = { owner: e.owner, srcId: e.id, damage: dmg, splash: 0, sx: e.x, sy: e.y, targets: P.targets === 'buildings' ? 'ground' : P.targets, towerDamage: P.towerDamage, onHit: null, melee: false };
      this.applyAttack(payload, tt, tt.x, tt.y);
      this.events.push(['a', e.id, tt.id]);
    }
    e.ps.beams = keep;
  },

  /** Nach einem normalen Angriff: Sog, Ansturm-Rückzug, Zauber am Ziel, Ferkel. */
  perkAfterAttack(e, t, P, chargeHit) {
    const px = e.px;
    if (px.pull) {
      for (const o of this.entities) {
        if (o.dead || o.owner === e.owner || o.kind !== 'unit' || o.flying) continue;
        if (surfaceDist(e.x, e.y, o) <= px.pull.radius) this.pull(o, e.x, e.y, px.pull.distance);
      }
      this.events.push(['bl', r2(e.x), r2(e.y), px.pull.radius, e.owner, 'pull']);
    }
    if (px.recharge && chargeHit) {
      if (!t.dead && t.kind === 'unit' && px.chargeHit.knockback) this.knockback(t, e.x, e.y, px.chargeHit.knockback, true);
      if (!t.dead && px.chargeHit.stun) this.stun(t, px.chargeHit.stun);
    }
    if (px.recharge && !e.dead) {
      // zurückweichen und sofort wieder im Ansturm
      this.recoilSelf(e, t, px.recharge.backoff);
      e.locked = false;
      e.charging = true;
      e.chargeDist = e.def.traits.charge?.distance || 0;
      e.trampled = new Set();
    }
    if (px.castOnHit && !t.dead) {
      const card = this.db.card(px.castOnHit.spell);
      if (card) this.castSpellFrom(e.owner, card, this.db.spell(card), t.x, t.y, e.x, e.y, 0);
    }
    if (px.spawnOnHit && (!px.spawnOnHit.onlyVsBuildings || t.kind !== 'unit')) {
      const sp = px.spawnOnHit;
      const def = this.scaledDef(sp.unit, sp.scale, sp.name);
      const fwd = forwardDir(e.owner);
      this.spawnAround(sp.unit, sp.count || 1, e.owner, e.x, e.y - fwd * 0.6, 0.3, { def, cardId: e.cardId });
    }
  },

  /** Kopie einer Einheit mit skalierten Werten (Mini-Fledermäuse, Ferkel). */
  scaledDef(ref, scale, name) {
    const key = `scaled|${ref}|${JSON.stringify(scale)}|${name || ''}`;
    this.perkDefs = this.perkDefs || new Map();
    let d = this.perkDefs.get(key);
    if (!d) {
      d = structuredClone(this.db.unit(ref));
      for (const [k, v] of Object.entries(scale || {})) this.perkMultField(d, k, v);
      if (name) d.name = name;
      this.perkDefs.set(key, d);
    }
    return d;
  },

  /** Im Angriffsbereich: Megaritter springt statt zu schlagen; Königsriese läuft beim Schießen weiter. */
  perkInRange(e, t, P, d, dt) {
    const px = e.px;
    if (px.leapOnly && e.def.traits.leap && t.kind === 'unit' && !t.flying && e.cd <= 0) {
      const L = e.def.traits.leap;
      e.leap = { targetId: t.id, windup: Math.min(L.windup, 0.35), active: false, x0: e.x, y0: e.y, tx: t.x, ty: t.y, t: 0, dur: 0 };
      e.locked = false;
      this.events.push(['dw', e.id]);
      return true;
    }
    return false;
  },

  /** Nach dem Angriffsschritt im Bereich (Königsriese Episch: weiterlaufen bis zur normalen Reichweite). */
  perkWhileInRange(e, t, d, dt) {
    if (e.px.walkRange && d > e.px.walkRange) this.moveTowards(e, t, dt);
  },

  /** Beim Laufen: Walküre schlägt weiter, Prinz schiebt alles zur Seite. */
  perkMoving(e, t, P, dt) {
    const px = e.px;
    if (px.moveAttack && e.cd <= 0) {
      e.cd = P.hitSpeed;
      e.attacks++;
      e.lastAttackT = this.time;
      this.areaBlast(e.owner, e.x, e.y, { damage: P.damage, radius: P.splash || e.def.splash || 1, groundOnly: true, fx: 'spin' }, e);
    }
    if (px.shove) {
      const fwd = forwardDir(e.owner);
      const sh = (e.ps.shoved = e.ps.shoved || new Map());
      for (const o of this.entities) {
        if (o.dead || o.owner === e.owner || o.kind !== 'unit' || o.flying || o.underT > 0) continue;
        if (Math.hypot(o.x - e.x, o.y - e.y) > e.radius + o.radius + 0.25) continue;
        if (this.time < (sh.get(o.id) || 0)) continue;
        sh.set(o.id, this.time + 0.6);
        // zur Seite: senkrecht zur Laufrichtung, weg vom Prinzen
        const side = o.x >= e.x ? 1 : -1;
        this.knockback(o, o.x - side, o.y + fwd * 0.2, px.shove.distance, true);
        if (px.shove.damage) this.damage(o, px.shove.damage, e, e.owner);
        this.events.push(['pv', 'shove', o.id, r2(o.x), r2(o.y)]);
      }
    }
  },

  // ───────────────────────────── Schaden, Tod, Kontrolle ─────────────────────────────

  /** Megaritter (Episch): getroffene Bodentruppe wird aus der Arena geschleudert (ohne Todeseffekte). */
  perkLaunch(o, src) {
    if (o.kind !== 'unit' || o.flying || o.dead) return false;
    o.hp = 0;
    o.dead = true;
    o.silentDeath = true;
    o.lastHitBy = src.id;
    this.events.push(['pv', 'launch', o.id, r2(o.x), r2(o.y), src.owner]);
    return true;
  },

  /** Nach jedem Schaden einer Perk-Einheit: Schadensteilung, Schwächung. */
  perkOnDamage(o, dealt, src, opts) {
    const px = src.px;
    if (px.share && o.kind === 'unit' && !opts.shared && dealt > 0) {
      const amt = dealt * px.share.fraction;
      let n = 0;
      for (const x of this.entities) {
        if (x === o || x.dead || x.owner === src.owner || x.kind !== 'unit' || x.underT > 0) continue;
        this.damage(x, amt, src, src.owner, { shared: true, pure: true });
        n++;
      }
      if (n) this.events.push(['pv', 'share', src.id, r2(o.x), r2(o.y)]);
    }
    if (px.weaken && o.kind !== 'tower' && !o.dead) {
      const w = px.weaken;
      const prev = o.weakT || 0;
      const next = Math.min(w.max, prev + w.hpPerHit);
      if (next > prev + 1e-9) {
        o.weakBase = o.weakBase || { maxHp: o.maxHp, dmgMult: o.dmgMult || 1 };
        o.weakT = next;
        o.maxHp = Math.max(1, Math.round(o.weakBase.maxHp * (1 - next)));
        o.hp = Math.min(o.hp, o.maxHp);
        o.dmgMult = o.weakBase.dmgMult * (1 - Math.min(w.max, next * (w.damagePerHit / w.hpPerHit)));
      }
    }
  },

  /** Banditin (Selten): tödlicher Treffer → 1,5 s unverwundbar, letzter Sprint, dann fällt sie. */
  perkLastStand(o) {
    const ls = o.px.lastStand;
    if (o.ps.lastStand) return false;
    o.ps.lastStand = { until: this.time + ls.invulnerable };
    o.hp = 1;
    o.invulnT = Math.max(o.invulnT, ls.invulnerable);
    let best = null;
    let bd = Infinity;
    for (const t of this.entities) {
      if (t.dead || t.owner === o.owner || t.flying || this.isHidden(t)) continue;
      const d = Math.hypot(t.x - o.x, t.y - o.y);
      if (d <= ls.dash.max && d >= (ls.dash.min || 0) && d < bd) {
        bd = d;
        best = t;
      }
    }
    if (best) {
      o.dash = { mode: 'bandit', targetId: best.id, windup: 0.15, active: false, speed: o.def.traits.dash?.speed || 8.33, damage: ls.dash.damage };
      o.ps.lastStand.dashing = true;
    }
    this.events.push(['pv', 'laststand', o.id, r2(o.x), r2(o.y)]);
    return true;
  },

  /** Banditin (Episch): Klone für weitere Gegner in Sprintreichweite. */
  perkCloneDash(e, t) {
    const c = e.px.cloneOnDash;
    const dash = e.def.traits.dash;
    const cands = this.entities
      .filter((o) => o !== t && !o.dead && o.owner !== e.owner && !o.flying && !this.isHidden(o))
      .map((o) => [o, Math.hypot(o.x - e.x, o.y - e.y)])
      .filter(([, d]) => d >= dash.min && d <= dash.max)
      .sort((a, b) => a[1] - b[1])
      .slice(0, c.maxPerDash);
    const base = this.db.unit(e.def.key);
    for (const [o] of cands) {
      if (this.entities.length >= this.maxEntities) break;
      const k = this.addEntity(base, e.owner, e.x, e.y, { deployTime: 0, cardId: e.cardId, groupId: e.groupId, clone: true });
      k.perkTier = e.perkTier;
      k.dash = { mode: 'bandit', targetId: o.id, windup: dash.windup, active: false, speed: dash.speed, damage: dash.damage };
      this.events.push(['dw', k.id]);
    }
  },

  /** Musketierin (Episch): Sieg über eine gegnerische Truppe → weitere Musketierin. */
  perkOnKill(src, victim) {
    const s = src.px.spawnOnKill;
    if (!s || victim.kind !== 'unit') return;
    if ((src.ps.kills || 0) >= s.max) return;
    src.ps.kills = (src.ps.kills || 0) + 1;
    const side = src.ps.kills % 2 ? 1 : -1;
    this.spawnAround(s.unit, s.count || 1, src.owner, src.x + side * (src.radius * 2 + 0.2), src.y, 0.4, { cardId: src.cardId });
    this.events.push(['pv', 'spawn', src.id, r2(src.x), r2(src.y)]);
  },

  /** Tod einer Perk-Einheit: besondere Tod-Spawns, Drachen-Ei. */
  perkOnDeath(e) {
    const px = e.px;
    if (px.deathSpawn && !e.clone) {
      for (const ds of px.deathSpawn) {
        let def = null;
        if (ds.childTraits) def = this.childDef(ds.unit, ds.childTraits);
        else if (ds.scale) def = this.scaledDef(ds.unit, ds.scale);
        const fwd = forwardDir(e.owner);
        this.spawnAround(ds.unit, ds.count, e.owner, e.x, e.y - fwd * (ds.behind || 0), 0.3, { def: def || undefined, cardId: e.cardId, ability: ds.noAbility ? null : undefined });
      }
    }
    if (px.randomDeath && !e.clone) {
      const rd = px.randomDeath;
      const total = rd.pool.reduce((s, p) => s + p.weight, 0);
      let r = this.rng() * total;
      let pick = rd.pool[rd.pool.length - 1];
      for (const p of rd.pool) {
        if (r < p.weight) {
          pick = p;
          break;
        }
        r -= p.weight;
      }
      this.spawnAround(pick.unit, rd.count || 1, e.owner, e.x, e.y, 0.5, { evo: !!pick.evo });
      this.events.push(['bl', r2(e.x), r2(e.y), 0.8, e.owner, rd.fx || 'egg']);
    }
  },

  /** Kind-Einheit mit zusätzlichen Eigenschaften (Golemiten der 2. Generation, Schattenskelette). */
  childDef(ref, ct) {
    const key = `child|${ref}|${JSON.stringify(ct)}`;
    this.perkDefs = this.perkDefs || new Map();
    let d = this.perkDefs.get(key);
    if (!d) {
      d = structuredClone(this.db.unit(ref));
      for (const [k, v] of Object.entries(ct)) {
        if (k === 'lifetimeSeconds') d.lifetime = v;
        else if (k === 'stealth' && v.permanent) d.traits.stealth = { always: true, reveal: 0 };
        else d.traits[k] = structuredClone(v);
      }
      this.perkDefs.set(key, d);
    }
    return d;
  },

  /** Betäubung einer Perk-Einheit: Strahlen fallen zurück. */
  perkOnStun(o) {
    if (o.ps?.beams) o.ps.beams = new Map();
  },

  // ───────────────────────────── Laufend ─────────────────────────────

  /** Pro Tick (nur wenn Perks im Spiel sind): Nachbrennen und Perk-Einheiten mit laufender Wirkung. */
  updatePerks(dt) {
    for (const e of this.entities) {
      if (e.dead) continue;
      if (e.burn) this.updateBurn(e);
      if (!e.px?.tick || e.deployT > 0) continue;
      this.ctxPl = e.pl;
      const px = e.px;
      if (px.lastStand && e.ps.lastStand) {
        const ls = e.ps.lastStand;
        const dashing = e.dash && e.dash.mode === 'bandit';
        if ((ls.dashing && !dashing) || (!dashing && this.time >= ls.until) || this.time >= ls.until + 1.5) {
          e.invulnT = 0;
          e.dash = null;
          e.hp = 0;
          e.dead = true;
        }
      }
      if (px.permCharge && !e.dead) {
        e.charging = true;
        e.trampled = e.trampled || new Set();
      }
      if (px.beamStun && e.locked && e.targetId) {
        e.ps.stunT = (e.ps.stunT ?? 0) - dt;
        if (e.ps.stunT <= 0) {
          e.ps.stunT = px.beamStun.interval;
          const t = this.byId.get(e.targetId);
          if (t && !t.dead) {
            const range = this.attackParams(e).range;
            const list = [t, ...this.entities.filter((o) => o !== t && this.canTarget(e, o) && rangeDist(e, o) <= range).sort((a, b) => rangeDist(e, a) - rangeDist(e, b))].slice(0, px.beamStun.targets);
            for (const o of list) this.stun(o, px.beamStun.duration);
            this.events.push(['pv', 'zap', e.id, r2(t.x), r2(t.y)]);
          }
        }
      }
      if (px.pulse && (!px.pulse.whileMoving || e.movedTick === this.tick)) {
        e.ps.pulseT = (e.ps.pulseT ?? px.pulse.interval) - dt;
        if (e.ps.pulseT <= 0) {
          e.ps.pulseT = px.pulse.interval;
          for (const o of this.entities) {
            if (o.dead || o.owner === e.owner || o.kind !== 'unit' || o.flying || o.underT > 0) continue;
            if (surfaceDist(e.x, e.y, o) <= px.pulse.radius) this.damage(o, px.pulse.damage, e, e.owner, { death: true });
          }
          this.events.push(['bl', r2(e.x), r2(e.y), px.pulse.radius, e.owner, px.pulse.fx || 'bomb']);
        }
      }
    }
    this.ctxPl = null;
  },

  /** Nachbrennen (Flammenkegel, Feuerregen): Schaden alle 0,5 s, bis die Zeit abläuft. */
  ignite(o, b, owner) {
    if (!o || o.dead || o.kind === 'tower') return;
    const until = this.time + b.duration;
    if (o.burn && o.burn.until >= until && o.burn.dps >= b.dps) return;
    o.burn = { dps: Math.max(b.dps, o.burn?.until > this.time ? o.burn.dps : 0), until, owner, next: o.burn?.next ?? this.time + 0.5 };
  },

  updateBurn(o) {
    const b = o.burn;
    if (this.time + 1e-9 >= b.next) {
      b.next += 0.5;
      this.damage(o, b.dps * 0.5, null, b.owner, { spell: true });
    }
    if (this.time >= b.until) o.burn = null;
  },

  // ───────────────────────────── Zauber ─────────────────────────────

  /** Einschlag eines Perk-Zaubers: Nachwirkung, Raketen-Effekt, Beschwörung. */
  perkSpellImpact(z) {
    const px = z.s.px;
    if (px.impactFx) this.events.push(['bl', r2(z.x), r2(z.y), z.r, z.owner, px.impactFx]);
    if (px.spawn) {
      const sp = px.spawn;
      const out = this.spawnAround(sp.unit, sp.count || 1, z.owner, z.x, z.y, sp.deployTime ?? 0.3, { ability: sp.noAbility ? null : undefined });
      for (const e of out) {
        e.perkTier = px.tier;
        if (sp.mark) e.cardId = sp.unit;
      }
    }
    const a = px.after;
    if (a?.strike) {
      const st = a.strike;
      let best = null;
      for (const o of this.entities) {
        if (o.dead || o.owner === z.owner || o.kind !== 'unit' || o.underT > 0) continue;
        if (surfaceDist(z.x, z.y, o) > st.radius) continue;
        if (!best || o.hp > best.hp) best = o;
      }
      if (best) {
        const o = best;
        this.later(0.15, () => {
          if (o.dead) return;
          this.damage(o, st.damage, null, z.owner, { spell: true });
          if (st.stun) this.stun(o, st.stun);
          this.events.push(['st', r2(o.x), r2(o.y)]);
        });
      }
    }
    if (a?.zone) this.addZone(z.owner, { ...a.zone }, z.x, z.y, {});
    if (a?.shockwave) {
      const sw = a.shockwave;
      for (const o of this.entities) {
        if (o.dead || o.owner === z.owner || o.underT > 0) continue;
        const d = surfaceDist(z.x, z.y, o);
        if (d > sw.radius) continue;
        this.later(Math.max(0, d) / sw.speed, () => {
          if (o.dead) return;
          this.damage(o, o.kind === 'tower' ? sw.damage * (sw.towerDamage ?? 1) : sw.damage, null, z.owner, { spell: true });
          if (sw.knockback && o.kind === 'unit') this.knockback(o, z.x, z.y, sw.knockback);
        });
      }
      this.events.push(['bl', r2(z.x), r2(z.y), sw.radius, z.owner, 'shockwave']);
    }
  },

  /** Treffer eines Perk-Zaubers an einem Ziel (Knall-Schwächung, Brennen). */
  perkZoneOnHit(z, o) {
    const h = z.s.px.onHitTarget;
    if (h.currentHpLoss && !(h.excludeTowers && o.kind === 'tower') && !o.dead) {
      this.damage(o, o.hp * h.currentHpLoss, null, z.owner, { spell: true });
      if (h.damageMult && !o.zapWeak && !o.dead) {
        o.zapWeak = true;
        o.dmgMult = (o.dmgMult || 1) * h.damageMult;
      }
    }
    if (h.burn) this.ignite(o, h.burn, z.owner);
  },

  /** Laufende Wirkung einer Perk-Zone: Schneesturm (Einfrieren), Würgegift (Festhalten). */
  perkZone(z) {
    const px = z.s.px;
    if (!z.impacted) return;
    if (px.freeze) {
      const seen = (z.frozenAt = z.frozenAt || new Map());
      for (const o of this.entities) {
        if (o.dead || o.owner === z.owner || o.kind === 'tower' || o.underT > 0 || !this.inZone(z, o)) continue;
        const last = seen.get(o.id);
        if (last == null || this.time - last + 1e-9 >= px.freeze.every) {
          seen.set(o.id, this.time);
          this.stun(o, px.freeze.duration, true);
        }
      }
    }
    if (px.onEnter?.rootUntilZoneEnds) {
      const held = (z.rooted = z.rooted || new Set());
      const left = Math.max(0, z.s.duration - z.activeT);
      for (const o of this.entities) {
        if (o.dead || o.owner === z.owner || o.kind !== 'unit' || held.has(o.id) || o.underT > 0) continue;
        if (o.flying && !px.onEnter.includeAir) continue;
        if (!this.inZone(z, o)) continue;
        this.root(o, left, false);
        if (o.rootT > 0) {
          held.add(o.id);
          this.events.push(['vn', o.id, r2(left)]);
        }
      }
    }
  },

  /** Bowler (Episch): Fels explodiert beim ersten Aufschlag, rollt dann weiter. */
  perkLineBlast(l, o) {
    const b = l.perkBlast;
    l.perkBlast = null;
    const src = this.byId.get(l.srcId);
    // Mittelpunkt vorher festhalten (der Rückstoß verschiebt auch das getroffene Ziel)
    const cx = o.x;
    const cy = o.y;
    const hit = this.entities.filter((x) => !x.dead && x.owner !== l.owner && x.kind === 'unit' && x.underT <= 0 && surfaceDist(cx, cy, x) <= b.radius);
    for (const x of hit) {
      this.damage(x, b.damage, src, l.owner, { death: true });
      if (b.knockback) this.knockback(x, x === o ? cx - (l.dx || 0) : cx, x === o ? cy - (l.dy || 0) : cy, b.knockback, true);
    }
    this.events.push(['bl', r2(cx), r2(cy), b.radius, l.owner, b.fx || 'rock']);
  },

  /** Goldener Ritter (Episch): Sprungziele Richtung nächstem gegnerischen Kronenturm bevorzugen. */
  perkTowerScore(e, o, dd) {
    let best = Infinity;
    for (const t of this.towers) if (!t.dead && t.owner !== e.owner) best = Math.min(best, Math.hypot(t.x - o.x, t.y - o.y));
    return best + dd * 0.3;
  },
};

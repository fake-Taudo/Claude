// Zauber-Bausteine: Zonen mit Flugzeit, Einschlag, Salven, Pulsen (Gift, Erdbeben, Void), Rollen (Kampfholz,
// Barbarenfass), Beschwörung (Koboldfass, Friedhof, Luftpost), Kontrolle (Frost, Ranken, Tornado, Fluch),
// Klonen und Spiegel-Abwurf. Wird in Match eingemischt.
import { ARENA_W, ARENA_H, forwardDir } from '../../shared/arena.js';
import { scaleStats, levelFactor, BASE_LEVEL } from '../../shared/cards.js';
import { TAU, r2, clamp, isStruct, surfaceDist, affects } from './geom.js';

/** Trifft der Zauber dieses Objekt? targets: both | ground | air | own */
function hitsEnemy(z, o) {
  if (o.dead || o.owner === z.owner) return false;
  if (o.underT > 0) return false;
  return affects(z.s.targets || 'both', o);
}

export const Spells = {
  castSpell(owner, card, x, y, evo, levelBonus = 0) {
    let s = this.db.spell(card, evo);
    if (levelBonus) s = scaleStats(s, levelFactor(BASE_LEVEL + levelBonus));
    const king = this.kingOf(owner);
    const fromX = king ? king.x : x;
    const fromY = king ? king.y : y;
    let delay = s.delay || 0;
    if (s.travel) delay += Math.hypot(x - fromX, y - fromY) / s.travel;
    const typeIdx = this.db.typeIndex.get(card.id);
    const z = this.addZone(owner, s, x, y, { typeIdx, fromX, fromY, evo, delay, heroCard: card.class === 'hero' ? card : null });
    // Evo-Koboldfass: zweites Fass mit Lockvögeln auf der anderen Seite
    if (s.mirrorSpawn) {
      const mx = ARENA_W - x;
      const d2 = (s.delay || 0) + (s.travel ? Math.hypot(mx - fromX, y - fromY) / s.travel : 0);
      this.addZone(owner, { radius: s.radius, spawn: s.mirrorSpawn, fx: 'barrel', targets: 'both' }, mx, y, { typeIdx, fromX, fromY, evo, delay: d2 });
    }
    return z;
  },

  addZone(owner, s, x, y, o = {}) {
    const z = {
      id: this.nextId++,
      owner,
      s,
      x,
      y,
      r: s.radius || 0,
      typeIdx: o.typeIdx ?? -1,
      fx: s.fx || null,
      fromX: o.fromX ?? x,
      fromY: o.fromY ?? y,
      evo: !!o.evo,
      heroCard: o.heroCard || null,
      t: 0,
      delay: o.delay ?? s.delay ?? 0,
      impacted: false,
      activeT: 0,
      nextPulse: 0,
      pulses: 0,
      done: false,
      echoAt: s.echo ? (o.delay ?? s.delay ?? 0) + s.echo.delay : -1,
      graveSpawned: 0,
      traveled: 0,
      hit: null,
      follow: 0,
      captured: null,
    };
    if (s.roll) {
      z.dir = forwardDir(owner);
      z.hit = new Set();
      z.impacted = true;
      this.events.push(['sp', z.typeIdx, r2(x), r2(y), 0, owner, z.fx || '', z.evo ? 1 : 0]);
    }
    this.zones.push(z);
    return z;
  },

  inZone(z, o) {
    return surfaceDist(z.x, z.y, o) <= z.r;
  },

  updateZones(dt) {
    for (const z of this.zones) {
      if (z.done) continue;
      z.t += dt;
      const s = z.s;
      if (z.follow) {
        const f = this.byId.get(z.follow);
        if (f && !f.dead) {
          z.x = f.x;
          z.y = f.y;
        }
      }
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
        if (s.echo.radius) z.r = s.echo.radius;
        this.spellImpact(z);
      }
      if (z.captured) this.updateGather(z, dt);
      if (s.duration > 0) {
        if (s.pulse) {
          while (z.nextPulse <= z.activeT + 1e-9 && z.nextPulse < s.duration - 1e-9) {
            this.spellPulse(z);
            z.nextPulse += s.pulse;
          }
        }
        this.zoneContinuous(z, dt);
        if (s.graveyard) this.updateGraveyard(z);
        if (z.activeT + 1e-9 >= s.duration) z.done = true;
      } else if (z.echoAt < 0 && !z.captured) {
        z.done = true;
      }
    }
    this.zones = this.zones.filter((z) => !z.done);
  },

  /** Dauerwirkung einer aktiven Zone (Verlangsamung, Wut, Sog, Fluch). */
  zoneContinuous(z) {
    const s = z.s;
    if (!(s.slow && s.slow.duration == null) && !s.rage && !s.pull && !s.curse) return;
    for (const o of this.entities) {
      if (o.dead || !this.inZone(z, o)) continue;
      if (o.owner === z.owner) {
        if (s.rage && o.kind !== 'tower') this.rage(o, s.rage.mult, 1);
        continue;
      }
      if (o.underT > 0) continue;
      if (s.slow && s.slow.duration == null && affects(s.targets || 'both', o)) this.slow(o, s.slow.amount, 0.3);
      if (s.pull && o.kind === 'unit') this.pull(o, z.x, z.y, s.pull.speed * this.dt);
      if (s.curse && o.kind === 'unit') o.curse = { owner: z.owner, unit: s.curse.unit, until: this.time + 0.3 };
    }
  },

  spellImpact(z) {
    const s = z.s;
    if (s.strikes) this.lightningStrikes(z);
    else if (s.vines) this.vines(z);
    else if (s.clone) this.cloneTroops(z);
    else if (s.mirror) {
      /* Spiegel wird beim Ausspielen aufgelöst */
    } else if (!s.pulse && (s.damage || s.stun || s.knockback || (s.slow && s.slow.duration != null))) {
      const waves = s.waves || 1;
      for (let w = 0; w < waves; w++) {
        if (w === 0) this.zoneHit(z);
        else this.later(w * (s.waveInterval || 0.25), () => this.zoneHit(z));
      }
    }
    if (s.gather) this.startGather(z);
    if (s.spawn) {
      const out = this.spawnAround(s.spawn.unit, s.spawn.count, z.owner, z.x, z.y, s.spawn.deployTime ?? 0.3);
      if (z.heroCard) for (const e of out) this.makeHeroUnit(e, z.heroCard);
    }
    this.events.push(['sp', z.typeIdx, r2(z.x), r2(z.y), z.r, z.owner, z.fx || '', z.evo ? 1 : 0]);
  },

  /** Ein Treffer aller Gegner im Radius (Feuerball, Knall, Frost, Schneeball …). */
  zoneHit(z) {
    const s = z.s;
    for (const o of this.entities) {
      if (!hitsEnemy(z, o) || !this.inZone(z, o)) continue;
      if (s.damage) this.damage(o, this.spellDamage(s, o, s.damage), null, z.owner, { spell: true, spellFx: z.fx });
      if (s.stun) this.stun(o, s.stun, !!s.freeze);
      if (s.slow && s.slow.duration != null) this.slow(o, s.slow.amount, s.slow.duration);
      if (s.knockback && o.kind === 'unit') this.knockback(o, z.x, z.y, s.knockback);
    }
  },

  /** Zauberschaden je Zieltyp: Kronentürme × towerDamage, Gebäude ggf. eigener Wert (Erdbeben). */
  spellDamage(s, o, dmg) {
    if (o.kind === 'tower') return dmg * (s.towerDamage ?? 1);
    if (o.kind === 'building' && s.buildingDamage) return s.buildingDamage;
    return dmg;
  },

  spellPulse(z) {
    const s = z.s;
    z.pulses++;
    if (s.voidTiers) {
      // Void: weniger Ziele → mehr Schaden pro Ziel
      const hit = this.entities.filter((o) => hitsEnemy(z, o) && this.inZone(z, o));
      const tier = s.voidTiers.find(([max]) => hit.length <= max) || s.voidTiers[s.voidTiers.length - 1];
      for (const o of hit) this.damage(o, o.kind === 'tower' ? tier[2] : tier[1], null, z.owner, { spell: true });
      this.events.push(['zp', z.id, r2(z.x), r2(z.y), z.r, z.fx || '']);
      return;
    }
    for (const o of this.entities) {
      if (o.dead || !this.inZone(z, o)) continue;
      if (s.damage && hitsEnemy(z, o)) {
        const amt = this.spellDamage(s, o, s.damage);
        if (amt > 0) this.damage(o, amt, null, z.owner, { spell: true, spellFx: z.fx });
      }
      if (s.heal && o.owner === z.owner) this.heal(o, s.heal);
    }
    if (s.fx === 'quake' || s.fx === 'void' || s.fx === 'tornado') this.events.push(['zp', z.id, r2(z.x), r2(z.y), z.r, z.fx]);
  },

  updateGraveyard(z) {
    const g = z.s.graveyard;
    const interval = g.interval ?? (z.s.duration - g.firstDelay) / g.count;
    while (z.graveSpawned < g.count && z.activeT + 1e-9 >= g.firstDelay + z.graveSpawned * interval) {
      const k = z.graveSpawned++;
      for (let tries = 0; tries < 6; tries++) {
        // feste Muster am Rand statt rein zufällig (seit 2026)
        const a = (k * 0.62 + tries * 0.37) * TAU + this.rng() * 0.3;
        const r = g.ring ? z.r * (0.55 + 0.4 * ((k * 7) % 3) / 2) : Math.sqrt(this.rng()) * z.r;
        const x = clamp(z.x + Math.cos(a) * r, 0.5, ARENA_W - 0.5);
        const y = clamp(z.y + Math.sin(a) * r, 0.5, ARENA_H - 0.5);
        if (this.nav.cells[this.nav.index(x, y)] !== 0) continue;
        this.spawnAround(g.unit, 1, z.owner, x, y, 0.5);
        break;
      }
    }
  },

  /** Rollende Zauber (Kampfholz, Barbarenfass). */
  updateRoll(z, dt) {
    const s = z.s;
    const r = s.roll;
    const step = Math.min(r.speed * dt, r.length - z.traveled);
    z.y += z.dir * step;
    z.traveled += step;
    for (const o of this.entities) {
      if (!hitsEnemy(z, o) || z.hit.has(o.id)) continue;
      const half = isStruct(o) ? o.half : o.radius;
      if (Math.abs(o.x - z.x) <= r.width / 2 + half && Math.abs(o.y - z.y) <= 0.6 + half) {
        z.hit.add(o.id);
        this.damage(o, this.spellDamage(s, o, s.damage), null, z.owner, { spell: true });
        if (s.knockback && o.kind === 'unit') this.knockback(o, o.x, o.y - z.dir, s.knockback);
      }
    }
    if (z.traveled >= r.length - 1e-6 || z.y < 0 || z.y > ARENA_H) {
      z.done = true;
      if (s.spawnAtEnd) {
        const y = clamp(z.y, 0.6, ARENA_H - 0.6);
        const out = this.spawnAround(s.spawnAtEnd.unit, s.spawnAtEnd.count, z.owner, z.x, y, 0.5);
        if (z.heroCard) for (const e of out) this.makeHeroUnit(e, z.heroCard);
        this.events.push(['bl', r2(z.x), r2(y), 1, z.owner, 'barrel']);
      }
    }
  },

  lightningStrikes(z) {
    const s = z.s;
    const cands = this.entities
      .filter((o) => hitsEnemy(z, o) && this.inZone(z, o))
      .sort((a, b) => b.hp - a.hp)
      .slice(0, s.strikes);
    cands.forEach((o, i) => {
      this.later(i * 0.15, () => {
        if (o.dead) return;
        this.damage(o, this.spellDamage(s, o, s.damage), null, z.owner, { spell: true });
        if (s.stun) this.stun(o, s.stun);
        this.events.push(['st', r2(o.x), r2(o.y)]);
      });
    });
    if (!cands.length) this.events.push(['st', r2(z.x), r2(z.y)]);
  },

  /** Ranken: packen die Ziele mit den meisten Lebenspunkten, halten sie fest, holen Flieger herunter. */
  vines(z) {
    const s = z.s;
    const v = s.vines;
    const cands = this.entities
      .filter((o) => hitsEnemy(z, o) && this.inZone(z, o) && o.kind !== 'tower')
      .sort((a, b) => b.hp - a.hp)
      .slice(0, v.count);
    for (const o of cands) {
      if (o.kind === 'unit') this.root(o, v.duration, true);
      else this.stun(o, v.duration);
      this.events.push(['vn', o.id, r2(v.duration)]);
      for (let k = 0; k < v.pulses; k++) {
        this.later((k * v.duration) / v.pulses, () => {
          if (!o.dead) this.damage(o, this.spellDamage(s, o, s.damage), null, z.owner, { spell: true });
        });
      }
    }
    // Kronentürme im Bereich bekommen nur Schaden
    for (const o of this.entities) {
      if (o.kind !== 'tower' || !hitsEnemy(z, o) || !this.inZone(z, o) || cands.length >= v.count) continue;
      for (let k = 0; k < v.pulses; k++) this.later((k * v.duration) / v.pulses, () => this.damage(o, s.damage * (s.towerDamage ?? 1), null, z.owner, { spell: true }));
    }
  },

  /** Klonzauber: eigene Truppen im Bereich verdoppeln (1 Leben, 1 Schild). Champions werden nicht geklont. */
  cloneTroops(z) {
    const fwd = forwardDir(z.owner);
    const list = this.entities.filter((o) => !o.dead && o.owner === z.owner && o.kind === 'unit' && !o.clone && o.cls !== 'champion' && this.inZone(z, o) && !o.def.traits.untargetable);
    for (const o of list) {
      if (this.entities.length >= this.maxEntities) break;
      const c = this.addEntity(o.def, o.owner, clamp(o.x + 0.35, o.radius, ARENA_W - o.radius), clamp(o.y - fwd * 0.8, o.radius, ARENA_H - o.radius), {
        deployTime: 0.2,
        evo: o.evo,
        cardId: o.cardId,
        clone: true,
        ability: null,
        groupId: o.groupId,
      });
      c.flying = o.flying;
    }
  },

  /** Evo-Schneeball: sammelt getroffene Truppen ein und rollt mit ihnen weiter. */
  startGather(z) {
    const g = z.s.gather;
    const caught = this.entities.filter((o) => hitsEnemy(z, o) && o.kind === 'unit' && this.inZone(z, o) && o.mass < 1e5);
    if (!caught.length) return;
    z.captured = { ids: caught.map((o) => o.id), left: g.length, speed: g.speed, dir: forwardDir(z.owner) };
    for (const o of caught) {
      o.rootT = Math.max(o.rootT, g.length / g.speed + 0.1);
      o.locked = false;
    }
  },

  updateGather(z, dt) {
    const c = z.captured;
    const step = Math.min(c.speed * dt, c.left);
    c.left -= step;
    z.y = clamp(z.y + c.dir * step, 0.5, ARENA_H - 0.5);
    for (const id of c.ids) {
      const o = this.byId.get(id);
      if (!o || o.dead) continue;
      o.x += (z.x - o.x) * 0.3;
      o.y = clamp(o.y + c.dir * step + (z.y - o.y) * 0.3, o.radius, ARENA_H - o.radius);
    }
    if (c.left <= 1e-6) {
      for (const id of c.ids) {
        const o = this.byId.get(id);
        if (o) o.rootT = 0;
      }
      z.captured = null;
      z.done = true;
    }
  },
};

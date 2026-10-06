// Champion- und Heldenfähigkeiten. Seit 08/2026 im Original nur einmal pro Einsatz nutzbar (Boss Bandit: zweimal).
// Ablauf: Knopf → Kosten zahlen → Wirkzeit (castTime) → executeAbility. Stirbt die Einheit vorher, gibt es das Elixier zurück.
import { ARENA_W, ARENA_H, forwardDir } from '../../shared/arena.js';
import { REJECTS } from '../../shared/protocol.js';
import { TAU, r2, clamp, isStruct, surfaceDist, segDist } from './geom.js';

export const Abilities = {
  abilityEntity(side) {
    let best = null;
    for (const e of this.entities) {
      if (e.dead || e.owner !== side || !e.ability || e.clone) continue;
      if (e.abilityUses <= 0 && !e.cast) continue;
      if (!best || e.id > best.id) best = e;
    }
    return best;
  },

  useAbility(side) {
    const fail = (code) => ({ ok: false, code, message: REJECTS[code] });
    if (!this.started || this.result) return fail('NOT_RUNNING');
    const e = this.abilityEntity(side);
    if (!e) return fail('NO_ABILITY');
    if (e.deployT > 0 || e.cast) return fail('DEPLOYING');
    const ab = e.ability;
    const p = this.players[side];
    if (e.abilityUses <= 0) return fail('USED');
    if (e.abilityCd > 1e-9) return fail('COOLDOWN');
    if (p.elixir + 1e-9 < (ab.cost || 0)) return fail('ELIXIR');
    p.elixir -= ab.cost || 0;
    e.abilityUses--;
    e.abilityCd = ab.cooldown || 0;
    this.stats[side].abilities++;
    e.cast = { t: ab.castTime ?? 1, ab };
    this.events.push(['ab', e.id, side, e.typeIdx, this.db.typeIndex.get(e.abilityCard) ?? e.typeIdx]);
    return { ok: true };
  },

  updateCast(e, dt) {
    if (e.stunT > 0 && e.cast.t < (e.cast.ab.castTime ?? 1)) return; // betäubt: Wirken pausiert
    e.cast.t -= dt;
    if (e.cast.t > 0) return;
    const ab = e.cast.ab;
    e.cast = null;
    this.executeAbility(e, ab);
  },

  /** Stirbt die Einheit vor dem Wirken, gibt es das Elixier zurück (Regel des Originals). */
  refundCast(e) {
    if (!e.cast) return;
    this.addElixir(e.owner, e.cast.ab.cost || 0, e.x, e.y);
    e.cast = null;
  },

  /** Held aus einem Zauber (Barbarenfass): der erzeugte Barbar erhält die Fähigkeit. */
  makeHeroUnit(e, heroCard) {
    e.ability = heroCard.ability;
    e.abilityUses = heroCard.ability.uses || 1;
    e.cls = 'hero';
    e.abilityCard = heroCard.id;
  },

  executeAbility(e, ab) {
    if (e.dead) return;
    const fwd = forwardDir(e.owner);
    const now = this.time;
    this.events.push(['ax', e.id]);
    if (ab.cloak) {
      const c = ab.cloak;
      this.addBuff(e, { type: 'cloak', until: now + c.duration, invisible: true, attackSpeed: c.attackSpeed, speed: c.speed });
    }
    if (ab.vanish) {
      const v = ab.vanish;
      this.addBuff(e, { type: 'vanish', until: now + v.duration, invisible: true });
      this.later(v.duration, () => {
        if (e.dead) return;
        const x0 = e.x;
        const y0 = e.y;
        e.y = clamp(e.y - fwd * v.back, e.radius, ARENA_H - e.radius);
        e.locked = false;
        e.dash = null;
        this.events.push(['tp', e.id, r2(x0), r2(y0), r2(e.x), r2(e.y)]);
      });
    }
    if (ab.link) this.addBuff(e, { type: 'link', until: now + ab.link.duration, link: ab.link, nextT: 0 });
    if (ab.dash) {
      const d = ab.dash;
      e.dash = { mode: 'chain', left: d.count, radius: d.radius, damage: d.damage, interval: d.interval || 0.3, t: 0, hit: new Set(), seeking: true, seekUntil: now + 6, seekSpeed: d.seekSpeed || 2 };
      e.locked = false;
    }
    if (ab.summonCharge) this.royalRescue(e, ab.summonCharge);
    if (ab.burrow) {
      if (ab.drop) this.addZone(e.owner, { ...ab.drop, targets: 'both' }, e.x, e.y, { bomb: true });
      const x1 = ab.burrow.mirrorX ? clamp(ARENA_W - e.x, e.radius, ARENA_W - e.radius) : e.x;
      e.underT = 1;
      e.under = { x0: e.x, y0: e.y, x1, y1: e.y, dur: 1 };
      e.locked = false;
      e.path = null;
    }
    if (ab.guard) {
      const g = ab.guard;
      this.addBuff(e, { type: 'reflect', until: now + g.duration, damageTaken: g.damageTaken, reflectProjectiles: g.reflectProjectiles, immovable: g.immovable });
    }
    if (ab.souls) this.soulSummoning(e, ab.souls);
    if (ab.taunt) {
      const t = ab.taunt;
      if (ab.shield) {
        e.shield += ab.shield;
        e.maxShield = Math.max(e.maxShield, e.shield);
        this.addBuff(e, { type: 'shield', until: now + t.duration, amount: ab.shield });
      }
      for (const o of this.entities) {
        if (o.dead || o.owner === e.owner || o.kind === 'tower') continue;
        if (surfaceDist(e.x, e.y, o) > t.radius) continue;
        o.tauntId = e.id;
        o.tauntT = t.duration;
        o.locked = false;
      }
      this.events.push(['bl', r2(e.x), r2(e.y), t.radius, e.owner, 'taunt']);
    }
    if (ab.hurl) e.hurlPending = { ...ab.hurl, until: now + 15 };
    if (ab.pancakes) this.breakfast(e, ab.pancakes);
    if (ab.build) {
      const b = ab.build;
      const def = this.db.unit(b.unit, false, e.levelBonus);
      const h = def.size / 2;
      const x = clamp(e.x, h, ARENA_W - h);
      const y = clamp(e.y + fwd * b.forward, h, ARENA_H - h);
      this.addEntity(def, e.owner, x, y, { deployTime: def.deployTime });
      if (b.landing) this.areaBlast(e.owner, x, y, { ...b.landing, fx: 'build' }, e);
    }
    if (ab.pulses) {
      const p = ab.pulses;
      for (let i = 0; i < p.count; i++) {
        this.later(i * p.interval, () => {
          const dmg = Array.isArray(p.damage) ? p.damage[i] : p.damage;
          this.areaBlast(e.owner, e.x, e.y, { damage: dmg, radius: p.radius, slow: p.slow, towerDamage: p.towerDamage, fx: p.fx || 'frost' }, e);
        });
      }
    }
    if (ab.flight) {
      const f = ab.flight;
      this.addBuff(e, { type: 'flight', until: now + f.duration, speedMult: f.speedMult, whirl: f.whirl });
      e.flying = true;
    }
    if (ab.banner) this.dropBanner(e, ab.banner);
    if (ab.warp) this.warp(e, ab.warp);
    if (ab.reroll) this.reroll(e, ab.reroll);
    if (ab.decoy) {
      const d = ab.decoy;
      this.spawnAround(d.unit, 1, e.owner, e.x, e.y, 0);
      const x0 = e.x;
      const y0 = e.y;
      e.y = clamp(e.y - fwd * d.back, e.radius, ARENA_H - e.radius);
      e.locked = false;
      this.events.push(['tp', e.id, r2(x0), r2(y0), r2(e.x), r2(e.y)]);
    }
    if (ab.tripleShot) this.addBuff(e, { type: 'tripleShot', until: now + 30, shot: ab.tripleShot });
    if (ab.paratrooper) this.paratrooper(e, ab.paratrooper);
    if (ab.stance) {
      const s = ab.stance;
      this.addBuff(e, {
        type: 'stance',
        until: now + s.duration,
        speedMult: 0,
        attack: { range: s.range, hitSpeed: s.hitSpeed, damage: s.damage, towerDamage: s.towerDamage, splash: s.splash, splashSelf: false, projectile: s.projectile, minRange: 0 },
      });
      e.locked = false;
      e.cd = Math.min(e.cd, 0.3);
    }
    if (ab.dismount) this.dismount(e, ab.dismount);
    if (ab.summon) {
      const s = ab.summon;
      this.spawnAround(s.unit, s.count || 1, e.owner, e.x, clamp(e.y + fwd * (s.forward || 0), 0.6, ARENA_H - 0.6), 0.5, { levelBonus: e.levelBonus });
    }
    if (ab.frenzy) {
      const f = ab.frenzy;
      this.addBuff(e, { type: 'frenzy', until: now + f.duration, attack: { hitSpeed: f.hitSpeed, damage: f.damage, towerDamage: f.towerDamage }, speed: f.speed, minHp: f.minHp });
      e.cd = Math.min(e.cd, f.hitSpeed);
    }
    if (ab.spin) {
      const s = ab.spin;
      this.addBuff(e, { type: 'spin', until: now + s.duration, damageTaken: s.damageTaken, speedMult: s.speedMult, spin: s, nextT: 0 });
    }
  },

  /** Laufende Fähigkeitswirkungen (Blitzverbindung, Wirbel, Wurf, Warp-Rückkehr). */
  updateAbilityEffects(e) {
    if (e.hurlPending) this.tryHurl(e);
    for (const b of e.buffs) {
      if (b.type === 'link' && this.time >= b.nextT) {
        b.nextT = this.time + b.link.pulse;
        this.linkPulse(e, b.link);
      } else if (b.type === 'spin' && this.time >= b.nextT) {
        b.nextT = this.time + b.spin.interval;
        this.areaBlast(e.owner, e.x, e.y, { damage: b.spin.damage, radius: b.spin.radius, towerDamage: b.spin.towerDamage, groundOnly: true, fx: 'spin' }, e);
      } else if (b.type === 'warp' && this.time >= b.until - this.dt) {
        this.endWarp(e, b);
      }
    }
  },

  /** Goblinstein: Strom zwischen Doktor und Monster (bzw. dessen Antenne) trifft Gegner nahe der Verbindung. */
  linkPulse(e, l) {
    const partner = this.entities.find((o) => !o.dead && o.owner === e.owner && o.groupId === e.groupId && o.def.key === l.partner);
    if (partner) e.linkAnchor = { x: partner.x, y: partner.y };
    const a = partner || e.linkAnchor;
    if (!a) return;
    for (const o of this.entities) {
      if (o.dead || o.owner === e.owner || o.underT > 0) continue;
      const r = isStruct(o) ? o.half : o.radius;
      if (segDist(o.x, o.y, e.x, e.y, a.x, a.y) > l.radius + r) continue;
      this.damage(o, o.kind === 'tower' ? l.damage * l.towerDamage : l.damage, e, e.owner);
    }
    this.events.push(['lk', e.id, r2(e.x), r2(e.y), r2(a.x), r2(a.y)]);
  },

  /** Little Prince: Guardienne stürmt vor ihm los, stößt Bodentruppen weg und bleibt. */
  royalRescue(e, s) {
    const fwd = forwardDir(e.owner);
    const def = this.db.unit(s.unit, false, e.levelBonus);
    const x0 = e.x;
    const y0 = e.y + fwd * 0.6;
    const x1 = x0;
    const y1 = clamp(y0 + fwd * s.distance, def.radius, ARENA_H - def.radius);
    for (const o of this.entities) {
      if (o.dead || o.owner === e.owner || o.flying || o.underT > 0) continue;
      const r = isStruct(o) ? o.half : o.radius;
      if (segDist(o.x, o.y, x0, y0, x1, y1) > s.radius + r) continue;
      this.damage(o, o.kind === 'tower' ? s.damage * 0.3 : s.damage, e, e.owner);
      if (o.kind === 'unit') this.knockback(o, o.x - (o.x - x0) * 0.5, o.y - fwd, s.knockback);
    }
    const g = this.addEntity(def, e.owner, x1, y1, { deployTime: 0, levelBonus: e.levelBonus, championOf: e.championOf });
    this.events.push(['ds', g.id, r2(x0), r2(y0), r2(x1), r2(y1)]);
  },

  /** Skelettkönig: 6 + gesammelte Seelen Skelette (1 Leben wie Klone), eines alle 0,25 s. */
  soulSummoning(e, s) {
    const n = s.base + e.souls;
    e.souls = 0;
    const cx = e.x;
    const cy = e.y;
    const owner = e.owner;
    for (let k = 0; k < n; k++) {
      this.later(k * s.interval, () => {
        const a = this.rng() * TAU;
        const r = Math.sqrt(this.rng()) * s.radius;
        const x = clamp(cx + Math.cos(a) * r, 0.5, ARENA_W - 0.5);
        const y = clamp(cy + Math.sin(a) * r, 0.5, ARENA_H - 0.5);
        const out = this.spawnAround(s.unit, 1, owner, x, y, 0.3, { clone: !!s.clone });
        for (const o of out) o.summoned = true;
      });
    }
  },

  /** Held Riese: packt die stärkste nahe Truppe und schleudert sie quer über die Arena. */
  tryHurl(e) {
    const h = e.hurlPending;
    if (this.time > h.until) {
      e.hurlPending = null;
      return;
    }
    let best = null;
    for (const o of this.entities) {
      if (o.dead || o.owner === e.owner || o.kind !== 'unit' || this.isHidden(o) || o.mass >= 1e5) continue;
      if (surfaceDist(e.x, e.y, o) > h.grab + e.radius) continue;
      if (!best || o.hp > best.hp) best = o;
    }
    if (!best) return;
    e.hurlPending = null;
    const dir = best.x >= ARENA_W / 2 ? -1 : 1;
    const x1 = clamp(best.x + dir * h.distance, best.radius, ARENA_W - best.radius);
    this.throwTo(best, x1, best.y, 0.9, { damage: h.damage, stun: h.stun }, e);
  },

  /** Held Mini-P.E.K.K.A.: Pfannkuchen geben Level und heilen. */
  breakfast(e, p) {
    const bars = Math.min(p.bars, Math.floor(e.pancakeT / p.fillTime));
    const levels = p.levels[bars];
    const f = Math.pow(1.1, levels);
    e.dmgMult = (e.dmgMult || 1) * f;
    e.maxHp = Math.round(e.maxHp * f);
    e.hp = Math.min(e.maxHp, e.hp * f + e.maxHp * p.heal);
    e.pancakeT = 0;
    this.events.push(['bl', r2(e.x), r2(e.y), 1, e.owner, 'levelup']);
    this.events.push(['hl', e.id, Math.round(e.maxHp * p.heal)]);
  },

  /** Held Kobolde: Banner hinter dem hintersten Kobold ruft Verstärkung. */
  dropBanner(e, b) {
    const fwd = forwardDir(e.owner);
    const group = this.entities.filter((o) => !o.dead && o.owner === e.owner && o.heroGroup && o.heroGroup === e.heroGroup);
    const back = group.length ? group.reduce((a, o) => ((o.y - a.y) * fwd < 0 ? o : a), group[0]) : e;
    const x = back.x;
    const y = clamp(back.y - fwd * 1, 0.6, ARENA_H - 0.6);
    this.addZone(e.owner, { radius: 0.6, duration: b.lifetime, fx: 'banner', targets: 'own' }, x, y, {});
    this.later(b.delay, () => this.spawnAround(b.unit, b.count, e.owner, x, y, 0.3));
  },

  /** Held Megalakai: Sprung zum schwächsten Gegner, Rückkehr nach Sieg oder Zeitablauf. */
  warp(e, w) {
    let best = null;
    for (const o of this.entities) {
      if (o.dead || o.owner === e.owner || o.kind === 'tower' || this.isHidden(o)) continue;
      if (!best || o.hp < best.hp) best = o;
    }
    if (!best) return;
    const origin = { x: e.x, y: e.y };
    const a = Math.atan2(e.y - best.y, e.x - best.x);
    const off = (isStruct(best) ? best.half : best.radius) + e.radius + 0.1;
    e.x = clamp(best.x + Math.cos(a) * off, e.radius, ARENA_W - e.radius);
    e.y = clamp(best.y + Math.sin(a) * off, e.radius, ARENA_H - e.radius);
    this.events.push(['tp', e.id, r2(origin.x), r2(origin.y), r2(e.x), r2(e.y)]);
    this.damage(best, best.kind === 'tower' ? w.damage * w.towerDamage : w.damage, e, e.owner);
    if (!best.dead) {
      this.addBuff(e, { type: 'warp', until: this.time + w.returnAfter, origin, targetId: best.id });
      e.targetId = best.id;
      e.locked = true;
    } else this.endWarp(e, { origin });
  },

  endWarp(e, b) {
    if (!b?.origin || e.dead) return;
    e.buffs = e.buffs.filter((o) => o.type !== 'warp');
    const x0 = e.x;
    const y0 = e.y;
    e.x = b.origin.x;
    e.y = b.origin.y;
    e.locked = false;
    this.events.push(['tp', e.id, r2(x0), r2(y0), r2(e.x), r2(e.y)]);
  },

  /** Held Barbarenfass: der Barbar rollt noch einmal und heilt sich. */
  reroll(e, r) {
    const fwd = forwardDir(e.owner);
    const len = r.length;
    const z = this.addZone(e.owner, { roll: { length: len, width: r.width, speed: 6 }, damage: r.damage, towerDamage: 0.5, knockback: 0.6, targets: 'ground', fx: 'barrelRoll' }, e.x, e.y, {});
    z.dir = fwd;
    e.underT = len / 6;
    e.under = { x0: e.x, y0: e.y, x1: e.x, y1: clamp(e.y + fwd * len, e.radius, ARENA_H - e.radius), dur: len / 6 };
    e.onSurface = () => this.heal(e, e.maxHp * r.heal);
  },

  /** Held Ballon: Skelett-Fallschirmjäger landet auf der nächsten Bodentruppe. */
  paratrooper(e, p) {
    let best = null;
    let bd = Infinity;
    for (const o of this.entities) {
      if (o.dead || o.owner === e.owner || o.flying || o.kind !== 'unit' || this.isHidden(o)) continue;
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d <= p.search && d < bd) {
        bd = d;
        best = o;
      }
    }
    const x = best ? best.x : e.x;
    const y = best ? best.y : e.y;
    this.spawnAround(p.unit, 1, e.owner, x, y, 0.6, { levelBonus: e.levelBonus });
    this.later(0.6, () => this.areaBlast(e.owner, x, y, { ...p.landing, groundOnly: true, fx: 'slam' }, null));
    this.events.push(['lp', e.id, r2(e.x), r2(e.y), r2(x), r2(y), 0.6]);
  },

  /** Held Dunkler Prinz: springt vom Nashorn; das Nashorn stürmt allein auf Gebäude. */
  dismount(e, d) {
    this.spawnAround(d.mount, 1, e.owner, e.x, e.y, 0, { levelBonus: e.levelBonus });
    if (d.landing) this.areaBlast(e.owner, e.x, e.y, { ...d.landing, groundOnly: true, fx: 'slam' }, e);
    // ohne Reittier: kein Ansturm, kein Flusssprung
    const traits = { ...e.def.traits };
    if (d.rider) for (const [k, v] of Object.entries(d.rider)) if (v === null || v === false) delete traits[k];
    e.def = { ...e.def, traits };
    e.charging = false;
    e.chargeDist = 0;
  },
};

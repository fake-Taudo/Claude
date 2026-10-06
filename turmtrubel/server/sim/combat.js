// Kampf-Bausteine: Zielwahl, Angriffe (Nahkampf, Geschoss, Durchschuss, Schrot, Splitter, Kette),
// Schaden mit allen Sonderregeln, Heilung und Statuseffekte. Wird in Match eingemischt.
import { ARENA_W, ARENA_H, forwardDir } from '../../shared/arena.js';
import { TAU, r2, clamp, isStruct, surfaceDist, rangeDist, affects, segDist } from './geom.js';

const MELEE = 2; // bis zu dieser Reichweite gilt ein Angriff als Nahkampf (Parade, Elektroriese)

export const Combat = {
  // ───────────────────────────── Status ─────────────────────────────

  updateStatus(e, dt) {
    if (e.stunT > 0) {
      e.stunT = Math.max(0, e.stunT - dt);
      if (e.stunT <= 0) e.frozen = false;
    }
    if (e.slowT > 0) {
      e.slowT -= dt;
      if (e.slowT <= 0) e.slowAmt = 0;
    }
    if (e.rageT > 0) {
      e.rageT -= dt;
      if (e.rageT <= 0) e.rageMult = 1;
    }
    if (e.hasteT > 0) {
      e.hasteT -= dt;
      if (e.hasteT <= 0) e.hasteMult = 1;
    }
    if (e.cloakT > 0) e.cloakT -= dt;
    if (e.invulnT > 0) e.invulnT -= dt;
    if (e.rootT > 0) {
      e.rootT -= dt;
      if (e.rootT <= 0 && e.grounded) {
        e.grounded = false;
        e.flying = !!e.def.flying || this.hasBuff(e, 'flight');
      }
    }
    if (e.tauntT > 0) {
      e.tauntT -= dt;
      if (e.tauntT <= 0) e.tauntId = 0;
    }
    if (e.curse && this.time >= e.curse.until) e.curse = null;
    if (e.enchant && e.enchant.until && this.time >= e.enchant.until) e.enchant = null;
    if (e.abilityCd > 0) e.abilityCd = Math.max(0, e.abilityCd - dt);
    if (e.parryCd > 0) e.parryCd -= dt;
    if (e.hookCd > 0) e.hookCd -= dt;
    if (e.buffs.length) {
      const keep = [];
      for (const b of e.buffs) {
        if (b.until > this.time) keep.push(b);
        else this.endBuff(e, b);
      }
      e.buffs = keep;
    }
  },

  hasBuff(e, type) {
    for (const b of e.buffs) if (b.type === type) return true;
    return false;
  },

  getBuff(e, type) {
    for (const b of e.buffs) if (b.type === type) return b;
    return null;
  },

  addBuff(e, b) {
    e.buffs = e.buffs.filter((o) => o.type !== b.type);
    e.buffs.push(b);
    return b;
  },

  endBuff(e, b) {
    if (b.type === 'flight') e.flying = !!e.def.flying;
    if (b.type === 'shield') e.shield = Math.max(0, e.shield - (b.amount || 0));
  },

  /** Produkt eines Buff-Werts (z. B. attackSpeed, speed, damageTaken). */
  buffMult(e, key) {
    let m = 1;
    for (const b of e.buffs) if (b[key] != null) m *= b[key];
    return m;
  },

  attackRate(e) {
    return (1 - e.slowAmt) * e.rageMult * this.buffMult(e, 'attackSpeed');
  },

  speedMult(e) {
    return (1 - e.slowAmt) * e.rageMult * (e.hasteMult || 1) * this.buffMult(e, 'speedMult');
  },

  /** Unsichtbar/unter der Erde/nicht anvisierbar → Truppen, Gebäude und Türme können es nicht als Ziel wählen. */
  isHidden(t) {
    if (t.cloakT > 0 || t.hidden || t.underT > 0 || t.def.traits.untargetable) return true;
    if (t.trappedBy) return true;
    for (const b of t.buffs) if (b.invisible) return true;
    return false;
  },

  /** Kann gerade keinen Schaden nehmen? */
  isInvulnerable(t, opts = {}) {
    if (t.def.traits.invulnerable) return true;
    if (t.dash && t.dash.active) return true;
    if (t.underT > 0 || t.invulnT > 0) return true;
    if (t.hidden && t.kind !== 'unit' && opts.spellFx !== 'quake') return true; // versenkte Tesla
    for (const b of t.buffs) if (b.invulnerable) return true;
    return false;
  },

  canTarget(e, t, opts = {}) {
    if (!t || t.dead || t.owner === e.owner) return false;
    if (this.isHidden(t)) return false;
    const tg = opts.targets || (e.buffs.length || e.def.traits.melee ? this.attackParams(e).targets : e.def.targets);
    if (opts.troopsOnly && t.kind !== 'unit') return false;
    if (tg === 'buildings') return t.kind !== 'unit';
    if (t.flying) return tg === 'both' || tg === 'air';
    if (t.thrown) return tg === 'both' || tg === 'air';
    return tg !== 'air';
  },

  /** Weglänge unter Berücksichtigung der Brücken (grobe, schnelle Schätzung). */
  pathDist(e, t) {
    return this.pathDistTo(e, t.x, t.y);
  },

  acquireTarget(e) {
    // Spott (Held Ritter): erzwingt das Ziel, solange es gültig ist
    if (e.tauntId) {
      const t = this.byId.get(e.tauntId);
      if (t && !t.dead && !this.isHidden(t) && (!t.flying || ['both', 'air'].includes(this.attackParams(e).targets))) return t;
      e.tauntId = 0;
    }
    const struct = isStruct(e);
    const P = this.attackParams(e);
    const buildingsOnly = P.targets === 'buildings';
    const opts = { targets: P.targets };
    let best = null;
    let bestScore = Infinity;
    for (const t of this.entities) {
      if (!this.canTarget(e, t, opts)) continue;
      let score;
      if (struct) {
        score = rangeDist(e, t);
        if (score > P.range) continue;
        if (P.minRange && Math.hypot(t.x - e.x, t.y - e.y) < P.minRange) continue;
      } else if (buildingsOnly) {
        score = this.pathDist(e, t);
      } else {
        score = rangeDist(e, t);
        if (score > Math.max(e.def.sight, P.range)) continue;
      }
      if (score < bestScore) {
        bestScore = score;
        best = t;
      }
    }
    if (!best && !struct && !buildingsOnly) {
      // Nichts in Sicht → zum nächsten gegnerischen Gebäude/Turm laufen
      for (const t of this.entities) {
        if (t.dead || t.owner === e.owner || t.kind === 'unit' || this.isHidden(t)) continue;
        const score = this.pathDist(e, t);
        if (score < bestScore) {
          bestScore = score;
          best = t;
        }
      }
    }
    return best;
  },

  /** Wirksame Angriffswerte (Basis + Formwechsel/Haltung/Raserei/Schussfolge). */
  attackParams(e, t = null) {
    const d = e.def;
    let P = {
      damage: d.damage * (e.dmgMult || 1),
      hitSpeed: d.hitSpeed,
      range: d.range,
      minRange: d.minRange || 0,
      splash: d.splash,
      splashSelf: d.splashSelf,
      projectile: d.projectile,
      towerDamage: d.towerDamage ?? 1,
      targets: d.targets,
      melee: d.range <= MELEE,
    };
    const tr = d.traits;
    if (tr.melee && t && rangeDist(e, t) <= tr.melee.switch) {
      P = { ...P, damage: tr.melee.damage * (e.dmgMult || 1), range: tr.melee.range, projectile: null, melee: true, targets: 'ground' };
    }
    if (tr.attackRamp) P.hitSpeed = tr.attackRamp.hitSpeeds[Math.min(e.stage, tr.attackRamp.hitSpeeds.length - 1)];
    for (const b of e.buffs) {
      if (b.attack) P = { ...P, ...b.attack, melee: (b.attack.range ?? P.range) <= MELEE };
    }
    return P;
  },

  hasAttackOverride(e) {
    return e.buffs.some((b) => b.attack);
  },

  updateCombat(e, dt) {
    // Ziel kann gestorben und bereits entfernt sein → dann Sperre lösen und neu suchen
    let t = (e.targetId && this.byId.get(e.targetId)) || null;
    let P = this.attackParams(e, t);
    if (!t || !this.canTarget(e, t) || (isStruct(e) && rangeDist(e, t) > P.range + 0.05)) {
      t = null;
      e.locked = false;
    }
    if (e.tauntId && t?.id !== e.tauntId) e.locked = false;
    if (!e.locked) {
      const nt = this.acquireTarget(e);
      if (nt !== t) e.path = null;
      t = nt;
    }
    e.targetId = t ? t.id : 0;
    if (!t) {
      e.stillT = 0;
      return;
    }
    P = this.attackParams(e, t);
    const d = rangeDist(e, t);
    const inRange = d <= P.range + (e.locked ? 0.35 : 0) && (!P.minRange || Math.hypot(t.x - e.x, t.y - e.y) >= P.minRange);
    if (inRange && P.damage > 0) {
      if (!e.locked) {
        e.locked = true;
        e.cd = Math.max(e.cd, e.def.firstHit);
      }
      e.stillT += dt;
      if (Math.abs(t.x - e.x) > 0.05) e.fx = t.x > e.x ? 1 : -1;
      if (e.def.traits.ramp) this.trackRamp(e, t, dt);
      if (e.cd <= 0) {
        this.attack(e, t, P);
        e.cd = P.hitSpeed;
      }
    } else {
      e.locked = false;
      if (e.kind !== 'unit') return;
      if (this.trySpecialMove(e, t, d)) return;
      this.moveTowards(e, t, dt);
      this.onMoved(e, dt);
    }
  },

  /** Strahl-Stufen (Inferno, Großer Gräber): steigen, solange dasselbe Ziel getroffen wird. */
  trackRamp(e, t, dt) {
    const r = e.def.traits.ramp;
    if (e.rampTargetId === t.id) e.rampT += dt;
    else {
      // Evo-Infernodrache: behält seine Stufe nach einem Sieg einige Sekunden
      const keep = r.keep && this.time - e.rampKeepT <= r.keep;
      e.rampTargetId = t.id;
      if (!keep) e.rampT = 0;
    }
    const at = r.stageAt || r.stages.map((_, i) => i * r.stageTime);
    let st = 0;
    for (let i = 0; i < at.length; i++) if (e.rampT + 1e-9 >= at[i]) st = i;
    e.rampStage = st;
  },

  onMoved(e) {
    const ar = e.def.traits.attackRamp;
    if (ar) {
      // Little Prince: Schussfolge bleibt kurz erhalten, dann zurück auf Stufe 1
      e.movingT = (e.movingT || 0) + this.dt;
      if (e.movingT > (ar.keepWhileMoving ?? 0)) {
        e.stage = 0;
        e.stageShots = 0;
      }
    }
    e.stillT = 0;
  },

  // ───────────────────────────── Angriff ─────────────────────────────

  attack(e, t, P = this.attackParams(e, t)) {
    const def = e.def;
    const tr = def.traits;
    let dmg = P.damage;
    if (tr.ramp) dmg = tr.ramp.stages[e.rampStage] * (e.dmgMult || 1);
    if (e.charging && tr.charge && !e.buffs.some((b) => b.attack)) {
      dmg = tr.charge.damage != null ? tr.charge.damage * (e.dmgMult || 1) : dmg * (tr.charge.damageMult || 2);
      e.charging = false;
      e.chargeDist = 0;
    }
    e.attacks++;
    e.lastAttackT = this.time;
    e.movingT = 0;
    if (tr.stealth) e.revealT = 0;
    let knock = 0;
    let forceKnock = false;
    if (tr.combo && e.attacks % tr.combo.every === 0) {
      dmg = tr.combo.damage * (e.dmgMult || 1);
      knock = tr.combo.knockback;
      forceKnock = true;
    }
    // Rune Giant: jeder n-te Angriff einer verzauberten Truppe macht Bonusschaden
    if (e.enchant) {
      e.enchant.hits++;
      if (e.enchant.hits % e.enchant.every === 0) {
        dmg += e.enchant.bonus;
        this.events.push(['bl', r2(t.x), r2(t.y), 0.8, e.owner, 'rune']);
      }
    }
    const dist = Math.hypot(t.x - e.x, t.y - e.y);
    if (tr.longRangeBonus && dist >= tr.longRangeBonus.minDist && dist <= (tr.longRangeBonus.maxDist ?? 99)) {
      dmg = tr.longRangeBonus.damage ?? dmg * tr.longRangeBonus.mult;
    }
    if (tr.attackRamp) {
      e.stageShots++;
      if (e.stageShots >= tr.attackRamp.shotsPerStage && e.stage < tr.attackRamp.hitSpeeds.length - 1) {
        e.stage++;
        e.stageShots = 0;
      }
    }
    if (e.glide) this.land(e);

    const tripled = this.getBuff(e, 'tripleShot');
    const override = this.hasAttackOverride(e); // Haltung/Raserei: normaler Schuss statt Durchschuss/Schrot
    const payload = {
      owner: e.owner,
      srcId: e.id,
      damage: dmg,
      splash: P.splash,
      splashSelf: P.splashSelf,
      sx: e.x,
      sy: e.y,
      targets: P.targets === 'buildings' ? 'ground' : P.targets,
      towerDamage: P.towerDamage,
      onHit: tr.onHit || null,
      melee: P.melee,
      knock,
      forceKnock,
      evoFx: e.evo,
    };
    const proj = P.projectile;
    // Mehrfachziel (Elektromagier)
    const targets = [t];
    if (tr.multiTarget > 1) {
      const others = this.entities
        .filter((o) => o !== t && this.canTarget(e, o) && rangeDist(e, o) <= P.range)
        .sort((a, b) => rangeDist(e, a) - rangeDist(e, b));
      targets.push(...others.slice(0, tr.multiTarget - 1));
    }
    for (const tt of targets) {
      if (tripled) {
        // Held Magieschütze: drei weite Pfeile im Fächer
        const ts = tripled.shot;
        const base = Math.atan2(tt.y - e.y, tt.x - e.x);
        for (let k = -1; k <= 1; k++) {
          const a = base + (k * ts.spread * Math.PI) / 180;
          this.addLine(e, { ...payload, damage: ts.damage, splash: 0 }, Math.cos(a), Math.sin(a), { length: ts.length, width: 0.5, speed: 16.67, kind: 'magic' });
        }
        e.buffs = e.buffs.filter((b) => b !== tripled);
      } else if (tr.pierce && !override) {
        const a = Math.atan2(tt.y - e.y, tt.x - e.x);
        this.addLine(e, payload, Math.cos(a), Math.sin(a), {
          length: tr.pierce.length,
          width: tr.pierce.width,
          speed: proj?.speed || 10,
          kind: proj?.kind || 'magic',
          knockback: tr.pierce.knockback,
          returns: tr.pierce.returns,
          close: tr.pierce.close,
          rollFrom: tr.pierce.rollFrom,
        });
      } else if (tr.spread && !override) {
        const base = Math.atan2(tt.y - e.y, tt.x - e.x);
        const n = tr.spread.count;
        for (let k = 0; k < n; k++) {
          const a = base + ((k / (n - 1) - 0.5) * tr.spread.angle * Math.PI) / 180;
          this.addLine(e, payload, Math.cos(a), Math.sin(a), { length: tr.spread.length, width: 0.3, speed: proj?.speed || 9, kind: 'pellet', hitFirst: true });
        }
      } else if (proj && proj.speed > 0 && !P.splashSelf) {
        this.spawnProjectile(e, tt, payload, proj);
      } else {
        this.applyAttack(payload, tt, tt.x, tt.y);
      }
      this.events.push(['a', e.id, tt.id]);
    }
    // Nach dem Angriff
    if (tr.uppercut && e.attacks % tr.uppercut.every === 0 && t.kind === 'unit' && !t.dead) this.uppercut(e, t, tr.uppercut.distance);
    if (tr.recoil) this.recoilSelf(e, t, tr.recoil);
    if (tr.recoilBlast) this.areaBlast(e.owner, e.x, e.y, { ...tr.recoilBlast, fx: 'recoil', groundOnly: true }, e);
    if (tr.rageOnHit) this.rage(e, tr.rageOnHit.mult, tr.rageOnHit.duration);
    if (tr.selfHealOnHit) this.pulseHeal(e, tr.selfHealOnHit, true);
    if (tr.healOnAttack) this.pulseHeal(e, tr.healOnAttack, false);
    if (tr.slowShot) this.slowShot(e, t, tr.slowShot);
    if (e.ability?.pancakes) e.pancakeT += e.ability.pancakes.perHit;
    if (tr.kamikaze) {
      e.x = t.x + (e.x - t.x) * 0.3;
      e.y = t.y + (e.y - t.y) * 0.3;
      e.hp = 0;
      e.dead = true;
      e.selfDestruct = true;
    } else if (tr.rebound && t.kind !== 'unit') {
      // Evo-Rammbock: prallt ab und rammt erneut
      const dx = e.x - t.x;
      const dy = e.y - t.y;
      const l = Math.hypot(dx, dy) || 1;
      e.x += (dx / l) * tr.rebound.distance;
      e.y += (dy / l) * tr.rebound.distance;
      e.locked = false;
      e.charging = true;
      e.chargeDist = tr.charge?.distance || 0;
      e.trampled = new Set();
    }
  },

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
  },

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
        // Mönch: Geschosse prallen zum Absender zurück
        if (target && target.owner !== pr.owner && this.getBuff(target, 'reflect')?.reflectProjectiles && !pr.reflected) {
          const src = this.byId.get(pr.payload.srcId);
          if (src && !src.dead) {
            pr.reflected = true;
            pr.owner = target.owner;
            pr.payload = { ...pr.payload, owner: target.owner, srcId: target.id, onHit: null, splash: 0 };
            pr.targetId = src.id;
            pr.homing = true;
            pr.sx = pr.x;
            pr.sy = pr.y;
            this.events.push(['rf', target.id]);
            keep.push(pr);
            continue;
          }
        }
        this.applyAttack(pr.payload, target, pr.tx, pr.ty);
      } else {
        pr.x += (dx / d) * step;
        pr.y += (dy / d) * step;
        keep.push(pr);
      }
    }
    this.projectiles = keep;
  },

  // ───────────────────────────── Linienangriffe ─────────────────────────────

  /** Geschoss, das eine Strecke abfliegt und alles darauf trifft (Durchschuss, Axt, Felsbrocken, Schrot, Splitter). */
  addLine(src, payload, dx, dy, o) {
    const sx = o.x ?? src.x;
    const sy = o.y ?? src.y;
    const l = {
      id: this.nextId++,
      kind: o.kind || 'magic',
      owner: payload.owner,
      srcId: src?.id || 0,
      sx,
      sy,
      x: sx,
      y: sy,
      dx,
      dy,
      length: o.length,
      width: o.width ?? 0.5,
      speed: o.speed || 10,
      traveled: 0,
      payload,
      knockback: o.knockback || 0,
      returns: !!o.returns,
      phase: 0,
      close: o.close || null,
      hitFirst: !!o.hitFirst,
      hit: new Set(o.exclude || []),
      targets: o.targets || payload.targets,
      noTowers: !!o.noTowers,
      zoneOnPath: o.zoneOnPath || null,
      pathT: 0,
    };
    this.lines.push(l);
    return l;
  },

  updateLines(dt) {
    if (!this.lines.length) return;
    const keep = [];
    for (const l of this.lines) {
      const step = l.speed * dt;
      const x0 = l.x;
      const y0 = l.y;
      if (l.phase === 0) {
        const s = Math.min(step, l.length - l.traveled);
        l.x += l.dx * s;
        l.y += l.dy * s;
        l.traveled += s;
      } else {
        // Rückweg zur Quelle (Scharfrichter-Axt)
        const src = this.byId.get(l.srcId);
        const tx = src && !src.dead ? src.x : l.sx;
        const ty = src && !src.dead ? src.y : l.sy;
        const d = Math.hypot(tx - l.x, ty - l.y);
        if (d <= step) {
          l.x = tx;
          l.y = ty;
          l.traveled = l.length * 2;
        } else {
          l.x += ((tx - l.x) / d) * step;
          l.y += ((ty - l.y) / d) * step;
        }
      }
      let stop = false;
      for (const o of this.entities) {
        if (o.dead || o.owner === l.owner || l.hit.has(o.id) || o.underT > 0) continue;
        if (!affects(l.targets, o)) continue;
        if (l.noTowers && o.kind === 'tower') continue;
        const r = isStruct(o) ? o.half : o.radius;
        if (segDist(o.x, o.y, x0, y0, l.x, l.y) > l.width / 2 + r) continue;
        l.hit.add(o.id);
        let dmg = l.payload.damage;
        let knock = l.knockback;
        // Evo-Scharfrichter: Nahbereich trifft härter
        if (l.close && Math.hypot(o.x - l.sx, o.y - l.sy) <= l.close.dist) {
          dmg = l.close.damage;
          knock = l.close.knockback;
        }
        const amt = o.kind === 'tower' ? dmg * (l.payload.towerDamage ?? 1) : dmg;
        const src = this.byId.get(l.payload.srcId);
        this.damage(o, amt, src, l.owner, { ranged: true });
        if (knock && o.kind === 'unit') this.knockback(o, o.x - l.dx, o.y - l.dy, knock);
        if (l.payload.onHit) this.applyOnHit(l.payload, o, src);
        if (l.hitFirst) {
          stop = true;
          break;
        }
      }
      if (l.zoneOnPath) {
        l.pathT -= dt;
        if (l.pathT <= 0) {
          l.pathT = l.zoneOnPath.every;
          this.addZone(l.owner, l.zoneOnPath.spell, l.x, l.y, {});
        }
      }
      const done = stop || (l.phase === 0 && l.traveled >= l.length - 1e-6 && !l.returns) || l.traveled >= l.length * 2 - 1e-6 || l.x < -1 || l.y < -1 || l.x > ARENA_W + 1 || l.y > ARENA_H + 1;
      if (l.phase === 0 && l.returns && l.traveled >= l.length - 1e-6 && !stop) {
        l.phase = 1;
        l.hit = new Set();
      }
      if (!done) keep.push(l);
      else if (l.onEnd) l.onEnd(l);
    }
    this.lines = keep;
  },

  // ───────────────────────────── Treffer ─────────────────────────────

  /** Schaden eines Angriffs anwenden (Einzelziel oder Fläche) inkl. Treffer-Effekten. */
  applyAttack(p, target, ix, iy) {
    const hits = [];
    if (p.splash > 0) {
      const cx = p.splashSelf ? p.sx : ix;
      const cy = p.splashSelf ? p.sy : iy;
      for (const o of this.entities) {
        if (o.dead || o.owner === p.owner || !affects(p.targets, o)) continue;
        if (o.underT > 0) continue;
        if (surfaceDist(cx, cy, o) <= p.splash) hits.push(o);
      }
    } else if (target && !target.dead) hits.push(target);

    const src = this.byId.get(p.srcId);
    const srcAlive = src && !src.dead;
    let total = 0;
    for (const o of hits) {
      const amt = o.kind === 'tower' ? p.damage * p.towerDamage : p.damage;
      total += this.damage(o, amt, src, p.owner, { melee: p.melee, ranged: !p.melee });
      if (p.knock && o.kind === 'unit') this.knockback(o, p.sx, p.sy, p.knock, p.forceKnock);
      if (p.onHit) this.applyOnHit(p, o, src, target);
    }
    const oh = p.onHit;
    if (oh) {
      if (oh.chain && target) this.chainFrom(p, target, oh.chain, src);
      if (oh.lifesteal && srcAlive && total > 0) this.heal(src, total * oh.lifesteal);
      if (oh.spawn && srcAlive && hits.length) this.spawnOnHit(src, oh.spawn);
    }
    const tr = srcAlive ? src.def.traits : null;
    if (tr) {
      if (tr.shrapnel) this.shrapnel(src, p, ix, iy, target);
      if (tr.bounce && !p.bounced) this.bounceBomb(src, p, ix, iy);
      if (tr.impactSpawn) this.spawnAround(tr.impactSpawn.unit, tr.impactSpawn.count, p.owner, ix, iy, 0.3);
      if (tr.poisonDart && target && !target.dead) this.poisonDart(src, target, tr.poisonDart);
      if (tr.sparkZones) this.sparkZone(p.owner, ix, iy, tr.sparkZones, 'big');
      if (tr.healOnKill && hits.some((o) => o.dead)) this.heal(src, tr.healOnKill);
    }
    // Held Magier: Feuerwirbel am Einschlag
    const fl = srcAlive ? this.getBuff(src, 'flight') : null;
    if (fl?.whirl) {
      const w = fl.whirl;
      this.addZone(p.owner, { radius: w.radius, duration: w.duration, pulse: 0.5, damage: w.damage / 4, towerDamage: w.towerDamage, pull: { speed: w.pull * 2 }, targets: 'both', fx: 'firewhirl' }, ix, iy, {});
    }
    return total;
  },

  applyOnHit(p, o, src, primary = null) {
    const oh = p.onHit;
    if (!oh || o.dead && !oh.curse) return;
    if (oh.stun) this.stun(o, oh.stun, !!oh.freeze);
    if (oh.slow && (!p.troopsOnly || o.kind === 'unit')) this.slow(o, oh.slow.amount, oh.slow.duration);
    if (oh.knockback && o.kind === 'unit') this.knockback(o, p.sx, p.sy, oh.knockback);
    if (oh.curse && o.kind === 'unit') o.curse = { owner: p.owner, unit: oh.curse.unit, until: this.time + oh.curse.duration };
  },

  /** Kettenblitz (Elektrodrache, Elektrogeist): springt vom Ziel auf die nächsten Gegner. */
  chainFrom(p, first, ch, src) {
    const hit = new Set([first.id]);
    const pts = [r2(first.x), r2(first.y)];
    let cur = first;
    const pick = (from, exclude) => {
      let best = null;
      let bd = Infinity;
      for (const o of this.entities) {
        if (o.dead || o.owner === p.owner || exclude.has(o.id) || !affects(p.targets, o) || this.isHidden(o)) continue;
        const d = surfaceDist(from.x, from.y, o);
        if (d <= ch.radius && d < bd) {
          bd = d;
          best = o;
        }
      }
      return best;
    };
    while (hit.size < ch.count) {
      const nx = pick(cur, hit);
      if (!nx) break;
      hit.add(nx.id);
      pts.push(r2(nx.x), r2(nx.y));
      this.damage(nx, nx.kind === 'tower' ? p.damage * p.towerDamage : p.damage, src, p.owner, { ranged: true });
      if (p.onHit?.stun) this.stun(nx, p.onHit.stun);
      cur = nx;
    }
    const sx = src && !src.dead ? src.x : first.x;
    const sy = src && !src.dead ? src.y : first.y;
    this.events.push(['ch', p.owner, r2(sx), r2(sy), pts]);
    // Evo-Elektrodrache: springt endlos weiter (auch mehrfach auf dieselben Ziele)
    if (ch.endless) {
      let n = 0;
      let last = cur;
      let prev = null;
      const bounce = () => {
        if (this.result || n++ >= ch.endless.max) return;
        const alive = this.entities.filter((o) => !o.dead && o.owner !== p.owner && o.kind === 'unit' && !this.isHidden(o) && affects(p.targets, o));
        if (alive.length < 2 || last.dead) return;
        const nx = pick(last, new Set([last.id, ...(prev && alive.length > 2 ? [prev.id] : [])]));
        if (!nx) return;
        this.damage(nx, p.damage * ch.endless.mult, src, p.owner, { ranged: true });
        this.events.push(['ch', p.owner, r2(last.x), r2(last.y), [r2(nx.x), r2(nx.y)]]);
        prev = last;
        last = nx;
        this.later(ch.endless.interval, bounce);
      };
      this.later(ch.endless.interval, bounce);
    }
  },

  /** Feuerwerkerin: Splitter fliegen hinter dem Ziel im Fächer weiter. */
  shrapnel(src, p, ix, iy, primary) {
    const s = src.def.traits.shrapnel;
    const base = Math.atan2(iy - p.sy, ix - p.sx);
    for (let k = 0; k < s.count; k++) {
      const a = base + ((k / Math.max(1, s.count - 1) - 0.5) * s.angle * Math.PI) / 180;
      const l = this.addLine(src, { ...p, splash: 0 }, Math.cos(a), Math.sin(a), {
        x: ix,
        y: iy,
        length: s.length,
        width: s.width,
        speed: 12,
        kind: 'spark',
        exclude: primary ? [primary.id] : [],
      });
      // Evo: Splitter hinterlassen kleine Glutfelder
      if (src.def.traits.sparkZones) l.onEnd = (ln) => this.sparkZone(p.owner, ln.x, ln.y, src.def.traits.sparkZones, 'small');
    }
  },

  sparkZone(owner, x, y, sz, size) {
    const z = sz[size];
    if (!z) return;
    this.addZone(owner, { radius: z.radius, duration: z.duration, pulse: sz.pulse, damage: sz.damage, towerDamage: sz.towerDamage, slow: { amount: sz.slow }, targets: 'both', fx: 'sparks' }, x, y, {});
  },

  /** Evo-Bomber: Die Bombe springt weiter und trifft erneut. */
  bounceBomb(src, p, ix, iy) {
    const b = src.def.traits.bounce;
    let dx = ix - p.sx;
    let dy = iy - p.sy;
    const l = Math.hypot(dx, dy) || 1;
    dx /= l;
    dy /= l;
    for (let k = 1; k <= b.count; k++) {
      const x = clamp(ix + dx * b.distance * k, 0.3, ARENA_W - 0.3);
      const y = clamp(iy + dy * b.distance * k, 0.3, ARENA_H - 0.3);
      this.later(0.3 * k, () => {
        this.applyAttack({ ...p, bounced: true, sx: x, sy: y }, null, x, y);
        this.events.push(['bl', r2(x), r2(y), p.splash, p.owner, 'bomb']);
      });
    }
  },

  /** Evo-Blasrohrkobold: Gift um das Ziel, stärker je öfter dasselbe Ziel getroffen wird. */
  poisonDart(src, t, pd) {
    if (src.poisonTarget !== t.id) {
      src.poisonTarget = t.id;
      src.poisonHits = 0;
    }
    src.poisonHits++;
    let dps = 0;
    for (const [hits, v] of pd.stages) if (src.poisonHits >= hits) dps = v;
    if (!dps) return;
    // ein Giftfeld pro Ziel, das mitwandert und aufgefrischt wird
    let z = this.zones.find((zz) => zz.follow === t.id && zz.owner === src.owner && !zz.done);
    const s = { radius: pd.radius, duration: pd.duration, pulse: 0.25, damage: dps / 4, towerDamage: pd.towerDamage, targets: 'both', fx: 'poison' };
    if (z) {
      z.s = s;
      z.activeT = 0;
      z.nextPulse = 0;
    } else {
      z = this.addZone(src.owner, s, t.x, t.y, {});
      z.follow = t.id;
    }
  },

  /** Evo-Prinzessin: erster und jeder n-te Schuss verlangsamt die Umgebung des Ziels. */
  slowShot(e, t, ss) {
    e.shots = (e.shots || 0) + 1;
    if (!(ss.first && e.shots === 1) && e.shots % ss.every !== (ss.first ? 1 : 0)) return;
    for (const o of this.entities) {
      if (o.dead || o.owner === e.owner || o.kind === 'tower') continue;
      if (surfaceDist(t.x, t.y, o) <= ss.radius) this.slow(o, ss.amount, ss.duration);
    }
    this.events.push(['bl', r2(t.x), r2(t.y), ss.radius, e.owner, 'frost']);
  },

  spawnOnHit(src, sp) {
    // Evo-Skelette: bis zu groupMax Skelette pro Gruppe
    if (sp.groupMax) {
      const n = this.entities.filter((o) => !o.dead && o.groupId === src.groupId && o.owner === src.owner).length;
      if (n >= sp.groupMax) return;
    } else if (src.spawnedCount >= (sp.max ?? 99)) return;
    src.spawnedCount++;
    const out = this.spawnAround(sp.unit, sp.count, src.owner, src.x, src.y, 0.2, { evo: !!sp.evo, groupId: src.groupId });
    for (const o of out) o.cardId = src.cardId;
  },

  // ───────────────────────────── Zweitangriffe ─────────────────────────────

  /** Unabhängige Zweitwaffe (Raketenwerfer, Bola, Rucksack-Speere, Evo-Wutspeer). */
  updateSecondary(e, dt) {
    const s = e.def.traits.secondary;
    e.secCd -= dt * this.attackRate(e);
    if (e.secCd > 0) return;
    const opts = { targets: s.targets, troopsOnly: s.troopsOnly };
    const cands = this.entities
      .filter((o) => this.canTarget(e, o, opts))
      .map((o) => [o, rangeDist(e, o)])
      .filter(([o, d]) => d <= s.range && (!s.minRange || Math.hypot(o.x - e.x, o.y - e.y) >= s.minRange))
      .sort((a, b) => a[1] - b[1]);
    if (!cands.length) {
      e.secCd = 0.1;
      return;
    }
    const shots = s.shots || 1;
    for (let k = 0; k < shots; k++) {
      const t = cands[Math.min(k, cands.length - 1)][0];
      const payload = {
        owner: e.owner,
        srcId: e.id,
        damage: s.damage * (e.dmgMult || 1),
        splash: s.splash || 0,
        sx: e.x,
        sy: e.y,
        targets: s.targets === 'buildings' ? 'ground' : s.targets,
        towerDamage: s.towerDamage ?? 1,
        onHit: s.onHit || null,
        troopsOnly: !!s.troopsOnly,
        secondary: true,
      };
      if (s.impactZone) {
        // Wut-Speer: Spur aus Wut entlang des Wurfs
        const a = Math.atan2(t.y - e.y, t.x - e.x);
        const len = Math.hypot(t.x - e.x, t.y - e.y);
        this.addLine(e, payload, Math.cos(a), Math.sin(a), {
          length: len,
          width: 0.6,
          speed: s.projectile?.speed || 10,
          kind: s.projectile?.kind || 'spear',
          hitFirst: true,
          targets: 'ground',
          zoneOnPath: { every: 0.15, spell: { radius: s.impactZone.radius, duration: s.impactZone.duration, rage: s.impactZone.rage, targets: 'own', fx: 'rageTrail' } },
        });
      } else if (s.projectile && s.projectile.speed > 0) this.spawnProjectile(e, t, payload, s.projectile);
      else this.applyAttack(payload, t, t.x, t.y);
      this.events.push(['a2', e.id, t.id]);
    }
    e.secCd = s.hitSpeed;
  },

  /** Evo-Musketierin: Scharfschüsse geradeaus über die ganze Arena (keine Kronentürme). */
  updateSniper(e, dt) {
    const s = e.def.traits.sniper;
    e.snipeCd = (e.snipeCd ?? 0.5) - dt;
    if (e.snipeCd > 0) return;
    const fwd = forwardDir(e.owner);
    const P = this.attackParams(e);
    // nur, wenn in normaler Reichweite nichts steht
    if (this.entities.some((o) => this.canTarget(e, o) && rangeDist(e, o) <= P.range)) return;
    let best = null;
    let bd = Infinity;
    for (const o of this.entities) {
      if (o.dead || o.owner === e.owner || o.kind === 'tower' || this.isHidden(o)) continue;
      const ahead = (o.y - e.y) * fwd;
      if (ahead < s.minRange || Math.abs(o.x - e.x) > s.width / 2 + o.half) continue;
      if (ahead < bd) {
        bd = ahead;
        best = o;
      }
    }
    if (!best) return;
    e.sniperAmmo--;
    e.snipeCd = s.hitSpeed;
    e.lastAttackT = this.time;
    const payload = { owner: e.owner, srcId: e.id, damage: s.damage, splash: 0, sx: e.x, sy: e.y, targets: 'both', towerDamage: 0, onHit: null };
    this.addLine(e, payload, 0, fwd, { length: ARENA_H, width: s.width, speed: s.speed, kind: 'snipe', hitFirst: true, noTowers: true });
    this.events.push(['a', e.id, best.id]);
  },

  // ───────────────────────────── Schaden ─────────────────────────────

  /**
   * Schaden zufügen. opts: { melee, ranged, spell, spellFx, death, pure } – steuert Parade, Rückschlag, Tesla usw.
   */
  damage(o, amount, src, srcOwner, opts = {}) {
    if (!o || o.dead || !(amount > 0)) return 0;
    if (this.isInvulnerable(o, opts)) return 0;
    const tr = o.def.traits;
    // Evo-Lakaienhorde: der erste Treffer macht kurz unsichtbar und unverwundbar
    if (tr.veil && !o.triggered.veil) {
      o.triggered.veil = true;
      this.addBuff(o, { type: 'veil', until: this.time + tr.veil.duration, invisible: true, invulnerable: true, attackSpeed: tr.veil.attackSpeed });
      this.events.push(['rf', o.id]);
      return 0;
    }
    // Ronin: pariert einen Nahkampftreffer und schlägt doppelt zurück
    if (tr.parry && opts.melee && src && !src.dead && src.kind === 'unit' && !(o.parryCd > 0) && o.deployT <= 0) {
      o.parryCd = tr.parry.cooldown;
      this.events.push(['pa', o.id, src.id]);
      this.damage(src, amount * tr.parry.mult, o, o.owner, { pure: true });
      return 0;
    }
    if (o.glide) this.land(o);
    let mult = this.buffMult(o, 'damageTaken');
    if (tr.armor && (!tr.armor.unlessAttacking || this.time - o.lastAttackT > o.def.hitSpeed + 0.15)) mult *= tr.armor.mult;
    amount *= mult;
    const dealt = amount;
    if (o.shield > 0) {
      // Wie im Original: der Treffer, der den Schild bricht, geht nicht aufs Leben über
      o.shield = Math.max(0, o.shield - amount);
      amount = 0;
      if (o.shield <= 0) this.onShieldBreak(o);
    }
    const minHp = this.buffMax(o, 'minHp');
    o.hp -= amount;
    if (minHp && o.hp < minHp) o.hp = minHp;
    if (src) o.lastHitBy = src.id;
    if (o.kind === 'tower') {
      if (srcOwner === 0 || srcOwner === 1) this.stats[srcOwner].towerDamage += dealt;
      if (o.towerKey === 'king' && !o.active) this.activateKing(o);
      if (this.phase === 'overtime' && this.rules.suddenDeath === 'firstHit' && srcOwner !== o.owner) {
        this.end(1 - o.owner, 'suddenDeath');
      }
    }
    // Elektroriese: Gegenschlag gegen Angreifer in der Nähe
    if (tr.zapBack && src && !src.dead && src.owner !== o.owner && src.kind === 'unit' && !opts.spell && !opts.pure && Math.hypot(src.x - o.x, src.y - o.y) <= tr.zapBack.radius + o.radius) {
      this.damage(src, tr.zapBack.damage, o, o.owner, { pure: true });
      this.stun(src, tr.zapBack.stun);
      this.events.push(['zb', o.id, src.id]);
    }
    if (o.hp <= 0) {
      o.hp = 0;
      o.dead = true;
      if (src && !src.dead) this.onKill(src, o);
    } else this.checkThresholds(o);
    this.events.push(['h', o.id, Math.round(dealt)]);
    return dealt;
  },

  buffMax(e, key) {
    let m = 0;
    for (const b of e.buffs) if (b[key] != null) m = Math.max(m, b[key]);
    return m;
  },

  onShieldBreak(o) {
    this.events.push(['sb', o.id]);
    const sb = o.def.traits.shieldBreak;
    if (sb && !o.triggered.shieldBreak) {
      o.triggered.shieldBreak = true;
      this.areaBlast(o.owner, o.x, o.y, { ...sb, knockback: sb.knockback }, o);
    }
  },

  /** Sieg über eine Einheit (Evo-P.E.K.K.A.: Heilung je nach Größe des Opfers). */
  onKill(src, victim) {
    const kh = src.def.traits.killHeal;
    if (kh && victim.kind !== 'tower') {
      let amt = 0;
      for (const [thr, heal] of kh.steps) {
        amt = heal;
        if (victim.maxHp <= thr) break;
      }
      this.heal(src, amt, kh.maxHp);
      this.events.push(['bl', r2(src.x), r2(src.y), 0.8, src.owner, 'butterfly']);
    }
    if (src.def.traits.ramp?.keep) src.rampKeepT = this.time;
    const w = this.getBuff(src, 'warp');
    if (w && w.targetId === victim.id) this.endWarp(src, w);
  },

  heal(o, amount, maxOverride = 0) {
    if (!o || o.dead || o.kind !== 'unit' || !(amount > 0)) return;
    const cap = Math.max(o.maxHp, maxOverride || 0);
    const before = o.hp;
    o.hp = Math.min(cap, o.hp + amount);
    if (o.hp > before + 0.5) this.events.push(['hl', o.id, Math.round(o.hp - before)]);
  },

  /** Heilung in Impulsen (Kampfheilerin, Evo-Fledermäuse). self=true → nur sich selbst. */
  pulseHeal(e, h, self) {
    const n = h.pulses || 1;
    for (let k = 0; k < n; k++) {
      this.later(k * (h.interval || 0.25), () => {
        if (e.dead && self) return;
        if (self) {
          this.heal(e, h.heal, h.maxHp);
          return;
        }
        for (const o of this.entities) {
          if (o.dead || o.owner !== e.owner || o.kind !== 'unit') continue;
          if (h.excludeSelf && o === e) continue;
          if (h.excludeSame && o.def.key === e.def.key) continue;
          if (Math.hypot(o.x - e.x, o.y - e.y) <= h.radius) this.heal(o, h.heal);
        }
      });
    }
    if (!self) this.events.push(['bl', r2(e.x), r2(e.y), h.radius, e.owner, 'heal']);
  },

  stun(o, t, freeze = false) {
    if (!o || o.dead || !(t > 0) || this.isInvulnerable(o)) return;
    if (o.dash?.active || o.thrown) return;
    o.stunT = Math.max(o.stunT, t);
    if (freeze) o.frozen = true;
    // Betäubung setzt Aufladen, Strahl-Stufen und Ansturm zurück
    o.cd = Math.max(o.cd, o.def.firstHit);
    o.rampT = 0;
    o.rampStage = 0;
    o.charging = false;
    o.chargeDist = 0;
    if (o.dash && !o.dash.active) o.dash = null;
    if (o.leap && !o.leap.active) o.leap = null;
    if (o.hook) o.hook = null;
    if (o.def.traits.attackRamp) {
      o.stage = 0;
      o.stageShots = 0;
    }
  },

  slow(o, amount, duration) {
    if (!o || o.dead) return;
    o.slowAmt = o.slowT > 0 ? Math.max(o.slowAmt, amount) : amount;
    o.slowT = Math.max(o.slowT, duration);
  },

  rage(o, mult, duration) {
    if (!o || o.dead || o.kind === 'tower') return;
    o.rageMult = Math.max(o.rageT > 0 ? o.rageMult : 1, mult);
    o.rageT = Math.max(o.rageT, duration);
  },

  haste(o, mult, duration) {
    if (!o || o.dead || o.kind !== 'unit') return;
    o.hasteMult = Math.max(o.hasteT > 0 ? o.hasteMult || 1 : 1, mult);
    o.hasteT = Math.max(o.hasteT || 0, duration);
  },

  /** Festhalten (Ranken, Netz): kann sich nicht bewegen/angreifen; Flieger werden auf den Boden geholt. */
  root(o, duration, ground = true) {
    if (!o || o.dead || o.kind !== 'unit' || this.isInvulnerable(o)) return;
    o.rootT = Math.max(o.rootT, duration);
    o.cd = Math.max(o.cd, o.def.firstHit);
    o.charging = false;
    o.chargeDist = 0;
    if (ground && o.flying) {
      o.flying = false;
      o.grounded = true;
    }
  },

  activateKing(k) {
    if (k.active || k.dead) return;
    k.active = true;
    this.events.push(['ka', k.id]);
  },

  /** Flächeneffekt um einen Punkt (Aufstell-Explosion, Todesschaden, Fähigkeiten). */
  areaBlast(owner, x, y, b, src) {
    for (const o of this.entities) {
      if (o.dead || o.owner === owner) continue;
      if (b.groundOnly && o.flying) continue;
      if (b.targets && !affects(b.targets, o)) continue;
      if (o.underT > 0) continue;
      if (surfaceDist(x, y, o) > b.radius) continue;
      if (b.damage) this.damage(o, o.kind === 'tower' ? b.damage * (b.towerDamage ?? 1) : b.damage, src, owner, { death: true });
      if (b.stun) this.stun(o, b.stun, !!b.freeze);
      if (b.slow) this.slow(o, b.slow.amount, b.slow.duration);
      if (b.knockback && o.kind === 'unit') this.knockback(o, x, y, b.knockback);
    }
    this.events.push(['bl', r2(x), r2(y), b.radius, owner, b.fx || 'blast']);
  },
};

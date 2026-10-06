// Bewegungs-Bausteine: Laufen/Wegfindung, Ansturm, Sprint (Banditin), Sprung (Megaritter), Haken (Fischer),
// Wurf (Held Riese, Evo-Megaritter), Rückstoß/Ziehen und Kollision. Wird in Match eingemischt.
import { ARENA_W, ARENA_H, RIVER_Y0, RIVER_Y1, BRIDGES, blockedByRiver, halfOf, forwardDir } from '../../shared/arena.js';
import { MODE_GROUND, MODE_JUMP } from './nav.js';
import { r2, clamp, isStruct, surfaceDist, rangeDist, separate, pushOutOfRect } from './geom.js';

function crossesRiver(e) {
  return e.flying || e.def.traits.riverJump || e.def.hover;
}

export const Motion = {
  /** Weglänge unter Berücksichtigung der Brücken (grobe, schnelle Schätzung). */
  pathDistTo(e, x, y) {
    const direct = Math.hypot(x - e.x, y - e.y);
    if (crossesRiver(e)) return direct;
    const he = halfOf(e.y);
    const ht = halfOf(y);
    if (he === -1 || ht === -1 || he === ht) return direct;
    const nearY = he === 0 ? RIVER_Y1 : RIVER_Y0;
    const farY = he === 0 ? RIVER_Y0 : RIVER_Y1;
    let best = Infinity;
    for (const b of BRIDGES) {
      const d = Math.hypot(e.x - b.cx, e.y - nearY) + (RIVER_Y1 - RIVER_Y0) + Math.hypot(x - b.cx, y - farY);
      if (d < best) best = d;
    }
    return best;
  },

  waypoint(e, t) {
    const mode = crossesRiver(e) ? MODE_JUMP : MODE_GROUND;
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
  },

  moveTowards(e, t, dt) {
    let spd = e.def.speed * this.speedMult(e);
    const ch = e.def.traits.charge;
    const chargeOk = ch && (!ch.needsNoShield || e.shield <= 0);
    if (e.charging && chargeOk) spd = ch.speed ?? spd * (ch.speedMult || 2);
    for (const b of e.buffs) if (b.speed != null) spd = b.speed * this.speedMult(e) / (b.speedMult || 1);
    const goal = e.flying ? t : this.waypoint(e, t);
    const dx = goal.x - e.x;
    const dy = goal.y - e.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6) return;
    const step = Math.min(d, spd * dt);
    const x0 = e.x;
    const y0 = e.y;
    e.x += (dx / d) * step;
    e.y += (dy / d) * step;
    e.movedTick = this.tick;
    if (Math.abs(dx) > 0.02) e.fx = dx > 0 ? 1 : -1;
    if (chargeOk && !e.charging) {
      e.chargeDist += step;
      if (e.chargeDist >= ch.distance) {
        e.charging = true;
        e.trampled = new Set();
      }
    }
    // Evo-Rammbock: trifft beim Ansturm alles auf dem Weg
    const tp = e.def.traits.trample;
    if (tp && e.charging) {
      for (const o of this.entities) {
        if (o.dead || o.owner === e.owner || o.kind !== 'unit' || o.flying || e.trampled?.has(o.id)) continue;
        if (surfaceDist(e.x, e.y, o) > e.radius + 0.2) continue;
        e.trampled.add(o.id);
        this.damage(o, tp.damage, e, e.owner);
        this.knockback(o, x0, y0, tp.knockback);
      }
    }
  },

  // ───────────────────────────── Sonderbewegungen ─────────────────────────────

  /** Startet Sprint/Sprung/Haken, wenn ein passendes Ziel im Fenster liegt. true = Bewegung übernommen. */
  trySpecialMove(e, t, d) {
    const tr = e.def.traits;
    if (e.slowAmt >= 0.69) return false; // gefesselt
    const dist = Math.hypot(t.x - e.x, t.y - e.y);
    if (tr.dash && !t.flying && dist >= tr.dash.min && dist <= tr.dash.max) {
      e.dash = { mode: 'bandit', targetId: t.id, windup: tr.dash.windup, active: false, speed: tr.dash.speed, damage: tr.dash.damage };
      this.events.push(['dw', e.id]);
      return true;
    }
    if (tr.leap && t.kind === 'unit' && !t.flying && dist >= tr.leap.min && dist <= tr.leap.max) {
      e.leap = { targetId: t.id, windup: tr.leap.windup, active: false, x0: e.x, y0: e.y, tx: t.x, ty: t.y, t: 0, dur: 0 };
      this.events.push(['dw', e.id]);
      return true;
    }
    if (tr.hook && !t.flying && !(e.hookCd > 0) && dist >= tr.hook.min && dist <= tr.hook.max) {
      e.hook = { targetId: t.id, windup: tr.hook.windup };
      this.events.push(['dw', e.id]);
      return true;
    }
    return false;
  },

  /** Sprint (Banditin, Boss Bandit) und Sprungkette (Goldener Ritter). */
  updateDash(e, dt) {
    const d = e.dash;
    if (d.mode === 'bandit') {
      const t = this.byId.get(d.targetId);
      if (!t || t.dead || this.isHidden(t)) {
        e.dash = null;
        return;
      }
      if (!d.active) {
        if (e.stunT > 0) return;
        d.windup -= dt;
        if (d.windup <= 0) {
          d.active = true;
          d.x0 = e.x;
          d.y0 = e.y;
        }
        return;
      }
      const dx = t.x - e.x;
      const dy = t.y - e.y;
      const dist = Math.hypot(dx, dy);
      const stop = (isStruct(t) ? t.half : t.radius) + e.radius + 0.05;
      const step = d.speed * dt;
      if (dist - stop <= step) {
        e.x = t.x - (dx / dist) * stop;
        e.y = t.y - (dy / dist) * stop;
        this.events.push(['ds', e.id, r2(d.x0), r2(d.y0), r2(e.x), r2(e.y)]);
        this.damage(t, t.kind === 'tower' ? d.damage * (e.def.towerDamage ?? 1) : d.damage, e, e.owner, { melee: true });
        e.dash = null;
        e.locked = true;
        e.targetId = t.id;
        e.cd = e.def.hitSpeed;
        e.lastAttackT = this.time;
      } else {
        e.x += (dx / dist) * step;
        e.y += (dy / dist) * step;
        if (Math.abs(dx) > 0.02) e.fx = dx > 0 ? 1 : -1;
      }
      return;
    }
    // Sprungkette (Goldener Ritter): sucht erst schnell laufend ein Ziel, springt dann von Gegner zu Gegner
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
      if (o.dead || o.owner === e.owner || d.hit.has(o.id) || this.isHidden(o) || o.flying) continue;
      const dd = surfaceDist(e.x, e.y, o);
      if (dd <= d.radius && dd < bd) {
        bd = dd;
        best = o;
      }
    }
    if (!best) {
      if (d.seeking && this.time < d.seekUntil) {
        // noch kein Gegner in Reichweite → schnell weiterlaufen
        d.t = 0;
        const tgt = this.acquireTarget(e);
        if (tgt) this.moveTowards(e, tgt, dt * (d.seekSpeed / Math.max(0.1, e.def.speed)));
        return;
      }
      e.dash = null;
      return;
    }
    d.seeking = false;
    d.active = true;
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
    this.damage(best, best.kind === 'tower' ? d.damage * 0.3 : d.damage, e, e.owner, { melee: true });
    if (best.kind === 'tower') d.left = 0; // endet am Kronenturm
  },

  /** Megaritter: Ausholen, Sprung im Bogen, Landeschlag mit Rückstoß. */
  updateLeap(e, dt) {
    const L = e.leap;
    const tr = e.def.traits.leap;
    if (!L.active) {
      if (e.stunT > 0) return;
      L.windup -= dt;
      const t = this.byId.get(L.targetId);
      if (t && !t.dead) {
        L.tx = t.x;
        L.ty = t.y;
      }
      if (L.windup <= 0) {
        L.active = true;
        L.x0 = e.x;
        L.y0 = e.y;
        L.dur = Math.max(0.25, Math.hypot(L.tx - e.x, L.ty - e.y) / tr.speed);
        L.t = 0;
        this.events.push(['lp', e.id, r2(e.x), r2(e.y), r2(L.tx), r2(L.ty), r2(L.dur)]);
      }
      return;
    }
    L.t += dt;
    const k = Math.min(1, L.t / L.dur);
    e.x = L.x0 + (L.tx - L.x0) * k;
    e.y = L.y0 + (L.ty - L.y0) * k;
    e.jumping = true;
    if (k >= 1) {
      e.leap = null;
      e.jumping = false;
      this.areaBlast(e.owner, e.x, e.y, { damage: tr.damage, radius: tr.radius, knockback: tr.knockback, groundOnly: true, fx: 'slam' }, e);
      e.cd = Math.max(e.cd, 0.3);
    }
  },

  /** Fischer: Haken auswerfen – zieht Truppen heran bzw. sich selbst zu Gebäuden. */
  updateHook(e, dt) {
    const H = e.hook;
    const t = this.byId.get(H.targetId);
    if (!t || t.dead) {
      e.hook = null;
      return;
    }
    if (e.stunT > 0) return;
    H.windup -= dt;
    if (H.windup > 0) return;
    e.hook = null;
    e.hookCd = 3;
    this.events.push(['hk', e.id, t.id, r2(e.x), r2(e.y), r2(t.x), r2(t.y)]);
    if (t.kind === 'unit') {
      // Ziel bis vor den Fischer ziehen
      const dx = e.x - t.x;
      const dy = e.y - t.y;
      const l = Math.hypot(dx, dy) || 1;
      const stop = e.radius + t.radius + 0.2;
      t.x += (dx / l) * Math.max(0, l - stop);
      t.y += (dy / l) * Math.max(0, l - stop);
      t.path = null;
      t.locked = false;
    } else {
      // sich selbst zum Gebäude ziehen
      const dx = t.x - e.x;
      const dy = t.y - e.y;
      const l = Math.hypot(dx, dy) || 1;
      const stop = t.half + e.radius + 0.1;
      e.x += (dx / l) * Math.max(0, l - stop);
      e.y += (dy / l) * Math.max(0, l - stop);
      e.path = null;
    }
    e.locked = true;
    e.targetId = t.id;
    e.cd = Math.max(e.cd, e.def.firstHit);
  },

  /** Geworfene Einheit (Held Riese, Evo-Megaritter): fliegt im Bogen, Aufprallschaden, Betäubung. */
  throwTo(o, x, y, dur, landing = {}, src = null) {
    if (!o || o.dead || o.kind !== 'unit') return;
    x = clamp(x, o.radius, ARENA_W - o.radius);
    y = clamp(y, o.radius, ARENA_H - o.radius);
    o.thrown = { x0: o.x, y0: o.y, x1: x, y1: y, t: 0, dur, landing, srcId: src?.id || 0, srcOwner: src?.owner ?? -1 };
    o.locked = false;
    o.path = null;
    o.charging = false;
    o.dash = null;
    o.leap = null;
    this.events.push(['th', o.id, r2(o.x), r2(o.y), r2(x), r2(y), r2(dur)]);
  },

  updateThrown(o, dt) {
    const T = o.thrown;
    T.t += dt;
    const k = Math.min(1, T.t / T.dur);
    o.x = T.x0 + (T.x1 - T.x0) * k;
    o.y = T.y0 + (T.y1 - T.y0) * k;
    if (k < 1) return;
    o.thrown = null;
    const src = this.byId.get(T.srcId);
    if (T.landing.damage && !o.flying) this.damage(o, T.landing.damage, src, T.srcOwner);
    if (T.landing.stun) this.stun(o, T.landing.stun);
    if (blockedByRiver(o.x, o.y) && !crossesRiver(o)) {
      // im Fluss gelandet → ans nächste Ufer
      o.y = o.y < (RIVER_Y0 + RIVER_Y1) / 2 ? RIVER_Y0 - 0.05 : RIVER_Y1 + 0.05;
    }
  },

  /** Evo-Megaritter: schleudert das Ziel Richtung seines eigenen nächsten Kronenturms. */
  uppercut(e, t, dist) {
    if (t.mass >= 1e5) return;
    let tower = null;
    let bd = Infinity;
    for (const tw of this.towers) {
      if (tw.dead || tw.owner !== t.owner) continue;
      const d = Math.hypot(tw.x - t.x, tw.y - t.y);
      if (d < bd) {
        bd = d;
        tower = tw;
      }
    }
    if (!tower) return;
    const dx = tower.x - t.x;
    const dy = tower.y - t.y;
    const l = Math.hypot(dx, dy) || 1;
    const m = Math.min(dist, Math.max(0, l - tower.half - t.radius - 0.2));
    this.throwTo(t, t.x + (dx / l) * m, t.y + (dy / l) * m, 0.5, {}, e);
  },

  recoilSelf(e, t, dist) {
    const dx = e.x - t.x;
    const dy = e.y - t.y;
    const l = Math.hypot(dx, dy) || 1;
    e.x = clamp(e.x + (dx / l) * dist, e.radius, ARENA_W - e.radius);
    e.y = clamp(e.y + (dy / l) * dist, e.radius, ARENA_H - e.radius);
    e.path = null;
  },

  /** Rückstoß. Schwere Einheiten sind immun (außer force, z. B. Mönch-Kombo). */
  knockback(o, fx, fy, dist, force = false) {
    if (!o || o.dead || o.kind !== 'unit' || o.dash?.active || o.thrown || o.underT > 0) return;
    if (!force && o.mass >= 12) return;
    if (this.getBuff(o, 'reflect')?.immovable) return;
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
    if (o.charging) {
      o.charging = false;
      o.chargeDist = 0;
    }
  },

  pull(o, tx, ty, strength) {
    if (!o || o.dead || o.kind !== 'unit' || o.mass >= 1e5 || o.dash?.active || o.thrown || o.underT > 0) return;
    if (this.getBuff(o, 'reflect')?.immovable) return;
    const dx = tx - o.x;
    const dy = ty - o.y;
    const l = Math.hypot(dx, dy);
    if (l < 0.4) return;
    // Schwere Einheiten werden schwächer gezogen
    const k = o.mass >= 12 ? 0.5 : 1;
    const m = Math.min(strength * k, l - 0.4);
    o.x += (dx / l) * m;
    o.y += (dy / l) * m;
    o.path = null;
  },

  /** Evo-Königsschweinchen: Landen nach dem ersten Angriff/Treffer. */
  land(e) {
    const g = e.glide;
    e.glide = null;
    e.flying = false;
    if (g?.landing) this.areaBlast(e.owner, e.x, e.y, { ...g.landing, groundOnly: true, fx: 'slam' }, e);
  },

  /** Unterirdisch (Großer Gräber, Koboldbohrer-Evo): unverwundbar, wandert zum Ziel. */
  updateUnderground(e, dt) {
    e.underT -= dt;
    const u = e.under;
    if (u) {
      const k = Math.min(1, 1 - e.underT / u.dur);
      e.x = u.x0 + (u.x1 - u.x0) * k;
      e.y = u.y0 + (u.y1 - u.y0) * k;
    }
    if (e.underT <= 0) {
      e.underT = 0;
      e.under = null;
      this.events.push(['dp', e.id]);
      if (e.onSurface) {
        const f = e.onSurface;
        e.onSurface = null;
        f();
      }
    }
  },

  // ───────────────────────────── Kollision ─────────────────────────────

  resolveCollisions() {
    const ground = [];
    const air = [];
    const structs = [];
    for (const e of this.entities) {
      if (e.dead) continue;
      if (e.kind !== 'unit') structs.push(e);
      else if (e.dash?.active || e.leap?.active || e.thrown || e.underT > 0 || e.trappedBy) continue;
      else (e.flying ? air : ground).push(e);
    }
    separate(ground);
    separate(air);
    for (const u of ground) {
      for (const s of structs) pushOutOfRect(u, s);
      if (u.def.traits.riverJump || u.def.hover) {
        u.jumping = u.def.traits.riverJump ? blockedByRiver(u.x, u.y) : false;
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
  },
};

export { rangeDist };

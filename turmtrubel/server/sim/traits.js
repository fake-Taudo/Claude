// Laufende Eigenschaften einer Einheit (Spawner, Elixier, Auren, Tarnung, Netz, Käfig, Verzauberung …),
// Aufstell-Effekte, Schwellen (Verwandlung, Abwurf) und alles, was beim Tod passiert. Wird in Match eingemischt.
import { ARENA_W, ARENA_H, forwardDir, blockedByRiver } from '../../shared/arena.js';
import { TAU, r2, clamp, surfaceDist, rangeDist, formation } from './geom.js';

export const Traits = {
  // ───────────────────────────── Aufstellen ─────────────────────────────

  onDeployed(e) {
    const tr = e.def.traits;
    if (tr.deployBlast) this.areaBlast(e.owner, e.x, e.y, tr.deployBlast, e);
    if (tr.deployHeal) this.pulseHeal(e, tr.deployHeal, false);
    if (tr.glide) e.glide = { ...tr.glide };
    if (tr.barrage) this.barrage(e, tr.barrage);
    if (tr.surfacePulse && !tr.hidden) this.areaBlast(e.owner, e.x, e.y, tr.surfacePulse, e);
    this.events.push(['dp', e.id]);
  },

  /** Evo-Kanone: Kugelhagel in zwei Reihen über die Arena. */
  barrage(e, b) {
    const fwd = forwardDir(e.owner);
    let k = 0;
    for (const [count, dist] of b.rows) {
      for (let i = 0; i < count; i++) {
        const x = ((i + 0.5) / count) * ARENA_W;
        const y = clamp(e.y + fwd * dist, 1, ARENA_H - 1);
        this.later(0.15 * k++, () => this.areaBlast(e.owner, x, y, { damage: b.damage, radius: b.radius, towerDamage: b.towerDamage, knockback: b.knockback, groundOnly: true, fx: 'cannonball' }, e));
      }
    }
  },

  // ───────────────────────────── Laufende Eigenschaften ─────────────────────────────

  /** rootedOnly: festgehaltene Einheiten erzeugen weiter (Spawner), bewegen/angreifen aber nicht. */
  updateTraits(e, dt, rootedOnly = false) {
    const tr = e.def.traits;
    if (tr.spawner) this.updateSpawner(e, dt, tr.spawner);
    if (tr.elixirGen) {
      e.genT -= dt;
      if (e.genT <= 0) {
        e.genT += tr.elixirGen.interval;
        this.addElixir(e.owner, tr.elixirGen.amount, e.x, e.y);
      }
    }
    if (rootedOnly) return;
    if (tr.aura) this.updateAura(e, tr.aura);
    if (tr.enchant) this.updateEnchant(e, tr.enchant, dt);
    if (tr.stealth) {
      e.revealT += dt;
      e.hidden = tr.stealth.always || e.revealT > tr.stealth.reveal;
      if (!e.hidden && tr.stealth.onReveal && !e.revealSpawned) {
        e.revealSpawned = true;
        this.revealSpawn(e, tr.stealth.onReveal);
      }
      if (e.hidden) {
        e.revealSpawned = false;
        // Seelensoldaten verschwinden nach der Kampfpause
        if (tr.stealth.vanish && e.revealT > tr.stealth.reveal + 0.5) {
          e.dead = true;
          e.expired = true;
        }
      }
    }
    if (tr.hidden && e.kind !== 'unit') this.updateHidden(e, tr);
    if (tr.net) this.updateNet(e, tr.net, dt);
    if (tr.trap) this.updateTrap(e, tr.trap, dt);
    if (tr.freezeAura) {
      for (const o of this.entities) {
        if (o.dead || o.owner === e.owner || o.kind === 'tower') continue;
        if (surfaceDist(e.x, e.y, o) <= tr.freezeAura.radius) this.stun(o, 0.3, true);
      }
    }
    if (e.ability?.pancakes) e.pancakeT += dt;
  },

  updateSpawner(e, dt, s) {
    if (s.belowHp && e.hp > e.maxHp * s.belowHp) return;
    if (s.enemyInRange) {
      // Koboldhütte: nur, wenn Gegner in Reichweite sind
      const near = this.entities.some((o) => !o.dead && o.owner !== e.owner && o.kind === 'unit' && !this.isHidden(o) && surfaceDist(e.x, e.y, o) <= s.enemyInRange);
      if (!near) {
        e.spawnT = Math.max(e.spawnT, s.firstDelay ?? 0.5);
        return;
      }
    }
    e.spawnT -= dt * (e.rageMult || 1);
    if (e.spawnT > 0) return;
    const attacking = s.attackingInterval && this.time - e.lastAttackT < e.def.hitSpeed + 0.5;
    e.spawnT += attacking ? s.attackingInterval : s.interval;
    const fwd = forwardDir(e.owner);
    const spawn = (k) => {
      if (e.dead && e.kind !== 'unit') return;
      let x = e.x;
      let y = e.y;
      if (e.kind !== 'unit') y += fwd * (e.half + 0.6);
      else if (s.side) x += (k % 2 ? 1 : -1) * (e.radius + 0.6);
      else if (e.kind === 'unit' && s.count === 1) y += fwd * (e.radius + 0.4);
      const out = this.spawnAround(s.unit, s.stagger ? 1 : s.count, e.owner, x, y, 0.4, { spawnedBy: e.id, evo: !!s.evo });
      for (const o of out) o.spawnWave = e.spawnWaves || 0;
    };
    e.spawnWaves = (e.spawnWaves || 0) + 1;
    if (s.stagger) for (let k = 0; k < s.count; k++) this.later(k * s.stagger, () => spawn(k));
    else spawn(0);
  },

  /** Evo-Drachenbaby: Windstoß – Gegner langsamer, Verbündete schneller. */
  updateAura(e, a) {
    if (a.whileAttacking && this.time - e.lastAttackT > e.def.hitSpeed + 0.2) return;
    this.auraTick(e.owner, e.x, e.y, a);
    e.auraT = this.time;
  },

  auraTick(owner, x, y, a) {
    for (const o of this.entities) {
      if (o.dead || o.kind !== 'unit') continue;
      if (Math.abs(o.x - x) > a.halfW || Math.abs(o.y - y) > a.halfH) continue;
      if (o.owner === owner) this.haste(o, a.allySpeed, 0.3);
      else this.slow(o, a.enemySlow, 0.3);
    }
  },

  /** Rune Giant: verzaubert die nächsten verbündeten Truppen (jeder n-te Angriff mit Bonusschaden). */
  updateEnchant(e, en, dt) {
    e.enchantT = (e.enchantT || 0) - dt;
    if (e.enchantT > 0) return;
    e.enchantT = 0.5;
    const mine = this.entities.filter((o) => !o.dead && o.enchant?.by === e.id);
    if (mine.length >= en.count) return;
    const cands = this.entities
      .filter((o) => !o.dead && o !== e && o.owner === e.owner && o.kind === 'unit' && !o.enchant && !o.def.traits.kamikaze && o.def.damage > 0 && !o.clone)
      .map((o) => [o, Math.hypot(o.x - e.x, o.y - e.y)])
      .filter(([, d]) => d <= en.range)
      .sort((a, b) => a[1] - b[1]);
    for (const [o] of cands.slice(0, en.count - mine.length)) {
      o.enchant = { by: e.id, every: en.every, bonus: en.bonus, hits: 0, until: 0 };
      this.events.push(['en', e.id, o.id]);
    }
  },

  /** Tesla: versenkt, solange kein Gegner in Reichweite ist (Evo: Impuls beim Auftauchen). */
  updateHidden(e, tr) {
    const near = this.entities.some((o) => !o.dead && o.owner !== e.owner && o.kind === 'unit' && !this.isHidden(o) && affects(e.def.targets, o) && rangeDist(e, o) <= e.def.range);
    if (e.hidden && near) {
      e.hidden = false;
      e.cd = Math.max(e.cd, e.def.firstHit);
      this.events.push(['su', e.id]);
      if (tr.surfacePulse) this.areaBlast(e.owner, e.x, e.y, tr.surfacePulse, e);
    } else if (!e.hidden && !near && !e.locked) {
      e.hiddenT = (e.hiddenT || 0) + this.dt;
      if (e.hiddenT > 0.5) {
        e.hidden = true;
        e.hiddenT = 0;
      }
    } else e.hiddenT = 0;
  },

  /** Evo-Jäger: Netz auf die nächste Truppe – festgehalten, Flieger auf dem Boden. */
  updateNet(e, n, dt) {
    e.netCd = (e.netCd ?? 1) - dt;
    if (e.netCd > 0) return;
    let best = null;
    let bd = Infinity;
    for (const o of this.entities) {
      if (o.dead || o.owner === e.owner || o.kind !== 'unit' || this.isHidden(o)) continue;
      const d = rangeDist(e, o);
      if (d <= n.range && d < bd) {
        bd = d;
        best = o;
      }
    }
    if (!best) return;
    e.netCd = n.interval;
    this.root(best, n.duration, true);
    this.events.push(['nt', e.id, best.id]);
  },

  /** Evo-Koboldkäfig: zieht eine Bodentruppe hinein und schadet ihr, bis Käfig oder Ziel fallen. */
  updateTrap(e, t, dt) {
    let held = e.trapId && this.byId.get(e.trapId);
    if (held && held.dead) {
      e.trapId = 0;
      held = null;
    }
    if (!held) {
      let best = null;
      let bd = Infinity;
      for (const o of this.entities) {
        if (o.dead || o.owner === e.owner || o.kind !== 'unit' || o.flying || this.isHidden(o) || o.trappedBy) continue;
        const d = surfaceDist(e.x, e.y, o);
        if (d <= t.range && d < bd) {
          bd = d;
          best = o;
        }
      }
      if (!best) return;
      held = best;
      e.trapId = best.id;
      best.trappedBy = e.id;
      best.x = e.x;
      best.y = e.y;
      e.trapCd = 0.3;
      this.events.push(['tp', best.id, r2(best.x), r2(best.y), r2(e.x), r2(e.y)]);
    }
    held.x = e.x;
    held.y = e.y;
    held.rootT = Math.max(held.rootT, 0.2);
    e.trapCd = (e.trapCd ?? 0) - dt;
    if (e.trapCd <= 0) {
      e.trapCd = t.hitSpeed;
      this.damage(held, t.damage, e, e.owner);
      this.events.push(['a', e.id, held.id]);
    }
  },

  /** Evo-Königsgeist: beim Sichtbarwerden zwei Seelensoldaten mit Landeschaden. */
  revealSpawn(e, r) {
    const out = this.spawnAround(r.unit, r.count, e.owner, e.x, e.y, 0.2, { groupId: e.groupId });
    if (r.landing) this.areaBlast(e.owner, e.x, e.y, { ...r.landing, fx: 'ghost' }, e);
    return out;
  },

  /** Schwellen beim Schaden: Abwurf, Verwandlung, Auftauchen an anderer Stelle. */
  checkThresholds(o) {
    const tr = o.def.traits;
    const frac = o.hp / o.maxHp;
    if (tr.dropAt && !o.triggered.dropAt && frac <= tr.dropAt.at) {
      o.triggered.dropAt = true;
      const d = tr.dropAt;
      this.addZone(o.owner, { delay: 0.6, radius: d.radius, damage: d.damage, knockback: 0.6, targets: 'both', fx: 'barrel', spawn: { unit: d.unit, count: d.count, deployTime: 0.3 } }, o.x, o.y, {});
    }
    if (tr.transform && !o.triggered.transform && frac <= tr.transform.at) {
      o.triggered.transform = true;
      this.later(0, () => this.transformInto(o, tr.transform.into));
    }
    if (tr.resurface) {
      const idx = tr.resurface.at.findIndex((a, i) => frac <= a && !o.triggered['rs' + i]);
      if (idx >= 0) {
        o.triggered['rs' + idx] = true;
        this.resurface(o, tr.resurface);
      }
    }
  },

  /** Kanonenkarre → feste Kanone, Goblin Demolisher → Kamikaze-Läufer (Leben bleibt). */
  transformInto(o, ref) {
    if (o.dead) return;
    const def = this.db.unit(ref, false, o.levelBonus);
    const n = this.addEntity(def, o.owner, o.x, o.y, { deployTime: 0, cardId: o.cardId, groupId: o.groupId });
    n.hp = Math.min(o.hp, def.hp);
    // Mit Lebensdauer: verliert seine restlichen Leben gleichmäßig (z. B. 904 / 15 s bei der Kanonenkarre)
    if (def.lifetime > 0) n.maxHp = Math.max(n.hp, 1);
    n.fx = o.fx;
    o.dead = true;
    o.removed = false;
    o.silentDeath = true;
    this.events.push(['tr', o.id, n.id]);
  },

  /** Evo-Koboldbohrer: taucht ab und an anderer Stelle (um den nächsten Kronenturm) wieder auf. */
  resurface(o, r) {
    this.spawnAround(r.unit, 1, o.owner, o.x, o.y, 0.3);
    const tower = this.towers.filter((t) => !t.dead && t.owner !== o.owner).sort((a, b) => Math.hypot(a.x - o.x, a.y - o.y) - Math.hypot(b.x - o.x, b.y - o.y))[0];
    let x = o.x;
    let y = o.y;
    if (tower && Math.hypot(tower.x - o.x, tower.y - o.y) < tower.half + 4) {
      // 90° um den Turm weiterwandern
      const a = Math.atan2(o.y - tower.y, o.x - tower.x) + Math.PI / 2;
      const R = tower.half + o.half + 0.3;
      x = clamp(tower.x + Math.cos(a) * R, o.half, ARENA_W - o.half);
      y = clamp(tower.y + Math.sin(a) * R, o.half, ARENA_H - o.half);
    }
    o.underT = 0.8;
    o.under = { x0: o.x, y0: o.y, x1: x, y1: y, dur: 0.8 };
    o.onSurface = () => {
      if (o.def.traits.deployBlast) this.areaBlast(o.owner, o.x, o.y, o.def.traits.deployBlast, o);
    };
    this.structDirty = true;
  },

  // ───────────────────────────── Erzeugen ─────────────────────────────

  spawnAround(ref, count, owner, x, y, deployTime = 0.5, opts = {}) {
    const def = this.db.unit(ref, !!opts.evo, opts.levelBonus || 0);
    const offs = formation(count, def.radius);
    const flip = owner === 0 ? 1 : -1;
    const out = [];
    for (const [ox, oy] of offs) {
      if (this.entities.length >= this.maxEntities) break;
      let px = clamp(x + ox * flip, def.radius, ARENA_W - def.radius);
      let py = clamp(y + oy * flip, def.radius, ARENA_H - def.radius);
      if (!def.flying && !def.isBuilding && blockedByRiver(px, py)) py = py < 16 ? 14.9 - def.radius : 17.1 + def.radius;
      const e = this.addEntity(def, owner, px, py, { deployTime, evo: !!opts.evo && def.evo, groupId: opts.groupId || 0, clone: !!opts.clone, cardId: opts.cardId });
      if (opts.spawnedBy) e.spawnedBy = opts.spawnedBy;
      out.push(e);
    }
    return out;
  },

  // ───────────────────────────── Tod ─────────────────────────────

  processDeaths() {
    let any = false;
    for (let i = 0; i < this.entities.length; i++) {
      const e = this.entities[i];
      if (!e.dead || e.removed) continue;
      e.removed = true;
      any = true;
      if (!e.silentDeath) this.onDeath(e);
      if (e.kind !== 'unit') this.structDirty = true;
      if (e.kind === 'tower') this.onTowerDestroyed(e);
      if (e.championOf) this.maybeReturnChampion(e);
      this.events.push(['d', e.id, e.typeIdx, e.owner, r2(e.x), r2(e.y), e.flying ? 1 : 0, e.silentDeath ? 1 : 0]);
    }
    if (!any) return;
    const alive = [];
    for (const e of this.entities) {
      if (e.removed) this.byId.delete(e.id);
      else alive.push(e);
    }
    this.entities = alive;
  },

  onDeath(e) {
    const tr = e.def.traits;
    const byAttack = e.selfDestruct;
    if (e.cast) this.refundCast(e);
    if (tr.hatch && e.expired) this.spawnAround(tr.hatch.unit, 1, e.owner, e.x, e.y, 0.5, { cardId: e.cardId });
    if (tr.deathDamage && !(tr.deathDamage.notOnAttack && byAttack)) {
      const dd = tr.deathDamage;
      if (dd.delay) this.addZone(e.owner, { ...dd, targets: dd.targets || 'both' }, e.x, e.y, { bomb: true });
      else this.areaBlast(e.owner, e.x, e.y, dd, e);
    }
    const spawns = Array.isArray(tr.deathSpawn) ? tr.deathSpawn : tr.deathSpawn ? [tr.deathSpawn] : [];
    for (const ds of spawns) {
      if (ds.notOnAttack && byAttack) continue;
      if (e.clone) continue;
      this.spawnAround(ds.unit, ds.count, e.owner, e.x, e.y, 0.3, { evo: !!ds.evo, cardId: e.cardId });
    }
    if (tr.deathSpell) this.addZone(e.owner, tr.deathSpell, e.x, e.y, { evo: e.evo });
    if (tr.deathElixir && !e.clone) this.addElixir(1 - e.owner, tr.deathElixir, e.x, e.y);
    if (tr.deathElixirSelf && !e.expired) this.addElixir(e.owner, tr.deathElixirSelf, e.x, e.y);
    // Fluch (Hexenmutter, Goblin Curse): verfluchte Truppe wird zum Diener des Fluchers
    if (e.curse && e.kind === 'unit' && !e.clone) {
      const c = e.curse;
      this.spawnAround(c.unit, 1, c.owner, e.x, e.y, 0.4);
      this.events.push(['bl', r2(e.x), r2(e.y), 0.8, c.owner, 'curse']);
    }
    // Evo-Skelettarmee: Schatten kämpfen weiter, solange General Gerry lebt
    if (tr.shadowOnDeath && e.groupId) {
      const leader = this.entities.find((o) => !o.dead && o.groupId === e.groupId && o.def.key === tr.shadowOnDeath.leader);
      if (leader) this.spawnAround(tr.shadowOnDeath.unit, 1, e.owner, e.x, e.y, 0.2, { groupId: e.groupId });
    }
    if (e.def.key === 'general-gerry' && e.groupId) {
      for (const o of this.entities) if (!o.dead && o.groupId === e.groupId && o.def.key === 'shadow-skeleton') o.dead = true;
    }
    // Evo-Hexe: Tod eigener Skelette heilt sie (nur die ersten n je Welle)
    if (e.spawnedBy) {
      const w = this.byId.get(e.spawnedBy);
      const mh = w && !w.dead ? w.def.traits.minionHeal : null;
      if (mh) {
        w.healCount = w.healCount || {};
        const k = e.spawnWave || 0;
        if ((w.healCount[k] || 0) < mh.perWave) {
          w.healCount[k] = (w.healCount[k] || 0) + 1;
          this.heal(w, mh.heal, mh.maxHp);
        }
      }
    }
    // Evo-Koboldkäfig: Gefangene kommen frei
    if (e.trapId) {
      const held = this.byId.get(e.trapId);
      if (held) held.trappedBy = 0;
    }
    if (e.trappedBy) {
      const cage = this.byId.get(e.trappedBy);
      if (cage) cage.trapId = 0;
    }
    // Skelettkönig: jede gefallene Truppe ist eine Seele
    if (e.kind === 'unit' && !e.clone && !e.summoned) {
      for (const k of this.entities) {
        if (k.dead || !k.def.traits.souls) continue;
        k.souls = Math.min(k.def.traits.souls.max, k.souls + 1);
      }
    }
    // Rune Giant tot → Verzauberung hält noch kurz
    if (tr.enchant) {
      for (const o of this.entities) if (o.enchant?.by === e.id) o.enchant.until = this.time + (tr.enchant.linger || 0);
    }
  },

  /** Champion kehrt in den Kartenzyklus zurück, wenn alle seine Teile gefallen sind. */
  maybeReturnChampion(e) {
    const p = this.players[e.owner];
    if (p.championOut !== e.championOf) return;
    if (this.entities.some((o) => !o.dead && o !== e && o.championOf === e.championOf && o.owner === e.owner)) return;
    p.queue.push(p.championOut);
    p.championOut = null;
  },

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
  },
};

function affects(targets, o) {
  if (targets === 'both' || !targets) return true;
  if (targets === 'air') return !!o.flying;
  return !o.flying;
}

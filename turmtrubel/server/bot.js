// Trainingsgegner. Spielt über dieselbe Schnittstelle wie ein Mensch (match.play),
// d. h. alle Server-Prüfungen (Elixier, Platzierung, Handkarte, Eingabe-Limit) gelten auch für ihn.
//
// Schwierigkeitsstufen:
//   medium – das bisherige Verhalten (unverändert, durch test/classic-regression.test.js abgesichert)
//   easy   – reagiert langsamer, verteidigt manchmal gar nicht, spart länger, platziert ungenauer
//   hard   – reagiert schnell, wählt Konter passend zur Bedrohung, nutzt Zauber nur mit Wert,
//            unterstützt eigene Tanks (Push) und lässt kein Elixier verfallen
// minGap: Mindestabstand zwischen zwei Aktionen in Sekunden (z. B. Unendlich-Elixier), damit der Bot die
// Arena nicht mit unmenschlichem Tempo flutet. Der Bot sieht nur, was ein Spieler auch sieht (Stufe Leicht/Schwer
// ignorieren unterirdische und getarnte Einheiten).
import { BRIDGES, halfOf, ARENA_W } from '../shared/arena.js';
import { mulberry32 } from './sim/rng.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class Bot {
  constructor(match, side, seed = 1234, opts = {}) {
    this.m = match;
    this.difficulty = opts.difficulty || 'medium';
    this.minGap = opts.minGap || 0;
    this.lastAct = -99;
    this.side = side; // Spieler (Sitz): Hand, Elixier, Eingaben
    this.team = match.teamOf ? match.teamOf[side] : side; // Team: Spielhälfte, Freund/Feind
    this.rng = mulberry32(seed);
    this.next = 2 + this.rng() * 2;
    this.saveUp = 7;
    this.lane = this.rng() < 0.5 ? 0 : 1;
  }

  update() {
    const m = this.m;
    if (!m.started || m.result || m.time < this.next) return;
    if (this.minGap && m.time - this.lastAct < this.minGap) return;
    if (this.difficulty === 'easy') return this.updateEasy();
    if (this.difficulty === 'hard') return this.updateHard();
    this.next = m.time + 0.45 + this.rng() * 0.9;
    const side = this.side;
    const p = m.players[side];
    this.tryAbility();

    // Kosten wie beim Menschen über den Server (Spiegel, Spirit Empress); der Spiegel spielt wie seine Vorlage
    const hand = p.hand
      .map((id, i) => {
        const card = m.db.card(id);
        const cost = card ? m.costOf(side, card) : null;
        return { id, i, card: card ? m.effectiveCard(side, card) : null, raw: card, cost };
      })
      .filter((h) => h.card && h.cost != null && h.cost <= p.elixir && m.time >= p.handReady[h.i]);
    if (!hand.length) return;

    const threats = m.entities.filter(
      (e) => !e.dead && e.owner !== this.team && e.kind === 'unit' && (halfOf(e.y) === this.team || this.depth(e.y) > -4),
    );
    if (threats.length && this.defend(threats, hand)) return;
    if (p.elixir >= this.saveUp || (m.elixirMultiplier() > 1 && p.elixir >= 5)) {
      if (this.attack(hand)) this.saveUp = 6 + Math.floor(this.rng() * 4);
    }
  }

  /** Wie weit ist y in meine Hälfte eingedrungen (positiv = auf meiner Seite)? */
  depth(y) {
    return this.team === 0 ? y - 17 : 15 - y;
  }

  ownY(depth) {
    return this.team === 0 ? 17 + depth : 15 - depth;
  }

  tryPlay(h, x, y) {
    const m = this.m;
    for (let k = 0; k < 6; k++) {
      const jx = k ? (this.rng() - 0.5) * 2.5 : 0;
      const jy = k ? (this.rng() - 0.5) * 2.5 : 0;
      const px = clamp(Math.round((x + jx) * 2) / 2, 0.5, ARENA_W - 0.5);
      const py = Math.round((y + jy) * 2) / 2;
      if (m.canPlace(this.side, h.card, px, py)) {
        const ok = m.play(this.side, h.i, h.id, px, py).ok;
        if (ok) this.lastAct = m.time;
        return ok;
      }
    }
    return false;
  }

  unitOf(card) {
    return card.type === 'spell' ? null : this.m.db.unit(this.m.db.unitRefOf(card));
  }

  /** Grobe Zauber-Einordnung für die Bot-Entscheidungen. */
  spellKind(card) {
    const s = card.spell;
    if (!s) return null;
    if (s.ownSide) return 'own'; // Baumstamm, Fässer, Königliche Lieferung
    if (s.spawn || s.graveyard) return 'push'; // Koboldfass, Friedhof
    if (s.clone || (s.rage && !s.damage)) return 'support';
    if (s.damage || s.pulse || s.voidTiers || s.vines) return 'damage';
    return 'support';
  }

  defend(threats, hand) {
    const m = this.m;
    // gefährlichste Bedrohung = am tiefsten eingedrungen
    threats.sort((a, b) => this.depth(b.y) - this.depth(a.y));
    const t = threats[0];
    const near = threats.filter((o) => Math.hypot(o.x - t.x, o.y - t.y) < 3);
    const hpSum = near.reduce((s, o) => s + o.hp, 0);

    // Schwarm → Flächenzauber
    if (near.length >= 3) {
      const spell = hand.find((h) => this.spellKind(h.card) === 'damage' && (h.card.spell.radius || 0) >= 2.5);
      if (spell) {
        const cx = near.reduce((s, o) => s + o.x, 0) / near.length;
        const cy = near.reduce((s, o) => s + o.y, 0) / near.length;
        if (this.tryPlay(spell, cx, cy)) return true;
      }
    }
    if (this.depth(t.y) < 1 && hpSum < 600) return false; // noch zu weit weg / harmlos

    // Rollende Zauber und Lieferungen landen auf der eigenen Seite direkt vor der Bedrohung
    if (!t.flying && this.depth(t.y) > 0.5) {
      const own = hand.find((h) => this.spellKind(h.card) === 'own');
      if (own && this.tryPlay(own, t.x, t.y + (this.team === 0 ? 2 : -2))) return true;
    }

    const flying = t.flying;
    const troops = hand.filter((h) => {
      if (h.card.type === 'spell' || h.card.forms) return false;
      const u = this.unitOf(h.card);
      if (u.targets === 'buildings' || !u.damage) return h.card.type === 'building' && !flying && !u.damage && this.rng() < 0.3;
      if (flying) return u.targets === 'both' || u.targets === 'air';
      return true;
    });
    if (!troops.length) return false;
    const pick = troops[Math.floor(this.rng() * troops.length)];
    if (pick.card.type === 'building') return this.tryPlay(pick, clamp(t.x, 6, 12), this.ownY(5));
    const back = this.team === 0 ? 1 : -1;
    const y = clamp(t.y + back * 3, this.team === 0 ? 17.5 : 0.5, this.team === 0 ? 31.5 : 14.5);
    return this.tryPlay(pick, t.x + (this.rng() - 0.5) * 2, y);
  }

  attack(hand) {
    const m = this.m;
    // Tower-Finisher mit Zauber
    const enemyTowers = m.towers.filter((t) => !t.dead && t.owner !== this.team);
    for (const h of hand) {
      if (this.spellKind(h.card) !== 'damage' || !h.card.spell.damage || h.card.spell.pulse) continue;
      const dmg = h.card.spell.damage * (h.card.spell.towerDamage ?? 1);
      const tw = enemyTowers.find((t) => t.hp <= dmg);
      if (tw && this.tryPlay(h, tw.x, tw.y)) return true;
    }
    // Koboldfass/Friedhof direkt auf den nächsten Gegnerturm
    const push = hand.find((h) => this.spellKind(h.card) === 'push');
    if (push && enemyTowers.length && this.rng() < 0.5) {
      const tw = enemyTowers.filter((t) => t.towerKey === 'princess')[this.lane] || enemyTowers[0];
      if (this.tryPlay(push, tw.x, tw.y + (this.team === 0 ? 2 : -2))) return true;
    }
    // Wut/Klon nur, wenn eigene Truppen vorne stehen
    const support = hand.find((h) => this.spellKind(h.card) === 'support');
    if (support) {
      const mine = m.entities.filter((e) => !e.dead && e.owner === this.team && e.kind === 'unit' && this.depth(e.y) < -2);
      if (mine.length >= 2) {
        const cx = mine.reduce((s, o) => s + o.x, 0) / mine.length;
        const cy = mine.reduce((s, o) => s + o.y, 0) / mine.length;
        if (this.tryPlay(support, cx, cy)) return true;
      }
    }
    const troops = hand.filter((h) => h.card.type === 'troop');
    if (!troops.length) {
      const b = hand.find((h) => h.card.type === 'building');
      return b ? this.tryPlay(b, 9 + (this.rng() - 0.5) * 6, this.ownY(6)) : false;
    }
    // Gebäudejäger/Tanks bevorzugen
    troops.sort((a, b) => {
      const ua = this.unitOf(a.card);
      const ub = this.unitOf(b.card);
      const sa = (ua.targets === 'buildings' ? 2 : 0) + ua.hp / 2000;
      const sb = (ub.targets === 'buildings' ? 2 : 0) + ub.hp / 2000;
      return sb - sa + (this.rng() - 0.5);
    });
    const pick = troops[0];
    if (this.rng() < 0.3) this.lane = 1 - this.lane;
    const bx = BRIDGES[this.lane].cx;
    if (pick.cost >= 5) return this.tryPlay(pick, this.lane ? 12 : 6, this.ownY(13));
    return this.tryPlay(pick, bx, this.ownY(1.5));
  }

  tryAbility() {
    const m = this.m;
    const e = m.abilityEntity(this.side);
    if (!e || e.deployT > 0) return;
    const ab = e.ability;
    if (e.abilityCd > 0 || e.abilityUses <= 0 || m.players[this.side].elixir < (ab.cost || 0) + 1) return;
    const R = ab.radius || ab.dash?.radius || ab.shots?.radius || 4;
    const foes = m.entities.filter((o) => !o.dead && o.owner !== this.team && Math.hypot(o.x - e.x, o.y - e.y) <= R);
    const hurt = e.hp < e.maxHp * 0.5;
    if (foes.length >= 2 || (foes.length && hurt) || (ab.buff && foes.some((f) => f.kind !== 'unit'))) m.useAbility(this.side);
  }

  // ───────────────────────── Leicht ─────────────────────────

  /** Spielbare Handkarten (wie im Standard). */
  playable() {
    const m = this.m;
    const side = this.side;
    const p = m.players[side];
    return p.hand
      .map((id, i) => {
        const card = m.db.card(id);
        const cost = card ? m.costOf(side, card) : null;
        return { id, i, card: card ? m.effectiveCard(side, card) : null, raw: card, cost };
      })
      .filter((h) => h.card && h.cost != null && h.cost <= p.elixir && m.time >= p.handReady[h.i]);
  }

  /** Sichtbare gegnerische Einheiten (keine unterirdischen oder getarnten). */
  visibleFoes() {
    const m = this.m;
    return m.entities.filter((e) => !e.dead && e.owner !== this.team && !(e.underT > 0) && !m.isHidden(e));
  }

  updateEasy() {
    const m = this.m;
    this.next = m.time + 1.1 + this.rng() * 1.4;
    const p = m.players[this.side];
    const hand = this.playable();
    if (!hand.length) return;
    const threats = this.visibleFoes().filter((e) => e.kind === 'unit' && this.depth(e.y) > 1.5);
    // verteidigt spät und nicht immer
    if (threats.length && this.rng() < 0.65 && this.defend(threats, hand)) return;
    if (p.elixir >= Math.max(this.saveUp, 8)) {
      const pick = hand[Math.floor(this.rng() * hand.length)];
      if (pick.card.type === 'spell') return;
      if (this.rng() < 0.3) this.lane = 1 - this.lane;
      const x = 3 + this.rng() * 12;
      if (this.tryPlay(pick, x, this.ownY(2 + this.rng() * 8))) this.saveUp = 8 + Math.floor(this.rng() * 3);
    }
  }

  // ───────────────────────── Schwer ─────────────────────────

  updateHard() {
    const m = this.m;
    this.next = m.time + 0.3 + this.rng() * 0.45;
    const p = m.players[this.side];
    this.tryAbility();
    const hand = this.playable();
    if (!hand.length) return;
    const foes = this.visibleFoes();
    const threats = foes.filter((e) => e.kind === 'unit' && this.depth(e.y) > -2.5);
    if (threats.length && this.defendHard(threats, hand, foes)) return;
    if (this.finisher(hand)) return;
    if (this.supportPush(hand)) return;
    const leak = p.elixir >= 9.4;
    const surge = m.elixirMultiplier() > 1 && p.elixir >= 6;
    if (leak || surge || p.elixir >= 8) {
      if (this.startPush(hand, leak)) return;
    }
  }

  unitScore(h, group, hpSum, flying) {
    const u = this.unitOf(h.card);
    if (!u || u.targets === 'buildings') return -Infinity;
    if (flying && !(u.targets === 'both' || u.targets === 'air')) return -Infinity;
    if (!flying && u.targets === 'air') return -Infinity;
    if (!(u.damage > 0)) return -Infinity;
    const count = this.m.countOf(h.card);
    const dps = (u.damage * count) / Math.max(0.3, u.hitSpeed || 1);
    let s = 0;
    if (hpSum >= 1400) s += dps / 90 + (h.card.type === 'building' ? 2 : 0);
    else s += dps / 160;
    if (group >= 3) s += (u.splash || 0) > 0 ? 3.5 : count >= 3 ? -1 : 0;
    s += Math.min(u.hp * count, 2500) / 1200;
    s -= h.cost * 0.45;
    return s;
  }

  defendHard(threats, hand, foes) {
    threats.sort((a, b) => this.depth(b.y) - this.depth(a.y));
    const t = threats[0];
    const near = threats.filter((o) => Math.hypot(o.x - t.x, o.y - t.y) < 3.5);
    const hpSum = near.reduce((s, o) => s + o.hp + (o.shield || 0), 0);
    const deep = this.depth(t.y);
    if (deep < 0.5 && hpSum < 1200) return false; // noch nicht über der Brücke – Turm zieht zuerst
    // Flächenzauber nur mit Wert (mehrere Ziele oder viele Lebenspunkte im Radius)
    const spells = hand.filter((h) => this.spellKind(h.card) === 'damage' && h.card.spell.damage);
    for (const sp of spells) {
      const r = sp.card.spell.radius || 2.5;
      const hit = foes.filter((o) => o.kind === 'unit' && Math.hypot(o.x - t.x, o.y - t.y) <= r);
      const kills = hit.filter((o) => o.hp <= sp.card.spell.damage).length;
      if (kills >= 3 || (kills >= 2 && sp.cost <= 3)) {
        const cx = hit.reduce((s, o) => s + o.x, 0) / hit.length;
        const cy = hit.reduce((s, o) => s + o.y, 0) / hit.length;
        if (this.tryPlay(sp, cx, cy)) return true;
      }
    }
    if (!t.flying && deep > 0.5) {
      const own = hand.find((h) => this.spellKind(h.card) === 'own');
      if (own && near.length >= 2 && this.tryPlay(own, t.x, t.y + (this.team === 0 ? 2 : -2))) return true;
    }
    const flying = near.some((o) => o.flying);
    let best = null;
    let bestS = -Infinity;
    for (const h of hand) {
      if (h.card.type === 'spell' || h.card.forms) continue;
      const sc = this.unitScore(h, near.length, hpSum, flying);
      if (sc > bestS) {
        bestS = sc;
        best = h;
      }
    }
    if (!best) return false;
    if (best.card.type === 'building') return this.tryPlay(best, clamp(t.x, 7, 11), this.ownY(4.5));
    const u = this.unitOf(best.card);
    const ranged = (u.range || 0) >= 3;
    const back = this.team === 0 ? 1 : -1;
    // Fernkämpfer mit Abstand hinter die Bedrohung, Nahkämpfer direkt davor (zieht sie zur Mitte)
    const dy = ranged ? 4.5 : 2;
    const x = ranged ? t.x : clamp(t.x + (t.x < 9 ? 1.5 : -1.5), 1, 17);
    const y = clamp(t.y + back * dy, this.team === 0 ? 17.5 : 0.5, this.team === 0 ? 31.5 : 14.5);
    return this.tryPlay(best, x, y);
  }

  finisher(hand) {
    const enemyTowers = this.m.towers.filter((t) => !t.dead && t.owner !== this.team);
    for (const h of hand) {
      if (this.spellKind(h.card) !== 'damage' || !h.card.spell.damage || h.card.spell.pulse) continue;
      const dmg = h.card.spell.damage * (h.card.spell.towerDamage ?? 1);
      const tw = enemyTowers.find((t) => t.hp <= dmg);
      if (tw && this.tryPlay(h, tw.x, tw.y)) return true;
    }
    return false;
  }

  /** Eigene Tanks/Win-Conditions auf dem Weg zur Brücke mit Unterstützung versorgen. */
  supportPush(hand) {
    const m = this.m;
    const lead = m.entities.find((e) => !e.dead && e.pl === this.side && e.kind === 'unit' && (e.def.targets === 'buildings' || e.hp >= 2000) && this.depth(e.y) > -4 && this.depth(e.y) < 8);
    if (!lead || m.players[this.side].elixir < 4) return false;
    const support = hand
      .filter((h) => h.card.type === 'troop' && !h.card.forms)
      .map((h) => ({ h, u: this.unitOf(h.card) }))
      .filter(({ u }) => u && u.targets !== 'buildings' && u.damage > 0 && (u.range || 0) >= 3);
    if (!support.length) return false;
    support.sort((a, b) => a.h.cost - b.h.cost);
    const back = this.team === 0 ? 1 : -1;
    return this.tryPlay(support[0].h, lead.x, clamp(lead.y + back * 2.5, this.team === 0 ? 17.5 : 0.5, this.team === 0 ? 31.5 : 14.5));
  }

  startPush(hand, leak) {
    const enemyTowers = this.m.towers.filter((t) => !t.dead && t.owner !== this.team && t.towerKey === 'princess');
    // schwächere Lane angreifen
    if (enemyTowers.length) {
      const weak = enemyTowers.reduce((a, b) => (b.hp < a.hp ? b : a));
      this.lane = weak.lane;
    }
    const push = hand.find((h) => this.spellKind(h.card) === 'push');
    if (push && !leak) {
      const tw = enemyTowers.find((t) => t.lane === this.lane) || this.m.towers.find((t) => !t.dead && t.owner !== this.team);
      if (tw && this.tryPlay(push, tw.x, tw.y + (this.team === 0 ? 2 : -2))) return true;
    }
    const troops = hand.filter((h) => h.card.type === 'troop' && !h.card.forms);
    const win = troops.filter((h) => this.unitOf(h.card)?.targets === 'buildings');
    const tanks = troops.filter((h) => (this.unitOf(h.card)?.hp || 0) * this.m.countOf(h.card) >= 1800);
    const bx = BRIDGES[this.lane].cx;
    if (win.length) {
      const h = win.sort((a, b) => b.cost - a.cost)[0];
      if (h.cost >= 5) return this.tryPlay(h, this.lane ? 12 : 6, this.ownY(13));
      return this.tryPlay(h, bx, this.ownY(1.5));
    }
    if (tanks.length) return this.tryPlay(tanks[0], this.lane ? 12 : 6, this.ownY(12));
    if (leak) {
      // Elixier nicht verfallen lassen: günstigste Karte hinten ablegen
      const cheap = hand.filter((h) => h.card.type !== 'spell').sort((a, b) => a.cost - b.cost)[0];
      if (cheap) return this.tryPlay(cheap, this.lane ? 13 : 5, this.ownY(11));
    }
    return false;
  }
}

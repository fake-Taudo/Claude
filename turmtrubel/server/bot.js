// Einfacher Trainingsgegner. Spielt über dieselbe Schnittstelle wie ein Mensch (match.play),
// d. h. alle Server-Prüfungen (Elixier, Platzierung, Handkarte) gelten auch für ihn.
import { BRIDGES, halfOf, ARENA_W } from '../shared/arena.js';
import { mulberry32 } from './sim/rng.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class Bot {
  constructor(match, side, seed = 1234) {
    this.m = match;
    this.side = side;
    this.rng = mulberry32(seed);
    this.next = 2 + this.rng() * 2;
    this.saveUp = 7;
    this.lane = this.rng() < 0.5 ? 0 : 1;
  }

  update() {
    const m = this.m;
    if (!m.started || m.result || m.time < this.next) return;
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
      (e) => !e.dead && e.owner !== side && e.kind === 'unit' && (halfOf(e.y) === side || this.depth(e.y) > -4),
    );
    if (threats.length && this.defend(threats, hand)) return;
    if (p.elixir >= this.saveUp || (m.elixirMultiplier() > 1 && p.elixir >= 5)) {
      if (this.attack(hand)) this.saveUp = 6 + Math.floor(this.rng() * 4);
    }
  }

  /** Wie weit ist y in meine Hälfte eingedrungen (positiv = auf meiner Seite)? */
  depth(y) {
    return this.side === 0 ? y - 17 : 15 - y;
  }

  ownY(depth) {
    return this.side === 0 ? 17 + depth : 15 - depth;
  }

  tryPlay(h, x, y) {
    const m = this.m;
    for (let k = 0; k < 6; k++) {
      const jx = k ? (this.rng() - 0.5) * 2.5 : 0;
      const jy = k ? (this.rng() - 0.5) * 2.5 : 0;
      const px = clamp(Math.round((x + jx) * 2) / 2, 0.5, ARENA_W - 0.5);
      const py = Math.round((y + jy) * 2) / 2;
      if (m.canPlace(this.side, h.card, px, py)) {
        return m.play(this.side, h.i, h.id, px, py).ok;
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
      if (own && this.tryPlay(own, t.x, t.y + (this.side === 0 ? 2 : -2))) return true;
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
    const back = this.side === 0 ? 1 : -1;
    const y = clamp(t.y + back * 3, this.side === 0 ? 17.5 : 0.5, this.side === 0 ? 31.5 : 14.5);
    return this.tryPlay(pick, t.x + (this.rng() - 0.5) * 2, y);
  }

  attack(hand) {
    const m = this.m;
    // Tower-Finisher mit Zauber
    const enemyTowers = m.towers.filter((t) => !t.dead && t.owner !== this.side);
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
      if (this.tryPlay(push, tw.x, tw.y + (this.side === 0 ? 2 : -2))) return true;
    }
    // Wut/Klon nur, wenn eigene Truppen vorne stehen
    const support = hand.find((h) => this.spellKind(h.card) === 'support');
    if (support) {
      const mine = m.entities.filter((e) => !e.dead && e.owner === this.side && e.kind === 'unit' && this.depth(e.y) < -2);
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
    const foes = m.entities.filter((o) => !o.dead && o.owner !== this.side && Math.hypot(o.x - e.x, o.y - e.y) <= R);
    const hurt = e.hp < e.maxHp * 0.5;
    if (foes.length >= 2 || (foes.length && hurt) || (ab.buff && foes.some((f) => f.kind !== 'unit'))) m.useAbility(this.side);
  }
}

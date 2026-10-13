// Draft-Modi: Triple Draft (gleichzeitig 1 aus 3, acht Runden) und Mega Draft (gemeinsamer Pool, abwechselnd).
// Alles serverseitig und seed-basiert: gleicher Seed + gleiche Wahl = gleiche Angebote (reproduzierbar für Tests).
// Der Server prüft jede Wahl; Clients schicken nur die gewünschte Karten-ID.
import { DECK_SIZE, EVO_SLOTS, SPECIAL_SLOT, targetsAir } from '../shared/cards.js';
import { DRAFT_REJECTS } from '../shared/protocol.js';
import { mulberry32 } from './sim/rng.js';

const fail = (code) => ({ ok: false, code, message: DRAFT_REJECTS[code] });

/** Karten-Rollen für Garantien, Auto-Pick und Bot-Logik. */
export function cardTraits(db, card) {
  const special = card.class === 'champion' || card.class === 'hero';
  let air = false;
  let winCon = false;
  let tank = false;
  let splash = false;
  if (card.type === 'spell') air = targetsAir(db, card);
  else {
    const u = db.unit(db.unitRefOf(card));
    air = targetsAir(db, card);
    winCon = card.type === 'troop' && u.targets === 'buildings';
    tank = card.type === 'troop' && u.hp * (card.count || 1) >= 2500;
    splash = (u.splash || 0) > 0;
  }
  return {
    id: card.id,
    type: card.type,
    cls: card.class,
    special,
    elixir: card.elixirRule === 'mirror' ? 4 : card.elixir,
    mirror: card.elixirRule === 'mirror',
    air,
    spell: card.type === 'spell',
    building: card.type === 'building',
    winCon,
    tank,
    splash,
    rarity: card.rarity,
  };
}

/** Spielbarkeit eines (entstehenden) Decks: was fehlt noch? */
export function deckNeeds(db, ids) {
  const t = ids.map((id) => cardTraits(db, db.card(id)));
  const needs = [];
  if (!t.some((c) => c.air)) needs.push('air');
  if (!t.some((c) => c.spell || c.building)) needs.push('spellOrBuilding');
  return needs;
}

const meets = (db, need, id) => {
  const t = cardTraits(db, db.card(id));
  return need === 'air' ? t.air : need === 'spellOrBuilding' ? t.spell || t.building : true;
};

/**
 * Draft-Deck in Slot-Form bringen: Champion/Held in den Spezialplatz, Evo-Plätze nur mit Evo-Karten,
 * wenn Evolutionen erlaubt sind – sonst mit Karten ohne Evo-Version, soweit möglich.
 */
export function arrangeDeck(db, ids, { allowEvos = false } = {}) {
  const slots = new Array(DECK_SIZE).fill(null);
  const rest = ids.slice();
  const take = (pred) => {
    const i = rest.findIndex((id) => pred(db.card(id)));
    return i >= 0 ? rest.splice(i, 1)[0] : null;
  };
  const sp = take((c) => c.class === 'champion') || take((c) => c.class === 'hero');
  if (sp) slots[SPECIAL_SLOT] = sp;
  for (const i of EVO_SLOTS) slots[i] = (allowEvos ? take((c) => !!c.evo && c.class === 'normal') : take((c) => !c.evo)) || null;
  for (let i = 0; i < DECK_SIZE; i++) if (!slots[i]) slots[i] = rest.shift() || null;
  return slots;
}

function shuffleInPlace(a, rng) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class BaseDraft {
  constructor(db, cfg, { seats = 2, seed = 1 } = {}) {
    this.db = db;
    this.cfg = cfg;
    this.seats = seats;
    this.seed = seed;
    this.rng = mulberry32(seed);
    this.picks = Array.from({ length: seats }, () => []);
    this.done = false;
    this.log = []; // [seat, card, auto]
  }

  count(seat, cls) {
    return this.picks[seat].filter((id) => this.db.card(id).class === cls).length;
  }

  /** Grundregeln für jede Wahl: kein Duplikat, Champion-/Heldenlimit, Held nicht mit Grundkarte. */
  ruleFor(seat, id) {
    const c = this.db.card(id);
    if (!c) return 'NOT_OFFERED';
    const mine = this.picks[seat];
    if (mine.includes(id)) return 'TAKEN';
    if (c.class === 'champion' && this.count(seat, 'champion') >= (this.cfg.maxChampionsPerDeck ?? 1)) return 'CHAMPION_LIMIT';
    if (c.class === 'hero' && this.count(seat, 'hero') >= (this.cfg.maxHeroesPerDeck ?? 1)) return 'HERO_LIMIT';
    const base = this.db.heroBase(id);
    if (base && mine.includes(base)) return 'CONFLICT';
    if (mine.some((m) => this.db.heroBase(m) === id)) return 'CONFLICT';
    return null;
  }

  /** Zufällige erlaubte Wahl; fehlt dem Deck sonst etwas Wichtiges, wird das bevorzugt. */
  autoChoice(seat, candidates) {
    const allowed = candidates.filter((id) => !this.ruleFor(seat, id));
    if (!allowed.length) return null;
    const needs = deckNeeds(this.db, this.picks[seat]);
    const left = this.picksLeft(seat);
    if (needs.length && left <= needs.length + 1) {
      const good = allowed.filter((id) => meets(this.db, needs[0], id));
      if (good.length) return good[Math.floor(this.rng() * good.length)];
    }
    return allowed[Math.floor(this.rng() * allowed.length)];
  }

  decks() {
    return this.picks.map((ids) => arrangeDeck(this.db, ids, { allowEvos: !!this.cfg.allowEvos }));
  }
}

// ───────────────────────────── Triple Draft ─────────────────────────────

export class TripleDraft extends BaseDraft {
  constructor(db, cfg, opts) {
    super(db, cfg, opts);
    this.kind = 'triple';
    this.rounds = cfg.rounds ?? 8;
    this.pool = db.cards.filter((c) => c.class === 'normal' || c.class === 'champion' || c.class === 'hero').map((c) => c.id);
    // Jeder Spieler wählt in seinem eigenen Tempo: eigenes Angebot, eigene Runde
    this.offers = Array.from({ length: this.seats }, (_, seat) => this.makeOffer(seat));
  }

  /** Runde (0-basiert), in der ein Spieler gerade wählt. */
  roundOf(seat) {
    return Math.min(this.picks[seat].length, this.rounds - 1);
  }

  finished(seat) {
    return this.picks[seat].length >= this.rounds;
  }

  picksLeft(seat) {
    return this.rounds - this.picks[seat].length;
  }

  /** Angebot für einen Spieler: k verschiedene erlaubte Karten, höchstens ein Champion/Held, mit Spielbarkeits-Schutz. */
  makeOffer(seat) {
    const db = this.db;
    const k = this.cfg.offer ?? 3;
    const cands = this.pool.filter((id) => !this.ruleFor(seat, id));
    const offer = [];
    const drawFrom = (list) => {
      const free = list.filter((id) => !offer.includes(id) && !(offer.some((o) => db.card(o).class !== 'normal') && db.card(id).class !== 'normal'));
      if (!free.length) return null;
      // Champions/Helden seltener anbieten (sonst kommen sie in fast jeder Runde)
      for (let tries = 0; tries < 4; tries++) {
        const id = free[Math.floor(this.rng() * free.length)];
        if (db.card(id).class === 'normal' || this.rng() < 0.35) return id;
      }
      const normal = free.filter((id) => db.card(id).class === 'normal');
      return normal.length ? normal[Math.floor(this.rng() * normal.length)] : free[0];
    };
    const needs = this.cfg.playabilityGuard === false ? [] : deckNeeds(db, this.picks[seat]);
    const left = this.picksLeft(seat);
    if (needs.length && left <= needs.length) {
      // letzte Gelegenheit: alles im Angebot erfüllt den ersten offenen Bedarf
      const good = cands.filter((id) => meets(db, needs[0], id));
      while (offer.length < k) {
        const id = drawFrom(good) ?? drawFrom(cands);
        if (!id) break;
        offer.push(id);
      }
      return offer;
    }
    while (offer.length < k) {
      const id = drawFrom(cands);
      if (!id) break;
      offer.push(id);
    }
    // Rechtzeitig mindestens eine passende Karte anbieten, ohne das Angebot vorhersehbar zu machen
    if (needs.length && left <= needs.length + 2 && !offer.some((id) => needs.some((n) => meets(db, n, id)))) {
      const good = cands.filter((id) => !offer.includes(id) && meets(db, needs[0], id));
      if (good.length) offer[offer.length - 1] = good[Math.floor(this.rng() * good.length)];
    }
    return offer;
  }

  /** Spieler, die noch Karten wählen müssen (unabhängig voneinander). */
  pending() {
    if (this.done) return [];
    return this.picks.map((p, i) => (p.length < this.rounds ? i : -1)).filter((i) => i >= 0);
  }

  pick(seat, id, auto = false) {
    if (this.done) return fail('NOT_DRAFTING');
    if (!(seat >= 0 && seat < this.seats)) return fail('NOT_DRAFTING');
    if (this.finished(seat)) return fail('ALREADY_PICKED');
    if (typeof id !== 'string' || !this.offers[seat].includes(id)) return fail('NOT_OFFERED');
    const bad = this.ruleFor(seat, id);
    if (bad) return fail(bad);
    this.picks[seat].push(id);
    this.log.push([seat, id, auto]);
    // nächstes eigenes Angebot sofort – der andere kann noch in einer früheren Runde sein
    this.offers[seat] = this.finished(seat) ? [] : this.makeOffer(seat);
    if (this.picks.every((p) => p.length >= this.rounds)) this.done = true;
    return { ok: true, advanced: true };
  }

  autoPick(seat) {
    const id = this.autoChoice(seat, this.offers[seat]) ?? this.offers[seat][0];
    return this.pick(seat, id, true);
  }

  /**
   * Was dieser Spieler sehen darf: eigenes Angebot und eigene Picks, vom Gegner die aktuellen Optionen und nur
   * die ANZAHL seiner Picks (welche Karte er genommen hat, bleibt bis zum Reveal verborgen).
   */
  stateFor(seat) {
    return {
      kind: 'triple',
      round: this.roundOf(seat),
      rounds: this.rounds,
      offer: this.offers[seat].slice(),
      picks: this.picks[seat].slice(),
      mineDone: this.finished(seat),
      oppOffers: this.offers.map((o, i) => (i === seat ? null : o.slice())),
      oppCounts: this.picks.map((p, i) => (i === seat ? null : p.length)),
      done: this.done,
    };
  }
}

// ───────────────────────────── Mega Draft ─────────────────────────────

/**
 * Pool aus poolSize Karten: genau `champions` Champions, Rest reguläre Karten (Truppen, Zauber, Gebäude),
 * keine Helden, keine Duplikate, Mindestwerte aus poolMinimums. Seed-basiert.
 */
export function generateMegaPool(db, cfg, rng) {
  const M = cfg.poolMinimums || {};
  const cheapMax = M.cheapMaxElixir ?? 3;
  const champs = db.cards.filter((c) => c.class === 'champion').map((c) => c.id);
  const regular = db.cards.filter((c) => c.class === 'normal' && ['troop', 'spell', 'building'].includes(c.type)).map((c) => c.id);
  const nChamp = Math.min(cfg.champions ?? 3, champs.length);
  const nReg = (cfg.poolSize ?? 40) - nChamp;
  const tr = new Map(regular.map((id) => [id, cardTraits(db, db.card(id))]));
  const cats = [
    ['spells', M.spells ?? 0, (t) => t.spell],
    ['buildings', M.buildings ?? 0, (t) => t.building],
    ['air', M.air ?? 0, (t) => t.air],
    ['cheap', M.cheap ?? 0, (t) => !t.mirror && t.elixir <= cheapMax],
  ];
  for (let attempt = 0; attempt < 200; attempt++) {
    const chosen = [];
    const has = new Set();
    const add = (id) => {
      chosen.push(id);
      has.add(id);
    };
    for (const [, min, pred] of cats) {
      let n = chosen.filter((id) => pred(tr.get(id))).length;
      const pool = shuffleInPlace(regular.filter((id) => !has.has(id) && pred(tr.get(id))), rng);
      while (n < min && pool.length && chosen.length < nReg) {
        add(pool.pop());
        n++;
      }
    }
    const rest = shuffleInPlace(regular.filter((id) => !has.has(id)), rng);
    while (chosen.length < nReg && rest.length) add(rest.pop());
    const c = shuffleInPlace(champs.slice(), rng).slice(0, nChamp);
    const pool = [...c, ...shuffleInPlace(chosen, rng)];
    if (checkMegaPool(db, cfg, pool).ok) return pool;
  }
  throw new Error('Mega-Draft: kein gültiger Pool gefunden');
}

/** Prüft einen Mega-Draft-Pool gegen alle Regeln (auch für Tests). */
export function checkMegaPool(db, cfg, pool) {
  const M = cfg.poolMinimums || {};
  const cheapMax = M.cheapMaxElixir ?? 3;
  const errors = [];
  const cards = pool.map((id) => db.card(id));
  if (pool.length !== (cfg.poolSize ?? 40)) errors.push(`Pool hat ${pool.length} Karten`);
  if (new Set(pool).size !== pool.length) errors.push('doppelte Karten');
  if (cards.some((c) => !c)) errors.push('unbekannte Karte');
  const valid = cards.filter(Boolean);
  const champions = valid.filter((c) => c.class === 'champion').length;
  if (champions !== (cfg.champions ?? 3)) errors.push(`${champions} Champions`);
  if (valid.some((c) => c.class === 'hero')) errors.push('Held im Pool');
  const reg = valid.filter((c) => c.class === 'normal');
  if (reg.length + champions !== valid.length) errors.push('unerlaubte Kartenklasse');
  const t = reg.map((c) => cardTraits(db, c));
  const cnt = (p) => t.filter(p).length;
  if (cnt((x) => !x.mirror && x.elixir <= cheapMax) < (M.cheap ?? 0)) errors.push('zu wenige günstige Karten');
  if (cnt((x) => x.air) < (M.air ?? 0)) errors.push('zu wenige Karten gegen Luft');
  if (cnt((x) => x.spell) < (M.spells ?? 0)) errors.push('zu wenige Zauber');
  if (cnt((x) => x.building) < (M.buildings ?? 0)) errors.push('zu wenige Gebäude');
  if (new Set(reg.map((c) => c.rarity)).size < (M.rarities ?? 0)) errors.push('zu wenige Seltenheiten');
  return { ok: errors.length === 0, errors };
}

export class MegaDraft extends BaseDraft {
  constructor(db, cfg, opts) {
    super(db, { ...cfg, allowEvos: false, maxHeroesPerDeck: 0 }, opts);
    this.kind = 'mega';
    this.perPlayer = cfg.picksPerPlayer ?? 8;
    this.pool = generateMegaPool(db, cfg, this.rng);
    this.takenBy = new Map();
    this.first = this.rng() < 0.5 ? 0 : 1;
    this.turn = this.first;
  }

  picksLeft(seat) {
    return this.perPlayer - this.picks[seat].length;
  }

  pending() {
    return this.done ? [] : [this.turn];
  }

  /** Erlaubte Karten für einen Spieler (frei + Champion-Regel). */
  allowedFor(seat) {
    return this.pool.filter((id) => !this.takenBy.has(id) && !this.ruleFor(seat, id));
  }

  pick(seat, id, auto = false) {
    if (this.done) return fail('NOT_DRAFTING');
    if (seat !== this.turn) return fail('NOT_YOUR_TURN');
    if (typeof id !== 'string' || !this.pool.includes(id)) return fail('NOT_OFFERED');
    if (this.takenBy.has(id)) return fail('TAKEN');
    const bad = this.ruleFor(seat, id);
    if (bad) return fail(bad);
    this.takenBy.set(id, seat);
    this.picks[seat].push(id);
    this.log.push([seat, id, auto]);
    // abwechselnd, bis jeder perPlayer Karten hat
    const next = (seat + 1) % this.seats;
    if (this.picks.every((p) => p.length >= this.perPlayer)) this.done = true;
    else this.turn = this.picks[next].length < this.perPlayer ? next : seat;
    return { ok: true, advanced: true };
  }

  autoPick(seat) {
    const id = this.autoChoice(seat, this.allowedFor(seat));
    return this.pick(seat, id, true);
  }

  stateFor(seat) {
    return {
      kind: 'mega',
      pool: this.pool.slice(),
      taken: [...this.takenBy.entries()],
      turn: this.done ? -1 : this.turn,
      first: this.first,
      perPlayer: this.perPlayer,
      picks: this.picks.map((p) => p.slice()),
      allowed: this.done ? [] : this.allowedFor(seat),
      done: this.done,
    };
  }
}

export function createDraft(db, cfg, opts) {
  if (cfg.kind === 'triple') return new TripleDraft(db, cfg, opts);
  if (cfg.kind === 'mega') return new MegaDraft(db, cfg, opts);
  throw new Error('Unbekannte Draft-Art: ' + cfg.kind);
}

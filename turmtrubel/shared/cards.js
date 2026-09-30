// Kartendatenbank: Aufbau, Auflösung von Einheiten (inkl. Evo) und Deck-Regeln.
// Wird von Server und Client identisch verwendet.

export const DECK_SIZE = 8;
export const EVO_SLOTS = Object.freeze([0, 1]);
export const SPECIAL_SLOT = 2;
export const HAND_SIZE = 4;

export const TYPE_LABELS = Object.freeze({ troop: 'Truppe', spell: 'Zauber', building: 'Gebäude' });
export const CLASS_LABELS = Object.freeze({ normal: 'Karte', champion: 'Champion', hero: 'Held' });
export const RARITY_ORDER = Object.freeze(['common', 'rare', 'epic', 'legendary']);
export const TARGET_LABELS = Object.freeze({
  ground: 'Boden',
  air: 'Luft',
  both: 'Boden & Luft',
  buildings: 'Gebäude',
});

const UNIT_DEFAULTS = Object.freeze({
  hp: 100,
  damage: 0,
  hitSpeed: 1,
  range: 0.6,
  minRange: 0,
  sight: 5.5,
  speed: 1,
  targets: 'ground',
  flying: false,
  radius: 0.45,
  mass: 4,
  deployTime: 1,
  splash: 0,
  splashSelf: false,
  towerDamage: 1,
  projectile: null,
  lifetime: 0,
  size: 0,
});

function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function deepMerge(a, b) {
  const out = { ...(a || {}) };
  for (const [k, v] of Object.entries(b || {})) {
    out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out;
}

/** Baut aus dem Roh-JSON (cards.json) die Laufzeit-Datenbank. */
export function createDb(raw) {
  if (!raw || !Array.isArray(raw.cards)) throw new Error('cards.json: "cards" fehlt');
  const cards = raw.cards.map((c) => ({ class: 'normal', count: 1, ...c }));
  const byId = new Map(cards.map((c) => [c.id, c]));
  const tokens = raw.tokens || {};
  const typeList = ['tower_king', 'tower_princess', ...cards.map((c) => c.id), ...Object.keys(tokens)];
  const typeIndex = new Map(typeList.map((k, i) => [k, i]));
  const unitCache = new Map();
  const db = {
    raw,
    cards,
    byId,
    tokens,
    typeList,
    typeIndex,
    rarities: raw.rarities || {},
    card(id) {
      return byId.get(id) || null;
    },
    unit(ref, evo = false) {
      const key = evo ? ref + '#evo' : ref;
      let d = unitCache.get(key);
      if (!d) {
        d = resolveUnit(db, ref, evo);
        unitCache.set(key, d);
      }
      return d;
    },
    spell(card, evo = false) {
      return evo && card.evo && card.evo.spell ? deepMerge(card.spell, card.evo.spell) : card.spell;
    },
    /** Referenz der Einheit, die eine Truppen-/Gebäudekarte erzeugt */
    unitRefOf(card) {
      return typeof card.unit === 'string' ? card.unit : card.id;
    },
  };
  return db;
}

/** Löst eine Einheiten-Referenz (Karten-ID oder Token-ID) in flache Werte auf. */
export function resolveUnit(db, ref, evo = false) {
  let raw;
  let card = null;
  let isBuilding = false;
  if (db.tokens[ref]) {
    raw = db.tokens[ref];
    isBuilding = raw.type === 'building';
  } else {
    card = db.byId.get(ref);
    if (!card) throw new Error('Unbekannte Einheit: ' + ref);
    if (card.type === 'spell') throw new Error('Zauber ist keine Einheit: ' + ref);
    if (typeof card.unit === 'string') return resolveUnit(db, card.unit, false);
    raw = card.unit;
    isBuilding = card.type === 'building';
    if (evo && card.evo && card.evo.unit) raw = deepMerge(raw, card.evo.unit);
  }
  const d = deepMerge(UNIT_DEFAULTS, raw);
  d.traits = { ...(raw.traits || {}) };
  d.look = { ...(raw.look || {}) };
  d.key = ref;
  d.name = (evo && card?.evo?.name) || card?.name || raw.name || ref;
  d.cardId = card ? card.id : null;
  d.class = card ? card.class || 'normal' : 'normal';
  d.ability = card ? card.ability || null : null;
  d.isBuilding = isBuilding;
  d.evo = !!(evo && card && card.evo);
  if (isBuilding) {
    d.size = raw.size ?? 2;
    d.radius = d.size / 2;
    d.speed = 0;
    d.mass = 1e9;
    d.sight = d.range;
  }
  d.firstHit = raw.firstHit ?? Math.min(d.hitSpeed * 0.5, 0.8);
  return d;
}

export function cardKind(card) {
  if (!card) return null;
  if (card.class === 'champion') return 'champion';
  if (card.class === 'hero') return 'hero';
  return card.type;
}

export function isSpecial(card) {
  return !!card && (card.class === 'champion' || card.class === 'hero');
}

/** Prüft ein Deck (Array mit 8 Karten-IDs, Slot-Semantik siehe EVO_SLOTS/SPECIAL_SLOT). */
export function validateDeck(db, slots) {
  const errors = [];
  if (!Array.isArray(slots) || slots.length !== DECK_SIZE) {
    return { ok: false, errors: ['Ein Deck braucht genau 8 Karten.'] };
  }
  const seen = new Set();
  let specials = 0;
  slots.forEach((id, i) => {
    if (typeof id !== 'string' || !id) {
      errors.push(`Platz ${i + 1} ist leer.`);
      return;
    }
    const card = db.byId.get(id);
    if (!card) {
      errors.push(`Unbekannte Karte: ${String(id).slice(0, 30)}`);
      return;
    }
    if (seen.has(id)) errors.push(`${card.name} ist doppelt im Deck.`);
    seen.add(id);
    if (isSpecial(card)) {
      specials++;
      if (i !== SPECIAL_SLOT) errors.push(`${card.name} darf nur in den Champion/Held-Platz.`);
    }
  });
  if (specials > 1) errors.push('Nur ein Champion bzw. Held pro Deck erlaubt.');
  return { ok: errors.length === 0, errors };
}

/** Evo-Karten sind aktiv, wenn eine Karte mit Evo-Version in einem Evo-Platz liegt. */
export function evoCardsOf(db, slots) {
  const out = [];
  for (const i of EVO_SLOTS) {
    const c = db.byId.get(slots?.[i]);
    if (c && c.evo) out.push(c.id);
  }
  return out;
}

export function averageElixir(db, slots) {
  const costs = (slots || []).map((id) => db.byId.get(id)).filter(Boolean).map((c) => c.elixir);
  if (!costs.length) return 0;
  return Math.round((costs.reduce((a, b) => a + b, 0) / costs.length) * 10) / 10;
}

/** Günstigster 4-Karten-Zyklus (Summe der vier billigsten Karten). */
export function cycleCost(db, slots) {
  const costs = (slots || [])
    .map((id) => db.byId.get(id))
    .filter(Boolean)
    .map((c) => c.elixir)
    .sort((a, b) => a - b);
  return costs.slice(0, 4).reduce((a, b) => a + b, 0);
}

function targetsAir(db, card) {
  if (card.type === 'spell') return true;
  const u = db.unit(db.unitRefOf(card));
  return u.targets === 'both' || u.targets === 'air';
}

/** Erzeugt ein zufälliges, gültiges und halbwegs sinnvolles Deck. */
export function randomDeck(db, rng = Math.random) {
  const take = (arr) => arr.splice(Math.floor(rng() * arr.length), 1)[0];
  const slots = new Array(DECK_SIZE).fill(null);
  const used = new Set();
  const pool = () => db.cards.filter((c) => c.class === 'normal' && !used.has(c.id));
  const put = (i, card) => {
    slots[i] = card.id;
    used.add(card.id);
  };

  const evos = pool().filter((c) => c.evo);
  for (const i of EVO_SLOTS) put(i, take(evos));

  const specials = db.cards.filter(isSpecial);
  if (specials.length && rng() < 0.8) put(SPECIAL_SLOT, take(specials.slice()));
  else put(SPECIAL_SLOT, take(pool()));

  const free = () => slots.findIndex((s) => s === null);
  // 1–2 Zauber
  const spellCount = pool().filter((c) => c.type === 'spell').length ? 1 + (rng() < 0.5 ? 1 : 0) : 0;
  const already = slots.filter((id) => id && db.byId.get(id).type === 'spell').length;
  for (let k = already; k < spellCount; k++) put(free(), take(pool().filter((c) => c.type === 'spell')));
  // mindestens zwei Karten gegen Luft
  let air = slots.filter((id) => id && targetsAir(db, db.byId.get(id))).length;
  while (air < 3) {
    const cands = pool().filter((c) => c.type !== 'spell' && targetsAir(db, c));
    if (!cands.length) break;
    put(free(), take(cands));
    air++;
  }
  // mindestens eine Karte, die Gebäude angreift (Win-Condition) – falls möglich
  const hasWin = slots.some((id) => {
    const c = id && db.byId.get(id);
    return c && c.type === 'troop' && db.unit(db.unitRefOf(c)).targets === 'buildings';
  });
  if (!hasWin) {
    const cands = pool().filter((c) => c.type === 'troop' && db.unit(db.unitRefOf(c)).targets === 'buildings');
    if (cands.length && free() >= 0) put(free(), take(cands));
  }
  while (free() >= 0) put(free(), take(pool()));
  return slots;
}

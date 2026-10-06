// Kartendatenbank: Aufbau, Level-Skalierung, Skin, Auflösung von Einheiten (inkl. Evo) und Deck-Regeln.
// Wird von Server und Client identisch verwendet.

export const DECK_SIZE = 8;
export const EVO_SLOTS = Object.freeze([0, 1]);
export const SPECIAL_SLOT = 2;
export const HAND_SIZE = 4;
/** Turnierstandard: Auf diesem Level stehen die Werte in cards.json. */
export const BASE_LEVEL = 11;

export const TYPE_LABELS = Object.freeze({ troop: 'Truppe', spell: 'Zauber', building: 'Gebäude' });
export const CLASS_LABELS = Object.freeze({ normal: 'Karte', champion: 'Champion', hero: 'Held' });
export const RARITY_ORDER = Object.freeze(['common', 'rare', 'epic', 'legendary', 'champion']);
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

// ───────────────────────────── Level ─────────────────────────────

/** Faktor gegenüber Level 11 (wie die Tabellen im Wiki: +10 % je Level). */
export function levelFactor(level) {
  return Math.pow(1.1, (Number(level) || BASE_LEVEL) - BASE_LEVEL);
}

// Zahlen, die mit dem Level wachsen (alles andere – Zeiten, Radien, Multiplikatoren – bleibt gleich).
const SCALED = new Set(['hp', 'damage', 'shield', 'heal', 'bonus', 'maxHp', 'buildingDamage']);
function scaleNum(v, f) {
  return Math.round(v * f);
}

/** Skaliert eine Kartendefinition (tief) um Faktor f. */
export function scaleStats(obj, f, parentKey = '') {
  if (f === 1 || obj == null) return obj;
  if (Array.isArray(obj)) {
    // ramp.stages / pulses.damage: Zahlenlisten
    if (obj.every((x) => typeof x === 'number')) return SCALED.has(parentKey) || parentKey === 'stages' ? obj.map((x) => scaleNum(x, f)) : obj;
    // poisonDart.stages: [[Treffer, DPS]], killHeal.steps: [[Schwelle, Heilung]], voidTiers: [[Anzahl, Schaden, Turmschaden]]
    if (parentKey === 'stages') return obj.map((p) => (Array.isArray(p) ? [p[0], scaleNum(p[1], f)] : p));
    if (parentKey === 'steps') return obj.map((p) => (Array.isArray(p) ? p.map((x) => (x >= 1e8 ? x : scaleNum(x, f))) : p));
    if (parentKey === 'voidTiers') return obj.map((p) => [p[0], scaleNum(p[1], f), scaleNum(p[2], f)]);
    return obj.map((x) => scaleStats(x, f, parentKey));
  }
  if (!isObj(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'number' && SCALED.has(k)) out[k] = scaleNum(v, f);
    else if (k === 'look') out[k] = v;
    else out[k] = scaleStats(v, f, k);
  }
  return out;
}

// ───────────────────────────── Skin ─────────────────────────────

/**
 * Wendet ein Namens-/Grafik-Mapping an (data/skin.json). Fehlende Einträge fallen auf das Original zurück.
 * Pro Karte: name, description, look, image, evo: {name, description}, ability: {name, description},
 * optional archetype (Figuren-Körper) und fx: {preset, tint} (nur Darstellung).
 */
export function applySkin(raw, skin, which) {
  const name = which || skin?.active || 'original';
  const s = skin?.skins?.[name];
  if (!s) return raw;
  const out = { ...raw, skin: name };
  const cardOv = s.cards || {};
  out.cards = raw.cards.map((c) => {
    const o = cardOv[c.id];
    if (!o) return c;
    const n = { ...c };
    if (o.name) n.name = o.name;
    if (o.description) n.description = o.description;
    if (o.look || o.image) {
      if (n.type === 'spell') n.look = { ...(n.look || {}), ...(o.look || {}), ...(o.image ? { image: o.image } : {}) };
      else if (isObj(n.unit)) n.unit = { ...n.unit, look: { ...(n.unit.look || {}), ...(o.look || {}), ...(o.image ? { image: o.image } : {}) } };
    }
    if (o.evo && n.evo) n.evo = { ...n.evo, ...pick(o.evo, ['name', 'description']) };
    if (o.ability && n.ability) n.ability = { ...n.ability, ...pick(o.ability, ['name', 'description']) };
    // Visuelles Upgrade (rein optisch, Simulation liest es nicht):
    // archetype = anderer Figuren-Körper (look.body), fx = { preset, tint } für Ausspiel-/Zauber-Effekt
    if (typeof o.archetype === 'string' && o.archetype && isObj(n.unit)) n.unit = { ...n.unit, look: { ...(n.unit.look || {}), body: o.archetype } };
    if (isObj(o.fx) && (o.fx.preset || o.fx.tint)) n.skinFx = pick(o.fx, ['preset', 'tint']);
    return n;
  });
  const tokOv = s.tokens || {};
  out.tokens = { ...(raw.tokens || {}) };
  for (const [id, o] of Object.entries(tokOv)) {
    if (!out.tokens[id]) continue;
    out.tokens[id] = { ...out.tokens[id], ...(o.name ? { name: o.name } : {}), look: { ...(out.tokens[id].look || {}), ...(o.look || {}), ...(o.image ? { image: o.image } : {}) } };
  }
  return out;
}

function pick(o, keys) {
  const r = {};
  for (const k of keys) if (o[k]) r[k] = o[k];
  return r;
}

// ───────────────────────────── Datenbank ─────────────────────────────

/**
 * Baut aus dem Roh-JSON (cards.json) die Laufzeit-Datenbank.
 * @param {object} raw
 * @param {object} [opts] { level, skin, skinName }
 */
export function createDb(raw, opts = {}) {
  if (!raw || !Array.isArray(raw.cards)) throw new Error('cards.json: "cards" fehlt');
  const level = Number(opts.level) || BASE_LEVEL;
  const f = levelFactor(level);
  const skinned = opts.skin ? applySkin(raw, opts.skin, opts.skinName) : raw;
  const cards = skinned.cards.map((c) => {
    const s = f === 1 ? c : scaleStats(c, f);
    const card = { class: 'normal', count: 1, ...s };
    if (card.evo && !card.evo.name) card.evo = { ...card.evo, name: 'Evo-' + card.name };
    return card;
  });
  const byId = new Map(cards.map((c) => [c.id, c]));
  const tokens = {};
  for (const [id, t] of Object.entries(skinned.tokens || {})) tokens[id] = f === 1 ? t : scaleStats(t, f);
  const typeList = ['tower_king', 'tower_princess', ...cards.map((c) => c.id), ...Object.keys(tokens)];
  const typeIndex = new Map(typeList.map((k, i) => [k, i]));
  const unitCache = new Map();
  const heroOf = new Map(cards.filter((c) => c.heroOf).map((c) => [c.id, c.heroOf]));
  const db = {
    raw,
    level,
    skin: skinned.skin || 'original',
    cards,
    byId,
    tokens,
    typeList,
    typeIndex,
    rarities: raw.rarities || {},
    card(id) {
      return byId.get(id) || null;
    },
    /** Einheitenwerte. levelBonus > 0: zusätzliche Level (Spiegel, Heldenfähigkeiten). */
    unit(ref, evo = false, levelBonus = 0) {
      const key = ref + (evo ? '#evo' : '') + (levelBonus ? '+' + levelBonus : '');
      let d = unitCache.get(key);
      if (!d) {
        d = levelBonus ? resolveUnit(db, ref, evo, levelFactor(BASE_LEVEL + levelBonus)) : resolveUnit(db, ref, evo);
        unitCache.set(key, d);
      }
      return d;
    },
    spell(card, evo = false) {
      return evo && card.evo && card.evo.spell ? deepMerge(card.spell, card.evo.spell) : card.spell;
    },
    /** Referenz der (Haupt-)Einheit, die eine Truppen-/Gebäudekarte erzeugt */
    unitRefOf(card) {
      if (typeof card.unit === 'string') return card.unit;
      if (!card.unit && card.groups?.length) return card.groups[0].unit;
      return card.id;
    },
    /** Alle Einheitengruppen einer Karte: [{ unit, count, behind }] */
    groupsOf(card, evo = false) {
      const ev = evo && card.evo ? card.evo : null;
      const count = ev?.count ?? card.count ?? 1;
      const groups = card.groups ? card.groups.map((g) => ({ ...g })) : [{ unit: db.unitRefOf(card), count }];
      if (!card.groups) groups[0].count = count;
      if (ev?.groups) groups.push(...ev.groups.map((g) => ({ ...g })));
      return groups;
    },
    /** Basiskarte eines Helden (oder null) */
    heroBase(id) {
      return heroOf.get(id) || null;
    },
  };
  return db;
}

/** Löst eine Einheiten-Referenz (Karten-ID oder Token-ID) in flache Werte auf. */
export function resolveUnit(db, ref, evo = false, extraFactor = 1) {
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
    if (typeof card.unit === 'string') {
      const d = resolveUnit(db, card.unit, false, extraFactor);
      // Evo einer Karte, deren Einheit eine andere Karte ist (z. B. Lakaienhorde → Lakaien)
      if (evo && card.evo?.unit) {
        const m = deepMerge(d, extraFactor !== 1 ? scaleStats(card.evo.unit, extraFactor) : card.evo.unit);
        m.traits = deepMerge(d.traits, card.evo.unit.traits || {});
        m.evo = true;
        m.cardId = card.id;
        m.key = card.id; // damit der Client den Evo-Look über die Karte findet
        m.name = card.evo.name || 'Evo-' + card.name;
        return m;
      }
      return d;
    }
    raw = card.unit;
    if (!raw && card.groups?.length) return resolveUnit(db, card.groups[0].unit, false, extraFactor);
    isBuilding = card.type === 'building';
    if (evo && card.evo && card.evo.unit) raw = deepMerge(raw, card.evo.unit);
  }
  if (extraFactor !== 1) raw = scaleStats(raw, extraFactor);
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
    d.sight = Math.max(d.range, d.traits.spawner?.enemyInRange || 0);
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

/** Anzeige der Kosten: Spiegel „?“, sonst Elixier. */
export function costLabel(card) {
  if (!card) return '';
  if (card.elixirRule === 'mirror') return '?';
  return String(card.elixir);
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
  for (const id of seen) {
    const base = db.heroBase?.(id);
    if (base && seen.has(base)) errors.push(`${db.byId.get(base).name} und ${db.byId.get(id).name} können nicht zusammen ins Deck.`);
  }
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

/** Durchschnittskosten. Der Spiegel (Kosten „?“) zählt nicht mit. */
export function averageElixir(db, slots) {
  const costs = (slots || [])
    .map((id) => db.byId.get(id))
    .filter((c) => c && c.elixirRule !== 'mirror')
    .map((c) => c.elixir);
  if (!costs.length) return 0;
  return Math.round((costs.reduce((a, b) => a + b, 0) / costs.length) * 10) / 10;
}

/** Günstigster 4-Karten-Zyklus (Summe der vier billigsten Karten). */
export function cycleCost(db, slots) {
  const costs = (slots || [])
    .map((id) => db.byId.get(id))
    .filter((c) => c && c.elixirRule !== 'mirror')
    .map((c) => (c.forms ? Math.min(...c.forms.map((f) => f.elixir)) : c.elixir))
    .sort((a, b) => a - b);
  return costs.slice(0, 4).reduce((a, b) => a + b, 0);
}

function targetsAir(db, card) {
  if (card.type === 'spell') return !!(card.spell?.damage || card.spell?.voidTiers || card.spell?.strikes);
  const u = db.unit(db.unitRefOf(card));
  return u.targets === 'both' || u.targets === 'air' || !!u.traits.secondary;
}

/** Erzeugt ein zufälliges, gültiges und halbwegs sinnvolles Deck. */
export function randomDeck(db, rng = Math.random) {
  const take = (arr) => arr.splice(Math.floor(rng() * arr.length), 1)[0];
  const slots = new Array(DECK_SIZE).fill(null);
  const used = new Set();
  const blocked = (c) => used.has(c.id) || (c.heroOf && used.has(c.heroOf)) || [...used].some((u) => db.heroBase(u) === c.id);
  const pool = () => db.cards.filter((c) => c.class === 'normal' && !blocked(c));
  const put = (i, card) => {
    slots[i] = card.id;
    used.add(card.id);
  };

  const specials = db.cards.filter(isSpecial);
  if (specials.length && rng() < 0.8) put(SPECIAL_SLOT, take(specials.slice()));

  const evos = pool().filter((c) => c.evo);
  for (const i of EVO_SLOTS) {
    const c = evos.filter((e) => !blocked(e));
    if (c.length) put(i, take(c));
  }
  if (!slots[SPECIAL_SLOT]) put(SPECIAL_SLOT, take(pool()));

  const free = () => slots.findIndex((s) => s === null);
  // 1–2 Zauber
  const spellCount = 1 + (rng() < 0.5 ? 1 : 0);
  const already = slots.filter((id) => id && db.byId.get(id).type === 'spell').length;
  for (let k = already; k < spellCount; k++) {
    const sp = pool().filter((c) => c.type === 'spell' && c.elixirRule !== 'mirror');
    if (sp.length) put(free(), take(sp));
  }
  // mindestens drei Karten gegen Luft
  let air = slots.filter((id) => id && targetsAir(db, db.byId.get(id))).length;
  while (air < 3) {
    const cands = pool().filter((c) => c.type !== 'spell' && targetsAir(db, c));
    if (!cands.length || free() < 0) break;
    put(free(), take(cands));
    air++;
  }
  // mindestens eine Karte, die Gebäude angreift (Win-Condition) – falls möglich
  const isWin = (c) => c && c.type === 'troop' && db.unit(db.unitRefOf(c)).targets === 'buildings';
  if (!slots.some((id) => id && isWin(db.byId.get(id)))) {
    const cands = pool().filter(isWin);
    if (cands.length && free() >= 0) put(free(), take(cands));
  }
  while (free() >= 0) put(free(), take(pool()));
  return slots;
}

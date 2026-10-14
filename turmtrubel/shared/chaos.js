// Modus „Chaos“: Prüfung von chaos.json und chaos_perks.json, Kartenpool, Seltenheitswurf und Perk-Angebote.
// Wird von Server (Regeln, Auswahlrunden, Deck-Prüfung) und Client (Deckbau, Perk-Texte) identisch verwendet.
//
// chaos.json        – Einstellungen: Kartenpool, festes Level, Turm-/Elixier-Faktor, Auswahlrunden, Seltenheiten
// chaos_perks.json  – drei Perks (Gewöhnlich, Selten, Episch) je Pool-Karte; die Wirkung steht in effectParameters
//                     und wird erst in der Simulation auf eine Matchkopie der Kartenwerte gelegt (server/sim/perks.js)

export const PERK_TIERS = Object.freeze(['common', 'rare', 'epic']);
export const PERK_TIER_LABELS = Object.freeze({ common: 'Gewöhnlich', rare: 'Selten', epic: 'Episch' });
/** Kurzcode je Stufe (Snapshot, Ereignisse): 1 Gewöhnlich, 2 Selten, 3 Episch. */
export const PERK_TIER_CODE = Object.freeze({ common: 1, rare: 2, epic: 3 });
export const MECHANIC_TYPES = Object.freeze(['statBoost', 'behaviorChange', 'newAbility', 'spawnChange', 'visualOnly']);
export const MECHANIC_LABELS = Object.freeze({
  statBoost: 'Werte',
  behaviorChange: 'Verhalten',
  newAbility: 'Neue Fähigkeit',
  spawnChange: 'Einheiten',
  visualOnly: 'Optik',
});

const num = (v) => typeof v === 'number' && Number.isFinite(v);
const str = (v) => typeof v === 'string' && v.trim().length > 0;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Prüft chaos.json gegen die Kartendatenbank. Gibt eine Liste von Fehlern zurück (leer = gültig). */
export function validateChaos(json, db = null) {
  const errors = [];
  if (!isObj(json)) return ['chaos.json: kein Objekt'];
  const pool = json.cardPool;
  if (!Array.isArray(pool) || pool.length < 30 || pool.length > 40) errors.push('cardPool: 30 bis 40 Karten');
  else {
    if (new Set(pool).size !== pool.length) errors.push('cardPool: doppelte Karte');
    if (db) {
      for (const id of pool) {
        const c = db.card(id);
        if (!c) errors.push(`cardPool: unbekannte Karte ${id}`);
        else if (c.elixirRule === 'mirror') errors.push(`cardPool: ${id} hat keine festen Kosten`);
      }
    }
  }
  if (!(Number.isInteger(json.fixedLevel) && json.fixedLevel >= 1 && json.fixedLevel <= 16)) errors.push('fixedLevel: ganze Zahl 1–16');
  if (!(num(json.towerHpMultiplier) && json.towerHpMultiplier > 0 && json.towerHpMultiplier <= 10)) errors.push('towerHpMultiplier: > 0 und ≤ 10');
  if (!(num(json.elixirRateMultiplier) && json.elixirRateMultiplier > 0 && json.elixirRateMultiplier <= 10)) errors.push('elixirRateMultiplier: > 0 und ≤ 10');
  if (typeof json.evos !== 'boolean') errors.push('evos: true oder false');
  if (!(Number.isInteger(json.rounds) && json.rounds >= 0 && json.rounds <= 10)) errors.push('rounds: 0–10');
  if (!(num(json.firstRoundSeconds) && json.firstRoundSeconds > 0)) errors.push('firstRoundSeconds: > 0');
  if (!(num(json.roundIntervalSeconds) && json.roundIntervalSeconds > 0)) errors.push('roundIntervalSeconds: > 0');
  if (typeof json.lastRoundOvertimeOnly !== 'boolean') errors.push('lastRoundOvertimeOnly: true oder false');
  if (!(num(json.pickTimeSeconds) && json.pickTimeSeconds >= 1 && json.pickTimeSeconds <= 60)) errors.push('pickTimeSeconds: 1–60');
  if (json.offersPerRound !== 2) errors.push('offersPerRound: 2');
  if (json.offerMode !== 'twoCards') errors.push('offerMode: twoCards');
  const table = json.rarityByRound;
  if (!Array.isArray(table) || table.length !== json.rounds) errors.push('rarityByRound: ein Eintrag pro Runde');
  else
    table.forEach((w, i) => {
      if (!isObj(w) || !PERK_TIERS.every((t) => num(w[t]) && w[t] >= 0)) errors.push(`rarityByRound[${i}]: common/rare/epic als Zahl ≥ 0`);
      else if (Math.abs(PERK_TIERS.reduce((s, t) => s + w[t], 0) - 100) > 1e-6) errors.push(`rarityByRound[${i}]: Summe muss 100 sein`);
    });
  const d = json.bot?.pickDelaySeconds;
  if (!(Array.isArray(d) && d.length === 2 && num(d[0]) && num(d[1]) && d[0] >= 0 && d[0] <= d[1])) errors.push('bot.pickDelaySeconds: [min, max]');
  return errors;
}

/** Prüft chaos_perks.json: zu jeder Pool-Karte genau drei Perks (je Stufe einer) mit allen Pflichtfeldern. */
export function validatePerks(json, chaos, db = null) {
  const errors = [];
  if (!isObj(json) || !Array.isArray(json.perks)) return ['chaos_perks.json: "perks" fehlt'];
  const pool = new Set(chaos?.cardPool || []);
  const ids = new Set();
  const seen = new Set();
  for (const p of json.perks) {
    const where = `Perk ${p?.id ?? '?'}`;
    if (!isObj(p)) {
      errors.push('Perk ist kein Objekt');
      continue;
    }
    if (!str(p.id) || ids.has(p.id)) errors.push(`${where}: id fehlt oder doppelt`);
    ids.add(p.id);
    if (!pool.has(p.cardId)) errors.push(`${where}: cardId ${p.cardId} ist nicht im Kartenpool`);
    if (db && !db.card(p.cardId)) errors.push(`${where}: unbekannte Karte ${p.cardId}`);
    if (!PERK_TIERS.includes(p.rarityTier)) errors.push(`${where}: rarityTier`);
    if (p.id !== `${p.cardId}.${p.rarityTier}`) errors.push(`${where}: id muss <cardId>.<rarityTier> sein`);
    const key = p.cardId + '|' + p.rarityTier;
    if (seen.has(key)) errors.push(`${where}: Stufe doppelt`);
    seen.add(key);
    for (const k of ['name', 'description', 'balanceNote']) if (!str(p[k])) errors.push(`${where}: ${k} fehlt`);
    if (!MECHANIC_TYPES.includes(p.mechanicType)) errors.push(`${where}: mechanicType`);
    if (!isObj(p.effectParameters) || !Object.keys(p.effectParameters).length) errors.push(`${where}: effectParameters fehlen`);
    if (p.elixirCostUnchanged !== true) errors.push(`${where}: elixirCostUnchanged muss true sein`);
    if (p.effectParameters && hasCostKey(p.effectParameters)) errors.push(`${where}: Perks dürfen die Elixierkosten nicht ändern`);
  }
  for (const id of pool) for (const t of PERK_TIERS) if (!seen.has(id + '|' + t)) errors.push(`Karte ${id}: Perk-Stufe ${t} fehlt`);
  return errors;
}

/**
 * Würde ein Parameterobjekt die Elixierkosten der Karte verändern? Kartenkosten heißen `elixir`/`elixirRule`/`cost`;
 * der Zweig `ability` (Fähigkeitskosten eines Champions/Helden) gehört nicht zu den Kartenkosten.
 */
function hasCostKey(o) {
  if (Array.isArray(o)) return o.some(hasCostKey);
  if (!isObj(o)) return false;
  return Object.entries(o).some(([k, v]) => k === 'elixir' || k === 'elixirRule' || k === 'cost' || (k !== 'ability' && hasCostKey(v)));
}

/**
 * Laufzeit-Objekt des Chaos-Modus aus chaos.json + chaos_perks.json.
 * Wirft bei ungültigen Daten (wie createModes) – ein kaputter Modus soll den Server nicht still starten.
 */
export function createChaos(chaosJson, perksJson, db = null) {
  const errors = [...validateChaos(chaosJson, db), ...validatePerks(perksJson, chaosJson, db)];
  if (errors.length) throw new Error('Chaos-Daten ungültig:\n' + errors.join('\n'));
  const config = Object.freeze(structuredClone(chaosJson));
  const perks = new Map();
  const byCard = new Map();
  for (const raw of perksJson.perks) {
    const p = Object.freeze(structuredClone(raw));
    perks.set(p.id, p);
    if (!byCard.has(p.cardId)) byCard.set(p.cardId, {});
    byCard.get(p.cardId)[p.rarityTier] = p;
  }
  const poolSet = new Set(config.cardPool);
  return {
    config,
    pool: config.cardPool.slice(),
    poolSet,
    perks,
    byCard,
    perk(id) {
      return (typeof id === 'string' && perks.get(id)) || null;
    },
    perkFor(cardId, tier) {
      return byCard.get(cardId)?.[tier] || null;
    },
    inPool(id) {
      return poolSet.has(id);
    },
  };
}

/** Karten eines Decks, die nicht im Pool sind (leer = Deck erlaubt). */
export function cardsOutsidePool(chaos, deck) {
  return (Array.isArray(deck) ? deck : []).filter((id) => !chaos.poolSet.has(id));
}

/** Zeitpunkte (Sekunden Spielzeit) der Auswahlrunden. Die letzte Runde hängt ggf. an der Verlängerung. */
export function roundSchedule(config) {
  return Array.from({ length: config.rounds }, (_, i) => config.firstRoundSeconds + i * config.roundIntervalSeconds);
}

/** Würfelt eine Seltenheit nach Gewichten { common, rare, epic } (Summe beliebig > 0). */
export function rollTier(weights, rng) {
  const total = PERK_TIERS.reduce((s, t) => s + Math.max(0, weights[t] || 0), 0);
  if (!(total > 0)) return 'common';
  let x = rng() * total;
  for (const t of PERK_TIERS) {
    const w = Math.max(0, weights[t] || 0);
    if (x < w) return t;
    x -= w;
  }
  // Rundung: letzte Stufe mit Gewicht
  return [...PERK_TIERS].reverse().find((t) => (weights[t] || 0) > 0);
}

/**
 * Zweite, andere Stufe für dieselbe Karte (nur wenn genau eine perk-freie Karte übrig ist):
 * gewürfelt nach den übrigen Gewichten der Runde, sonst die nächstliegende Stufe (bei Gleichstand die höhere).
 */
export function otherTier(first, weights, rng) {
  const rest = {};
  for (const t of PERK_TIERS) rest[t] = t === first ? 0 : Math.max(0, weights[t] || 0);
  if (PERK_TIERS.some((t) => rest[t] > 0)) return rollTier(rest, rng);
  const i = PERK_TIERS.indexOf(first);
  return PERK_TIERS[i + 1] || PERK_TIERS[i - 1];
}

/**
 * Angebot einer Auswahlrunde für einen Spieler (offerMode „twoCards“): zwei verschiedene perk-freie Karten des Decks,
 * je mit unabhängig gewürfelter Seltenheit. Ist nur eine Karte frei, gibt es zwei Stufen derselben Karte;
 * ist keine frei, entfällt die Runde für diesen Spieler (null).
 * @param {object} chaos   – createChaos()
 * @param {string[]} deck  – die 8 Karten des Spielers
 * @param {Set<string>|object} taken – Karten, die schon einen Perk haben
 * @param {number} round   – Rundenindex (0-basiert)
 * @param {() => number} rng
 * @returns {string[]|null} zwei Perk-IDs
 */
export function makeOffer(chaos, deck, taken, round, rng) {
  const has = (id) => (taken instanceof Set ? taken.has(id) : !!taken?.[id]);
  const free = [];
  for (const id of deck || []) if (id && chaos.byCard.has(id) && !has(id) && !free.includes(id)) free.push(id);
  if (!free.length) return null;
  const weights = chaos.config.rarityByRound[Math.min(round, chaos.config.rarityByRound.length - 1)];
  if (free.length === 1) {
    const a = rollTier(weights, rng);
    const b = otherTier(a, weights, rng);
    return [chaos.perkFor(free[0], a).id, chaos.perkFor(free[0], b).id];
  }
  const i = Math.floor(rng() * free.length);
  let j = Math.floor(rng() * (free.length - 1));
  if (j >= i) j++;
  return [free[i], free[j]].map((id) => chaos.perkFor(id, rollTier(weights, rng)).id);
}

/** Kurzinfo eines Perks für Clients (Anzeige, ohne interne Parameter). */
export function perkSummary(perk) {
  return perk
    ? { id: perk.id, card: perk.cardId, tier: perk.rarityTier, name: perk.name, description: perk.description, mechanic: perk.mechanicType }
    : null;
}

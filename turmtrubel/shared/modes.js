// Spielmodi: Prüfung von modes.json und Auflösung in effektive Regeln für die Simulation.
//
// Ein Modus besteht aus unabhängigen Modifikatoren, die nacheinander auf die klassischen Regeln (rules.json)
// angewendet werden: Spieler/Teams, Elixier-Faktor, Phasen an/aus, Start-Elixier, „Elixier wird nie verbraucht“,
// Spielzeiten, Evolutionen an/aus, Eingabe-Limit. Jeder Modifikator wirkt für sich – so lässt sich z. B. ein
// Draft mit ×7-Elixier allein über modes.json bauen.

export const DECK_SOURCES = Object.freeze(['saved', 'draft']);
export const DRAFT_KINDS = Object.freeze(['triple', 'mega']);
export const DIFFICULTIES = Object.freeze(['easy', 'medium', 'hard']);
export const DIFFICULTY_LABELS = Object.freeze({ easy: 'Leicht', medium: 'Mittel', hard: 'Schwer' });

const num = (v) => typeof v === 'number' && Number.isFinite(v);
const has = (v) => v !== null && v !== undefined;

/** Prüft modes.json. Gibt eine Liste von Fehlern zurück (leer = gültig). */
export function validateModes(json) {
  const errors = [];
  if (!json || !Array.isArray(json.modes) || !json.modes.length) return ['modes.json: "modes" fehlt'];
  const ids = new Set();
  for (const m of json.modes) {
    const where = `Modus ${m?.id ?? '?'}`;
    if (typeof m?.id !== 'string' || !/^[a-z0-9-]{2,24}$/.test(m.id)) errors.push(`${where}: ungültige id`);
    if (ids.has(m.id)) errors.push(`${where}: doppelte id`);
    ids.add(m.id);
    for (const k of ['name', 'short', 'description', 'icon']) if (typeof m[k] !== 'string' || !m[k]) errors.push(`${where}: ${k} fehlt`);
    if (!Number.isInteger(m.players) || m.players < 2 || m.players > 8) errors.push(`${where}: players muss 2–8 sein`);
    if (m.teams !== 2) errors.push(`${where}: teams muss 2 sein (die Arena hat zwei Hälften)`);
    if (Number.isInteger(m.players) && m.players % 2) errors.push(`${where}: players muss gerade sein (gleich große Teams)`);
    if (!DECK_SOURCES.includes(m.deckSource)) errors.push(`${where}: deckSource muss ${DECK_SOURCES.join(' oder ')} sein`);
    if (typeof m.multiplayerOnly !== 'boolean' || typeof m.botsAllowed !== 'boolean') errors.push(`${where}: multiplayerOnly/botsAllowed fehlen`);
    if (m.botsAllowed && m.players !== 2) errors.push(`${where}: Bots gibt es nur im 1 gegen 1`);
    if (m.multiplayerOnly && m.botsAllowed) errors.push(`${where}: multiplayerOnly und botsAllowed schließen sich aus`);
    const e = m.elixir || {};
    if (has(e.multiplier) && !(num(e.multiplier) && e.multiplier > 0 && e.multiplier <= 20)) errors.push(`${where}: elixir.multiplier 0–20`);
    if (has(e.start) && !(num(e.start) && e.start >= 0)) errors.push(`${where}: elixir.start`);
    if (has(e.phases) && typeof e.phases !== 'boolean') errors.push(`${where}: elixir.phases`);
    if (has(e.infinite) && typeof e.infinite !== 'boolean') errors.push(`${where}: elixir.infinite`);
    const t = m.match || {};
    for (const k of ['regularSeconds', 'overtimeSeconds']) if (has(t[k]) && !(num(t[k]) && t[k] >= 0)) errors.push(`${where}: match.${k}`);
    if (has(t.suddenDeath) && !['firstCrown', 'firstHit'].includes(t.suddenDeath)) errors.push(`${where}: match.suddenDeath`);
    const l = m.limits || {};
    if (has(l.playsPerSecond) && !(num(l.playsPerSecond) && l.playsPerSecond > 0)) errors.push(`${where}: limits.playsPerSecond`);
    if (m.deckSource === 'draft') {
      const d = m.draft;
      if (!d || !DRAFT_KINDS.includes(d.kind)) errors.push(`${where}: draft.kind fehlt`);
      else if (m.players !== 2) errors.push(`${where}: Drafts gibt es nur im 1 gegen 1`);
      else if (d.kind === 'triple') {
        if (!(d.rounds === 8 && d.offer >= 2 && (d.totalSeconds > 0 || d.pickSeconds > 0))) errors.push(`${where}: draft.rounds = 8, offer ≥ 2, totalSeconds oder pickSeconds > 0`);
      } else if (d.kind === 'mega') {
        if (!(d.picksPerPlayer === 8 && d.poolSize >= 20 && d.champions >= 0 && d.pickSeconds > 0)) errors.push(`${where}: draft.picksPerPlayer = 8, poolSize ≥ 20, pickSeconds > 0`);
      }
    }
    if (has(m.chaos)) {
      if (m.chaos !== true) errors.push(`${where}: chaos muss true sein (Einstellungen stehen in chaos.json)`);
      else if (m.players !== 2 || m.deckSource !== 'saved') errors.push(`${where}: Chaos gibt es nur im 1 gegen 1 mit eigenem Deck`);
    }
    if (!Array.isArray(m.rules) || !m.rules.length) errors.push(`${where}: rules (Regel-Hinweise) fehlen`);
  }
  if (json.defaultMode && !ids.has(json.defaultMode)) errors.push('defaultMode unbekannt');
  return errors;
}

/** Index aus modes.json (Map id → Modus). */
export function createModes(json) {
  const errors = validateModes(json);
  if (errors.length) throw new Error('modes.json ungültig:\n' + errors.join('\n'));
  const list = json.modes.map((m) => Object.freeze(structuredClone(m)));
  const byId = new Map(list.map((m) => [m.id, m]));
  return {
    list,
    byId,
    defaultId: json.defaultMode || list[0].id,
    get(id) {
      return byId.get(id) || null;
    },
  };
}

/** Sitz → Team. Sitze 0 … n/2-1 sind Team 0 (blau), der Rest Team 1 (rot). Klassisch: [0, 1]. */
export function teamLayout(players) {
  return Array.from({ length: players }, (_, i) => (i < players / 2 ? 0 : 1));
}

/** Darf ein Modus mit Evolutionen gespielt werden? */
export function evosEnabled(mode) {
  if (mode.deckSource === 'draft') return !!mode.draft?.allowEvos;
  return mode.evos !== false;
}

/**
 * Effektive Regeln für ein Match in diesem Modus. Der klassische Modus liefert die Regeln unverändert
 * zurück (gleiches Objekt) – so bleibt der klassische Kampf bitgenau wie vorher.
 * @param {object} [opts] { chaos } – Chaos-Einstellungen (shared/chaos.js createChaos), Pflicht für den Modus „Chaos“
 */
export function resolveRules(rules, mode, opts = {}) {
  if (!mode || isClassic(mode)) return rules;
  if (mode.chaos && !opts.chaos) throw new Error(`Modus ${mode.id}: Chaos-Einstellungen (chaos.json) fehlen`);
  const R = structuredClone(rules);
  // Modifikator: Elixier
  const e = mode.elixir || {};
  if (has(e.multiplier)) R.elixir.rate = e.multiplier;
  if (e.phases === false) R.elixir.phases = false;
  if (has(e.start)) R.elixir.start = Math.min(R.elixir.max, e.start);
  if (e.infinite) R.elixir.infinite = true;
  // Modifikator: Spielzeit / Verlängerung / Sudden Death
  const t = mode.match || {};
  if (has(t.regularSeconds)) R.regularSeconds = t.regularSeconds;
  if (has(t.overtimeSeconds)) R.overtimeSeconds = t.overtimeSeconds;
  if (has(t.suddenDeath)) R.suddenDeath = t.suddenDeath;
  if (R.doubleElixirLastSeconds > R.regularSeconds) R.doubleElixirLastSeconds = R.regularSeconds;
  // Modifikator: Evolutionen
  if (!evosEnabled(mode)) R.evo = { ...(R.evo || {}), enabled: false };
  // Modifikator: Eingabe-Limit (Platzierungen pro Sekunde und Spieler)
  if (mode.limits?.playsPerSecond) R.limits = { playsPerSecond: mode.limits.playsPerSecond, burst: mode.limits.burst || Math.ceil(mode.limits.playsPerSecond * 2) };
  // Modifikator: Chaos (Werte aus chaos.json) – Elixier-Faktor zusätzlich zu den Phasen, Turm-Leben, festes Level
  if (mode.chaos) {
    const c = opts.chaos.config || opts.chaos;
    R.elixir.rate = (R.elixir.rate ?? 1) * c.elixirRateMultiplier;
    for (const key of Object.keys(R.towers)) R.towers[key] = { ...R.towers[key], hp: Math.round(R.towers[key].hp * c.towerHpMultiplier) };
    R.cardLevel = c.fixedLevel;
    if (!c.evos) R.evo = { ...(R.evo || {}), enabled: false };
    R.chaos = { towerHpMultiplier: c.towerHpMultiplier, elixirRateMultiplier: c.elixirRateMultiplier, fixedLevel: c.fixedLevel };
  }
  // Modifikator: Teams
  R.players = mode.players;
  R.teamOf = teamLayout(mode.players);
  R.mode = mode.id;
  return R;
}

/** Entspricht der Modus dem klassischen Kampf (keine Modifikatoren)? */
export function isClassic(mode) {
  return (
    mode.players === 2 &&
    mode.deckSource === 'saved' &&
    !mode.elixir &&
    !mode.limits &&
    !(mode.match && Object.values(mode.match).some(has)) &&
    mode.evos !== false &&
    !mode.chaos
  );
}

/** Kurzinfo eines Modus für Lobby und Menü (wird an Clients geschickt). */
export function modeSummary(mode) {
  return {
    id: mode.id,
    name: mode.name,
    short: mode.short,
    icon: mode.icon,
    players: mode.players,
    teams: mode.teams,
    deckSource: mode.deckSource,
    draft: mode.draft ? mode.draft.kind : null,
    chaos: !!mode.chaos,
    rules: mode.rules,
  };
}

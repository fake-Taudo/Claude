// Figuren-Roster: welche Charakter-Modelle es gibt, abgeleitet aus data/cards.json.
// Einzige Quelle für Build-Skript, Prüfskript (npm run check:characters) und die Tabellen in docs/CHAR_AUDIT.md.
//
//   node tools/characters/roster.mjs            # Übersicht als Text
//   node tools/characters/roster.mjs --md       # Markdown-Tabelle (für docs/CHAR_AUDIT.md)
//   node tools/characters/roster.mjs --json     # vollständige Liste als JSON
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb } from '../../shared/cards.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Token, die keine eigene Figur sind, sondern eine Form einer anderen Figur (gleiches Modell, anderer Zustand). */
export const FORMS = {
  'cannon-cart-cannon': 'cannon-cart', // aufgebaute Kanone der Kanonenkarre
  'goblin-demolisher-kamikaze': 'goblin-demolisher', // Ansturm-Form
  'phoenix-reborn': 'phoenix', // wiedergeborener Phönix
  'phoenix-egg': 'phoenix', // Ei als Zwischenform
  'magic-archer-decoy': 'magic-archer-hero', // Lockvogel-Doppelgänger
  'lumberjack-ghost': 'lumberjack', // Geist nach dem Tod (Evo)
};
/** Keine Charaktere (Gebäude/Geschütze ohne Figur) – bleiben bei den Gebäuden. */
export const NOT_CHARACTERS = new Set(['hero-turret']);
/** Gebäude, die Einheiten erzeugen („Gebäude-Spawner“): gleicher Detail-Anspruch wie Figuren. */
export const SPAWNER_BUILDINGS = ['tombstone', 'tombstone-hero', 'goblin-hut', 'barbarian-hut', 'goblin-cage', 'goblin-drill'];
/** Figuren auf den Kronentürmen (keine Karten). */
export const TOWER_FIGURES = [
  { id: 'tower-king', name: 'König (Königsturm)', size: 0.75 },
  { id: 'tower-guard', name: 'Turmwache (Prinzessinnenturm)', size: 0.5 },
];

export function sizeClass(r) {
  if (r == null) return 'M';
  if (r <= 0.3) return 'XS';
  if (r <= 0.45) return 'S';
  if (r <= 0.55) return 'M';
  if (r <= 0.65) return 'L';
  if (r <= 0.8) return 'XL';
  return 'XXL';
}

function roleOf(u, count) {
  const t = u.traits || {};
  const roles = [];
  if (u.flying) roles.push('Flieger');
  if (u.isBuilding) roles.push('Gebäude');
  if (t.spawner) roles.push('Spawner');
  if (t.kamikaze) roles.push('Kamikaze');
  if (t.deployHeal || t.healOnAttack) roles.push('Heiler');
  if (u.targets === 'buildings') roles.push('Gebäudejäger');
  if (u.mass >= 18 && u.hp >= 2500) roles.push('Tank');
  if (!t.kamikaze && u.damage > 0) roles.push(u.range >= 2 ? 'Fernkampf' : 'Nahkampf');
  if (count >= 3) roles.push('Schwarm');
  if (u.splash > 0) roles.push('Flächenschaden');
  return roles.join(', ') || 'Unterstützung';
}

const TRAIT_DE = {
  dash: 'Sprint', charge: 'Ansturm', riverJump: 'Flusssprung', shield: 'Schild', kamikaze: 'Kamikaze', deathSpawn: 'Spawn beim Tod',
  deathDamage: 'Todesschaden', spawner: 'erzeugt Einheiten', onHit: 'Treffereffekt', multiTarget: 'mehrere Ziele', deployBlast: 'Landeschaden',
  ramp: 'Schaden steigt', leap: 'Sprungangriff', hook: 'Haken', pierce: 'Durchschlag', spread: 'Streuschuss', stealth: 'unsichtbar',
  deathSpell: 'Zauber beim Tod', transform: 'verwandelt sich', secondary: 'Zweitangriff', zapBack: 'Rückschlag', chargeUp: 'lädt auf',
  shrapnel: 'Splitter', recoil: 'Rückstoß', enchant: 'verzaubert', melee: 'Nahkampfwechsel', parry: 'Parade', combo: 'Kombo',
  souls: 'Seelen', attackRamp: 'Tempo steigt', deathElixir: 'Elixier beim Tod', burrowSpeed: 'gräbt', deployAnywhere: 'überall',
  healOnAttack: 'heilt beim Angriff', deployHeal: 'heilt beim Landen', untargetable: 'nicht angreifbar', invulnerable: 'unverwundbar',
  leader: 'Anführer', hatch: 'schlüpft', freezeAura: 'Frostaura',
};

/** Vollständiges Roster. */
export function buildRoster(db) {
  const out = [];
  const add = (e) => out.push(e);
  const unitOf = (ref) => {
    try {
      return db.unit(ref);
    } catch {
      return null;
    }
  };
  for (const card of db.cards) {
    if (card.type !== 'troop') continue;
    if (db.unitRefOf(card) !== card.id) continue; // Container-Karten (Koboldbande, Skelettarmee …) zeigen fremde Figuren
    const u = unitOf(card.id);
    const count = db.groupsOf(card)[0]?.count || 1;
    const kind = card.class === 'champion' ? 'champion' : card.class === 'hero' ? 'hero' : 'troop';
    add({ id: card.id, name: card.name, kind, card: card.id, heroOf: card.heroOf || null, rarity: card.rarity, elixir: card.elixir, evo: !!card.evo, count, unit: u });
  }
  // Container-Karten mit Evo vererben die Evo auf ihre Figur (Skelettarmee → Skelette, Lakaienhorde → Lakaien)
  for (const card of db.cards) {
    if (card.type !== 'troop' || db.unitRefOf(card) === card.id || !card.evo) continue;
    const target = out.find((e) => e.id === db.unitRefOf(card));
    if (target) target.evoVia = (target.evoVia || []).concat(card.id);
  }
  for (const id of SPAWNER_BUILDINGS) {
    const card = db.card(id);
    if (!card) continue;
    add({ id, name: card.name, kind: 'spawner', card: id, heroOf: card.heroOf || null, rarity: card.rarity, elixir: card.elixir, evo: !!card.evo, count: 1, unit: unitOf(id) });
  }
  for (const [id] of Object.entries(db.tokens)) {
    if (NOT_CHARACTERS.has(id) || FORMS[id]) continue;
    const src = db.cards.find((c) => JSON.stringify(c).includes(`"${id}"`));
    const srcTok = !src && Object.entries(db.tokens).find(([k, t]) => k !== id && JSON.stringify(t).includes(`"${id}"`));
    add({ id, name: db.tokens[id].name || id, kind: 'token', card: null, source: src ? src.id : srcTok ? srcTok[0] : null, evo: false, count: 1, unit: unitOf(id) });
  }
  for (const t of TOWER_FIGURES) add({ id: t.id, name: t.name, kind: 'tower', card: null, evo: false, count: 1, unit: { radius: t.size, mass: 0, targets: 'both', traits: {} } });
  for (const e of out) {
    const u = e.unit || {};
    e.size = sizeClass(u.radius);
    e.radius = u.radius ?? null;
    e.flying = !!u.flying;
    e.targets = u.targets || '';
    e.role = e.kind === 'tower' ? 'Turmverteidigung' : roleOf(u, e.count);
    e.specials = Object.keys(u.traits || {}).map((k) => TRAIT_DE[k] || k);
    e.forms = Object.entries(FORMS).filter(([, base]) => base === e.id).map(([f]) => f);
    delete e.unit;
  }
  return out;
}

export function loadRoster() {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cards.json'), 'utf8'));
  return buildRoster(createDb(raw));
}

const KIND_DE = { troop: 'Truppe', champion: 'Champion', hero: 'Held', token: 'Beschwörung', spawner: 'Gebäude-Spawner', tower: 'Turmfigur' };
const TARGET_DE = { ground: 'Boden', both: 'Boden + Luft', buildings: 'Gebäude', air: 'Luft' };

if (import.meta.url === `file://${process.argv[1]}`) {
  const roster = loadRoster();
  if (process.argv.includes('--json')) console.log(JSON.stringify(roster, null, 1));
  else if (process.argv.includes('--md')) {
    console.log('| # | ID | Name | Art | Rolle | Elixier | Größe (Radius) | Ziel | Anzahl | Evo | Besonderheiten / Herkunft |');
    console.log('|---|---|---|---|---|---|---|---|---|---|---|');
    roster.forEach((e, i) => {
      const extra = [e.heroOf ? `Held von ${e.heroOf}` : '', e.source ? `aus ${e.source}` : '', e.forms.length ? `Formen: ${e.forms.join(', ')}` : '', e.specials.join(', ')].filter(Boolean).join('; ');
      const evo = e.evo ? 'ja' : e.evoVia ? `ja (über ${e.evoVia.join(', ')})` : '';
      console.log(`| ${i + 1} | \`${e.id}\` | ${e.name} | ${KIND_DE[e.kind]} | ${e.role} | ${e.elixir ?? '–'} | ${e.size} (${e.radius ?? '–'}) | ${TARGET_DE[e.targets] || e.targets || '–'} | ${e.count} | ${evo} | ${extra} |`);
    });
  } else {
    const by = {};
    for (const e of roster) by[e.kind] = (by[e.kind] || 0) + 1;
    console.log(`${roster.length} Figuren:`, by, '· mit Evo:', roster.filter((e) => e.evo || e.evoVia).length);
  }
}

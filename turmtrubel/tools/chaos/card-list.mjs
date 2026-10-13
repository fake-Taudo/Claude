// Vollständige Kartenliste aus data/cards.json als Markdown (Grundlage für Chaos-Kartenpool und Perk-Interview).
// Alle Werte stammen direkt aus der Kartendatenbank (Level 11, wie im Spiel). Die Rolle ist abgeleitet (siehe roleOf).
// Aufruf: node tools/chaos/card-list.mjs > /tmp/karten.md
import fs from 'node:fs';
import { createDb, TARGET_LABELS } from '../../shared/cards.js';

const raw = JSON.parse(fs.readFileSync(new URL('../../data/cards.json', import.meta.url), 'utf8'));
const db = createDb(raw);

const TRAIT_LABELS = {
  deathDamage: 'Todesschaden', dash: 'Sprint', deployHeal: 'Heilung beim Landen', healOnAttack: 'Heilt beim Angriff',
  kamikaze: 'Kamikaze', charge: 'Ansturm', deathSpawn: 'Spawn beim Tod', pierce: 'Durchschlag', transform: 'Verwandlung',
  shield: 'Schild', riverJump: 'Flusssprung', onHit: 'Treffer-Effekt', zapBack: 'Gegenschlag', multiTarget: 'Mehrfachziel',
  deployBlast: 'Landestoß', deathElixir: 'Elixier beim Tod', shrapnel: 'Splitter', recoil: 'Rückstoß', hook: 'Haken',
  spawner: 'Spawner', secondary: 'Zweitangriff', deathSpell: 'Zauber beim Tod', spread: 'Streuschuss', ramp: 'Strahl steigt',
  attackRamp: 'Angriff steigt', leap: 'Sprung', deployAnywhere: 'überall platzierbar', burrowSpeed: 'gräbt sich ein',
  combo: 'Kombo', parry: 'Parade', stealth: 'Tarnung', enchant: 'Verzauberung', souls: 'Seelen', chargeUp: 'Aufladen',
  melee: 'Nahkampf', elixirGen: 'Elixier-Erzeuger', deathElixirSelf: 'Elixier beim Tod (selbst)', hidden: 'versteckt',
  armor: 'Rüstung', sniper: 'Scharfschütze',
};

const fmt = (v, d = 1) => (v == null ? '–' : Number.isInteger(v) ? String(v) : v.toFixed(d).replace(/\.0+$/, ''));

export function roleOf(card) {
  if (card.class === 'champion') return 'Champion';
  if (card.class === 'hero') return 'Held';
  if (card.type === 'spell') return 'Zauber';
  const u = db.unit(db.unitRefOf(card));
  if (card.type === 'building') return u.traits.spawner || u.traits.elixirGen ? 'Gebäude (erzeugt)' : 'Gebäude (Abwehr)';
  const n = db.groupsOf(card).reduce((s, g) => s + (g.count || 1), 0);
  if (u.targets === 'buildings') return 'Belagerer';
  if (u.traits.kamikaze) return 'Geist';
  if (n >= 3) return 'Schwarm';
  if (u.flying) return 'Flieger';
  if (u.hp * n >= 2500) return 'Tank';
  if (u.range >= 3) return 'Fernkämpfer';
  return 'Nahkämpfer';
}

function unitRow(card) {
  const u = db.unit(db.unitRefOf(card));
  const groups = db.groupsOf(card);
  const n = groups.reduce((s, g) => s + (g.count || 1), 0);
  const extra = groups.length > 1 ? ' (' + groups.map((g) => `${g.count || 1}× ${db.unit(g.unit).name}`).join(', ') + ')' : '';
  const sp = [];
  if (u.flying) sp.push('fliegt');
  if (u.splash > 0) sp.push(`Fläche ${fmt(u.splash, 2)}`);
  if (u.projectile) sp.push('Geschoss');
  if (u.lifetime > 0) sp.push(`Lebensdauer ${fmt(u.lifetime)} s`);
  if (u.towerDamage !== 1) sp.push(`Turmschaden ×${fmt(u.towerDamage, 2)}`);
  for (const k of Object.keys(u.traits)) sp.push(TRAIT_LABELS[k] || k);
  if (card.ability) sp.push(`Fähigkeit „${card.ability.name}“`);
  if (card.evo) sp.push('Evo');
  if (card.forms) sp.push('Formen je Elixier');
  return [
    fmt(u.hp), fmt(u.damage), fmt(u.hitSpeed, 2), fmt(u.range, 2), u.speed ? fmt(u.speed, 2) : '–',
    n + extra, TARGET_LABELS[u.targets] || u.targets, sp.join(', '),
  ];
}

function spellRow(card) {
  const s = card.spell || {};
  const sp = [];
  for (const [k, v] of Object.entries(s)) {
    if (['radius', 'damage', 'targets', 'fx', 'travel'].includes(k)) continue;
    if (typeof v === 'number') sp.push(`${k} ${fmt(v, 2)}`);
    else if (typeof v === 'boolean') sp.push(k);
    else if (typeof v === 'string') sp.push(`${k}: ${v}`);
    else sp.push(k);
  }
  if (card.evo) sp.push('Evo');
  return ['–', s.damage != null ? fmt(s.damage) : '–', '–', s.radius != null ? `Radius ${fmt(s.radius, 2)}` : '–', '–', '–', TARGET_LABELS[s.targets] || s.targets || '–', sp.join(', ')];
}

const rarityDe = { common: 'Gewöhnlich', rare: 'Selten', epic: 'Episch', legendary: 'Legendär', champion: 'Champion' };
const typeDe = { troop: 'Truppe', spell: 'Zauber', building: 'Gebäude' };

export function cardRows() {
  return db.cards.map((c) => ({
    card: c,
    role: roleOf(c),
    cells: [c.name, c.id, typeDe[c.type] + (c.class !== 'normal' ? ` (${c.class === 'hero' ? 'Held' : 'Champion'})` : ''), roleOf(c), c.elixirRule === 'mirror' ? '?' : String(c.elixir), rarityDe[c.rarity] || c.rarity, ...(c.type === 'spell' ? spellRow(c) : unitRow(c))],
  }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const head = ['Name', 'ID', 'Typ', 'Rolle', 'Elixier', 'Seltenheit', 'Leben', 'Schaden', 'Angriff (s)', 'Reichweite', 'Tempo', 'Anzahl', 'Ziele', 'Besonderheiten'];
  const order = ['Tank', 'Nahkämpfer', 'Geist', 'Fernkämpfer', 'Schwarm', 'Flieger', 'Belagerer', 'Gebäude (Abwehr)', 'Gebäude (erzeugt)', 'Zauber', 'Champion', 'Held'];
  const rows = cardRows().sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role) || Number(a.card.elixir) - Number(b.card.elixir) || a.card.name.localeCompare(b.card.name, 'de'));
  console.log('| ' + head.join(' | ') + ' |');
  console.log('|' + head.map(() => '---').join('|') + '|');
  for (const r of rows) console.log('| ' + r.cells.map((x) => String(x).replace(/\|/g, '/')).join(' | ') + ' |');
}

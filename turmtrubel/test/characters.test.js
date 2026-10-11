// Figuren-Manifest (client/assets/characters/manifest.json): jede Einheit hat eine Figur, jede Figur ist vollständig
// beschrieben, und skin.json „character“ wählt eine andere Figur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDb } from '../shared/cards.js';
import { NOT_CHARACTERS, SPAWNER_BUILDINGS } from '../tools/characters/roster.mjs';
import { rawCards } from './helpers.js';

const manifest = JSON.parse(fs.readFileSync(new URL('../client/assets/characters/manifest.json', import.meta.url), 'utf8'));
const system = JSON.parse(fs.readFileSync(new URL('../client/js/characters/system.json', import.meta.url), 'utf8'));
const skin = JSON.parse(fs.readFileSync(new URL('../data/skin.json', import.meta.url), 'utf8'));

test('Figuren: jede Einheit (Truppen, Token, Spawner-Gebäude) hat eine Figur im Manifest', () => {
  const db = createDb(rawCards);
  // gespawnte Typen: Gruppen (Koboldbande, Skelettarmee …) und Formen (Geisterkaiserin) statt der Karte selbst
  const ids = new Set(Object.keys(rawCards.tokens || {}));
  for (const c of db.cards.filter((x) => x.type !== 'spell')) {
    if (c.forms) for (const f of c.forms) ids.add(f.unit);
    else for (const g of db.groupsOf(c)) ids.add(g.unit);
  }
  const missing = [];
  for (const id of ids) {
    if (NOT_CHARACTERS.has(id)) continue;
    let def = null;
    try {
      def = db.unit(id);
    } catch {
      def = null;
    }
    if (!def) continue;
    // Gebäude ohne Spawn-Funktion (Kanone, Tesla, …) bleiben beim Gebäude-Baukasten
    if (def.isBuilding && !SPAWNER_BUILDINGS.includes(id) && !manifest.types[id]) continue;
    const t = manifest.types[id];
    if (!t || !manifest.figures[t.figure]) missing.push(id);
    else if (t.form) assert.ok(manifest.figures[t.figure].forms.includes(t.form), `${id}: Form ${t.form} fehlt in ${t.figure}`);
  }
  assert.deepEqual(missing, []);
});

test('Figuren: alle Figuren des Systems sind gebaut, Box/Balken/Treffer gültig, SVG vorhanden', () => {
  for (const f of system.figures) assert.ok(manifest.figures[f.id], `Figur fehlt: ${f.id}`);
  for (const [id, f] of Object.entries(manifest.figures)) {
    assert.equal(f.box.length, 4, id);
    for (const v of f.box) assert.ok(Number.isFinite(v), `${id}: Box ${JSON.stringify(f.box)}`);
    assert.ok(f.box[1] < -10, `${id}: Box zu flach`);
    assert.ok(Number.isFinite(f.bar) && f.bar > 0, `${id}: LP-Balken`);
    assert.ok(Number.isFinite(f.hit) && f.hit > 0, `${id}: Trefferpunkt`);
    assert.ok(fs.existsSync(new URL(`../client/assets/characters/${f.file}`, import.meta.url)), `${id}: ${f.file} fehlt`);
    for (const st of ['idle', 'attack', 'hit', 'death']) assert.ok(f.anim[st], `${id}: Zustand ${st} fehlt`);
  }
  // Evos der Karten haben Evo-Teile
  for (const f of system.figures.filter((x) => x.evo)) assert.ok(manifest.figures[f.id].evo, `${f.id}: Evo-Teile fehlen`);
});

test('skin.json: „character“ wählt eine andere Figur, archetype wird darauf abgebildet, Zauber bleiben ohne', () => {
  const s = structuredClone(skin);
  s.skins.custom.cards.knight = { character: 'valkyrie' };
  s.skins.custom.cards.archers = { archetype: 'musketeer' };
  s.skins.custom.cards.fireball = { character: 'knight' };
  const db = createDb(rawCards, { skin: s, skinName: 'custom' });
  const base = createDb(rawCards);
  assert.equal(db.card('knight').character, 'valkyrie');
  assert.equal(db.card('archers').character, 'musketeer');
  assert.equal(db.card('fireball').character, undefined);
  assert.equal(db.unit('knight').hp, base.unit('knight').hp, 'Werte unverändert');
  assert.equal(base.card('knight').character, undefined, 'ohne Skin keine Überschreibung');
});

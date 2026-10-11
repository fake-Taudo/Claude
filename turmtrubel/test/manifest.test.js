// Asset-Manifest: listet alle Zeichenbausteine (Figuren, Gebäude, Zauber-Icons, UI, VFX); alles, was cards.json und
// skin.json benutzen, muss darin bekannt sein.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { manifest, manifestCounts, isCharacter } from '../client/js/design/manifest.js';

const presets = JSON.parse(fs.readFileSync(new URL('../client/js/vfx/presets.json', import.meta.url), 'utf8'));
const cards = JSON.parse(fs.readFileSync(new URL('../data/cards.json', import.meta.url), 'utf8'));
const chars = JSON.parse(fs.readFileSync(new URL('../client/assets/characters/manifest.json', import.meta.url), 'utf8'));
const skin = JSON.parse(fs.readFileSync(new URL('../data/skin.json', import.meta.url), 'utf8'));

test('Manifest: alle Gruppen gefüllt, Presets gezählt', () => {
  const n = manifestCounts(presets, chars);
  for (const k of ['characters', 'characterTypes', 'characterStates', 'buildings', 'spellIcons', 'towers', 'uiIcons', 'particleShapes', 'decals', 'vfxPresets']) assert.ok(n[k] > 0, k);
  assert.ok(manifest(presets, chars).vfxPresets.includes('tower.destroy'));
});

test('Manifest: jedes Gebäude aus cards.json hat eine Figur oder einen bekannten Gebäudetyp, Skin-Figuren existieren', () => {
  const m = manifest(null, chars);
  const buildings = [...cards.cards.filter((c) => c.type === 'building').map((c) => [c.id, c.unit?.look?.body]), ...Object.entries(cards.tokens || {}).filter(([, t]) => t.type === 'building').map(([id, t]) => [id, t.look?.body])];
  assert.ok(buildings.length > 5);
  for (const [id, body] of buildings) assert.ok(chars.types[id] || m.buildings.includes(body), `Gebäude „${id}“ (${body}) fehlt im Manifest`);
  for (const sk of Object.values(skin.skins)) {
    for (const [id, o] of Object.entries(sk.cards || {})) {
      const name = o.character || o.archetype;
      if (name) assert.ok(isCharacter(name, chars), `skin.json ${id}: Figur „${name}“ unbekannt`);
    }
  }
});

// Asset-Manifest: listet alle Zeichenbausteine; Archetypen aus skin.json müssen darin bekannt sein.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { manifest, manifestCounts, isArchetype } from '../client/js/design/manifest.js';

const presets = JSON.parse(fs.readFileSync(new URL('../client/js/vfx/presets.json', import.meta.url), 'utf8'));
const cards = JSON.parse(fs.readFileSync(new URL('../data/cards.json', import.meta.url), 'utf8'));

test('Manifest: alle Gruppen gefüllt, Presets gezählt', () => {
  const n = manifestCounts(presets);
  for (const k of ['archetypes', 'weapons', 'hats', 'buildings', 'spellIcons', 'uiIcons', 'particleShapes', 'decals', 'vfxPresets', 'frames']) assert.ok(n[k] > 0, k);
  assert.ok(manifest(presets).vfxPresets.includes('tower.destroy'));
});

test('Manifest: jeder in cards.json benutzte Körper ist ein bekannter Archetyp oder Gebäudetyp', () => {
  const bodies = new Set();
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    if (o.look?.body) bodies.add(o.look.body);
    for (const v of Object.values(o)) walk(v);
  };
  walk(cards);
  assert.ok(bodies.size > 5);
  const buildings = manifest().buildings;
  for (const b of bodies) assert.ok(isArchetype(b) || buildings.includes(b), `Körper „${b}“ fehlt im Manifest`);
});

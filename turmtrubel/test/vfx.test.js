// VFX-Engine: Objekt-Pooling, Lebensdauer, Prioritäten, Preset-Format, Hit-Stop, reduzierte Bewegung.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Vfx } from '../client/js/vfx/engine.js';
import { validatePresets } from '../client/js/vfx/presets.js';

const presets = JSON.parse(fs.readFileSync(new URL('../client/js/vfx/presets.json', import.meta.url), 'utf8'));
// Platzhalter-Texturen (in Node gibt es kein Canvas)
const stub = () => ({ width: 32, height: 32 });
const make = (quality = 'high') => {
  const fx = new Vfx({ tex: stub, decalTex: stub });
  fx.setPresets(presets);
  fx.setQuality(quality);
  return fx;
};
const run = (fx, seconds, dt = 1 / 60) => {
  for (let t = 0; t < seconds; t += dt) fx.update(dt);
};

test('Presets sind gültig und decken alle Zauber-Effekte ab', () => {
  assert.deepEqual(validatePresets(presets), []);
  const cards = JSON.parse(fs.readFileSync(new URL('../data/cards.json', import.meta.url), 'utf8'));
  const list = Array.isArray(cards.cards) ? cards.cards : Object.values(cards.cards || cards);
  const fxNames = new Set(list.filter((c) => c.type === 'spell' && c.spell?.fx).map((c) => c.spell.fx));
  const alias = { barrelRoll: 'spell.log', log: 'spell.log' };
  for (const n of fxNames) assert.ok(presets[alias[n] || 'spell.' + n], `Preset für Zauber-Effekt "${n}" fehlt`);
  for (const n of ['tower.destroy', 'tower.hit', 'king.awake', 'unit.deploy', 'unit.death', 'unit.hit', 'elixir.collect', 'ability.activate', 'evo.deploy', 'phase.win']) assert.ok(presets[n], n);
});

test('Zeitstaffelung: Vorlauf ≤ 200 ms, Kern beginnt vor dem Nachhall', () => {
  for (const [name, pr] of Object.entries(presets)) {
    if (name.startsWith('_') || name.startsWith('proj.trail.')) continue;
    const d = pr.delays || {};
    assert.ok((d.core || 0) <= 0.2, name);
    if (pr.layers.post) assert.ok((d.post || 0) >= (d.core || 0), name);
  }
});

test('Pooling: tote Partikel werden wiederverwendet statt neu angelegt', () => {
  const fx = make();
  fx.emit('spell.fire', { x: 5, y: 5, r: 2.5, team: 'blue' });
  run(fx, 0.1);
  const alive = fx.count;
  assert.ok(alive > 20, 'Explosion erzeugt Partikel');
  run(fx, 4);
  assert.equal(fx.count, 0, 'nach der Lebensdauer sind alle Partikel weg');
  const pooled = fx.free.length;
  assert.ok(pooled >= alive);
  const objects = new Set(fx.free);
  fx.emit('unit.hit', { x: 1, y: 1 });
  assert.ok(fx.parts.length > 0);
  for (const p of fx.parts) assert.ok(objects.has(p), 'neues Partikel stammt aus dem Pool');
});

test('Lebensdauer: Partikel sterben nach ihrer Zeit, Ringe/Decals/Blitze ebenso', () => {
  const fx = make();
  fx.emit('spell.comet', { x: 5, y: 5, r: 2, team: 'red' });
  fx.emit('spell.shock', { x: 3, y: 3, r: 2.5 });
  run(fx, 0.25);
  assert.ok(fx.rings.length > 0 && fx.bolts.length >= 0 && fx.decals.length >= 0);
  run(fx, 6);
  assert.equal(fx.count, 0);
  assert.equal(fx.rings.length, 0);
  assert.equal(fx.bolts.length, 0);
  assert.equal(fx.decals.length, 0, 'Decals verblassen (Rakete: 4 s)');
});

test('Partikelgrenze je Qualität; wichtige Partikel verdrängen Deko', () => {
  const fx = make('low');
  for (let i = 0; i < 40; i++) fx.emit('spell.fire', { x: i, y: 5, r: 2.5 });
  assert.ok(fx.count <= 220, `niedrig: höchstens 220 (ist ${fx.count})`);
  // Budget voll mit Deko (prio 0) → prio-2-Partikel bekommt trotzdem Platz
  const fx2 = make('low');
  while (fx2.count < fx2.max) fx2.burst({ count: 50, scaleCount: false, shape: 'dot', colors: ['#fff'], life: 5, prio: 0 }, { x: 0, y: 0 });
  const before = fx2.stats.dropped;
  fx2.burst({ count: 5, scaleCount: false, min: 5, shape: 'dot', colors: ['#fff'], life: 1, prio: 2 }, { x: 0, y: 0 });
  assert.equal(fx2.stats.dropped, before, 'keine wichtigen Partikel verworfen');
  assert.ok(fx2.parts.filter((p) => p.prio === 2).length === 5);
});

test('Radius-Presets skalieren Strecken mit dem Wirkradius', () => {
  const fx = make();
  fx.emit('spell.fire', { x: 0, y: 0, r: 2.5 });
  const big = Math.max(...fx.rings.map((r) => r.r1));
  const fx2 = make();
  fx2.emit('spell.fire', { x: 0, y: 0, r: 1 });
  const small = Math.max(...fx2.rings.map((r) => r.r1));
  assert.ok(big > small * 2, `Ring wächst mit dem Radius (${small} → ${big})`);
});

test('Hit-Stop verzögert nur die Darstellung und holt danach auf', () => {
  const fx = make();
  fx.hitstop(60);
  run(fx, 0.06);
  assert.ok(fx.stopDebt > 40, 'Verzögerung aufgebaut');
  run(fx, 1);
  assert.equal(fx.stopDebt, 0, 'vollständig aufgeholt');
});

test('Reduzierte Bewegung: kein Wackeln, kein Hit-Stop, Flash gedämpft', () => {
  const fx = make();
  fx.setOptions({ reducedMotion: true });
  fx.emit('tower.destroy', { x: 5, y: 5 });
  run(fx, 0.3);
  assert.deepEqual(fx.shakeOffset(20), [0, 0]);
  assert.equal(fx.stopDebt, 0);
  for (const f of fx.flashes) assert.ok(f.alpha <= 0.08);
  const fx2 = make();
  fx2.setOptions({ shake: 0 });
  fx2.shake('heavy');
  assert.deepEqual(fx2.shakeOffset(20), [0, 0], 'Regler 0 schaltet Wackeln ab');
});

test('Effekte reduzieren: Deko-Elemente entfallen, weniger Partikel', () => {
  const a = make();
  a.emit('spell.fire', { x: 0, y: 0, r: 2.5 });
  run(a, 0.3);
  const b = make();
  b.setOptions({ reduceEffects: true });
  b.emit('spell.fire', { x: 0, y: 0, r: 2.5 });
  run(b, 0.3);
  assert.ok(b.stats.spawned < a.stats.spawned * 0.7, `${b.stats.spawned} < ${a.stats.spawned}`);
});

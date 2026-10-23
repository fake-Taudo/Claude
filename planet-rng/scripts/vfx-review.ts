// Per-aura VFX checklist, generated from the specs (and docs/vfx/perf.json if present).
//
//   npm run vfx:review -> writes docs/vfx/aura-review.md
//
// The checks mirror tests/vfx.test.ts; the table adds what a reviewer looks for: the hero
// and its motif, the ground, the motion law, the accent, the vertical element and the cost.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AURAS, TIER_BY_ID } from '../src/config';
import { VFX_BY_ID, VTIERS } from '../src/config/vfx';
import type { AuraVfxSpec, LayerSpec } from '../src/config/vfx/types';

type PerfRow = { id: string; equipMs: number; high: { avg: number; p95: number }; low: { avg: number } };
const perfPath = resolve('docs/vfx/perf.json');
const perf: Record<string, PerfRow> = existsSync(perfPath) ? Object.fromEntries((JSON.parse(readFileSync(perfPath, 'utf8')) as PerfRow[]).map((r) => [r.id, r])) : {};

const fx = (x: number, d = 1) => x.toFixed(d).replace('.', ',');
const names = (ls: LayerSpec[]) => ls.map((l) => l.name ?? l.type).join(', ') || '–';
const ok = (cond: boolean, required: boolean) => (!required ? '–' : cond ? '✓' : '✗');

function row(spec: AuraVfxSpec, auraName: string, title: string): { line: string; pass: boolean } {
  const t = VTIERS[spec.tier];
  const by = (role: LayerSpec['role']) => spec.layers.filter((l) => l.role === role);
  const hero = by('hero');
  const ground = by('ground');
  const smoke = by('smoke');
  const vertical = spec.layers.filter((l) => l.role === 'vertical' || l.vertical);
  const every = spec.motion.accent.every;
  let steady = 0;
  let burst = 0;
  for (const l of spec.layers) {
    if (l.type === 'particles') {
      steady += l.count;
      burst += l.burst ?? 0;
    }
  }
  const standing = spec.layers.filter((l) => l.type !== 'shockwave' && l.type !== 'lightning' && !(l.type === 'flare' && !l.base)).length;
  const checks = [
    ok(hero.length === 1 && !!hero[0].motif, true),
    ok(ground.length > 0, spec.tier >= 1),
    ok(smoke.length > 0, spec.tier >= 2),
    ok(vertical.length > 0, spec.tier >= 2),
    ok(!!every && every[0] >= 5 && every[1] <= 9, spec.tier >= 2),
    ok(steady <= t.particles && steady + burst <= Math.round(t.particles * 1.35), true),
    ok(standing <= t.layers + 2, true),
  ];
  const pass = !checks.includes('✗');
  const sec = (x: number) => fx(x, x % 1 ? 1 : 0);
  const accent = every ? `alle ${every[0] === every[1] ? sec(every[0]) : `${sec(every[0])}–${sec(every[1])}`} s${by('accent').length ? ` (${names(by('accent'))})` : ''}` : '–';
  const motion = `${fx(spec.motion.baseSpinDegPerSec)}°/s, Atmen ${fx(spec.motion.breatheHz, 2)} Hz`;
  const p = perf[spec.id];
  const cost = p ? `${fx(p.high.avg)} / ${fx(p.low.avg)}` : '–';
  const equip = p ? fx(p.equipMs, 0) : '–';
  const heroCell = hero[0] ? `${hero[0].name ?? hero[0].type} (\`${hero[0].motif}\`)` : '–';
  const line = `| ${auraName}${title ? ` ⟨${title}⟩` : ''} | ${heroCell} | ${names(ground)} | ${motion} | ${accent} | ${names(vertical)} | ${steady}+${burst} / ${t.particles} | ${standing} / ${t.layers}+2 | ${cost} | ${equip} | ${checks.join(' ')} |`;
  return { line, pass };
}

const out: string[] = [];
out.push('# Aura-VFX: Prüfliste je Aura');
out.push('');
out.push('Erzeugt mit `npm run vfx:review` aus den Specs in `src/config/vfx/specs/` (und, falls');
out.push('vorhanden, den Messwerten aus `docs/vfx/perf.json`, erzeugt mit `scripts/dev/perf.mjs`).');
out.push('Nicht von Hand bearbeiten.');
out.push('');
out.push('Prüfspalten (✓ erfüllt, ✗ verletzt, – für die Stufe nicht verlangt), in dieser Reihenfolge:');
out.push('Hero mit eigenem Motiv · Boden (ab V1) · Gegenlicht-Rauch (ab V2) · vertikales Element (ab V2) ·');
out.push('Akzent alle 5–9 s (ab V2) · Partikelbudget · Schichtbudget.');
out.push('');
out.push('Partikel: dauerhaft + zusätzlich beim Akzent / Budget der Stufe (mit Akzent bis 135 %). Schichten: stehende');
out.push('Schichten (ohne reine Akzent-Schichten) / Budget + 2 Stützschichten. Kosten: ms pro Bild auf Hoch / Niedrig im Headless-Chromium');
out.push('mit Software-Rasterung (390×844, DPR 2 bei Hoch); relativ vergleichen, echte Geräte sind schneller.');
out.push('Equip: ms für Anlegen und erstes Bild mit kaltem Textur-Cache (nach einem Wurf vorgebacken).');
out.push('');

let fails = 0;
for (let tier = 0; tier <= 6; tier++) {
  const list = AURAS.filter((a) => VFX_BY_ID[a.id]?.tier === tier);
  if (!list.length) continue;
  const t = VTIERS[tier as 0];
  const rarities = [...new Set(list.map((a) => TIER_BY_ID[a.tier].name))].join(', ');
  out.push(`## V${tier} – ${rarities}`);
  out.push('');
  out.push(`Ausdehnung ${fx(t.extent)} D, bis ${t.particles} Partikel, ${t.layers} Schichten, Intro ${fx(t.introSec)} s, Dimmung ${Math.round(t.dim * 100)} %.`);
  out.push('');
  out.push('| Aura | Hero (Motiv) | Boden | Bewegung | Akzent | Vertikal | Partikel | Schichten | Kosten Hoch/Niedrig (ms) | Equip (ms) | Prüfung |');
  out.push('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const a of list) {
    const r = row(VFX_BY_ID[a.id], a.name, a.title ?? '');
    if (!r.pass) fails++;
    out.push(r.line);
  }
  out.push('');
}
out.push(fails ? `**${fails} Aura(s) verletzen die Prüfliste.**` : `Alle ${AURAS.length} Auren erfüllen die Prüfliste.`);
out.push('');
writeFileSync(resolve('docs/vfx/aura-review.md'), out.join('\n'));
console.log(`docs/vfx/aura-review.md written (${AURAS.length} auras, ${fails} failing)`);

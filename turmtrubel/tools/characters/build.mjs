// Build-Skript der Figuren: führt den Design-Code (tools/characters/figures/<id>.mjs) aus und schreibt
//   client/assets/characters/<id>/<id>.svg      Vektor-Quelle mit Teilen, Knochen-Bezug, Ausdrücken, Formen
//   client/assets/characters/manifest.json      Anker, Größen, Teamzonen, Skelett, Animationsdaten, Typ-Zuordnung
//
//   node tools/characters/build.mjs [id …]     (ohne IDs: alle Figuren mit Design-Code)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { figure } from './dsl.mjs';
import { FIGURES, FORM_LOOKS } from './figures.mjs';
import * as SYS from './system.mjs';
import { loadRoster } from './roster.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const OUT = path.join(ROOT, 'client/assets/characters');
const DESIGN = path.join(HERE, 'figures');

/** Standard-Animationen je Skelett-Vorlage; die Figur überschreibt per F.anim(). */
const DEFAULT_ANIM = {
  biped: {
    idle: { prog: 'biped.idle' },
    walk: { prog: 'biped.walk' },
    charge: { prog: 'biped.run' },
    attack: { prog: 'atk.swing', hit: 0.55 },
    hit: { prog: 'biped.hit' },
    spawn: { prog: 'biped.spawn' },
    death: { prog: 'biped.death' },
    stun: { prog: 'biped.stun' },
    sleep: { prog: 'biped.sleep' },
  },
  robe: {
    idle: { prog: 'biped.idle' },
    walk: { prog: 'biped.walk', p: { stride: 10, bob: 1.6 } },
    charge: { prog: 'biped.run' },
    attack: { prog: 'atk.cast', hit: 0.55 },
    hit: { prog: 'biped.hit' },
    spawn: { prog: 'biped.spawn' },
    death: { prog: 'biped.death' },
    stun: { prog: 'biped.stun' },
    sleep: { prog: 'biped.sleep' },
  },
  flyer: {
    idle: { prog: 'flyer.idle' },
    walk: { prog: 'flyer.walk' },
    charge: { prog: 'flyer.walk' },
    attack: { prog: 'flyer.bite', hit: 0.55 },
    hit: { prog: 'flyer.hit' },
    spawn: { prog: 'flyer.spawn' },
    death: { prog: 'flyer.death' },
    stun: { prog: 'flyer.idle', p: { flap: 10 } },
  },
  quadruped: {
    idle: { prog: 'quad.idle' },
    walk: { prog: 'quad.walk' },
    charge: { prog: 'quad.walk', p: { stride: 34, bob: 4 } },
    attack: { prog: ['quad.idle'], hit: 0.55 },
    hit: { prog: 'quad.hit' },
    spawn: { prog: 'quad.spawn' },
    death: { prog: 'quad.death' },
  },
  rider: {
    idle: { prog: 'quad.idle' },
    walk: { prog: 'quad.walk' },
    charge: { prog: 'quad.walk', p: { stride: 36, bob: 4, riderLean: 14 } },
    attack: { prog: ['quad.idle'], hit: 0.55 },
    hit: { prog: 'quad.hit' },
    spawn: { prog: 'quad.spawn' },
    death: { prog: 'quad.death' },
  },
  hover: { idle: { prog: 'hover.idle' }, walk: { prog: 'hover.idle', p: { float: 2 } }, attack: { prog: 'hover.idle', hit: 0.55 }, hit: { prog: 'generic.hit' }, spawn: { prog: 'generic.spawn' }, death: { prog: 'generic.death' } },
  vehicle: { idle: { prog: 'vehicle.idle' }, walk: { prog: 'vehicle.walk' }, charge: { prog: 'vehicle.walk', p: { spins: 2 } }, attack: { prog: 'vehicle.idle', hit: 0.55 }, hit: { prog: 'generic.hit' }, spawn: { prog: 'generic.spawn' }, death: { prog: 'generic.death' } },
  blob: { idle: { prog: 'blob.idle' }, walk: { prog: 'blob.walk' }, attack: { prog: 'blob.walk', hit: 0.55 }, hit: { prog: 'generic.hit' }, spawn: { prog: 'generic.spawn' }, death: { prog: 'generic.death' } },
  building: { idle: { prog: 'building.idle' }, attack: { prog: 'building.spawnUnit', hit: 0.3 }, hit: { prog: 'generic.hit' }, spawn: { prog: 'building.spawn' }, death: { prog: 'building.death' } },
  serpent: { idle: { prog: 'hover.idle' }, walk: { prog: 'hover.idle' }, attack: { prog: 'hover.idle', hit: 0.55 }, hit: { prog: 'generic.hit' }, spawn: { prog: 'generic.spawn' }, death: { prog: 'generic.death' } },
};

function mergeAnim(rig, own) {
  const out = {};
  const def = DEFAULT_ANIM[rig] || DEFAULT_ANIM.biped;
  for (const k of new Set([...Object.keys(def), ...Object.keys(own)])) {
    const a = def[k] || {};
    const b = own[k] || {};
    out[k] = { ...a, ...b, p: { ...(a.p || {}), ...(b.p || {}) } };
    if (!Object.keys(out[k].p).length) delete out[k].p;
  }
  return out;
}

const r1 = (v) => Math.round(v * 10) / 10;

export async function buildFigure(id) {
  const row = FIGURES.find((f) => f.id === id);
  if (!row) throw new Error('Unbekannte Figur ' + id);
  const file = path.join(DESIGN, `${id}.mjs`);
  const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
  const F = figure(row);
  await mod.default(F);
  const svg = F.svg();
  fs.mkdirSync(path.join(OUT, id), { recursive: true });
  fs.writeFileSync(path.join(OUT, id, `${id}.svg`), svg);
  const box = F.box().map(r1);
  const size = SYS.sizeOfHeight(row.h);
  const roster = loadRoster().find((r) => r.id === id) || {};
  const forms = [...new Set(F.parts.flatMap((p) => p.o.form || []).flatMap((f) => String(f).split(/\s+/)))].filter((f) => f && f !== 'base' && f !== '*');
  const entry = {
    file: `${id}/${id}.svg`,
    hash: crypto.createHash('sha1').update(svg).digest('hex').slice(0, 8),
    rig: F.rigType,
    family: row.fam,
    size: size.id,
    outline: size.outline,
    height: row.h,
    box,
    hover: F.meta.hover ?? (roster.flying ? 1.1 : 0),
    bar: r1(Math.max(row.h, -box[1] / SYS.MU_PER_TILE) + 0.12),
    hit: r1((-box[1] / SYS.MU_PER_TILE) * 0.5),
    muzzle: F.meta.muzzle || null,
    main: row.main,
    accent: row.acc,
    team: { zones: row.zones },
    bones: F.bones.map((b) => [b.name, b.parent, r1(b.x), r1(b.y)]),
    anim: mergeAnim(F.rigType, F.anims),
    views: F.parts.some((p) => p.o.view === 'back') ? ['front', 'back'] : ['front'],
    variants: Math.max(0, ...F.parts.map((p) => (p.o.variant != null ? Math.max(...[].concat(p.o.variant)) + 1 : 0))),
    forms,
    evo: F.meta.evo || (F.parts.some((p) => p.o.evo === 'evo') ? { aura: row.acc } : null),
    events: F.meta.events || null,
  };
  return { id, entry, bytes: Buffer.byteLength(svg), parts: F.parts.length };
}

function typeMap(figures) {
  const types = {};
  for (const id of Object.keys(figures)) {
    if (id === 'tower-king') types.tower_king = { figure: id };
    else if (id === 'tower-guard') types.tower_princess = { figure: id };
    else types[id] = { figure: id };
  }
  for (const [type, fm] of Object.entries(FORM_LOOKS)) if (figures[fm.figure]) types[type] = { figure: fm.figure, form: fm.form };
  return types;
}

export async function buildAll(only) {
  const ids = only?.length ? only : fs.readdirSync(DESIGN).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).map((f) => f.slice(0, -4));
  const manPath = path.join(OUT, 'manifest.json');
  const prev = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, 'utf8')) : { figures: {} };
  const figures = only?.length ? { ...prev.figures } : {};
  const report = [];
  for (const id of ids) {
    const r = await buildFigure(id);
    figures[id] = r.entry;
    report.push(r);
  }
  const sorted = Object.fromEntries(Object.keys(figures).sort().map((k) => [k, figures[k]]));
  const manifest = {
    _info: 'Erzeugt von tools/characters/build.mjs – nicht von Hand bearbeiten. Format: docs/CHAR_SYSTEM.md §9.4.',
    version: 1,
    muPerTile: SYS.MU_PER_TILE,
    system: {
      team: { blue: SYS.TEAM.blue, red: SYS.TEAM.red, placeholders: SYS.TEAM.placeholders },
      outline: SYS.OUTLINE,
      lod: SYS.LOD,
      states: SYS.STATES,
      quality: SYS.QUALITY,
      materialTones: SYS.MATERIAL_TONES,
      materialKinds: SYS.MATERIAL_KINDS,
    },
    types: typeMap(sorted),
    figures: sorted,
  };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(manPath, JSON.stringify(manifest) + '\n');
  return { report, manifest };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { report, manifest } = await buildAll(process.argv.slice(2));
  for (const r of report) console.log(`${r.id.padEnd(22)} ${String(r.parts).padStart(3)} Teile  ${(r.bytes / 1024).toFixed(1).padStart(6)} KB`);
  console.log(`${Object.keys(manifest.figures).length} Figuren im Manifest`);
}

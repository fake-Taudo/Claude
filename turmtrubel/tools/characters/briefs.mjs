// Design-Briefs (Phase 3): Texte in tools/characters/briefs/*.mjs, strukturierte Daten aus figures.mjs/system.mjs.
// renderBriefs(dir) schreibt docs/briefs/<id>.md und docs/briefs/README.md; checkBriefs() prüft Vollständigkeit.
//
//   node tools/characters/briefs.mjs          → prüfen und schreiben
//   node tools/characters/briefs.mjs --check  → nur prüfen
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIGURES, FORM_LOOKS } from './figures.mjs';
import { FAMILIES, SIG_CATEGORIES, OUTLINE, TEAM, sizeOfHeight, materialTones } from './system.mjs';
import { loadRoster } from './roster.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

export async function loadBriefs() {
  const dir = path.join(HERE, 'briefs');
  const all = {};
  if (!fs.existsSync(dir)) return all;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.mjs')).sort()) {
    const mod = await import(path.join(dir, f));
    for (const [id, b] of Object.entries(mod.default)) {
      if (all[id]) throw new Error(`Brief ${id} doppelt (${f})`);
      all[id] = { ...b, _file: f };
    }
  }
  return all;
}

const ANIMS = [
  ['idle', 'Idle'],
  ['walk', 'Laufen'],
  ['attack', 'Angriff'],
  ['hit', 'Treffer'],
  ['spawn', 'Erscheinen'],
  ['death', 'Tod'],
];
const DETAIL_KEYS = [
  ['kleidung', 'Kleidung und Rüstung'],
  ['material', 'Materialien'],
  ['muster', 'Muster und Nähte'],
  ['schnallen', 'Schnallen, Nieten und Gravuren'],
  ['abnutzung', 'Abnutzung'],
  ['accessoires', 'Accessoires'],
];
const KIND_DE = { troop: 'Truppe', champion: 'Champion', hero: 'Held', token: 'Beschwörung', spawner: 'Gebäude-Spawner', tower: 'Turmfigur' };
const FACTION_DE = { krone: 'Krone', nordvolk: 'Nordvolk', riesen: 'Riesen', werkstatt: 'Werkstatt', kobolde: 'Kobolde', zirkel: 'Zirkel', gruft: 'Gruft', elementar: 'Elementar', tiere: 'Tiere und Drachen', gesindel: 'Gesindel' };
// Satzende: Punkt nach Kleinbuchstabe, Ziffer oder Klammer (Abkürzungen wie „P.E.K.K.A.“ zählen nicht)
const sentences = (s) => (s.match(/[a-zäöüß0-9)»“"][.!?](\s|$)/g) || []).length;
const n2 = (x) => x.toFixed(2).replace('.', ',');

export async function checkBriefs(briefs) {
  const roster = loadRoster();
  const byId = new Map(roster.map((r) => [r.id, r]));
  const out = [];
  for (const f of FIGURES) {
    const b = briefs[f.id];
    const r = byId.get(f.id) || {};
    if (!b) {
      out.push([f.id, 'Brief fehlt']);
      continue;
    }
    for (const k of ['concept', 'unique', 'silhouette', 'face', 'weapon']) if (!b[k] || b[k].length < 20) out.push([f.id, `Feld ${k} fehlt oder zu kurz`]);
    const sc = sentences(b.concept || '');
    if (sc < 2 || sc > 3) out.push([f.id, `Konzept hat ${sc} Sätze (2–3 verlangt)`]);
    for (const [k] of DETAIL_KEYS) if (!b.details?.[k]) out.push([f.id, `Detail ${k} fehlt`]);
    for (const [k] of ANIMS) if (!b.anim?.[k]?.length) out.push([f.id, `Animation ${k} fehlt`]);
    if ((r.evo || r.evoVia) && !b.special?.evo) out.push([f.id, 'Evo-Optik fehlt']);
    if (r.kind === 'champion' && !b.special?.ability) out.push([f.id, 'Champion-Fähigkeit fehlt']);
    if (r.kind === 'hero' && !b.special?.pose) out.push([f.id, 'Helden-Pose fehlt']);
    for (const form of r.forms || []) if (!b.special?.forms?.[FORM_LOOKS[form]?.form]) out.push([f.id, `Form ${form} fehlt`]);
  }
  for (const id of Object.keys(briefs)) if (!FIGURES.some((f) => f.id === id)) out.push([id, 'Brief ohne Figur']);
  // Waffen- und Gesichtsbeschreibungen dürfen sich nicht wiederholen
  for (const key of ['weapon', 'face', 'unique']) {
    const seen = new Map();
    for (const [id, b] of Object.entries(briefs)) {
      const t = (b[key] || '').toLowerCase();
      if (seen.has(t)) out.push([id, `${key} identisch mit ${seen.get(t)}`]);
      else seen.set(t, id);
    }
  }
  return out;
}

function renderOne(f, b, r) {
  const size = sizeOfHeight(f.h);
  const fam = FAMILIES[f.fam];
  const tm = materialTones(f.main);
  const ta = materialTones(f.acc);
  const L = [];
  const elixir = r.elixir != null ? `${r.elixir} Elixier` : null;
  L.push(`# ${r.name || f.id} (\`${f.id}\`)`);
  L.push('');
  L.push(`> ${[KIND_DE[r.kind] || 'Figur', r.role, elixir, `Herkunft: ${FACTION_DE[f.faction] || f.faction}`, `Familie: ${fam.name}`, `Größe ${size.id} (${n2(f.h)} Felder)`].filter(Boolean).join(' · ')}`);
  if (f.base) L.push(`> Held von [\`${f.base}\`](${f.base}.md)`);
  L.push('');
  L.push('## Konzept');
  L.push('');
  L.push(b.concept);
  L.push('');
  L.push('## Eigenständigkeit');
  L.push('');
  L.push(b.unique);
  L.push('');
  L.push('## Silhouette, Proportionen, Größe');
  L.push('');
  L.push(`- **Familie:** ${fam.name} (${fam.shape})`);
  L.push(`- **Silhouette:** ${b.silhouette}`);
  const p = f.prop;
  if (f.fam !== 'bauwerk') L.push(`- **Proportionsformel:** Kopf ${n2(p.head)} · Beine ${n2(p.legs)} · Arme ${n2(p.arms)} · Hände ${n2(p.hands)} · Waffe/Signature ${n2(p.weapon)} (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))`);
  L.push(`- **Übertriebenes Merkmal:** ${f.over}`);
  L.push(`- **Größenklasse:** ${size.id}, ${n2(f.h)} Felder hoch, Außenkontur „${OUTLINE.tiers[size.outline].name}“`);
  L.push('');
  L.push('## Farbpalette');
  L.push('');
  L.push('| Rolle | Hex | Hinweis |');
  L.push('|---|---|---|');
  L.push(`| Haupt | \`${f.main}\` | ${b.mainName || 'größte Eigenfarbfläche'} |`);
  L.push(`| Akzent | \`${f.acc}\` | ${b.accName || 'Akzente'} |`);
  L.push(`| Schatten | \`${tm.shade}\` · Tiefe \`${tm.deep}\` | Hauptfarbe unten rechts, Falten (Akzent: \`${ta.shade}\`) |`);
  L.push(`| Licht · Glanz | \`${tm.light}\` · \`${tm.gloss}\` | Flächen oben links, Spitzlichter |`);
  L.push(`| Kontur | \`${OUTLINE.ink}\` außen · \`${tm.line}\` innen | Stufe ${size.outline} |`);
  L.push(`| Teamzone | Blau \`${TEAM.blue.main}\` / Rot \`${TEAM.red.main}\` | ${f.zones.join(', ')}; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |`);
  if (f.skin) L.push(`| Haut | \`${f.skin}\` | Hautton |`);
  for (const [name, hex] of b.materials || []) L.push(`| ${name} | \`${hex}\` | Materialfarbe |`);
  L.push('');
  L.push('## Signature-Element');
  L.push('');
  L.push(`**${f.sig}** (${SIG_CATEGORIES[f.cat]}). ${b.signature || ''}`.trim());
  L.push('');
  L.push('## Details');
  L.push('');
  for (const [k, name] of DETAIL_KEYS) L.push(`- **${name}:** ${b.details[k]}`);
  L.push('');
  L.push('## Gesicht und Ausdruck');
  L.push('');
  L.push(`${b.face} Persönlichkeit: ${f.mood}.`);
  L.push('');
  L.push('## Waffe / Werkzeug');
  L.push('');
  L.push(b.weapon);
  L.push('');
  L.push('## Animationen');
  L.push('');
  for (const [k, name] of ANIMS) {
    L.push(`**${name}**`);
    L.push('');
    for (const x of b.anim[k]) L.push(`- ${x}`);
    L.push('');
  }
  const sp = b.special || {};
  const items = [];
  if (sp.ability) items.push(`**Fähigkeit (Champion):** ${sp.ability}`);
  if (sp.aura) items.push(`**Aura und Effekt-Hooks:** ${sp.aura}`);
  if (sp.pose) items.push(`**Helden-Pose und Rang-Merkmal:** ${sp.pose}`);
  if (sp.evo) items.push(`**Evolution:** ${sp.evo}`);
  for (const [form, text] of Object.entries(sp.forms || {})) items.push(`**Form „${form}“:** ${text}`);
  if (sp.variants) items.push(`**Schwarm-Varianten:** ${sp.variants}`);
  if (sp.extra) items.push(sp.extra);
  if (items.length) {
    L.push('## Besonderheiten');
    L.push('');
    for (const x of items) L.push(`- ${x}`);
    L.push('');
  }
  return L.join('\n');
}

export async function renderBriefs(outDir) {
  const briefs = await loadBriefs();
  const roster = loadRoster();
  const byId = new Map(roster.map((r) => [r.id, r]));
  fs.mkdirSync(outDir, { recursive: true });
  let n = 0;
  const index = [];
  for (const f of FIGURES) {
    const b = briefs[f.id];
    if (!b) continue;
    const r = byId.get(f.id) || {};
    fs.writeFileSync(path.join(outDir, `${f.id}.md`), renderOne(f, b, r));
    index.push([f, r]);
    n++;
  }
  const L = ['# Design-Briefs', '', `${n} von ${FIGURES.length} Figuren. Erzeugt von \`node tools/characters/briefs.mjs\` aus [\`tools/characters/briefs/\`](../../tools/characters/briefs/) und [\`figures.mjs\`](../../tools/characters/figures.mjs). Regeln: [\`CHAR_SYSTEM.md\`](../CHAR_SYSTEM.md), Prüfung: [\`DISTINCT_MATRIX.md\`](../DISTINCT_MATRIX.md).`, ''];
  const byFaction = {};
  for (const [f, r] of index) (byFaction[f.faction] ??= []).push([f, r]);
  for (const [fac, list] of Object.entries(byFaction)) {
    L.push(`## ${FACTION_DE[fac] || fac}`);
    L.push('');
    L.push('| Figur | Art | Familie | Signature-Element |');
    L.push('|---|---|---|---|');
    for (const [f, r] of list) L.push(`| [${r.name || f.id}](${f.id}.md) | ${KIND_DE[r.kind] || '–'} | ${FAMILIES[f.fam].name} | ${f.sig} |`);
    L.push('');
  }
  fs.writeFileSync(path.join(outDir, 'README.md'), L.join('\n'));
  return n;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const briefs = await loadBriefs();
  const problems = await checkBriefs(briefs);
  for (const [id, msg] of problems) console.log(`${id}: ${msg}`);
  console.log(`${Object.keys(briefs).length}/${FIGURES.length} Briefs · ${problems.length} Probleme`);
  if (!process.argv.includes('--check')) console.log(`${await renderBriefs(path.join(ROOT, 'docs/briefs'))} Briefs geschrieben`);
  if (process.argv.includes('--check') && problems.length) process.exit(1);
}

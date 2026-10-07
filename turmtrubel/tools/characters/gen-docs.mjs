// Erzeugt aus figures.mjs + system.mjs:
//   client/js/characters/system.json   maschinenlesbares System (Familien, Größen, Team, Zustände, Events, Figuren)
//   docs/DISTINCT_MATRIX.md            Unterscheidbarkeits-Matrix mit Regelprüfung
//   docs/char-palette.png              Farbtafel aller Figuren (nur mit --png, braucht Playwright + Chromium)
//   docs/briefs/<id>.md                Design-Briefs (sobald briefs/*.mjs existieren)
//
//   node tools/characters/gen-docs.mjs [--png] [--check]
// --check: nur prüfen (Exit-Code 1 bei Regelverstößen), nichts schreiben.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIGURES, FORM_LOOKS } from './figures.mjs';
import * as S from './system.mjs';
import { loadRoster } from './roster.mjs';
import { hexToLab } from './color.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = new Set(process.argv.slice(2));

const roster = loadRoster();
const rosterById = new Map(roster.map((r) => [r.id, r]));
const KIND_DE = { troop: 'Truppe', champion: 'Champion', hero: 'Held', token: 'Beschwörung', spawner: 'Gebäude-Spawner', tower: 'Turmfigur' };

function lch(hex) {
  const [L, a, b] = hexToLab(hex);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C: Math.hypot(a, b), h };
}
/** Grobe Farbbezeichnung für die Matrix (Farbton + Helligkeit). */
function colorName(hex) {
  const { L, C, h } = lch(hex);
  const light = L > 82 ? 'sehr hell' : L > 65 ? 'hell' : L > 40 ? 'mittel' : L > 22 ? 'dunkel' : 'sehr dunkel';
  if (C < 9) return `${light} grau`.replace('sehr hell grau', 'weißlich').replace('sehr dunkel grau', 'schwarz');
  const names = [
    [20, 'rosa-rot'], [45, 'orange-rot'], [70, 'orange'], [95, 'gelb'], [120, 'gelbgrün'], [155, 'grün'],
    [190, 'türkis'], [230, 'cyan-blau'], [270, 'blau'], [300, 'violett'], [330, 'purpur'], [360, 'magenta'],
  ];
  const n = names.find(([lim]) => h < lim)[1];
  return `${light} ${n}`;
}

function check() {
  const c = S.colorViolations(FIGURES);
  const m = S.matrixViolations(FIGURES);
  const missing = roster.filter((r) => !FIGURES.some((f) => f.id === r.id)).map((r) => r.id);
  const extra = FIGURES.filter((f) => !rosterById.has(f.id)).map((f) => f.id);
  return { color: c, matrix: m, missing, extra };
}

function systemJson() {
  const figures = FIGURES.map((f) => {
    const r = rosterById.get(f.id) || {};
    const size = S.sizeOfHeight(f.h);
    return {
      id: f.id,
      name: r.name || f.id,
      kind: r.kind || 'token',
      faction: f.faction,
      family: f.fam,
      size: size.id,
      outline: size.outline,
      height: f.h,
      main: f.main,
      accent: f.acc,
      ...(f.skin ? { skin: f.skin } : {}),
      signature: { category: f.cat, text: f.sig },
      teamZones: f.zones,
      proportion: f.prop,
      exaggerated: f.over,
      mood: f.mood,
      idle: f.idle,
      attack: f.attack,
      ...(f.base ? { base: f.base } : {}),
      ...(f.variants ? { variants: f.variants } : {}),
      ...(r.evo || r.evoVia ? { evo: true } : {}),
      ...(r.forms?.length ? { forms: r.forms } : {}),
    };
  });
  return {
    _info:
      'Archetypen- und Unterscheidungssystem der Figuren (docs/CHAR_SYSTEM.md). Erzeugt von tools/characters/gen-docs.mjs aus tools/characters/system.mjs und figures.mjs – nicht von Hand bearbeiten. Liegt unter client/js/characters/ statt src/characters/, weil der Client hier seine Quellen hat.',
    version: 1,
    muPerTile: S.MU_PER_TILE,
    families: S.FAMILIES,
    signatureCategories: S.SIG_CATEGORIES,
    sizeClasses: S.SIZE_CLASSES,
    outline: S.OUTLINE,
    team: S.TEAM,
    lod: S.LOD,
    states: S.STATES,
    statePriority: S.STATE_PRIORITY,
    events: S.EVENTS,
    quality: S.QUALITY,
    rigs: S.RIGS,
    colorRules: S.COLOR_RULES,
    related: S.RELATED,
    forms: FORM_LOOKS,
    figures,
  };
}

function matrixMd(res) {
  const L = [];
  const fams = {};
  const sizes = {};
  for (const f of FIGURES) {
    fams[f.fam] = (fams[f.fam] || 0) + 1;
    const k = S.sizeOfHeight(f.h).id;
    sizes[k] = (sizes[k] || 0) + 1;
  }
  L.push('# Unterscheidbarkeits-Matrix (Phase 2 des Charakter-Neubaus)');
  L.push('');
  L.push('Erzeugt von `node tools/characters/gen-docs.mjs` aus [`tools/characters/figures.mjs`](../tools/characters/figures.mjs). Regeln und Begriffe: [`CHAR_SYSTEM.md`](CHAR_SYSTEM.md). Jede Figur bekommt einen Design-Brief in [`briefs/`](briefs/).');
  L.push('');
  L.push('![Farbtafel aller Figuren: Hauptfarbe als Fläche, Akzent als Kreis, nach Farbton sortiert](char-palette.png)');
  L.push('');
  L.push('## Prüfergebnis');
  L.push('');
  const ok = (n) => (n ? `**${n} Verstöße**` : '0 Verstöße');
  L.push(`| Regel | Ergebnis |`);
  L.push('|---|---|');
  L.push(`| Alle ${roster.length} Figuren des Rosters erfasst | ${res.missing.length ? 'fehlt: ' + res.missing.join(', ') : 'ja'} |`);
  L.push(`| Keine zwei Zeilen mit gleicher Familie + Farbe (ΔE < 10) + Signature-Kategorie | ${ok(res.matrix.filter((x) => x[0] === 'Familie+Farbe+Signature').length)} |`);
  L.push(`| Signature-Element-Texte eindeutig | ${ok(res.matrix.filter((x) => x[0] === 'Signature-Text').length)} |`);
  L.push(`| Proportionsformel je Familie und Größenklasse eindeutig | ${ok(res.matrix.filter((x) => x[0] === 'Proportionsformel').length)} |`);
  L.push(`| Idle- und Angriffsbeschreibung eindeutig | ${ok(res.matrix.filter((x) => x[0] === 'Idle' || x[0] === 'Angriff').length)} |`);
  L.push(`| Hauptfarbe nicht verwechselbar mit Blau/Rot (ΔE ≥ ${S.COLOR_RULES.teamMain} zum Grundton, ≥ ${S.COLOR_RULES.teamShade} zum Schattenton, ≥ ${S.COLOR_RULES.teamLight} zum Lichtton) | ${ok(res.color.filter((x) => x[0].startsWith('Team')).length)} |`);
  L.push(`| Gleiche Familie: ΔE Haupt ≥ ${S.COLOR_RULES.family.main} oder (≥ ${S.COLOR_RULES.family.mainWithAccent} und Akzent ≥ ${S.COLOR_RULES.family.accent}) | ${ok(res.color.filter((x) => x[0] === 'Familie').length)} |`);
  L.push(`| Alle Paare: Farbschema ≥ ${S.COLOR_RULES.global.scheme} und nie Haupt < ${S.COLOR_RULES.global.main} bei Akzent < ${S.COLOR_RULES.global.accent} | ${ok(res.color.filter((x) => x[0] === 'global').length)} |`);
  L.push(`| Verwandte Paare (Held ↔ Basis, Golem → Golemit …): Farbschema ≥ ${S.COLOR_RULES.related.scheme} | ${ok(res.color.filter((x) => x[0] === 'verwandt').length)} |`);
  L.push('');
  L.push('Farbabstände sind CIEDE2000. Das Farbschema zweier Figuren ist √(ΔE_Haupt² + (0,6 · ΔE_Akzent)²), weil die Hauptfarbe die größere Fläche hat.');
  L.push('');
  const v = [...res.color, ...res.matrix];
  if (v.length) {
    L.push('### Offene Verstöße');
    L.push('');
    for (const x of v) L.push(`- ${x[0]}: ${x[1]} (${x[2]})`);
    L.push('');
  }
  L.push('### Verteilung');
  L.push('');
  L.push('| Familie | Figuren |');
  L.push('|---|---|');
  for (const [k, n] of Object.entries(fams).sort((a, b) => b[1] - a[1])) L.push(`| ${S.FAMILIES[k].name} | ${n} |`);
  L.push('');
  L.push(`Größenklassen: ${S.SIZE_CLASSES.map((c) => `${c.id} ${sizes[c.id] || 0}`).join(' · ')}`);
  L.push('');
  L.push('### Engste Farbschemata (zur Kontrolle)');
  L.push('');
  const pairs = [];
  for (let i = 0; i < FIGURES.length; i++) for (let j = i + 1; j < FIGURES.length; j++) pairs.push([FIGURES[i], FIGURES[j], S.schemeDistance(FIGURES[i], FIGURES[j])]);
  pairs.sort((a, b) => a[2] - b[2]);
  L.push('| Figur A | Figur B | Schema-ΔE | Unterschied trotz Nähe |');
  L.push('|---|---|---|---|');
  for (const [a, b, s] of pairs.slice(0, 12)) {
    const diff = [a.fam !== b.fam ? `Familie ${S.FAMILIES[a.fam].name} ↔ ${S.FAMILIES[b.fam].name}` : '', S.sizeOfHeight(a.h).id !== S.sizeOfHeight(b.h).id ? `Größe ${S.sizeOfHeight(a.h).id} ↔ ${S.sizeOfHeight(b.h).id}` : '', S.isRelated(a, b) ? 'gewollt verwandt' : ''].filter(Boolean).join('; ');
    L.push(`| \`${a.id}\` | \`${b.id}\` | ${s.toFixed(1)} | ${diff || 'Signature: ' + a.sig + ' ↔ ' + b.sig} |`);
  }
  L.push('');
  L.push('## Matrix');
  L.push('');
  L.push('Höhe = sichtbare Höhe in Feldern (Ruhepose, Fuß bis Scheitel). Teamzonen kommen zu Bodenring und Teamsymbol hinzu, die jede Figur hat.');
  L.push('');
  L.push('| # | Figur | Art | Familie | Größe (Höhe) | Hauptfarbe | Akzent | Signature-Element | Kategorie | Teamzonen | Nächstes Farbschema |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|');
  FIGURES.forEach((f, i) => {
    const r = rosterById.get(f.id) || {};
    const near = S.nearestScheme(f, FIGURES);
    L.push(`| ${i + 1} | **${r.name || f.id}** \`${f.id}\` | ${KIND_DE[r.kind] || '–'}${f.base ? ` von \`${f.base}\`` : ''} | ${S.FAMILIES[f.fam].name} | ${S.sizeOfHeight(f.h).id} (${f.h.toFixed(2).replace('.', ',')}) | \`${f.main}\` ${colorName(f.main)} | \`${f.acc}\` ${colorName(f.acc)} | ${f.sig} | ${f.cat} | ${f.zones.join(', ')} | \`${near.id}\` (${near.s.toFixed(1)}) |`);
  });
  L.push('');
  L.push('## Proportion, Ausdruck und Bewegung');
  L.push('');
  L.push('Proportionsformel: K = Kopfhöhe / Gesamthöhe, B = Beinlänge / Gesamthöhe, A = Armlänge / Rumpfhöhe, H = Handbreite / Kopfbreite, W = Länge von Waffe, Werkzeug oder Signature / Gesamthöhe.');
  L.push('');
  L.push('| Figur | K · B · A · H · W | Übertriebenes Merkmal | Persönlichkeit | Idle | Angriff |');
  L.push('|---|---|---|---|---|---|');
  const n2 = (x) => x.toFixed(2).replace('.', ',');
  for (const f of FIGURES) {
    const p = f.prop;
    L.push(`| \`${f.id}\` | ${f.fam === 'bauwerk' ? '–' : [p.head, p.legs, p.arms, p.hands, p.weapon].map(n2).join(' · ')} | ${f.over} | ${f.mood} | ${f.idle} | ${f.attack} |`);
  }
  L.push('');
  L.push('## Formen');
  L.push('');
  L.push('Diese Spieltypen sind keine eigenen Figuren, sondern Zustände einer Figur (eigene Bauteile im selben Modell):');
  L.push('');
  for (const [type, fm] of Object.entries(FORM_LOOKS)) L.push(`- \`${type}\` → \`${fm.figure}\`, Form \`${fm.form}\`: ${fm.note}`);
  L.push('');
  return L.join('\n');
}

async function palettePng(file) {
  const { chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
  const list = FIGURES.map((f) => ({ ...f, l: lch(f.main) }));
  list.sort((x, y) => (x.l.C < 12 ? -1000 + x.l.L : x.l.h) - (y.l.C < 12 ? -1000 + y.l.L : y.l.h));
  const cells = list
    .map((f) => `<div class=c><div class=sw style="background:${f.main}"><div class=ac style="background:${f.acc}"></div>${f.skin ? `<div class=sk style="background:${f.skin}"></div>` : ''}</div><b>${f.id}</b><i>${S.FAMILIES[f.fam].name} · ${f.main}</i></div>`)
    .join('');
  const html = `<html><body style="margin:0;padding:8px;background:#2b3a2b;font:12px sans-serif;color:#fff"><style>.c{display:inline-block;width:146px;margin:4px;vertical-align:top}.sw{height:40px;border-radius:6px;position:relative;border:2px solid #1c1830}.ac{position:absolute;right:4px;bottom:4px;width:20px;height:20px;border-radius:50%;border:2px solid #1c1830}.sk{position:absolute;left:4px;bottom:4px;width:14px;height:14px;border-radius:3px;border:2px solid #1c1830}b{display:block;margin-top:2px}i{display:block;opacity:.75;font-style:normal;font-size:10px}.t{display:inline-block;width:142px;margin:4px;padding:10px 4px;border-radius:6px;border:2px solid #1c1830;font-weight:bold}</style><div><span class=t style="background:#3d8bff">Team Blau (reserviert)</span><span class=t style="background:#ff4d57">Team Rot (reserviert)</span><span style="margin-left:12px;opacity:.8">Fläche = Hauptfarbe · Kreis = Akzent · Quadrat = Hautton</span></div>${cells}</body></html>`;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1590, height: 900 } });
  await p.setContent(html);
  await p.screenshot({ path: file, fullPage: true });
  await b.close();
}

async function briefs() {
  const dir = path.join(ROOT, 'tools/characters/briefs');
  if (!fs.existsSync(dir)) return 0;
  const { renderBriefs } = await import('./briefs.mjs');
  return renderBriefs(path.join(ROOT, 'docs/briefs'));
}

const res = check();
const problems = res.color.length + res.matrix.length + res.missing.length + res.extra.length;
if (args.has('--check')) {
  for (const x of [...res.color, ...res.matrix]) console.log(x.join(' | '));
  if (res.missing.length) console.log('fehlend:', res.missing.join(', '));
  if (res.extra.length) console.log('unbekannt:', res.extra.join(', '));
  console.log(problems ? `${problems} Probleme` : 'Matrix und Farbregeln in Ordnung');
  process.exit(problems ? 1 : 0);
}
fs.mkdirSync(path.join(ROOT, 'client/js/characters'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'client/js/characters/system.json'), JSON.stringify(systemJson(), null, 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'docs/DISTINCT_MATRIX.md'), matrixMd(res));
if (args.has('--png')) await palettePng(path.join(ROOT, 'docs/char-palette.png'));
const nb = await briefs();
console.log(`system.json, DISTINCT_MATRIX.md${args.has('--png') ? ', char-palette.png' : ''}${nb ? `, ${nb} Briefs` : ''} geschrieben · ${problems ? problems + ' Probleme' : 'keine Regelverstöße'}`);

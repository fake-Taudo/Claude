// Prüfskript der Figuren (Phase 6 des Charakter-Neubaus): npm run check:characters
//
//   node tools/characters/check.mjs                         alle acht Prüfungen, schreibt docs/contact_sheet.png,
//                                                           docs/char_check.md, docs/char_check.json, docs/char_check/*.png
//   node tools/characters/check.mjs --only silhouette,team  nur diese Prüfungen (Ausgabe in --out, sonst Scratch)
//   node tools/characters/check.mjs --ids knight,archers    nur diese Figuren (Paare und Review nur untereinander)
//   node tools/characters/check.mjs --skip perf             ohne Performance-Messung
//   node tools/characters/check.mjs --before <Ordner>       Performance zusätzlich mit einem älteren Stand des Spiels
//
// Prüfungen: contact (Contact Sheet), silhouette (IoU aller Paare), color (CIEDE2000-Regeln und gerenderte Farben),
// small (40-px-Test mit Signature-Fläche), team (Blau/Rot, Graustufen, Fehlsichtigkeit, Emblem), anim (alle Zustände:
// Ränder, Sprünge, Fußpunkt), perf (60 Einheiten plus Zauber), review (ein Satz pro Figur, generische markiert).
// Schwellen: CHECK in system.mjs. Exit-Code 1, wenn eine Prüfung fehlschlägt.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAll } from './build.mjs';
import { openLab, startServer } from './lab.mjs';
import { contactSheet, figureIds, displayName } from './contact.mjs';
import { figureById } from './figures.mjs';
import { CHECK, FAMILIES, OUTLINE, colorViolations, matrixViolations, isRelated, materialTones, schemeDistance, sizeOfHeight } from './system.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ALL = ['contact', 'silhouette', 'color', 'small', 'team', 'anim', 'perf', 'review'];

const argv = process.argv.slice(2);
const opt = (k, d) => {
  const i = argv.indexOf('--' + k);
  return i >= 0 ? argv[i + 1] : d;
};
const only = opt('only', '') ? opt('only').split(',') : null;
const skip = new Set(opt('skip', '') ? opt('skip').split(',') : []);
const run = (k) => (!only || only.includes(k)) && !skip.has(k);
const idsArg = opt('ids', '') ? opt('ids').split(',') : null;
const partial = !!(only || idsArg || skip.size);
const OUT = path.resolve(ROOT, opt('out', partial ? path.join(os.tmpdir(), 'char_check') : 'docs'));
const IMG = path.join(OUT, 'char_check');
fs.mkdirSync(IMG, { recursive: true });

const names = new Map();
const nameOf = (id) => {
  if (!names.has(id)) names.set(id, displayName(id));
  return names.get(id);
};
const row = (id) => figureById.get(id) || { id, fam: '', main: '#888888', acc: '#888888', sig: '', over: '', mood: '' };
const pct = (v) => (v * 100).toFixed(1).replace('.', ',') + ' %';
const num = (v, d = 2) => (v == null ? '–' : v.toFixed(d).replace('.', ','));
const savePng = (file, url) => fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));

const results = { date: new Date().toISOString(), limits: CHECK, checks: {} };
const log = (...a) => console.log(...a);

function verdict(name, fails, warns, data) {
  const status = fails.length ? 'fail' : warns.length ? 'warn' : 'ok';
  results.checks[name] = { status, fails, warns, ...data };
  log(`${status === 'ok' ? '✔' : status === 'warn' ? '△' : '✘'} ${name}: ${fails.length} Fehler, ${warns.length} Hinweise`);
  for (const f of fails.slice(0, 12)) log('    ✘', f);
  if (fails.length > 12) log(`    … ${fails.length - 12} weitere`);
}

// ───────────── Hauptprogramm ─────────────
const ids = idsArg || figureIds();
await buildAll(idsArg || undefined);
const lab = await openLab();
let failed = false;
try {
  const page = lab.page;
  // Farbfunktionen (color.mjs) und Seitenteil des Prüfskripts einbinden
  const colorSrc = fs.readFileSync(path.join(ROOT, 'tools/characters/color.mjs'), 'utf8').replace(/\nif \(import\.meta[\s\S]*$/, '');
  await page.addScriptTag({ type: 'module', content: colorSrc + '\nwindow.CC = { hexToRgb, rgbToLab, deltaE2000 };' });
  await page.waitForFunction(() => window.CC);
  await page.addScriptTag({ content: fs.readFileSync(path.join(ROOT, 'tools/characters/check-page.js'), 'utf8') });
  await page.evaluate((ids) => window.CH.loadFigures(ids), ids);
  const nameObj = Object.fromEntries(ids.map((id) => [id, nameOf(id)]));

  // 1. Contact Sheet
  if (run('contact')) {
    const t = Date.now();
    const png = await contactSheet(lab, ids, { cols: 4, title: `Turmtrubel – alle ${ids.length} Figuren` });
    fs.writeFileSync(path.join(OUT, 'contact_sheet.png'), png);
    verdict('contact', [], [], { file: path.relative(ROOT, path.join(OUT, 'contact_sheet.png')), figures: ids.length, bytes: png.length, ms: Date.now() - t });
  }

  // 2. Silhouetten
  let sil = null;
  if (run('silhouette') || run('review')) {
    const L = CHECK.silhouette;
    sil = await page.evaluate(({ ids, L }) => window.CK.silhouettes(ids, L), { ids, L });
    const pairs = sil.pairs.map(([a, b, v, vn]) => ({ a, b, iou: v, norm: vn, related: isRelated(row(a), row(b)), fam: row(a).fam === row(b).fam }));
    pairs.sort((x, y) => y.iou - x.iou);
    sil.sorted = pairs;
    const fails = pairs.filter((p) => !p.related && p.iou >= L.fail).map((p) => `${p.a} ~ ${p.b}: IoU ${p.iou.toFixed(2)}`);
    // verwandt (Held ↔ Basis …) soll verwandt aussehen, aber nicht deckungsgleich sein
    for (const p of pairs) if (p.related && p.iou >= L.relatedMax) fails.push(`${p.a} ~ ${p.b}: verwandt, aber gleiche Silhouette (IoU ${p.iou.toFixed(3)})`);
    const warns = pairs.filter((p) => !p.related && p.iou < L.fail && (p.iou >= L.warn || p.norm >= L.normWarn)).map((p) => `${p.a} ~ ${p.b}: IoU ${p.iou.toFixed(2)}, höhennormiert ${p.norm.toFixed(2)}`);
    const nearest = {};
    for (const p of pairs) {
      if (p.related) continue;
      for (const [x, y] of [[p.a, p.b], [p.b, p.a]]) if (!nearest[x] || nearest[x].iou < p.iou) nearest[x] = { id: y, iou: p.iou, norm: p.norm };
    }
    sil.nearest = nearest;
    const hist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (const p of pairs) hist[Math.min(9, Math.floor(p.iou * 10))]++;
    const top = pairs.filter((p) => !p.related).slice(0, 16);
    if (run('silhouette')) {
      savePng(path.join(IMG, 'silhouettes.png'), await page.evaluate(({ top, names }) => window.CK.silhouetteSheet(top, names), { top: top.map((p) => [p.a, p.b, p.iou, p.norm]), names: nameObj }));
      const normTop = [...pairs].filter((p) => !p.related).sort((x, y) => y.norm - x.norm).slice(0, 10);
      verdict('silhouette', fails, warns, {
        pairs: pairs.length,
        related: pairs.filter((p) => p.related).length,
        hist,
        mean: +(pairs.reduce((s, p) => s + p.iou, 0) / pairs.length).toFixed(3),
        top: top.map((p) => [p.a, p.b, p.iou, p.norm]),
        topRelated: pairs.filter((p) => p.related).slice(0, 8).map((p) => [p.a, p.b, p.iou, p.norm]),
        normTop: normTop.map((p) => [p.a, p.b, p.iou, p.norm]),
      });
    }
  }

  // 3. Farbtest
  let colors = null;
  if (run('color') || run('review')) {
    const L = CHECK.color;
    const rows = ids.map(row);
    const planned = colorViolations(rows);
    const matrix = matrixViolations(rows);
    colors = {};
    const ramp = (hex) => {
      const t = materialTones(hex);
      return [t.gloss, t.light, t.base, t.shade, t.deep];
    };
    for (const id of ids) {
      const e = await page.evaluate((id) => window.CH.figureEntry(id), id);
      colors[id] = await page.evaluate(({ id, o }) => window.CK.colors(id, o), { id, o: { scale: L.scale, tol: L.tol, main: ramp(e.main), acc: ramp(e.accent), ink: OUTLINE.ink } });
    }
    if (run('color')) {
      const fails = [...planned.map((v) => `Regel ${v[0]}: ${v[1]} (${v[2]})`), ...matrix.map((v) => `Matrix ${v[0]}: ${v[1]} (${v[2]})`)];
      const warns = [];
      for (const id of ids) {
        const c = colors[id];
        if (c.main < L.main) fails.push(`${id}: Hauptfarbe nur ${pct(c.main)} der Eigenfarbfläche`);
        if (c.acc < L.acc) warns.push(`${id}: Akzentfarbe nur ${pct(c.acc)}`);
      }
      // engste geplante Farbschemata (unverwandt)
      const close = [];
      for (let i = 0; i < rows.length; i++)
        for (let j = i + 1; j < rows.length; j++) if (!isRelated(rows[i], rows[j])) close.push([rows[i].id, rows[j].id, +schemeDistance(rows[i], rows[j]).toFixed(1)]);
      close.sort((a, b) => a[2] - b[2]);
      verdict('color', fails, warns, { planned: planned.length, matrix: matrix.length, closest: close.slice(0, 10), rendered: colors });
    }
  }

  // 4. 40-px-Test
  let small = null;
  if (run('small') || run('review')) {
    const L = CHECK.small;
    small = {};
    for (const id of ids) small[id] = await page.evaluate(({ id, L }) => window.CK.small(id, L), { id, L });
    if (run('small')) {
      const fails = [];
      const warns = [];
      for (const id of ids) {
        const s = small[id];
        if (!s.sigParts.length) fails.push(`${id}: keine Signature-Teile (data-sig)`);
        else if (s.abs < L.abs) fails.push(`${id}: Signature bei 40 px nur ${s.abs} px sichtbar`);
        else if (s.sig < L.sig) warns.push(`${id}: Signature-Fläche ${pct(s.sig)} der Figur`);
      }
      savePng(path.join(IMG, 'small40.png'), await page.evaluate(({ ids, names, L }) => window.CK.smallSheet(ids, names, L), { ids, names: nameObj, L }));
      verdict('small', fails, warns, { data: small });
    }
  }

  // 5. Team-Test
  if (run('team')) {
    const L = CHECK.team;
    const team = {};
    for (const id of ids) team[id] = await page.evaluate(({ id, L }) => window.CK.team(id, L), { id, L });
    const fails = [];
    const warns = [];
    for (const id of ids) {
      const t = team[id];
      if (t.area > L.maxArea) fails.push(`${id}: Teamfläche ${pct(t.area)} > ${pct(L.maxArea)}`);
      if (t.area < L.minArea) fails.push(`${id}: Teamfläche nur ${pct(t.area)}`);
      if (!t.emblemParts.blue || !t.emblemParts.red) fails.push(`${id}: Teamsymbol fehlt (${!t.emblemParts.blue ? 'Kreis' : 'Dreieck'})`);
      else if (t.emblem < L.emblem) fails.push(`${id}: Teamsymbol im Ruhebild nur ${t.emblem} px`);
      if (t.emblem >= L.emblem && t.emblemCb < t.emblem * L.cbGrow) fails.push(`${id}: Farbenblind-Modus vergrößert das Teamsymbol nicht (${t.emblem} → ${t.emblemCb} px)`);
if (t.emblem >= L.emblem && t.gray < L.emblem) fails.push(`${id}: in Graustufen unterscheiden sich Blau und Rot nur auf ${t.gray} px`);
      for (const k of ['protan', 'deutan', 'tritan']) if (t[k] < L.cvd) fails.push(`${id}: ${k} unterscheidet nur ${pct(t[k])} der Teamfläche`);
    }
    savePng(path.join(IMG, 'team.png'), await page.evaluate(({ ids, names, L }) => window.CK.teamSheet(ids, names, L), { ids, names: nameObj, L: { scale: 30 } }));
    verdict('team', fails, warns, { data: team });
  }

  // 6. Animationstest
  if (run('anim')) {
    const L = CHECK.anim;
    const anim = {};
    const fails = [];
    const warns = [];
    let frames = 0;
    let poses = 0;
    for (const id of ids) {
      const a = await page.evaluate(({ id, L }) => window.CK.anim(id, L), { id, L });
      anim[id] = a;
      const e = await page.evaluate((id) => window.CH.figureEntry(id), id);
      const ground = !(e.hover > 0) && !['gefluegelt', 'schwebend'].includes(e.family);
      const F0 = a.rest.feet;
      if (ground && F0 != null && Math.abs(F0) > L.feetRest) fails.push(`${id}: Füße in Ruhe ${F0 > 0 ? num(F0, 1) + ' mu unter' : num(-F0, 1) + ' mu über'} dem Fußpunkt`);
      if (ground && Math.abs(a.rest.contact) > L.contact) warns.push(`${id}: Bodenkontakt ${num(a.rest.contact, 0)} mu neben dem Fußpunkt`);
      for (const s of a.states) {
        frames += s.frames;
        poses += L.fine + 1;
        const tag = `${id} ${s.run === 'base' ? '' : s.run + ' '}${s.state}`;
        if (s.clipped) fails.push(`${tag}: ${s.clipped} von ${s.frames} Bildern am Rand abgeschnitten (${s.edgePx} px)`);
        if (s.jump > L.jump) fails.push(`${tag}: Teil „${s.jumpPart}“ springt um ${num(s.jumpMu, 0)} mu (${pct(s.jump)} der Höhe) bei u ≈ ${num(s.jumpU, 3)}`);
        if (s.enter > L.enter) warns.push(`${tag}: Einstieg aus der Ruhe, Teil „${s.enterPart}“ ${pct(s.enter)} der Höhe entfernt`);
        // ground: false im Animations-Eintrag = Zustand verlässt den Boden absichtlich (Eingraben, Sprung)
        if (ground && F0 != null && s.feet != null && s.run === 'base' && !['spawn', 'death', 'charge'].includes(s.state) && e.anim[s.state]?.ground !== false) {
          if (s.feet > F0 + L.sink) fails.push(`${tag}: Füße sinken ${num(s.feet - F0, 0)} mu unter die Ruhe`);
          if (['idle', 'walk'].includes(s.state) && s.feet < F0 - L.float) fails.push(`${tag}: Füße berühren den Boden nie (≥ ${num(F0 - s.feet, 0)} mu darüber)`);
        }
      }
    }
    verdict('anim', fails, warns, { frames, poses, data: anim });
  }

  // 7. Performance
  if (run('perf')) {
    const { measurePerf } = await import('./check-perf.mjs');
    const L = CHECK.perf;
    const before = opt('before', null);
    const perf = await measurePerf({ before: before && path.resolve(before) });
    const fails = [];
    const warns = [];
    const cur = perf.after;
    if (cur.units < L.units) fails.push(`Szene erreicht nur ${cur.units} Einheiten`);
    const d = cur.profiles['desktop-1440x900'];
    const m = cur.profiles['phone-390x844'];
    if (d.fps < L.desktopFps) fails.push(`Desktop ${d.fps} FPS < ${L.desktopFps}`);
    if (m.fps < L.throttledFps) fails.push(`Handy (CPU ${L.cpu}× gedrosselt) ${m.fps} FPS < ${L.throttledFps}`);
    for (const p of Object.values(cur.profiles)) if (p.errors?.length) fails.push(`Konsolenfehler: ${p.errors.join(' | ')}`);
    if (!cur.autoDown?.downs) fails.push('automatische Qualität senkt unter Last nicht ab');
    verdict('perf', fails, warns, perf);
  }

  // 8. Eigenständigkeits-Review
  if (run('review')) {
    const nearSil = sil?.nearest || {};
    const rows = ids.map(row);
    const review = [];
    const warns = [];
    for (const r of rows) {
      const ns = nearSil[r.id];
      let nc = null;
      for (const o of rows) {
        if (o === r || isRelated(r, o)) continue;
        const s = schemeDistance(r, o);
        if (!nc || s < nc.s) nc = { id: o.id, s };
      }
      const sigPx = small?.[r.id];
      // Nähe-Signale: Silhouette, Farbe und Familie zum selben Nachbarn, schwache Signature bei 40 px
      const sameNeighbour = ns && row(ns.id);
      const signals = [];
      if (ns && ns.iou >= CHECK.silhouette.warn) signals.push(`Silhouette wie ${nameOf(ns.id)} (IoU ${num(ns.iou)})`);
      if (sameNeighbour && sameNeighbour.fam === r.fam && ns.iou >= CHECK.silhouette.warn - 0.1) signals.push(`gleiche Familie wie ${nameOf(ns.id)}`);
      if (sameNeighbour && schemeDistance(r, sameNeighbour) < 15) signals.push(`ähnliche Farben wie ${nameOf(ns.id)} (Schema ${num(schemeDistance(r, sameNeighbour), 1)})`);
      if (sigPx && sigPx.sig < CHECK.small.sig) signals.push(`Signature bei 40 px schwach (${pct(sigPx.sig)})`);
      const generic = signals.length >= 2;
      const fam = FAMILIES[r.fam]?.name || r.fam;
      const sentence = `${nameOf(r.id)} (${fam}, ${sizeOfHeight(r.h || 1.5).id}): ${r.sig}; übertrieben: ${r.over}; ${r.mood}.`;
      review.push({ id: r.id, name: nameOf(r.id), sentence, nearest: ns ? { id: ns.id, iou: ns.iou } : null, color: nc ? { id: nc.id, scheme: +nc.s.toFixed(1) } : null, sig: sigPx?.sig ?? null, signals, generic });
      if (generic) warns.push(`${r.id}: generisch? ${signals.join('; ')}`);
    }
    verdict('review', [], warns, { review });
  }
} finally {
  await lab.close();
}

for (const c of Object.values(results.checks)) if (c.status === 'fail') failed = true;
const json = JSON.parse(JSON.stringify(results));
// große Rohdaten nur in der JSON-Datei, kompakt
fs.writeFileSync(path.join(OUT, 'char_check.json'), JSON.stringify(json) + '\n');
fs.writeFileSync(path.join(OUT, 'char_check.md'), markdown(json));
log(`Ergebnis: ${path.relative(ROOT, path.join(OUT, 'char_check.md'))} · ${failed ? 'FEHLER' : 'bestanden'}`);
process.exit(failed ? 1 : 0);

// ───────────── Bericht (Markdown) ─────────────
function markdown(r) {
  const C = r.checks;
  const L = r.limits;
  const out = [];
  const p = (...l) => out.push(...l);
  const st = (k) => (C[k] ? { ok: 'bestanden', warn: 'bestanden mit Hinweisen', fail: '**nicht bestanden**' }[C[k].status] : 'nicht gelaufen');
  p('# Prüfergebnis der Figuren', '', `Erzeugt von \`npm run check:characters\` (tools/characters/check.mjs) am ${r.date.slice(0, 10)}. Schwellen: \`CHECK\` in tools/characters/system.mjs.`, '');
  p('| Prüfung | Ergebnis | Fehler | Hinweise |', '|---|---|---|---|');
  for (const k of ALL) if (C[k]) p(`| ${k} | ${st(k)} | ${C[k].fails.length} | ${C[k].warns.length} |`);
  p('');
  const list = (title, arr, max = 40) => {
    if (!arr?.length) return;
    p(`**${title}:**`, '');
    for (const x of arr.slice(0, max)) p(`- ${x}`);
    if (arr.length > max) p(`- … ${arr.length - max} weitere (siehe char_check.json)`);
    p('');
  };
  if (C.contact) p('## 1. Contact Sheet', '', `![Contact Sheet](${path.basename(C.contact.file)}) – ${C.contact.figures} Figuren, ${(C.contact.bytes / 1e6).toFixed(1).replace('.', ',')} MB.`, '');
  if (C.silhouette) {
    const S = C.silhouette;
    p('## 2. Silhouetten', '', `Ruhebild jeder Figur als Maske (Team Blau, vorn, ${L.silhouette.scale} px pro Feld, Fußpunkte deckungsgleich), IoU aller ${S.pairs} Paare; zusätzlich höhennormiert (${L.silhouette.normPx} px hoch). Fehler ab IoU ${num(L.silhouette.fail)}, Hinweis ab ${num(L.silhouette.warn)} bzw. höhennormiert ab ${num(L.silhouette.normWarn)}. Verwandte Paare (${S.related}) zählen nicht, dürfen aber nicht deckungsgleich sein (Fehler ab ${num(L.silhouette.relatedMax)}).`, '');
    p(`Mittelwert ${num(S.mean, 3)}. Verteilung: ${S.hist.map((n, i) => `${num(i / 10, 1)}–${num((i + 1) / 10, 1)}: ${n}`).join(' · ')}.`, '');
    p('| Paar (unverwandt) | IoU | höhennormiert |', '|---|---|---|');
    for (const [a, b, v, vn] of S.top.slice(0, 12)) p(`| ${nameOf(a)} ↔ ${nameOf(b)} | ${num(v)} | ${num(vn)} |`);
    p('', '![Überlagerung der ähnlichsten Paare](char_check/silhouettes.png)', '');
    list('Fehler', S.fails);
    list('Hinweise', S.warns, 20);
  }
  if (C.color) {
    const K = C.color;
    p('## 3. Farben (CIEDE2000)', '', `Geplante Farben: ${K.planned} Verstöße gegen die Farbregeln, ${K.matrix} gegen die Matrix-Regeln. Gerendert: Anteil der Eigenfarbfläche (ohne Kontur und Teamzonen), der höchstens ΔE2000 ${L.color.tol} von der Materialrampe der Haupt- bzw. Akzentfarbe entfernt ist (Fehler unter ${pct(L.color.main)} Hauptfarbe, Hinweis unter ${pct(L.color.acc)} Akzent).`, '');
    p('| engste unverwandte Farbschemata | Schema-Abstand |', '|---|---|');
    for (const [a, b, s] of K.closest.slice(0, 6)) p(`| ${nameOf(a)} ↔ ${nameOf(b)} | ${num(s, 1)} |`);
    const vals = Object.values(K.rendered);
    const med = (arr) => arr.sort((x, y) => x - y)[Math.floor(arr.length / 2)];
    p('', `Median Hauptfarb-Anteil ${pct(med(vals.map((v) => v.main)))}, Akzent ${pct(med(vals.map((v) => v.acc)))}.`, '');
    list('Fehler', K.fails);
    list('Hinweise', K.warns, 20);
  }
  if (C.small) {
    const K = C.small;
    const v = Object.values(K.data);
    p('## 4. 40-px-Test', '', `Jede Figur 40 px hoch auf Arena-Gras, einmal mit und einmal ohne ihre Signature-Teile (\`data-sig\`). Gezählt werden Pixel, die sich sichtbar ändern (ΔE76 > ${L.small.de}). Fehler unter ${L.small.abs} px, Hinweis unter ${pct(L.small.sig)} der Figurfläche. Median ${pct(v.map((x) => x.sig).sort((a, b) => a - b)[Math.floor(v.length / 2)])}.`, '', '![40-px-Bogen](char_check/small40.png)', '');
    list('Fehler', K.fails);
    list('Hinweise', K.warns, 30);
  }
  if (C.team) {
    const K = C.team;
    const v = Object.values(K.data);
    const max = v.reduce((m, x) => Math.max(m, x.area), 0);
    p('## 5. Team-Test', '', `Ruhebild in Blau und Rot (${L.team.scale} px pro Feld = Spielgröße bei 2-facher Pixeldichte). Teamfläche = Pixel, die sich zwischen Blau und Rot unterscheiden (ΔE76 > ${L.team.de}); erlaubt ${pct(L.team.minArea)}–${pct(L.team.maxArea)}, größte ${pct(max)}. Teamsymbol (Kreis/Dreieck) muss mit mindestens ${L.team.emblem} px sichtbar sein, sich in Graustufen auf ebenso vielen Pixeln unterscheiden (Blau und Rot sind fast gleich hell, die Form trägt die Information) und im Farbenblind-Modus um mindestens ${num(L.team.cbGrow, 1)}× wachsen. Fehlsichtigkeit (Machado 2009: Protanopie, Deuteranopie, Tritanopie): Anteil der Teamfläche, der unterscheidbar bleibt (≥ ${pct(L.team.cvd)}).`, '', '![Team-Bogen](char_check/team.png)', '');
    list('Fehler', K.fails);
    list('Hinweise', K.warns, 30);
  }
  if (C.anim) {
    const K = C.anim;
    p('## 6. Animationen', '', `${K.frames} Bilder aller Zustände (Basis, Evo, Formen) so gebacken wie im Spiel (Qualität Hoch), dazu je Zustand ${L.anim.fine} fein abgetastete Posen (${K.poses} insgesamt, ohne Rastern). Geprüft: kein deckendes Pixel am Bildrand (abgeschnitten); Unstetigkeiten – Schritte, in denen ein Teil um mehr als ${pct(L.anim.coarse)} der Ruhehöhe wandert, werden per Halbierung eingegrenzt, bleibt dort mehr als ${pct(L.anim.jump)}, springt das Teil (bei Schleifen auch über das Ende); Einstieg aus der Ruhepose (Hinweis ab ${pct(L.anim.enter)}); Füße der Bodenfiguren: in Ruhe am Fußpunkt (± ${L.anim.feetRest} mu), in keinem Zustand mehr als ${L.anim.sink} mu tiefer, in Ruhe und beim Laufen mit Bodenkontakt (höchstens ${L.anim.float} mu darüber).`, '');
    list('Fehler', K.fails);
    list('Hinweise', K.warns, 30);
  }
  if (C.perf) {
    const K = C.perf;
    p('## 7. Performance', '', `Szene: ${K.after.units} Einheiten aus ${K.after.figures} verschiedenen Figuren in drei Wellen, dazu ${K.after.spells} Zauber, ${L.perf.seconds} s, als Snapshot-Folge im echten Client abgespielt (tools/characters/check-perf.mjs).`, '');
    p('| Stand | Profil | FPS | p95 | schlechtester Frame | Long Tasks | automatische Qualität am Ende |', '|---|---|---|---|---|---|---|');
    for (const [label, R] of [['vorher', K.before], ['nachher', K.after]]) {
      if (!R) continue;
      for (const [k, v] of Object.entries(R.profiles)) p(`| ${label} | ${k} (CPU ${v.cpu}×) | ${v.fps} | ${v.p95ms} ms | ${v.worstMs} ms | ${v.longTasks} | ${v.autoQuality ? `DPR ${v.autoQuality.dynDpr ?? 'voll'}, Effekte ${num(v.autoQuality.fxLoad ?? 1, 1)}, Figuren ${v.autoQuality.chars ?? '–'}, Absenkungen ${v.autoQuality.downs}` : '–'} |`);
    }
    if (K.after.autoDown) p('', `Lasttest der automatischen Qualität (CPU ${K.after.autoDown.cpu}×): ${K.after.autoDown.fps} FPS, ${K.after.autoDown.downs} Absenkungen, Ende: DPR ${K.after.autoDown.dynDpr ?? 'voll'}, Effekte ${num(K.after.autoDown.fxLoad ?? 1, 1)}, Figuren ${K.after.autoDown.chars}.`);
    p('');
    list('Fehler', K.fails);
  }
  if (C.review) {
    const K = C.review;
    p('## 8. Eigenständigkeits-Review', '', 'Ein Satz pro Figur aus Brief und Matrix, dazu der nächste unverwandte Nachbar nach Silhouette und Farbe. **generisch?** heißt: mindestens zwei Nähe-Signale (Silhouette, Familie, Farbe, schwache Signature bei 40 px).', '');
    p('| Figur | Satz | nächste Silhouette | nächstes Farbschema | Markierung |', '|---|---|---|---|---|');
    for (const x of K.review) p(`| ${x.name} | ${x.sentence} | ${x.nearest ? `${nameOf(x.nearest.id)} (${num(x.nearest.iou)})` : '–'} | ${x.color ? `${nameOf(x.color.id)} (${num(x.color.scheme, 1)})` : '–'} | ${x.generic ? '**generisch?** ' + x.signals.join('; ') : x.signals.join('; ')} |`);
    p('');
  }
  return out.join('\n') + '\n';
}

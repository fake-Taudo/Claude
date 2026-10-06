#!/usr/bin/env node
// Holt die aktuellen Werte aller regulären Clash-Royale-Karten aus dem Community-Wiki
// (clashroyale.fandom.com, MediaWiki-API) und legt einen Snapshot unter
// data/source/wiki-cards.json ab. Keine Abhängigkeiten – nur Node ≥ 18 (fetch).
//
//   node tools/fetch-cards.mjs            # alles neu laden
//   node tools/fetch-cards.mjs --only "Knight,Hog Rider"
//
// Der Snapshot enthält je Seite: Revision, Infobox, deutschen Namen (Sprachlink)
// und die gerenderten Werte-Tabellen (Attribute + Statistik auf Turnierstandard Level 11).
// data/cards.json wird NICHT automatisch überschrieben – die Mechaniken sind von Hand
// gepflegt (tools/cards/); test/carddata.test.js gleicht die Grundwerte mit dem Snapshot ab.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data/source/wiki-cards.json');
const API = 'https://clashroyale.fandom.com/api.php';
const UA = 'TurmtrubelDataSync/1.0 (private hobby project)';
const LEVEL = 11; // Turnierstandard
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Karten, die im Wiki als Karten-Kategorie geführt werden, aber nicht zur regulären
// Sammlung gehören (Event-/Sonderkarten oder entfernt). Zusätzlich gilt: ohne Arena = Event.
const EXCLUDE = new Map([
  ['Heal', 'entfernt'],
  ['Terry', 'entfernt (Event-Champion)'],
  ['Rocket Silo', 'entfernt'],
  ['Raging Prince', 'Event-Karte'],
  ['Santa Hog Rider', 'Event-Karte'],
  ['Party Hut', 'Event-Karte'],
  ['Party Rocket', 'Event-Karte'],
  ['Warmth', 'Event-Karte'],
  ['Wizard Trio', 'Event-Karte'],
  ['Barbarian Launcher', 'Event-Karte'],
]);

async function api(params, tries = 4) {
  const url = API + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (err) {
      if (i >= tries) throw err;
      await sleep(2000 * 2 ** i);
    }
  }
}

async function categoryMembers(cat) {
  const out = [];
  let cont = {};
  for (;;) {
    const d = await api({ action: 'query', list: 'categorymembers', cmtitle: 'Category:' + cat, cmlimit: '500', ...cont });
    out.push(...d.query.categorymembers.map((m) => m.title).filter((t) => !t.startsWith('Category:')));
    if (!d.continue) break;
    cont = d.continue;
  }
  return out;
}

/** Wikitext + Revision + deutscher Sprachlink für bis zu 40 Titel. */
async function pageInfo(titles) {
  const res = {};
  for (let i = 0; i < titles.length; i += 40) {
    const chunk = titles.slice(i, i + 40);
    const d = await api({
      action: 'query',
      prop: 'revisions|langlinks|info',
      rvprop: 'content|timestamp|ids',
      rvslots: 'main',
      lllang: 'de',
      lllimit: '500',
      titles: chunk.join('|'),
    });
    for (const p of d.query.pages) {
      if (p.missing || !p.revisions) {
        res[p.title] = null;
        continue;
      }
      const r = p.revisions[0];
      res[p.title] = { text: r.slots.main.content, revid: r.revid, timestamp: r.timestamp, de: p.langlinks?.[0]?.title || null };
    }
    await sleep(800);
  }
  return res;
}

function parseInfobox(text) {
  const m = text.match(/\{\{\s*(?:Heroic |Evolved )?Card[ _]Infobox([\s\S]*?)\}\}/);
  if (!m) return null;
  const o = {};
  for (const part of m[1].split('|')) {
    const i = part.indexOf('=');
    if (i > 0) o[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return o;
}

const decode = (s) =>
  s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** Alle Tabellen mit id="unit-…" aus dem gerenderten HTML. Statistik: nur die Level-11-Zeile. */
function parseTables(html) {
  const out = [];
  const re = /<table([^>]*)>([\s\S]*?)<\/table>/g;
  let m;
  while ((m = re.exec(html))) {
    const idm = m[1].match(/id="([^"]+)"/);
    if (!idm || !idm[1].startsWith('unit-')) continue;
    const rows = [...m[2].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t([hd])[^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => ({ th: c[1] === 'h', v: decode(c[2]) })));
    const head = rows.find((r) => r.length && r.every((c) => c.th)) || [];
    const data = rows.filter((r) => r.length && !r.every((c) => c.th)).map((r) => r.map((c) => c.v));
    const headers = head.map((c) => c.v);
    let keep = data;
    if (idm[1].startsWith('unit-statistics') && /^level/i.test(headers[0] || '')) {
      keep = data.filter((r) => String(r[0]).replace(/\D/g, '') === String(LEVEL));
      if (!keep.length) keep = data.slice(0, 1);
    }
    out.push({ id: idm[1], headers, rows: keep });
  }
  return out;
}

async function renderTables(title) {
  const d = await api({ action: 'parse', page: title, prop: 'text', disablelimitreport: '1', disableeditsection: '1' });
  return parseTables(d.parse?.text || '');
}

/** Vergleichstabellen der Übersichtsseite "Cards" (alle Zeilen, Level 11). */
async function overviewTables() {
  const d = await api({ action: 'parse', page: 'Cards', prop: 'text', disablelimitreport: '1', disableeditsection: '1' });
  // Nur der 1v1-Teil der Seite – ab dem Abschnitt "Merge Tactics" gelten andere Werte
  const full = d.parse?.text || '';
  const cut = full.search(/id="Merge_Tactics"/);
  const html = cut > 0 ? full.slice(0, cut) : full;
  const out = [];
  for (const m of html.matchAll(/<table[^>]*class="[^"]*sortable[^"]*"[^>]*>([\s\S]*?)<\/table>/g)) {
    const rows = [...m[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => decode(c[1])));
    if (rows.length > 1) out.push({ headers: rows[0], rows: rows.slice(1).filter((r) => r.length > 1) });
  }
  return out;
}

/** Balance-Änderungen des laufenden Jahres aus der Versionshistorie (eine Zeile je Änderung). */
async function balanceChanges(year) {
  const d = await api({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: 'Version History' });
  const text = d.query.pages[0].revisions[0].slots.main.content;
  const out = [];
  let section = '';
  let inYear = false;
  let mergeTactics = false; // Abschnitte zum Modus "Merge Tactics" gehören nicht zum 1v1-Kampf
  for (const line of text.split('\n')) {
    const h2 = line.match(/^==\s*([^=].*?)\s*==\s*$/);
    if (h2) inYear = h2[1].includes(String(year));
    const h3 = line.match(/^===\s*(.*?)\s*===\s*$/);
    if (h3) {
      section = h3[1].replace(/\[\[|\]\]/g, '');
      mergeTactics = /Merge Tactics/i.test(section);
    }
    const bold = line.match(/^'''(.*?)'''\s*$/);
    if (bold) mergeTactics = /Merge Tactics/i.test(bold[1]) || /Merge Tactics/i.test(section);
    if (mergeTactics || !inYear || !/^\*/.test(line) || !/Balance Changes|Update|Maintenance/i.test(section)) continue;
    const clean = line
      .replace(/\{\{Balance\|([^}]*)\}\}/g, (_, a) => '[' + a.split('|')[0] + '] ')
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
      .replace(/\{\{[^}]*\}\}/g, '')
      .trim();
    out.push(section + ': ' + clean);
  }
  return out;
}

async function main() {
  const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',').map((s) => s.trim()) : null;
  console.log('Lade Kartenliste …');
  const cats = await Promise.all(['Troop_Cards', 'Spell_Cards', 'Building_Cards', 'Champion_Cards'].map(categoryMembers));
  const all = [...new Set(cats.flat())].filter((t) => !t.includes('/Merge Tactics'));
  const bases = all.filter((t) => !t.includes('/'));
  const info = await pageInfo(bases);
  const regular = [];
  const skipped = {};
  for (const t of bases) {
    const p = info[t];
    const ib = p && parseInfobox(p.text);
    if (EXCLUDE.has(t)) skipped[t] = EXCLUDE.get(t);
    else if (!ib) skipped[t] = 'keine Infobox';
    else if (!ib.Arena) skipped[t] = 'keine Arena → Event-/Sonderkarte';
    else if (/\{\{EventCard\}\}|\{\{Removed/.test(p.text)) skipped[t] = 'Event/entfernt';
    else regular.push(t);
  }
  // Evolutionen und Helden: jede reguläre Karte prüfen (nicht alle Unterseiten sind kategorisiert)
  const subs = regular.flatMap((t) => [t + '/Evolution', t + '/Hero']);
  const subInfo = await pageInfo(subs);
  const variants = subs.filter((t) => {
    const p = subInfo[t];
    if (p && /^\s*DELETE\s*$/i.test(p.text)) skipped[t] = 'Seite zum Löschen markiert (keine echte Variante)';
    return p && !skipped[t];
  });
  const titles = [...regular, ...variants].filter((t) => !only || only.includes(t.split('/')[0]));

  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
  const pages = only && prev ? { ...prev.pages } : {};
  let n = 0;
  for (const t of titles) {
    const p = info[t] || subInfo[t];
    const tables = await renderTables(t);
    pages[t] = {
      url: 'https://clashroyale.fandom.com/wiki/' + encodeURIComponent(t.replace(/ /g, '_')),
      revid: p.revid,
      timestamp: p.timestamp,
      de: t.includes('/') ? null : p.de,
      infobox: parseInfobox(p.text),
      tables,
    };
    n++;
    if (n % 20 === 0) console.log(`  ${n}/${titles.length}`);
    await sleep(700);
  }
  console.log('Lade Übersichtstabellen und Balance-Historie …');
  const overview = await overviewTables();
  const year = new Date().getFullYear();
  const balance = await balanceChanges(year);
  const snap = {
    _info: 'Snapshot aus dem Clash Royale Wiki (Fandom, CC BY-SA). Werte auf Turnierstandard Level 11. Erzeugt mit tools/fetch-cards.mjs.',
    source: 'https://clashroyale.fandom.com/wiki/Cards',
    fetchedAt: new Date().toISOString(),
    level: LEVEL,
    regular,
    variants,
    skipped,
    overview,
    balance: { year, changes: balance },
    pages,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(snap, null, 1) + '\n');
  console.log(`Fertig: ${regular.length} reguläre Karten, ${variants.length} Evolutionen/Helden → ${path.relative(ROOT, OUT)}`);
  console.log('Übersprungen:', Object.entries(skipped).map(([k, v]) => `${k} (${v})`).join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

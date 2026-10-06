#!/usr/bin/env node
// Zwei echte Browser-Clients (Chromium über Playwright) spielen über den normalen Lobby-Ablauf
// (Kampf erstellen → Code → Beitreten → Bereit) komplette Kämpfe gegeneinander, inklusive Verlängerung.
//
// Geprüft wird:
//  - keine Konsolenfehler und keine Seitenfehler auf beiden Clients
//  - kein Desync: jeder Client bildet pro Server-Tick eine Prüfsumme über alle Entitäten (ID, LP, Position);
//    für jeden Tick, den beide gesehen haben, müssen die Prüfsummen gleich sein
//  - beide Clients zeigen dasselbe Ergebnis (Grund, Kronen gespiegelt, Sieger/Verlierer bzw. Unentschieden)
//
// Kampf „verlaengerung“: Decks nur aus Zaubern und Gebäuden, Zauber landen im Fluss → keine Krone in der
// regulären Zeit → Verlängerung → Entscheidung nach Turm-LP bzw. Unentschieden.
// Kampf „normal“: Startdecks mit Truppen, Karten werden laufend auf der eigenen Seite ausgespielt.
//
//   node tools/e2e/browser-match.mjs                     # beide Kämpfe, Zeitraffer ×3
//   node tools/e2e/browser-match.mjs --only=verlaengerung --scale=4 --out=docs/before_after/mp-match.json
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startServer } from '../../server/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const SCALE = Number(args.scale || 3);

async function loadPlaywright() {
  for (const t of ['playwright', '@playwright/test']) { try { return await import(t); } catch {} }
  const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
  for (const t of ['playwright', '@playwright/test']) {
    const p = path.join(g, t, 'index.mjs');
    if (fs.existsSync(p)) return await import(pathToFileURL(p).href);
  }
  throw new Error('Playwright nicht gefunden');
}

const MATCHES = [
  { name: 'verlaengerung', deck: ['zap', 'arrows', 'fireball', 'poison', 'freeze', 'earthquake', 'cannon', 'tesla'], spellsToRiver: true },
  { name: 'normal', deck: null, spellsToRiver: false },
];

// Läuft in jeder Seite: Prüfsumme je Snapshot-Tick mitschreiben (Desync-Erkennung)
function installTickHashes() {
  window.__hashes = {};
  const wrap = () => {
    const g = window.turmtrubel?.game;
    if (g && !g.__wrapped) {
      g.__wrapped = true;
      const orig = g.onSnapshot.bind(g);
      g.onSnapshot = (s) => {
        let h = s.e.length;
        for (const e of s.e) h = (h * 31 + e[0] * 7 + Math.round(e[5]) * 13 + Math.round(e[3] * 10) * 17 + Math.round(e[4] * 10) * 19) % 2147483647;
        window.__hashes[s.k] = [h, s.cr[0], s.cr[1], s.ph];
        return orig(s);
      };
    }
  };
  setInterval(wrap, 50);
}

// Läuft in jeder Seite: eine bezahlbare Karte auf der eigenen Seite ausspielen (Zauber ggf. in den Fluss)
function playSomething(spellsToRiver) {
  const g = window.turmtrubel?.game;
  if (!g || g.ended || !g.me) return 'kein Kampf';
  const own = g.side === 0 ? [20, 28] : [4, 12];
  for (let i = 0; i < 4; i++) {
    const id = g.me.h[i];
    const card = g.db.card(id);
    if (!card) continue;
    const cost = g.handCost(i, card);
    if (cost == null || cost > g.elixirNow()) continue;
    let x = 3 + Math.random() * 12;
    let y = own[0] + Math.random() * (own[1] - own[0]);
    if (card.type === 'spell' && spellsToRiver) {
      x = 4 + Math.random() * 10;
      y = 16;
    }
    g.sel = i;
    const ok = g.tryPlay(x, y);
    g.sel = -1;
    if (ok) return id;
  }
  return null;
}

async function setupClient(browser, url, name, deck, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
  await page.addInitScript(installTickHashes);
  await page.goto(url);
  await page.waitForSelector('#s-name.active', { timeout: 30000 });
  await page.fill('#name-input', name);
  await page.click('#name-form button[type=submit]');
  await page.waitForSelector('#s-menu.active');
  await page.waitForFunction(() => window.turmtrubel?.net?.welcomed, null, { timeout: 10000 });
  // Mittlere Qualität: zwei Clients teilen sich eine CPU ohne GPU
  await page.evaluate((d) => {
    const a = window.turmtrubel;
    a.settings.quality = 'medium';
    if (d) a.store.decks[a.store.active].slots = d.slice();
    a.store.save();
  }, deck);
  return { ctx, page, errors, name };
}

async function playMatch(browser, url, spec) {
  const A = await setupClient(browser, url, 'Client Anna', spec.deck, { width: 390, height: 844 });
  const B = await setupClient(browser, url, 'Client Ben', spec.deck, { width: 844, height: 390 });
  const t0 = Date.now();
  await A.page.click('#btn-create');
  await A.page.waitForSelector('#s-lobby.active');
  await A.page.waitForFunction(() => /^[A-Z0-9]{6}$/.test(document.getElementById('lobby-code').textContent));
  const code = await A.page.textContent('#lobby-code');
  await B.page.evaluate((c) => window.turmtrubel.openJoin(c), code);
  await B.page.waitForSelector('#s-lobby.active', { timeout: 8000 });
  await A.page.click('#lobby-ready');
  await B.page.click('#lobby-ready');
  await Promise.all([A, B].map((c) => c.page.waitForFunction(() => window.turmtrubel?.game?.latest, null, { timeout: 60000 })));
  const played = { A: 0, B: 0 };
  let sawOvertime = false;
  // Spielen, bis beide den Ergebnis-Screen zeigen
  for (;;) {
    const done = await Promise.all([A, B].map((c) => c.page.evaluate(() => document.body.dataset.screen === 's-result')));
    if (done[0] && done[1]) break;
    if (Date.now() - t0 > 15 * 60 * 1000) throw new Error(`${spec.name}: Kampf endet nicht`);
    for (const [k, c] of [['A', A], ['B', B]]) {
      const r = await c.page.evaluate(playSomething, spec.spellsToRiver).catch(() => null);
      if (r && r !== 'kein Kampf') played[k]++;
    }
    if (!sawOvertime) sawOvertime = await A.page.evaluate(() => window.turmtrubel?.game?.phase === 'o').catch(() => false);
    await A.page.waitForTimeout(700);
  }
  // Ergebnis und Prüfsummen einsammeln
  const read = (c) =>
    c.page.evaluate(() => ({
      title: document.getElementById('res-title').textContent,
      reason: document.getElementById('res-reason').textContent,
      crownsMe: document.querySelectorAll('#res-crowns-me .res-crown.on').length,
      crownsOpp: document.querySelectorAll('#res-crowns-opp .res-crown.on').length,
      hashes: window.__hashes,
    }));
  const [ra, rb] = await Promise.all([read(A), read(B)]);
  let common = 0;
  const mismatches = [];
  for (const [k, ha] of Object.entries(ra.hashes)) {
    const hb = rb.hashes[k];
    if (!hb) continue;
    common++;
    if (ha[0] !== hb[0] || ha[1] !== hb[1] || ha[2] !== hb[2] || ha[3] !== hb[3]) mismatches.push(Number(k));
  }
  const ticksOvertime = Object.values(ra.hashes).filter((h) => h[3] === 'o').length;
  const outcome = (t) => (/Sieg/.test(t) ? 'win' : /Niederlage/.test(t) ? 'lose' : 'draw');
  const oa = outcome(ra.title);
  const ob = outcome(rb.title);
  const consistent = ra.reason === rb.reason && ra.crownsMe === rb.crownsOpp && ra.crownsOpp === rb.crownsMe && ((oa === 'draw' && ob === 'draw') || (oa === 'win' && ob === 'lose') || (oa === 'lose' && ob === 'win'));
  const res = {
    name: spec.name,
    wallSeconds: Math.round((Date.now() - t0) / 1000),
    timeScale: SCALE,
    result: { A: { title: ra.title, reason: ra.reason, crowns: [ra.crownsMe, ra.crownsOpp] }, B: { title: rb.title, reason: rb.reason, crowns: [rb.crownsMe, rb.crownsOpp] } },
    consistent,
    overtime: sawOvertime || ticksOvertime > 0,
    overtimeTicks: ticksOvertime,
    cardsPlayed: played,
    ticksCompared: common,
    desyncTicks: mismatches.length,
    firstDesync: mismatches.slice(0, 5),
    consoleErrors: { A: A.errors, B: B.errors },
  };
  await A.ctx.close();
  await B.ctx.close();
  return res;
}

const pw = await loadPlaywright();
const srv = await startServer({ port: 0, host: '127.0.0.1', quiet: true, timeScale: SCALE });
const url = `http://127.0.0.1:${srv.port}/`;
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const only = args.only ? String(args.only).split(',') : null;
const results = [];
let ok = true;
try {
  for (const spec of MATCHES) {
    if (only && !only.includes(spec.name)) continue;
    const r = await playMatch(browser, url, spec);
    results.push(r);
    const errs = r.consoleErrors.A.length + r.consoleErrors.B.length;
    const pass = r.consistent && r.desyncTicks === 0 && r.ticksCompared > 100 && errs === 0 && (spec.name !== 'verlaengerung' || r.overtime);
    ok &&= pass;
    console.log(`${pass ? 'OK  ' : 'FEHLER'} ${r.name}: ${r.result.A.title} / ${r.result.B.title} · ${r.result.A.reason} · Verlängerung ${r.overtime ? 'ja' : 'nein'} · ${r.ticksCompared} Ticks verglichen, Desync ${r.desyncTicks} · Konsolenfehler ${errs} · Karten ${r.cardsPlayed.A}/${r.cardsPlayed.B} · ${r.wallSeconds} s`);
  }
} finally {
  await browser.close();
  await srv.close?.();
}
if (args.out) fs.writeFileSync(path.resolve(ROOT, String(args.out)), JSON.stringify({ date: new Date().toISOString(), results }, null, 1) + '\n');
process.exit(ok ? 0 : 1);

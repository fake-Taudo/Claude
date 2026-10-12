// Screenshot-Serie der Spielmodi in Hochformat, Querformat und Desktop – mit einfachen UI-Prüfungen.
//   node tools/modes/screens.mjs [--out=docs/screens] [--only=phone-390x844,desk-1440x900] [--jpeg]
// Zustände: Menü (Modi), Regel-Hinweis, Lobby 2v2, Triple Draft (+ Auswahl), Mega Draft (+ Detail), Reveal,
// Kampf Unendlich-Elixier, Kampf 2v2 (Ping, Verbündete, Teamkollege), Ergebnis 2v2, Ergebnis Draft mit Decks.
// Prüfungen je Screenshot: kein waagerechtes Scrollen, keine Knöpfe außerhalb, Touch-Ziele ≥ 44 px, keine Konsolenfehler.
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const OUT = path.resolve(ROOT, args.out || 'docs/screens');
const EXT = args.jpeg ? 'jpg' : 'png';
const VIEWPORTS = [
  { name: 'phone-390x844', width: 390, height: 844, mobile: true },
  { name: 'phone-844x390', width: 844, height: 390, mobile: true },
  { name: 'desk-1440x900', width: 1440, height: 900, mobile: false },
];

async function loadPlaywright() {
  for (const t of ['playwright', '@playwright/test']) {
    try {
      return await import(t);
    } catch {}
  }
  const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
  for (const t of ['playwright', '@playwright/test']) {
    const p = path.join(g, t, 'index.mjs');
    if (fs.existsSync(p)) return await import(pathToFileURL(p).href);
  }
  throw new Error('Playwright nicht gefunden');
}

function freePort() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => res(p));
    });
    s.on('error', rej);
  });
}

async function startServer() {
  const port = await freePort();
  const proc = spawn(process.execPath, ['server/index.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, stdio: 'ignore' });
  const url = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) return { url, proc };
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  proc.kill();
  throw new Error('Server startet nicht');
}

/** Prüfungen im Browser: Überlauf, Knöpfe außerhalb, zu kleine Touch-Ziele (nur sichtbare, aktive Elemente). */
function pageChecks() {
  const out = [];
  const vw = innerWidth;
  const doc = document.scrollingElement || document.documentElement;
  if (doc.scrollWidth > vw + 1) out.push({ t: 'h-scroll', px: doc.scrollWidth - vw });
  const scr = document.querySelector('.screen.active');
  if (scr && scr.scrollWidth > scr.clientWidth + 1) out.push({ t: 'h-scroll', el: '#' + scr.id, px: scr.scrollWidth - scr.clientWidth });
  const root = document.querySelector('.modal-back:last-of-type') || scr || document.body;
  for (const el of root.querySelectorAll('button, .btn, .icon-btn, .fchip, [role=button], select, input:not([type=hidden])')) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === 'hidden' || el.closest('[hidden]')) continue;
    if (r.right < 0 || r.left > vw) continue;
    const name = el.id ? '#' + el.id : el.className ? '.' + String(el.className).split(' ').slice(0, 2).join('.') : el.tagName;
    // in waagerecht scrollbaren Leisten (Filter-Chips) ist „außerhalb“ gewollt
    let scroller = el.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowX)) scroller = scroller.parentElement;
    if ((r.left < -1 || r.right > vw + 1) && !scroller) out.push({ t: 'offscreen', el: name });
    const small = Math.min(r.width, r.height) < 43.5;
    if (small && !el.closest('.card, .pool-card, .offer-card, .draft-slot') && el.type !== 'checkbox') out.push({ t: 'touch-target', el: name, w: Math.round(r.width), h: Math.round(r.height) });
  }
  return out;
}

const pw = await loadPlaywright();
fs.mkdirSync(OUT, { recursive: true });
const { url, proc } = await startServer();
const browser = await pw.chromium.launch({ args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
const only = args.only ? String(args.only).split(',') : null;
const report = {};

async function newPlayer(vp, name, small = false) {
  const opts = small ? { viewport: { width: 900, height: 700 } } : vp.mobile ? { viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: vp.width, height: vp.height } };
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const log = [];
  page.on('pageerror', (e) => log.push('pageerror ' + e));
  page.on('console', (m) => m.type() === 'error' && log.push('console ' + m.text()));
  await page.goto(url);
  await page.waitForSelector('#s-name.active', { timeout: 30000 });
  await page.fill('#name-input', name);
  await page.click('#name-form button[type=submit]');
  await page.waitForFunction(() => window.turmtrubel?.net?.welcomed, null, { timeout: 15000 });
  return { ctx, page, log };
}

async function runViewport(vp) {
  const states = [];
  const logs = [];
  let n = 0;
  const shot = async (page, state, wait = 300) => {
    await page.waitForTimeout(wait);
    n++;
    const file = `${vp.name}-${String(n).padStart(2, '0')}-${state}.${EXT}`;
    await page.screenshot({ path: path.join(OUT, file), ...(EXT === 'jpg' ? { quality: 82, type: 'jpeg' } : {}) });
    const issues = await page.evaluate(pageChecks);
    states.push({ state, file, issues });
  };
  const step = async (name, fn) => {
    try {
      await fn();
    } catch (e) {
      logs.push(`${name}: ${e.message.split('\n')[0]}`);
    }
  };
  const tap = (page, sel) => page.locator(sel).first().click();

  // ── Menü, Regel-Hinweis, Triple Draft gegen Bot ──
  const A = await newPlayer(vp, 'Wilhelmina Sturm');
  logs.push(...A.log);
  await step('menü', async () => {
    await A.page.evaluate(() => document.querySelector('#menu-modes').scrollIntoView({ block: 'start' }));
    await shot(A.page, 'menue-modi', 500);
  });
  await step('regeln', async () => {
    await tap(A.page, '.mode-tile[data-mode="mega-draft"] .mode-info');
    await A.page.waitForSelector('.mode-rules-modal');
    await shot(A.page, 'regeln-mega', 500);
    await tap(A.page, '.mode-rules-modal .btn-success');
  });
  await step('triple', async () => {
    await tap(A.page, '.mode-tile[data-mode="triple-draft"] .mode-bot');
    await A.page.waitForSelector('.mode-rules-modal');
    await tap(A.page, '.mode-rules-modal .btn-success');
    await A.page.waitForSelector('#s-draft.active .offer-card', { timeout: 15000 });
    await shot(A.page, 'triple-draft', 700);
    await tap(A.page, '.offer-card >> nth=1');
    await shot(A.page, 'triple-auswahl', 300);
    // restliche Runden schnell durchwählen
    for (let i = 0; i < 80; i++) {
      if (await A.page.$('.draft-reveal')) break;
      const c = await A.page.$('.offer-card:not(.dim):not(.chosen)');
      const waiting = await A.page.evaluate(() => !!document.querySelector('.offer-card.chosen'));
      if (c && !waiting) {
        await c.click();
        await A.page.locator('.draft-confirm').click({ timeout: 2000 }).catch(() => {});
      }
      await A.page.waitForTimeout(400);
    }
    await A.page.waitForSelector('.draft-reveal', { timeout: 30000 });
    await shot(A.page, 'reveal', 1600);
    await A.page.waitForSelector('#s-game.active', { timeout: 30000 });
    await A.page.evaluate(() => window.turmtrubel.net.send('surrender', {}));
    await A.page.waitForSelector('#s-result.active', { timeout: 15000 });
    await A.page.evaluate(() => document.querySelector('#res-decks')?.scrollIntoView({ block: 'center' }));
    await shot(A.page, 'ergebnis-draft', 2400);
    await tap(A.page, '#res-menu');
    await A.page.waitForSelector('#s-menu.active');
  });
  // ── Mega Draft gegen Bot (Schwer) ──
  await step('mega', async () => {
    await A.page.evaluate(() => {
      window.turmtrubel.settings.botDifficulty = 'hard';
      window.turmtrubel.settings.hideModeInfo = { 'mega-draft': true, 'infinite-elixir': true };
      window.turmtrubel.startTraining('mega-draft');
    });
    await A.page.waitForSelector('#s-draft.active .pool-card', { timeout: 15000 });
    // warten, bis ich dran bin, dann eine erlaubte Karte auswählen
    await A.page.waitForFunction(() => document.querySelector('.draft-turn.mine'), null, { timeout: 15000 });
    await shot(A.page, 'mega-draft', 600);
    await tap(A.page, '.pool-card:not(.taken):not(.locked) >> nth=3');
    await shot(A.page, 'mega-auswahl', 300);
    await A.page.click('.draft-confirm');
    await A.page.waitForTimeout(800);
    // Filter: nur Zauber
    await A.page.locator('.mega-filters .chips >> nth=0').locator('.fchip >> nth=2').click();
    await shot(A.page, 'mega-filter-zauber', 400);
    await A.page.locator('.mega-filters .chips >> nth=0').locator('.fchip >> nth=0').click();
    // Detail per Halten
    const card = A.page.locator('.pool-card >> nth=0');
    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox();
    await A.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await A.page.mouse.down();
    await A.page.waitForTimeout(650);
    await A.page.mouse.up();
    await A.page.waitForSelector('.modal');
    await shot(A.page, 'mega-detail', 500);
    await A.page.keyboard.press('Escape');
    await A.page.evaluate(() => window.turmtrubel.leaveRoom());
    await A.page.waitForSelector('#s-menu.active');
  });
  // ── Unendlich-Elixier gegen Bot ──
  await step('unendlich', async () => {
    await A.page.evaluate(() => window.turmtrubel.inRoom() && window.turmtrubel.leaveRoom());
    await A.page.waitForTimeout(500);
    await A.page.evaluate(() => {
      window.turmtrubel.settings.hideModeInfo = { ...window.turmtrubel.settings.hideModeInfo, 'infinite-elixir': true };
      window.turmtrubel.startTraining('infinite-elixir');
    });
    await A.page.waitForSelector('#s-game.active', { timeout: 20000 });
    await shot(A.page, 'kampf-unendlich-banner', 3300);
    await A.page.waitForTimeout(8000);
    await shot(A.page, 'kampf-unendlich', 0);
    await A.page.evaluate(() => window.turmtrubel.leaveRoom());
  });
  // ── 2 gegen 2 ──
  await step('2v2', async () => {
    await A.page.evaluate(() => window.turmtrubel.inRoom() && window.turmtrubel.leaveRoom());
    await A.page.waitForSelector('#s-menu.active');
    await A.page.evaluate(() => (window.turmtrubel.settings.hideModeInfo = { ...window.turmtrubel.settings.hideModeInfo, '2v2': true }));
    await tap(A.page, '.mode-tile[data-mode="2v2"] .mode-friends');
    await A.page.waitForSelector('#s-lobby.active');
    const code = await A.page.evaluate(() => window.turmtrubel.room.code);
    const others = [];
    for (const name of ['Ben', 'Cleo', 'Dan']) {
      const P = await newPlayer(vp, name, true);
      await P.page.evaluate(() => (window.turmtrubel.settings.hideModeInfo = { '2v2': true }));
      await P.page.click('#btn-join');
      await P.page.locator('[data-code-input]').first().click();
      await P.page.keyboard.type(code);
      await P.page.keyboard.press('Enter');
      await P.page.waitForSelector('#s-lobby.active', { timeout: 10000 });
      others.push(P);
    }
    await shot(A.page, 'lobby-2v2', 600);
    const [B, C, D] = others; // Sitze: Anna 0, Ben 2, Cleo 1, Dan 3
    for (const P of [A, B, C, D]) await P.page.click('#lobby-ready');
    await A.page.waitForSelector('#s-game.active', { timeout: 30000 });
    await C.page.waitForSelector('#s-game.active', { timeout: 30000 });
    await A.page.waitForTimeout(3000);
    // Cleo (Annas Kollegin) spielt zwei Karten, Anna gibt ein Zeichen
    for (let k = 0; k < 2; k++) {
      await C.page.evaluate((k) => {
        const g = window.turmtrubel.game;
        for (let i = 0; i < 4; i++) {
          g.sel = i;
          if (g.tryPlay(5 + k * 8, g.side === 0 ? 21 : 11)) break;
        }
      }, k);
      await C.page.waitForTimeout(700);
    }
    await A.page.evaluate(() => {
      const g = window.turmtrubel.game;
      g.sendPing(9, g.side === 0 ? 12 : 20);
    });
    await shot(A.page, 'kampf-2v2', 1200);
    for (const P of [B, D, C]) {
      await P.page.evaluate(() => window.turmtrubel.net.send('surrender', {}));
      await A.page.waitForTimeout(500);
    }
    await A.page.evaluate(() => window.turmtrubel.net.send('surrender', {}));
    await A.page.waitForSelector('#s-result.active', { timeout: 15000 });
    await shot(A.page, 'ergebnis-2v2', 2200);
    for (const P of others) {
      logs.push(...P.log.map((l) => 'Mitspieler: ' + l));
      await P.ctx.close();
    }
  });
  logs.push(...A.log);
  await A.ctx.close();
  return { states, log: [...new Set(logs)] };
}

try {
  for (const vp of VIEWPORTS) {
    if (only && !only.includes(vp.name)) continue;
    const t0 = Date.now();
    report[vp.name] = await runViewport(vp);
    const r = report[vp.name];
    const count = (t) => r.states.reduce((s, x) => s + x.issues.filter((i) => i.t === t).length, 0);
    console.log(`${vp.name.padEnd(16)} ${r.states.length} Zustände · h-scroll ${count('h-scroll')} · offscreen ${count('offscreen')} · touch-target ${count('touch-target')} · Fehler ${r.log.length} · ${Math.round((Date.now() - t0) / 1000)} s`);
    for (const l of r.log) console.log('   ' + l);
  }
} finally {
  await browser.close();
  proc.kill();
}
// Teil-Läufe (--only) ergänzen eine vorhandene checks.json
const file = path.join(OUT, 'checks.json');
const prev = only && fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
fs.writeFileSync(file, JSON.stringify({ ...prev, ...report }, null, 1));
console.log(`\nScreenshots und checks.json in ${path.relative(process.cwd(), OUT)}`);

// Screenshot-Serie des Modus „Chaos“ in Hochformat, Querformat und Desktop – mit einfachen UI-Prüfungen.
//   node tools/chaos/screens.mjs [--out=docs/screens] [--only=phone-390x844] [--scale=4] [--png]
// Zustände: Menü (Chaos-Kachel), Regel-Hinweis mit Pool und Rundenplan, Chaos-Deckbau (+ Perks im Kartendetail),
// echte Auswahlrunde gegen den Bot, Perk-Auswahl je Seltenheit (Gewöhnlich, Selten, Episch), Kampf mit
// Perk-Abzeichen und Turm-„×2“, Abzeichen-Info, Perk-Liste im Kampfmenü, Ergebnis mit „Deine gewählten Perks“.
// Der Server läuft mit --scale facher Tick-Geschwindigkeit (nur Spielzeit; die Auswahlfrist bleibt 6 s Echtzeit).
// Die Seltenheits-Screens nutzen echte Perks des eigenen Decks; die Stufe wird dafür im Client vorgegeben
// (die Seltenheit würfelt sonst der Server).
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
const SCALE = Number(args.scale || 4);
const EXT = args.png ? 'png' : 'jpg';
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
  const code = `import('${pathToFileURL(path.join(ROOT, 'server/index.js')).href}').then((m) => m.startServer({ port: ${port}, host: '127.0.0.1', quiet: true, timeScale: ${SCALE} }))`;
  const proc = spawn(process.execPath, ['-e', code], { cwd: ROOT, stdio: 'ignore' });
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
  const root = document.querySelector('.modal-back:last-of-type') || document.querySelector('.perk-overlay') || scr || document.body;
  for (const el of root.querySelectorAll('button, .btn, .icon-btn, .fchip, [role=button], select, input:not([type=hidden])')) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === 'hidden' || el.closest('[hidden]')) continue;
    if (r.right < 0 || r.left > vw) continue;
    const name = el.id ? '#' + el.id : el.className ? '.' + String(el.className).split(' ').slice(0, 2).join('.') : el.tagName;
    let scroller = el.parentElement;
    while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowX)) scroller = scroller.parentElement;
    if ((r.left < -1 || r.right > vw + 1) && !scroller) out.push({ t: 'offscreen', el: name });
    const small = Math.min(r.width, r.height) < 43.5;
    if (small && !el.closest('.card, .dc, .dv-cell, .dv-pick, .dv-slot') && el.type !== 'checkbox') out.push({ t: 'touch-target', el: name, w: Math.round(r.width), h: Math.round(r.height) });
  }
  return out;
}

const pw = await loadPlaywright();
fs.mkdirSync(OUT, { recursive: true });
const { url, proc } = await startServer();
const browser = await pw.chromium.launch({ args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
const only = args.only ? String(args.only).split(',') : null;
const report = {};

async function newPlayer(vp, name) {
  const opts = vp.mobile ? { viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: vp.width, height: vp.height } };
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

/** Wählt in einer laufenden Runde: bevorzugt die höchste Seltenheit (für sichtbare Abzeichen/Glow). */
async function pickBest(page) {
  return page.evaluate(() => {
    const o = window.turmtrubel.game?.perkOverlay;
    const m = o?.msg;
    if (!m || m.picked || !m.options.length) return null;
    const rank = { common: 1, rare: 2, epic: 3 };
    const best = m.options.slice().sort((a, b) => rank[b.tier] - rank[a.tier])[0];
    o.pick(best);
    return best.tier;
  });
}

async function runViewport(vp) {
  const states = [];
  const logs = [];
  let n = 0;
  const shot = async (page, state, wait = 300) => {
    await page.waitForTimeout(wait);
    n++;
    const file = `chaos-${vp.name}-${String(n).padStart(2, '0')}-${state}.${EXT}`;
    await page.screenshot({ path: path.join(OUT, file), ...(EXT === 'jpg' ? { type: 'jpeg', quality: 82 } : {}) });
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
  const A = await newPlayer(vp, 'Wilhelmina Sturm');

  await step('menü', async () => {
    await A.page.evaluate(() => document.querySelector('.mode-tile[data-mode="chaos"]').scrollIntoView({ block: 'center' }));
    await shot(A.page, 'menue-kachel', 600);
  });
  await step('regeln', async () => {
    await tap(A.page, '.mode-tile[data-mode="chaos"] .mode-info');
    await A.page.waitForSelector('.mode-rules-modal');
    await shot(A.page, 'info', 500);
    await A.page.evaluate(() => document.querySelector('.mode-rules-modal .chaos-pool')?.scrollIntoView({ block: 'center' }));
    await shot(A.page, 'info-pool', 300);
    await A.page.keyboard.press('Escape');
    await A.page.waitForTimeout(300);
  });
  await step('deckbau', async () => {
    await tap(A.page, '.mode-tile[data-mode="chaos"] .mode-chaos-btn');
    await A.page.waitForSelector('#s-deck.active.chaos-set');
    await shot(A.page, 'deckbau', 700);
    await tap(A.page, '#card-grid .card >> nth=4');
    await A.page.waitForSelector('.modal .box.perks');
    await shot(A.page, 'deckbau-perks', 500);
    await A.page.keyboard.press('Escape');
    await A.page.waitForTimeout(250);
    await tap(A.page, '#deck-back');
    await A.page.waitForSelector('#s-menu.active');
  });
  const rarityPreviews = async () => {
    // Overlay je Seltenheit mit echten Perks aus dem eigenen Deck (Stufe vom Client vorgegeben, siehe Kopf)
    for (const [tier, file] of [['common', 'auswahl-gewoehnlich'], ['rare', 'auswahl-selten'], ['epic', 'auswahl-episch']]) {
      await A.page.evaluate((tier) => {
        const app = window.turmtrubel;
        const g = app.game;
        if (!g) return;
        const deck = g.deck.filter((id) => app.chaos.byCard.has(id) && !g.myPerks.has(id));
        const opts = deck.slice(0, 2).map((id) => {
          const p = app.chaos.perkFor(id, tier);
          return { id: p.id, card: id, tier, name: p.name, description: p.description, mechanic: p.mechanicType };
        });
        g.perkOverlay?.destroy(true);
        g.perkOverlay = null;
        g.onPerkRound({ type: 'perkRound', round: tier === 'common' ? 1 : tier === 'rare' ? 2 : 3, rounds: 5, timeLeft: 4.2, pickSeconds: 6, options: opts, skipped: false, picked: null, done: [false, false], pauseTotal: 0, preview: true });
      }, tier);
      await shot(A.page, file, 700);
      await A.page.evaluate(() => {
        const g = window.turmtrubel.game;
        if (!g?.perkOverlay) return;
        g.perkOverlay.destroy(true);
        g.perkOverlay = null;
        g.paused = false;
      });
    }
  };
  await step('kampf', async () => {
    await A.page.evaluate(() => {
      const app = window.turmtrubel;
      app.settings.botDifficulty = 'easy';
      app.settings.hideModeInfo = { ...app.settings.hideModeInfo, chaos: true };
      app.startTraining('chaos');
    });
    await A.page.waitForSelector('#s-game.active', { timeout: 20000 });
    // eigene Karten spielen, damit Einheiten (später mit Perk) auf dem Feld stehen
    // zurückhaltend spielen (alle ~1,5 s), damit der Kampf nicht vor den Auswahlrunden endet
    const playSome = () =>
      A.page.evaluate(() => {
        const g = window.turmtrubel.game;
        if (!g?.me || g.paused || g.elixirNow() < 6) return;
        for (let i = 0; i < 4; i++) {
          g.sel = i;
          if (g.tryPlay(4 + Math.random() * 10, g.side === 0 ? 21 : 11)) break;
        }
        g.sel = -1;
      });
    // Runde 1 (echt): warten, Overlay fotografieren, wählen
    for (let i = 0; i < 400; i++) {
      if (await A.page.$('.perk-overlay')) break;
      if (i % 10 === 0) await playSome();
      await A.page.waitForTimeout(150);
    }
    await A.page.waitForSelector('.perk-overlay .perk-option', { timeout: 30000 });
    await shot(A.page, 'auswahl-runde1', 700);
    await pickBest(A.page);
    await shot(A.page, 'auswahl-gewaehlt', 250);
    // Perk-Auswahl je Seltenheit, solange der Kampf sicher läuft
    await A.page.waitForFunction(() => !window.turmtrubel.game?.perkOverlay?.el, null, { timeout: 15000 });
    await rarityPreviews();
    // weitere echte Runden bis zu einem epischen Perk (oder Runde 4)
    for (let round = 2; round <= 4; round++) {
      for (let i = 0; i < 600; i++) {
        if (await A.page.evaluate(() => !!window.turmtrubel.game?.perkOverlay?.el && window.turmtrubel.game.perkOverlay.round > 0 && !window.turmtrubel.game.perkOverlay.msg.picked)) break;
        if (!(await A.page.$('#s-game.active'))) break;
        if (i % 10 === 0) await playSome();
        await A.page.waitForTimeout(150);
      }
      if (!(await A.page.$('#s-game.active'))) break;
      const tier = await pickBest(A.page);
      if (tier === 'epic') break;
    }
    // Kampf mit Perk-Abzeichen (Handkarten, Einheiten, Glow) und Turm-„×2“
    for (let k = 0; k < 6; k++) {
      await playSome();
      await A.page.waitForTimeout(700);
    }
    await shot(A.page, 'kampf-perks', 400);
    // Abzeichen einer Handkarte antippen → Beschreibung als Hinweis
    await A.page.evaluate(() => {
      const g = window.turmtrubel.game;
      const id = g?.me?.h.find((c) => g.myPerks.has(c));
      if (id) g.showPerkInfo(id);
    });
    await shot(A.page, 'kampf-abzeichen-info', 500);
    // Perk-Liste über das Kampfmenü (falls gerade eine Auswahlrunde läuft: erst wählen)
    await pickBest(A.page);
    await A.page.waitForFunction(() => !window.turmtrubel.game?.perkOverlay?.el, null, { timeout: 15000 });
    await tap(A.page, '#game-menu-btn');
    await tap(A.page, '#gm-perks');
    await A.page.waitForSelector('.perk-list-modal');
    await shot(A.page, 'kampf-perkliste', 400);
    await A.page.keyboard.press('Escape');
  });
  await step('ergebnis', async () => {
    await A.page.evaluate(() => window.turmtrubel.net.send('surrender', {}));
    await A.page.waitForSelector('#s-result.active', { timeout: 20000 });
    await A.page.evaluate(() => document.querySelector('#res-perks')?.scrollIntoView({ block: 'center' }));
    await shot(A.page, 'ergebnis', 2600);
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
    for (const s of r.states) for (const i of s.issues) console.log(`   ${s.state}: ${JSON.stringify(i)}`);
  }
} finally {
  await browser.close();
  proc.kill();
}
const file = path.join(OUT, 'chaos-checks.json');
const prev = only && fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
fs.writeFileSync(file, JSON.stringify({ ...prev, ...report }, null, 1));
console.log(`\nScreenshots und chaos-checks.json in ${path.relative(process.cwd(), OUT)}`);

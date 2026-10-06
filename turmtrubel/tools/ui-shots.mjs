#!/usr/bin/env node
// UI-Screenshots + automatische Prüfungen für alle Ziel-Viewports.
//
//   node tools/ui-shots.mjs                     # alle 8 Viewports → docs/ui-nachher/
//   node tools/ui-shots.mjs --only=phone-844x390,desk-1280x800
//   node tools/ui-shots.mjs --out=/tmp/shots --jpeg
//   node tools/ui-shots.mjs --url=http://localhost:3000   # vorhandenen Server nutzen
//   node tools/ui-shots.mjs --perf                         # nur Performance: 10 s Bot-Kampf, CPU 4× gedrosselt
//
// Startet (ohne --url) selbst einen Server auf einem freien Port, spielt pro Viewport den
// kompletten Ablauf durch (Name → Menü → Deck-Bauer → Training → Kampf → Pause → Ergebnis,
// dazu Fehlertoast, letzte 10 s, zerstörter Turm, Sieg, Multiplayer-Lobby) und schreibt
// <viewport>-<nn>-<zustand>.png sowie checks.json mit allen Befunden.
//
// Playwright ist bewusst KEINE Projekt-Abhängigkeit (hält `npm install` für Spieler/Render schlank).
// Gesucht wird: lokales `playwright`, dann `@playwright/test`, dann die globale npm-Installation.
// Browser: PLAYWRIGHT_BROWSERS_PATH bzw. CHROMIUM_PATH.
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const OUT = path.resolve(ROOT, args.out || 'docs/ui-nachher');
const EXT = args.jpeg ? 'jpg' : 'png';

export const VIEWPORTS = [
  { name: 'desk-1280x800', width: 1280, height: 800 },
  { name: 'desk-1920x1080', width: 1920, height: 1080 },
  { name: 'phone-1688x780', width: 1688, height: 780, touch: true },
  { name: 'phone-844x390', width: 844, height: 390, touch: true },
  { name: 'phone-780x1688', width: 780, height: 1688, touch: true },
  { name: 'phone-360x640', width: 360, height: 640, touch: true },
  { name: 'tab-768x1024', width: 768, height: 1024, touch: true },
  { name: 'tab-1024x768', width: 1024, height: 768, touch: true },
  // Vorher/Nachher-Serie des visuellen Upgrades (docs/before_after/)
  { name: 'phone-390x844', width: 390, height: 844, touch: true, set: 'ba' },
  { name: 'desk-1440x900', width: 1440, height: 900, set: 'ba' },
];
// --set=ba → nur die drei Vorher/Nachher-Formate (Hochformat, Querformat, Desktop)
const SETS = { ba: ['phone-390x844', 'phone-844x390', 'desk-1440x900'] };

// ───────────── Playwright finden ─────────────
async function loadPlaywright() {
  const tries = ['playwright', '@playwright/test'];
  for (const t of tries) {
    try {
      return await import(t);
    } catch {}
  }
  try {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    for (const t of tries) {
      const p = path.join(g, t, 'index.mjs');
      if (fs.existsSync(p)) return await import(pathToFileURL(p).href);
    }
  } catch {}
  console.error('Playwright nicht gefunden. Installiere es z. B. mit `npm i -g playwright` (Browser: `npx playwright install chromium`).');
  process.exit(2);
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
      const r = await fetch(url);
      if (r.ok) return { url, proc };
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  proc.kill();
  throw new Error('Server startet nicht');
}

// ───────────── Prüfungen (laufen im Browser) ─────────────
function pageChecks() {
  const out = [];
  const vw = innerWidth;
  const vh = innerHeight;
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.opacity !== '0';
  };
  const label = (el) => (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '') || el.tagName;
  const modalOpen = document.querySelector('#modal-root .modal-back');
  const scope = modalOpen ? [document.getElementById('modal-root'), document.getElementById('toasts')] : [document.body];
  const all = (sel) => scope.flatMap((r) => [...r.querySelectorAll(sel)]);

  // 1) Touch-Ziele und Abschneiden am Viewport
  for (const el of all('button,[role=button],a,input,select,[data-tap]')) {
    if (!vis(el) || el.closest('[inert]')) continue;
    const r = el.getBoundingClientRect();
    const scroller = el.closest('.screen, .modal');
    if (r.width < 44 || r.height < 44) out.push({ t: 'touch-target', el: label(el), w: Math.round(r.width), h: Math.round(r.height) });
    // In scrollbaren Containern zählt nur horizontales Abschneiden
    const offX = r.left < -1 || r.right > vw + 1;
    const offY = r.top < -1 || r.bottom > vh + 1;
    if (offX || (offY && !(scroller && scroller.scrollHeight > scroller.clientHeight))) out.push({ t: 'offscreen', el: label(el) });
  }
  // Horizontales Scrollen einer Seite
  for (const s of document.querySelectorAll('.screen.active')) if (s.scrollWidth > s.clientWidth + 1) out.push({ t: 'h-scroll', el: '#' + s.id, px: s.scrollWidth - s.clientWidth });

  // 2) Abgeschnittene Texte (Ellipsis ohne Zugang zum Volltext = Fehler, mit title = Hinweis)
  for (const el of all('*')) {
    if (!vis(el)) continue;
    const cs = getComputedStyle(el);
    const clamped = cs.webkitLineClamp && cs.webkitLineClamp !== 'none' && el.scrollHeight > el.clientHeight + 1;
    if ((cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) || clamped) {
      const full = el.closest('[title]') || el.closest('[aria-label]');
      out.push({ t: full ? 'truncated-titled' : 'truncated', text: el.textContent.trim().slice(0, 40) });
    }
  }

  // 3) Kampf: Arena darf von keinem HUD-Element überdeckt oder abgeschnitten werden
  const g = window.turmtrubel?.game;
  const L = g?.hud?.L;
  if (L && document.body.dataset.screen === 's-game') {
    const A = L.arena;
    const blocks = typeof g.hud.blocks === 'function' ? g.hud.blocks() : legacyBlocks(L);
    const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    if (A.x < -1 || A.y < -1 || A.x + A.w > vw + 1 || A.y + A.h > vh + 1) out.push({ t: 'arena-offscreen', arena: A });
    for (const [name, r] of Object.entries(blocks)) {
      if (!r) continue;
      const o = inter(A, r);
      if (o > 4) out.push({ t: 'arena-under-hud', el: name, overlapPx: Math.round(o) });
      if (r.x < -1 || r.y < -1 || r.x + r.w > vw + 1 || r.y + r.h > vh + 1) out.push({ t: 'hud-offscreen', el: name });
      if (/^card\d|emote|ability|menu/.test(name) && (r.w < 44 || r.h < 44)) out.push({ t: 'touch-target', el: 'hud:' + name, w: Math.round(r.w), h: Math.round(r.h) });
    }
    // Toast: nur direkt über der Hand erlaubt (unterstes Fünftel der Arena, §9.7), nie über dem Kampfgeschehen
    const t = document.querySelector('#toasts .toast');
    if (t && vis(t)) {
      const tr = t.getBoundingClientRect();
      const o = inter(A, { x: tr.left, y: tr.top, w: tr.width, h: tr.height });
      if (o > 4 && tr.top < A.y + A.h * 0.8) out.push({ t: 'toast-over-arena', overlapPx: Math.round(o) });
    }
    // DOM-Menüknopf über der Arena?
    const mb = document.getElementById('game-menu-btn');
    if (mb && vis(mb)) {
      const r = mb.getBoundingClientRect();
      const o = inter(A, { x: r.left, y: r.top, w: r.width, h: r.height });
      if (o > 4) out.push({ t: 'arena-under-hud', el: 'menu-button', overlapPx: Math.round(o) });
    }
  }
  function legacyBlocks(L) {
    const c = (b) => b && { x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 };
    const o = { topbar: L.topbar, panel: L.panel, next: L.next, elixir: L.elixir, emote: c(L.emoteBtn), ability: c(L.abilityBtn) };
    (L.cards || []).forEach((r, i) => (o['card' + i] = r));
    return o;
  }
  return out;
}

// ───────────── Ablauf pro Viewport ─────────────
async function runViewport(browser, url, vp, report) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, hasTouch: !!vp.touch, isMobile: !!vp.touch && vp.width < 1100 });
  const page = await ctx.newPage();
  const log = [];
  const states = [];
  page.on('pageerror', (e) => log.push('pageerror: ' + e.message));
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && log.push(m.type() + ': ' + m.text()));
  let nn = 0;
  const settle = async (ms = 0) => {
    await page.evaluate(() => document.fonts?.ready);
    await page
      .waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running' || !Number.isFinite(a.effect?.getComputedTiming?.().endTime)), null, { timeout: 1500 })
      .catch(() => {});
    if (ms) await page.waitForTimeout(ms);
  };
  const shot = async (state, { wait = 0, noSettle = false } = {}) => {
    if (!noSettle) await settle(wait);
    else if (wait) await page.waitForTimeout(wait);
    nn++;
    const file = `${vp.name}-${String(nn).padStart(2, '0')}-${state}.${EXT}`;
    await page.screenshot({ path: path.join(OUT, file), type: EXT === 'jpg' ? 'jpeg' : 'png', quality: EXT === 'jpg' ? 80 : undefined });
    const issues = await page.evaluate(pageChecks);
    states.push({ state, file, issues });
    return issues;
  };
  const step = async (name, fn) => {
    try {
      await fn();
    } catch (e) {
      log.push(`Schritt „${name}“ fehlgeschlagen: ${e.message.split('\n')[0]}`);
    }
  };
  const game = (fn, arg) => page.evaluate(fn, arg);
  const tapWorld = async (wx, wy) => {
    const [x, y] = await game(([a, b]) => window.turmtrubel.game.view.toScreen(a, b), [wx, wy]);
    await page.mouse.click(x, y);
  };
  const tapRect = async (r) => page.mouse.click(r.x + r.w / 2, r.y + r.h / 2);
  const hudRect = (key, i) =>
    game(
      ([k, idx]) => {
        const L = window.turmtrubel.game.hud.L;
        const v = idx == null ? L[k] : L[k][idx];
        return v.r != null ? { x: v.x - v.r, y: v.y - v.r, w: v.r * 2, h: v.r * 2 } : v;
      },
      [key, i],
    );

  await page.goto(url);
  await page.waitForSelector('#s-name.active', { timeout: 20000 });
  await shot('name');
  await page.fill('#name-input', 'Wilhelmina Sturm');
  await page.click('#name-form button[type=submit]');
  await page.waitForSelector('#s-menu.active');
  await page.waitForFunction(() => window.turmtrubel?.net?.welcomed, null, { timeout: 8000 }).catch(() => log.push('nicht online'));
  await shot('menu', { wait: 150 });

  await step('einstellungen', async () => {
    await page.click('#menu-settings');
    await shot('einstellungen');
    await page.keyboard.press('Escape');
  });
  await step('beitreten', async () => {
    await page.click('#btn-join');
    await page.waitForSelector('.join-code-input, [data-code-input]');
    await page.locator('.join-code-input, [data-code-input]').first().click();
    await page.keyboard.type('ZZZZZZ');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await shot('beitreten-fehler');
    await page.keyboard.press('Escape');
  });
  await step('deck-bauer', async () => {
    await page.click('#btn-deckbuilder');
    await page.waitForSelector('#s-deck.active');
    await shot('deck-bauer', { wait: 150 });
    await page.evaluate(() => document.querySelector('#card-grid')?.scrollIntoView({ block: 'start' }));
    await shot('deck-sammlung');
    await page.evaluate(() => document.querySelector('#s-deck').scrollTo(0, 0));
    const evoIdx = await page.evaluate(() => [...document.querySelectorAll('#card-grid .card')].findIndex((c) => window.turmtrubel.db.card(c.dataset.id)?.evo));
    await page.locator('#card-grid .card').nth(Math.max(0, evoIdx)).click();
    await shot('kartendetail', { wait: 100 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await page.click('#deck-back');
  });

  // ───── Training ─────
  await page.click('#btn-training');
  await page.waitForSelector('#s-lobby.active', { timeout: 8000 }).catch(() => log.push('keine Lobby'));
  await page.waitForSelector('#countdown.show, #lobby-vs.counting', { timeout: 3000 }).catch(() => {});
  await shot('lobby-countdown', { noSettle: true, wait: 350 });
  await page.waitForSelector('#s-loading.active', { timeout: 8000 }).catch(() => log.push('kein Ladescreen'));
  await shot('laden', { noSettle: true, wait: 700 });
  await page.waitForSelector('#s-game.active', { timeout: 12000 });
  await page.waitForTimeout(1200);
  await shot('kampf-start', { noSettle: true });

  await step('karte-waehlen', async () => {
    await tapRect(await hudRect('cards', 0));
    await shot('karte-gewaehlt', { noSettle: true, wait: 250 });
    await page.keyboard.press('Escape');
  });
  await step('ziehen', async () => {
    const r = await hudRect('cards', 1);
    const [tx, ty] = await game(() => window.turmtrubel.game.view.toScreen(4, 22));
    await page.mouse.move(r.x + r.w / 2, r.y + r.h / 2);
    await page.mouse.down();
    await page.mouse.move((r.x + tx) / 2, (r.y + ty) / 2, { steps: 4 });
    await page.mouse.move(tx, ty, { steps: 4 });
    await shot('ziehen', { noSettle: true, wait: 150 });
    await page.mouse.up();
    await shot('ausgespielt', { noSettle: true, wait: 350 });
  });
  await page.waitForTimeout(5000);
  await shot('kampf', { noSettle: true });

  await step('toast-elixier', async () => {
    for (let k = 0; k < 4; k++) {
      const info = await game(() => {
        const g = window.turmtrubel.game;
        const e = g.elixirNow();
        const costs = g.me.h.map((id) => g.db.card(id)?.elixir ?? 0);
        const idx = costs.findIndex((c) => c > e + 0.2);
        const max = costs.indexOf(Math.max(...costs.filter((c) => c <= e)));
        return { idx, max };
      });
      if (info.idx >= 0) {
        await tapRect(await hudRect('cards', info.idx));
        await tapWorld(4, 22);
        await shot('toast-elixier', { noSettle: true, wait: 200 });
        return;
      }
      if (info.max >= 0) {
        await tapRect(await hudRect('cards', info.max));
        await tapWorld(14, 22);
      }
      await page.waitForTimeout(300);
    }
    throw new Error('kein unbezahlbarer Zustand erreicht');
  });
  await step('emote', async () => {
    await page.waitForTimeout(1500);
    await tapRect(await hudRect('emoteBtn'));
    await shot('emote-auswahl', { noSettle: true, wait: 200 });
    await tapRect(await hudRect('emoteItems', 1));
    await page.waitForTimeout(300);
  });
  await step('pause', async () => {
    await page.click('#game-menu-btn');
    await shot('pause', { wait: 100 });
  });
  await step('einstellungen-kampf', async () => {
    await page.click('#gm-settings');
    await shot('einstellungen-kampf');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    // Alter Stand: Dropdown-Menü wieder schließen
    await page.evaluate(() => document.getElementById('game-menu') && (document.getElementById('game-menu').hidden = true));
  });
  await step('letzte-10s', async () => {
    // Nur Darstellung: Restzeit clientseitig vorgetäuscht
    await game(() => {
      const g = window.turmtrubel.game;
      g.__tl = g.timeLeftNow;
      g.timeLeftNow = () => 7.4;
    });
    await shot('letzte-10s', { noSettle: true, wait: 300 });
    await game(() => {
      const g = window.turmtrubel.game;
      g.timeLeftNow = g.__tl;
    });
  });
  await step('turm-zerstoert', async () => {
    // Nur Darstellung: linken gegnerischen Wachturm aus den Snapshots filtern, Krone gutschreiben.
    // main.js ruft app.game.onSnapshot(m) pro Nachricht auf → Instanz-Methode lässt sich umhängen.
    await game(() => {
      const g = window.turmtrubel.game;
      const orig = g.onSnapshot.bind(g);
      g.__snap = g.onSnapshot;
      g.onSnapshot = (s) => {
        s.e = s.e.filter((e) => !(g.types[e[1]] === 'tower_princess' && e[2] !== g.side && e[3] < 9));
        s.cr = s.cr.slice();
        s.cr[g.side] = Math.max(1, s.cr[g.side]);
        orig(s);
      };
      const [x, y] = g.view.toScreen(3.5, g.side === 0 ? 6.5 : 25.5);
      g.hud.flyCrown(x, y, true);
    });
    await shot('turm-zerstoert', { noSettle: true, wait: 700 });
  });
  await step('aufgeben', async () => {
    await page.click('#game-menu-btn');
    await page.waitForTimeout(150);
    await page.click('#gm-surrender');
    await shot('aufgeben-bestaetigen');
    await page.click('#modal-root .btn-danger, #modal-root .btn-red');
    await page.waitForSelector('#s-result.active', { timeout: 8000 });
    await shot('ergebnis-niederlage', { wait: 1400 });
  });
  await step('ergebnis-sieg', async () => {
    // Nur Darstellung: Siegvariante des echten Ergebnisses
    await page.evaluate(() => {
      const app = window.turmtrubel;
      const m = structuredClone(app.result);
      m.winner = m.you;
      m.crowns = [0, 0];
      m.crowns[m.you] = 3;
      m.crowns[1 - m.you] = 1;
      m.reasonText = 'Alle Türme zerstört';
      app.result = m;
      app.showResult(m);
    });
    await shot('ergebnis-sieg', { noSettle: true, wait: 1800 });
    await page.click('#res-menu');
    await page.waitForSelector('#s-menu.active');
  });

  // ───── Multiplayer-Lobby mit zwei Seiten ─────
  await step('mp-lobby', async () => {
    await page.click('#btn-create');
    await page.waitForSelector('#s-lobby.active');
    await page.waitForFunction(() => /^[A-Z0-9]{6}$/.test(document.getElementById('lobby-code').textContent));
    await shot('mp-lobby-warten', { wait: 150 });
    const code = await page.textContent('#lobby-code');
    const ctx2 = await browser.newContext({ viewport: { width: 1000, height: 700 } });
    const p2 = await ctx2.newPage();
    await p2.goto(url);
    await p2.waitForSelector('#s-name.active');
    await p2.fill('#name-input', 'Gast Gustav');
    await p2.click('#name-form button[type=submit]');
    await p2.waitForFunction(() => window.turmtrubel?.net?.welcomed);
    await p2.evaluate((c) => window.turmtrubel.openJoin(c), code);
    await p2.waitForSelector('#s-lobby.active', { timeout: 5000 });
    await p2.click('#lobby-ready');
    await page.waitForTimeout(400);
    await shot('mp-lobby', { wait: 150 });
    await p2.click('#lobby-leave');
    await ctx2.close();
    await page.click('#lobby-leave');
  });

  report[vp.name] = { states, log };
  await ctx.close();
}

// ───────────── Performance (§12.3) ─────────────
async function runPerf(browser, url, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.touch ? 2 : 1, hasTouch: !!vp.touch, isMobile: !!vp.touch && vp.width < 1100 });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(url);
  await page.waitForSelector('#s-name.active', { timeout: 20000 });
  await page.fill('#name-input', 'Messung');
  await page.click('#name-form button[type=submit]');
  await page.waitForFunction(() => window.turmtrubel?.net?.welcomed, null, { timeout: 8000 });
  await page.click('#btn-training');
  await page.waitForSelector('#s-game.active', { timeout: 15000 });
  await page.waitForTimeout(800);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(args.cpu || 4) });
  await page.evaluate(() => {
    const P = (window.__perf = { frames: [], long: [] });
    try {
      new PerformanceObserver((l) => l.getEntries().forEach((e) => P.long.push(e.duration))).observe({ entryTypes: ['longtask'] });
    } catch {}
    let last = performance.now();
    const f = (t) => {
      P.frames.push(t - last);
      last = t;
      if (!P.stop) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  // 10 s Kampf mit eigenen Karten (Last durch Einheiten, Partikel, Schadenszahlen)
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => {
      const g = window.turmtrubel.game;
      if (!g?.me) return;
      const e = g.elixirNow();
      const i = g.me.h.findIndex((id) => (g.db.card(id)?.elixir ?? 99) <= e);
      if (i < 0) return;
      g.sel = i;
      g.tryPlay(i % 2 ? 4 : 14, g.side === 0 ? 20 : 12);
    });
    await page.waitForTimeout(2000);
  }
  const r = await page.evaluate(() => {
    const P = window.__perf;
    P.stop = true;
    const f = P.frames.slice(3).sort((a, b) => a - b);
    const avg = f.reduce((a, b) => a + b, 0) / Math.max(1, f.length);
    return { frames: f.length, fps: Math.round(1000 / avg), p95ms: Math.round(f[Math.floor(f.length * 0.95)] || 0), worstMs: Math.round(f.at(-1) || 0), longTasks: P.long.length, longMaxMs: Math.round(Math.max(0, ...P.long)) };
  });
  await ctx.close();
  return r;
}

// ───────────── Hauptprogramm ─────────────
const pw = await loadPlaywright();
fs.mkdirSync(OUT, { recursive: true });
let server = null;
let url = args.url;
if (!url) {
  server = await startServer();
  url = server.url;
}
const exe = process.env.CHROMIUM_PATH;
const browser = await pw.chromium.launch({ executablePath: exe || undefined, args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const only = args.only ? String(args.only).split(',') : args.set ? SETS[args.set] : null;
const report = {};
if (args.perf) {
  const perf = {};
  try {
    for (const vp of VIEWPORTS) {
      if (only ? !only.includes(vp.name) : !['desk-1280x800', 'phone-844x390', 'phone-360x640'].includes(vp.name)) continue;
      perf[vp.name] = await runPerf(browser, url, vp);
      const p = perf[vp.name];
      console.log(`${vp.name.padEnd(16)} CPU ${Number(args.cpu || 4)}× · ${p.fps} fps · p95 ${p.p95ms} ms · schlechtester Frame ${p.worstMs} ms · Long Tasks ${p.longTasks} (max ${p.longMaxMs} ms)`);
    }
  } finally {
    await browser.close();
    server?.proc.kill();
  }
  fs.writeFileSync(path.join(OUT, 'perf.json'), JSON.stringify(perf, null, 1));
  process.exit(0);
}
try {
  for (const vp of VIEWPORTS) {
    if (only ? !only.includes(vp.name) : vp.set) continue;
    const t0 = Date.now();
    await runViewport(browser, url, vp, report);
    const r = report[vp.name];
    const count = (t) => r.states.reduce((n, s) => n + s.issues.filter((i) => i.t === t).length, 0);
    console.log(
      `${vp.name.padEnd(16)} ${String(r.states.length).padStart(2)} Zustände · arena-under-hud ${count('arena-under-hud')} · offscreen ${count('offscreen') + count('hud-offscreen') + count('arena-offscreen')} · truncated ${count('truncated')} · touch-target ${count('touch-target')} · toast-over-arena ${count('toast-over-arena')} · Konsole ${r.log.length} · ${((Date.now() - t0) / 1000).toFixed(0)} s`,
    );
    for (const l of r.log) console.log('   ! ' + l);
  }
} finally {
  await browser.close();
  server?.proc.kill();
}
fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify(report, null, 1));
console.log(`\nScreenshots und checks.json in ${path.relative(ROOT, OUT) || '.'}`);
const hard = Object.values(report).some((r) => r.log.some((l) => l.startsWith('pageerror')) || r.states.some((s) => s.issues.some((i) => ['arena-under-hud', 'arena-offscreen', 'hud-offscreen'].includes(i.t))));
process.exitCode = hard ? 1 : 0;

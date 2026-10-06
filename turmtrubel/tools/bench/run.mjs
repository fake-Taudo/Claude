#!/usr/bin/env node
// Benchmark + Screenshots der Extremszene (tools/bench/replay.mjs) im echten Client, ohne Server-Match:
// Die aufgezeichneten Snapshots werden im Browser in Echtzeit an game.onSnapshot() gegeben.
//
//   node tools/bench/run.mjs                         # Messung: Desktop (CPU 1×) + Handy hoch/quer (CPU 4×)
//   node tools/bench/run.mjs --shots=docs/before_after/before/szene   # zusätzlich Screenshots an den Marken
//   node tools/bench/run.mjs --out=perf.json --only=desktop-1440x900
//
// Gemessen: FPS (Mittel), p95- und schlechtester Frame, Long Tasks, Zeichenaufrufe pro Frame
// (fill/stroke/drawImage/…; eigener Durchlauf, weil das Zählen selbst Zeit kostet), JS-Heap, Partikel-Spitze.
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildReplay } from './replay.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

export const PROFILES = [
  { name: 'desktop-1440x900', width: 1440, height: 900, dpr: 1, cpu: 1 },
  { name: 'phone-390x844', width: 390, height: 844, dpr: 2, cpu: 4, touch: true },
  { name: 'phone-844x390', width: 844, height: 390, dpr: 2, cpu: 4, touch: true },
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
  throw new Error('Playwright nicht gefunden (npm i -g playwright)');
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

/** Zählt Zeichenaufrufe (nur im Zähl-Durchlauf aktiv). */
function patchCounters() {
  window.__dc = 0;
  const C = CanvasRenderingContext2D.prototype;
  for (const k of ['fill', 'stroke', 'drawImage', 'fillRect', 'strokeRect', 'fillText', 'strokeText']) {
    const o = C[k];
    C[k] = function (...a) {
      window.__dc++;
      return o.apply(this, a);
    };
  }
}

async function openGame(browser, url, prof, { count = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: prof.width, height: prof.height }, deviceScaleFactor: prof.dpr, hasTouch: !!prof.touch, isMobile: !!prof.touch });
  if (count) await ctx.addInitScript(patchCounters);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  await page.waitForFunction(() => window.turmtrubel?.db && document.querySelector('#s-name.active, #s-menu.active'), null, { timeout: 30000 });
  return { ctx, page, errors };
}

/** Startet die Wiedergabe im Client (Snapshots alle 50 ms an game.onSnapshot). */
async function startReplay(page, replay, quality = 'high') {
  await page.evaluate(
    async ({ rep, quality }) => {
      const { Game } = await import('/js/game/game.js');
      const { showScreen } = await import('/js/ui/dom.js');
      const app = window.turmtrubel;
      app.settings.quality = quality;
      const g = new Game(app, rep.init);
      app.game = g;
      // Vorbereitung (im echten Spiel im Ladescreen) getrennt messen, Kampfphase beginnt danach
      const tp = performance.now();
      g.prepare();
      if (window.__perf) {
        window.__perf.prepMs = performance.now() - tp;
        window.__perf.battleT0 = performance.now();
      }
      showScreen('s-game');
      g.start();
      const R = (window.__replay = { i: 0, done: false, peakParticles: 0 });
      const timer = setInterval(() => {
        if (R.i >= rep.snaps.length) {
          clearInterval(timer);
          R.done = true;
          return;
        }
        g.onSnapshot(structuredClone(rep.snaps[R.i++]));
        const n = typeof g.debugStats === 'function' ? g.debugStats().particles : g.fx?.list?.length || 0;
        R.peakParticles = Math.max(R.peakParticles, n);
      }, 50);
    },
    { rep: replay, quality },
  );
}

async function measure(browser, url, prof, replay, cdpRate) {
  const { ctx, page, errors } = await openGame(browser, url, prof);
  const cdp = await ctx.newCDPSession(page);
  if (cdpRate > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cdpRate });
  await page.evaluate(() => {
    const P = (window.__perf = { frames: [], long: [] });
    try {
      new PerformanceObserver((l) => l.getEntries().forEach((e) => P.long.push([e.startTime, e.duration]))).observe({ entryTypes: ['longtask'] });
    } catch {}
    let last = performance.now();
    const f = (t) => {
      P.frames.push([t, t - last]);
      last = t;
      if (!P.stop) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  const tStart = Date.now();
  await startReplay(page, replay);
  await page.waitForFunction(() => window.__replay?.done, null, { timeout: 600000, polling: 500 });
  const wallS = (Date.now() - tStart) / 1000;
  const r = await page.evaluate(() => {
    const P = window.__perf;
    P.stop = true;
    const f = P.frames.slice(5).map((x) => x[1]).sort((a, b) => a - b);
    const avg = f.reduce((a, b) => a + b, 0) / Math.max(1, f.length);
    const heap = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e5) / 10 : null;
    const long = P.long.map((x) => x[1]);
    // Nur Kampfphase: Frames und Long Tasks nach dem Ende von g.prepare() (der erste Frame danach enthält es noch)
    const t0 = P.battleT0 ?? 0;
    const bf = P.frames.filter((x) => x[0] - x[1] >= t0).map((x) => x[1]).sort((a, b) => a - b);
    const bl = P.long.filter((x) => x[0] >= t0).map((x) => x[1]);
    return {
      frames: f.length,
      fps: Math.round(1000 / avg),
      p95ms: Math.round(f[Math.floor(f.length * 0.95)] || 0),
      worstMs: Math.round(f.at(-1) || 0),
      longTasks: long.length,
      longMaxMs: Math.round(Math.max(0, ...long)),
      heapMB: heap,
      peakParticles: window.__replay.peakParticles,
      prepareMs: P.prepMs != null ? Math.round(P.prepMs) : null,
      // Spielinterne Aufteilung der langsamsten Frames (JS-Anteil; Rasterung kommt danach)
      slowFrames: (window.turmtrubel.game?.prof?.slow || []).slice(0, 5).map((c) => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, typeof v === 'number' ? Math.round(v * 10) / 10 : v]))),
      battle: { worstMs: Math.round(bf.at(-1) || 0), p99ms: Math.round(bf[Math.floor(bf.length * 0.99)] || 0), longTasks: bl.length, longMaxMs: Math.round(Math.max(0, ...bl)) },
    };
  });
  r.errors = errors.slice(0, 5);
  // Wiedergabe-Dauer: 14 s Szene; deutlich länger = Main-Thread überlastet (Snapshots stauen sich)
  r.replaySeconds = Math.round(wallS * 10) / 10;
  await ctx.close();
  return r;
}

async function countDrawCalls(browser, url, prof, replay) {
  const { ctx, page } = await openGame(browser, url, prof, { count: true });
  await startReplay(page, replay);
  await page.waitForFunction(() => window.__replay?.i > 40, null, { timeout: 60000 });
  const r = await page.evaluate(
    () =>
      new Promise((res) => {
        const start = window.__dc;
        let frames = 0;
        const t0 = performance.now();
        const f = () => {
          frames++;
          if (performance.now() - t0 < 6000) requestAnimationFrame(f);
          else res({ perFrame: Math.round((window.__dc - start) / frames), frames });
        };
        requestAnimationFrame(f);
      }),
  );
  await ctx.close();
  return r;
}

async function shots(browser, url, prof, replay, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const { ctx, page, errors } = await openGame(browser, url, prof);
  await startReplay(page, replay);
  let n = 0;
  for (const mk of replay.marks) {
    // Marke + Interpolationspuffer (≈ 3 Ticks) abwarten
    await page.waitForFunction((t) => window.__replay.i >= t, mk.tick + 3, { timeout: 60000, polling: 16 });
    await page.screenshot({ path: path.join(dir, `${prof.name}-${String(++n).padStart(2, '0')}-${mk.name}.jpg`), type: 'jpeg', quality: 82 });
  }
  await ctx.close();
  return { shots: n, errors };
}

// ───────────── Hauptprogramm ─────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const pw = await loadPlaywright();
  const replay = buildReplay();
  const server = args.url ? null : await startServer();
  const url = args.url || server.url;
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--mute-audio', '--enable-precise-memory-info', '--autoplay-policy=no-user-gesture-required'] });
  const only = args.only ? String(args.only).split(',') : null;
  const result = { date: new Date().toISOString(), maxEntities: replay.maxEntities, profiles: {} };
  try {
    for (const prof of PROFILES) {
      if (only && !only.includes(prof.name)) continue;
      if (!args['shots-only']) {
        const r = await measure(browser, url, prof, replay, prof.cpu);
        if (prof.name.startsWith('desktop')) r.drawCallsPerFrame = (await countDrawCalls(browser, url, prof, replay)).perFrame;
        result.profiles[prof.name] = r;
        console.log(
          `${prof.name.padEnd(17)} CPU ${prof.cpu}× · ${String(r.fps).padStart(3)} fps · p95 ${r.p95ms} ms · schlechtester ${r.worstMs} ms · Long Tasks ${r.longTasks} (max ${r.longMaxMs} ms) · Heap ${r.heapMB} MB · Partikel max ${r.peakParticles}` +
            (r.drawCallsPerFrame != null ? ` · ${r.drawCallsPerFrame} Zeichenaufrufe/Frame` : '') +
            ` · Wiedergabe ${r.replaySeconds} s (Soll ${(replay.snaps.length / 20).toFixed(0)} s)` +
            (r.battle ? ` · Vorbereitung ${r.prepareMs} ms · nur Kampf: schlechtester ${r.battle.worstMs} ms, p99 ${r.battle.p99ms} ms, Long Tasks ${r.battle.longTasks} (max ${r.battle.longMaxMs} ms)` : '') +
            (r.errors.length ? ` · Fehler: ${r.errors.join(' | ')}` : ''),
        );
      }
      if (args.shots && prof.name !== 'phone-844x390') {
        const s = await shots(browser, url, prof, replay, path.resolve(ROOT, String(args.shots)));
        console.log(`${prof.name.padEnd(17)} ${s.shots} Screenshots${s.errors.length ? ' · Fehler: ' + s.errors.join(' | ') : ''}`);
      }
    }
  } finally {
    await browser.close();
    server?.proc.kill();
  }
  if (args.out) fs.writeFileSync(path.resolve(ROOT, String(args.out)), JSON.stringify(result, null, 1));
}

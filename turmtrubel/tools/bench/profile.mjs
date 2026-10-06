#!/usr/bin/env node
// CPU-Profil der Extremszene: Selbstzeit je Funktion (Top 30). node tools/bench/profile.mjs [--profile=desktop-1440x900]
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildReplay } from './replay.mjs';
import { PROFILES } from './run.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const prof = PROFILES.find((p) => p.name === (args.profile || 'desktop-1440x900'));
async function loadPlaywright() {
  for (const t of ['playwright']) { try { return await import(t); } catch {} }
  const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
  return import(pathToFileURL(path.join(g, 'playwright', 'index.mjs')).href);
}
const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const pw = await loadPlaywright();
const port = await freePort();
const server = spawn(process.execPath, ['server/index.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, stdio: 'ignore' });
const url = `http://127.0.0.1:${port}/`;
for (let i = 0; i < 100; i++) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--mute-audio'] });
try {
  const ctx = await browser.newContext({ viewport: { width: prof.width, height: prof.height }, deviceScaleFactor: prof.dpr, hasTouch: !!prof.touch, isMobile: !!prof.touch });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForFunction(() => window.turmtrubel?.db && document.querySelector('#s-name.active, #s-menu.active'));
  const cdp = await ctx.newCDPSession(page);
  const rep = buildReplay();
  await page.evaluate(async (rep) => {
    const { Game } = await import('/js/game/game.js');
    const { showScreen } = await import('/js/ui/dom.js');
    const app = window.turmtrubel;
    const g = new Game(app, rep.init);
    app.game = g;
    g.prepare();
    showScreen('s-game');
    g.start();
    const R = (window.__replay = { i: 0, done: false });
    const timer = setInterval(() => {
      if (R.i >= rep.snaps.length) { clearInterval(timer); R.done = true; return; }
      g.onSnapshot(structuredClone(rep.snaps[R.i++]));
    }, 50);
  }, rep);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Profiler.start');
  await page.waitForFunction(() => window.__replay.done, null, { timeout: 600000, polling: 500 });
  const { profile } = await cdp.send('Profiler.stop');
  const self = new Map();
  const dt = new Map();
  const total = profile.samples.length;
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  for (const id of profile.samples) {
    const n = byId.get(id);
    const f = n.callFrame;
    const key = `${f.functionName || '(anon)'} ${f.url.split('/').slice(-2).join('/')}:${f.lineNumber + 1}`;
    self.set(key, (self.get(key) || 0) + 1);
  }
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, Number(args.top || 30));
  for (const [k, v] of top) console.log(String(((v / total) * 100).toFixed(1)).padStart(5) + '%  ' + k);
} finally {
  await browser.close();
  server.kill();
}

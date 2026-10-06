#!/usr/bin/env node
// Ablations-Messung: Extremszene mit abgeschalteten Teilen (HUD, Effekte, Figuren …), um Kostenanteile zu finden.
import { execSync, spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildReplay } from './replay.mjs';
import { PROFILES } from './run.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const prof = PROFILES.find((p) => p.name === (args.profile || 'desktop-1440x900'));
const variants = String(args.variants || 'none,hud,fx,units,bars,all').split(',');
const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
const pw = await import(pathToFileURL(path.join(g, 'playwright', 'index.mjs')).href);
const port = await new Promise((res) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const server = spawn(process.execPath, ['server/index.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, stdio: 'ignore' });
const url = `http://127.0.0.1:${port}/`;
for (let i = 0; i < 100; i++) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--mute-audio'] });
const rep = buildReplay(Number(args.seconds || 10));
try {
  for (const v of variants) {
    const ctx = await browser.newContext({ viewport: { width: prof.width, height: prof.height }, deviceScaleFactor: prof.dpr, hasTouch: !!prof.touch, isMobile: !!prof.touch });
    const page = await ctx.newPage();
    await page.goto(url);
    await page.waitForFunction(() => window.turmtrubel?.db && document.querySelector('#s-name.active, #s-menu.active'));
    const cdp = await ctx.newCDPSession(page);
    if (prof.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: prof.cpu });
    const r = await page.evaluate(async ({ rep, v }) => {
      const { Game } = await import('/js/game/game.js');
      const { showScreen } = await import('/js/ui/dom.js');
      const app = window.turmtrubel;
      if (v.includes('low')) app.settings.quality = 'low';
      if (v.includes('noauto')) app.settings.autoQuality = false;
      const g = new Game(app, rep.init);
      app.game = g;
      g.prepare();
      const R = g.renderer;
      const off = new Set(v.split('+'));
      if (off.has('hud') || off.has('all')) g.hud.draw = () => {};
      if (off.has('fx') || off.has('all')) for (const k of ['drawParticles', 'drawRings', 'drawDecals', 'drawBolts', 'drawTexts']) g.fx[k] = () => {};
      if (off.has('units') || off.has('all')) R.drawEntities = () => {};
      if (off.has('bars') || off.has('all')) R.drawBars = () => {};
      if (off.has('towers')) { const o = R.drawOne.bind(R); R.drawOne = (c, e, t, q) => { if (e.kind !== 'tower') o(c, e, t, q); }; }
      if (off.has('troops')) { const o = R.drawOne.bind(R); R.drawOne = (c, e, t, q) => { if (e.kind === 'tower') o(c, e, t, q); }; }
      if (off.has('status')) R.drawStatus = () => {};
      if (off.has('proj') || off.has('all')) R.drawProjectiles = () => {};
      if (off.has('zones') || off.has('all')) { R.drawZonesGround = () => {}; R.drawZonesAir = () => {}; }
      if (off.has('river') || off.has('all')) R.drawRiverAnim = () => {};
      showScreen('s-game');
      g.start();
      const frames = [];
      let last = performance.now();
      let stop = false;
      const f = (t) => { frames.push(t - last); last = t; if (!stop) requestAnimationFrame(f); };
      requestAnimationFrame(f);
      await new Promise((done) => {
        let i = 0;
        const timer = setInterval(() => {
          if (i >= rep.snaps.length) { clearInterval(timer); done(); return; }
          g.onSnapshot(structuredClone(rep.snaps[i++]));
        }, 50);
      });
      stop = true;
      const fr = frames.slice(5);
      const avg = fr.reduce((a, b) => a + b, 0) / fr.length;
      return { fps: Math.round(1000 / avg), p95: Math.round(fr.sort((a, b) => a - b)[Math.floor(fr.length * 0.95)]), dpr: g.dpr };
    }, { rep, v });
    console.log(`${prof.name} aus: ${v.padEnd(14)} ${r.fps} fps · p95 ${r.p95} ms · DPR am Ende ${r.dpr}`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}

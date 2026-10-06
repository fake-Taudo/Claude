#!/usr/bin/env node
// VFX-Katalog: spielt jedes Preset aus client/js/vfx/presets.json einzeln im echten Client-Code ab und nimmt es zu
// festen Zeitpunkten auf (Vorlauf/Kern/Nachhall). Ergebnis: Kontaktbögen als JPEG – für Selbstprüfung und Doku.
//
//   node tools/vfx-gallery.mjs --out=docs/vfx-katalog            # alle Presets
//   node tools/vfx-gallery.mjs --out=… --only=spell.fire,spell.comet
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));
const OUT = path.resolve(ROOT, String(args.out || 'docs/vfx-katalog'));
const TIMES = (args.times ? String(args.times).split(',').map(Number) : [0.05, 0.14, 0.3, 0.6, 1.1]);
const PER_SHEET = Number(args.per || 8);

async function loadPlaywright() {
  for (const t of ['playwright', '@playwright/test']) { try { return await import(t); } catch {} }
  const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
  for (const t of ['playwright', '@playwright/test']) {
    const p = path.join(g, t, 'index.mjs');
    if (fs.existsSync(p)) return await import(pathToFileURL(p).href);
  }
  throw new Error('Playwright nicht gefunden');
}
function freePort() {
  return new Promise((res, rej) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); s.on('error', rej); });
}

const pw = await loadPlaywright();
const port = await freePort();
const server = spawn(process.execPath, ['server/index.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, stdio: 'ignore' });
const url = `http://127.0.0.1:${port}/`;
for (let i = 0; i < 100; i++) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }

const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
fs.mkdirSync(OUT, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.turmtrubel?.db, null, { timeout: 30000 });
  const names = await page.evaluate(async () => {
    const { loadPresets } = await import('/js/vfx/presets.js');
    window.__presets = await loadPresets();
    return Object.keys(window.__presets).filter((n) => !n.startsWith('proj.trail.'));
  });
  const only = args.only ? String(args.only).split(',') : null;
  const list = only ? names.filter((n) => only.includes(n)) : names;
  let sheet = 0;
  for (let i = 0; i < list.length; i += PER_SHEET) {
    const batch = list.slice(i, i + PER_SHEET);
    const dataUrl = await page.evaluate(
      async ({ batch, times }) => {
        const { Vfx } = await import('/js/vfx/engine.js');
        const { text } = await import('/js/game/canvastext.js');
        const CELL = 220;
        const S = 24; // Pixel pro Feld
        const LABEL = 22;
        const W = CELL * times.length;
        const H = (CELL + LABEL) * batch.length;
        const cv = document.createElement('canvas');
        cv.width = W;
        cv.height = H;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#1a1433';
        ctx.fillRect(0, 0, W, H);
        batch.forEach((name, row) => {
          const pr = window.__presets[name];
          const r = pr.baseRadius || 1.2;
          let tPrev = 0;
          const fx = new Vfx();
          fx.setPresets(window.__presets);
          fx.setQuality('high');
          const y0 = row * (CELL + LABEL);
          ctx.fillStyle = '#ffffff';
          ctx.font = '15px "Lilita One", sans-serif';
          ctx.fillText(name + (pr.scaleWith ? `  (r = ${r})` : ''), 8, y0 + 16);
          const wx = 9;
          const wy = 16;
          const isTower = name.startsWith('tower') || name.startsWith('king');
          fx.emit(name, { x: wx, y: wy, r, team: 'blue', from: [wx - 3, wy - 2, 1.2], to: [wx, wy, 0.4], dir: 0.4 });
          times.forEach((t, col) => {
            const steps = Math.round((t - tPrev) * 120);
            for (let k = 0; k < steps; k++) fx.update(1 / 120);
            tPrev = t;
            const ox = col * CELL;
            const oy = y0 + LABEL;
            const cx = ox + CELL / 2;
            const cy = oy + CELL * 0.62;
            ctx.save();
            ctx.beginPath();
            ctx.rect(ox, oy, CELL, CELL);
            ctx.clip();
            // Grasboden im Schachbrett
            for (let gy = 0; gy < CELL / S + 1; gy++)
              for (let gx = 0; gx < CELL / S + 1; gx++) {
                ctx.fillStyle = (gx + gy) % 2 ? '#8fc96a' : '#86c062';
                ctx.fillRect(ox + gx * S, oy + gy * S, S, S);
              }
            if (isTower) {
              ctx.fillStyle = '#b8b0a4';
              ctx.fillRect(cx - S * 1.5, cy - S * 3, S * 3, S * 3.4);
            }
            const view = { s: S, toScreen: (x, y) => [cx + (x - wx) * S, cy + (y - wy) * S] };
            fx.setView(view);
            const m = ctx.getTransform();
            const base = [1, m.e, m.f];
            fx.drawDecals(ctx);
            fx.drawRings(ctx, true);
            fx.drawParticles(ctx, 0, base);
            fx.drawParticles(ctx, 1, base);
            fx.drawParticles(ctx, 2, base);
            fx.drawRings(ctx, false);
            fx.drawBolts(ctx);
            fx.drawTexts(ctx, (c, str, x, y, size, color) => text(c, str, x, y, size, color, 'center', 3));
            fx.drawFlash(ctx, W, H);
            ctx.globalAlpha = 1;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(ox + 4, oy + CELL - 22, 120, 18);
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px sans-serif';
            const sh = fx.trauma > 0 ? ' · Wackeln ' + fx.trauma.toFixed(2) : '';
            ctx.fillText(`${Math.round(t * 1000)} ms · ${fx.count} P${sh}`, ox + 8, oy + CELL - 9);
            ctx.restore();
          });
        });
        return cv.toDataURL('image/jpeg', 0.85);
      },
      { batch, times: TIMES },
    );
    const file = path.join(OUT, `katalog-${String(++sheet).padStart(2, '0')}.jpg`);
    fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log(file, batch.join(', '));
  }
  if (errors.length) console.log('Fehler:', errors.slice(0, 5).join(' | '));
} finally {
  await browser.close();
  server.kill();
}

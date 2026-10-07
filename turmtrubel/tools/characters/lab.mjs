// Figuren-Labor: rendert Figuren über die echte Laufzeit (client/js/characters) in Chromium und speichert PNGs.
// Grundlage für Contact Sheet, Prüfskript und die Iteration am Design.
//
//   node tools/characters/lab.mjs knight archers --states idle,walk,attack --frames 4 --scale 110 --out /tmp/x.png
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildAll } from './build.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHROME = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function freePort() {
  return new Promise((res) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => res(p));
    });
  });
}

export async function startServer() {
  const port = await freePort();
  const proc = spawn(process.execPath, ['server/index.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, stdio: 'ignore' });
  const url = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(url + 'healthz');
      if (r.ok) return { url, proc };
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  proc.kill();
  throw new Error('Server startet nicht');
}

/** Öffnet eine leere Seite derselben Herkunft mit geladener Figuren-Laufzeit (window.CH). */
export async function openLab(opts = {}) {
  const { chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
  const server = opts.server || (await startServer());
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: opts.width || 1400, height: opts.height || 900 }, deviceScaleFactor: 1 });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') console.log('[browser]', m.text());
  });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(server.url + 'healthz');
  await page.setContent('<!doctype html><html><body style="margin:0;background:#2c3a2c"></body></html>');
  await page.addScriptTag({ type: 'module', content: `import * as CH from '${server.url}js/characters/index.js'; window.CH = CH; window.labReady = CH.initCharacters('${server.url}assets/characters/').then(() => true);` });
  await page.waitForFunction(() => window.labReady, null, { timeout: 10000 });
  await page.evaluate(() => window.labReady);
  return {
    page,
    server,
    async close() {
      await browser.close();
      if (!opts.server) server.proc.kill();
    },
  };
}

/**
 * Zeichnet ein Raster: Zeilen = Figuren × Zustände, Spalten = Bilder. Gibt PNG-Puffer zurück.
 * o: figures, states, frames, scale (px pro Feld), team, evo, view, bg, label
 */
export async function sheet(lab, o) {
  return lab.page.evaluate(async (o) => {
    const CH = window.CH;
    await CH.loadFigures(o.figures);
    const states = o.states;
    const cols = o.frames;
    const cellW = o.cellW;
    const cellH = o.cellH;
    const rows = [];
    for (const f of o.figures) for (const s of states) for (const v of o.views) for (const team of o.teams) for (const variant of o.variants) for (const evo of o.evos) rows.push({ f, s, v, team, variant, evo });
    const W = 150 + cols * cellW;
    const H = rows.length * cellH;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = o.bg;
    g.fillRect(0, 0, W, H);
    rows.forEach((r, i) => {
      const y0 = i * cellH;
      g.fillStyle = i % 2 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
      g.fillRect(0, y0, W, cellH);
      g.fillStyle = '#fff';
      g.font = 'bold 13px sans-serif';
      g.fillText(r.f, 8, y0 + 18);
      g.font = '12px sans-serif';
      g.fillText(`${r.s} · ${r.v} · ${r.team}`, 8, y0 + 34);
      if (r.variant || r.evo) g.fillText(`${r.variant ? 'Variante ' + r.variant : ''}${r.evo ? ' Evo' : ''}`, 8, y0 + 50);
      const dur = CH.stateDuration(r.f, r.s);
      for (let k = 0; k < cols; k++) {
        const t = CH.stateLoops(r.s) ? (k / cols) * dur : (k / Math.max(1, cols - 1)) * dur * 0.999;
        const x = 150 + k * cellW + cellW / 2;
        const y = y0 + cellH - o.foot;
        CH.characterShadow(g, { x, y, r: o.scale * 0.45, team: r.team, ring: true, dpr: 1 });
        CH.drawCharacter(g, { figure: r.f, state: r.s, time: t, x, y, scale: o.scale, dpr: 1, team: r.team, view: r.v, evo: r.evo, variant: r.variant, face: o.face || 1, big: o.big, lift: (CH.figureEntry(r.f)?.hover || 0) * o.scale });
        CH.bakeTick();
      }
    });
    return c.toDataURL('image/png');
  }, o);
}

export async function renderSheet(lab, o) {
  const opts = { states: ['idle'], frames: 4, scale: 110, views: ['front'], teams: ['blue'], bg: '#5f8f45', foot: 26, evo: false, big: true, variants: [0], ...o };
  opts.evos = opts.evos || [opts.evo];
  opts.cellW = opts.cellW || Math.round(opts.scale * 2.6);
  opts.cellH = opts.cellH || Math.round(opts.scale * 3.1);
  const url = await sheet(lab, opts);
  return Buffer.from(url.split(',')[1], 'base64');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const ids = args.filter((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));
  const opt = (k, d) => {
    const i = args.indexOf('--' + k);
    return i >= 0 ? args[i + 1] : d;
  };
  await buildAll(ids);
  const lab = await openLab();
  try {
    const png = await renderSheet(lab, {
      figures: ids,
      states: opt('states', 'idle,walk,attack').split(','),
      frames: +opt('frames', 4),
      scale: +opt('scale', 110),
      views: opt('views', 'front').split(','),
      teams: opt('teams', 'blue').split(','),
      evo: args.includes('--evo'),
      evos: args.includes('--evos') ? [false, true] : undefined,
      variants: opt('variants', '0').split(',').map(Number),
      big: !args.includes('--atlas'),
      cellW: +opt('cellw', 0) || undefined,
      cellH: +opt('cellh', 0) || undefined,
      foot: +opt('foot', 26),
    });
    const out = opt('out', '/tmp/lab.png');
    fs.writeFileSync(out, png);
    console.log('geschrieben', out);
    console.log(await lab.page.evaluate(() => JSON.stringify(window.CH.characterStats())));
  } finally {
    await lab.close();
  }
}

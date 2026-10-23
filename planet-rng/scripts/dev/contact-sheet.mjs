// Dev helper: renders every aura on a phone-portrait stage and composes a contact sheet.
// Usage: [HTML=path] node scripts/dev/contact-sheet.mjs <out.png> [tilesDir] [ids comma separated] [viewport WxH]
// HTML points to another build (e.g. the old renderer extracted from git) for before/after.
// Uses the aura lab API (window.__lab, deterministic clock) when the build has it,
// otherwise equips each aura through the debug hook and waits (old renderer).
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const out = process.argv[2] ?? 'aura-contact-sheet.png';
const tilesDir = process.argv[3] ?? null;
const only = process.argv[4] ? process.argv[4].split(',') : null;
const [vw, vh] = (process.argv[5] ?? '390x844').split('x').map(Number);
if (tilesDir) mkdirSync(tilesDir, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('file://' + resolve(process.env.HTML ?? 'dist/planet-rng.html') + '?debug&lab=1');
await page.waitForTimeout(600);
const hasLab = await page.evaluate(() => !!window.__lab);
await page.evaluate(() => {
  const p = window.__prng;
  p.game.setSettings({ vfxQuality: 'high', showReveal: false, feed: false });
  const style = document.createElement('style');
  style.textContent = '.hud,.sidebar,.roll-area,.feed,.toasts,.tutorial,.lab{visibility:hidden!important}';
  document.head.appendChild(style);
});
const ids = only ?? (await page.evaluate(() => window.__prngIds));
const meta = [];

const shots = [];
for (const id of ids) {
  if (hasLab) {
    await page.evaluate((id) => window.__lab.show(id, { settle: 6, idle: true }), id);
  } else {
    await page.evaluate((id) => {
      const p = window.__prng;
      p.game.state.auras[id] = 1;
      p.game.apply((s) => p.engine.equipAura(s, id));
    }, id);
    await page.waitForTimeout(1500);
  }
  // Let the nameplate fade-in (420 ms) finish.
  await page.waitForTimeout(900);
  const name = await page.evaluate(() => document.querySelector('[data-testid=nameplate] .nameplate__name')?.textContent ?? '');
  const tier = await page.evaluate(() => document.querySelector('[data-testid=nameplate] .nameplate__title')?.textContent ?? '');
  meta.push({ id, name: name || id, tier });
  const buf = await page.screenshot({ type: 'png' });
  if (tilesDir) writeFileSync(`${tilesDir}/${id}.png`, buf);
  shots.push(buf.toString('base64'));
}

// Compose: crop the stage around the planet into tiles of the sheet.
const cols = Math.min(9, ids.length);
const tileW = 195;
const tileH = Math.round((tileW * vh) / vw * 0.72);
const sheet = await browser.newPage({ viewport: { width: cols * tileW, height: 200 }, deviceScaleFactor: 1 });
const tiles = shots
  .map((b64, i) => {
    const m = meta[i];
    return `<figure><div class="img" style="background-image:url(data:image/png;base64,${b64})"></div><figcaption>${m.name}<small>${m.tier}</small></figcaption></figure>`;
  })
  .join('');
await sheet.setContent(`<!doctype html><style>
  body{margin:0;background:#05060d;font:12px/1.2 system-ui,sans-serif;color:#dfe6ff}
  .grid{display:grid;grid-template-columns:repeat(${cols},${tileW}px)}
  figure{margin:0;position:relative;width:${tileW}px;height:${tileH + 30}px;overflow:hidden;border:1px solid #1a1d2e;box-sizing:border-box}
  .img{width:${tileW}px;height:${tileH}px;background-size:${tileW}px auto;background-position:center ${Math.round(-vh * 0.06 * (tileW / vw))}px}
  figcaption{position:absolute;left:0;right:0;bottom:0;height:30px;padding:3px 6px;box-sizing:border-box;background:#0b0d18}
  small{display:block;opacity:.6;font-size:10px}
</style><div class="grid">${tiles}</div>`);
const h = await sheet.evaluate(() => document.querySelector('.grid').getBoundingClientRect().height);
await sheet.setViewportSize({ width: cols * tileW, height: Math.ceil(h) });
await sheet.screenshot({ path: out, fullPage: true });
console.log(`${ids.length} auras -> ${out}`, errors.length ? errors.slice(0, 10) : 'no errors');
await browser.close();

// Dev helper: renders every aura on the stage and saves cropped screenshots.
// Usage: node scripts/gallery.mjs <outDir> [ids comma separated] [quality]
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const out = process.argv[2] ?? 'gallery';
const only = process.argv[3] ? process.argv[3].split(',') : null;
const quality = process.argv[4] ?? 'high';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 520, height: 700 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.waitForTimeout(500);
await page.evaluate((q) => {
  const p = window.__prng;
  p.game.setSettings({ vfxQuality: q, showReveal: false });
  document.querySelectorAll('.hud,.sidebar,.roll-area,.nameplate').forEach((e) => (e.style.visibility = 'hidden'));
}, quality);
const all = only ?? (await page.evaluate(() => window.__prngIds));
for (const id of all) {
  await page.evaluate((id) => {
    const p = window.__prng;
    p.game.state.auras[id] = 1;
    p.game.apply((s) => p.engine.equipAura(s, id));
  }, id);
  await page.waitForTimeout(1300);
  const box = await page.evaluate(() => {
    const s = getComputedStyle(document.getElementById('app'));
    return { x: parseFloat(s.getPropertyValue('--px')), y: parseFloat(s.getPropertyValue('--py')) };
  });
  await page.screenshot({ path: `${out}/${id}.png`, clip: { x: Math.max(0, box.x - 250), y: Math.max(0, box.y - 250), width: 500, height: 500 } });
}
console.log(errors.length ? errors : 'no errors');
await browser.close();

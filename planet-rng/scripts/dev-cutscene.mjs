// Dev helper: screenshots of cutscene frames at given times.
// Usage: node scripts/dev-cutscene.mjs <outDir> <auraId> [times ms comma separated]
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const [out, aura, timesArg] = process.argv.slice(2);
const times = (timesArg ?? '1500,4000,8000,12500,13300').split(',').map(Number);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.waitForTimeout(300);
await page.evaluate((aura) => { window.__prngCutscene.play(aura); }, aura);
for (const t of times) {
  await page.evaluate((t) => { window.__prngCutscene.t = t; }, t);
  await page.waitForTimeout(120);
  await page.screenshot({ path: `${out}/cs-${aura}-${t}.png` });
}
console.log(errors.length ? errors : 'no errors');
await browser.close();

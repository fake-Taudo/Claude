// Dev helper: one frame (at a given time) of every cutscene.
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const [out, tArg] = process.argv.slice(2);
const t = Number(tArg ?? 11500);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 420 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.waitForTimeout(300);
const ids = await page.evaluate(() => window.__prngIds.filter((id) => window.__prng.game && true));
for (const id of ids) {
  const has = await page.evaluate((id) => {
    const c = window.__prngCutscene;
    const p = c.play(id);
    return !!(p && document.querySelector('.cutscene-layer'));
  }, id);
  if (!has) continue;
  await page.evaluate((t) => { window.__prngCutscene.t = t; }, t);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${out}/csall-${id}.png` });
}
console.log(errors.length ? errors : 'no errors');
await browser.close();

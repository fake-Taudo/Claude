// Dev helper: one frame (at a given time) of every cutscene.
// Usage: node scripts/dev/cutscene-all.mjs <outDir> [ms] [WxH] [ids comma separated]
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const [out, tArg, sizeArg, idsArg] = process.argv.slice(2);
const t = Number(tArg ?? 11500);
const [vw, vh] = (sizeArg ?? '420x420').split('x').map(Number);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.evaluate(() => {
  const p = window.__prng;
  p.game.state.tutorial = { done: true, step: 9 };
  p.game.touch();
});
await page.waitForTimeout(300);
const ids = idsArg ? idsArg.split(',') : await page.evaluate(() => window.__prngIds);
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

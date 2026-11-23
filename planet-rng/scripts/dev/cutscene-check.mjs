// Self-check of all cutscenes with the cutscene lab (dist build):
// 1. coverage: after the opening fade the overlay must cover the game completely (alpha 255)
//    until the reveal; reports every moment where the game would shine through;
// 2. render cost per frame at low / medium / high quality (phone viewport, DPR 2).
// Usage: node scripts/dev/cutscene-check.mjs [out.json] [ids]
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [out, idsArg] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug&paused&cutscene=');
await page.addStyleTag({ content: '.cutscene-lab__panel{display:none!important}' });
await page.waitForFunction(() => !!window.__cutsceneLab && !!window.__prng);
await page.evaluate(() => {
  window.__prng.game.state.tutorial = { done: true, step: 9 };
  window.__prng.game.touch();
});
const ids = idsArg ? idsArg.split(',') : await page.evaluate(() => window.__cutsceneLab.ids);
const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const report = {};
for (const id of ids) {
  await page.evaluate((id) => window.__cutsceneLab.select(id), id);
  await frame();
  const D = await page.evaluate(() => window.__cutsceneLab.def().duration);
  const holes = [];
  for (let t = 0.5; t < D; t += 0.25) {
    const a = await page.evaluate((t) => window.__cutsceneLab.minAlpha(t), t);
    if (a < 250) holes.push(`${t.toFixed(2)}s:${a}`);
  }
  const cost = {};
  for (const q of ['low', 'medium', 'high']) {
    await page.evaluate((q) => window.__cutsceneLab.setQuality(q), q);
    await frame();
    const samples = [];
    for (const f of [0.3, 0.5, 0.7, 0.8, 0.95]) samples.push(await page.evaluate(([t]) => window.__cutsceneLab.bench(t, 6), [f * D]));
    cost[q] = { avg: +(samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(1), max: +Math.max(...samples).toFixed(1) };
  }
  await page.evaluate(() => window.__cutsceneLab.setQuality('high'));
  report[id] = { duration: D, holes, cost };
  console.log(id.padEnd(18), `holes ${holes.length ? holes.slice(0, 6).join(' ') : '-'}`.padEnd(40), Object.entries(cost).map(([q, c]) => `${q} ${c.avg}/${c.max}ms`).join('  '));
}
if (out) writeFileSync(out, JSON.stringify(report, null, 1));
console.log(errors.length ? errors.slice(0, 5) : 'no errors');
await browser.close();

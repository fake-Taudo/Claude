// Dev helper: frame cost of each layer of an aura (disable one at a time, measure the drop).
// Usage: node scripts/dev/layer-cost.mjs <ids comma separated> [quality] [frames]
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const ids = (process.argv[2] ?? 'urlicht').split(',');
const quality = process.argv[3] ?? 'high';
const frames = Number(process.argv[4] ?? 60);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug&lab=1');
await page.waitForTimeout(400);
for (const id of ids) {
  await page.evaluate(([id, q]) => window.__lab.show(id, { quality: q, settle: 2 }), [id, quality]);
  const names = await page.evaluate(() => window.__lab.layers());
  const base = (await page.evaluate((n) => window.__lab.perf(n), frames)).avg;
  const rows = [];
  for (let i = 0; i < names.length; i++) {
    await page.evaluate((i) => window.__lab.setLayer(i, false), i);
    const without = (await page.evaluate((n) => window.__lab.perf(n), frames)).avg;
    await page.evaluate((i) => window.__lab.setLayer(i, true), i);
    rows.push([names[i], +(base - without).toFixed(1)]);
  }
  rows.sort((a, b) => b[1] - a[1]);
  console.log(`${id} ${quality}: ${base} ms/frame`);
  for (const [n, d] of rows) console.log(`  ${String(d).padStart(5)} ms  ${n}`);
}
await browser.close();

// Dev helper: VFX cost per aura and quality, and the equip hitch (texture baking).
// Usage: node scripts/dev/perf.mjs <out.json> [ids comma separated | all] [WxH] [dpr]
// Frame costs include rasterisation (1 px readback after each frame). Headless Chromium
// rasterises in software, so absolute numbers are pessimistic; compare them relatively.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const out = process.argv[2] ?? 'perf.json';
const idsArg = process.argv[3] ?? 'all';
const [vw, vh] = (process.argv[4] ?? '390x844').split('x').map(Number);
const dpr = Number(process.argv[5] ?? 2);
const url = 'file://' + resolve('dist/planet-rng.html') + '?debug&lab=1';
const browser = await chromium.launch();

async function open() {
  const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr });
  await page.goto(url);
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__prng.game.setSettings({ feed: false }));
  return page;
}

let page = await open();
const ids = idsArg === 'all' ? await page.evaluate(() => window.__prngIds) : idsArg.split(',');
const rows = [];
for (const id of ids) {
  // Equip cost with a cold texture cache: a fresh page per aura.
  await page.close();
  page = await open();
  const equipMs = await page.evaluate((id) => window.__lab.equipCost(id), id);
  const row = { id, tier: (await page.evaluate((id) => window.__lab.meta(id), id)).vtier, equipMs };
  for (const q of ['low', 'medium', 'high']) {
    await page.evaluate(([id, q]) => window.__lab.show(id, { quality: q, settle: 1 }), [id, q]);
    const r = await page.evaluate(() => window.__lab.perf(90));
    const s = await page.evaluate(() => window.__lab.stats());
    row[q] = { ...r, particles: s.particles };
  }
  rows.push(row);
  console.log(id, `V${row.tier}`, `equip ${equipMs} ms`, ['low', 'medium', 'high'].map((q) => `${q} ${row[q].avg}/${row[q].p95} ms (${row[q].particles} p, ${row[q].canvas})`).join(' | '));
}
writeFileSync(out, JSON.stringify(rows, null, 2));
await browser.close();

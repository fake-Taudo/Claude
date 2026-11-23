// Dev helper: one screenshot per disabled layer (find what causes what).
// Usage: node scripts/dev/lab-layers.mjs <outDir> <id> [WxH]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const out = process.argv[2] ?? 'layers';
const id = process.argv[3] ?? 'urlicht';
const [vw, vh] = (process.argv[4] ?? '390x844').split('x').map(Number);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug&lab=1');
await page.waitForTimeout(400);
await page.evaluate(() => {
  const s = document.createElement('style');
  s.textContent = '.lab,.hud,.sidebar,.roll-area,.feed,.toasts,.tutorial,.nameplate{visibility:hidden!important}';
  document.head.appendChild(s);
});
await page.evaluate((id) => window.__lab.show(id, { settle: 5 }), id);
const names = await page.evaluate(() => window.__lab.layers());
const clip = { x: 0, y: Math.round(vh * 0.43 - vw * 0.62), width: vw, height: Math.round(vw * 1.15) };
await page.screenshot({ path: `${out}/all.png`, clip });
for (let i = 0; i < names.length; i++) {
  await page.evaluate((i) => window.__lab.setLayer(i, false), i);
  await page.screenshot({ path: `${out}/without-${i}.png`, clip });
  await page.evaluate((i) => window.__lab.setLayer(i, true), i);
}
// Only one layer at a time.
for (let i = 0; i < names.length; i++) {
  for (let j = 0; j < names.length; j++) await page.evaluate(([j, on]) => window.__lab.setLayer(j, on), [j, j === i]);
  await page.screenshot({ path: `${out}/only-${i}.png`, clip });
}
console.log(names.map((n, i) => `${i}: ${n}`).join('\n'));
await browser.close();

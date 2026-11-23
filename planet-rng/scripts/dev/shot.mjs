// Dev helper: screenshots of the built game in several viewports + console errors.
// Usage: node scripts/shot.mjs <outDir> [action]
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const out = process.argv[2] ?? 'shots';
const action = process.argv[3] ?? 'basic';
const url = 'file://' + resolve('dist/planet-rng.html') + '?debug';
const views = [
  ['phone', 390, 844],
  ['landscape', 844, 390],
  ['desktop', 1440, 900],
];
const browser = await chromium.launch();
for (const [name, w, h] of views) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForTimeout(600);
  if (action !== 'basic') {
    const mod = await import(resolve(action));
    await mod.default(page, name);
  }
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(name, errors.length ? errors : 'no errors');
  await page.close();
}
await browser.close();

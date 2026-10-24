import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.waitForTimeout(500);
const rolls = () => page.evaluate(() => window.__prng.game.state.stats.rolls);
await page.keyboard.press('a');
await page.waitForTimeout(6000);
const r1 = await rolls();
await page.keyboard.press('q');
await page.waitForTimeout(6000);
const r2 = await rolls();
await page.keyboard.press('a');
await page.waitForTimeout(1500);
const r3 = await rolls();
await page.waitForTimeout(1500);
const r4 = await rolls();
// manual spam: space key repeat
for (let i = 0; i < 20; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(100); }
const r5 = await rolls();
await page.reload();
await page.waitForTimeout(500);
const r6 = await rolls();
console.log({ auto6s: r1, autoQuick6s: r2 - r1, stoppedDelta: r4 - r3, manualSpam2s: r5 - r4, afterReload: r6, errors });
await browser.close();

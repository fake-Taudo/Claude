// Dev helper: screenshots of the GlobalEcho after a skipped cutscene (T1, T2, T3) and of the settings.
// Usage: node scripts/dev/echo-shot.mjs <outDir>
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.evaluate(() => { const p = window.__prng; p.game.state.tutorial = { done: true, step: 9 }; p.game.setSettings({ cutsceneSkip: true, flashHintShown: true, showReveal: false }); p.game.touch(); });
for (const id of ['singularitaet', 'multiversum', 'omniversum']) {
  await page.evaluate((id) => { const p = window.__prng; p.game.state.pendingRoll = { aura: id, lucky: false, luck: 1, biome: null, startedAt: Date.now(), auto: false }; p.controller.playCutscene(id, false); }, id);
  await page.waitForTimeout(2300);
  await page.getByTestId('cutscene-skip').click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/echo-${id}.png` });
  await page.waitForTimeout(3500);
}
await page.evaluate(() => window.__prng.ui.open('settings'));
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/settings.png`, fullPage: false });
await page.locator('.panel__body, .panel').first().evaluate((el) => el.scrollBy(0, 300)).catch(() => {});
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/settings2.png` });
console.log(errors.length ? errors : 'no errors');
await browser.close();

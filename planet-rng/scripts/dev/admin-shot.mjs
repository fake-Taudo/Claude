// Dev helper: screenshots of the admin menu (all three tabs). Usage: node scripts/dev/admin-shot.mjs <outDir>
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.evaluate(() => { const p = window.__prng; p.game.state.tutorial = { done: true, step: 9 }; p.game.setSettings({ adminUnlocked: true }); p.game.touch(); p.ui.open('admin'); });
await page.waitForTimeout(400);
for (const tab of ['auras', 'resources', 'game']) {
  await page.getByTestId(`tab-${tab}`).click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/admin-${tab}.png` });
}
await browser.close();

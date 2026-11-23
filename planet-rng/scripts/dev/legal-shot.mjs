// Dev helper: screenshots of the Impressum and the privacy policy. Usage: node scripts/dev/legal-shot.mjs <outDir>
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const out = process.argv[2];
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const requests = [];
page.on('request', (r) => !r.url().startsWith('file:') && !r.url().startsWith('data:') && requests.push(r.url()));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.evaluate(() => { const p = window.__prng; p.game.state.tutorial = { done: true, step: 9 }; p.game.touch(); p.ui.open('settings'); });
await page.waitForTimeout(400);
for (const id of ['impressum', 'datenschutz']) {
  await page.getByTestId(`open-${id}`).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/legal-${id}.png` });
  await page.getByTestId('legal-modal').getByLabel('Schließen').click();
}
console.log('external requests:', requests.length ? requests : 'none');
await browser.close();

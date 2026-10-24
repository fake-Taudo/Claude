// Dev helper: render cost per track of one cutscene at given times (lab, dist build, DPR 2).
// Usage: node scripts/dev/cutscene-profile.mjs <id> <t1,t2,...> [quality]
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const [id, times, quality = 'high'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto('file://' + resolve('dist/planet-rng.html') + `?debug&paused&cutscene=${id}`);
await page.waitForFunction(() => !!window.__cutsceneLab);
await page.evaluate((q) => window.__cutsceneLab.setQuality(q), quality);
await page.waitForTimeout(300);
for (const t of times.split(',').map(Number)) {
  const rows = await page.evaluate((t) => window.__cutsceneLab.profile(t), t);
  console.log(`t=${t}s`, rows.slice(0, 6).map((r) => `${r.track}: ${r.ms}ms`).join(' | '));
}
await browser.close();

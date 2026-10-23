// Dev helper: deterministic lab screenshots of single auras.
// Usage: node scripts/dev/lab-shot.mjs <outDir> <ids comma separated> [WxH] [quality] [extra: accent|intro]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const out = process.argv[2] ?? 'shots';
const ids = (process.argv[3] ?? 'urlicht').split(',');
const [vw, vh] = (process.argv[4] ?? '390x844').split('x').map(Number);
const quality = process.argv[5] ?? 'high';
const extra = process.argv[6] ?? '';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: vw < 600 ? 2 : 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug&lab=1');
await page.waitForTimeout(500);
await page.evaluate(() => {
  const s = document.createElement('style');
  s.textContent = '.lab,.hud,.sidebar,.roll-area,.feed,.toasts,.tutorial{visibility:hidden!important}';
  document.head.appendChild(s);
  window.__prng.game.setSettings({ feed: false });
});
for (const id of ids) {
  const t0 = Date.now();
  await page.evaluate(([id, q]) => window.__lab.show(id, { quality: q, settle: 5 }), [id, quality]);
  const ms = Date.now() - t0;
  let suffix = '';
  if (extra.startsWith('accent')) {
    const after = Number(extra.split(':')[1] ?? 0.4);
    await page.evaluate((a) => window.__lab.accent(a), after);
    suffix = '-accent';
  } else if (extra.startsWith('intro')) {
    const after = Number(extra.split(':')[1] ?? 0.6);
    await page.evaluate((a) => window.__lab.intro(a), after);
    suffix = '-intro';
  }
  await page.waitForTimeout(450);
  const stats = await page.evaluate(() => window.__lab.stats());
  await page.screenshot({ path: `${out}/${id}${suffix}-${vw}x${vh}.png` });
  console.log(id, `${ms}ms`, JSON.stringify(stats));
}
console.log(errors.length ? errors.slice(0, 8) : 'no errors');
await browser.close();

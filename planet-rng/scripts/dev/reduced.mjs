// Dev helper: "Effekte reduzieren" check. Captures intro end and accent of the given auras
// with normal and reduced effects, and reports camera zoom and flash state.
// Usage: node scripts/dev/reduced.mjs <outDir> [ids comma separated]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const out = process.argv[2] ?? 'reduced';
const ids = (process.argv[3] ?? 'supernova,urknall,nullpunkt,weltenkern').split(',');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug&lab=1');
await page.waitForTimeout(400);
await page.evaluate(() => {
  const s = document.createElement('style');
  s.textContent = '.lab,.hud,.sidebar,.roll-area,.feed,.toasts,.tutorial{visibility:hidden!important}';
  document.head.appendChild(s);
  window.__prng.game.setSettings({ feed: false });
});
for (const reduced of [false, true]) {
  await page.evaluate((r) => window.__prng.game.setSettings({ reducedEffects: r }), reduced);
  for (const id of ids) {
    const tag = reduced ? 'reduced' : 'normal';
    await page.evaluate((id) => window.__lab.show(id, { quality: 'high', settle: 0 }), id);
    await page.evaluate(() => window.__lab.intro(0));
    // Last part of the intro (the V5+ flash sits there).
    const dur = await page.evaluate(() => window.__prngStage().vfx.current.introDur);
    await page.evaluate((t) => window.__lab.step(t), dur * 0.92);
    await page.screenshot({ path: `${out}/${id}-intro-${tag}.png` });
    await page.evaluate(() => window.__lab.step(3));
    const zoom = await page.evaluate(() => window.__prngStage().vfx.cameraZoom());
    await page.evaluate(() => window.__lab.accent(0.5, 0));
    await page.screenshot({ path: `${out}/${id}-accent-${tag}.png` });
    const motion = await page.evaluate(() => window.__prngStage().vfx.current.motion);
    console.log(id, tag, `camera ${zoom.toFixed(3)}`, `motion x${motion}`);
  }
}
await browser.close();

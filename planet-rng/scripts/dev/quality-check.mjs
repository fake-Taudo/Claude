// Dev helper: does the VFX quality setting reach the canvas? Emulates a phone (DPR 3, touch)
// and samples canvas resolution, effective quality and frame times after each choice.
// Usage: node scripts/dev/quality-check.mjs [aura id] [outDir]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const aura = process.argv[2] ?? 'prisma';
const out = process.argv[3] ?? null;
if (out) mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(400);
console.log('first-run default quality:', await page.evaluate(() => window.__prng.game.settings.vfxQuality));
await page.evaluate((id) => {
  const p = window.__prng;
  p.game.state.tutorial = { done: true, step: 9 };
  p.game.state.auras[id] = 1;
  p.game.apply((s) => p.engine.equipAura(s, id));
  p.game.setSettings({ feed: false });
  const s = document.createElement('style');
  s.textContent = '.hud,.sidebar,.roll-area,.feed,.toasts,.tutorial{visibility:hidden!important}';
  document.head.appendChild(s);
}, aura);
const probe = () =>
  page.evaluate(() => {
    const st = window.__prngStage();
    return { canvas: `${st.canvas.width}x${st.canvas.height}`, dpr: st.dpr, setting: window.__prng.game.settings.vfxQuality, effective: st.effectiveQuality(), particles: st.vfx.stats().particles, frameMs: +st.frameTime.toFixed(1), workMs: +st.workTime.toFixed(1) };
  });
for (const q of ['low', 'medium', 'high']) {
  await page.evaluate((q) => window.__prng.game.setSettings({ vfxQuality: q }), q);
  for (const t of [500, 4000, 8000]) {
    await page.waitForTimeout(t === 500 ? 500 : t - (t === 4000 ? 500 : 4000));
    console.log(q, `t=${t / 1000}s`, JSON.stringify(await probe()));
  }
  if (out) await page.screenshot({ path: `${out}/${aura}-${q}.png`, clip: { x: 95, y: 220, width: 200, height: 260 } });
}
await browser.close();

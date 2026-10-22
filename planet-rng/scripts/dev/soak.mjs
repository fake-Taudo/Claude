// Dev helper: long auto-roll run, samples heap size, frame time, particle and DOM counts.
// Usage: node scripts/dev-soak.mjs [minutes]
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const minutes = Number(process.argv[2] ?? 3);
const browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(300);
await page.evaluate(() => {
  const p = window.__prng;
  p.game.state.tutorial = { done: true, step: 9 };
  p.game.state.auras.weltenkern = 1;
  p.game.apply((s) => p.engine.equipAura(s, 'weltenkern'));
  p.game.setSettings({ cutscenes: false });
  p.controller.setAuto(true);
});
const sample = () => page.evaluate(() => {
  if (window.gc) window.gc();
  const st = window.__prngStage();
  return {
    heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
    frameMs: +st.frameTime.toFixed(1),
    rolls: window.__prng.game.state.stats.rolls,
    dom: document.getElementsByTagName('*').length,
    layers: st.aura.layers.length,
  };
});
const samples = [];
for (let i = 0; i <= minutes * 2; i++) {
  samples.push(await sample());
  if (i % 2 === 1) await page.evaluate(() => window.__prng.controller.toggleQuick());
  await page.waitForTimeout(30_000);
}
console.table(samples);
console.log(errors.length ? errors.slice(0, 5) : 'no errors');
await browser.close();

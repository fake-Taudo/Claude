// Soak test: many cutscenes in a row (skipped after a few seconds, every third one played to the
// end), then JS heap, canvases in the DOM and baked textures. Usage: node scripts/dev/cutscene-soak.mjs [count]
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const count = Number(process.argv[2] ?? 18);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const cdp = await page.context().newCDPSession(page);
await cdp.send('Performance.enable');
const heap = async () => {
  await cdp.send('HeapProfiler.collectGarbage');
  const m = await cdp.send('Performance.getMetrics');
  return Math.round(m.metrics.find((x) => x.name === 'JSHeapUsedSize').value / 1e5) / 10;
};
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.evaluate(() => {
  const p = window.__prng;
  p.game.state.tutorial = { done: true, step: 9 };
  p.game.setSettings({ cutsceneSkip: true, flashHintShown: true });
  p.game.touch();
});
await page.waitForTimeout(1000);
const start = await heap();
const pick = ['singularitaet', 'paradoxon', 'urknall', 'omniversum', 'zeitriss', 'weltenkern', 'entropie', 'quasar', 'multiversum'];
for (let i = 0; i < count; i++) {
  const id = pick[i % pick.length];
  await page.evaluate((id) => {
    const p = window.__prng;
    p.game.state.pendingRoll = { aura: id, lucky: false, luck: 1, biome: null, startedAt: Date.now(), auto: false };
    p.controller.playCutscene(id, false);
  }, id);
  if (i % 3 === 2 && id !== 'omniversum' && id !== 'weltenkern') {
    await page.waitForFunction(() => window.__prng.controller.phase === 'idle', null, { timeout: 40000 });
  } else {
    await page.waitForTimeout(2300);
    await page.getByTestId('cutscene-skip').click();
    await page.waitForFunction(() => window.__prng.controller.phase === 'idle', null, { timeout: 10000 });
  }
  await page.waitForTimeout(600);
}
await page.waitForTimeout(4000);
const end = await heap();
const canvases = await page.evaluate(() => document.querySelectorAll('canvas').length);
const tex = await page.evaluate(() => window.__prngTextures());
console.log(JSON.stringify({ cutscenes: count, heapMbStart: start, heapMbEnd: end, canvasesInDom: canvases, textures: tex.count, textureMp: tex.megapixels }));
console.log(errors.length ? errors.slice(0, 5) : 'no errors');
await browser.close();

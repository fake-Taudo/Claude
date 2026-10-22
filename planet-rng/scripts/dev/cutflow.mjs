// Dev helper: runs a full cutscene roll flow (with skip) and checks the result.
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.waitForTimeout(300);
await page.evaluate(() => {
  const p = window.__prng;
  p.game.setSettings({ cutsceneSkip: true });
  p.game.state.pendingRoll = { aura: 'urknall', lucky: false, luck: 1, biome: null, startedAt: Date.now(), auto: false };
  p.controller.playCutscene('urknall', false);
});
await page.waitForTimeout(4500);
const phaseDuring = await page.evaluate(() => window.__prng.controller.phase);
const rollBlocked = await page.evaluate(() => window.__prng.controller.roll(false));
await page.mouse.click(195, 400);
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/cutflow-reveal.png` });
await page.waitForTimeout(1500);
const result = await page.evaluate(() => ({ auras: window.__prng.game.state.auras, phase: window.__prng.controller.phase, cutscenes: window.__prng.game.state.stats.cutscenes, layer: !!document.querySelector('.cutscene-layer') }));
console.log({ phaseDuring, rollBlocked, result, errors });
await browser.close();

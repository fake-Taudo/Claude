// Dev helper: screenshots of roll charge / reveal / cutscene moments and frame timings.
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.waitForTimeout(400);
const fx = async (aura, ms, name) => {
  await page.evaluate(({ aura }) => window.__prng.game.bus.emit('rollAnim', { duration: 2000, aura, lucky: false }), { aura });
  await page.waitForTimeout(ms);
  await page.screenshot({ path: `${out}/${name}-charge.png` });
  await page.waitForTimeout(2000 - ms);
  await page.evaluate(({ aura }) => window.__prng.game.bus.emit('reveal', { aura, isNew: true, lucky: true, luck: 3.2, quick: false, afterCutscene: false }), { aura });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/${name}-reveal.png` });
  await page.waitForTimeout(3000);
};
await fx('eklipse', 1600, 'legendary');
await fx('urlicht', 1700, 'mythic');
// frame time with a heavy aura equipped
for (const id of ['weltenkern', 'andromeda', 'akkretion']) {
  await page.evaluate((id) => { const p = window.__prng; p.game.state.auras[id] = 1; p.game.apply((s) => p.engine.equipAura(s, id)); }, id);
  await page.waitForTimeout(2500);
  const ft = await page.evaluate(() => window.__prngStage().frameTime);
  console.log(id, 'frame ms', ft.toFixed(1));
}
console.log(errors.length ? errors : 'no errors');
await browser.close();

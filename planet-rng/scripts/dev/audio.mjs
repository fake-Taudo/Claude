// Dev helper: verifies that audio unlocks, samples decode and sounds play without errors.
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.waitForTimeout(300);
await page.mouse.click(200, 300);
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const a = window.__prngAudio;
  a.roll();
  a.stinger(4, false);
  a.stinger(8, true);
  a.riser(1, 5);
  ['click', 'buy', 'brew', 'craft', 'drink', 'rebirth', 'achievement'].forEach((n) => a.ui(n));
  return { state: a.ctx && a.ctx.state, boom: a.boom && a.boom.duration, plop: a.plop && a.plop.duration };
});
await page.waitForTimeout(500);
console.log(info);

// Cutscene sound: every cutscene in the lab, from shortly before its break (jingle, beds,
// silence, impact, music), at normal speed so the audio clock drives it.
const lab = await browser.newPage({ viewport: { width: 390, height: 844 } });
lab.on('pageerror', (e) => errors.push(String(e)));
lab.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await lab.goto('file://' + resolve('dist/planet-rng.html') + '?debug&paused&cutscene=');
await lab.mouse.click(200, 300);
await lab.waitForFunction(() => !!window.__cutsceneLab);
const ids = await lab.evaluate(() => window.__cutsceneLab.ids);
for (const id of ids) {
  await lab.evaluate((id) => window.__cutsceneLab.select(id), id);
  await lab.waitForTimeout(100);
  const at = await lab.evaluate(() => Math.max(0, window.__cutsceneLab.def().signature.at - 1));
  await lab.evaluate((at) => {
    window.__cutsceneLab.seek(at);
    window.__cutsceneLab.play();
  }, at);
  await lab.waitForTimeout(1600);
}
const state = await lab.evaluate(() => window.__prngAudio.ctx && window.__prngAudio.ctx.state);
console.log({ cutscenes: ids.length, audio: state }, errors.length ? errors : 'no errors');
await browser.close();

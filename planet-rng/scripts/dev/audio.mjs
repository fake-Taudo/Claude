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
  a.cutsceneStart(16, 10);
  ['click', 'buy', 'brew', 'craft', 'drink', 'rebirth', 'achievement'].forEach((n) => a.ui(n));
  return { state: a.ctx && a.ctx.state, boom: a.boom && a.boom.duration, plop: a.plop && a.plop.duration };
});
await page.waitForTimeout(500);
console.log(info, errors);
await browser.close();

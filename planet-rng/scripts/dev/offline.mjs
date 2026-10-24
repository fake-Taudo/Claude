// Dev helper: checks offline catch-up on load and hidden-tab catch-up.
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(300);
// 1) Closed for two hours with auto roll on.
await page.evaluate(() => {
  const p = window.__prng;
  p.game.state.tutorial = { done: true, step: 9 };
  p.game.state.auto = true;
  p.game.state.lastActiveAt = Date.now() - 2 * 3600_000;
  p.game.saveNow();
  window.onbeforeunload = null;
});
// Prevent the unload handler from refreshing lastActiveAt by writing the save directly.
const save = await page.evaluate(() => localStorage.getItem('planet-rng.save'));
await page.goto('about:blank');
const page2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
page2.on('pageerror', (e) => errors.push(String(e)));
await page2.addInitScript((s) => {
  if (sessionStorage.getItem('injected')) return;
  sessionStorage.setItem('injected', '1');
  const o = JSON.parse(s);
  o.lastActiveAt = Date.now() - 2 * 3600_000;
  o.auto = true;
  localStorage.setItem('planet-rng.save', JSON.stringify(o));
}, save);
await page2.goto('file://' + resolve('dist/planet-rng.html') + '?debug');
await page2.waitForTimeout(800);
const offline = await page2.evaluate(() => ({ modal: !!document.querySelector('[data-testid=offline-modal]'), rolls: window.__prng.game.state.stats.offlineRolls }));
await page2.screenshot({ path: `${out}/offline.png` });
await page2.click('[data-testid=offline-ok]');
// 2) Hidden tab for 10 minutes (emulated).
const before = await page2.evaluate(() => window.__prng.game.state.stats.rolls);
await page2.evaluate(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  document.dispatchEvent(new Event('visibilitychange'));
  const lc = window.__prng.lifecycle;
  lc.hiddenAt = Date.now() - 10 * 60_000;
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  document.dispatchEvent(new Event('visibilitychange'));
});
await page2.waitForTimeout(500);
const after = await page2.evaluate(() => ({ rolls: window.__prng.game.state.stats.rolls, modal: !!document.querySelector('[data-testid=offline-modal]') }));
console.log({ offline, hiddenCatchUp: after.rolls - before, hiddenModal: after.modal, errors });
await browser.close();

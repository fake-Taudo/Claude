// Dev helper: screenshots of every panel in a given viewport with a populated save.
// Usage: node scripts/dev-panels.mjs <outDir> <width> <height> <prefix>
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const [out, w, h, prefix] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
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
  for (let i = 0; i < 3000; i++) { p.game.apply((s, c) => p.engine.beginRoll(s, c, false), 'none', true); p.game.apply((s, c) => p.engine.completeRoll(s, c), 'none', true); }
  p.game.state.gold = 523000;
  p.game.state.items = { luck_amulet: 2, quantum_gauntlet: 1 };
  p.game.state.potions = { sun: 2, luck: 4 };
  p.game.apply((s) => p.engine.equipItem(s, 'quantum_gauntlet'));
  p.game.apply((s, c) => p.engine.drinkPotion(s, 'luck', 1, c.now));
  p.game.touch();
});
await page.waitForTimeout(3000);
await page.screenshot({ path: `${out}/${prefix}-main.png` });
for (const [panel, tab] of [['inventory', 'auras'], ['inventory', 'index'], ['inventory', 'items'], ['shop'], ['forge'], ['potions'], ['effects'], ['rebirth'], ['quests', 'quests'], ['quests', 'stats'], ['settings']]) {
  await page.evaluate(([panel, tab]) => window.__prng.ui.open(panel, tab), [panel, tab]);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${out}/${prefix}-${panel}${tab ? '-' + tab : ''}.png` });
}
console.log(errors.length ? errors : 'no errors');
await browser.close();

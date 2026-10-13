// Oberflächen-Prüfung: durchläuft die DOM-Bildschirme (Name, Menü, Neuigkeiten, Einstellungen mit allen Reitern,
// Umbenennen, Regeln aller Modi, Deck-Bauer mit allen Decks/Filter/Leerzustand, Lobby, Beitreten, Training, Pause,
// Ergebnis) und prüft sichtbare Texte auf undefined/NaN/null/[object/Infinity, abgeschnittene Knöpfe und Chips,
// waagerechtes Scrollen und Konsolenfehler – in 390×844, 844×390, 1440×900 und 320×568.
//
//   node tools/audit/ui-text.mjs
import path from 'node:path';
import net from 'node:net';
import { spawn, execSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
const pw = await import(pathToFileURL(path.join(g, 'playwright', 'index.mjs')).href);
const port = await new Promise((res) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const server = spawn(process.execPath, ['server/index.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, stdio: 'ignore' });
const url = `http://127.0.0.1:${port}/`;
for (let i = 0; i < 100; i++) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
const browser = await pw.chromium.launch();
const issues = [];
const scan = () => {
  const out = [];
  const root = document.querySelector('.modal-back:last-of-type') || document.querySelector('.screen.active') || document.body;
  const txt = root.innerText || '';
  for (const bad of ['undefined', 'NaN', 'null', '[object', 'Infinity']) {
    const re = new RegExp('\\b' + bad.replace('[', '\\[') + '\\b');
    const m = txt.match(re);
    if (m) out.push(`Text „${bad}“: …${txt.slice(Math.max(0, m.index - 40), m.index + 20).replace(/\n/g, ' ')}…`);
  }
  // abgeschnittene einzeilige Texte in Knöpfen/Chips
  for (const el of root.querySelectorAll('button, .btn, .fchip, .tag, .chip')) {
    const r = el.getBoundingClientRect();
    if (!r.width || el.closest('[hidden]')) continue;
    if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible') out.push('abgeschnitten: ' + (el.id || el.className) + ' „' + el.textContent.trim().slice(0, 30) + '“');
  }
  const doc = document.scrollingElement;
  if (doc.scrollWidth > innerWidth + 1) out.push('waagerechtes Scrollen ' + (doc.scrollWidth - innerWidth) + ' px');
  return out;
};
for (const [w, h, mobile] of [[390, 844, true], [844, 390, true], [1440, 900, false], [320, 568, true]]) {
  const ctx = await browser.newContext(mobile ? { viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const vp = `${w}x${h}`;
  page.on('pageerror', (e) => issues.push(`${vp} pageerror ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && issues.push(`${vp} console ${m.text()}`));
  const check = async (state) => { await page.waitForTimeout(350); for (const o of await page.evaluate(scan)) issues.push(`${vp} [${state}] ${o}`); };
  const step = async (state, fn) => { try { await fn(); await check(state); } catch (e) { issues.push(`${vp} [${state}] Ablauf: ${e.message.split('\n')[0]}`); } };
  await page.goto(url);
  await step('name', async () => page.waitForSelector('#s-name.active'));
  await page.fill('#name-input', 'Wilhelmina Sturmfels');
  await page.click('#name-form button[type=submit]');
  await page.waitForFunction(() => window.turmtrubel?.net?.welcomed);
  await step('menü', async () => { await page.waitForSelector('#s-menu.active'); await page.evaluate(() => document.querySelectorAll('.modal-back').forEach((m) => m.querySelector('.btn')?.click())); });
  await step('neuigkeiten', async () => { await page.click('#menu-news'); await page.waitForSelector('.modal'); });
  await page.keyboard.press('Escape');
  await step('einstellungen', async () => { await page.click('#menu-settings'); await page.waitForSelector('.modal'); });
  // alle Reiter der Einstellungen
  const tabs = await page.$$('.modal [role=tab]');
  for (let i = 0; i < tabs.length; i++) await step('einstellungen-reiter' + i, async () => { await (await page.$$('.modal [role=tab]'))[i].click(); });
  await page.keyboard.press('Escape');
  await step('umbenennen', async () => { await page.click('#menu-rename'); await page.waitForSelector('.modal'); });
  await page.keyboard.press('Escape');
  for (const mode of ['2v2', 'triple-draft', 'mega-draft', 'infinite-elixir']) {
    await step('regeln-' + mode, async () => { await page.locator(`.mode-tile[data-mode="${mode}"] .mode-info`).click(); await page.waitForSelector('.mode-rules-modal'); });
    await page.keyboard.press('Escape');
  }
  await step('deckbauer', async () => { await page.click('#btn-deckbuilder'); await page.waitForSelector('#s-deck.active'); });
  const deckTabs = await page.$$('#deck-tabs [role=tab], #deck-tabs button');
  for (let i = 0; i < deckTabs.length; i++) await step('deck-' + i, async () => { await (await page.$$('#deck-tabs [role=tab], #deck-tabs button'))[i].click(); });
  await step('filter', async () => { await page.click('#flt-toggle'); });
  await step('suche-leer', async () => { await page.fill('#flt-search', 'zzzzqq'); });
  await page.fill('#flt-search', '');
  await step('zufall', async () => { await page.click('#deck-random'); });
  await step('leeren', async () => { await page.click('#deck-clear'); await page.locator('.modal .btn-danger, .modal .btn-primary').first().click({ timeout: 1500 }).catch(() => {}); });
  await page.click('#deck-back').catch(() => {});
  await page.waitForTimeout(400);
  // Deck wieder gültig machen (Startdeck)
  await page.evaluate(() => { const a = window.turmtrubel; a.store.decks[a.store.active].slots = ['skeletons', 'ice-spirit', 'musketeer-hero', 'hog-rider', 'cannon', 'ice-golem', 'fireball', 'the-log']; a.store.save(); });
  await step('lobby', async () => { await page.click('#btn-create'); await page.waitForSelector('#s-lobby.active', { timeout: 10000 }); });
  await page.click('#lobby-leave').catch(() => {});
  await page.waitForTimeout(500);
  await step('beitreten', async () => { await page.click('#btn-join'); await page.waitForSelector('.modal'); });
  await page.keyboard.press('Escape');
  await step('training', async () => { await page.evaluate(() => window.turmtrubel.startTraining()); await page.waitForSelector('#s-game.active', { timeout: 20000 }); });
  await step('pause', async () => { await page.click('#game-menu-btn'); await page.waitForSelector('.modal'); });
  await page.keyboard.press('Escape');
  await step('ergebnis', async () => { await page.evaluate(() => window.turmtrubel.net.send('surrender', {})); await page.waitForSelector('#s-result.active', { timeout: 15000 }); await page.waitForTimeout(3000); });
  await ctx.close();
}
console.log(issues.length ? [...new Set(issues)].join('\n') : 'keine Befunde');
await browser.close();
server.kill();

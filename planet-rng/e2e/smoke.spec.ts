import { expect, test, type Page } from '@playwright/test';
import { resolve } from 'node:path';

const URL = 'file://' + resolve('dist/planet-rng.html') + '?debug';

/** Read from the debug hook exposed with ?debug. */
async function game<T>(page: Page, fn: string): Promise<T> {
  return page.evaluate(`(() => { const p = window.__prng; return ${fn}; })()`) as Promise<T>;
}

async function setup(page: Page, js: string): Promise<void> {
  await page.evaluate(`(() => { const p = window.__prng; ${js}; p.game.touch(); })()`);
}

test('full loop: roll, equip, sell, shop, brew, drink, craft, rebirth, reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId('btn-roll')).toBeVisible();

  // Tutorial is shown on first start and can be skipped.
  await expect(page.getByTestId('tutorial')).toBeVisible();
  await page.getByTestId('tutorial-skip').click();
  await expect(page.getByTestId('tutorial')).toBeHidden();

  // Roll: the first aura is equipped automatically.
  await page.getByTestId('btn-roll').click();
  await expect.poll(() => game<number>(page, 'p.game.state.stats.rolls')).toBe(1);
  await expect(page.getByTestId('nameplate')).toBeVisible();
  const first = await game<string>(page, 'p.game.state.equippedAura');
  expect(first).toBeTruthy();

  // Auto roll keeps rolling; rolling never restarts the equipped aura's animation.
  type Inst = { age: number; marker?: number; dying: boolean };
  const layerBefore = await page.evaluate(() => {
    const st = (window as never as { __prngStage: () => { vfx: { instances: Inst[] } } }).__prngStage();
    const inst = st.vfx.instances.filter((i) => !i.dying)[0];
    inst.marker = 42;
    return inst.age;
  });
  await page.getByTestId('btn-auto').click();
  await expect.poll(() => game<number>(page, 'p.game.state.stats.rolls'), { timeout: 15_000 }).toBeGreaterThanOrEqual(5);
  await page.getByTestId('btn-auto').click();
  const layerAfter = await page.evaluate(() => {
    const st = (window as never as { __prngStage: () => { vfx: { instances: Inst[] } } }).__prngStage();
    const live = st.vfx.instances.filter((i) => !i.dying);
    return { n: live.length, marker: live[0]?.marker, time: live[0]?.age };
  });
  if ((await game<string>(page, 'p.game.state.equippedAura')) === first) {
    expect(layerAfter.n).toBe(1);
    expect(layerAfter.marker).toBe(42);
    expect(layerAfter.time).toBeGreaterThan(layerBefore);
  }
  await expect.poll(() => game<string | null>(page, 'p.game.state.pendingRoll && p.game.state.pendingRoll.aura'), { timeout: 10_000 }).toBeNull();

  // Equip another aura from the inventory.
  // (Flut must not already be equipped, otherwise the tap would unequip it.)
  await setup(page, "p.game.state.auras.flut = 3; p.game.state.discovered.flut = { first: 0, total: 3, seen: true }; if (p.game.state.equippedAura === 'flut') p.game.state.equippedAura = null");
  await page.getByTestId('menu-inventory').click();
  await page.getByTestId('aura-card-flut').click();
  await expect.poll(() => game<string>(page, 'p.game.state.equippedAura')).toBe('flut');
  await expect(page.getByTestId('nameplate')).toContainText('Flut');

  // Sell with quantity and confirmation.
  const goldBefore = await game<number>(page, 'p.game.state.gold');
  await page.getByTestId('sell-flut').click();
  await expect(page.getByTestId('sell-modal')).toBeVisible();
  await page.getByTestId('sell-confirm').click();
  await expect.poll(() => game<number>(page, 'p.game.state.gold')).toBeGreaterThan(goldBefore);
  expect(await game<number>(page, 'p.game.state.auras.flut')).toBe(2);
  await page.getByTestId('panel-close').click();

  // Shop purchase.
  await setup(page, 'p.game.state.gold = 2000000');
  await page.getByTestId('menu-shop').click();
  await expect(page.getByTestId('shop-countdown')).toBeVisible();
  const buy = page.locator('[data-testid^=buy-]:not([disabled])').first();
  await expect(buy).toBeVisible();
  const goldBeforeBuy = await game<number>(page, 'p.game.state.gold');
  await buy.click();
  await expect.poll(() => game<number>(page, 'p.game.state.stats.purchases')).toBe(1);
  expect(await game<number>(page, 'p.game.state.gold')).toBeLessThan(goldBeforeBuy);
  await page.keyboard.press('Escape');

  // Brew a luck potion, then drink it from the stash.
  await setup(page, "Object.assign(p.game.state.auras, { flut: 5, frost: 1 }); delete p.game.state.locked.flut");
  await page.getByTestId('menu-potions').click();
  await page.getByTestId('brew-luck').click();
  await expect.poll(() => game<number>(page, 'p.game.state.potions.luck ?? 0')).toBeGreaterThanOrEqual(1);
  await page.keyboard.press('Escape');
  await page.getByTestId('menu-inventory').click();
  await page.getByTestId('tab-potions').click();
  await page.getByTestId('drink-luck').click();
  await expect.poll(() => game<boolean>(page, "p.game.state.buffs.some((b) => b.id === 'potion:luck')")).toBe(true);
  await page.keyboard.press('Escape');
  await page.getByTestId('menu-effects').click();
  await expect(page.getByTestId('effect-potion:luck')).toBeVisible();
  await page.keyboard.press('Escape');

  // Craft Sturm in the forge.
  await setup(page, 'Object.assign(p.game.state.auras, { flut: 1, moos: 4, staub: 12, sturm: 0 })');
  await page.getByTestId('menu-forge').click();
  await page.getByTestId('craft-craft_sturm').click();
  await expect.poll(() => game<number>(page, 'p.game.state.auras.sturm ?? 0')).toBe(1);
  await page.keyboard.press('Escape');

  // Rebirth: requirements met -> confirm -> auras and gold reset, potions kept.
  await setup(page, "p.game.state.gold = 400000; Object.assign(p.game.state.auras, { eklipse: 5, urlicht: 2 }); p.game.state.potions.sun = 2");
  await page.getByTestId('menu-rebirth').click();
  await page.getByTestId('rebirth-go').click();
  await page.getByTestId('confirm-ok').click();
  await expect.poll(() => game<number>(page, 'p.game.state.rebirth')).toBe(1);
  expect(await game<number>(page, 'p.game.state.gold')).toBe(0);
  expect(await game<number>(page, 'Object.keys(p.game.state.auras).length')).toBe(0);
  // Potions are kept (the first rebirth achievement adds two more).
  const sun = await game<number>(page, 'p.game.state.potions.sun');
  expect(sun).toBeGreaterThanOrEqual(2);

  // Reload: everything is still there.
  const rolls = await game<number>(page, 'p.game.state.stats.rolls');
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByTestId('btn-roll')).toBeVisible();
  expect(await game<number>(page, 'p.game.state.rebirth')).toBe(1);
  expect(await game<number>(page, 'p.game.state.stats.rolls')).toBe(rolls);
  expect(await game<number>(page, 'p.game.state.potions.sun')).toBe(sun);
  expect(await game<boolean>(page, 'p.game.state.tutorial.done')).toBe(true);

  expect(errors).toEqual([]);
});

test('settings, export and import round trip', async ({ page }) => {
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await setup(page, 'p.game.state.tutorial = { done: true, step: 9 }; p.game.state.gold = 123456');
  await page.getByTestId('open-settings').click();
  await page.getByTestId('quality-low').click();
  expect(await game<string>(page, 'p.game.settings.vfxQuality')).toBe('low');
  await page.getByTestId('export').click();
  const code = await page.getByTestId('export-code').inputValue();
  expect(code.startsWith('PRNG1.')).toBe(true);
  await page.keyboard.press('Escape');
  await setup(page, 'p.game.state.gold = 1');
  await page.getByTestId('import').click();
  await page.getByTestId('import-code').fill(code);
  await page.getByTestId('import-confirm').click();
  await page.getByTestId('confirm-ok').click();
  await expect.poll(() => game<number>(page, 'p.game.state.gold')).toBe(123456);
});

test('a corrupt save falls back to the backup with a warning', async ({ page }) => {
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await setup(page, 'p.game.state.tutorial = { done: true, step: 9 }; p.game.state.gold = 77000');
  const good = await page.evaluate(() => {
    const p = (window as never as { __prng: { game: { saveNow(): void } } }).__prng;
    p.game.saveNow();
    return localStorage.getItem('planet-rng.save');
  });
  await page.addInitScript((backup) => {
    if (sessionStorage.getItem('corrupted')) return;
    sessionStorage.setItem('corrupted', '1');
    localStorage.setItem('planet-rng.save.backup', backup as string);
    localStorage.setItem('planet-rng.save', '{"kaputt": ');
  }, good);
  await page.reload();
  await expect(page.getByText('Spielstand war beschädigt')).toBeVisible();
  expect(await game<number>(page, 'p.game.state.gold')).toBe(77000);
  expect(await page.evaluate(() => localStorage.getItem('planet-rng.save.corrupt'))).toBe('{"kaputt": ');
});

test('a cutscene can be watched again from the collection', async ({ page }) => {
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await setup(page, "p.game.state.tutorial = { done: true, step: 9 }; p.game.state.discovered.singularitaet = { first: Date.now(), total: 1, seen: true }; p.game.state.auras.singularitaet = 1");
  const snapshot = 'JSON.stringify({ rolls: p.game.state.stats.rolls, owned: p.game.state.auras.singularitaet, found: p.game.state.discovered.singularitaet.total })';
  const before = await game<string>(page, snapshot);

  // Auras without a cutscene have no button.
  await setup(page, "p.game.state.discovered.staub = { first: Date.now(), total: 1, seen: true }");
  await page.evaluate(() => (window as never as { __prng: { ui: { showAura(id: string): void } } }).__prng.ui.showAura('staub'));
  await expect(page.getByTestId('aura-detail')).toBeVisible();
  await expect(page.getByTestId('replay-cutscene')).toHaveCount(0);

  await page.evaluate(() => (window as never as { __prng: { ui: { showAura(id: string): void } } }).__prng.ui.showAura('singularitaet'));
  await page.getByTestId('replay-cutscene').click();
  await expect(page.getByTestId('aura-detail')).toBeHidden();
  await expect(page.locator('.cutscene-layer')).toBeVisible();
  // A replay can always be skipped by tapping, even with skipping disabled in the settings.
  await page.waitForTimeout(500);
  await page.locator('.cutscene-layer').click();
  await expect(page.locator('.cutscene-layer')).toBeHidden({ timeout: 5000 });
  expect(await game<string>(page, 'p.controller.phase')).toBe('idle');
  // Watching again grants and counts nothing.
  expect(await game<string>(page, snapshot)).toBe(before);

  // During Auto Roll the replay starts after the running roll; Auto Roll goes on afterwards.
  await setup(page, 'p.game.setSettings({ cutscenes: false }); p.controller.setAuto(true); p.controller.replayCutscene("singularitaet")');
  await expect(page.locator('.cutscene-layer')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(300);
  await page.locator('.cutscene-layer').click();
  await expect(page.locator('.cutscene-layer')).toBeHidden({ timeout: 5000 });
  expect(await game<boolean>(page, 'p.game.state.auto')).toBe(true);
  const rolls = await game<number>(page, 'p.game.state.stats.rolls');
  await expect.poll(() => game<number>(page, 'p.game.state.stats.rolls'), { timeout: 10000 }).toBeGreaterThan(rolls);
});

test('a rolled cutscene: logic first, roll locked, auto roll waits, skip and run-through', async ({ page }) => {
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await setup(page, 'p.game.state.tutorial = { done: true, step: 9 }; p.game.setSettings({ cutsceneSkip: true, flashHintShown: false })');
  const force = (id: string) =>
    setup(page, `p.game.state.pendingRoll = { aura: '${id}', lucky: false, luck: 1, biome: null, startedAt: Date.now(), auto: false }; p.controller.playCutscene('${id}', false)`);

  await force('singularitaet');
  await expect(page.locator('.cutscene-layer')).toBeVisible();
  // The roll is granted, counted and saved before anything is shown.
  expect(await game<number>(page, 'p.game.state.auras.singularitaet')).toBe(1);
  expect(await game<number>(page, 'p.game.state.stats.cutscenes')).toBe(1);
  expect(await game<unknown>(page, 'p.game.state.pendingRoll')).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('planet-rng.save') ?? '')).toContain('singularitaet');
  // One-time flash warning in the black opening.
  await expect(page.locator('.cutscene-hint')).toContainText('Lichtblitze');
  // The roll button is locked and Auto Roll waits.
  expect(await game<boolean>(page, 'p.controller.roll(false)')).toBe(false);
  const rolls = await game<number>(page, 'p.game.state.stats.rolls');
  await setup(page, 'p.controller.setAuto(true)');
  await page.waitForTimeout(800);
  expect(await game<string>(page, 'p.controller.phase')).toBe('cutscene');
  expect(await game<number>(page, 'p.game.state.stats.rolls')).toBe(rolls);
  // Skip: the button shows up after about 2 s and jumps to the reveal.
  await expect(page.getByTestId('cutscene-skip')).toBeVisible({ timeout: 4000 });
  await page.getByTestId('cutscene-skip').click();
  await expect(page.getByTestId('reveal-big')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('.cutscene-layer')).toBeHidden({ timeout: 3000 });
  expect(await game<number>(page, 'p.game.state.auras.singularitaet')).toBe(1);
  expect(await game<boolean>(page, 'p.game.settings.flashHintShown')).toBe(true);
  // Auto Roll goes on after the reveal.
  await expect.poll(() => game<number>(page, 'p.game.state.stats.rolls'), { timeout: 10000 }).toBeGreaterThan(rolls);

  // Run-through without skipping: the reveal follows the end of the cutscene by itself.
  await setup(page, 'p.controller.setAuto(false); p.game.setSettings({ cutsceneSkip: false })');
  await expect.poll(() => game<string>(page, 'p.controller.phase'), { timeout: 10000 }).toBe('idle');
  await force('akkretion');
  await expect(page.locator('.cutscene-layer')).toBeVisible();
  await page.waitForTimeout(2600);
  await expect(page.getByTestId('cutscene-skip')).toBeHidden();
  await expect(page.locator('.cutscene-layer')).toBeHidden({ timeout: 20000 });
  await expect(page.getByTestId('reveal-big')).toBeVisible();
  expect(await game<number>(page, 'p.game.state.auras.akkretion')).toBe(1);
  expect(await game<string>(page, 'p.controller.phase')).toBe('idle');
});

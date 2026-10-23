// Contact sheets of the cutscenes, drawn with the cutscene lab (dist build).
// Usage: node scripts/dev/cutscene-sheet.mjs <outDir> [WxH] [ids comma separated] [fractions]
//   per cutscene: <outDir>/cutscene-<id>.png (frames at 0/10/25/50/75/90/100 %)
//   all together: <outDir>/cutscene-contact-sheet.png (one row per cutscene)
// Env: QUALITY=low|medium|high, ONLY_SHEET=1 (skip the overview), NO_SHEET=1.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const [out = 'docs/cutscenes', sizeArg = '360x640', idsArg, fracArg] = process.argv.slice(2);
const [vw, vh] = sizeArg.split('x').map(Number);
const fracs = (fracArg ?? '0,0.1,0.25,0.5,0.75,0.9,1').split(',').map(Number);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('file://' + resolve('dist/planet-rng.html') + '?debug&paused&cutscene=');
await page.addStyleTag({ content: '.cutscene-lab__panel{display:none!important}' });
await page.waitForFunction(() => !!window.__cutsceneLab && !!window.__prng);
await page.evaluate(() => {
  const p = window.__prng;
  p.game.state.tutorial = { done: true, step: 9 };
  p.game.touch();
});
if (process.env.QUALITY) await page.evaluate((q) => window.__cutsceneLab.setQuality(q), process.env.QUALITY);
const ids = idsArg ? idsArg.split(',') : await page.evaluate(() => window.__cutsceneLab.ids);

const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const shots = {};
for (const id of ids) {
  await page.evaluate((id) => window.__cutsceneLab.select(id), id);
  await frame();
  await frame();
  const D = await page.evaluate(() => window.__cutsceneLab.def().duration);
  const name = await page.evaluate(() => window.__cutsceneLab.def().signature.name);
  shots[id] = { D, name, frames: [] };
  for (const f of fracs) {
    const t = Math.min(D - 0.001, f * D);
    await page.evaluate((t) => window.__cutsceneLab.seek(t), t);
    await frame();
    await frame();
    const buf = await page.locator('.cutscene-lab__stage').screenshot();
    shots[id].frames.push({ t, f, b64: buf.toString('base64') });
  }
}

const compose = async (file, rows, tileW, title) => {
  const p = await browser.newPage({ viewport: { width: 200, height: 100 } });
  const cols = Math.max(...rows.map((r) => r.items.length));
  await p.setContent(`<!doctype html><style>body{margin:0;background:#05060d;font:12px system-ui;color:#dfe6ff}
  h1{font-size:14px;margin:6px 8px}.row{display:flex;align-items:stretch}.lab{width:120px;padding:4px 6px;box-sizing:border-box;background:#0b0d18;border:1px solid #1a1d2e}
  figure{margin:0;border:1px solid #1a1d2e;width:${tileW}px}img{display:block;width:100%}figcaption{padding:2px 4px;background:#0b0d18}</style>
  ${title ? `<h1>${title}</h1>` : ''}<div class="g">${rows
    .map(
      (r) => `<div class="row">${r.label ? `<div class="lab">${r.label}</div>` : ''}${r.items.map((i) => `<figure><img src="data:image/png;base64,${i.b64}"><figcaption>${i.cap}</figcaption></figure>`).join('')}</div>`,
    )
    .join('')}</div>`);
  await p.waitForTimeout(150);
  const box = await p.evaluate(() => {
    const r = document.body.getBoundingClientRect();
    return { w: Math.ceil(document.body.scrollWidth), h: Math.ceil(r.height) };
  });
  await p.setViewportSize({ width: Math.max(box.w, cols * tileW), height: box.h });
  await p.screenshot({ path: file, fullPage: true });
  await p.close();
};

if (!process.env.ONLY_SHEET) {
  for (const id of ids) {
    const s = shots[id];
    await compose(`${out}/cutscene-${id}.png`, [{ items: s.frames.map((fr) => ({ b64: fr.b64, cap: `${Math.round(fr.f * 100)} % · ${fr.t.toFixed(1)} s` })) }], 180, `${id} · ${s.D.toFixed(1)} s · Bruch: ${s.name}`);
  }
}
if (!process.env.NO_SHEET && ids.length > 1) {
  const pick = [0.25, 0.5, 0.75, 0.9].map((f) => fracs.indexOf(f)).filter((i) => i >= 0);
  await compose(
    `${out}/cutscene-contact-sheet.png`,
    ids.map((id) => ({ label: `<b>${id}</b><br>${shots[id].D.toFixed(1)} s<br>${shots[id].name}`, items: pick.map((i) => ({ b64: shots[id].frames[i].b64, cap: `${Math.round(shots[id].frames[i].f * 100)} %` })) })),
    120,
    '',
  );
}
console.log(errors.length ? errors.slice(0, 10) : 'no errors');
await browser.close();

// Dev helper: composes images into a labelled grid.
// Usage: [FILTER=css-filter] [CROPY=top,bottom] node scripts/dev/grid.mjs <out.png> <cols> <tileWidth> <file[=label]>...
// CROPY shows only that vertical band of every image (fractions of its height, e.g. 0.12,0.72).
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const [out, colsArg, tileArg, ...files] = process.argv.slice(2);
const cols = Number(colsArg);
const tileW = Number(tileArg);
const items = files.map((f) => {
  const [path, label] = f.split('=');
  return { b64: readFileSync(path).toString('base64'), label: label ?? basename(path, '.png') };
});
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: cols * tileW, height: 100 } });
await page.setContent(`<!doctype html><style>body{margin:0;background:#05060d;font:12px system-ui;color:#dfe6ff}
.g{display:grid;grid-template-columns:repeat(${cols},${tileW}px)}figure{margin:0;border:1px solid #1a1d2e}
img{display:block;width:100%;filter:${process.env.FILTER ?? 'none'}}figcaption{padding:2px 4px;background:#0b0d18}</style>
<div class="g">${items.map((i) => `<figure><img src="data:image/png;base64,${i.b64}"><figcaption>${i.label}</figcaption></figure>`).join('')}</div>`);
await page.waitForTimeout(100);
if (process.env.CROPY) {
  const [y0, y1] = process.env.CROPY.split(',').map(Number);
  await page.evaluate(([y0, y1]) => {
    for (const img of document.querySelectorAll('img')) {
      const h = img.getBoundingClientRect().height;
      const wrap = document.createElement('div');
      wrap.style.cssText = `height:${h * (y1 - y0)}px;overflow:hidden`;
      img.style.marginTop = `${-h * y0}px`;
      img.replaceWith(wrap);
      wrap.appendChild(img);
    }
  }, [y0, y1]);
}
const h = await page.evaluate(() => document.querySelector('.g').getBoundingClientRect().height);
await page.setViewportSize({ width: cols * tileW, height: Math.ceil(h) });
await page.screenshot({ path: out });
await browser.close();

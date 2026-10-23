// Dev helper: composes images into a labelled grid.
// Usage: node scripts/dev/grid.mjs <out.png> <cols> <tileWidth> <file[=label]>...
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
img{display:block;width:100%}figcaption{padding:2px 4px;background:#0b0d18}</style>
<div class="g">${items.map((i) => `<figure><img src="data:image/png;base64,${i.b64}"><figcaption>${i.label}</figcaption></figure>`).join('')}</div>`);
await page.waitForTimeout(100);
const h = await page.evaluate(() => document.querySelector('.g').getBoundingClientRect().height);
await page.setViewportSize({ width: cols * tileW, height: Math.ceil(h) });
await page.screenshot({ path: out });
await browser.close();

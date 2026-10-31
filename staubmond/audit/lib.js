// Gemeinsame Helfer für die Logikprüfung: Testkopie bauen, statischer Server, Browser, Seite öffnen
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');          // staubmond/
const AUDIT = __dirname;
const OUT = path.join(AUDIT, 'results');

// Testkopie: echte index.html + Test-Interface vor </body> (die echte Datei bleibt unberührt)
function buildInstrumented(src, outName) {
  const html = fs.readFileSync(src || path.join(ROOT, 'index.html'), 'utf8');
  const api = fs.readFileSync(path.join(AUDIT, 'test-api.js'), 'utf8');
  const i = html.lastIndexOf('</body>');
  const out = html.slice(0, i) + '<script>\n' + api + '\n</script>\n' + html.slice(i);
  const dst = path.join(AUDIT, outName || 'index_audit_instrumented.html');
  fs.writeFileSync(dst, out);
  return dst;
}

// kleiner statischer Server (ein Befehl, keine weiteren Abhängigkeiten)
function serve(dir) {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      const p = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
      if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html; charset=utf-8' : p.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' });
      fs.createReadStream(p).pipe(r);
    });
    srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' }));
  });
}

// deterministischer Ersatz für Math.random (fester Seed je Testlauf) + leere Datenbank
function initScript(seed) {
  return `(() => {
    let s = ${seed >>> 0} || 1; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    try { if (!sessionStorage.getItem('keep')) { indexedDB.deleteDatabase('staubmond'); localStorage.clear(); } } catch (e) {}
  })();`;
}

async function openGame(browser, base, opts) {
  opts = opts || {};
  const ctx = opts.ctx || await browser.newContext({ viewport: { width: 1280, height: 800 } });
  if (!opts.ctx) await ctx.addInitScript(initScript(opts.rngSeed || 12345));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(base + (opts.file || 'audit/index_audit_instrumented.html'));
  await page.waitForFunction(() => typeof Game !== 'undefined' && Game.state === 'menu', null, { timeout: 60000 });
  await page.evaluate(() => { if (window.Loader) Loader.skip(); if (window.__test) __test.install(); });
  return { ctx, page, errs };
}

function save(name, data) { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(data, null, 1)); }

module.exports = { ROOT, AUDIT, OUT, buildInstrumented, serve, initScript, openGame, save, chromium };

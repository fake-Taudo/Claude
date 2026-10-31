// Alle Prüfungen mit einem Befehl:  node audit/run.js            (Standard, < 10 Min.)
//                                   node audit/run.js t_core t_save (einzelne Module)
//                                   LONG=1 SUFFIX=_long node audit/run.js t_fuzz t_sim  (Langlauf: 5 × 10.000 Aktionen, 5 × 20 Std.)
const L = require('./lib');
const fs = require('fs'), path = require('path');
const DEFAULT = ['t_world', 't_core', 't_build', 't_robots', 't_progress', 't_save', 't_misc', 't_fuzz', 't_sim', 't_regress'];

(async () => {
  const mods = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT;
  L.buildInstrumented();
  const { srv, url } = await L.serve(L.ROOT);
  const browser = await L.chromium.launch();
  const all = [];
  for (const m of mods) {
    const t0 = Date.now(), ctxs = [], errs = [];
    const env = {
      url, browser, L,
      open: async (opts) => { const r = await L.openGame(browser, url, opts); ctxs.push(r.ctx); r.errs.forEach(e => errs.push(e)); r.page.on('pageerror', e => errs.push('pageerror: ' + e.message)); return r; },
    };
    let res;
    try { res = await require('./tests/' + m)(env); }
    catch (e) { res = [{ id: m + '-ABBRUCH', area: '-', status: 'FEHLER', detail: 'Testmodul abgebrochen: ' + (e.stack || e.message).slice(0, 600) }]; }
    for (const c of ctxs) await c.close().catch(() => { });
    const uniq = [...new Set(errs)];
    if (uniq.length) res.push({ id: m + '-KONSOLE', area: '4.3', status: 'HINWEIS', detail: 'Konsolenmeldungen während des Moduls: ' + uniq.slice(0, 8).join(' | ') });
    L.save(m + (process.env.SUFFIX || ''), res);
    const cnt = {}; for (const r of res) cnt[r.status] = (cnt[r.status] || 0) + 1;
    console.log('== ' + m + ' (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s) ' + JSON.stringify(cnt));
    for (const r of res) console.log('  ' + r.id.padEnd(8) + ' ' + r.status.padEnd(13) + ' ' + r.detail.slice(0, 260));
    all.push(...res);
  }
  await browser.close(); srv.close();
  const cnt = {}; for (const r of all) cnt[r.status] = (cnt[r.status] || 0) + 1;
  console.log('GESAMT ' + JSON.stringify(cnt));
})();

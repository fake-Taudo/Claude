// Rauchtest des Harness: neues Spiel, putzen, abladen, Invarianten, Rundlauf
const L = require('../lib');
(async () => {
  L.buildInstrumented();
  const { srv, url } = await L.serve(L.ROOT);
  const browser = await L.chromium.launch();
  const { page, errs } = await L.openGame(browser, url);
  const r = await page.evaluate(async () => {
    const T = __test; await T.startNew(20261026);
    await new Promise(r => setTimeout(r, 300));
    const t0 = performance.now();
    T.setIntent({ mx: 1, my: 0, clean: true }); T.ticks(600, 60);
    T.setIntent({ mx: 0, my: 1, clean: true }); T.ticks(600, 60);
    const ms = performance.now() - t0;
    const c1 = T.check({ recount: true });
    const b = T.books(), inv = T.invParts();
    return { ms, c1, b, inv, cells: G.stats.cells, load: Player.loadKg(), cap: Player.ownCap(), t: G.t };
  });
  console.log(JSON.stringify(r, null, 1).slice(0, 2500));
  console.log(errs.join('\n') || 'keine Seitenfehler');
  await browser.close(); srv.close();
})();

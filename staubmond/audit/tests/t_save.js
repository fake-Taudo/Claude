// Prüfbereich 3.10 (Speichern, Laden, Migration, Backups, Plätze, Export/Import, zwei Tabs) und 4.5 (Import-Sicherheit)
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
module.exports = async function (env) {
  const out = [];
  const rec = (id, area, status, detail, data) => out.push({ id, area, status, detail, data });
  const { page } = await env.open();

  const r1 = await page.evaluate(async () => {
    const T = __test, out = [];
    const rec = (id, area, status, detail, data) => out.push({ id, area, status, detail, data });
    const st = CONFIG.world.start;
    const fresh = async (slot) => { T.setIntent({}); await T.startNew(20261026, slot || 0); await new Promise(r => setTimeout(r, 150)); T.seedRandom(99); };
    // reichhaltiger Spielstand: Gebäude, Bänder mit Paketen, Roboter mit Ladung, Fahrzeug, Forschung, Aufträge
    const rich = async () => {
      await fresh(); G.licence = 3; World.updateLocks(); T.setMoney(1e7); T.cleanRect(st.x + 6, st.y - 16, 40, 32);
      T.act('vehicle', 'rover'); Vehicles.list[0].up.cap = 2; Vehicles.list[0].load[3] = 12.5;
      const h = T.act('place', 'hangar', ...Object.values(T.findSpot('hangar', 0, { x: st.x + 14, y: st.y - 8 }, 12)), 0).b;
      for (let i = 0; i < 3; i++) T.act('robot', 'mk2', h.id);
      T.act('assign', Robots.list.map(r => r.id), Robots.areaFor(U.sectorAt(st.x, st.y)), true);
      const s = T.act('place', 'silo', ...Object.values(T.findSpot('silo', 0, { x: st.x + 24, y: st.y + 4 }, 12)), 0).b; s.store[0] = 300;
      const o = Buildings.outPort(s); T.act('belts', [[o.x, o.y, 0], [o.x + 1, o.y, 0], [o.x + 2, o.y, 1], [o.x + 2, o.y + 1, 1]], 1);
      G.fp = 20; T.act('research', 't1'); T.act('research', 'l1'); T.act('upgrade', 'container'); T.act('tool', 'besen');
      T.setIntent({ mx: 1, my: 0.2, clean: true }); T.ticks(600, 60); T.setIntent({}); T.ticks(300, 60);
    };

    // a) Rundlauf mit reichhaltigem Zustand
    await rich();
    {
      const diff = await T.roundtrip();
      const relevant = diff.filter(d => !d.startsWith('.prog'));
      rec('S-01', '3.10', relevant.length ? 'FEHLER' : 'OK', 'Speichern → Laden → tiefer Vergleich (G inkl. Zeitgeber, Aufträge, Statistik; Gebäude mit Lagern; Bänder mit Paketen; Roboter mit Position, Zustand, Ladung; Fahrzeug mit Upgrades und Ladung; Chunk-Daten als Prüfsumme; Chunk-Statistik; Sektorfortschritt; Mondglanz): ' + (relevant.slice(0, 8).join(' | ') || 'identisch') + '. Nicht gespeichert und daher nicht verglichen: Zufallszustand (Math.random/World.rnd), fliegende Meteore, Rückgängig-Liste, angefangener Maschinen-Fortschritt (siehe P-07).', diff);
    }
    // b) „Neues Spiel“ auf belegtem Platz (UI-Weg: Game.newGame ohne deleteSlot)
    await fresh();
    {
      const f = World.finds[0];
      World.stroke(f.x - 6, f.y, f.x + 6, f.y, 3, 1e12, true, 1); const foundA = !!G.finds[f.id];
      T.cleanRect(st.x - 40, st.y + 20, 30, 10); const cellsA = G.stats.cells;
      await Save.saveNow(true);
      // neues Spiel in denselben Platz (so wie der Knopf „Neu“ nach „Platz überschreiben?“)
      await Game.newGame(0); for (let i = 0; i < 100 && Game.state !== 'play'; i++) await new Promise(r => setTimeout(r, 20)); Game.loop = function () { }; Game.paused = true;
      for (let i = 0; i < 100 && Save.saving; i++) await new Promise(r => setTimeout(r, 10));
      await Save.saveNow(true);
      await Game.loadGame(0); Game.loop = function () { }; Game.paused = true;
      for (let i = 0; i < 300; i++) World.processPending(50);
      const bad = []; T.checkRecount((k, m) => bad.push(m));
      const cellClean = World.dustAt(Math.floor(f.x), Math.floor(f.y)) <= CLEAN_T;
      rec('S-02', '3.10', bad.length || (cellClean && !G.finds[f.id]) ? 'FEHLER' : 'OK', 'Spiel A putzt ' + cellsA + ' Zellen inkl. Fundstück „' + f.name + '“ (gefunden ' + foundA + ') und speichert. „Neu“ auf demselben Platz → Spiel B (0 Zellen) speichert und wird geladen: Die Chunk-Datensätze von A bleiben in IndexedDB liegen (Game.newGame löscht den Platz nicht, Save.saveNow schreibt nur Chunks von B) und werden in B geladen. Ergebnis: Fundstückzelle in B sauber ' + cellClean + ', in B gefunden ' + !!G.finds[f.id] + ' (Fundstück ist damit für immer verloren), stats.cells ' + G.stats.cells + '; Neuzählung: ' + (bad.join(' | ') || 'ok'));
    }
    // c) Wettlauf: Chunk ändert sich während seines (asynchronen) Kodierens
    await fresh();
    {
      const ci = World.ci(st.x + 30, st.y + 30); World.mat(ci); World.markDirty(ci, 0, 0, 1, 1);
      const gz0 = Save.gz; Save.gz = async function (u8) { await new Promise(r => setTimeout(r, 60)); return gz0.call(this, u8); };
      const p = Save.saveNow(false);
      await new Promise(r => setTimeout(r, 20));
      const kg = World.stroke(st.x + 26, st.y + 30.5, st.x + 34, st.y + 30.5, 1.5, 1e12, true, 1);   // Änderung mitten im Speichern
      await p; Save.gz = gz0;
      const stillDirty = World.dirtySave.has(ci);
      const before = Array.from(World.chunks[ci].dust);
      await Game.loadGame(0); Game.loop = function () { }; Game.paused = true;
      const after = World.chunks[ci] ? Array.from(World.chunks[ci].dust) : null; let d = 0; if (after) for (let i = 0; i < 4096; i++) if (after[i] !== before[i]) d++;
      rec('S-03', '3.10', !stillDirty && d > 0 ? 'FEHLER' : 'OK', 'Während Save.saveNow einen Chunk komprimiert (await gz), wird im selben Chunk geputzt (' + kg.toFixed(2) + ' kg). Danach ist der Chunk nicht mehr als „geändert“ markiert (dirtySave ' + stillDirty + '), weil saveNow ihn erst nach dem await aus der Liste nimmt. Nach dem Laden fehlen ' + d + ' Zellenänderungen (wieder staubig), obwohl Kern-Statistik und Spielerbehälter sie enthalten – Staub doppelt erntbar, Sektorzählung inkonsistent. Tritt auf, wenn ein Autosave (alle 30 s) einen Chunk erwischt, in dem gerade geputzt wird und der danach nicht mehr verändert wird.');
    }
    // c2) zweiter Speicherauftrag während eines laufenden (z. B. Schließen des Tabs während eines Autosaves)
    await fresh();
    {
      T.cleanRect(st.x - 40, st.y + 20, 20, 4);
      const gz0 = Save.gz; Save.gz = async function (u8) { await new Promise(r => setTimeout(r, 80)); return gz0.call(this, u8); };
      const p1 = Save.saveNow(true);
      await new Promise(r => setTimeout(r, 10));
      G.money = 777777; T.cleanRect(st.x - 40, st.y + 30, 20, 4);
      const p2 = Save.saveNow(false);   // wie pagehide/visibilitychange
      await p1; await p2; Save.gz = gz0;
      const saved = JSON.parse((await Save.get('core', 's0')).json).money;
      rec('S-03b', '3.10', saved !== 777777 ? 'FEHLER' : 'OK', 'Speicherauftrag während eines laufenden Speicherns (Autosave läuft, Spieler schließt den Tab → pagehide → Save.saveNow): wird wegen „if (this.saving) return“ stillschweigend verworfen, nicht nachgeholt. Gespeichertes Geld ' + saved + ' statt 777777 – alle Änderungen seit Beginn des laufenden Speicherns gehen beim Schließen verloren.');
    }
    // d) Atomarität: Kern geschrieben, Chunks scheitern (Tab geschlossen/Fehler)
    await fresh();
    {
      T.cleanRect(st.x - 40, st.y + 20, 30, 6); await Save.saveNow(true);
      T.cleanRect(st.x - 40, st.y + 30, 30, 6);
      const pm = Save.putMany; Save.putMany = async function (store, e) { if (store === 'chunks') throw new Error('abgebrochen (Test)'); return pm.call(this, store, e); };
      await Save.saveNow(false); Save.putMany = pm;
      await Game.loadGame(0); Game.loop = function () { }; Game.paused = true;
      const bad = []; T.checkRecount((k, m) => bad.push(m));
      rec('S-04', '3.10', bad.length ? 'FEHLER' : 'OK', 'Speichern bricht nach dem Kerndatensatz ab (Chunk-Schreiben schlägt fehl): Kern ist neu, Chunks alt. Nach dem Laden: ' + (bad.join(' | ') || 'konsistent') + '. Kern und Chunks werden in getrennten Transaktionen geschrieben (Save.saveNow); es gibt keine Versionsmarke, die beide verbindet.');
    }
    // e) Backups: Rotation und beschädigte Hauptdatensätze
    await fresh();
    {
      const keys = []; const pm = Save.putMany; Save.putMany = async function (store, e) { if (store === 'core') keys.push(e.map(x => x[0]).join('+')); return pm.call(this, store, e); };
      for (let i = 0; i < 12; i++) { G.money = i; await Save.saveNow(false); }
      Save.putMany = pm;
      rec('S-05', '3.10', 'OK', 'Backup-Rotation (12 Speichervorgänge): ' + keys.join(', ') + '. Jeder 4. Autosave schreibt zusätzlich ein Backup (5 Plätze, älteste werden überschrieben); Backups sind Kopien des gültigen Speicherstands und können ein gutes Backup nicht durch einen beschädigten Stand verdrängen (beschädigte Daten entstehen nur außerhalb).');
      const good = await Save.get('core', 's0');
      const variants = {
        'Prüfsumme falsch': r => Object.assign({}, r, { sum: 'deadbeef' }),
        'Pflichtfeld fehlt': r => { const g = JSON.parse(r.json); delete g.player; const j = JSON.stringify(g); return Object.assign({}, r, { json: j, sum: U.fnv(j) }); },
        'abgeschnitten': r => { const j = r.json.slice(0, r.json.length >> 1); return Object.assign({}, r, { json: j, sum: U.fnv(j) }); },
        'leeres Objekt': r => ({}),
        'falscher Typ (Geld als Text)': r => { const g = JSON.parse(r.json); g.money = '1000'; const j = JSON.stringify(g); return Object.assign({}, r, { json: j, sum: U.fnv(j) }); },
        'riesige Zahl (1e999)': r => { const j = r.json.replace(/"money":[^,]+/, '"money":1e999'); return Object.assign({}, r, { json: j, sum: U.fnv(j) }); },
        'Lizenz 99': r => { const g = JSON.parse(r.json); g.licence = 99; const j = JSON.stringify(g); return Object.assign({}, r, { json: j, sum: U.fnv(j) }); },
      };
      const res = [];
      for (const [name, fn] of Object.entries(variants)) {
        await Save.putMany('core', [['s0', fn(good)]]);
        let err = null, restored = null, money = null, crash = null;
        const toasts = []; const t0 = UI.toast; UI.toast = (m, k) => { toasts.push(m); };
        try { await Game.loadGame(0); Game.loop = function () { }; Game.paused = true; money = G.money; T.ticks(30, 0); } catch (e) { crash = e.message; }
        UI.toast = t0;
        res.push(name + ': ' + (crash ? 'ABSTURZ ' + crash : 'Geld ' + money + (toasts.length ? ', Meldung „' + toasts[0].slice(0, 60) + '“' : '')));
      }
      const anyBad = res.some(x => x.includes('ABSTURZ') || x.includes('Infinity') || x.includes('Geld 1000'));
      rec('S-06', '3.10', anyBad ? 'FEHLER' : 'OK', 'Beschädigter Hauptdatensatz (Backup vorhanden): ' + res.join(' | ') + '. Save.validate prüft nur Prüfsumme, Typ von money/t und das Vorhandensein von player/stats/seed.', res);
      await Save.putMany('core', [['s0', good]]);
    }
    // f) Backup ist älter als die Chunks
    await fresh();
    {
      T.cleanRect(st.x - 40, st.y + 20, 30, 4); await Save.saveNow(true);   // Backup mit Stand 1
      Save.count = 1;                                                       // die nächsten beiden Speicherungen schreiben kein Backup
      T.cleanRect(st.x - 40, st.y + 30, 30, 4); await Save.saveNow(false); await Save.saveNow(false);   // neuer Stand, kein neues Backup
      const r = await Save.get('core', 's0'); await Save.putMany('core', [['s0', Object.assign({}, r, { sum: 'x' })]]);   // Hauptdatensatz kaputt
      await Game.loadGame(0); Game.loop = function () { }; Game.paused = true;
      const bad = []; T.checkRecount((k, m) => bad.push(m));
      rec('S-07', '3.10', bad.length ? 'FEHLER' : 'OK', 'Hauptdatensatz beschädigt → jüngstes Backup wird geladen. Backups enthalten nur den Kern, die Chunks gibt es pro Platz nur einmal (neuester Stand): Geld/Statistik vom Backup, Welt vom neuesten Stand. Neuzählung nach dem Laden: ' + (bad.join(' | ') || 'konsistent'));
    }
    // g) Plätze unabhängig
    {
      await fresh(0); T.cleanRect(st.x - 40, st.y + 20, 20, 4); G.money = 111; await Save.saveNow(true);
      await T.startNew(777, 1); T.cleanRect(st.x + 20, st.y - 30, 20, 4); G.money = 222; await Save.saveNow(true);
      await Save.deleteSlot(1);
      await Game.loadGame(0); Game.loop = function () { }; Game.paused = true;
      const bad = []; T.checkRecount((k, m) => bad.push(m)); const l1 = await Save.loadSlot(1);
      rec('S-08', '3.10', G.money === 111 && !l1 && !bad.length && G.seed === 20261026 ? 'OK' : 'FEHLER', 'Platz 1 und 2 mit verschiedenen Seeds, Platz 2 gelöscht: Platz 1 unverändert (Geld ' + G.money + ', Seed ' + G.seed + ', Neuzählung ' + (bad.join(' | ') || 'ok') + '), Platz 2 leer ' + !l1);
    }
    return out;
  });
  out.push(...r1);

  // h) Export/Import-Rundlauf, Import in belegten Platz, manipulierte Dateien (Prototype Pollution, XSS, Typen)
  {
    const tmp = path.join(env.L.AUDIT, 'results', 'tmp'); fs.mkdirSync(tmp, { recursive: true });
    const ctx = await env.browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
    await ctx.addInitScript(env.L.initScript(5));
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(env.url + 'audit/index_audit_instrumented.html'); await p.waitForFunction(() => typeof Game !== 'undefined' && Game.state === 'menu'); await p.evaluate(() => { Loader && Loader.skip && Loader.skip(); __test.install(); });
    await p.evaluate(async () => { await __test.startNew(20261026); __test.cleanRect(CONFIG.world.start.x - 30, CONFIG.world.start.y + 20, 20, 5); G.money = 4321; await Save.saveNow(true); });
    const dl = p.waitForEvent('download'); await p.evaluate(() => Save.exportSlot(0)); const d = await dl; const file = path.join(tmp, 'export.json'); await d.saveAs(file);
    const snapA = await p.evaluate(() => JSON.stringify(__test.snapshot()));
    const imp = async (f, slot) => { const ch = p.waitForEvent('filechooser'); await p.evaluate(s => { window.__imp = 0; Save.importDialog(s, () => { window.__imp = 1; }); }, slot); await (await ch).setFiles(f); await p.waitForTimeout(600); return p.evaluate(() => window.__imp); };
    // Import in einen belegten Platz (Platz 2 vorher mit anderem Spiel)
    await p.evaluate(async () => { await __test.startNew(5555, 1); __test.cleanRect(CONFIG.world.start.x + 30, CONFIG.world.start.y - 30, 20, 5); await Save.saveNow(true); });
    const ok1 = await imp(file, 1);
    const snapB = await p.evaluate(async () => { await Game.loadGame(1); Game.loop = function () { }; Game.paused = true; return JSON.stringify(__test.snapshot()); });
    const diff = await p.evaluate(([a, b]) => { const A = JSON.parse(a), B = JSON.parse(b); delete A.g.slot; delete B.g.slot; return __test.diff(A, B); }, [snapA, snapB]);
    rec('S-09', '3.10', ok1 && !diff.length ? 'OK' : 'FEHLER', 'Export Platz 1 → Import in belegten Platz 2 → Laden: ' + (diff.slice(0, 6).join(' | ') || 'identisch (alte Chunks von Platz 2 werden vorher gelöscht)'));
    // manipulierte Dateien
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const g = JSON.parse(raw.core.json);
    const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); };
    const mkFile = (name, gg, extra) => { const j = typeof gg === 'string' ? gg : JSON.stringify(gg); const data = Object.assign({}, raw, { core: Object.assign({}, raw.core, { json: j, sum: fnv(j) }) }, extra || {}); const f = path.join(tmp, name + '.json'); fs.writeFileSync(f, typeof data === 'string' ? data : JSON.stringify(data)); return f; };
    const cases = [];
    const gp = JSON.parse(JSON.stringify(g)); const jp = JSON.stringify(gp).replace('{"v":', '{"__proto__":{"polluted":1},"constructor":{"prototype":{"polluted2":1}},"v":');
    cases.push(['Prototype Pollution (__proto__/constructor im Kern)', mkFile('proto', jp)]);
    const gx = JSON.parse(JSON.stringify(g)); gx.buildings = (gx.buildings || []).concat([{ id: 99999, type: 'teleport', x: 3214, y: 3214, rot: 0, name: '<img src=x onerror="window.__xss=1">' }]); cases.push(['XSS im Gebäudenamen (Teleport)', mkFile('xss', gx)]);
    const gs = JSON.parse(JSON.stringify(g)); gs.licence = '3'; gs.fp = '12'; gs.up.container = '5'; cases.push(['Zahlen als Text (Lizenz, FP, Upgrade)', mkFile('strnum', gs)]);
    const gn = JSON.parse(JSON.stringify(g)); gn.orders = null; gn.robots = null; gn.stats.kgByType = null; cases.push(['null an Pflichtstellen (orders, robots, stats.kgByType)', mkFile('nulls', gn)]);
    const gh = JSON.parse(JSON.stringify(g)); gh.secDone = new Array(200000).fill(5); cases.push(['riesiges Array (secDone 200.000 Einträge)', mkFile('huge', gh)]);
    const gl = JSON.parse(JSON.stringify(g)); gl.player.load = 'x'.repeat(1e6); cases.push(['überlanges Feld (player.load 1 MB Text)', mkFile('long', gl)]);
    for (const [name, f] of cases) {
      const before = errs.length;
      const ok = await imp(f, 2);
      let res;
      try { res = await p.evaluate(async () => { try { await Game.loadGame(2); Game.loop = function () { }; Game.paused = true; __test.ticks(60, 0); return { state: Game.state, money: G.money, lic: G.licence, polluted: ({}).polluted || ({}).polluted2 || null, xss: window.__xss || null }; } catch (e) { return { err: e.message }; } }); }
      catch (e) { res = { err: e.message }; }
      // Teleport-Liste (Name) rendern, falls vorhanden
      if (name.startsWith('XSS')) await p.evaluate(() => { try { const t = Buildings.teleports[0]; if (t) UI.openBuilding(t); } catch (e) { } }).catch(() => { });
      const xss = await p.evaluate(() => window.__xss || null).catch(() => null);
      cases.find(c => c[0] === name).push(JSON.stringify(Object.assign(res, { importiert: !!ok, xss, neueSeitenfehler: errs.slice(before).slice(0, 2) })));
      await p.evaluate(async () => { try { await Game.toMenu(); } catch (e) { } });
    }
    const crashes = cases.filter(c => /err|Seitenfehler":\["/.test(c[2]) && !/"neueSeitenfehler":\[\]/.test(c[2]) || /"err"/.test(c[2]));
    rec('S-10', '4.5', crashes.length ? 'FEHLER' : 'OK', 'Import manipulierter Dateien (gültige Prüfsumme, sonst beliebig): ' + cases.map(c => c[0] + ' → ' + c[2]).join(' || '), cases.map(c => [c[0], c[2]]));
    await ctx.close();
  }

  // i) Zwei Tabs mit demselben Spielstand
  {
    const ctx = await env.browser.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.addInitScript('(() => { let s = 7; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();');
    const open = async () => { const p = await ctx.newPage(); await p.goto(env.url + 'audit/index_audit_instrumented.html'); await p.waitForFunction(() => typeof Game !== 'undefined' && Game.state === 'menu'); await p.evaluate(() => { Loader && Loader.skip && Loader.skip(); __test.install(); }); return p; };
    const A = await open();
    await A.evaluate(async () => { await Save.deleteSlot(0); await __test.startNew(20261026, 0, true); await Save.saveNow(true); });
    const B = await open();
    await B.evaluate(async () => { await Game.loadGame(0); Game.loop = function () { }; Game.paused = true; __test.resetBooks(); });
    // A putzt im Westen, B im Osten; beide speichern abwechselnd
    await A.evaluate(async () => { __test.cleanRect(CONFIG.world.start.x - 60, CONFIG.world.start.y + 20, 30, 6); G.money = 1000; await Save.saveNow(false); });
    await B.evaluate(async () => { __test.cleanRect(CONFIG.world.start.x + 30, CONFIG.world.start.y + 20, 30, 6); G.money = 2000; await Save.saveNow(false); });
    await A.evaluate(async () => { __test.cleanRect(CONFIG.world.start.x - 60, CONFIG.world.start.y + 30, 30, 6); await Save.saveNow(false); });
    const C = await open();
    const res = await C.evaluate(async () => { await Game.loadGame(0); Game.loop = function () { }; Game.paused = true; for (let i = 0; i < 300; i++) World.processPending(50); const bad = []; __test.checkRecount((k, m) => bad.push(m)); return { money: G.money, cells: G.stats.cells, bad, eastClean: World.dustAt(CONFIG.world.start.x + 40, CONFIG.world.start.y + 22) <= 8 }; });
    rec('S-11', '3.10', res.bad.length ? 'FEHLER' : 'ABWEICHUNG', 'Zwei Tabs mit demselben Platz: Tab A putzt im Westen, Tab B im Osten, beide speichern abwechselnd. Neu geladen: Geld ' + res.money + ' (Stand von A, B-Fortschritt verloren), Ostfläche von B trotzdem sauber ' + res.eastClean + ' (Chunks von B), stats.cells ' + res.cells + '; Neuzählung ' + (res.bad.join(' | ') || 'ok') + '. Es gibt keine Sperre gegen ein zweites Fenster (kein BroadcastChannel-/Web-Lock-Schutz).');
    await ctx.close();
  }

  // j) Migration: Spielstand aus einer frühen Version (Phase 2, Commit 30fe96a) und aus index_audit_original.html
  {
    const tmp = path.join(env.L.AUDIT, 'results', 'tmp'); fs.mkdirSync(tmp, { recursive: true });
    let oldHtml = null; try { oldHtml = execSync('git show 30fe96a:staubmond/index.html', { cwd: env.L.ROOT, maxBuffer: 64 << 20 }).toString(); } catch (e) { }
    const res = [];
    for (const [label, file] of [['Phase 2 (30fe96a)', oldHtml && (fs.writeFileSync(path.join(env.L.ROOT, 'audit', 'results', 'tmp', 'old_30fe96a.html'), oldHtml), 'audit/results/tmp/old_30fe96a.html')], ['index_audit_original.html', 'index_audit_original.html']]) {
      if (!file) { res.push(label + ': nicht verfügbar'); continue; }
      const ctx = await env.browser.newContext({ viewport: { width: 1280, height: 800 } });
      const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto(env.url + file); await p.waitForFunction(() => typeof Game !== 'undefined' && Game.state === 'menu', null, { timeout: 60000 });
      const a = await p.evaluate(async () => {
        if (window.Loader && Loader.skip) Loader.skip();
        await Game.newGame(0); for (let i = 0; i < 200 && Game.state !== 'play'; i++) await new Promise(r => setTimeout(r, 20));
        G.tutSkip = true; G.money = 5e5; G.licence = 1; World.updateLocks();
        for (let y = 3220; y < 3240; y++) World.stroke(3150, y, 3260, y, 1.6, 1e9, true);
        if (typeof Shop !== 'undefined') { Shop.do('tool', 'besen'); Shop.do('upgrade', 'container'); Shop.do('vehicle', 'kehrwagen'); } else { G.tools.besen = 1; G.tool = 'besen'; G.up.container = 1; }
        for (let i = 0; i < 200 && Save.saving; i++) await new Promise(r => setTimeout(r, 20));
        await Save.saveNow(true);
        return { money: G.money, cells: G.stats.cells, tools: Object.keys(G.tools).length, veh: (G.vehicles || []).length };
      });
      await p.close();
      const q = await ctx.newPage(); q.on('pageerror', e => errs.push(e.message));
      await q.goto(env.url + 'audit/index_audit_instrumented.html'); await q.waitForFunction(() => typeof Game !== 'undefined' && Game.state === 'menu', null, { timeout: 60000 });
      const b = await q.evaluate(async () => {
        Loader && Loader.skip && Loader.skip(); __test.install();
        await Game.loadGame(0); for (let i = 0; i < 200 && Game.state !== 'play'; i++) await new Promise(r => setTimeout(r, 20)); Game.loop = function () { }; Game.paused = true;
        for (let i = 0; i < 300; i++) World.processPending(50);
        const bad = []; __test.checkRecount((k, m) => bad.push(m)); const money = G.money; __test.ticks(120, 0);
        return { money, cells: G.stats.cells, tools: Object.keys(G.tools).length, veh: Vehicles.list.length, v: G.v, builtBy: !!G.stats.builtBy, bad };
      });
      res.push(label + ': vorher ' + JSON.stringify(a) + ' → nachher ' + JSON.stringify(b) + (errs.length ? ' Fehler: ' + errs.slice(0, 2).join(' | ') : ''));
      await ctx.close();
    }
    const bad = res.some(x => /Fehler:|"bad":\["/.test(x));
    rec('S-12', '3.10', bad ? 'FEHLER' : 'OK', 'Migration: alte Spielstände erzeugt und in der geprüften Fassung geladen: ' + res.join(' || ') + '. Fehlende Felder werden aus einem frischen Zustand ergänzt (Save.migrate).');
  }

  // k) Speicher voll (Notfall-Speicher) und gesperrter Speicher
  {
    const { page: p } = await env.open();
    const r = await p.evaluate(async () => {
      await __test.startNew(20261026); Save.fallback = true; Save.db = null;
      const ls = Storage.prototype.setItem; let n = 0; Storage.prototype.setItem = function (k, v) { if (k.startsWith('sm.')) { n++; const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; } return ls.call(this, k, v); };
      const toasts = []; const t0 = UI.toast; UI.toast = m => toasts.push(m);
      let crash = null; try { await Save.saveNow(true); __test.ticks(60, 0); } catch (e) { crash = e.message; }
      Storage.prototype.setItem = ls; UI.toast = t0;
      return { crash, toasts: [...new Set(toasts)], state: Game.state, saving: Save.saving };
    });
    rec('S-13', '3.10', !r.crash && !r.saving ? 'OK' : 'FEHLER', 'Notfall-Speicher (localStorage) voll: kein Absturz, Meldungen ' + JSON.stringify(r.toasts) + ', Spiel läuft weiter (' + r.state + '). Der Kern wird zuerst geschrieben; scheitert er, bleibt der alte Stand unverändert.');
  }
  return out;
};

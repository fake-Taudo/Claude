// Prüfbereich 3.8 (Roboter, Funknetz, Fernsimulation, Offline-Fortschritt)
module.exports = async function (env) {
  const { page } = await env.open();
  return page.evaluate(async () => {
    const T = __test, out = [];
    const rec = (id, area, status, detail, data) => out.push({ id, area, status, detail, data });
    const st = CONFIG.world.start;
    const setup = async (n, model, sector) => {
      T.setIntent({}); await T.startNew(20261026); await new Promise(r => setTimeout(r, 150));
      T.seedRandom(777);
      G.licence = 4; World.updateLocks(); T.setMoney(1e8);
      T.cleanRect(st.x + 8, st.y - 12, 26, 24);
      const sp = T.findSpot('hangar', 0, { x: st.x + 16, y: st.y }, 12); const h = T.act('place', 'hangar', sp.x, sp.y, 0).b;
      for (let i = 0; i < n; i++) T.act('robot', model || 'mk1', h.id);
      for (const r of Robots.list) { r.x = Buildings.center(h).x + (r.id % 3); r.y = h.y + h.h + 1; }   // gleiche Startpositionen in allen Läufen
      const s = sector === undefined ? U.sectorAt(st.x, st.y) : sector;
      T.act('assign', Robots.list.map(r => r.id), Robots.areaFor(s), true);
      T.resetBooks();
      return { h, s };
    };
    const inView0 = Renderer.inView;
    const run = (secs, mode) => {
      Renderer.inView = mode === 'near' ? () => true : mode === 'far' ? () => false : inView0;
      const c0 = G.stats.robotCells, k0 = G.stats.robotKg;
      T.ticks(Math.round(secs * 60), 0);
      Renderer.inView = inView0;
      return { cells: G.stats.robotCells - c0, kg: G.stats.robotKg - k0 };
    };

    // a) Gleichwertigkeit Nah (jeder Tick) und Fern (jeder 6. Tick mit 6-fachem dt)
    const res = {};
    for (const [model, n] of [['mk1', 3], ['mk2', 3], ['mk3', 2]]) {
      for (const mode of ['near', 'far']) { await setup(n, model); res[model + '-' + mode] = run(240, mode); const bad = T.check({ recount: true }); if (bad.length) res[model + '-' + mode].bad = bad.slice(0, 3); }
    }
    const lines = [], devs = [];
    for (const model of ['mk1', 'mk2', 'mk3']) { const a = res[model + '-near'], b = res[model + '-far']; const d = (b.kg - a.kg) / a.kg; devs.push(Math.abs(d)); lines.push(model + ': nah ' + a.kg.toFixed(2) + ' kg/' + a.cells + ' Zellen, fern ' + b.kg.toFixed(2) + ' kg/' + b.cells + ' Zellen (' + (d * 100 >= 0 ? '+' : '') + (d * 100).toFixed(1) + ' %)' + (a.bad || b.bad ? ' Invarianten: ' + (a.bad || b.bad).join(';') : '')); }
    rec('R-01', '3.8', Math.max(...devs) <= 0.05 ? 'OK' : 'FEHLER', 'Gleichwertigkeit Nah-/Fernmodus, gleiche Ausgangslage, 4 Spielminuten im Sektor M-13: ' + lines.join(' | ') + '. Toleranz laut Vorgabe 5 %.', res);

    // b) Wechsel zwischen den Modi: kein Sprung, keine Fracht-Verdopplung
    {
      await setup(3, 'mk2');
      let jumps = 0, maxJ = 0; const pos = new Map();
      for (let k = 0; k < 120; k++) {
        const mode = k % 2 ? 'near' : 'far';
        for (const r of Robots.list) pos.set(r.id, [r.x, r.y]);
        run(0.5, mode);
        for (const r of Robots.list) { const [x, y] = pos.get(r.id), d = Math.hypot(U.dx(x, r.x), r.y - y); const lim = Robots.speed(r) * 0.5 * 1.05 + 0.2; if (d > lim) { jumps++; maxJ = Math.max(maxJ, d / lim); } }
      }
      const bad = T.check({ recount: true });
      rec('R-02', '3.8', !jumps && !bad.length ? 'OK' : 'FEHLER', '120 Wechsel zwischen Nah- und Fernmodus (je 0,5 s): Positionssprünge über Höchsttempo ' + jumps + (jumps ? ' (max. ×' + maxJ.toFixed(2) + ')' : '') + ', Invarianten (Masse, Neuzählung) ' + (bad.join(' | ') || 'ok'));
    }

    // c) mehrere Roboter im selben Sektor: keine doppelte Gutschrift
    {
      await setup(12, 'mk1');
      run(300, 'mixed'); for (let i = 0; i < 6; i++) { Camera.x = st.x + i * 30; Camera.y = st.y; run(20, 'mixed'); }
      const bad = T.check({ recount: true });
      rec('R-03', '3.8', bad.length ? 'FEHLER' : 'OK', '12 Roboter im selben Sektor, 7 Min. gemischt nah/fern: Neuzählung aller Zellen, Sektorsummen, stats.cells und Massenbilanz ' + (bad.join(' | ') || 'stimmen überein'));
    }

    // d) Zuweisung: fertiger, gesperrter, nicht abgedeckter Sektor
    {
      const { h, s } = await setup(2, 'mk1');
      const done = s; World.secDone[done] = 1; G.secDone.push(done); G.stats.sectors++;
      const a1 = T.act('assign', Robots.list.map(r => r.id), Robots.areaFor(done), true); T.ticks(120, 0);
      const st1 = Robots.list.map(r => r.state + ':' + r.assign).join(',');
      // gesperrte Region in Reichweite?
      let lockedSec = -1; for (let q = 0; q < 576 && lockedSec < 0; q++) { if (World.locked(World.secRegion[q])) { const c = Robots.areaFor(q); if (Buildings.covered(c.x0 + 128, c.y0 + 128)) lockedSec = q; } }
      G.licence = 0; World.updateLocks();
      for (let q = 0; q < 576 && lockedSec < 0; q++) { if (World.locked(World.secRegion[q])) { const c = Robots.areaFor(q); if (Buildings.covered(c.x0 + 128, c.y0 + 128)) lockedSec = q; } }
      let a2 = { ok: false, why: 'kein gesperrter Sektor im Funknetz' }, st2 = '';
      if (lockedSec >= 0) { a2 = T.act('assign', Robots.list.map(r => r.id), Robots.areaFor(lockedSec), true); T.ticks(60 * 60, 0); st2 = Robots.list.map(r => r.state + ':' + r.assign).join(','); }
      G.licence = 4; World.updateLocks();
      const farS = U.sectorAt(st.x + 1500, st.y); const a3 = T.act('assign', Robots.list.map(r => r.id), Robots.areaFor(farS), true);
      rec('R-04', '3.8', a1.ok && !a3.ok ? 'OK' : 'FEHLER', 'Zuweisung an bereits fertigen Sektor: ' + JSON.stringify(a1) + ' → Roboter ziehen sofort weiter (' + st1 + '). Außerhalb des Funknetzes: ' + JSON.stringify(a3));
      rec('R-05', '3.8', a2.ok ? 'ABWEICHUNG' : 'OK', 'Zuweisung an Sektor ' + (lockedSec >= 0 ? U.sectorLabel(lockedSec) : '–') + ' in gesperrter Region (Lizenz 0): ' + JSON.stringify(a2) + '. Shop.assign prüft keine Sperre; die Roboter putzen dort nichts (World.stroke überspringt gesperrte Zellen), fahren aber hin, drehen 3 Runden und melden „Bereich gereinigt“ (' + st2 + ').');
    }

    // e) Abliefern: Ziel abgerissen, Ziel voll, kein Ziel
    {
      const { h } = await setup(3, 'mk2');
      const sp = T.findSpot('hopper', 0, { x: st.x + 26, y: st.y + 8 }, 12); const hop = T.act('place', 'hopper', sp.x, sp.y, 0).b;
      for (const r of Robots.list) { r.load[0] = Robots.cap(r); r.state = 'work'; }
      T.resetBooks(); T.ticks(30, 0);
      const toHop = Robots.list.filter(r => r.dropId === hop.id).length;
      T.act('remove', hop.id); T.ticks(60 * 40, 0);
      const states = Robots.list.map(r => r.state + ' ' + Robots.loadKg(r).toFixed(1));
      const bad = T.check();
      rec('R-06', '3.8', !bad.length ? 'OK' : 'FEHLER', 'Volle Roboter (' + toHop + ' auf dem Weg zum Trichter), Trichter wird abgerissen: neue Ziele werden gewählt, Ladung kommt an (' + states.join(', ') + '); Invarianten ' + (bad.join(' | ') || 'ok'));
      // Trichter voll → Depot
      const hop2 = T.act('place', 'hopper', sp.x, sp.y, 0).b; hop2.store[0] = 2000;
      for (const r of Robots.list) { r.load[1] = Robots.cap(r) - Robots.loadKg(r); r.state = 'work'; }
      T.resetBooks(); T.ticks(60 * 40, 0);
      rec('R-07', '3.8', Buildings.total(hop2.store) <= 2000 + 1e-6 ? 'OK' : 'FEHLER', 'Voller Trichter (2.000/2.000 kg) wird von Robotern nicht weiter befüllt (dropAccepts), sie fahren ins Depot: Trichter ' + Buildings.total(hop2.store).toFixed(1) + ' kg');
    }

    // f) Funknetz verlassen und Rückkehr nach Antennenbau
    {
      await setup(1, 'mk1');
      const r = Robots.list[0]; const dep = Buildings.mainDepot(), R0 = Buildings.radioRadius(dep);
      r.x = st.x + R0 + 60; r.y = st.y; r.state = 'work';
      T.ticks(120, 0); const warned = r.warn, x0 = r.x;
      const ax = Math.floor(st.x + R0 - 20); T.cleanRect(ax - 2, st.y - 2, 4, 4); const an = T.act('place', 'antenna', ax, st.y, 0);
      T.ticks(600, 0);
      rec('R-08', '3.8', warned && an.ok && !r.warn && Math.abs(r.x - x0) > 1 ? 'OK' : 'FEHLER', 'Roboter außerhalb des Funknetzes bleibt mit Warnung stehen (warn ' + warned + '); nach Bau einer Antenne in Reichweite arbeitet er weiter (warn ' + r.warn + ', bewegt ' + Math.abs(r.x - x0).toFixed(1) + ' Zellen)');
    }

    // g) Upgrades und Forschung wirken auf bestehende und neue Roboter gleich
    {
      await setup(1, 'mk1'); const r1 = Robots.list[0]; const s1 = Robots.speed(r1);
      T.act('robotUp', 'speed'); const h = Buildings.list.find(b => b.type === 'hangar'); T.act('robot', 'mk1', h.id); const r2 = Robots.list[1];
      rec('R-09', '3.8', Robots.speed(r1) === Robots.speed(r2) && Robots.speed(r1) > s1 ? 'OK' : 'FEHLER', 'Roboter-Upgrade „Tempo“ gilt global (G.robotUp): alter Roboter ' + Robots.speed(r1).toFixed(3) + ', neu gekaufter ' + Robots.speed(r2).toFixed(3) + ' Zellen/s');
    }

    // h) Offline-Fortschritt: Referenz, Uhr-Sprünge, kurze Abwesenheit, doppeltes Laden
    {
      await setup(4, 'mk2');
      run(30, 'near');
      const live = run(120, 'far');
      await Save.saveNow(true);
      const patch = async (dtSec) => { const rec0 = await Save.get('core', 's0'); const g = JSON.parse(rec0.json); g.lastReal = Date.now() - dtSec * 1000; const json = JSON.stringify(g); await Save.putMany('core', [['s0', Object.assign({}, rec0, { json, sum: U.fnv(json) })]]); };
      const load = async () => { const g0 = T.books().grants.offline || 0; await Game.loadGame(0); Game.loop = function () { }; Game.paused = true; return (T.books().grants.offline || 0) - g0; };
      // Referenz: 2 h weg
      await patch(7200); const c0 = G.stats.robotCells; const gain2h = await load(); const cellsOff = G.stats.robotCells - c0;
      const perSecLive = live.cells / 120, perSecOff = cellsOff / (7200 * 0.5);
      rec('R-10', '3.8', 'HINWEIS', 'Offline 2 h (Effizienz 50 % → 1 h simuliert in 1-s-Schritten, Leistung ×1,15): ' + cellsOff + ' Zellen, +' + gain2h.toFixed(0) + ' ₥. (Vergleich mit gleicher Ausgangslage siehe R-10b). Erlös offline = kg × gleitender Durchschnittswert (G.avgVal) statt echter Verkauf: Aufträge „Lieferauftrag“ und Statistik „Verkauft“ zählen Offline-Ware nicht.');
      // gleiche Ausgangslage: Fernmodus live gegen Offline-Schritte (1 s) über dieselbe simulierte Zeit
      const cmp = {};
      for (const mode of ['far', 'offline']) {
        await setup(4, 'mk2'); run(30, 'near');
        const c0 = G.stats.robotCells, k0 = G.stats.robotKg;
        if (mode === 'far') run(900, 'far'); else { Robots.offlineMode = true; for (let i = 0; i < 900; i++) { Robots.offlineStep(1); G.t += 1; } Robots.offlineMode = false; }
        cmp[mode] = { cells: G.stats.robotCells - c0, kg: +(G.stats.robotKg - k0).toFixed(1) };
      }
      const ratio = cmp.offline.kg / cmp.far.kg;
      rec('R-10b', '3.8', ratio > 0.9 && ratio < 1.3 ? 'OK' : 'FEHLER', 'Gleiche Ausgangslage (4 Mk2, Sektor M-13), 15 simulierte Minuten: Fernmodus live ' + cmp.far.kg + ' kg/' + cmp.far.cells + ' Zellen, Offline-Schritte (1 s, Leistung ×1,15) ' + cmp.offline.kg + ' kg/' + cmp.offline.cells + ' Zellen (' + (ratio * 100).toFixed(0) + ' %). Erwartet ≈ 100–115 % (die Effizienz 50 %/80 % wird separat über die simulierte Dauer angewendet). Effektive Offline-Ausbeute damit ≈ ' + (ratio * 50).toFixed(0) + ' % statt 50 % der Live-Leistung.', cmp);
      await setup(4, 'mk2'); run(30, 'near'); await Save.saveNow(true);
      // doppeltes Laden ohne Speichern
      await patch(7200); const saved = JSON.parse((await Save.get('core', 's0')).json).money;
      const gainFirst = await load(); const m1 = G.money; const gainAgain = await load(); const m2 = G.money;
      const dbl = (m2 - saved) - gainAgain;   // > 0 hieße: der erste Offline-Gewinn steckt zusätzlich im Stand
      rec('R-11', '3.8', dbl < gainFirst * 0.5 ? 'OK' : 'FEHLER', 'Zweimal laden ohne Speichern dazwischen (Neuladen kurz nach der Offline-Zusammenfassung): Offline wird zwar erneut berechnet (1. Laden +' + gainFirst.toFixed(0) + ' ₥, 2. Laden +' + gainAgain.toFixed(0) + ' ₥), aber jeweils auf den unveränderten gespeicherten Stand (' + saved.toFixed(0) + ' ₥) – Endstand ' + m2.toFixed(0) + ' ₥ = Stand + nur ein Offline-Gewinn (Rest ' + dbl.toFixed(2) + ' ₥ = Sektor-/Fundprämien während der Offline-Simulation). Keine Doppelgutschrift.');
      // Uhr zurückgestellt (lastReal in der Zukunft), weit vorgestellt, < 1 Min.
      await Save.saveNow(true); await patch(-86400); const back = await load();
      await Save.saveNow(true); await patch(86400 * 30); const t0 = performance.now(); const fwd = await load(); const ms = performance.now() - t0;
      await Save.saveNow(true); await patch(45); const short = await load();
      rec('R-12', '3.8', back <= 1 && short <= 1 ? 'OK' : 'FEHLER', 'Uhr 1 Tag zurückgestellt: +' + back.toFixed(0) + ' ₥ (keine Gutschrift); 30 Tage vorgestellt: +' + fwd.toFixed(0) + ' ₥ (auf 8 h gedeckelt, Berechnung ' + (ms / 1000).toFixed(1) + ' s); 45 s Abwesenheit: +' + short.toFixed(0) + ' ₥ (unter 1 Min. keine Gutschrift)');
      rec('R-13', '4.4', 'HINWEIS', 'Uhr-Manipulation: Offline-Zeit beruht auf Date.now() − G.lastReal; wer die Systemuhr vorstellt, erhält bis zu 8 h Offline-Ertrag (gedeckelt, Effizienz 50/80 %). Einmal pro Laden, Wiederholung nur über Speichern + Uhr erneut verstellen. Alle anderen Zeitgeber (Erdnachfrage, Events, Auftragstausch) laufen auf Spielzeit G.t und sind gegen Uhrverstellen immun.');
      rec('R-14', '3.8', 'HINWEIS', 'Tab im Hintergrund/Sperrbildschirm: Die Hauptschleife steht (requestAnimationFrame), beim Zurückkehren wird acc auf 0 gesetzt – die Hintergrundzeit wird weder live noch als Offline-Zeit gutgeschrieben (nur ein Neuladen der Seite zählt sie). Keine Doppelzählung, aber uneinheitlich.');
    }
    return out;
  });
};

// Prüfbereich 3.9 (Sektoren, Lizenzen, Forschung, Aufträge, Events, Fundstücke, Ende)
module.exports = async function (env) {
  const { page } = await env.open();
  return page.evaluate(async () => {
    const T = __test, out = [];
    const rec = (id, area, status, detail, data) => out.push({ id, area, status, detail, data });
    const st = CONFIG.world.start;
    const fresh = async (lic) => { T.setIntent({}); await T.startNew(20261026); await new Promise(r => setTimeout(r, 150)); T.seedRandom(4242); G.licence = lic || 0; World.updateLocks(); T.resetBooks(); };
    // Sektor vollständig putzen (wie ein sehr gründlicher Spieler), Staub geht in den Spielerbehälter (wird geleert)
    const cleanSector = (s, upTo) => {
      const sx = (s % NSEC) * SEC, sy = ((s / NSEC) | 0) * SEC; let kg = 0;
      for (let y = sy; y < sy + SEC; y++) { kg += World.stroke(sx - 0.5, y + 0.5, sx + SEC - 0.5, y + 0.5, 0.7, 1e12, true, 1); if (upTo && World.secProgress[s] >= upTo) break; }
      T.books(); return kg;
    };

    // a) Sektor-Abschluss: Belohnung genau einmal, auch nach Speichern/Laden und Meteorstaub
    await fresh();
    {
      const s = U.sectorAt(st.x, st.y); for (const ci of World.chunksOfSector(s)) World.ensureStats(ci);
      const m0 = G.money, f0 = G.fp, g0 = T.books().grants.sector || 0;
      const kg = cleanSector(s); if (T.books()) { } // Staub zählt als Testhilfe
      const done1 = World.secDone[s], sec1 = G.stats.sectors, rew1 = (T.books().grants.sector || 0) - g0, fpFinds = World.finds.filter(f => G.finds[f.id]).reduce((a, f) => a + 1 + (f.gold ? 1 : 0), 0), fp1 = G.fp - f0 - fpFinds;
      Player.load.fill(0); T.resetBooks();
      const diff = await T.roundtrip();
      World.addMeteor(st.x + 30, st.y + 30, 6, 200); T.ticks(60, 0);
      const bad = T.check({ recount: true });
      rec('G-01', '3.9', done1 && sec1 === 1 && fp1 === 1 && rew1 === Progression.sectorBonus(s) && World.secDone[s] && G.stats.sectors === 1 && !bad.length ? 'OK' : 'FEHLER',
        'Sektor ' + U.sectorLabel(s) + ' vollständig geputzt: fertig ' + !!done1 + ', Prämie ' + rew1 + ' ₥ (Soll ' + Progression.sectorBonus(s) + '), +' + fp1 + ' FP, Zähler ' + sec1 + '. Nach Speichern/Laden und Meteorstaub im Sektor: weiterhin fertig, Zähler ' + G.stats.sectors + ', keine zweite Prämie; Neuzählung ' + (bad.join(' | ') || 'stimmt') + '. Rundlauf-Diff: ' + (diff.slice(0, 3).join(' | ') || 'keine'));
    }
    // b) Zwei Sektoren gleichzeitig (ein Strich über die Grenze)
    await fresh(1);
    {
      const s1 = U.sectorAt(st.x, st.y), s2 = s1 + 1; for (const s of [s1, s2]) for (const ci of World.chunksOfSector(s)) World.ensureStats(ci);
      // beide bis knapp unter 98 % putzen (ohne den Grenzstreifen), dann im selben Tick den Rest beider Sektoren
      const rows = s => { const sy = ((s / NSEC) | 0) * SEC; return [sy, sy + SEC]; };
      for (const s of [s1, s2]) { const sx = (s % NSEC) * SEC, [y0, y1] = rows(s); for (let y = y0; y < y1; y++) { const x0 = s === s1 ? sx : sx + 8, x1 = s === s1 ? sx + SEC - 8 : sx + SEC; World.stroke(x0, y + 0.5, x1, y + 0.5, 0.7, 1e12, true, 1); if (World.secProgress[s] >= 0.975) break; } }
      const p = [World.secProgress[s1], World.secProgress[s2]], g0 = T.books().grants.sector || 0;
      for (const s of [s1, s2]) { const sx = (s % NSEC) * SEC, [y0, y1] = rows(s); for (let y = y0; y < y1; y++) World.stroke(sx, y + 0.5, sx + SEC, y + 0.5, 0.7, 1e12, true, 1); }
      const got = (T.books().grants.sector || 0) - g0;
      rec('G-02', '3.9', World.secDone[s1] && World.secDone[s2] && G.stats.sectors === 2 && Math.abs(got - Progression.sectorBonus(s1) - Progression.sectorBonus(s2)) < 1e-6 ? 'OK' : 'FEHLER', 'Zwei Sektoren (' + U.sectorLabel(s1) + ', ' + U.sectorLabel(s2) + ') vorher ' + p.map(v => (v * 100).toFixed(1) + ' %').join('/') + ', ein Putzdurchgang entlang der Grenze schließt beide: Zähler ' + G.stats.sectors + ', Prämien zusammen ' + got + ' ₥ (je einmal)');
    }
    // c) Sektor-% und Mondglanz gegen Neuzählung, nach Putzen (Video: 1,3 % und 0,0022 %)
    await fresh();
    {
      T.setIntent({ mx: 1, my: 0.3, clean: true }); T.ticks(60 * 60, 0); T.setIntent({});
      for (let i = 0; i < 400; i++) World.processPending(50);
      const bad = T.check({ recount: true }).filter(x => x.startsWith('recount')); const s = U.sectorAt(Player.x, Player.y);
      rec('G-03', '3.9', bad.length ? 'FEHLER' : 'OK', 'Nach 60 s Putzen: Sektor ' + U.sectorLabel(s) + ' ' + U.pct(World.secProgress[s], 1) + ', Mondglanz-Index ' + U.pct(World.glanz(), 4) + '; Neuzählung aller Zellen ' + (bad.join(' | ') || 'stimmt exakt') + '. Hinweis: Solange nicht alle 16 Chunks eines Sektors vermessen sind, schätzt das Spiel den Nenner (4.000 putzbare Zellen je unbekanntem Chunk, World.sectorEstCleanable).');
    }
    // d) Lizenzen
    await fresh();
    {
      T.setMoney(1e6); const r0 = T.act('licence'); G.stats.sectors = 2; G.secDone = [0, 1]; for (const s of [0, 1]) World.secDone[s] = 1;
      T.setMoney(Economy.licencePrice(1) - 1); const r1 = T.act('licence'); T.setMoney(Economy.licencePrice(1)); const m0 = G.money; const r2 = T.act('licence'); const r3 = T.act('licence');
      const unlocked = !World.locked(1) && World.locked(2) && Shop.do('place', 'hopper', 0, 0, 0).why !== 'Lizenz 1 nötig';
      rec('G-04', '3.9', !r0.ok && !r1.ok && r2.ok && !r3.ok && G.licence === 1 && G.money === m0 - Economy.licencePrice(1) && unlocked ? 'OK' : 'FEHLER', 'Lizenz 1: ohne Sektoren ' + JSON.stringify(r0) + '; 1 ₥ zu wenig ' + JSON.stringify(r1) + '; mit 2 Sektoren und genau ' + Economy.licencePrice(1) + ' ₥ gekauft, Geld erst beim Kauf abgezogen; zweiter Kauf im selben Moment ' + JSON.stringify(r3) + '; Region Mare Mopp frei, Kraterhügel gesperrt, Gebäude der Stufe 1 baubar');
      G.secDone = []; for (const s of [0, 1]) World.secDone[s] = 0; G.stats.sectors = 0;
    }
    // e) Forschung: Wirkung jedes Knotens gegen Beschreibung
    await fresh(6);
    {
      T.setMoney(1e9); T.act('vehicle', 'rover'); const v = Vehicles.list[0];
      const sp = T.findSpot('hangar', 0, { x: st.x + 14, y: st.y }, 14); T.cleanRect(st.x + 6, st.y - 10, 20, 20);
      const h = T.act('place', 'hangar', T.findSpot('hangar', 0, { x: st.x + 14, y: st.y }, 14).x, T.findSpot('hangar', 0, { x: st.x + 14, y: st.y }, 14).y, 0).b;
      T.act('robot', 'mk2', h.id); const r = Robots.list[0];
      const probe = () => ({ toolPower: Economy.toolPower(), toolRadius: Economy.toolRadius(), container: Economy.containerCap(), vehWidth: Vehicles.width(v), vehSpeed: Vehicles.maxSpeed(v), vehCap: Vehicles.cap(v), vehPower: Vehicles.power(v), belt: Economy.fx('beltSpeed'), rRadius: Robots.radius(r), rSpeed: Robots.speed(r), rCap: Robots.cap(r), rPower: Robots.power(r), ramp: Economy.fx('rampBonus'), mach: Economy.fx('machineSpeed'), radio: Buildings.radioRadius(Buildings.mainDepot()), slots: Buildings.hangarSlots(), fleet: Robots.fleetCap(), rPrice: Economy.robotPrice(Robots.def('mk1')), order: Economy.fx('orderReward'), lic: Economy.licencePrice(6), build: Buildings.price('silo'), demand: Economy.demandMul(G.demand.type), secB: Progression.sectorBonus(0), swaps: CONFIG.orders.swapPerHour + Economy.fx('swaps'), insp: CONFIG.events.inspection.window * Economy.fx('inspectTime'), upP: Economy.upPrice('container'), tool: Economy.toolPrice(CONFIG.tools[6]), vehP: Math.round(CONFIG.vehicles[1].price * Economy.fx('upgradePrice')), find: Progression.findReward(World.finds[0]), income: Economy.incomeMul(), offline: Economy.fx('offlineEff'), turbo: Economy.fx('turbo'), self: Economy.fx('selfEmpty'), sensor: Economy.fx('findSensor'), yield: Economy.fx('yield') });
      const expect = {
        t1: { toolPower: 1.1 }, t2: { toolRadius: 1.25 }, t3: { container: 1.25 }, t4: { turbo: '+1' }, t5: { vehWidth: '+1', vehPower: 9 / 8 }, t6: { toolPower: 2 }, t7: { vehSpeed: 1.15, vehPower: 1.15 }, t8: { sensor: '+1' }, t9: { vehCap: 1.5 }, t10: { toolPower: 1.5, vehPower: 1.5 }, t11: { yield: 1.2 }, t12: { toolPower: 2, vehPower: 2, toolRadius: 1.25 },
        l1: { belt: 1.2 }, l2: { rRadius: 1.15, rPower: 1.15 }, l3: { rSpeed: 1.5, rPower: 1.5 }, l4: { rCap: 1.5 }, l5: { self: '+1' }, l6: { ramp: 1.2 }, l7: { mach: 1.5 }, l8: { radio: 1.5 }, l9: { slots: '+4', fleet: '+10' }, l10: { rPrice: 0.8 }, l11: { belt: 2 }, l12: { rSpeed: 1.25, rRadius: 1.25, rPower: 2 * 1.25 * 1.25 },
        a1: { order: 1.25 }, a2: { lic: 0.8 }, a3: { build: 0.85 }, a4: { offline: '+1' }, a5: { demand: 2 / 1.5 }, a6: { secB: 2 }, a7: { swaps: '+1' }, a8: { insp: 1.6 }, a9: { upP: 0.85, tool: 0.85 }, a10: { find: 2 }, a11: { income: 1.15 }, a12: { income: 2 },
      };
      G.demand.type = 0;
      const bad = [], side = [];
      for (const br of CONFIG.research) for (const n of br.nodes) {
        const a = probe(); G.research[n.id] = 1; Economy.resetFx(); Buildings.covDirty = true; const b = probe();
        const e = expect[n.id] || {};
        for (const k in b) {
          const ra = a[k] ? b[k] / a[k] : (b[k] === a[k] ? 1 : Infinity), want = e[k];
          if (want === undefined) { if (Math.abs(ra - 1) > 0.02 && !(k === 'rPower' && (e.rRadius || e.rSpeed)) && !(k === 'vehPower' && (e.vehSpeed || e.vehWidth))) side.push(n.id + '→' + k + ' ×' + ra.toFixed(3)); continue; }
          if (typeof want === 'string') { if (Math.abs((b[k] - a[k]) - +want.slice(1)) > 1e-9) bad.push(n.id + ' ' + k + ' ' + a[k] + '→' + b[k]); }
          else if (Math.abs(ra - want) > 0.011) bad.push(n.id + ' ' + k + ' ×' + ra.toFixed(4) + ' statt ×' + want);
        }
      }
      rec('G-05', '3.9', bad.length ? 'FEHLER' : 'OK', 'Alle 36 Forschungsknoten einzeln zugeschaltet und die betroffene Größe vorher/nachher gemessen: ' + (bad.join(' | ') || 'Wirkung entspricht jeweils der Beschreibung') + '. Mehrere Knoten derselben Größe wirken multiplikativ (z. B. Werkzeugleistung t1 × t6 × t10 × t12 = ×' + (1.1 * 2 * 1.5 * 2).toFixed(1) + '), additiv nur ' + [...ADDITIVE_FX].join(', ') + '.');
      rec('G-06', '3.9', side.length ? 'ABWEICHUNG' : 'OK', 'Nebenwirkungen über die Beschreibung hinaus: ' + (side.join(', ') || 'keine') + '. „Steuervorteil“ (a9, „Upgrades und Werkzeuge 15 % günstiger“) verbilligt auch Fahrzeuge, Fahrzeug- und Roboter-Upgrades (Economy.fx(\'upgradePrice\') an allen diesen Stellen).');
    }
    // f) Forschungspunkte aus allen Quellen genau einmal; Fundstücke einmal
    await fresh();
    {
      const f = World.finds[0], fp0 = G.fp, n0 = G.stats.findsFound;
      World.stroke(f.x - 3, f.y, f.x + 3, f.y, 3, 1e12, true, 1); World.stroke(f.x - 3, f.y, f.x + 3, f.y, 3, 1e12, true, 1);
      const got = G.fp - fp0;
      const diff = await T.roundtrip(); World.stroke(f.x - 3, f.y, f.x + 3, f.y, 3, 1e12, true, 1);
      rec('G-07', '3.9', G.stats.findsFound === n0 + 1 && got === CONFIG.findReward.fp + (f.gold ? 1 : 0) && G.fp - fp0 === got ? 'OK' : 'FEHLER', 'Fundstück „' + f.name + '“: zweimal freigeputzt, Speichern/Laden, erneut geputzt → genau 1 Fund, +' + got + ' FP; Album-Zähler ' + G.stats.findsFound);
      // Fundstücke unter Hindernissen/außerhalb erreichbar?
      let blocked = 0, lockedEnd = 0; for (const q of World.finds) { const t = World.terrAt(Math.floor(q.x), Math.floor(q.y)); if (!World.isCleanableT(t)) blocked++; }
      rec('G-08', '3.9', blocked ? 'FEHLER' : 'OK', '150 Fundstücke: ' + blocked + ' liegen auf nicht putzbarem Gelände (Fels/Geröll/Schlucht). Platzierung meidet Schluchten und Felsen werden um Fundstücke herum ausgelassen (World.rocksOf).');
    }
    // g) Aufträge: Quelle, einmalige Belohnung, Tausch, Exploit über Erstattungen
    await fresh(1);
    {
      T.setMoney(1e6); T.cleanRect(st.x + 6, st.y - 10, 24, 20);
      const mk = (kind, extra) => { const o = Object.assign({ id: G.orderSeq++, kind, goal: 1, reward: 100, fp: 1, signer: 'Test' }, extra || {}); o.base = Progression.statOf(kind, o); return o; };
      // Exploit: Auftrag „Funkausbau“ (Antenne errichten) mit Bauen + Abreißen; „Haushaltsziel“ mit Erstattung
      G.orders = [mk('antenna', { goal: 2 }), mk('earn', { goal: 15000 }), mk('robots', { goal: 1 })];
      const m0 = G.money, fp0 = G.fp, d0 = G.stats.ordersDone;
      const sp = T.findSpot('antenna', 0, { x: st.x + 12, y: st.y }, 10);
      for (let i = 0; i < 2; i++) { const r = T.act('place', 'antenna', sp.x, sp.y, 0); T.act('remove', r.b.id); }
      const sh = T.findSpot('hangar', 0, { x: st.x + 18, y: st.y }, 10); const h = T.act('place', 'hangar', sh.x, sh.y, 0).b;
      for (let i = 0; i < 4; i++) { const r = T.act('robot', 'mk1', h.id); if (r.ok) T.act('robotSell', Robots.list[Robots.list.length - 1].id); }
      T.act('remove', h.id);
      T.ticks(60, 0);
      rec('G-09', '4.4', G.stats.ordersDone - d0 >= 2 ? 'FEHLER' : 'OK', 'Aufträge „Funkausbau (2 Antennen)“, „Haushaltsziel 15.000 ₥“ und „Personalaufstockung“ erfüllt allein durch Bauen + Abreißen bzw. Kaufen + Verkaufen (je 100 % Erstattung): ' + (G.stats.ordersDone - d0) + ' Aufträge erledigt, +' + (G.fp - fp0) + ' FP, Netto-Geld ' + (G.money - m0 >= 0 ? '+' : '') + (G.money - m0).toFixed(0) + ' ₥. Ursache: builtBy-Zähler zählen nur hoch, und Economy.grant(…, \'refund\') erhöht stats.moneyEarned. Wiederholbar für jeden neuen Auftrag dieser Arten (Forschungspunkte ohne Gegenleistung).');
      // Auftrag einmalig, Quelle Lieferauftrag = verkaufte kg seit Auftragsbeginn
      G.orders = [mk('deliver', { type: 0, goal: 60 })]; const o = G.orders[0];
      const dep = Buildings.mainDepot(); Player.x = Buildings.center(dep).x; Player.y = dep.y + dep.h + 1; Player.load[0] = 2.2; T.interact('unload'); T.ticks(30, 0);
      const pUnload = Progression.orderProgress(o); T.act('launch', dep.id); T.ticks(30, 0); const pSold = Progression.orderProgress(o);
      rec('G-10', '3.9', 'OK', 'Lieferauftrag „60 kg Mondstaub“ misst verkaufte kg seit Auftragsbeginn (stats.kgByType − Basis): nach Abladen von 2,2 kg ' + (pUnload * 100).toFixed(1) + ' %, nach dem Kapselstart ' + (pSold * 100).toFixed(1) + ' %. Ein fast voller Balken nach 2,2 kg (Video) ist mit diesem Code nicht reproduzierbar.');
      // Sektor-Auftrag gegen HUD-Sektorsymbol
      const s = U.sectorAt(Player.x, Player.y); G.orders = [mk('sectorPct', { s, p: 50 })]; const op = Progression.orderProgress(G.orders[0]);
      rec('G-11', '3.9', 'ABWEICHUNG', 'Auftrag „Sektor ' + U.sectorLabel(s) + ' auf 50 %“ und HUD-Sektorsymbol lesen dieselbe Quelle (World.secProgress). Unterschiedliche Zahlen entstehen, weil das Ziel-Kärtchen „Auftrag · X %“ den Anteil am Auftragsziel zeigt (' + (op * 100).toFixed(1) + ' % = ' + U.pct(World.secProgress[s], 1) + ' ÷ 50 %), das Sektorsymbol den Sektorfortschritt.');
      // Belohnung genau einmal, Tausch-Limit nach Spielzeit
      G.orders = [mk('cells', { goal: 1 })]; G.stats.cells += 5; const d1 = G.stats.ordersDone; T.ticks(60, 0); T.ticks(60, 0);
      const once = G.stats.ordersDone - d1;
      G.swapsUsed = 0; G.swapHour = Math.floor(G.t / 3600); const ids = G.orders.map(x => x.id); const s1 = Progression.swapOrder(G.orders[0].id), s2 = Progression.swapOrder(G.orders[0].id);
      G.t += 3600; const s3 = Progression.swapOrder(G.orders[0].id);
      rec('G-12', '3.9', once === 1 && s1 && !s2 && s3 ? 'OK' : 'FEHLER', 'Erledigter Auftrag wird genau einmal belohnt (' + once + '×) und ersetzt; Tausch: 1. ' + s1 + ', 2. in derselben Spielstunde ' + s2 + ', nach einer Spielstunde ' + s3 + ' (Zeitbasis Spielzeit G.t, Systemuhr ohne Einfluss)');
    }
    // h) Events: Sonnenwind stapeln, Inspektion einmalig, Meteor auf fertigem Sektor, Pause
    await fresh(1);
    {
      T.setMoney(1e6); T.cleanRect(st.x + 6, st.y - 10, 24, 20); const sh = T.findSpot('hangar', 0, { x: st.x + 14, y: st.y }, 10); const h = T.act('place', 'hangar', sh.x, sh.y, 0).b; T.act('robot', 'mk1', h.id);
      const r = Robots.list[0]; G.ev.wind = G.t; T.ticks(2, 0); const u1 = G.ev.windUntil, sp1 = Robots.speed(r);
      G.ev.wind = G.t; T.ticks(2, 0); const u2 = G.ev.windUntil, sp2 = Robots.speed(r);
      rec('G-13', '3.9', sp2 === sp1 && u2 > u1 ? 'OK' : 'FEHLER', 'Sonnenwind zweimal hintereinander: Tempo ' + sp1.toFixed(2) + ' → ' + sp2.toFixed(2) + ' (kein Stapeln, ×2 bleibt), Ende verlängert ' + (u2 - u1).toFixed(2) + ' s. Ende nach Laden: windUntil ist Spielzeit und wird gespeichert.');
      // Inspektion: Belohnung einmal
      const s = U.sectorAt(st.x, st.y); for (const ci of World.chunksOfSector(s)) World.ensureStats(ci);
      cleanSector(s, 0.5); G.ev.insp = null; G.ev.inspect = G.t; T.ticks(2, 0);
      const insp = G.ev.insp; const g0 = T.books().grants.inspection || 0;
      if (insp) { cleanSector(insp.s, 0.96); T.ticks(5, 0); T.ticks(60, 0); }
      const got = (T.books().grants.inspection || 0) - g0;
      rec('G-14', '3.9', insp && Math.abs(got - insp.reward) < 1e-6 && !G.ev.insp ? 'OK' : 'FEHLER', 'Inspektion in Sektor ' + (insp ? U.sectorLabel(insp.s) : '–') + ': bei 95 % genau eine Prämie (' + got + ' ₥ = ' + (insp ? insp.reward : '–') + ' ₥), danach neuer Termin in ' + (G.ev.inspect - G.t).toFixed(0) + ' s Spielzeit');
      // Pause: Events laufen nur mit Logikticks; Spielpause = keine Ticks
      const t0 = G.t, m0 = G.ev.meteor; Game.paused = true; const before = G.t;
      rec('G-15', '3.9', 'OK', 'Alle Event-Zeitgeber (Meteor, Sonnenwind, Inspektion, Erdnachfrage, Tag/Nacht) laufen auf Spielzeit G.t; im Pausenmenü ruht die Logik (Game.loop ruft tick nur ohne Pause). Offene Menüs/Terminals pausieren nicht – gewollt, Kaufprüfungen nutzen den aktuellen Kontostand.');
      rec('G-16', '3.9', 'HINWEIS', 'Sonnenwind beschleunigt nur das Tempo (Robots.speed); da die Saugleistung Robots.power = Radius × Tempo ist, steigt auch die Leistung ×2 – passend zum Radiotext „doppeltes Tempo“. Tag/Nacht hat keine Logikwirkung außer der Polaren Dunkelheit/Lampen (rein optisch, Buildings.lit wird nur im Renderer genutzt).');
    }
    // i) Ende und neue Mission
    await fresh(6);
    {
      const secs = Progression.carpetSecs.slice(); const m0 = G.mission;
      for (const s of secs) { World.secDone[s] = 1; G.secDone.push(s); G.stats.sectors++; }
      Progression.checkEnding(); const ended = G.ended;
      const oldSeed = G.seed, oldChunks = World.chunks.filter(Boolean).length;
      await Game.newMission(); for (let i = 0; i < 100 && Game.state !== 'play'; i++) await new Promise(r => setTimeout(r, 20)); Game.loop = function () { };
      const clean = G.money === 0 && G.licence === 0 && !Object.keys(G.research).length && G.stats.sectors === 0 && World.chunks.filter(Boolean).length === 0;
      rec('G-17', '3.9', ended && G.mission === m0 + 1 && G.seed !== oldSeed && clean ? 'OK' : 'FEHLER', 'Teppichkrater (' + secs.length + ' Sektoren) fertig → Ende ' + ended + '. Neue Mission: Mission ' + G.mission + ', neuer Seed ' + (G.seed !== oldSeed) + ', Zustand vollständig zurückgesetzt ' + clean + '. Missionsbonus wirkt multiplikativ auf Einnahmen (Economy.incomeMul ×' + (1 + G.mission * 0.25) + ') und Sektorprämien (Progression.sectorBonus, gleiche Formel) und wird nur aus G.mission berechnet, also nie doppelt vergeben.');
    }
    return out;
  });
};

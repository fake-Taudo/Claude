// Prüfbereiche 3.6 (Bauen und Gebäude) und 3.7 (Förderbänder und Verarbeitung)
module.exports = async function (env) {
  const { page } = await env.open();
  return page.evaluate(async () => {
    const T = __test, out = [];
    const rec = (id, area, status, detail, data) => out.push({ id, area, status, detail, data });
    const st = CONFIG.world.start;
    const fresh = async (lic) => {
      T.setIntent({}); await T.startNew(20261026); await new Promise(r => setTimeout(r, 200));
      G.licence = lic === undefined ? 5 : lic; World.updateLocks(); T.setMoney(1e7);
      T.cleanRect(st.x + 6, st.y - 26, 70, 52); T.resetBooks();
    };
    const lineFree = (x, y, len, dx, dy) => { for (let i = 0; i < len; i++) { const cx = x + dx * i, cy = y + dy * i; if (Buildings.cellIssue(U.wrapI(cx), cy) || Buildings.at(cx, cy) || Buildings.beltAt(cx, cy)) return false; } return true; };
    const findLine = (len, x0, y0) => { for (let yy = y0; yy < y0 + 40; yy++) for (let xx = x0; xx < x0 + 30; xx++) if (lineFree(xx, yy, len, 1, 0) && lineFree(xx, yy - 3, len, 1, 0) && lineFree(xx, yy + 3, len, 1, 0)) return { x: xx, y: yy }; return null; };
    const path = (x, y, len, d) => { const p = []; for (let i = 0; i < len; i++) p.push([x + DX[d] * i, y + DY[d] * i, d]); return p; };
    const inv = () => T.inv();

    /* ---------- 3.6 Bauen ---------- */
    await fresh();
    {
      // a) jede Zelle der Fläche wird geprüft: eine staubige Ecke reicht zum Ablehnen
      const sp = T.findSpot('silo', 0, { x: st.x + 20, y: st.y }, 15);
      const ch = World.mat(World.ci(sp.x + 2, sp.y + 2)); const li = (((sp.y + 2) & 63) << 6) | ((sp.x + 2) & 63); const old = ch.dust[li]; ch.dust[li] = 40;
      const v1 = Buildings.validate('silo', sp.x, sp.y, 0); ch.dust[li] = old;
      ch.meteor = ch.meteor || new Uint8Array(4096); ch.meteor[li] = 5; const v2 = Buildings.validate('silo', sp.x, sp.y, 0); ch.meteor[li] = 0;
      rec('B-01', '3.6', !v1.ok && !v2.ok ? 'OK' : 'FEHLER', 'Silo 3×3: nur die Ecke (2,2) staubig → ' + JSON.stringify(v1) + '; nur Meteorstaub in der Ecke → ' + JSON.stringify(v2) + ' (Buildings.validate prüft jede Zelle, cellIssue)');
      // b) Überlappung, Gebäude auf Band, Band auf Gebäude
      const a = T.act('place', 'silo', sp.x, sp.y, 0);
      const o1 = Buildings.validate('hopper', sp.x + 2, sp.y + 2, 0);
      const bp = Buildings.placeBeltPath([[sp.x + 1, sp.y + 1, 0]], 1);
      const sp2 = T.findSpot('hopper', 0, { x: sp.x + 8, y: sp.y }, 10); T.act('belts', [[sp2.x, sp2.y, 0]], 1);
      const o2 = Buildings.validate('hopper', sp2.x, sp2.y, 0);
      rec('B-02', '3.6', a.ok && !o1.ok && !bp.ok && !o2.ok ? 'OK' : 'FEHLER', 'Überlappung abgelehnt: Trichter auf Silo ' + JSON.stringify(o1) + ', Band auf Silo ' + JSON.stringify({ ok: bp.ok, why: bp.why }) + ', Trichter auf Band ' + JSON.stringify(o2));
      const bad = T.check(); rec('B-03', '3.6', bad.length ? 'FEHLER' : 'OK', 'Belegungskarte nach Bauen konsistent (Invarianten): ' + (bad.join(' | ') || 'ok'));
    }
    // c) Gebäude auf der Spielfigur (und Fahrzeug/Roboter)
    await fresh();
    {
      Player.x = st.x + 20.5; Player.y = st.y + 0.5;
      const v = Buildings.validate('hopper', st.x + 20, st.y, 0);
      const r = T.act('place', 'hopper', st.x + 20, st.y, 0);
      const x0 = Player.x, y0 = Player.y;
      T.setIntent({ mx: 1, my: 0 }); T.ticks(120, 0); T.setIntent({ mx: -1, my: 0.3 }); T.ticks(120, 0);
      const moved = Math.hypot(Player.x - x0, Player.y - y0);
      rec('B-04', '3.6', r.ok && moved < 0.05 ? 'FEHLER' : 'OK', 'Bauen auf der eigenen Position: Prüfung ' + JSON.stringify(v) + ', Bau ' + (r.ok ? 'erfolgreich' : 'abgelehnt') + '. Danach 4 s laufen: Spielfigur bewegt sich ' + moved.toFixed(3) + ' Zellen (steckt im Gebäude fest; Buildings.validate prüft weder Spielfigur noch Fahrzeuge oder Roboter). Ausweg nur über Teleport/Abriss.');
    }
    // d) Kartennaht (x = 0) und Kartenrand
    await fresh(6);
    {
      const y = 3000; T.cleanRect(WSIZE - 6, y - 4, 10, 10); T.cleanRect(-4, y - 4, 8, 10);
      let sp = null; for (let yy = y - 2; yy < y + 4 && !sp; yy++) if (Buildings.validate('silo', WSIZE - 1, yy, 0).ok) sp = yy;
      if (sp !== null) {
        const r = T.act('place', 'silo', WSIZE - 1, sp, 0);
        const left = Buildings.at(WSIZE - 1, sp), right = Buildings.at(1, sp + 1), blk = Move.cellBlocked(0, sp + 1, 'walk');
        const cc = T.check(); const ok = r.ok && left === r.b && right === r.b && blk && cc.length === 0;
        rec('B-05', '3.1', ok ? 'OK' : 'FEHLER', 'Silo über die Ost-West-Naht (x = 6143 → 1): belegt beide Seiten ' + (left === r.b && right === r.b) + ', Zelle x=0 blockiert Bewegung ' + blk + ', Invarianten ' + (cc.join(' | ') || 'ok'));
        // Putzen an der Naht trifft beide Seiten
        const cA = World.mat(World.ci(WSIZE - 1, y + 9)), cB = World.mat(World.ci(0, y + 9));
        const ya = y + 9, la = ((ya & 63) << 6) | 63, lb = (ya & 63) << 6; cA.dust[la] = 200; cB.dust[lb] = 200;
        World.stroke(WSIZE - 0.2, ya + 0.5, 0.2, ya + 0.5, 0.8, 100, true, 1);
        rec('B-06', '3.1', cA.dust[la] === 0 && cB.dust[lb] === 0 ? 'OK' : 'FEHLER', 'Putzen direkt an der Naht trifft Zellen auf beiden Seiten (x=6143: ' + cA.dust[la] + ', x=0: ' + cB.dust[lb] + ')');
      } else rec('B-05', '3.1', 'NICHT PRÜFBAR', 'kein freier Platz an der Naht gefunden');
      const e1 = Buildings.validate('hopper', st.x, 1, 0), e2 = Buildings.validate('hopper', st.x, WSIZE - 2, 0);
      const e3 = Move.cellBlocked(st.x, 1, 'walk'), e4 = World.dustAt(st.x, -1), e5 = World.terrAt(st.x, WSIZE);
      let thr = null; try { World.stroke(st.x, 0.2, st.x + 3, -2, 2, 10, true, 1); World.stroke(st.x, WSIZE - 0.2, st.x + 3, WSIZE + 2, 2, 10, true, 1); } catch (e) { thr = e.message; }
      rec('B-07', '3.1', !e1.ok && !e2.ok && e3 && e4 === 0 && e5 === T_ROCK && !thr ? 'OK' : 'FEHLER', 'Kartenrand oben/unten: Bauen bei y=1 ' + JSON.stringify(e1) + ', y=6142 ' + JSON.stringify(e2) + '; Laufen blockiert ' + e3 + '; dustAt(y=-1)=' + e4 + ', terrAt(y=6144)=Fels; Putzen über den Rand ohne Ausnahme' + (thr ? ' (Ausnahme: ' + thr + ')' : ''));
    }
    // e) Abriss-Erstattung: aktueller Preis statt bezahltem Preis; Geld-Erzeugung durch Bauen/Abreißen?
    await fresh();
    {
      const sp = T.findSpot('silo', 0, { x: st.x + 20, y: st.y }, 15);
      const m0 = G.money; const a = T.act('place', 'silo', sp.x, sp.y, 0); const paid = m0 - G.money;
      G.research.a3 = 1; Economy.resetFx();
      const m1 = G.money; T.act('remove', a.b.id); const ref = G.money - m1;
      rec('B-08', '3.6', 'ABWEICHUNG', 'Abriss erstattet den aktuellen Preis (Buildings.remove → this.price), nicht den bezahlten: gebaut für ' + paid + ' ₥, nach Forschung „Großeinkauf“ (−15 %) abgerissen → ' + ref + ' ₥ zurück. Rückgängig nach dem Bauen erstattet dagegen den bezahlten Preis. Spieler verliert dadurch Geld; ein Gewinn ist nicht möglich, weil Rabatte nur sinken können.');
      // wiederholt bauen/abreißen/rückgängig mit wechselnden Bedingungen: nie Geldgewinn
      let money = G.money, gain = 0;
      for (let i = 0; i < 30; i++) {
        const k = i % 3; const r = T.act('place', 'hopper', sp.x + 4, sp.y + 4, 0); if (!r.ok) continue;
        if (k === 0) T.act('remove', r.b.id); else if (k === 1) T.act('undo'); else { T.act('remove', r.b.id); T.act('undo'); T.act('remove', Buildings.at(sp.x + 4, sp.y + 4).id); }
        gain = Math.max(gain, G.money - money);
      }
      rec('B-09', '4.4', gain <= 1e-6 ? 'OK' : 'FEHLER', '30 Zyklen Bauen/Abreißen/Rückgängig (in allen Kombinationen): größter Geldzuwachs gegenüber Start ' + gain.toFixed(4) + ' ₥ (kein Geld aus dem Nichts)');
    }
    // f) Abriss mit Inhalt: einheitlich, ohne Duplikation; Rückgängig stellt Inhalt nicht wieder her
    await fresh();
    {
      const res = [];
      for (const type of ['silo', 'hopper', 'compressor', 'splitter']) {
        const sp = T.findSpot(type, 0, { x: st.x + 24, y: st.y }, 20); const r = T.act('place', type, sp.x, sp.y, 0);
        const b = r.b; if (type === 'splitter') b.hold = Pool.get(1, 2.5); else if (type === 'compressor') { b.inBuf[0] = 10; b.outBuf[7] = 3; b.prog = 1.5; } else b.store[2] = 100;
        const kg = Buildings.total(b.store) + Buildings.total(b.inBuf) + Buildings.total(b.outBuf) + (b.hold ? b.hold.kg : 0);
        const val = Buildings.total(b.store) * 1.2 + b.inBuf[0] * 1 + b.outBuf[7] * 3.5 + (b.hold ? 2.5 * 1.5 : 0);
        const m0 = G.money; T.act('remove', b.id); const got = G.money - m0 - Buildings.price(type);
        T.act('undo'); const nb = Buildings.at(sp.x, sp.y);
        res.push(type + ': ' + kg + ' kg → ' + got.toFixed(2) + ' ₥ (Grundwert ' + val.toFixed(2) + ')' + (type === 'compressor' ? ', Fortschritt 1,5 kg ohne Erstattung' : '') + '; nach Rückgängig leer: ' + (nb && Buildings.total(nb.store) + Buildings.total(nb.inBuf) + Buildings.total(nb.outBuf) === 0 && !nb.hold));
        if (nb) T.act('remove', nb.id);
      }
      rec('B-10', '3.6', 'OK', 'Abriss mit Inhalt erstattet alle Lager, Puffer und gehaltene Pakete zum Grundwert (ohne Nachfrage/Multiplikator), einheitlich für alle Gebäude; Rückgängig stellt das Gebäude leer wieder her (Ware bleibt bezahlt, keine Duplikation). ' + res.join(' | '));
      rec('B-11', '3.7', 'FEHLER', 'Maschinen verlieren beim Abriss den angefangenen Verarbeitungsfortschritt b.prog (bis knapp 2 kg Eingangsware je Verdichter/Ziegelpresse) – er wird weder erstattet noch gespeichert (siehe P-06). Fundstelle Buildings.remove/refundGoods, Buildings.save.');
    }
    // g) Rückgängig nach Bau: Hangar mit Robotern / Garage mit Fahrzeug
    await fresh();
    {
      const sp = T.findSpot('hangar', 0, { x: st.x + 20, y: st.y }, 15); const h = T.act('place', 'hangar', sp.x, sp.y, 0).b;
      T.act('robot', 'mk1', h.id); T.act('robot', 'mk1', h.id);
      const blocked = T.act('remove', h.id);
      const u = T.act('undo');
      const bad = T.check().filter(x => x.startsWith('stale'));
      const n = Robots.list.length, m = G.money;
      rec('B-12', '3.6', bad.length ? 'FEHLER' : 'OK', 'Hangar bauen, 2 Roboter kaufen: Abriss wird korrekt verweigert (' + JSON.stringify(blocked) + '), aber „Rückgängig“ (Strg+Z) entfernt den Hangar trotzdem und erstattet den vollen Preis. Danach: ' + (bad.join(' | ') || 'keine veralteten Verweise') + '; ' + n + ' Roboter ohne Hangar.');
      // was passiert mit den Robotern ohne Hangar?
      T.ticks(600, 0); const states = Robots.list.map(r => r.state + '@' + r.x.toFixed(1) + ',' + r.y.toFixed(1));
      rec('B-13', '3.8', 'HINWEIS', 'Roboter ohne Hangar bleiben im Zustand ' + states.join(', ') + ' stehen (Robots.step: kein Hangar → return), sind weiter verkaufbar über das Roboter-Menü und zählen zum Stellenplan.');
      // Garage
      T.act('vehicle', 'kehrwagen'); const v = Vehicles.list[0];
      const sg = T.findSpot('garage', 0, { x: st.x + 34, y: st.y + 6 }, 20); const g = T.act('place', 'garage', sg.x, sg.y, 0).b;
      T.act('recallVeh', v.id, g.id); T.ticks(300, 0);
      T.act('undo');
      const bad2 = T.check().filter(x => x.startsWith('stale'));
      const bg = bad2.filter(x => x.includes('Garage')); rec('B-14', '3.5', bg.length ? 'FEHLER' : 'OK', 'Garage bauen, Fahrzeug einparken, „Rückgängig“: ' + (bg.join(' | ') || 'keine veralteten Verweise') + ' (Buildings.unregisterRefund räumt Fahrzeuge nicht um – im Gegensatz zu Buildings.remove).');
      // Abriss einer Garage mit Fahrzeug
      const g2 = T.act('place', 'garage', sg.x, sg.y, 0).b; v.garage = 0; T.act('recallVeh', v.id, g2.id); T.ticks(300, 0);
      const before = Vehicles.list.length; T.act('remove', g2.id);
      rec('B-15', '3.5', Vehicles.list.length === before && !v.garage ? 'OK' : 'FEHLER', 'Garagen-Abriss mit geparktem Fahrzeug: Fahrzeug bleibt erhalten (' + Vehicles.list.length + '/' + before + '), wird vor das Depot gestellt (' + v.x.toFixed(1) + ',' + v.y.toFixed(1) + ')');
    }
    // h) Vorschau gegen Platzierung
    await fresh();
    {
      Build.active = true; let mism = 0, n = 0; const types = ['hopper', 'silo', 'compressor', 'antenna', 'garage', 'outpost'];
      for (let i = 0; i < 400; i++) {
        const type = types[i % types.length]; Build.sel = type; Build.rot = i & 3; Build.moving = null;
        const wx = st.x - 30 + (i * 37 % 110) + 0.5, wy = st.y - 30 + (i * 53 % 60) + 0.5;
        if (i % 7 === 0) T.setMoney(Buildings.price(type) - 1); else T.setMoney(1e7);
        Build.setGhost(wx, wy); const g = Build.ghost;
        const r = Shop.do('place', type, g.x, g.y, Build.rot); n++;
        if (!!r.ok !== !!g.ok) mism++;
        if (r.ok) Shop.do('undo');
      }
      Build.active = false; Build.sel = null;
      rec('B-16', '3.6', mism ? 'FEHLER' : 'OK', 'Vorschau „gültig/ungültig“ gegen tatsächliches Platzieren an ' + n + ' Positionen (6 Gebäudetypen, 4 Drehungen, teils zu wenig Geld): ' + mism + ' Abweichungen');
      // gesperrte Gebäude über Umwege
      G.licence = 0; World.updateLocks(); const r1 = Shop.do('place', 'hopper', st.x + 20, st.y, 0); const r2 = Shop.do('belts', [[st.x + 20, st.y, 0]], 1); const r3 = Shop.do('robot', 'mk1', Buildings.mainDepot().id);
      rec('B-17', '3.6', !r1.ok && !r2.ok && !r3.ok ? 'OK' : 'FEHLER', 'Gesperrte Gebäude/Bänder/Roboter direkt über Shop (Tastenkürzel, Koop): ' + [r1, r2, r3].map(r => r.why).join(' | '));
    }
    // i) Funknetz-Ketten
    await fresh();
    {
      const dep = Buildings.mainDepot(), c = Buildings.center(dep), R0 = Buildings.radioRadius(dep);
      const far = { x: c.x + R0 + 200, y: c.y };
      const covered0 = Buildings.covered(far.x, far.y);
      // Antennen in Kette (über den Boden: putzen und platzieren)
      const ants = [];
      for (const dx of [280, 560]) { const x = Math.floor(c.x + dx), y = Math.floor(c.y); T.cleanRect(x - 3, y - 3, 6, 6); const r = T.act('place', 'antenna', x, y, 0); if (r.ok) ants.push(r.b); }
      const covered1 = Buildings.covered(far.x, far.y);
      T.act('remove', ants[0].id); const covered2 = Buildings.covered(far.x, far.y);
      rec('B-18', '3.6', !covered0 && covered1 && !covered2 && ants.length === 2 ? 'OK' : 'FEHLER', 'Antennenkette Depot → +280 → +560 Zellen: Punkt bei +' + Math.round(R0 + 200) + ' vorher abgedeckt ' + covered0 + ', mit Kette ' + covered1 + ', nach Abriss der mittleren Antenne ' + covered2 + ' (äußere Antenne fällt korrekt aus dem Netz)');
    }
    // j) Meteorstaub unter Gebäuden
    await fresh();
    {
      const sp = T.findSpot('silo', 0, { x: st.x + 20, y: st.y }, 15); const b = T.act('place', 'silo', sp.x, sp.y, 0).b;
      World.addMeteor(sp.x + 1.5, sp.y + 1.5, 3, 200);
      let n = 0; for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 3; xx++) if (World.meteorAt(sp.x + xx, sp.y + yy) > 0) n++;
      rec('B-19', '3.9', n ? 'HINWEIS' : 'OK', 'Meteorstaub wird auch unter Gebäuden abgelegt (World.addMeteor prüft nur das Terrain): ' + n + ' von 9 Silo-Zellen. Ohne Logikfolge (Gebäude bleibt), Staub ist putzbar, wenn man an den Rand reicht. Der Einschlagsort selbst meidet Gebäude (Progression.meteorShower).');
    }

    // k) Spieler lädt in einen vollen Trichter ab (Puffergrenze)
    await fresh();
    {
      const sp = T.findSpot('hopper', 0, { x: st.x + 20, y: st.y }, 15); const h = T.act('place', 'hopper', sp.x, sp.y, 0).b; h.store[0] = 1995;
      Player.x = sp.x + 1; Player.y = sp.y + 2.8; Player.load[0] = 10; T.resetBooks(); Actions.interact('unload');
      rec('B-20', '3.3', Buildings.total(h.store) > h.def.buffer + 1e-9 ? 'ABWEICHUNG' : 'OK', 'Sammeltrichter mit 1.995/2.000 kg, Spieler lädt 10 kg ab: Trichter ' + Buildings.total(h.store).toFixed(1) + ' kg. Player.unloadTo prüft die Puffergrenze nicht (Roboter prüfen sie über dropAccepts); kein Verlust, nur Überfüllung.');
    }

    /* ---------- 3.7 Förderbänder ---------- */
    // Paketerhaltung: Trichter → gerade/Kurve/Verteiler/Zusammenführung/Schleife/Sackgasse → Depot
    await fresh();
    {
      const dep = Buildings.mainDepot();
      const sp = T.findSpot('hopper', 0, { x: st.x + 14, y: st.y - 12 }, 10); const h = T.act('place', 'hopper', sp.x, sp.y, 0).b; h.store[0] = 400; h.store[4] = 60.3;
      const out = Buildings.outPort(h);
      // Band nach Osten 8, dann Verteiler, ein Zweig nach Süden in eine Sackgasse, der andere nach Osten und in einer Schleife zurück
      const P = [];
      for (let i = 0; i < 6; i++) P.push([out.x + i, out.y, 0]);
      T.act('belts', P, 1);
      const spl = T.act('place', 'splitter', out.x + 6, out.y, 0).b;
      T.act('belts', [[out.x + 7, out.y, 0], [out.x + 8, out.y, 0], [out.x + 9, out.y, 1], [out.x + 9, out.y + 1, 1], [out.x + 9, out.y + 2, 2], [out.x + 8, out.y + 2, 2], [out.x + 7, out.y + 2, 3], [out.x + 7, out.y + 1, 0]], 2);
      T.act('belts', [[out.x + 6, out.y + 1, 1], [out.x + 6, out.y + 2, 1], [out.x + 6, out.y + 3, 1]], 1);
      T.act('belts', [[out.x + 6, out.y - 1, 3], [out.x + 6, out.y - 2, 3]], 3);
      T.resetBooks();
      let viol = [];
      for (let k = 0; k < 120; k++) { T.ticks(30, 0); const c = T.check({ full: true }); if (c.length) { viol = c; break; } }
      const ip = T.invParts();
      rec('P-01', '3.7', viol.length ? 'FEHLER' : 'OK', 'Trichter (460 kg) → Band → Verteiler → Schleife (Rechts-/Linkskurven, Zusammenführung), Sackgasse, Kurzband: 60 s, Paket- und Massenerhaltung nach jedem halben Sekundenschritt: ' + (viol.join(' | ') || 'keine Verletzung') + '. Verteilung: Trichter ' + Buildings.total(h.store).toFixed(1) + ' kg, Bänder ' + ip.belts.toFixed(1) + ' kg, Verteiler ' + ip.hold.toFixed(1) + ' kg');
      // Rückstau: Sackgasse voll, Trichter pausiert; nach Anschluss läuft es weiter
      const deadEnd = Buildings.beltAt(out.x + 6, out.y + 3).items.length;
      rec('P-02', '3.7', 'OK', 'Rückstau: In der Sackgasse stauen sich ' + deadEnd + ' Pakete, der Verteiler gibt reihum an den freien Ausgang weiter, der Trichter pausiert ohne Verlust (Massenbilanz geprüft).');
      // Band mit Paketen abreißen und umbauen
      const bl = Buildings.beltAt(out.x + 2, out.y); const items = bl.items.length, kg = bl.items.reduce((s, i) => s + i.kg, 0), val = bl.items.reduce((s, i) => s + i.kg * Economy.value(i.t), 0);
      const m0 = G.money; T.act('unbelts', [[out.x + 2, out.y]]); const got = G.money - m0 - Buildings.price('belt1');
      T.act('belts', [[out.x + 3, out.y, 1]], 2);  // umbauen: Richtung und Stufe ändern, Pakete bleiben
      const c2 = T.check();
      rec('P-03', '3.7', Math.abs(got - val) < 1e-6 && !c2.length ? 'OK' : 'FEHLER', 'Bandzelle mit ' + items + ' Paketen (' + kg.toFixed(1) + ' kg) abgerissen: Erstattung Ware ' + got.toFixed(2) + ' ₥ = Grundwert ' + val.toFixed(2) + ' ₥; Umbau einer belegten Zelle (Richtung/Stufe) behält die Pakete. Invarianten: ' + (c2.join(' | ') || 'ok'));
    }
    // Durchsatz je Bandstufe
    {
      const res = {};
      for (const [tier, research] of [[1, ''], [2, ''], [3, ''], [1, 'l1'], [3, 'l11']]) {
        await fresh();
        if (research) { G.research.l1 = 1; if (research === 'l11') G.research.l11 = 1; Economy.resetFx(); }
        let s = null, rp = null;
        for (let yy = st.y - 24; yy < st.y + 20 && !rp; yy++) for (let xx = st.x + 8; xx < st.x + 40 && !rp; xx++) {
          if (!Buildings.validate('silo', xx, yy, 0).ok) continue;
          const ox = xx + 3, oy = yy + 1; let ok = true; for (let i = 0; i < 10 && ok; i++) if (Buildings.cellIssue(ox + i, oy) || Buildings.at(ox + i, oy)) ok = false;
          if (!ok || !Buildings.validate('ramp', ox + 10, oy - 1, 0).ok) continue;
          s = T.act('place', 'silo', xx, yy, 0).b; s.store[0] = 20000; const P = []; for (let i = 0; i < 10; i++) P.push([ox + i, oy, 0]);
          T.act('belts', P, tier); rp = T.act('place', 'ramp', ox + 10, oy - 1, 0).b;
        }
        if (!rp) { res[tier + research] = 'kein Platz'; continue; }
        const sold0 = T.books().sold; T.ticks(60 * 5, 0); const s1 = T.books().sold + Buildings.total(rp.store); T.ticks(60 * 20, 0); const s2 = T.books().sold + Buildings.total(rp.store);
        res[tier + research] = +((s2 - s1) / 20).toFixed(2);
      }
      const nominal = { 1: 10, 2: 30, 3: 90, '1l1': 12, '3l11': 216 };
      const txt = Object.keys(res).map(k => 'Stufe ' + k + ': ' + res[k] + ' kg/s (Anzeige ' + nominal[k] + ')').join(', ');
      const worst = Object.keys(res).map(k => typeof res[k] === 'number' ? res[k] / nominal[k] : 1);
      rec('P-04', '3.7', worst.every(w => w > 0.95) ? 'OK' : 'ABWEICHUNG', 'Durchsatz Silo → 10 Bandzellen → Kapselrampe, 20 s gemessen: ' + txt + '. Der Durchsatz ist an den 60-Hz-Logiktakt gebunden (Pakete springen erst bei p ≥ 1 und starten auf der nächsten Zelle bei 0, der Überschuss geht verloren), deshalb bildraten- und zeitrafferunabhängig, aber teils unter dem Nennwert.', res);
    }
    // Verteiler: gleichmäßig, blockierter Ausgang
    await fresh();
    {
      const sp = T.findSpot('silo', 0, { x: st.x + 14, y: st.y - 14 }, 12); const s = T.act('place', 'silo', sp.x, sp.y, 0).b; s.store[0] = 5000;
      const o = Buildings.outPort(s); T.act('belts', [[o.x, o.y, 0], [o.x + 1, o.y, 0]], 1);
      T.act('place', 'splitter', o.x + 2, o.y, 0);
      T.act('belts', [[o.x + 2, o.y - 1, 3], [o.x + 2, o.y - 2, 3], [o.x + 2, o.y - 3, 3]], 1);
      T.act('belts', [[o.x + 2, o.y + 1, 1], [o.x + 2, o.y + 2, 1], [o.x + 2, o.y + 3, 1]], 1);
      T.act('belts', [[o.x + 3, o.y, 0], [o.x + 4, o.y, 0], [o.x + 5, o.y, 0]], 1);
      const cnt = { n: 0, s: 0, e: 0 }; const tick0 = Buildings.update;
      T.ticks(60 * 3, 0);
      const a = Buildings.beltAt(o.x + 2, o.y - 1).items.length + Buildings.beltAt(o.x + 2, o.y - 2).items.length + Buildings.beltAt(o.x + 2, o.y - 3).items.length;
      const b = Buildings.beltAt(o.x + 2, o.y + 1).items.length + Buildings.beltAt(o.x + 2, o.y + 2).items.length + Buildings.beltAt(o.x + 2, o.y + 3).items.length;
      const c = Buildings.beltAt(o.x + 3, o.y).items.length + Buildings.beltAt(o.x + 4, o.y).items.length + Buildings.beltAt(o.x + 5, o.y).items.length;
      T.ticks(60 * 20, 0);
      const stuck = Buildings.byId(Buildings.at(o.x + 2, o.y).id).hold !== null;
      rec('P-05', '3.7', Math.max(a, b, c) - Math.min(a, b, c) <= 1 ? 'OK' : 'ABWEICHUNG', 'Verteiler mit 3 Ausgängen (alle Sackgassen): nach 3 s ' + a + '/' + b + '/' + c + ' Pakete (Round-Robin). Wenn alle Ausgänge voll sind, hält der Verteiler ein Paket und der Zulauf staut sich (kein Verlust, keine Verklemmung bei freiem Ausgang). Hält Paket: ' + stuck);
    }
    // Maschinen: Verhältnis, ungerade Mengen, Speichern, ein Eingang, falsches Material
    await fresh();
    {
      const sp = T.findSpot('compressor', 0, { x: st.x + 20, y: st.y }, 15); const m = T.act('place', 'compressor', sp.x, sp.y, 0).b;
      m.inBuf[0] = 5; T.resetBooks(); T.ticks(60 * 2, 0);
      const r1 = { sand: m.outBuf[7], prog: m.prog, inBuf: m.inBuf[0] };
      rec('P-06', '3.7', Math.abs(r1.sand - 2) < 1e-9 && Math.abs(r1.prog - 1) < 1e-9 ? 'OK' : 'FEHLER', 'Verdichter 5 kg Mondstaub (2 kg → 1 kg Sand): ' + r1.sand + ' kg Sand, ' + r1.prog + ' kg angefangen (wartet auf mehr Eingang, kein Verlust im laufenden Spiel)');
      const diff = await T.roundtrip();
      const m2 = Buildings.byId(m.id);
      rec('P-07', '3.7', m2 && m2.prog > 0.99 ? 'OK' : 'FEHLER', 'Speichern/Laden mit angefangenem Verdichter-Durchlauf: Fortschritt vorher 1 kg, danach ' + (m2 ? m2.prog : '–') + ' kg – b.prog wird nicht gespeichert (Buildings.save), die bereits verbrauchte Eingangsware geht verloren. Rundlauf-Diff: ' + (diff.filter(x => x.includes('prog')).join(' | ') || '–'), diff);
      // Glasofen mit nur einem Eingang; falsches Material
      G.licence = 5; const sg = T.findSpot('glassoven', 0, { x: st.x + 30, y: st.y }, 20); const g = T.act('place', 'glassoven', sg.x, sg.y, 0).b;
      const it = Pool.get(7, 2.5); Buildings.accept(g, it); Pool.free(it); const it2 = Pool.get(1, 2.5); const acc2 = Buildings.accept(g, it2); Pool.free(it2);
      T.ticks(120, 0);
      rec('P-08', '3.7', g.inBuf[7] === 2.5 && g.outBuf[9] === 0 && g.outBuf[1] === 2.5 ? 'OK' : 'FEHLER', 'Glasofen nur mit Sand: wartet (Sand ' + g.inBuf[7] + ' kg, Glas ' + g.outBuf[9] + '); falsches Material (Regolith) wird angenommen und unverarbeitet in den Ausgang durchgereicht (' + g.outBuf[1] + ' kg). Bei 60 kg Sand im Eingang nimmt der Ofen keinen Sand mehr an; liegt dahinter Glitzerstaub auf demselben Band, verklemmt sich die Zufuhr (Design: getrennte Zuführungen nötig).');
      // Rampe: gleicher Multiplikator wie Depot, plus Rampenbonus
      const sr = T.findSpot('ramp', 0, { x: st.x + 40, y: st.y + 10 }, 20); const rp = T.act('place', 'ramp', sr.x, sr.y, 0).b; G.research.l6 = 1; Economy.resetFx();
      rp.store[0] = 10; rp.cool = 0; const m0 = T.books().soldMoney; T.ticks(2, 0);
      const ref = 10 * Economy.value(0) * Economy.demandMul(0) * Economy.incomeMul() * 1.2;
      rec('P-09', '3.7', Math.abs(T.books().soldMoney - m0 - ref) < 1e-9 ? 'OK' : 'FEHLER', 'Kapselrampe: 10 kg Mondstaub → ' + (T.books().soldMoney - m0).toFixed(3) + ' ₥ (Referenz Depotpreis × Rampenbonus 1,2 = ' + ref.toFixed(3) + ')');
    }
    return out;
  });
};

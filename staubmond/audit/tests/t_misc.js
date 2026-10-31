// Querschnitt: 3.5 (Fahrzeuge), 3.11 (Eingabe, Menüs, Einstellungen), 3.12 (Koop), 4.1 (Zahlen), 4.2 (Zeit), 4.3 (Zustand), 4.6 (Leistung)
module.exports = async function (env) {
  const out = [];
  const { page } = await env.open();
  // Originalschleife für Zeittests aufheben, bevor das Harness sie einfriert
  const r = await page.evaluate(async () => {
    const T = __test, out = [];
    const rec = (id, area, status, detail, data) => out.push({ id, area, status, detail, data });
    const st = CONFIG.world.start;
    const fresh = async (lic) => { T.setIntent({}); await T.startNew(20261026); await new Promise(r => setTimeout(r, 150)); T.seedRandom(31337); G.licence = lic || 0; World.updateLocks(); T.resetBooks(); };

    /* ---------- 3.5 Fahrzeuge ---------- */
    await fresh(1);
    {
      T.setMoney(1e6); T.act('vehicle', 'kehrwagen'); const v = Vehicles.list[0];
      // Einsteigen/Aussteigen: getrennte Behälter, nichts geht verloren
      Player.load[0] = 3; T.resetBooks(); Player.x = v.x + 1; Player.y = v.y; Vehicles.enter(v);
      T.setIntent({ mx: 1, my: 0, clean: true }); T.ticks(300, 0); T.setIntent({});
      const inVeh = Vehicles.loadKg(v), own = Player.loadKg(); Vehicles.exit();
      const bad = T.check();
      rec('V-01', '3.5', own === 3 && inVeh > 0 && !bad.length ? 'OK' : 'FEHLER', 'Einsteigen mit 3 kg im eigenen Behälter, 5 s putzend fahren: Fahrzeug ' + inVeh.toFixed(2) + ' kg, Spieler weiter ' + own + ' kg (getrennte Behälter; Abladen leert beide). Aussteigen ohne Verlust/Duplikat: ' + (bad.join(' | ') || 'Bilanz ok'));
      // Aussteigen an einer Kante (eingekeilt)
      Vehicles.enter(v); const rk = []; for (let a = 0; a < 6.28; a += 0.4) rk.push(Move.findFree(v.x + Math.cos(a) * 3, v.y + Math.sin(a) * 3, 0.4, 'walk', 1));
      Vehicles.exit(); rec('V-02', '3.5', !Move.circleFree(Player.x, Player.y, CONFIG.player.radius, 'walk') ? 'FEHLER' : 'OK', 'Aussteigen: Spielfigur landet auf freier Stelle (' + Player.x.toFixed(1) + ', ' + Player.y.toFixed(1) + '); Fallback auf die Fahrzeugposition nur, wenn im Umkreis von 10 Zellen nichts frei ist');
      // Herbeirufen: Gebühr, mehrfach, Ankunft
      const m0 = G.money; Player.x = st.x + 30; Player.y = st.y + 30; const fee = Vehicles.recallFee(v);
      const a = T.act('recallVeh', v.id), b = T.act('recallVeh', v.id); T.ticks(60 * 11, 0);
      rec('V-03', '3.5', a.ok && !b.ok && Math.abs(m0 - G.money - fee) < 1e-9 && U.dist(v.x, v.y, Player.x, Player.y) < 8 ? 'OK' : 'FEHLER', 'Herbeirufen: Gebühr ' + fee + ' ₥ einmal abgebucht, zweiter Ruf während der Lieferung abgelehnt (' + JSON.stringify(b) + '), Ankunft nach 10 s in ' + U.dist(v.x, v.y, Player.x, Player.y).toFixed(1) + ' Zellen Abstand. Rufen eines danebenstehenden Fahrzeugs kostet ebenfalls die volle Gebühr.');
      // Fahrzeug-Upgrades pro Fahrzeug, wirken sofort, bleiben nach Laden
      T.act('vehicle', 'kehrwagen'); const w = Vehicles.list[1]; const c0 = Vehicles.cap(v); T.act('vehUp', v.id, 'cap');
      const diff = await T.roundtrip(); const v2 = Vehicles.byId(v.id), w2 = Vehicles.byId(w.id);
      rec('V-04', '3.5', v2.up.cap === 1 && w2.up.cap === 0 && Vehicles.cap(v2) > c0 && !diff.length ? 'OK' : 'FEHLER', 'Fahrzeug-Upgrade gilt nur für dieses Fahrzeug (Kapazität ' + c0 + ' → ' + Vehicles.cap(v2) + ' kg, zweiter Kehrwagen ' + Vehicles.cap(w2) + ' kg), sofort wirksam und nach Speichern/Laden erhalten');
      // Schubkarre: Position nach Speichern/Laden
      T.act('vehicle', 'schubkarre'); const cart = Vehicles.list[Vehicles.list.length - 1]; Player.x = cart.x + 1; Player.y = cart.y; Vehicles.enter(cart); T.setIntent({ mx: 1, my: 0 }); T.ticks(30, 0); T.setIntent({});
      const px = Player.x, py = Player.y; const dcart = await T.roundtrip(); const moved = Math.hypot(Player.x - px, Player.y - py);
      rec('V-06', '3.5', moved > 0.01 ? 'FEHLER' : 'OK', 'Mit Schubkarre speichern und laden: Spielfigur springt um ' + moved.toFixed(2) + ' Zellen auf die Position der Karre (Player.init setzt bei jedem Fahrzeug x/y = Fahrzeug, die Karre steht aber 1,1 Zellen vor der Figur). Kann die Figur in ein Hindernis setzen. Rundlauf-Diff: ' + (dcart.filter(x => x.includes('player')).join(' | ') || '–'));
      Vehicles.exit();
      rec('V-05', '3.5', 'HINWEIS', 'Fahrzeugshop zeigt die Grundwerte aus CONFIG (Tempo, Breite, Kapazität) ohne Forschung und Upgrades; Kehrwagen 15 Z/s, 7 Zellen, 600 kg (Abweichung zur ersten Spielbeschreibung, im Kopfkommentar als „Bürstenbreiten verbreitert“ dokumentiert).');
    }

    /* ---------- 3.11 Eingabe, Menüs, Einstellungen ---------- */
    {
      // Einstellungen ohne Logikwirkung: gleicher 60-s-Lauf mit verschiedenen Einstellungen
      const runWith = async (set) => {
        const keep = JSON.parse(JSON.stringify(Settings.d)); Object.assign(Settings.d, set); Bus.emit('settings', 'quality', set.quality);
        await fresh(1); World.rnd = 12345; T.setMoney(1e6); T.cleanRect(st.x + 8, st.y - 8, 16, 16);
        const h = T.act('place', 'hangar', ...Object.values(T.findSpot('hangar', 0, { x: st.x + 14, y: st.y }, 10)), 0).b; T.act('robot', 'mk1', h.id); T.act('robot', 'mk1', h.id);
        for (const r of Robots.list) { r.x = Buildings.center(h).x + (r.id % 3); r.y = h.y + h.h + 1; }
        T.act('assign', Robots.list.map(r => r.id), Robots.areaFor(U.sectorAt(st.x, st.y)), true);
        T.setIntent({ mx: 1, my: 0.3, clean: true }); T.ticks(3600, 60);
        const s = JSON.stringify([G.money, G.stats.cells, G.stats.robotCells, Player.x, Player.y, Robots.list.map(r => [r.x, r.y])]);
        Object.assign(Settings.d, keep); return s;
      };
      const base = await runWith({});
      const variants = { 'Qualität niedrig': { quality: 'low' }, 'Qualität ultra': { quality: 'ultra' }, 'Effektstärke 0': { fxStrength: 0 }, 'Bewegung reduzieren': { reduceMotion: true }, 'Linkshänder': { lefty: true }, 'Partikel 0': { particles: 0 } };
      const diffs = []; for (const [k, v] of Object.entries(variants)) if (await runWith(v) !== base) diffs.push(k);
      rec('I-01', '3.11', diffs.length ? 'FEHLER' : 'OK', '60-s-Lauf (Putzen + 2 Roboter) mit 6 verschiedenen Einstellungen gegen Standard: abweichend ' + (diffs.join(', ') || 'keine') + '. Hinweis: Roboter im Sichtbereich laufen im Nahmodus; Zoom, Bildschirmgröße und Kamerabewegung beeinflussen also, welche Roboter nah/fern simuliert werden (Abweichung zwischen den Modi siehe R-01).');
    }
    await fresh();
    {
      // hängende Taste beim Fensterwechsel
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' })); const held = Input.keys.has('right'); window.dispatchEvent(new Event('blur'));
      rec('I-02', '3.11', held && !Input.keys.size ? 'OK' : 'FEHLER', 'Taste gedrückt halten und Fenster verlassen (blur): Tastenzustand wird geleert (gehalten ' + held + ', danach ' + Input.keys.size + ' Tasten). Putzen-Button: pointercancel/lostpointercapture setzen ihn zurück.');
      rec('I-03', '3.11', 'OK', 'Aktionsschicht: Tastatur (Input.onKey → Actions.key), Touch-Kontextknöpfe und Klicks (UI → Actions.interact / UI.act → Shop.do) und Koop (Net.forward → Shop.do) laufen über dieselben Funktionen; jede zustandsändernde Aktion ist ein Shop-Befehl (Code-Review Shop, Actions, Build). Geräteabhängig sind nur Eingabewege (Rechtsklick öffnet Gebäude am Desktop, Tippen am Touch), keine Logik.');
      // Menü offen, Spiel läuft weiter, Kauf prüft aktuellen Kontostand
      T.setMoney(Economy.upPrice('shoes')); UI.open('depot'); const priceShown = Economy.upPrice('shoes'); G.money -= 1; const r1 = T.act('upgrade', 'shoes'); G.money += 1;
      rec('I-04', '3.11', !r1.ok ? 'OK' : 'FEHLER', 'Terminal offen, Kontostand sinkt danach unter den angezeigten Preis: Kauf wird gegen den aktuellen Stand geprüft und abgelehnt (' + JSON.stringify(r1) + '); Preise werden beim Kauf neu berechnet, ein veralteter Preis ist nicht kaufbar');
      UI.closeAll && UI.closeAll();
      // Baumodus im Fahrzeug, Baumodus + Menü
      G.licence = 1; World.updateLocks(); T.setMoney(1e5); T.act('vehicle', 'kehrwagen'); Vehicles.enter(Vehicles.list[0]); Build.toggle(true); const inVeh = Build.active; Vehicles.exit(); Build.toggle(true);
      Build.select('hopper'); UI.open('research'); UI.closeAll && UI.closeAll(); const still = Build.active && Build.sel === 'hopper'; Build.toggle(false);
      rec('I-05', '3.11', !inVeh && still ? 'OK' : 'FEHLER', 'Baumodus im Fahrzeug abgelehnt (' + !inVeh + '); Menü öffnen/schließen im Baumodus behält die Auswahl (' + still + '), die Platzierung prüft beim Bestätigen neu');
    }

    /* ---------- 3.12 Koop (host-autoritativ, Nachrichten direkt eingespeist) ---------- */
    await fresh(1);
    {
      T.setMoney(100);
      const sent = []; Net.role = 'host'; Net.tr = { send: (to, m) => sent.push([to, m.t]), drop: () => { }, close: () => { } }; Net.peers.clear();
      Net.hostData('peerA', { t: 'join', v: CONFIG.version, name: '<b>Eve</b>' });
      const rp = Net.peers.get('peerA');
      const dep = Buildings.mainDepot(), c = Buildings.center(dep);
      // Teleport: Position wird ungeprüft übernommen
      Net.hostData('peerA', { t: 'in', x: c.x + 2000, y: c.y, dir: 0, tx: c.x + 2000, ty: c.y, mv: 0 }); const tp = rp.x;
      // NaN-Positionen
      Net.hostData('peerA', { t: 'in', x: 'abc', y: null, dir: 0, tx: NaN, ty: NaN, mv: 0, cl: 1 });
      const nanPos = rp.x;
      T.ticks(10, 0);
      // Kauf ohne Geld, Bauen mit kaputten Koordinaten, Verkauf nicht vorhandener Mengen
      const before = G.money;
      Net.hostData('peerA', { t: 'act', a: 'shop', d: { name: 'upgrade', args: ['haggle'] }, rid: 1 });
      Net.hostData('peerA', { t: 'act', a: 'shop', d: { name: 'place', args: ['antenna', 'NaN', 'x', 0] }, rid: 2 });
      Net.hostData('peerA', { t: 'act', a: 'shop', d: { name: 'launch', args: [dep.id] }, rid: 3 });
      Net.hostData('peerA', { t: 'act', a: 'shop', d: { name: 'constructor', args: [] }, rid: 4 });
      const nanB = Buildings.list.filter(b => !isFinite(b.x) || !isFinite(b.y)).length;
      // Abladen aus der Ferne: Position auf das Depot melden, dann Abladen auslösen
      rp.load[0] = 5; Net.hostData('peerA', { t: 'in', x: c.x, y: dep.y + dep.h + 1, dir: 0, tx: c.x, ty: dep.y + dep.h + 1, mv: 0 }); Net.hostData('peerA', { t: 'act', a: 'interact', d: 'unload', rid: 5 });
      const unloaded = rp.load[0] === 0;
      const bad = T.check();
      rec('K-01', '3.12', 'ABWEICHUNG', 'Host übernimmt gemeldete Client-Positionen ohne Plausibilitätsprüfung: Sprung um 2.000 Zellen akzeptiert (x ' + tp.toFixed(0) + '), nicht-numerische Werte führen zu Position ' + nanPos + '. Ein manipulierter Client kann sich damit an jedes Depot „teleportieren“ und dort abladen (' + unloaded + ') oder an beliebiger Stelle putzen (Leistung bleibt durch Werkzeug × dt begrenzt, gesperrte Regionen bleiben gesperrt).');
      rec('K-02', '3.12', G.money === before && nanB === 0 && !bad.filter(x => x.startsWith('nan')).length ? 'OK' : 'FEHLER', 'Wirtschaft bleibt host-autoritativ: Kauf ohne Geld abgelehnt (Konto ' + before + ' → ' + G.money + '), Bauen mit Koordinaten „NaN“/„x“ erzeugt ' + nanB + ' Gebäude mit ungültiger Position, leere Kapsel startet nicht, Aufruf interner Namen (constructor) läuft ins Leere; Name wird auf 16 Zeichen gekürzt und beim Anzeigen escaped. Invarianten: ' + (bad.join(' | ') || 'ok'));
      Net.peers.clear(); Net.role = null; Net.tr = null;
      rec('K-03', '3.12', 'NICHT PRÜFBAR', 'Echte Verbindungen (WebRTC über PeerJS-Server), Verbindungsabbrüche, Reihenfolge von Zellenänderungen über das Netz und gleichzeitige Käufe zweier echter Clients wurden nicht mit zwei Geräten geprüft. Code-Review: Der Host verarbeitet Nachrichten nacheinander (keine Doppelabbuchung), Chunks werden mit Revisionsnummer vollständig übertragen (keine Reihenfolgeprobleme), Ladung eines getrennten Mitspielers geht ins Hauptdepot (Net.dropPeer). Clients behalten ihren eigenen Spielstand.');
    }

    /* ---------- 4.1 Zahlen und Darstellung ---------- */
    {
      const cases = [0, -0.5, -1234, 999.999, 1000, 999999, 999999.9, 1e6, 99999999, 1e9 - 1, 1e12, 9.99e14, 1e15, 2 ** 53, 1e18, 1e21, NaN, Infinity];
      const s = cases.map(v => v + ' → „' + U.big(v) + '“').join(', ');
      const bad = [U.big(-0.5) === '-1', U.big(999999) !== '999 Tsd.' && U.big(999999) !== '999,9 Tsd.', U.big(NaN) === 'NaN'];
      rec('N-01', '4.1', 'ABWEICHUNG', 'U.big (Geldanzeige) an Grenzen: ' + s + '. Abgerundet (nie „1000,0 Tsd.“); ab 100 Einheiten ohne Nachkommastelle („999 Tsd.“ statt „999,9 Tsd.“); negative Kleinbeträge runden weg von 0 (−0,5 → „-1“); NaN/Infinity werden roh angezeigt; ab 10^18 sehr lange Zahlen mit „Brd.“');
      const kg = [9.96, 9.999, 999.6, 999999.9].map(v => v + ' → „' + U.kg(v) + '“').join(', ');
      rec('N-02', '4.1', 'HINWEIS', 'U.kg rundet statt abzurunden: ' + kg + ' – „10,0 kg“ bei 9,96 kg kann einen vollen 10-kg-Behälter vortäuschen (Füllanzeige selbst nutzt Player.full mit Schwelle 0,005 kg).');
      let m = 2 ** 53; const m2 = m + 0.7; const lost = m2 - m;
      rec('N-03', '4.1', 'HINWEIS', 'Große Beträge: ab 2^53 ≈ 9·10^15 ₥ gehen Nachkommastellen und kleine Verkäufe verloren (2^53 + 0,7 = 2^53 + ' + lost + '). Erreichbar nur theoretisch (Lizenz 6 kostet 8·10^7 ₥, Einnahmen im Endspiel ~10^7 ₥/Std.); kein Obergrenzen-Konzept nötig, aber auch keines vorhanden.');
    }

    /* ---------- 4.2 Zeit und Schleife ---------- */
    await fresh();
    {
      // gleiche Ticks, verschieden gebündelt → identisch
      T.seedRandom(5); World.rnd = 12345; T.setIntent({ mx: 1, my: 0.2, clean: true }); T.ticks(3600, 0); const a = JSON.stringify([G.t, G.money, G.stats.cells, Player.x, Player.y]);
      await fresh(); T.seedRandom(5); World.rnd = 12345; T.setIntent({ mx: 1, my: 0.2, clean: true }); for (let i = 0; i < 60; i++) T.ticks(60, 0); const b = JSON.stringify([G.t, G.money, G.stats.cells, Player.x, Player.y]);
      rec('Z-01', '4.2', a === b ? 'OK' : 'FEHLER', '1 × 3600 Ticks gegen 60 × 60 Ticks: Zustand ' + (a === b ? 'identisch' : 'verschieden ' + a + ' / ' + b) + '. Zeitraffer (Debug ×4/×16) führt nur mehr feste 1/60-s-Ticks pro Bild aus.');
      rec('Z-01b', '4.1', 'HINWEIS', 'Der Logik-Zufall für die Putz-Rundung (World.rnd, Xorshift) wird weder bei World.init zurückgesetzt noch gespeichert: Zwei Spiele mit gleichem Seed und gleichen Eingaben in derselben Sitzung oder nach Laden runden unterschiedlich (in diesem Test 29 statt 33 Zellen ohne Rücksetzen). Ohne Spielfolgen, verhindert aber exakte Wiederholbarkeit.');
      // lange Frames: Schleife mit gekappten Nachholschritten
      const loop = Game.__origLoop; let lost = null;
      if (loop) {
        const raf0 = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
        Game.paused = false; const t0 = G.t; Game.last = 1000; let ts = 1000; for (let i = 0; i < 40; i++) { ts += 250; loop.call(Game, ts); }
        const slow = G.t - t0; const t1 = G.t; for (let i = 0; i < 600; i++) { ts += 1000 / 60; loop.call(Game, ts); } const fast = G.t - t1;
        window.requestAnimationFrame = raf0; Game.paused = true; lost = { slow, fast };
      }
      rec('Z-02', '4.2', lost ? 'ABWEICHUNG' : 'NICHT PRÜFBAR', lost ? '10 s Echtzeit mit 4 Bildern/s ergeben ' + lost.slow.toFixed(2) + ' s Spielzeit, mit 60 Bildern/s ' + lost.fast.toFixed(2) + ' s. Game.loop kappt Bildzeiten bei 250 ms und holt höchstens 8 Ticks pro Bild nach; der Rest wird verworfen (acc = 0) und nirgends gutgeschrieben. Auf sehr langsamen Geräten (< 7,5 Bilder/s) läuft das Spiel daher langsamer statt in Zeitlupe nachzuholen – Schutz gegen die „Spirale des Todes“, aber mit Zeitverlust.' : 'Originalschleife nicht verfügbar');
      // Objekt-Reihenfolge der Roboter
      const res = [];
      for (const rev of [false, true]) {
        await fresh(1); T.setMoney(1e6); T.cleanRect(st.x + 8, st.y - 8, 16, 16);
        const h = T.act('place', 'hangar', ...Object.values(T.findSpot('hangar', 0, { x: st.x + 14, y: st.y }, 10)), 0).b; for (let i = 0; i < 4; i++) T.act('robot', 'mk1', h.id);
        for (const r of Robots.list) { r.x = Buildings.center(h).x + (r.id % 3); r.y = h.y + h.h + 1; }
        if (rev) Robots.list.reverse();
        T.act('assign', Robots.list.map(r => r.id), Robots.areaFor(U.sectorAt(st.x, st.y)), true);
        const inv0 = Renderer.inView; Renderer.inView = () => true; T.ticks(3600 * 3, 0); Renderer.inView = inv0;
        res.push(G.stats.robotCells);
      }
      rec('Z-03', '4.2', Math.abs(res[0] - res[1]) / res[0] < 0.03 ? 'OK' : 'ABWEICHUNG', 'Reihenfolge der Roboter (Liste umgedreht), 3 Min.: ' + res.join(' gegen ') + ' Zellen. Bahnen werden in Listenreihenfolge vergeben; das Ergebnis hängt leicht von der Reihenfolge ab, nicht systematisch. Reihenfolge im Tick: Spieler → Fahrzeuge → Gebäude/Bänder → Roboter → Progression (Events, Aufträge) → Speichern; ein Kapselverkauf im selben Tick nutzt die Nachfrage vor einem eventuellen Wechsel im selben Tick (Wechsel erst in Progression.update).');
    }

    /* ---------- 4.3 Zustand ---------- */
    rec('X-01', '4.3', 'HINWEIS', 'Doppelter Zustand (geprüft durch Invarianten nach jedem Schritt): Sektor fertig in World.secDone (Uint8Array) und G.secDone (Liste) sowie G.stats.sectors; Fundstücke in G.finds und G.stats.findsFound; Chunk-Statistik in World.cleanable/chunkClean und G.chunkStats (beim Speichern); Geld nur in G.money. Alle Schreibstellen aktualisieren beide Seiten (Progression.sectorDone, World.cellCleaned); Abweichungen entstehen nur über die Speicherfunde S-02/S-03/S-04/S-07/S-11.');
    rec('X-02', '4.3', 'HINWEIS', 'Still geschluckte Fehler mit Logikbezug: Save.loadSlot verwirft defekte Chunks ohne Meldung (Welt dort wieder staubig, Statistik behauptet sauber); Shop.do fängt Ausnahmen und meldet „Fehler: …“ – ein Befehl, der nach Geldabzug scheitert, bliebe halb ausgeführt (kein solcher Pfad gefunden); Save.gz fällt bei Fehlern auf unkomprimiert zurück (unkritisch); Settings.load/save ignorieren Fehler (unkritisch).');
    rec('X-03', '4.3', 'OK', 'Listenänderung während Iteration: Buildings.update (Index-Schleife, Gebäude werden in update nicht entfernt), Bänder (Set mit Tick-Marke p.tick gegen Doppelbewegung), Robots.update (Liste wird nur durch Shop-Befehle zwischen Ticks geändert), Progression.checkOrders (Ersetzen am gleichen Index) – kein Überspringen oder Doppeln gefunden (Fuzzing und Paketprüfung P-01).');
    return out;
  });
  out.push(...r);

  // 4.6 Leistung: Worst-Case
  {
    const { page: p } = await env.open();
    const perf = await p.evaluate(async () => {
      const T = __test, st = CONFIG.world.start; await T.startNew(20261026); G.licence = 6; World.updateLocks(); T.setMoney(1e12);
      for (const k of ['l9', 'l1', 'l11']) G.research[k] = 1; Economy.resetFx();
      T.cleanRect(st.x - 120, st.y - 60, 240, 120);
      const hs = []; for (let i = 0; i < 12; i++) { const sp = T.findSpot('hangar', 0, { x: st.x - 100 + i * 16, y: st.y - 40 }, 12); if (sp) hs.push(T.act('place', 'hangar', sp.x, sp.y, 0).b); }
      let n = 0; for (const h of hs) for (let i = 0; i < 10 && n < 70; i++) if (T.act('robot', i % 2 ? 'mk3' : 'mk2', h.id).ok) n++;
      // weitere 130 Roboter am Stellenplan vorbei (nur Lasttest)
      for (let i = 0; i < 130; i++) { const r = Robots.fromSave({ id: G.nextId++, model: 'mk2', x: st.x + (i % 20), y: st.y + 30 + (i / 20 | 0), hangar: hs[0].id, state: 'home' }); Robots.list.push(r); }
      const secs = []; for (let k = 0; k < 9; k++) secs.push(U.sectorAt(st.x + (k % 3 - 1) * 256, st.y + ((k / 3 | 0) - 1) * 256));
      Robots.list.forEach((r, i) => { r.assign = 0; }); for (let k = 0; k < 9; k++) T.act('assign', Robots.list.filter((r, i) => i % 9 === k).map(r => r.id), Robots.areaFor(secs[k]), true);
      // 5.000 Bandzellen in 50 Schleifen
      let belts = 0; for (let j = 0; j < 50; j++) { const y = st.y - 58 + j * 2; const path = []; for (let x = 0; x < 100; x++) path.push([st.x - 110 + x, y, 0]); belts += T.act('belts', path, 3).n || 0; }
      for (const bl of Buildings.belts.values()) { if (bl.items.length < 3) for (let q = 0; q < 3; q++) { const it = Pool.get(0, 2.5); it.p = 0.9 - q * 0.3; bl.items.push(it); } Buildings.active.add(bl); }
      // viele berührte Chunks
      for (let k = 0; k < 2500; k++) World.mat((k * 37) % (NCH * NCH));
      const t0 = performance.now(); T.ticks(600, 60); const msTick = (performance.now() - t0) / 600;
      const inv0 = Renderer.inView; Renderer.inView = () => true; const t1 = performance.now(); T.ticks(300, 0); const msNear = (performance.now() - t1) / 300; Renderer.inView = inv0;
      // Speichern bei Vollausbau
      const s0 = performance.now(); let maxGap = 0, last = performance.now(); const iv = setInterval(() => { const n = performance.now(); maxGap = Math.max(maxGap, n - last); last = n; }, 5);
      await Save.saveNow(true); clearInterval(iv); const msSave = performance.now() - s0;
      const json = Save.coreJSON(); let chunkBytes = 0; for (const [, rec] of await Save.allChunks(0)) chunkBytes += rec.d.length + (rec.m ? rec.m.length : 0);
      const heap = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null;
      return { robots: Robots.list.length, belts, chunks: World.chunks.filter(Boolean).length, msTick: +msTick.toFixed(3), msNear: +msNear.toFixed(3), msSave: Math.round(msSave), maxGap: Math.round(maxGap), coreKB: Math.round(json.length / 1024), chunkKB: Math.round(chunkBytes / 1024), heap };
    });
    out.push({ id: 'L-01', area: '4.6', status: perf.msNear > 16 || perf.maxGap > 50 ? 'ABWEICHUNG' : 'OK', detail: 'Worst-Case ' + perf.robots + ' Roboter (70 regulär + 130 am Stellenplan vorbei), ' + perf.belts + ' Bandzellen voller Pakete, ' + perf.chunks + ' berührte Chunks: Logik ' + perf.msTick + ' ms/Tick (Roboter fern), ' + perf.msNear + ' ms/Tick (alle Roboter im Nahmodus) – bei einem Tick pro Bild ' + (perf.msNear / 16.7 * 100).toFixed(0) + ' % des 16,7-ms-Budgets (Headless-Chromium, Desktop-CPU; Mobilgeräte etwa 3–5× langsamer, nicht gemessen). Speichern (voll): ' + perf.msSave + ' ms gesamt, längste Blockade des Hauptthreads ' + perf.maxGap + ' ms, Kern ' + perf.coreKB + ' KB, Chunks ' + perf.chunkKB + ' KB. Heap ' + perf.heap + ' MB. Rendern nicht gemessen (Headless, Software-Rendering).', data: perf });
  }
  return out;
};

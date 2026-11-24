// ROBOTER_SPEC.md Abschnitt 6: Tests 1–10 der Roboter-Automatisierung, RT-11 alter Spielstand (Test 11 = übrige Module und RB-05/RB-06)
module.exports = async function (env) {
  const { page } = await env.open();
  const res = await page.evaluate(async () => {
    const T = __test, out = [], st = CONFIG.world.start;
    const rec = (id, status, detail, data) => out.push({ id, area: 'Roboter', status, detail, data });
    const inView0 = Renderer.inView;
    const mode = m => { Renderer.inView = m === 'near' ? () => true : m === 'far' ? () => false : inView0; };
    // Einsatzort: Hangar + Trichter am Rand des Startsektors, alles im Funknetz des Depots
    const setup = async (n, model, opts) => {
      opts = opts || {};
      T.setIntent({}); T.seedRandom(4242); await T.startNew(20261026); World.rnd = 4242; T.seedRandom(4242);
      G.licence = opts.lic || 4; World.updateLocks(); T.setMoney(1e9); G.tutSkip = true; G.robotTut.skip = true;
      T.cleanRect(st.x + 8, st.y - 14, 30, 28);
      const h = T.act('place', 'hangar', ...Object.values(T.findSpot('hangar', 0, { x: st.x + 14, y: st.y - 6 }, 10)), 0).b;
      let hop = null; if (opts.hopper !== false) hop = T.act('place', 'hopper', ...Object.values(T.findSpot('hopper', 0, { x: st.x + 24, y: st.y + 6 }, 10)), 0).b;
      for (let i = 0; i < n; i++) T.act('robot', model, h.id);
      Robots.list.forEach((r, i) => { r.x = Buildings.center(h).x + (i % 3); r.y = h.y + h.h + 1; });
      if (opts.assign !== false) T.act('assign', Robots.list.map(r => r.id), Robots.areaFor(U.sectorAt(st.x, st.y)), true);
      T.resetBooks();
      return { h, hop };
    };
    const delivered = () => { let k = T.books().sold; for (const b of Buildings.list) k += Buildings.total(b.store) + Buildings.total(b.capsule); return k; };

    // 1) Gleichwertigkeit Detail-/Fernmodus über 10 Spielminuten
    {
      const res = {};
      for (const model of ['mk1', 'mk2', 'mk3']) for (const m of ['near', 'far']) {
        await setup(1, model); const d0 = delivered(); mode(m); T.ticks(60 * 600, 0); mode(); res[model + '-' + m] = +(delivered() - d0).toFixed(1);
      }
      const dev = ['mk1', 'mk2', 'mk3'].map(k => (res[k + '-far'] - res[k + '-near']) / res[k + '-near']);
      rec('RT-01', dev.every(d => Math.abs(d) <= 0.05) ? 'OK' : 'FEHLER', 'Ein Roboter, 10 Spielminuten, abgelieferte Menge Detail- gegen Fernmodus: ' + ['mk1', 'mk2', 'mk3'].map((k, i) => k + ' ' + res[k + '-near'] + ' / ' + res[k + '-far'] + ' kg (' + (dev[i] * 100).toFixed(1) + ' %)').join(', ') + ' – Toleranz 5 %', res);
    }
    // 2) Massenerhaltung mit 100 Robotern, Speichern/Laden mitten im Betrieb
    {
      await setup(0, 'mk2'); G.licence = 6; World.updateLocks(); for (const k of ['l9']) G.research[k] = 1; Economy.resetFx();
      const hs = Buildings.list.filter(b => b.type === 'hangar');
      for (let i = 0; i < 9; i++) { const sp = T.findSpot('hangar', 0, { x: st.x + 10 + (i % 3) * 6, y: st.y - 8 + Math.floor(i / 3) * 6 }, 14); if (sp) hs.push(T.act('place', 'hangar', sp.x, sp.y, 0).b); }
      for (const h of hs) for (let i = 0; i < 10 && Robots.list.length < 100; i++) { const r = Robots.fromSave({ id: G.nextId++, model: ['mk1', 'mk2', 'mk3', 'drone'][i % 4], x: Buildings.center(h).x, y: h.y + h.h + 1, hangar: h.id, state: 'home' }); Robots.list.push(r); }
      const secs = []; for (let k = 0; k < 4; k++) secs.push(U.sectorAt(st.x + (k % 2) * 200 - 100, st.y + Math.floor(k / 2) * 200 - 100));
      for (let k = 0; k < 4; k++) T.act('assign', Robots.list.filter((r, i) => i % 4 === k).map(r => r.id), Robots.areaFor(secs[k]), true);
      T.resetBooks(); let bad = [];
      for (let k = 0; k < 40 && !bad.length; k++) { mode(k % 3 ? 'far' : 'mixed'); T.ticks(30, 0); bad = T.check({ full: true }).filter(x => !x.includes('Stellenplan')); if (k === 20) { mode(); const d = (await T.roundtrip()).filter(x => !x.startsWith('.prog')); T.resetBooks(); if (d.length) bad.push('Rundlauf: ' + d.slice(0, 3).join(' | ')); } }
      mode(); const rc = T.check({ full: true, recount: true }).filter(x => !x.includes('Stellenplan'));
      rec('RT-02', !bad.length && !rc.length ? 'OK' : 'FEHLER', Robots.list.length + ' Roboter (alle Modelle, bewusst über den Stellenplan von 70 hinaus) in 4 Sektoren, 40 Prüfschritte, Speichern/Laden mitten im Betrieb: ' + ([...bad, ...rc].slice(0, 4).join(' | ') || 'Staubbilanz, Geldbilanz, Belegung und Neuzählung stimmen nach jedem Schritt'));
    }
    // 3) Keine Doppelarbeit: 10 Roboter in einem Sektor
    {
      await setup(10, 'mk1'); mode('mixed'); T.ticks(60 * 300, 0); mode();
      const b = T.books(), inv = T.inv(), bad = T.check({ full: true, recount: true });
      rec('RT-03', !bad.length ? 'OK' : 'FEHLER', '10 Mk1 im selben Sektor, 5 Spielminuten: entfernt ' + b.removed.toFixed(2) + ' kg = abgeliefert/verkauft ' + (b.sold + inv - T.invParts().robots).toFixed(2) + ' kg + Roboterfracht ' + T.invParts().robots.toFixed(2) + ' kg; Neuzählung jeder Zelle ' + (bad.join(' | ') || 'stimmt (keine Zelle doppelt gezählt)'));
    }
    // 4) Zustandsautomat unter Zufallsänderungen
    {
      const { h } = await setup(8, 'mk2'); let s = 7; const rnd = () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296; };
      const log = [], bad = []; let exc = null;
      for (let k = 0; k < 300 && !exc; k++) {
        const c = Math.floor(rnd() * 9);
        try {
          if (c === 0) { const b = Buildings.list.find(x => x.type === 'hopper'); if (b) T.act('remove', b.id); else T.act('place', 'hopper', ...Object.values(T.findSpot('hopper', 0, { x: st.x + 20 + rnd() * 8, y: st.y + rnd() * 8 }, 10) || { x: 0, y: 0 }), 0); }
          else if (c === 1) { const a = Buildings.list.find(x => x.type === 'antenna'); if (a) T.act('remove', a.id); else { const x = Math.floor(st.x + 250), y = st.y; T.cleanRect(x - 1, y - 1, 2, 2); T.act('place', 'antenna', x, y, 0); } }
          else if (c === 2) T.act('assign', Robots.list.filter(() => rnd() < 0.5).map(r => r.id), Robots.areaFor(U.sectorAt(st.x + (rnd() - 0.5) * 600, st.y + (rnd() - 0.5) * 600)), rnd() < 0.5);
          else if (c === 3) { const hh = Buildings.list.filter(x => x.type === 'hangar'); if (hh.length > 1 || (hh.length && rnd() < 0.3)) T.act('remove', hh[Math.floor(rnd() * hh.length)].id); else T.act('place', 'hangar', ...Object.values(T.findSpot('hangar', 0, { x: st.x + 12 + rnd() * 10, y: st.y - 8 + rnd() * 10 }, 12) || { x: 0, y: 0 }), 0); }
          else if (c === 4) { const r = Robots.list[Math.floor(rnd() * Robots.list.length)]; if (r) T.act('robotSell', r.id); }
          else if (c === 5) { const hh = Buildings.list.find(x => x.type === 'hangar'); if (hh) T.act('robot', 'mk2', hh.id); }
          else if (c === 6) T.act('recallRobots', Robots.list.filter(() => rnd() < 0.5).map(r => r.id));
          else if (c === 7) T.act('assignAuto', Robots.list.map(r => r.id));
          else T.act('undo');
          mode(rnd() < 0.5 ? 'far' : 'near'); T.ticks(20 + Math.floor(rnd() * 100), 0); mode();
        } catch (e) { exc = e.message; }
        const v = T.check({ full: true }); if (v.length) { bad.push('Schritt ' + k + ': ' + v[0]); T.resetBooks(); T._prev = null; }
        for (const a of Robots.assigns) if (a.free) for (const f of a.free) if (f[0] < a.y0 - 1 || f[0] > a.y0 + a.h + 1) bad.push('Anspruch außerhalb des Gebiets');
      }
      // danach ruhig laufen lassen: kein Roboter darf ewig ohne Fortschritt hängen
      mode('far'); T.ticks(60 * 120, 0); mode();
      const states = {}; for (const r of Robots.list) { const k = Robots.status(r); states[k] = (states[k] || 0) + 1; }
      const hung = Robots.list.filter(r => r.state === 'work' && G.t - r.progT > CONFIG.robots.stall * 1.5);
      rec('RT-04', !exc && !bad.length && !hung.length ? 'OK' : 'FEHLER', '300 Zufallsänderungen (Trichter/Antenne/Hangar bauen und abreißen, Umweisen, automatisch zuweisen, Verkaufen, Kaufen, Heimschicken, Rückgängig) im Wechsel von Detail- und Fernmodus: Ausnahmen ' + (exc || 'keine') + '; Invarianten ' + (bad.slice(0, 3).join(' | ') || 'eingehalten (keine verlorene Fracht, keine veralteten Verweise, Ansprüche im Gebiet)') + '; nach 2 Min. Ruhe ' + JSON.stringify(states) + ', hängend ' + hung.length, states);
    }
    // 5) Funknetz
    {
      await setup(2, 'mk2', { assign: false });
      T.ticks(2, 0); let n = 0; const rb = Buildings.rebuildCoverage; Buildings.rebuildCoverage = function () { n++; return rb.call(this); };
      T.ticks(600, 0); const idleRebuilds = n;
      const dep = Buildings.mainDepot(), c = Buildings.center(dep), R0 = Buildings.radioRadius(dep);
      const ants = []; for (const dx of [280, 540]) { const x = Math.floor(c.x + dx), y = Math.floor(c.y); T.cleanRect(x - 2, y - 2, 4, 4); ants.push(T.act('place', 'antenna', x, y, 0).b); }
      const far = U.sectorAt(c.x + 600, c.y); const okA = T.act('assign', Robots.list.map(r => r.id), Robots.areaFor(far), false);
      mode('far'); T.ticks(60 * 240, 0);
      const working = Robots.list.filter(r => !r.warn && Robots.status(r) !== 'idle').length;
      T.act('remove', ants[0].id); T.ticks(60 * 5, 0);
      const outside = Robots.list.filter(r => !Buildings.covered(r.x, r.y)), warned = outside.filter(r => r.warn).length, pos = Robots.list.map(r => [r.x, r.y]);
      T.ticks(60 * 10, 0); const still = Robots.list.every((r, i) => Math.hypot(r.x - pos[i][0], r.y - pos[i][1]) < 0.01 || !r.warn);
      T.act('undo'); T.ticks(60 * 10, 0); const resumed = Robots.list.filter(r => !r.warn).length;
      mode(); Buildings.rebuildCoverage = rb;
      rec('RT-05', idleRebuilds === 0 && okA.ok && outside.length > 0 && warned === outside.length && still && resumed === Robots.list.length ? 'OK' : 'FEHLER', 'Funknetz: ' + idleRebuilds + ' Neuberechnungen in 10 s ohne Änderung; Antennenkette gebaut → Roboter im fernen Sektor arbeiten (' + working + '/' + Robots.list.length + '); mittlere Antenne abgerissen → ' + warned + ' von ' + outside.length + ' Robotern außerhalb des Netzes mit Warnung „kein Funksignal“, stehen still ' + still + '; Antenne wieder da (Rückgängig) → ' + resumed + ' arbeiten weiter. Hangar zählt als schwache Antenne (' + CONFIG.robots.hangarRadio + ' Zellen).');
    }
    // 6) Offline: 3 Stunden, einmalig, Uhr-Sprünge
    {
      await setup(4, 'mk2'); mode('far'); T.ticks(60 * 30, 0); mode();
      // ein Roboter außerhalb des Funknetzes arbeitet offline nicht
      const lone = Robots.list[3]; lone.x = st.x + 2000; lone.y = st.y; Robots.recall([lone]);
      await Save.saveNow(true); for (let i = 0; i < 100 && Save.saving; i++) await new Promise(r => setTimeout(r, 10));
      const patch = async (sec) => { const r0 = await Save.get('core', 's0'); const g = JSON.parse(r0.json); g.lastReal = Date.now() - sec * 1000; const j = JSON.stringify(g); await Save.putMany('core', [['s0', Object.assign({}, r0, { json: j, sum: U.fnv(j) })]]); };
      let sum = null; const os0 = UI.offlineSummary; UI.offlineSummary = function (o) { sum = o; return os0.call(this, o); };
      const load = async () => { sum = null; const g0 = T.books().grants.offline || 0; await Game.loadGame(0); Game.loop = function () { }; Game.paused = true; return (T.books().grants.offline || 0) - g0; };
      const saved = JSON.parse((await Save.get('core', 's0')).json).money;
      await patch(3 * 3600); const lx = lone.x; const g1 = await load(); const m1 = G.money; const loneAfter = Robots.list.find(r => r.id === lone.id);
      const g2 = await load(); const m2 = G.money;
      await Save.saveNow(true); for (let i = 0; i < 100 && Save.saving; i++) await new Promise(r => setTimeout(r, 10));
      await patch(-7200); const g3 = await load();
      await Save.saveNow(true); for (let i = 0; i < 100 && Save.saving; i++) await new Promise(r => setTimeout(r, 10));
      await patch(86400 * 10); const g4 = await load(); const s4 = sum; UI.offlineSummary = os0;
      const capOk = s4 && s4.away === CONFIG.offline.maxHours * 3600 && Math.abs(s4.sim - s4.away * s4.eff) < 1e-6;
      rec('RT-06', g1 > 0 && Math.abs((m2 - saved) - (m1 - saved) * (g2 / g1)) < Math.max(1, g1 * 0.5) && g3 === 0 && g4 > 0 && capOk && Math.abs(loneAfter.x - lx) < 0.01 ? 'OK' : 'FEHLER', '3 Std. abwesend (3 Roboter im Netz, 1 außerhalb): +' + g1.toFixed(0) + ' ₥, Roboter außerhalb bewegt sich nicht (' + (Math.abs(loneAfter.x - lx) < 0.01) + '). Zweites Laden ohne Speichern rechnet erneut auf den gespeicherten Stand (+' + g2.toFixed(0) + ' ₥, kein Doppelgewinn: Endstand ' + (m2 - saved).toFixed(0) + ' über Speicherstand). Uhr 2 Std. zurück: +' + g3 + ' ₥; Uhr 10 Tage vor (vom Stand nach den 3 Std., Netz schon weitgehend sauber): +' + g4.toFixed(0) + ' ₥, angerechnete Abwesenheit ' + (s4 ? (s4.away / 3600).toFixed(2) : '?') + ' Std. (Deckel ' + CONFIG.offline.maxHours + ' Std.), simuliert ' + (s4 ? (s4.sim / 3600).toFixed(2) : '?') + ' Std. bei ' + (s4 ? s4.eff * 100 : '?') + ' % Wirkungsgrad.');
    }
    // 7) Speichern und Laden mit mehreren Hangars, Modellen, Upgrades, Ladungen, Ansprüchen
    {
      const { h } = await setup(3, 'mk1'); G.licence = 6; World.updateLocks();
      const h2 = T.act('place', 'hangar', ...Object.values(T.findSpot('hangar', 0, { x: st.x + 26, y: st.y - 8 }, 12)), 0).b;
      T.act('robot', 'mk3', h2.id); T.act('robot', 'drone', h2.id); T.act('robotUp', 'speed'); T.act('robotUp', 'cap');
      T.act('assign', [Robots.list[3].id], Robots.areaFor(U.sectorAt(st.x, st.y)), false);
      mode('far'); T.ticks(60 * 45, 0); mode();
      Robots.list[0].load[1] = 3.25; T.resetBooks(); Robots.release(Robots.list[1]);   // Anspruch freigegeben → in a.free
      const freeBefore = JSON.stringify(Robots.assigns.map(a => a.free || []));
      const d = (await T.roundtrip()).filter(x => !x.startsWith('.prog'));
      const freeAfter = JSON.stringify(Robots.assigns.map(a => a.free || []));
      rec('RT-07', !d.length && freeBefore === freeAfter ? 'OK' : 'FEHLER', '2 Hangars, Mk1/Mk3/Drohne, Upgrades, Ladungen, freigegebene Bahn-Ansprüche: Rundlauf ' + (d.slice(0, 4).join(' | ') || 'identisch') + '; Ansprüche erhalten ' + (freeBefore === freeAfter) + '. Funknetz wird nicht gespeichert, sondern beim Laden aus den Antennen neu berechnet.');
    }
    // 8) Forschung: jeder Roboter-Knoten genau einmal, auch für schon gekaufte Roboter
    {
      await setup(1, 'mk2'); const r = Robots.list[0];
      const probe = () => ({ radius: Robots.radius(r), speed: Robots.speed(r), cap: Robots.cap(r), power: Robots.power(r), slots: Buildings.hangarSlots(), fleet: Robots.fleetCap(), price: Economy.robotPrice(r.def), self: Economy.fx('selfEmpty') });
      const exp = { l2: { radius: 1.15, power: 1.15 }, l3: { speed: 1.5, power: 1.5 }, l4: { cap: 1.5 }, l5: { self: '+1' }, l9: { slots: '+4', fleet: '+10' }, l10: { price: 0.8 }, l12: { speed: 1.25, radius: 1.25, power: 2 * 1.25 * 1.25 } };
      const bad = [];
      for (const id in exp) {
        const a = probe(); G.research[id] = 1; Economy.resetFx(); const b = probe(); G.research[id] = 1; Economy.resetFx(); const c = probe();
        for (const k in a) { const e = exp[id][k]; const ra = a[k] ? b[k] / a[k] : (b[k] === a[k] ? 1 : Infinity); if (e === undefined) { if (Math.abs(ra - 1) > 1e-9) bad.push(id + ' ändert auch ' + k); } else if (typeof e === 'string') { if (b[k] - a[k] !== +e.slice(1)) bad.push(id + ' ' + k); } else if (Math.abs(ra - e) > 1e-9) bad.push(id + ' ' + k + ' ×' + ra.toFixed(4)); if (JSON.stringify(b[k]) !== JSON.stringify(c[k])) bad.push(id + ' wirkt doppelt'); }
      }
      // Selbstentleerung: voller Mk2 liefert ohne Fahrt ab
      const stores = () => Buildings.list.reduce((k, b) => k + Buildings.total(b.store) + Buildings.total(b.capsule), 0);
      const x0 = r.x, y0 = r.y; r.load[0] = Robots.cap(r); r.state = 'work'; T.resetBooks(); const s0 = stores();
      mode('near'); T.ticks(90, 0); mode(); const s1 = stores() + T.books().sold;
      rec('RT-08', !bad.length && s1 - s0 > Robots.cap(r) * 0.99 ? 'OK' : 'FEHLER', 'Robo-Kalibrierung, Doppelschicht, Größere Robo-Tanks, Selbstentleerung, Hangar-Erweiterung, Serienfertigung, Flottenkommando: ' + (bad.join(', ') || 'jede wirkt genau auf die beschriebene Größe, auf den schon gekauften Roboter und nur einmal') + '. Selbstentleerung: voller Mk2 gibt ' + (s1 - s0).toFixed(1) + ' kg per Funk ab, ohne zum Ziel zu fahren (Weg ' + Math.hypot(r.x - x0, r.y - y0).toFixed(1) + ' Zellen in 1,5 s, putzt dabei weiter).');
    }
    // 9) Abriss und Kauf
    {
      const { h } = await setup(4, 'mk1', { assign: false }); G.licence = 2;
      const h2 = T.act('place', 'hangar', ...Object.values(T.findSpot('hangar', 0, { x: st.x + 28, y: st.y + 4 }, 12)), 0).b;
      for (let i = 0; i < 4; i++) T.act('robot', 'mk1', h2.id);
      Robots.list[0].load[0] = 12; T.resetBooks();
      const m0 = G.money, i0 = T.inv(); const r1 = T.act('remove', h.id);
      const moved = Robots.list.filter(r => r.hangar === h2.id).length, homeless = Robots.list.filter(r => !r.hangar).length, dm = G.money - m0;
      const m1 = G.money; const r2 = T.act('remove', h2.id); const homeless2 = Robots.list.filter(r => !r.hangar).length;
      T.ticks(60 * 5, 0); const bad = T.check({ full: true });
      const h3 = T.act('place', 'hangar', ...Object.values(T.findSpot('hangar', 0, { x: st.x + 14, y: st.y + 8 }, 12)), 0).b; T.ticks(60 * 3, 0);
      const rehomed = Robots.list.filter(r => r.hangar === h3.id).length;
      // voller Hangar, genau passender Betrag, Doppelklick
      const full = T.act('robot', 'mk1', h3.id); const price = Economy.robotPrice(Robots.def('mk1'));
      const h4 = T.act('place', 'hangar', ...Object.values(T.findSpot('hangar', 0, { x: st.x + 22, y: st.y + 12 }, 12)), 0).b;
      T.setMoney(price); const n0 = Robots.list.length; const b1 = T.act('robot', 'mk1', h4.id), b2 = T.act('robot', 'mk1', h4.id);
      rec('RT-09', r1.ok && moved === 6 && homeless === 2 && Math.abs(dm - Buildings.price('hangar')) < 1e-6 && r2.ok && homeless2 === 8 && !bad.length && rehomed === 6 && !full.ok && b1.ok && !b2.ok && Robots.list.length === n0 + 1 && Math.abs(G.money) < 1e-9 ? 'OK' : 'FEHLER',
        'Hangar mit 4 Robotern abgerissen: ' + moved + ' Roboter im zweiten Hangar (6 Plätze), ' + homeless + ' ohne Hangar, Geld nur +' + dm + ' ₥ (Baupreis), Fracht bleibt. Zweiten Hangar abgerissen: ' + homeless2 + ' ohne Hangar, Invarianten ' + (bad.join(' | ') || 'ok') + '. Neuer Hangar: ' + rehomed + ' ziehen ein. Kauf in vollen Hangar: ' + JSON.stringify(full) + '; genau passender Betrag kauft, Doppelklick bucht einmal (Roboter ' + n0 + ' → ' + Robots.list.length + ', Konto ' + G.money + ')');
    }
    // 10) Leistung: 100 Roboter (20 im Detail-Modus) plus Bänder
    {
      await setup(0, 'mk2'); G.licence = 6; World.updateLocks(); G.research.l9 = 1; Economy.resetFx();
      const h = Buildings.list.find(b => b.type === 'hangar');
      for (let i = 0; i < 100; i++) { const r = Robots.fromSave({ id: G.nextId++, model: ['mk1', 'mk2', 'mk3', 'drone'][i % 4], x: st.x + (i % 10) * 3, y: st.y + 20 + Math.floor(i / 10) * 3, hangar: h.id, state: 'home' }); Robots.list.push(r); }
      for (let k = 0; k < 5; k++) T.act('assign', Robots.list.filter((r, i) => i % 5 === k).map(r => r.id), Robots.areaFor(U.sectorAt(st.x + (k - 2) * 180, st.y + 60)), true);
      let belts = 0; for (let j = 0; j < 20; j++) { const p = []; for (let x = 0; x < 50; x++) p.push([st.x - 60 + x, st.y - 30 + j * 2, 0]); T.cleanRect(st.x - 60, st.y - 30 + j * 2, 50, 1); belts += T.act('belts', p, 3).n || 0; }
      const nearIds = new Set(Robots.list.slice(0, 20).map(r => r.id));
      Renderer.inView = (x, y, m) => false; const near = r => nearIds.has(r.id);
      const iv = Renderer.inView; Renderer.inView = function (x, y, m) { return this.__r && nearIds.has(this.__r.id); };
      // Detail-Modus für genau 20 Roboter: Robots.update fragt inView mit der Position; wir markieren über eine Positionsliste
      const pos = new Set(); Renderer.inView = (x, y) => { for (const r of Robots.list) if (nearIds.has(r.id) && r.x === x && r.y === y) return true; return false; };
      T.ticks(120, 0);
      let tot = 0; const N = 600; const up = Robots.update;
      Robots.update = function (dt) { const t0 = performance.now(); up.call(this, dt); tot += performance.now() - t0; };
      T.ticks(N, 0); Robots.update = up; mode();
      const ms = tot / N;
      rec('RT-10', ms <= 2 ? 'OK' : 'FEHLER', '100 Roboter (alle Modelle, 20 im Detail-Modus, 80 fern) plus ' + belts + ' Bandzellen: Robotersimulation ' + ms.toFixed(3) + ' ms pro Logiktick im Mittel (Headless-Chromium auf Desktop-CPU; ein iPad 9. Generation ist etwa 3–4× langsamer, also rund ' + (ms * 3.5).toFixed(2) + ' ms – geschätzt, nicht gemessen). Ziel ≤ 2 ms.', { ms });
    }
    // 12) Bedienung: Memo mit Häkchen, Hangar-Liste, Gesamtliste, Zuweisen über die Karte (Sektor gültig/gesperrt, Rechteck), HUD-Karte, Abriss-Rückfrage
    {
      const { h } = await setup(3, 'mk1', { assign: false, lic: 1 }); const bad = [];
      const wait = ms => new Promise(r => setTimeout(r, ms));
      G.robotTut = { seen: false, skip: false }; UI.tutorial();
      const memo = document.querySelector('#tutorial .memo');
      if (!memo || !/Automatisierung genehmigt/.test(memo.textContent)) bad.push('Memo fehlt');
      const okN = document.querySelectorAll('#tutorial .rsteps li.ok').length; if (okN !== 2) bad.push('Häkchen ' + okN + ' statt 2');
      [...document.querySelectorAll('#tutorial button')].find(b => /Los/.test(b.textContent)).click();
      if (!document.getElementById('tutorial').classList.contains('hidden') || !G.robotTut.memo) bad.push('Memo nicht weggelegt');
      const g0 = UI.goalList()[0]; if (!g0 || g0.id !== 'rt2') bad.push('Ziel „zuweisen“ fehlt (' + (g0 && g0.id) + ')');
      UI.openBuilding(h, 'list'); await wait(20);
      const rowsOf = id => { const p = UI.stack.find(x => x.o.id === id); return p ? p.body.querySelectorAll('.rrow').length : -1; }, rows = rowsOf('hangar'); if (rows !== 3) bad.push('Hangar-Liste ' + rows + ' Zeilen');
      for (const k in UI.RST) if (!Icons.P[UI.RST[k][2]]) bad.push('Symbol fehlt: ' + k);
      UI.closeAll(); UI.open('robots'); await wait(20); if (rowsOf('robots') !== 3) bad.push('Gesamtliste ' + rowsOf('robots'));
      UI.robotCard(); const lb = UI.iconBtns.robots.querySelector('.lb').textContent; if (!/^\d+ \/ 3$/.test(lb) || UI.iconBtns.robots.style.display === 'none') bad.push('HUD-Karte „' + lb + '“');
      // Karte: Sektor antippen
      const ids = Robots.list.map(r => r.id);
      UI.assignPick([ids[0]]); const M = UI.map; M.cv.setPointerCapture = () => { };
      const tap = (wx, wy) => { const q = UI.mapToScreen(wx, wy); const o = { pointerId: 7, clientX: q.x, clientY: q.y, bubbles: true }; M.cv.dispatchEvent(new PointerEvent('pointerdown', o)); M.cv.dispatchEvent(new PointerEvent('pointerup', o)); };
      let lockS = -1; for (let s = 0; s < NSEC * NSEC && lockS < 0; s++) if (World.locked(World.secRegion[s])) lockS = s;
      const la = Robots.areaFor(lockS); tap(la.x0 + 128, la.y0 + 128);
      if (Robots.list[0].assign || !M.assign) bad.push('gesperrter Sektor angenommen');
      const ss = U.sectorAt(st.x, st.y); tap(st.x, st.y);
      const a1 = Robots.list[0].assign ? Robots.assignById(Robots.list[0].assign) : null; if (!a1 || a1.sector !== ss || M.assign) bad.push('Sektor-Tipp nicht zugewiesen');
      // Rechteck
      UI.assignPick([ids[1], ids[2]]); const M2 = UI.map; M2.cv.setPointerCapture = () => { };
      [...M2.ab.querySelectorAll('button')].find(b => /Rechteck/.test(b.textContent)).click();
      const p1 = UI.mapToScreen(st.x - 40, st.y - 30), p2 = UI.mapToScreen(st.x + 40, st.y + 30);
      M2.cv.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 8, clientX: p1.x, clientY: p1.y })); M2.cv.dispatchEvent(new PointerEvent('pointermove', { pointerId: 8, clientX: p2.x, clientY: p2.y })); M2.cv.dispatchEvent(new PointerEvent('pointerup', { pointerId: 8, clientX: p2.x, clientY: p2.y }));
      const a2 = Robots.list[1].assign ? Robots.assignById(Robots.list[1].assign) : null; if (!a2 || a2.sector !== -1 || Robots.list[2].assign !== Robots.list[1].assign) bad.push('Rechteck nicht zugewiesen');
      UI.drawMap(); UI.closeMap();
      if (!G.robotTut.a) bad.push('Schritt 3 nicht erkannt');
      // Abriss mit Rückfrage
      const m0 = G.money; UI.demolishHangar(h); await wait(20);
      const ask = UI.stack.find(p => p.o.id === 'ask'); if (!ask || !Buildings.byId(h.id)) bad.push('keine Rückfrage');
      if (ask) [...ask.el.querySelectorAll('button')].find(b => b.textContent === 'Abreißen').click();
      if (Buildings.byId(h.id) || Robots.list.length !== 3 || Robots.list.some(r => r.hangar)) bad.push('Abriss/Umzug');
      UI.closeAll(); T.ticks(60, 0); const chk = T.check({ full: true });
      rec('RT-12', !bad.length && !chk.length ? 'OK' : 'FEHLER', 'Bedienung: Memo „Automatisierung genehmigt“ mit Häkchen, Hangar-Liste, Gesamtliste, HUD-Karte „' + lb + '“, Zuweisen per Karten-Tipp (gesperrter Sektor abgelehnt, Startsektor angenommen), Rechteck, Abriss nach Rückfrage (Roboter ohne Hangar, nichts verloren, Erstattung ' + U.money(G.money - m0) + '): ' + (bad.concat(chk).join(', ') || 'alles wie erwartet'));
    }
    return out;
  });
  res.push(await oldSave(env));
  return res;
};

// 11) Alter Spielstand (Originalfassung vor den Roboter-Änderungen, Schema 2, ohne Roboter):
// in der Originalfassung speichern, dann dort und in der neuen Fassung laden und 50 s identisch weiterspielen
async function oldSave(env) {
  const path = require('path');
  env.L.buildInstrumented(path.join(env.L.ROOT, 'index_audit_original.html'), 'index_audit_original_instrumented.html');
  // frischer Kontext (leerer Speicher); nur Zufalls-Seed, kein Löschen der Datenbank beim Öffnen der zweiten Seite
  const ctx = await env.browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(`(() => { let s = 4711; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();`);
  try {
  const cont = async (page) => page.evaluate(async () => {
    const T = __test, settle = async () => { for (let i = 0; i < 300 && Save.saving; i++) await new Promise(r => setTimeout(r, 10)); };
    await settle(); await Game.loadGame(0); Game.loop = function () { }; Game.paused = true; await settle();
    const v = G.v, tut = JSON.stringify(G.robotTut || null);
    Save.saveNow = async function () { }; Save.soon = function () { };   // Vergleichslauf darf den gemeinsamen Spielstand nicht überschreiben
    T.seedRandom(99); World.rnd = 99;
    const route = t => { const ph = Math.floor(t / 300) % 4; return { mx: [0, 1, 0, -1][ph], my: [1, 0, -1, 0][ph], clean: true }; };
    const trace = [];
    for (let tick = 0; tick < 3000; tick++) {
      T.setIntent(route(tick)); Game.tick(1 / 60);
      if (tick % 600 === 599) { const d = Buildings.mainDepot(); Player.x = Buildings.center(d).x; Player.y = d.y + d.h + 1.5; Actions.interact('unload'); Shop.do('launch', d.id); trace.push([tick, +G.money.toFixed(4), G.stats.cells, +G.stats.moneyEarned.toFixed(4)]); }
    }
    return { v, tut, run: JSON.stringify({ trace, money: +G.money.toFixed(6), cells: G.stats.cells, glanz: World.glanz().toFixed(10), x: +Player.x.toFixed(6), y: +Player.y.toFixed(6) }) };
  });
  const { page: po } = await env.open({ ctx, file: 'audit/index_audit_original_instrumented.html' });
  await po.evaluate(async () => {
    const T = __test; T.seedRandom(4711); await T.startNew(20261026); T.seedRandom(4711); World.rnd = 4711; G.tutSkip = true;
    for (let tick = 0; tick < 1200; tick++) { T.setIntent({ mx: tick < 600 ? 1 : 0, my: tick < 600 ? 0 : 1, clean: true }); Game.tick(1 / 60); }
    for (let i = 0; i < 300 && Save.saving; i++) await new Promise(r => setTimeout(r, 10));
    await Save.saveNow(true);
  });
  const a = await cont(po);
  const { page: pn } = await env.open({ ctx, file: 'audit/index_audit_instrumented.html' });
  const b = await cont(pn);
  await ctx.close();
  const same = a.run === b.run;
  return { id: 'RT-11', area: 'Roboter', status: same && a.v === 2 && b.v === 3 ? 'OK' : 'FEHLER', detail: 'Alter Spielstand ohne Roboter (mit der Fassung vor den Roboter-Änderungen gespeichert, Schema ' + a.v + '): in der neuen Fassung geladen (Schema ' + b.v + ', ergänzt robotTut ' + b.tut + ') und 50 s mit fester Route, Abladen und Kapselstart weitergespielt – ' + (same ? 'identisch mit der alten Fassung ' + b.run.slice(0, 160) : 'ABWEICHUNG alt ' + a.run.slice(0, 220) + ' | neu ' + b.run.slice(0, 220)) };
  } catch (e) { await ctx.close().catch(() => { }); return { id: 'RT-11', area: 'Roboter', status: 'FEHLER', detail: 'Alter Spielstand: Test abgebrochen: ' + (e.stack || e.message).slice(0, 400) }; }
}

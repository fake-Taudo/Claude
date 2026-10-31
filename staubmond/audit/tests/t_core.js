// Prüfbereiche 3.2 (Putzen und Staub), 3.3 (Behälter, Depot, Kapsel, Verkauf), 3.4 (Ökonomie)
module.exports = async function (env) {
  const { page } = await env.open();
  const R = await page.evaluate(async () => {
    const T = __test, out = [];
    const rec = (id, area, status, detail, data) => out.push({ id, area, status, detail, data });
    let ovSum = 0, ovN = 0; const A_ov = T2 => { const b = T2.books(); ovSum += b.overflow; ovN += b.overflowN; return false; };
    const fresh = async () => { T.setIntent({}); await T.startNew(20261026); await new Promise(r => setTimeout(r, 250)); };
    const dustSum = () => { let s = 0; for (const ch of World.chunks) if (ch) { for (let i = 0; i < 4096; i++) s += ch.dust[i] + (ch.meteor ? ch.meteor[i] : 0); } return s; };
    const st = CONFIG.world.start;

    /* ---------- 3.2 Putzen ---------- */
    await fresh();
    // a) Bildratenunabhängigkeit: gleiche Strecke, gleiche Leistung, verschiedene Schrittweiten
    {
      const res = {};
      for (const dt of [1 / 60, 0.1, 0.5, 1]) {
        World.init(G.seed); World.updateLocks(); for (const k in World.chunks) World.chunks[k] = null;
        const x0 = st.x - 40, y0 = st.y + 30, speed = 2, power = 2.5, dur = 6; let kg = 0, t = 0, x = x0;
        while (t < dur - 1e-9) { const nx = x + speed * dt; kg += World.stroke(x, y0, nx, y0, 1.6, power * dt, false, 1); x = nx; t += dt; }
        res[dt.toFixed(3)] = +kg.toFixed(4);
      }
      const v = Object.values(res), spread = (Math.max(...v) - Math.min(...v)) / Math.max(...v);
      rec('C-01', '3.2', 'OK', 'Spielfigur und Fahrzeuge putzen in festen Logikschritten (Game.STEP = 1/60 s, unabhängig von der Bildrate) – die Menge pro Spielzeit ist daher bildratenunabhängig. World.stroke selbst ist schrittweitenabhängig (große Schritte entfernen weniger, weil das Budget pro Schritt auf wenige Zellen verteilt wird); relevant nur für Roboter im Fernmodus (×6) und offline (1 s), siehe R-Funde. Gleiche Strecke (6 s, 2 Zellen/s, Besen 2,5 kg/s) mit Schrittweite 16 ms/100 ms/0,5 s/1 s: entfernte kg ' + JSON.stringify(res) + ', Streuung ' + (spread * 100).toFixed(2) + ' %', res);
      World.init(G.seed); World.updateLocks();
    }
    await fresh();
    // b) Überlappende Striche: entfernte kg == Summe der Zellwert-Abnahme (keine Verdopplung, kein Verlust)
    {
      const d0 = dustSum(); let kg = 0;
      // erst einen Chunk materialisieren, damit dustSum ihn sieht
      World.mat(World.ci(st.x - 20, st.y + 20)); World.mat(World.ci(st.x + 20, st.y + 20));
      const dA = dustSum();
      for (let i = 0; i < 400; i++) { const x = st.x - 20 + (i % 40) * 0.5, y = st.y + 20 + Math.floor(i / 40) * 0.3; kg += World.stroke(x, y, x + 0.7, y + 0.2, 1.0, 0.03, false, 1); }
      const dB = dustSum(), units = dA - dB, expect = units * KG_UNIT; // Ebene: massMul 1
      rec('C-02', '3.2', Math.abs(expect - kg) < 1e-9 ? 'OK' : 'FEHLER', '400 überlappende Striche: entfernt ' + kg.toFixed(6) + ' kg, Abnahme der Zellwerte ' + expect.toFixed(6) + ' kg (Zellwert-Einheiten ' + units + ')');
      // c) Rest-Staub 1–8 bleibt nirgends liegen
      let rest = 0; for (const ch of World.chunks) if (ch) for (let i = 0; i < 4096; i++) if (ch.dust[i] > 0 && ch.dust[i] <= CLEAN_T) rest++;
      rec('C-03', '3.2', rest === 0 ? 'OK' : 'FEHLER', 'Zellen mit Rest-Staub 1–8 nach dem Putzen: ' + rest + ' (Code: Zelle ≤ 8 wird auf 0 gesetzt und der Rest als kg verbucht, World.stroke)');
    }
    // d) Überlauf: Behälter fast voll, dichter Staub (Fundstück-Hügel 255) → geht Staub verloren?
    await fresh();
    {
      const f = World.finds[0]; Player.x = f.x - 1.4; Player.y = f.y; Player.tx = Player.ptx = f.x - 0.6; Player.ty = Player.pty = f.y;
      const cap = Player.ownCap();
      T.resetBooks();
      for (const gap of [0.006, 0.008, 0.012, 0.02, 0.03, 0.05]) for (let k = 0; k < 6; k++) {
        const g2 = World.finds[k % 2]; Player.x = g2.x - 1.3; Player.y = g2.y + (k - 3) * 0.3; Player.ptx = Player.tx = g2.x - 0.5; Player.pty = Player.ty = g2.y;
        Player.load.fill(0); Player.load[0] = cap - gap; T.resetBooks();
        T.setIntent({ mx: 0.5, my: 0.1, clean: true, aimX: g2.x, aimY: g2.y }); T.ticks(20, 0);
        if (A_ov(T)) break;
      }
      rec('C-04', '3.2', ovSum > 1e-9 ? 'FEHLER' : 'OK', 'Behälter knapp unter Kapazität (6 bis 50 g frei), Putzen am Fundstück-Hügel (Staubwert 255), 36 Versuche à 20 Ticks: World.stroke liefert mehr als das Budget (Rundung je Zelle, Rest ≤ 8 wird mitgenommen); Player.takeCol schreibt ohne Schubkarre nur den freien Platz gut, der Rest verschwindet. Verlust: ' + ovSum.toFixed(5) + ' kg bei ' + ovN + ' Ereignissen (Staub ist von der Karte entfernt, aber nirgends gutgeschrieben).', { ovSum, ovN });
    }
    // e) Überschreitung des Budgets durch World.stroke (Leistung pro Tick)
    await fresh();
    {
      let over = 0, n = 0, worst = 0;
      for (let i = 0; i < 2000; i++) {
        const x = st.x - 60 + (i % 100) * 0.3, y = st.y + 25 + Math.floor(i / 100) * 0.5, budget = 0.0005 + (i % 7) * 0.0003;
        const kg = World.stroke(x, y, x + 0.25, y, 0.6, budget, false, 1); n++;
        if (kg > budget + 1e-12) { over++; worst = Math.max(worst, kg / budget); }
      }
      rec('C-05', '3.2', over ? 'ABWEICHUNG' : 'OK', 'World.stroke hält das kg-Budget (Leistung × dt) nicht exakt ein: ' + over + ' von ' + n + ' kleinen Strichen liefern mehr als das Budget, höchstens ×' + worst.toFixed(2) + ' (stochastische Rundung je Zelle + Rest ≤ 8). Im Mittel ausgeglichen, aber Ursache für C-04 und Überfüllung von Fahrzeug- und Roboterbehältern.');
    }
    // f) Fahrzeug/Roboter: Behälter über Kapazität?
    await fresh();
    {
      T.setMoney(5000); T.act('vehicle', 'kehrwagen'); const v = Vehicles.list[0];
      Vehicles.enter(v); const cap = Vehicles.cap(v); v.load[0] = cap - 0.002;
      T.setIntent({ mx: 1, my: 0.2, clean: true }); T.ticks(240, 0);
      const l = Vehicles.loadKg(v);
      rec('C-06', '3.5', l > cap + 1e-9 ? 'ABWEICHUNG' : 'OK', 'Kehrwagen 0,002 kg unter Kapazität, 4 s putzend fahren: Ladung ' + l.toFixed(4) + ' / ' + cap + ' kg (Überfüllung ' + Math.max(0, l - cap).toFixed(4) + ' kg, nichts geht verloren, Anzeige kann „600,0 / 600“ übersteigen)');
      Vehicles.exit();
    }
    // g) Gewicht pro Zelle: 255 = 0,5 kg (× Massenfaktor)
    {
      await fresh();
      const f = World.finds[0], x = Math.floor(f.x), y = Math.floor(f.y), v = World.dustAt(x, y);
      const kg = World.stroke(x + 0.5, y + 0.5, x + 0.5, y + 0.5, 0.01, 10, true, 1);
      rec('C-07', '3.2', Math.abs(kg - v / 255 * 0.5) < 1e-9 ? 'OK' : 'FEHLER', 'Einzelzelle mit Wert ' + v + ' vollständig geputzt: ' + kg.toFixed(6) + ' kg (Soll ' + (v / 255 * 0.5).toFixed(6) + ' kg, kgPerFullCell 0,5)');
    }
    // h) Werkzeugwechsel: Behälter bleibt, Kapazität unverändert
    {
      await fresh(); T.setMoney(400); T.act('tool', 'handbuerste'); Player.load[0] = 7.5; T.act('tool', 'zahnbuerste');
      rec('C-08', '3.2', Math.abs(Player.loadKg() - 7.5) < 1e-12 ? 'OK' : 'FEHLER', 'Werkzeugwechsel mit 7,5 kg im Behälter: danach ' + Player.loadKg() + ' kg; Kapazität hängt nur am Behälter-Upgrade, nicht am Werkzeug');
    }
    // i) Schubkarre: Rest landet in der Karre, auch über deren Kapazität?
    {
      await fresh(); T.setMoney(1000); T.act('vehicle', 'schubkarre'); const v = Vehicles.list[0]; Vehicles.enter(v);
      Player.load[0] = Player.ownCap(); v.load[0] = Vehicles.cap(v) - 0.03;
      const f = World.finds[1]; Player.x = f.x - 1.2; Player.y = f.y; Player.ptx = Player.tx = f.x - 0.4; Player.pty = Player.ty = f.y;
      T.setIntent({ mx: 0.3, my: 0, clean: true, aimX: f.x, aimY: f.y }); T.ticks(120, 0);
      rec('C-09', '3.5', Vehicles.loadKg(v) > Vehicles.cap(v) + 1e-9 ? 'ABWEICHUNG' : 'OK', 'Schubkarre fast voll: Karre ' + Vehicles.loadKg(v).toFixed(4) + ' / ' + Vehicles.cap(v) + ' kg (Player.takeCol schreibt den Rest ohne Kapazitätsprüfung in die Karre)');
      Vehicles.exit();
    }

    /* ---------- 3.3 Depot, Kapsel, Verkauf ---------- */
    await fresh();
    {
      const dep = Buildings.mainDepot(), c = Buildings.center(dep);
      Player.x = c.x; Player.y = dep.y + dep.h + 1.2;
      // leerer Behälter
      T.interact('unload'); rec('D-01', '3.3', Buildings.total(dep.store) + Buildings.total(dep.capsule) === 0 ? 'OK' : 'FEHLER', 'Abladen mit leerem Behälter ändert nichts');
      // exakte Menge, Doppeltipp
      Player.load[0] = 2.2; Player.load[1] = 0; T.interact('unload'); T.interact('unload');
      const tot = Buildings.total(dep.store) + Buildings.total(dep.capsule);
      rec('D-02', '3.3', Math.abs(tot - 2.2) < 1e-12 && Player.loadKg() === 0 ? 'OK' : 'FEHLER', 'Abladen 2,2 kg (Doppeltipp): im Depot ' + tot + ' kg, Behälter ' + Player.loadKg());
      T.ticks(30, 0);
      const capKg = Buildings.total(dep.capsule), storeKg = Buildings.total(dep.store);
      // kleine Mengen werden NICHT automatisch verkauft: sie liegen in der Kapsel bis 200 kg oder manuellem Start
      const m0 = G.money, c0 = G.stats.capsules;
      const can = Buildings.canLaunch(dep);
      T.act('launch', dep.id);
      const gained = G.money - m0;
      const ref = 2.2 * Economy.value(0) * Economy.demandMul(0) * Economy.incomeMul();
      rec('D-03', '3.3', Math.abs(gained - ref) < 1e-9 ? 'OK' : 'FEHLER', 'Nach dem Abladen liegen ' + capKg.toFixed(2) + ' kg in der Kapsel (Puffer ' + storeKg.toFixed(2) + ' kg) – kein Sofortverkauf. Manueller Start (ab 0,5 kg erlaubt: ' + can + '): +' + gained.toFixed(4) + ' ₥ = Referenz 2,2 kg × ' + Economy.value(0) + ' × Nachfrage ' + Economy.demandMul(0) + ' × Multiplikator ' + Economy.incomeMul() + ' = ' + ref.toFixed(4) + ' ₥. Zähler „Kapseln gestartet“ ' + c0 + ' → ' + G.stats.capsules);
      rec('D-04', '3.3', 'HINWEIS', 'Rundung: Der Kontostand wird nie gerundet (G.money = ' + G.money + '). Die Anzeige „+3 ₥“ für 3,3 ₥ entsteht nur durch U.big (Math.floor ohne Nachkommastellen); kein Verlust, der Rest bleibt im Konto.');
      // Kapselstart unter 0,5 kg
      T.ticks(60 * 7, 0); Player.load[0] = 0.3; T.interact('unload'); T.ticks(60, 0);
      const r = T.act('launch', dep.id);
      rec('D-05', '3.3', !r.ok ? 'OK' : 'FEHLER', 'Manueller Start mit 0,3 kg wird abgelehnt (minManualKg 0,5): ' + JSON.stringify(r) + '; die 0,3 kg bleiben im Depot (Kapsel ' + Buildings.total(dep.capsule).toFixed(2) + ' kg, Puffer ' + Buildings.total(dep.store).toFixed(2) + ' kg)');
      // Automatischer Start bei 200 kg, Rest bleibt im Puffer
      T.ticks(60 * 7, 0); G.tutSkip = true;
      const before = Buildings.total(dep.capsule) + Buildings.total(dep.store), m1 = T.books().soldMoney;
      Buildings.deliver(dep, 0, 250); const c1 = G.stats.capsules;
      T.ticks(120, 0);
      const after = { cap: Buildings.total(dep.capsule), store: Buildings.total(dep.store), launched: G.stats.capsules - c1, money: T.books().soldMoney - m1 };
      const exp = 200 * Economy.value(0) * Economy.demandMul(0) * Economy.incomeMul();
      rec('D-06', '3.3', after.launched === 1 && Math.abs(after.money - exp) < 1e-6 && Math.abs(after.cap + after.store - (before + 250 - 200)) < 1e-6 ? 'OK' : 'FEHLER', 'Automatischer Start: ' + before.toFixed(2) + ' + 250 kg geliefert → 1 Start mit 200 kg (+' + after.money.toFixed(2) + ' ₥, Soll ' + exp.toFixed(2) + '), Rest ' + (after.cap + after.store).toFixed(2) + ' kg bleibt (Kapsel ' + after.cap.toFixed(2) + ', Puffer ' + after.store.toFixed(2) + ')', after);
      // Abladen während Startvorbereitung/Abklingzeit
      Player.load[0] = 3; T.interact('unload');
      rec('D-07', '3.3', Buildings.total(dep.store) + Buildings.total(dep.capsule) >= 3 - 1e-9 ? 'OK' : 'FEHLER', 'Abladen während der Abklingzeit (cool ' + dep.cool.toFixed(2) + ' s): Ware landet im Puffer und wird nach der Abklingzeit in die Kapsel umgefüllt');
    }
    // Verkaufspreis: Erdnachfrage und Multiplikator (Video: 1,50 ₥/kg bei +50 %)
    await fresh();
    {
      G.demand.type = 0; const shown = Economy.value(0) * Economy.demandMul(0) * Economy.incomeMul();
      const kg = new Float64Array(NGOODS); kg[0] = 10; kg[1] = 4; kg[6] = 1;
      const m0 = G.money; Economy.sell(kg, 'depot'); const got = G.money - m0;
      const ref = 10 * 1.0 * 1.5 * Economy.incomeMul() + 4 * 1.5 * 1 * Economy.incomeMul() + 1 * Economy.value(6) * Economy.incomeMul();
      rec('D-08', '3.3', Math.abs(got - ref) < 1e-9 ? 'OK' : 'FEHLER', 'Preisliste zeigt Mondstaub ' + shown.toFixed(2) + ' ₥/kg (= Wert 1,00 × Nachfrage 1,5 × Multiplikator ' + U.f2(Economy.incomeMul()) + '). Verkauf 10 kg Mondstaub + 4 kg Regolith + 1 kg Meteorstaub: +' + got.toFixed(4) + ' ₥, unabhängige Referenz ' + ref.toFixed(4) + ' ₥. Der Nachfragebonus ist in der Preisliste schon eingerechnet und wird beim Verkauf genau einmal angewendet; „Einnahmen-Multiplikator ×1,00“ enthält ihn nicht.');
      // Rundungsdrift: 100.000 Kleinstverkäufe
      const m1 = G.money; const one = new Float64Array(NGOODS);
      for (let i = 0; i < 100000; i++) { one[0] = 0.0123; Economy.sell(one, 'depot'); }
      const drift = (G.money - m1) - 100000 * 0.0123 * 1.5 * Economy.incomeMul();
      rec('D-09', '4.1', Math.abs(drift) < 1e-6 ? 'OK' : 'ABWEICHUNG', '100.000 Verkäufe à 0,0123 kg: Abweichung zur Referenz ' + drift.toExponential(3) + ' ₥ (Gleitkomma, kein systematischer Verlust)');
    }
    // Erdnachfrage-Timer: läuft auf Spielzeit G.t, also auch bei offenem Terminal (Spiel läuft weiter); Speichern/Laden
    await fresh();
    {
      const u0 = G.demand.until, t0 = G.t; UI.modal = true; T.ticks(600, 0); UI.modal = false;
      const ran = G.t - t0;
      const before = G.demand.until - G.t;
      const diff = await T.roundtrip();
      const after = G.demand.until - G.t;
      rec('D-10', '3.3', ran > 9.9 && Math.abs(before - after) < 1e-9 ? 'OK' : 'FEHLER', 'Erdnachfrage-Restzeit läuft bei offenem Terminal weiter (10 s Spielzeit vergangen, Restzeit ' + before.toFixed(2) + ' s) und ist nach Speichern/Laden identisch (' + after.toFixed(2) + ' s). Rundlauf-Abweichungen: ' + (diff.length ? diff.slice(0, 5).join(' | ') : 'keine'), diff);
      rec('D-11', '4.1', 'ABWEICHUNG', 'Die Wahl der nächsten Nachfrage-Staubart nutzt Math.random() (Economy.updateDemand, Zeile 2848). Ebenso Meteor-, Sonnenwind- und Inspektionszeitpunkte, Meteorpositionen, Auftragswahl und die Startposition gekaufter Roboter. Math.random wird außerdem von Musik und Klängen verbraucht – Spielverläufe sind dadurch nicht reproduzierbar (für die Tests ersetzt das Harness Math.random durch einen festen Seed).');
    }
    // Außenposten: getrennte Puffer; Abriss mit gefüllter Kapsel
    await fresh();
    {
      G.licence = 2; World.updateLocks(); T.setMoney(1e6);
      const dep = Buildings.mainDepot();
      T.cleanRect(st.x + 8, st.y - 3, 8, 8);
      const sp = T.findSpot('outpost', 0, { x: st.x + 12, y: st.y + 1 }, 10);
      const r = sp ? T.act('place', 'outpost', sp.x, sp.y, 0) : { ok: false, why: 'kein Platz' };
      if (r.ok) {
        const o = r.b; Buildings.deliver(o, 0, 50); T.ticks(30, 0);
        const sep = Buildings.total(dep.capsule) + Buildings.total(dep.store) === 0 && Buildings.total(o.capsule) > 49.99;
        const m0 = G.money; T.act('remove', o.id); const ref = Buildings.price('outpost') + 50 * Economy.value(0);
        rec('D-12', '3.3', sep && Math.abs(G.money - m0 - ref) < 1e-6 ? 'OK' : 'FEHLER', 'Außenposten führt eigenen Puffer und eigene Kapsel (Hauptdepot bleibt leer: ' + sep + '). Abriss mit 50 kg in der Kapsel erstattet Baupreis + Ware zum Grundwert ohne Nachfrage/Multiplikator: +' + (G.money - m0).toFixed(2) + ' ₥ (Referenz ' + ref.toFixed(2) + ')');
      } else rec('D-12', '3.3', 'NICHT PRÜFBAR', 'Außenposten konnte nicht platziert werden: ' + r.why);
    }

    /* ---------- 3.4 Ökonomie ---------- */
    await fresh();
    {
      // Kostenformel aller Upgrade-Linien, Stufe 0–15
      let bad = [], mono = [];
      for (const u of CONFIG.upgrades) { let last = -1; for (let l = 0; l <= 15; l++) { const p = Economy.upPrice(u.id, l), ref = Math.round(u.base * Math.pow(1.65, l)); if (p !== ref || !isFinite(p)) bad.push(u.id + l); if (p <= last) mono.push(u.id + l); last = p; } }
      rec('E-01', '3.4', bad.length || mono.length ? 'FEHLER' : 'OK', 'Upgrade-Kosten Stufe 0–15 aller 6 Linien gegen Referenz round(base × 1,65^Stufe): Abweichungen ' + (bad.join(',') || 'keine') + ', nicht steigend ' + (mono.join(',') || 'keine'));
      // Maximalstufe
      G.up.container = 15; T.setMoney(1e12); const r = T.act('upgrade', 'container');
      rec('E-02', '3.4', !r.ok && G.up.container === 15 ? 'OK' : 'FEHLER', 'Kauf über Stufe 15: ' + JSON.stringify(r));
      G.up.container = 0;
      // exakter Betrag / ein Cent zu wenig / zwei Klicks im selben Frame
      const p = Economy.upPrice('shoes'); T.setMoney(p); const a = T.act('upgrade', 'shoes'), b = T.act('upgrade', 'shoes');
      rec('E-03', '3.4', a.ok && !b.ok && G.up.shoes === 1 && Math.abs(G.money) < 1e-9 ? 'OK' : 'FEHLER', 'Genau passender Betrag (' + p + ' ₥) kauft, zweiter Klick im selben Frame scheitert (Stufe ' + G.up.shoes + ', Konto ' + G.money + ')');
      const p2 = Economy.upPrice('shoes'); T.setMoney(p2 - 0.01); const c = T.act('upgrade', 'shoes');
      rec('E-04', '3.4', !c.ok ? 'OK' : 'FEHLER', 'Ein Cent zu wenig (' + (p2 - 0.01) + ' von ' + p2 + '): ' + JSON.stringify(c));
      // spend-Toleranz: 1e-6 unter Preis erlaubt Kauf → Konto knapp negativ
      T.setMoney(p2 - 5e-7); const d = T.act('upgrade', 'shoes');
      rec('E-05', '4.1', d.ok && G.money < 0 ? 'ABWEICHUNG' : 'OK', 'Economy.spend erlaubt Käufe bis 1e-6 ₥ unter dem Preis (Toleranz gegen Gleitkomma). Folge: Konto kann minimal negativ werden: ' + G.money);
      // „Es fehlen X ₥“
      T.setMoney(16.7); const msg = Shop.miss(250);
      rec('E-06', '3.4', msg === 'Es fehlen 234 ₥' ? 'OK' : 'ABWEICHUNG', 'Konto 16,7 ₥, Preis 250 ₥: Text „' + msg + '“. Tatsächlich fehlen 233,3 ₥; U.big rundet ab, der Text nennt also bei Nachkommastellen 1 ₥ zu wenig (bei ganzzahligem Konto wie im Video, 250 − 17 = 233, stimmt er).');
      // Werkzeuge nicht doppelt, Lizenz gesperrt
      T.setMoney(1e6); const w1 = T.act('tool', 'besen'), m0 = G.money, w2 = T.act('tool', 'besen');
      const w3 = T.act('tool', 'mopp');
      rec('E-07', '3.4', w1.ok && G.money === m0 && !w3.ok ? 'OK' : 'FEHLER', 'Werkzeug zweimal „kaufen“ bucht nur einmal ab (zweiter Aufruf rüstet nur aus); Mopp ohne Lizenz 1: ' + JSON.stringify(w3));
      // Ausrüstung nach Neuladen
      T.act('tool', 'handbuerste');
      const diff = await T.roundtrip();
      rec('E-08', '3.4', G.tool === 'handbuerste' && G.tools.besen === 1 && !diff.length ? 'OK' : 'FEHLER', '„Im Besitz“/„Ausgerüstet“ nach Speichern/Laden: ausgerüstet ' + G.tool + ', Besitz ' + Object.keys(G.tools).join(',') + '; Abweichungen ' + (diff.slice(0, 4).join(' | ') || 'keine'));
    }
    // Einnahmen pro Minute
    await fresh();
    {
      // direkt nach dem Start: Division durch max(10, t)
      const kg = new Float64Array(NGOODS); kg[0] = 10; Economy.sell(kg, 'depot');
      const r1 = Economy.incomePerMin();
      T.ticks(60 * 30, 0); const r2 = Economy.incomePerMin(); T.ticks(60 * 31, 0); const r3 = Economy.incomePerMin();
      rec('E-09', '3.4', 'HINWEIS', 'Einnahmen/Min. = Summe der letzten 60 s × 60 / min(60, max(10, Spielzeit)). 15 ₥ Verkauf bei t≈0: Anzeige ' + r1.toFixed(1) + ' ₥/Min (hochgerechnet auf 10 s), nach 30 s ' + r2.toFixed(1) + ', nach 61 s ' + r3.toFixed(1) + '. Sprünge wie „30 → 20 → 23 → 25“ entstehen, weil Kapselverkäufe einzelne große Beträge sind, die nach 60 s aus dem Fenster fallen.');
      // nach dem Laden: Fenster wird geleert, Teilung durch 60
      T.ticks(60, 0); Economy.sell(kg, 'depot'); const before = Economy.incomePerMin(); await T.roundtrip(); const after = Economy.incomePerMin();
      rec('E-10', '3.4', 'HINWEIS', 'Nach Speichern/Laden beginnt das Einnahmen-Fenster leer (vorher ' + before.toFixed(1) + ', danach ' + after.toFixed(1) + ' ₥/Min.); kein Fehler, aber die Anzeige fällt beim Laden auf 0.');
      // Rückerstattungen zählen als Einnahmen
      G.licence = 1; World.updateLocks(); T.setMoney(1e6); T.cleanRect(st.x + 8, st.y - 3, 4, 4);
      T.ticks(60 * 61, 0); const e0 = G.stats.moneyEarned, i0 = Economy.incomePerMin();
      const sp = T.findSpot('antenna', 0, { x: st.x + 10, y: st.y }, 8); const pr = T.act('place', 'antenna', sp.x, sp.y, 0); T.act('remove', pr.b.id);
      const e1 = G.stats.moneyEarned, i1 = Economy.incomePerMin();
      rec('E-11', '3.4', e1 > e0 ? 'FEHLER' : 'OK', 'Antenne bauen (1.500 ₥) und sofort abreißen: Statistik „Verdient“ steigt um ' + (e1 - e0).toFixed(0) + ' ₥, Einnahmen/Min. von ' + i0.toFixed(0) + ' auf ' + i1.toFixed(0) + ' ₥. Erstattungen laufen über Economy.grant und zählen als Einnahmen (Grundlage für Aufträge „Haushaltsziel“, Auftragsbelohnungen und Inspektionsprämien).');
    }
    // HUD-Ziel „Laufschuhe 1 (noch X ₥)“ und Lizenz-Ziel
    await fresh();
    {
      T.setMoney(14); const g = UI.goalList(); const ng = UI.nextGoal();
      rec('E-12', '3.4', 'OK', 'HUD-Ziel nutzt dieselben Preisfunktionen wie der Kauf (Economy.toolPrice/upPrice): „' + g[0].t + '“ ' + g[0].n + ', Balken ' + (g[0].p * 100).toFixed(1) + ' %; nächstes Ziel ' + ng.name + ' ' + ng.price + ' ₥');
      const lic = g.find(x => x.id === 'lic');
      rec('E-13', '3.9', 'OK', 'Lizenz-Ziel kombiniert beide Bedingungen: Text „' + lic.n + '“, Balken = 50 % Sektoren + 50 % Geld (' + (lic.p * 100).toFixed(1) + ' %), „kaufbar“ nur wenn beide erfüllt (ok=' + lic.ok + '); Geld wird erst beim Kauf abgezogen (Economy.buyLicence → spend).');
    }
    return out;
  });
  return R;
};

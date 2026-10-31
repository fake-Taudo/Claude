// Phase B: Regressionstests für die behobenen Funde F-01 bis F-04 (vor der Behebung rot, danach grün),
// dazu CONFIG-Vergleich und 60-s-Logiklauf gegen index_audit_original.html.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
module.exports = async function (env) {
  const out = [];
  const rec = (id, area, status, detail, data) => out.push({ id, area, status, detail, data });
  const { page } = await env.open();
  const r = await page.evaluate(async () => {
    const T = __test, out = [], st = CONFIG.world.start;
    const rec = (id, status, detail) => out.push({ id, area: 'Phase B', status, detail });
    const recount = () => { const bad = []; for (let i = 0; i < 300; i++) World.processPending(50); T.checkRecount((k, m) => bad.push(m)); return bad; };
    const settle = async () => { for (let i = 0; i < 500 && Save.saving; i++) await new Promise(r => setTimeout(r, 5)); };

    // RB-01 (F-01): „Neu“ auf belegtem Platz (UI-Weg) darf keine alten Chunks übernehmen
    {
      await T.startNew(20261026); const f = World.finds[0];
      World.stroke(f.x - 6, f.y, f.x + 6, f.y, 3, 1e12, true, 1); T.cleanRect(st.x - 40, st.y + 20, 30, 10); await settle(); await Save.saveNow(true);
      await Game.newGame(0); for (let i = 0; i < 100 && Game.state !== 'play'; i++) await new Promise(r => setTimeout(r, 20)); Game.loop = function () { }; Game.paused = true;
      await settle(); await Save.saveNow(true); await settle();
      await Game.loadGame(0); Game.loop = function () { }; Game.paused = true;
      const bad = recount(), dirty = World.dustAt(Math.floor(f.x), Math.floor(f.y)) > CLEAN_T;
      rec('RB-01', !bad.length && dirty ? 'OK' : 'FEHLER', 'F-01: Spiel A putzt und speichert, „Neu“ auf demselben Platz, speichern, laden: Fundstückzelle wieder staubig ' + dirty + ', Neuzählung ' + (bad.join(' | ') || 'stimmt'));
    }
    // RB-02 (F-02): Änderung während des Komprimierens bleibt als „geändert“ markiert und wird gespeichert
    {
      await T.startNew(20261026); const ci = World.ci(st.x + 30, st.y + 30); World.mat(ci); World.markDirty(ci, 0, 0, 1, 1); await settle();
      const gz0 = Save.gz; Save.gz = async function (u8) { await new Promise(r => setTimeout(r, 60)); return gz0.call(this, u8); };
      const p = Save.saveNow(false); await new Promise(r => setTimeout(r, 20));
      World.stroke(st.x + 26, st.y + 30.5, st.x + 34, st.y + 30.5, 1.5, 1e12, true, 1);
      await p; Save.gz = gz0; await settle();
      const dirtyAfter = World.dirtySave.has(ci);
      await Save.saveNow(false); await settle();
      const before = Array.from(World.chunks[ci].dust);
      await Game.loadGame(0); Game.loop = function () { }; Game.paused = true;
      let d = 0; const after = World.chunks[ci].dust; for (let i = 0; i < 4096; i++) if (after[i] !== before[i]) d++;
      rec('RB-02', dirtyAfter && d === 0 ? 'OK' : 'FEHLER', 'F-02: Putzen im Chunk, während er komprimiert wird: danach noch als geändert markiert ' + dirtyAfter + '; nach dem nächsten Speichern und Laden ' + d + ' abweichende Zellen');
    }
    // RB-03 (F-03): Speicherauftrag während laufendem Speichern wird nachgeholt; Laden wartet
    {
      await T.startNew(20261026); T.cleanRect(st.x - 40, st.y + 20, 20, 4); await settle();
      const gz0 = Save.gz; Save.gz = async function (u8) { await new Promise(r => setTimeout(r, 80)); return gz0.call(this, u8); };
      const p1 = Save.saveNow(true); await new Promise(r => setTimeout(r, 10));
      G.money = 777777; T.cleanRect(st.x - 40, st.y + 30, 20, 4);
      const p2 = Save.saveNow(false); await p1; await p2; await settle();
      const saved = JSON.parse((await Save.get('core', 's0')).json).money;
      // Laden direkt nach einem Speicherauftrag (wie „Hauptmenü“ → „Weiterspielen“)
      G.money = 888888; T.cleanRect(st.x - 40, st.y + 40, 20, 4);
      const p3 = Save.saveNow(true); await new Promise(r => setTimeout(r, 10));
      await Game.loadGame(0); Game.loop = function () { }; Game.paused = true; Save.gz = gz0; await p3; await settle();
      const bad = recount();
      rec('RB-03', saved === 777777 && G.money === 888888 && !bad.length ? 'OK' : 'FEHLER', 'F-03: zweiter Speicherauftrag während eines laufenden: gespeichertes Geld ' + saved + ' (Soll 777777); Laden während eines Speicherns: Geld ' + G.money + ' (Soll 888888), Neuzählung ' + (bad.join(' | ') || 'stimmt'));
    }
    // RB-04 (F-04): Erstattungen zählen nicht als Einnahmen
    {
      await T.startNew(20261026); G.licence = 2; World.updateLocks(); T.setMoney(1e6); T.cleanRect(st.x + 8, st.y - 6, 12, 12);
      T.ticks(60 * 61, 0);
      const e0 = G.stats.moneyEarned, i0 = Economy.incomePerMin();
      const sp = T.findSpot('antenna', 0, { x: st.x + 10, y: st.y }, 8); const pr = T.act('place', 'antenna', sp.x, sp.y, 0); T.act('remove', pr.b.id);
      const o = { id: G.orderSeq++, kind: 'earn', goal: 1000, reward: 10, fp: 1, signer: 'Test' }; o.base = Progression.statOf('earn', o); G.orders = [o]; G.tutSkip = true;
      const sp2 = T.findSpot('silo', 0, { x: st.x + 10, y: st.y }, 8); for (let i = 0; i < 3 && sp2; i++) { const b = T.act('place', 'silo', sp2.x, sp2.y, 0).b; if (b) T.act('remove', b.id); }
      const d0 = G.stats.ordersDone; T.ticks(60, 0);
      rec('RB-04', G.stats.moneyEarned === e0 && Economy.incomePerMin() === i0 && G.stats.ordersDone === d0 ? 'OK' : 'FEHLER', 'F-04: Bauen + Abreißen: „Verdient“ ' + e0 + ' → ' + G.stats.moneyEarned + ', Einnahmen/Min. ' + i0.toFixed(1) + ' → ' + Economy.incomePerMin().toFixed(1) + ', Auftrag „Haushaltsziel 1.000 ₥“ durch Erstattungen erledigt: ' + (G.stats.ordersDone - d0));
    }
    return out;
  });
  out.push(...r);

  // CONFIG byte-identisch
  const cfg = f => { const s = fs.readFileSync(f, 'utf8'); const i = s.indexOf('const CONFIG = {'); return s.slice(i, s.indexOf('\n};', i) + 3); };
  const h = f => crypto.createHash('sha1').update(cfg(f)).digest('hex');
  const ho = h(path.join(env.L.ROOT, 'index_audit_original.html')), hn = h(path.join(env.L.ROOT, 'index.html'));
  rec('RB-05', 'Phase B', ho === hn ? 'OK' : 'FEHLER', 'CONFIG byte-identisch mit index_audit_original.html: ' + (ho === hn) + ' (' + hn.slice(0, 10) + ')');

  // 60-s-Logiklauf: gleicher Seed, gleiche Eingaben, Original gegen aktuelle Fassung
  env.L.buildInstrumented(path.join(env.L.ROOT, 'index_audit_original.html'), 'index_audit_original_instrumented.html');
  const run60 = async (file) => {
    const { page: p } = await env.open({ file });
    return p.evaluate(async () => {
      const T = __test; T.seedRandom(4711); await T.startNew(20261026); T.seedRandom(4711); World.rnd = 4711; G.tutSkip = true;
      const route = t => { const ph = Math.floor(t / 300) % 4; return { mx: [1, 0, -1, 0][ph], my: [0, 1, 0, -1][ph], clean: true }; };
      const trace = []; let kg = 0;
      for (let tick = 0; tick < 3600; tick++) {
        T.setIntent(route(tick)); Game.tick(1 / 60);
        if (tick % 600 === 599) { const d = Buildings.mainDepot(); Player.x = Buildings.center(d).x; Player.y = d.y + d.h + 1.5; Actions.interact('unload'); Shop.do('launch', d.id); trace.push([tick, +G.money.toFixed(4), G.stats.cells, +G.stats.moneyEarned.toFixed(4)]); }
      }
      return JSON.stringify({ trace, money: +G.money.toFixed(6), cells: G.stats.cells, glanz: World.glanz().toFixed(10), earned: +G.stats.moneyEarned.toFixed(6) });
    });
  };
  const a = await run60('audit/index_audit_original_instrumented.html'), b = await run60('audit/index_audit_instrumented.html');
  rec('RB-06', 'Phase B', a === b ? 'OK' : 'ABWEICHUNG', '60-s-Logiklauf (feste Route, Abladen und Kapsel alle 10 s), Original gegen aktuelle Fassung: ' + (a === b ? 'identisch ' + b.slice(0, 200) : 'Original ' + a.slice(0, 260) + ' | aktuell ' + b.slice(0, 260)));
  return out;
};

// 2.5 Fuzzing: zufällige Aktionsfolgen (gleichmäßig über alle Aktionsarten), Invarianten nach jeder Aktion,
// Verletzungen werden auf eine minimale Folge reduziert (Delta-Debugging durch Wiederabspielen).
// Standard 2 Seeds × 1.000 Aktionen; LONG=1: 5 Seeds × 10.000 Aktionen (oder FUZZ_N / FUZZ_SEEDS)
module.exports = async function (env) {
  const LONG = !!process.env.LONG, N = +(process.env.FUZZ_N || (LONG ? 10000 : 1000)), SEEDS = +(process.env.FUZZ_SEEDS || (LONG ? 5 : 2));
  const out = [];
  const { page } = await env.open();
  await page.evaluate(SETUP);
  const known = [];
  const kindsTotal = {}; let total = 0;
  for (let k = 0; k < SEEDS; k++) {
    const seed = 1000 + k * 7919;
    const t0 = Date.now();
    const r = await page.evaluate(([seed, n, known]) => __test.fuzz(seed, n, 25, known), [seed, N, known]);
    total += r.actions.length; for (const q in r.kinds) kindsTotal[q] = (kindsTotal[q] || 0) + r.kinds[q];
    for (const f of r.found) {
      known.push(f.key);
      // minimieren: Präfix bis zum Fund, dann ddmin mit begrenztem Budget
      let seq = r.actions.slice(0, f.i + 1), tries = 0;
      const fails = async q => { tries++; return (await page.evaluate(([seed, q, key]) => __test.replay(seed, q, key), [seed, q, f.key])) >= 0; };
      if (await fails(seq)) {
        let gran = 2;
        while (seq.length >= 2 && tries < 60) {
          const chunk = Math.ceil(seq.length / gran); let reduced = false;
          for (let s = 0; s < seq.length && tries < 60; s += chunk) { const cand = seq.slice(0, s).concat(seq.slice(s + chunk)); if (cand.length && await fails(cand)) { seq = cand; gran = Math.max(gran - 1, 2); reduced = true; break; } }
          if (!reduced) { if (gran >= seq.length) break; gran = Math.min(seq.length, gran * 2); }
        }
      } else seq = null;
      out.push({ id: 'Z-F' + (out.length + 1), area: '2.5', status: 'FEHLER', detail: 'Fuzzing Seed ' + seed + ', Aktion ' + f.i + ': ' + f.msg + (seq ? ' · minimale Folge (' + seq.length + ' Aktionen): ' + JSON.stringify(seq.map(a => a.map(v => typeof v === 'number' ? +v.toFixed(3) : v))).slice(0, 700) : ' · nicht deterministisch reproduzierbar'), data: { seed, i: f.i, key: f.key, minimal: seq } });
    }
    for (const m of r.final) out.push({ id: 'Z-F' + (out.length + 1), area: '2.5', status: 'FEHLER', detail: 'Fuzzing Seed ' + seed + ', Endprüfung (Neuzählung): ' + m });
    out.push({ id: 'Z-S' + k, area: '2.5', status: 'HINWEIS', detail: 'Seed ' + seed + ': ' + r.actions.length + ' Aktionen in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s, Spielzeit ' + (r.state.t / 60).toFixed(1) + ' Min., Endzustand ' + JSON.stringify(r.state) + ', neue Verletzungsarten ' + r.found.length });
  }
  out.push({ id: 'Z-SUM', area: '2.5', status: 'HINWEIS', detail: 'Fuzzing gesamt: ' + total + ' Aktionen (' + SEEDS + ' Seeds × ' + N + '), Aktionsarten ' + JSON.stringify(kindsTotal) + '. Invarianten (Nicht-negativ, Obergrenzen, Fortschritt vorwärts, doppelter Zustand, Staub- und Geldbilanz, Belegung, Pakete, veraltete Verweise) nach jeder Aktion; vollständige Neuzählung aller Zellen nach jeder 25. Aktion und am Ende. Gleiche Verletzungsarten werden nur beim ersten Auftreten gemeldet.' });
  return out;
};

// Aktionsgenerator, Ausführung und Wiederabspielen im Seitenkontext
const SETUP = () => {
    const T = __test;
    const KINDS = ['ticks', 'walk', 'unload', 'launch', 'enter', 'exit', 'tool', 'upgrade', 'vehicle', 'licence', 'place', 'remove', 'move', 'rotate', 'belts', 'unbelts', 'undo', 'robot', 'robotSell', 'assign', 'recallRobots', 'robotUp', 'research', 'recallVeh', 'swap', 'meteor', 'money', 'vehUp', 'roundtrip'];
    const BT = ['hopper', 'silo', 'splitter', 'ramp', 'compressor', 'brickpress', 'glassoven', 'antenna', 'hangar', 'garage', 'outpost', 'teleport', 'lamp', 'bridge'];
    // erzeugt eine Aktion aus einem Zufallsstrom (nur Daten, damit sie wiederholbar ist)
    T.genAction = function (rnd) {
      const k = KINDS[Math.floor(rnd() * KINDS.length)], st = CONFIG.world.start, rx = () => Math.floor(st.x - 30 + rnd() * 60), ry = () => Math.floor(st.y - 30 + rnd() * 60);
      switch (k) {
        case 'ticks': return [k, 1 + Math.floor(rnd() * 120), rnd() * 2 - 1, rnd() * 2 - 1, rnd() < 0.7];
        case 'walk': return [k, rx(), ry()];
        case 'tool': return [k, CONFIG.tools[Math.floor(rnd() * CONFIG.tools.length)].id];
        case 'upgrade': return [k, CONFIG.upgrades[Math.floor(rnd() * CONFIG.upgrades.length)].id];
        case 'vehicle': return [k, CONFIG.vehicles[Math.floor(rnd() * CONFIG.vehicles.length)].id];
        case 'place': return [k, BT[Math.floor(rnd() * BT.length)], rx(), ry(), Math.floor(rnd() * 4)];
        case 'remove': case 'move': case 'rotate': case 'robot': case 'robotSell': case 'recallVeh': case 'vehUp': return [k, rnd(), rx(), ry(), Math.floor(rnd() * 4), rnd()];
        case 'belts': { const n = 1 + Math.floor(rnd() * 12), x = rx(), y = ry(), d = Math.floor(rnd() * 4), tier = 1 + Math.floor(rnd() * 3); return [k, x, y, n, d, tier, rnd() < 0.3]; }
        case 'unbelts': return [k, rx(), ry(), 1 + Math.floor(rnd() * 6)];
        case 'assign': return [k, rnd(), Math.floor(rnd() * 9)];
        case 'robotUp': return [k, ['speed', 'radius', 'cap'][Math.floor(rnd() * 3)]];
        case 'research': return [k, rnd()];
        case 'meteor': return [k, rx() + rnd(), ry() + rnd(), 2 + rnd() * 4];
        case 'money': return [k, Math.pow(10, 2 + rnd() * 5)];
        default: return [k, rnd()];
      }
    };
    const pick = (arr, r) => arr.length ? arr[Math.floor(r * arr.length) % arr.length] : null;
    T.doAction = async function (a) {
      const [k] = a, st = CONFIG.world.start;
      switch (k) {
        case 'ticks': T.setIntent({ mx: a[2], my: a[3], clean: a[4] }); T.ticks(a[1], 30); T.setIntent({}); break;
        case 'walk': { const dx = U.dx(Player.x, a[1]), dy = a[2] - Player.y, d = Math.hypot(dx, dy) || 1; T.setIntent({ mx: dx / d, my: dy / d, clean: true }); T.ticks(Math.min(240, Math.ceil(d / 4 * 60)), 30); T.setIntent({}); break; }
        case 'unload': { const dep = Buildings.nearest(Player.x, Player.y, b => b.def.drop); if (dep && a[1] < 0.5) { const c = Buildings.center(dep); if (!Player.veh) { Player.x = c.x; Player.y = dep.y + dep.h + 1.2; if (!Move.circleFree(Player.x, Player.y, 0.4, 'walk')) { const f = Move.findFree(Player.x, Player.y, 0.4, 'walk', 8); if (f) { Player.x = f.x; Player.y = f.y; } } } } Actions.interact('unload'); break; }
        case 'launch': { const d = Buildings.list.filter(b => b.type === 'depot' || b.type === 'outpost'); const b = pick(d, a[1]); if (b) T.act('launch', b.id); break; }
        case 'enter': { const v = pick(Vehicles.list, a[1]); if (v && !Player.veh && !v.incoming) { Player.x = v.x + v.def.body + 0.6; Player.y = v.y; if (!Move.circleFree(Player.x, Player.y, 0.4, 'walk')) { const f = Move.findFree(v.x, v.y, 0.4, 'walk', 6); if (f) { Player.x = f.x; Player.y = f.y; } } Actions.interact('enter'); } break; }
        case 'exit': Actions.interact('exit'); break;
        case 'tool': case 'upgrade': case 'vehicle': T.act(k, a[1]); break;
        case 'licence': T.act('licence'); break;
        case 'place': T.act('place', a[1], a[2], a[3], a[4]); break;
        case 'remove': { const b = pick(Buildings.list, a[1]); if (b) T.act('remove', b.id); break; }
        case 'move': { const b = pick(Buildings.list, a[1]); if (b) T.act('move', b.id, a[2], a[3], a[4]); break; }
        case 'rotate': { const b = pick(Buildings.list, a[1]); if (b) T.act('rotate', b.id); break; }
        case 'robot': { const h = pick(Buildings.list.filter(b => b.type === 'hangar'), a[1]); if (h) T.act('robot', CONFIG.robots[Math.floor(a[5] * CONFIG.robots.length)].id, h.id); break; }
        case 'robotSell': { const r = pick(Robots.list, a[1]); if (r) T.act('robotSell', r.id); break; }
        case 'recallVeh': { const v = pick(Vehicles.list, a[1]); const g = Buildings.list.find(b => b.type === 'garage'); if (v) T.act('recallVeh', v.id, a[5] < 0.5 && g ? g.id : undefined); break; }
        case 'vehUp': { const v = pick(Vehicles.list, a[1]); if (v) T.act('vehUp', v.id, ['speed', 'width', 'cap'][Math.floor(a[5] * 3)]); break; }
        case 'belts': { const [, x, y, n, d, tier, curve] = a; const p = []; let cx = x, cy = y, dd = d; for (let i = 0; i < n; i++) { if (curve && i === (n >> 1)) dd = (dd + 1) & 3; p.push([cx, cy, dd]); cx += DX[dd]; cy += DY[dd]; } T.act('belts', p, tier); break; }
        case 'unbelts': { const c = []; for (let i = 0; i < a[3]; i++) c.push([a[1] + i, a[2]]); T.act('unbelts', c); break; }
        case 'undo': T.act('undo'); break;
        case 'assign': { const rs = Robots.list.filter(() => true); if (rs.length) { const s = U.sectorAt(st.x + ((a[2] % 3) - 1) * 256, st.y + (((a[2] / 3) | 0) - 1) * 256); T.act('assign', rs.filter((r, i) => (i + Math.floor(a[1] * 10)) % 2 === 0).map(r => r.id), Robots.areaFor(s), true); } break; }
        case 'recallRobots': T.act('recallRobots', Robots.list.map(r => r.id)); break;
        case 'robotUp': T.act('robotUp', a[1]); break;
        case 'research': { const all = []; for (const br of CONFIG.research) for (const n of br.nodes) all.push(n.id); G.fp += 3; T.act('research', pick(all, a[1])); break; }
        case 'swap': if (G.orders.length) T.act('swapOrder', pick(G.orders, a[1]).id); break;
        case 'meteor': World.addMeteor(a[1], a[2], a[3], 200); break;
        case 'money': T.setMoney(G.money + a[1]); break;
        case 'roundtrip': { const d = (await T.roundtrip()).filter(x => !x.startsWith('.prog')); T.resetBooks(); if (d.length) return 'roundtrip: ' + d.slice(0, 3).join(' | '); break; }
      }
      return null;
    };
    T.fuzzStart = async function (seed) {
      T.seedRandom(seed); World.rnd = seed | 1; T.setIntent({});
      await T.startNew(20261026); T.seedRandom(seed); World.rnd = seed | 1;
      G.licence = 4; World.updateLocks(); T.setMoney(2e6); G.stats.sectors = 0;
      T.cleanRect(CONFIG.world.start.x - 32, CONFIG.world.start.y - 32, 64, 64);   // bebaubare Fläche
      T.resetBooks(); T._prev = null; T.known = new Set();
    };
    const keyOf = m => m.split(':')[0] + ':' + m.replace(/[0-9.,-]+/g, '#').slice(0, 70);
    // Einen Lauf ausführen; liefert neue (noch unbekannte) Verletzungsarten mit Aktionsindex
    T.fuzz = async function (seed, n, recountEvery, known) {
      await T.fuzzStart(seed);
      let s = seed >>> 0; const rnd = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
      const actions = [], found = [], kinds = {}; const kn = new Set(known || []);
      for (let i = 0; i < n; i++) {
        const a = T.genAction(rnd); actions.push(a); kinds[a[0]] = (kinds[a[0]] || 0) + 1;
        let err = null; try { err = await T.doAction(a); } catch (e) { err = 'exception: ' + (e && e.message); }
        const bad = T.check({ full: true, recount: recountEvery && i % recountEvery === recountEvery - 1 });
        if (err) bad.push(err);
        for (const m of bad) { const k = keyOf(m); if (!kn.has(k)) { kn.add(k); found.push({ i, key: k, msg: m, action: a }); } }
        if (bad.length) { T.resetBooks(); T._prev = null; }   // weiterlaufen, damit andere Fehler sichtbar werden
      }
      const fin = T.check({ full: true, recount: true }).filter(m => !kn.has(keyOf(m)));
      return { actions, found, kinds, final: fin, state: { money: G.money, buildings: Buildings.list.length, belts: Buildings.belts.size, robots: Robots.list.length, vehicles: Vehicles.list.length, t: G.t } };
    };
    // Wiederabspielen einer Teilfolge: tritt die Verletzung mit Schlüssel key auf?
    T.replay = async function (seed, actions, key) {
      await T.fuzzStart(seed);
      for (let i = 0; i < actions.length; i++) {
        let err = null; try { err = await T.doAction(actions[i]); } catch (e) { err = 'exception: ' + (e && e.message); }
        const bad = T.check({ full: true, recount: i === actions.length - 1 }); if (err) bad.push(err);
        if (bad.some(m => keyOf(m) === key)) return i;
        if (bad.length) { T.resetBooks(); T._prev = null; }
      }
      return -1;
    };
  };
module.exports.SETUP = SETUP;

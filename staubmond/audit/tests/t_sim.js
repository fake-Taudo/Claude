// 2.4 Zeitraffer-Simulation: ein Bot spielt nach einfachen Regeln (putzen, abladen, Kapsel starten, kaufen,
// Hangar/Roboter, Antennen, Forschung). Kontrollpunkte bei 10 Min., 1 Std., 5 Std., 20 Std. Spielzeit.
// Standard: 1 Seed × 1 Std. und 4 Seeds × 10 Min.   Langlauf LONG=1: 5 Seeds × 20 Std. (Kontrollpunkte 10 Min./1/5/20 Std.)
module.exports = async function (env) {
  const HOURS = +(process.env.SIM_HOURS || (process.env.LONG ? 20 : 0)), SEEDS = +(process.env.SIM_SEEDS || 5), ONLY = process.env.SIM_SEED ? [+process.env.SIM_SEED] : null;
  const plan = HOURS ? (ONLY || Array.from({ length: SEEDS }, (_, i) => 101 + i)).map(s => [s, HOURS * 3600]) : [[101, 3600], [102, 600], [103, 600], [104, 600], [105, 600]];
  const out = [];
  const pacing = { capsule: 1, brushes: 5, kehrwagen: 15, sector: 25, lic1robot: 30, lic1r3: 60, lic3r20: 180, lic6: 480 };
  const names = { capsule: 'Erste Kapsel', brushes: 'Handbürste + Besen', kehrwagen: 'Kehrwagen', sector: 'Erster Sektor', lic1robot: 'Lizenz 1 + Roboter', lic1r3: 'Mare Mopp, 3–5 Roboter', lic3r20: 'Lizenz 3, 20+ Roboter', lic6: 'Rückseite (Lizenz 6)' };
  for (const [seed, dur] of plan) {
    const { page } = await env.open({ rngSeed: seed });
    await page.evaluate(BOT);
    await page.evaluate(s => __bot.start(s), seed);
    const t0 = Date.now(); const checkpoints = [];
    const marks = [600, 3600, 5 * 3600, 20 * 3600].filter(m => m <= dur);
    let last = null;
    for (const m of marks) {
      while (true) {
        last = await page.evaluate(m => __bot.run(m, 1800), m);   // höchstens 30 Spielminuten pro Aufruf
        if (process.env.SIM_VERBOSE) console.log('  seed ' + seed + ' t=' + (last.t / 60).toFixed(0) + ' min, ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s', JSON.stringify(last.short));
        if (last.t >= m - 1e-6 || last.dead) break;
      }
      const cp = await page.evaluate(() => __bot.checkpoint());
      checkpoints.push(Object.assign({ at: m }, cp));
      if (last.dead) break;
    }
    const ms = checkpoints[checkpoints.length - 1].milestones;
    const mtxt = Object.keys(pacing).map(k => names[k] + ' ' + (ms[k] !== undefined ? (ms[k] / 60).toFixed(0) + ' Min.' : '–') + ' (Ziel ' + pacing[k] + ')').join(', ');
    const viol = checkpoints.flatMap(c => c.bad);
    out.push({ id: 'SIM-' + seed + '-' + (dur / 3600 >= 1 ? (dur / 3600) + 'h' : (dur / 60) + 'm'), area: '2.4', status: viol.length ? 'FEHLER' : 'OK', detail: 'Seed ' + seed + ', ' + (dur / 3600 >= 1 ? dur / 3600 + ' Std.' : dur / 60 + ' Min.') + ' Spielzeit in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s Rechenzeit. Kontrollpunkte: ' + checkpoints.map(c => (c.at >= 3600 ? c.at / 3600 + ' h' : c.at / 60 + ' min') + ': ' + JSON.stringify(c.state)).join(' | ') + '. Meilensteine: ' + mtxt + '. Invarianten (Neuzählung an jedem Kontrollpunkt, Bilanz alle 60 s): ' + (viol.slice(0, 6).join(' | ') || 'eingehalten') + '. Bot-Stillstände: ' + checkpoints[checkpoints.length - 1].stuck, data: checkpoints });
  }
  return out;
};

// Bot im Seitenkontext
const BOT = () => {
  const T = __test, st = CONFIG.world.start;
  const B = window.__bot = { };
  B.start = async function (seed) {
    T.seedRandom(seed); World.rnd = seed | 1; T.setIntent({});
    await T.startNew(20261026); T.seedRandom(seed); World.rnd = seed | 1; G.tutSkip = false;
    B.s = { target: null, mode: 'clean', lastPos: [Player.x, Player.y], still: 0, detour: 0, stuck: 0, stuckLong: 0, ms: {}, bad: [], sites: [], siteIdx: 0, lastCells: 0, lastCellsT: 0, idleWarn: 0, heap0: performance.memory ? performance.memory.usedJSHeapSize : 0 };
    // Antennen-Standorte: Ringe um das Depot
    for (const R of [280, 560, 840, 1120]) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + R / 1000; B.s.sites.push([st.x + Math.cos(a) * R, st.y + Math.sin(a) * R]); }
    T.resetBooks();
  };
  const dirtyNear = (x, y) => {
    let best = null, bd = 1e9; const xi = Math.floor(x), yi = Math.floor(y);
    for (let r = 2; r <= 48 && !best; r += 3) for (let k = 0; k < 16; k++) {
      const a = k / 16 * Math.PI * 2 + r * 0.37, cx = Math.floor(xi + Math.cos(a) * r), cy = Math.floor(yi + Math.sin(a) * r);
      if (cy < 4 || cy > WSIZE - 5) continue;
      if (World.locked(World.regionAt(cx, cy)) || World.secDone[U.sectorAt(cx, cy)]) continue;
      if (!World.isCleanableT(World.terrAt(cx, cy)) || World.dustAt(cx, cy) <= CLEAN_T) continue;
      if (Buildings.solidAt(cx, cy)) continue;
      const d = (cx - x) * (cx - x) + (cy - y) * (cy - y); if (d < bd) { bd = d; best = [cx + 0.5, cy + 0.5]; }
    }
    return best;
  };
  const buy = () => {
    const M = () => G.money;
    if (Economy.canBuyLicence().ok) T.act('licence');
    for (const t of CONFIG.tools) if (!G.tools[t.id] && t.licence <= G.licence && Economy.toolPrice(t) <= M() * 0.9) { T.act('tool', t.id); break; }
    const best = CONFIG.tools.filter(t => G.tools[t.id]).pop(); if (best && G.tool !== best.id) T.act('tool', best.id);
    const want = ['kehrwagen', 'rover', 'crawler'].filter(id => Vehicles.def(id).licence <= G.licence);
    for (const id of want) if (!Vehicles.list.some(v => v.type === id) && Math.round(Vehicles.def(id).price * Economy.fx('upgradePrice')) <= M() * 0.6) { T.act('vehicle', id); break; }
    let cu = null; for (const u of CONFIG.upgrades) { if ((u.licence || 0) > G.licence || (G.up[u.id] || 0) >= 15 || u.id === 'magnet') continue; const p = Economy.upPrice(u.id); if (!cu || p < cu[1]) cu = [u.id, p]; }
    if (cu && cu[1] <= M() * 0.35) T.act('upgrade', cu[0]);
    const v = Player.veh; if (v && v.def.kind !== 'cart') for (const k of ['cap', 'width', 'speed']) if (v.up[k] < 5 && Vehicles.upPrice(v, k) <= M() * 0.15) { T.act('vehUp', v.id, k); break; }
    // Hangar und Roboter
    if (G.licence >= 1) {
      let hs = Buildings.list.filter(b => b.type === 'hangar');
      const full = hs.every(h => Robots.inHangar(h) >= Buildings.hangarSlots());
      if ((!hs.length || full) && Robots.list.length < Robots.fleetCap() && M() > Buildings.price('hangar') * 1.6) {
        const dep = Buildings.mainDepot(), c = Buildings.center(dep);
        const sp = T.findSpot('hangar', 0, { x: c.x + 2 + hs.length * 5, y: c.y + 5 }, 26); if (sp) T.act('place', 'hangar', sp.x, sp.y, 0);
        hs = Buildings.list.filter(b => b.type === 'hangar');
      }
      const model = G.licence >= 4 ? 'mk3' : G.licence >= 2 ? 'mk2' : 'mk1', price = Economy.robotPrice(Robots.def(model));
      const h = hs.find(h => Robots.inHangar(h) < Buildings.hangarSlots());
      if (h && Robots.list.length < Robots.fleetCap() && price <= M() * 0.5) T.act('robot', model, h.id);
      if (Robots.list.length) for (const k of ['speed', 'radius', 'cap']) if (G.robotUp[k] < 10 && Robots.upPrice(k) <= M() * 0.12) { T.act('robotUp', k); break; }
    }
    // Forschung: billigster verfügbarer Knoten
    let rn = null; for (const br of CONFIG.research) for (let i = 0; i < br.nodes.length; i++) { const n = br.nodes[i]; if (G.research[n.id] || (i && !G.research[br.nodes[i - 1].id])) continue; if (!rn || n.cost < rn.cost) rn = n; break; }
    if (rn && G.fp >= rn.cost) T.act('research', rn.id);
  };
  const assign = () => {
    const idle = Robots.list.filter(r => !r.assign);
    if (!idle.length) return;
    const dep = Buildings.mainDepot(), c = Buildings.center(dep);
    let s = U.sectorAt(c.x, c.y);
    if (World.secDone[s] || Robots.assignedSector(s)) { s = Robots.nextSector(s); if (s < 0) { for (const a of Robots.assigns) { const n = Robots.nextSector(a.sector); if (n >= 0) { s = n; break; } } } }
    if (s >= 0) { const r = T.act('assign', idle.map(r => r.id), Robots.areaFor(s), true); if (!r.ok) B.s.needAntenna = true; }
    else B.s.needAntenna = true;
  };
  const go = (tx, ty, clean) => { const dx = U.dx(Player.x, tx), dy = ty - Player.y, d = Math.hypot(dx, dy) || 1; T.setIntent({ mx: dx / d, my: dy / d, clean, aimX: Player.veh ? null : tx, aimY: Player.veh ? null : ty }); return d; };
  const decide = () => {
    const S = B.s, P = Player;
    // Stillstand erkennen und ausweichen
    const moved = Math.hypot(U.dx(S.lastPos[0], P.x), P.y - S.lastPos[1]); S.lastPos = [P.x, P.y];
    if (S.detour > 0) { S.detour--; return; }
    if (moved < 0.15 && S.mode !== 'wait') { S.still++; if (S.still >= 4) { S.stuck++; S.still = 0; S.stuckLong++; const a = Math.random() * Math.PI * 2; T.setIntent({ mx: Math.cos(a), my: Math.sin(a), clean: true }); S.detour = 4; S.target = null; if (S.stuckLong > 6 && P.veh && P.veh.def.kind !== 'cart') { Vehicles.exit(); S.stuckLong = 0; } return; } } else { S.still = 0; S.stuckLong = Math.max(0, S.stuckLong - 1); }
    buy(); assign();
    // Fahrzeug nutzen
    if (!P.veh) { const v = Vehicles.list.filter(v => v.def.kind !== 'cart' && !v.incoming).sort((a, b) => b.def.cap - a.def.cap)[0]; if (v) { const d = U.dist(P.x, P.y, v.x, v.y); if (d < v.def.body + 2) { Vehicles.enter(v); } else if (d > 40 && G.money > Vehicles.recallFee(v) * 20) T.act('recallVeh', v.id); else if (d <= 40 && S.mode === 'clean') { go(v.x, v.y, true); return; } } }
    const load = P.ctxLoad(), cap = P.ctxCap();
    if (load >= cap * 0.95 || (S.mode === 'unload' && load > 0.01)) {
      if (Economy.remoteUnload() && Buildings.covered(P.x, P.y)) { Actions.interact('remote'); S.mode = 'clean'; }
      else {
        S.mode = 'unload'; const dep = Buildings.nearest(P.x, P.y, b => b.type === 'depot' || b.type === 'outpost');
        if (Buildings.distTo(dep, P.x, P.y) < CONFIG.player.interactRange + (P.veh ? P.veh.def.body : 0) - 0.3) { Actions.interact('unload'); S.mode = 'clean'; }
        else { const c = Buildings.center(dep); go(c.x, dep.y + dep.h + 1, false); return; }
      }
    }
    // Kapsel starten
    for (const d of Buildings.list) if ((d.type === 'depot' || d.type === 'outpost') && Buildings.canLaunch(d) && Buildings.total(d.capsule) + Buildings.total(d.store) >= (G.money < 3000 ? 1 : 60)) T.act('launch', d.id);
    // Antenne bauen
    if (S.needAntenna && S.siteIdx < S.sites.length && G.licence >= 1 && G.money > Buildings.price('antenna') * 3) {
      const [sx, sy] = S.sites[S.siteIdx];
      if (World.locked(World.regionAt(Math.floor(sx), Math.floor(sy))) || sy < 40 || sy > WSIZE - 40) { S.siteIdx++; return; }
      const d = go(sx, sy, true);
      if (d < 3) { const sp = T.findSpot('antenna', 0, { x: sx, y: sy }, 4); if (sp) { if (T.act('place', 'antenna', sp.x, sp.y, 0).ok) { S.siteIdx++; S.needAntenna = false; } } else { T.setIntent({ mx: 0, my: 0, clean: true, aimX: sx + Math.random() * 4 - 2, aimY: sy + Math.random() * 4 - 2 }); } }
      return;
    }
    // putzen
    if (!S.target || World.dustAt(Math.floor(S.target[0]), Math.floor(S.target[1])) <= CLEAN_T || U.dist(P.x, P.y, S.target[0], S.target[1]) < 0.8) S.target = dirtyNear(P.x, P.y);
    if (S.target) go(S.target[0], S.target[1], true); else { const a = Math.random() * 6.283; T.setIntent({ mx: Math.cos(a), my: Math.sin(a), clean: true }); }
  };
  const marks = () => {
    const m = B.s.ms, t = G.t, set = (k, c) => { if (m[k] === undefined && c) m[k] = t; };
    set('capsule', G.stats.capsules > 0); set('brushes', G.tools.handbuerste && G.tools.besen); set('kehrwagen', Vehicles.list.some(v => v.type === 'kehrwagen'));
    set('sector', G.stats.sectors > 0); set('lic1robot', G.licence >= 1 && Robots.list.length > 0); set('lic1r3', G.licence >= 1 && Robots.list.length >= 3);
    set('lic3r20', G.licence >= 3 && Robots.list.length >= 20); set('lic6', G.licence >= 6);
    for (let l = 1; l <= 6; l++) set('L' + l, G.licence >= l);
  };
  B.run = function (until, maxSec) {
    const end = Math.min(until, G.t + maxSec);
    let nextCheck = Math.ceil(G.t / 60) * 60;
    while (G.t < end - 1e-6) {
      decide();
      T.ticks(30, 30);
      marks();
      if (G.t >= nextCheck) { nextCheck += 60; const bad = T.check({ full: true }); if (bad.length) { for (const b of bad) if (B.s.bad.length < 30 && !B.s.bad.some(x => x.slice(0, 40) === b.slice(0, 40))) B.s.bad.push('t=' + (G.t / 60).toFixed(0) + 'min ' + b); T.resetBooks(); T._prev = null; } }
      // Stillstand: 10 Spielminuten ohne neue Zellen trotz Geld
      if (G.stats.cells + G.stats.robotCells !== B.s.lastCells) { B.s.lastCells = G.stats.cells + G.stats.robotCells; B.s.lastCellsT = G.t; }
      else if (G.t - B.s.lastCellsT > 600 && B.s.idleWarn < 3) { B.s.idleWarn++; B.s.bad.push('t=' + (G.t / 60).toFixed(0) + 'min Stillstand: 10 Min. keine neue Zelle (Geld ' + G.money.toFixed(0) + ', Lizenz ' + G.licence + ', Roboter ' + Robots.list.length + ')'); }
    }
    return { t: G.t, short: { money: Math.round(G.money), lic: G.licence, sec: G.stats.sectors, rob: Robots.list.length, cells: G.stats.cells + G.stats.robotCells, stuck: B.s.stuck } };
  };
  B.checkpoint = function () {
    for (let i = 0; i < 2000 && World.pendingStats.length; i++) World.processPending(50);
    const bad = T.check({ full: true, recount: true });
    for (const b of B.s.bad) bad.unshift(b); B.s.bad = [];
    const heap = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null;
    return { state: { money: Math.round(G.money), earned: Math.round(G.stats.moneyEarned), licence: G.licence, sectors: G.stats.sectors, robots: Robots.list.length, buildings: Buildings.list.length, research: Object.keys(G.research).length, glanz: +(World.glanz() * 100).toFixed(4), chunks: World.chunks.filter(Boolean).length, decalChunks: World.decals.size, baseCache: World.baseCache.size, heapMB: heap }, milestones: Object.assign({}, B.s.ms), bad: [...new Set(bad)], stuck: B.s.stuck };
  };
};

/* ============================================================================
   Staubmond – Test-Interface für die Logikprüfung (nur in audit/index_audit_instrumented.html)
   Treibt die Logik ohne Rendern: Ticks vorspulen, Aktionen auslösen, Zustand lesen,
   Invarianten prüfen, Staub- und Geldbuchhaltung, Speichern/Laden-Rundlauf, Bot.
   Wird beim Bauen der Testkopie vor </body> eingefügt; greift erst beim Aufruf auf die
   Spielobjekte zu (das Hauptskript läuft nach dem Ladebildschirm).
   ============================================================================ */
window.__test = (function () {
  const T = {};
  const EPS = 1e-6;
  let A = null, installed = false, intent = { mx: 0, my: 0, clean: false, aimX: null, aimY: null };
  const sum = a => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; };

  /* --- Haken: Buchhaltung für Staub (kg) und Geld (₥) --- */
  T.install = function () {
    if (installed) return; installed = true;
    // Hauptschleife einfrieren: Logik läuft nur über T.ticks (deterministisch, ohne Rendern)
    Game.__origLoop = Game.loop; Game.loop = function () { };
    Input.poll = function () { return intent; };
    const st0 = World.stroke; let depth = 0;
    World.stroke = function () { depth++; try { const r = st0.apply(this, arguments); if (depth === 1 && A) { A.removed += r; A.strokes++; } return r; } finally { depth--; } };
    const sell0 = Economy.sell;
    Economy.sell = function (kg, source) { let k = 0; for (let t = 0; t < NGOODS; t++) if (kg[t] > 0) k += kg[t]; const before = G.money; const r = sell0.call(this, kg, source); if (A && r > 0) { A.sold += k; A.soldMoney += r; A.soldBy[source] = (A.soldBy[source] || 0) + k; } if (A) A.moneyFlow += G.money - before; return r; };
    const gr0 = Economy.grant;
    Economy.grant = function (amount, reason) { const before = G.money; if (A && reason === 'offline') A.offline += Robots.offlineKg; gr0.call(this, amount, reason); if (A) { A.moneyFlow += G.money - before; if (amount > 0) A.grants[reason || '?'] = (A.grants[reason || '?'] || 0) + amount; } };
    const sp0 = Economy.spend;
    Economy.spend = function (n) { const before = G.money; const r = sp0.call(this, n); if (A) { A.moneyFlow += G.money - before; if (r) A.spent += n; } return r; };
    const um0 = Buildings.updateMachine;
    Buildings.updateMachine = function (b, dt) { const before = sum(b.inBuf) + sum(b.outBuf) + (b.prog || 0); um0.call(this, b, dt); if (A) A.machLoss += before - (sum(b.inBuf) + sum(b.outBuf) + (b.prog || 0)); };
    const tc0 = Player.takeCol;
    Player.takeCol = function (kg) { const before = this.loadKg() + (this.veh ? Vehicles.loadKg(this.veh) : 0); tc0.call(this, kg); const after = this.loadKg() + (this.veh ? Vehicles.loadKg(this.veh) : 0); if (A && kg > 0 && !(this === Player && Net.isClient())) { const lost = kg - (after - before); if (lost > 1e-9) { A.overflow += lost; A.overflowN++; } } };
  };
  T.resetBooks = function () {
    A = { removed: 0, strokes: 0, sold: 0, soldMoney: 0, soldBy: {}, grants: {}, spent: 0, machLoss: 0, exits: 0, offline: 0, overflow: 0, overflowN: 0, moneyFlow: 0, money0: G.money, inv0: T.inv() };
  };
  T.books = function () { return JSON.parse(JSON.stringify(A)); };
  T.setIntent = function (o) { intent = Object.assign({ mx: 0, my: 0, clean: false, aimX: null, aimY: null }, o); };

  /* --- Inventar: alle Orte, an denen entfernter Staub liegen kann --- */
  T.invParts = function () {
    const p = { player: Player.loadKg(), vehicles: 0, robots: 0, store: 0, inBuf: 0, outBuf: 0, capsule: 0, hold: 0, prog: 0, belts: 0, peers: 0 };
    for (const v of Vehicles.list) p.vehicles += Vehicles.loadKg(v);
    for (const r of Robots.list) p.robots += Robots.loadKg(r);
    for (const b of Buildings.list) { p.store += sum(b.store); p.inBuf += sum(b.inBuf); p.outBuf += sum(b.outBuf); p.capsule += sum(b.capsule); if (b.hold) p.hold += b.hold.kg; p.prog += b.prog || 0; }
    for (const bl of Buildings.belts.values()) for (const it of bl.items) p.belts += it.kg;
    if (typeof Net !== 'undefined' && Net.peers) for (const rp of Net.peers.values()) p.peers += sum(rp.load);
    return p;
  };
  T.inv = function () { const p = T.invParts(); let s = 0; for (const k in p) s += p[k]; return s; };
  // Aktion mit Erstattung (Abriss, Rückgängig, Bänder entfernen, Roboter verkaufen): Inventar-Abgang zählt als Ausgang
  T.act = function (name, ...args) {
    const i0 = T.inv(), s0 = A ? A.sold : 0, m0 = A ? A.machLoss : 0;
    const r = Shop.do(name, ...args);
    if (A) A.exits += (i0 - T.inv()) - (A.sold - s0) - (A.machLoss - m0);
    return r;
  };
  T.interact = function (id) { Actions.interact(id); };

  /* --- Ticks vorspulen (feste 60 Hz wie im Spiel) --- */
  T.ticks = function (n, snapEvery) {
    for (let i = 0; i < n; i++) { Game.tick(Game.STEP); if (snapEvery && i % snapEvery === 0) Camera.snap(); }
    return G.t;
  };

  /* --- Invarianten --- */
  const fin = v => typeof v === 'number' && isFinite(v);
  T.check = function (opts) {
    opts = opts || {};
    const bad = [];
    const add = (k, msg) => { bad.push(k + ': ' + msg); };
    // Nicht-negativ, endlich
    if (!fin(G.money)) add('nan', 'Geld ' + G.money); else if (G.money < -1e-6) add('neg', 'Geld ' + G.money);
    if (!fin(G.fp) || G.fp < 0) add('neg', 'FP ' + G.fp);
    const chkArr = (a, w) => { for (let i = 0; i < a.length; i++) { if (!fin(a[i])) add('nan', w + '[' + i + ']=' + a[i]); else if (a[i] < -1e-9) add('neg', w + '[' + i + ']=' + a[i]); } };
    chkArr(Player.load, 'Spieler');
    for (const v of Vehicles.list) { chkArr(v.load, 'Fahrzeug' + v.id); if (Vehicles.loadKg(v) > Vehicles.cap(v) + 1e-3) add('cap', 'Fahrzeug ' + v.id + ' ' + Vehicles.loadKg(v).toFixed(4) + ' > ' + Vehicles.cap(v).toFixed(4)); }
    for (const r of Robots.list) { chkArr(r.load, 'Roboter' + r.id); if (Robots.loadKg(r) > Robots.cap(r) + 1e-3) add('cap', 'Roboter ' + r.id + ' ' + Robots.loadKg(r).toFixed(4) + ' > ' + Robots.cap(r).toFixed(4)); }
    const own = Player.loadKg(), oc = Player.ownCap();
    if (own > oc + 1e-3) add('cap', 'Spielerbehälter ' + own.toFixed(4) + ' > ' + oc.toFixed(4));
    for (const b of Buildings.list) {
      for (const k of ['store', 'inBuf', 'outBuf', 'capsule']) chkArr(b[k], b.type + b.id + '.' + k);
      if (b.def.buffer && sum(b.store) > b.def.buffer + 1e-6) add('cap', b.type + ' ' + b.id + ' Lager ' + sum(b.store).toFixed(3) + ' > ' + b.def.buffer);
      if ((b.type === 'depot' || b.type === 'outpost') && sum(b.capsule) > CONFIG.depot.capsuleKg + 1e-6) add('cap', 'Kapsel ' + sum(b.capsule));
      if (b.prog < -1e-9 || !fin(b.prog)) add('nan', 'prog ' + b.prog);
    }
    for (let s = 0; s < NSEC * NSEC; s++) { const p = World.secProgress[s]; if (!fin(p) || p < -1e-9 || p > 1 + 1e-9) add('range', 'Sektor ' + s + ' Fortschritt ' + p); }
    const gz = World.glanz(); if (!fin(gz) || gz < -1e-9 || gz > 1 + 1e-9) add('range', 'Glanz ' + gz);
    // Fortschritt nur vorwärts
    const pr = T._prev;
    if (pr) {
      for (const s of pr.secDone) if (!World.secDone[s]) add('back', 'Sektor ' + s + ' nicht mehr fertig');
      if (G.licence < pr.licence) add('back', 'Lizenz gesunken');
      for (const k of pr.research) if (!G.research[k]) add('back', 'Forschung ' + k + ' verloren');
      for (const k of pr.finds) if (!G.finds[k]) add('back', 'Fundstück ' + k + ' verloren');
    }
    T._prev = { secDone: G.secDone.slice(), licence: G.licence, research: Object.keys(G.research), finds: Object.keys(G.finds) };
    // doppelter Zustand: Sektoren
    const sd = new Set(G.secDone);
    if (sd.size !== G.secDone.length) add('dup', 'G.secDone enthält Duplikate');
    if (G.stats.sectors !== G.secDone.length) add('dup', 'stats.sectors ' + G.stats.sectors + ' ≠ secDone ' + G.secDone.length);
    for (let s = 0; s < NSEC * NSEC; s++) if (!!World.secDone[s] !== sd.has(s)) { add('dup', 'World.secDone[' + s + '] ≠ G.secDone'); break; }
    if (Object.keys(G.finds).length !== G.stats.findsFound) add('dup', 'finds ' + Object.keys(G.finds).length + ' ≠ findsFound ' + G.stats.findsFound);
    // Staub- und Geldbilanz
    if (A) {
      const inv = T.inv(), bal = A.removed - A.sold - A.machLoss - A.exits - A.offline - (inv - A.inv0);
      if (Math.abs(bal) > 1e-6 * Math.max(1, A.removed)) add('mass', 'Staubbilanz weicht um ' + bal.toFixed(6) + ' kg ab (entfernt ' + A.removed.toFixed(3) + ', verkauft ' + A.sold.toFixed(3) + ', Inventar ' + inv.toFixed(3) + ', Überlauf ' + A.overflow.toFixed(6) + ')');
      const mb = G.money - (A.money0 + A.moneyFlow);
      if (Math.abs(mb) > 1e-6 * Math.max(1, Math.abs(G.money))) add('money', 'Geldbilanz weicht um ' + mb + ' ab');
    }
    // Objekte: ein Ort pro Objekt
    if (opts.full !== false) T.checkPlacement(add);
    if (opts.recount) T.checkRecount(add);
    return bad;
  };
  T.checkPlacement = function (add) {
    const exp = new Map();
    for (const b of Buildings.list) {
      if (b.type === 'bridge') continue;
      if (b.y < 2 || b.y + b.h > WSIZE - 2) add('place', b.type + ' ' + b.id + ' am Kartenrand y=' + b.y);
      for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++) { const k = (b.y + yy) * WSIZE + U.wrapI(b.x + xx); if (exp.has(k)) add('place', 'Überlappung ' + exp.get(k).id + '/' + b.id); exp.set(k, b); }
    }
    if (exp.size !== Buildings.occ.size) add('place', 'Belegungskarte ' + Buildings.occ.size + ' ≠ erwartet ' + exp.size);
    else for (const [k, b] of exp) if (Buildings.occ.get(k) !== b) { add('place', 'Belegung falsch bei ' + k); break; }
    for (const bl of Buildings.belts.values()) if (exp.has(bl.k)) add('place', 'Band unter Gebäude ' + exp.get(bl.k).id);
    // Pakete: jedes Objekt nur einmal und nicht im Pool
    const seen = new Set(), pool = new Set(Pool.items);
    const chk = (it, w) => { if (seen.has(it)) add('dup', 'Paket doppelt (' + w + ')'); seen.add(it); if (pool.has(it)) add('dup', 'Paket ist gleichzeitig im Pool (' + w + ')'); };
    for (const bl of Buildings.belts.values()) for (const it of bl.items) chk(it, 'Band ' + bl.x + ',' + bl.y);
    for (const b of Buildings.list) if (b.hold) chk(b.hold, b.type + b.id);
    // veraltete Verweise
    const ids = new Set(Buildings.list.map(b => b.id));
    for (const r of Robots.list) if (!ids.has(r.hangar)) add('stale', 'Roboter ' + r.id + ' verweist auf fehlenden Hangar ' + r.hangar);
    for (const v of Vehicles.list) if (v.garage && !ids.has(v.garage)) add('stale', 'Fahrzeug ' + v.id + ' verweist auf fehlende Garage ' + v.garage);
    const vid = new Set(); for (const v of Vehicles.list) { if (vid.has(v.id)) add('dup', 'Fahrzeug-ID doppelt ' + v.id); vid.add(v.id); }
    const rid = new Set(); for (const r of Robots.list) { if (rid.has(r.id)) add('dup', 'Roboter-ID doppelt ' + r.id); rid.add(r.id); }
    if (Player.veh && !Vehicles.list.includes(Player.veh)) add('stale', 'Spieler sitzt in unbekanntem Fahrzeug');
    if (Robots.list.length > Robots.fleetCap()) add('cap', 'Roboter ' + Robots.list.length + ' > Stellenplan ' + Robots.fleetCap());
  };
  // vollständige Neuzählung (nur im Test)
  T.checkRecount = function (add) {
    const S = NSEC * NSEC, sc = new Float64Array(S), sk = new Float64Array(S), kn = new Uint8Array(S);
    let cellsSum = 0, chunkBad = 0, first = '';
    for (let ci = 0; ci < NCH * NCH; ci++) {
      if (World.cleanable[ci] < 0) { if (World.chunks[ci]) { chunkBad++; if (!first) first = 'Chunk ' + ci + ' ohne Statistik'; } continue; }
      const b = World.base(ci), ch = World.chunks[ci]; let cl = 0, ca = 0;
      for (let i = 0; i < 4096; i++) if (World.isCleanableT(b.terr[i])) { ca++; if ((ch ? ch.dust[i] : b.dust[i]) <= CLEAN_T) cl++; }
      if (ca !== World.cleanable[ci] || cl !== World.chunkClean[ci]) { chunkBad++; if (!first) first = 'Chunk ' + ci + ' sauber ' + World.chunkClean[ci] + '≠' + cl + ' putzbar ' + World.cleanable[ci] + '≠' + ca; }
      const s = World.secOfChunk(ci); sc[s] += cl; sk[s] += ca; kn[s]++;
      cellsSum += cl - b.initClean;
    }
    if (chunkBad) add('recount', chunkBad + ' Chunk(s) mit falscher Statistik – ' + first);
    let secBad = 0, sfirst = '', glanz = 0;
    for (let s = 0; s < S; s++) {
      if (kn[s] !== World.secKnown[s] || sc[s] !== World.secClean[s] || sk[s] !== World.secCleanable[s]) { secBad++; if (!sfirst) sfirst = 'Sektor ' + s + ' sauber ' + World.secClean[s] + '≠' + sc[s]; }
      const p = kn[s] === 16 ? (sk[s] > 0 ? sc[s] / sk[s] : 1) : sc[s] / (sk[s] + (16 - kn[s]) * 4000);
      if (Math.abs(p - World.secProgress[s]) > 1e-6) { secBad++; if (!sfirst) sfirst = 'Sektor ' + s + ' Fortschritt ' + World.secProgress[s] + '≠' + p; }
      glanz += Math.min(1, p);
    }
    if (secBad) add('recount', secBad + ' Sektor-Abweichung(en) – ' + sfirst);
    if (Math.abs(glanz / S - World.glanz()) > 1e-7) add('recount', 'Mondglanz ' + World.glanz() + ' ≠ Neuzählung ' + glanz / S);
    if (cellsSum !== G.stats.cells) add('recount', 'stats.cells ' + G.stats.cells + ' ≠ Neuzählung ' + cellsSum);
  };

  /* --- Zustands-Schnappschuss für Rundlauf-Vergleiche --- */
  T.snapshot = function () {
    Player.save(); Vehicles.save(); Buildings.save(); Robots.save();
    const g = JSON.parse(JSON.stringify(G));
    delete g.saved; delete g.lastReal; delete g.glanzCache; delete g.chunkStats;
    const chunks = {}; for (const ch of World.chunks) if (ch) { let h = 0x811c9dc5; for (let i = 0; i < 4096; i++) { h ^= ch.dust[i]; h = Math.imul(h, 0x01000193); h ^= ch.meteor ? ch.meteor[i] : 0; h = Math.imul(h, 0x01000193); } chunks[ch.ci] = (h >>> 0).toString(16); }   // leeres Meteor-Feld = kein Meteor-Feld
    const stats = []; for (let ci = 0; ci < NCH * NCH; ci++) if (World.cleanable[ci] >= 0) stats.push(ci, World.cleanable[ci], World.chunkClean[ci]);
    const prog = Buildings.list.filter(b => b.prog).map(b => [b.id, b.prog]);
    return { g, chunks, stats, sp: Array.from(World.secProgress).map(v => +v.toFixed(9)), glanz: +World.glanz().toFixed(9), prog };
  };
  T.diff = function (a, b, path, out) {
    out = out || []; path = path || '';
    if (out.length > 40) return out;
    if (typeof a !== typeof b || (a === null) !== (b === null) || Array.isArray(a) !== Array.isArray(b)) { out.push(path + ': ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b)); return out; }
    if (a && typeof a === 'object') { const ks = new Set([...Object.keys(a), ...Object.keys(b)]); for (const k of ks) T.diff(a[k], b[k], path + '.' + k, out); return out; }
    if (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a))) return out;
    if (a !== b) out.push(path + ': ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b));
    return out;
  };
  // Speichern → Laden → Vergleich (gleiche Sitzung, gleicher Platz)
  T.roundtrip = async function () {
    for (let i = 0; i < 500 && Save.saving; i++) await new Promise(r => setTimeout(r, 5));   // laufendes Autosave abwarten (sonst S-03b)
    const a = T.snapshot();
    await Save.saveNow(true);
    await Game.loadGame(G.slot);
    Game.loop = function () { };
    const b = T.snapshot();
    return T.diff(a, b);
  };

  /* --- Hilfen für Tests --- */
  T.cleanRect = function (x0, y0, w, h) { let kg = 0; for (let y = y0; y <= y0 + h; y += 1) kg += World.stroke(x0, y, x0 + w, y, 1.2, 1e12, true); if (A) A.removed -= kg; return kg; };   // Testhilfe: Staub verschwindet bewusst (nicht Teil der Bilanz)
  T.setMoney = function (m) { const d = m - G.money; G.money = m; if (A) A.money0 += d; };
  T.findSpot = function (type, rot, near, maxR) {
    const def = Buildings.def(type), [w, h] = Buildings.dims(def, rot || 0);
    const cx = Math.floor(near.x), cy = Math.floor(near.y);
    for (let r = 0; r <= (maxR || 40); r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = cx + dx, y = cy + dy;
      if (Buildings.validate(type, x, y, rot || 0).ok && !T.overlapsPlayer(x, y, w, h)) return { x, y };
    }
    return null;
  };
  T.overlapsPlayer = function (x, y, w, h) { const px = U.wrapI(Math.floor(Player.x)), py = Math.floor(Player.y); return U.dx(x, px) >= -1 && U.dx(x, px) <= w && py >= y - 1 && py <= y + h; };
  T.seedRandom = function (seed) { let s = seed >>> 0 || 1; Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  T.ready = function () { return typeof Game !== 'undefined' && Game.state === 'menu'; };
  T.startNew = async function (seed, slot, keepSlot) {
    if (!keepSlot) await Save.deleteSlot(slot || 0);   // Test-Isolation (siehe Fund zu „Neues Spiel“ auf belegtem Platz)
    World.rnd = 12345;                                  // Rundungs-Zufall je Test gleich (wird vom Spiel nicht zurückgesetzt)
    await Game.newGame(slot || 0, seed);
    for (let i = 0; i < 200 && Game.state !== 'play'; i++) await new Promise(r => setTimeout(r, 20));
    Game.loop = function () { }; Game.paused = true;
    Camera.snap();
    T._prev = null; G.tutSkip = true;
    for (let i = 0; i < 100 && Save.saving; i++) await new Promise(r => setTimeout(r, 10));
    T.resetBooks();
    return G.seed;
  };
  return T;
})();

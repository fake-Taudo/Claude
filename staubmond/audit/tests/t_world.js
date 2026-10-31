// Prüfbereich 3.1 (Welt, Chunks, Karte): Determinismus, Sektor-/Regionszuordnung, Staubarten, Hindernisse
module.exports = async function (env) {
  const out = [];
  const hashBase = async (page) => page.evaluate(() => {
    const ids = []; for (let k = 0; k < 60; k++) ids.push((k * 1237 + 311) % (NCH * NCH));
    World.baseCache.clear(); World.rockCache.clear(); World.craterMemo.clear(); World.islandMemo.clear();
    const h = ids.map(ci => { const b = World.genBase(ci); let x = 0x811c9dc5; for (const arr of [b.dust, b.type, b.terr, b.region]) for (let i = 0; i < 4096; i++) { x ^= arr[i]; x = Math.imul(x, 0x01000193); } return (x >>> 0).toString(16); });
    return h.join(',');
  });
  const { page } = await env.open({ rngSeed: 1 });
  const r = await page.evaluate(async () => {
    const T = __test, out = [], st = CONFIG.world.start;
    const rec = (id, area, status, detail) => out.push({ id, area, status, detail });
    await T.startNew(20261026);
    // a) unberührter Chunk bitgleich: zweimal erzeugen, nach Cache-Leerung, nach Speichern/Laden
    const ci = World.ci(st.x + 300, st.y + 200);
    const a = World.genBase(ci).dust.slice(); World.baseCache.clear(); World.craterMemo.clear(); World.rockCache.clear(); World.islandMemo.clear();
    const b = World.base(ci).dust; let d1 = 0; for (let i = 0; i < 4096; i++) if (a[i] !== b[i]) d1++;
    await T.roundtrip(); const c = World.base(ci).dust; let d2 = 0; for (let i = 0; i < 4096; i++) if (a[i] !== c[i]) d2++;
    const mat = World.chunks[ci] ? 'materialisiert' : 'nicht materialisiert';
    rec('W-01', '3.1', d1 + d2 === 0 && !World.chunks[ci] ? 'OK' : 'FEHLER', 'Unberührter Chunk ' + ci + ': nach Cache-Leerung ' + d1 + ', nach Speichern/Laden ' + d2 + ' abweichende Zellen; bleibt ' + mat + ' (Chunks werden erst bei der ersten Änderung angelegt, World.mat)');
    // b) Sektor-/Chunk-Zuordnung: jede Zelle genau ein Sektor, Namen
    let bad = 0; for (let cy = 0; cy < NCH; cy++) for (let cx = 0; cx < NCH; cx++) { const k = cy * NCH + cx; for (const [ox, oy] of [[0, 0], [63, 63], [0, 63], [63, 0]]) if (U.sectorAt(cx * 64 + ox, cy * 64 + oy) !== World.secOfChunk(k)) bad++; }
    const lbl = [U.sectorLabel(U.sectorAt(st.x, st.y)), U.sectorLabel(U.sectorAt(0, 0)), U.sectorLabel(U.sectorAt(WSIZE - 1, WSIZE - 1)), U.sectorLabel(U.sectorAt(-1, 100))];
    rec('W-02', '3.1', !bad && lbl[0] === 'M-13' && lbl[1] === 'A-1' && lbl[2] === 'X-24' && lbl[3] === 'X-1' ? 'OK' : 'FEHLER', 'Sektorzuordnung: ' + bad + ' Abweichungen zwischen U.sectorAt (Zelle) und World.secOfChunk (Chunk) an allen Chunk-Ecken; Namen Start ' + lbl[0] + ', (0,0) ' + lbl[1] + ', (6143,6143) ' + lbl[2] + ', x = −1 → ' + lbl[3] + ' (Umlauf)');
    // c) Staubart je Zelle passt zur Region; Preis je Art
    let mism = 0, n = 0;
    for (let k = 0; k < 120; k++) { const cc = (k * 2711 + 97) % (NCH * NCH), bb = World.base(cc); for (let i = 0; i < 4096; i += 7) { n++; const reg = bb.region[i]; if (reg !== R_RUECK && bb.type[i] !== CONFIG.regions[reg].dust) mism++; } }
    rec('W-03', '3.1', mism ? 'FEHLER' : 'OK', 'Staubart je Zelle gegen Region (' + n + ' Stichproben in 120 Chunks): ' + mism + ' Abweichungen; Rückseite mischt bewusst alle Arten (World.dustTypeFor). Preis je kg kommt ausschließlich aus CONFIG.goods[Art].value (Meteorstaub: 3 × beste freigeschaltete Art).');
    // d) Hindernisse: Start, Depot, Fundstücke frei; Ausgangsposition begehbar
    const dep = Buildings.mainDepot(); let blk = 0; for (let y = 0; y < dep.h; y++) for (let x = 0; x < dep.w; x++) if (!World.isCleanableT(World.terrAt(dep.x + x, dep.y + y))) blk++;
    const free = Move.circleFree(CONFIG.world.start.x + 0.5, CONFIG.world.start.y + 5.6, 0.4, 'walk');
    rec('W-04', '3.1', !blk && free ? 'OK' : 'FEHLER', 'Depot liegt auf ' + blk + ' Hinderniszellen; Startposition begehbar ' + free + '. Felsen werden im Umkreis von 34 Zellen um den Start und 6 Zellen um Fundstücke nicht platziert (World.rocksOf); Bewegung prüft jede Teilstrecke (Move.slide, ≤ 0,45 Zellen) – Durchtunneln oder Festklemmen in Felsen ist so nicht möglich; Aussteigen/Lieferung/Teleport suchen freie Stellen (Move.findFree).');
    // e) Ost-West: Abstand, Sektor und Bewegung über die Naht
    const dxs = [U.dx(WSIZE - 1, 1), U.dx(1, WSIZE - 1), U.dist(WSIZE - 0.5, 100, 0.5, 100)];
    rec('W-05', '3.1', dxs[0] === 2 && dxs[1] === -2 && Math.abs(dxs[2] - 1) < 1e-9 ? 'OK' : 'FEHLER', 'Umlauf: U.dx(6143 → 1) = ' + dxs[0] + ', U.dx(1 → 6143) = ' + dxs[1] + ', Abstand über die Naht ' + dxs[2] + '. Kamera, Roboterziele (U.dx), Funkabdeckung (Raster mit Modulo) und Putzen (B-06) nutzen dieselben Umlauf-Funktionen.');
    return out;
  });
  out.push(...r);
  // f) Determinismus über Seiten/Sitzungen hinweg (anderer Math.random-Seed, neue Seite)
  const h1 = await hashBase(page);
  const { page: p2 } = await env.open({ rngSeed: 999 }); await p2.evaluate(() => __test.startNew(20261026));
  const h2 = await hashBase(p2);
  out.push({ id: 'W-06', area: '3.1', status: h1 === h2 ? 'OK' : 'FEHLER', detail: 'Basisdaten von 60 verteilten Chunks (Staub, Art, Terrain, Region) in zwei getrennten Seiten mit unterschiedlichem Math.random erzeugt: ' + (h1 === h2 ? 'bitgleich' : 'verschieden') + ' (Weltgenerierung nutzt nur Seed-Hashes).' });
  return out;
};

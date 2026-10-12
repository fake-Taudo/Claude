// Seitenteil des Prüfskripts (tools/characters/check.mjs): läuft im Figuren-Labor (window.CH = Figuren-Laufzeit,
// window.CC = Farbfunktionen aus color.mjs) und misst gebackene Bilder pixelgenau.
(() => {
  const CH = window.CH;
  const CC = window.CC;
  const CK = (window.CK = {});

  // ───────────── Bilder und Masken ─────────────
  /** Gebackenes Bild als Pixel: { d (RGBA), w, h, ax, ay, alpha, state }. */
  function frameData(o) {
    const f = CH.characterFrame(o);
    if (!f) return null;
    const d = f.src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, f.w, f.h).data;
    return { d, w: f.w, h: f.h, ax: f.ax, ay: f.ay, alpha: f.alpha ?? 1, state: f.state };
  }
  CK.frameData = frameData;

  /** Maske auf festem Raster (Fußpunkt bei fx, fy): { m, n, bb, cx, cy, bottom, top, left, right }. */
  function grid(fd, G, thr = 128) {
    const m = new Uint8Array(G.W * G.H);
    let n = 0;
    let sx = 0;
    let sy = 0;
    const bb = [G.W, G.H, -1, -1];
    const ox = Math.round(G.fx - fd.ax);
    const oy = Math.round(G.fy - fd.ay);
    for (let y = 0; y < fd.h; y++) {
      const gy = y + oy;
      if (gy < 0 || gy >= G.H) continue;
      for (let x = 0; x < fd.w; x++) {
        if (fd.d[(y * fd.w + x) * 4 + 3] < thr) continue;
        const gx = x + ox;
        if (gx < 0 || gx >= G.W) continue;
        m[gy * G.W + gx] = 1;
        n++;
        sx += gx;
        sy += gy;
        if (gx < bb[0]) bb[0] = gx;
        if (gy < bb[1]) bb[1] = gy;
        if (gx > bb[2]) bb[2] = gx;
        if (gy > bb[3]) bb[3] = gy;
      }
    }
    return { m, n, bb, cx: n ? sx / n - G.fx : 0, cy: n ? sy / n - G.fy : 0, top: bb[1] - G.fy, bottom: bb[3] - G.fy, left: bb[0] - G.fx, right: bb[2] - G.fx };
  }
  CK.grid = grid;

  function iou(A, B, W) {
    if (!A.n || !B.n) return 0;
    const x0 = Math.max(A.bb[0], B.bb[0]);
    const y0 = Math.max(A.bb[1], B.bb[1]);
    const x1 = Math.min(A.bb[2], B.bb[2]);
    const y1 = Math.min(A.bb[3], B.bb[3]);
    let inter = 0;
    for (let y = y0; y <= y1; y++) {
      const r = y * W;
      for (let x = x0; x <= x1; x++) inter += A.m[r + x] & B.m[r + x];
    }
    return inter / (A.n + B.n - inter);
  }

  // ───────────── 2. Silhouetten ─────────────
  /**
   * Silhouetten aller Figuren (Ruhe, vorn, Bild 0, Team Blau) im Spielmaßstab und höhennormiert; IoU aller Paare.
   * Rückgabe: { figs: {id: {area, h}}, pairs: [[a, b, iou, iouNorm]] (alle Paare) }.
   */
  CK.silhouettes = (ids, o) => {
    const G = { W: 420, H: 300, fx: 210, fy: 280 };
    const N = { W: 300, H: 200, fx: 150, fy: 185 };
    const game = [];
    const norm = [];
    const figs = {};
    for (const id of ids) {
      const e = CH.figureEntry(id);
      const a = grid(frameData({ figure: id, state: 'idle', u: 0, scale: o.scale, team: 'blue' }), G);
      // höhennormiert: Ruhehöhe → o.normPx Pixel
      const restTiles = -(e.box?.[1] ?? -100) / 50;
      const b = grid(frameData({ figure: id, state: 'idle', u: 0, scale: o.normPx / restTiles, team: 'blue' }), N);
      game.push(a);
      norm.push(b);
      figs[id] = { area: a.n, h: a.bottom - a.top };
    }
    const pairs = [];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) pairs.push([ids[i], ids[j], +iou(game[i], game[j], G.W).toFixed(3), +iou(norm[i], norm[j], N.W).toFixed(3)]);
    CK._sil = { ids, game, norm, G, N };
    return { figs, pairs };
  };

  /** Überlagerungsbild der genannten Paare (A blau, B orange, Schnitt weiß) als PNG-Daten-URL. */
  CK.silhouetteSheet = (pairs, names) => {
    const { ids, game, G } = CK._sil;
    const cols = 4;
    const cw = 300;
    const chh = 250;
    const c = document.createElement('canvas');
    c.width = cols * cw;
    c.height = Math.ceil(pairs.length / cols) * chh + 10;
    const g = c.getContext('2d');
    g.fillStyle = '#20262c';
    g.fillRect(0, 0, c.width, c.height);
    pairs.forEach(([a, b, v, vn], k) => {
      const A = game[ids.indexOf(a)];
      const B = game[ids.indexOf(b)];
      const img = g.createImageData(G.W, G.H);
      for (let i = 0; i < A.m.length; i++) {
        const p = A.m[i];
        const q = B.m[i];
        if (!p && !q) continue;
        const col = p && q ? [240, 240, 240] : p ? [70, 150, 255] : [255, 150, 50];
        img.data.set([...col, 255], i * 4);
      }
      const t = document.createElement('canvas');
      t.width = G.W;
      t.height = G.H;
      t.getContext('2d').putImageData(img, 0, 0);
      const x = (k % cols) * cw;
      const y = Math.floor(k / cols) * chh;
      g.drawImage(t, x + (cw - G.W * 0.65) / 2, y + 30, G.W * 0.65, G.H * 0.65);
      g.fillStyle = '#fff';
      g.font = 'bold 13px sans-serif';
      g.fillText(`${names[a] || a} ↔ ${names[b] || b}`, x + 8, y + 18);
      g.font = '12px sans-serif';
      g.fillText(`IoU ${v.toFixed(2)} · höhennormiert ${vn.toFixed(2)}`, x + 8, y + chh - 12);
    });
    return c.toDataURL('image/png');
  };

  // ───────────── Farbhilfen ─────────────
  const LAB = new Map();
  const lab = (r, g, b) => {
    const k = (r << 16) | (g << 8) | b;
    let v = LAB.get(k);
    if (!v) {
      v = CC.rgbToLab([r, g, b]);
      LAB.set(k, v);
    }
    return v;
  };
  const d76 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  const hexLab = (h) => CC.rgbToLab(CC.hexToRgb(h));
  /** Rampe aus Materialtönen (Glanz → Licht → Basis → Schatten → Tiefe) mit Zwischenstufen, als Lab. */
  function ramp(tones) {
    const out = [];
    for (let i = 0; i < tones.length - 1; i++) {
      const a = CC.hexToRgb(tones[i]);
      const b = CC.hexToRgb(tones[i + 1]);
      for (let k = 0; k < 4; k++) out.push(CC.rgbToLab(a.map((x, j) => x + ((b[j] - x) * k) / 4)));
    }
    out.push(hexLab(tones[tones.length - 1]));
    return out;
  }

  /** Bild auf ein Raster legen (für Vergleiche zweier Bilder mit gleichem Fußpunkt). */
  function place(fd, W, H, fx, fy, bg) {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    if (bg) bg(g, W, H);
    const t = document.createElement('canvas');
    t.width = fd.w;
    t.height = fd.h;
    t.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(fd.d), fd.w, fd.h), 0, 0);
    g.drawImage(t, Math.round(fx - fd.ax), Math.round(fy - fd.ay));
    return g.getImageData(0, 0, W, H).data;
  }

  // ───────────── 3. Farbtest (gerenderte Farben) ─────────────
  /**
   * Anteil der Haupt- und Akzentfarbe an der Eigenfarbfläche (ohne Kontur, ohne Teamzonen) und die größten
   * Farbcluster. o: { scale, main: [Töne], acc: [Töne], ink }
   */
  CK.colors = (id, o) => {
    const W = 360;
    const H = 300;
    const fb = frameData({ figure: id, state: 'idle', u: 0, scale: o.scale, team: 'blue' });
    const fr = frameData({ figure: id, state: 'idle', u: 0, scale: o.scale, team: 'red' });
    const B = place(fb, W, H, W / 2, H - 20);
    const R = place(fr, W, H, W / 2, H - 20);
    const ink = hexLab(o.ink);
    const mainR = ramp(o.main);
    const accR = ramp(o.acc);
    let own = 0;
    let mainN = 0;
    let accN = 0;
    const sample = [];
    for (let i = 0; i < B.length; i += 4) {
      if (B[i + 3] < 250) continue;
      // Teamzone: Blau und Rot unterscheiden sich
      if (Math.abs(B[i] - R[i]) + Math.abs(B[i + 1] - R[i + 1]) + Math.abs(B[i + 2] - R[i + 2]) > 24) continue;
      const L = lab(B[i], B[i + 1], B[i + 2]);
      if (d76(L, ink) < 14) continue;
      own++;
      let dm = 99;
      for (const q of mainR) dm = Math.min(dm, CC.deltaE2000(L, q));
      let da = 99;
      for (const q of accR) da = Math.min(da, CC.deltaE2000(L, q));
      if (dm <= o.tol) mainN++;
      else if (da <= o.tol) accN++;
      if ((i / 4) % 3 === 0) sample.push(L);
    }
    // k-Means (k = 5) auf Lab, deterministisch: Startpunkte mit größtem Abstand
    const K = Math.min(5, sample.length);
    const cent = sample.length ? [sample[0]] : [];
    while (cent.length < K) {
      let best = null;
      let bd = -1;
      for (const s of sample) {
        const d = Math.min(...cent.map((c) => d76(s, c)));
        if (d > bd) {
          bd = d;
          best = s;
        }
      }
      cent.push(best);
    }
    let cnt = new Array(K).fill(0);
    for (let it = 0; it < 12; it++) {
      const sum = cent.map(() => [0, 0, 0]);
      cnt = new Array(K).fill(0);
      for (const s of sample) {
        let k = 0;
        let bd = 1e9;
        cent.forEach((c, j) => {
          const d = d76(s, c);
          if (d < bd) {
            bd = d;
            k = j;
          }
        });
        cnt[k]++;
        sum[k][0] += s[0];
        sum[k][1] += s[1];
        sum[k][2] += s[2];
      }
      cent.forEach((c, j) => cnt[j] && (cent[j] = sum[j].map((v) => v / cnt[j])));
    }
    const clusters = cent.map((c, j) => ({ lab: c.map((v) => +v.toFixed(1)), share: +(cnt[j] / Math.max(1, sample.length)).toFixed(3) })).sort((a, b) => b.share - a.share);
    return { own, main: +(mainN / Math.max(1, own)).toFixed(3), acc: +(accN / Math.max(1, own)).toFixed(3), clusters };
  };

  // ───────────── 4. Kleingrößen-Test (40 px) ─────────────
  const GRASS = ['#7fbe55', '#76b44d'];
  function arenaBg(g, W, H) {
    const t = 8;
    for (let y = 0; y < H; y += t) for (let x = 0; x < W; x += t) {
      g.fillStyle = GRASS[(x / t + y / t) % 2];
      g.fillRect(x, y, t, t);
    }
  }
  CK.arenaBg = arenaBg;
  /**
   * Figur 40 px hoch auf Arena-Gras, einmal mit und einmal ohne Signature-Teile. sig = sichtbar veränderte Fläche
   * (ΔE76 > o.de) relativ zur Figurfläche; abs = Pixel.
   */
  CK.small = (id, o) => {
    const e = CH.figureEntry(id);
    const scale = o.px / (e.height || 1.5);
    const W = 120;
    const H = 90;
    const a = frameData({ figure: id, state: 'idle', u: 0, scale, team: 'blue' });
    const b = frameData({ figure: id, state: 'idle', u: 0, scale, team: 'blue', hide: 'sig' });
    const A = place(a, W, H, W / 2, H - 10, arenaBg);
    const Bp = place(b, W, H, W / 2, H - 10, arenaBg);
    const M = place(a, W, H, W / 2, H - 10);
    let fig = 0;
    let diff = 0;
    for (let i = 0; i < A.length; i += 4) {
      if (M[i + 3] >= 128) fig++;
      if (d76(lab(A[i], A[i + 1], A[i + 2]), lab(Bp[i], Bp[i + 1], Bp[i + 2])) > o.de) diff++;
    }
    const parts = CH.figureParts(id) || [];
    return { fig, abs: diff, sig: +(diff / Math.max(1, fig)).toFixed(3), sigParts: parts.filter((p) => p.sig).map((p) => p.name) };
  };

  /** Bogen: alle Figuren 40 px hoch auf Arena-Gras, Blau und Rot, mit Namen. */
  CK.smallSheet = (ids, names, o) => {
    const cols = 10;
    const cw = 128;
    const chh = 92;
    const c = document.createElement('canvas');
    c.width = cols * cw;
    c.height = Math.ceil(ids.length / cols) * chh;
    const g = c.getContext('2d');
    arenaBg(g, c.width, c.height);
    ids.forEach((id, k) => {
      const e = CH.figureEntry(id);
      const scale = o.px / (e.height || 1.5);
      const x = (k % cols) * cw;
      const y = Math.floor(k / cols) * chh;
      for (const [team, dx] of [['blue', 38], ['red', 90]]) {
        CH.characterShadow(g, { x: x + dx, y: y + 70, r: Math.max(6, scale * 0.42), team, ring: true, dpr: 1 });
        CH.drawCharacter(g, { figure: id, state: 'idle', time: 0, x: x + dx, y: y + 70, scale, dpr: 1, team, big: true });
      }
      g.fillStyle = 'rgba(0,0,0,0.45)';
      g.fillRect(x, y + chh - 16, cw, 16);
      g.fillStyle = '#fff';
      g.font = '10px sans-serif';
      g.fillText((names[id] || id).slice(0, 22), x + 4, y + chh - 5);
    });
    return c.toDataURL('image/png');
  };

  // ───────────── 5. Team-Test ─────────────
  const lin = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const gam = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  // Machado, Oliveira, Fernandes 2009, Schweregrad 1,0 (auf linearem RGB)
  const CVD = {
    protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
    deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
    tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039],
  };
  function simulate(r, g, b, M) {
    const R = lin(r);
    const G = lin(g);
    const B = lin(b);
    const c = (x) => Math.max(0, Math.min(255, Math.round(gam(Math.max(0, Math.min(1, x))))));
    return [c(M[0] * R + M[1] * G + M[2] * B), c(M[3] * R + M[4] * G + M[5] * B), c(M[6] * R + M[7] * G + M[8] * B)];
  }
  /**
   * Blau gegen Rot im Spielmaßstab: Teamfläche (Anteil, der sich unterscheidet), Unterscheidbarkeit in Graustufen
   * und unter Farbfehlsichtigkeit, Emblemfläche normal und im Farbenblind-Modus.
   */
  CK.team = (id, o) => {
    const W = 360;
    const H = 300;
    const at = (team, extra = {}) => place(frameData({ figure: id, state: 'idle', u: 0, scale: o.scale, team, ...extra }), W, H, W / 2, H - 20);
    const B = at('blue');
    const R = at('red');
    let fig = 0;
    let team = 0;
    let gray = 0;
    const sim = { protan: 0, deutan: 0, tritan: 0 };
    for (let i = 0; i < B.length; i += 4) {
      if (B[i + 3] < 128 && R[i + 3] < 128) continue;
      fig++;
      const lb = lab(B[i], B[i + 1], B[i + 2]);
      const lr = lab(R[i], R[i + 1], R[i + 2]);
      if (d76(lb, lr) <= o.de) continue;
      team++;
      // Graustufen: Leuchtdichte (L*) unterscheidet sich
      if (Math.abs(lb[0] - lr[0]) > o.de) gray++;
      for (const k of Object.keys(sim)) {
        const sb = simulate(B[i], B[i + 1], B[i + 2], CVD[k]);
        const sr = simulate(R[i], R[i + 1], R[i + 2], CVD[k]);
        if (d76(lab(...sb), lab(...sr)) > o.de) sim[k]++;
      }
    }
    // Emblem (data-team-only): Fläche normal und im Farbenblind-Modus
    const emblem = (cb) => {
      CH.setCharacterColorblind(cb);
      const E = at('blue');
      const X = at('blue', { hide: 'teamOnly' });
      CH.setCharacterColorblind(false);
      let n = 0;
      for (let i = 0; i < E.length; i += 4) if (Math.abs(E[i] - X[i]) + Math.abs(E[i + 1] - X[i + 1]) + Math.abs(E[i + 2] - X[i + 2]) + Math.abs(E[i + 3] - X[i + 3]) > 30) n++;
      return n;
    };
    const parts = CH.figureParts(id) || [];
    const r = {
      fig,
      area: +(team / Math.max(1, fig)).toFixed(3),
      gray,
      grayShare: +(gray / Math.max(1, team)).toFixed(3),
      protan: +(sim.protan / Math.max(1, team)).toFixed(3),
      deutan: +(sim.deutan / Math.max(1, team)).toFixed(3),
      tritan: +(sim.tritan / Math.max(1, team)).toFixed(3),
      emblem: emblem(false),
      emblemCb: emblem(true),
      emblemParts: { blue: parts.some((p) => p.teamOnly === 'blue'), red: parts.some((p) => p.teamOnly === 'red') },
    };
    return r;
  };

  /** Bogen für den Team-Test: Blau, Rot, Graustufen, Deuteranopie und Farbenblind-Modus nebeneinander. */
  CK.teamSheet = (ids, names, o) => {
    const cols = 2;
    const cw = 640;
    const chh = 120;
    const c = document.createElement('canvas');
    c.width = cols * cw;
    c.height = Math.ceil(ids.length / cols) * chh;
    const g = c.getContext('2d', { willReadFrequently: true });
    arenaBg(g, c.width, c.height);
    const cells = [
      ['blue', null, false, 'Blau'],
      ['red', null, false, 'Rot'],
      ['blue', 'gray', false, 'Blau grau'],
      ['red', 'gray', false, 'Rot grau'],
      ['blue', 'deutan', false, 'Blau Deutan'],
      ['red', 'deutan', false, 'Rot Deutan'],
      ['red', 'deutan', true, 'Rot Deutan + Modus'],
    ];
    ids.forEach((id, k) => {
      const e = CH.figureEntry(id);
      const x0 = (k % cols) * cw;
      const y0 = Math.floor(k / cols) * chh;
      const scale = o.scale;
      cells.forEach(([team, filter, cb, label], j) => {
        const cx = x0 + 46 + j * 86;
        const cy = y0 + chh - 22;
        CH.setCharacterColorblind(cb);
        CH.characterShadow(g, { x: cx, y: cy, r: Math.max(6, scale * 0.42), team, ring: true, dpr: 1 });
        CH.drawCharacter(g, { figure: id, state: 'idle', time: 0, x: cx, y: cy, scale: scale * Math.min(1, 1.9 / (e.height || 1.5)), dpr: 1, team, big: true });
        CH.setCharacterColorblind(false);
        if (filter) {
          const x = cx - 43;
          const y = y0;
          const img = g.getImageData(x, y, 86, chh - 14);
          const d = img.data;
          for (let i = 0; i < d.length; i += 4) {
            if (filter === 'gray') {
              const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
              d[i] = d[i + 1] = d[i + 2] = l;
            } else d.set(simulate(d[i], d[i + 1], d[i + 2], CVD[filter]), i);
          }
          g.putImageData(img, x, y);
        }
        g.fillStyle = '#fff';
        g.font = '10px sans-serif';
        g.textAlign = 'center';
        g.fillText(label, cx, y0 + chh - 4);
        g.textAlign = 'left';
      });
      g.fillStyle = '#fff';
      g.font = 'bold 11px sans-serif';
      g.fillText(names[id] || id, x0 + 4, y0 + 12);
    });
    return c.toDataURL('image/png');
  };

  // ───────────── 6. Animationstest ─────────────
  /** Größter Versatz eines Teils (Boxmitte, mu) zwischen zwei Posen; nur Teile, die in beiden sichtbar sind. */
  function partShift(A, B) {
    const m = new Map(A.parts.map((p) => [p.name + '|' + p.pass, p.box]));
    let best = { d: 0, part: null };
    for (const p of B.parts) {
      const a = m.get(p.name + '|' + p.pass);
      if (!a) continue;
      const b = p.box;
      const d = Math.hypot((a[0] + a[2] - b[0] - b[2]) / 2, (a[1] + a[3] - b[1] - b[3]) / 2) + Math.abs(a[2] - a[0] - (b[2] - b[0])) / 2 + Math.abs(a[3] - a[1] - (b[3] - b[1])) / 2;
      if (d > best.d) best = { d, part: p.name };
    }
    return best;
  }
  /**
   * Alle Zustände (Basis, Evo, Formen):
   * - Bilder wie im Spiel gebacken (Qualität Hoch): deckende Pixel am Bildrand = abgeschnitten; tiefster Punkt je Bild.
   * - Pose fein abgetastet (o.fine Schritte je Zustand, ohne Rastern): größter Sprung eines Teils zwischen zwei
   *   Schritten (Unstetigkeit), bei Schleifen auch über das Ende hinweg; Abstand des ersten Bilds zur Ruhepose.
   */
  CK.anim = (id, o) => {
    const e = CH.figureEntry(id);
    const G = { W: 700, H: 520, fx: 350, fy: 400 };
    const restH = -(e.box?.[1] ?? -100);
    const runs = [{ label: 'base' }];
    if (e.evo) runs.push({ label: 'evo', evo: true, states: ['idle', 'walk', 'attack'] });
    for (const f of e.forms || []) runs.push({ label: 'form:' + f, form: f, states: ['idle', 'walk', 'attack', 'hit', 'death'] });
    const out = [];
    let rest0 = null;
    for (const run of runs) {
      const base = { figure: id, scale: 50, team: 'blue', evo: run.evo, form: run.form };
      const rest = grid(frameData({ ...base, state: 'idle', u: 0 }), G);
      const restPose = CH.figurePose({ ...base, state: 'idle', u: 0 });
      if (!rest0) rest0 = rest;
      for (const st of run.states || Object.keys(e.anim)) {
        const info = CH.stateInfo(id, st);
        if (!info || info.name !== st) continue;
        const n = info.frames;
        let clipped = 0;
        let edgePx = 0;
        const lows = [];
        for (let i = 0; i < n; i++) {
          const u = info.loop ? i / n : n > 1 ? i / (n - 1) : 0;
          const fd = frameData({ ...base, state: st, u });
          let edge = 0;
          for (let x = 0; x < fd.w; x++) edge += (fd.d[x * 4 + 3] > 8) + (fd.d[((fd.h - 1) * fd.w + x) * 4 + 3] > 8);
          for (let y = 0; y < fd.h; y++) edge += (fd.d[y * fd.w * 4 + 3] > 8) + (fd.d[(y * fd.w + fd.w - 1) * 4 + 3] > 8);
          if (edge) clipped++;
          edgePx = Math.max(edgePx, edge);
          if (fd.alpha > 0.05) {
            const gm = grid(fd, G);
            if (gm.n) lows.push(gm.bottom);
          }
        }
        // feine Abtastung der Pose; große Schritte per Halbierung eingrenzen: bleibt der Versatz bei winzigem
        // Abstand groß, ist es eine Unstetigkeit (Sprung), sonst nur schnelle Bewegung
        const N = o.fine;
        const at = (u) => CH.figurePose({ ...base, state: st, u });
        const P = [];
        for (let k = 0; k <= N; k++) P.push(at(info.loop ? (k / N) % 1 : (k / N) * 0.99999));
        if (info.loop) P[N] = at(0.999999);
        let jump = { d: 0, part: null, u: 0 };
        let fast = 0;
        for (let k = 1; k <= N; k++) {
          const c = partShift(P[k - 1], P[k]);
          fast = Math.max(fast, c.d);
          if (c.d < o.coarse * restH) continue;
          let a = info.loop ? (k - 1) / N : ((k - 1) / N) * 0.99999;
          let b = info.loop ? (k < N ? k / N : 0.999999) : (k / N) * 0.99999;
          let A = P[k - 1];
          let B = P[k];
          for (let it = 0; it < 14; it++) {
            const m = (a + b) / 2;
            const M = at(m);
            if (partShift(A, M).d >= partShift(M, B).d) {
              b = m;
              B = M;
            } else {
              a = m;
              A = M;
            }
          }
          const f = partShift(A, B);
          if (f.d > jump.d) jump = { d: f.d, part: f.part, u: +((a + b) / 2).toFixed(3) };
        }
        // Schleife: Ende → Anfang
        if (info.loop) {
          const w = partShift(P[N], P[0]);
          if (w.d > jump.d) jump = { d: w.d, part: w.part, u: 1 };
        }
        // Füße (Teile foot*/leg*/Räder): tiefster Fuß über alle Schritte
        const FEET = /^(foot[FB]|leg[FB][nf]?|hoof\w*|feet|wheel[FB]?)$/;
        const feetLow = (Q) => {
          let v = -Infinity;
          for (const p of Q.parts) if (p.pass === 'body' && FEET.test(p.name)) v = Math.max(v, p.box[3]);
          return v;
        };
        const deepest = Math.max(...P.map(feetLow));
        const first = P[0];
        const enter = st === 'idle' || st === 'spawn' ? { d: 0, part: null } : partShift(restPose, first);
        out.push({
          run: run.label,
          state: st,
          frames: n,
          clipped,
          edgePx,
          jump: +(jump.d / restH).toFixed(3),
          jumpMu: +jump.d.toFixed(1),
          fast: +(fast / restH).toFixed(3),
          feet: isFinite(deepest) ? +deepest.toFixed(1) : null,
          jumpPart: jump.part,
          jumpU: jump.u,
          enter: +(enter.d / restH).toFixed(3),
          enterPart: enter.part,
          // tiefster und höchster „tiefster Punkt“ über die Bilder (mu; 0 = Fußpunkt, > 0 darunter), relativ zur Ruhe
          low: lows.length ? Math.max(...lows) - rest.bottom : null,
          lowMin: lows.length ? Math.min(...lows) - rest.bottom : null,
        });
      }
    }
    // Bodenkontakt der Ruhepose: tiefster Punkt (mu unter dem Fußpunkt) und Schwerpunkt der untersten Zeilen
    let cx = 0;
    let cn = 0;
    const W = G.W;
    for (let y = Math.max(0, rest0.bb[3] - 4); y <= rest0.bb[3]; y++)
      for (let x = rest0.bb[0]; x <= rest0.bb[2]; x++)
        if (rest0.m[y * W + x]) {
          cx += x - G.fx;
          cn++;
        }
    const rp = CH.figurePose({ figure: id, state: 'idle', u: 0 });
    let feet = -Infinity;
    for (const p of rp.parts) if (p.pass === 'body' && /^(foot[FB]|leg[FB][nf]?|hoof\w*|feet|wheel[FB]?)$/.test(p.name)) feet = Math.max(feet, p.box[3]);
    return { states: out, rest: { low: rest0.bottom, top: rest0.top, contact: cn ? +(cx / cn).toFixed(1) : 0, feet: isFinite(feet) ? +feet.toFixed(1) : null, box: e.box }, restH };
  };
})();

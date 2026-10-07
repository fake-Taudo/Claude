// Parst eine Figuren-SVG-Quelle (Teilmenge laut docs/CHAR_SYSTEM.md §9.2) einmalig zu Path2D-Zeichenlisten.
// Kein Bild-Dekodieren, kein erneutes Parsen pro Frame.

const IDENT = [1, 0, 0, 1, 0, 0];
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const isIdent = (m) => m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0;

/** SVG-transform-Attribut → Matrix. */
export function parseTransform(s) {
  let m = IDENT;
  if (!s) return m;
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
  let x;
  while ((x = re.exec(s))) {
    const v = x[2].split(/[\s,]+/).filter(Boolean).map(Number);
    let n = IDENT;
    if (x[1] === 'matrix') n = v;
    else if (x[1] === 'translate') n = [1, 0, 0, 1, v[0] || 0, v[1] || 0];
    else if (x[1] === 'scale') n = [v[0], 0, 0, v[1] ?? v[0], 0, 0];
    else if (x[1] === 'rotate') {
      const a = ((v[0] || 0) * Math.PI) / 180;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      n = [c, sn, -sn, c, 0, 0];
      if (v.length >= 3) n = mul(mul([1, 0, 0, 1, v[1], v[2]], n), [1, 0, 0, 1, -v[1], -v[2]]);
    } else if (x[1] === 'skewX') n = [1, 0, Math.tan((v[0] * Math.PI) / 180), 1, 0, 0];
    else if (x[1] === 'skewY') n = [1, Math.tan((v[0] * Math.PI) / 180), 0, 1, 0, 0];
    m = mul(m, n);
  }
  return m;
}

/** Grobe Pfad-Begrenzung (Kontrollpunkte), falls data-bb fehlt (von Hand gezeichnete Quellen). */
export function pathBBox(d) {
  const tok = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/g) || [];
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let cmd = 'M';
  let i = 0;
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  const put = (px, py) => {
    if (px < b[0]) b[0] = px;
    if (py < b[1]) b[1] = py;
    if (px > b[2]) b[2] = px;
    if (py > b[3]) b[3] = py;
  };
  const num = () => parseFloat(tok[i++]);
  const ARGS = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i])) cmd = tok[i++];
    const C = cmd.toUpperCase();
    const rel = cmd !== C;
    const n = ARGS[C];
    if (n === undefined) break;
    if (C === 'Z') {
      x = sx;
      y = sy;
      if (i < tok.length && !/[a-zA-Z]/.test(tok[i])) i++;
      continue;
    }
    const v = [];
    for (let k = 0; k < n; k++) v.push(num());
    if (v.some(Number.isNaN)) break;
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    if (C === 'H') x = v[0] + (rel ? x : 0);
    else if (C === 'V') y = v[0] + (rel ? y : 0);
    else if (C === 'A') {
      const rx = Math.abs(v[0]);
      const ry = Math.abs(v[1]);
      put(x - rx, y - ry);
      put(x + rx, y + ry);
      x = v[5] + ox;
      y = v[6] + oy;
      put(x - rx, y - ry);
      put(x + rx, y + ry);
    } else {
      for (let k = 0; k < n - 2; k += 2) put(v[k] + ox, v[k + 1] + oy);
      x = v[n - 2] + ox;
      y = v[n - 1] + oy;
    }
    put(x, y);
    if (C === 'M') {
      sx = x;
      sy = y;
      cmd = rel ? 'l' : 'L';
    }
  }
  return isFinite(b[0]) ? [b[0], b[1], b[2] - b[0], b[3] - b[1]] : [0, 0, 0, 0];
}

function paintOf(v) {
  if (!v || v === 'none') return null;
  const m = /^url\(#([^)]+)\)$/.exec(v.trim());
  return m ? { grad: m[1] } : v.trim();
}
const num = (el, a, d = 0) => {
  const v = el.getAttribute(a);
  return v == null || v === '' ? d : parseFloat(v);
};
const list = (v) => (v ? v.split(/[\s,]+/).filter(Boolean) : null);

function geometry(el) {
  const n = el.nodeName;
  const p = new Path2D();
  let d = null;
  if (n === 'path') {
    d = el.getAttribute('d') || '';
    return { path: new Path2D(d), d };
  }
  if (n === 'circle') {
    const cx = num(el, 'cx');
    const cy = num(el, 'cy');
    const r = num(el, 'r');
    p.arc(cx, cy, r, 0, Math.PI * 2);
    return { path: p, bb: [cx - r, cy - r, 2 * r, 2 * r] };
  }
  if (n === 'ellipse') {
    const cx = num(el, 'cx');
    const cy = num(el, 'cy');
    const rx = num(el, 'rx');
    const ry = num(el, 'ry');
    p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    return { path: p, bb: [cx - rx, cy - ry, 2 * rx, 2 * ry] };
  }
  if (n === 'rect') {
    const x = num(el, 'x');
    const y = num(el, 'y');
    const w = num(el, 'width');
    const h = num(el, 'height');
    const r = num(el, 'rx', num(el, 'ry'));
    if (r && p.roundRect) p.roundRect(x, y, w, h, r);
    else p.rect(x, y, w, h);
    return { path: p, bb: [x, y, w, h] };
  }
  if (n === 'polygon' || n === 'polyline' || n === 'line') {
    const pts = n === 'line' ? [num(el, 'x1'), num(el, 'y1'), num(el, 'x2'), num(el, 'y2')] : (el.getAttribute('points') || '').split(/[\s,]+/).filter(Boolean).map(Number);
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    for (let i = 0; i + 1 < pts.length; i += 2) {
      if (i === 0) p.moveTo(pts[0], pts[1]);
      else p.lineTo(pts[i], pts[i + 1]);
      b[0] = Math.min(b[0], pts[i]);
      b[1] = Math.min(b[1], pts[i + 1]);
      b[2] = Math.max(b[2], pts[i]);
      b[3] = Math.max(b[3], pts[i + 1]);
    }
    if (n === 'polygon') p.closePath();
    return { path: p, bb: [b[0], b[1], b[2] - b[0], b[3] - b[1]] };
  }
  return null;
}

/** Zeichenbare Elemente und Gruppen eines Teils (rekursiv). */
function parseChildren(el, ctx) {
  const out = [];
  for (const c of el.children) {
    const n = c.nodeName;
    if (n === 'title' || n === 'desc' || n === 'metadata') continue;
    const lod = c.hasAttribute('data-lod') ? +c.getAttribute('data-lod') : 0;
    const state = list(c.getAttribute('data-state'));
    const expr = list(c.getAttribute('data-expr'));
    const op = num(c, 'opacity', 1);
    if (n === 'g') {
      const m = parseTransform(c.getAttribute('transform'));
      const clipRef = /url\(#([^)]+)\)/.exec(c.getAttribute('clip-path') || '');
      out.push({ g: true, m: isIdent(m) ? null : m, clip: clipRef ? clipRef[1] : null, op, lod, state, expr, kids: parseChildren(c, ctx) });
      continue;
    }
    const geo = geometry(c);
    if (!geo) continue;
    const m = parseTransform(c.getAttribute('transform'));
    const bbAttr = c.getAttribute('data-bb');
    const fillAttr = c.getAttribute('fill');
    const stroke = paintOf(c.getAttribute('stroke'));
    const it = {
      path: geo.path,
      m: isIdent(m) ? null : m,
      fill: fillAttr == null ? '#000000' : paintOf(fillAttr),
      stroke,
      lw: num(c, 'stroke-width', 1),
      cap: c.getAttribute('stroke-linecap') || 'butt',
      join: c.getAttribute('stroke-linejoin') || 'miter',
      rule: c.getAttribute('fill-rule') === 'evenodd' ? 'evenodd' : 'nonzero',
      op,
      fop: num(c, 'fill-opacity', 1),
      sop: num(c, 'stroke-opacity', 1),
      lod,
      state,
      expr,
      mat: c.getAttribute('data-mat') || null,
      line: c.getAttribute('data-line'),
      lw2: c.hasAttribute('data-lw') ? num(c, 'data-lw') : null,
      hi: c.hasAttribute('data-hi') ? num(c, 'data-hi') : null,
      ao: c.hasAttribute('data-ao') ? num(c, 'data-ao') : null,
      bb: bbAttr ? bbAttr.split(/\s+/).map(Number) : geo.bb || (c.getAttribute('data-mat') ? pathBBox(geo.d || '') : null),
    };
    out.push(it);
  }
  return out;
}

function parseGradient(el, grads) {
  const href = el.getAttribute('href') || el.getAttribute('xlink:href');
  const base = href ? grads.get(href.slice(1)) : null;
  const stops = [...el.querySelectorAll('stop')].map((s) => {
    const style = s.getAttribute('style') || '';
    const sc = /stop-color:\s*([^;]+)/.exec(style);
    const so = /stop-opacity:\s*([^;]+)/.exec(style);
    let off = s.getAttribute('offset') || '0';
    off = off.endsWith('%') ? parseFloat(off) / 100 : parseFloat(off);
    return [off, (s.getAttribute('stop-color') || (sc && sc[1]) || '#000').trim(), parseFloat(s.getAttribute('stop-opacity') ?? (so ? so[1] : 1))];
  });
  const g = { type: el.nodeName === 'radialGradient' ? 'radial' : 'linear', stops: stops.length ? stops : base?.stops || [], m: parseTransform(el.getAttribute('gradientTransform')) };
  const a = (k, d) => (el.hasAttribute(k) ? num(el, k) : base?.[k] ?? d);
  if (g.type === 'linear') Object.assign(g, { x1: a('x1', 0), y1: a('y1', 0), x2: a('x2', 1), y2: a('y2', 0) });
  else Object.assign(g, { cx: a('cx', 0.5), cy: a('cy', 0.5), r: a('r', 0.5), fx: a('fx', a('cx', 0.5)), fy: a('fy', a('cy', 0.5)) });
  return g;
}

/**
 * Parst eine Figurenquelle. Ergebnis: { parts: [...], grads: Map, clips: Map, rig, viewBox }.
 * Jedes Teil: { name, bone, z, zb, view, expr[], evo, form[], variant, lod, team, teamOnly, sig, glow, outline, state[], bb, items }.
 */
export function parseFigure(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName !== 'svg') throw new Error('Keine SVG-Quelle');
  const grads = new Map();
  for (const el of svg.querySelectorAll('linearGradient, radialGradient')) grads.set(el.id, parseGradient(el, grads));
  const clips = new Map();
  for (const el of svg.querySelectorAll('clipPath')) {
    const p = new Path2D();
    for (const c of el.children) {
      const geo = geometry(c);
      if (!geo) continue;
      const m = parseTransform(c.getAttribute('transform'));
      if (isIdent(m)) p.addPath(geo.path);
      else p.addPath(geo.path, new DOMMatrix(m));
    }
    clips.set(el.id, p);
  }
  const parts = [];
  for (const g of svg.children) {
    if (g.nodeName !== 'g' || !g.hasAttribute('data-part')) continue;
    const at = (k) => g.getAttribute(k);
    const z = +(at('data-z') ?? 0);
    const bb = at('data-bb');
    parts.push({
      name: at('data-part'),
      bone: at('data-bone') || 'root',
      z,
      zb: at('data-zb') != null ? +at('data-zb') : z,
      view: at('data-view') || null,
      expr: list(at('data-expr')),
      evo: at('data-evo') || null,
      form: list(at('data-form')),
      variant: list(at('data-variant'))?.map(Number) || null,
      lod: at('data-lod') != null ? +at('data-lod') : 0,
      team: at('data-team') === '1',
      teamOnly: at('data-team-only') || null,
      sig: at('data-sig') === '1',
      glow: at('data-glow') === '1',
      outline: at('data-outline') !== '0',
      state: list(at('data-state')),
      bb: bb ? bb.split(/\s+/).map(Number) : null,
      m: parseTransform(at('transform')),
      items: parseChildren(g, {}),
    });
  }
  return { parts, grads, clips, rig: svg.getAttribute('data-rig') || 'biped', viewBox: (svg.getAttribute('viewBox') || '0 0 0 0').split(/[\s,]+/).map(Number) };
}

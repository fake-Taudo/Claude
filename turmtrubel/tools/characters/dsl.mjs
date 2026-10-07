// Design-Code für Figuren: Bauteile, Knochen und Animationsparameter einer Figur → SVG-Quelle + Manifest-Eintrag.
// Formen sind flach mit data-mat (Material); Licht, Schatten, Glanz und Innenlinien setzt die Laufzeit
// (client/js/characters/shade.js) nach der Licht-Regel. So bleiben die Quellen klein und von Hand editierbar.
import { Shape, Mx } from './geo.mjs';
import { TEAM, materialTones, MU_PER_TILE, OUTLINE, sizeOfHeight } from './system.mjs';

export const TEAMC = { main: TEAM.placeholders.main, light: TEAM.placeholders.light, shade: TEAM.placeholders.shade, deep: TEAM.placeholders.deep, symbol: TEAM.placeholders.symbol };

/** Elternknochen der Skelett-Vorlagen (Namen siehe system.mjs → RIGS). */
export const RIG_PARENTS = {
  biped: { root: null, hip: 'root', torso: 'hip', head: 'torso', hat: 'head', jaw: 'head', armB: 'torso', handB: 'armB', propB: 'handB', armF: 'torso', handF: 'armF', prop: 'handF', legB: 'hip', footB: 'legB', legF: 'hip', footF: 'legF', cape: 'torso', back: 'torso', tail: 'hip' },
  robe: { root: null, hip: 'root', skirt: 'hip', torso: 'hip', head: 'torso', hat: 'head', armB: 'torso', handB: 'armB', propB: 'handB', armF: 'torso', handF: 'armF', prop: 'handF', cape: 'torso', back: 'torso', buddy: 'root' },
  hover: { root: null, body: 'root', head: 'body', hat: 'head', armB: 'body', handB: 'armB', armF: 'body', handF: 'armF', prop: 'handF', trail: 'body' },
  flyer: { root: null, body: 'root', head: 'body', jaw: 'head', crest: 'head', wingB: 'body', wingF: 'body', tail: 'body', legB: 'body', legF: 'body' },
  quadruped: { root: null, body: 'root', head: 'body', jaw: 'head', ear: 'head', tail: 'body', legFn: 'body', legFf: 'body', legBn: 'body', legBf: 'body' },
  rider: { root: null, body: 'root', head: 'body', jaw: 'head', ear: 'head', tail: 'body', legFn: 'body', legFf: 'body', legBn: 'body', legBf: 'body', rHip: 'body', rTorso: 'rHip', rHead: 'rTorso', rArmB: 'rTorso', rHandB: 'rArmB', rArmF: 'rTorso', rHandF: 'rArmF', prop: 'rHandF', cape: 'rTorso', rLeg: 'rHip' },
  vehicle: { root: null, body: 'root', wheelB: 'body', wheelF: 'body', barrel: 'body', flag: 'body', c1Torso: 'root', c1Head: 'c1Torso', c1ArmF: 'c1Torso', c1ArmB: 'c1Torso', c1Legs: 'root', c2Torso: 'root', c2Head: 'c2Torso', c2ArmF: 'c2Torso', c2ArmB: 'c2Torso', c2Legs: 'root' },
  blob: { root: null, body: 'root', eyes: 'body', hat: 'body', feet: 'root' },
  building: { root: null, base: 'root', roof: 'base', door: 'base', chimney: 'roof', flag: 'roof', glow: 'base', crew: 'base' },
  serpent: { root: null, seg1: 'root', seg2: 'seg1', seg3: 'seg2', seg4: 'seg3', seg5: 'seg4', seg6: 'seg5', head: 'seg1', jaw: 'head', rTorso: 'seg2', rHead: 'rTorso', rArmF: 'rTorso', rHandF: 'rArmF', rArmB: 'rTorso' },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const n1 = (v) => String(Math.round(v * 10) / 10);

/** Material-Arten (Glanz, Ambient Occlusion), siehe system.mjs → MATERIAL_KINDS. */
export const MATS = ['cloth', 'leather', 'metal', 'gold', 'skin', 'hair', 'fur', 'wood', 'stone', 'bone', 'glass', 'gem', 'scale', 'flat'];

export function figure(row, extra = {}) {
  const F = {
    id: row.id,
    row,
    bones: [],
    boneMap: new Map(),
    parts: [],
    defs: [],
    anims: {},
    meta: { ...extra },
    uid: 0,
    rigType: 'biped',
  };
  F.pal = {
    main: row.main,
    acc: row.acc,
    skin: row.skin || '#f0c49c',
    ink: OUTLINE.ink,
    team: TEAMC.main,
    teamLight: TEAMC.light,
    teamShade: TEAMC.shade,
    teamDeep: TEAMC.deep,
    symbol: TEAMC.symbol,
  };
  F.tones = (hex) => materialTones(hex);
  F.H = row.h * MU_PER_TILE; // sichtbare Höhe in mu
  F.size = sizeOfHeight(row.h);

  /**
   * Skelett anlegen: pivots = { knochen: [x, y] } (Drehpunkte in mu, Ruhepose). Eltern kommen aus der Vorlage;
   * fehlt ein Elternknochen, hängt der Knochen am nächsten vorhandenen Vorfahren. parents überschreibt einzelne Eltern,
   * Knochen außerhalb der Vorlage brauchen dort einen Eintrag (sonst root).
   */
  F.rig = (type, pivots, parents = {}) => {
    F.rigType = type;
    const tpl = RIG_PARENTS[type];
    if (!tpl) throw new Error('Unbekannte Skelett-Vorlage ' + type);
    F.bone('root', null, 0, 0);
    const parentOf = (b) => {
      let par = parents[b] !== undefined ? parents[b] : tpl[b] ?? 'root';
      while (par && par !== 'root' && !pivots[par]) par = parents[par] !== undefined ? parents[par] : tpl[par] ?? 'root';
      return par || 'root';
    };
    const pending = Object.keys(pivots).filter((b) => b !== 'root');
    let guard = 0;
    while (pending.length && guard++ < 200) {
      const b = pending.shift();
      const par = parentOf(b);
      if (par !== 'root' && !F.boneMap.has(par)) {
        pending.push(b);
        continue;
      }
      F.bone(b, par, ...pivots[b]);
    }
    if (pending.length) throw new Error(`Knochen ohne Eltern in ${F.id}: ${pending.join(', ')}`);
  };
  F.bone = (name, parent, x, y) => {
    if (F.boneMap.has(name)) throw new Error(`Knochen ${name} doppelt in ${F.id}`);
    const b = { name, parent, x, y };
    F.bones.push(b);
    F.boneMap.set(name, b);
    return b;
  };
  F.pivot = (name) => {
    const b = F.boneMap.get(name);
    return b ? [b.x, b.y] : [0, 0];
  };

  // ───────────── Defs ─────────────
  F.lin = (x1, y1, x2, y2, stops) => {
    const id = `${F.id}-g${++F.uid}`;
    F.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}">${stopsXml(stops)}</linearGradient>`);
    return `url(#${id})`;
  };
  F.rad = (cx, cy, r, stops, fx = cx, fy = cy) => {
    const id = `${F.id}-g${++F.uid}`;
    F.defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}" fx="${n1(fx)}" fy="${n1(fy)}">${stopsXml(stops)}</radialGradient>`);
    return `url(#${id})`;
  };
  function stopsXml(stops) {
    return stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}"${a < 1 ? ` stop-opacity="${a}"` : ''}/>`).join('');
  }
  F.clip = (shape) => {
    const id = `${F.id}-c${++F.uid}`;
    F.defs.push(`<clipPath id="${id}"><path d="${shape.d}"/></clipPath>`);
    return id;
  };

  // ───────────── Teile ─────────────
  /**
   * Bauteil anlegen. o: bone, z, zb, view, expr, evo, form, variant, lod, team, teamOnly, sig, glow, outline, state.
   * fn(g) zeichnet die Elemente; Koordinaten in Modellraum-Ruhepose.
   */
  F.part = (name, o, fn) => {
    if (F.parts.some((p) => p.name === name)) throw new Error(`Teil ${name} doppelt in ${F.id}`);
    if (o.bone && !F.boneMap.has(o.bone)) throw new Error(`Teil ${name}: Knochen ${o.bone} fehlt in ${F.id}`);
    const part = { name, o: { z: 0, ...o }, els: [], bb: [Infinity, Infinity, -Infinity, -Infinity] };
    const g = builder(part, Mx.id());
    fn(g);
    F.parts.push(part);
    return part;
  };

  function grow(part, sh, m, pad = 0) {
    const b = sh.bb;
    const pts = [Mx.ap(m, b[0], b[1]), Mx.ap(m, b[2], b[1]), Mx.ap(m, b[0], b[3]), Mx.ap(m, b[2], b[3])];
    for (const [x, y] of pts) {
      part.bb[0] = Math.min(part.bb[0], x - pad);
      part.bb[1] = Math.min(part.bb[1], y - pad);
      part.bb[2] = Math.max(part.bb[2], x + pad);
      part.bb[3] = Math.max(part.bb[3], y + pad);
    }
  }

  function builder(part, m) {
    const add = (s) => part.els.push(s);
    const common = (o = {}) => `${o.lod ? ` data-lod="${o.lod}"` : ''}${o.state ? ` data-state="${o.state}"` : ''}${o.expr ? ` data-expr="${o.expr}"` : ''}${o.op != null && o.op < 1 ? ` opacity="${o.op}"` : ''}`;
    const g = {
      /** Schattiertes Material (Laufzeit setzt Verlauf, AO-Sichel, Glanz und Innenlinie). */
      mat(sh, color, kind = 'cloth', o = {}) {
        const b = sh.bb;
        grow(part, sh, m, (o.lw ?? 1.6) / 2);
        const line = o.line === false ? ' data-line="0"' : o.line ? ` data-line="${o.line}"` : '';
        const tune = `${o.hi != null ? ` data-hi="${o.hi}"` : ''}${o.ao != null ? ` data-ao="${o.ao}"` : ''}${o.lw != null ? ` data-lw="${o.lw}"` : ''}`;
        add(`<path d="${sh.d}" fill="${color}" data-mat="${kind}" data-bb="${n1(b[0])} ${n1(b[1])} ${n1(b[2] - b[0])} ${n1(b[3] - b[1])}"${line}${tune}${common(o)}/>`);
        return g;
      },
      /** Flache Füllung (keine Schattierung), optional mit Kontur. */
      fill(sh, color, o = {}) {
        grow(part, sh, m, (o.lw ?? 0) / 2);
        const st = o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.lw ?? 1.2}" stroke-linejoin="round"` : '';
        add(`<path d="${sh.d}" fill="${color}"${o.rule ? ` fill-rule="${o.rule}"` : ''}${st}${common(o)}/>`);
        return g;
      },
      /** Nur Linie (offene oder geschlossene Form). */
      stroke(sh, color, lw = 1.4, o = {}) {
        grow(part, sh, m, lw / 2);
        add(`<path d="${sh.d}" fill="none" stroke="${color}" stroke-width="${lw}" stroke-linecap="${o.cap || 'round'}" stroke-linejoin="round"${common(o)}/>`);
        return g;
      },
      /** Gruppe mit Zuschnitt (clip: Shape), Deckkraft, Transformation (Matrix) oder Detailstufe. */
      group(o, fn) {
        const m2 = o.t ? Mx.mul(m, o.t) : m;
        const inner = { ...part, els: [] };
        const sub = builder(inner, m2);
        fn(sub);
        part.bb = inner.bb;
        const clip = o.clip ? ` clip-path="url(#${F.clip(o.clip)})"` : '';
        const tr = o.t ? ` transform="matrix(${o.t.map((v) => Math.round(v * 1000) / 1000).join(' ')})"` : '';
        add(`<g${clip}${tr}${common(o)}>${inner.els.join('')}</g>`);
        return g;
      },
      clipTo(sh, fn, o = {}) {
        return g.group({ ...o, clip: sh }, fn);
      },
      lod(level, fn) {
        return g.group({ lod: level }, fn);
      },
    };
    return g;
  }

  // ───────────── Animation ─────────────
  F.anim = (spec) => Object.assign(F.anims, spec);

  // ───────────── Ausgabe ─────────────
  F.box = () => {
    const bb = [Infinity, Infinity, -Infinity, -Infinity];
    for (const p of F.parts) {
      if (p.o.form || p.o.state || p.o.evo === 'evo' || !isFinite(p.bb[0])) continue;
      bb[0] = Math.min(bb[0], p.bb[0]);
      bb[1] = Math.min(bb[1], p.bb[1]);
      bb[2] = Math.max(bb[2], p.bb[2]);
      bb[3] = Math.max(bb[3], p.bb[3]);
    }
    return bb;
  };
  F.svg = () => {
    const all = [Infinity, Infinity, -Infinity, -Infinity];
    for (const p of F.parts) {
      all[0] = Math.min(all[0], p.bb[0]);
      all[1] = Math.min(all[1], p.bb[1]);
      all[2] = Math.max(all[2], p.bb[2]);
      all[3] = Math.max(all[3], p.bb[3]);
    }
    const m = 4;
    const vb = [all[0] - m, all[1] - m, all[2] - all[0] + 2 * m, all[3] - all[1] + 2 * m].map((v) => Math.round(v));
    const parts = F.parts
      .slice()
      .sort((a, b) => a.o.z - b.o.z)
      .map((p) => {
        const o = p.o;
        const attrs = [
          ['data-part', p.name],
          ['data-bone', o.bone || 'root'],
          ['data-z', o.z],
          ['data-zb', o.zb],
          ['data-view', o.view],
          ['data-expr', o.expr],
          ['data-evo', o.evo],
          ['data-form', o.form],
          ['data-variant', o.variant],
          ['data-lod', o.lod],
          ['data-team', o.team ? 1 : undefined],
          ['data-team-only', o.teamOnly],
          ['data-sig', o.sig ? 1 : undefined],
          ['data-glow', o.glow ? 1 : undefined],
          ['data-outline', o.outline === false ? 0 : undefined],
          ['data-state', o.state],
          ['data-bb', isFinite(p.bb[0]) ? [p.bb[0], p.bb[1], p.bb[2] - p.bb[0], p.bb[3] - p.bb[1]].map(n1).join(' ') : undefined],
        ]
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${k}="${esc(v)}"`)
          .join(' ');
        return `<g ${attrs}>${p.els.join('')}</g>`;
      });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" width="${vb[2] * 3}" height="${vb[3] * 3}" data-character="${F.id}" data-mu="${MU_PER_TILE}" data-rig="${F.rigType}">\n<defs>${F.defs.join('')}</defs>\n${parts.join('\n')}\n</svg>\n`;
  };
  return F;
}

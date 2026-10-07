// Figurenmodell: geparste Quelle + Skelett aus dem Manifest. Rechnet Knochenmatrizen für eine Pose, wählt die
// sichtbaren Teile (Ansicht, Ausdruck, Evo, Form, Variante, Detailstufe, Team, Zustand) und zeichnet sie.
import { drawShaded, paint } from './shade.js';

const D2R = Math.PI / 180;
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];

function partMatches(p, sel, exprActive, pose) {
  // pose.view: 'front'/'back' erzwingt eine Ansicht, 'flip' zeigt die jeweils andere (Drehungen, Wirbel)
  const view = pose.view === 'flip' ? (sel.view === 'back' ? 'front' : 'back') : pose.view || sel.view;
  if (p.view && p.view !== view) return false;
  if (p.evo === 'evo' && !sel.evo) return false;
  if (p.evo === 'base' && sel.evo) return false;
  const forms = p.form || ['base'];
  if (!forms.includes('*') && !forms.includes(sel.form || 'base')) return false;
  if (p.variant && !p.variant.includes(sel.variant || 0)) return false;
  if (p.lod > sel.lod) return false;
  if (p.teamOnly && p.teamOnly !== sel.team) return false;
  if (p.expr && !p.expr.includes(exprActive)) return false;
  if (p.state && !p.state.some((s) => s === sel.state || pose.show.has(s))) return false;
  return true;
}

export class FigureModel {
  constructor(id, entry, parsed) {
    this.id = id;
    this.entry = entry;
    this.parts = parsed.parts;
    this.grads = parsed.grads;
    this.clips = parsed.clips;
    this.rig = parsed.rig;
    this.bones = (entry.bones || [['root', null, 0, 0]]).map(([name, parent, x, y]) => ({ name, parent, x, y }));
    if (!this.bones.some((b) => b.name === 'root')) this.bones.unshift({ name: 'root', parent: null, x: 0, y: 0 });
    this.boneIdx = new Map(this.bones.map((b, i) => [b.name, i]));
    this.exprSet = new Set();
    const scan = (items) => {
      for (const it of items) {
        if (it.expr) it.expr.forEach((e) => this.exprSet.add(e));
        if (it.kids) scan(it.kids);
      }
    };
    for (const p of this.parts) {
      if (p.expr) p.expr.forEach((e) => this.exprSet.add(e));
      scan(p.items);
    }
    this.front = this.parts.slice().sort((a, b) => a.z - b.z);
    this.back = this.parts.slice().sort((a, b) => a.zb - b.zb);
    this.hasBack = this.parts.some((p) => p.view === 'back');
    // Höhe in mu: Ruhepose-Box aus dem Manifest
    const box = entry.box || [0, -100, 0, 0];
    this.restH = Math.max(1, -(box[1] ?? -100));
  }

  /** Weltmatrizen aller Knochen (Modellraum, mu) für eine Pose. */
  matrices(pose) {
    const out = new Array(this.bones.length);
    for (let i = 0; i < this.bones.length; i++) {
      const b = this.bones[i];
      const c = pose.b[b.name];
      let local;
      if (!c) local = null;
      else {
        const r = c.r * D2R;
        const cs = Math.cos(r);
        const sn = Math.sin(r);
        const px = b.x;
        const py = b.y;
        // T(p + off) · R · S · T(-p)
        const a = cs * c.sx;
        const bb = sn * c.sx;
        const cc = -sn * c.sy;
        const d = cs * c.sy;
        local = [a, bb, cc, d, px + c.x - (a * px + cc * py), py + c.y - (bb * px + d * py)];
      }
      const pi = b.parent != null ? this.boneIdx.get(b.parent) : -1;
      const parent = pi >= 0 ? out[pi] : null;
      out[i] = parent ? (local ? mul(parent, local) : parent) : local || [1, 0, 0, 1, 0, 0];
    }
    return out;
  }

  activeExpr(pose) {
    return this.exprSet.has(pose.expr) ? pose.expr : 'idle';
  }

  /** Sichtbare Teile in Zeichenreihenfolge. pass: 'body' (mit Kontur), 'over' (ohne Kontur), 'glow' (additiv). */
  visible(sel, pose, pass) {
    const view = pose.view || sel.view;
    const s = view === sel.view ? sel : { ...sel, view };
    const list = view === 'back' && this.hasBack ? this.back : this.front;
    const ex = this.activeExpr(pose);
    const out = [];
    for (const p of list) {
      const kind = p.glow ? 'glow' : p.outline ? 'body' : 'over';
      if (kind !== pass) continue;
      if (partMatches(p, s, ex, pose)) out.push(p);
    }
    if (pose.layer) {
      const back = view === 'back' && this.hasBack;
      const zOf = (p) => {
        const o = pose.layer.get(p.name);
        return o ? o[back ? 1 : 0] : back ? p.zb : p.z;
      };
      out.sort((a, b) => zOf(a) - zOf(b));
    }
    return out;
  }

  /** Begrenzung (mu) der sichtbaren Teile einer Pose. */
  bounds(mats, sel, pose) {
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    for (const pass of ['body', 'over', 'glow']) {
      for (const p of this.visible(sel, pose, pass)) {
        if (!p.bb) continue;
        const m = mats[this.boneIdx.get(p.bone) ?? 0];
        const [x, y, w, h] = p.bb;
        for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
          const tx = m[0] * px + m[2] * py + m[4];
          const ty = m[1] * px + m[3] * py + m[5];
          if (tx < b[0]) b[0] = tx;
          if (ty < b[1]) b[1] = ty;
          if (tx > b[2]) b[2] = tx;
          if (ty > b[3]) b[3] = ty;
        }
      }
    }
    return isFinite(b[0]) ? b : [-10, -10, 10, 10];
  }

  /**
   * Zeichnet einen Durchgang. ctx steht auf Modellraum → Zielpixel (base), P = Malkontext (Team, Verläufe …).
   */
  draw(ctx, base, mats, sel, pose, pass, P) {
    const ex = this.activeExpr(pose);
    const env = { sel, pose, ex, P, lod: sel.lod, clips: this.clips, state: sel.state };
    for (const p of this.visible(sel, pose, pass)) {
      const m = mats[this.boneIdx.get(p.bone) ?? 0];
      const t = mul(base, m);
      ctx.setTransform(t[0], t[1], t[2], t[3], t[4], t[5]);
      drawItems(ctx, p.items, env);
    }
  }
}

function itemVisible(it, env) {
  if (it.lod > env.lod) return false;
  if (it.expr && !it.expr.includes(env.ex)) return false;
  if (it.state && !it.state.some((s) => s === env.state || env.pose.show.has(s))) return false;
  return true;
}

function drawItems(ctx, items, env) {
  const P = env.P;
  for (const it of items) {
    if (!itemVisible(it, env)) continue;
    if (it.kids) {
      ctx.save();
      if (it.m) ctx.transform(it.m[0], it.m[1], it.m[2], it.m[3], it.m[4], it.m[5]);
      if (it.clip) {
        const cp = env.clips.get(it.clip);
        if (cp) ctx.clip(cp);
      }
      if (it.op < 1) ctx.globalAlpha *= it.op;
      drawItems(ctx, it.kids, env);
      ctx.restore();
      continue;
    }
    const wrap = it.m || it.op < 1;
    if (wrap) {
      ctx.save();
      if (it.m) ctx.transform(it.m[0], it.m[1], it.m[2], it.m[3], it.m[4], it.m[5]);
      if (it.op < 1) ctx.globalAlpha *= it.op;
    }
    if (it.mat && it.fill) drawShaded(ctx, it, P, env.lod);
    else {
      if (it.fill) {
        const a = ctx.globalAlpha;
        if (it.fop < 1) ctx.globalAlpha = a * it.fop;
        ctx.fillStyle = paint(ctx, it.fill, P);
        ctx.fill(it.path, it.rule);
        ctx.globalAlpha = a;
      }
      if (it.stroke) {
        const a = ctx.globalAlpha;
        if (it.sop < 1) ctx.globalAlpha = a * it.sop;
        ctx.strokeStyle = paint(ctx, it.stroke, P);
        ctx.lineWidth = it.lw;
        ctx.lineCap = it.cap;
        ctx.lineJoin = it.join;
        ctx.stroke(it.path);
        ctx.globalAlpha = a;
      }
    }
    if (wrap) ctx.restore();
  }
}

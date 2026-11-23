// The prototype's cutscene symbol (Kreis-Stern): 22 layer kinds drawn in symbol units
// (the base symbol is about 60 units wide). Ported unchanged from the first cutscene runner;
// the star layers are drawn last so they always sit in front.

import type { SymbolLayer } from '../../config/cutscenes';
import { hash01, rgba, spectral } from '../color';
import { glowSprite, sprite } from '../sprites';

const TAU = Math.PI * 2;

function pick(palette: string[], idx: number | 'spectrum' | undefined, time: number, i = 0): string {
  if (idx === 'spectrum') return spectral(time * 120 + i * 50);
  return palette[(idx ?? 0) % palette.length];
}

/** Draws all layers of a symbol around the current origin (stars last). */
export function drawSymbol(ctx: CanvasRenderingContext2D, layers: SymbolLayer[], palette: string[], time: number): void {
  for (const layer of layers) if (layer.kind !== 'star') drawLayer(ctx, layer, palette, time);
  for (const layer of layers) if (layer.kind === 'star') drawLayer(ctx, layer, palette, time);
}

function drawLayer(ctx: CanvasRenderingContext2D, l: SymbolLayer, pal: string[], time: number): void {
  const col = pick(pal, l.color, time);
  const col2 = pick(pal, l.color2 ?? 1, time, 1);
  const r = l.r ?? 30;
  const [ox, oy] = l.offset ?? [0, 0];
  const a = l.alpha ?? 1;
  ctx.save();
  ctx.translate(ox, oy);
  if (l.spin) ctx.rotate(time * l.spin);
  switch (l.kind) {
    case 'glow': {
      ctx.globalCompositeOperation = 'lighter';
      const prev = ctx.globalAlpha;
      ctx.globalAlpha = prev * a;
      ctx.drawImage(glowSprite(col, 0.25), -r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
      ctx.globalAlpha = prev;
      break;
    }
    case 'circle': {
      if (l.fill) {
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, rgba(col, 0.25 * a));
        g.addColorStop(0.7, rgba(col, 0.13 * a));
        g.addColorStop(1, rgba(col, l.width === 0 ? 0.9 * a : 0));
        ctx.fillStyle = l.width === 0 ? col : g;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.fill();
      }
      if ((l.width ?? 3) > 0) {
        if (l.dash) ctx.setLineDash(l.dash);
        ctx.globalCompositeOperation = 'lighter';
        for (const [w, al] of [[(l.width ?? 3) * 5, 0.12], [(l.width ?? 3) * 2.2, 0.3], [l.width ?? 3, 1]] as [number, number][]) {
          ctx.strokeStyle = rgba(col, al * a);
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, TAU);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      break;
    }
    case 'star': {
      const n = l.points ?? 4;
      const inner = l.inner ?? 0.3;
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(glowSprite(col, 0.3), -r * 1.6, -r * 1.6, r * 3.2, r * 3.2);
      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.55, col);
      g.addColorStop(1, col2);
      ctx.fillStyle = g;
      ctx.globalAlpha *= a;
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const rr = i % 2 === 0 ? r : r * inner;
        const ang = -Math.PI / 2 + (i * Math.PI) / n;
        if (i === 0) ctx.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
        else ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha /= a;
      break;
    }
    case 'shards': {
      const n = l.count ?? 7;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * TAU;
        const d = r * (0.75 + 0.25 * (i % 2));
        ctx.save();
        ctx.rotate(ang);
        ctx.translate(d, 0);
        ctx.rotate(ang * 0.6 + time);
        const g = ctx.createRadialGradient(-2, -2, 0, 0, 0, 9);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.5, col);
        g.addColorStop(1, col2);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(8, -3);
        ctx.lineTo(5, 8);
        ctx.lineTo(-6, 6);
        ctx.lineTo(-8, -3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'cracks': {
      const n = l.count ?? 5;
      ctx.strokeStyle = rgba(col, 0.6 * a);
      ctx.lineWidth = 1.5;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * TAU + 0.26;
        const len = r * (0.55 + (i % 3) * 0.18);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        let x = 0;
        let y = 0;
        for (let k = 1; k <= 4; k++) {
          x = Math.cos(ang + (hash01(i * 7 + k) - 0.5) * 0.5) * (len * k) / 4;
          y = Math.sin(ang + (hash01(i * 7 + k) - 0.5) * 0.5) * (len * k) / 4;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }
    case 'prismRings': {
      const n = l.count ?? 3;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const rr = r * (1 - i * 0.28);
        const c = spectral(time * 140 + i * 70);
        for (const [w, al] of [[10, 0.12], [4.5, 0.3], [2.4, 1]] as [number, number][]) {
          ctx.strokeStyle = rgba(c, al * a);
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.arc(0, 0, rr, 0, TAU);
          ctx.stroke();
        }
      }
      break;
    }
    case 'orbiters': {
      const n = l.count ?? 8;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * TAU + time * (l.param ?? 1) * (i % 2 ? 1 : 1.4);
        const rr = r * (0.75 + 0.25 * hash01(i + 3));
        const c = l.color === 'spectrum' ? spectral(i * 40 + time * 90) : col;
        ctx.drawImage(sprite('dot', c), Math.cos(ang) * rr - 4, Math.sin(ang) * rr - 4, 8, 8);
      }
      break;
    }
    case 'wings': {
      const n = l.count ?? 6;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1;
        const k = Math.floor(i / 2);
        const ang = (side < 0 ? Math.PI : 0) + side * (k - 1) * 0.55 * (1 + 0.1 * Math.sin(time * 3));
        const g = ctx.createLinearGradient(0, 0, Math.cos(ang) * r, Math.sin(ang) * r);
        g.addColorStop(0, rgba('#ffffff', a));
        g.addColorStop(0.6, rgba(col, 0.7 * a));
        g.addColorStop(1, rgba(col2, 0));
        ctx.fillStyle = g;
        const nx = -Math.sin(ang);
        const ny = Math.cos(ang);
        ctx.beginPath();
        ctx.moveTo(nx * 3, ny * 3);
        ctx.quadraticCurveTo(Math.cos(ang) * r * 0.5 + nx * 9, Math.sin(ang) * r * 0.5 + ny * 9, Math.cos(ang) * r, Math.sin(ang) * r);
        ctx.quadraticCurveTo(Math.cos(ang) * r * 0.5 - nx * 5, Math.sin(ang) * r * 0.5 - ny * 5, -nx * 3, -ny * 3);
        ctx.fill();
      }
      break;
    }
    case 'clock': {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * TAU;
        const len = i % 3 === 0 ? 7 : 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * (r - len), Math.sin(ang) * (r - len));
        ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        ctx.stroke();
      }
      ctx.strokeStyle = col2;
      for (const [sp, len, w] of [[0.6, 0.55, 3], [3.2, 0.8, 2]] as [number, number, number][]) {
        const ang = -time * sp;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * r * len, Math.sin(ang) * r * len);
        ctx.stroke();
      }
      break;
    }
    case 'spiral': {
      const arms = l.count ?? 2;
      ctx.globalCompositeOperation = 'lighter';
      for (let arm = 0; arm < arms; arm++) {
        for (let i = 0; i < 40; i++) {
          const f = i / 40;
          const rr = 6 + f * r;
          const ang = (arm / arms) * TAU + Math.log(rr / 6) * 1.5;
          const c = i % 3 === 0 ? col2 : col;
          const s = 6 * (1 - f * 0.5);
          ctx.drawImage(sprite('dot', c), Math.cos(ang) * rr - s / 2, Math.sin(ang) * rr - s / 2, s, s);
        }
      }
      break;
    }
    case 'fieldLines': {
      const n = l.count ?? 6;
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < n; k++) {
        const side = k % 2 ? 1 : -1;
        const L = r * (0.45 + 0.55 * ((Math.floor(k / 2) + 1) / Math.ceil(n / 2)));
        ctx.strokeStyle = rgba(k % 2 ? col : col2, 0.8 * a);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i <= 30; i++) {
          const th = 0.3 + ((Math.PI - 0.6) * i) / 30;
          const s = Math.sin(th);
          const x = side * L * s * s * s;
          const y = -L * s * s * Math.cos(th);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }
    case 'web': {
      const n = l.count ?? 12;
      const pts = Array.from({ length: n }, (_, i) => {
        const ang = (i / n) * TAU + hash01(i) * 0.4;
        const rr = r * (0.45 + 0.55 * hash01(i + 11));
        return [Math.cos(ang) * rr, Math.sin(ang) * rr];
      });
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(col, 0.6 * a);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        for (const j of [i + 1, i + 3]) {
          const p = pts[j % n];
          ctx.moveTo(pts[i][0], pts[i][1]);
          ctx.lineTo(p[0], p[1]);
        }
      }
      ctx.stroke();
      for (const [x, y] of pts) ctx.drawImage(sprite('dot', col2), x - 4, y - 4, 8, 8);
      break;
    }
    case 'cells': {
      const n = l.count ?? 6;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * TAU + time * 0.4;
        const rr = r * 0.6;
        const x = Math.cos(ang) * rr;
        const y = Math.sin(ang) * rr;
        const s = r * (0.28 + 0.05 * Math.sin(time * 3 + i));
        ctx.drawImage(glowSprite(i % 2 ? col : col2, 0.4), x - s * 1.6, y - s * 1.6, s * 3.2, s * 3.2);
        ctx.strokeStyle = rgba(col, 0.8 * a);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, TAU);
        ctx.stroke();
      }
      break;
    }
    case 'mobius': {
      ctx.globalCompositeOperation = 'lighter';
      const N = 60;
      const W2 = r * 0.3;
      for (let i = 0; i < N; i++) {
        const u0 = (i / N) * TAU;
        const u1 = ((i + 1) / N) * TAU;
        const pt = (u: number, s: number): [number, number] => {
          const o = s * W2 * Math.cos(u / 2);
          return [Math.cos(u) * (r + o), Math.sin(u) * (r + o) * 0.55 - s * W2 * Math.sin(u / 2) * 0.8];
        };
        const facing = Math.cos(u0 / 2);
        ctx.fillStyle = rgba(facing >= 0 ? col : col2, (0.35 + 0.4 * Math.abs(facing)) * a);
        const [ax, ay] = pt(u0, 1);
        const [bx, by] = pt(u1, 1);
        const [cx2, cy2] = pt(u1, -1);
        const [dx, dy] = pt(u0, -1);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineTo(cx2, cy2);
        ctx.lineTo(dx, dy);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'rays': {
      const n = l.count ?? 12;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * TAU;
        const g = ctx.createLinearGradient(0, 0, Math.cos(ang) * r, Math.sin(ang) * r);
        g.addColorStop(0, rgba(col, a));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang - 0.06) * r, Math.sin(ang - 0.06) * r);
        ctx.lineTo(Math.cos(ang + 0.06) * r, Math.sin(ang + 0.06) * r);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'polygon': {
      const n = l.points ?? 3;
      ctx.globalCompositeOperation = 'lighter';
      for (const [w, al] of [[(l.width ?? 2) * 4, 0.15], [l.width ?? 2, 1]] as [number, number][]) {
        ctx.strokeStyle = rgba(col, al * a);
        ctx.lineWidth = w;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const ang = -Math.PI / 2 + (i / n) * TAU;
          if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
          else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        ctx.stroke();
      }
      break;
    }
    case 'lemniscate': {
      ctx.globalCompositeOperation = 'lighter';
      for (const [w, al, c] of [[8, 0.15, col], [3, 0.6, col], [1.5, 1, col2]] as [number, number, string][]) {
        ctx.strokeStyle = rgba(c, al * a);
        ctx.lineWidth = w;
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const s = (i / 80) * TAU;
          const sn = Math.sin(s);
          const den = 1 + sn * sn;
          const x = (r * Math.cos(s)) / den;
          const y = (r * sn * Math.cos(s)) / den;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }
    case 'jets': {
      ctx.globalCompositeOperation = 'lighter';
      for (const dir of [1, -1]) {
        const g = ctx.createLinearGradient(0, 0, 0, dir * r);
        g.addColorStop(0, rgba('#ffffff', a));
        g.addColorStop(0.4, rgba(col, 0.8 * a));
        g.addColorStop(1, rgba(col2, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(0, dir * r);
        ctx.lineTo(4, 0);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'moon': {
      const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      g.addColorStop(0, '#ffd0c8');
      g.addColorStop(0.5, col);
      g.addColorStop(1, col2);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(30,0,6,0.45)';
      ctx.beginPath();
      ctx.arc(r * 0.35, r * 0.2, r * 0.9, 0, TAU);
      ctx.fill();
      break;
    }
    case 'rift': {
      const n = l.count ?? 3;
      ctx.globalCompositeOperation = 'lighter';
      const seed = Math.floor(time * 8);
      for (let i = 0; i < n; i++) {
        ctx.strokeStyle = rgba(i % 2 ? col : '#ffffff', 0.9 * a);
        ctx.lineWidth = 2;
        ctx.beginPath();
        const ang = (i / n) * TAU;
        for (let k = 0; k <= 6; k++) {
          const f = k / 6;
          const x = Math.cos(ang) * r * (f * 2 - 1) + (hash01(seed * 31 + i * 7 + k) - 0.5) * 10;
          const y = Math.sin(ang) * r * (f * 2 - 1) + (hash01(seed * 17 + i * 5 + k) - 0.5) * 10;
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }
    case 'pixels': {
      const n = l.count ?? 16;
      const seed = Math.floor(time * 6);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const x = (hash01(seed * 13 + i) - 0.5) * r * 2;
        const y = (hash01(seed * 29 + i) - 0.5) * r * 2;
        ctx.fillStyle = rgba(i % 2 ? col : col2, a);
        ctx.fillRect(x, y, 4, 4);
      }
      break;
    }
    case 'sparkles': {
      const n = l.count ?? 20;
      const dir = l.param ?? -1;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const ph = (time * 0.6 + hash01(i)) % 1;
        const f = dir < 0 ? 1 - ph : ph;
        const ang = hash01(i + 50) * TAU;
        const rr = r * (0.2 + 0.8 * f);
        const s = 7 * (dir < 0 ? f : 1 - f) + 2;
        ctx.globalAlpha *= 1;
        ctx.drawImage(sprite('star4', col), Math.cos(ang) * rr - s / 2, Math.sin(ang) * rr - s / 2, s, s);
      }
      break;
    }
  }
  ctx.restore();
}

// Contact Sheet: eine Kachel pro Figur mit Heldenbild, Team Rot, Rückansicht, Angriff, Evo und 40-px-Test samt Silhouette.
//
//   node tools/characters/contact.mjs                    → alle gebauten Figuren nach docs/contact_sheet.png
//   node tools/characters/contact.mjs knight bats --out docs/contact_sheet_pilot.png --cols 3
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAll } from './build.mjs';
import { openLab } from './lab.mjs';
import { figureById } from './figures.mjs';
import { FAMILIES, sizeOfHeight } from './system.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function figureIds() {
  return fs
    .readdirSync(path.join(ROOT, 'tools/characters/figures'))
    .filter((f) => f.endsWith('.mjs'))
    .map((f) => f.slice(0, -4))
    .sort();
}

function displayName(id) {
  const cards = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cards.json'), 'utf8'));
  const list = cards.cards || cards;
  const c = list.find((x) => x.id === id);
  if (c) return c.name;
  const brief = path.join(ROOT, 'docs/briefs', id + '.md');
  if (fs.existsSync(brief)) {
    const m = fs.readFileSync(brief, 'utf8').match(/^# (.+?) \(`/m);
    if (m) return m[1];
  }
  return id;
}

export async function contactSheet(lab, ids, o = {}) {
  const tiles = ids.map((id) => {
    const row = figureById.get(id) || {};
    const fam = FAMILIES[row.fam] || {};
    return { id, name: displayName(id), fam: fam.name || row.fam || '', size: row.h ? sizeOfHeight(row.h).id : '', h: row.h || 1.5 };
  });
  const url = await lab.page.evaluate(
    async ({ tiles, cols, title }) => {
      const CH = window.CH;
      await CH.loadFigures(tiles.map((t) => t.id));
      const TW = 700;
      const TH = 300;
      const HEAD = 64;
      const rows = Math.ceil(tiles.length / cols);
      const c = document.createElement('canvas');
      c.width = cols * TW + 24;
      c.height = rows * TH + HEAD + 12;
      const g = c.getContext('2d');
      g.fillStyle = '#1f2a1f';
      g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#fff';
      g.font = 'bold 26px sans-serif';
      g.fillText(title, 16, 38);
      g.font = '14px sans-serif';
      g.fillStyle = '#c8d8c0';
      g.fillText('Heldenbild Blau · Team Rot · Rückansicht · Angriff (Trefferbild) · Evo/Variante · 40-px-Test mit Silhouette', 16, 58);
      const tmp = document.createElement('canvas');
      const tg = tmp.getContext('2d', { willReadFrequently: true });
      const draw = (ctx, f, x, y, scale, opt = {}) => {
        // scale: Pixel je Feld (alle Figuren im selben Maßstab, damit Größenklassen vergleichbar bleiben)
        const e = CH.figureEntry(f.id);
        const hover = opt.noLift ? 0 : (e?.hover || 0) * scale * 0.45;
        CH.characterShadow(ctx, { x, y, r: Math.max(6, scale * 0.42), team: opt.team || 'blue', ring: true, dpr: 1 });
        const st = opt.state || 'idle';
        const t = opt.t != null ? opt.t * CH.stateDuration(f.id, st) : 0;
        CH.drawCharacter(ctx, { figure: f.id, state: st, time: t, x, y, scale, dpr: 1, team: opt.team || 'blue', view: opt.view || 'front', evo: opt.evo, variant: opt.variant, face: 1, big: true, lift: hover });
      };
      tiles.forEach((f, i) => {
        const X = 12 + (i % cols) * TW;
        const Y = HEAD + Math.floor(i / cols) * TH;
        const e = CH.figureEntry(f.id);
        g.fillStyle = '#5f8f45';
        g.fillRect(X + 4, Y + 4, TW - 8, TH - 8);
        g.fillStyle = 'rgba(0,0,0,0.28)';
        g.fillRect(X + 4, Y + 4, TW - 8, 30);
        g.fillStyle = '#fff';
        g.font = 'bold 17px sans-serif';
        g.fillText(f.name, X + 14, Y + 25);
        const nw = g.measureText(f.name).width;
        g.font = '12px sans-serif';
        g.fillStyle = '#dfe8d8';
        g.fillText(`${f.id} · ${f.fam} · ${f.size} · ${(e?.height || f.h).toFixed(2).replace('.', ',')} Felder`, X + 24 + nw, Y + 24);
        // Heldenbild
        g.save();
        g.beginPath();
        g.rect(X + 4, Y + 34, TW - 8, TH - 38);
        g.clip();
        draw(g, f, X + 128, Y + TH - 30, 72);
        // Spalte: Rot, Rückansicht, Angriff, Evo/Variante
        const small = 38;
        const evo = !!e?.evo;
        const extra = evo ? { evo: true, label: 'Evo' } : e?.variants > 1 ? { variant: 1, label: 'Variante' } : e?.views?.includes('back') ? { view: 'back', team: 'red', label: 'Rot hinten' } : { state: 'walk', t: 0.25, label: 'Laufen' };
        const hitT = e?.anim?.attack?.hit ?? 0.55;
        const cells = [
          { team: 'red', label: 'Rot' },
          { view: 'back', label: 'Rücken' },
          { state: 'attack', t: hitT, label: 'Angriff' },
          extra,
        ];
        cells.forEach((cc, k) => {
          const cx = X + 300 + k * 100;
          draw(g, f, cx, Y + 210, small, cc);
          g.fillStyle = '#fff';
          g.font = '11px sans-serif';
          g.textAlign = 'center';
          g.fillText(cc.label, cx, Y + 228);
          g.textAlign = 'left';
        });
        g.restore();
        // 40-px-Test: echte Größe + Silhouette
        const by = Y + TH - 14;
        g.fillStyle = 'rgba(0,0,0,0.18)';
        g.fillRect(X + 252, Y + 236, TW - 260, TH - 244);
        const s40 = 40 / (e?.height || f.h);
        draw(g, f, X + 300, by, s40, { noLift: true });
        draw(g, f, X + 360, by, s40, { team: 'red', noLift: true });
        tmp.width = 120;
        tmp.height = 90;
        tg.clearRect(0, 0, 120, 90);
        const sc = 40 / (e?.height || f.h);
        CH.drawCharacter(tg, { figure: f.id, state: 'idle', time: 0, x: 60, y: 80, scale: sc, dpr: 1, team: 'blue', big: true });
        tg.globalCompositeOperation = 'source-in';
        tg.fillStyle = '#1c1830';
        tg.fillRect(0, 0, 120, 90);
        tg.globalCompositeOperation = 'source-over';
        g.drawImage(tmp, X + 420 - 60, by - 80);
        g.fillStyle = '#fff';
        g.font = '11px sans-serif';
        g.fillText('40 px', X + 470, by - 22);
        g.fillText('Blau · Rot · Silhouette', X + 470, by - 8);
      });
      return c.toDataURL('image/png');
    },
    { tiles, cols: o.cols || 3, title: o.title || 'Turmtrubel – Figuren' },
  );
  return Buffer.from(url.split(',')[1], 'base64');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (k, d) => {
    const i = args.indexOf('--' + k);
    return i >= 0 ? args[i + 1] : d;
  };
  const ids = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  const list = ids.length ? ids : figureIds();
  await buildAll(ids.length ? ids : undefined);
  const lab = await openLab();
  try {
    const png = await contactSheet(lab, list, { cols: +opt('cols', 3), title: opt('title', 'Turmtrubel – Figuren') });
    const out = path.resolve(ROOT, opt('out', 'docs/contact_sheet.png'));
    fs.writeFileSync(out, png);
    console.log('geschrieben', path.relative(ROOT, out), list.length, 'Figuren');
  } finally {
    await lab.close();
  }
}

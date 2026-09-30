// Zwischenspeicher für Kartenbilder (Canvas + Data-URL für DOM-Elemente).
import { drawCardArt } from '../game/sprites.js';

const canvases = new Map();
const urls = new Map();

export function cardArt(db, id, evo = false, w = 180, h = 225) {
  const key = `${id}|${evo ? 1 : 0}|${w}x${h}`;
  let cv = canvases.get(key);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const card = db.card(id);
    if (card) drawCardArt(cv.getContext('2d'), db, card, 0, 0, w, h, { evo });
    canvases.set(key, cv);
  }
  return cv;
}

/** Graustufen-Fassung eines Kartenbilds (für „nicht bezahlbar“: wird mit 35 % über das Original gelegt). */
const grays = new Map();
export function cardArtGray(db, id, evo = false) {
  const key = `${id}|${evo ? 1 : 0}`;
  let cv = grays.get(key);
  if (!cv) {
    const src = cardArt(db, id, evo);
    cv = document.createElement('canvas');
    cv.width = src.width;
    cv.height = src.height;
    const c = cv.getContext('2d');
    c.drawImage(src, 0, 0);
    try {
      const img = c.getImageData(0, 0, cv.width, cv.height);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
        d[i] = d[i + 1] = d[i + 2] = l;
      }
      c.putImageData(img, 0, 0);
    } catch {
      /* Canvas nicht lesbar → Original bleibt */
    }
    grays.set(key, cv);
  }
  return cv;
}

export function cardArtURL(db, id, evo = false) {
  const key = `${id}|${evo ? 1 : 0}`;
  let u = urls.get(key);
  if (!u) {
    u = cardArt(db, id, evo).toDataURL('image/png');
    urls.set(key, u);
  }
  return u;
}

/** Alle Kartenbilder vorab erzeugen (Ladebildschirm). onProgress(0..1) */
export async function prerenderAll(db, onProgress) {
  const jobs = [];
  for (const c of db.cards) {
    jobs.push([c.id, false]);
    if (c.evo) jobs.push([c.id, true]);
  }
  for (let i = 0; i < jobs.length; i++) {
    cardArtURL(db, jobs[i][0], jobs[i][1]);
    if (i % 6 === 5) {
      onProgress?.((i + 1) / jobs.length);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  onProgress?.(1);
}

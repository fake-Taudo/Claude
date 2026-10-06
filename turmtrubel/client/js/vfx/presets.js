// Laden und Prüfen der VFX-Presets (vfx/presets.json). Die Prüfung läuft auch in den Node-Tests.
import { SHAPE_NAMES, DECAL_NAMES } from './textures.js';

const ITEM_TYPES = new Set(['burst', 'glow', 'ring', 'decal', 'bolt', 'flash', 'shake', 'hitstop', 'emitter', 'text']);
const LAYERS = ['pre', 'core', 'post'];

function checkBurst(it, where, errors) {
  if (it.shape && !SHAPE_NAMES.includes(it.shape)) errors.push(`${where}: unbekannte Form "${it.shape}"`);
  for (const k of ['count', 'size', 'life', 'speed', 'up', 'spread', 'gravity', 'drag', 'rate']) {
    const v = it[k];
    if (v == null) continue;
    const ok = typeof v === 'number' ? Number.isFinite(v) : Array.isArray(v) && v.length === 2 && v.every(Number.isFinite);
    if (!ok) errors.push(`${where}: "${k}" muss Zahl oder [min, max] sein`);
  }
  if (it.drag != null && (Array.isArray(it.drag) || it.drag < 0 || it.drag > 1)) errors.push(`${where}: drag muss zwischen 0 und 1 liegen`);
  if (!it.colors && !it.colorLife) errors.push(`${where}: colors oder colorLife fehlt`);
}

/** Prüft alle Presets; Rückgabe: Liste von Fehlermeldungen (leer = gültig). */
export function validatePresets(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') return ['Presets fehlen'];
  for (const [name, pr] of Object.entries(obj)) {
    if (name.startsWith('_')) continue;
    // Spur-Presets (proj.trail.*) sind einzelne Partikel-Spezifikationen mit Rate
    if (name.startsWith('proj.trail.')) {
      if (!(pr.rate > 0)) errors.push(`${name}: rate fehlt`);
      checkBurst(pr, name, errors);
      continue;
    }
    if (!pr.layers || typeof pr.layers !== 'object') {
      errors.push(`${name}: layers fehlt`);
      continue;
    }
    for (const L of Object.keys(pr.layers)) if (!LAYERS.includes(L)) errors.push(`${name}: unbekannte Schicht "${L}"`);
    for (const L of LAYERS) {
      const items = pr.layers[L];
      if (items == null) continue;
      if (!Array.isArray(items)) {
        errors.push(`${name}.${L}: muss eine Liste sein`);
        continue;
      }
      items.forEach((it, i) => {
        const where = `${name}.${L}[${i}]`;
        if (!ITEM_TYPES.has(it.type)) errors.push(`${where}: unbekannter Typ "${it.type}"`);
        if (it.type === 'burst') checkBurst(it, where, errors);
        if (it.type === 'emitter') {
          if (!it.item) errors.push(`${where}: item fehlt`);
          else checkBurst(it.item, where + '.item', errors);
        }
        if (it.type === 'decal' && it.shape && !DECAL_NAMES.includes(it.shape)) errors.push(`${where}: unbekanntes Decal "${it.shape}"`);
        if (it.type === 'ring' && it.radius && !(Array.isArray(it.radius) && it.radius.length === 2)) errors.push(`${where}: radius muss [von, bis] sein`);
      });
    }
    if (pr.delays) {
      for (const [L, d] of Object.entries(pr.delays)) {
        if (!LAYERS.includes(L) || !(d >= 0 && d <= 2)) errors.push(`${name}: ungültige Verzögerung ${L}=${d}`);
      }
    }
    // Zeitstaffelung (Style Guide): Vorlauf ≤ 200 ms, Nachhall-Start ≤ 1 s
    if (pr.delays?.core > 0.2) errors.push(`${name}: Vorlauf länger als 200 ms`);
  }
  return errors;
}

/** Presets laden (fetch), prüfen und zurückgeben. Bei Fehlern wird gewarnt, gültige Presets bleiben nutzbar. */
export async function loadPresets(url = new URL('./presets.json', import.meta.url)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('VFX-Presets nicht ladbar: ' + res.status);
  const data = await res.json();
  const errors = validatePresets(data);
  if (errors.length) console.warn('VFX-Presets:', errors.slice(0, 10).join(' · '));
  delete data._info;
  return data;
}

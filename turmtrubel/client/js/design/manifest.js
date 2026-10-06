// Asset-Manifest: alles, was das Spiel zeichnet, an einer Stelle – Archetypen (Körper), Waffen, Hüte, Gebäude,
// Zauber-Icons, Turmteile, UI-Icons, Partikelformen, Decals und VFX-Presets, jeweils mit Standardgröße.
// Dient dem Vorrendern im Ladescreen (Game.prewarmUnits) und dem Bericht (docs/REPORT.md, tools/manifest).
import { assetCatalog } from '../game/sprites.js';
import { ICON_NAMES } from '../ui/icons.js';
import { SHAPE_NAMES, DECAL_NAMES } from '../vfx/textures.js';
import { QUALITY } from './tokens.js';

/** Standardgrößen (Felder bzw. CSS-Pixel), nach denen Sprites gerendert und gecacht werden. */
export const SIZES = Object.freeze({
  unitU: 'Bildschirm-Felder × (0,42 + Radius × 0,8) × look.scale',
  tower: { king: 4, princess: 3 },
  uiIcon: 24,
  cardSlot: 'Breite der Handkarten-Mulde',
  particleTexture: 48,
});

/** Vollständiges Manifest; presets = geladenes vfx/presets.json (optional). */
export function manifest(presets = null) {
  const cat = assetCatalog();
  return {
    ...cat,
    uiIcons: ICON_NAMES.slice(),
    particleShapes: SHAPE_NAMES.slice(),
    decals: DECAL_NAMES.slice(),
    vfxPresets: presets ? Object.keys(presets).filter((n) => !n.startsWith('_')) : [],
    quality: Object.keys(QUALITY),
    sizes: SIZES,
  };
}

/** Zählung je Gruppe (für Bericht und Debug-Overlay). */
export function manifestCounts(presets = null) {
  const m = manifest(presets);
  const out = {};
  for (const [k, v] of Object.entries(m)) if (Array.isArray(v)) out[k] = v.length;
  return out;
}

/** Ist ein Archetyp-Name bekannt? (skin.json → archetype) */
export function isArchetype(name) {
  return assetCatalog().archetypes.includes(name);
}

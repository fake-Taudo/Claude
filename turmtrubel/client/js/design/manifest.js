// Asset-Manifest: alles, was das Spiel zeichnet, an einer Stelle – Figuren (Vektor-Charaktere mit ihren Zuständen
// und Spieltypen), Gebäude, Zauber-Icons, Turmteile, UI-Icons, Partikelformen, Decals und VFX-Presets, jeweils mit
// Standardgröße. Dient dem Vorrendern im Ladescreen (Game.prewarmUnits) und dem Bericht (docs/REPORT.md).
import { assetCatalog } from '../game/sprites.js';
import { characterManifest } from '../characters/index.js';
import { ICON_NAMES } from '../ui/icons.js';
import { SHAPE_NAMES, DECAL_NAMES } from '../vfx/textures.js';
import { QUALITY } from './tokens.js';

/** Standardgrößen (Felder bzw. CSS-Pixel), nach denen Sprites gerendert und gecacht werden. */
export const SIZES = Object.freeze({
  character: 'Figurenhöhe in Feldern laut Figuren-Manifest (height), gezeichnet mit Feldgröße × Zoom',
  tower: { king: 4, princess: 3 },
  uiIcon: 24,
  cardSlot: 'Breite der Handkarten-Mulde',
  particleTexture: 48,
});

/**
 * Vollständiges Manifest; presets = geladenes vfx/presets.json (optional), chars = Figuren-Manifest
 * (client/assets/characters/manifest.json; im Browser nach initCharacters() automatisch).
 */
export function manifest(presets = null, chars = characterManifest()) {
  const cat = assetCatalog();
  return {
    characters: Object.keys(chars?.figures || {}),
    characterTypes: Object.keys(chars?.types || {}),
    characterStates: Object.keys(chars?.system?.states || {}),
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
export function manifestCounts(presets = null, chars = characterManifest()) {
  const m = manifest(presets, chars);
  const out = {};
  for (const [k, v] of Object.entries(m)) if (Array.isArray(v)) out[k] = v.length;
  return out;
}

/** Ist ein Figurenname bekannt? (skin.json → character bzw. archetype) */
export function isCharacter(name, chars = characterManifest()) {
  return !!chars?.figures?.[name];
}

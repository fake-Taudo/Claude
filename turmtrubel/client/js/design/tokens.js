// Design-Tokens für den Canvas (siehe docs/STYLE_GUIDE.md). Basiswerte kommen aus den CSS-Variablen
// (client/js/ui/tokens.js → T), hier ergänzt um Werte, die nur Canvas und VFX brauchen.
import { T } from '../ui/tokens.js';

/** Farben. Teamfarben: 300 hell · 500 Grund · 700 dunkel · 900 tief · glow Glanz. */
export const C = {
  ink: T.ink,
  blue: { ...T.blue, deep: '#0f3a85', glow: '#e3f0ff' },
  red: { ...T.red, deep: '#7a1020', glow: '#ffe3e5' },
  gold: { ...T.gold, deep: '#b86b0b', glow: '#fff6c2' },
  crown: { light: '#fff3a0', main: '#ffcf33', dark: '#e09a12', deep: '#8a5a06' },
  elixir: { ...T.elixir, deep: '#4d0d6b' },
  green: { light: '#7fe38a', main: '#5ad16a', dark: '#2e9a43', deep: '#1c6b2c' },
  night: { 950: '#0b0f2a', 900: '#111842', 800: '#17205a', 700: '#1e2b72', 600: '#283a8f', 500: '#3652b3', 300: '#93a9f2' },
  cream: T.cream,
  white: '#ffffff',
  // Licht: warm, Schatten: kühl (für Verläufe der Licht-Regel)
  lightTint: '#fff6dc',
  shadeTint: '#1b2348',
};

/** Teamfarben nach Seite relativ zum Betrachter ('blue' = eigen, 'red' = Gegner). */
export const teamColors = (team) => (team === 'red' ? C.red : C.blue);

/** Seltenheitsrahmen (Grund, Licht, Schatten). */
export const RARITY = {
  common: { main: '#9fb3c8', light: '#dfe9f5', dark: '#5f7590' },
  rare: { main: '#f39c3d', light: '#ffd29a', dark: '#b0611a' },
  epic: { main: '#b55cf0', light: '#e3b8ff', dark: '#6f2aa8' },
  legendary: { main: '#2fd3c6', light: '#b8fff7', dark: '#178a86', shimmer: ['#2fd3c6', '#8f7bff', '#ff8fd0'] },
  champion: { main: '#ffd84d', light: '#fff3a0', dark: '#c08a10' },
  hero: { main: '#ff7a5c', light: '#ffc2b0', dark: '#b8432b' },
  evo: { main: '#e04cff', light: '#ffb8ff', dark: '#7a1fb5' },
};

/** Effekt-Paletten: Kern → Mitte → Rand → Nachhall. */
export const FX = {
  fire: ['#fff6c8', '#ffc23d', '#ff6a2b', '#c2301f'],
  smoke: ['#4a3a33', '#6b5a50', '#7d6d63'],
  ice: ['#ffffff', '#d4f4ff', '#74d6ff', '#2a8fd6'],
  electric: ['#ffffff', '#bff4ff', '#4fc3ff'],
  poison: ['#e2ff8a', '#9ad44f', '#5a9a2b', '#2f4a1f'],
  heal: ['#fffbe0', '#ffe066', '#9dff8a'],
  rage: ['#ffd0ff', '#e07bff', '#a03ad0'],
  void: ['#e6d0ff', '#9a5cf0', '#4a1c8a', '#1a0a33'],
  earth: ['#f0d29a', '#c08a50', '#7a5230'],
  elixir: ['#ffd0fb', '#ff9af0', '#d13cf0'],
  gold: ['#fffbe0', '#ffe066', '#f5a623'],
  wood: ['#d9a46a', '#a8713e', '#6b4226'],
  stone: ['#d8d2c8', '#a79f94', '#6f675d'],
};

/** Konturstärken (CSS-px) und Sprite-Kontur relativ zur Figurgröße U. */
export const STROKE = { thin: 1.5, mid: 3, thick: 5, spriteOuter: (U) => Math.max(1.4, Math.min(4, U * 0.1)), innerRatio: 0.6 };
export const RADIUS = { xs: 6, s: 10, m: 16, l: 24, pill: 999 };
export const SPACE = [0, 4, 8, 12, 16, 24, 32, 48];

/** Zeichenebenen im Canvas (Reihenfolge, nur Dokumentation/Debug). */
export const Z = ['ground', 'water', 'decals', 'zonesGround', 'shadows', 'rubble', 'unitsGround', 'fxGround', 'unitsAir', 'projectiles', 'fxNormal', 'fxAdd', 'bars', 'texts', 'ghosts', 'flash', 'hud', 'drag'];

/**
 * Licht-Regel: Licht von oben links. dir = Richtung Licht → Schatten (Bildschirm), normiert.
 * shadowOffset: Versatz des Bodenschattens relativ zum Radius (nach unten rechts).
 */
export const LIGHT = {
  dir: [Math.SQRT1_2, Math.SQRT1_2],
  lightMix: 0.3, // Anteil Lichtton oben links
  shadeMix: 0.26, // Anteil Schattenton unten rechts
  glossAlpha: 0.42,
  rimAlpha: 0.38,
  rimPx: 1.6, // Breite des Rim-Lights (Gerätepixel pro 32 px Figurgröße)
  shadowAlpha: 0.38,
  shadowOffset: [0.1, 0.05],
  shadowSquash: 0.42,
};

/** Qualitätsstufen (Grafik-Einstellung). */
export const QUALITY = {
  low: { level: 0, dpr: 1, particles: 220, decals: 6, trails: 10, spriteMB: 8, gloss: false, additive: true, ambient: false },
  medium: { level: 1, dpr: 1.5, particles: 500, decals: 12, trails: 24, spriteMB: 20, gloss: true, additive: true, ambient: false },
  high: { level: 2, dpr: 2, particles: 900, decals: 24, trails: 40, spriteMB: 40, gloss: true, additive: true, ambient: true },
};

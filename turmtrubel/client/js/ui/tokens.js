// Brücke CSS-Design-Tokens → Canvas. Liest die Custom Properties aus :root einmal beim Laden
// (das Stylesheet ist vor den Modulen geladen). Fallbacks gelten, falls CSS fehlt.
const FALLBACK = {
  '--ink-900': '#1c1830',
  '--ink-700': '#2a2440',
  '--surface-cream': '#fdf6e3',
  '--surface-cream-2': '#efe4c8',
  '--bg-indigo-900': '#1a1433',
  '--bg-indigo-800': '#221a56',
  '--bg-indigo-700': '#32286d',
  '--bg-indigo-600': '#3a2f8f',
  '--team-blue-300': '#9cc8ff',
  '--team-blue-500': '#3d8bff',
  '--team-blue-700': '#1f5fc9',
  '--team-red-300': '#ffb0b5',
  '--team-red-500': '#ff4d57',
  '--team-red-700': '#c42233',
  '--gold-300': '#ffe066',
  '--gold-400': '#ffd84d',
  '--gold-600': '#f5a623',
  '--elixir-300': '#ff9af0',
  '--elixir-500': '#d13cf0',
  '--elixir-700': '#8a1fb5',
  '--ok': '#3fbf6b',
  '--warn': '#ffb020',
  '--danger': '#e5484d',
  '--font-head': "'Lilita One', 'Arial Black', sans-serif",
  '--font-body': "'Nunito', 'Segoe UI', sans-serif",
  '--dur-fast': '120ms',
  '--dur-toast': '140ms',
  '--dur-base': '220ms',
  '--dur-slow': '420ms',
};

function read() {
  let cs = null;
  try {
    cs = getComputedStyle(document.documentElement);
  } catch {
    /* kein DOM (z. B. Tests) */
  }
  const v = (name) => (cs && cs.getPropertyValue(name).trim()) || FALLBACK[name];
  const ms = (name) => parseFloat(v(name)) || 0;
  return {
    ink: v('--ink-900'),
    text: v('--ink-700'),
    cream: v('--surface-cream'),
    cream2: v('--surface-cream-2'),
    bg900: v('--bg-indigo-900'),
    bg800: v('--bg-indigo-800'),
    bg700: v('--bg-indigo-700'),
    bg600: v('--bg-indigo-600'),
    blue: { light: v('--team-blue-300'), main: v('--team-blue-500'), dark: v('--team-blue-700') },
    red: { light: v('--team-red-300'), main: v('--team-red-500'), dark: v('--team-red-700') },
    gold: { light: v('--gold-300'), main: v('--gold-400'), dark: v('--gold-600') },
    elixir: { light: v('--elixir-300'), main: v('--elixir-500'), dark: v('--elixir-700') },
    ok: v('--ok'),
    warn: v('--warn'),
    danger: v('--danger'),
    fontHead: v('--font-head'),
    fontBody: v('--font-body'),
    dur: { fast: ms('--dur-fast'), toast: ms('--dur-toast'), base: ms('--dur-base'), slow: ms('--dur-slow') },
  };
}

/** Alle Tokens als JS-Objekt (Farben als CSS-Strings, Dauern in ms). */
export const T = read();

const rm = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
/** true, wenn das System reduzierte Bewegung wünscht. */
export const reducedMotion = () => !!rm?.matches;

/** Setzt data-quality / data-motion am <body>, damit CSS Effekte an die Einstellungen koppeln kann. */
export function applyBodyFlags(settings) {
  const b = document.body;
  b.dataset.quality = settings.quality;
  b.dataset.motion = reducedMotion() ? 'reduced' : 'full';
}
rm?.addEventListener?.('change', () => (document.body.dataset.motion = reducedMotion() ? 'reduced' : 'full'));

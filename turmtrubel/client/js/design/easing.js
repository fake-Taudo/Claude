// Zentrale Easing-Bibliothek (siehe docs/STYLE_GUIDE.md §8). Alle Funktionen bilden t ∈ [0,1] → [0,1]
// (backOut/elasticOut schwingen kurz über 1 hinaus). Dieselben Kurven gibt es in CSS als --ease-out / --ease-pop.

export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
/** Bildratenunabhängiges Annähern: k = Anteil, der pro Sekunde übrig bleibt (z. B. 0.001 = sehr schnell). */
export const damp = (a, b, k, dt) => b + (a - b) * Math.pow(k, dt);

export const linear = (t) => t;
export const inQuad = (t) => t * t;
export const outQuad = (t) => 1 - (1 - t) * (1 - t);
export const inOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const outCubic = (t) => 1 - (1 - t) ** 3;
export const inCubic = (t) => t * t * t;
export const inOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const outQuart = (t) => 1 - (1 - t) ** 4;
export const outExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const inExpo = (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
export const outSine = (t) => Math.sin((t * Math.PI) / 2);
export const inOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

/** Zurückfedern über das Ziel hinaus (Pop, Einrasten). s = Überschwing-Stärke. */
export const backOut = (t, s = 1.70158) => {
  const u = t - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
};
export const backIn = (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t;

/** Elastisches Nachschwingen (Banner, große Zahlen). */
export const elasticOut = (t, period = 0.3) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin(((t - period / 4) * (2 * Math.PI)) / period) + 1;
};

/** Hüpfen (Landung). */
export const bounceOut = (t) => {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};

/** Glocke 0 → 1 → 0 (Pulse, Flash). */
export const bell = (t) => Math.sin(clamp01(t) * Math.PI);

/** Pop-Skalierung: 0 → overshoot → 1 (für Abzeichen, Emotes, Kronen). */
export const pop = (t, over = 1.15) => {
  t = clamp01(t);
  if (t < 0.6) return outCubic(t / 0.6) * over;
  return over + (1 - over) * inOutSine((t - 0.6) / 0.4);
};

export const EASE = { linear, inQuad, outQuad, inOutQuad, outCubic, inCubic, inOutCubic, outQuart, outExpo, inExpo, outSine, inOutSine, backOut, backIn, elasticOut, bounceOut, bell };

/** Easing per Name (für JSON-Presets); unbekannte Namen → linear. */
export function ease(name, t) {
  const f = EASE[name];
  return f ? f(clamp01(t)) : clamp01(t);
}

/** Zeitdauern (ms), identisch mit den CSS-Tokens. */
export const DUR = { press: 80, fast: 120, toast: 140, base: 220, pop: 260, screen: 320, slow: 420, banner: 1200 };

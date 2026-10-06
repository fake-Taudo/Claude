// Eigenes Vektor-Icon-Set (ersetzt Emojis in der Oberfläche). Alle Symbole liegen im 24er-Raster,
// zweitonig mit dunkler Ink-Kontur und Glanz oben links (Licht-Regel aus docs/STYLE_GUIDE.md).
// installIcons() hängt einmal ein SVG-Sprite in den <body>; icon(name) liefert <svg><use href="#i-name">.

const NS = 'http://www.w3.org/2000/svg';
const INK = '#1c1830';
const W = '#ffffff';
const GOLD = '#ffd84d';
const GOLD_D = '#f5a623';
const BLUE = '#3d8bff';
const BLUE_L = '#9cc8ff';
const RED = '#ff4d57';
const GREEN = '#5fe08a';
const ELIXIR = '#d13cf0';
const SILVER = '#d4dcec';
const STEEL = '#9fb0cc';
const WOOD = '#b8794a';
const ICE = '#bfe3ff';

const r2 = (v) => Math.round(v * 100) / 100;
// Gefüllte Form mit Kontur (Standard-Kontur der Gruppe)
const sh = (d, c) => `<path d="${d}" fill="${c}"/>`;
const shEl = (el, c) => el.replace('/>', ` fill="${c}"/>`);
// Glanz (ohne Kontur)
const hl = (d, a = 0.55) => `<path d="${d}" fill="${W}" fill-opacity="${a}" stroke="none"/>`;
// Linie mit Kontur: erst dicke Ink-Linie, dann Farbe darüber (zusammengesetzte Pfade verschmelzen zu einer Form)
const ln = (d, c, w = 2.6) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${r2(w + 3)}"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
const dot = (x, y, r, c = INK) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="none"/>`;
const circ = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;

function starPath(cx, cy, R, r, n = 5, rot = -90) {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    const rr = i % 2 ? r : R;
    d += `${i ? 'L' : 'M'}${r2(cx + Math.cos(a) * rr)} ${r2(cy + Math.sin(a) * rr)}`;
  }
  return d + 'Z';
}

function gearPath(cx, cy, R, r, teeth) {
  let d = '';
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    const pts = [
      [r, a - step * 0.5],
      [r, a - step * 0.26],
      [R, a - step * 0.17],
      [R, a + step * 0.17],
      [r, a + step * 0.26],
    ];
    for (const [rr, aa] of pts) d += `${d ? 'L' : 'M'}${r2(cx + Math.cos(aa) * rr)} ${r2(cy + Math.sin(aa) * rr)}`;
  }
  return d + 'Z';
}

function snowPath() {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    const ex = 12 + Math.cos(a) * 8.6;
    const ey = 12 + Math.sin(a) * 8.6;
    d += `M12 12L${r2(ex)} ${r2(ey)}`;
    const bx = 12 + Math.cos(a) * 5.6;
    const by = 12 + Math.sin(a) * 5.6;
    for (const s of [-1, 1]) {
      const b = a + s * 0.75;
      d += `M${r2(bx)} ${r2(by)}L${r2(bx + Math.cos(b) * 2.8)} ${r2(by + Math.sin(b) * 2.8)}`;
    }
  }
  return d;
}

const speaker = sh('M3.5 9.2H7.3L12 5.2V18.8L7.3 14.8H3.5Z', W) + hl('M5 10.4H7.6L10.6 7.9V10.4Z', 0.7);
const bubble = sh('M5 4.5H19A2.5 2.5 0 0 1 21.5 7V14A2.5 2.5 0 0 1 19 16.5H11.5L6.5 20.5V16.5H5A2.5 2.5 0 0 1 2.5 14V7A2.5 2.5 0 0 1 5 4.5Z', W);
const noteGlyph = ln('M9.5 17.3V5.6L18.5 3.6V15.1', GOLD, 2.2) + circ(7.3, 17.5, 2.5, GOLD) + circ(16.3, 15.2, 2.5, GOLD) + hl('M5.8 16.6a1.6 1.2 0 0 1 2.4-.9a1.6 1.2 0 0 1-2.4 .9Z', 0.7);
const slash = ln('M4 4L20 20', RED, 2.2);
const phone = sh('M8.5 2.5H15.5A2 2 0 0 1 17.5 4.5V19.5A2 2 0 0 1 15.5 21.5H8.5A2 2 0 0 1 6.5 19.5V4.5A2 2 0 0 1 8.5 2.5Z', '#3b4467') + `<rect x="8.3" y="5" width="7.4" height="12.4" rx=".8" fill="${BLUE_L}" stroke="none"/>` + hl('M8.3 5H12.4L8.3 10Z', 0.45) + dot(12, 19.4, 0.9, W);

const ICONS = {
  swords:
    ln('M5 5L15.4 15.4', SILVER, 2.8) +
    ln('M12.8 18.2L18.2 12.8', GOLD, 2) +
    ln('M16.6 16.6L19.6 19.6', WOOD, 2.4) +
    ln('M19 5L8.6 15.4', SILVER, 2.8) +
    ln('M11.2 18.2L5.8 12.8', GOLD, 2) +
    ln('M7.4 16.6L4.4 19.6', WOOD, 2.4),
  key: ln('M11.2 12.2L19.8 20.8M15.6 16.6L17.6 14.6M18.2 19.2L20.4 17', GOLD, 2.6) + circ(8.2, 8.8, 4.8, GOLD) + dot(8.2, 8.8, 1.7, '#8a5a10') + hl('M4.9 8.2a3.4 3.4 0 0 1 2.6-2.9a2.4 2.4 0 0 0-1.1 2.6Z', 0.75),
  target: circ(12, 12, 9.2, RED) + circ(12, 12, 6.4, W).replace('/>', ' stroke="none"/>') + circ(12, 12, 3.8, RED).replace('/>', ' stroke="none"/>') + dot(12, 12, 1.5, W) + hl('M4.6 10.5a7.6 7.6 0 0 1 5.9-5.9a8.6 8.6 0 0 0-4.6 6.6Z', 0.5),
  gear: sh(gearPath(12, 12, 10, 7.4, 8), SILVER) + circ(12, 12, 3.2, '#3a2f8f') + hl('M6.2 9.6a6.4 6.4 0 0 1 3.4-3.4L10.4 7.6a4.8 4.8 0 0 0-2.8 2.8Z', 0.7),
  back: ln('M19 12H6M11 6.5L5.5 12L11 17.5', W, 3),
  edit:
    sh('M9.81 17.87L16.74 10.94L13.06 7.26L6.13 14.19Z', GOLD) +
    sh('M16.74 10.94L19.21 8.47L15.53 4.79L13.06 7.26Z', '#ff9ab0') +
    sh('M9.81 17.87L6.13 14.19L5 19Z', '#f2c99a') +
    `<path d="M5 19L5.55 16.6L7.4 18.45Z" fill="${INK}" stroke="none"/>` +
    hl('M6.9 14.3L13.1 8.1L14.2 9.2L8 15.4Z', 0.5),
  star: sh(starPath(12, 12.6, 10, 4.4), GOLD) + hl('M12 4.2L13.8 9.6L9.6 10.4Z', 0.6),
  'star-o': ln(starPath(12, 12.6, 9.2, 4.1), W, 1.8),
  dice: `<rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="${W}"/>` + `<path d="M19.7 9.5V16.5A3.2 3.2 0 0 1 16.5 19.7H9.5C14.6 18.9 18.9 14.6 19.7 9.5Z" fill="${SILVER}" stroke="none"/>` + dot(8.3, 8.3, 1.6) + dot(15.7, 8.3, 1.6) + dot(12, 12, 1.6, RED) + dot(8.3, 15.7, 1.6) + dot(15.7, 15.7, 1.6),
  trash:
    ln('M9.5 5V3.4H14.5V5', SILVER, 1.4) +
    sh('M5.8 8L7.2 20.5H16.8L18.2 8Z', STEEL) +
    `<rect x="4" y="5" width="16" height="3.2" rx="1.2" fill="${SILVER}"/>` +
    `<path d="M10 11V17.5M14 11V17.5" stroke="${INK}" stroke-width="1.5" fill="none"/>` +
    hl('M7.4 9.4H9L9.6 18.8H8.3Z', 0.5),
  refresh: ln('M19 12A7 7 0 1 1 16.95 7.05M13.2 7.8H17.7V3.3', W, 2.8),
  menu: ln('M5 6.5H19M5 12H19M5 17.5H19', W, 2.6),
  phone,
  vibrate: phone + ln('M3.2 9V15M20.8 9V15', W, 1.6),
  sound: speaker + ln('M15.2 9.2A4 4 0 0 1 15.2 14.8M17.8 6.6A7.4 7.4 0 0 1 17.8 17.4', W, 2),
  mute: speaker + ln('M15.4 9.4L20.6 14.6M20.6 9.4L15.4 14.6', RED, 2.2),
  music: noteGlyph,
  'music-off': noteGlyph + slash,
  chat: bubble + dot(8, 10.5, 1.3) + dot(12, 10.5, 1.3) + dot(16, 10.5, 1.3),
  'chat-off': bubble + slash,
  flag: sh('M7.2 4.6C10 3 12.2 5.8 15 5C17.2 4.4 19.2 4 19.2 4V12.6C17.2 13.4 14.6 12 12 13C9.6 13.9 7.2 13.4 7.2 13.4Z', W) + hl('M8.6 6C10.4 5.3 11.6 6.6 13.4 6.6V8.4C11.6 8.4 10.4 7.4 8.6 8Z', 0.4).replace('fill="#ffffff"', `fill="${STEEL}"`) + ln('M6 3V21.5', WOOD, 2.2),
  check: ln('M5 12.6L10 17.6L19.2 7', GREEN, 3),
  cross: ln('M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5', RED, 3),
  close: ln('M6.5 6.5L17.5 17.5M17.5 6.5L6.5 17.5', W, 3),
  plus: ln('M12 4.8V19.2M4.8 12H19.2', GREEN, 4),
  drop: sh('M12 2.6C12 2.6 5.3 9.8 5.3 14.6A6.7 6.7 0 0 0 18.7 14.6C18.7 9.8 12 2.6 12 2.6Z', ELIXIR) + `<path d="M12 9.5C14.6 12.6 16.2 14 16.2 15.4A4.2 4.2 0 0 1 12 19.6Z" fill="#8a1fb5" fill-opacity=".45" stroke="none"/>` + hl('M8.4 13.8C8.4 11.8 10 9.6 11 8.4C10.6 10.2 10 12 10 13.8A.8.8 0 0 1 8.4 13.8Z', 0.7),
  heart: sh('M12 20.6C12 20.6 3.4 15.2 3.4 9.3A4.4 4.4 0 0 1 12 7.7A4.4 4.4 0 0 1 20.6 9.3C20.6 15.2 12 20.6 12 20.6Z', RED) + hl('M5.4 9.6A2.6 2.6 0 0 1 9.4 7.4A3.6 3.6 0 0 0 6.6 11Z', 0.7),
  shield: sh('M12 2.8L19.6 5.6V11.2C19.6 16 16.2 19.6 12 21.3C7.8 19.6 4.4 16 4.4 11.2V5.6Z', BLUE) + hl('M12 4.6L6 6.8V11.2C6 14.9 8.6 17.9 12 19.4Z', 0.28) + hl('M7.2 7.6L10.4 6.4V8.2L7.2 9.4Z', 0.7),
  burst: sh(starPath(12, 12, 10.4, 5.4, 9, -80), '#ffb020') + `<path d="${starPath(12, 12, 6, 2.9, 9, -80)}" fill="#fff3a0" stroke="none"/>`,
  fire: sh('M12 2.4C13 6 18.6 8.6 18.6 14.2A6.6 6.6 0 0 1 5.4 14.2C5.4 10.6 7.9 9 8.4 6.4C9.9 7.9 10.5 9.6 10.5 9.6C11.6 7.1 12 5 12 2.4Z', '#ff7a1a') + `<path d="M12 10.8C13.1 12.9 15.6 14 15.6 16.3A3.6 3.6 0 0 1 8.4 16.3C8.4 14.4 10.5 13.4 12 10.8Z" fill="${GOLD}" stroke="none"/>` + hl('M7.6 13.4C7.6 11.8 8.6 10.6 9.2 9.6C9.2 11 8.8 12.4 8.8 13.6Z', 0.55),
  castle:
    sh('M5 4.4H8V6.6H10.5V4.4H13.5V6.6H16V4.4H19V10H5Z', SILVER) +
    sh('M6.2 9.8H17.8V21H6.2Z', STEEL) +
    sh('M10 21V16.6A2 2 0 0 1 14 16.6V21Z', '#6b4a2b') +
    hl('M6.5 5.6H7V9H6.5ZM7.6 10.6H9V19.8H7.6Z', 0.55),
  house: sh('M6 10.5H18V20.5H6Z', '#f2d9a8') + sh('M3.6 11.4L12 3.8L20.4 11.4Z', RED) + sh('M10.2 20.5V15.4H13.8V20.5Z', '#8a5a33') + hl('M6.8 11.6H8.2V19.4H6.8Z', 0.6),
  radius: `<circle cx="12" cy="12" r="9" fill="${BLUE}" fill-opacity=".45"/>` + `<circle cx="12" cy="12" r="7.4" fill="none" stroke="${BLUE_L}" stroke-width="1.2" stroke-dasharray="2 2"/>` + ln('M12 12H18.2M15.8 9.6L18.2 12L15.8 14.4', W, 1.6) + dot(12, 12, 2, W),
  hourglass:
    sh('M7 5H17C17 9 13 10.5 13 12C13 13.5 17 15 17 19H7C7 15 11 13.5 11 12C11 10.5 7 9 7 5Z', '#dff3ff') +
    `<path d="M8.7 6.6H15.3C14.9 8.5 12.8 9.6 12 10.6C11.2 9.6 9.1 8.5 8.7 6.6ZM8.5 18.2C9.5 15.9 11 15.6 12 15.2C13 15.6 14.5 15.9 15.5 18.2Z" fill="${GOLD}" stroke="none"/>` +
    `<rect x="5" y="2.6" width="14" height="2.8" rx="1.1" fill="${WOOD}"/><rect x="5" y="18.6" width="14" height="2.8" rx="1.1" fill="${WOOD}"/>`,
  stopwatch:
    `<rect x="10.2" y="2.4" width="3.6" height="2.8" rx=".8" fill="${STEEL}"/>` +
    circ(12, 13.6, 7.6, W) +
    `<path d="M12 13.6V9.2M12 13.6L14.8 15.2" stroke="${INK}" stroke-width="1.8" fill="none"/>` +
    dot(12, 13.6, 1.1),
  snow: ln(snowPath(), '#a8e4ff', 1.9),
  bolt: sh('M13.6 2.4L5.4 13.6H11L9.4 21.6L18.6 9.4H12.8Z', GOLD) + hl('M12.2 5.4L7.8 11.8H9.6Z', 0.65),
  rage: ln('M4.5 9.5C8 9.5 9.5 8 9.5 4.5M14.5 4.5C14.5 8 16 9.5 19.5 9.5M19.5 14.5C16 14.5 14.5 16 14.5 19.5M9.5 19.5C9.5 16 8 14.5 4.5 14.5', '#c64bff', 2.6),
  tornado: ln('M3.8 5H20.2M6 9H17.6M8 13H16M9.6 17H14.2M11 20.6H12.6', ICE, 2.4),
  pig:
    sh('M6.2 8.6L5.4 3.6L9.8 6Z', '#ff8fae') +
    sh('M17.8 8.6L18.6 3.6L14.2 6Z', '#ff8fae') +
    circ(12, 13, 7.6, '#ffb3c7') +
    `<ellipse cx="12" cy="15.2" rx="3.3" ry="2.4" fill="#ff8fae"/>` +
    dot(10.9, 15.2, 0.7) +
    dot(13.1, 15.2, 0.7) +
    dot(9, 11, 1) +
    dot(15, 11, 1) +
    hl('M6.4 11.6A5.8 5.8 0 0 1 9.4 7.2A6.6 6.6 0 0 0 7.6 12Z', 0.6),
  group: sh('M10.2 20.4A5.4 5.4 0 0 1 21 20.4Z', BLUE_L) + circ(15.6, 8.4, 3.1, BLUE_L) + sh('M2.8 21A6.1 6.1 0 0 1 15 21Z', W) + circ(8.9, 9.6, 3.5, W),
  wind: ln('M3.4 9H14A3 3 0 1 0 11 6M3.4 13.6H18.4A2.8 2.8 0 1 1 15.6 16.4M3.4 18H10', '#dff3ff', 2.2),
  leaf: sh('M4.6 19.4C4.6 10.2 10 4.4 19.6 4.4C19.6 14 14 19.4 4.6 19.4Z', '#3fbf6b') + `<path d="M4.6 19.4L14.6 9.4" stroke="${INK}" stroke-width="1.4" fill="none"/>` + hl('M7 15.4C7.6 10.8 10.6 7.4 15.4 6.4C11.8 8.4 9.4 11.6 8.4 15Z', 0.5),
  'arrow-right': ln('M4 12H18M12.8 6.5L18.3 12L12.8 17.5', W, 3),
  down: ln('M12 4V18M6.5 12.5L12 18L17.5 12.5', W, 3),
  deploy: ln('M12 3.4V14M7.6 9.8L12 14.2L16.4 9.8M5 19.6H19', W, 2.6),
  width: ln('M3.6 12H20.4M7.6 8L3.6 12L7.6 16M16.4 8L20.4 12L16.4 16', W, 2.4),
  crosshair: ln('M12 5.6A6.4 6.4 0 1 1 11.99 5.6M12 2.6V7.4M12 16.6V21.4M2.6 12H7.4M16.6 12H21.4', W, 1.8) + dot(12, 12, 1.6, RED),
  boot:
    sh('M3.6 17.6V9.4C3.6 8 4.6 7 6 7H9.2L10.6 10C12.2 11 15 11.4 17.6 12.4C19.6 13.2 20.5 14.8 20.5 16.4V17.6Z', BLUE) +
    `<rect x="3" y="17" width="18" height="3.2" rx="1.4" fill="${W}"/>` +
    `<path d="M10.8 11.6L9.4 13M13 12.3L11.6 13.7" stroke="${W}" stroke-width="1.4" fill="none"/>` +
    hl('M5 9.4C5 8.8 5.4 8.4 6 8.4H8.4L9 9.6H5Z', 0.6),
  wing: sh('M3.8 16.2C3.8 9 9 4.4 20.2 4C19.2 7 17.6 8.6 15.6 9.4C17.6 9.6 18.6 10.1 19.2 10.6C17.6 12.7 15.6 13.4 13 13.7C14.5 14.1 15.6 14.7 16.1 15.3C13 17.6 8.5 18.1 3.8 16.2Z', W) + `<path d="M7 14.6C10 13 13.4 12.4 16.4 10.8M7.4 12C9.8 9.8 13 8.4 17 7" stroke="${BLUE_L}" stroke-width="1.3" fill="none"/>`,
  shuffle: ln('M3.4 7H7.8C12.4 7 11.6 17 16.2 17H19.6M3.4 17H7.8C9.4 17 10.4 15.8 11.1 14.5M12.9 9.5C13.6 8.2 14.6 7 16.2 7H19.6M17 4L20 7L17 10M17 14L20 17L17 20', W, 2.2),
  charge: ln('M5 6L11 12L5 18M12.4 6L18.4 12L12.4 18', '#ffb020', 3),
  leap: ln('M4 19C5.6 7.4 14.6 5.4 19 13M15.2 12.6L19.2 13.6L20.2 9.6', W, 2.4) + ln('M3 20.6H9', STEEL, 1.4),
  hook: ln('M14.2 3V14.4A5.1 5.1 0 0 1 4 14.4V12.4L6.8 15', SILVER, 2.6) + circ(14.2, 3.4, 1.8, STEEL),
  multi: ln('M12 3.6V20.4M4.8 7.8L19.2 16.2M4.8 16.2L19.2 7.8', GOLD, 2.6),
  chain: ln('M12.68 5.32A5.2 3 -45 1 0 5.32 12.68A5.2 3 -45 1 0 12.68 5.32', SILVER, 2.2) + ln('M18.68 11.32A5.2 3 -45 1 0 11.32 18.68A5.2 3 -45 1 0 18.68 11.32', SILVER, 2.2),
  pierce: ln('M4 20L18.6 5.4M12.4 5H19V11.6M4 20V16.2M4 20H7.8', W, 2.4),
  spark: sh(starPath(12, 12, 9.6, 2.9, 4), GOLD) + hl('M12 3.6L13.1 9.6L10.4 10.4Z', 0.6),
  sparkles: sh(starPath(9.6, 13.4, 7.6, 2.3, 4), GOLD) + sh(starPath(17.8, 6, 4, 1.3, 4), W) + hl('M9.6 6.6L10.4 11.2L8.4 11.6Z', 0.6),
  skull:
    sh('M12 2.8C7 2.8 4.4 6.4 4.4 10.4C4.4 13 5.8 14.6 7.5 15.5V19.4H16.5V15.5C18.2 14.6 19.6 13 19.6 10.4C19.6 6.4 17 2.8 12 2.8Z', '#f3ecdc') +
    dot(9, 11, 2.1) +
    dot(15, 11, 2.1) +
    `<path d="M12 13.2L10.9 15.2H13.1Z" fill="${INK}" stroke="none"/><path d="M10.4 16.8V19.4M13.6 16.8V19.4" stroke="${INK}" stroke-width="1.3" fill="none"/>` +
    hl('M6.4 9.6C6.6 7 8.4 5 11 4.6C9 5.8 7.8 7.6 7.6 9.8Z', 0.7),
  bomb:
    ln('M15.4 8.4C16.4 6 17.8 5 19.6 5', WOOD, 1.6) +
    `<rect x="13.2" y="6.4" width="4" height="3.4" rx=".8" transform="rotate(40 15.2 8.1)" fill="${STEEL}"/>` +
    circ(10.8, 14.2, 6.9, '#3a3f5c') +
    hl('M6.4 13A4.8 4.8 0 0 1 9.8 9.4A3.4 3.4 0 0 0 7.6 13.2Z', 0.55) +
    `<path d="${starPath(20, 4.6, 3.2, 1.2, 6)}" fill="${GOLD}" stroke="none"/>`,
  ghost: sh('M5 20.6V10.6A7 7 0 0 1 19 10.6V20.6L16.7 18.7L14.3 20.6L12 18.7L9.7 20.6L7.3 18.7Z', W) + `<ellipse cx="9.6" cy="11" rx="1.3" ry="1.8" fill="${INK}" stroke="none"/><ellipse cx="14.4" cy="11" rx="1.3" ry="1.8" fill="${INK}" stroke="none"/>`,
  pick: `<g transform="rotate(-32 12 12)">` + ln('M12 6.6V21.6', WOOD, 2.4) + sh('M3.2 8.4C7 3.8 17 3.8 20.8 8.4C16.6 6.6 7.4 6.6 3.2 8.4Z', SILVER) + `</g>`,
  mirror: ln('M12 18.4V22', GOLD_D, 2.6) + `<ellipse cx="12" cy="10.4" rx="6.4" ry="7.8" fill="${GOLD}"/><ellipse cx="12" cy="10.4" rx="4.4" ry="5.8" fill="${ICE}"/>` + `<path d="M9.6 9.6L12.4 6.4M10 12.6L14.2 7.8" stroke="${W}" stroke-width="1.3" fill="none"/>`,
  search: ln('M15.4 15.4L20.6 20.6', WOOD, 3.2) + circ(10.4, 10.4, 6.2, ICE) + hl('M6.4 9.8A4.2 4.2 0 0 1 9.8 6.4A5 5 0 0 0 7.6 10.4Z', 0.85),
  door: sh('M5.6 3H18.4V21.4H5.6Z', '#7a4c2a') + `<rect x="7.4" y="4.8" width="9.2" height="16.6" rx=".6" fill="${WOOD}"/>` + dot(14.8, 13, 1.1, GOLD) + hl('M8.2 5.6H9.4V20.4H8.2Z', 0.4),
  play: sh('M7.6 4.6L19.2 12L7.6 19.4Z', W),
  cards:
    `<rect x="6.4" y="4" width="10.6" height="15.2" rx="2" transform="rotate(-14 12 12)" fill="${RED}"/>` +
    `<rect x="7.4" y="4.8" width="10.6" height="15.2" rx="2" transform="rotate(10 12 12)" fill="${W}"/>` +
    `<path d="${starPath(12.9, 12.4, 3.6, 1.6)}" fill="${GOLD}" stroke="${INK}" stroke-width="1.1"/>`,
  'caret-down': sh('M6.4 9.4H17.6L12 15.6Z', W),
  'caret-up': sh('M6.4 14.6H17.6L12 8.4Z', W),
  // Große 3D-Krone (Ergebnis-Screen): Verlauf aus dem Sprite-<defs>, Glanzband, Juwelen
  'crown-3d':
    `<path d="M2.6 8.2L7.4 12.4L12 4.2L16.6 12.4L21.4 8.2L19.4 19.6H4.6Z" fill="url(#ig-gold)"/>` +
    `<rect x="4.2" y="17.4" width="15.6" height="3.6" rx="1.2" fill="url(#ig-gold-d)"/>` +
    `<path d="M5.6 15.2L18.4 15.2L18 16.6H6Z" fill="${W}" fill-opacity=".5" stroke="none"/>` +
    `<path d="M4.4 10.4L7.2 12.8L6.8 15H5.2Z" fill="${W}" fill-opacity=".55" stroke="none"/>` +
    circ(12, 13.2, 1.7, RED) +
    dot(11.5, 12.6, 0.6, W) +
    dot(7.2, 19.2, 0.9, BLUE_L) +
    dot(16.8, 19.2, 0.9, BLUE_L) +
    circ(12, 3.6, 1.3, GOLD),
  'crown-empty': `<path d="M2.6 8.2L7.4 12.4L12 4.2L16.6 12.4L21.4 8.2L19.4 19.6H4.6Z" fill="#0b0f2a" fill-opacity=".55" stroke-dasharray="0"/>` + `<rect x="4.2" y="17.4" width="15.6" height="3.6" rx="1.2" fill="#0b0f2a" fill-opacity=".7"/>`,
  crown: sh('M3.4 7.8L7.6 11.6L12 4.8L16.4 11.6L20.6 7.8L18.6 18.6H5.4Z', GOLD) + `<rect x="5" y="17.2" width="14" height="3" rx="1" fill="${GOLD_D}"/>` + dot(12, 13.8, 1.4, RED) + hl('M5.4 10.6L7.4 12.4L8.2 16.4H6.4Z', 0.55),
};

/** Alle bekannten Icon-Namen. */
export const ICON_NAMES = Object.keys(ICONS);

let installed = false;
/** SVG-Sprite einmalig in das Dokument hängen (vor dem ersten icon()-Aufruf). */
export function installIcons(doc = document) {
  if (installed || doc.getElementById('icon-sprite')) return;
  installed = true;
  const symbols = Object.entries(ICONS)
    .map(([n, body]) => `<symbol id="i-${n}" viewBox="0 0 24 24"><g stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${body}</g></symbol>`)
    .join('');
  const host = doc.createElement('div');
  const defs =
    '<defs>' +
    `<linearGradient id="ig-gold" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#fff3a6"/><stop offset=".45" stop-color="${GOLD}"/><stop offset="1" stop-color="${GOLD_D}"/></linearGradient>` +
    `<linearGradient id="ig-gold-d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GOLD_D}"/><stop offset="1" stop-color="#b86b0b"/></linearGradient>` +
    '</defs>';
  host.innerHTML = `<svg xmlns="${NS}" id="icon-sprite" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">${defs}${symbols}</svg>`;
  doc.body.prepend(host.firstChild);
}

/** <svg class="i"> mit Verweis auf das Symbol. */
export function icon(name, cls = '') {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('class', cls ? `i ${cls}` : 'i');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('focusable', 'false');
  const u = document.createElementNS(NS, 'use');
  u.setAttribute('href', `#i-${name}`);
  s.append(u);
  return s;
}

export const hasIcon = (name) => Object.prototype.hasOwnProperty.call(ICONS, name);

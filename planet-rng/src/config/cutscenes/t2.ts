// T2 cutscenes (1 in 1.000.000 to 1 in 100.000.000, about 20 s): two text cards, one
// frequency ramp and an own signature break each, with silence before the impact.
// All times are seconds from the start; motif keyframes are local to their track.

import { accelerating, cuesAt, fog, symbolMotif, text, veil, whiteOut } from './template';
import type { Cue, CutsceneDef, Scene } from './types';

const BUBBLES = ['#7a5cff', '#4ac9ff', '#ff4ad0'];
/** Multiversum: the cuts between the bubble universes come faster and faster. */
const MV_CUTS = accelerating(4.2, 13, 1.25, 0.3);
/** Paradoxon: beats of the text swap and the inversions. */
const PX_BEATS = accelerating(5, 13.4, 0.95, 0.42);
/** Möbius: loops of the runners (whoosh). */
const MO_LOOPS = accelerating(6, 14.2, 1.4, 0.35);
/** Entropie: crackling decay. */
const EN_CRACKS = accelerating(5, 14.2, 1.2, 0.22);

const round = (x: number) => Math.round(x * 1000) / 1000;

export const T2: CutsceneDef[] = [
  // Three bubble universes in cinema bars, cut ever faster; they merge with light bridges.
  {
    id: 'multiversum',
    auraId: 'multiversum',
    tier: 2,
    duration: 20,
    theme: { primary: '#b39dff', secondary: '#4ac9ff', fog: '#2a1a5a', dark: '#05030c' },
    tracks: [
      veil(),
      fog(1, 20, { colors: ['fog', 'dark'] }),
      text(1.2, 2.8, [
        ['Drei Welten', 'ein Atemzug'],
        ['Jede Entscheidung', 'eine neue Welt'],
        ['Nebenan', 'bist du auch'],
      ], { y: 0.5, size: 5.5 }),
      {
        t: 4.2,
        dur: 8.8,
        block: 'SceneCut',
        params: { scenes: MV_CUTS.map((t, i): Scene => ({ at: round(t - 4.2), kind: 'bubble', colors: [BUBBLES[i % 3], BUBBLES[(i + 1) % 3]], seed: i, zoom: [1, 1.08] })) },
        name: 'Schnitte',
      },
      { t: 13, dur: 7, block: 'SceneCut', params: { scenes: [{ at: 0, kind: 'nebula', colors: ['dark', 'secondary'], seed: 4 }] }, name: 'Nebel-Szene' },
      {
        t: 4.2,
        dur: 8.8,
        block: 'ThemeParticles',
        params: {
          sprite: 'dot',
          count: 90,
          dir: 'warp',
          speed: [
            [0, 0.4],
            [8.8, 2.2, 'inQuad'],
          ],
          colors: ['white'],
          size: [0.2, 0.6],
        },
      },
      { t: 3.8, dur: 11.8, block: 'Letterbox', params: { height: 0.12 }, name: 'Kinobalken' },
      {
        t: 13,
        dur: 2.6,
        block: 'CoreMotif',
        params: {
          kind: 'bubbles',
          palette: BUBBLES,
          size: 0.5,
          progress: [
            [0, 0],
            [2.5, 1, 'inCubic'],
          ],
          aux: [
            [0.5, 0],
            [2, 1],
          ],
          rate: [
            [0, 0.6],
            [2.5, 3, 'inQuad'],
          ],
          alpha: [
            [0, 0],
            [0.3, 1],
          ],
        },
        name: 'Drei Kugeln',
      },
      {
        t: 15.5,
        dur: 4.5,
        block: 'CoreMotif',
        params: symbolMotif('multiversum', {
          size: [
            [0, 0.25],
            [4.5, 0.5],
          ],
          spin: { from: 160, to: 220, over: 4.5 },
          glow: 0.4,
        }),
        name: 'Eine Welt',
      },
      { t: 15.5, dur: 1.4, block: 'GravityRings', params: { direction: 'out', count: 3, stagger: 0.1, colors: BUBBLES, width: 2.4 }, name: 'Schockwelle' },
      { t: 15.5, dur: 1.4, block: 'ThemeParticles', params: { sprite: 'glint', count: 110, dir: 'out', burst: true, life: [1, 1.4], radius: [3, 70], colors: BUBBLES } },
      { t: 15.5, dur: 0.6, block: 'Flash', params: { color: 'white', peak: 0.65, decay: 0.5 } },
      { t: 15.5, dur: 1, block: 'ScreenShake', params: { amp: 2 } },
      text(16, 2.9, [
        ['Alle Wege', 'führen hierher'],
        ['Aus vielen', 'wird eins'],
        ['Jede Welt', 'wählt dich'],
      ], { mode: 'words', y: 0.8 }),
      { t: 17.5, dur: 2.5, block: 'EdgeGlow', params: { colors: [BUBBLES[0], BUBBLES[2]], split: 'lr', intensity: [[0, 0], [1, 0.8]] } },
      whiteOut(19.4, 20),
    ],
    audio: {
      bed: 'drone',
      key: 38,
      jingle: 3,
      wind: 0.35,
      sting: 'impact',
      silence: [[15, 15.5]],
      cues: [...cuesAt(MV_CUTS.map(round), 'whoosh', { dur: 0.25, gain: 0.5 }), { t: 13, sfx: 'riser', dur: 2 }, { t: 15.5, sfx: 'bloom' }, { t: 16, sfx: 'choir', dur: 3.4, note: 62 }],
    },
    reveal: { at: 19.4, style: 'whiteout' },
    signature: { name: 'Die Welten verschmelzen', at: 15.5 },
    echo: { strength: 2, mode: 'swap' },
  },

  // A web of filaments builds up, impulses race along it; it is pulled into one thread that snaps.
  {
    id: 'kosmischesnetz',
    auraId: 'kosmischesnetz',
    tier: 2,
    duration: 20,
    theme: { primary: '#4dffd2', secondary: '#7a5cff', fog: '#0a2a3a', dark: '#02060a' },
    tracks: [
      veil(),
      { t: 0.4, dur: 19.6, block: 'SceneCut', params: { scenes: [{ at: 0, kind: 'starfield', colors: ['primary'], seed: 9 }] }, fade: [2, 0], name: 'Sternfeld' },
      fog(1.2, 20, { colors: ['fog', 'secondary'] }),
      text(1.4, 3, [
        ['Alles ist', 'verbunden'],
        ['Jeder Stern', 'ein Knoten'],
        ['Zieh an einem Faden', 'und alles bebt'],
      ]),
      { t: 3, dur: 15, block: 'ThemeParticles', params: { sprite: 'mote', count: 60, dir: 'float', colors: ['primary', 'secondary'], size: [0.2, 0.6] }, fade: [1, 0.5] },
      {
        t: 3,
        dur: 14.2,
        block: 'CoreMotif',
        params: {
          kind: 'web',
          palette: ['primary', 'secondary', 'white'],
          size: [
            [0, 0.55],
            [11, 0.75],
          ],
          progress: [
            [0, 0],
            [8, 1, 'inOutQuad'],
          ],
          rate: [
            [0, 0.4],
            [11, 3, 'inQuad'],
          ],
          aux: [
            [10.2, 0],
            [11.6, 1, 'inOutCubic'],
            [12.1, 1],
            [12.5, 2, 'outCubic'],
          ],
          alpha: [
            [0, 0],
            [0.5, 1],
          ],
        },
        name: 'Netz',
      },
      { t: 6, dur: 7, block: 'Counter', params: { label: 'Verbindungen', from: 1, to: 10_000_000_000, ease: 'inExpo', format: 'de', y: 0.16, size: 6, color: 'primary' }, fade: [0.4, 0.4], name: 'Zähler' },
      { t: 15.1, dur: 1.4, block: 'GravityRings', params: { direction: 'out', count: 3, stagger: 0.1, colors: ['primary', 'secondary', 'white'], width: 2.2 }, name: 'Riss' },
      { t: 15.1, dur: 1.2, block: 'ThemeParticles', params: { sprite: 'spark', count: 100, dir: 'out', burst: true, life: [0.8, 1.2], radius: [2, 70], colors: ['primary', 'white'], trail: 3 } },
      { t: 15.1, dur: 0.5, block: 'Flash', params: { color: 'primary', peak: 0.55, decay: 0.4 } },
      { t: 15.1, dur: 1, block: 'ScreenShake', params: { amp: 2.2, freq: 22 } },
      {
        t: 15.3,
        dur: 4.7,
        block: 'CoreMotif',
        params: symbolMotif('kosmischesnetz', {
          size: [
            [0, 0.15],
            [4.7, 0.5],
          ],
          spin: { from: 120, to: 200, over: 4.7 },
          glow: 0.35,
          alpha: [
            [0, 0],
            [0.6, 1],
          ],
        }),
        name: 'Neu gewebt',
      },
      text(16, 2.9, [
        ['Nichts hält', 'für immer'],
        ['Gerissen', 'und neu gewebt'],
        ['Und doch', 'bleibt ein Faden'],
      ], { mode: 'words', y: 0.8 }),
      { t: 17.5, dur: 2.5, block: 'EdgeGlow', params: { colors: ['primary', 'secondary'], split: 'tb', intensity: [[0, 0], [1, 0.8]] } },
      whiteOut(19.4, 20),
    ],
    audio: {
      bed: 'drone',
      key: 40,
      jingle: 1,
      wind: 0.35,
      sting: 'impact',
      silence: [[14.7, 15.1]],
      cues: [
        { t: 12.8, sfx: 'riser', dur: 1.9 },
        { t: 13.2, sfx: 'whoosh', dur: 1.4 },
        { t: 15.1, sfx: 'slash' },
        { t: 16, sfx: 'choir', dur: 3.4, note: 62 },
      ],
    },
    reveal: { at: 19.4, style: 'whiteout' },
    signature: { name: 'Der Faden reißt', at: 15.1 },
    echo: { strength: 2, mode: 'mono' },
  },

  // Countdown in the dark, a white core beats ever faster; it collapses, half a second of
  // silence, then the whole picture bursts outwards in glowing shards.
  {
    id: 'urknall',
    auraId: 'urknall',
    tier: 2,
    duration: 19.5,
    theme: { primary: '#ffd23f', secondary: '#ff4500', fog: '#3a0a00', dark: '#050100' },
    tracks: [
      veil(),
      fog(1.5, 13, {
        colors: ['fog', 'secondary'],
        density: [
          [0, 0],
          [3, 0.6],
          [11.5, 0.15],
        ],
      }),
      { t: 3, dur: 10, block: 'ThemeParticles', params: { sprite: 'ember', count: 70, dir: 'up', colors: ['primary', 'secondary'], size: [0.4, 1], alpha: [[0, 1], [10, 0.2]] } },
      text(1.2, 2.8, [
        ['Vor dem Anfang', 'war nichts'],
        ['Kein Raum', 'keine Zeit'],
        ['Nur ein Punkt', 'und Stille'],
      ], { y: 0.5 }),
      { t: 9, dur: 4, block: 'FadeVeil', params: { color: 'black', from: 0, to: 0.65 }, ease: 'inQuad', name: 'Verdunkeln' },
      { t: 3.5, dur: 9, block: 'Counter', params: { from: 10, to: 0, ease: 'linear', format: 'int', y: 0.2, size: 13, color: 'primary', ticks: 'tock' }, fade: [0.4, 0.3], name: 'Countdown' },
      {
        t: 3,
        dur: 10,
        block: 'CoreMotif',
        params: {
          kind: 'core',
          palette: ['primary', 'secondary'],
          size: [
            [0, 0.25],
            [9.6, 0.5],
            [10, 0.05, 'inExpo'],
          ],
          rate: [
            [0, 0.6],
            [9.5, 4.5],
          ],
          progress: [
            [8.5, 0],
            [9.6, 1],
          ],
          alpha: [
            [0, 0],
            [1, 1],
          ],
        },
        name: 'Kern',
      },
      { t: 3, dur: 9.5, block: 'Ticker', params: { rate: [0.6, 4.5], sound: 'pulse' }, name: 'Herzschlag' },
      { t: 13.5, dur: 0.1, block: 'SceneCut', params: { scenes: [{ at: 0, kind: 'core', colors: ['primary', 'secondary'], bright: true }] }, name: 'Glut' },
      { t: 13.55, dur: 2.4, block: 'Shatter', params: { pieces: 56, origin: [0.5, 0.5], force: 0.75, gravity: 25, spin: 0.8, edge: 'primary', behind: 'black', crack: 0.1 }, name: 'Zerspringen' },
      { t: 13.6, dur: 1.8, block: 'GravityRings', params: { direction: 'out', count: 4, stagger: 0.12, colors: ['primary', 'secondary', 'white'], width: 2.6 }, name: 'Glut-Schockwelle' },
      { t: 13.6, dur: 1.6, block: 'ThemeParticles', params: { sprite: 'ember', count: 140, dir: 'out', burst: true, life: [1, 1.6], radius: [2, 80], colors: ['primary', 'secondary'], size: [0.6, 1.5], trail: 2 } },
      { t: 13.55, dur: 1.2, block: 'ScreenShake', params: { amp: 3, decay: 2 } },
      { t: 15.4, dur: 4.1, block: 'ThemeParticles', params: { sprite: 'ember', count: 60, dir: 'float', colors: ['primary', 'secondary'], size: [0.3, 0.9] }, fade: [1, 0] },
      {
        t: 15,
        dur: 4.5,
        block: 'CoreMotif',
        params: symbolMotif('urknall', {
          size: [
            [0, 0.08],
            [4.5, 0.48],
          ],
          spin: { from: 140, to: 220, over: 4.5 },
          glow: 0.4,
        }),
        name: 'Erstes Licht',
      },
      text(15.6, 2.9, [
        ['Und dann', 'war alles'],
        ['Aus nichts', 'wurde Licht'],
        ['Es beginnt', 'mit dir'],
      ], { mode: 'words', y: 0.8 }),
      whiteOut(18.9, 19.5),
    ],
    audio: {
      bed: 'drone',
      key: 33,
      jingle: 2,
      wind: 0.3,
      sting: 'impact',
      silence: [[13, 13.5]],
      cues: [
        { t: 11, sfx: 'riser', dur: 2 },
        { t: 12.6, sfx: 'suck', dur: 0.4 },
        { t: 13.55, sfx: 'glass' },
        { t: 13.6, sfx: 'thunder' },
      ],
    },
    reveal: { at: 18.9, style: 'whiteout' },
    signature: { name: 'Das Bild zerspringt', at: 13.5 },
    echo: { strength: 2, mode: 'tint', color: 'primary' },
  },

  // Cells divide faster and faster in the warm deep; they fuse, and lightning strikes life into them.
  {
    id: 'ursuppe',
    auraId: 'ursuppe',
    tier: 2,
    duration: 20,
    theme: { primary: '#d6ff8a', secondary: '#2fd36b', fog: '#0a3a1a', dark: '#020a04' },
    tracks: [
      veil(),
      fog(1.2, 20, { colors: ['fog', 'secondary'], band: 'bottom' }),
      fog(2, 20, { colors: ['fog', 'dark'], layers: 2, density: [[0, 0], [3, 0.35]] }),
      { t: 2, dur: 18, block: 'ThemeParticles', params: { sprite: 'bubble', count: 50, dir: 'up', life: [3, 5], colors: ['primary', 'secondary'], size: [0.6, 1.6], sway: 2 }, fade: [1.5, 0] },
      text(1.4, 3, [
        ['In der Tiefe', 'regt sich etwas'],
        ['Warm und dunkel', 'wartet es'],
        ['Noch schläft', 'das Leben'],
      ]),
      {
        t: 3,
        dur: 11.6,
        block: 'CoreMotif',
        params: {
          kind: 'cells',
          palette: ['primary', 'secondary', '#ff9a3d'],
          size: [
            [0, 0.5],
            [11, 0.72],
          ],
          progress: [
            [0, 0],
            [10.5, 1, 'inQuad'],
          ],
          aux: [
            [10.8, 0],
            [11.6, 1, 'inOutQuad'],
          ],
          alpha: [
            [0, 0],
            [0.8, 1],
          ],
        },
        name: 'Zellen',
      },
      { t: 5, dur: 8.5, block: 'Counter', params: { label: 'Zellen', from: 1, to: 1_048_576, ease: 'inExpo', format: 'de', y: 0.16, size: 6, color: 'primary', ticks: 'bubble' }, fade: [0.4, 0.4], name: 'Zähler' },
      { t: 14.6, dur: 0.4, block: 'Rays', params: { through: 'vertical', rate: [60, 60], color: 'primary', width: 1.3, life: 0.3, seed: 8 }, name: 'Blitz' },
      { t: 14.6, dur: 0.5, block: 'Flash', params: { color: 'primary', peak: 0.6, decay: 0.45 } },
      { t: 14.6, dur: 1.4, block: 'GravityRings', params: { direction: 'out', count: 3, stagger: 0.12, colors: ['primary', 'secondary', '#ff9a3d'], width: 2.2 } },
      { t: 14.6, dur: 1.2, block: 'ThemeParticles', params: { sprite: 'spark', count: 110, dir: 'out', burst: true, life: [0.8, 1.2], radius: [2, 65], colors: ['primary', 'white'], trail: 2.5 } },
      { t: 14.6, dur: 0.9, block: 'ScreenShake', params: { amp: 2.4, freq: 24 } },
      {
        t: 14.6,
        dur: 5.4,
        block: 'CoreMotif',
        params: symbolMotif('ursuppe', {
          size: [
            [0, 0.3],
            [5.4, 0.55],
          ],
          spin: { from: 100, to: 180, over: 5.4 },
          glow: [
            [0, 1],
            [1.5, 0.4],
          ],
        }),
        name: 'Lebensfunke',
      },
      text(15.6, 3.2, [
        ['Ein Funke', 'genügt'],
        ['Aus einer Zelle', 'wird eine Welt'],
        ['Es lebt'],
      ], { mode: 'words', y: 0.8 }),
      { t: 17.6, dur: 2.4, block: 'EdgeGlow', params: { colors: ['secondary'], intensity: [[0, 0], [1, 0.8]] } },
      whiteOut(19.4, 20),
    ],
    audio: {
      bed: 'drone',
      key: 36,
      jingle: 5,
      wind: 0.3,
      sting: 'zap',
      silence: [[14.1, 14.6]],
      cues: [
        { t: 12.5, sfx: 'riser', dur: 1.6 },
        { t: 14.6, sfx: 'thunder' },
        { t: 14.6, sfx: 'impact', gain: 0.7 },
        { t: 15.6, sfx: 'swell', dur: 3.5, note: 60 },
      ],
    },
    reveal: { at: 19.4, style: 'whiteout' },
    signature: { name: 'Der Lebensfunke schlägt ein', at: 14.6 },
    echo: { strength: 2, mode: 'tint', color: 'secondary' },
  },

  // A crystal lattice decays to dust while colour drains and order counts down; it collapses,
  // then silently puts itself back together.
  {
    id: 'entropie',
    auraId: 'entropie',
    tier: 2,
    duration: 21,
    theme: { primary: '#c0c6d4', secondary: '#5a6478', fog: '#1a1d26', dark: '#030305' },
    tracks: [
      veil(),
      fog(1, 21, {
        colors: ['#3a4a6a', 'fog'],
        grey: [
          [2, 0],
          [12, 1],
        ],
      }),
      text(1.3, 3, [
        ['Nichts bleibt', 'wie es war'],
        ['Alles strebt', 'zum Gleichgewicht'],
        ['Ordnung', 'ist nur geliehen'],
      ]),
      {
        t: 3,
        dur: 11.6,
        block: 'ThemeParticles',
        params: {
          sprite: 'ash',
          count: 120,
          dir: 'out',
          radius: [4, 70],
          life: [2, 3.5],
          speed: [
            [0, 0.2],
            [11.6, 2.2, 'inQuad'],
          ],
          colors: ['primary', 'secondary'],
          size: [0.3, 0.9],
          alpha: [
            [0, 0],
            [8, 1],
          ],
        },
        name: 'Staub',
      },
      {
        t: 3,
        dur: 18,
        block: 'CoreMotif',
        params: {
          kind: 'structure',
          palette: ['#9fb4ff', '#c0c6d4'],
          size: 0.62,
          spin: { from: 8, to: 30, over: 11 },
          progress: [
            [2, 0],
            [11, 0.75, 'inQuad'],
            [11.6, 1, 'inCubic'],
            [13, 1],
            [15.8, 0, 'inOutCubic'],
          ],
          aux: [
            [0, 0],
            [11, 1],
            [13, 1],
            [15.8, 0.3],
          ],
          alpha: [
            [0, 0],
            [0.8, 1],
          ],
        },
        name: 'Gitter',
      },
      { t: 5, dur: 9, block: 'Counter', params: { label: 'Ordnung', from: 100, to: 0, ease: 'inQuad', format: 'percent', y: 0.16, size: 7, color: 'primary', ticks: false }, fade: [0.4, 0.4], name: 'Zähler' },
      { t: 14, dur: 0.75, block: 'GravityRings', params: { direction: 'in', count: 4, stagger: 0.08, colors: ['primary', 'secondary'], width: 1.8 }, name: 'Kollaps' },
      { t: 14.7, dur: 0.5, block: 'Flash', params: { color: 'primary', peak: 0.35, decay: 0.4 } },
      { t: 14.7, dur: 1, block: 'ScreenShake', params: { amp: 2.6, decay: 2.5, zoom: [[0, 0.94], [1, 1]] } },
      text(16.2, 3.6, [
        ['Und fügt sich', 'neu'],
        ['Aus Staub', 'wird Ordnung'],
        ['Das Ende', 'war nur eine Pause'],
      ], { y: 0.8 }),
      whiteOut(20.4, 21),
    ],
    audio: {
      bed: 'drone',
      key: 31,
      jingle: 2,
      wind: 0.45,
      sting: 'impact',
      silence: [
        [14.2, 14.7],
        [15.4, 18.4],
      ],
      cues: [...cuesAt(EN_CRACKS.map(round), 'crack', { gain: 0.25 }), { t: 14.7, sfx: 'crack' }, { t: 18.6, sfx: 'swell', dur: 2, note: 55 }],
    },
    reveal: { at: 20.4, style: 'whiteout' },
    signature: { name: 'Kollaps und stille Wiederkehr', at: 14.7 },
    echo: { strength: 2, mode: 'mono' },
  },

  // Stars go out one by one, the temperature falls; one last ember, a held silence, then it
  // blooms into warm light.
  {
    id: 'waermetod',
    auraId: 'waermetod',
    tier: 2,
    duration: 20,
    theme: { primary: '#ff8a5c', secondary: '#6a7480', fog: '#1e2229', dark: '#030405' },
    tracks: [
      veil(),
      fog(1, 20, { colors: ['fog', 'dark'], layers: 2, density: [[0, 0], [3, 0.4]] }),
      {
        t: 0.6,
        dur: 13,
        block: 'ThemeParticles',
        params: {
          sprite: 'dot',
          count: 150,
          dir: 'float',
          life: [5, 8],
          colors: ['white', '#ffd2b0'],
          size: [0.2, 0.55],
          alpha: [
            [0, 1],
            [11, 0.04, 'inQuad'],
          ],
        },
        fade: [1.5, 0],
        name: 'Sterne verlöschen',
      },
      { t: 2, dur: 12, block: 'ThemeParticles', params: { sprite: 'flake', count: 45, dir: 'down', life: [4, 6], colors: ['secondary', '#c0d4e8'], size: [0.5, 1.1], sway: 3 }, fade: [1.5, 1] },
      text(1.4, 3, [
        ['Es wird kalt', 'und still'],
        ['Die Sterne', 'gehen schlafen'],
        ['Alle Wärme', 'verrinnt'],
      ]),
      { t: 4.5, dur: 9, block: 'Counter', params: { label: 'Temperatur', from: 5778, to: 3, ease: 'inQuad', format: 'kelvin', y: 0.16, size: 6.5, color: 'primary', ticks: false }, fade: [0.4, 0.4], name: 'Zähler' },
      {
        t: 3,
        dur: 11.6,
        block: 'CoreMotif',
        params: symbolMotif('waermetod', {
          size: [
            [0, 0.5],
            [10.5, 0.12, 'inQuad'],
            [11.6, 0.05],
          ],
          spin: { from: 60, to: 20, over: 11 },
          alpha: [
            [0, 0],
            [0.8, 1],
            [10.5, 0.75],
          ],
        }),
        name: 'Letzter Stern',
      },
      { t: 13, dur: 0.6, block: 'FadeVeil', params: { color: 'black', from: 0, to: 0.92 }, hold: true, name: 'Dunkel' },
      {
        t: 13.6,
        dur: 1,
        block: 'CoreMotif',
        params: { kind: 'core', palette: ['primary', 'secondary'], size: 0.08, rate: 0.5, alpha: [[0, 0], [0.3, 1]] },
        name: 'Glut',
      },
      { t: 14.6, dur: 1.8, block: 'GravityRings', params: { direction: 'out', count: 3, stagger: 0.25, colors: ['primary', '#ffd2b0'], width: 2.6 }, name: 'Aufblühen' },
      { t: 14.6, dur: 1.6, block: 'ThemeParticles', params: { sprite: 'ember', count: 90, dir: 'out', burst: true, life: [1.2, 1.6], radius: [1, 55], colors: ['primary', '#ffd2b0'], size: [0.6, 1.4] } },
      { t: 14.6, dur: 0.7, block: 'Flash', params: { color: 'primary', peak: 0.45, decay: 0.7 } },
      {
        t: 14.6,
        dur: 5.4,
        block: 'CoreMotif',
        params: symbolMotif('waermetod', {
          size: [
            [0, 0.05],
            [5.4, 0.45, 'outQuad'],
          ],
          spin: { from: 160, to: 220, over: 5.4 },
          glow: 0.5,
        }),
        name: 'Das letzte Licht',
      },
      text(15.6, 3.2, [
        ['Doch ein Licht', 'bleibt'],
        ['Das letzte Licht', 'gehört dir'],
        ['Noch ist', 'nicht alles kalt'],
      ], { mode: 'words', y: 0.8 }),
      {
        t: 14.6,
        dur: 5.4,
        block: 'EdgeGlow',
        params: {
          colors: ['primary'],
          inset: 0.5,
          intensity: [
            [0, 0],
            [0.4, 0.9, 'outQuad'],
            [4.7, 0.8],
            [5.4, 1.4],
          ],
        },
        name: 'Wärme',
      },
    ],
    audio: {
      bed: 'drone',
      key: 29,
      jingle: 1,
      wind: 0.55,
      sting: 'bloom',
      silence: [[14, 14.6]],
      cues: [
        { t: 13, sfx: 'freeze', dur: 1 },
        { t: 14.6, sfx: 'impact', gain: 0.5 },
        { t: 15.6, sfx: 'swell', dur: 4, note: 57 },
      ],
    },
    reveal: { at: 19.3, style: 'edgeglow' },
    signature: { name: 'Die letzte Glut erblüht', at: 14.6 },
    echo: { strength: 2, mode: 'tint', color: 'primary' },
  },

  // Two mirrored halves, orange and cyan; "true / false" swap on an accelerating beat with
  // inversions; the screen is cut in two and both halves swap colour and run backwards.
  {
    id: 'paradoxon',
    auraId: 'paradoxon',
    tier: 2,
    duration: 20,
    theme: { primary: '#ff5a3c', secondary: '#4ac9ff', fog: '#2a1a4a', dark: '#05030a' },
    tracks: [
      veil(),
      { t: 0.4, dur: 19.6, block: 'SceneCut', params: { scenes: [{ at: 0, kind: 'starfield', colors: ['secondary'], seed: 12 }] }, fade: [2, 0], name: 'Sternfeld' },
      fog(1, 20, { colors: ['fog', 'dark'] }),
      text(1.3, 3, [
        ['Das Ende', 'ist der Anfang'],
        ['Was wahr ist', 'ist auch falsch'],
        ['Vorher', 'ist nachher'],
      ]),
      {
        t: 3,
        dur: 17,
        block: 'ThemeParticles',
        params: {
          sprite: 'spark',
          count: 70,
          dir: 'up',
          colors: ['primary'],
          size: [0.4, 1],
          trail: 1.5,
          speed: [
            [0, 1],
            [11.5, 1.6],
            [11.7, -1.8],
          ],
        },
        clip: { angle: 90, side: 1 },
        name: 'Zeit links',
      },
      {
        t: 3,
        dur: 17,
        block: 'ThemeParticles',
        params: {
          sprite: 'spark',
          count: 70,
          dir: 'down',
          colors: ['secondary'],
          size: [0.4, 1],
          trail: 1.5,
          seed: 3,
          speed: [
            [0, 1],
            [11.5, 1.6],
            [11.7, -1.8],
          ],
        },
        clip: { angle: 90, side: -1 },
        name: 'Zeit rechts',
      },
      {
        t: 3,
        dur: 17,
        block: 'CoreMotif',
        params: {
          kind: 'halves',
          palette: ['primary', 'secondary'],
          size: [
            [0, 0.35],
            [11, 0.6],
          ],
          rate: [
            [0, 0.3],
            [10.4, 1.6, 'inQuad'],
          ],
          alpha: [
            [0, 0],
            [0.6, 1],
          ],
        },
        name: 'Hälften',
      },
      { t: 5, dur: 8.6, block: 'TextCard', params: { cycle: ['Wahr', 'Falsch'], wordTimes: 'beats', y: 0.8, size: 7 }, name: 'Wahr/Falsch' },
      { t: 5, dur: 8.6, block: 'BeatInvert', params: { every: 2, hold: 0.1 }, name: 'Inversion' },
      {
        t: 14.6,
        dur: 4.8,
        block: 'SplitSlash',
        params: {
          angle: 90,
          swap: 'both',
          swapAt: 0.2,
          live: true,
          glow: 'white',
          gap: [
            [0, 0],
            [0.2, 2, 'outCubic'],
            [4.8, 3],
          ],
          shift: [
            [0, 0],
            [0.3, 4, 'outCubic'],
            [4.8, 6],
          ],
        },
        name: 'Spaltung',
      },
      { t: 14.6, dur: 0.8, block: 'ScreenShake', params: { amp: 2 } },
      text(15.6, 3.2, [
        ['Beides', 'ist wahr'],
        ['Die Zeit läuft', 'in beide Richtungen'],
        ['Nichts passt zusammen', 'und doch'],
      ], { mode: 'words', y: 0.8 }),
      whiteOut(19.4, 20),
    ],
    audio: {
      bed: 'drone',
      key: 37,
      jingle: 4,
      wind: 0.3,
      sting: 'slash',
      beats: PX_BEATS.map(round),
      silence: [[14.1, 14.6]],
      cues: [...PX_BEATS.map((t, i): Cue => ({ t: round(t), sfx: i % 2 ? 'tock' : 'kick', gain: 0.6 })), { t: 12.6, sfx: 'riser', dur: 1.5 }, { t: 14.6, sfx: 'impact' }],
    },
    reveal: { at: 19.4, style: 'whiteout' },
    signature: { name: 'Zweiteilung: Farbe und Zeit kehren sich um', at: 14.6 },
    echo: { strength: 2, mode: 'swap' },
  },

  // A Möbius strip turns, light runners lap it ever faster; the whole picture folds over to
  // its other side.
  {
    id: 'moebius',
    auraId: 'moebius',
    tier: 2,
    duration: 20,
    theme: { primary: '#ff3dbb', secondary: '#7af0ff', fog: '#2a0a3a', dark: '#05020a' },
    tracks: [
      veil(),
      { t: 0.4, dur: 19.6, block: 'SceneCut', params: { scenes: [{ at: 0, kind: 'starfield', colors: ['primary'], seed: 21 }] }, fade: [2, 0], name: 'Sternfeld' },
      fog(1, 20, { colors: ['fog', 'secondary'] }),
      text(1.3, 3, [
        ['Innen', 'ist außen'],
        ['Ohne Anfang', 'ohne Ende'],
        ['Wer immer weitergeht', 'kommt an'],
      ]),
      { t: 3, dur: 17, block: 'ThemeParticles', params: { sprite: 'glint', count: 50, dir: 'orbit', radius: [30, 48], twist: 0.6, life: [5, 8], colors: ['primary', 'secondary'], size: [0.5, 1.1] } },
      {
        t: 3,
        dur: 17,
        block: 'CoreMotif',
        params: {
          kind: 'mobius',
          palette: ['primary', 'secondary'],
          size: [
            [0, 0.4],
            [11, 0.65],
          ],
          rate: [
            [0, 0.12],
            [11, 1.2, 'inQuad'],
          ],
          aux: [
            [11.7, 0],
            [12.2, 1],
          ],
          alpha: [
            [0, 0],
            [0.6, 1],
          ],
        },
        name: 'Band',
      },
      {
        t: 14.7,
        dur: 5.3,
        block: 'ScreenShake',
        params: {
          amp: 1.6,
          decay: 3,
          flip: [
            [0, 1],
            [0.45, -1, 'inOutCubic'],
          ],
          zoom: [
            [0, 1],
            [0.22, 0.86, 'outQuad'],
            [0.45, 1, 'inQuad'],
          ],
        },
        name: 'Umstülpung',
      },
      { t: 14.7, dur: 0.5, block: 'BeatInvert', params: { beats: [0.12], mode: 'swap', hold: 0.12 } },
      { t: 14.9, dur: 1.4, block: 'GravityRings', params: { direction: 'out', count: 2, colors: ['primary', 'secondary'], width: 2.2 } },
      text(15.6, 3.2, [
        ['Und wieder', 'von vorn'],
        ['Die andere Seite', 'war dieselbe'],
        ['Du bist', 'schon hier'],
      ], { mode: 'words', y: 0.8 }),
      { t: 17.4, dur: 2.6, block: 'EdgeGlow', params: { colors: ['primary', 'secondary'], split: 'lr', intensity: [[0, 0], [1, 0.8]] } },
      whiteOut(19.4, 20),
    ],
    audio: {
      bed: 'drone',
      key: 39,
      jingle: 3,
      wind: 0.3,
      sting: 'impact',
      silence: [[14.2, 14.7]],
      cues: [...cuesAt(MO_LOOPS.map(round), 'whoosh', { dur: 0.3, gain: 0.45 }), { t: 14.7, sfx: 'whoosh', dur: 0.6 }, { t: 15.6, sfx: 'choir', dur: 3.8, note: 59 }],
    },
    reveal: { at: 19.4, style: 'whiteout' },
    signature: { name: 'Das Bild stülpt sich um', at: 14.7 },
    echo: { strength: 2, mode: 'swap' },
  },
];

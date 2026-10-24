// T1 cutscenes (1 in 10.000 to 1 in 1.000.000): the Kreis-Stern template (3 s black, the motif
// grows linearly for 10 s, pulse at 9.5 s, edges at 12 s, white-out at 13 s) with an own
// motif, own particles, own pulse symbol and one small break per aura.
// All times are seconds from the start; motif keyframes are local (motif starts at 3 s).

import { accelerating, kreisStern, t1 } from './template';
import type { CutsceneDef } from './types';

/** Heartbeat times of Supernova (accelerating), local to the pulse track at 5 s. */
const SUPERNOVA_BEATS = accelerating(0, 6.2, 1.25, 0.32);

export const T1: CutsceneDef[] = [
  // The star field spirals into a dark point; it collapses, half a second of nothing, then it
  // explodes outwards.
  t1({
    aura: 'singularitaet',
    theme: { primary: '#d9c7ff', secondary: '#6b3fd1', fog: '#2a1250', dark: '#07030d' },
    motif: {
      kind: 'blackHole',
      size: [
        [0, 0.1],
        [8.3, 0.42],
        [8.65, 0, 'inExpo'],
      ],
      tilt: 0.3,
      aux: [
        [0, 0],
        [8, 1],
      ],
      alpha: [
        [0, 0],
        [0.8, 1],
      ],
      glow: 0.3,
    },
    particles: [
      {
        sprite: 'dot',
        count: 170,
        dir: 'spiral',
        twist: 1.6,
        life: [2.2, 3.6],
        speed: [
          [0, 0.35],
          [8.3, 2.6, 'inQuad'],
          [8.6, 0],
        ],
        size: [0.35, 1],
        colors: ['white', 'primary'],
        trail: 3,
        radius: [2, 80],
      },
    ],
    mid: [
      {
        t: 3,
        dur: 8.65,
        block: 'Lens',
        params: {
          radius: [
            [0, 6],
            [8.3, 26],
            [8.65, 0, 'inExpo'],
          ],
          strength: [
            [0, 0.2],
            [8.3, 0.9],
          ],
          dark: 0,
        },
        name: 'Linse',
      },
    ],
    pulse: { symbol: 'spiral', size: 26, interval: 0.8 },
    edge: false,
    brk: {
      name: 'Kollaps auf einen Punkt',
      at: 12.15,
      tracks: [
        { t: 11.62, dur: 0.53, block: 'FadeVeil', params: { color: 'black', from: 1, to: 1 }, name: 'Schwarz' },
        { t: 12.15, dur: 1.35, block: 'GravityRings', params: { direction: 'out', count: 4, stagger: 0.12, colors: ['white', 'primary', 'secondary'], width: 2.2 }, name: 'Explosion' },
        { t: 12.15, dur: 1.35, block: 'ThemeParticles', params: { sprite: 'spark', count: 150, dir: 'out', burst: true, life: [0.9, 1.35], radius: [0, 75], size: [0.6, 1.6], colors: ['white', 'primary'], trail: 2.5 }, name: 'Funken' },
        { t: 12.15, dur: 0.6, block: 'Flash', params: { color: 'primary', peak: 0.6, decay: 0.45 } },
        { t: 12.15, dur: 1.2, block: 'ScreenShake', params: { amp: 2.5, decay: 2 } },
      ],
    },
    audio: {
      jingle: 2,
      silence: [[11.62, 12.15]],
      sting: 'impact',
      cues: [{ t: 9.6, sfx: 'suck', dur: 2 }],
    },
  }),

  // Embers spiral into the star; rings are sucked in, the star swallows them with a gulp.
  t1({
    aura: 'akkretion',
    theme: { primary: '#ffb35c', secondary: '#ff6a1a', fog: '#4a1a05', dark: '#0a0400' },
    motif: kreisStern('akkretion', {
      size: [
        [0, 0.05],
        [8.9, 0.46],
        [9.15, 0.34, 'inQuad'],
        [9.45, 0.56, 'outBack'],
        [10, 0.5],
      ],
    }),
    particles: [
      {
        sprite: 'ember',
        count: 120,
        dir: 'in',
        twist: 0.55,
        life: [2, 3.2],
        speed: [
          [0, 0.5],
          [8, 1.8, 'inQuad'],
        ],
        size: [0.5, 1.3],
        colors: ['primary', 'secondary', 'white'],
        radius: [3, 75],
      },
    ],
    pulse: { symbol: 'orbit', size: 30 },
    edge: { colors: ['secondary'] },
    brk: {
      name: 'Sog',
      at: 12.4,
      tracks: [
        { t: 10.9, dur: 1.3, block: 'GravityRings', params: { direction: 'in', count: 5, stagger: 0.16, colors: ['primary', 'secondary'], width: 1.8 }, name: 'Sog' },
        { t: 12.4, dur: 0.9, block: 'GravityRings', params: { direction: 'out', count: 2, stagger: 0.1, colors: ['white', 'primary'], width: 2.4 } },
        {
          t: 12.4,
          dur: 0.8,
          block: 'ScreenShake',
          params: {
            amp: 1.8,
            zoom: [
              [0, 1.06],
              [0.8, 1],
            ],
          },
        },
        { t: 12.4, dur: 0.5, block: 'Flash', params: { color: 'primary', peak: 0.5, decay: 0.4 } },
      ],
    },
    audio: { jingle: 0, silence: [[12.05, 12.4]], sting: 'impact', cues: [{ t: 10.9, sfx: 'suck', dur: 1.15 }] },
  }),

  // A blood-red moon rises through falling drops and darkens in an eclipse; then the edges bleed.
  t1({
    aura: 'blutmond',
    theme: { primary: '#ff5a5a', secondary: '#8a0a1a', fog: '#5a0010', dark: '#0d0003' },
    motif: {
      kind: 'moon',
      size: [
        [0, 0.16],
        [10, 0.5],
      ],
      y: [
        [0, 22],
        [7, 0, 'outCubic'],
      ],
      spin: { from: 6, to: 14, over: 10 },
      aux: [
        [7.5, 0],
        [8.8, 1, 'inOutQuad'],
      ],
      alpha: [
        [0, 0],
        [1.2, 1],
      ],
      glow: [
        [0, 0.2],
        [8.8, 0.5],
      ],
    },
    particles: [
      { sprite: 'droplet', count: 55, dir: 'down', life: [2.5, 4], size: [0.6, 1.4], colors: ['primary', 'secondary'], blend: 'over', sway: 1 },
      { sprite: 'mote', count: 40, dir: 'float', colors: ['primary'], size: [0.3, 0.8] },
    ],
    pulse: { symbol: 'crescent', size: 34 },
    edge: false,
    brk: {
      name: 'Verfinsterung',
      at: 12.1,
      tracks: [
        {
          t: 12.1,
          dur: 1.4,
          block: 'EdgeGlow',
          params: {
            colors: ['primary'],
            inset: 0.6,
            intensity: [
              [0, 0],
              [0.15, 1.2, 'outQuad'],
              [1.4, 1],
            ],
            pulse: 1.2,
          },
          name: 'Rand blutet',
        },
        { t: 12.1, dur: 0.6, block: 'Flash', params: { color: 'secondary', peak: 0.55, decay: 0.5 } },
        { t: 12.1, dur: 1.1, block: 'ThemeParticles', params: { sprite: 'droplet', count: 70, dir: 'out', burst: true, life: [0.8, 1.3], radius: [8, 60], colors: ['primary', 'secondary'], size: [0.8, 1.8] } },
        { t: 12.1, dur: 0.9, block: 'ScreenShake', params: { amp: 1.4 } },
      ],
    },
    outro: [{ t: 13, dur: 0.5, block: 'FadeVeil', params: { color: 'secondary', from: 0, to: 0.5 }, ease: 'inQuad', name: 'Ausklang' }],
    reveal: 'edgeglow',
    audio: {
      jingle: 2,
      silence: [[11.75, 12.1]],
      sting: 'splash',
      cues: [
        { t: 10.4, sfx: 'swell', dur: 1.35, note: 45 },
        { t: 12.1, sfx: 'impact', gain: 0.8 },
      ],
    },
  }),

  // Feathers and golden rain fall; rays gather into a pillar of light that strikes the star.
  t1({
    aura: 'seraph',
    theme: { primary: '#ffe08a', secondary: '#9fdcff', fog: '#3a3550', dark: '#05060f' },
    particles: [
      { sprite: 'feather', count: 34, dir: 'down', life: [4, 6], size: [1.2, 2.4], colors: ['white', 'primary'], sway: 5, roll: 0.6, blend: 'over' },
      { sprite: 'spark', count: 70, dir: 'down', life: [1.2, 2], size: [0.3, 0.7], colors: ['primary'], trail: 2.5 },
    ],
    pulse: { symbol: 'star8', size: 36 },
    edge: { colors: ['primary', 'secondary'], split: 'tb' },
    brk: {
      name: 'Lichtsäule',
      at: 11.85,
      tracks: [
        { t: 10.4, dur: 1.45, block: 'Rays', params: { through: 'vertical', rate: [2, 12], color: 'primary', width: 0.7, life: 0.5 }, name: 'Strahlen' },
        { t: 11.85, dur: 1.15, block: 'Rays', params: { through: 'vertical', rate: [40, 40], color: 'white', width: 1.6, life: 0.9, seed: 5 }, name: 'Säule' },
        { t: 11.85, dur: 0.7, block: 'Flash', params: { color: 'primary', peak: 0.6, decay: 0.6 } },
        { t: 11.85, dur: 1.2, block: 'GravityRings', params: { direction: 'out', count: 2, colors: ['primary', 'secondary'] } },
      ],
    },
    audio: {
      jingle: 1,
      silence: [[11.5, 11.85]],
      sting: 'chime',
      cues: [
        { t: 9.4, sfx: 'choir', dur: 2.2, note: 60 },
        { t: 11.85, sfx: 'impact', gain: 0.7 },
        { t: 11.85, sfx: 'choir', dur: 2.2, note: 64 },
      ],
    },
  }),

  // Glitching pixels, an hourglass; time tears: the picture is cut and slips sideways.
  t1({
    aura: 'zeitriss',
    theme: { primary: '#00e5c0', secondary: '#ff3d9a', fog: '#003a35', dark: '#020807' },
    fog: { colors: ['fog', 'dark'], layers: 2 },
    particles: [{ sprite: 'pixel', count: 110, dir: 'float', life: [0.6, 1.6], size: [0.5, 1.2], colors: ['primary', 'secondary', 'white'] }],
    pulse: { symbol: 'hourglass', size: 30 },
    edge: { colors: ['primary', 'secondary'], split: 'lr' },
    brk: {
      name: 'Zeitriss',
      at: 11.7,
      tracks: [
        {
          t: 11.7,
          dur: 1.3,
          block: 'SplitSlash',
          params: {
            angle: -8,
            glow: 'secondary',
            gap: [
              [0, 0],
              [0.15, 1.6, 'outCubic'],
              [1.3, 3],
            ],
            shift: [
              [0, 0],
              [0.2, 6, 'outCubic'],
              [1.3, 8],
            ],
          },
          name: 'Riss',
        },
        { t: 11.7, dur: 0.4, block: 'Flash', params: { color: 'secondary', peak: 0.45, decay: 0.3 } },
        { t: 11.7, dur: 0.6, block: 'ScreenShake', params: { amp: 2.2, freq: 30 } },
      ],
    },
    audio: {
      jingle: 4,
      silence: [[11.35, 11.7]],
      sting: 'slash',
      cues: [
        { t: 9.8, sfx: 'riser', dur: 1.55 },
        { t: 10.2, sfx: 'glitch' },
        { t: 10.9, sfx: 'glitch' },
        { t: 11.7, sfx: 'glitch' },
      ],
    },
  }),

  // An infinity band draws itself ever faster in all colours; time freezes grey, then the
  // spectrum blooms.
  t1({
    aura: 'ewigkeit',
    theme: { primary: '#ffd76a', secondary: '#c9a7ff', fog: '#2a2410', dark: '#050403' },
    motif: {
      kind: 'lemniscate',
      size: [
        [0, 0.3],
        [10, 0.55],
      ],
      palette: ['primary', 'white', 'spectrum'],
      progress: [
        [0, 0],
        [7.6, 1, 'inQuad'],
      ],
      spin: { from: 0, to: 12, over: 10 },
      alpha: [
        [0, 0],
        [0.5, 1],
      ],
      glow: [
        [0, 0.15],
        [8, 0.4],
      ],
    },
    particles: [{ sprite: 'glint', count: 50, dir: 'float', colors: ['primary', 'white'], size: [0.6, 1.4], life: [2, 3] }],
    pulse: { symbol: 'infinity', size: 30 },
    edge: { colors: ['spectrum'] },
    brk: {
      name: 'Stillstand, dann Spektrum-Blüte',
      at: 12,
      tracks: [
        { t: 11, dur: 1, block: 'TimeFreeze', params: { desaturate: 1, dim: 0.35 }, name: 'Stillstand' },
        { t: 12, dur: 1.5, block: 'GravityRings', params: { direction: 'out', count: 6, stagger: 0.07, colors: ['spectrum'], width: 2 }, name: 'Blüte' },
        { t: 12, dur: 1.5, block: 'ThemeParticles', params: { sprite: 'glint', count: 120, dir: 'out', burst: true, life: [1, 1.5], radius: [2, 70], colors: ['spectrum'], size: [0.8, 1.8] } },
        { t: 12, dur: 0.6, block: 'Flash', params: { color: 'white', peak: 0.5, decay: 0.5 } },
      ],
    },
    audio: {
      jingle: 3,
      silence: [[11.45, 12]],
      sting: 'bloom',
      cues: [
        { t: 11, sfx: 'freeze', dur: 0.45 },
        { t: 12, sfx: 'impact', gain: 0.6 },
      ],
    },
  }),

  // A clock whose hands race ever faster with the ticking, then stop dead at midnight: gong.
  t1({
    aura: 'chronosphaere',
    theme: { primary: '#fff1b8', secondary: '#d4af37', fog: '#3a2a10', dark: '#060402' },
    motif: {
      kind: 'clock',
      size: [
        [0, 0.08],
        [10, 0.5],
      ],
      palette: ['secondary', 'primary'],
      progress: [
        [0, 0],
        [8.5, 6.75, 'inQuad'],
        [9, 7, 'outCubic'],
      ],
      aux: [
        [0, 0],
        [8.5, 0.95, 'inQuad'],
        [9, 1, 'outCubic'],
      ],
      alpha: [
        [0, 0],
        [0.6, 1],
      ],
      glow: 0.25,
    },
    particles: [
      { sprite: 'gear', count: 18, dir: 'float', size: [1.2, 2.6], colors: ['secondary'], life: [4, 6], roll: 0.3, alpha: 0.6 },
      { sprite: 'mote', count: 60, dir: 'float', colors: ['primary'], size: [0.3, 0.8] },
    ],
    mid: [{ t: 3, dur: 8.5, block: 'Ticker', params: { rate: [2, 14] }, name: 'Ticken' }],
    pulse: { symbol: 'gear', size: 32 },
    brk: {
      name: 'Mitternacht',
      at: 12,
      tracks: [
        { t: 12, dur: 1.5, block: 'GravityRings', params: { direction: 'out', count: 3, stagger: 0.25, colors: ['secondary', 'primary'], width: 2.4 }, name: 'Gong' },
        {
          t: 12,
          dur: 1.2,
          block: 'ScreenShake',
          params: {
            amp: 1.2,
            zoom: [
              [0, 1.05],
              [1.2, 1],
            ],
          },
        },
        { t: 12, dur: 0.6, block: 'Flash', params: { color: 'secondary', peak: 0.4, decay: 0.6 } },
      ],
    },
    audio: { jingle: 1, silence: [[11.6, 12]], sting: 'gong', cues: [{ t: 12, sfx: 'impact', gain: 0.5 }] },
  }),

  // Light streams into a black hole seen edge-on; its horizon grows over everything, only the
  // violet edges remain.
  t1({
    aura: 'ereignishorizont',
    theme: { primary: '#e8d8ff', secondary: '#7a5cff', fog: '#1a0f3a', dark: '#000000' },
    motif: {
      kind: 'blackHole',
      tilt: 0.16,
      size: [
        [0, 0.12],
        [8.2, 0.42],
        [9, 1.6, 'inCubic'],
      ],
      aux: [
        [0, 0.5],
        [8, 1.5],
      ],
      alpha: [
        [0, 0],
        [0.8, 1],
      ],
    },
    particles: [
      {
        sprite: 'dot',
        count: 150,
        dir: 'in',
        twist: 0.18,
        life: [1.6, 2.8],
        speed: [
          [0, 0.6],
          [8, 2, 'inQuad'],
        ],
        size: [0.3, 0.9],
        colors: ['primary', 'white'],
        trail: 2.2,
        radius: [4, 85],
      },
    ],
    pulse: { symbol: 'eye', size: 30 },
    edge: false,
    brk: {
      name: 'Der Horizont schließt sich',
      at: 12.5,
      tracks: [
        { t: 11.55, dur: 0.45, block: 'FadeVeil', params: { color: 'black', from: 0, to: 1 }, ease: 'inQuad', hold: true, name: 'Schwarz' },
        {
          t: 12.5,
          dur: 1,
          block: 'EdgeGlow',
          params: {
            colors: ['secondary'],
            inset: 0.55,
            intensity: [
              [0, 0],
              [0.12, 1.3, 'outQuad'],
              [1, 1],
            ],
            pulse: 1.5,
          },
          name: 'Ränder',
        },
        { t: 12.5, dur: 1, block: 'GravityRings', params: { direction: 'in', count: 3, stagger: 0.12, colors: ['secondary'], from: 1.2, to: 0.3 } },
        { t: 12.5, dur: 0.8, block: 'ScreenShake', params: { amp: 1.6 } },
      ],
    },
    outro: [],
    reveal: 'edgeglow',
    audio: {
      jingle: 2,
      silence: [[12.0, 12.5]],
      sting: 'impact',
      cues: [
        { t: 10.7, sfx: 'suck', dur: 1.3 },
        { t: 12.5, sfx: 'thunder', gain: 0.6 },
      ],
    },
  }),

  // Two jets grow longer and brighter until they flare over the full height: white saturation.
  t1({
    aura: 'quasar',
    theme: { primary: '#8ecfff', secondary: '#ff6a3a', fog: '#0a2050', dark: '#01030a' },
    motif: {
      kind: 'jets',
      size: [
        [0, 0.1],
        [10, 0.42],
      ],
      tilt: 0.22,
      progress: [
        [0, 0],
        [8.2, 0.55, 'inQuad'],
        [8.9, 1.6, 'inCubic'],
      ],
      aux: [
        [8.6, 0],
        [9.2, 1],
      ],
      alpha: [
        [0, 0],
        [0.6, 1],
      ],
    },
    particles: [
      {
        sprite: 'dot',
        count: 130,
        dir: 'warp',
        life: [1.2, 2.4],
        speed: [
          [0, 0.3],
          [9, 1.8, 'inQuad'],
        ],
        size: [0.25, 0.7],
        colors: ['white', 'primary'],
      },
    ],
    pulse: { symbol: 'sun', size: 32 },
    edge: { colors: ['primary', 'secondary'], split: 'tb' },
    brk: {
      name: 'Jet-Flare',
      at: 11.9,
      tracks: [
        { t: 11.9, dur: 1.6, block: 'Rays', params: { through: 'vertical', rate: [30, 50], color: 'primary', width: 1.4, life: 0.6 }, name: 'Flare' },
        { t: 11.9, dur: 0.7, block: 'Flash', params: { color: 'primary', peak: 0.7, decay: 0.6 } },
        {
          t: 11.9,
          dur: 1,
          block: 'ScreenShake',
          params: {
            amp: 2,
            zoom: [
              [0, 1.08],
              [1, 1],
            ],
          },
        },
      ],
    },
    outro: [{ t: 12.4, dur: 1.1, block: 'WhiteOut', params: { color: 'white', peak: 1 }, ease: 'inQuad', name: 'Weißsättigung' }],
    audio: {
      jingle: 0,
      silence: [[11.55, 11.9]],
      sting: 'laser',
      cues: [
        { t: 9.6, sfx: 'riser', dur: 1.95 },
        { t: 11.9, sfx: 'impact' },
      ],
    },
  }),

  // Red fog, a small star beating like a heart (faster and faster), core stability counts down,
  // a frozen grey instant, then the star bursts.
  t1({
    aura: 'supernova',
    theme: { primary: '#ffb36b', secondary: '#7a3dff', fog: '#5a1a0a', dark: '#0a0203' },
    fog: { colors: ['fog', 'secondary'], layers: 3 },
    motif: kreisStern('supernova', {
      size: [
        [0, 0.05],
        [8.3, 0.4],
        [8.9, 0.62, 'outQuad'],
        [10, 0.66],
      ],
    }),
    particles: [{ sprite: 'ember', count: 80, dir: 'up', life: [2, 3.5], colors: ['primary', 'secondary'], size: [0.5, 1.2] }],
    pulse: { symbol: 'star4', at: SUPERNOVA_BEATS.filter((t) => t >= 4.5).map((t) => Math.round((t - 4.5) * 1000) / 1000), sound: 'heartbeat', size: 26, life: 0.45 },
    edge: { colors: ['primary'] },
    brk: {
      name: 'Kern bricht',
      at: 12.3,
      tracks: [
        { t: 8, dur: 3.3, block: 'Counter', params: { label: 'Kernstabilität', from: 100, to: 0, format: 'percent', ease: 'inQuad', y: 0.17, size: 8, color: 'primary' }, fade: [0.3, 0.3], name: 'Zähler' },
        { t: 11.9, dur: 0.4, block: 'TimeFreeze', params: { desaturate: 1, dim: 0.2 }, name: 'Einfrieren' },
        { t: 12.3, dur: 1.2, block: 'GravityRings', params: { direction: 'out', count: 4, stagger: 0.1, colors: ['white', 'primary', 'secondary'], width: 2.6 }, name: 'Ausbruch' },
        { t: 12.3, dur: 1.2, block: 'ThemeParticles', params: { sprite: 'chunk', count: 90, dir: 'out', burst: true, life: [0.8, 1.2], radius: [3, 70], colors: ['primary', 'secondary'], size: [0.8, 1.8], roll: 1 } },
        { t: 12.3, dur: 0.6, block: 'Flash', params: { color: 'primary', peak: 0.8, decay: 0.5 } },
        { t: 12.3, dur: 1.1, block: 'ScreenShake', params: { amp: 2.6, decay: 2 } },
      ],
    },
    audio: {
      jingle: 2,
      silence: [[11.9, 12.3]],
      sting: 'impact',
      cues: [
        ...SUPERNOVA_BEATS.filter((t) => t < 4.5).map((t) => ({ t: Math.round((5 + t) * 1000) / 1000, sfx: 'heartbeat' as const, gain: 0.7 })),
        { t: 11.9, sfx: 'freeze', dur: 0.3 },
        { t: 12.3, sfx: 'thunder', gain: 0.6 },
      ],
    },
    echo: { strength: 1, mode: 'tint', color: 'primary' },
  }),

  // A galaxy turns at an angle; a second one approaches and the two collide.
  t1({
    aura: 'andromeda',
    theme: { primary: '#ffc6f2', secondary: '#6b5bff', fog: '#2a1a5a', dark: '#04030c' },
    motif: {
      kind: 'galaxy',
      size: [
        [0, 0.12],
        [10, 0.55],
      ],
      tilt: 0.5,
      angle: -18,
      palette: ['primary', 'secondary', '#ffe6a8'],
      aux: [
        [6.8, 0],
        [8.9, 1, 'inQuad'],
      ],
      alpha: [
        [0, 0],
        [0.8, 1],
      ],
    },
    particles: [
      { sprite: 'mote', count: 90, dir: 'float', colors: ['white', 'primary'], size: [0.2, 0.6], life: [3, 5] },
      { sprite: 'dot', count: 60, dir: 'warp', speed: 0.25, colors: ['white'], size: [0.2, 0.5] },
    ],
    pulse: { symbol: 'star4', size: 28, color: '#ffe6a8' },
    brk: {
      name: 'Galaxienkollision',
      at: 11.9,
      tracks: [
        { t: 11.9, dur: 1.4, block: 'GravityRings', params: { direction: 'out', count: 3, colors: ['primary', '#ffe6a8', 'secondary'] }, name: 'Kollision' },
        { t: 11.9, dur: 1.4, block: 'ThemeParticles', params: { sprite: 'glint', count: 90, dir: 'out', burst: true, life: [1, 1.4], radius: [4, 60], colors: ['primary', '#ffe6a8'] } },
        { t: 11.9, dur: 0.5, block: 'Flash', params: { color: 'primary', peak: 0.55, decay: 0.45 } },
        { t: 11.9, dur: 0.8, block: 'ScreenShake', params: { amp: 1.2 } },
      ],
    },
    audio: {
      jingle: 5,
      silence: [[11.55, 11.9]],
      sting: 'shimmer',
      cues: [
        { t: 9.8, sfx: 'whoosh', dur: 1.7 },
        { t: 11.9, sfx: 'impact', gain: 0.7 },
      ],
    },
  }),

  // Sparks race along the field lines; a magnetic storm of lightning shakes the screen.
  t1({
    aura: 'magnetar',
    theme: { primary: '#00b3ff', secondary: '#ff2bd6', fog: '#002a4a', dark: '#01040a' },
    particles: [
      {
        sprite: 'spark',
        count: 100,
        dir: 'orbit',
        radius: [12, 40],
        twist: 0.55,
        life: [1.2, 2.2],
        speed: [
          [0, 0.6],
          [8.5, 2, 'inQuad'],
        ],
        colors: ['primary', 'secondary'],
        size: [0.3, 0.8],
        trail: 1.5,
      },
    ],
    pulse: { symbol: 'bolt', size: 30 },
    edge: { colors: ['primary', 'secondary'], split: 'lr' },
    brk: {
      name: 'Magnetsturm',
      at: 11.6,
      tracks: [
        { t: 11.6, dur: 1.4, block: 'Rays', params: { through: 'random', rate: [8, 14], color: 'secondary', width: 0.6, life: 0.25, sound: 'zap' }, name: 'Blitze' },
        { t: 11.6, dur: 0.9, block: 'Flash', params: { color: 'primary', peak: 0.45, at: [0, 0.4], decay: 0.25 } },
        { t: 11.6, dur: 1.4, block: 'ScreenShake', params: { amp: 2, freq: 26, decay: 1 } },
      ],
    },
    audio: {
      jingle: 4,
      silence: [[11.25, 11.6]],
      sting: 'zap',
      cues: [
        { t: 9.8, sfx: 'riser', dur: 1.45 },
        { t: 11.6, sfx: 'thunder', gain: 0.7 },
      ],
    },
  }),
];

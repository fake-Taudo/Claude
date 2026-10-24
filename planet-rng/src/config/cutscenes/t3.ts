// T3 films (from 1 in 100.000.000, 28–36 s): every aura has its own script with music and beat
// markers; texts, cuts and flashes sit on the beats. No template, no borrowed breaks.
// All times are seconds from the start; motif keyframes are local to their track.

import { beatGrid, cuesAt, fog, symbolMotif, text, veil, whiteOut } from './template';
import type { CoreMotifParams, CutsceneDef, MotifKind, MusicSpec, Scene, SceneKind, Track } from './types';

const SPECTRUM = ['#ff5a5a', '#ffcf4a', '#5aff8f', '#4ac9ff', '#c94aff'];
const round = (x: number) => Math.round(x * 1000) / 1000;

// ---------------------------------------------------------------------------
// Omniversum: a reprise of all the other worlds, ever faster, then a spectral mandala that
// counts universes; everything falls into one point, silence, a spectral shockwave.
// ---------------------------------------------------------------------------

const OM_MUSIC: MusicSpec = { t: 4, bpm: 120, beats: 52, key: 45, drop: 20, mood: 'bright' };
/** Reprise cuts: every second beat first, then on every beat. */
const OM_CUTS = [...beatGrid(4, 60, 6), ...beatGrid(10, 120, 8)];
const OM_REPRISE: [MotifKind, SceneKind, Partial<CoreMotifParams>][] = [
  ['blackHole', 'starfield', {}],
  ['lemniscate', 'nebula', { progress: 1 }],
  ['jets', 'starfield', { progress: 0.5 }],
  ['moon', 'sky', {}],
  ['galaxy', 'nebula', {}],
  ['clock', 'grid', { progress: [[0, 0], [1, 3]] }],
  ['bubbles', 'bubble', { progress: 0.2 }],
  ['web', 'starfield', { progress: 1 }],
  ['cells', 'nebula', { progress: 0.6 }],
  ['mobius', 'starfield', {}],
  ['halves', 'nebula', {}],
  ['structure', 'grid', { progress: 0.2 }],
  ['core', 'core', { rate: 2 }],
  ['comet', 'starfield', {}],
];

function reprise(): Track[] {
  const out: Track[] = [];
  const scenes: Scene[] = [];
  OM_CUTS.forEach((t, i) => {
    const end = OM_CUTS[i + 1] ?? 14;
    const [kind, scene, extra] = OM_REPRISE[i % OM_REPRISE.length];
    const c0 = SPECTRUM[i % 5];
    const c1 = SPECTRUM[(i + 2) % 5];
    scenes.push({ at: round(t - 4), kind: scene, colors: [c0, c1], seed: i + 1, zoom: [1.05, 1] });
    out.push({
      t: round(t),
      dur: round(end - t),
      block: 'CoreMotif',
      params: { kind, palette: [c0, c1, '#ffffff'], size: [[0, 0.32], [end - t, 0.42]], spin: { from: 20, to: 40, over: 1 }, ...extra },
      name: `Reprise ${kind}`,
    });
  });
  return [{ t: 4, dur: 10, block: 'SceneCut', params: { scenes }, name: 'Reprise-Schnitte' }, ...out];
}

const omniversum: CutsceneDef = {
  id: 'omniversum',
  auraId: 'omniversum',
  tier: 3,
  duration: 32,
  theme: { primary: '#ffffff', secondary: '#c94aff', fog: '#2a1a4a', dark: '#040309' },
  tracks: [
    veil(),
    fog(1, 4, { colors: ['fog', 'dark'] }),
    text(0.6, 3.3, [['Alles was ist'], ['Alles was war'], ['Alles was sein wird']], { mode: 'words', wordTimes: [0.4, 1.2, 2], y: 0.5, size: 6.5 }),
    ...reprise(),
    {
      t: 4,
      dur: 10,
      block: 'ThemeParticles',
      params: { sprite: 'dot', count: 90, dir: 'warp', speed: [[0, 0.5], [10, 2.6, 'inQuad']], colors: ['white'], size: [0.2, 0.6] },
      name: 'Sog der Bilder',
    },
    { t: 3.6, dur: 10.8, block: 'Letterbox', params: { height: 0.12 }, name: 'Kinobalken' },
    { t: 14, dur: 18, block: 'SceneCut', params: { scenes: [{ at: 0, kind: 'nebula', colors: ['#c94aff', '#4ac9ff'], seed: 31 }] }, name: 'All' },
    fog(14, 32, { colors: ['#4ac9ff', '#c94aff'], density: [[0, 0], [2, 0.4]] }),
    {
      t: 14,
      dur: 10.5,
      block: 'ThemeParticles',
      params: { sprite: 'glint', count: 80, dir: 'orbit', radius: [30, 52], twist: 0.3, life: [3, 5], speed: [[0, 0.6], [10.5, 3, 'inQuad']], colors: ['spectrum'], size: [0.5, 1.2] },
      name: 'Umlauf',
    },
    { t: 18.5, dur: 6, block: 'Rays', params: { through: 'center', rate: [1, 9], color: 'spectrum', width: 0.6, life: 0.4 }, name: 'Strahlen' },
    {
      t: 14,
      dur: 11.1,
      block: 'CoreMotif',
      params: {
        kind: 'mandala',
        palette: ['spectrum'],
        size: [[0, 0.3], [10, 0.7], [10.5, 0.62], [11.1, 0, 'inExpo']],
        progress: [[0, 0], [6, 1, 'inOutQuad']],
        rate: [[0, 0.1], [10.5, 1.2, 'inQuad']],
        glow: 0.3,
      },
      name: 'Mandala',
    },
    { t: 14.5, dur: 10, block: 'Counter', params: { label: 'Universen', from: 1, to: 100_000_000, ease: 'inExpo', format: 'de', y: 0.15, size: 6.5, color: 'white', maxTickRate: 10 }, fade: [0.4, 0.3], name: 'Zähler' },
    text(16, 7.5, [['Ein Universum', 'ist nur', 'der Anfang'], ['Jede Welt', 'ein Ton', 'im Ganzen'], ['Alles', 'gleichzeitig', 'überall']], { mode: 'words', wordTimes: [0, 1, 2, 3, 4, 5], y: 0.8 }),
    { t: 24.5, dur: 0.6, block: 'GravityRings', params: { direction: 'in', count: 5, stagger: 0.06, colors: SPECTRUM, width: 1.8 }, name: 'In einen Punkt' },
    { t: 24.5, dur: 0.6, block: 'ThemeParticles', params: { sprite: 'glint', count: 120, dir: 'in', burst: true, life: [0.5, 0.6], radius: [0, 80], colors: ['spectrum'], size: [0.5, 1.1] } },
    { t: 25.1, dur: 0.6, block: 'FadeVeil', params: { color: 'black', from: 1, to: 1 }, name: 'Stille' },
    { t: 25.7, dur: 2, block: 'GravityRings', params: { direction: 'out', count: 7, stagger: 0.05, colors: SPECTRUM, width: 3 }, name: 'Spektrale Schockwelle' },
    { t: 25.7, dur: 2, block: 'ThemeParticles', params: { sprite: 'glint', count: 170, dir: 'out', burst: true, life: [1.3, 2], radius: [0, 90], colors: ['spectrum'], size: [0.7, 1.7], trail: 2 } },
    { t: 25.7, dur: 0.7, block: 'Flash', params: { color: 'white', peak: 0.7, decay: 0.6 } },
    { t: 25.7, dur: 1.4, block: 'ScreenShake', params: { amp: 3, decay: 2, zoom: [[0, 1.1], [1.4, 1]] } },
    {
      t: 25.7,
      dur: 6.3,
      block: 'CoreMotif',
      params: symbolMotif('omniversum', { size: [[0, 0.1], [6.3, 0.55]], spin: { from: 180, to: 260, over: 6.3 }, glow: 0.5 }),
      name: 'Allumfassend',
    },
    text(27, 3.8, [['Und du', 'mittendrin'], ['Alles', 'in einem'], ['Hier treffen sich', 'alle Wege']], { mode: 'words', wordTimes: 'beats', y: 0.8 }),
    { t: 29, dur: 3, block: 'EdgeGlow', params: { colors: ['spectrum'], intensity: [[0, 0], [1.5, 0.9]] } },
    whiteOut(31.4, 32),
  ],
  audio: {
    bed: 'drone',
    key: 33,
    jingle: 3,
    wind: 0.25,
    music: OM_MUSIC,
    beats: beatGrid(OM_MUSIC.t, OM_MUSIC.bpm, OM_MUSIC.beats),
    sting: 'impact',
    silence: [[25.1, 25.7]],
    cues: [...cuesAt(OM_CUTS.map(round), 'whoosh', { dur: 0.2, gain: 0.5 }), { t: 22.5, sfx: 'riser', dur: 2.6 }, { t: 24.5, sfx: 'suck', dur: 0.6 }, { t: 25.7, sfx: 'bloom' }, { t: 25.7, sfx: 'thunder', gain: 0.7 }, { t: 26.5, sfx: 'choir', dur: 4.5, note: 64 }],
  },
  reveal: { at: 31.4, style: 'whiteout' },
  signature: { name: 'Alles fällt in einen Punkt: spektrale Schockwelle', at: 25.7 },
  echo: { strength: 3, mode: 'swap' },
};

// ---------------------------------------------------------------------------
// Schöpfung: one point of light, a grey world is built cut by cut, then colour floods it.
// ---------------------------------------------------------------------------

const SC_MUSIC: MusicSpec = { t: 3.5, bpm: 96, beats: 40, key: 48, drop: 16, mood: 'bright' };
const SC_CUTS = beatGrid(9.5, 48, 8);
const SC_SCENES: SceneKind[] = ['nebula', 'starfield', 'surface', 'sky', 'surface', 'nebula', 'sky', 'surface'];

const schoepfung: CutsceneDef = {
  id: 'schoepfung',
  auraId: 'schoepfung',
  tier: 3,
  duration: 30,
  theme: { primary: '#ffe9a8', secondary: '#6fb7ff', fog: '#3a2a10', dark: '#050403' },
  tracks: [
    veil(),
    text(0.6, 2.8, [['Erst Dunkel', 'dann Licht'], ['Aus dem Nichts', 'ein Funke'], ['Alles beginnt', 'mit einem Punkt']], { mode: 'words', wordTimes: [0.3, 0.9, 1.5, 2.1], y: 0.5 }),
    {
      t: 9.5,
      dur: 20.5,
      block: 'SceneCut',
      params: { scenes: SC_CUTS.map((t, i): Scene => ({ at: round(t - 9.5), kind: SC_SCENES[i], colors: SC_SCENES[i] === 'sky' ? ['#2a5a9a', '#c08a4a'] : [i % 2 ? '#ffb36b' : '#6fb7ff', i % 2 ? '#2f7a4a' : '#ffe9a8'], seed: 40 + i, zoom: [1.08, 1] })) },
      name: 'Die Welt entsteht',
    },
    { t: 3.5, dur: 6, block: 'ThemeParticles', params: { sprite: 'mote', count: 120, dir: 'in', life: [2, 3], radius: [2, 70], speed: [[0, 0.5], [6, 1.6]], colors: ['primary', 'white'], size: [0.3, 0.8] }, fade: [1, 0.5], name: 'Sammeln' },
    {
      t: 3.5,
      dur: 6.4,
      block: 'CoreMotif',
      params: { kind: 'core', palette: ['primary', '#ffb36b'], size: [[0, 0.05], [6, 0.35]], rate: SC_MUSIC.bpm / 60, alpha: [[0, 0], [0.6, 1], [6, 1], [6.4, 0]] },
      name: 'Erstes Licht',
    },
    {
      t: 12,
      dur: 18,
      block: 'CoreMotif',
      params: { kind: 'planet', palette: ['#6fb7ff', '#ffe9a8'], size: [[0, 0.12], [8, 0.4], [18, 0.48]], y: -8, spin: { from: 4, to: 4, over: 1 }, alpha: [[0, 0], [0.8, 1]] },
      name: 'Planet',
    },
    { t: 12, dur: 6.5, block: 'Counter', params: { label: 'Farben', from: 1, to: 16_777_216, ease: 'inExpo', format: 'de', y: 0.17, size: 6, color: 'white' }, fade: [0.4, 0.3], name: 'Zähler' },
    { t: 9.3, dur: 9.5, block: 'Letterbox', params: { height: 0.11 } },
    {
      t: 9.5,
      dur: 11.5,
      block: 'TimeFreeze',
      params: { live: true, desaturate: 1, dim: 0, hole: [[9.5, 0], [11.5, 140, 'inQuad']] },
      name: 'Grau, dann Farbflut',
    },
    { t: 19, dur: 2.2, block: 'GravityRings', params: { direction: 'out', count: 4, stagger: 0.1, colors: SPECTRUM, width: 2.6, to: 1.3 }, name: 'Farbwelle' },
    { t: 19, dur: 0.6, block: 'Flash', params: { color: 'primary', peak: 0.5, decay: 0.55 } },
    { t: 19.5, dur: 9.5, block: 'Rays', params: { through: 'center', rate: [2, 6], color: 'primary', width: 0.5, life: 0.8 }, name: 'Sonnenaufgang' },
    {
      t: 20,
      dur: 10,
      block: 'CoreMotif',
      params: symbolMotif('schoepfung', { size: [[0, 0.08], [10, 0.5]], spin: { from: 120, to: 200, over: 10 }, glow: 0.4, y: [[0, 6], [10, 0]] }),
      name: 'Schöpfer',
    },
    text(21, 4, [['Alles hat', 'seine Farbe'], ['Die Welt', 'atmet'], ['Aus dir', 'wird alles']], { mode: 'words', wordTimes: [0, 1.25, 2.5, 3.1], y: 0.82 }),
    { t: 27, dur: 3, block: 'EdgeGlow', params: { colors: ['primary', '#6fb7ff'], split: 'tb', intensity: [[0, 0], [1.5, 0.85]] } },
    whiteOut(29.4, 30),
  ],
  audio: {
    bed: 'drone',
    key: 36,
    jingle: 1,
    wind: 0.25,
    music: SC_MUSIC,
    beats: beatGrid(SC_MUSIC.t, SC_MUSIC.bpm, SC_MUSIC.beats),
    sting: 'bloom',
    silence: [[18.5, 19]],
    cues: [...cuesAt(SC_CUTS.map(round), 'chime', { gain: 0.4, note: 79 }), { t: 16.5, sfx: 'riser', dur: 2 }, { t: 19, sfx: 'impact', gain: 0.6 }, { t: 19.4, sfx: 'choir', dur: 6, note: 60 }],
  },
  reveal: { at: 29.4, style: 'whiteout' },
  signature: { name: 'Die Farbe flutet die Welt', at: 19 },
  echo: { strength: 3, mode: 'tint', color: 'primary' },
};

// ---------------------------------------------------------------------------
// Nullpunkt: begins like Singularität (fakeout), cuts to white; a black zero, black and white
// on the beat, a count down to nothing; darkness, silence, then a line of light opens it all.
// ---------------------------------------------------------------------------

const NP_MUSIC: MusicSpec = { t: 6.2, bpm: 100, beats: 36, key: 40, drop: 12, mood: 'dark' };
const NP_BEATS = beatGrid(NP_MUSIC.t, NP_MUSIC.bpm, NP_MUSIC.beats);

const nullpunkt: CutsceneDef = {
  id: 'nullpunkt',
  auraId: 'nullpunkt',
  tier: 3,
  duration: 28,
  extends: { id: 'singularitaet', until: 2.6 },
  theme: { primary: '#ffffff', secondary: '#888888', fog: '#222222', dark: '#000000' },
  tracks: [
    { t: 2.6, dur: 19.4, block: 'SceneCut', params: { scenes: [{ at: 0, kind: 'paper', bright: true }] }, name: 'Weiß' },
    text(3, 3, [['Am Nullpunkt', 'endet jede Zahl'], ['Alles', 'zählt rückwärts'], ['Null', 'ist kein Ende']], { color: 'black', y: 0.5 }),
    {
      t: 6.2,
      dur: 15.8,
      block: 'CoreMotif',
      params: { kind: 'ring', palette: ['black'], size: [[0, 0.2], [14, 0.55], [15.2, 0.5], [15.8, 0, 'inExpo']], progress: [[0, 0], [15, 1]], alpha: [[0, 0], [0.3, 1]] },
      name: 'Null',
    },
    { t: 6.2, dur: 15.2, block: 'Counter', params: { label: 'Rest', from: 1_000_000, to: 0, ease: 'inQuad', format: 'de', y: 0.17, size: 6.5, color: 'black', maxTickRate: 8 }, fade: [0.3, 0.2], name: 'Zähler' },
    { t: 13.4, dur: 4.8, block: 'BeatInvert', params: { every: 2, hold: 0.15 }, name: 'Schwarz-Weiß' },
    { t: 18.2, dur: 3.2, block: 'BeatInvert', params: { every: 1, hold: 0.12 }, name: 'Schwarz-Weiß schneller' },
    text(14, 6, [['Weniger', 'ist', 'mehr'], ['Bis', 'nichts', 'bleibt'], ['Alles', 'löst sich', 'auf']], { mode: 'words', wordTimes: [0, 1.2, 2.4], color: 'black', y: 0.8, size: 6 }),
    { t: 21.6, dur: 0.4, block: 'FadeVeil', params: { color: 'black', from: 0, to: 1 }, ease: 'inQuad', hold: true, name: 'Nichts' },
    {
      t: 22.6,
      dur: 1.6,
      block: 'SplitSlash',
      params: { angle: 0, glow: 'white', gap: [[0, 0], [0.12, 1], [1.4, 160, 'inCubic']], shift: 0 },
      name: 'Nullstrich',
    },
    { t: 23.9, dur: 4.1, block: 'SceneCut', params: { scenes: [{ at: 0, kind: 'paper' }] }, name: 'Weiß danach' },
    { t: 24.1, dur: 3.9, block: 'CoreMotif', params: { kind: 'ring', palette: ['black'], size: [[0, 0.5], [3.9, 0.12, 'inOutQuad']], alpha: [[0, 0], [0.4, 1]] }, name: 'Eins' },
    text(24.4, 3.2, [['Null', 'ist nicht nichts'], ['Aus Null', 'wird Eins'], ['Hier', 'beginnt die Zählung']], { mode: 'words', wordTimes: [0, 0.6, 1.2, 1.8], color: 'black', y: 0.8 }),
    whiteOut(27.4, 28),
  ],
  audio: {
    bed: 'drone',
    key: 28,
    jingle: 2,
    wind: 0.4,
    music: NP_MUSIC,
    beats: NP_BEATS,
    sting: 'laser',
    silence: [[22, 22.6]],
    cues: [{ t: 2.6, sfx: 'glitch' }, { t: 20.4, sfx: 'riser', dur: 1.5 }, { t: 21.6, sfx: 'suck', dur: 0.4 }, { t: 22.6, sfx: 'impact' }, { t: 23, sfx: 'choir', dur: 4.4, note: 52 }],
  },
  reveal: { at: 27.4, style: 'whiteout' },
  signature: { name: 'Der Nullstrich öffnet das Licht', at: 22.6 },
  echo: { strength: 3, mode: 'mono' },
};

// ---------------------------------------------------------------------------
// Archetyp: primal forms gain corners on the beat until they are a circle; they lock into the
// one Urform with a crown of rays, which becomes a golden crystal.
// ---------------------------------------------------------------------------

const AR_MUSIC: MusicSpec = { t: 3, bpm: 108, beats: 46, key: 43, drop: 16, mood: 'mystic' };
const AR_STEP = 60 / AR_MUSIC.bpm;
/** Corner count per beat group (accelerating): 3, 4, 5, 6, 8, 12, 24, 64. */
const AR_CORNERS: [number, number][] = [
  [0, 3],
  [8, 4],
  [14, 5],
  [19, 6],
  [23, 8],
  [26, 12],
  [28, 24],
  [30, 64],
];

const archetyp: CutsceneDef = {
  id: 'archetyp',
  auraId: 'archetyp',
  tier: 3,
  duration: 30,
  theme: { primary: '#ffd700', secondary: '#7a5cff', fog: '#1a1430', dark: '#040309' },
  tracks: [
    veil(),
    text(0.6, 2.3, [['Vor allen Dingen', 'war die Form'], ['Alles hat', 'eine Gestalt'], ['Erst die Linie', 'dann die Welt']], { y: 0.5 }),
    {
      t: 3,
      dur: 18.2,
      block: 'SceneCut',
      params: { scenes: beatGrid(0, AR_MUSIC.bpm / 4, 8).map((t, i): Scene => ({ at: round(t), kind: 'grid', colors: [i % 2 ? 'secondary' : 'primary'], seed: 60 + i, zoom: [1.15, 1] })) },
      name: 'Raster',
    },
    { t: 21.2, dur: 8.8, block: 'SceneCut', params: { scenes: [{ at: 0, kind: 'nebula', colors: ['secondary', 'primary'], seed: 70 }] } },
    {
      t: 3,
      dur: 18.2,
      block: 'CoreMotif',
      params: {
        kind: 'polygons',
        palette: ['primary', 'secondary', 'white'],
        size: [[0, 0.4], [18, 0.65]],
        progress: AR_CORNERS.flatMap(([beat, n], i) => {
          const t = round(beat * AR_STEP);
          return i === 0 ? [[t, n] as const] : [[round(t - 0.12), AR_CORNERS[i - 1][1]] as const, [t, n, 'outQuad'] as const];
        }),
        aux: [[17.6, 0], [18.2, 1, 'inOutCubic']],
        rate: [[0, 0.2], [15, 1.2, 'inQuad']],
        alpha: [[0, 0], [0.5, 1]],
      },
      name: 'Formen',
    },
    { t: 3, dur: 15.6, block: 'Counter', params: { label: 'Ecken', from: 3, to: 64, ease: 'inExpo', format: 'int', y: 0.16, size: 7, color: 'primary', ticks: 'tock', maxTickRate: 6 }, fade: [0.4, 0.4], name: 'Zähler' },
    text(12, 6.2, [['Punkt', 'Linie', 'Fläche', 'Körper'], ['Drei', 'vier', 'sechs', 'unendlich'], ['Ecke', 'um', 'Ecke', 'zum Kreis']], { mode: 'words', wordTimes: [0, 1.11, 2.22, 3.33], y: 0.8, size: 5.5 }),
    { t: 21.2, dur: 1.8, block: 'Rays', params: { through: 'center', rate: [24, 24], color: 'primary', width: 0.9, life: 1.6, seed: 11 }, name: 'Strahlenkranz' },
    { t: 21.2, dur: 1.6, block: 'GravityRings', params: { direction: 'out', count: 3, stagger: 0.12, colors: ['primary', 'white', 'secondary'], width: 2.4 } },
    { t: 21.2, dur: 0.6, block: 'Flash', params: { color: 'primary', peak: 0.5, decay: 0.5 } },
    { t: 21.2, dur: 0.9, block: 'ScreenShake', params: { amp: 1.5, zoom: [[0, 1.12], [0.9, 1]] } },
    {
      t: 21.2,
      dur: 8.8,
      block: 'CoreMotif',
      params: { kind: 'crystal', palette: ['primary', 'secondary'], size: [[0, 0.2], [1, 0.42, 'outBack'], [8.8, 0.5]], glow: 0.4 },
      name: 'Urform',
    },
    { t: 21.2, dur: 8.8, block: 'ThemeParticles', params: { sprite: 'glint', count: 60, dir: 'orbit', radius: [26, 44], twist: 0.5, life: [4, 6], colors: ['primary', 'white'], size: [0.5, 1.1] } },
    text(22.5, 4, [['Aus allen Formen', 'eine'], ['Die Urform', 'erwacht'], ['Vollkommen', 'und einfach']], { mode: 'words', wordTimes: [0, 0.56, 1.11, 1.67], y: 0.82 }),
    { t: 27, dur: 3, block: 'EdgeGlow', params: { colors: ['primary', 'secondary'], split: 'lr', intensity: [[0, 0], [1.5, 0.85]] } },
    whiteOut(29.4, 30),
  ],
  audio: {
    bed: 'drone',
    key: 31,
    jingle: 5,
    wind: 0.25,
    music: AR_MUSIC,
    beats: beatGrid(AR_MUSIC.t, AR_MUSIC.bpm, AR_MUSIC.beats),
    sting: 'gong',
    silence: [[20.7, 21.2]],
    cues: [{ t: 18.6, sfx: 'riser', dur: 2.1 }, { t: 21.2, sfx: 'impact' }, { t: 21.4, sfx: 'shimmer', dur: 1.5 }],
  },
  reveal: { at: 29.4, style: 'whiteout' },
  signature: { name: 'Alle Formen rasten zur Urform ein', at: 21.2 },
  echo: { strength: 3, mode: 'tint', color: 'primary' },
};

// ---------------------------------------------------------------------------
// Äon: rings of time turn faster through the ages and the years add up; then time runs back
// through every age to the origin.
// ---------------------------------------------------------------------------

const AE_MUSIC: MusicSpec = { t: 3.5, bpm: 90, beats: 44, key: 41, drop: 12, mood: 'mystic' };
const AE_AGES: SceneKind[] = ['nebula', 'starfield', 'surface', 'sky', 'surface', 'sky'];
/** Dusky colours per age: skies stay dark enough for the rings and the counter. */
const AE_COLORS: string[][] = [
  ['#a0f0ff', '#6a4a1a'],
  ['#ffd76a', '#2f5a7a'],
  ['#a0f0ff', '#3a6a5a'],
  ['#2a4a6a', '#a07a3a'],
  ['#ffd76a', '#5a3a6a'],
  ['#3a2a5a', '#c08a4a'],
];
const AE_CUTS = beatGrid(3.5, 90 / 4, 6);
/** The rewind: the ages again, backwards and fast. */
const AE_BACK = beatGrid(21, 140, 6);

const aeon: CutsceneDef = {
  id: 'aeon',
  auraId: 'aeon',
  tier: 3,
  duration: 34,
  theme: { primary: '#a0f0ff', secondary: '#ffd76a', fog: '#0a2a3a', dark: '#020508' },
  tracks: [
    veil(),
    text(0.6, 2.7, [['Vor der Zeit', 'war Zeit'], ['Ein Augenblick', 'dauert ewig'], ['Was zählt', 'ein Augenblick']], { y: 0.5 }),
    {
      t: 3.5,
      dur: 17.5,
      block: 'SceneCut',
      params: { scenes: [...AE_CUTS.map((t, i): Scene => ({ at: round(t - 3.5), kind: AE_AGES[i], colors: AE_COLORS[i], seed: 80 + i, zoom: [1, 1.12] })), { at: 16, kind: 'starfield', colors: ['primary'], seed: 88 }] },
      name: 'Zeitalter',
    },
    {
      t: 21,
      dur: 3.1,
      block: 'SceneCut',
      params: { scenes: AE_BACK.map((t, i): Scene => ({ at: round(t - 21), kind: AE_AGES[AE_AGES.length - 1 - i], colors: AE_COLORS[AE_AGES.length - 1 - i], seed: 85 - i, zoom: [1.12, 1] })) },
      name: 'Rücklauf',
    },
    { t: 24.1, dur: 9.9, block: 'SceneCut', params: { scenes: [{ at: 0, kind: 'starfield', colors: ['secondary'], seed: 90 }] } },
    fog(3.5, 34, { colors: ['fog', 'dark'], density: [[0, 0], [2, 0.35]] }),
    {
      t: 3.5,
      dur: 30.5,
      block: 'ThemeParticles',
      params: { sprite: 'mote', count: 90, dir: 'float', colors: ['primary', 'secondary'], size: [0.3, 0.8], speed: [[0, 1], [14, 2.5], [17.5, 2.5], [18, -5], [20.6, -5], [20.8, 0.6]] },
      name: 'Zeitstaub',
    },
    {
      t: 3.5,
      dur: 20.6,
      block: 'CoreMotif',
      params: {
        kind: 'timeRings',
        palette: ['primary', 'secondary'],
        size: [[0, 0.4], [16, 0.7], [20, 0.7], [20.6, 0, 'inExpo']],
        progress: [[0, 0], [14, 1]],
        rate: [[0, 0.3], [16, 4, 'inQuad'], [17.5, -6, 'inOutCubic'], [20.6, -14]],
        alpha: [[0, 0], [0.5, 1]],
      },
      name: 'Zeitringe',
    },
    { t: 3.5, dur: 16.5, block: 'Ticker', params: { rate: [1.5, 12] }, name: 'Ticken' },
    { t: 5, dur: 15, block: 'Counter', params: { label: 'Jahre', from: 0, to: 13_800_000_000, ease: 'inExpo', format: 'de', y: 0.16, size: 6, color: 'primary', ticks: false }, fade: [0.4, 0.2], name: 'Zähler' },
    { t: 21, dur: 2.6, block: 'Counter', params: { label: 'Jahre', from: 13_800_000_000, to: 0, ease: 'inQuad', format: 'de', y: 0.16, size: 6, color: 'secondary', ticks: 'tick', maxTickRate: 14 }, fade: [0.1, 0.3], name: 'Zähler rückwärts' },
    text(12, 7, [['Sterne', 'entstehen', 'vergehen'], ['Jahr', 'um', 'Jahr', 'um Jahr'], ['Welten', 'kommen', 'und gehen']], { mode: 'words', wordTimes: [0, 1.33, 2.67, 4], y: 0.8 }),
    { t: 24.1, dur: 1.8, block: 'GravityRings', params: { direction: 'out', count: 4, stagger: 0.12, colors: ['primary', 'secondary', 'white'], width: 2.4 }, name: 'Ursprung' },
    { t: 24.1, dur: 0.6, block: 'Flash', params: { color: 'white', peak: 0.6, decay: 0.55 } },
    { t: 24.1, dur: 1, block: 'ScreenShake', params: { amp: 2, zoom: [[0, 1.08], [1, 1]] } },
    {
      t: 24.1,
      dur: 9.9,
      block: 'CoreMotif',
      params: symbolMotif('aeon', { size: [[0, 0.1], [9.9, 0.5]], spin: { from: 60, to: 140, over: 9.9 }, glow: 0.4 }),
      name: 'Zeitlos',
    },
    text(25.5, 4.5, [['Und alles', 'beginnt von vorn'], ['Die Zeit', 'hat dich vergessen'], ['Jetzt', 'ist immer']], { mode: 'words', wordTimes: [0, 0.67, 1.33, 2], y: 0.82 }),
    { t: 31, dur: 3, block: 'EdgeGlow', params: { colors: ['primary', 'secondary'], split: 'tb', intensity: [[0, 0], [1.5, 0.85]] } },
    whiteOut(33.4, 34),
  ],
  audio: {
    bed: 'drone',
    key: 34,
    jingle: 1,
    wind: 0.3,
    music: AE_MUSIC,
    beats: beatGrid(AE_MUSIC.t, AE_MUSIC.bpm, AE_MUSIC.beats),
    sting: 'gong',
    silence: [[23.6, 24.1]],
    cues: [...cuesAt(AE_BACK.map(round), 'suck', { dur: 0.25, gain: 0.5 }), { t: 20.4, sfx: 'freeze', dur: 0.4 }, { t: 24.1, sfx: 'impact' }, { t: 25, sfx: 'choir', dur: 5, note: 58 }],
  },
  reveal: { at: 33.4, style: 'whiteout' },
  signature: { name: 'Die Zeit läuft zurück bis zum Ursprung', at: 24.1 },
  echo: { strength: 3, mode: 'mono' },
};

// ---------------------------------------------------------------------------
// Weltenkern: a journey inwards (space, orbit, clouds, mantle, core) in cinema bars, the
// depth counts up, a heart beats with the music; the core opens like a flower of light.
// ---------------------------------------------------------------------------

const WK_MUSIC: MusicSpec = { t: 4, bpm: 80, beats: 42, key: 38, drop: 16, mood: 'bright' };
const WK_CUTS = beatGrid(4, 20, 6);
const WK_PATH: [SceneKind, string, string][] = [
  ['starfield', '#fff6cf', '#7a5cff'],
  ['surface', '#6fb7ff', '#3a5a8a'],
  ['surface', '#ff9a6a', '#7a3a2a'],
  ['nebula', '#ff7ad9', '#ffd76a'],
  ['core', '#c8501a', '#2a0500'],
  ['core', '#d07a3a', '#3a0a18'],
];

const weltenkern: CutsceneDef = {
  id: 'weltenkern',
  auraId: 'weltenkern',
  tier: 3,
  duration: 36,
  theme: { primary: '#fff6cf', secondary: '#ff7ad9', fog: '#3a1a2a', dark: '#060305' },
  tracks: [
    veil(),
    text(0.6, 3.2, [['Tief unter', 'allen Welten'], ['Hörst du', 'den Herzschlag'], ['Ganz innen', 'schlägt etwas']], { y: 0.5 }),
    {
      t: 4,
      dur: 18,
      block: 'SceneCut',
      params: { scenes: WK_CUTS.map((t, i): Scene => ({ at: round(t - 4), kind: WK_PATH[i][0], colors: [WK_PATH[i][1], WK_PATH[i][2]], seed: 100 + i, zoom: [1, 1.3] })) },
      name: 'Reise nach innen',
    },
    { t: 22, dur: 14, block: 'SceneCut', params: { scenes: [{ at: 0, kind: 'nebula', colors: ['secondary', 'primary'], seed: 110 }] } },
    { t: 4, dur: 18, block: 'ThemeParticles', params: { sprite: 'dot', count: 80, dir: 'warp', speed: [[0, 0.4], [18, 2]], colors: ['white', 'primary'], size: [0.2, 0.6] }, name: 'Flug' },
    { t: 3.6, dur: 20.8, block: 'Letterbox', params: { height: 0.12 }, name: 'Kinobalken' },
    { t: 7, dur: 15, block: 'Counter', params: { label: 'Tiefe', from: 0, to: 6371, ease: 'inQuad', format: 'km', y: 0.17, size: 6, color: 'primary', maxTickRate: 8 }, fade: [0.4, 0.4], name: 'Zähler' },
    {
      t: 4,
      dur: 27,
      block: 'CoreMotif',
      params: {
        kind: 'heart',
        palette: ['primary', 'secondary'],
        size: [[0, 0.04], [18, 0.4], [27, 0.45]],
        rate: WK_MUSIC.bpm / 60,
        aux: [[20, 0], [21.5, 1, 'outCubic']],
        alpha: [[5, 0], [7, 1]],
      },
      name: 'Herz',
    },
    { t: 16, dur: 7.4, block: 'Rays', params: { through: 'center', rate: [0.5, 6], color: 'primary', width: 0.6, life: 0.5 }, name: 'Strahlen' },
    text(12, 7.5, [['Tiefer', 'tiefer', 'noch tiefer'], ['Durch Stein', 'durch Feuer', 'ins Licht'], ['Jede Welt', 'hat', 'ein Herz']], { mode: 'words', wordTimes: [0, 1.5, 3, 4.5], y: 0.8 }),
    { t: 24, dur: 3, block: 'DoublePulse', params: { symbol: 'heart', count: 4, interval: 0.75, size: 40, color: 'spectrum', grow: 1.6 }, name: 'Vier Herzschläge' },
    { t: 24, dur: 2.2, block: 'Rays', params: { through: 'center', rate: [30, 10], color: 'spectrum', width: 1, life: 1.2, seed: 21 }, name: 'Lichtblüte' },
    { t: 24, dur: 2, block: 'GravityRings', params: { direction: 'out', count: 5, stagger: 0.08, colors: SPECTRUM, width: 2.6 } },
    { t: 24, dur: 0.6, block: 'Flash', params: { color: 'white', peak: 0.6, decay: 0.55 } },
    { t: 24, dur: 1.2, block: 'ScreenShake', params: { amp: 2.4, decay: 2 } },
    {
      t: 26.5,
      dur: 9.5,
      block: 'CoreMotif',
      params: symbolMotif('weltenkern', { size: [[0, 0.1], [9.5, 0.55]], spin: { from: 120, to: 220, over: 9.5 }, glow: 0.45 }),
      name: 'Kern',
    },
    text(27.5, 4, [['Hier', 'schlägt alles'], ['Du hast es', 'gefunden'], ['Ein Herz', 'für alle Welten']], { mode: 'words', wordTimes: [0, 0.75, 1.5, 2.25], y: 0.82 }),
    { t: 33, dur: 3, block: 'EdgeGlow', params: { colors: ['spectrum'], intensity: [[0, 0], [1.5, 0.9]] } },
    whiteOut(35.4, 36),
  ],
  audio: {
    bed: 'drone',
    key: 30,
    jingle: 3,
    wind: 0.3,
    music: WK_MUSIC,
    beats: beatGrid(WK_MUSIC.t, WK_MUSIC.bpm, WK_MUSIC.beats),
    sting: 'impact',
    silence: [[23.4, 24]],
    cues: [...cuesAt(WK_CUTS.map(round), 'whoosh', { dur: 0.5, gain: 0.5 }), ...cuesAt(beatGrid(4, 80, 26), 'heartbeat', { gain: 0.5 }), { t: 21.5, sfx: 'riser', dur: 1.9 }, { t: 24, sfx: 'choir', dur: 6, note: 62 }, { t: 24, sfx: 'bloom' }],
  },
  reveal: { at: 35.4, style: 'whiteout' },
  signature: { name: 'Der Kern öffnet sich wie eine Blüte', at: 24 },
  echo: { strength: 3, mode: 'swap' },
};

export const T3: CutsceneDef[] = [omniversum, schoepfung, nullpunkt, archetyp, aeon, weltenkern];


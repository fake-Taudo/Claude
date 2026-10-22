import type { AuraDef, CutsceneDef } from './types';

// The complete aura roster, ascending by rarity within the base pool.
// The first 18 entries of the prototype keep their names, colors, order and odds.
// `odds` is the nominal "1 in X": at Luck 1 every aura has exactly probability 1/odds,
// the fallback aura (Staub) receives the exact remainder (see core/odds.ts).
// Biome auras (biome: '...') are only rollable while that biome is active.

const SPECTRUM = ['#ff5a5a', '#ffcf4a', '#5aff8f', '#4ac9ff', '#c94aff'];

/** Classic prototype cutscene: circle with a four-pointed star. */
function classic(palette: string[], extra: CutsceneDef['layers'] = [], backdrop: CutsceneDef['backdrop'] = 'stars', climax: CutsceneDef['climax'] = 'none'): CutsceneDef {
  return {
    palette,
    backdrop,
    climax,
    layers: [
      { kind: 'glow', r: 46, color: 0, alpha: 0.35 },
      { kind: 'circle', r: 30, width: 3, color: 0, fill: true },
      ...extra,
      { kind: 'star', points: 4, r: 15, inner: 0.32, color: 0, fill: true },
    ],
  };
}

export const AURAS: AuraDef[] = [
  // --------------------------------------------------------------- Gewöhnlich
  {
    id: 'staub', name: 'Staub', tier: 'common', odds: 2.5, fallback: true, sell: 0.01,
    colors: { main: '#8a8a8a', glow: '#b5b5b5', accent: '#5a5a5a' },
    description: 'Feiner Planetenstaub, der sanft im Orbit treibt.',
    vfx: {
      rings: [{ radius: 1.5, width: 1.2, style: 'dotted', speed: 0.12, alpha: 0.35 }],
      emitters: [{ shape: 'dot', count: 26, behavior: 'drift', radius: [1.25, 2.1], size: [1.6, 3.2], speed: [4, 10], alpha: 0.7 }],
    },
  },
  {
    id: 'moos', name: 'Moos', tier: 'common', odds: 4, sell: 0.015,
    colors: { main: '#5b8c4a', glow: '#8fd46c', accent: '#3a5c30' },
    description: 'Grüne Sporenkugeln, die gemächlich kreisen.',
    vfx: {
      rings: [{ radius: 1.55, width: 1.6, style: 'solid', speed: 0.18, alpha: 0.4 }],
      emitters: [
        { shape: 'orb', count: 16, behavior: 'orbit', radius: [1.45, 1.85], size: [3, 5.5], speed: [0.22, 0.4] },
        { shape: 'dot', count: 10, behavior: 'drift', radius: [1.3, 2.2], size: [1.2, 2.2], speed: [3, 8], alpha: 0.6 },
      ],
    },
  },
  // ------------------------------------------------------------- Ungewöhnlich
  {
    id: 'flut', name: 'Flut', tier: 'uncommon', odds: 100 / 15, sell: 0.02,
    colors: { main: '#3a7bd5', glow: '#6fb1ff', accent: '#1e4d8f' },
    description: 'Wogende Tropfen wie eine Brandung im All.',
    vfx: {
      rings: [{ radius: 1.6, width: 2, style: 'wave', speed: 0.3, alpha: 0.5, segments: 6 }],
      emitters: [{ shape: 'drop', count: 26, behavior: 'wave', radius: [1.45, 1.85], size: [3, 5], speed: [0.35, 0.5], param: 0.12 }],
    },
  },
  {
    id: 'asche', name: 'Asche', tier: 'uncommon', odds: 100 / 9, sell: 0.025,
    colors: { main: '#d5533a', glow: '#ff8f6f', accent: '#8f2f1a' },
    description: 'Flackernde Funken aus einem längst erloschenen Vulkan.',
    vfx: {
      rings: [{ radius: 1.55, width: 1.4, style: 'dashed', speed: -0.2, alpha: 0.45 }],
      emitters: [
        { shape: 'ember', count: 24, behavior: 'rise', radius: [0.9, 1.6], size: [2, 3.5], speed: [18, 34], life: [1.4, 2.6], fadeTo: '#3a1a10' },
        { shape: 'spark', count: 12, behavior: 'flicker', radius: [1.5, 1.9], size: [2.5, 4], speed: [0.3, 0.5] },
      ],
    },
  },
  {
    id: 'sternschnuppe', name: 'Sternschnuppe', tier: 'uncommon', odds: 14, biome: 'meteorschauer', sell: 0.03,
    colors: { main: '#ffe6a8', glow: '#ffffff', accent: '#ffb35c' },
    description: 'Winzige Sternschnuppen kreuzen den Orbit.',
    vfx: {
      rings: [{ radius: 1.6, width: 1.2, style: 'solid', speed: 0.25, alpha: 0.35, tilt: 0.5 }],
      emitters: [
        { shape: 'streak', count: 9, behavior: 'fall', radius: [1.2, 2.6], size: [10, 18], speed: [140, 220], life: [0.6, 1.1], trail: true },
        { shape: 'dot', count: 14, behavior: 'flicker', radius: [1.4, 2.0], size: [1.5, 2.5], speed: [0.2, 0.4] },
      ],
    },
  },
  {
    id: 'nebelschleier', name: 'Nebelschleier', tier: 'uncommon', odds: 10, biome: 'nebelfeld', sell: 0.025,
    colors: { main: '#9aa8b8', glow: '#dfe8f2', accent: '#6a7888' },
    description: 'Ein feuchter Schleier, der den Planeten umhüllt.',
    vfx: {
      rings: [{ radius: 1.7, width: 1, style: 'dotted', speed: 0.1, alpha: 0.3 }],
      emitters: [{ shape: 'cloud', count: 9, behavior: 'drift', radius: [1.3, 2.0], size: [26, 42], speed: [3, 7], alpha: 0.22 }],
    },
  },
  // ------------------------------------------------------------------- Selten
  {
    id: 'frost', name: 'Frost', tier: 'rare', odds: 20, sell: 0.035,
    colors: { main: '#4adfe0', glow: '#9ff7f7', accent: '#1a8f90' },
    description: 'Pulsierende Eiskristalle in perfekter Symmetrie.',
    vfx: {
      rings: [{ radius: 1.6, width: 1.6, style: 'ticks', speed: 0.22, alpha: 0.5, segments: 18 }],
      emitters: [
        { shape: 'crystal', count: 16, behavior: 'pulse', radius: [1.5, 1.85], size: [4, 7], speed: [0.25, 0.35], spin: 0.6 },
        { shape: 'dot', count: 12, behavior: 'drift', radius: [1.3, 2.2], size: [1.2, 2], speed: [3, 6], alpha: 0.7 },
      ],
    },
  },
  {
    id: 'raureif', name: 'Raureif', tier: 'rare', odds: 25, biome: 'polarnacht', sell: 0.04,
    colors: { main: '#bfe6ff', glow: '#ffffff', accent: '#6aa8d8' },
    description: 'Gefrorener Atem der Polarnacht rieselt herab.',
    vfx: {
      rings: [{ radius: 1.65, width: 1.4, style: 'ticks', speed: -0.15, alpha: 0.45, segments: 24 }],
      emitters: [{ shape: 'crystal', count: 20, behavior: 'fall', radius: [1.1, 2.4], size: [3, 6], speed: [14, 26], life: [2.4, 4], spin: 0.8 }],
    },
  },
  {
    id: 'sonnenwind', name: 'Sonnenwind', tier: 'rare', odds: 30, biome: 'sonnensturm', sell: 0.045,
    colors: { main: '#ffd36b', glow: '#fff2c4', accent: '#ff8a1a' },
    description: 'Geladene Teilchen fegen in Böen am Planeten vorbei.',
    vfx: {
      rings: [{ radius: 1.6, width: 2, style: 'arc', speed: 0.9, alpha: 0.55 }],
      emitters: [{ shape: 'streak', count: 22, behavior: 'wind', radius: [1.1, 2.3], size: [12, 26], speed: [160, 260], life: [0.8, 1.4], alpha: 0.7 }],
    },
  },
  {
    id: 'sturm', name: 'Sturm', tier: 'rare', odds: 100 / 3, sell: 0.05,
    colors: { main: '#7a5cff', glow: '#b39dff', accent: '#4a2fbf' },
    description: 'Zuckende Blitzkeile eines endlosen Gewitters.',
    vfx: {
      rings: [{ radius: 1.6, width: 2, style: 'segments', speed: 0.8, alpha: 0.55, segments: 7 }],
      emitters: [{ shape: 'bolt', count: 14, behavior: 'jitter', radius: [1.45, 1.9], size: [6, 10], speed: [0.4, 0.7], param: 3 }],
      specials: [{ kind: 'arcs', count: 2, interval: 0.7, radius: 1.7 }],
    },
  },
  // ------------------------------------------------------------------- Episch
  {
    id: 'sonnenkern', name: 'Sonnenkern', tier: 'epic', odds: 100 / 1.8, sell: 0.07,
    colors: { main: '#ffb020', glow: '#ffe08a', accent: '#ff5e1a' },
    description: 'Ein pochender Sonnenkern mit lodernden Flares.',
    vfx: {
      core: { size: 1.9, pulse: 0.35, pulseHz: 1.4 },
      rings: [
        { radius: 1.5, width: 2, style: 'solid', speed: 0.35, alpha: 0.55 },
        { radius: 1.9, width: 1.4, style: 'dotted', speed: -0.25, alpha: 0.45 },
      ],
      emitters: [
        { shape: 'flare', count: 16, behavior: 'pulse', radius: [1.45, 1.85], size: [5, 9], speed: [0.3, 0.45] },
        { shape: 'ember', count: 14, behavior: 'outward', radius: [1.0, 1.2], size: [2, 3.5], speed: [30, 55], life: [0.8, 1.4] },
      ],
    },
  },
  {
    id: 'nebula', name: 'Nebula', tier: 'epic', odds: 100 / 0.9, sell: 0.1,
    colors: { main: '#e64ac9', glow: '#ffa6ec', accent: '#5c3fd9' },
    description: 'Driftende Nebelklumpen voller junger Sterne.',
    vfx: {
      core: { size: 1.7, pulse: 0.2, pulseHz: 0.6 },
      mood: { veil: '#e64ac9', veilAlpha: 0.08 },
      rings: [{ radius: 1.65, width: 1.4, style: 'solid', speed: 0.15, alpha: 0.35 }],
      emitters: [
        { shape: 'cloud', count: 10, behavior: 'drift', radius: [1.3, 2.1], size: [26, 46], speed: [4, 9], alpha: 0.24, colors: ['#e64ac9', '#5c3fd9', '#ffa6ec'] },
        { shape: 'star4', count: 20, behavior: 'flicker', radius: [1.4, 2.1], size: [2.5, 4.5], speed: [0.12, 0.25], colors: ['#ffffff', '#ffa6ec'] },
      ],
    },
  },
  {
    id: 'prisma', name: 'Prisma', tier: 'epic', odds: 120, biome: 'kristallregen', sell: 0.11,
    colors: { main: '#b6a6ff', glow: '#ffffff', accent: '#7af0ff', palette: SPECTRUM },
    description: 'Lichtbrechende Splitter zerlegen das Licht in Farben.',
    vfx: {
      rings: [{ radius: 1.65, width: 1.5, style: 'solid', speed: 0.3, alpha: 0.45, hueCycle: 40 }],
      emitters: [{ shape: 'diamond', count: 18, behavior: 'orbit', radius: [1.45, 1.9], size: [4, 7], speed: [0.3, 0.45], spectral: true, hueCycle: 60, spin: 1 }],
    },
  },
  {
    id: 'komet', name: 'Komet', tier: 'epic', odds: 200, sell: 0.15,
    colors: { main: '#7fd8ff', glow: '#e8fbff', accent: '#3a6bff' },
    description: 'Drei Kometen ziehen lange Schweife um den Planeten.',
    vfx: {
      rings: [{ radius: 1.9, width: 1, style: 'solid', speed: 0.1, alpha: 0.25, tilt: 0.55 }],
      emitters: [{ shape: 'dot', count: 14, behavior: 'flicker', radius: [1.4, 2.2], size: [1.4, 2.4], speed: [0.1, 0.2] }],
      specials: [{ kind: 'comets', count: 3, radius: 1.85, speed: 0.9, tilt: 0.55 }],
    },
  },
  {
    id: 'irrlicht', name: 'Irrlicht', tier: 'epic', odds: 250, biome: 'nebelfeld', sell: 0.17,
    colors: { main: '#7affc8', glow: '#d8fff0', accent: '#3aa88a' },
    description: 'Verspielte Lichter, die im Nebel umherirren.',
    vfx: {
      mood: { veil: '#7affc8', veilAlpha: 0.05 },
      rings: [{ radius: 1.7, width: 1, style: 'dotted', speed: 0.12, alpha: 0.3 }],
      emitters: [
        { shape: 'orb', count: 6, behavior: 'wander', radius: [1.3, 2.3], size: [6, 9], speed: [30, 50], trail: true },
        { shape: 'dot', count: 16, behavior: 'drift', radius: [1.3, 2.2], size: [1.2, 2.2], speed: [3, 7], alpha: 0.7 },
      ],
    },
  },
  // ----------------------------------------------------------------- Legendär
  {
    id: 'eklipse', name: 'Eklipse', tier: 'legendary', odds: 100 / 0.28, sell: 0.2, title: 'Schattenwandler',
    colors: { main: '#1a1a2e', glow: '#c9a7ff', accent: '#6f3fd9' },
    description: 'Korona-Sterne glimmen um eine verdunkelte Welt.',
    vfx: {
      core: { size: 1.6, pulse: 0.25, pulseHz: 0.8, color: '#c9a7ff' },
      mood: { dim: 0.45, vignette: '#1a1a2e' },
      rings: [
        { radius: 1.55, width: 2.2, style: 'solid', speed: 0.3, alpha: 0.65 },
        { radius: 2.0, width: 1.4, style: 'dotted', speed: -0.2, alpha: 0.5 },
      ],
      emitters: [{ shape: 'star4', count: 18, behavior: 'orbit', radius: [1.5, 2.0], size: [3, 6], speed: [0.25, 0.4], colors: ['#c9a7ff', '#ffffff', '#6f3fd9'] }],
      specials: [{ kind: 'corona', count: 18, radius: 1.12, alpha: 0.8 }],
    },
  },
  {
    id: 'saturnring', name: 'Saturnring', tier: 'legendary', odds: 600, sell: 0.3, title: 'Ringträger',
    colors: { main: '#c8a46a', glow: '#ffe3a8', accent: '#8a6a3a' },
    description: 'Ein schräger Ring aus Eisbrocken, der hinter dem Planeten verschwindet.',
    vfx: {
      rings: [
        { radius: 1.8, width: 7, style: 'solid', speed: 0.05, alpha: 0.22, tilt: 0.78 },
        { radius: 2.15, width: 3, style: 'solid', speed: 0.05, alpha: 0.18, tilt: 0.78 },
      ],
      emitters: [
        { shape: 'shard', count: 70, behavior: 'orbit', radius: [1.6, 2.35], size: [1.6, 3.6], speed: [0.18, 0.3], tilt: 0.78, spin: 1.2, colors: ['#ffe3a8', '#c8a46a', '#ffffff'] },
        { shape: 'dot', count: 10, behavior: 'flicker', radius: [1.3, 2.4], size: [1.2, 2], speed: [0.1, 0.2] },
      ],
    },
  },
  {
    id: 'finsternis', name: 'Finsternis', tier: 'legendary', odds: 800, biome: 'blutmond', sell: 0.35, title: 'Schattenmond',
    colors: { main: '#2a1a2a', glow: '#ff6a5a', accent: '#5a0a1a' },
    description: 'Ein Schatten schiebt sich langsam über den Planeten.',
    vfx: {
      mood: { dim: 0.45, veil: '#5a0a1a', veilAlpha: 0.12 },
      rings: [{ radius: 1.6, width: 2, style: 'solid', speed: 0.2, alpha: 0.5 }],
      emitters: [{ shape: 'dot', count: 22, behavior: 'orbit', radius: [1.45, 2.0], size: [2, 3.5], speed: [0.2, 0.35] }],
      specials: [{ kind: 'eclipseDisc', speed: 0.25, alpha: 0.85 }],
    },
  },
  {
    id: 'pulsar', name: 'Pulsar', tier: 'legendary', odds: 1000, sell: 0.4, title: 'Leuchtfeuer',
    colors: { main: '#3fd1ff', glow: '#c4f3ff', accent: '#2a5bff' },
    description: 'Zwei Lichtkegel kreisen wie ein kosmischer Leuchtturm.',
    vfx: {
      core: { size: 1.5, pulse: 0.5, pulseHz: 1.1 },
      rings: [{ radius: 1.55, width: 1.8, style: 'solid', speed: 0.6, alpha: 0.5 }],
      emitters: [{ shape: 'dot', count: 22, behavior: 'orbit', radius: [1.4, 1.8], size: [1.6, 3], speed: [0.9, 1.3] }],
      specials: [
        { kind: 'beams', count: 2, speed: 1.6, radius: 4.5, alpha: 0.35 },
        { kind: 'pulseRings', interval: 0.9, radius: 2.6, alpha: 0.5 },
      ],
    },
  },
  {
    id: 'meteorit', name: 'Meteorit', tier: 'legendary', odds: 1500, biome: 'meteorschauer', sell: 0.5, title: 'Einschlag',
    colors: { main: '#8a4a2a', glow: '#ffb35c', accent: '#ff5a1a' },
    description: 'Glühende Brocken umkreisen den Planeten und schlagen ein.',
    vfx: {
      rings: [{ radius: 1.7, width: 1.4, style: 'dashed', speed: 0.3, alpha: 0.4 }],
      emitters: [
        { shape: 'fragment', count: 12, behavior: 'tumble', radius: [1.5, 2.2], size: [4, 7], speed: [0.2, 0.4], spin: 1.5, colors: ['#8a4a2a', '#ffb35c'] },
        { shape: 'ember', count: 20, behavior: 'rise', radius: [0.9, 1.5], size: [1.6, 3], speed: [16, 30], life: [1, 2], fadeTo: '#3a1a10' },
      ],
      specials: [{ kind: 'meteors', count: 3, radius: 2.3, interval: 2.4 }],
    },
  },
  {
    id: 'gezeitenmond', name: 'Gezeitenmond', tier: 'legendary', odds: 1800, sell: 0.55, title: 'Gezeitenhüter',
    colors: { main: '#9fb4d9', glow: '#e6eeff', accent: '#4c5f8f' },
    description: 'Drei kleine Monde ziehen an den Gezeiten des Planeten.',
    vfx: {
      rings: [{ radius: 1.6, width: 2, style: 'solid', speed: 0.15, alpha: 0.45, pulse: 0.06 }],
      emitters: [{ shape: 'drop', count: 18, behavior: 'wave', radius: [1.4, 1.8], size: [2.5, 4], speed: [0.25, 0.35], param: 0.16 }],
      specials: [{ kind: 'moons', count: 3, radius: 2.2, speed: 0.5, size: 0.22, tilt: 0.45 }],
    },
  },
  {
    id: 'diamantherz', name: 'Diamantherz', tier: 'legendary', odds: 2500, biome: 'kristallregen', sell: 0.7, title: 'Unzerbrechlich',
    colors: { main: '#9ff7ff', glow: '#ffffff', accent: '#5ac8ff' },
    description: 'Eine facettierte Kristallhülle, die Licht in alle Richtungen bricht.',
    vfx: {
      core: { size: 1.5, pulse: 0.3, pulseHz: 1.6 },
      rings: [{ radius: 1.7, width: 1.2, style: 'ticks', speed: 0.2, alpha: 0.5, segments: 24 }],
      emitters: [{ shape: 'diamond', count: 30, behavior: 'flicker', radius: [1.45, 2.0], size: [3, 6], speed: [0.2, 0.35], spin: 1.4, colors: ['#ffffff', '#9ff7ff', '#5ac8ff'] }],
      specials: [{ kind: 'facets', count: 8, radius: 1.35, speed: 0.3, alpha: 0.6 }],
    },
  },
  // ----------------------------------------------------------------- Mythisch
  {
    id: 'sternbild', name: 'Sternbild', tier: 'mythic', odds: 3000, sell: 0.75, title: 'Sterndeuter',
    colors: { main: '#5a7dff', glow: '#cfe0ff', accent: '#ffffff' },
    description: 'Sterne verbinden sich zu Bildern, die kommen und gehen.',
    vfx: {
      mood: { veil: '#0a1a5a', veilAlpha: 0.22 },
      core: { size: 1.5, pulse: 0.2, pulseHz: 0.5 },
      rings: [{ radius: 2.1, width: 1, style: 'dotted', speed: 0.06, alpha: 0.4 }],
      emitters: [{ shape: 'star5', count: 22, behavior: 'flicker', radius: [1.4, 2.4], size: [2.5, 5], speed: [0.05, 0.12], colors: ['#ffffff', '#cfe0ff'] }],
      specials: [{ kind: 'constellation', count: 10, radius: 2.1, speed: 0.08 }],
    },
  },
  {
    id: 'polarlicht', name: 'Polarlicht', tier: 'mythic', odds: 4000, biome: 'polarnacht', sell: 0.9, title: 'Nordlicht',
    colors: { main: '#3dff9a', glow: '#b0ffd8', accent: '#b05cff' },
    description: 'Leuchtende Vorhänge tanzen über dem Planeten.',
    vfx: {
      mood: { veil: '#04281e', veilAlpha: 0.3 },
      rings: [{ radius: 1.65, width: 1.4, style: 'solid', speed: 0.12, alpha: 0.35, hueCycle: 12 }],
      emitters: [{ shape: 'dot', count: 26, behavior: 'rise', radius: [0.8, 1.6], size: [1.4, 2.6], speed: [12, 24], life: [1.5, 3], colors: ['#3dff9a', '#b05cff'] }],
      specials: [{ kind: 'aurora', count: 3, radius: 1.9, speed: 0.7, alpha: 0.55 }],
    },
  },
  {
    id: 'urlicht', name: 'Urlicht', tier: 'mythic', odds: 5000, sell: 1, title: 'Der Erleuchtete',
    colors: { main: '#ffffff', glow: '#fff6cf', accent: '#ffd6f7' },
    description: 'Strahlende Blüten aus dem allerersten Licht.',
    vfx: {
      core: { size: 2.2, pulse: 0.35, pulseHz: 0.9 },
      mood: { spectrumVeil: 0.1 },
      rings: [
        { radius: 1.55, width: 2.2, style: 'solid', speed: 0.3, alpha: 0.6 },
        { radius: 1.95, width: 1.2, style: 'double', speed: -0.2, alpha: 0.45 },
      ],
      emitters: [
        { shape: 'petal', count: 24, behavior: 'bloom', radius: [1.5, 1.7], size: [5, 9], speed: [14, 26], life: [1.6, 2.6], colors: ['#ffffff', '#fff6cf', '#ffd6f7'], spin: 0.8 },
        { shape: 'dot', count: 16, behavior: 'flicker', radius: [1.4, 2.2], size: [1.5, 2.5], speed: [0.15, 0.3] },
      ],
      specials: [{ kind: 'trailRings', interval: 1.2, radius: 2.8, alpha: 0.5 }],
    },
  },
  {
    id: 'sternenfeuer', name: 'Sternenfeuer', tier: 'mythic', odds: 6000, biome: 'supernova', sell: 1.15, title: 'Sternenglut',
    colors: { main: '#ff9a3d', glow: '#fff1c4', accent: '#ff3d7a' },
    description: 'Die Glut eines explodierten Sterns lodert nach außen.',
    vfx: {
      core: { size: 2, pulse: 0.4, pulseHz: 1.2 },
      rings: [{ radius: 1.6, width: 2, style: 'double', speed: 0.4, alpha: 0.55 }],
      emitters: [{ shape: 'flare', count: 28, behavior: 'outward', radius: [1.1, 1.3], size: [4, 8], speed: [40, 70], life: [0.9, 1.6], colors: ['#ff9a3d', '#fff1c4', '#ff3d7a'] }],
      specials: [{ kind: 'pulseRings', interval: 1.4, radius: 3, alpha: 0.45 }],
    },
  },
  {
    id: 'phoenix', name: 'Phönix', tier: 'mythic', odds: 7500, sell: 1.3, title: 'Wiedergeboren',
    colors: { main: '#ff6a1a', glow: '#ffd36b', accent: '#ff2a2a' },
    description: 'Flammenschwingen und Federn, die spiralförmig aufsteigen.',
    vfx: {
      core: { size: 1.8, pulse: 0.3, pulseHz: 1 },
      mood: { veil: '#ff6a1a', veilAlpha: 0.06 },
      rings: [{ radius: 1.6, width: 1.6, style: 'arc', speed: 0.7, alpha: 0.5 }],
      emitters: [
        { shape: 'feather', count: 26, behavior: 'swirlUp', radius: [1.3, 1.8], size: [6, 10], speed: [0.9, 1.4], life: [2.2, 3.4], colors: ['#ffd36b', '#ff6a1a', '#ff2a2a'], spin: 1 },
        { shape: 'ember', count: 24, behavior: 'rise', radius: [0.9, 1.6], size: [1.6, 3], speed: [24, 40], life: [1, 2], fadeTo: '#ff2a2a' },
      ],
      specials: [{ kind: 'wings', variant: 'flame', count: 2, radius: 2.4, speed: 1.2, alpha: 0.6 }],
    },
  },
  {
    id: 'koronaauswurf', name: 'Koronaauswurf', tier: 'mythic', odds: 9000, biome: 'sonnensturm', sell: 1.5, title: 'Sonnenzorn',
    colors: { main: '#ff7a1a', glow: '#ffe08a', accent: '#ff2a00' },
    description: 'Plasmabögen schießen aus der Oberfläche und reißen ab.',
    vfx: {
      core: { size: 2, pulse: 0.3, pulseHz: 0.9 },
      mood: { veil: '#ff7a1a', veilAlpha: 0.08 },
      rings: [{ radius: 1.55, width: 2, style: 'solid', speed: 0.3, alpha: 0.5 }],
      emitters: [{ shape: 'ember', count: 36, behavior: 'outward', radius: [1.0, 1.15], size: [2, 3.5], speed: [50, 90], life: [0.8, 1.4], fadeTo: '#ff2a00' }],
      specials: [{ kind: 'flares', count: 4, radius: 1.0, speed: 0.6, alpha: 0.8 }],
    },
  },
  // ----------------------------------------------------------------- Göttlich
  {
    id: 'singularitaet', name: 'Singularität', tier: 'divine', odds: 100 / 0.006, sell: 2, title: 'Der Unausweichliche',
    colors: { main: '#120a1f', glow: '#d9c7ff', accent: '#3a1a6b' },
    description: 'Alles wird nach innen gesogen. Nichts entkommt.',
    vfx: {
      core: { size: 1.4, pulse: 0.2, pulseHz: 0.6, color: '#d9c7ff' },
      mood: { dim: 0.82, vignette: '#120a1f' },
      rings: [
        { radius: 2.3, width: 2, style: 'solid', speed: 0.5, alpha: 0.6, collapse: 0.35 },
        { radius: 2.3, width: 1.2, style: 'dotted', speed: -0.4, alpha: 0.45, collapse: 0.35 },
      ],
      emitters: [{ shape: 'streak', count: 60, behavior: 'inward', radius: [1.15, 3.2], size: [6, 14], speed: [40, 70], colors: ['#d9c7ff', '#ffffff', '#3a1a6b'] }],
      specials: [{ kind: 'lensing', radius: 1.25, alpha: 0.7 }],
    },
    cutscene: classic(['#d9c7ff', '#3a1a6b', '#ffffff'], [{ kind: 'sparkles', count: 24, r: 70, color: 0, param: -1 }], 'void'),
  },
  {
    id: 'akkretion', name: 'Akkretion', tier: 'divine', odds: 20000, biome: 'schwarzesloch', sell: 2.4, title: 'Verschlinger',
    colors: { main: '#1a0a00', glow: '#ffb35c', accent: '#ff6a1a' },
    description: 'Eine glühende Scheibe aus Materie stürzt spiralförmig hinein.',
    vfx: {
      mood: { dim: 0.7 },
      rings: [{ radius: 1.3, width: 2.5, style: 'solid', speed: 0.8, alpha: 0.7, tilt: 0.82 }],
      emitters: [{ shape: 'dot', count: 120, behavior: 'orbit', radius: [1.35, 2.6], size: [1.4, 3], speed: [0.6, 1.3], tilt: 0.82, colors: ['#ffb35c', '#ff6a1a', '#fff1c4'], param: 1 }],
      specials: [{ kind: 'accretionGlow', radius: 2.4, tilt: 0.82, alpha: 0.5 }],
    },
    cutscene: {
      palette: ['#ffb35c', '#ff6a1a', '#1a0a00'],
      backdrop: 'void', climax: 'none',
      layers: [
        { kind: 'orbiters', count: 40, r: 38, color: 0, param: 0.8 },
        { kind: 'circle', r: 22, width: 3, color: 0, fill: true },
        { kind: 'star', points: 4, r: 12, inner: 0.3, color: 1, fill: true },
      ],
    },
  },
  {
    id: 'blutmond', name: 'Blutmond', tier: 'divine', odds: 25000, biome: 'blutmond', sell: 2.7, title: 'Blutmond',
    colors: { main: '#8a0a1a', glow: '#ff5a5a', accent: '#2a0008' },
    description: 'Ein riesiger roter Mond kreist, roter Regen fällt.',
    vfx: {
      mood: { dim: 0.6, veil: '#8a0a1a', veilAlpha: 0.22 },
      rings: [{ radius: 1.6, width: 2, style: 'solid', speed: 0.25, alpha: 0.55 }],
      emitters: [{ shape: 'drop', count: 30, behavior: 'fall', radius: [1.0, 2.6], size: [2.5, 4], speed: [70, 110], life: [1, 1.8], colors: ['#ff5a5a', '#8a0a1a'] }],
      specials: [{ kind: 'moons', count: 1, radius: 2.5, speed: 0.3, size: 0.5, tilt: 0.35, colors: ['#c4202a', '#ff5a5a'] }],
    },
    cutscene: {
      palette: ['#ff5a5a', '#8a0a1a', '#2a0008'],
      backdrop: 'blood', climax: 'none',
      layers: [
        { kind: 'glow', r: 48, color: 0, alpha: 0.3 },
        { kind: 'moon', r: 26, color: 0, color2: 2 },
        { kind: 'circle', r: 34, width: 2, color: 0 },
        { kind: 'star', points: 4, r: 12, inner: 0.3, color: 0, fill: true },
      ],
    },
  },
  {
    id: 'seraph', name: 'Seraph', tier: 'divine', odds: 30000, sell: 3, title: 'Himmelswächter',
    colors: { main: '#fff4d6', glow: '#ffe08a', accent: '#9fdcff' },
    description: 'Sechs Schwingen aus Licht schlagen langsam um einen Heiligenschein.',
    vfx: {
      core: { size: 2, pulse: 0.25, pulseHz: 0.7 },
      mood: { veil: '#ffe08a', veilAlpha: 0.08 },
      rings: [{ radius: 1.55, width: 1.6, style: 'solid', speed: 0.2, alpha: 0.5 }],
      emitters: [
        { shape: 'feather', count: 22, behavior: 'drift', radius: [1.4, 2.4], size: [5, 9], speed: [4, 9], colors: ['#ffffff', '#fff4d6', '#9fdcff'], spin: 0.5 },
        { shape: 'dot', count: 20, behavior: 'rise', radius: [0.8, 1.6], size: [1.4, 2.4], speed: [14, 26], life: [1.4, 2.6] },
      ],
      specials: [
        { kind: 'wings', variant: 'light', count: 6, radius: 2.6, speed: 0.9, alpha: 0.55 },
        { kind: 'halo', radius: 0.75, tilt: 0.7, alpha: 0.9 },
      ],
    },
    cutscene: {
      palette: ['#ffe08a', '#fff4d6', '#9fdcff'],
      backdrop: 'stars', climax: 'none',
      layers: [
        { kind: 'glow', r: 50, color: 0, alpha: 0.35 },
        { kind: 'wings', count: 6, r: 44, color: 1, color2: 2 },
        { kind: 'circle', r: 24, width: 2.5, color: 0 },
        { kind: 'star', points: 6, r: 14, inner: 0.45, color: 1, fill: true },
      ],
    },
  },
  {
    id: 'zeitriss', name: 'Zeitriss', tier: 'divine', odds: 45000, sell: 4, title: 'Zeitbrecher',
    colors: { main: '#00e5c0', glow: '#b8fff0', accent: '#ff3d9a' },
    description: 'Die Zeit reißt auf. Teilchen springen zwischen Augenblicken.',
    vfx: {
      core: { size: 1.5, pulse: 0.4, pulseHz: 2.2 },
      mood: { dim: 0.35, veil: '#00e5c0', veilAlpha: 0.06 },
      rings: [
        { radius: 1.6, width: 2, style: 'segments', speed: 0.5, alpha: 0.6, segments: 9, glitch: 4, color: '#00e5c0' },
        { radius: 1.95, width: 1.2, style: 'segments', speed: -0.4, alpha: 0.45, segments: 5, glitch: 6, color: '#ff3d9a' },
      ],
      emitters: [{ shape: 'square', count: 30, behavior: 'teleport', radius: [1.4, 2.3], size: [2.5, 4.5], speed: [0.4, 0.7], colors: ['#00e5c0', '#ff3d9a', '#b8fff0'], param: 0.9 }],
      specials: [{ kind: 'rift', count: 3, radius: 2.2, interval: 1.8, alpha: 0.9 }],
    },
    cutscene: {
      palette: ['#00e5c0', '#ff3d9a', '#b8fff0'],
      backdrop: 'static', climax: 'none',
      layers: [
        { kind: 'circle', r: 30, width: 3, color: 0, dash: [10, 6] },
        { kind: 'rift', r: 40, count: 3, color: 1 },
        { kind: 'pixels', r: 40, count: 18, color: 2 },
        { kind: 'star', points: 4, r: 14, inner: 0.3, color: 0, fill: true },
      ],
    },
  },
  // ------------------------------------------------------------- Transzendent
  {
    id: 'ewigkeit', name: 'Ewigkeit', tier: 'transcendent', odds: 100000, sell: 6, title: 'Ewig',
    colors: { main: '#ffd76a', glow: '#ffffff', accent: '#c9a7ff', palette: SPECTRUM },
    description: 'Durchläuft endlos das Farbspektrum, Ringe drehen gegeneinander.',
    vfx: {
      core: { size: 2.2, pulse: 0.3, pulseHz: 0.6, spectral: true },
      mood: { spectrumVeil: 0.16 },
      rings: [
        { radius: 1.6, width: 2.4, style: 'solid', speed: 0.45, alpha: 0.65, hueCycle: 45 },
        { radius: 2.05, width: 1.6, style: 'double', speed: -0.45, alpha: 0.55, hueCycle: 45 },
      ],
      emitters: [
        { shape: 'hex', count: 22, behavior: 'orbit', radius: [1.5, 1.75], size: [4, 6.5], speed: [0.4, 0.5], spectral: true, hueCycle: 45, spin: 0.7 },
        { shape: 'hex', count: 22, behavior: 'orbit', radius: [1.9, 2.2], size: [3, 5], speed: [-0.5, -0.4], spectral: true, hueCycle: 45, spin: -0.7 },
      ],
    },
    cutscene: classic(['#ffd76a', '#ffffff', '#c9a7ff'], [{ kind: 'circle', r: 30, width: 3, color: 'spectrum' }], 'stars', 'stall'),
  },
  {
    id: 'chronosphaere', name: 'Chronosphäre', tier: 'transcendent', odds: 150000, sell: 8, title: 'Herr der Zeit',
    colors: { main: '#d4af37', glow: '#fff1b8', accent: '#7a4a1a' },
    description: 'Ein Zifferblatt umschließt den Planeten. Alles tickt im Takt.',
    vfx: {
      core: { size: 1.8, pulse: 0.2, pulseHz: 1 },
      mood: { veil: '#7a4a1a', veilAlpha: 0.12 },
      rings: [{ radius: 2.1, width: 1.6, style: 'ticks', speed: 0, alpha: 0.7, segments: 60 }],
      emitters: [{ shape: 'dot', count: 36, behavior: 'tick', radius: [1.45, 1.85], size: [2, 3.4], speed: [0.5, 0.9], param: 1 }],
      specials: [{ kind: 'clock', radius: 2.1, speed: 1, alpha: 0.9 }],
    },
    cutscene: {
      palette: ['#fff1b8', '#d4af37', '#7a4a1a'],
      backdrop: 'stars', climax: 'stall',
      layers: [
        { kind: 'glow', r: 46, color: 0, alpha: 0.3 },
        { kind: 'clock', r: 32, color: 1, color2: 0 },
        { kind: 'star', points: 4, r: 8, inner: 0.35, color: 0, fill: true },
      ],
    },
  },
  {
    id: 'ereignishorizont', name: 'Ereignishorizont', tier: 'transcendent', odds: 200000, biome: 'schwarzesloch', sell: 9.5, title: 'Jenseits',
    colors: { main: '#000000', glow: '#e8d8ff', accent: '#7a5cff' },
    description: 'Licht krümmt sich zu einem gleißenden Ring um absolute Schwärze.',
    vfx: {
      mood: { dim: 0.92, vignette: '#000000' },
      rings: [{ radius: 1.18, width: 3, style: 'solid', speed: 1.2, alpha: 0.9 }],
      emitters: [{ shape: 'streak', count: 80, behavior: 'inward', radius: [1.2, 3.4], size: [8, 18], speed: [60, 110], colors: ['#e8d8ff', '#7a5cff', '#ffffff'] }],
      specials: [
        { kind: 'lensing', radius: 1.35, alpha: 0.95 },
        { kind: 'photonRing', radius: 1.2, alpha: 1 },
      ],
    },
    cutscene: {
      palette: ['#e8d8ff', '#7a5cff', '#000000'],
      backdrop: 'void', climax: 'converge',
      layers: [
        { kind: 'glow', r: 44, color: 1, alpha: 0.4 },
        { kind: 'circle', r: 28, width: 4, color: 0 },
        { kind: 'circle', r: 25, width: 0, color: 2, fill: true },
        { kind: 'sparkles', count: 30, r: 70, color: 0, param: -1 },
        { kind: 'star', points: 4, r: 10, inner: 0.3, color: 0, fill: true },
      ],
    },
  },
  // --------------------------------------------------------------- Galaktisch
  {
    id: 'quasar', name: 'Quasar', tier: 'galactic', odds: 250000, sell: 10, title: 'Strahlender Kern',
    colors: { main: '#0a1a3a', glow: '#8ecfff', accent: '#ff6a3a' },
    description: 'Rotierende Doppel-Jets statt kreisender Partikel, taumelnde Trümmer.',
    vfx: {
      core: { size: 1.8, pulse: 0.35, pulseHz: 1.3, color: '#8ecfff' },
      mood: { dim: 0.6, veil: '#0a1a3a', veilAlpha: 0.35 },
      rings: [
        { radius: 1.5, width: 3, style: 'solid', speed: 0.9, alpha: 0.6, tilt: 0.8, color: '#ff6a3a' },
        { radius: 1.9, width: 1.6, style: 'solid', speed: 0.6, alpha: 0.45, tilt: 0.8 },
      ],
      emitters: [
        { shape: 'streak', count: 90, behavior: 'jets', radius: [1.0, 4.2], size: [5, 10], speed: [160, 260], colors: ['#8ecfff', '#ffffff', '#ff6a3a'], param: 0.35 },
        { shape: 'fragment', count: 16, behavior: 'tumble', radius: [1.6, 2.4], size: [3, 6], speed: [0.15, 0.3], spin: 2, colors: ['#8ecfff', '#ff6a3a'] },
      ],
    },
    cutscene: classic(['#8ecfff', '#ff6a3a', '#ffffff'], [{ kind: 'jets', r: 70, color: 0, color2: 1 }], 'stars', 'converge'),
  },
  {
    id: 'supernova', name: 'Supernova', tier: 'galactic', odds: 400000, biome: 'supernova', sell: 14, title: 'Sternentod',
    colors: { main: '#ffffff', glow: '#ffb36b', accent: '#7a3dff' },
    description: 'Ein Stern stirbt in gleißenden Explosionswellen.',
    vfx: {
      core: { size: 2.6, pulse: 0.5, pulseHz: 0.5 },
      mood: { veil: '#ffb36b', veilAlpha: 0.08 },
      rings: [{ radius: 1.6, width: 2.5, style: 'double', speed: 0.5, alpha: 0.6 }],
      emitters: [{ shape: 'fragment', count: 60, behavior: 'outward', radius: [1.1, 1.3], size: [2.5, 5], speed: [70, 140], life: [1, 2], colors: ['#ffffff', '#ffb36b', '#7a3dff'], spin: 2 }],
      specials: [{ kind: 'shockPulse', interval: 2.6, radius: 5, alpha: 0.85 }],
    },
    cutscene: {
      palette: ['#ffffff', '#ffb36b', '#7a3dff'],
      backdrop: 'stars', climax: 'supernova',
      layers: [
        { kind: 'glow', r: 40, color: 1, alpha: 0.6 },
        { kind: 'rays', count: 12, r: 60, color: 0, alpha: 0.5 },
        { kind: 'shards', count: 10, r: 38, color: 1, color2: 2 },
        { kind: 'circle', r: 16, width: 0, color: 0, fill: true },
      ],
    },
  },
  {
    id: 'andromeda', name: 'Andromeda', tier: 'galactic', odds: 500000, sell: 16, title: 'Galaxienwanderer',
    colors: { main: '#6b5bff', glow: '#ffc6f2', accent: '#ffe6a8' },
    description: 'Zwei Spiralarme voller Sterne drehen sich um den Planeten.',
    vfx: {
      core: { size: 2.2, pulse: 0.2, pulseHz: 0.4, color: '#ffe6a8' },
      mood: { dim: 0.4, veil: '#2a1a6b', veilAlpha: 0.2 },
      rings: [],
      emitters: [
        { shape: 'dot', count: 170, behavior: 'galaxy', radius: [1.2, 3.2], size: [1.2, 3], speed: [0.25, 0.25], tilt: 0.5, colors: ['#ffc6f2', '#6b5bff', '#ffffff', '#ffe6a8'], param: 2, param2: 1.6 },
        { shape: 'star4', count: 14, behavior: 'flicker', radius: [1.4, 3], size: [3, 5], speed: [0.05, 0.1], colors: ['#ffffff'] },
      ],
    },
    cutscene: {
      palette: ['#ffc6f2', '#6b5bff', '#ffe6a8'],
      backdrop: 'stars', climax: 'converge',
      layers: [
        { kind: 'spiral', r: 52, count: 2, color: 0, color2: 1 },
        { kind: 'glow', r: 26, color: 2, alpha: 0.7 },
        { kind: 'star', points: 4, r: 12, inner: 0.3, color: 2, fill: true },
      ],
    },
  },
  {
    id: 'magnetar', name: 'Magnetar', tier: 'galactic', odds: 800000, sell: 22, title: 'Feldherr',
    colors: { main: '#00b3ff', glow: '#e0f7ff', accent: '#ff2bd6' },
    description: 'Magnetische Feldlinien bündeln Teilchen zu leuchtenden Bögen.',
    vfx: {
      core: { size: 1.7, pulse: 0.45, pulseHz: 1.8 },
      mood: { dim: 0.5, veil: '#001a3a', veilAlpha: 0.3 },
      rings: [{ radius: 1.4, width: 1.4, style: 'solid', speed: 0.3, alpha: 0.4 }],
      emitters: [{ shape: 'dot', count: 90, behavior: 'fieldline', radius: [1.1, 3.0], size: [1.4, 2.8], speed: [0.35, 0.6], colors: ['#e0f7ff', '#00b3ff', '#ff2bd6'], param: 6 }],
      specials: [
        { kind: 'fieldLines', count: 6, radius: 3.0, alpha: 0.35, speed: 0.15 },
        { kind: 'arcs', count: 2, interval: 0.5, radius: 1.5, colors: ['#ff2bd6'] },
      ],
    },
    cutscene: {
      palette: ['#00b3ff', '#ff2bd6', '#e0f7ff'],
      backdrop: 'void', climax: 'pulse',
      layers: [
        { kind: 'fieldLines', r: 48, count: 6, color: 0, color2: 1 },
        { kind: 'circle', r: 20, width: 3, color: 2, fill: true },
        { kind: 'star', points: 4, r: 11, inner: 0.3, color: 2, fill: true },
      ],
    },
  },
  // --------------------------------------------------------------- Universell
  {
    id: 'multiversum', name: 'Multiversum', tier: 'universal', odds: 1250000, sell: 28, title: 'Weltenspringer',
    colors: { main: '#7a5cff', glow: '#b39dff', accent: '#4a2fbf', palette: ['#7a5cff', '#4ac9ff', '#ff4ad0'] },
    description: 'Drei Ringe in Violett, Cyan und Magenta, flackernde Linsen zwischen den Welten.',
    vfx: {
      core: { size: 2, pulse: 0.3, pulseHz: 0.8 },
      mood: { dim: 0.3, veil: '#7a5cff', veilAlpha: 0.12 },
      rings: [
        { radius: 1.55, width: 2.2, style: 'solid', speed: 0.5, alpha: 0.65, tilt: 0.3, color: '#7a5cff' },
        { radius: 1.85, width: 2, style: 'solid', speed: -0.4, alpha: 0.6, tilt: 0.55, color: '#4ac9ff' },
        { radius: 2.15, width: 1.8, style: 'solid', speed: 0.35, alpha: 0.55, tilt: 0.15, color: '#ff4ad0' },
      ],
      emitters: [{ shape: 'lens', count: 36, behavior: 'flicker', radius: [1.4, 2.4], size: [5, 9], speed: [0.2, 0.4], colors: ['#7a5cff', '#4ac9ff', '#ff4ad0'], param: 1 }],
    },
    cutscene: classic(['#b39dff', '#4ac9ff', '#ff4ad0'], [
      { kind: 'circle', r: 30, width: 2, color: 1, offset: [4, 0] },
      { kind: 'circle', r: 30, width: 2, color: 2, offset: [-4, 0] },
    ], 'stars', 'pulse'),
  },
  {
    id: 'kosmischesnetz', name: 'Kosmisches Netz', tier: 'universal', odds: 2000000, sell: 38, title: 'Weber des Alls',
    colors: { main: '#4dffd2', glow: '#c2fff0', accent: '#7a5cff' },
    description: 'Ein Netz aus Filamenten, durch das Lichtimpulse wandern.',
    vfx: {
      core: { size: 1.8, pulse: 0.25, pulseHz: 0.7 },
      mood: { dim: 0.5, veil: '#00281e', veilAlpha: 0.25 },
      rings: [{ radius: 2.4, width: 1, style: 'dotted', speed: 0.05, alpha: 0.35 }],
      emitters: [{ shape: 'dot', count: 20, behavior: 'drift', radius: [1.4, 2.6], size: [1.2, 2.2], speed: [3, 6], alpha: 0.6 }],
      specials: [{ kind: 'web', count: 18, radius: 2.4, speed: 0.15, alpha: 0.6 }],
    },
    cutscene: {
      palette: ['#4dffd2', '#7a5cff', '#c2fff0'],
      backdrop: 'void', climax: 'converge',
      layers: [
        { kind: 'web', r: 46, count: 12, color: 0, color2: 1 },
        { kind: 'circle', r: 20, width: 2.5, color: 0 },
        { kind: 'star', points: 4, r: 11, inner: 0.3, color: 2, fill: true },
      ],
    },
  },
  // ------------------------------------------------------------- Uranfänglich
  {
    id: 'urknall', name: 'Urknall', tier: 'primordial', odds: 100 / 0.00003, sell: 50, title: 'Der Anfang',
    colors: { main: '#3a0a00', glow: '#ffd23f', accent: '#ff4500' },
    description: 'Fragmente werden ruckartig nach außen geschleudert.',
    vfx: {
      core: { size: 2.6, pulse: 0.5, pulseHz: 0.8, color: '#ffd23f' },
      mood: { dim: 0.45, veil: '#3a0a00', veilAlpha: 0.3 },
      rings: [
        { radius: 1.5, width: 2.4, style: 'solid', speed: 0.6, alpha: 0.6, color: '#ff4500' },
        { radius: 1.9, width: 1.4, style: 'dashed', speed: -0.5, alpha: 0.5 },
      ],
      emitters: [{ shape: 'fragment', count: 56, behavior: 'burst', radius: [1.0, 3.4], size: [3, 6], speed: [260, 380], colors: ['#ffd23f', '#ff4500', '#ffffff'], spin: 3, param: 1.25 }],
      specials: [{ kind: 'shockPulse', interval: 1.25, radius: 3.2, alpha: 0.5 }],
    },
    cutscene: {
      palette: ['#ffd23f', '#ff4500', '#ffffff'],
      backdrop: 'embers', climax: 'shatter',
      layers: [
        { kind: 'glow', r: 34, color: 0, alpha: 0.75 },
        { kind: 'circle', r: 20, width: 0, color: 2, fill: true },
        { kind: 'shards', count: 7, r: 40, color: 0, color2: 1 },
      ],
    },
  },
  {
    id: 'ursuppe', name: 'Ursuppe', tier: 'primordial', odds: 5000000, sell: 65, title: 'Lebensfunke',
    colors: { main: '#2fd36b', glow: '#d6ff8a', accent: '#ff9a3d' },
    description: 'Blubbernde Urzellen verschmelzen und teilen sich.',
    vfx: {
      core: { size: 1.8, pulse: 0.3, pulseHz: 0.6 },
      mood: { dim: 0.35, veil: '#0a2a10', veilAlpha: 0.3 },
      rings: [{ radius: 1.6, width: 1.8, style: 'wave', speed: 0.3, alpha: 0.5, segments: 9 }],
      emitters: [{ shape: 'bubble', count: 34, behavior: 'rise', radius: [0.8, 1.8], size: [3, 8], speed: [14, 26], life: [2, 3.4], colors: ['#d6ff8a', '#2fd36b'] }],
      specials: [{ kind: 'cells', count: 7, radius: 2.0, speed: 0.35, size: 0.32, alpha: 0.55 }],
    },
    cutscene: {
      palette: ['#d6ff8a', '#2fd36b', '#ff9a3d'],
      backdrop: 'stars', climax: 'pulse',
      layers: [
        { kind: 'cells', r: 40, count: 6, color: 0, color2: 1 },
        { kind: 'circle', r: 28, width: 2.5, color: 1 },
        { kind: 'star', points: 4, r: 12, inner: 0.3, color: 2, fill: true },
      ],
    },
  },
  // --------------------------------------------------------------- Entropisch
  {
    id: 'entropie', name: 'Entropie', tier: 'entropic', odds: 10000000, sell: 100, title: 'Der Zerfall',
    colors: { main: '#1a1a22', glow: '#5a6478', accent: '#0d0d12' },
    description: 'Träge zerfallende, verblassende Partikel in einer entsättigten Welt.',
    vfx: {
      core: { size: 1.4, pulse: 0.15, pulseHz: 0.3, color: '#5a6478' },
      mood: { desaturate: 0.9, dim: 0.5 },
      rings: [
        { radius: 1.55, width: 2, style: 'cracked', speed: 0.12, alpha: 0.55, color: '#8a92a5' },
        { radius: 2.0, width: 1.2, style: 'cracked', speed: -0.08, alpha: 0.4, color: '#5a6478' },
      ],
      emitters: [{ shape: 'fragment', count: 60, behavior: 'decay', radius: [1.3, 2.6], size: [2.5, 5.5], speed: [3, 9], life: [3, 5.5], colors: ['#8a92a5', '#5a6478', '#c0c6d4'], fadeTo: '#1a1a22', additive: false, spin: 0.4 }],
    },
    cutscene: {
      palette: ['#8a92a5', '#5a6478', '#c0c6d4'],
      backdrop: 'static', climax: 'shatter',
      layers: [
        { kind: 'circle', r: 30, width: 2, color: 0, dash: [8, 5] },
        { kind: 'cracks', count: 5, r: 34, color: 2 },
        { kind: 'star', points: 4, r: 12, inner: 0.3, color: 1, fill: true, alpha: 0.75 },
      ],
    },
  },
  {
    id: 'waermetod', name: 'Wärmetod', tier: 'entropic', odds: 15000000, sell: 125, title: 'Das letzte Licht',
    colors: { main: '#2b2f3a', glow: '#ff8a5c', accent: '#6a7480' },
    description: 'Die letzte Glut kühlt aus, alles wird langsamer.',
    vfx: {
      core: { size: 1.6, pulse: 0.25, pulseHz: 0.25, color: '#ff8a5c' },
      mood: { desaturate: 0.6, dim: 0.45, veil: '#1a2a3a', veilAlpha: 0.25 },
      rings: [{ radius: 1.7, width: 1.6, style: 'solid', speed: 0.2, alpha: 0.45, color: '#6a7480' }],
      emitters: [{ shape: 'ember', count: 50, behavior: 'decay', radius: [1.2, 2.5], size: [2.5, 5], speed: [4, 12], life: [3, 5], colors: ['#ff8a5c', '#ffb36b'], fadeTo: '#4a5060' }],
      specials: [{ kind: 'timeDilation', interval: 12 }],
    },
    cutscene: {
      palette: ['#ff8a5c', '#6a7480', '#c0d4e8'],
      backdrop: 'snow', climax: 'stall',
      layers: [
        { kind: 'glow', r: 40, color: 0, alpha: 0.4 },
        { kind: 'circle', r: 30, width: 2.5, color: 1 },
        { kind: 'sparkles', count: 20, r: 50, color: 0, param: 1 },
        { kind: 'star', points: 4, r: 13, inner: 0.3, color: 0, fill: true },
      ],
    },
  },
  // ------------------------------------------------------------------ Paradox
  {
    id: 'paradoxon', name: 'Paradoxon', tier: 'paradox', odds: 25000000, sell: 170, title: 'Widerspruch',
    colors: { main: '#ff5a3c', glow: '#4ac9ff', accent: '#2a1a4a', palette: ['#ff5a3c', '#4ac9ff'] },
    description: 'Zwei Ringe in gegensätzlichen Farben, die Bewegung kehrt sich um.',
    vfx: {
      core: { size: 2, pulse: 0.3, pulseHz: 0.8 },
      mood: { dim: 0.35, veil: '#2a1a4a', veilAlpha: 0.3 },
      rings: [
        { radius: 1.6, width: 2.4, style: 'solid', speed: 0.6, alpha: 0.7, color: '#ff5a3c', reverseEvery: 2.5 },
        { radius: 2.0, width: 2.4, style: 'solid', speed: -0.6, alpha: 0.7, color: '#4ac9ff', reverseEvery: 2.5 },
      ],
      emitters: [
        { shape: 'orb', count: 24, behavior: 'reverse', radius: [1.45, 1.75], size: [3, 5], speed: [0.6, 0.8], colors: ['#ff5a3c'], param: 2.5 },
        { shape: 'orb', count: 24, behavior: 'reverse', radius: [1.85, 2.2], size: [3, 5], speed: [-0.8, -0.6], colors: ['#4ac9ff'], param: 2.5 },
      ],
    },
    cutscene: {
      palette: ['#ff5a3c', '#4ac9ff', '#ffffff'],
      backdrop: 'stars', climax: 'rewind',
      layers: [
        { kind: 'circle', r: 24, width: 3, color: 0, fill: true, offset: [-16, 0] },
        { kind: 'star', points: 4, r: 12, inner: 0.3, color: 0, fill: true, offset: [-16, 0] },
        { kind: 'circle', r: 24, width: 3, color: 1, fill: true, offset: [16, 0] },
        { kind: 'star', points: 4, r: 12, inner: 0.3, color: 1, fill: true, offset: [16, 0] },
      ],
    },
  },
  {
    id: 'moebius', name: 'Möbius', tier: 'paradox', odds: 40000000, sell: 225, title: 'Ohne Ende, ohne Seite',
    colors: { main: '#ff3dbb', glow: '#7af0ff', accent: '#ffffff', palette: ['#ff3dbb', '#7af0ff'] },
    description: 'Ein Band mit nur einer Seite. Wer darauf wandert, kommt verkehrt zurück.',
    vfx: {
      core: { size: 1.8, pulse: 0.25, pulseHz: 0.6 },
      mood: { dim: 0.35, veil: '#3a0a3a', veilAlpha: 0.2 },
      rings: [],
      emitters: [{ shape: 'dot', count: 60, behavior: 'mobius', radius: [2.0, 2.0], size: [2, 3.6], speed: [0.35, 0.5], colors: ['#ff3dbb', '#7af0ff'], tilt: 0.5 }],
      specials: [{ kind: 'mobius', radius: 2.0, speed: 0.25, size: 0.35, tilt: 0.5, alpha: 0.55 }],
    },
    cutscene: {
      palette: ['#ff3dbb', '#7af0ff', '#ffffff'],
      backdrop: 'stars', climax: 'rewind',
      layers: [
        { kind: 'mobius', r: 40, color: 0, color2: 1 },
        { kind: 'star', points: 4, r: 12, inner: 0.3, color: 2, fill: true },
      ],
    },
  },
  // --------------------------------------------------------------- Omniversal
  {
    id: 'omniversum', name: 'Omniversum', tier: 'omniversal', odds: 100000000, sell: 400, title: 'Allumfassend',
    colors: { main: '#ffffff', glow: '#ffffff', accent: '#ffd6f7', palette: SPECTRUM },
    description: 'Jedes Teilchen trägt seine eigene Spektralfarbe. Der größte Kern von allen.',
    vfx: {
      core: { size: 2.8, pulse: 0.35, pulseHz: 0.7, spectral: true },
      mood: { spectrumVeil: 0.22, dim: 0.3 },
      rings: [
        { radius: 1.55, width: 2.4, style: 'solid', speed: 0.5, alpha: 0.7, hueCycle: 60 },
        { radius: 1.9, width: 2, style: 'double', speed: -0.4, alpha: 0.6, hueCycle: 60, tilt: 0.4 },
        { radius: 2.3, width: 1.6, style: 'dotted', speed: 0.3, alpha: 0.55, hueCycle: 60, tilt: 0.2 },
      ],
      emitters: [
        { shape: 'orb', count: 70, behavior: 'orbit', radius: [1.45, 2.4], size: [2.5, 5], speed: [0.3, 0.6], spectral: true, hueCycle: 30 },
        { shape: 'star4', count: 26, behavior: 'outward', radius: [1.2, 1.4], size: [3, 6], speed: [40, 80], life: [1.2, 2.2], spectral: true },
      ],
    },
    cutscene: {
      palette: SPECTRUM,
      backdrop: 'spectrum', climax: 'pulse',
      layers: [
        { kind: 'glow', r: 48, color: 'spectrum', alpha: 0.35 },
        { kind: 'prismRings', count: 3, r: 35 },
        { kind: 'star', points: 4, r: 13, inner: 0.3, color: 'spectrum', fill: true },
      ],
    },
  },
  {
    id: 'schoepfung', name: 'Schöpfung', tier: 'omniversal', odds: 200000000, sell: 600, title: 'Schöpfer',
    colors: { main: '#ffffff', glow: '#ffe9a8', accent: '#ff9ad5', palette: SPECTRUM },
    description: 'Überall entzünden sich neue Sterne. Lichtstrahlen fächern sich auf.',
    vfx: {
      core: { size: 2.6, pulse: 0.3, pulseHz: 0.5 },
      mood: { veil: '#ffe9a8', veilAlpha: 0.1, spectrumVeil: 0.1 },
      rings: [
        { radius: 1.6, width: 2, style: 'solid', speed: 0.3, alpha: 0.55, color: '#ffe9a8' },
        { radius: 2.1, width: 1.4, style: 'dotted', speed: -0.2, alpha: 0.5, hueCycle: 30 },
      ],
      emitters: [{ shape: 'star4', count: 40, behavior: 'bloom', radius: [1.5, 2.2], size: [3, 7], speed: [10, 22], life: [1.6, 2.8], spectral: true, spin: 0.6 }],
      specials: [
        { kind: 'rays', count: 10, radius: 5, speed: 0.12, alpha: 0.18 },
        { kind: 'ignite', count: 4, radius: 3.2, interval: 0.7, alpha: 0.9 },
      ],
    },
    cutscene: {
      palette: ['#ffe9a8', '#ffffff', ...SPECTRUM],
      backdrop: 'spectrum', climax: 'supernova',
      layers: [
        { kind: 'rays', count: 16, r: 70, color: 0, alpha: 0.45 },
        { kind: 'prismRings', count: 2, r: 30 },
        { kind: 'star', points: 8, r: 18, inner: 0.4, color: 1, fill: true },
      ],
    },
  },
  // ------------------------------------------------------------------ Absolut
  {
    id: 'nullpunkt', name: 'Nullpunkt', tier: 'absolute', odds: 400000000, sell: 900, title: 'Null',
    colors: { main: '#000000', glow: '#ffffff', accent: '#888888' },
    description: 'Schwarz und Weiß in perfekter Geometrie. Manchmal kehrt sich alles um.',
    vfx: {
      core: { size: 1.6, pulse: 0.1, pulseHz: 0.5, color: '#ffffff' },
      mood: { dim: 0.95, desaturate: 1 },
      rings: [
        { radius: 1.5, width: 1, style: 'solid', speed: 0.25, alpha: 0.9, color: '#ffffff' },
        { radius: 1.9, width: 1, style: 'solid', speed: -0.25, alpha: 0.8, color: '#ffffff' },
        { radius: 2.3, width: 1, style: 'solid', speed: 0.25, alpha: 0.7, color: '#ffffff' },
      ],
      emitters: [{ shape: 'dot', count: 96, behavior: 'grid', radius: [1.5, 2.3], size: [1.6, 2.6], speed: [0.25, 0.25], colors: ['#ffffff'], param: 3 }],
      specials: [{ kind: 'inversion', interval: 6 }],
    },
    cutscene: {
      palette: ['#ffffff', '#888888', '#000000'],
      backdrop: 'void', climax: 'invert',
      layers: [
        { kind: 'circle', r: 34, width: 1.5, color: 0 },
        { kind: 'polygon', points: 4, r: 30, width: 1.5, color: 0, spin: 0.5 },
        { kind: 'circle', r: 22, width: 1.5, color: 0 },
        { kind: 'star', points: 4, r: 14, inner: 0.25, color: 0, fill: true },
      ],
    },
  },
  {
    id: 'archetyp', name: 'Archetyp', tier: 'absolute', odds: 750000000, sell: 1300, title: 'Urform',
    colors: { main: '#ffd700', glow: '#ffffff', accent: '#7a5cff' },
    description: 'Verschachtelte Urformen zeichnen sich selbst in den Raum.',
    vfx: {
      core: { size: 2, pulse: 0.2, pulseHz: 0.5, color: '#ffd700' },
      mood: { dim: 0.55, veil: '#1a1030', veilAlpha: 0.35 },
      rings: [{ radius: 2.5, width: 1, style: 'ticks', speed: 0.05, alpha: 0.5, segments: 36 }],
      emitters: [{ shape: 'dot', count: 30, behavior: 'flicker', radius: [1.5, 2.5], size: [1.4, 2.4], speed: [0.05, 0.1], colors: ['#ffd700', '#ffffff'] }],
      specials: [{ kind: 'geometry', count: 4, radius: 2.3, speed: 0.2, alpha: 0.8 }],
    },
    cutscene: {
      palette: ['#ffd700', '#ffffff', '#7a5cff'],
      backdrop: 'void', climax: 'converge',
      layers: [
        { kind: 'polygon', points: 3, r: 38, width: 2, color: 0, spin: 0.4 },
        { kind: 'polygon', points: 4, r: 30, width: 2, color: 2, spin: -0.5 },
        { kind: 'polygon', points: 6, r: 22, width: 2, color: 0, spin: 0.7 },
        { kind: 'circle', r: 14, width: 2, color: 1 },
        { kind: 'star', points: 4, r: 9, inner: 0.3, color: 1, fill: true },
      ],
    },
  },
  // ---------------------------------------------------------------- Unendlich
  {
    id: 'aeon', name: 'Äon', tier: 'infinite', odds: 1500000000, sell: 2000, title: 'Zeitlos',
    colors: { main: '#a0f0ff', glow: '#ffffff', accent: '#ffd76a' },
    description: 'Licht fließt endlos entlang einer Unendlichkeitsschleife.',
    vfx: {
      core: { size: 2.4, pulse: 0.3, pulseHz: 0.4 },
      mood: { dim: 0.55, veil: '#002a3a', veilAlpha: 0.3 },
      rings: [
        { radius: 1.55, width: 1.6, style: 'solid', speed: 0.2, alpha: 0.6 },
        { radius: 2.6, width: 1, style: 'ticks', speed: -0.05, alpha: 0.45, segments: 48, color: '#ffd76a' },
      ],
      emitters: [{ shape: 'orb', count: 120, behavior: 'lemniscate', radius: [2.6, 2.6], size: [2, 4], speed: [0.25, 0.32], colors: ['#a0f0ff', '#ffffff', '#ffd76a'], trail: true }],
      specials: [{ kind: 'lemniscate', radius: 2.6, alpha: 0.4 }],
    },
    cutscene: {
      palette: ['#a0f0ff', '#ffd76a', '#ffffff'],
      backdrop: 'stars', climax: 'rewind',
      layers: [
        { kind: 'glow', r: 44, color: 0, alpha: 0.35 },
        { kind: 'lemniscate', r: 44, color: 0, color2: 1 },
        { kind: 'circle', r: 16, width: 2, color: 1 },
        { kind: 'star', points: 4, r: 10, inner: 0.3, color: 2, fill: true },
      ],
    },
  },
  {
    id: 'weltenkern', name: 'Weltenkern', tier: 'infinite', odds: 3000000000, sell: 3000, title: 'Herz aller Welten',
    colors: { main: '#ffffff', glow: '#fff6cf', accent: '#ff7ad9', palette: SPECTRUM },
    description: 'Der Planet entzündet sich zu einem Stern. Das Herz aller Welten schlägt.',
    vfx: {
      core: { size: 3.2, pulse: 0.45, pulseHz: 0.6, spectral: true },
      mood: { spectrumVeil: 0.25, dim: 0.5 },
      rings: [
        { radius: 1.6, width: 2.6, style: 'solid', speed: 0.5, alpha: 0.75, hueCycle: 80 },
        { radius: 2.05, width: 2, style: 'double', speed: -0.4, alpha: 0.6, hueCycle: 80, tilt: 0.5 },
        { radius: 2.5, width: 1.6, style: 'dotted', speed: 0.3, alpha: 0.55, hueCycle: 80, tilt: 0.25 },
      ],
      emitters: [
        { shape: 'orb', count: 90, behavior: 'orbit', radius: [1.5, 2.6], size: [2.5, 5], speed: [0.35, 0.7], spectral: true, hueCycle: 60, tilt: 0.35 },
        { shape: 'flare', count: 30, behavior: 'outward', radius: [1.1, 1.3], size: [4, 8], speed: [50, 100], life: [1, 2], spectral: true },
        { shape: 'streak', count: 30, behavior: 'inward', radius: [1.3, 3.4], size: [6, 12], speed: [50, 90], spectral: true },
      ],
      specials: [
        { kind: 'starCore', alpha: 1 },
        { kind: 'rays', count: 12, radius: 6, speed: 0.15, alpha: 0.2 },
        { kind: 'pulseRings', interval: 1.6, radius: 4, alpha: 0.5 },
      ],
    },
    cutscene: {
      palette: ['#ffffff', '#fff6cf', ...SPECTRUM],
      backdrop: 'spectrum', climax: 'supernova',
      layers: [
        { kind: 'rays', count: 18, r: 80, color: 1, alpha: 0.5 },
        { kind: 'glow', r: 46, color: 'spectrum', alpha: 0.5 },
        { kind: 'prismRings', count: 3, r: 38 },
        { kind: 'orbiters', count: 8, r: 50, color: 'spectrum', param: 1.5 },
        { kind: 'star', points: 8, r: 18, inner: 0.4, color: 0, fill: true },
      ],
    },
  },
];

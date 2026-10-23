import type { AuraDef, CutsceneDef } from './types';

// The complete aura roster, ascending by rarity within the base pool.
// The first 18 entries of the prototype keep their names, colors, order and odds.
// `odds` is the nominal "1 in X": at Luck 1 every aura has exactly probability 1/odds,
// the fallback aura (Staub) receives the exact remainder (see core/odds.ts).
// Biome auras (biome: '...') are only rollable while that biome is active.

const SPECTRUM = ['#ff5a5a', '#ffcf4a', '#5aff8f', '#4ac9ff', '#c94aff'];

/** Classic prototype cutscene: soft glow with a four-pointed star. */
function classic(palette: string[], extra: CutsceneDef['layers'] = [], backdrop: CutsceneDef['backdrop'] = 'stars', climax: CutsceneDef['climax'] = 'none'): CutsceneDef {
  return {
    palette,
    backdrop,
    climax,
    layers: [
      { kind: 'glow', r: 46, color: 0, alpha: 0.35 },
      { kind: 'glow', r: 24, color: 0, alpha: 0.5 },
      ...extra,
      { kind: 'star', points: 4, r: 21, inner: 0.32, color: 0, fill: true },
    ],
  };
}

export const AURAS: AuraDef[] = [
  // --------------------------------------------------------------- Gewöhnlich
  {
    id: 'staub', name: 'Staub', tier: 'common', odds: 2.5, fallback: true, sell: 0.01,
    colors: { main: '#8a8a8a', glow: '#b5b5b5', accent: '#5a5a5a' },
    description: 'Feiner Planetenstaub, der sanft im Orbit treibt.',
  },
  {
    id: 'moos', name: 'Moos', tier: 'common', odds: 4, sell: 0.015,
    colors: { main: '#5b8c4a', glow: '#8fd46c', accent: '#3a5c30' },
    description: 'Grüne Sporenkugeln, die gemächlich kreisen.',
  },
  // ------------------------------------------------------------- Ungewöhnlich
  {
    id: 'flut', name: 'Flut', tier: 'uncommon', odds: 100 / 15, sell: 0.02,
    colors: { main: '#3a7bd5', glow: '#6fb1ff', accent: '#1e4d8f' },
    description: 'Wogende Tropfen wie eine Brandung im All.',
  },
  {
    id: 'asche', name: 'Asche', tier: 'uncommon', odds: 100 / 9, sell: 0.025,
    colors: { main: '#d5533a', glow: '#ff8f6f', accent: '#8f2f1a' },
    description: 'Flackernde Funken aus einem längst erloschenen Vulkan.',
  },
  {
    id: 'sternschnuppe', name: 'Sternschnuppe', tier: 'uncommon', odds: 14, biome: 'meteorschauer', sell: 0.03,
    colors: { main: '#ffe6a8', glow: '#ffffff', accent: '#ffb35c' },
    description: 'Winzige Sternschnuppen kreuzen den Orbit.',
  },
  {
    id: 'nebelschleier', name: 'Nebelschleier', tier: 'uncommon', odds: 10, biome: 'nebelfeld', sell: 0.025,
    colors: { main: '#9aa8b8', glow: '#dfe8f2', accent: '#6a7888' },
    description: 'Ein feuchter Schleier, der den Planeten umhüllt.',
  },
  // ------------------------------------------------------------------- Selten
  {
    id: 'frost', name: 'Frost', tier: 'rare', odds: 20, sell: 0.035,
    colors: { main: '#4adfe0', glow: '#9ff7f7', accent: '#1a8f90' },
    description: 'Pulsierende Eiskristalle in perfekter Symmetrie.',
  },
  {
    id: 'raureif', name: 'Raureif', tier: 'rare', odds: 25, biome: 'polarnacht', sell: 0.04,
    colors: { main: '#bfe6ff', glow: '#ffffff', accent: '#6aa8d8' },
    description: 'Gefrorener Atem der Polarnacht rieselt herab.',
  },
  {
    id: 'sonnenwind', name: 'Sonnenwind', tier: 'rare', odds: 30, biome: 'sonnensturm', sell: 0.045,
    colors: { main: '#ffd36b', glow: '#fff2c4', accent: '#ff8a1a' },
    description: 'Geladene Teilchen fegen in Böen am Planeten vorbei.',
  },
  {
    id: 'sturm', name: 'Sturm', tier: 'rare', odds: 100 / 3, sell: 0.05,
    colors: { main: '#7a5cff', glow: '#b39dff', accent: '#4a2fbf' },
    description: 'Zuckende Blitzkeile eines endlosen Gewitters.',
  },
  // ------------------------------------------------------------------- Episch
  {
    id: 'sonnenkern', name: 'Sonnenkern', tier: 'epic', odds: 100 / 1.8, sell: 0.07,
    colors: { main: '#ffb020', glow: '#ffe08a', accent: '#ff5e1a' },
    description: 'Ein pochender Sonnenkern mit lodernden Flares.',
  },
  {
    id: 'nebula', name: 'Nebula', tier: 'epic', odds: 100 / 0.9, sell: 0.1,
    colors: { main: '#e64ac9', glow: '#ffa6ec', accent: '#5c3fd9' },
    description: 'Driftende Nebelklumpen voller junger Sterne.',
  },
  {
    id: 'prisma', name: 'Prisma', tier: 'epic', odds: 120, biome: 'kristallregen', sell: 0.11,
    colors: { main: '#b6a6ff', glow: '#ffffff', accent: '#7af0ff', palette: SPECTRUM },
    description: 'Lichtbrechende Splitter zerlegen das Licht in Farben.',
  },
  {
    id: 'komet', name: 'Komet', tier: 'epic', odds: 200, sell: 0.15,
    colors: { main: '#7fd8ff', glow: '#e8fbff', accent: '#3a6bff' },
    description: 'Drei Kometen ziehen lange Schweife um den Planeten.',
  },
  {
    id: 'irrlicht', name: 'Irrlicht', tier: 'epic', odds: 250, biome: 'nebelfeld', sell: 0.17,
    colors: { main: '#7affc8', glow: '#d8fff0', accent: '#3aa88a' },
    description: 'Verspielte Lichter, die im Nebel umherirren.',
  },
  // ----------------------------------------------------------------- Legendär
  {
    id: 'eklipse', name: 'Eklipse', tier: 'legendary', odds: 100 / 0.28, sell: 0.2, title: 'Schattenwandler',
    colors: { main: '#1a1a2e', glow: '#c9a7ff', accent: '#6f3fd9' },
    description: 'Korona-Sterne glimmen um eine verdunkelte Welt.',
  },
  {
    id: 'saturnring', name: 'Saturnring', tier: 'legendary', odds: 600, sell: 0.3, title: 'Ringträger',
    colors: { main: '#c8a46a', glow: '#ffe3a8', accent: '#8a6a3a' },
    description: 'Ein schräger Ring aus Eisbrocken, der hinter dem Planeten verschwindet.',
  },
  {
    id: 'finsternis', name: 'Finsternis', tier: 'legendary', odds: 800, biome: 'blutmond', sell: 0.35, title: 'Schattenmond',
    colors: { main: '#2a1a2a', glow: '#ff6a5a', accent: '#5a0a1a' },
    description: 'Ein Schatten schiebt sich langsam über den Planeten.',
  },
  {
    id: 'pulsar', name: 'Pulsar', tier: 'legendary', odds: 1000, sell: 0.4, title: 'Leuchtfeuer',
    colors: { main: '#3fd1ff', glow: '#c4f3ff', accent: '#2a5bff' },
    description: 'Zwei Lichtkegel kreisen wie ein kosmischer Leuchtturm.',
  },
  {
    id: 'meteorit', name: 'Meteorit', tier: 'legendary', odds: 1500, biome: 'meteorschauer', sell: 0.5, title: 'Einschlag',
    colors: { main: '#8a4a2a', glow: '#ffb35c', accent: '#ff5a1a' },
    description: 'Glühende Brocken umkreisen den Planeten und schlagen ein.',
  },
  {
    id: 'gezeitenmond', name: 'Gezeitenmond', tier: 'legendary', odds: 1800, sell: 0.55, title: 'Gezeitenhüter',
    colors: { main: '#9fb4d9', glow: '#e6eeff', accent: '#4c5f8f' },
    description: 'Drei kleine Monde ziehen an den Gezeiten des Planeten.',
  },
  {
    id: 'diamantherz', name: 'Diamantherz', tier: 'legendary', odds: 2500, biome: 'kristallregen', sell: 0.7, title: 'Unzerbrechlich',
    colors: { main: '#9ff7ff', glow: '#ffffff', accent: '#5ac8ff' },
    description: 'Eine facettierte Kristallhülle, die Licht in alle Richtungen bricht.',
  },
  // ----------------------------------------------------------------- Mythisch
  {
    id: 'sternbild', name: 'Sternbild', tier: 'mythic', odds: 3000, sell: 0.75, title: 'Sterndeuter',
    colors: { main: '#5a7dff', glow: '#cfe0ff', accent: '#ffffff' },
    description: 'Sterne verbinden sich zu Bildern, die kommen und gehen.',
  },
  {
    id: 'polarlicht', name: 'Polarlicht', tier: 'mythic', odds: 4000, biome: 'polarnacht', sell: 0.9, title: 'Nordlicht',
    colors: { main: '#3dff9a', glow: '#b0ffd8', accent: '#b05cff' },
    description: 'Leuchtende Vorhänge tanzen über dem Planeten.',
  },
  {
    id: 'urlicht', name: 'Urlicht', tier: 'mythic', odds: 5000, sell: 1, title: 'Der Erleuchtete',
    colors: { main: '#ffffff', glow: '#fff6cf', accent: '#ffd6f7' },
    description: 'Strahlende Blüten aus dem allerersten Licht.',
  },
  {
    id: 'sternenfeuer', name: 'Sternenfeuer', tier: 'mythic', odds: 6000, biome: 'supernova', sell: 1.15, title: 'Sternenglut',
    colors: { main: '#ff9a3d', glow: '#fff1c4', accent: '#ff3d7a' },
    description: 'Die Glut eines explodierten Sterns lodert nach außen.',
  },
  {
    id: 'phoenix', name: 'Phönix', tier: 'mythic', odds: 7500, sell: 1.3, title: 'Wiedergeboren',
    colors: { main: '#ff6a1a', glow: '#ffd36b', accent: '#ff2a2a' },
    description: 'Flammenschwingen und Federn, die spiralförmig aufsteigen.',
  },
  {
    id: 'koronaauswurf', name: 'Koronaauswurf', tier: 'mythic', odds: 9000, biome: 'sonnensturm', sell: 1.5, title: 'Sonnenzorn',
    colors: { main: '#ff7a1a', glow: '#ffe08a', accent: '#ff2a00' },
    description: 'Plasmabögen schießen aus der Oberfläche und reißen ab.',
  },
  // ----------------------------------------------------------------- Göttlich
  {
    id: 'singularitaet', name: 'Singularität', tier: 'divine', odds: 100 / 0.006, sell: 2, title: 'Der Unausweichliche',
    colors: { main: '#120a1f', glow: '#d9c7ff', accent: '#3a1a6b' },
    description: 'Alles wird nach innen gesogen. Nichts entkommt.',
    cutscene: { ...classic(['#d9c7ff', '#3a1a6b', '#ffffff'], [{ kind: 'sparkles', count: 24, r: 70, color: 0, param: -1 }], 'void'), climax: 'converge', particles: { sprite: 'dot', dir: 'in', color: 0, count: 70 }, edge: [0] },
  },
  {
    id: 'akkretion', name: 'Akkretion', tier: 'divine', odds: 20000, biome: 'schwarzesloch', sell: 2.4, title: 'Verschlinger',
    colors: { main: '#1a0a00', glow: '#ffb35c', accent: '#ff6a1a' },
    description: 'Eine glühende Scheibe aus Materie stürzt spiralförmig hinein.',
    cutscene: {
      palette: ['#ffb35c', '#ff6a1a', '#1a0a00'],
      backdrop: 'void', climax: 'converge',
      particles: { sprite: 'ember', dir: 'in', color: 0 }, edge: [0, 1],
      layers: [
        { kind: 'orbiters', count: 40, r: 38, color: 0, param: 0.8 },
        { kind: 'glow', r: 18, color: 0, alpha: 0.5 },
        { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 1, fill: true },
      ],
    },
  },
  {
    id: 'blutmond', name: 'Blutmond', tier: 'divine', odds: 25000, biome: 'blutmond', sell: 2.7, title: 'Blutmond',
    colors: { main: '#8a0a1a', glow: '#ff5a5a', accent: '#2a0008' },
    description: 'Ein riesiger roter Mond kreist, roter Regen fällt.',
    cutscene: {
      palette: ['#ff5a5a', '#8a0a1a', '#2a0008'],
      backdrop: 'blood', climax: 'split',
      particles: { sprite: 'drop', dir: 'fall', color: 0 }, edge: [0],
      layers: [
        { kind: 'glow', r: 48, color: 0, alpha: 0.3 },
        { kind: 'moon', r: 26, color: 0, color2: 2 },
        { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 0, fill: true },
      ],
    },
  },
  {
    id: 'seraph', name: 'Seraph', tier: 'divine', odds: 30000, sell: 3, title: 'Himmelswächter',
    colors: { main: '#fff4d6', glow: '#ffe08a', accent: '#9fdcff' },
    description: 'Sechs Schwingen aus Licht schlagen langsam um einen Heiligenschein.',
    cutscene: {
      palette: ['#ffe08a', '#fff4d6', '#9fdcff'],
      backdrop: 'stars', climax: 'converge',
      particles: { sprite: 'feather', dir: 'rise', color: 1 }, edge: [0, 1],
      layers: [
        { kind: 'glow', r: 50, color: 0, alpha: 0.35 },
        { kind: 'wings', count: 6, r: 44, color: 1, color2: 2 },
        { kind: 'star', points: 6, r: 19.6, inner: 0.45, color: 1, fill: true },
      ],
    },
  },
  {
    id: 'zeitriss', name: 'Zeitriss', tier: 'divine', odds: 45000, sell: 4, title: 'Zeitbrecher',
    colors: { main: '#00e5c0', glow: '#b8fff0', accent: '#ff3d9a' },
    description: 'Die Zeit reißt auf. Teilchen springen zwischen Augenblicken.',
    cutscene: {
      palette: ['#00e5c0', '#ff3d9a', '#b8fff0'],
      backdrop: 'static', climax: 'freeze',
      particles: { sprite: 'square', dir: 'drift', color: 1 }, edge: [0, 1],
      layers: [
        { kind: 'rift', r: 40, count: 3, color: 1 },
        { kind: 'pixels', r: 40, count: 18, color: 2 },
        { kind: 'star', points: 4, r: 19.6, inner: 0.3, color: 0, fill: true },
      ],
    },
  },
  // ------------------------------------------------------------- Transzendent
  {
    id: 'ewigkeit', name: 'Ewigkeit', tier: 'transcendent', odds: 100000, sell: 6, title: 'Ewig',
    colors: { main: '#ffd76a', glow: '#ffffff', accent: '#c9a7ff', palette: SPECTRUM },
    description: 'Durchläuft endlos das Farbspektrum, Ringe drehen gegeneinander.',
    cutscene: { ...classic(['#ffd76a', '#ffffff', '#c9a7ff'], [], 'stars', 'stall'), particles: { sprite: 'spark', dir: 'drift', color: 'spectrum' }, edge: [0, 2] },
  },
  {
    id: 'chronosphaere', name: 'Chronosphäre', tier: 'transcendent', odds: 150000, sell: 8, title: 'Herr der Zeit',
    colors: { main: '#d4af37', glow: '#fff1b8', accent: '#7a4a1a' },
    description: 'Ein Zifferblatt umschließt den Planeten. Alles tickt im Takt.',
    cutscene: {
      palette: ['#fff1b8', '#d4af37', '#7a4a1a'],
      backdrop: 'stars', climax: 'stall',
      particles: { sprite: 'dot', dir: 'fall', color: 0 }, ramp: { kind: 'ticks' }, edge: [0],
      layers: [
        { kind: 'glow', r: 46, color: 0, alpha: 0.3 },
        { kind: 'clock', r: 32, color: 1, color2: 0 },
        { kind: 'star', points: 4, r: 11.2, inner: 0.35, color: 0, fill: true },
      ],
    },
  },
  {
    id: 'ereignishorizont', name: 'Ereignishorizont', tier: 'transcendent', odds: 200000, biome: 'schwarzesloch', sell: 9.5, title: 'Jenseits',
    colors: { main: '#000000', glow: '#e8d8ff', accent: '#7a5cff' },
    description: 'Licht krümmt sich zu einem gleißenden Ring um absolute Schwärze.',
    cutscene: {
      palette: ['#e8d8ff', '#7a5cff', '#000000'],
      backdrop: 'void', climax: 'converge',
      particles: { sprite: 'dot', dir: 'in', color: 0 }, edge: [0],
      layers: [
        { kind: 'glow', r: 44, color: 1, alpha: 0.4 },
        { kind: 'circle', r: 25, width: 0, color: 2, fill: true },
        { kind: 'sparkles', count: 30, r: 70, color: 0, param: -1 },
        { kind: 'star', points: 4, r: 14, inner: 0.3, color: 0, fill: true },
      ],
    },
  },
  // --------------------------------------------------------------- Galaktisch
  {
    id: 'quasar', name: 'Quasar', tier: 'galactic', odds: 250000, sell: 10, title: 'Strahlender Kern',
    colors: { main: '#0a1a3a', glow: '#8ecfff', accent: '#ff6a3a' },
    description: 'Rotierende Doppel-Jets statt kreisender Partikel, taumelnde Trümmer.',
    cutscene: { ...classic(['#8ecfff', '#ff6a3a', '#ffffff'], [{ kind: 'jets', r: 70, color: 0, color2: 1 }], 'stars', 'converge'), particles: { sprite: 'spark', dir: 'out', color: 0 }, edge: [0, 1] },
  },
  {
    id: 'supernova', name: 'Supernova', tier: 'galactic', odds: 400000, biome: 'supernova', sell: 14, title: 'Sternentod',
    colors: { main: '#ffffff', glow: '#ffb36b', accent: '#7a3dff' },
    description: 'Ein Stern stirbt in gleißenden Explosionswellen.',
    cutscene: {
      palette: ['#ffffff', '#ffb36b', '#7a3dff'],
      backdrop: 'stars', climax: 'supernova',
      particles: { sprite: 'ember', dir: 'out', color: 0 }, ramp: { kind: 'counter', from: 100, to: 0, label: 'KERNSTABILITÄT', unit: '%' }, edge: [0, 1],
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
    cutscene: {
      palette: ['#ffc6f2', '#6b5bff', '#ffe6a8'],
      backdrop: 'stars', climax: 'converge',
      particles: { sprite: 'star4', dir: 'drift', color: 2 }, edge: [0, 1],
      layers: [
        { kind: 'spiral', r: 52, count: 2, color: 0, color2: 1 },
        { kind: 'glow', r: 26, color: 2, alpha: 0.7 },
        { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 2, fill: true },
      ],
    },
  },
  {
    id: 'magnetar', name: 'Magnetar', tier: 'galactic', odds: 800000, sell: 22, title: 'Feldherr',
    colors: { main: '#00b3ff', glow: '#e0f7ff', accent: '#ff2bd6' },
    description: 'Magnetische Feldlinien bündeln Teilchen zu leuchtenden Bögen.',
    cutscene: {
      palette: ['#00b3ff', '#ff2bd6', '#e0f7ff'],
      backdrop: 'void', climax: 'pulse',
      particles: { sprite: 'spark', dir: 'in', color: 0 }, edge: [0, 1],
      layers: [
        { kind: 'fieldLines', r: 48, count: 6, color: 0, color2: 1 },
        { kind: 'glow', r: 16, color: 2, alpha: 0.5 },
        { kind: 'star', points: 4, r: 15.4, inner: 0.3, color: 2, fill: true },
      ],
    },
  },
  // --------------------------------------------------------------- Universell
  {
    id: 'multiversum', name: 'Multiversum', tier: 'universal', odds: 1250000, sell: 28, title: 'Weltenspringer',
    colors: { main: '#7a5cff', glow: '#b39dff', accent: '#4a2fbf', palette: ['#7a5cff', '#4ac9ff', '#ff4ad0'] },
    description: 'Drei Ringe in Violett, Cyan und Magenta, flackernde Linsen zwischen den Welten.',
    cutscene: { ...classic(['#b39dff', '#4ac9ff', '#ff4ad0'], [
    ], 'stars', 'pulse'), climax: 'split', particles: { sprite: 'bubble', dir: 'drift', color: 1 }, lines: ['ES GIBT MEHR ALS EINE WELT.'], ramp: { kind: 'flashes' }, edge: [1, 2] },
  },
  {
    id: 'kosmischesnetz', name: 'Kosmisches Netz', tier: 'universal', odds: 2000000, sell: 38, title: 'Weber des Alls',
    colors: { main: '#4dffd2', glow: '#c2fff0', accent: '#7a5cff' },
    description: 'Ein Netz aus Filamenten, durch das Lichtimpulse wandern.',
    cutscene: {
      palette: ['#4dffd2', '#7a5cff', '#c2fff0'],
      backdrop: 'void', climax: 'converge',
      particles: { sprite: 'dot', dir: 'in', color: 0 }, lines: ['ALLES IST MITEINANDER VERBUNDEN.'], ramp: { kind: 'flashes' }, edge: [0, 1],
      layers: [
        { kind: 'web', r: 46, count: 12, color: 0, color2: 1 },
        { kind: 'star', points: 4, r: 15.4, inner: 0.3, color: 2, fill: true },
      ],
    },
  },
  // ------------------------------------------------------------- Uranfänglich
  {
    id: 'urknall', name: 'Urknall', tier: 'primordial', odds: 100 / 0.00003, sell: 50, title: 'Der Anfang',
    colors: { main: '#3a0a00', glow: '#ffd23f', accent: '#ff4500' },
    description: 'Fragmente werden ruckartig nach außen geschleudert.',
    cutscene: {
      palette: ['#ffd23f', '#ff4500', '#ffffff'],
      backdrop: 'embers', climax: 'shatter',
      particles: { sprite: 'ember', dir: 'out', color: 1 }, lines: ['VOR DEM ANFANG WAR NICHTS.'], ramp: { kind: 'counter', from: 10, to: 0, label: 'T MINUS', unit: 's', decimals: 1 }, edge: [0, 1],
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
    cutscene: {
      palette: ['#d6ff8a', '#2fd36b', '#ff9a3d'],
      backdrop: 'stars', climax: 'pulse',
      particles: { sprite: 'bubble', dir: 'rise', color: 0 }, lines: ['ETWAS REGT SICH IN DER TIEFE.'], ramp: { kind: 'ticks' }, edge: [0],
      layers: [
        { kind: 'cells', r: 40, count: 6, color: 0, color2: 1 },
        { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 2, fill: true },
      ],
    },
  },
  // --------------------------------------------------------------- Entropisch
  {
    id: 'entropie', name: 'Entropie', tier: 'entropic', odds: 10000000, sell: 100, title: 'Der Zerfall',
    colors: { main: '#1a1a22', glow: '#5a6478', accent: '#0d0d12' },
    description: 'Träge zerfallende, verblassende Partikel in einer entsättigten Welt.',
    cutscene: {
      palette: ['#8a92a5', '#5a6478', '#c0c6d4'],
      backdrop: 'static', climax: 'shatter',
      fog: [1], particles: { sprite: 'dot', dir: 'fall', color: 0 }, lines: ['ALLES ZERFÄLLT.'], ramp: { kind: 'counter', from: 100, to: 0, label: 'ORDNUNG', unit: '%' }, edge: [1],
      layers: [
        { kind: 'cracks', count: 5, r: 34, color: 2 },
        { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 1, fill: true, alpha: 0.75 },
      ],
    },
  },
  {
    id: 'waermetod', name: 'Wärmetod', tier: 'entropic', odds: 15000000, sell: 125, title: 'Das letzte Licht',
    colors: { main: '#2b2f3a', glow: '#ff8a5c', accent: '#6a7480' },
    description: 'Die letzte Glut kühlt aus, alles wird langsamer.',
    cutscene: {
      palette: ['#ff8a5c', '#6a7480', '#c0d4e8'],
      backdrop: 'snow', climax: 'stall',
      particles: { sprite: 'crystal', dir: 'fall', color: 2 }, lines: ['DAS LETZTE LICHT WIRD KALT.'], ramp: { kind: 'counter', from: 5778, to: 3, label: 'TEMPERATUR', unit: 'K' }, edge: [0],
      layers: [
        { kind: 'glow', r: 40, color: 0, alpha: 0.4 },
        { kind: 'sparkles', count: 20, r: 50, color: 0, param: 1 },
        { kind: 'star', points: 4, r: 18.2, inner: 0.3, color: 0, fill: true },
      ],
    },
  },
  // ------------------------------------------------------------------ Paradox
  {
    id: 'paradoxon', name: 'Paradoxon', tier: 'paradox', odds: 25000000, sell: 170, title: 'Widerspruch',
    colors: { main: '#ff5a3c', glow: '#4ac9ff', accent: '#2a1a4a', palette: ['#ff5a3c', '#4ac9ff'] },
    description: 'Zwei Ringe in gegensätzlichen Farben, die Bewegung kehrt sich um.',
    cutscene: {
      palette: ['#ff5a3c', '#4ac9ff', '#ffffff'],
      backdrop: 'stars', climax: 'rewind',
      particles: { sprite: 'spark', dir: 'drift', color: 0 }, lines: ['WAS IST, IST NICHT.'], ramp: { kind: 'flashes' }, edge: [0, 1],
      layers: [
        { kind: 'glow', r: 19, color: 0, alpha: 0.5, offset: [-16, 0] },
        { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 0, fill: true, offset: [-16, 0] },
        { kind: 'glow', r: 19, color: 1, alpha: 0.5, offset: [16, 0] },
        { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 1, fill: true, offset: [16, 0] },
      ],
    },
  },
  {
    id: 'moebius', name: 'Möbius', tier: 'paradox', odds: 40000000, sell: 225, title: 'Ohne Ende, ohne Seite',
    colors: { main: '#ff3dbb', glow: '#7af0ff', accent: '#ffffff', palette: ['#ff3dbb', '#7af0ff'] },
    description: 'Ein Band mit nur einer Seite. Wer darauf wandert, kommt verkehrt zurück.',
    cutscene: {
      palette: ['#ff3dbb', '#7af0ff', '#ffffff'],
      backdrop: 'stars', climax: 'rewind',
      particles: { sprite: 'spark', dir: 'drift', color: 1 }, lines: ['DER WEG ZURÜCK IST DER WEG NACH VORN.'], ramp: { kind: 'ticks' }, edge: [0, 1],
      layers: [
        { kind: 'mobius', r: 40, color: 0, color2: 1 },
        { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 2, fill: true },
      ],
    },
  },
  // --------------------------------------------------------------- Omniversal
  {
    id: 'omniversum', name: 'Omniversum', tier: 'omniversal', odds: 100000000, sell: 400, title: 'Allumfassend',
    colors: { main: '#ffffff', glow: '#ffffff', accent: '#ffd6f7', palette: SPECTRUM },
    description: 'Jedes Teilchen trägt seine eigene Spektralfarbe. Der größte Kern von allen.',
    cutscene: {
      palette: SPECTRUM,
      backdrop: 'spectrum', climax: 'pulse',
      particles: { sprite: 'spark', dir: 'out', color: 'spectrum' }, lines: ['JEDE FARBE.', 'JEDE WELT.', 'ALLES IN EINEM.'], ramp: { kind: 'flashes' }, edge: [0, 3],
      layers: [
        { kind: 'glow', r: 48, color: 'spectrum', alpha: 0.35 },
        { kind: 'star', points: 4, r: 18.2, inner: 0.3, color: 'spectrum', fill: true },
      ],
    },
  },
  {
    id: 'schoepfung', name: 'Schöpfung', tier: 'omniversal', odds: 200000000, sell: 600, title: 'Schöpfer',
    colors: { main: '#ffffff', glow: '#ffe9a8', accent: '#ff9ad5', palette: SPECTRUM },
    description: 'Überall entzünden sich neue Sterne. Lichtstrahlen fächern sich auf.',
    cutscene: {
      palette: ['#ffe9a8', '#ffffff', ...SPECTRUM],
      backdrop: 'spectrum', climax: 'supernova',
      particles: { sprite: 'star4', dir: 'out', color: 1 }, lines: ['AM ANFANG WAR ES DUNKEL.', 'DANN ENTZÜNDETE SICH EIN STERN.', 'UND NOCH EINER.'], ramp: { kind: 'flashes' }, edge: [0, 1],
      layers: [
        { kind: 'rays', count: 16, r: 70, color: 0, alpha: 0.45 },
        { kind: 'star', points: 8, r: 25.2, inner: 0.4, color: 1, fill: true },
      ],
    },
  },
  // ------------------------------------------------------------------ Absolut
  {
    id: 'nullpunkt', name: 'Nullpunkt', tier: 'absolute', odds: 400000000, sell: 900, title: 'Null',
    colors: { main: '#000000', glow: '#ffffff', accent: '#888888' },
    description: 'Schwarz und Weiß in perfekter Geometrie. Manchmal kehrt sich alles um.',
    cutscene: {
      palette: ['#ffffff', '#888888', '#000000'],
      backdrop: 'void', climax: 'invert',
      fog: [1], lines: ['ZÄHL MIT.', 'BIS NULL.'], ramp: { kind: 'counter', from: 10, to: 0, label: '' }, edge: [0],
      layers: [
        { kind: 'polygon', points: 4, r: 30, width: 1.5, color: 0, spin: 0.5 },
        { kind: 'star', points: 4, r: 19.6, inner: 0.25, color: 0, fill: true },
      ],
    },
  },
  {
    id: 'archetyp', name: 'Archetyp', tier: 'absolute', odds: 750000000, sell: 1300, title: 'Urform',
    colors: { main: '#ffd700', glow: '#ffffff', accent: '#7a5cff' },
    description: 'Verschachtelte Urformen zeichnen sich selbst in den Raum.',
    cutscene: {
      palette: ['#ffd700', '#ffffff', '#7a5cff'],
      backdrop: 'void', climax: 'converge',
      particles: { sprite: 'dot', dir: 'drift', color: 0 }, lines: ['VOR JEDER FORM', 'WAR DIE URFORM.'], ramp: { kind: 'flashes' }, edge: [0, 2],
      layers: [
        { kind: 'polygon', points: 3, r: 38, width: 2, color: 0, spin: 0.4 },
        { kind: 'polygon', points: 4, r: 30, width: 2, color: 2, spin: -0.5 },
        { kind: 'polygon', points: 6, r: 22, width: 2, color: 0, spin: 0.7 },
        { kind: 'star', points: 4, r: 12.6, inner: 0.3, color: 1, fill: true },
      ],
    },
  },
  // ---------------------------------------------------------------- Unendlich
  {
    id: 'aeon', name: 'Äon', tier: 'infinite', odds: 1500000000, sell: 2000, title: 'Zeitlos',
    colors: { main: '#a0f0ff', glow: '#ffffff', accent: '#ffd76a' },
    description: 'Licht fließt endlos entlang einer Unendlichkeitsschleife.',
    cutscene: {
      palette: ['#a0f0ff', '#ffd76a', '#ffffff'],
      backdrop: 'stars', climax: 'rewind',
      particles: { sprite: 'spark', dir: 'drift', color: 0 }, lines: ['EIN AUGENBLICK.', 'EINE EWIGKEIT.', 'KEIN UNTERSCHIED.'], ramp: { kind: 'counter', from: 1, to: 999999999, label: 'JAHRE' }, edge: [0, 1],
      layers: [
        { kind: 'glow', r: 44, color: 0, alpha: 0.35 },
        { kind: 'lemniscate', r: 44, color: 0, color2: 1 },
        { kind: 'star', points: 4, r: 14, inner: 0.3, color: 2, fill: true },
      ],
    },
  },
  {
    id: 'weltenkern', name: 'Weltenkern', tier: 'infinite', odds: 3000000000, sell: 3000, title: 'Herz aller Welten',
    colors: { main: '#ffffff', glow: '#fff6cf', accent: '#ff7ad9', palette: SPECTRUM },
    description: 'Der Planet entzündet sich zu einem Stern. Das Herz aller Welten schlägt.',
    cutscene: {
      palette: ['#ffffff', '#fff6cf', ...SPECTRUM],
      backdrop: 'spectrum', climax: 'supernova',
      particles: { sprite: 'spark', dir: 'in', color: 'spectrum' }, lines: ['ALLE WELTEN HABEN EIN HERZ.', 'HÖRST DU ES SCHLAGEN?'], ramp: { kind: 'ticks' }, edge: [0, 1],
      layers: [
        { kind: 'rays', count: 18, r: 80, color: 1, alpha: 0.5 },
        { kind: 'glow', r: 46, color: 'spectrum', alpha: 0.5 },
        { kind: 'orbiters', count: 8, r: 50, color: 'spectrum', param: 1.5 },
        { kind: 'star', points: 8, r: 25.2, inner: 0.4, color: 0, fill: true },
      ],
    },
  },
];

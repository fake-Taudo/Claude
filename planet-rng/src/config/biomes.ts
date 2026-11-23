import type { BiomeConfig } from './types';

// World weather. Time is split into slots; each slot independently draws at most one
// biome (or clear sky) from a fixed world seed, so the schedule is identical after a
// reload and keeps running while the game is closed.
export const BIOMES: BiomeConfig = {
  slotSec: 300,
  clearWeight: 40,
  biomes: [
    {
      id: 'meteorschauer', name: 'Meteoritenschauer', icon: 'meteor', weight: 14, durationSec: 150, luck: 1.5,
      description: 'Glühende Brocken regnen durch den Orbit.',
      colors: { sky: '#2a1408', accent: '#ffb35c', glow: '#ff7a1a' }, fx: 'meteors', music: { root: 2, bright: 0.6 },
    },
    {
      id: 'nebelfeld', name: 'Nebelfeld', icon: 'fog', weight: 12, durationSec: 180, luck: 1.25,
      description: 'Dichter Nebel verschluckt das Sternenlicht.',
      colors: { sky: '#1a2230', accent: '#c8d4e2', glow: '#7affc8' }, fx: 'fog', music: { root: -3, bright: 0.25 },
    },
    {
      id: 'sonnensturm', name: 'Sonnensturm', icon: 'sun', weight: 10, durationSec: 120, luck: 1.3, speed: 1.2,
      description: 'Ein Sturm geladener Teilchen beschleunigt jeden Roll.',
      colors: { sky: '#2a1a04', accent: '#ffd36b', glow: '#ff8a1a' }, fx: 'solarStorm', music: { root: 5, bright: 0.85 },
    },
    {
      id: 'polarnacht', name: 'Polarnacht', icon: 'snow', weight: 10, durationSec: 150, luck: 1.4,
      description: 'Eisige Stille, über dem Horizont tanzen Lichter.',
      colors: { sky: '#041a20', accent: '#bfe6ff', glow: '#3dff9a' }, fx: 'polar', music: { root: -5, bright: 0.4 },
    },
    {
      id: 'kristallregen', name: 'Kristallregen', icon: 'crystal', weight: 7, durationSec: 120, luck: 1.6,
      description: 'Funkelnde Kristalle rieseln wie Regen herab.',
      colors: { sky: '#101a3a', accent: '#9ff7ff', glow: '#b6a6ff' }, fx: 'crystals', music: { root: 7, bright: 0.9 },
    },
    {
      id: 'blutmond', name: 'Mondfinsternis', icon: 'moon', weight: 4, durationSec: 90, luck: 2,
      description: 'Ein blutroter Mond verdunkelt den Himmel.',
      colors: { sky: '#2a0408', accent: '#ff5a5a', glow: '#8a0a1a' }, fx: 'bloodMoon', music: { root: -6, bright: 0.3 },
    },
    {
      id: 'supernova', name: 'Supernova', icon: 'starburst', weight: 2, durationSec: 60, luck: 3,
      description: 'Ein naher Stern explodiert. Die Welle bringt enormes Glück.',
      colors: { sky: '#2a1430', accent: '#fff1c4', glow: '#ff9a3d' }, fx: 'supernova', music: { root: 4, bright: 1 },
    },
    {
      id: 'schwarzesloch', name: 'Schwarzes Loch', icon: 'blackhole', weight: 1, durationSec: 45, luck: 5,
      description: 'Ein Schwarzes Loch zieht vorbei. Selten, kurz und gewaltig.',
      colors: { sky: '#000000', accent: '#e8d8ff', glow: '#7a5cff' }, fx: 'blackHole', music: { root: -8, bright: 0.15 },
    },
  ],
};

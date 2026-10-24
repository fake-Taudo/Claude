// Planet avatar per rebirth level: it grows and changes with every rebirth.

export interface PlanetStyle {
  name: string;
  /** Size multiplier relative to the base planet. */
  scale: number;
  /** Surface gradient: equator, mid, pole. */
  colors: [string, string, string];
  /** Horizontal band colors (gas giant look); empty for rocky worlds. */
  bands: string[];
  continents?: string[];
  craters: boolean;
  clouds: boolean;
  storm?: string;
  atmosphere: string;
  /** Planetary ring (separate from aura rings). */
  ring?: { color: string; width: number; radius: number };
  moons: number;
  /** Rotation speed of the surface (texture widths per second). */
  spin: number;
}

export const PLANETS: PlanetStyle[] = [
  {
    name: 'Felsplanet', scale: 1, colors: ['#8a97d8', '#5a66b0', '#2a3270'], bands: [], craters: true, clouds: false,
    atmosphere: '#8fa8ff', moons: 0, spin: 0.012,
  },
  {
    name: 'Ozeanwelt', scale: 1.08, colors: ['#3ec6e0', '#2079c4', '#0f2f72'], bands: [], continents: ['#4fcf8a', '#e6d690'], craters: false, clouds: true,
    atmosphere: '#7fe0ff', ring: { color: '#bfe6ff', width: 0.32, radius: 1.75 }, moons: 0, spin: 0.014,
  },
  {
    name: 'Gaia', scale: 1.16, colors: ['#4fb3ff', '#2a6ad0', '#132d6a'], bands: [], continents: ['#58c26a', '#3a9a55', '#e8d48a'], craters: false, clouds: true,
    atmosphere: '#9fffd0', ring: { color: '#d8f0ff', width: 0.4, radius: 1.85 }, moons: 1, spin: 0.016,
  },
  {
    name: 'Gasriese', scale: 1.25, colors: ['#ffcf8a', '#e88a4a', '#7a3a8a'], bands: ['#ffd9a0', '#e8935a', '#c4605a', '#8a4a9a', '#f2b46a', '#d47a4a'], craters: false, clouds: false, storm: '#ff6a4a',
    atmosphere: '#ffb36b', ring: { color: '#ffe3b0', width: 0.55, radius: 2.0 }, moons: 2, spin: 0.02,
  },
];

// The prototype's cutscene symbols (Kreis-Stern motif), one per aura, kept unchanged:
// palette index 0 is the main colour; the four- or more-pointed star is always drawn in front.

import type { SymbolDef } from './types';

export const SYMBOLS: Record<string, SymbolDef> = {
  singularitaet: {
    palette: ['#d9c7ff', '#3a1a6b', '#ffffff'],
    layers: [
      { kind: 'glow', r: 46, color: 0, alpha: 0.35 },
      { kind: 'glow', r: 24, color: 0, alpha: 0.5 },
      { kind: 'sparkles', count: 24, r: 70, color: 0, param: -1 },
      { kind: 'star', points: 4, r: 21, inner: 0.32, color: 0, fill: true },
    ],
  },
  akkretion: {
    palette: ['#ffb35c', '#ff6a1a', '#1a0a00'],
    layers: [
      { kind: 'orbiters', count: 40, r: 38, color: 0, param: 0.8 },
      { kind: 'glow', r: 18, color: 0, alpha: 0.5 },
      { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 1, fill: true },
    ],
  },
  blutmond: {
    palette: ['#ff5a5a', '#8a0a1a', '#2a0008'],
    layers: [
      { kind: 'glow', r: 48, color: 0, alpha: 0.3 },
      { kind: 'moon', r: 26, color: 0, color2: 2 },
      { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 0, fill: true },
    ],
  },
  seraph: {
    palette: ['#ffe08a', '#fff4d6', '#9fdcff'],
    layers: [
      { kind: 'glow', r: 50, color: 0, alpha: 0.35 },
      { kind: 'wings', count: 6, r: 44, color: 1, color2: 2 },
      { kind: 'star', points: 6, r: 19.6, inner: 0.45, color: 1, fill: true },
    ],
  },
  zeitriss: {
    palette: ['#00e5c0', '#ff3d9a', '#b8fff0'],
    layers: [
      { kind: 'rift', r: 40, count: 3, color: 1 },
      { kind: 'pixels', r: 40, count: 18, color: 2 },
      { kind: 'star', points: 4, r: 19.6, inner: 0.3, color: 0, fill: true },
    ],
  },
  ewigkeit: {
    palette: ['#ffd76a', '#ffffff', '#c9a7ff'],
    layers: [
      { kind: 'glow', r: 46, color: 0, alpha: 0.35 },
      { kind: 'glow', r: 24, color: 0, alpha: 0.5 },
      { kind: 'star', points: 4, r: 21, inner: 0.32, color: 0, fill: true },
    ],
  },
  chronosphaere: {
    palette: ['#fff1b8', '#d4af37', '#7a4a1a'],
    layers: [
      { kind: 'glow', r: 46, color: 0, alpha: 0.3 },
      { kind: 'clock', r: 32, color: 1, color2: 0 },
      { kind: 'star', points: 4, r: 11.2, inner: 0.35, color: 0, fill: true },
    ],
  },
  ereignishorizont: {
    palette: ['#e8d8ff', '#7a5cff', '#000000'],
    layers: [
      { kind: 'glow', r: 44, color: 1, alpha: 0.4 },
      { kind: 'circle', r: 25, width: 0, color: 2, fill: true },
      { kind: 'sparkles', count: 30, r: 70, color: 0, param: -1 },
      { kind: 'star', points: 4, r: 14, inner: 0.3, color: 0, fill: true },
    ],
  },
  quasar: {
    palette: ['#8ecfff', '#ff6a3a', '#ffffff'],
    layers: [
      { kind: 'glow', r: 46, color: 0, alpha: 0.35 },
      { kind: 'glow', r: 24, color: 0, alpha: 0.5 },
      { kind: 'jets', r: 70, color: 0, color2: 1 },
      { kind: 'star', points: 4, r: 21, inner: 0.32, color: 0, fill: true },
    ],
  },
  supernova: {
    palette: ['#ffffff', '#ffb36b', '#7a3dff'],
    layers: [
      { kind: 'glow', r: 40, color: 1, alpha: 0.6 },
      { kind: 'rays', count: 12, r: 60, color: 0, alpha: 0.5 },
      { kind: 'shards', count: 10, r: 38, color: 1, color2: 2 },
      { kind: 'circle', r: 16, width: 0, color: 0, fill: true },
    ],
  },
  andromeda: {
    palette: ['#ffc6f2', '#6b5bff', '#ffe6a8'],
    layers: [
      { kind: 'spiral', r: 52, count: 2, color: 0, color2: 1 },
      { kind: 'glow', r: 26, color: 2, alpha: 0.7 },
      { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 2, fill: true },
    ],
  },
  magnetar: {
    palette: ['#00b3ff', '#ff2bd6', '#e0f7ff'],
    layers: [
      { kind: 'fieldLines', r: 48, count: 6, color: 0, color2: 1 },
      { kind: 'glow', r: 16, color: 2, alpha: 0.5 },
      { kind: 'star', points: 4, r: 15.4, inner: 0.3, color: 2, fill: true },
    ],
  },
  multiversum: {
    palette: ['#b39dff', '#4ac9ff', '#ff4ad0'],
    layers: [
      { kind: 'glow', r: 46, color: 0, alpha: 0.35 },
      { kind: 'glow', r: 24, color: 0, alpha: 0.5 },
      { kind: 'star', points: 4, r: 21, inner: 0.32, color: 0, fill: true },
    ],
  },
  kosmischesnetz: {
    palette: ['#4dffd2', '#7a5cff', '#c2fff0'],
    layers: [
      { kind: 'web', r: 46, count: 12, color: 0, color2: 1 },
      { kind: 'star', points: 4, r: 15.4, inner: 0.3, color: 2, fill: true },
    ],
  },
  urknall: {
    palette: ['#ffd23f', '#ff4500', '#ffffff'],
    layers: [
      { kind: 'glow', r: 34, color: 0, alpha: 0.75 },
      { kind: 'circle', r: 20, width: 0, color: 2, fill: true },
      { kind: 'shards', count: 7, r: 40, color: 0, color2: 1 },
    ],
  },
  ursuppe: {
    palette: ['#d6ff8a', '#2fd36b', '#ff9a3d'],
    layers: [
      { kind: 'cells', r: 40, count: 6, color: 0, color2: 1 },
      { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 2, fill: true },
    ],
  },
  entropie: {
    palette: ['#8a92a5', '#5a6478', '#c0c6d4'],
    layers: [
      { kind: 'cracks', count: 5, r: 34, color: 2 },
      { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 1, fill: true, alpha: 0.75 },
    ],
  },
  waermetod: {
    palette: ['#ff8a5c', '#6a7480', '#c0d4e8'],
    layers: [
      { kind: 'glow', r: 40, color: 0, alpha: 0.4 },
      { kind: 'sparkles', count: 20, r: 50, color: 0, param: 1 },
      { kind: 'star', points: 4, r: 18.2, inner: 0.3, color: 0, fill: true },
    ],
  },
  paradoxon: {
    palette: ['#ff5a3c', '#4ac9ff', '#ffffff'],
    layers: [
      { kind: 'glow', r: 19, color: 0, alpha: 0.5, offset: [-16,0] },
      { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 0, fill: true, offset: [-16,0] },
      { kind: 'glow', r: 19, color: 1, alpha: 0.5, offset: [16,0] },
      { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 1, fill: true, offset: [16,0] },
    ],
  },
  moebius: {
    palette: ['#ff3dbb', '#7af0ff', '#ffffff'],
    layers: [
      { kind: 'mobius', r: 40, color: 0, color2: 1 },
      { kind: 'star', points: 4, r: 16.8, inner: 0.3, color: 2, fill: true },
    ],
  },
  omniversum: {
    palette: ['#ff5a5a', '#ffcf4a', '#5aff8f', '#4ac9ff', '#c94aff'],
    layers: [
      { kind: 'glow', r: 48, color: 'spectrum', alpha: 0.35 },
      { kind: 'star', points: 4, r: 18.2, inner: 0.3, color: 'spectrum', fill: true },
    ],
  },
  schoepfung: {
    palette: ['#ffe9a8', '#ffffff', '#ff5a5a', '#ffcf4a', '#5aff8f', '#4ac9ff', '#c94aff'],
    layers: [
      { kind: 'rays', count: 16, r: 70, color: 0, alpha: 0.45 },
      { kind: 'star', points: 8, r: 25.2, inner: 0.4, color: 1, fill: true },
    ],
  },
  nullpunkt: {
    palette: ['#ffffff', '#888888', '#000000'],
    layers: [
      { kind: 'polygon', points: 4, r: 30, width: 1.5, color: 0, spin: 0.5 },
      { kind: 'star', points: 4, r: 19.6, inner: 0.25, color: 0, fill: true },
    ],
  },
  archetyp: {
    palette: ['#ffd700', '#ffffff', '#7a5cff'],
    layers: [
      { kind: 'polygon', points: 3, r: 38, width: 2, color: 0, spin: 0.4 },
      { kind: 'polygon', points: 4, r: 30, width: 2, color: 2, spin: -0.5 },
      { kind: 'polygon', points: 6, r: 22, width: 2, color: 0, spin: 0.7 },
      { kind: 'star', points: 4, r: 12.6, inner: 0.3, color: 1, fill: true },
    ],
  },
  aeon: {
    palette: ['#a0f0ff', '#ffd76a', '#ffffff'],
    layers: [
      { kind: 'glow', r: 44, color: 0, alpha: 0.35 },
      { kind: 'lemniscate', r: 44, color: 0, color2: 1 },
      { kind: 'star', points: 4, r: 14, inner: 0.3, color: 2, fill: true },
    ],
  },
  weltenkern: {
    palette: ['#ffffff', '#fff6cf', '#ff5a5a', '#ffcf4a', '#5aff8f', '#4ac9ff', '#c94aff'],
    layers: [
      { kind: 'rays', count: 18, r: 80, color: 1, alpha: 0.5 },
      { kind: 'glow', r: 46, color: 'spectrum', alpha: 0.5 },
      { kind: 'orbiters', count: 8, r: 50, color: 'spectrum', param: 1.5 },
      { kind: 'star', points: 8, r: 25.2, inner: 0.4, color: 0, fill: true },
    ],
  },
};

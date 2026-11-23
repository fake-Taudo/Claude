// Registry of all aura VFX specs (one per aura id).

import type { AuraDef } from '../types';
import { VTIER_OF } from './tiers';
import type { AuraVfxSpec } from './types';
import { SPECS_V0_V2 } from './specs/v0-v2';
import { SPECS_V3 } from './specs/v3';
import { SPECS_V4 } from './specs/v4';
import { SPECS_V5 } from './specs/v5';
import { SPECS_V6 } from './specs/v6';

export * from './types';
export { VTIERS, VTIER_OF, QUALITY_SHARE, DPR_OF_QUALITY, VFX } from './tiers';

export const VFX_SPECS: AuraVfxSpec[] = [...SPECS_V0_V2, ...SPECS_V3, ...SPECS_V4, ...SPECS_V5, ...SPECS_V6];

export const VFX_BY_ID: Record<string, AuraVfxSpec> = Object.fromEntries(VFX_SPECS.map((s) => [s.id, s]));

/** Minimal stand-in so an aura without a spec still renders (flagged by the tests). */
function fallback(aura: AuraDef): AuraVfxSpec {
  return {
    id: aura.id,
    tier: VTIER_OF[aura.tier],
    palette: { hue: 'glow', accent: 'accent', core: '#ffffff', smoke: '#05060c' },
    layers: [
      { type: 'glow', role: 'hero', motif: `fallback-${aura.id}`, color: 'hue', size: 2.2, breathe: 0.05 },
      { type: 'particles', sprite: 'mote', color: ['hue', 'accent'], count: 16, size: [0.04, 0.08], life: [3, 5], emit: { shape: 'ring', radius: [0.6, 0.9], plane: 'orbit', tilt: 0.35 }, move: { kind: 'orbit', speed: [10, 18], tilt: 0.35 } },
    ],
    motion: { baseSpinDegPerSec: 6, breatheHz: 0.2, accent: {} },
  };
}

export function vfxOf(aura: AuraDef): AuraVfxSpec {
  return VFX_BY_ID[aura.id] ?? fallback(aura);
}

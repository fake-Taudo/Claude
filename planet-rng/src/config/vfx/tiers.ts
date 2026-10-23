import type { TierId } from '../types';
import type { VTier, VTierDef } from './types';

// VFX tiers V0..V6: size, budgets and stage treatment grow with rarity.
// Extent in D (avatar diameters). On a phone in portrait the avatar is about 21 % of the
// stage width, so V3 (3 D) fills about 60 %, V4 about 80 % and V5/V6 reach past the edges.
export const VTIERS: Record<VTier, VTierDef> = {
  0: { extent: 1.2, particles: 20, layers: 3, introSec: 0.5, dim: 0.02, desaturate: 0, vignette: 0, cameraZoomOut: 0, mobileDpr: 2 },
  1: { extent: 1.6, particles: 40, layers: 4, introSec: 0.5, dim: 0.06, desaturate: 0.05, vignette: 0, cameraZoomOut: 0, mobileDpr: 2 },
  2: { extent: 2.2, particles: 80, layers: 6, introSec: 1.2, dim: 0.14, desaturate: 0.12, vignette: 0, cameraZoomOut: 0, mobileDpr: 2 },
  3: { extent: 3.0, particles: 140, layers: 8, introSec: 1.2, dim: 0.24, desaturate: 0.2, vignette: 0.1, cameraZoomOut: 0, mobileDpr: 2 },
  4: { extent: 3.8, particles: 220, layers: 10, introSec: 2.0, dim: 0.36, desaturate: 0.32, vignette: 0.25, cameraZoomOut: 0, mobileDpr: 2 },
  5: { extent: 4.8, particles: 320, layers: 12, introSec: 2.0, dim: 0.48, desaturate: 0.45, vignette: 0.45, cameraZoomOut: 0.06, mobileDpr: 1.5 },
  6: { extent: 6.0, particles: 450, layers: 14, introSec: 2.4, dim: 0.6, desaturate: 0.58, vignette: 0.6, cameraZoomOut: 0.1, mobileDpr: 1.5 },
};

/** Default VFX tier per rarity tier. */
export const VTIER_OF: Record<TierId, VTier> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 4,
  divine: 5,
  transcendent: 5,
  galactic: 5,
  universal: 6,
  primordial: 6,
  entropic: 6,
  paradox: 6,
  omniversal: 6,
  absolute: 6,
  infinite: 6,
};

/** Particle and layer share per VFX quality setting. */
export const QUALITY_SHARE = { low: 0.3, medium: 0.6, high: 1 } as const;

/** Global VFX constants (stage level, not per aura). */
export const VFX = {
  /** Ground plane defaults (D below the planet centre, ellipse squash). */
  groundY: 0.62,
  groundSquash: 0.34,
  /** Fade-out of the previous aura when switching, s. */
  outroSec: 0.4,
  /** Scale of the previous aura at the end of its fade-out. */
  outroScale: 0.9,
  /** Camera zoom transition, s. */
  cameraSec: 1.2,
  /** Darkening behind the title line (0..1) from V3 upward. */
  titleScrim: 0.55,
  /** Auto quality: step down when the frame time stays above this many ms ... */
  autoQualityMs: 22,
  /** ... for this many seconds. */
  autoQualitySec: 3,
  /** Reduced effects: rotation and breathing multiplier. */
  reducedMotion: 0.25,
  /** Texture cache budget in megapixels. */
  textureBudgetMp: 14,
  /** Pre-baking of a rolled aura: from this VFX tier up, with this time budget per frame (ms). */
  prewarmFromTier: 3,
  prewarmMsPerFrame: 8,
};

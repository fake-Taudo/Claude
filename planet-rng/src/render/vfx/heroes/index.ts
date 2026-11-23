// Hero registry: signature objects with their own drawing code. A hero kind is chosen in
// the spec ({ type: 'hero', kind: 'name', p: {...} }); all tunable numbers come from p.

import type { HeroLayer as HeroSpec, Slot } from '../../../config/vfx/types';
import { type AuraInstance, type FrameEnv, Layer } from '../core';

export type HeroCtor = new (spec: HeroSpec, inst: AuraInstance, index: number) => Layer<HeroSpec>;

const REGISTRY: Record<string, HeroCtor> = {};

export function registerHeroes(map: Record<string, HeroCtor>): void {
  Object.assign(REGISTRY, map);
}

export function heroKinds(): string[] {
  return Object.keys(REGISTRY);
}

/** Placeholder for unknown kinds (keeps the game running, flagged by the tests). */
class MissingHero extends Layer<HeroSpec> {
  draw(_slot: Slot, _env: FrameEnv): void {}
}

export function createHero(spec: HeroSpec, inst: AuraInstance, index: number): Layer {
  const C = REGISTRY[spec.kind] ?? MissingHero;
  return new C(spec, inst, index);
}

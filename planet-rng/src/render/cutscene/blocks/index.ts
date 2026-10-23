// Registry of all cutscene building blocks.

import type { BlockParams } from '../../../config/cutscenes';
import type { AnyBlock, Block } from '../core';
import { FadeVeil, Flash, WhiteOut } from './basic';
import { CoreMotif } from './motif';

const pending: Block<keyof BlockParams> = { space: 'screen', draw() {} };

export const BLOCKS: Record<keyof BlockParams, AnyBlock> = {
  FadeVeil,
  FogLayers: pending,
  CoreMotif,
  ThemeParticles: pending,
  DoublePulse: pending,
  EdgeGlow: pending,
  WhiteOut,
  Flash,
  Shatter: pending,
  SplitSlash: pending,
  TimeFreeze: pending,
  GravityRings: pending,
  TextCard: pending,
  Counter: pending,
  BeatInvert: pending,
  Letterbox: pending,
  SceneCut: pending,
  ScreenShake: pending,
  Lens: pending,
  Rays: pending,
  Ticker: pending,
} as Record<keyof BlockParams, AnyBlock>;

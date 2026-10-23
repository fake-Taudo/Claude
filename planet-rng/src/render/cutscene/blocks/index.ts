// Registry of all cutscene building blocks.

import type { BlockParams } from '../../../config/cutscenes';
import type { AnyBlock, Block } from '../core';
import { FadeVeil, Flash, WhiteOut } from './basic';
import { ScreenShake } from './camera';
import { EdgeGlow } from './edge';
import { FogLayers } from './fog';
import { Lens } from './lens';
import { CoreMotif } from './motif';
import { ThemeParticles } from './particles';
import { DoublePulse } from './pulse';
import { Rays, Ticker } from './rays';
import { Shatter, SplitSlash, TimeFreeze } from './snapshot';
import { Counter, TextCard } from './text';
import { GravityRings } from './rings';

const pending: Block<keyof BlockParams> = { space: 'screen', draw() {} };

export const BLOCKS: Record<keyof BlockParams, AnyBlock> = {
  FadeVeil,
  FogLayers,
  CoreMotif,
  ThemeParticles,
  DoublePulse,
  EdgeGlow,
  WhiteOut,
  Flash,
  Shatter,
  SplitSlash,
  TimeFreeze,
  GravityRings,
  TextCard,
  Counter,
  BeatInvert: pending,
  Letterbox: pending,
  SceneCut: pending,
  ScreenShake,
  Lens,
  Rays,
  Ticker,
} as Record<keyof BlockParams, AnyBlock>;

// Data model of the cutscene system. A cutscene is a timeline of tracks; every track runs one
// building block (render/cutscene/blocks) with plain data parameters. All times are seconds
// from the start of the cutscene, all sizes are in "u" (1 u = 1 % of the short screen side)
// unless a parameter says otherwise.

import type { SpriteKind } from '../vfx/types';

export type Ease = 'linear' | 'inQuad' | 'outQuad' | 'inOutQuad' | 'inCubic' | 'outCubic' | 'inOutCubic' | 'inExpo' | 'outExpo' | 'outBack';

/** The one colour parameter of a cutscene: everything on screen is derived from it. */
export interface Theme {
  primary: string;
  secondary: string;
  fog: string;
  dark: string;
}

/** A colour: a theme slot, white/black, 'spectrum' (hue cycles over time) or a hex colour. */
export type Color = keyof Theme | 'white' | 'black' | 'spectrum' | (string & {});

/**
 * A keyframed number: a constant, or [localSeconds, value] / [localSeconds, value, ease]
 * points (the ease shapes the segment that ends at that point). Before the first point the
 * first value holds, after the last point the last value holds.
 */
export type Curve = number | readonly Key[];
export type Key = readonly [number, number] | readonly [number, number, Ease];

/** Accelerating rotation: `from` deg/s to `to` deg/s over `over` s, then constant `to`. */
export interface Spin {
  from: number;
  to: number;
  over: number;
  /** Shape of the acceleration (1 = linear speed ramp). */
  curve?: number;
}

// ---------------------------------------------------------------------------
// Symbol layers of the Kreis-Stern motif (the prototype's symbol, kept 1:1)
// ---------------------------------------------------------------------------

export type SymbolLayerKind =
  | 'circle'
  | 'star'
  | 'shards'
  | 'cracks'
  | 'prismRings'
  | 'orbiters'
  | 'wings'
  | 'clock'
  | 'spiral'
  | 'fieldLines'
  | 'web'
  | 'cells'
  | 'mobius'
  | 'rays'
  | 'polygon'
  | 'lemniscate'
  | 'glow'
  | 'jets'
  | 'moon'
  | 'rift'
  | 'pixels'
  | 'sparkles';

export interface SymbolLayer {
  kind: SymbolLayerKind;
  /** Size in symbol units (the base symbol is about 60 units wide). */
  r?: number;
  width?: number;
  /** Index into the symbol palette, or 'spectrum'. */
  color?: number | 'spectrum';
  color2?: number;
  count?: number;
  points?: number;
  inner?: number;
  dash?: number[];
  offset?: [number, number];
  /** Own rotation speed relative to the symbol (rad/s). */
  spin?: number;
  alpha?: number;
  fill?: boolean;
  /** Generic extra parameter. */
  param?: number;
}

export interface SymbolDef {
  palette: string[];
  layers: SymbolLayer[];
}

// ---------------------------------------------------------------------------
// Glyphs: small vector symbols used by DoublePulse, particles and text decorations
// ---------------------------------------------------------------------------

export type Glyph =
  | 'star4'
  | 'star6'
  | 'star8'
  | 'ring'
  | 'crescent'
  | 'snowflake'
  | 'hourglass'
  | 'infinity'
  | 'atom'
  | 'hexagon'
  | 'triangle'
  | 'square'
  | 'diamond'
  | 'spiral'
  | 'orbit'
  | 'sun'
  | 'eye'
  | 'feather'
  | 'drop'
  | 'bolt'
  | 'cell'
  | 'node'
  | 'gear'
  | 'zero'
  | 'heart'
  | 'flower';

// ---------------------------------------------------------------------------
// Block parameters
// ---------------------------------------------------------------------------

export interface FadeVeilParams {
  color?: Color;
  /** Opacity at p = 0 and p = 1 (eased by the track). */
  from?: number;
  to?: number;
}

export interface FogParams {
  /** Noise layers at high quality (medium -1, low -2, at least 1). */
  layers?: number;
  /** Drift speed in u/s of the nearest layer (farther layers are slower: parallax). */
  speed?: number;
  /** Opacity of the fog. */
  density?: Curve;
  /** Drift direction (x, y), normalised. */
  drift?: [number, number];
  colors?: Color[];
  /** Cloud size relative to the screen diagonal. */
  scale?: number;
  /** Where the fog sits. */
  band?: 'full' | 'bottom' | 'top' | 'ring';
  /** Desaturate towards grey (0..1), e.g. for decay. */
  grey?: Curve;
  seed?: number;
}

export type MotifKind =
  | 'circleStar'
  | 'planet'
  | 'moon'
  | 'comet'
  | 'crystal'
  | 'blackHole'
  | 'ring'
  | 'lemniscate'
  | 'jets'
  | 'galaxy'
  | 'bubbles'
  | 'mandala'
  | 'core'
  | 'web'
  | 'polygons'
  | 'timeRings'
  | 'mobius'
  | 'cells'
  | 'structure'
  | 'clock'
  | 'halves'
  | 'heart';

export interface CoreMotifParams {
  kind: MotifKind;
  /** Diameter of 60 symbol units as a fraction of the short screen side ('cover' = 9). */
  size?: Curve;
  spin?: Spin;
  /** Fixed extra angle in degrees. */
  angle?: number;
  alpha?: Curve;
  /** Offset from the screen centre in u. */
  x?: Curve;
  y?: Curve;
  /** Colours for the motif (default: primary, secondary, white). */
  palette?: Color[];
  /** circleStar: the symbol layers (default: the prototype's glow + four-pointed star). */
  layers?: SymbolLayer[];
  /** Additive glow copy behind the motif (0..1). */
  glow?: Curve;
  /** Kind specific progress 0..1 (lemniscate drawing, crack, decay, jet length, merge, ...). */
  progress?: Curve;
  /** Second kind specific value (e.g. eclipse shadow, tension, merge). */
  aux?: Curve;
  /** Speed of the motif's own animation (impulses, runners, heartbeat in Hz); integrated. */
  rate?: Curve;
  /** Tilt of planar motifs (rings, discs) as y squash 0..1. */
  tilt?: number;
  /** Number of elements for kinds with several parts (bubbles, polygons, cells). */
  count?: number;
  seed?: number;
}

export type ParticleDir = 'up' | 'down' | 'in' | 'out' | 'spiral' | 'orbit' | 'float' | 'warp';

export interface ParticleParams {
  sprite: SpriteKind | 'dot' | 'streak' | 'pixel' | Glyph;
  /** Population at high quality (scaled by the quality setting). */
  count: number;
  dir: ParticleDir;
  /** Lifetime range in seconds at speed 1. */
  life?: [number, number];
  /** Speed of the particle clock (negative = time runs backwards). */
  speed?: Curve;
  /** Diameter range in u. */
  size?: [number, number];
  colors?: Color[];
  /** Streak length behind each particle in u (0 = none). */
  trail?: number;
  alpha?: Curve;
  /** Spiral twist (turns over the lifetime) for 'spiral' and 'in'. */
  twist?: number;
  /** Inner and outer radius in u for radial directions. */
  radius?: [number, number];
  /** Sideways sway in u. */
  sway?: number;
  /** Sprite rotation in turns per lifetime. */
  roll?: number;
  /** Blend mode: light adds up (default), 'over' paints. */
  blend?: 'light' | 'over';
  /** One burst: every particle starts at the track start and lives once. */
  burst?: boolean;
  seed?: number;
}

export interface PulseParams {
  symbol: Glyph;
  /** Number of pulses (usually 2, the very top 4). */
  count?: number;
  /** Seconds between pulses. */
  interval?: number;
  /** Symbol diameter in u. */
  size?: number;
  color?: Color;
  /** Scale reached by each pulse (1.0 -> grow). */
  grow?: number;
  /** Seconds one pulse lasts. */
  life?: number;
  /** Explicit pulse times (local seconds) instead of count/interval. */
  at?: number[];
  sound?: SfxId | false;
  x?: number;
  y?: number;
}

export interface EdgeGlowParams {
  colors?: [Color] | [Color, Color];
  /** 'lr' = left/right, 'tb' = top/bottom, 'none' = all edges one colour. */
  split?: 'none' | 'lr' | 'tb';
  /** How far the glow reaches into the screen (0..1 of the half size). */
  inset?: number;
  intensity?: Curve;
  /** Breathing in Hz (0 = steady). */
  pulse?: number;
}

export interface WhiteOutParams {
  color?: Color;
  peak?: number;
}

export interface FlashParams {
  color?: Color;
  peak?: number;
  /** Flash times in local seconds, or 'beats' (the cutscene's beats inside the track). */
  at?: number[] | 'beats';
  /** Fade-out of one flash in seconds. */
  decay?: number;
  /** Only every n-th beat (with at: 'beats'). */
  every?: number;
}

export interface RingsParams {
  count?: number;
  direction: 'in' | 'out';
  /** Ring width in u. */
  width?: number;
  colors?: Color[];
  /** Delay between rings in seconds. */
  stagger?: number;
  /** Start and end radius as a fraction of the half diagonal. */
  from?: number;
  to?: number;
  x?: number;
  y?: number;
}

export interface ShakeParams {
  /** Shake amplitude in u. */
  amp?: number;
  /** Decay exponent of the amplitude over the track. */
  decay?: number;
  /** Shake frequency in Hz. */
  freq?: number;
  /** Camera zoom over the track. */
  zoom?: Curve;
  /** Camera roll in degrees. */
  roll?: Curve;
  /** Horizontal mirror (-1..1), used for a fold/flip of the whole image. */
  flip?: Curve;
}

export interface ShatterParams {
  /** Number of shards at high quality. */
  pieces?: number;
  /** Break point as a fraction of the screen (0..1). */
  origin?: [number, number];
  /** Downward pull in u/s². */
  gravity?: number;
  /** Outward speed in u/s. */
  force?: number;
  /** Shard rotation in turns/s. */
  spin?: number;
  /** What shows behind the shards. */
  behind?: Color;
  /** Glowing crack edge colour. */
  edge?: Color;
  /** Seconds the cracks show before the shards fly. */
  crack?: number;
  /** Shard shape: irregular glass or long ice splinters. */
  style?: 'glass' | 'ice' | 'crystal';
  seed?: number;
}

export interface SplitParams {
  /** Cut direction in degrees (0 = horizontal cut, 90 = vertical). */
  angle?: number;
  /** Gap between the halves in u. */
  gap?: Curve;
  /** Halves slide along the cut in u. */
  shift?: Curve;
  /** Colour of the light in the gap. */
  glow?: Color;
  /** Colour swap (hue turned by 180°, brightness kept) of one half ('a'/'b'/'both'). */
  swap?: 'none' | 'a' | 'b' | 'both';
  /** Local time of the colour swap (default: half the track). */
  swapAt?: number;
  /** Re-grab every frame (the halves stay alive) instead of freezing the first frame. */
  live?: boolean;
}

export interface FreezeParams {
  /** Grey amount 0..1. */
  desaturate?: number;
  /** Darkening 0..1. */
  dim?: number;
  /** Cold tint colour mixed into the frozen frame. */
  tint?: Color;
  /** Thin crack lines that grow over the frozen frame (0..1 of the track). */
  cracks?: number;
  /** Keep the picture moving (only grey, not frozen). */
  live?: boolean;
  /** Radius in u of a circle around the centre that keeps its colour (a colour flood). */
  hole?: Curve;
}

export type TextMode = 'words' | 'line' | 'type' | 'glitch';

export interface TextParams {
  /** One line per entry. With `variants` one of several texts is picked at random. */
  lines?: string[];
  variants?: string[][];
  mode?: TextMode;
  /** Word appearance times in local seconds, or 'beats'. */
  wordTimes?: number[] | 'beats';
  /** Vertical position as a fraction of the height. */
  y?: number;
  /** Font size in u. */
  size?: number;
  color?: Color;
  /** Letter spacing in em. */
  spacing?: number;
  /** Fade-out time at the end of the track. */
  out?: number;
  /** Alternating texts: at every word time the next one replaces the previous (text swap). */
  cycle?: string[];
}

export interface CounterParams {
  from: number;
  to: number;
  ease?: Ease;
  format?: 'int' | 'de' | 'percent' | 'km' | 'kelvin' | 'years';
  label?: string;
  y?: number;
  size?: number;
  color?: Color;
  /** Tick sound whenever the shown number changes (capped). */
  ticks?: SfxId | false;
  /** Maximum ticks per second. */
  maxTickRate?: number;
}

export interface InvertParams {
  /** Beat times in local seconds; default: the cutscene's beats inside the track. */
  beats?: number[];
  /** 'invert' flips the whole image, 'swap' tints it in the second theme colour. */
  mode?: 'invert' | 'swap';
  /** Seconds each inversion holds. */
  hold?: number;
  /** Only every n-th beat. */
  every?: number;
}

export interface LetterboxParams {
  /** Bar height as a fraction of the screen height. */
  height?: number;
  /** Slide in/out time in seconds. */
  slide?: number;
}

export type SceneKind = 'void' | 'sky' | 'starfield' | 'surface' | 'nebula' | 'grid' | 'paper' | 'bubble' | 'core';

export interface Scene {
  /** Local time of the cut. */
  at: number;
  kind: SceneKind;
  colors?: Color[];
  /** Slow camera zoom inside the scene (from -> to). */
  zoom?: [number, number];
  seed?: number;
  /** A bright scene: cutting to it counts as a flash. */
  bright?: boolean;
}

export interface SceneCutParams {
  scenes: Scene[];
}

export interface LensParams {
  x?: number;
  y?: number;
  /** Lens radius in u. */
  radius?: Curve;
  /** Distortion strength (0..1). */
  strength?: Curve;
  /** Dark centre radius in u. */
  dark?: Curve;
}

export interface RaysParams {
  /** Light rays per second at the start and the end of the track. */
  rate?: [number, number];
  color?: Color;
  /** Ray width in u. */
  width?: number;
  /** Seconds one ray lasts. */
  life?: number;
  /** Rays pass through the centre or anywhere. */
  through?: 'center' | 'random' | 'vertical';
  seed?: number;
  sound?: SfxId | false;
}

export interface TickerParams {
  /** Ticks per second at the start and the end of the track. */
  rate: [number, number];
  ease?: Ease;
  sound?: SfxId;
  /** Visual: none, or clock hands that sweep with the ticks. */
  visual?: 'none' | 'hands';
  color?: Color;
  /** Visual size in u. */
  size?: number;
}

export interface BlockParams {
  FadeVeil: FadeVeilParams;
  FogLayers: FogParams;
  CoreMotif: CoreMotifParams;
  ThemeParticles: ParticleParams;
  DoublePulse: PulseParams;
  EdgeGlow: EdgeGlowParams;
  WhiteOut: WhiteOutParams;
  Flash: FlashParams;
  Shatter: ShatterParams;
  SplitSlash: SplitParams;
  TimeFreeze: FreezeParams;
  GravityRings: RingsParams;
  TextCard: TextParams;
  Counter: CounterParams;
  BeatInvert: InvertParams;
  Letterbox: LetterboxParams;
  SceneCut: SceneCutParams;
  ScreenShake: ShakeParams;
  Lens: LensParams;
  Rays: RaysParams;
  Ticker: TickerParams;
}

export type BlockId = keyof BlockParams;

interface TrackBase {
  /** Start in seconds. */
  t: number;
  /** Duration in seconds. */
  dur: number;
  ease?: Ease;
  /** Fade the track in/out over these seconds (alpha envelope). */
  fade?: [number, number];
  /** Keep drawing at p = 1 after the track ended (until the cutscene ends). */
  hold?: boolean;
  /** Keep drawing at p = 1 after the track ended, up to this time (absolute seconds). */
  until?: number;
  /** Only draw on one side of a line through the centre (angle in degrees, side +1/-1). */
  clip?: { angle: number; side: 1 | -1 };
  /** Sound at the start of the track. */
  sfx?: SfxId | Cue;
  /** Label for the lab. */
  name?: string;
}

/** One block on the timeline. Order in `tracks` = drawing order (z-order). */
export type Track = { [B in BlockId]: TrackBase & { block: B; params: BlockParams[B] } }[BlockId];

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

export type SfxId =
  | 'deepBoom'
  | 'jingle'
  | 'wind'
  | 'drone'
  | 'riser'
  | 'pulse'
  | 'heartbeat'
  | 'tick'
  | 'tock'
  | 'gong'
  | 'glass'
  | 'impact'
  | 'whoosh'
  | 'slash'
  | 'freeze'
  | 'chime'
  | 'choir'
  | 'thunder'
  | 'suck'
  | 'bloom'
  | 'kick'
  | 'snare'
  | 'hat'
  | 'laser'
  | 'type'
  | 'shimmer'
  | 'crack'
  | 'splash'
  | 'zap'
  | 'bubble'
  | 'glitch'
  | 'swell';

export interface Cue {
  t: number;
  sfx: SfxId;
  /** Length for sustained sounds (wind, drone, riser, choir, swell). */
  dur?: number;
  gain?: number;
  /** Base note (MIDI) for tonal sounds. */
  note?: number;
  /** Sound variant (jingle styles, ...). */
  variant?: number;
}

export interface MusicSpec {
  /** Start of the first beat. */
  t: number;
  bpm: number;
  /** Number of beats. */
  beats: number;
  /** Root note (MIDI). */
  key?: number;
  /** Beat index from which the full drum pattern plays (before: pulse only). */
  drop?: number;
  /** Arpeggio / pad character. */
  mood?: 'bright' | 'dark' | 'mystic' | 'drive';
}

export interface AudioSpec {
  /** Sound bed: the Deep Boom sample (T1), a procedural drone or nothing. */
  bed?: 'deepBoom' | 'drone' | 'none';
  /** Root note (MIDI) of the drone bed. */
  key?: number;
  /** Jingle variant at the start (0 = rising, 1 = bell, 2 = dark, 3 = spectral, 4 = glitch). */
  jingle?: number;
  /** Continuous wind layer over the whole cutscene (gain, 0 = off). */
  wind?: number;
  /** Impact sound at the signature break. */
  sting?: SfxId;
  /** Beat markers in seconds (texts, cuts and flashes sit on them). */
  beats?: number[];
  music?: MusicSpec;
  /** Silence windows [start, end] (the cutscene bus drops almost to zero). */
  silence?: [number, number][];
  cues?: Cue[];
}

export interface EchoSpec {
  /** 1 small, 2 medium, 3 full (beam + particles). */
  strength: 1 | 2 | 3;
  /** Monochrome flash or colour swap on the stage. */
  mode: 'mono' | 'swap' | 'tint';
  color?: Color;
  /** Seconds the filter holds. */
  dur?: number;
}

export interface CutsceneDef {
  id: string;
  auraId: string;
  tier: 1 | 2 | 3;
  /** Seconds until the reveal handover (skip jumps here). */
  duration: number;
  theme: Theme;
  audio: AudioSpec;
  tracks: Track[];
  /** Start of the reveal transition and its style. */
  reveal: { at: number; style: 'whiteout' | 'edgeglow' | 'cut' };
  /** The one signature moment (break) of the cutscene. */
  signature: { name: string; at: number };
  echo?: EchoSpec;
  /** Takes over the first seconds of another cutscene (fakeout). */
  extends?: { id: string; until: number };
}

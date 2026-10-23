// Declarative aura VFX specs. The renderer (src/render/vfx) interprets these; adding an
// aura means writing a spec, not touching the renderer.
//
// Units used everywhere in specs:
//   D      = diameter of the avatar (planet). Positions are relative to the planet centre,
//            x to the right, y downward.
//   deg/s  = rotation speeds, D/s = linear speeds, s = seconds, Hz = cycles per second.
//   alpha  = 0..1.

/** VFX tier: drives size, layer budget, particle budget, stage dimming and camera. */
export type VTier = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Draw slots from back to front. The avatar is drawn between 'ground' and 'heroFront'. */
export type Slot = 'screenBack' | 'smokeBack' | 'heroBack' | 'beams' | 'ground' | 'heroFront' | 'particles' | 'screenFront';

/**
 * Colour reference: a palette key ('hue' | 'accent' | 'core' | 'smoke'), 'spectrum' for a
 * slowly cycling rainbow, or a hex colour.
 */
export type Col = string;

/** Palette values: hex or a reference into the aura config colours ('main' | 'glow' | 'accent' | 'p0'..'p4'). */
export interface PaletteSpec {
  hue: string;
  accent: string;
  core: string;
  smoke: string;
}

export type Quality = 'low' | 'medium' | 'high';

/** Where a layer lives in space. */
export type Plane =
  /** Facing the camera (a flat disc you look at). */
  | 'screen'
  /** Lying on the ground plane below the avatar (ellipse). */
  | 'ground'
  /** Tilted orbit plane through the planet centre (ellipse with back/front halves). */
  | 'orbit';

export interface LayerCommon {
  /** Label in the aura lab. */
  name?: string;
  /** Checklist role of the layer. Every aura has exactly one 'hero'. */
  role?: 'hero' | 'ground' | 'smoke' | 'vertical' | 'orbit' | 'accent' | 'support';
  /** Unique motif name of the hero (no two auras share one). */
  motif?: string;
  /** This layer provides the aura's vertical structure (when its role is something else). */
  vertical?: boolean;
  depth?: Slot;
  /** Only drawn from this VFX quality upward. */
  minQuality?: 'medium' | 'high';
  /** Intro window as fractions of the intro duration [start, end]. */
  intro?: [number, number];
  /** Extra brightness while the accent event plays (0 = none, 1 = double). */
  accentGain?: number;
  alpha?: number;
  /** Anchor offset in D relative to the planet centre. */
  at?: [number, number];
}

export interface GlowLayer extends LayerCommon {
  type: 'glow';
  color: Col;
  /** Diameter in D. */
  size: number;
  /** 'soft' gaussian, 'core' white-hot centre, 'ring' hollow. */
  profile?: 'soft' | 'core' | 'ring';
  /** Relative size breathing amplitude (0..0.3). */
  breathe?: number;
  /** Non-uniform scale [x, y]. */
  stretch?: [number, number];
  blend?: 'add' | 'normal';
}

export interface SmokeLayer extends LayerCommon {
  type: 'smoke';
  color: Col;
  count: number;
  /** Ring band the puffs sit in, D. */
  radius: [number, number];
  /** Puff diameter, D. */
  size: [number, number];
  /** Angular drift deg/s (sign = direction). */
  drift: number;
  /** Upward rise D/s (puffs loop). */
  rise?: number;
  plane?: 'screen' | 'ground';
  blend?: 'add' | 'normal';
  /** Vertical squash of the distribution (screen plane). */
  squash?: number;
}

export type SigilElement =
  | { e: 'ring'; r: number; w: number; a?: number; c?: Col }
  /** Soft luminous annulus (gaussian band of light, no outline). */
  | { e: 'band'; r: number; w: number; a?: number; c?: Col }
  | { e: 'ticks'; r: number; n: number; len: number; w: number; a?: number; c?: Col }
  | { e: 'poly'; r: number; n: number; w: number; step?: number; rot?: number; a?: number; c?: Col }
  | { e: 'runes'; r: number; n: number; size: number; w: number; a?: number; c?: Col }
  | { e: 'dots'; r: number; n: number; size: number; a?: number; c?: Col }
  | { e: 'spiral'; arms: number; turns: number; w: number; r0?: number; a?: number; c?: Col }
  | { e: 'cracks'; n: number; r0: number; r1: number; w: number; a?: number; c?: Col }
  | { e: 'petals'; r: number; n: number; len: number; w: number; fill?: number; rot?: number; a?: number; c?: Col }
  | { e: 'rays'; n: number; r0: number; r1: number; w: number; a?: number; c?: Col }
  | { e: 'disc'; r: number; a: number; c?: Col; soft?: number }
  | { e: 'circles'; r: number; n: number; cr: number; w: number; a?: number; c?: Col }
  | { e: 'numerals'; r: number; n: number; size: number; w: number; a?: number; c?: Col }
  | { e: 'zodiac'; r: number; n: number; size: number; w: number; a?: number; c?: Col }
  | { e: 'grid'; r: number; n: number; w: number; a?: number; c?: Col }
  | { e: 'waves'; r: number; n: number; amp: number; w: number; a?: number; c?: Col };

export interface SigilLayer extends LayerCommon {
  type: 'sigil';
  /** Outer radius in D. */
  radius: number;
  pattern: SigilElement[];
  /** Default stroke colour of the pattern. */
  color: Col;
  spin: number;
  plane?: Plane;
  /** Orbit plane squash (0..1, 1 = face on) and roll in degrees. */
  tilt?: number;
  roll?: number;
  /** Glow strength of the baked strokes. */
  glow?: number;
  /** Strength of the baked bloom underlay (blurred copy, 0 = none). */
  bloom?: number;
  /** Relative pulsing 0..0.3. */
  breathe?: number;
  /** Draws itself along a circle during the intro. */
  drawOn?: boolean;
  blend?: 'add' | 'normal';
}

export interface RippleLayer extends LayerCommon {
  type: 'ripple';
  color: Col;
  /** Seconds between new ripples. */
  period: number;
  /** Final radius in D. */
  radius: number;
  /** Band width in D. */
  width: number;
  plane?: 'ground' | 'screen';
  /** Ripples per period (fired on the accent instead when 0). */
  count?: number;
}

export interface VortexLayer extends LayerCommon {
  type: 'vortex';
  radius: number;
  arms: number;
  color: Col;
  color2?: Col;
  spin: number;
  /** 0..1 darkness of the centre. */
  dark?: number;
  /** Spiral tightness (turns over the radius). */
  twist?: number;
  plane?: Plane;
  tilt?: number;
  roll?: number;
  blend?: 'add' | 'normal';
}

export interface BandLayer extends LayerCommon {
  type: 'band';
  /** Ring radius in D. */
  radius: number;
  /** Band width in D. */
  width: number;
  /** Orbit squash 0.15..1 and roll in degrees. */
  tilt: number;
  roll?: number;
  color: Col;
  color2?: Col;
  /** Texture rotation deg/s. */
  spin: number;
  /** Number of four-pointed glints riding on the ring. */
  glints?: number;
  glintSize?: number;
  /** Angular brightness variation 0..1. */
  variation?: number;
  /** Only draw the back or front half. */
  half?: 'back' | 'front';
}

export interface PillarLayer extends LayerCommon {
  type: 'pillar';
  color: Col;
  /** Width in D. */
  width: number;
  /** Length upward from the anchor in D, or 'stage' for the full stage height. */
  up: number | 'stage';
  /** Length downward from the anchor in D, or 'stage'. */
  down?: number | 'stage';
  /** Scroll speed of the inner flow texture, D/s (positive = upward). */
  flow: number;
  breathe?: number;
  /** Bright flare at the anchor. */
  flare?: number;
}

export interface BeamLayer extends LayerCommon {
  type: 'beam';
  color: Col;
  /** Number of beams spread evenly around the source (2 = opposite). */
  count: number;
  /** Length in D or 'stage'. */
  length: number | 'stage';
  /** Opening angle in degrees. */
  spread: number;
  /** Rotation deg/s. */
  spin: number;
  /** Start angle in degrees (0 = right, 90 = down). */
  angle?: number;
  /** Swing amplitude in degrees instead of full rotation (0 = full rotation). */
  swing?: number;
  /** Dust drifting inside the beam. */
  dust?: boolean;
  /** Pseudo-3D: beam brightness depends on facing (pulsar beams). */
  facing?: boolean;
}

export interface RaysLayer extends LayerCommon {
  type: 'rays';
  color: Col;
  radius: number;
  n: number;
  spin: number;
  /** Ray width variation 0..1. */
  jitter?: number;
  /** Accent sweep: a bright wedge travels once around the rays. */
  sweep?: boolean;
  plane?: 'screen' | 'ground';
}

export type OrbiterSprite = 'orb' | 'crystal' | 'moon' | 'chunk' | 'wisp' | 'glint' | 'shard' | 'ember' | 'droplet' | 'feather' | 'mote';

export interface OrbiterLayer extends LayerCommon {
  type: 'orbiters';
  sprite: OrbiterSprite;
  color: Col | Col[];
  count: number;
  /** Orbit radius in D (one value or a range distributed over the orbiters). */
  radius: number | [number, number];
  tilt: number;
  roll?: number;
  /** Orbit speed deg/s. */
  speed: number;
  /** Object diameter in D. */
  size: number | [number, number];
  /** Trail length in seconds of motion (0 = none). */
  trail?: number;
  /** Self rotation deg/s. */
  spin?: number;
  /** Bob up and down, D. */
  bob?: number;
  /** Casts a soft shadow on the avatar when in front. */
  shadow?: boolean;
  /** Halo glow around each object (multiplier of size). */
  halo?: number;
}

export type SpriteKind =
  | 'mote'
  | 'spark'
  | 'ember'
  | 'glint'
  | 'feather'
  | 'shard'
  | 'crystal'
  | 'droplet'
  | 'bubble'
  | 'flake'
  | 'ash'
  | 'puff'
  | 'petal'
  | 'chunk'
  | 'wisp'
  | 'orb'
  | 'rune'
  | 'leaf'
  | 'cell'
  | 'gear'
  | 'moon'
  | 'bokeh';

export type EmitShape =
  | { shape: 'ring'; radius: [number, number]; plane?: Plane; tilt?: number; roll?: number }
  | { shape: 'disc'; radius: [number, number]; plane?: Plane }
  | { shape: 'sphere'; radius: [number, number] }
  | { shape: 'point'; at: [number, number]; spread?: number }
  | { shape: 'box'; x: [number, number]; y: [number, number] }
  | { shape: 'arc'; radius: [number, number]; from: number; to: number };

export type MoveSpec =
  /** Straight drift with optional sway, gravity and drag. dir in degrees (-90 = up). */
  | { kind: 'drift'; speed: [number, number]; dir: number; spread?: number; sway?: number; swayHz?: number; gravity?: number; drag?: number }
  /** Circles the planet on a tilted orbit. speed deg/s, wobble in D. */
  | { kind: 'orbit'; speed: [number, number]; tilt: number; roll?: number; wobble?: number; rise?: number }
  /** Spirals toward (inward > 0) or away from the centre. speed deg/s, inward D/s, accel multiplies inward speed near the core. */
  | { kind: 'spiral'; speed: [number, number]; inward: number; accel?: number; tilt?: number; roll?: number }
  /** Moves radially from the centre: positive speed outward. */
  | { kind: 'radial'; speed: [number, number]; drag?: number; gravity?: number }
  /** Wanders smoothly in a noise flow field. */
  | { kind: 'flow'; speed: [number, number]; scale: number }
  /** Follows a named path; speed in path lengths per second. */
  | { kind: 'path'; path: 'lemniscate' | 'field' | 'mobius' | 'stream'; speed: [number, number]; size: number; tilt?: number; roll?: number; spreadD?: number }
  /** Stays where it was born (twinkling stars, glitter). */
  | { kind: 'still' };

export interface ParticleLayer extends LayerCommon {
  type: 'particles';
  sprite: SpriteKind;
  color: Col | Col[];
  /** Population at high quality (scaled by the VFX quality). */
  count: number;
  /** Diameter in D. */
  size: [number, number];
  /** Lifetime in seconds. */
  life: [number, number];
  emit: EmitShape;
  move: MoveSpec;
  /** Fade in/out as fraction of life. */
  fade?: [number, number];
  /** Size multiplier at birth and death. */
  grow?: [number, number];
  /** Stretch along the velocity in seconds of motion (trail). */
  trail?: number;
  /** Fraction of particles that show a glint cross now and then. */
  glint?: number;
  blend?: 'add' | 'normal';
  /** Self rotation deg/s (random sign). */
  spin?: number;
  /** Alpha twinkle frequency in Hz (max 3). */
  twinkle?: number;
  /** Extra particles spawned when the accent fires. */
  burst?: number;
  /** Speed multiplier for burst particles. */
  burstSpeed?: number;
  /** Behind/in front of the avatar by depth (default), or a fixed slot via depth. */
  split?: boolean;
  /** Colour at the end of life. */
  fadeTo?: Col;
}

export interface LightningLayer extends LayerCommon {
  type: 'lightning';
  color: Col;
  /** Strike on the accent, plus random strikes every [min, max] s if given. */
  every?: [number, number];
  /** Strike origin and target region (D). */
  from: [number, number];
  to: [number, number];
  /** Random spread of start and end, D. */
  spread?: number;
  branches?: number;
  /** Visible time of one strike in seconds. */
  duration?: number;
  /** Core width in D. */
  width?: number;
  /** Persistent small crackles along the given ring radius instead of strikes. */
  crackle?: number;
}

export interface ConstellationLayer extends LayerCommon {
  type: 'constellation';
  color: Col;
  /** Star positions in D, in the layer's own disc (radius 1 = layer radius). */
  stars: [number, number][];
  lines: [number, number][];
  radius: number;
  starSize: number;
  lineWidth: number;
  spin?: number;
  /** Seconds for one draw-on cycle; lines redraw on every accent. */
  redraw?: boolean;
  plane?: Plane;
  tilt?: number;
  roll?: number;
}

export interface ShockwaveLayer extends LayerCommon {
  type: 'shockwave';
  color: Col;
  /** Final radius in D. */
  radius: number;
  /** Band width in D. */
  width: number;
  /** Duration of one wave in s. */
  duration: number;
  plane?: 'ground' | 'screen';
  /** Runs inward instead of outward. */
  inward?: boolean;
  /** Number of waves per accent. */
  waves?: number;
}

export interface FlareLayer extends LayerCommon {
  type: 'flare';
  color: Col;
  /** Size in D. */
  size: number;
  /** Constant visibility 0..1 (the accent adds on top). */
  base?: number;
  /** Anamorphic streak length factor. */
  streak?: number;
  /** Rotation of the cross in degrees (rotates over time with spin deg/s). */
  rot?: number;
  spin?: number;
  /** Twinkle frequency in Hz (max 3). */
  twinkle?: number;
}

export interface NebulaLayer extends LayerCommon {
  type: 'nebula';
  colors: Col[];
  /** Radius in D. */
  radius: number;
  /** Rotation deg/s of the two counter-moving noise layers. */
  spin: number;
  /** Squash for a flattened cloud. */
  squash?: number;
  seed?: number;
  blend?: 'add' | 'normal';
}

export interface HeroLayer extends LayerCommon {
  type: 'hero';
  /** Registered hero kind (src/render/vfx/heroes). */
  kind: string;
  /** Hero parameters; meaning is documented next to each hero kind. */
  p?: Record<string, number | string | boolean | number[] | string[]>;
}

export type LayerSpec =
  | GlowLayer
  | SmokeLayer
  | SigilLayer
  | RippleLayer
  | VortexLayer
  | BandLayer
  | PillarLayer
  | BeamLayer
  | RaysLayer
  | OrbiterLayer
  | ParticleLayer
  | LightningLayer
  | ConstellationLayer
  | ShockwaveLayer
  | FlareLayer
  | NebulaLayer
  | HeroLayer;

export interface AccentSpec {
  /** Seconds between accent events [min, max]. Omitted = no accent event. */
  every?: [number, number];
  /** Duration of the accent envelope in s. */
  duration?: number;
  /** Avatar brightening during the accent 0..1. */
  flash?: number;
}

export interface MotionSpec {
  /** Rotation of large elements in deg/s (sigils, halos). */
  baseSpinDegPerSec: number;
  /** Breathing frequency in Hz (0.15..0.25 recommended). */
  breatheHz: number;
  accent: AccentSpec;
}

export interface IntroSpec {
  /** Seconds; default from the tier. */
  duration?: number;
  /** Ground shockwave at the start of the intro. */
  shockwave?: boolean;
  /** White flash strength at the end of the intro (V5+). */
  flash?: number;
}

export interface ScreenSpec {
  /** Background darkening 0..1 (default from the tier). */
  dim?: number;
  /** Background desaturation 0..1 (default from the tier). */
  desaturate?: number;
  /** Vignette strength 0..1 (default from the tier). */
  vignette?: number;
  vignetteColor?: Col;
  /** Stage tint colour and strength. */
  tint?: Col;
  tintAlpha?: number;
  /** Camera zoom-out fraction (0.06 = 6 %); default from the tier. */
  cameraZoomOut?: number;
}

export interface LightSpec {
  /** Rim light colour and strength on the avatar. */
  rim?: Col;
  rimAlpha?: number;
  /** Direction of the light source in degrees (0 = right, -90 = up). */
  angle?: number;
  /** Colour cast over the avatar. */
  tint?: Col;
  tintAlpha?: number;
}

export interface GroundSpec {
  /** Ground plane height below the planet centre in D. */
  y?: number;
  /** Ellipse squash (0.3..0.4). */
  squash?: number;
}

export interface AuraVfxSpec {
  id: string;
  tier: VTier;
  palette: PaletteSpec;
  /** Overall extent override in D (scales every layer). */
  size?: number;
  ground?: GroundSpec;
  layers: LayerSpec[];
  motion: MotionSpec;
  intro?: IntroSpec;
  screen?: ScreenSpec;
  light?: LightSpec;
  /** Particle sprite of the reveal burst. */
  burst?: 'dot' | 'star4' | 'fragment' | 'spark' | 'orb';
}

export interface VTierDef {
  /** Visual extent in D. */
  extent: number;
  /** Max particles at high quality. */
  particles: number;
  /** Max layers. */
  layers: number;
  introSec: number;
  dim: number;
  desaturate: number;
  vignette: number;
  cameraZoomOut: number;
  /** Max device pixel ratio on phones while this tier is shown. */
  mobileDpr: number;
}

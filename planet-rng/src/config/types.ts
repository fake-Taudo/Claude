// Shared type definitions for all data-driven game configuration.
// Every number that affects gameplay or presentation lives in src/config/*,
// logic and UI code only read from here.

export type TierId =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'
  | 'divine'
  | 'transcendent'
  | 'galactic'
  | 'universal'
  | 'primordial'
  | 'entropic'
  | 'paradox'
  | 'omniversal'
  | 'absolute'
  | 'infinite';

/** How loud a drop is staged: 1 small banner, 2 flash/shake, 3 fullscreen reveal, 4 cutscene. */
export type StagingLevel = 1 | 2 | 3 | 4;

export interface StagingDef {
  level: StagingLevel;
  /** Extra roll-animation time in normal (non-quick) mode, builds suspense. */
  suspenseMs: number;
  /** 0..1 screen flash strength. */
  flash: number;
  /** 0..1 screen shake strength. */
  shake: number;
  /** Particles in the reveal burst (high quality). */
  burst: number;
  /** Expanding shockwave rings on reveal. */
  shockwaves: number;
  /** How long the reveal banner stays. */
  bannerMs: number;
  /** Extra cutscene climax time (only used for level 4). */
  cutsceneExtraMs: number;
  /** Vibration pattern on mobile (ms). */
  vibrate?: number[];
}

export interface TierDef {
  id: TierId;
  name: string;
  color: string;
  /** Second color for gradients/banners. */
  color2: string;
  rank: number;
  staging: StagingDef;
}

// ---------------------------------------------------------------------------
// Aura visuals
// ---------------------------------------------------------------------------

export type RingStyle = 'solid' | 'dashed' | 'dotted' | 'segments' | 'arc' | 'double' | 'cracked' | 'ticks' | 'wave';

export interface RingDef {
  /** Radius relative to planet radius (1 = planet surface). */
  radius: number;
  /** Line width in px at reference scale. */
  width: number;
  style: RingStyle;
  /** Rotation speed in rad/s (sign = direction). */
  speed: number;
  /** 0 = flat circle facing the camera, 0.9 = almost edge-on ellipse. */
  tilt?: number;
  color?: string;
  alpha?: number;
  /** Relative radius pulse amplitude. */
  pulse?: number;
  /** Hue rotation in degrees per second (spectrum rings). */
  hueCycle?: number;
  /** Direction flips every n seconds. */
  reverseEvery?: number;
  /** Ring collapses toward the planet and re-emerges outside (Singularität). */
  collapse?: number;
  segments?: number;
  /** Additional jitter in px (glitch rings). */
  glitch?: number;
}

export type ParticleShape =
  | 'dot'
  | 'orb'
  | 'drop'
  | 'spark'
  | 'shard'
  | 'bolt'
  | 'flare'
  | 'cloud'
  | 'star4'
  | 'star5'
  | 'hex'
  | 'fragment'
  | 'lens'
  | 'feather'
  | 'crystal'
  | 'ember'
  | 'petal'
  | 'ring'
  | 'diamond'
  | 'streak'
  | 'bubble'
  | 'square';

export type Behavior =
  | 'orbit' // circles the planet
  | 'drift' // floats softly around a band
  | 'rise' // rises from below with sway
  | 'fall' // falls from above
  | 'inward' // sucked toward the core
  | 'outward' // flung outward from the core
  | 'burst' // jerky outward impulses
  | 'decay' // drifts, shrinks, desaturates
  | 'wave' // orbit with radial sine wave
  | 'flicker' // orbit with random alpha flicker
  | 'jitter' // orbit with positional jitter
  | 'pulse' // orbit with size pulse
  | 'reverse' // orbit whose direction periodically flips
  | 'tick' // orbit in discrete steps
  | 'teleport' // orbit that occasionally jumps
  | 'tumble' // slow chaotic tumbling debris
  | 'swirlUp' // spirals upward around the planet
  | 'jets' // shoots along a rotating jet axis
  | 'galaxy' // logarithmic spiral arms
  | 'fieldline' // flows along dipole field lines
  | 'mobius' // walks along a Möbius band
  | 'lemniscate' // flows along an infinity curve
  | 'bloom' // spawns on a ring and blooms outward
  | 'wander' // will-o'-wisp wandering
  | 'wind' // horizontal sweeping streaks
  | 'grid'; // rigid perfect concentric arrangement

export interface EmitterDef {
  shape: ParticleShape;
  /** Population at high VFX quality. */
  count: number;
  behavior: Behavior;
  /** Radius band relative to planet radius. */
  radius: [number, number];
  /** Particle size in px at reference scale. */
  size: [number, number];
  /** Behavior specific speed (rad/s for orbits, px/s for linear motion). */
  speed: [number, number];
  /** Lifetime in seconds; omitted = persistent particle. */
  life?: [number, number];
  /** Palette for this emitter; defaults to the aura main/glow. */
  colors?: string[];
  /** Every particle gets its own spectral hue. */
  spectral?: boolean;
  /** Hue drift in degrees per second. */
  hueCycle?: number;
  alpha?: number;
  /** Additive blending (default true). */
  additive?: boolean;
  /** Self rotation rad/s. */
  spin?: number;
  /** Orbit flattening (perspective), particles behind the planet are occluded. */
  tilt?: number;
  /** Draw a short motion trail. */
  trail?: boolean;
  /** Behavior specific parameter (wave amplitude, arm count, interval ...). */
  param?: number;
  /** Second behavior parameter. */
  param2?: number;
  /** Color shift over life: particle fades from colors[0] toward this color. */
  fadeTo?: string;
}

export type SpecialKind =
  | 'arcs'
  | 'corona'
  | 'comets'
  | 'beams'
  | 'pulseRings'
  | 'moons'
  | 'constellation'
  | 'trailRings'
  | 'wings'
  | 'lensing'
  | 'halo'
  | 'rift'
  | 'clock'
  | 'fieldLines'
  | 'web'
  | 'shockPulse'
  | 'cells'
  | 'mobius'
  | 'ignite'
  | 'rays'
  | 'inversion'
  | 'geometry'
  | 'lemniscate'
  | 'starCore'
  | 'meteors'
  | 'flares'
  | 'aurora'
  | 'facets'
  | 'eclipseDisc'
  | 'timeDilation'
  | 'photonRing'
  | 'accretionGlow';

export interface SpecialDef {
  kind: SpecialKind;
  /** Generic tuning knobs, meaning depends on kind. */
  count?: number;
  radius?: number;
  speed?: number;
  size?: number;
  interval?: number;
  alpha?: number;
  colors?: string[];
  variant?: string;
  tilt?: number;
}

export interface MoodDef {
  /** 0..1 darken the background. */
  dim?: number;
  /** 0..1 desaturate the background. */
  desaturate?: number;
  /** Color veil over the background. */
  veil?: string;
  veilAlpha?: number;
  /** Rainbow veil that slowly shifts. */
  spectrumVeil?: number;
  /** Tinted vignette color. */
  vignette?: string;
}

export interface CoreDef {
  /** Glow radius relative to planet radius. */
  size: number;
  /** 0..1 pulse amplitude. */
  pulse: number;
  pulseHz: number;
  color?: string;
  spectral?: boolean;
}

export interface AuraVfxDef {
  /** Max three ring layers (design rule from the prototype). */
  rings: RingDef[];
  emitters: EmitterDef[];
  core?: CoreDef;
  mood?: MoodDef;
  specials?: SpecialDef[];
  /** Overall motion speed multiplier. */
  tempo?: number;
}

// ---------------------------------------------------------------------------
// Cutscenes
// ---------------------------------------------------------------------------

export type CsLayerKind =
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

export interface CsLayer {
  kind: CsLayerKind;
  /** Size in symbol units (the base symbol is about 60 units wide). */
  r?: number;
  width?: number;
  /** Index into the cutscene palette, or 'spectrum'. */
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

export type CsBackdrop = 'none' | 'stars' | 'void' | 'streaks' | 'embers' | 'spectrum' | 'static' | 'snow' | 'blood';

export type CsClimax = 'none' | 'stall' | 'converge' | 'shatter' | 'pulse' | 'invert' | 'supernova' | 'rewind';

export interface CutsceneDef {
  layers: CsLayer[];
  /** Palette used by the layers (index 0 = primary). */
  palette: string[];
  backdrop: CsBackdrop;
  climax: CsClimax;
}

// ---------------------------------------------------------------------------
// Auras
// ---------------------------------------------------------------------------

export interface AuraColors {
  main: string;
  glow: string;
  accent?: string;
  /** Multi-color palette (layers / spectral auras). */
  palette?: string[];
}

export interface AuraDef {
  id: string;
  name: string;
  tier: TierId;
  /** Nominal "1 in X". For the fallback aura this value is replaced by the exact remainder. */
  odds: number;
  /** The most common aura; it is what you get when every rarer check fails. */
  fallback?: boolean;
  /** Only rollable while this biome is active. */
  biome?: string;
  /** Base sell price in Gold Coins. */
  sell: number;
  colors: AuraColors;
  /** Title tag shown above the planet while equipped. */
  title?: string;
  description: string;
  vfx: AuraVfxDef;
  cutscene?: CutsceneDef;
}

// ---------------------------------------------------------------------------
// Potions, items, shop
// ---------------------------------------------------------------------------

export interface Ingredient {
  aura: string;
  count: number;
}

export interface PotionEffect {
  /** Luck multiplier in the potion category (only the strongest potion counts). */
  luck?: number;
  /** Speed multiplier in the potion category (only the strongest potion counts). */
  speed?: number;
  /** Timed effect: seconds added per potion. */
  durationSec?: number;
  /** Charge based effect: rolls added per potion. */
  rolls?: number;
}

export interface PotionDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  ingredients: Ingredient[];
  effect: PotionEffect;
}

export type ShopTierId = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'divine';

export interface ShopTierDef {
  id: ShopTierId;
  name: string;
  color: string;
  /** Chance per rotation that an item of this tier is offered. */
  chance: number;
  minStock: number;
  maxStock: number;
}

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  shopTier: ShopTierId;
  price: number;
  description: string;
  kind: 'consumable' | 'equipment' | 'bundle';
  /** Can only be bought once, never re-appears once owned. */
  oneTime?: boolean;
  /** Consumable: additive bonuses (0.1 = +10 %) in the amulet category, timed. */
  use?: { luckAdd?: number; speedAdd?: number; durationSec: number };
  /** Equipment: bonuses while equipped. */
  equip?: { luckAdd?: number; speedAdd?: number; goldOnAura?: { aura: string; gold: number } };
  /** Bundle: grants potions immediately on purchase. */
  grants?: { potion: string; count: number };
}

export interface ShopConfig {
  rotationMinutes: number;
  tiers: ShopTierDef[];
}

// ---------------------------------------------------------------------------
// Crafting, rebirth, biomes, meta
// ---------------------------------------------------------------------------

export interface RecipeDef {
  id: string;
  result: string;
  count: number;
  ingredients: Ingredient[];
}

export interface RebirthLevelDef {
  level: number;
  name: string;
  gold: number;
  auras: Ingredient[];
  luck: number;
  speed: number;
  goldMult: number;
}

export type BiomeFx =
  | 'meteors'
  | 'solarStorm'
  | 'fog'
  | 'polar'
  | 'crystals'
  | 'bloodMoon'
  | 'supernova'
  | 'blackHole';

export interface BiomeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Relative weight when a weather slot is drawn. */
  weight: number;
  durationSec: number;
  luck: number;
  speed?: number;
  colors: { sky: string; accent: string; glow: string };
  fx: BiomeFx;
  /** Music mood: root note offset and brightness. */
  music: { root: number; bright: number };
}

export interface BiomeConfig {
  /** Length of one weather slot; at most one biome per slot. */
  slotSec: number;
  /** Weight of "no biome" in a slot. */
  clearWeight: number;
  biomes: BiomeDef[];
}

export type StatKey =
  | 'rolls'
  | 'discovered'
  | 'goldEarned'
  | 'sold'
  | 'brewed'
  | 'drunk'
  | 'crafted'
  | 'rebirths'
  | 'purchases'
  | 'cutscenes'
  | 'playMinutes'
  | 'biomesSeen'
  | 'luckyRolls';

export interface Reward {
  gold?: number;
  potions?: Record<string, number>;
  /** Permanent additive luck (0.02 = +2 %), achievement category. */
  luckAdd?: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition:
    | { type: 'stat'; stat: StatKey; value: number }
    | { type: 'tier'; tier: TierId }
    | { type: 'aura'; aura: string };
  reward: Reward;
}

export type QuestType = 'roll' | 'rollTier' | 'brew' | 'drink' | 'craft' | 'sellGold' | 'buy' | 'biomeRolls' | 'luckyRolls';

export interface QuestTemplate {
  id: string;
  /** Text with {n} placeholder for the target and {tier} for a tier name. */
  text: string;
  type: QuestType;
  target: number;
  tier?: TierId;
  reward: Reward;
}

export interface QuestChainDef {
  id: string;
  name: string;
  text: string;
  type: QuestType;
  tier?: TierId;
  /** Target for level n (0-based): round(base * growth^n). */
  base: number;
  growth: number;
  /** Gold reward for level n: round(gold * goldGrowth^n). */
  gold: number;
  goldGrowth: number;
  /** Extra potions granted every level. */
  potions?: Record<string, number>;
}

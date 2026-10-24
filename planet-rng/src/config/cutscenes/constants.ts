// Global cutscene settings. Per-cutscene timings live in the definitions (t1.ts, t2.ts, t3.ts).

export const CUTSCENE = {
  /** Default tier by odds ("1 in X"); an aura can override it with `cutsceneTier`. */
  tiers: { t1: 10_000, t2: 1_000_000, t3: 100_000_000 },
  /** Expected duration range per tier (seconds until the reveal handover). */
  durations: { 1: [12, 16], 2: [17, 23], 3: [24, 41] } as Record<1 | 2 | 3, [number, number]>,
  skip: {
    /** The skip button appears after this many seconds. */
    showAfter: 2,
    /** Holding a finger/mouse this long anywhere skips. */
    holdSeconds: 0.6,
    /** Aura-coloured flash when a skip lands on the reveal. */
    flashSeconds: 0.45,
  },
  /** Back from a hidden tab after more than this many seconds: jump to the reveal. */
  hiddenJumpSeconds: 2,
  /** The overlay fades out over this many seconds after the handover. */
  tailSeconds: { whiteout: 0.7, edgeglow: 0.6, cut: 0.15 },
  /** Accessibility: at most this many flashes or inversions in any 1 s window. */
  flashLimitPerSecond: 3,
  /** Render resolution cap. */
  maxDpr: 2,
  /** Particle / fog / shard multipliers per quality. */
  quality: {
    low: { particles: 0.4, fog: -2, pieces: 0.4, lens: false },
    medium: { particles: 0.7, fog: -1, pieces: 0.7, lens: false },
    high: { particles: 1, fog: 0, pieces: 1, lens: true },
  },
  /** Audio scheduling lookahead in seconds. */
  lookahead: 0.3,
  /** Reduced flashes: hard flashes become soft tints at this fraction of their peak. */
  reducedFlashPeak: 0.25,
  /** Selectable thresholds for "Cutscenes bis Seltenheit … überspringen" (0 = none). */
  skipBelowOptions: [0, 100_000, 1_000_000, 10_000_000, 100_000_000] as const,
};

/** Default tier of an aura with these odds. */
export function tierByOdds(odds: number): 1 | 2 | 3 {
  if (odds >= CUTSCENE.tiers.t3) return 3;
  if (odds >= CUTSCENE.tiers.t2) return 2;
  return 1;
}

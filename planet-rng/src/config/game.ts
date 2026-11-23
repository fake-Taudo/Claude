// Global timings and tuning knobs.

export const GAME = {
  title: 'Planet RNG',
  version: '1.0.0',

  roll: {
    /** Base duration of one roll in ms. */
    baseMs: 900,
    /** Auto roll is 25 % slower than manual rolling. */
    autoFactor: 1.25,
    /** Quick roll cycle relative to the normal cycle (1 = same throughput, no suspense, no animation). */
    quickFactor: 1,
    /** Every n-th roll is a lucky roll. */
    luckyEvery: 10,
    luckyMultiplier: 2,
    /** Minimum roll duration regardless of speed bonuses. */
    minMs: 200,
  },

  reveal: {
    /** Fallback reveal banner duration (tiers override). */
    bannerMs: 2600,
    /** Recently rolled history length. */
    historyLength: 12,
  },

  admin: {
    /** Typing this code anywhere (or entering it in the settings) opens the admin menu. */
    code: 'STERNENSTAUB',
  },

  cutscene: {
    /** Auras from this "1 in X" upward get a cutscene. */
    minOdds: 10000,
    blackMs: 3000,
    growMs: 10000,
    /** Symbol fills the screen while the white flash rises. */
    fillMs: 500,
    /** White fades out to reveal the aura. */
    revealMs: 700,
    /** Rotation speed at the start and the end of the grow phase (deg/s). */
    rotStartDegPerSec: 110,
    rotEndDegPerSec: 260,
    /** Shape of the acceleration curve, tuned so the symbol turns about 5.5 times. */
    rotCurve: 0.705,
    /** Symbol scale at start and end of the grow phase, relative to min(viewport) / 60. */
    scaleFrom: 0.05,
    scaleTo: 0.5,
  },

  offline: {
    /** While the tab is hidden, auto roll continues at this efficiency (caught up on return). */
    hiddenEfficiency: 1,
    /** While the game is closed, auto roll continues at this efficiency. */
    closedEfficiency: 0.5,
    /** Upper bound for offline / hidden catch-up. */
    maxHours: 8,
    /** Ignore gaps shorter than this. */
    minSeconds: 20,
  },

  save: {
    key: 'planet-rng.save',
    backupKey: 'planet-rng.save.backup',
    corruptKey: 'planet-rng.save.corrupt',
    settingsKey: 'planet-rng.settings',
    autosaveMs: 5000,
    backupEveryMs: 120000,
    exportPrefix: 'PRNG1',
  },

  feed: {
    /** Simulated NPC drops are at least this rare. */
    npcMinOdds: 1000,
    /** Seconds between simulated messages. */
    intervalSec: [7, 20] as [number, number],
    /** Own drops of this tier rank or higher are posted. */
    ownMinRank: 4,
    visibleMs: 7000,
  },

  quests: {
    /** Gold rewards are fixed; the rebirth gold multiplier is not applied. */
    dailyResetHour: 0,
  },

  ui: {
    toastMs: 2800,
    maxToasts: 3,
  },
} as const;

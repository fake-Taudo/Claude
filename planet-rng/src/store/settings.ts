// Player preferences. Stored separately from the game state so that deleting the
// save keeps volume and display preferences.

export type VfxQuality = 'low' | 'medium' | 'high';

export interface Settings {
  showReveal: boolean;
  cutscenes: boolean;
  cutsceneSkip: boolean;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
  vfxQuality: VfxQuality;
  reducedEffects: boolean;
  vibration: boolean;
  feed: boolean;
  quickRoll: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  showReveal: true,
  cutscenes: true,
  cutsceneSkip: false,
  masterVolume: 0.8,
  sfxVolume: 0.8,
  musicVolume: 0.35,
  muted: false,
  vfxQuality: 'high',
  reducedEffects: false,
  vibration: true,
  feed: true,
  quickRoll: false,
};

export function sanitizeSettings(raw: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS };
  if (typeof raw !== 'object' || raw === null) return s;
  const r = raw as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const def = DEFAULT_SETTINGS[key];
    const v = r[key];
    if (typeof def === 'boolean' && typeof v === 'boolean') (s[key] as boolean) = v;
    if (typeof def === 'number' && typeof v === 'number' && Number.isFinite(v)) (s[key] as number) = Math.min(1, Math.max(0, v));
  }
  if (r.vfxQuality === 'low' || r.vfxQuality === 'medium' || r.vfxQuality === 'high') s.vfxQuality = r.vfxQuality;
  return s;
}

/** Sensible first-run defaults for the device. */
export function deviceDefaults(): Partial<Settings> {
  const out: Partial<Settings> = {};
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) out.reducedEffects = true;
    const cores = navigator.hardwareConcurrency ?? 8;
    const small = Math.min(window.innerWidth, window.innerHeight) < 500;
    if (cores <= 4) out.vfxQuality = 'low';
    else if (small && cores <= 6) out.vfxQuality = 'medium';
  } catch {
    /* ignore */
  }
  return out;
}

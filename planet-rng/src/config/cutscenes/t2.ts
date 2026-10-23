// T2 cutscenes (1 in 1.000.000 to 1 in 100.000.000). Until each gets its own design, the
// prototype flow runs on the new engine.

import { SYMBOLS } from './symbols';
import { t1 } from './template';
import type { CutsceneDef } from './types';

/** The prototype flow (Kreis-Stern, white-out) for an aura that has no own design yet. */
export function prototype(aura: string, tier: 1 | 2 | 3): CutsceneDef {
  const pal = SYMBOLS[aura].palette;
  const def = t1({
    aura,
    theme: { primary: pal[0], secondary: pal[1 % pal.length], fog: pal[1 % pal.length], dark: '#05040a' },
    fog: false,
    pulse: false,
    edge: false,
    brk: { name: 'Weißblende', at: 13, tracks: [] },
  });
  return { ...def, tier };
}

export const T2: CutsceneDef[] = ['multiversum', 'kosmischesnetz', 'urknall', 'ursuppe', 'entropie', 'waermetod', 'paradoxon', 'moebius'].map((id) => prototype(id, 2));

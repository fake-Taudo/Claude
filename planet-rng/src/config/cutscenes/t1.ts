// T1 cutscenes (1 in 10.000 to 1 in 1.000.000): the Kreis-Stern template with an own motif,
// particles, pulse symbol and one small break per aura.

import { SYMBOLS } from './symbols';
import { t1 } from './template';
import type { CutsceneDef } from './types';

/** Placeholder until every aura has its own design: the prototype flow on the new engine. */
function prototype(aura: string, tier: 1 | 2 | 3): CutsceneDef {
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

export const T1: CutsceneDef[] = [
  ...['singularitaet', 'akkretion', 'blutmond', 'seraph', 'zeitriss', 'ewigkeit', 'chronosphaere', 'ereignishorizont', 'quasar', 'supernova', 'andromeda', 'magnetar'].map((id) => prototype(id, 1)),
  ...['multiversum', 'kosmischesnetz', 'urknall', 'ursuppe', 'entropie', 'waermetod', 'paradoxon', 'moebius'].map((id) => prototype(id, 2)),
  ...['omniversum', 'schoepfung', 'nullpunkt', 'archetyp', 'aeon', 'weltenkern'].map((id) => prototype(id, 3)),
];

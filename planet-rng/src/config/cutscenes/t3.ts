// T3 cutscenes (from 1 in 100.000.000): own scripted mini films with music and beats.

import { prototype } from './t2';
import type { CutsceneDef } from './types';

export const T3: CutsceneDef[] = ['omniversum', 'schoepfung', 'nullpunkt', 'archetyp', 'aeon', 'weltenkern'].map((id) => prototype(id, 3));

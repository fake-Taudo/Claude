// Registers every hero kind (imported once by the renderer).

import { registerHeroes } from './index';
import { HEROES_V0_V2 } from './v0-v2';
import { HEROES_V3_V4 } from './v3-v4';

registerHeroes(HEROES_V0_V2);
registerHeroes(HEROES_V3_V4);

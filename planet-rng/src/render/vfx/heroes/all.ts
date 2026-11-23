// Registers every hero kind (imported once by the renderer).

import { registerHeroes } from './index';
import { HEROES_V0_V2 } from './v0-v2';
import { HEROES_V3_V4 } from './v3-v4';
import { HEROES_V5 } from './v5';
import { HEROES_V6 } from './v6';

registerHeroes(HEROES_V0_V2);
registerHeroes(HEROES_V3_V4);
registerHeroes(HEROES_V5);
registerHeroes(HEROES_V6);

// Connects the audio engine to the game: unlock on first gesture, react to bus events.

import { AURA_BY_ID, BIOME_BY_ID, GAME, tierOf } from '../config';
import { activeBiome } from '../core/biomes';
import type { GameStore } from '../store/store';
import { registerSfx } from '../ui/sound';
import { AudioEngine } from './engine';

export let audio: AudioEngine | null = null;

export function initAudio(game: GameStore): AudioEngine {
  const engine = new AudioEngine(game.settings);
  audio = engine;

  const unlock = () => {
    engine.unlock();
    const b = activeBiome(Date.now());
    if (b) engine.setBiome(b.music.root, b.music.bright);
  };
  for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, unlock, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) engine.suspend();
    else engine.resume();
  });

  registerSfx((name) => engine.ui(name));
  game.bus.on('settings', (s) => engine.apply(s));

  game.bus.on('rollStart', (e) => {
    engine.roll();
    const rank = tierOf(AURA_BY_ID[e.aura]).rank;
    if (!e.quick && rank >= 4 && e.suspenseMs > 0) engine.riser(e.duration / 1000, rank);
  });

  game.bus.on('reveal', (e) => {
    const rank = tierOf(AURA_BY_ID[e.aura]).rank;
    engine.stinger(rank, e.afterCutscene);
  });

  game.bus.on('cutscene', (e) => {
    const aura = AURA_BY_ID[e.aura];
    const tier = tierOf(aura);
    if (e.phase === 'start') {
      engine.setDuck(true);
      const c = GAME.cutscene;
      const total = (c.blackMs + c.growMs + tier.staging.cutsceneExtraMs + c.fillMs) / 1000;
      engine.cutsceneStart(total, tier.rank);
    } else if (e.phase === 'end') {
      engine.setDuck(false);
    }
  });

  game.bus.on('game', (e) => {
    switch (e.type) {
      case 'sold':
        engine.ui('sell');
        break;
      case 'bought':
        engine.ui('buy');
        break;
      case 'brewed':
        engine.ui('brew');
        break;
      case 'crafted':
        engine.ui('craft');
        break;
      case 'drunk':
      case 'itemUsed':
        engine.ui('drink');
        break;
      case 'itemEquipChanged':
        engine.ui('equip');
        break;
      case 'achievement':
        engine.ui('achievement');
        break;
      case 'questClaimed':
        engine.ui('claim');
        break;
      case 'questReady':
        engine.ui('quest');
        break;
      case 'rebirth':
        engine.ui('rebirth');
        break;
      case 'biomeChanged': {
        const b = e.biome ? BIOME_BY_ID[e.biome] : null;
        engine.setBiome(b?.music.root ?? 0, b?.music.bright ?? 0.45);
        if (b) engine.ui('biome');
        break;
      }
      default:
        break;
    }
  });
  return engine;
}

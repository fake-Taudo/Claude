// Application singletons. Created once by main.tsx via initApp().

import { GameStore } from '../store/store';
import { Persistence, getStorage } from '../store/persistence';
import { UiStore } from '../store/ui';
import { RollController } from './controller';
import { Lifecycle } from './lifecycle';

export let game: GameStore;
export let ui: UiStore;
export let controller: RollController;
export let lifecycle: Lifecycle;
export let persistence: Persistence;
export let storagePersistent = true;
export let loadWarning: string | undefined;
export let isNewGame = false;

export function initApp(): void {
  const { storage, persistent } = getStorage();
  storagePersistent = persistent;
  persistence = new Persistence(storage);
  const loaded = persistence.load(Date.now());
  loadWarning = loaded.warning;
  isNewGame = loaded.isNew;
  game = new GameStore(loaded.state, persistence.loadSettings(), persistence);
  ui = new UiStore();
  controller = new RollController(game, ui);
  lifecycle = new Lifecycle(game, ui, controller);
}

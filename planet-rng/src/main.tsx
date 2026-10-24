import { render } from 'preact';
import './ui/styles/tokens.css';
import './ui/styles/app.css';
import * as app from './game/app';
import * as engine from './core/engine';
import { App, stageRef } from './ui/App';
import { AURAS } from './config';
import { loadFonts } from './ui/fonts';
import { initNotifier } from './ui/notify';
import { initAudio } from './audio';
import { CutsceneRunner, GlobalEcho } from './render/cutscene';
import { textureStats } from './render/vfx/tex';
import { setStageCover } from './render/stage';

function boot(): void {
  loadFonts();
  app.initApp();
  initNotifier();
  app.lifecycle.restore();
  app.lifecycle.start();
  const audio = initAudio(app.game);
  const cutscenes = new CutsceneRunner(app.game, document.getElementById('app')!, audio);
  const echo = new GlobalEcho(app.game, audio);
  cutscenes.onHandover = (def) => echo.play(def);
  setStageCover(() => cutscenes.covering);
  app.controller.cutscenes = cutscenes;
  render(<App />, document.getElementById('app')!);
  if (app.loadWarning) app.ui.pushToast({ text: app.loadWarning, kind: 'warn', icon: 'info' });
  if (app.game.state.auto) app.controller.resume();

  // Test hook (only with ?debug in the URL): lets the smoke test set up states quickly.
  if (/[?&#]debug/.test(location.search + location.hash)) {
    (window as unknown as Record<string, unknown>).__prng = { ...app, game: app.game, ui: app.ui, controller: app.controller, engine };
    (window as unknown as Record<string, unknown>).__prngIds = AURAS.map((a) => a.id);
    (window as unknown as Record<string, unknown>).__prngStage = stageRef;
    (window as unknown as Record<string, unknown>).__prngCutscene = cutscenes;
    (window as unknown as Record<string, unknown>).__prngAudio = audio;
    (window as unknown as Record<string, unknown>).__prngTextures = textureStats;
  }
}

boot();

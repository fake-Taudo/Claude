import { render } from 'preact';
import './ui/styles/tokens.css';
import './ui/styles/app.css';
import * as app from './game/app';
import * as engine from './core/engine';
import { App } from './ui/App';
import { loadFonts } from './ui/fonts';
import { initNotifier } from './ui/notify';

function boot(): void {
  loadFonts();
  app.initApp();
  initNotifier();
  app.lifecycle.restore();
  app.lifecycle.start();
  render(<App />, document.getElementById('app')!);
  if (app.loadWarning) app.ui.pushToast({ text: app.loadWarning, kind: 'warn', icon: 'info' });
  if (app.game.state.auto) app.controller.resume();

  // Test hook (only with ?debug in the URL): lets the smoke test set up states quickly.
  if (/[?&#]debug/.test(location.search + location.hash)) {
    (window as unknown as Record<string, unknown>).__prng = { ...app, game: app.game, ui: app.ui, controller: app.controller, engine };
  }
}

boot();

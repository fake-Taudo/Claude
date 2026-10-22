import { useEffect, useRef } from 'preact/hooks';
import { controller, game, ui } from '../game/app';
import { Stage } from '../render/stage';
import { UiFx } from '../render/uifx';
import { Hud } from './Hud';
import { useUi } from './hooks';
import { Overlays } from './Overlays';
import { InventoryPanel } from './panels/Inventory';
import { SettingsPanel } from './panels/Settings';
import { ShopPanel } from './panels/Shop';
import { EffectsPanel } from './panels/Effects';
import { ForgePanel, PotionsPanel } from './panels/Crafting';
import { RebirthPanel } from './panels/Rebirth';
import { QuestsPanel } from './panels/Quests';
import { Feed } from './Feed';
import { Tutorial } from './Tutorial';
import { Nameplate, Reveal, RollNames, ScreenFx } from './Reveal';
import { RollControls } from './RollControls';
import { MENU, Sidebar } from './Sidebar';
import { sfx } from './sound';

export let stage: Stage | null = null;
export const stageRef = () => stage;

function StageCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const root = document.getElementById('app')!;
    stage = new Stage(ref.current!, root, game);
    stage.start();
    return () => stage?.destroy();
  }, []);
  return <canvas ref={ref} class="stage" aria-hidden="true" />;
}

function FxCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    new UiFx(ref.current!, game);
  }, []);
  return <canvas ref={ref} class="fx-canvas" aria-hidden="true" />;
}

function Panels() {
  const u = useUi();
  switch (u.panel) {
    case 'inventory':
      return <InventoryPanel />;
    case 'settings':
      return <SettingsPanel />;
    case 'shop':
      return <ShopPanel />;
    case 'effects':
      return <EffectsPanel />;
    case 'potions':
      return <PotionsPanel />;
    case 'forge':
      return <ForgePanel />;
    case 'rebirth':
      return <RebirthPanel />;
    case 'quests':
      return <QuestsPanel />;
    default:
      return null;
  }
}

function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Escape') {
        if (ui.dialog || ui.modal || ui.auraDetail || ui.popover || ui.panel) {
          sfx('close');
          ui.close();
        }
        return;
      }
      if (ui.dialog || ui.modal) return;
      if (e.code === 'Space') {
        e.preventDefault();
        controller.roll(false);
        return;
      }
      const key = e.key.toUpperCase();
      if (key === 'A') return controller.toggleAuto();
      if (key === 'Q') return controller.toggleQuick();
      if (key === 'O') return ui.panel === 'settings' ? ui.close() : ui.open('settings');
      const m = MENU.find((x) => x.key === key);
      if (m) {
        sfx('open');
        const active = ui.panel === m.panel && (!m.tab || ui.tab[m.panel] === m.tab);
        if (active) ui.close();
        else ui.open(m.panel, m.tab);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/** Mirrors the "reduce effects" setting as a CSS class (stops pulsing, wiggling, rotating UI). */
function useReducedClass() {
  useEffect(() => {
    const apply = () => document.querySelector('.game-root')?.classList.toggle('reduced', game.settings.reducedEffects);
    apply();
    return game.bus.on('settings', apply);
  }, []);
}

export function App() {
  useKeyboard();
  useReducedClass();
  return (
    <div class="game-root">
      <StageCanvas />
      <Nameplate />
      <RollNames />
      <Hud />
      <Feed />
      <Sidebar />
      <Reveal />
      <RollControls />
      <Panels />
      <Overlays />
      <ScreenFx />
      <FxCanvas />
      <Tutorial />
    </div>
  );
}

// Short, skippable first-run tutorial with a non-blocking spotlight.

import { useEffect, useState } from 'preact/hooks';
import { game, ui } from '../game/app';
import { Btn } from './common';
import { useGame, useUi } from './hooks';

interface Step {
  target: string;
  text: string;
  /** Advances automatically when this returns true. */
  done?: () => boolean;
  next?: string;
}

const STEPS: Step[] = [
  {
    target: '[data-testid=btn-roll]',
    text: 'Willkommen bei Planet RNG! Tippe auf ROLL, um deine erste Aura zu würfeln. Je seltener die Aura, desto größer die Show.',
    done: () => game.state.stats.rolls >= 1,
  },
  {
    target: '.nameplate',
    text: 'Deine erste Aura wurde automatisch ausgerüstet und umkreist jetzt deinen Planeten. Jeder 10. Roll hat doppeltes Glück.',
    next: 'Weiter',
  },
  {
    target: '[data-testid=menu-inventory]',
    text: 'Im Inventar liegen alle gerollten Auren. Öffne es!',
    done: () => ui.panel === 'inventory',
  },
  {
    target: '.panel .aura-card',
    text: 'Antippen rüstet eine Aura aus. Über den Münz-Knopf verkaufst du Auren für Gold Coins, der Stern sperrt Auren, die du behalten willst.',
    next: 'Verstanden',
  },
  {
    target: '[data-testid=menu-shop]',
    text: 'Mit Gold Coins kaufst du beim Händler Glücks- und Tempo-Boosts. Das Angebot wechselt alle 5 Minuten.',
    done: () => ui.panel === 'shop',
    next: 'Weiter',
  },
  {
    target: '[data-testid=btn-auto]',
    text: 'Auto Roll würfelt für dich weiter – sogar, wenn du kurz weg bist. Viel Glück auf deiner Jagd nach den seltensten Auren!',
    next: "Los geht's",
  },
];

function rectOf(sel: string): DOMRect | null {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 ? r : null;
}

export function Tutorial() {
  const state = useGame();
  const u = useUi();
  const [, setTick] = useState(0);
  const t = state.tutorial;
  const step = STEPS[t.step];

  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 300);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!t.done && step?.done?.()) advance();
  });

  if (t.done || !step || u.cutsceneActive) return null;

  function advance() {
    const s = game.state.tutorial;
    if (s.step >= STEPS.length - 1) game.state.tutorial = { done: true, step: STEPS.length };
    else game.state.tutorial = { done: false, step: s.step + 1 };
    if (game.state.tutorial.step === 4 && ui.panel === 'inventory') ui.close();
    game.touch();
  }

  function skip() {
    game.state.tutorial = { done: true, step: STEPS.length };
    game.touch();
  }

  const rect = rectOf(step.target);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 8;
  const below = rect ? rect.top + rect.height / 2 < vh / 2 : true;
  const bubbleTop = rect ? (below ? Math.min(vh - 190, rect.bottom + 14) : Math.max(8, rect.top - 14)) : vh / 2;
  return (
    <div class="tutorial" data-testid="tutorial">
      {rect && <div class="tutorial__spot" style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />}
      <div class={`tutorial__bubble${below ? '' : ' is-above'}`} style={{ top: bubbleTop, left: Math.max(12, Math.min(vw - 332, (rect ? rect.left + rect.width / 2 : vw / 2) - 160)) }}>
        <div class="tutorial__step">
          Tutorial {t.step + 1}/{STEPS.length}
        </div>
        <p>{step.text}</p>
        <div class="tutorial__actions">
          <button type="button" class="link" onClick={skip} data-testid="tutorial-skip">
            Überspringen
          </button>
          {step.next && (
            <Btn size="sm" onClick={advance} data-testid="tutorial-next">
              {step.next}
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

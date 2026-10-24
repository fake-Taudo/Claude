import { AURA_BY_ID, TIER_BY_ID } from '../config';
import { isNextRollLucky, rollsUntilLucky } from '../core/modifiers';
import { controller, ui } from '../game/app';
import { AuraOrb, css } from './common';
import { useController, useGame } from './hooks';
import { Icon } from './icons';
import { sfx } from './sound';

export function RollControls() {
  const state = useGame();
  const c = useController();
  const lucky = isNextRollLucky(state);
  const until = rollsUntilLucky(state);
  const busy = c.phase !== 'idle';
  const blocked = c.phase === 'cutscene';
  const showProgress = c.phase === 'rolling' || c.phase === 'cooldown';

  let hint: string;
  if (blocked) hint = 'Cutscene läuft …';
  else if (c.auto) hint = c.quick ? 'Auto Roll aktiv · Quick' : 'Auto Roll aktiv (25 % langsamer)';
  else if (lucky) hint = 'Nächster Roll: 2x Glück!';
  else hint = `Noch ${until} Rolls bis 2x Glück`;

  return (
    <div class="roll-area">
      <History />
      <div class="roll-row">
        <button
          type="button"
          class={`side-toggle side-toggle--auto${c.auto ? ' is-on' : ''}`}
          onClick={() => {
            sfx('toggle');
            controller.toggleAuto();
          }}
          aria-pressed={c.auto}
          title="Auto Roll (A)"
          data-testid="btn-auto"
        >
          <Icon name="auto" size={24} />
          <span>{c.auto ? 'AUTO AN' : 'AUTO'}</span>
        </button>
        <button
          type="button"
          class={`roll-btn${lucky ? ' is-lucky' : ''}${busy ? ' is-busy' : ''}${blocked ? ' is-blocked' : ''}`}
          disabled={blocked}
          onClick={() => {
            if (!controller.roll(false) && !blocked) sfx('error');
          }}
          title="Rollen (Leertaste)"
          data-testid="btn-roll"
        >
          {showProgress && <span key={`${c.cycleStart}`} class="roll-btn__progress" style={css({ '--dur': `${c.cycleMs}ms` })} />}
          <span class="roll-btn__label">{busy && c.phase === 'rolling' ? '· · ·' : 'ROLL'}</span>
          {lucky && !busy && <span class="roll-btn__sub">2x GLÜCK</span>}
        </button>
        <button
          type="button"
          class={`side-toggle side-toggle--quick${c.quick ? ' is-on' : ''}`}
          onClick={() => {
            sfx('toggle');
            controller.toggleQuick();
          }}
          aria-pressed={c.quick}
          title="Quick Roll: überspringt die Roll-Animation (Q)"
          data-testid="btn-quick"
        >
          <Icon name="quick" size={24} />
          <span>{c.quick ? 'QUICK AN' : 'QUICK'}</span>
        </button>
      </div>
      <div class={`roll-hint${lucky && !c.auto ? ' is-lucky' : ''}`} data-testid="roll-hint">
        {hint}
      </div>
    </div>
  );
}

function History() {
  const state = useGame();
  const narrow = typeof window !== 'undefined' && window.innerWidth < 430;
  const items = state.history.slice(0, narrow ? 5 : 6);
  if (!items.length) return <div class="history history--empty" />;
  return (
    <div class="history" data-testid="history">
      {items.map((h, i) => {
        const a = AURA_BY_ID[h.aura];
        if (!a) return null;
        return (
          <button
            type="button"
            key={`${h.at}-${i}`}
            class={`history__chip${i === 0 ? ' is-new' : ''}`}
            style={css({ '--c': TIER_BY_ID[a.tier].color, opacity: 1 - i * 0.12 })}
            title={`${a.name} – ${TIER_BY_ID[a.tier].name}`}
            onClick={() => ui.open('inventory', 'auras')}
          >
            <AuraOrb aura={a} size={14} />
            {(!narrow || i < 3) && <span>{a.name}</span>}
            {h.lucky && <Icon name="clover" size={12} />}
          </button>
        );
      })}
    </div>
  );
}

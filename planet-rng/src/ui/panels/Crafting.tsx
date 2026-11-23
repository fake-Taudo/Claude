import { AURA_BY_ID, POTIONS, RECIPES, TIER_BY_ID, type Ingredient } from '../../config';
import { brewPotion, craftRecipe, maxCraftable, usableCount } from '../../core/engine';
import { formatInt, formatOdds } from '../../core/format';
import { displayOdds } from '../../core/odds';
import type { GameState } from '../../core/state';
import { game, ui } from '../../game/app';
import { AuraOrb, Btn, css, Panel, TierTag } from '../common';
import { useGame } from '../hooks';
import { Icon } from '../icons';
import { stackNote } from './Inventory';
import { PotionIcon } from './itemIcons';

function Ingredients({ list, state }: { list: Ingredient[]; state: GameState }) {
  return (
    <div class="ingredients">
      {list.map((ing) => {
        const aura = AURA_BY_ID[ing.aura];
        const have = usableCount(state, ing.aura);
        const locked = !!state.locked[ing.aura] && (state.auras[ing.aura] ?? 0) > 0;
        const ok = have >= ing.count;
        const known = !!state.discovered[ing.aura];
        return (
          <span key={ing.aura} class={`ing${ok ? ' is-ok' : ' is-missing'}`} style={css({ '--c': TIER_BY_ID[aura.tier].color })} title={locked ? `${aura.name} ist gesperrt und wird nicht verbraucht` : aura.name}>
            <AuraOrb aura={aura} size={18} unknown={!known} />
            <span class="ing__name">{known ? aura.name : '???'}</span>
            <span class="ing__count">
              {formatInt(Math.min(have, 99999))}/{ing.count}
            </span>
            {locked && <Icon name="lock" size={12} />}
          </span>
        );
      })}
    </div>
  );
}

function ask(count: number, label: string, run: () => void): void {
  if (count <= 1) return run();
  ui.confirm({ title: `${count}× ${label}?`, body: `Dafür werden die Zutaten für ${count} Durchgänge verbraucht.`, confirm: `${count}× ${label}`, onConfirm: run });
}

export function PotionsPanel() {
  const state = useGame();
  return (
    <Panel id="potions" title="Tränke-Werkstatt" icon="flask" color="#3fd77a" subtitle="Brauen verbraucht Auren und legt den Trank in deinen Vorrat.">
      <p class="hint-line">
        Getrunken wird im Inventar unter{' '}
        <button type="button" class="link" onClick={() => ui.open('inventory', 'potions')}>
          Tränke
        </button>
        . Gesperrte Auren werden nie verbraucht.
      </p>
      <div class="list">
        {POTIONS.map((p) => {
          const max = maxCraftable(state, p.ingredients);
          const stash = state.potions[p.id] ?? 0;
          const brew = (n: number) => (e: MouseEvent) =>
            ask(n, 'brauen', () => {
              const ev = game.apply((s, ctx) => brewPotion(s, p.id, n, ctx.now), 'now');
              if (!ev.some((x) => x.type === 'error')) {
                game.bus.emit('fx', { kind: 'brew', x: e.clientX, y: e.clientY, color: p.color, amount: 18 });
                game.toast({ text: `${n}× ${p.name} gebraut – im Vorrat.`, kind: 'success', icon: 'flask', color: p.color });
              }
            });
          return (
            <div key={p.id} class={`list-row craft-row${max > 0 ? ' is-ready' : ''}`} style={css({ '--c': p.color })} data-testid={`recipe-${p.id}`}>
              <PotionIcon id={p.id} size={54} />
              <div class="list-row__main">
                <div class="list-row__title">
                  {p.name} {stash > 0 && <span class="count-pill">im Vorrat: {stash}</span>}
                </div>
                <div class="list-row__desc">{p.description}</div>
                <div class="list-row__meta">{stackNote(p.id)}</div>
                <Ingredients list={p.ingredients} state={state} />
              </div>
              <div class="list-row__actions">
                <Btn size="sm" variant="success" disabled={max < 1} onClick={brew(1)} data-testid={`brew-${p.id}`}>
                  Brauen
                </Btn>
                {max > 1 && (
                  <Btn size="sm" variant="ghost" onClick={brew(max)}>
                    Max ({max})
                  </Btn>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function ForgePanel() {
  const state = useGame();
  return (
    <Panel id="forge" title="Aura-Schmiede" icon="anvil" color="#ff7a3d" subtitle="Verwandle mehrere Auren in eine andere. Geschmiedete Auren zählen nicht als Roll.">
      <div class="list">
        {RECIPES.map((r) => {
          const aura = AURA_BY_ID[r.result];
          const max = maxCraftable(state, r.ingredients);
          const known = !!state.discovered[aura.id];
          const craft = (n: number) => (e: MouseEvent) =>
            ask(n, 'schmieden', () => {
              const ev = game.apply((s, ctx) => craftRecipe(s, r.id, n, ctx.now), 'now');
              if (!ev.some((x) => x.type === 'error')) {
                game.bus.emit('fx', { kind: 'craft', x: e.clientX, y: e.clientY, color: aura.colors.glow, amount: 20 });
                game.toast({ text: `${n * r.count}× ${aura.name} geschmiedet.`, kind: 'success', icon: 'anvil', color: TIER_BY_ID[aura.tier].color });
              }
            });
          return (
            <div key={r.id} class={`list-row craft-row${max > 0 ? ' is-ready' : ''}`} style={css({ '--c': TIER_BY_ID[aura.tier].color })} data-testid={`recipe-${r.id}`}>
              <AuraOrb aura={aura} size={54} unknown={!known} />
              <div class="list-row__main">
                <div class="list-row__title">
                  {r.count > 1 ? `${r.count}× ` : ''}
                  {known ? aura.name : '???'} <TierTag tierId={aura.tier} small />
                </div>
                <div class="list-row__desc">
                  {formatOdds(displayOdds(aura))} · im Besitz: {formatInt(state.auras[aura.id] ?? 0)}
                </div>
                <Ingredients list={r.ingredients} state={state} />
              </div>
              <div class="list-row__actions">
                <Btn size="sm" variant="primary" disabled={max < 1} onClick={craft(1)} data-testid={`craft-${r.id}`}>
                  Schmieden
                </Btn>
                {max > 1 && (
                  <Btn size="sm" variant="ghost" onClick={craft(max)}>
                    Max ({max})
                  </Btn>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p class="hint-line forge-note">Weitere Rezepte lassen sich in der Konfiguration ergänzen.</p>
    </Panel>
  );
}

import { AURAS, POTIONS, RECIPES } from '../config';
import { checkRebirth, maxCraftable } from '../core/engine';
import { isBuffActive } from '../core/modifiers';
import { claimableCount } from './panels/questsUtil';
import { rotationIndex } from '../core/shop';
import { ui } from '../game/app';
import type { PanelId } from '../store/ui';
import { css } from './common';
import { useGame, useNow, useUi } from './hooks';
import { Icon, type IconName } from './icons';
import { sfx } from './sound';

interface Entry {
  panel: PanelId;
  tab?: string;
  label: string;
  icon: IconName;
  color: string;
  key: string;
  testid: string;
}

export const MENU: Entry[] = [
  { panel: 'inventory', tab: 'auras', label: 'Inventar', icon: 'bag', color: '#8f6bff', key: 'I', testid: 'menu-inventory' },
  { panel: 'inventory', tab: 'index', label: 'Index', icon: 'book', color: '#4a8dff', key: 'C', testid: 'menu-index' },
  { panel: 'shop', label: 'Shop', icon: 'shop', color: '#ffb340', key: 'S', testid: 'menu-shop' },
  { panel: 'forge', label: 'Schmiede', icon: 'anvil', color: '#ff7a3d', key: 'F', testid: 'menu-forge' },
  { panel: 'potions', label: 'Tränke', icon: 'flask', color: '#3fd77a', key: 'P', testid: 'menu-potions' },
  { panel: 'effects', label: 'Effekte', icon: 'sparkles', color: '#3fc8e8', key: 'E', testid: 'menu-effects' },
  { panel: 'rebirth', label: 'Rebirth', icon: 'rebirth', color: '#ff5ab4', key: 'R', testid: 'menu-rebirth' },
  { panel: 'quests', label: 'Quests', icon: 'scroll', color: '#f5c22a', key: 'U', testid: 'menu-quests' },
];

export function Sidebar() {
  const state = useGame();
  const u = useUi();
  const now = useNow(1000);

  const badges: Record<string, number | string | null> = {
    'menu-index': AURAS.filter((a) => state.discovered[a.id] && !state.discovered[a.id].seen).length || null,
    'menu-shop': state.shop.seen !== rotationIndex(now) ? '!' : null,
    'menu-forge': RECIPES.filter((r) => maxCraftable(state, r.ingredients) > 0).length || null,
    'menu-potions': POTIONS.filter((p) => maxCraftable(state, p.ingredients) > 0).length || null,
    'menu-effects': state.buffs.filter((b) => isBuffActive(b, now)).length || null,
    'menu-rebirth': checkRebirth(state).ready ? '!' : null,
    'menu-quests': claimableCount(state) || null,
  };

  return (
    <nav class="sidebar" aria-label="Menü">
      {MENU.map((m) => {
        const active = u.panel === m.panel && (!m.tab || (u.tab[m.panel] ?? 'auras') === m.tab);
        return (
          <button
            key={m.testid}
            type="button"
            class={`side-btn${active ? ' is-active' : ''}`}
            style={css({ '--c': m.color })}
            title={`${m.label} (${m.key})`}
            data-testid={m.testid}
            onClick={() => {
              sfx('open');
              if (active) ui.close();
              else ui.open(m.panel, m.tab);
            }}
          >
            <span class="side-btn__tile">
              <Icon name={m.icon} size={24} />
              {badges[m.testid] ? <span class="badge">{badges[m.testid]}</span> : null}
            </span>
            <span class="side-btn__label">{m.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

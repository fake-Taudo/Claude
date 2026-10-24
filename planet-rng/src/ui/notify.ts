// Turns game events into toasts and UI sounds.

import { ACHIEVEMENTS, BIOME_BY_ID, ITEM_BY_ID, POTION_BY_ID, QUEST_CHAINS } from '../config';
import { formatGold, formatMult, formatPercent } from '../core/format';
import { QUEST_BY_ID, questText } from '../core/progress';
import { game, ui } from '../game/app';
import { sfx } from './sound';

function rewardText(r: { gold?: number; potions?: Record<string, number>; luckAdd?: number }): string {
  const parts: string[] = [];
  if (r.gold) parts.push(`${formatGold(r.gold * 1000)} Gold`);
  for (const [id, n] of Object.entries(r.potions ?? {})) parts.push(`${n}× ${POTION_BY_ID[id]?.name ?? id}`);
  if (r.luckAdd) parts.push(`${formatPercent(r.luckAdd)} Glück dauerhaft`);
  return parts.join(', ');
}

export function initNotifier(): void {
  game.bus.on('toast', (spec) => ui.pushToast(spec));
  game.bus.on('game', (e) => {
    switch (e.type) {
      case 'error':
        sfx('error');
        ui.pushToast({ text: e.message, kind: 'error', icon: 'info' });
        break;
      case 'achievement': {
        const a = ACHIEVEMENTS.find((x) => x.id === e.id);
        if (!a) break;
        const reward = rewardText(a.reward);
        ui.pushToast({ text: `Erfolg: ${a.name}${reward ? ` · ${reward}` : ''}`, kind: 'success', icon: 'trophy', color: '#ffd23f' });
        break;
      }
      case 'questReady': {
        const q = QUEST_BY_ID[e.id];
        const chain = QUEST_CHAINS.find((c) => c.id === e.id);
        const text = q ? questText(q.text, q.target, q.tier) : chain?.name ?? '';
        ui.pushToast({ text: `Auftrag erfüllt: ${text} – jetzt abholen!`, kind: 'success', icon: 'scroll', color: '#f5c22a' });
        break;
      }
      case 'shopRestocked':
        ui.pushToast({ text: 'Der Händler hat neue Ware!', icon: 'shop', color: '#ffb340' });
        break;
      case 'biomeChanged': {
        const b = e.biome ? BIOME_BY_ID[e.biome] : null;
        if (b) ui.pushToast({ text: `${b.name}! ${formatMult(b.luck)} Glück${b.speed ? `, ${formatMult(b.speed)} Tempo` : ''}`, icon: b.icon, color: b.colors.accent });
        else if (e.prev) ui.pushToast({ text: `${BIOME_BY_ID[e.prev]?.name ?? 'Das Biom'} ist vorbei.`, icon: 'globe' });
        break;
      }
      case 'buffExpired': {
        const [source, ref] = e.buff.split(':');
        const name = source === 'potion' ? POTION_BY_ID[ref]?.name : ITEM_BY_ID[ref]?.name;
        if (name) ui.pushToast({ text: `${name} ist abgelaufen.`, icon: 'clock' });
        break;
      }
      case 'rebirth':
        ui.pushToast({ text: `Rebirth ${e.level} geschafft! Dein Planet wächst.`, kind: 'success', icon: 'rebirth', color: '#ff5ab4' });
        break;
      default:
        break;
    }
  });
}

import { ACHIEVEMENTS, ITEM_BY_ID, POTION_BY_ID, REBIRTHS } from '../../config';
import { biomeStatus } from '../../core/biomes';
import { formatClock, formatInt, formatMult, formatPercent } from '../../core/format';
import { computeGoldMult, computeLuck, computeSpeed, isBuffActive, isNextRollLucky } from '../../core/modifiers';
import type { Buff } from '../../core/state';
import { ui } from '../../game/app';
import { css, Empty, Panel } from '../common';
import { Breakdown } from '../Hud';
import { useGame, useNow } from '../hooks';
import { Icon } from '../icons';
import { ItemIcon, PotionIcon } from './itemIcons';

function effectText(b: Buff): string {
  if (b.source === 'potion') {
    const e = POTION_BY_ID[b.ref]?.effect;
    if (!e) return '';
    const parts: string[] = [];
    if (e.luck) parts.push(`${formatMult(e.luck)} Glück`);
    if (e.speed) parts.push(`${formatMult(e.speed)} Tempo`);
    return parts.join(' · ');
  }
  const u = ITEM_BY_ID[b.ref]?.use;
  if (!u) return '';
  const parts: string[] = [];
  if (u.luckAdd) parts.push(`${formatPercent(u.luckAdd)} Glück`);
  if (u.speedAdd) parts.push(`${formatPercent(u.speedAdd)} Tempo`);
  return parts.join(' · ');
}

export function EffectsPanel() {
  const state = useGame();
  const now = useNow(500);
  const status = biomeStatus(now);
  const biome = status.biome?.id ?? null;
  const active = state.buffs.filter((b) => isBuffActive(b, now));
  const luck = computeLuck(state, now, { lucky: isNextRollLucky(state), biome });
  const speed = computeSpeed(state, now, biome);
  const gold = computeGoldMult(state);
  const equip = state.equippedItem ? ITEM_BY_ID[state.equippedItem] : null;
  const rebirth = REBIRTHS.find((r) => r.level === state.rebirth);
  const achLuck = ACHIEVEMENTS.filter((a) => state.achievements[a.id] && a.reward.luckAdd).reduce((s, a) => s + (a.reward.luckAdd ?? 0), 0);

  return (
    <Panel id="effects" title="Aktive Effekte" icon="sparkles" color="#3fc8e8" subtitle={`${active.length} zeitlich begrenzte Effekte aktiv`}>
      <h3 class="section-title">Laufende Effekte</h3>
      {active.length === 0 ? (
        <Empty icon="sparkles">
          Gerade läuft kein Trank und kein Amulett.{' '}
          <button type="button" class="link" onClick={() => ui.open('inventory', 'potions')}>
            Zum Tränke-Vorrat
          </button>
        </Empty>
      ) : (
        <div class="list">
          {active.map((b) => {
            const isPotion = b.source === 'potion';
            const name = isPotion ? POTION_BY_ID[b.ref]?.name : ITEM_BY_ID[b.ref]?.name;
            const color = isPotion ? POTION_BY_ID[b.ref]?.color : ITEM_BY_ID[b.ref]?.color;
            const overridden = luck.categories.find((c) => c.category === 'potion')?.parts.find((p) => p.buffId === b.id && !p.active);
            return (
              <div key={b.id} class={`list-row effect-row${overridden ? ' is-muted' : ''}`} style={css({ '--c': color })} data-testid={`effect-${b.id}`}>
                {isPotion ? <PotionIcon id={b.ref} size={44} /> : <ItemIcon id={b.ref} size={44} />}
                <div class="list-row__main">
                  <div class="list-row__title">{name}</div>
                  <div class="list-row__desc">{effectText(b)}</div>
                  {overridden && <div class="list-row__meta">Überlagert von einem stärkeren Trank – Ladungen werden aufgespart.</div>}
                </div>
                <div class="effect-left">
                  {b.endsAt !== undefined ? (
                    <>
                      <Icon name="clock" size={16} />
                      <b>{formatClock(b.endsAt - now)}</b>
                    </>
                  ) : (
                    <>
                      <Icon name="dice" size={16} />
                      <b>{formatInt(b.rolls ?? 0)}</b>
                      <span class="muted">{b.rolls === 1 ? 'Roll' : 'Rolls'}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h3 class="section-title">Dauerhaft</h3>
      <div class="list">
        <div class="list-row" style={css({ '--c': '#c9a7ff' })}>
          <span class="item-ico" style={css({ '--c': '#7a6ab8', width: '44px', height: '44px' })}>
            <Icon name="gauntlet" size={24} />
          </span>
          <div class="list-row__main">
            <div class="list-row__title">Ausrüstung: {equip ? equip.name : 'leer'}</div>
            <div class="list-row__desc">
              {equip?.equip ? [equip.equip.luckAdd ? `${formatPercent(equip.equip.luckAdd)} Glück` : '', equip.equip.speedAdd ? `${formatPercent(equip.equip.speedAdd)} Tempo` : ''].filter(Boolean).join(' · ') : 'Ausrüstung gibt es beim Händler.'}
            </div>
          </div>
        </div>
        <div class="list-row" style={css({ '--c': '#ff5ab4' })}>
          <span class="item-ico" style={css({ '--c': '#ff5ab4', width: '44px', height: '44px' })}>
            <Icon name="rebirth" size={24} />
          </span>
          <div class="list-row__main">
            <div class="list-row__title">{rebirth ? `Rebirth ${rebirth.level}: ${rebirth.name}` : 'Noch kein Rebirth'}</div>
            <div class="list-row__desc">{rebirth ? `${formatMult(rebirth.luck)} Glück · ${formatMult(rebirth.speed)} Tempo · ${formatMult(rebirth.goldMult)} Gold` : 'Rebirths geben dauerhafte Multiplikatoren.'}</div>
          </div>
        </div>
        {achLuck > 0 && (
          <div class="list-row" style={css({ '--c': '#ffd23f' })}>
            <span class="item-ico" style={css({ '--c': '#d4a017', width: '44px', height: '44px' })}>
              <Icon name="trophy" size={24} />
            </span>
            <div class="list-row__main">
              <div class="list-row__title">Erfolge</div>
              <div class="list-row__desc">{formatPercent(achLuck)} Glück dauerhaft</div>
            </div>
          </div>
        )}
        <div class="list-row" style={css({ '--c': status.biome?.colors.accent ?? '#6f78a0' })}>
          <span class="item-ico" style={css({ '--c': status.biome?.colors.glow ?? '#3a4270', width: '44px', height: '44px' })}>
            <Icon name={status.biome?.icon ?? 'globe'} size={24} />
          </span>
          <div class="list-row__main">
            <div class="list-row__title">{status.biome ? `Biom: ${status.biome.name}` : 'Klarer Himmel'}</div>
            <div class="list-row__desc">
              {status.biome ? `${formatMult(status.biome.luck)} Glück${status.biome.speed ? ` · ${formatMult(status.biome.speed)} Tempo` : ''} · noch ${formatClock((status.endsAt ?? now) - now)}` : status.next ? `Nächstes Biom: ${status.next.biome.name} in ${formatClock(status.next.startsAt - now)}` : 'Kein Biom aktiv'}
            </div>
          </div>
        </div>
      </div>

      <h3 class="section-title">Gesamtwerte</h3>
      <div class="breakdown-grid">
        <Breakdown inline title="Glück" icon="clover" result={luck} color="var(--luck)" note={isNextRollLucky(state) ? 'Der nächste Roll ist ein Glücks-Roll (2x).' : undefined} />
        <Breakdown inline title="Roll-Geschwindigkeit" icon="bolt" result={speed} color="var(--speed)" />
        <Breakdown inline title="Gold-Bonus" icon="coin" result={gold} color="var(--gold)" />
      </div>
    </Panel>
  );
}

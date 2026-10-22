import { AURAS, GAME } from '../config';
import { biomeStatus } from '../core/biomes';
import { formatClock, formatGoldFixed, formatInt, formatMult, formatPercent } from '../core/format';
import { computeGoldMult, computeLuck, computeSpeed, isNextRollLucky, type ModResult } from '../core/modifiers';
import { game, ui } from '../game/app';
import { css, IconBtn, useTween } from './common';
import { useGame, useNow, useUi } from './hooks';
import { Icon } from './icons';
import { sfx } from './sound';

export function Hud() {
  const state = useGame();
  const u = useUi();
  const now = useNow(1000);
  const status = biomeStatus(now);
  const biome = status.biome?.id ?? null;
  const luck = computeLuck(state, now, { lucky: isNextRollLucky(state), biome });
  const speed = computeSpeed(state, now, biome);
  const gold = useTween(state.gold);

  return (
    <header class="hud">
      <div class="hud__row">
        <IconBtn icon="gear" label="Einstellungen (O)" class="hud__settings" onClick={() => ui.open('settings')} data-testid="open-settings" />
        <div class="pill pill--gold" data-testid="hud-gold" title="Gold Coins">
          <span class="coin-ico" />
          <span class="pill__value">{formatGoldFixed(gold)}</span>
        </div>
        <div class="pill" title="Rolls gesamt" data-testid="hud-rolls">
          <Icon name="dice" size={18} />
          <span class="pill__value">{formatInt(state.stats.rolls)}</span>
        </div>
        <span class="hud__spacer" />
        <button type="button" class={`pill pill--luck pill--btn${u.popover === 'luck' ? ' is-open' : ''}`} onClick={() => { sfx('click'); ui.togglePopover('luck'); }} data-testid="hud-luck" title="Glück – antippen für Aufschlüsselung">
          <Icon name="clover" size={18} />
          <span class="pill__value">{formatMult(luck.total)}</span>
        </button>
        <button type="button" class={`pill pill--speed pill--btn${u.popover === 'speed' ? ' is-open' : ''}`} onClick={() => { sfx('click'); ui.togglePopover('speed'); }} data-testid="hud-speed" title="Roll-Geschwindigkeit – antippen für Aufschlüsselung">
          <Icon name="bolt" size={18} />
          <span class="pill__value">{formatMult(speed.total)}</span>
        </button>
      </div>
      <div class="hud__row hud__row--center">
        <button
          type="button"
          class={`biome-pill${status.biome ? ' is-active' : ''}`}
          style={css(status.biome ? { '--c': status.biome.colors.accent, '--g': status.biome.colors.glow } : {})}
          onClick={() => { sfx('click'); ui.togglePopover('biome'); }}
          data-testid="hud-biome"
        >
          <Icon name={status.biome?.icon ?? 'globe'} size={16} />
          {status.biome ? (
            <>
              <b>{status.biome.name}</b>
              <span class="biome-pill__meta">{formatMult(status.biome.luck)} Glück · {formatClock((status.endsAt ?? now) - now)}</span>
            </>
          ) : (
            <span class="biome-pill__meta">Klarer Himmel{status.next ? ` · Wetter in ${formatClock(status.next.startsAt - now)}` : ''}</span>
          )}
        </button>
      </div>
      {u.popover === 'luck' && <Breakdown title="Glück" icon="clover" result={luck} color="var(--luck)" note={isNextRollLucky(state) ? `Inklusive Glücks-Roll (jeder ${GAME.roll.luckyEvery}. Roll).` : undefined} />}
      {u.popover === 'speed' && <Breakdown title="Roll-Geschwindigkeit" icon="bolt" result={speed} color="var(--speed)" />}
      {u.popover === 'biome' && <BiomeInfo now={now} />}
    </header>
  );
}

export function Breakdown({ title, icon, result, color, note, inline }: { title: string; icon: 'clover' | 'bolt' | 'coin'; result: ModResult; color: string; note?: string; inline?: boolean }) {
  const active = result.categories.filter((c) => c.factor !== 1 || c.parts.length > 0);
  return (
    <div class={inline ? 'breakdown breakdown--inline' : 'popover breakdown'} style={css({ '--c': color })} data-testid="breakdown">
      <div class="breakdown__head">
        <Icon name={icon} size={18} />
        <span>{title}</span>
        <b>{formatMult(result.total)}</b>
      </div>
      {active.length === 0 ? (
        <p class="breakdown__empty">Keine Boni aktiv. Tränke, Amulette, Ausrüstung, Rebirth und Biome erhöhen diesen Wert.</p>
      ) : (
        <ul>
          {active.map((c) => (
            <li key={c.category}>
              <div class="breakdown__cat">
                <span>{c.label}</span>
                <b>×{formatMult(c.factor).replace('x', '')}</b>
              </div>
              {c.parts.map((p) => (
                <div key={p.label} class={`breakdown__part${p.active ? '' : ' is-muted'}`}>
                  <span>{p.label}</span>
                  <span>{c.mode === 'add' ? formatPercent(p.value) : formatMult(p.value)}{!p.active && ' (überlagert)'}</span>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
      <p class="breakdown__rule">Trank: nur der stärkste zählt · Amulette, Ausrüstung, Erfolge: addieren sich · Kategorien multiplizieren sich.</p>
      {note && <p class="breakdown__rule">{note}</p>}
      {icon === 'clover' && <GoldLine />}
    </div>
  );
}

function GoldLine() {
  const g = computeGoldMult(game.state).total;
  if (g === 1) return null;
  return <p class="breakdown__rule">Gold-Bonus beim Verkauf: {formatMult(g)}</p>;
}

function BiomeInfo({ now }: { now: number }) {
  const status = biomeStatus(now);
  const b = status.biome;
  return (
    <div class="popover biome-info" data-testid="biome-info">
      {b ? (
        <>
          <h3>{b.name}</h3>
          <p>{b.description}</p>
          <p>
            <b>{formatMult(b.luck)} Glück</b>
            {b.speed ? <> · <b>{formatMult(b.speed)} Tempo</b></> : null} · endet in {formatClock((status.endsAt ?? now) - now)}
          </p>
          <p class="muted">Nur jetzt rollbar: {biomeAuraNames(b.id)}</p>
        </>
      ) : (
        <>
          <h3>Klarer Himmel</h3>
          <p>Gerade ist kein Biom aktiv. Biome erhöhen das Glück und schalten exklusive Auren frei.</p>
        </>
      )}
      {status.next && (
        <p class="muted">
          Nächstes Biom: <b>{status.next.biome.name}</b> in {formatClock(status.next.startsAt - now)}
        </p>
      )}
    </div>
  );
}

function biomeAuraNames(biome: string): string {
  return AURAS.filter((a) => a.biome === biome)
    .map((a) => (game.state.discovered[a.id] ? a.name : '???'))
    .join(', ');
}

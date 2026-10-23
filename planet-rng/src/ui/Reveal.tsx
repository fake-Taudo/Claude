import { useEffect, useRef, useState } from 'preact/hooks';
import { AURA_BY_ID, AURAS, TIER_BY_ID, tierOf, type AuraDef } from '../config';
import { formatMult, formatOdds } from '../core/format';
import { displayOdds } from '../core/odds';
import { game } from '../game/app';
import { css, TierTag } from './common';
import { useBus, useGame } from './hooks';
import { Icon } from './icons';
import { labState } from './lab';

function gradientOf(a: AuraDef): string {
  const pal = a.colors.palette && a.colors.palette.length >= 2 ? a.colors.palette : [a.colors.glow, a.colors.main === '#000000' ? '#ffffff' : a.colors.main, a.colors.accent ?? a.colors.glow];
  // Very dark main colors would make unreadable text: lift them toward the glow.
  return `linear-gradient(100deg, ${pal.map((c) => (isDark(c) ? a.colors.glow : c)).join(', ')})`;
}

function isDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 70;
}

// ---------------------------------------------------------------------------
// Name cycling during a roll (Sol's RNG style slot machine)
// ---------------------------------------------------------------------------

/**
 * Random aura for the slot-machine cycling. Common auras dominate; `rareBias` (0..1)
 * shifts weight toward rare names near the end of a rare roll to build suspense.
 */
function pickTeaser(rareBias: number): AuraDef {
  const exponent = -0.45 + rareBias * 0.6;
  let total = 0;
  const weights = AURAS.map((a) => {
    const w = Math.pow(a.odds, exponent);
    total += w;
    return w;
  });
  let r = Math.random() * total;
  for (let i = 0; i < AURAS.length; i++) {
    r -= weights[i];
    if (r <= 0) return AURAS[i];
  }
  return AURAS[0];
}

export function RollNames() {
  const [text, setText] = useState<{ name: string; color: string; final: boolean } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  };

  useBus('rollAnim', ({ duration, aura }) => {
    clear();
    const result = AURA_BY_ID[aura];
    const rank = tierOf(result).rank;
    const cutscene = !!result.cutscene && game.settings.cutscenes;
    let t = 0;
    const finalAt = duration * (cutscene ? 1 : 0.86);
    while (t < finalAt) {
      const k = t / duration;
      const at = t;
      const bias = rank >= 4 ? Math.max(0, (k - 0.4) * 1.6) : 0;
      timers.current.push(
        setTimeout(() => {
          const a = pickTeaser(bias);
          const known = !!game.state.discovered[a.id];
          setText({ name: known ? a.name : '???', color: TIER_BY_ID[a.tier].color, final: false });
        }, at),
      );
      t += 42 + 150 * Math.pow(k, 2.2) + (rank >= 5 ? 90 * k : 0);
    }
    if (!cutscene) {
      timers.current.push(setTimeout(() => setText({ name: result.name, color: TIER_BY_ID[result.tier].color, final: true }), finalAt));
    }
  });

  useBus('reveal', () => {
    clear();
    setText(null);
  });
  useBus('cutscene', ({ phase }) => {
    if (phase === 'start') {
      clear();
      setText(null);
    }
  });
  useEffect(() => clear, []);

  if (!text) return null;
  return (
    <div class={`roll-names${text.final ? ' is-final' : ''}`} style={css({ '--c': text.color })} aria-hidden="true">
      {text.name}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nameplate of the equipped aura (above the planet)
// ---------------------------------------------------------------------------

export function Nameplate() {
  const state = useGame();
  const [, force] = useState(0);
  useEffect(() => labState.subscribe(() => force((x) => x + 1)), []);
  const id = labState.aura ?? state.equippedAura;
  if (!id) return null;
  const a = AURA_BY_ID[id];
  if (!a) return null;
  return (
    <div class="nameplate" key={id} style={css({ '--c': TIER_BY_ID[a.tier].color, '--g': a.colors.glow })} data-testid="nameplate">
      {a.title && <div class="nameplate__title">〈 {a.title} 〉</div>}
      <div class="nameplate__name" style={css({ '--grad': gradientOf(a) })}>
        {a.name}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reveal banner and fullscreen reveal
// ---------------------------------------------------------------------------

interface RevealState {
  id: number;
  aura: AuraDef;
  isNew: boolean;
  lucky: boolean;
  luck: number;
  quick: boolean;
  big: boolean;
}

let revealSeq = 0;

export function Reveal() {
  const [r, setR] = useState<RevealState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useBus('reveal', (e) => {
    if (!game.settings.showReveal) return;
    const aura = AURA_BY_ID[e.aura];
    const tier = tierOf(aura);
    const big = tier.staging.level >= 3;
    const ms = big ? (e.quick ? tier.staging.bannerMs * 0.6 : tier.staging.bannerMs) : e.quick ? 1100 : tier.staging.bannerMs;
    if (timer.current) clearTimeout(timer.current);
    setR({ id: ++revealSeq, aura, isNew: e.isNew, lucky: e.lucky, luck: e.luck, quick: e.quick, big });
    timer.current = setTimeout(() => setR(null), ms);
  });
  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  if (!r) return null;
  const tier = tierOf(r.aura);
  const style = css({ '--c': tier.color, '--c2': tier.color2, '--g': r.aura.colors.glow, '--a': r.aura.colors.main, '--grad': gradientOf(r.aura) });
  const dismiss = () => setR(null);
  const badges = (
    <div class="reveal__badges">
      {r.isNew && <span class="badge-new">NEU!</span>}
      {r.lucky && (
        <span class="badge-lucky">
          <Icon name="clover" size={13} /> 2x GLÜCK
        </span>
      )}
    </div>
  );

  if (r.big) {
    return (
      <div key={r.id} class={`big-reveal big-reveal--l${tier.staging.level}`} style={style} onClick={dismiss} data-testid="reveal-big">
        <div class="big-reveal__rays" />
        <div class="big-reveal__content">
          {badges}
          <div class="big-reveal__tier">{tier.name}</div>
          <div class="big-reveal__name">{r.aura.name}</div>
          <div class="big-reveal__odds">{formatOdds(displayOdds(r.aura))}</div>
          {r.aura.title && <div class="big-reveal__title">〈 {r.aura.title} 〉</div>}
          <div class="big-reveal__luck">Glück bei diesem Roll: {formatMult(r.luck)}</div>
        </div>
      </div>
    );
  }

  return (
    <div key={r.id} class={`reveal reveal--l${tier.staging.level}${r.quick ? ' reveal--quick' : ''}`} style={style} onClick={dismiss} data-testid="reveal">
      {badges}
      <div class="reveal__name">{r.aura.name}</div>
      <div class="reveal__meta">
        <TierTag tierId={r.aura.tier} small />
        <span class="reveal__odds">{formatOdds(displayOdds(r.aura))}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen flash, shake and vibration
// ---------------------------------------------------------------------------

export function ScreenFx() {
  const [flash, setFlash] = useState<{ id: number; strength: number; color: string } | null>(null);

  useBus('reveal', (e) => {
    const aura = AURA_BY_ID[e.aura];
    const st = tierOf(aura).staging;
    const reduced = game.settings.reducedEffects;
    if (st.flash > 0 && !reduced && !e.afterCutscene) {
      setFlash({ id: Date.now(), strength: st.flash * (e.quick ? 0.5 : 1), color: aura.colors.glow });
    }
    if (st.shake > 0 && !reduced) {
      const root = document.querySelector('.game-root') as HTMLElement | null;
      if (root) {
        root.style.setProperty('--shake', `${Math.round(st.shake * 12)}px`);
        root.classList.remove('is-shaking');
        void root.offsetWidth;
        root.classList.add('is-shaking');
      }
    }
    if (st.vibrate && game.settings.vibration && 'vibrate' in navigator) {
      try {
        navigator.vibrate(st.vibrate);
      } catch {
        /* unsupported */
      }
    }
  });

  if (!flash) return null;
  return <div key={flash.id} class="screen-flash" style={css({ '--strength': flash.strength, '--c': flash.color })} onAnimationEnd={() => setFlash(null)} />;
}

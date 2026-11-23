import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { AURA_BY_ID, TIER_BY_ID, type AuraDef } from '../config';
import { formatGold } from '../core/format';
import { ui } from '../game/app';
import type { PanelId } from '../store/ui';
import { Icon, type IconName } from './icons';
import { sfx } from './sound';

type Style = JSX.CSSProperties & Record<string, string | number | undefined>;

export function css(vars: Record<string, string | number | undefined>): Style {
  return vars as Style;
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

export function Btn(props: {
  children?: ComponentChildren;
  onClick?: (e: MouseEvent) => void;
  variant?: 'primary' | 'gold' | 'ghost' | 'danger' | 'success' | 'plain';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: IconName;
  title?: string;
  class?: string;
  style?: Style;
  silent?: boolean;
  'data-testid'?: string;
}) {
  const { variant = 'primary', size = 'md' } = props;
  return (
    <button
      type="button"
      class={`btn btn--${variant} btn--${size}${props.class ? ` ${props.class}` : ''}`}
      disabled={props.disabled}
      title={props.title}
      style={props.style}
      data-testid={props['data-testid']}
      onClick={(e) => {
        if (props.disabled) return;
        if (!props.silent) sfx('click');
        props.onClick?.(e as MouseEvent);
      }}
    >
      {props.icon && <Icon name={props.icon} size={size === 'sm' ? 16 : 20} />}
      {props.children !== undefined && <span>{props.children}</span>}
    </button>
  );
}

export function IconBtn(props: { icon: IconName; label: string; onClick: () => void; class?: string; active?: boolean; badge?: number | string | null; 'data-testid'?: string }) {
  return (
    <button
      type="button"
      class={`icon-btn${props.active ? ' is-active' : ''}${props.class ? ` ${props.class}` : ''}`}
      aria-label={props.label}
      title={props.label}
      data-testid={props['data-testid']}
      onClick={() => {
        sfx('click');
        props.onClick();
      }}
    >
      <Icon name={props.icon} />
      {props.badge ? <span class="badge">{props.badge}</span> : null}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Aura visuals
// ---------------------------------------------------------------------------

export function AuraOrb({ aura, size = 44, unknown = false }: { aura: AuraDef; size?: number; unknown?: boolean }) {
  const tier = TIER_BY_ID[aura.tier];
  if (unknown) {
    return (
      <span class="orb orb--unknown" style={css({ width: `${size}px`, height: `${size}px`, '--c': tier.color, fontSize: `${size * 0.42}px` })}>
        ?
      </span>
    );
  }
  const pal = aura.colors.palette;
  const spectral = !!pal && pal.length >= 3;
  return (
    <span
      class={`orb${spectral ? ' orb--spectral' : ''}`}
      style={css({
        width: `${size}px`,
        height: `${size}px`,
        '--a': aura.colors.main,
        '--g': aura.colors.glow,
        '--x': aura.colors.accent ?? aura.colors.glow,
        '--c': tier.color,
        '--spec': spectral ? `conic-gradient(${[...pal!, pal![0]].join(',')})` : undefined,
      })}
    />
  );
}

export function TierTag({ tierId, small }: { tierId: AuraDef['tier']; small?: boolean }) {
  const t = TIER_BY_ID[tierId];
  return (
    <span class={`tier-tag${small ? ' tier-tag--sm' : ''}`} style={css({ '--c': t.color, '--c2': t.color2 })}>
      {t.name}
    </span>
  );
}

export function AuraName({ id }: { id: string }) {
  const a = AURA_BY_ID[id];
  if (!a) return null;
  return (
    <span class="aura-name" style={css({ '--c': TIER_BY_ID[a.tier].color })}>
      {a.name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

export function Panel(props: {
  id: PanelId;
  title: string;
  icon: IconName;
  color: string;
  subtitle?: ComponentChildren;
  tabs?: { id: string; label: string; badge?: number | null }[];
  tab?: string;
  children: ComponentChildren;
  footer?: ComponentChildren;
}) {
  return (
    <div class="panel-backdrop" onClick={(e) => e.target === e.currentTarget && ui.close()}>
      <section class="panel" role="dialog" aria-modal="true" aria-label={props.title} data-testid={`panel-${props.id}`} style={css({ '--pc': props.color })}>
        <header class="panel__head">
          <span class="panel__icon">
            <Icon name={props.icon} size={24} />
          </span>
          <div class="panel__titles">
            <h2>{props.title}</h2>
            {props.subtitle && <div class="panel__sub">{props.subtitle}</div>}
          </div>
          <IconBtn icon="close" label="Schließen" class="panel__close" onClick={() => ui.close()} data-testid="panel-close" />
        </header>
        {props.tabs && (
          <nav class="tabs" role="tablist">
            {props.tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={props.tab === t.id}
                class={`tab${props.tab === t.id ? ' is-active' : ''}`}
                data-testid={`tab-${t.id}`}
                onClick={() => {
                  sfx('tab');
                  ui.setTab(props.id, t.id);
                }}
              >
                {t.label}
                {t.badge ? <span class="tab__badge">{t.badge}</span> : null}
              </button>
            ))}
          </nav>
        )}
        <div class="panel__body">{props.children}</div>
        {props.footer && <footer class="panel__foot">{props.footer}</footer>}
      </section>
    </div>
  );
}

export function Progress({ value, max, color, label }: { value: number; max: number; color?: string; label?: ComponentChildren }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0;
  return (
    <div class="progress" style={css({ '--c': color ?? 'var(--accent)' })}>
      <div class="progress__fill" style={{ width: `${pct}%` }} />
      {label !== undefined && <div class="progress__label">{label}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint, testid }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; testid?: string }) {
  return (
    <label class="toggle-row">
      <span class="toggle-row__text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-testid={testid}
        class={`switch${checked ? ' is-on' : ''}`}
        onClick={() => {
          sfx('toggle');
          onChange(!checked);
        }}
      >
        <span class="switch__knob" />
      </button>
    </label>
  );
}

export function Slider({ value, onChange, label, disabled }: { value: number; onChange: (v: number) => void; label: string; disabled?: boolean }) {
  return (
    <label class={`slider-row${disabled ? ' is-disabled' : ''}`}>
      <span>{label}</span>
      <input type="range" min={0} max={100} step={1} value={Math.round(value * 100)} disabled={disabled} onInput={(e) => onChange(Number((e.target as HTMLInputElement).value) / 100)} />
      <span class="slider-row__val">{Math.round(value * 100)}</span>
    </label>
  );
}

export function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div class="stepper">
      <button type="button" class="stepper__btn" disabled={value <= min} onClick={() => onChange(clamp(value - 1))} aria-label="Weniger">
        <Icon name="minus" size={18} />
      </button>
      <input
        class="stepper__val"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = parseInt((e.target as HTMLInputElement).value.replace(/\D/g, ''), 10);
          onChange(clamp(Number.isFinite(n) ? n : min));
        }}
      />
      <button type="button" class="stepper__btn" disabled={value >= max} onClick={() => onChange(clamp(value + 1))} aria-label="Mehr">
        <Icon name="plus" size={18} />
      </button>
      <button type="button" class="stepper__max" disabled={value >= max} onClick={() => onChange(max)}>
        Max
      </button>
    </div>
  );
}

export function GoldAmount({ milli, size = 16 }: { milli: number; size?: number }) {
  return (
    <span class="gold-amount">
      <span class="coin-ico" style={{ width: size, height: size }} />
      {formatGold(milli)}
    </span>
  );
}

/** Smoothly counts toward the target value. */
export function useTween(target: number, ms = 650): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const raf = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const v0 = from.current;
    if (v0 === target) return;
    cancelAnimationFrame(raf.current);
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const v = v0 + (target - v0) * e;
      from.current = v;
      setValue(k >= 1 ? target : v);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return value;
}

export function Empty({ icon, children }: { icon: IconName; children: ComponentChildren }) {
  return (
    <div class="empty">
      <Icon name={icon} size={36} />
      <p>{children}</p>
    </div>
  );
}

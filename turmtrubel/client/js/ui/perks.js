// Modus „Chaos“ im Client: Perk-Auswahl-Overlay (zwei Optionen, Countdown-Ring, Bestätigung), Perk-Abzeichen,
// Perk-Listen (Kartendetail, Kampfmenü, Ergebnis) und der Info-Teil des Regel-Hinweises.
import { PERK_TIERS, PERK_TIER_LABELS, MECHANIC_LABELS, roundSchedule } from '/shared/chaos.js';
import { C2S } from '/shared/protocol.js';
import { h, ico, modal, fmtTime } from './dom.js';
import { icon } from './icons.js';
import { cardEl } from './cardview.js';
import { reducedMotion } from './tokens.js';

/** Seltenheitsfarben der Perks (Gewöhnlich Grau, Selten Bronze, Episch Lila) – auch fürs Canvas-HUD. */
export const PERK_COLORS = Object.freeze({ common: '#b9c3cf', rare: '#cd8a45', epic: '#a855f7' });
export const PERK_TIER_BY_CODE = Object.freeze({ 1: 'common', 2: 'rare', 3: 'epic' });

/** Kleines Abzeichen in Seltenheitsfarbe (DOM). */
export function perkBadge(tier, { label = true } = {}) {
  return h('span', { class: `perk-badge t-${tier}`, title: PERK_TIER_LABELS[tier] }, icon('sparkles'), label ? PERK_TIER_LABELS[tier] : null);
}

/** Eine Perk-Zeile: Abzeichen, Name, Beschreibung (optional mit Karte). */
export function perkRow(app, p, { card = false, extra = null } = {}) {
  return h(
    'div',
    { class: `perk-row t-${p.tier || p.rarityTier}` },
    card ? h('div', { class: 'perk-row-card' }, cardEl(app.db, p.card || p.cardId, { mini: true })) : null,
    h(
      'div',
      { class: 'perk-row-text' },
      h('div', { class: 'perk-row-head' }, perkBadge(p.tier || p.rarityTier), h('b', { class: 'perk-name' }, p.name), extra),
      h('p', { class: 'perk-desc' }, p.description),
    ),
  );
}

/** Die drei Perks einer Karte (Kartendetail im Chaos-Deckbau). */
export function cardPerksPanel(app, cardId) {
  const chaos = app.chaos;
  if (!chaos?.byCard.has(cardId)) return null;
  return h(
    'div',
    { class: 'box perks' },
    h('p', { class: 'hint small' }, 'Im Chaos-Modus kann diese Karte im Kampf einen dieser Perks bekommen:'),
    PERK_TIERS.map((t) => {
      const p = chaos.perkFor(cardId, t);
      return perkRow(app, { ...p, tier: t }, { extra: h('span', { class: 'perk-mech' }, MECHANIC_LABELS[p.mechanicType] || p.mechanicType) });
    }),
  );
}

/** Kampfmenü: alle bisher gewählten Perks (eigene und die des Gegners). */
export function openPerksModal(app, game) {
  const chosen = game.chaos?.chosen || [];
  const mine = chosen[game.seat] || [];
  const opp = chosen.find((_, i) => i !== game.seat) || [];
  const list = (arr, empty) => (arr.length ? arr.map((p) => perkRow(app, p, { card: true, extra: h('span', { class: 'perk-round' }, `Runde ${p.round}${p.auto ? ' · Zufall' : ''}`) })) : h('p', { class: 'hint' }, empty));
  const body = h(
    'div',
    { class: 'perk-list-modal' },
    h('h3', { class: 'perk-list-title blue' }, ico('shield'), 'Deine Perks'),
    list(mine, 'Noch keine Perks.'),
    h('h3', { class: 'perk-list-title red' }, ico('swords'), `Perks von ${game.names[1 - game.seat] || 'Gegner'}`),
    list(opp, 'Dein Gegner hat noch keine Perks.'),
  );
  return modal('Perks im Kampf', body, { wide: true });
}

/** Zusatz im Regel-Hinweis des Chaos-Modus: Rundenplan, Seltenheiten, Kartenpool. */
export function chaosInfo(app) {
  const chaos = app.chaos;
  if (!chaos) return null;
  const c = chaos.config;
  const times = roundSchedule(c);
  const pct = (w) => PERK_TIERS.filter((t) => w[t] > 0).map((t) => h('span', { class: `perk-pct t-${t}` }, `${w[t]} % ${PERK_TIER_LABELS[t]}`));
  return h(
    'div',
    { class: 'chaos-info' },
    h('h4', { class: 'chaos-info-title' }, ico('hourglass'), 'Auswahlrunden'),
    h(
      'ol',
      { class: 'chaos-rounds' },
      times.map((t, i) =>
        h(
          'li',
          { class: 'chaos-round' },
          h('span', { class: 'chaos-round-time' }, fmtTime(t)),
          h('span', { class: 'chaos-round-label' }, i === times.length - 1 && c.lastRoundOvertimeOnly ? 'nur in der Verlängerung' : i === 0 && c.openingRound ? 'zum Kampfbeginn' : `Runde ${i + 1}`),
          h('span', { class: 'chaos-round-pct' }, pct(c.rarityByRound[i])),
        ),
      ),
    ),
    h('h4', { class: 'chaos-info-title' }, ico('cards'), `Kartenpool (${chaos.pool.length} Karten)`),
    h('p', { class: 'hint small' }, 'Nur diese Karten sind erlaubt. Tippe eine Karte an, um ihre drei Perks zu sehen.'),
    h(
      'div',
      { class: 'chaos-pool' },
      chaos.pool.map((id) => cardEl(app.db, id, { mini: true, onClick: () => openPoolCard(app, id) })),
    ),
  );
}

function openPoolCard(app, id) {
  const card = app.db.card(id);
  modal(card.name, h('div', { class: 'perk-card-modal' }, h('div', { class: 'perk-card-head' }, cardEl(app.db, id, {}), h('p', { class: 'detail-desc' }, card.description)), cardPerksPanel(app, id)));
}

/**
 * Overlay der Auswahlrunde: zwei Optionen groß nebeneinander, Countdown-Ring, Antippen zum Wählen.
 * Die Arena bleibt leicht sichtbar (halbtransparenter Hintergrund).
 */
export class PerkOverlay {
  constructor(app, game) {
    this.app = app;
    this.game = game;
    this.el = null;
    this.raf = 0;
  }

  /** Neue Runde oder aktualisierter Stand (nach eigener/gegnerischer Wahl, Reconnect). */
  show(m) {
    const first = !this.el || this.round !== m.round;
    this.round = m.round;
    this.msg = m;
    this.deadline = performance.now() + m.timeLeft * 1000;
    this.total = m.pickSeconds || 6;
    if (first) this.build(m);
    else this.refresh(m);
    if (!this.raf) this.tick();
  }

  build(m) {
    this.destroy(true);
    const root = document.getElementById('s-game');
    const R = 26;
    const C = 2 * Math.PI * R;
    this.C = C;
    // SVG über innerHTML, damit die Elemente im SVG-Namensraum entstehen
    this.ring = h('span', {
      class: 'perk-ring-svg',
      'aria-hidden': 'true',
      html: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="${R}" class="perk-ring-bg"/><circle cx="32" cy="32" r="${R}" class="perk-ring-fg" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="0" transform="rotate(-90 32 32)"/></svg>`,
    });
    this.secs = h('span', { class: 'perk-ring-num' }, String(Math.ceil(m.timeLeft)));
    this.status = h('p', { class: 'perk-status', role: 'status', 'aria-live': 'polite' });
    this.opts = h('div', { class: 'perk-options' });
    this.el = h(
      'div',
      { class: 'perk-overlay', role: 'dialog', 'aria-modal': 'false', 'aria-label': `Perk-Auswahl Runde ${m.round}` },
      h(
        'div',
        { class: 'perk-panel' },
        h(
          'div',
          { class: 'perk-top' },
          h('div', { class: 'perk-titles' }, h('span', { class: 'perk-kicker' }, `Auswahlpause · Runde ${m.round}/${m.rounds}`), h('h2', { class: 'perk-title' }, m.skipped ? 'Alle deine Karten haben schon einen Perk' : 'Wähle einen Perk')),
          h('div', { class: 'perk-ring' }, this.ring, this.secs),
        ),
        this.opts,
        this.status,
      ),
    );
    root.append(this.el);
    this.refresh(m);
    this.app.audio.sfx('double', 0.7);
  }

  refresh(m) {
    const picked = m.picked;
    if (!this.optEls || this.optKey !== m.options.map((o) => o.id).join()) {
      this.optKey = m.options.map((o) => o.id).join();
      this.optEls = m.options.map((o, i) => this.optionEl(o, i));
      this.opts.replaceChildren(...this.optEls);
    }
    m.options.forEach((o, i) => {
      const el = this.optEls[i];
      el.classList.toggle('chosen', picked === o.id);
      el.classList.toggle('dropped', !!picked && picked !== o.id);
      el.disabled = !!picked;
      el.setAttribute('aria-pressed', picked === o.id ? 'true' : 'false');
    });
    const oppDone = m.done.some((d, i) => i !== this.game.seat && d);
    if (m.skipped) this.status.textContent = oppDone ? 'Gleich geht es weiter …' : 'Dein Gegner wählt …';
    else if (picked) this.status.textContent = oppDone ? 'Gewählt! Gleich geht es weiter …' : 'Gewählt! Warte auf deinen Gegner …';
    else this.status.textContent = oppDone ? 'Dein Gegner hat schon gewählt.' : 'Antippen zum Wählen – sonst entscheidet der Zufall.';
  }

  optionEl(o, i) {
    const card = this.app.db.card(o.card);
    return h(
      'button',
      {
        class: `perk-option t-${o.tier}`,
        style: { '--i': i },
        'aria-label': `${card?.name}: ${o.name} (${PERK_TIER_LABELS[o.tier]}). ${o.description}`,
        onclick: () => this.pick(o),
      },
      h('span', { class: 'perk-opt-tier' }, perkBadge(o.tier)),
      h('span', { class: 'perk-opt-card' }, cardEl(this.app.db, o.card, { mini: true })),
      h('span', { class: 'perk-opt-cardname' }, card?.name || o.card),
      h('b', { class: 'perk-opt-name' }, o.name),
      h('span', { class: 'perk-opt-desc' }, o.description),
    );
  }

  pick(o) {
    if (!this.msg || this.msg.picked) return;
    this.msg = { ...this.msg, picked: o.id };
    this.app.net.send(C2S.PERK_PICK, { perk: o.id });
    this.refresh(this.msg);
    this.app.audio.sfx('select');
    this.app.haptic(14);
  }

  tick() {
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      if (!this.el) return;
      const left = Math.max(0, (this.deadline - performance.now()) / 1000);
      const k = Math.max(0, Math.min(1, left / this.total));
      const fg = this.ring.querySelector('.perk-ring-fg');
      fg?.setAttribute('stroke-dashoffset', ((1 - k) * this.C).toFixed(1));
      this.el.classList.toggle('hurry', left <= 2 && !this.msg?.picked);
      const s = String(Math.ceil(left));
      if (this.secs.textContent !== s) this.secs.textContent = s;
      this.tick();
    });
  }

  /** Ende der Runde: gewählte Karte leuchtet kurz auf, dann verschwindet das Overlay. */
  finish(res) {
    if (!this.el) return;
    const mine = res.picks?.[this.game.seat];
    const idx = this.msg?.options.findIndex((o) => o.id === mine?.id) ?? -1;
    if (idx >= 0) {
      this.optEls[idx].classList.add('chosen', 'confirm');
      this.optEls.forEach((el, i) => i !== idx && el.classList.add('dropped'));
    }
    if (res.auto?.[this.game.seat] && mine) this.status.textContent = `Zeit abgelaufen – der Zufall wählte „${mine.name}“.`;
    const el = this.el;
    el.classList.add('closing');
    const ms = reducedMotion() ? 150 : 650;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.el = null;
    this.optEls = null;
    setTimeout(() => el.remove(), ms);
  }

  destroy(immediate = false) {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.el && immediate) this.el.remove();
    this.el = null;
    this.optEls = null;
  }
}

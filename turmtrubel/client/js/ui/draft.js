// Draft-Screen für Triple Draft und Mega Draft sowie der Deck-Reveal danach.
// Der Server schickt nach jeder Wahl den kompletten Zustand (S2C.DRAFT); dieser Screen zeigt ihn nur an und
// schickt Wahl-Wünsche (C2S.DRAFT_PICK). Gesperrte Karten, Champion-Regel und Zeitablauf prüft der Server.
import { C2S } from '/shared/protocol.js';
import { costLabel } from '/shared/cards.js';
import { $, h, showScreen, currentScreen, toast } from './dom.js';
import { icon } from './icons.js';
import { cardEl, openCardDetail } from './cardview.js';
import { reducedMotion } from './tokens.js';
import { t } from '../lang/de.js';

const HOLD_MS = 450;
const TYPE_FILTERS = ['all', 'troop', 'spell', 'building', 'champion'];
const ELIXIR_FILTERS = [['all', 'Alle'], ['1-2', '1–2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6+', '6+']];
const RARITY_FILTERS = [['all', 'Alle'], ['common', 'Gewöhnlich'], ['rare', 'Selten'], ['epic', 'Episch'], ['legendary', 'Legendär']];

/** Tippen = auswählen, Halten = Details. */
function pressable(el, { onTap, onHold }) {
  let timer = null;
  let held = false;
  const clear = () => {
    clearTimeout(timer);
    timer = null;
  };
  el.addEventListener('pointerdown', (e) => {
    if (e.button && e.button !== 0) return;
    held = false;
    clear();
    timer = setTimeout(() => {
      held = true;
      onHold();
    }, HOLD_MS);
  });
  el.addEventListener('pointerup', clear);
  el.addEventListener('pointerleave', clear);
  el.addEventListener('pointercancel', clear);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener('click', () => {
    if (held) return;
    onTap();
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTap();
    } else if (e.key === 'i' || e.key === 'I') onHold();
  });
}

export class DraftUI {
  constructor(app) {
    this.app = app;
    this.db = app.db;
    this.root = $('#s-draft');
    this.state = null;
    this.kind = null;
    this.sel = null;
    this.sent = null; // zuletzt gewünschte Karte (für „zufällig gewählt“-Hinweis)
    this.filter = { type: 'all', elixir: 'all', rarity: 'all', q: '' };
    this.deadline = 0;
    this.raf = 0;
    this.revealing = false;
  }

  get modeName() {
    return this.app.modes?.get(this.state?.mode)?.name || t(`draftTitle.${this.kind}`);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.state = null;
    this.kind = null;
    this.revealing = false;
    this.root.replaceChildren();
  }

  // ───────────── Zustand vom Server ─────────────
  update(m) {
    const prev = this.state;
    if (this.kind !== m.kind || !this.built) this.build(m.kind);
    this.state = m;
    this.deadline = performance.now() + m.timeLeft * 1000;
    if (currentScreen() !== 's-draft') {
      showScreen('s-draft');
      this.app.audio.music('menu');
    }
    // neue eigene Karte? → Flug-Animation, Hinweis bei Auto-Pick
    const mine = this.myPicks(m);
    const before = prev ? this.myPicks(prev).length : 0;
    if (mine.length > before) {
      const id = mine[mine.length - 1];
      if (this.sent !== id && prev) toast(t('autoPicked', { card: this.db.card(id)?.name || id }), 'info', 2600);
      this.sent = null;
      this.sel = null;
      this.flyCard(id, mine.length - 1);
      this.app.audio.sfx('deploy', 0.6);
    }
    if (m.kind === 'mega' && prev && prev.turn !== m.turn && m.turn === m.you) this.app.audio.sfx('emote', 0.7);
    if (m.kind === 'triple' && prev && prev.round !== m.round) this.sel = null;
    this.render();
    if (!this.raf) this.tickTimer();
  }

  myPicks(m) {
    return m.kind === 'triple' ? m.picks : m.picks[m.you];
  }

  oppSeat() {
    return this.state.you === 0 ? 1 : 0;
  }

  // ───────────── Aufbau ─────────────
  build(kind) {
    this.kind = kind;
    this.built = true;
    this.revealing = false;
    this.sel = null;
    this.els = {};
    const E = this.els;
    E.title = h('h1', { class: 'draft-title' });
    E.progress = h('span', { class: 'draft-progress num' });
    E.turn = h('p', { class: 'draft-turn', role: 'status', 'aria-live': 'polite' });
    E.timerBar = h('i', { class: 'draft-timer-bar' });
    E.timerNum = h('span', { class: 'draft-timer-num num' });
    E.timer = h('div', { class: 'draft-timer', role: 'timer', 'aria-label': 'Restzeit' }, h('span', { class: 'draft-timer-track' }, E.timerBar), E.timerNum);
    E.main = h('div', { class: `draft-main ${kind}` });
    E.deckSlots = h('div', { class: 'draft-slots' });
    E.avg = h('span', { class: 'draft-avg num' });
    E.confirm = h('button', { class: 'btn btn-primary btn-big draft-confirm', hidden: true, onclick: () => this.confirm() });
    E.confirmWhy = h('p', { class: 'draft-why', role: 'status' });
    E.opp = kind === 'mega' ? h('div', { class: 'draft-opp' }) : null;
    if (kind === 'mega') {
      E.filters = this.buildFilters();
      E.grid = h('div', { class: 'mega-grid', role: 'list' });
      E.empty = h('p', { class: 'hint draft-empty', hidden: true }, t('noMatch'));
      E.main.append(E.filters, E.grid, E.empty);
    } else {
      E.offer = h('div', { class: 'triple-offer', role: 'list' });
      E.main.append(h('p', { class: 'draft-lead' }, t('pickOne')), E.offer, h('p', { class: 'hint small draft-hold' }, t('holdForDetail')));
    }
    this.root.replaceChildren(
      h(
        'div',
        { class: 'draft-wrap' },
        h('header', { class: 'draft-head' }, h('div', { class: 'draft-head-row' }, E.title, E.progress), E.turn, E.timer),
        E.main,
        h(
          'footer',
          { class: 'draft-foot panel' },
          h('div', { class: 'draft-confirm-row' }, E.confirm, E.confirmWhy),
          h('div', { class: 'draft-foot-head' }, h('span', { class: 'draft-foot-title' }, icon('cards'), t('deckBar')), E.avg),
          E.deckSlots,
          E.opp,
        ),
      ),
    );
  }

  buildFilters() {
    const f = this.filter;
    const chipRow = (label, items, key) => {
      const row = h('div', { class: 'chips', role: 'group', 'aria-label': label });
      for (const [k, txt] of items) {
        const b = h('button', { class: `fchip${f[key] === k ? ' on' : ''}${key === 'elixir' ? ' elixir' : ''}`, 'aria-pressed': f[key] === k ? 'true' : 'false' }, txt);
        b.addEventListener('click', () => {
          f[key] = k;
          for (const x of row.children) {
            x.classList.toggle('on', x === b);
            x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
          }
          this.renderGrid();
        });
        row.append(b);
      }
      return row;
    };
    const search = h('input', { class: 'text-input search', type: 'search', placeholder: t('searchCards'), 'aria-label': t('searchCards'), autocomplete: 'off' });
    search.addEventListener('input', () => {
      f.q = search.value.trim().toLowerCase();
      this.renderGrid();
    });
    return h(
      'div',
      { class: 'mega-filters' },
      search,
      chipRow('Kartentyp', TYPE_FILTERS.map((k) => [k, k === 'all' ? t('filterAll') : t(`filterTypes.${k}`)]), 'type'),
      chipRow('Elixier', ELIXIR_FILTERS, 'elixir'),
      chipRow('Seltenheit', RARITY_FILTERS, 'rarity'),
    );
  }

  // ───────────── Anzeige ─────────────
  render() {
    const m = this.state;
    const E = this.els;
    if (!m || this.revealing) return;
    E.title.textContent = this.modeName;
    const mine = this.myPicks(m);
    const max = m.kind === 'triple' ? m.rounds : m.perPlayer;
    E.progress.textContent = m.kind === 'triple' ? t('roundOf', { n: Math.min(m.round + 1, max), max }) : t('picksOf', { n: mine.length, max });
    const oppName = m.names[this.oppSeat()];
    let myTurn;
    if (m.kind === 'triple') {
      myTurn = !m.chosen && !m.done;
      E.turn.textContent = m.done ? t('revealSub') : myTurn ? t('pickOne') : t('waitOpp', { name: oppName });
    } else {
      myTurn = m.turn === m.you;
      const first = mine.length === 0 && m.picks[this.oppSeat()].length === 0 ? ' ' + (m.first === m.you ? t('firstPickYou') : t('firstPick', { name: m.names[m.first] })) : '';
      E.turn.textContent = (m.done ? t('revealSub') : myTurn ? t('yourTurn') : t('oppTurn', { name: oppName })) + first;
    }
    E.turn.classList.toggle('mine', !!myTurn);
    this.root.classList.toggle('my-turn', !!myTurn);
    if (m.kind === 'triple') this.renderOffer();
    else this.renderGrid();
    this.renderDeck();
    this.renderConfirm();
  }

  renderOffer() {
    const m = this.state;
    const E = this.els;
    const waiting = !!m.chosen;
    E.offer.replaceChildren(
      ...m.offer.map((id, i) => {
        const chosen = m.chosen === id;
        const wrap = h(
          'div',
          {
            class: `offer-card${this.sel === id ? ' sel' : ''}${chosen ? ' chosen' : ''}${waiting && !chosen ? ' dim' : ''}`,
            role: 'listitem',
            tabindex: waiting ? '-1' : '0',
            'aria-label': `${this.db.card(id).name}, ${costLabel(this.db.card(id))} Elixier`,
            dataset: { id },
            style: { '--i': i },
          },
          cardEl(this.db, id),
          h('span', { class: 'offer-type' }, this.typeLabel(id)),
        );
        pressable(wrap, {
          onTap: () => {
            if (waiting) return;
            if (this.sel === id) this.confirm();
            else {
              this.sel = id;
              this.renderOffer();
              this.renderConfirm();
            }
          },
          onHold: () => this.detail(id),
        });
        return wrap;
      }),
    );
  }

  typeLabel(id) {
    const c = this.db.card(id);
    if (c.class === 'champion') return 'Champion';
    if (c.class === 'hero') return 'Held';
    return { troop: 'Truppe', spell: 'Zauber', building: 'Gebäude' }[c.type] || '';
  }

  /** Karte im Mega-Pool: frei, von wem genommen, oder für mich gesperrt (Champion-Regel)? */
  poolInfo(id) {
    const m = this.state;
    const taken = m.taken.find(([x]) => x === id);
    if (taken) return { taken: true, by: taken[1] };
    const champ = this.db.card(id).class === 'champion';
    const locked = !m.done && champ && !m.allowed.includes(id);
    return { taken: false, locked };
  }

  matches(id) {
    const f = this.filter;
    const c = this.db.card(id);
    if (f.type === 'champion' ? c.class !== 'champion' : f.type !== 'all' && (c.type !== f.type || c.class === 'champion')) return false;
    if (f.elixir !== 'all') {
      const e = c.elixirRule === 'mirror' ? -1 : c.elixir;
      if (f.elixir === '1-2' && !(e >= 1 && e <= 2)) return false;
      if (f.elixir === '6+' && !(e >= 6)) return false;
      if (/^\d$/.test(f.elixir) && e !== Number(f.elixir)) return false;
    }
    if (f.rarity !== 'all' && c.rarity !== f.rarity && !(f.rarity === 'legendary' && c.class === 'champion')) return false;
    if (f.q && !c.name.toLowerCase().includes(f.q)) return false;
    return true;
  }

  renderGrid() {
    const m = this.state;
    const E = this.els;
    if (!m || m.kind !== 'mega') return;
    // Champions oben angepinnt, danach nach Elixier und Name
    const order = m.pool.slice().sort((a, b) => {
      const ca = this.db.card(a);
      const cb = this.db.card(b);
      const pa = ca.class === 'champion' ? 0 : 1;
      const pb = cb.class === 'champion' ? 0 : 1;
      return pa - pb || (ca.elixir || 0) - (cb.elixir || 0) || ca.name.localeCompare(cb.name, 'de');
    });
    const shown = order.filter((id) => this.matches(id));
    E.empty.hidden = shown.length > 0;
    E.grid.replaceChildren(
      ...shown.map((id) => {
        const info = this.poolInfo(id);
        const champ = this.db.card(id).class === 'champion';
        const mineTaken = info.taken && info.by === m.you;
        const cls = ['pool-card'];
        if (champ) cls.push('champ');
        if (info.taken) cls.push('taken', mineTaken ? 'by-me' : 'by-opp');
        if (info.locked) cls.push('locked');
        if (this.sel === id) cls.push('sel');
        const label = info.taken ? (mineTaken ? t('takenByYou') : t('takenByOpp', { name: m.names[info.by] })) : info.locked ? t('championLocked') : null;
        const el = h(
          'div',
          { class: cls.join(' '), role: 'listitem', tabindex: '0', dataset: { id }, 'aria-label': `${this.db.card(id).name}${label ? ' – ' + label : ''}` },
          cardEl(this.db, id, { mini: true }),
          champ ? h('span', { class: 'pool-champ', 'aria-hidden': 'true' }, icon('crown')) : null,
          label ? h('span', { class: 'pool-tag' }, label) : null,
        );
        pressable(el, {
          onTap: () => {
            if (info.taken) return this.detail(id);
            this.sel = this.sel === id ? null : id;
            this.renderGrid();
            this.renderConfirm();
          },
          onHold: () => this.detail(id),
        });
        return el;
      }),
    );
  }

  renderDeck() {
    const m = this.state;
    const E = this.els;
    const mine = this.myPicks(m);
    const max = m.kind === 'triple' ? m.rounds : m.perPlayer;
    E.deckSlots.replaceChildren(
      ...Array.from({ length: max }, (_, i) => {
        const id = mine[i];
        return h('div', { class: `draft-slot${id ? ' full' : ''}`, dataset: { slot: String(i) } }, id ? cardEl(this.db, id, { mini: true }) : h('span', { class: 'slot-num' }, String(i + 1)));
      }),
    );
    const costs = mine.map((id) => this.db.card(id)).filter((c) => c && c.elixirRule !== 'mirror').map((c) => c.elixir);
    const avg = costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
    E.avg.textContent = t('avgElixir', { v: avg.toFixed(1).replace('.', ',') });
    if (E.opp) {
      const opp = m.picks[this.oppSeat()];
      E.opp.replaceChildren(
        h('span', { class: 'draft-opp-title' }, t('oppPicks', { name: m.names[this.oppSeat()] })),
        h('div', { class: 'draft-opp-row' }, Array.from({ length: m.perPlayer }, (_, i) => (opp[i] ? cardEl(this.db, opp[i], { mini: true, hideName: true }) : h('div', { class: 'draft-opp-empty' })))),
      );
    }
  }

  /** Grund, warum die ausgewählte Karte gerade nicht wählbar ist (oder null). */
  blockReason(id) {
    const m = this.state;
    if (!id || m.done) return '';
    if (m.kind === 'triple') return m.chosen ? t('waitOpp', { name: m.names[this.oppSeat()] }) : null;
    if (m.turn !== m.you) return t('notYourTurn');
    const info = this.poolInfo(id);
    if (info.taken) return null;
    if (info.locked) return t('championLocked');
    return null;
  }

  renderConfirm() {
    const E = this.els;
    const id = this.sel;
    if (!id) {
      E.confirm.hidden = true;
      E.confirmWhy.textContent = '';
      return;
    }
    const why = this.blockReason(id);
    E.confirm.hidden = false;
    E.confirm.disabled = !!why;
    E.confirm.replaceChildren(icon('check'), `${t('pick')}: ${this.db.card(id).name}`);
    E.confirmWhy.textContent = why || '';
  }

  detail(id) {
    const why = this.blockReason(id);
    const info = this.state.kind === 'mega' ? this.poolInfo(id) : { taken: false };
    const offered = this.state.kind === 'triple' ? this.state.offer.includes(id) : !info.taken;
    openCardDetail(this.app, id, {
      actions: offered ? [{ label: t('pickConfirm'), cls: 'btn-primary', disabled: !!why, reason: why, onClick: () => this.pick(id) }] : [],
    });
  }

  confirm() {
    if (this.sel && !this.blockReason(this.sel)) this.pick(this.sel);
  }

  pick(id) {
    this.sent = id;
    this.app.net.send(C2S.DRAFT_PICK, { card: id });
    this.app.haptic(12);
  }

  /** Gewählte Karte fliegt in die Deck-Leiste (FLIP-Animation). */
  flyCard(id, slotIndex) {
    if (reducedMotion()) return;
    const src = this.root.querySelector(`[data-id="${CSS.escape(id)}"] .card`);
    if (!src) return;
    const from = src.getBoundingClientRect();
    requestAnimationFrame(() => {
      const slot = this.els.deckSlots.querySelector(`[data-slot="${slotIndex}"]`);
      if (!slot) return;
      const to = slot.getBoundingClientRect();
      const ghost = cardEl(this.db, id);
      ghost.classList.add('fly-card');
      Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
      document.body.append(ghost);
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      const k = Math.max(0.2, to.width / from.width);
      slot.classList.add('incoming');
      const anim = ghost.animate(
        [
          { transform: 'translate(0,0) scale(1) rotate(0deg)', offset: 0 },
          { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 40}px) scale(${(1 + k) / 2 + 0.08}) rotate(-6deg)`, offset: 0.45 },
          { transform: `translate(${dx}px, ${dy}px) scale(${k}) rotate(0deg)`, offset: 1 },
        ],
        { duration: 520, easing: 'cubic-bezier(.3,.7,.2,1)' },
      );
      anim.onfinish = () => {
        ghost.remove();
        slot.classList.remove('incoming');
        slot.classList.add('landed');
      };
    });
  }

  tickTimer() {
    const E = this.els;
    const step = () => {
      if (!this.state || currentScreen() !== 's-draft') {
        this.raf = 0;
        return;
      }
      const total = (this.state.pickSeconds || 15) * 1000;
      const left = Math.max(0, this.deadline - performance.now());
      if (!this.revealing && E?.timerBar) {
        E.timerBar.style.transform = `scaleX(${Math.min(1, left / total)})`;
        E.timerNum.textContent = `${Math.ceil(left / 1000)} s`;
        E.timer.classList.toggle('warn', left < 5000 && !this.state.done);
      }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  // ───────────── Reveal ─────────────
  reveal(m) {
    if (!this.built) this.build(this.kind || 'triple');
    this.revealing = true;
    showScreen('s-draft');
    const me = this.state?.you ?? 0;
    const rows = m.decks.map((deck, seat) => {
      const costs = deck.map((id) => this.db.card(id)).filter((c) => c && c.elixirRule !== 'mirror').map((c) => c.elixir);
      const avg = costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
      return h(
        'div',
        { class: `reveal-row ${m.teams?.[seat] === 0 ? 'blue' : 'red'}${seat === me ? ' me' : ''}`, style: { '--i': seat } },
        h('div', { class: 'reveal-name' }, h('b', {}, m.names[seat] + (seat === me ? ` (${t('you')})` : '')), h('span', { class: 'num' }, t('avgElixir', { v: avg.toFixed(1).replace('.', ',') }))),
        h('div', { class: 'reveal-cards' }, deck.map((id, i) => h('div', { class: 'reveal-card', style: { '--j': i } }, cardEl(this.db, id, { mini: true })))),
      );
    });
    this.els.count = h('div', { class: 'reveal-count num', 'aria-live': 'assertive' });
    this.root.replaceChildren(
      h('div', { class: 'draft-reveal' }, h('h1', { class: 'reveal-title' }, t('revealTitle')), h('p', { class: 'reveal-sub' }, this.modeName), rows, this.els.count),
    );
    this.built = false;
    this.app.audio.sfx('double', 0.6);
  }

  countdown(n) {
    const el = this.els?.count;
    if (!el) return;
    el.replaceChildren(h('span', { class: 'count-num' }, n > 0 ? String(n) : 'Los!'));
    this.app.audio.sfx(n > 0 ? 'count' : 'go');
  }
}

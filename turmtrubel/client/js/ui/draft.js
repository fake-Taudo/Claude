// Draft-Screen für Triple Draft und Mega Draft sowie der Deck-Reveal danach.
//
// Aufbau wie im Kampf: die Arena als abgedunkelte Kulisse, oben die rote Leiste des Gegners mit seinen 8 Plätzen,
// unten die eigene blaue Leiste mit Ø-Elixier und 8 Plätzen, dazwischen das Brett mit Titel und Karten, darunter der
// Zeitbalken.
//   Triple: oben „Optionen des Gegners“ (seine 3 aktuellen Karten), darunter „Wähle deine Karte“ mit 3 großen Karten.
//           Jeder wählt im eigenen Tempo; die Picks des Gegners erscheinen verdeckt („?“). Timer = Gesamtfrist.
//   Mega:   „Wähle eine Karte“ über einem Raster aller 40 Karten; vergebene Karten mit Häkchen in der Farbe des
//           Wählenden, Champions mit Goldrahmen vorne. Filter/Suche als Ausklapp-Menü. Timer = Frist pro Pick.
// Antippen wählt eine Karte aus (darunter erscheinen „Wählen“ und „Info“), Halten öffnet die Details.
// Die Kartengrößen passen sich dem freien Platz an (fit), damit alles ohne Scrollen sichtbar ist – auch die 40 Karten
// des Mega Drafts im Hoch- und Querformat.
// Der Server schickt nach jeder Wahl den kompletten Zustand (S2C.DRAFT) und prüft jede Wahl (C2S.DRAFT_PICK).
import { C2S } from '/shared/protocol.js';
import { costLabel } from '/shared/cards.js';
import { $, h, showScreen, currentScreen, toast } from './dom.js';
import { icon } from './icons.js';
import { openCardDetail } from './cardview.js';
import { cardArtURL } from './art.js';
import { reducedMotion } from './tokens.js';
import { paintArenaBackdrop } from '../game/renderer.js';
import { t } from '../lang/de.js';

const HOLD_MS = 450;
const TYPE_FILTERS = ['all', 'troop', 'spell', 'building', 'champion'];
const ELIXIR_FILTERS = [['all', 'Alle'], ['1-2', '1–2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6+', '6+']];
const RARITY_FILTERS = [['all', 'Alle'], ['common', 'Gewöhnlich'], ['rare', 'Selten'], ['epic', 'Episch'], ['legendary', 'Legendär']];

/** Tippen = auswählen, Halten = Details (Maus, Touch, Tastatur). */
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

/**
 * Draft-Karte wie in der Referenz: Kartenbild im Rahmen der Seltenheit, Legendär/Champion sechseckig,
 * Elixier-Tropfen mittig am unteren Rand. size: 'big' | 'mid' | 'small' | 'slot'.
 */
export function draftCard(db, id, { size = 'mid', name = false } = {}) {
  const c = db.card(id);
  if (!c) return h('div', { class: `dc ${size} empty` });
  const hex = c.rarity === 'legendary' || c.class === 'champion';
  const cls = ['dc', size, `r-${c.rarity}`];
  if (c.class !== 'normal') cls.push(`c-${c.class}`);
  if (hex) cls.push('hex');
  return h(
    'div',
    { class: cls.join(' '), dataset: { id }, title: c.name },
    h('div', { class: 'dc-frame' }, h('div', { class: 'dc-art' }, h('img', { src: cardArtURL(db, id, false), alt: '', draggable: 'false' }))),
    h('span', { class: 'dc-cost', 'aria-hidden': 'true' }, costLabel(c)),
    c.class === 'champion' ? h('span', { class: 'dc-crown', 'aria-hidden': 'true' }, icon('crown')) : c.class === 'hero' ? h('span', { class: 'dc-hero', 'aria-hidden': 'true' }, 'HELD') : null,
    name ? h('span', { class: 'dc-name' }, c.name) : null,
  );
}

/** Verdeckte Karte des Gegners („?“). */
function hiddenCard(size = 'slot') {
  return h('div', { class: `dc ${size} hidden`, 'aria-label': t('hiddenCard') }, h('div', { class: 'dc-frame' }, h('div', { class: 'dc-art' }, h('span', { class: 'dc-q' }, '?'))));
}

const avgOf = (db, ids) => {
  const costs = ids.map((id) => db.card(id)).filter((c) => c && c.elixirRule !== 'mirror').map((c) => c.elixir);
  return costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
};
const fmtAvg = (v) => v.toFixed(1).replace('.', ',');

export class DraftUI {
  constructor(app) {
    this.app = app;
    this.db = app.db;
    this.root = $('#s-draft');
    this.state = null;
    this.kind = null;
    this.sel = null;
    this.sent = null; // zuletzt gewünschte Karte (für den „zufällig gewählt“-Hinweis)
    this.filter = { type: 'all', elixir: 'all', rarity: 'all', q: '' };
    this.filterOpen = false;
    this.deadline = 0;
    this.raf = 0;
    this.revealing = false;
    this.built = false;
    this.onResize = () => {
      clearTimeout(this.resizeT);
      this.resizeT = setTimeout(() => {
        this.paintBackdrop();
        this.fit();
        this.renderPop();
      }, 120);
    };
  }

  get modeName() {
    return this.app.modes?.get(this.state?.mode)?.name || t(`draftTitle.${this.kind}`);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    window.removeEventListener('resize', this.onResize);
    this.state = null;
    this.kind = null;
    this.revealing = false;
    this.built = false;
    this.sel = null;
    this.filterOpen = false;
    this.root.replaceChildren();
    this.root.className = 'screen' + (currentScreen() === 's-draft' ? ' active' : '');
  }

  oppSeat() {
    return this.state.you === 0 ? 1 : 0;
  }

  myPicks(m = this.state) {
    return m.kind === 'triple' ? m.picks : m.picks[m.you];
  }

  oppCount(m = this.state) {
    return m.kind === 'triple' ? m.oppCounts[this.oppSeatOf(m)] : m.picks[this.oppSeatOf(m)].length;
  }

  oppSeatOf(m) {
    return m.you === 0 ? 1 : 0;
  }

  // ───────────── Zustand vom Server ─────────────
  update(m) {
    const prev = this.state;
    if (!this.built || this.kind !== m.kind || this.revealing) this.build(m.kind, m);
    this.state = m;
    this.deadline = performance.now() + m.timeLeft * 1000;
    if (currentScreen() !== 's-draft') {
      showScreen('s-draft');
      this.app.audio.music('menu');
      this.paintBackdrop();
    }
    const mine = this.myPicks(m);
    const before = prev ? this.myPicks(prev).length : 0;
    const oppBefore = prev ? this.oppCount(prev) : 0;
    const newMine = mine.length > before ? mine[mine.length - 1] : null;
    if (newMine && prev && this.sent !== newMine) toast(t('autoPicked', { card: this.db.card(newMine)?.name || newMine }), 'info', 2600);
    // Quelle für die Flug-Animation merken, bevor neu gezeichnet wird
    const flyFrom = newMine ? this.cardRect(newMine) : null;
    let oppFrom = null;
    let oppId = null;
    if (m.kind === 'mega' && prev) {
      const opp = m.picks[this.oppSeatOf(m)];
      if (opp.length > oppBefore) {
        oppId = opp[opp.length - 1];
        oppFrom = this.cardRect(oppId);
      }
    }
    if (newMine) {
      this.sent = null;
      this.sel = null;
    }
    if (m.kind === 'mega' && prev && prev.turn !== m.turn && m.turn === m.you) this.app.audio.sfx('emote', 0.7);
    if (m.kind === 'mega' && !prev && !m.done && m.picks.every((p) => !p.length)) toast(m.first === m.you ? t('firstPickYou') : t('firstPick', { name: m.names[m.first] }), 'info', 3200);
    this.render();
    if (newMine) {
      this.fly(newMine, flyFrom, this.els.meSlots, mine.length - 1);
      this.app.audio.sfx('deploy', 0.6);
    }
    if (oppId) this.fly(oppId, oppFrom, this.els.oppSlots, m.picks[this.oppSeatOf(m)].length - 1);
    else if (m.kind === 'triple' && prev && this.oppCount(m) > oppBefore) this.popSlot(this.els.oppSlots, this.oppCount(m) - 1);
    if (!this.raf) this.tickTimer();
  }

  cardRect(id) {
    const el = this.root.querySelector(`.dv-board [data-id="${CSS.escape(id)}"] .dc-frame`);
    return el ? el.getBoundingClientRect() : null;
  }

  // ───────────── Aufbau ─────────────
  build(kind, m) {
    this.kind = kind;
    this.built = true;
    this.revealing = false;
    this.sel = null;
    this.filterOpen = false;
    this.offerKey = null;
    this.oppKey = null;
    this.fitKey = null;
    this.cells = new Map();
    const E = (this.els = {});
    this.root.className = `screen draft-v2 ${kind}${currentScreen() === 's-draft' ? ' active' : ''}`;
    E.canvas = h('canvas', { class: 'dv-arena', 'aria-hidden': 'true' });
    // Gegner (oben, rot)
    E.oppSlots = h('div', { class: 'dv-slots', role: 'list', 'aria-label': 'Karten des Gegners' });
    E.oppName = h('b', { class: 'dv-name' });
    E.oppSub = h('span', { class: 'dv-sub' });
    E.oppStrip = h(
      'header',
      { class: 'dv-strip opp' },
      h('div', { class: 'dv-strip-in' }, E.oppSlots, h('div', { class: 'dv-player' }, h('span', { class: 'dv-badge red', 'aria-hidden': 'true' }, icon('shield')), h('div', { class: 'dv-who' }, E.oppName, E.oppSub))),
    );
    // Brett
    E.board = h('main', { class: 'dv-board' });
    if (kind === 'triple') {
      E.oppLabel = h('p', { class: 'dv-label' }, t('oppOptions'));
      E.oppOptions = h('div', { class: 'dv-row small', role: 'list', 'aria-label': t('oppOptions') });
      E.title = h('h1', { class: 'dv-title' }, t('chooseYourCard'));
      E.offer = h('div', { class: 'dv-row big', role: 'list', 'aria-label': t('chooseYourCard') });
      E.status = h('p', { class: 'dv-status', role: 'status', 'aria-live': 'polite' });
      E.board.append(h('section', { class: 'dv-opp-options' }, E.oppLabel, E.oppOptions), h('section', { class: 'dv-mine' }, E.title, E.offer, E.status));
    } else {
      E.title = h('h1', { class: 'dv-title' });
      E.turn = h('p', { class: 'dv-sr', role: 'status', 'aria-live': 'polite' });
      E.filterBtn = h('button', { class: 'icon-btn dv-filter-btn', title: t('filter'), 'aria-label': t('filter'), 'aria-expanded': 'false', onclick: () => this.toggleFilter() }, icon('search'));
      E.filters = this.buildFilters();
      E.grid = h('div', { class: 'dv-grid', role: 'list', 'aria-label': 'Kartenpool' });
      E.empty = h('p', { class: 'dv-status', hidden: true }, t('noMatch'));
      E.board.append(h('div', { class: 'dv-title-row' }, E.title, E.filterBtn), E.turn, E.filters, h('div', { class: 'dv-grid-wrap' }, E.grid, E.empty));
    }
    // Zeitbalken
    E.timerLabel = h('span', { class: 'dv-timer-label' }, kind === 'triple' ? t('battleIn') : t('timeLeftLabel'));
    E.timerBar = h('i', { class: 'dv-timer-bar' });
    E.timerNum = h('span', { class: 'dv-timer-num num' });
    E.timer = h('div', { class: 'dv-timer', role: 'timer', 'aria-label': 'Restzeit' }, E.timerLabel, h('span', { class: 'dv-timer-track' }, E.timerBar), E.timerNum);
    // Eigene Leiste (unten, blau)
    E.meSlots = h('div', { class: 'dv-slots', role: 'list', 'aria-label': t('deckBar') });
    E.meName = h('b', { class: 'dv-name' });
    E.meSub = h('span', { class: 'dv-sub' });
    E.avg = h('span', { class: 'dv-avg num' });
    E.meStrip = h(
      'footer',
      { class: 'dv-strip me' },
      h(
        'div',
        { class: 'dv-strip-in' },
        h('div', { class: 'dv-player' }, h('span', { class: 'dv-badge blue', 'aria-hidden': 'true' }, icon('shield')), h('div', { class: 'dv-who' }, E.meName, E.meSub), E.avg),
        E.meSlots,
      ),
    );
    E.pop = h('div', { class: 'dv-pop', hidden: true });
    this.root.replaceChildren(E.canvas, h('div', { class: 'dv' }, E.oppStrip, E.board, E.timer, E.meStrip), E.pop);
    window.removeEventListener('resize', this.onResize);
    window.addEventListener('resize', this.onResize);
    if (currentScreen() === 's-draft') this.paintBackdrop();
    void m;
  }

  paintBackdrop() {
    const cv = this.root.querySelector('.dv-arena');
    if (!cv) return;
    try {
      paintArenaBackdrop(cv, { side: 0 });
    } catch (e) {
      console.warn(e);
    }
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
      { class: 'dv-filters', hidden: true },
      search,
      chipRow('Kartentyp', TYPE_FILTERS.map((k) => [k, k === 'all' ? t('filterAll') : t(`filterTypes.${k}`)]), 'type'),
      chipRow('Elixier', ELIXIR_FILTERS, 'elixir'),
      chipRow('Seltenheit', RARITY_FILTERS, 'rarity'),
    );
  }

  toggleFilter(open = !this.filterOpen) {
    this.filterOpen = open;
    this.els.filters.hidden = !open;
    this.els.filterBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    this.els.filterBtn.classList.toggle('on', open);
    this.fit();
  }

  filterActive() {
    const f = this.filter;
    return f.type !== 'all' || f.elixir !== 'all' || f.rarity !== 'all' || !!f.q;
  }

  // ───────────── Anzeige ─────────────
  render() {
    const m = this.state;
    const E = this.els;
    if (!m || this.revealing) return;
    const opp = this.oppSeatOf(m);
    const mine = this.myPicks(m);
    const max = m.kind === 'triple' ? m.rounds : m.perPlayer;
    E.oppName.textContent = m.names[opp];
    E.oppSub.textContent = t('pickedOf', { n: this.oppCount(m), max });
    E.meName.textContent = m.names[m.you] + ` (${t('you')})`;
    E.meSub.textContent = t('pickedOf', { n: mine.length, max });
    E.avg.replaceChildren(t('avgCost', { v: fmtAvg(avgOf(this.db, mine)) }), h('span', { class: 'dv-drop', 'aria-hidden': 'true' }));
    this.renderSlots(E.meSlots, mine, max, false);
    if (m.kind === 'triple') this.renderSlots(E.oppSlots, new Array(this.oppCount(m)).fill(null), max, true);
    else this.renderSlots(E.oppSlots, m.picks[opp], max, false);
    if (m.kind === 'triple') this.renderTriple();
    else this.renderMega();
    this.fit();
    this.renderPop();
  }

  // ───────────── Größen an den Platz anpassen ─────────────
  fit() {
    const E = this.els;
    if (!E || !this.state || this.revealing || !E.board.clientHeight) return;
    const key = `${innerWidth}x${innerHeight}|${this.offerKey}|${this.oppKey}|${this.filterOpen}`;
    if (key === this.fitKey) return;
    this.fitKey = key;
    if (this.kind === 'mega') this.fitGrid();
    else this.fitTriple();
  }

  /** Triple: große Karten so groß wie möglich, bis das Brett nicht mehr überläuft. */
  fitTriple() {
    const board = this.els.board;
    const st = board.style;
    // fertig gewählt: Größen beibehalten (die Optionen des Gegners sollen nicht plötzlich wachsen)
    if (!this.state.offer.length && st.getPropertyValue('--bw')) return;
    let bw = Math.min(190, (board.clientWidth - 56) / 3);
    for (let i = 0; i < 18; i++) {
      st.setProperty('--bw', `${Math.round(bw)}px`);
      st.setProperty('--sw', `${Math.round(Math.max(44, Math.min(100, bw * 0.52)))}px`);
      if (board.scrollHeight <= board.clientHeight + 1 && board.scrollWidth <= board.clientWidth + 1) break;
      if (bw <= 60) break;
      bw = Math.max(60, bw * 0.92);
    }
  }

  /** Mega: Spaltenzahl und Kartenbreite so wählen, dass alle Karten des Pools ohne Scrollen passen. */
  fitGrid() {
    const E = this.els;
    const board = E.board;
    const cs = getComputedStyle(board);
    const W = E.grid.parentElement.clientWidth - 4;
    // Platz unter der Titelzeile; offene Filter schieben das Raster nur nach unten (dann darf es scrollen)
    const gap = parseFloat(cs.rowGap) || 0;
    const H = board.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - E.title.parentElement.offsetHeight - gap - 4;
    const n = this.state.pool.length;
    const metrics = (cols) => {
      const gx = cols > 9 ? 6 : 8;
      const cw = Math.min(104, (W - (cols - 1) * gx) / cols);
      const drop = Math.max(14, Math.min(26, cw * 0.36));
      const gy = Math.round(drop * 0.45 + 4);
      const rows = Math.ceil(n / cols);
      return { cols, gx, gy, cw, drop, height: rows * cw * 1.25 + (rows - 1) * gy + drop * 0.45 + 8 };
    };
    let best = null;
    for (let cols = 4; cols <= 20 && !best; cols++) {
      const x = metrics(cols);
      if (x.cw < 30) break;
      if (x.height <= H) best = x;
    }
    // passt nichts: Karten nicht kleiner als 44 px, dann darf das Raster scrollen
    if (!best) best = metrics(Math.max(4, Math.floor((W + 8) / 52)));
    const st = E.grid.style;
    st.setProperty('--cols', best.cols);
    st.setProperty('--cw', `${Math.floor(best.cw)}px`);
    st.setProperty('--gx', `${best.gx}px`);
    st.setProperty('--gy', `${best.gy}px`);
    st.setProperty('--cdrop', `${Math.round(best.drop)}px`);
  }

  renderSlots(root, ids, max, hidden) {
    root.replaceChildren(
      ...Array.from({ length: max }, (_, i) => {
        const has = i < ids.length;
        const inner = !has ? null : hidden ? hiddenCard('slot') : draftCard(this.db, ids[i], { size: 'slot' });
        return h('div', { class: `dv-slot${has ? ' full' : ''}`, role: 'listitem', dataset: { slot: String(i) } }, inner);
      }),
    );
  }

  renderTriple() {
    const m = this.state;
    const E = this.els;
    const opp = this.oppSeatOf(m);
    const oppOffer = m.oppOffers?.[opp] || [];
    // nur neu aufbauen (und einfliegen lassen), wenn sich die Angebote ändern – nicht bei jedem Zustand
    const oppKey = oppOffer.join(',');
    if (oppKey !== this.oppKey) {
      this.oppKey = oppKey;
      E.oppOptions.replaceChildren(...oppOffer.map((id, i) => h('div', { class: 'dv-opt', role: 'listitem', title: this.db.card(id)?.name, style: { '--i': i }, onclick: () => this.detail(id, false) }, draftCard(this.db, id, { size: 'small' }))));
    }
    E.oppLabel.textContent = oppOffer.length ? t('oppOptions') : t('oppDone', { name: m.names[opp] });
    const key = `${m.round}|${m.offer.join(',')}`;
    if (key !== this.offerKey) this.offerKey = key;
    else {
      for (const el of E.offer.children) el.classList.toggle('sel', el.dataset.id === this.sel);
      this.renderTripleText();
      return;
    }
    E.offer.replaceChildren(
      ...m.offer.map((id, i) => {
        const card = this.db.card(id);
        const el = h(
          'div',
          {
            class: `dv-pick${this.sel === id ? ' sel' : ''}`,
            role: 'listitem',
            tabindex: '0',
            'aria-label': `${card.name}, ${costLabel(card)} Elixier`,
            dataset: { id },
            style: { '--i': i },
          },
          draftCard(this.db, id, { size: 'big', name: true }),
        );
        pressable(el, { onTap: () => this.tap(id), onHold: () => this.detail(id) });
        return el;
      }),
    );
    this.renderTripleText();
  }

  renderTripleText() {
    const m = this.state;
    const E = this.els;
    const opp = this.oppSeatOf(m);
    E.title.textContent = m.mineDone ? t('youDone', { name: m.names[opp] }) : t('chooseYourCard');
    E.status.textContent = m.mineDone ? '' : t('roundOf', { n: m.round + 1, max: m.rounds });
    this.root.classList.toggle('my-turn', !m.mineDone);
  }

  /** Karte im Mega-Pool: frei, von wem genommen, oder für mich gesperrt (Champion-Regel)? */
  poolInfo(id) {
    const m = this.state;
    const taken = m.taken.find(([x]) => x === id);
    if (taken) return { taken: true, by: taken[1] };
    const champ = this.db.card(id).class === 'champion';
    return { taken: false, locked: !m.done && champ && !m.allowed.includes(id) };
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

  renderMega() {
    const m = this.state;
    const E = this.els;
    const opp = this.oppSeatOf(m);
    const myTurn = m.turn === m.you && !m.done;
    E.title.textContent = myTurn ? t('chooseACard') : m.done ? t('revealSub') : t('oppTurn', { name: m.names[opp] });
    const firstLine = this.myPicks(m).length === 0 && m.picks[opp].length === 0 ? (m.first === m.you ? t('firstPickYou') : t('firstPick', { name: m.names[m.first] })) : '';
    E.turn.textContent = myTurn ? `${t('yourTurn')} ${firstLine}`.trim() : firstLine;
    E.title.classList.toggle('mine', myTurn);
    this.root.classList.toggle('my-turn', myTurn);
    this.renderGrid();
  }

  renderGrid() {
    const m = this.state;
    const E = this.els;
    if (!m || m.kind !== 'mega' || this.revealing) return;
    E.filterBtn.classList.toggle('active', this.filterActive());
    E.filterBtn.title = this.filterActive() ? t('filterActive') : t('filter');
    // Champions vorne, danach nach Elixier und Name
    const order = m.pool.slice().sort((a, b) => {
      const ca = this.db.card(a);
      const cb = this.db.card(b);
      return (ca.class === 'champion' ? 0 : 1) - (cb.class === 'champion' ? 0 : 1) || (ca.elixir || 0) - (cb.elixir || 0) || ca.name.localeCompare(cb.name, 'de');
    });
    const shown = order.filter((id) => this.matches(id));
    E.empty.hidden = shown.length > 0;
    // Zellen bleiben erhalten (kein Neuaufbau bei jedem Pick): nur Klassen und Häkchen ändern sich
    const nodes = shown.map((id, i) => {
      let el = this.cells.get(id);
      if (!el) {
        el = h('div', { class: 'dv-cell', role: 'listitem', tabindex: '0', dataset: { id } }, draftCard(this.db, id, { size: 'mid' }));
        pressable(el, { onTap: () => (this.poolInfo(id).taken ? this.detail(id, false) : this.tap(id)), onHold: () => this.detail(id) });
        this.cells.set(id, el);
      }
      el.style.setProperty('--i', i);
      this.updateCell(el, id);
      return el;
    });
    const cur = E.grid.children;
    if (cur.length !== nodes.length || nodes.some((el, i) => cur[i] !== el)) E.grid.replaceChildren(...nodes);
  }

  updateCell(el, id) {
    const m = this.state;
    const info = this.poolInfo(id);
    const mineTaken = info.taken && info.by === m.you;
    el.classList.toggle('taken', info.taken);
    el.classList.toggle('by-me', mineTaken);
    el.classList.toggle('by-opp', info.taken && !mineTaken);
    el.classList.toggle('locked', !!info.locked);
    el.classList.toggle('sel', this.sel === id);
    const name = this.db.card(id).name;
    const label = info.taken ? (mineTaken ? t('takenByYou') : t('takenByOpp', { name: m.names[info.by] })) : info.locked ? t('championLocked') : '';
    el.setAttribute('aria-label', `${name}, ${costLabel(this.db.card(id))} Elixier${label ? ' – ' + label : ''}`);
    el.title = label ? `${name} – ${label}` : name;
    const check = el.querySelector('.dv-check');
    if (info.taken && !check) el.append(h('span', { class: 'dv-check', 'aria-hidden': 'true' }, icon('check')));
    else if (!info.taken && check) check.remove();
    const lock = el.querySelector('.dv-lock');
    if (info.locked && !lock) el.append(h('span', { class: 'dv-lock', 'aria-hidden': 'true' }, icon('cross')));
    else if (!info.locked && lock) lock.remove();
  }

  /** Antippen: auswählen; nochmals antippen: wählen (wenn erlaubt). */
  tap(id) {
    if (this.sel === id) {
      if (!this.blockReason(id)) this.pick(id);
      return;
    }
    this.sel = id;
    this.app.audio.sfx('select', 0.5);
    if (this.kind === 'triple') this.renderTriple();
    else this.renderGrid();
    this.renderPop();
  }

  /** Grund, warum eine Karte gerade nicht wählbar ist (leer = wählbar). */
  blockReason(id) {
    const m = this.state;
    if (!id || m.done) return t('revealSub');
    if (m.kind === 'triple') return m.mineDone ? t('youDone', { name: m.names[this.oppSeatOf(m)] }) : m.offer.includes(id) ? '' : t('notYourTurn');
    if (m.turn !== m.you) return t('notYourTurn');
    const info = this.poolInfo(id);
    if (info.taken) return t('takenByOpp', { name: m.names[info.by] });
    if (info.locked) return t('championLocked');
    return '';
  }

  /** Knöpfe „Wählen“ und „Info“ direkt unter der ausgewählten Karte. */
  renderPop() {
    const E = this.els;
    const id = this.sel;
    const target = id ? this.root.querySelector(`.dv-board [data-id="${CSS.escape(id)}"]`) : null;
    if (!target || this.revealing) {
      E.pop.hidden = true;
      return;
    }
    const why = this.blockReason(id);
    const kids = [
      h('button', { class: 'btn btn-primary dv-pick-btn', disabled: !!why, onclick: () => !why && this.pick(id) }, icon('check'), t('pick')),
      h('button', { class: 'btn btn-secondary btn-small dv-info-btn', onclick: () => this.detail(id) }, t('info')),
    ];
    if (why) kids.push(h('p', { class: 'dv-why' }, why));
    E.pop.replaceChildren(...kids);
    E.pop.hidden = false;
    // unter der Karte samt Name und Elixier-Tropfen
    const parts = [target, target.querySelector('.dc-name'), target.querySelector('.dc-cost')].filter(Boolean).map((x) => x.getBoundingClientRect());
    const r = { left: parts[0].left, width: parts[0].width, top: Math.min(...parts.map((x) => x.top)), bottom: Math.max(...parts.map((x) => x.bottom)) };
    const pr = E.pop.getBoundingClientRect();
    const vw = innerWidth;
    const vh = innerHeight;
    let top = r.bottom + 6;
    if (top + pr.height > vh - 4) top = Math.max(4, r.top - pr.height - 6);
    const left = Math.max(6, Math.min(vw - pr.width - 6, r.left + r.width / 2 - pr.width / 2));
    E.pop.style.left = `${left}px`;
    E.pop.style.top = `${top}px`;
  }

  detail(id, allowPick = true) {
    const why = this.blockReason(id);
    const offered = allowPick && (this.state.kind === 'triple' ? this.state.offer.includes(id) : !this.poolInfo(id).taken);
    openCardDetail(this.app, id, {
      actions: offered ? [{ label: t('pickConfirm'), cls: 'btn-primary', disabled: !!why, reason: why, onClick: () => this.pick(id) }] : [],
    });
  }

  pick(id) {
    this.sent = id;
    this.app.net.send(C2S.DRAFT_PICK, { card: id });
    this.app.haptic(12);
    this.els.pop.hidden = true;
  }

  // ───────────── Animationen ─────────────
  /** Gewählte Karte fliegt in den Platz der Leiste (FLIP). */
  fly(id, from, slots, index) {
    const slot = slots?.querySelector(`[data-slot="${index}"]`);
    if (!slot) return;
    if (reducedMotion() || !from) {
      slot.classList.add('landed');
      return;
    }
    const to = slot.getBoundingClientRect();
    const ghost = draftCard(this.db, id, { size: 'mid' });
    ghost.classList.add('dv-fly');
    Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
    document.body.append(ghost);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const k = Math.max(0.2, to.width / from.width);
    slot.classList.add('incoming');
    const anim = ghost.animate(
      [
        { transform: 'translate(0,0) scale(1) rotate(0deg)' },
        { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 30}px) scale(${(1 + k) / 2 + 0.1}) rotate(-6deg)`, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy}px) scale(${k}) rotate(0deg)` },
      ],
      { duration: 520, easing: 'cubic-bezier(.3,.7,.2,1)' },
    );
    anim.onfinish = () => {
      ghost.remove();
      slot.classList.remove('incoming');
      slot.classList.add('landed');
    };
  }

  /** Verdeckter Pick des Gegners erscheint („?“ springt in den Platz). */
  popSlot(slots, index) {
    const slot = slots?.querySelector(`[data-slot="${index}"]`);
    if (slot && !reducedMotion()) slot.classList.add('landed');
  }

  tickTimer() {
    const step = () => {
      const E = this.els;
      if (!this.state || currentScreen() !== 's-draft') {
        this.raf = 0;
        return;
      }
      const total = (this.state.timerSeconds || 15) * 1000;
      const left = Math.max(0, this.deadline - performance.now());
      if (!this.revealing && E?.timerBar) {
        E.timerBar.style.transform = `scaleX(${Math.min(1, left / total)})`;
        E.timerNum.textContent = `${Math.ceil(left / 1000)}s`;
        E.timer.classList.toggle('warn', left < 6000 && !this.state.done);
      }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  // ───────────── Reveal ─────────────
  /** Beide Decks stehen: die Leiste des Gegners deckt seine Karten auf, in der Mitte Titel und Countdown. */
  reveal(m) {
    if (!this.built) this.build(this.kind || 'triple', this.state);
    this.revealing = true;
    this.els.pop.hidden = true;
    showScreen('s-draft');
    this.paintBackdrop();
    const me = this.state?.you ?? 0;
    const opp = me === 0 ? 1 : 0;
    const E = this.els;
    this.root.classList.add('revealing');
    this.root.classList.remove('my-turn');
    this.renderSlots(E.oppSlots, m.decks[opp], 8, false);
    this.renderSlots(E.meSlots, m.decks[me], 8, false);
    E.oppSlots.querySelectorAll('.dv-slot').forEach((s, i) => {
      s.classList.add('flip');
      s.style.setProperty('--j', i);
    });
    E.oppName.textContent = m.names[opp];
    E.oppSub.textContent = t('avgCost', { v: fmtAvg(avgOf(this.db, m.decks[opp])) });
    E.meSub.textContent = t('pickedOf', { n: 8, max: 8 });
    E.avg.replaceChildren(t('avgCost', { v: fmtAvg(avgOf(this.db, m.decks[me])) }), h('span', { class: 'dv-drop', 'aria-hidden': 'true' }));
    E.count = h('div', { class: 'dv-count num', 'aria-live': 'assertive' });
    E.board.replaceChildren(h('div', { class: 'dv-reveal' }, h('h1', { class: 'dv-title big' }, t('revealTitle')), h('p', { class: 'dv-status mine' }, this.modeName), E.count));
    E.timer.classList.add('done');
    this.app.audio.sfx('double', 0.6);
  }

  countdown(n) {
    const el = this.els?.count;
    if (!el) return;
    el.replaceChildren(h('span', { class: 'count-num' }, n > 0 ? String(n) : 'Los!'));
    this.app.audio.sfx(n > 0 ? 'count' : 'go');
  }
}

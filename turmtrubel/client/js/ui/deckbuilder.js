// Deck-Bauer: 5 Deck-Slots (localStorage), Filter, Suche, Evo- und Champion/Held-Plätze, Zufallsdeck.
import { validateDeck, averageElixir, cycleCost, randomDeck, isSpecial, EVO_SLOTS, SPECIAL_SLOT, DECK_SIZE, RARITY_ORDER } from '/shared/cards.js';
import { $, h, ico, modal, showScreen, toast } from './dom.js';
import { icon } from './icons.js';
import { cardEl, openCardDetail } from './cardview.js';

const TYPE_FILTERS = [
  ['all', 'Alle'],
  ['troop', 'Truppen'],
  ['spell', 'Zauber'],
  ['building', 'Gebäude'],
  ['champion', 'Champions'],
  ['hero', 'Helden'],
  ['evo', 'Evo'],
];
const RARITY_FILTERS = [
  ['all', 'Alle Seltenheiten'],
  ['common', 'Gewöhnlich'],
  ['rare', 'Selten'],
  ['epic', 'Episch'],
  ['legendary', 'Legendär'],
  ['champion', 'Champion'],
];

export class DeckBuilder {
  constructor(app) {
    this.app = app;
    this.db = app.db;
    this.store = app.store;
    this.idx = this.store.active;
    this.selSlot = -1;
    this.f = { q: '', type: 'all', elixir: new Set(), rarity: 'all', sort: 'elixir' };
    this.bind();
    this.initDrag();
  }

  bind() {
    $('#deck-back').addEventListener('click', () => this.app.goMenu());
    $('#deck-random').addEventListener('click', () => {
      this.deck().slots = randomDeck(this.db);
      this.changed();
      this.app.audio.sfx('deploy');
    });
    $('#deck-clear').addEventListener('click', () => {
      this.deck().slots = new Array(DECK_SIZE).fill(null);
      this.selSlot = -1;
      this.changed();
    });
    $('#deck-use').addEventListener('click', () => {
      if (!validateDeck(this.db, this.deck().slots).ok) {
        toast('Dieses Deck ist noch nicht vollständig.', 'warn');
        return;
      }
      this.store.active = this.idx;
      this.store.save();
      toast(`„${this.deck().name}“ ist jetzt dein aktives Deck.`, 'ok');
      this.renderTabs();
      this.renderHead();
    });
    $('#deck-name').addEventListener('click', () => this.rename());
    $('#flt-toggle').addEventListener('click', () => this.setFiltersOpen(!this.filtersOpen));
    $('#flt-reset').addEventListener('click', () => this.resetFilters());
    this.setFiltersOpen(matchMedia('(min-width: 861px)').matches);
    $('#flt-search').addEventListener('input', (e) => {
      this.f.q = e.target.value.trim().toLowerCase();
      this.renderGrid();
    });
    $('#flt-sort').addEventListener('change', (e) => {
      this.f.sort = e.target.value;
      this.renderGrid();
    });
    const typeRoot = $('#flt-type');
    for (const [k, label] of TYPE_FILTERS) {
      typeRoot.append(h('button', { class: 'fchip', 'aria-pressed': 'false', dataset: { k }, onclick: () => ((this.f.type = k), this.renderFilters(), this.renderGrid()) }, label));
    }
    const elRoot = $('#flt-elixir');
    for (let i = 1; i <= 9; i++) {
      elRoot.append(
        h(
          'button',
          {
            class: 'fchip elixir',
            dataset: { k: String(i) },
            title: `${i} Elixier`,
            onclick: () => {
              if (this.f.elixir.has(i)) this.f.elixir.delete(i);
              else this.f.elixir.add(i);
              this.renderFilters();
              this.renderGrid();
            },
          },
          [icon('drop'), String(i)],
        ),
      );
    }
    const rRoot = $('#flt-rarity');
    for (const [k, label] of RARITY_FILTERS) {
      rRoot.append(h('button', { class: 'fchip', 'aria-pressed': 'false', dataset: { k }, onclick: () => ((this.f.rarity = k), this.renderFilters(), this.renderGrid()) }, label));
    }
  }

  open(index = this.store.active) {
    this.idx = index;
    this.selSlot = -1;
    this.render();
    showScreen('s-deck');
  }

  deck() {
    return this.store.decks[this.idx];
  }

  changed() {
    this.store.save();
    this.render();
  }

  render() {
    this.renderTabs();
    this.renderHead();
    this.renderSlots();
    this.renderStats();
    this.renderFilters();
    this.renderGrid();
  }

  renderHead() {
    const d = this.deck();
    $('#deck-name-text').textContent = d.name;
    $('#deck-name').title = `${d.name} – umbenennen`;
    const active = this.store.active === this.idx;
    const use = $('#deck-use');
    use.disabled = active;
    use.replaceChildren(ico(active ? 'star' : 'star-o'), active ? 'Aktiv' : 'Aktivieren');
    use.title = active ? 'Das ist dein aktives Deck' : 'Als aktives Deck verwenden';
  }

  /** Umbenennen per Tippen auf den Decknamen (statt Dauer-Eingabefeld – spart Platz am Handy). */
  rename() {
    const input = h('input', { class: 'text-input', maxlength: '20', value: this.deck().name, 'aria-label': 'Deckname' });
    const save = () => {
      this.deck().name = input.value.trim().slice(0, 20) || `Deck ${this.idx + 1}`;
      this.store.save();
      this.renderTabs();
      this.renderHead();
      m.close();
    };
    input.addEventListener('keydown', (e) => e.key === 'Enter' && save());
    const m = modal('Deck umbenennen', h('div', {}, input, h('div', { class: 'row' }, h('button', { class: 'btn btn-success', onclick: save }, 'Speichern'))));
  }

  setFiltersOpen(open) {
    this.filtersOpen = open;
    $('#flt-panel').hidden = !open;
    $('#flt-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
    this.renderFilterCount();
  }

  activeFilterCount() {
    const f = this.f;
    return (f.type !== 'all') + (f.rarity !== 'all') + (f.elixir.size > 0) + (f.q ? 1 : 0);
  }

  renderFilterCount() {
    const n = this.activeFilterCount();
    $('#flt-toggle').replaceChildren(ico(this.filtersOpen ? 'caret-up' : 'caret-down'), n ? `Filter (${n})` : 'Filter');
    $('#flt-toggle').classList.toggle('has-filters', n > 0);
    $('#flt-reset').disabled = n === 0;
  }

  resetFilters() {
    this.f = { q: '', type: 'all', elixir: new Set(), rarity: 'all', sort: this.f.sort };
    $('#flt-search').value = '';
    this.renderFilters();
    this.renderGrid();
  }

  renderTabs() {
    const root = $('#deck-tabs');
    root.replaceChildren(
      ...this.store.decks.map((d, i) =>
        h(
          'button',
          {
            class: `deck-tab${i === this.idx ? ' active' : ''}${validateDeck(this.db, d.slots).ok ? '' : ' invalid'}`,
            role: 'tab',
            'aria-selected': i === this.idx ? 'true' : 'false',
            title: d.name + (i === this.store.active ? ' (aktiv)' : ''),
            onclick: () => {
              this.idx = i;
              this.selSlot = -1;
              this.render();
            },
          },
          String(i + 1),
          i === this.store.active ? icon('star') : null,
        ),
      ),
    );
  }

  renderSlots() {
    const root = $('#deck-slots');
    const slots = this.deck().slots;
    root.replaceChildren(
      ...slots.map((id, i) => {
        const isEvo = EVO_SLOTS.includes(i);
        const isSpecialSlot = i === SPECIAL_SLOT;
        const card = id ? this.db.card(id) : null;
        const evoActive = isEvo && card?.evo;
        const el = id
          ? cardEl(this.db, id, { evo: evoActive, mini: true, onClick: () => this.clickSlot(i) })
          : h('div', { class: `card empty${isEvo ? ' evo-slot' : ''}${isSpecialSlot ? ' special-slot' : ''}`, role: 'button', tabindex: '0', onclick: () => this.clickSlot(i) }, isEvo ? 'Evo' : isSpecialSlot ? 'Champion / Held' : 'leer');
        return h(
          'div',
          { class: `slot${this.selSlot === i ? ' selected' : ''}${isEvo ? ' is-evo' : ''}${isSpecialSlot ? ' is-special' : ''}` },
          isEvo ? h('span', { class: 'slot-label evo' }, `EVO ${i + 1}`) : isSpecialSlot ? h('span', { class: 'slot-label special' }, icon('star'), 'CHAMP/HELD') : null,
          el,
        );
      }),
    );
    $('#deck-sel-hint').hidden = this.selSlot < 0;
    $('.deck-panel').classList.toggle('has-selection', this.selSlot >= 0);
  }

  renderStats() {
    const slots = this.deck().slots;
    $('#deck-avg').textContent = averageElixir(this.db, slots).toFixed(1).replace('.', ',');
    $('#deck-cycle').textContent = cycleCost(this.db, slots);
    $('#deck-count').textContent = `${slots.filter(Boolean).length}/8`;
    const v = validateDeck(this.db, slots);
    const missing = slots.filter((s) => !s).length;
    $('#deck-errors').textContent = v.ok ? '' : missing ? `Noch ${missing} Karte${missing > 1 ? 'n' : ''} fehlen.` : v.errors[0];
  }

  renderFilters() {
    const set = (b, on) => {
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    };
    for (const b of document.querySelectorAll('#flt-type .fchip')) set(b, b.dataset.k === this.f.type);
    for (const b of document.querySelectorAll('#flt-rarity .fchip')) set(b, b.dataset.k === this.f.rarity);
    for (const b of document.querySelectorAll('#flt-elixir .fchip')) set(b, this.f.elixir.has(Number(b.dataset.k)));
    this.renderFilterCount();
  }

  filtered() {
    const f = this.f;
    let list = this.db.cards.filter((c) => {
      if (f.type === 'champion' && c.class !== 'champion') return false;
      if (f.type === 'hero' && c.class !== 'hero') return false;
      if (f.type === 'evo' && !c.evo) return false;
      if (['troop', 'spell', 'building'].includes(f.type) && (c.type !== f.type || (f.type === 'troop' && c.class !== 'normal'))) return false;
      if (f.rarity !== 'all' && c.rarity !== f.rarity) return false;
      if (f.elixir.size && !f.elixir.has(Math.min(9, c.elixir))) return false;
      if (f.q && !(c.name.toLowerCase().includes(f.q) || c.description.toLowerCase().includes(f.q) || (c.evo?.name || '').toLowerCase().includes(f.q))) return false;
      return true;
    });
    const rank = (c) => RARITY_ORDER.indexOf(c.rarity) + (c.class === 'hero' ? 4 : c.class === 'champion' ? 5 : 0);
    list.sort((a, b) => {
      if (f.sort === 'name') return a.name.localeCompare(b.name, 'de');
      if (f.sort === 'rarity') return rank(a) - rank(b) || a.elixir - b.elixir || a.name.localeCompare(b.name, 'de');
      return a.elixir - b.elixir || rank(a) - rank(b) || a.name.localeCompare(b.name, 'de');
    });
    return list;
  }

  renderGrid() {
    const inDeck = new Set(this.deck().slots.filter(Boolean));
    const list = this.filtered();
    this.renderFilterCount();
    $('#grid-count').textContent = `${list.length} von ${this.db.cards.length} Karten · ${this.selSlot >= 0 ? 'Tippe eine Karte zum Tauschen' : 'Tippe auf eine Karte für Details'}`;
    if (!list.length) {
      // Leerzustand mit Ausweg
      $('#card-grid').replaceChildren(
        h(
          'div',
          { class: 'empty-state' },
          h('span', { class: 'empty-ico', 'aria-hidden': 'true' }, icon('search')),
          h('b', {}, 'Keine Karten gefunden'),
          h('span', {}, 'Probier einen anderen Suchbegriff oder weniger Filter.'),
          h('button', { class: 'btn btn-small btn-secondary', onclick: () => this.resetFilters() }, 'Filter zurücksetzen'),
        ),
      );
      return;
    }
    $('#card-grid').replaceChildren(...list.map((c) => cardEl(this.db, c.id, { inDeck: inDeck.has(c.id), showEvoHint: true, onClick: () => this.clickCard(c.id) })));
  }

  // ───── Drag-and-Drop ─────
  // Maus: ziehen ab 6 px. Touch: kurz halten (260 ms), dann ziehen – so bleibt normales Scrollen möglich.
  // Ziele: Deck-Platz (einsetzen/tauschen, rastet mit Animation ein) oder Sammlung (Karte aus dem Deck nehmen).
  // Antippen-und-Tauschen bleibt unverändert (auch per Tastatur).
  initDrag() {
    const root = $('#s-deck');
    const HOLD_MS = 260;
    const end = () => {
      if (this.pend) clearTimeout(this.pend.timer);
      this.pend = null;
    };
    root.addEventListener('pointerdown', (e) => {
      if (this.drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const el = e.target.closest('.card');
      if (!el || el.classList.contains('empty') || !el.dataset.id || !el.closest('#deck-slots, #card-grid')) return;
      const slot = el.closest('.slot');
      const from = slot ? [...slot.parentNode.children].indexOf(slot) : this.deck().slots.indexOf(el.dataset.id);
      this.pend = { id: el.dataset.id, from, fromGrid: !slot, el, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, touch: e.pointerType !== 'mouse', pid: e.pointerId };
      if (this.pend.touch) this.pend.timer = setTimeout(() => this.pend && this.startDrag(), HOLD_MS);
    });
    window.addEventListener('pointermove', (e) => {
      if (this.drag) {
        if (e.pointerId === this.drag.pid) this.moveDrag(e.clientX, e.clientY);
        return;
      }
      const p = this.pend;
      if (!p || e.pointerId !== p.pid) return;
      p.x = e.clientX;
      p.y = e.clientY;
      const d = Math.hypot(p.x - p.x0, p.y - p.y0);
      if (p.touch && d > 10) end(); // Finger bewegt sich vor Ablauf der Haltezeit → Scrollen
      else if (!p.touch && d > 6) this.startDrag();
    });
    const up = (e) => {
      if (this.drag && e.pointerId === this.drag.pid) this.dropDrag(e.type === 'pointercancel');
      end();
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    // Während des Ziehens nicht scrollen (Touch) und kein Kontextmenü beim Halten
    window.addEventListener('touchmove', (e) => this.drag && e.cancelable && e.preventDefault(), { passive: false });
    root.addEventListener('contextmenu', (e) => (this.pend || this.drag) && e.preventDefault());
  }

  startDrag() {
    const p = this.pend;
    if (!p || !p.el.isConnected) return;
    clearTimeout(p.timer);
    this.pend = null;
    const r = p.el.getBoundingClientRect();
    const ghost = p.el.cloneNode(true);
    ghost.classList.add('drag-ghost');
    ghost.removeAttribute('tabindex');
    ghost.removeAttribute('role');
    ghost.style.width = `${r.width}px`;
    ghost.style.height = `${r.height}px`;
    document.body.append(ghost);
    p.el.classList.add('drag-src');
    document.body.classList.add('card-dragging');
    this.drag = { ...p, ghost, ox: p.x0 - r.left, oy: p.y0 - r.top, rect: r, vx: 0, lx: p.x, target: null };
    if (this.selSlot >= 0) {
      this.selSlot = -1;
      $('#deck-sel-hint').hidden = true;
    }
    this.markTargets();
    this.moveDrag(p.x, p.y);
    this.app.haptic(10);
    this.app.audio.sfx('whoosh', 0.5);
  }

  /** Alle Plätze als gültiges/ungültiges Ziel einfärben (Champion/Held nur in Platz 3). */
  markTargets() {
    const d = this.drag;
    const slots = this.deck().slots;
    document.querySelectorAll('#deck-slots .slot').forEach((el, i) => {
      const ok = i !== d.from && this.canPlaceIn(d.id, i) && (d.from < 0 || !slots[i] || this.canPlaceIn(slots[i], d.from));
      el.classList.toggle('can-drop', ok);
      el.classList.toggle('no-drop', !ok && i !== d.from);
    });
    $('#card-grid').classList.toggle('can-drop', d.from >= 0);
  }

  moveDrag(x, y) {
    const d = this.drag;
    // Neigung folgt der Bewegung (gedämpft), wie beim Ziehen im Kampf
    d.vx = d.vx * 0.7 + (x - d.lx) * 0.3;
    d.lx = x;
    const tilt = Math.max(-14, Math.min(14, d.vx * 1.6));
    d.ghost.style.transform = `translate(${x - d.ox}px, ${y - d.oy}px) rotate(${tilt}deg) scale(1.1)`;
    const hit = document.elementFromPoint(x, y);
    const slot = hit?.closest('#deck-slots .slot');
    let target = null;
    if (slot) target = { slot: [...slot.parentNode.children].indexOf(slot), el: slot };
    else if (d.from >= 0 && hit?.closest('.collection')) target = { grid: true };
    if (d.target?.el !== target?.el || !!d.target?.grid !== !!target?.grid) {
      d.target?.el?.classList.remove('hover');
      target?.el?.classList.add('hover');
      d.ghost.classList.toggle('to-remove', !!target?.grid);
      d.target = target;
    }
  }

  dropDrag(cancelled) {
    const d = this.drag;
    this.drag = null;
    document.body.classList.remove('card-dragging');
    document.querySelectorAll('#deck-slots .slot').forEach((el) => el.classList.remove('can-drop', 'no-drop', 'hover'));
    $('#card-grid').classList.remove('can-drop');
    // Der Klick nach dem Loslassen soll kein Detail öffnen
    const swallow = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };
    window.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 350);
    const t = cancelled ? null : d.target;
    let placed = -1;
    if (t?.grid && d.from >= 0) {
      this.removeSlot(d.from);
      this.app.audio.sfx('pop', 0.6);
      return this.poofGhost(d.ghost);
    }
    if (t && t.slot != null && t.slot !== d.from) placed = this.dropInSlot(d.id, d.from, t.slot);
    if (placed < 0) {
      // Zurückfliegen an den Ursprung
      d.ghost.classList.add('returning');
      d.ghost.style.transform = `translate(${d.rect.left}px, ${d.rect.top}px)`;
      setTimeout(() => {
        d.ghost.remove();
        d.el.classList.remove('drag-src');
      }, 200);
      return;
    }
    d.ghost.remove();
    this.snapSlot(placed);
    if (d.from >= 0 && d.from !== placed) this.snapSlot(d.from);
  }

  poofGhost(ghost) {
    ghost.classList.add('poof');
    setTimeout(() => ghost.remove(), 240);
  }

  /** Karte auf Platz i legen (aus der Sammlung: from = -1, sonst Tausch). Gibt den Platz zurück oder -1. */
  dropInSlot(id, from, i) {
    const slots = this.deck().slots;
    if (from >= 0) {
      if (!this.canPlaceIn(slots[from], i) || !this.canPlaceIn(slots[i], from)) {
        toast('Champions und Helden gehören in Platz 3 (Champion/Held).', 'warn');
        return -1;
      }
      [slots[from], slots[i]] = [slots[i], slots[from]];
    } else {
      if (!this.canPlaceIn(id, i)) {
        toast('Champions und Helden gehören in Platz 3 (Champion/Held).', 'warn');
        return -1;
      }
      const out = slots[i];
      slots[i] = id;
      this.fixSpecials(id);
      this.fixHeroBase(id);
      if (out) toast(`${this.db.card(out).name} raus, ${this.db.card(id).name} rein.`, 'info', 1600);
    }
    this.changed();
    this.app.audio.sfx('select');
    this.app.haptic(14);
    return i;
  }

  /** Einrast-Animation auf einem Deck-Platz (nach dem Neuzeichnen). */
  snapSlot(i) {
    const el = document.querySelectorAll('#deck-slots .slot')[i];
    if (!el) return;
    el.classList.remove('snap');
    void el.offsetWidth;
    el.classList.add('snap');
    setTimeout(() => el.classList.remove('snap'), 520);
  }

  // ───── Interaktion ─────
  canPlaceIn(id, i) {
    const card = this.db.card(id);
    if (!card) return true;
    if (isSpecial(card)) return i === SPECIAL_SLOT;
    return true;
  }

  clickSlot(i) {
    const slots = this.deck().slots;
    if (this.selSlot === -1) {
      if (!slots[i]) return;
      this.selSlot = i;
      this.renderSlots();
      this.renderGrid();
      return;
    }
    if (this.selSlot === i) {
      const id = slots[i];
      this.selSlot = -1;
      this.renderSlots();
      this.renderGrid();
      const evoCard = !!this.db.card(id)?.evo;
      openCardDetail(this.app, id, {
        evo: EVO_SLOTS.includes(i) && evoCard,
        evoState: evoCard ? (EVO_SLOTS.includes(i) ? 'active' : 'inactive') : null,
        actions: [{ label: 'Aus dem Deck entfernen', cls: 'btn-danger', onClick: () => this.removeSlot(i) }],
      });
      return;
    }
    const a = this.selSlot;
    if (!this.canPlaceIn(slots[a], i) || !this.canPlaceIn(slots[i], a)) {
      toast('Champions und Helden gehören in Platz 3 (Champion/Held).', 'warn');
      this.selSlot = -1;
      this.renderSlots();
      return;
    }
    [slots[a], slots[i]] = [slots[i], slots[a]];
    this.selSlot = -1;
    this.changed();
    this.app.audio.sfx('select');
  }

  removeSlot(i) {
    this.deck().slots[i] = null;
    this.changed();
  }

  clickCard(id) {
    const slots = this.deck().slots;
    const pos = slots.indexOf(id);
    if (this.selSlot >= 0 && pos === -1) {
      if (!this.canPlaceIn(id, this.selSlot)) {
        toast('Champions und Helden gehören in Platz 3 (Champion/Held).', 'warn');
        return;
      }
      slots[this.selSlot] = id;
      this.selSlot = -1;
      this.fixSpecials(id);
      this.fixHeroBase(id);
      this.changed();
      return;
    }
    const card = this.db.card(id);
    const actions = [];
    // Deck voll → Knöpfe deaktiviert, mit Grund (Champions/Helden ersetzen den ★-Platz)
    const full = slots.every(Boolean) && !isSpecial(card);
    const reason = full ? 'Deck voll – tippe zuerst eine Deckkarte an, um sie zu tauschen.' : '';
    if (pos >= 0) actions.push({ label: 'Aus dem Deck entfernen', cls: 'btn-danger', onClick: () => this.removeSlot(pos) });
    else {
      actions.push({ label: 'Ins Deck', cls: 'btn-success', onClick: () => this.addCard(id), disabled: full, reason });
      if (card.evo) actions.push({ label: 'In Evo-Platz', cls: 'btn-accent', onClick: () => this.addCard(id, true), disabled: full, reason });
    }
    const evoState = card.evo ? (pos >= 0 && EVO_SLOTS.includes(pos) ? 'active' : 'inactive') : null;
    openCardDetail(this.app, id, { evo: evoState === 'active', evoState, actions });
  }

  /** Nur ein Champion/Held: ein anderer wird aus dem Spezialplatz entfernt. */
  fixSpecials(keepId) {
    const slots = this.deck().slots;
    slots.forEach((s, i) => {
      if (s && s !== keepId && isSpecial(this.db.card(s)) && i !== SPECIAL_SLOT) slots[i] = null;
    });
  }

  /** Held und seine Basiskarte schließen sich aus: die jeweils andere Karte fliegt raus. */
  fixHeroBase(keepId) {
    const slots = this.deck().slots;
    const card = this.db.card(keepId);
    const clash = card?.heroOf || slots.find((s) => s && this.db.card(s)?.heroOf === keepId);
    const i = clash ? slots.indexOf(clash) : -1;
    if (i >= 0 && slots[i] !== keepId) {
      toast(`${this.db.card(clash).name} wurde entfernt – Held und Basiskarte passen nicht zusammen.`, 'info', 3000);
      slots[i] = null;
    }
  }

  addCard(id, preferEvo = false) {
    const slots = this.deck().slots;
    const card = this.db.card(id);
    if (slots.includes(id)) return;
    this.fixHeroBase(id);
    if (isSpecial(card)) {
      const cur = slots[SPECIAL_SLOT];
      if (cur && !isSpecial(this.db.card(cur))) {
        const free = [3, 4, 5, 6, 7, 0, 1].find((i) => !slots[i]);
        if (free != null) slots[free] = cur;
        else toast(`${this.db.card(cur).name} wurde aus Platz 3 (Champion/Held) entfernt.`, 'info');
      } else if (cur) toast(`${this.db.card(cur).name} wurde ersetzt – nur ein Champion/Held pro Deck.`, 'info');
      slots[SPECIAL_SLOT] = id;
      this.changed();
      return;
    }
    const order = preferEvo || card.evo ? [0, 1, 3, 4, 5, 6, 7, 2] : [3, 4, 5, 6, 7, 0, 1, 2];
    let target = order.find((i) => !slots[i]);
    if (preferEvo && target !== 0 && target !== 1) {
      // Evo-Plätze belegt → Karte aus Evo-Platz 2 in einen freien Platz schieben
      const free = [3, 4, 5, 6, 7, 2].find((i) => !slots[i]);
      if (free != null && !isSpecial(this.db.card(slots[1]))) {
        slots[free] = slots[1];
        target = 1;
      }
    }
    if (target == null) {
      toast('Das Deck ist voll. Tippe zuerst eine Deckkarte an, um sie zu ersetzen.', 'warn', 3000);
      return;
    }
    slots[target] = id;
    this.changed();
    this.app.audio.sfx('select');
  }
}

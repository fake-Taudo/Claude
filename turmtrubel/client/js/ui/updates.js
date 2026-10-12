// „Neu in Turmtrubel“: Update-Fenster beim Öffnen des Spiels (Hauptmenü).
// – „X“ (oder „Los geht's“) schließt nur für diesen Besuch: beim nächsten Öffnen erscheint es wieder.
// – „Nicht mehr anzeigen bis zum nächsten Update“ merkt sich die aktuelle Update-ID; erst ein neuerer Eintrag in
//   js/updates.js zeigt das Fenster wieder an.
import { h, modal } from './dom.js';
import { icon, hasIcon } from './icons.js';
import { UPDATES, LATEST_UPDATE } from '../updates.js';

const KEY = 'turmtrubel.updates';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch {
    return {};
  }
}
function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* Speicher gesperrt – dann erscheint das Fenster eben wieder */
  }
}

/** Soll das Fenster beim Öffnen erscheinen? (nicht, wenn der Spieler dieses Update bereits ausgeblendet hat) */
export function updatesPending() {
  return !!LATEST_UPDATE && load().hiddenUntil !== LATEST_UPDATE.id;
}

const tile = (name) => h('span', { class: 'upd-ico', 'aria-hidden': 'true' }, hasIcon(name) ? icon(name) : icon('sparkles'));

function itemList(items) {
  return h(
    'ul',
    { class: 'upd-list' },
    items.map((it, i) => h('li', { class: 'upd-item', style: { '--i': i } }, tile(it.icon), h('div', { class: 'upd-text' }, h('strong', {}, it.title), h('span', {}, it.text)))),
  );
}

/** Öffnet das Fenster. Gibt das Modal zurück (oder null, wenn keine Updates eingetragen sind). */
export function showUpdates({ onClose } = {}) {
  const cur = LATEST_UPDATE;
  if (!cur) return null;
  const older = UPDATES.slice(1);
  let m = null;
  const hideUntilNext = () => {
    save({ ...load(), hiddenUntil: cur.id });
    m.close();
  };
  const body = h(
    'div',
    { class: 'upd' },
    h(
      'div',
      { class: 'upd-hero' },
      h('span', { class: 'upd-burst', 'aria-hidden': 'true' }, icon('sparkles')),
      h('div', {}, h('span', { class: 'upd-ver' }, `Version ${cur.version} · ${cur.date}`), h('h3', { class: 'upd-title' }, cur.title)),
    ),
    itemList(cur.items),
    older.length
      ? h(
          'details',
          { class: 'upd-older' },
          h('summary', {}, 'Frühere Updates'),
          older.map((u) => h('section', { class: 'upd-old' }, h('h4', {}, h('span', { class: 'upd-ver small' }, `${u.version} · ${u.date}`), ' ', u.title), itemList(u.items))),
        )
      : null,
    h(
      'div',
      { class: 'row wrap upd-actions' },
      h('button', { class: 'btn btn-ghost upd-hide', onclick: hideUntilNext }, 'Nicht mehr anzeigen bis zum nächsten Update'),
      h('button', { class: 'btn btn-success upd-ok', onclick: () => m.close() }, "Los geht's"),
    ),
  );
  m = modal('Neu in Turmtrubel', body, { onClose, wide: true });
  m.el.classList.add('upd-modal');
  return m;
}

// Kleine DOM-Helfer: Elemente bauen, Screens wechseln, Toasts, Modals.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** h('div', { class: 'x', onclick: fn }, 'Text', child) */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** Symbol, das bei Kontur-Schrift keine Kontur bekommt (Emoji in Buttons). */
export const ico = (s) => h('span', { class: 'ico', 'aria-hidden': 'true' }, s);

let current = 's-boot';
export function showScreen(id) {
  if (current === id) return;
  document.getElementById(current)?.classList.remove('active');
  document.getElementById(id)?.classList.add('active');
  current = id;
  document.body.dataset.screen = id;
}
export function currentScreen() {
  return current;
}

// ───── Toast: genau einer sichtbar, ein neuer ersetzt den alten ─────
const TOAST_ICONS = { info: 'i', ok: '✓', warn: '!', error: '✕' };
let toastEl = null;
let toastTimer = 0;

/** kind: info | ok | warn | error (optional zusätzlich 'team-blue' / 'team-red'). ms = Sichtdauer. */
export function toast(msg, kind = 'info', ms = 1400) {
  if (!msg) return;
  const root = document.getElementById('toasts');
  const base = kind.split(' ')[0];
  clearTimeout(toastTimer);
  if (toastEl && toastEl.isConnected && toastEl.dataset.msg === msg && !toastEl.classList.contains('out')) {
    // Gleiche Meldung erneut → nur kurz anstupsen und Zeit verlängern
    toastEl.classList.remove('bump');
    void toastEl.offsetWidth;
    toastEl.classList.add('bump');
  } else {
    root.replaceChildren();
    toastEl = h('div', { class: `toast ${kind}`, role: base === 'error' ? 'alert' : 'status', dataset: { msg } }, h('span', { class: 'toast-ico', 'aria-hidden': 'true' }, TOAST_ICONS[base] || 'i'), h('span', {}, msg));
    root.append(toastEl);
  }
  const el = toastEl;
  toastTimer = setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 160);
  }, ms);
}

// ───── Modal / Bottom-Sheet ─────
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const stack = [];

function onGlobalKey(e) {
  const top = stack.at(-1);
  if (!top) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    top.close();
  } else if (e.key === 'Tab') {
    // Fokus-Falle: Tab bleibt im obersten Modal
    const items = [...top.el.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items.at(-1);
    if (e.shiftKey && (document.activeElement === first || !top.el.contains(document.activeElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (document.activeElement === last || !top.el.contains(document.activeElement))) {
      e.preventDefault();
      first.focus();
    }
  }
}

export function modalOpen() {
  return stack.length > 0;
}

/** Öffnet ein Modal (am Handy hochkant als Bottom-Sheet). Gibt { close, el } zurück. */
export function modal(title, body, { onClose, wide } = {}) {
  const root = document.getElementById('modal-root');
  const opener = document.activeElement;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    const i = stack.indexOf(api);
    if (i >= 0) stack.splice(i, 1);
    if (!stack.length) {
      document.removeEventListener('keydown', onGlobalKey, true);
      document.getElementById('app').inert = false;
    }
    back.classList.add('closing');
    setTimeout(() => back.remove(), 130);
    if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
    onClose?.();
  };
  const titleId = `mt-${Math.random().toString(36).slice(2, 8)}`;
  const head = h(
    'div',
    { class: 'modal-head' },
    h('span', { class: 'sheet-grip', 'aria-hidden': 'true' }),
    h('h2', { class: 'panel-title', id: titleId }, title),
    h('button', { class: 'icon-btn modal-close', 'aria-label': 'Schließen', onclick: close }, '✕'),
  );
  const panel = h('div', { class: `panel modal${wide ? ' wide' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId }, head, body);
  const back = h('div', { class: 'modal-back', onclick: (e) => e.target === back && close() }, panel);
  root.append(back);
  enableSwipeClose(head, panel, close);
  const api = { close, el: panel };
  if (!stack.length) {
    document.addEventListener('keydown', onGlobalKey, true);
    document.getElementById('app').inert = true;
  }
  stack.push(api);
  setTimeout(() => {
    if (closed) return;
    const first = panel.querySelector('input, select, button:not(.modal-close)') || panel.querySelector('.modal-close');
    first?.focus({ preventScroll: true });
  }, 30);
  return api;
}

/** Bottom-Sheet: am Kopf nach unten wischen schließt (nur wenn als Sheet dargestellt). */
function enableSwipeClose(handle, panel, close) {
  let y0 = null;
  let t0 = 0;
  let dy = 0;
  const isSheet = () => matchMedia('(max-width: 600px) and (min-height: 480px)').matches;
  handle.addEventListener('pointerdown', (e) => {
    if (!isSheet() || e.target.closest('button')) return;
    y0 = e.clientY;
    t0 = performance.now();
    dy = 0;
    handle.setPointerCapture(e.pointerId);
    panel.style.transition = 'none';
  });
  handle.addEventListener('pointermove', (e) => {
    if (y0 == null) return;
    dy = Math.max(0, e.clientY - y0);
    panel.style.transform = `translateY(${dy}px)`;
  });
  const end = () => {
    if (y0 == null) return;
    y0 = null;
    const v = dy / Math.max(1, performance.now() - t0);
    panel.style.transition = '';
    if (dy > 90 || v > 0.6) close();
    else panel.style.transform = '';
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

export function confirmDialog(title, text, okLabel = 'OK', danger = false) {
  return new Promise((resolve) => {
    let result = false;
    const m = modal(
      title,
      h(
        'div',
        {},
        h('p', { style: { fontWeight: 800, fontSize: '17px' } }, text),
        h(
          'div',
          { class: 'row wrap' },
          h('button', { class: 'btn btn-ghost', onclick: () => m.close() }, 'Abbrechen'),
          h('button', { class: `btn ${danger ? 'btn-danger' : 'btn-success'}`, onclick: () => ((result = true), m.close()) }, okLabel),
        ),
      ),
      { onClose: () => resolve(result) },
    );
  });
}

export function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

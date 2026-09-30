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

export function toast(msg, kind = 'info', ms = 2400) {
  if (!msg) return;
  const root = document.getElementById('toasts');
  while (root.children.length > 3) root.firstChild.remove();
  const el = h('div', { class: `toast ${kind}`, role: kind === 'error' ? 'alert' : 'status' }, msg);
  root.append(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 260);
  }, ms);
}

/** Öffnet ein Modal. Gibt { close, el } zurück. */
export function modal(title, body, { onClose, wide } = {}) {
  const root = document.getElementById('modal-root');
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    back.remove();
    document.removeEventListener('keydown', onKey);
    onClose?.();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  const panel = h(
    'div',
    { class: 'panel modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title, style: wide ? { width: 'min(720px, 100%)' } : null },
    h('div', { class: 'modal-head' }, h('h2', { class: 'panel-title' }, title), h('button', { class: 'icon-btn modal-close', 'aria-label': 'Schließen', onclick: close }, '✕')),
    body,
  );
  const back = h('div', { class: 'modal-back', onclick: (e) => e.target === back && close() }, panel);
  root.append(back);
  document.addEventListener('keydown', onKey);
  setTimeout(() => panel.querySelector('input, button:not(.modal-close)')?.focus(), 30);
  return { close, el: panel };
}

export function confirmDialog(title, text, okLabel = 'OK', danger = false) {
  return new Promise((resolve) => {
    let result = false;
    const m = modal(
      title,
      h(
        'div',
        {},
        h('p', { style: { fontWeight: 800 } }, text),
        h(
          'div',
          { class: 'row' },
          h('button', { class: `btn ${danger ? 'btn-red' : 'btn-green'}`, onclick: () => ((result = true), m.close()) }, okLabel),
          h('button', { class: 'btn btn-blue', onclick: () => m.close() }, 'Abbrechen'),
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

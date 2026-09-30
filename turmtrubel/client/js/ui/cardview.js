// Karten als DOM-Elemente + Detailansicht mit allen Werten.
import { TARGET_LABELS, TYPE_LABELS, CLASS_LABELS } from '/shared/cards.js';
import { h, modal } from './dom.js';
import { cardArtURL } from './art.js';

export function cardEl(db, id, opts = {}) {
  const card = db.card(id);
  if (!card) return h('div', { class: 'card empty' }, opts.emptyLabel || '');
  const evo = !!opts.evo && !!card.evo;
  const cls = ['card', `r-${card.rarity}`];
  if (card.class !== 'normal') cls.push(`c-${card.class}`);
  if (evo) cls.push('evo');
  if (opts.mini) cls.push('mini');
  if (opts.inDeck) cls.push('in-deck');
  const el = h(
    'div',
    { class: cls.join(' '), tabindex: opts.onClick ? '0' : null, role: opts.onClick ? 'button' : null, title: card.name, 'aria-label': `${card.name}, ${card.elixir} Elixier`, dataset: { id } },
    h('img', { src: cardArtURL(db, id, evo), alt: '', draggable: 'false' }),
    h('div', { class: 'cost' }, card.elixir),
    opts.hideName ? null : h('div', { class: 'name' }, evo ? card.evo.name || card.name : card.name),
    evo ? h('div', { class: 'badge' }, 'EVO') : card.class === 'champion' ? h('div', { class: 'badge champion' }, '★') : card.class === 'hero' ? h('div', { class: 'badge hero' }, 'HELD') : card.evo && opts.showEvoHint ? h('div', { class: 'badge' }, 'evo') : null,
  );
  if (opts.onClick) {
    el.addEventListener('click', () => opts.onClick(id));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        opts.onClick(id);
      }
    });
  }
  return el;
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace('.', ',');
}

function speedLabel(v) {
  if (v <= 0) return '–';
  if (v < 0.9) return `langsam (${fmt(v)})`;
  if (v < 1.25) return `mittel (${fmt(v)})`;
  if (v < 1.75) return `schnell (${fmt(v)})`;
  return `sehr schnell (${fmt(v)})`;
}

export function statsRows(db, card, evo = false) {
  const rows = [];
  if (card.type === 'spell') {
    const s = db.spell(card, evo);
    if (s.damage) rows.push([s.pulse ? `Schaden pro ${fmt(s.pulse)} s` : 'Schaden', fmt(s.damage)]);
    if (s.towerDamage != null && s.damage) rows.push(['Schaden an Kronentürmen', `${Math.round(s.towerDamage * 100)} %`]);
    if (s.radius) rows.push(['Radius', fmt(s.radius)]);
    if (s.duration) rows.push(['Dauer', `${fmt(s.duration)} s`]);
    if (s.stun) rows.push(['Betäubung', `${fmt(s.stun)} s`]);
    if (s.slow) rows.push(['Verlangsamung', `${Math.round(s.slow.amount * 100)} %${s.slow.duration ? ` (${fmt(s.slow.duration)} s)` : ''}`]);
    if (s.heal) rows.push([`Heilung pro ${fmt(s.pulse || 1)} s`, fmt(s.heal)]);
    if (s.rage) rows.push(['Tempo-Bonus', `+${Math.round((s.rage.mult - 1) * 100)} %`]);
    if (s.knockback) rows.push(['Rückstoß', fmt(s.knockback)]);
    if (s.chain) rows.push(['Ketten-Ziele', s.chain.count]);
    if (s.strikes) rows.push(['Blitze', s.strikes]);
    if (s.roll) rows.push(['Rollweite', `${fmt(s.roll.length)} Felder`]);
    if (s.spawn) rows.push(['Beschwört', `${s.spawn.count}× ${db.unit(s.spawn.unit).name}`]);
    if (s.graveyard) rows.push(['Beschwört', `${s.graveyard.count}× ${db.unit(s.graveyard.unit).name}`]);
    if (s.delay) rows.push(['Flugzeit', `${fmt(s.delay)} s`]);
    return rows;
  }
  const u = db.unit(db.unitRefOf(card), evo);
  const count = card.count || 1;
  rows.push(['Leben', fmt(u.hp) + (count > 1 ? ` (×${count})` : '')]);
  if (u.traits.ramp) rows.push(['Schaden', u.traits.ramp.stages.map(fmt).join(' → ')]);
  else if (u.damage) rows.push([u.splash ? 'Flächenschaden' : 'Schaden', fmt(u.damage)]);
  if (u.damage || u.traits.ramp) {
    rows.push(['Angriffstempo', `${fmt(u.hitSpeed)} s`]);
    rows.push(['DPS', fmt(Math.round((u.traits.ramp ? u.traits.ramp.stages.at(-1) : u.damage) / u.hitSpeed))]);
    rows.push(['Reichweite', u.range < 1.3 && !u.isBuilding ? `Nahkampf (${fmt(u.range)})` : fmt(u.range)]);
    if (u.minRange) rows.push(['Mindestreichweite', fmt(u.minRange)]);
    rows.push(['Ziele', TARGET_LABELS[u.targets] || u.targets]);
  }
  if (!u.isBuilding) rows.push(['Tempo', speedLabel(u.speed)]);
  if (u.flying) rows.push(['Bewegung', 'fliegt']);
  if (u.lifetime) rows.push(['Lebensdauer', `${fmt(u.lifetime)} s`]);
  if (u.splash) rows.push(['Flächenradius', fmt(u.splash)]);
  if (u.towerDamage < 1) rows.push(['Schaden an Kronentürmen', `${Math.round(u.towerDamage * 100)} %`]);
  const t = u.traits;
  if (t.charge) rows.push(['Ansturm', `×${fmt(t.charge.damageMult)} Schaden nach ${fmt(t.charge.distance)} Feldern`]);
  if (t.spawner) rows.push(['Beschwört', `${t.spawner.count}× ${db.unit(t.spawner.unit).name} alle ${fmt(t.spawner.interval)} s`]);
  if (t.deathSpawn) rows.push(['Beim Tod', `${t.deathSpawn.count}× ${db.unit(t.deathSpawn.unit).name}`]);
  if (t.deathDamage) rows.push(['Todesschaden', fmt(t.deathDamage.damage)]);
  if (t.elixirGen) rows.push(['Elixier', `+${t.elixirGen.amount} alle ${fmt(t.elixirGen.interval)} s`]);
  if (t.healAura) rows.push(['Heilaura', `${fmt(t.healAura.amount)}/s (Radius ${fmt(t.healAura.radius)})`]);
  if (t.multiTarget) rows.push(['Ziele gleichzeitig', t.multiTarget]);
  if (t.riverJump) rows.push(['Besonderheit', 'springt über den Fluss']);
  if (t.deployAnywhere) rows.push(['Besonderheit', 'überall platzierbar']);
  rows.push(['Aufstellzeit', `${fmt(u.deployTime)} s`]);
  return rows;
}

/** Detail-Modal. actions: [{ label, cls, onClick }] */
export function openCardDetail(app, id, { evo = false, actions = [] } = {}) {
  const db = app.db;
  const card = db.card(id);
  if (!card) return null;
  const kindLabel = card.class !== 'normal' ? CLASS_LABELS[card.class] : TYPE_LABELS[card.type];
  const rarity = db.rarities[card.rarity]?.name || card.rarity;
  const table = h('table', { class: 'stats-table' }, h('tbody', {}, statsRows(db, card, evo).map(([k, v]) => h('tr', {}, h('td', {}, k), h('td', {}, v)))));
  const body = h(
    'div',
    {},
    h(
      'div',
      { class: 'card-detail' },
      cardEl(db, id, { evo }),
      h(
        'div',
        {},
        h(
          'div',
          { class: 'detail-tags' },
          h('span', { class: `tag r-${card.rarity}` }, rarity),
          h('span', { class: `tag ${card.class !== 'normal' ? card.class : ''}` }, kindLabel),
          h('span', { class: 'tag' }, `${card.elixir} Elixier`),
          card.evo ? h('span', { class: 'tag evo' }, 'Evo verfügbar') : null,
        ),
        h('p', { style: { fontWeight: 700, margin: '0 0 6px' } }, card.description),
        table,
      ),
    ),
    card.evo
      ? h('div', { class: 'box evo' }, h('h4', {}, `${card.evo.name || 'Evo'} · alle ${card.evo.cycles + 1}. Einsätze`), h('p', {}, card.evo.description), h('p', { class: 'hint small', style: { marginTop: '4px' } }, 'Nur aktiv, wenn die Karte in einem der beiden Evo-Plätze liegt. Nach ' + card.evo.cycles + '× Ausspielen ist die nächste Karte entwickelt.'))
      : null,
    card.ability
      ? h(
          'div',
          { class: 'box ability' },
          h('h4', {}, `${card.class === 'champion' ? 'Champion-Fähigkeit' : 'Helden-Fähigkeit'}: ${card.ability.name}`),
          h('p', {}, card.ability.description),
          h('p', { class: 'hint small', style: { marginTop: '4px' } }, card.class === 'champion' ? `Kosten: ${card.ability.cost} Elixier · Abklingzeit: ${card.ability.cooldown} s · Nur 1 Champion pro Deck.` : 'Einmal pro Einsatz, kostenlos · Nur 1 Held pro Deck.'),
        )
      : null,
    actions.length ? h('div', { class: 'row wrap' }, actions.map((a) => h('button', { class: `btn ${a.cls || 'btn-success'}`, onclick: () => (a.onClick(), m.close()) }, a.label))) : null,
  );
  const m = modal(evo && card.evo ? card.evo.name : card.name, body);
  return m;
}

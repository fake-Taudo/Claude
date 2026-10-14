// Chaos-Perks in der Simulation: jeder der 120 Perks aus data/chaos_perks.json wird ausgespielt und auf die
// beschriebene Wirkung geprüft. Dazu Tests je Baustein (statBoost, behaviorChange, newAbility, spawnChange),
// Matchkopie statt cards.json und „Perk nur für den eigenen Spieler“.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Match } from '../server/sim/match.js';
import { loadChaos } from '../server/chaos.js';
import { createModes, resolveRules } from '../shared/modes.js';
import { PERK_TIERS } from '../shared/chaos.js';
import { db, rules } from './helpers.js';

const chaos = loadChaos(db);
const modes = createModes(JSON.parse(fs.readFileSync(new URL('../data/modes.json', import.meta.url), 'utf8')));
const R = resolveRules(rules(), modes.get('chaos'), { chaos });
const FILL = ['knight', 'archers', 'giant', 'minions', 'fireball', 'zap', 'musketeer', 'valkyrie', 'bats', 'hog-rider'];
const close = (a, b, eps = 1e-6, msg = '') => assert.ok(Math.abs(a - b) <= eps, `${msg} ${a} ≠ ${b}`);

function deckWith(cardId) {
  const card = db.card(cardId);
  const deck = FILL.filter((id) => id !== cardId).slice(0, 7);
  if (card.class !== 'normal') deck.splice(2, 0, cardId);
  else deck.unshift(cardId);
  return deck.slice(0, 8);
}

/** Chaos-Match mit Perk für Spieler 0, Türme schießen nicht (Einzeltests ohne Störung). */
function arena(perkId, { seed = 11, towers = false } = {}) {
  const perk = chaos.perk(perkId);
  assert.ok(perk, perkId);
  const m = new Match({ db, rules: R, decks: [deckWith(perk.cardId), deckWith('knight')], seed });
  m.started = true;
  assert.ok(m.assignPerk(0, perk));
  if (!towers) for (const t of m.towers) t.active = false;
  return { m, perk };
}

/** Karte ausspielen (über match.play, also mit allen Prüfungen) und die neuen Einheiten zurückgeben. */
function play(m, pl, cardId, x, y) {
  const before = m.nextId;
  const p = m.players[pl];
  p.hand[0] = cardId;
  p.handReady[0] = 0;
  p.elixir = 10;
  const r = m.play(pl, 0, cardId, x, y);
  assert.ok(r.ok, `${cardId} bei (${x}, ${y}): ${r.code}`);
  return m.entities.filter((e) => e.id >= before && e.kind !== 'tower');
}

function foe(m, ref, x, y, opts = {}) {
  return m.addEntity(db.unit(ref, !!opts.evo), 1, x, y, { deployTime: 0, ...opts });
}

function run(m, s) {
  const n = Math.round(s / m.dt);
  for (let i = 0; i < n && !m.result; i++) m.step();
}

function runUntil(m, pred, s = 20) {
  const n = Math.round(s / m.dt);
  for (let i = 0; i < n && !m.result; i++) {
    if (pred()) return true;
    m.step();
  }
  return pred();
}

/** Alle Ereignisse der nächsten s Sekunden sammeln. */
function events(m, s) {
  const out = [];
  const n = Math.round(s / m.dt);
  for (let i = 0; i < n && !m.result; i++) {
    m.step();
    out.push(...m.events);
    m.flushEvents();
  }
  return out;
}

const mine = (m, key) => m.entities.filter((e) => e.owner === 0 && !e.dead && e.def.key === key);
// fast fertig aufgestellt: der nächste Tick löst die Aufstell-Effekte aus (Gleiten, Landestoß …)
const ready = (es) => es.forEach((e) => (e.deployT = Math.min(e.deployT, 0.01)));
const enemyTower = (m, lane = 0) => m.towers.find((t) => t.owner === 1 && t.towerKey === 'princess' && t.lane === lane);
/** Einheit direkt vor einen gegnerischen Turm stellen. */
function atTower(e, t) {
  e.x = t.x;
  e.y = t.y + t.half + e.radius + 0.4;
  e.deployT = Math.min(e.deployT, 0.01);
}
/** Platz für Zauber: eigene Seite für Zauber, die nur dort erlaubt sind (Kampfholz). */
const spellY = (card) => (card.spell?.ownSide ? 24 : 9);

// ───────────────────────────── Grundsätze ─────────────────────────────

test('Perks wirken auf Matchkopien: gemeinsame Kartenwerte und cards.json bleiben unverändert', () => {
  const snapshot = JSON.stringify([db.unit('giant'), db.unit('golem'), db.spell(db.card('fireball')), db.card('golden-knight')]);
  const raw = fs.readFileSync(new URL('../data/cards.json', import.meta.url), 'utf8');
  for (const perk of chaos.perks.values()) {
    const { m } = arena(perk.id);
    const card = db.card(perk.cardId);
    play(m, 0, card.id, 9, card.type === 'spell' ? spellY(card) : 24);
    run(m, 2);
  }
  assert.equal(JSON.stringify([db.unit('giant'), db.unit('golem'), db.spell(db.card('fireball')), db.card('golden-knight')]), snapshot);
  assert.equal(fs.readFileSync(new URL('../data/cards.json', import.meta.url), 'utf8'), raw);
});

test('Ein Perk gilt nur für die Karte des wählenden Spielers, nicht für dieselbe Karte des Gegners', () => {
  const { m } = arena('giant.common');
  const [a] = play(m, 0, 'giant', 9, 24);
  m.players[1].deck[0] = 'giant';
  const [b] = play(m, 1, 'giant', 9, 8);
  close(a.def.speed, 1.5);
  close(b.def.speed, 0.75);
  assert.equal(a.perkTier, 1);
  assert.ok(!b.perkTier);
  assert.equal(m.perkOf(1, 'giant'), null);
  // höchstens ein Perk je Karte, nur Karten des eigenen Decks
  assert.equal(m.assignPerk(0, chaos.perk('giant.epic')), false);
  assert.equal(m.assignPerk(0, chaos.perk('pekka.epic')), false);
});

test('Elixierkosten bleiben mit jedem Perk gleich', () => {
  for (const perk of chaos.perks.values()) {
    const { m } = arena(perk.id);
    const card = db.card(perk.cardId);
    const p = m.players[0];
    p.hand[0] = card.id;
    p.handReady[0] = 0;
    p.elixir = 10;
    assert.equal(m.costOf(0, card), card.elixir, perk.id);
    const r = m.play(0, 0, card.id, 9, card.type === 'spell' ? spellY(card) : 24);
    assert.ok(r.ok, `${perk.id}: ${r.code}`);
    close(p.elixir, 10 - card.elixir, 1e-9, perk.id);
  }
});

test('Snapshot markiert Einheiten mit Perk (Stufe, Größe) und meldet die Zuweisung als Ereignis', () => {
  const { m } = arena('balloon.epic');
  const ev = m.events.find((e) => e[0] === 'pk');
  assert.deepEqual(ev, ['pk', 0, db.typeIndex.get('balloon'), 3]);
  const [b] = play(m, 0, 'balloon', 9, 24);
  const pe = m.snapshotCommon().pe;
  const i = pe.indexOf(b.id);
  assert.ok(i >= 0 && i % 3 === 0);
  assert.equal(pe[i + 1], 3);
  assert.equal(pe[i + 2], 20, 'Luftschiff doppelt so groß');
});

// ───────────────────────────── Bausteine ─────────────────────────────

test('Baustein statBoost: Multiplikator/Zuschlag auf Einheiten-, Zauber- und Fähigkeitswerte', () => {
  const { m } = arena('golem.common');
  const [g] = play(m, 0, 'golem', 9, 24);
  assert.equal(g.maxHp, 10240);
  close(g.def.speed, 0.375);
  const rg = arena('royal-giant.common').m;
  const [r] = play(rg, 0, 'royal-giant', 9, 24);
  close(r.def.range, 6.5);
  const p = arena('poison.rare').m;
  play(p, 0, 'poison', 9, 9);
  assert.equal(p.zones.at(-1).s.damage, 276);
  const gk = arena('golden-knight.common').m;
  const [k] = play(gk, 0, 'golden-knight', 9, 24);
  assert.equal(k.ability.cost, 0);
});

test('Baustein behaviorChange: fliegender Riese stürzt beim ersten Angriff ab und explodiert', () => {
  const { m } = arena('giant.epic');
  const [g] = play(m, 0, 'giant', 9, 24);
  assert.equal(g.flying, true);
  const t = enemyTower(m);
  atTower(g, t);
  const victim = foe(m, 'knight', g.x + 1.5, g.y);
  victim.mass = 6;
  const hp0 = victim.hp;
  runUntil(m, () => !g.flying, 6);
  assert.equal(g.flying, false);
  assert.ok(hp0 - victim.hp >= 449, `Landeexplosion ${hp0 - victim.hp}`);
});

test('Baustein newAbility (onHit): Riese betäubt das getroffene Gebäude', () => {
  const { m } = arena('giant.rare');
  const [g] = play(m, 0, 'giant', 9, 24);
  const t = enemyTower(m);
  t.active = true;
  atTower(g, t);
  runUntil(m, () => g.attacks > 0, 6);
  assert.ok(t.stunT > 0.3, `Turm betäubt (${t.stunT})`);
});

test('Baustein spawnChange: fünf Bogenschützinnen mit vollen Werten', () => {
  const { m } = arena('archers.epic');
  const out = play(m, 0, 'archers', 9, 24);
  assert.equal(out.length, 5);
  for (const a of out) {
    assert.equal(a.maxHp, 304);
    assert.equal(a.perkTier, 3);
  }
});

// ───────────────────────────── Jeder Perk ─────────────────────────────

/** Prüfung je Perk-ID: ausspielen und die beschriebene Wirkung nachweisen. */
const CHECKS = {
  'giant.common': (m) => close(play(m, 0, 'giant', 9, 24)[0].def.speed, 1.5),
  'giant.rare': () => {}, // Baustein-Test oben
  'giant.epic': () => {},
  'pekka.common': (m) => close(play(m, 0, 'pekka', 9, 24)[0].def.speed, 1.5),
  'pekka.rare': (m) => {
    const [p] = play(m, 0, 'pekka', 9, 22);
    ready([p]);
    const a = foe(m, 'knight', 9, 20.4);
    const b = foe(m, 'knight', 9.9, 20.1);
    runUntil(m, () => p.attacks > 0, 5);
    run(m, 0.1);
    assert.ok(a.hp < a.maxHp && b.hp < b.maxHp, 'beide Ritter getroffen');
  },
  'pekka.epic': (m) => {
    assert.equal(m.canPlace(0, db.card('pekka'), 9, 9), true, 'auf der gegnerischen Seite');
    assert.equal(m.canPlace(0, db.card('knight'), 9, 9), false);
    assert.equal(m.canPlace(0, db.card('pekka'), 9, 16), false, 'nicht im Fluss');
    play(m, 0, 'pekka', 3.5, 9.5);
  },
  'mega-knight.common': (m) => {
    const k = foe(m, 'golem', 9, 23);
    const hp0 = k.hp;
    const [mk] = play(m, 0, 'mega-knight', 9, 24);
    runUntil(m, () => mk.deployT <= 0, 3);
    run(m, 0.05);
    assert.equal(hp0 - k.hp, 860);
  },
  'mega-knight.rare': (m) => {
    const [mk] = play(m, 0, 'mega-knight', 9, 24);
    ready([mk]);
    run(m, 0.05);
    foe(m, 'golem', 9, 22.6);
    let leaps = 0;
    for (let i = 0; i < 20 * 6; i++) {
      m.step();
      leaps += m.events.filter((e) => e[0] === 'lp' && e[1] === mk.id).length;
      m.flushEvents();
    }
    assert.ok(leaps >= 4, `springt dauernd (${leaps} Sprünge in 6 s)`);
  },
  'mega-knight.epic': (m) => {
    const g = foe(m, 'golem', 9, 23);
    const [mk] = play(m, 0, 'mega-knight', 9, 24);
    runUntil(m, () => g.dead, 3);
    run(m, 0.1);
    assert.ok(g.dead && g.silentDeath, 'Golem aus der Arena geschleudert');
    assert.equal(m.entities.filter((e) => e.def.key === 'golemite').length, 0, 'keine Todeseffekte');
    // Gebäude nehmen normalen Schaden
    const t = enemyTower(m);
    atTower(mk, t);
    runUntil(m, () => t.hp < t.maxHp, 6);
    assert.ok(!t.dead && t.hp < t.maxHp);
  },
  'golem.common': () => {},
  'golem.rare': (m) => {
    const [g] = play(m, 0, 'golem', 9, 24);
    g.deployT = 0;
    m.damage(g, 1e6, null, 1);
    run(m, 0.1);
    const gen1 = mine(m, 'golemite');
    assert.equal(gen1.length, 2);
    for (const x of gen1) {
      x.deployT = 0;
      m.damage(x, 1e6, null, 1);
    }
    run(m, 0.1);
    const gen2 = mine(m, 'golemite');
    assert.equal(gen2.length, 4);
    for (const x of gen2) {
      x.deployT = 0;
      m.damage(x, 1e6, null, 1);
    }
    run(m, 0.1);
    assert.equal(mine(m, 'golemite').length, 0, 'zweite Generation teilt sich nicht');
  },
  'golem.epic': (m) => {
    const [g] = play(m, 0, 'golem', 9, 24);
    g.deployT = 0;
    m.damage(g, 1e6, null, 1);
    run(m, 0.1);
    const golems = mine(m, 'golem');
    assert.equal(golems.length, 2);
    assert.ok(golems.every((x) => x.maxHp === 5120 && !x.perkTier));
    assert.equal(mine(m, 'golemite').length, 0);
  },
  'knight.common': (m) => {
    const [k] = play(m, 0, 'knight', 9, 24);
    assert.equal(k.maxHp, 5298);
    close(k.def.speed, 0.5);
  },
  'knight.rare': (m) => {
    const [k] = play(m, 0, 'knight', 9, 22);
    ready([k]);
    const g = foe(m, 'golem', 9, 20.6);
    const ev = events(m, 2.5);
    assert.ok(ev.some((e) => e[0] === 'sp' && e[1] === db.typeIndex.get('zap')), 'Knall am Ziel');
    assert.ok(g.hp <= g.maxHp - 192 - 202);
  },
  'knight.epic': (m) => {
    const out = play(m, 0, 'knight', 9, 24);
    assert.equal(out.length, 1);
    assert.equal(out[0].def.key, 'mega-knight');
    assert.equal(out[0].maxHp, 3993);
    assert.ok(out[0].def.traits.leap && out[0].perkTier === 3);
  },
  'bandit.common': (m) => {
    const [b] = play(m, 0, 'bandit', 6, 28);
    ready([b]);
    foe(m, 'golem', 6, 18.5);
    runUntil(m, () => !!b.dash, 2);
    assert.ok(b.dash, 'sprintet auf 9,5 Felder');
  },
  'bandit.rare': (m) => {
    const [b] = play(m, 0, 'bandit', 9, 24);
    ready([b]);
    const g = foe(m, 'golem', 9, 20);
    run(m, 0.05);
    const hp0 = g.hp;
    m.damage(b, 5000, null, 1);
    assert.ok(!b.dead && b.invulnT > 1.4, 'unverwundbar statt tot');
    assert.ok(b.dash, 'letzter Sprint');
    runUntil(m, () => b.dead, 3);
    assert.ok(b.dead);
    assert.ok(hp0 - g.hp >= 389, `Sprintschaden ${hp0 - g.hp}`);
  },
  'bandit.epic': (m) => {
    const [b] = play(m, 0, 'bandit', 9, 26);
    ready([b]);
    foe(m, 'golem', 9, 21.5);
    foe(m, 'golem', 6, 22);
    foe(m, 'golem', 12, 22);
    runUntil(m, () => !!b.dash, 2);
    const clones = m.entities.filter((e) => e.owner === 0 && e.clone && e.def.key === 'bandit');
    assert.equal(clones.length, 2);
    assert.ok(clones.every((c) => c.hp === 1 && c.dash));
    assert.ok(new Set(clones.map((c) => c.dash.targetId)).size === 2);
  },
  'valkyrie.common': (m) => close(play(m, 0, 'valkyrie', 9, 24)[0].def.splash, 5),
  'valkyrie.rare': (m) => {
    const [v] = play(m, 0, 'valkyrie', 9, 24);
    ready([v]);
    foe(m, 'golem', 9, 22.6);
    const k = foe(m, 'knight', 12, 24);
    k.speed = 0;
    k.stunT = 99;
    const d0 = Math.hypot(k.x - v.x, k.y - v.y);
    runUntil(m, () => v.attacks > 0, 4);
    const d1 = Math.hypot(k.x - v.x, k.y - v.y);
    assert.ok(d0 - d1 > 0.9, `herangezogen ${d0} → ${d1}`);
  },
  'valkyrie.epic': (m) => {
    const [v] = play(m, 0, 'valkyrie', 6, 28);
    close(v.def.speed, 3);
    ready([v]);
    // ein getarnter Ritter am Weg (kein Ziel) – sie läuft zum Golem und trifft ihn im Vorbeilaufen
    const k = foe(m, 'knight', 6.8, 25.5);
    k.stunT = 99;
    k.cloakT = 99;
    foe(m, 'golem', 6, 19).stunT = 99;
    run(m, 1.2);
    assert.ok(k.hp < k.maxHp, 'Rundumschlag im Laufen');
    assert.ok(v.y < 26, 'läuft dabei weiter');
  },
  'mini-pekka.common': (m) => {
    const g = foe(m, 'golem', 9, 22);
    const out = play(m, 0, 'mini-pekka', 9, 22.5);
    assert.equal(out.length, 0, 'kommt erst vom Himmel');
    run(m, 2.9);
    assert.equal(mine(m, 'mini-pekka').length, 0);
    run(m, 0.2);
    assert.equal(mine(m, 'mini-pekka').length, 1);
    assert.equal(g.maxHp - g.hp, 384);
    // kein Turmschaden
    const own = m.towers.find((t) => t.owner === 1 && t.towerKey === 'king');
    assert.equal(own.hp, own.maxHp);
  },
  'mini-pekka.rare': (m) => {
    const out = play(m, 0, 'mini-pekka', 9, 24);
    assert.equal(out.length, 2);
    assert.ok(out.every((e) => e.maxHp === 765 && e.def.damage === 755));
  },
  'mini-pekka.epic': (m) => {
    const [p] = play(m, 0, 'mini-pekka', 9, 24);
    close(p.def.speed, 3);
    assert.equal(p.maxHp, 4865);
  },
  'prince.common': (m) => assert.equal(play(m, 0, 'prince', 9, 24)[0].def.traits.charge.damage, 1370),
  'prince.rare': (m) => {
    const [p] = play(m, 0, 'prince', 6, 28);
    ready([p]);
    const g = foe(m, 'knight', 6, 22);
    g.stunT = 0;
    const hits = [];
    for (let i = 0; i < 20 * 8 && hits.length < 2; i++) {
      const hp = g.hp;
      m.step();
      m.flushEvents();
      if (g.hp < hp - 700) hits.push(m.time);
      if (g.dead) break;
    }
    assert.ok(hits.length >= 2, `zwei Ansturmtreffer (${hits.length})`);
  },
  'prince.epic': (m) => {
    const [p] = play(m, 0, 'prince', 9, 24);
    ready([p]);
    foe(m, 'knight', 9, 21.5);
    const b = foe(m, 'tesla', 9, 18.5);
    b.hidden = false;
    run(m, 1);
    const tgt = m.byId.get(p.targetId);
    assert.ok(tgt && tgt.kind === 'tower', 'Ziel ist ein Kronenturm');
    assert.ok(p.charging, 'dauerhaft im Ansturm');
    m.stun(p, 2);
    m.slow(p, 0.5, 2);
    assert.equal(p.stunT, 0);
    assert.equal(p.slowT, 0);
    const x0 = p.x;
    m.knockback(p, p.x - 1, p.y, 3, true);
    assert.equal(p.x, x0);
    // schiebt alles in seinem Weg zur Seite
    const { m: m2 } = arena('prince.epic');
    const [p2] = play(m2, 0, 'prince', 3.5, 22);
    ready([p2]);
    const block = foe(m2, 'golem', 3.6, 19.5);
    block.stunT = 99;
    const bx = block.x;
    runUntil(m2, () => Math.abs(block.x - bx) > 2, 6);
    assert.ok(Math.abs(block.x - bx) > 2.5, `3 Felder zur Seite (${block.x - bx})`);
    run(m2, 1.5);
    assert.ok(p2.y < 18.5, `läuft weiter (${p2.y})`);
  },
  'bomber.common': (m) => assert.equal(play(m, 0, 'bomber', 9, 24)[0].maxHp, 1216),
  'bomber.rare': (m) => {
    const [b] = play(m, 0, 'bomber', 9, 24);
    ready([b]);
    foe(m, 'golem', 9, 20);
    const ev = events(m, 3);
    assert.ok(ev.filter((e) => e[0] === 'bl' && e[5] === 'bomb').length >= 2, 'Bombe hüpft weiter');
  },
  'bomber.epic': (m) => {
    const [b] = play(m, 0, 'bomber', 9, 24);
    ready([b]);
    const g = foe(m, 'golem', 9, 20.5);
    g.stunT = 99;
    runUntil(m, () => m.zones.some((z) => z.s.damage === 688), 3);
    const z = m.zones.find((z) => z.s.damage === 688);
    assert.ok(z, 'Bombe liegt');
    assert.equal(z.s.towerDamage, 2);
    assert.equal(z.delay, 3);
  },
  'archers.common': (m) => {
    const [a] = play(m, 0, 'archers', 9, 24);
    close(a.def.range, 12.5);
    assert.equal(a.def.sight, 12.5);
  },
  'archers.rare': (m) => {
    const out = play(m, 0, 'archers', 9, 26);
    ready(out);
    const a = foe(m, 'golem', 9, 22);
    const b = foe(m, 'golem', 9, 19);
    a.stunT = b.stunT = 99;
    run(m, 3);
    assert.ok(a.hp < a.maxHp && b.hp < b.maxHp, 'Pfeil fliegt durch');
  },
  'archers.epic': () => {},
  'musketeer.common': (m) => close(play(m, 0, 'musketeer', 9, 24)[0].def.hitSpeed, 0.5),
  'musketeer.rare': (m) => {
    const [mu] = play(m, 0, 'musketeer', 9, 26);
    ready([mu]);
    assert.equal(mu.def.projectile.kind, 'cannonball');
    close(mu.def.projectile.speed, 8.33);
    const k = foe(m, 'knight', 9, 21);
    k.stunT = 99;
    const y0 = k.y;
    runUntil(m, () => k.hp < k.maxHp, 4);
    assert.ok(y0 - k.y > 1.2, `zurückgedrückt ${y0 - k.y}`);
  },
  'musketeer.epic': (m) => {
    const [mu] = play(m, 0, 'musketeer', 9, 26);
    ready([mu]);
    for (let i = 0; i < 6; i++) {
      const s = foe(m, 'skeletons', 9, 21);
      s.stunT = 99;
      runUntil(m, () => s.dead, 3);
      run(m, 0.05);
    }
    const extra = mine(m, 'musketeer').length - 1;
    assert.equal(extra, 4, 'höchstens 4 zusätzliche');
    assert.ok(mine(m, 'musketeer').filter((e) => e !== mu).every((e) => !e.perkTier && e.maxHp === 721));
  },
  'electro-wizard.common': (m) => assert.equal(play(m, 0, 'electro-wizard', 9, 24)[0].def.traits.multiTarget, 3),
  'electro-wizard.rare': (m) => {
    const [w] = play(m, 0, 'electro-wizard', 9, 26);
    ready([w]);
    const a = foe(m, 'golem', 8, 22);
    const b = foe(m, 'golem', 10, 22);
    const at = [];
    for (let i = 0; i < 20 * 6; i++) {
      m.step();
      if (m.events.some((e) => e[0] === 'pv' && e[1] === 'zap')) at.push(m.time);
      m.flushEvents();
    }
    const da = a.maxHp - a.hp;
    const db2 = b.maxHp - b.hp;
    assert.ok(da >= 300 && db2 >= 300, `Dauerstrahl auf 2 Ziele (${da}, ${db2})`);
    assert.ok(at.length >= 3);
    for (let i = 1; i < at.length; i++) close(at[i] - at[i - 1], 1.8, 0.06, 'Betäubung alle 1,8 s');
  },
  'electro-wizard.epic': (m) => {
    const [w] = play(m, 0, 'electro-wizard', 9, 26);
    ready([w]);
    foe(m, 'golem', 9, 22);
    const ev = events(m, 3);
    assert.ok(ev.some((e) => e[0] === 'st'), 'Blitz-Zauber');
    assert.ok(ev.some((e) => e[0] === 'sp' && e[1] === db.typeIndex.get('lightning')));
  },
  'goblin-demolisher.common': (m) => close(play(m, 0, 'goblin-demolisher', 9, 24)[0].def.range, 12.5),
  'goblin-demolisher.rare': (m) => {
    const [d] = play(m, 0, 'goblin-demolisher', 9, 24);
    ready([d]);
    const g = foe(m, 'golem', 9, 22.3);
    g.stunT = 99;
    run(m, 0.05);
    const hp0 = g.hp;
    m.damage(d, d.maxHp * 0.6, null, 1);
    run(m, 0.1);
    assert.ok(hp0 - g.hp >= 404, `Explosion beim Verwandeln (${hp0 - g.hp})`);
    assert.equal(mine(m, 'goblin-demolisher-kamikaze').length, 1, 'rennt danach los');
  },
  'goblin-demolisher.epic': (m) => {
    const [d] = play(m, 0, 'goblin-demolisher', 9, 24);
    close(d.def.hitSpeed, 0.2, 1e-3);
    assert.equal(db.unit('goblin-demolisher-kamikaze').hitSpeed, 0.5, 'Kamikaze-Form unverändert');
  },
  'wizard.common': (m) => close(play(m, 0, 'wizard', 9, 24)[0].def.splash, 3),
  'wizard.rare': (m) => {
    const [w] = play(m, 0, 'wizard', 9, 26);
    ready([w]);
    const g = foe(m, 'golem', 9, 21.5);
    g.stunT = 99;
    run(m, 2);
    assert.ok(g.maxHp - g.hp >= 688, 'Feuerball-Zauber');
  },
  'wizard.epic': (m) => {
    const out = play(m, 0, 'wizard', 9, 24);
    assert.deepEqual(out.map((e) => e.def.key).sort(), ['electro-wizard', 'ice-wizard', 'wizard']);
    assert.ok(out.filter((e) => e.def.key !== 'wizard').every((e) => !e.px));
  },
  'witch.common': (m) => close(play(m, 0, 'witch', 9, 24)[0].def.traits.spawner.interval, 3.5),
  'witch.rare': (m) => {
    const [w] = play(m, 0, 'witch', 9, 24);
    ready([w]);
    run(m, 1.3);
    assert.equal(mine(m, 'guards').length, 4);
    assert.ok(mine(m, 'guards').every((g) => g.shield === 256));
  },
  'witch.epic': (m) => {
    const [w] = play(m, 0, 'witch', 9, 24);
    ready([w]);
    run(m, 1.3);
    const sk = mine(m, 'skeletons');
    assert.equal(sk.length, 4);
    assert.ok(sk.every((s) => s.evo && s.groupId > 0), 'Evo-Skelette mit eigener Gruppe');
  },
  'bats.common': (m) => {
    const out = play(m, 0, 'bats', 9, 24);
    ready(out);
    const b = out[0];
    b.hp = 30;
    foe(m, 'golem', b.x, b.y - 1.2);
    runUntil(m, () => b.attacks > 0, 3);
    run(m, 0.05);
    assert.ok(b.hp >= 70, `geheilt (${b.hp})`);
  },
  'bats.rare': (m) => {
    const out = play(m, 0, 'bats', 9, 24);
    m.damage(out[0], 999, null, 1);
    run(m, 0.05);
    const minis = mine(m, 'bats').filter((b) => b.maxHp === 41 || b.maxHp === 40);
    assert.equal(minis.length, 2, 'zwei Mini-Fledermäuse');
    for (const x of minis) m.damage(x, 999, null, 1);
    run(m, 0.05);
    assert.equal(mine(m, 'bats').filter((b) => b.maxHp <= 41).length, 0, 'teilen sich nicht weiter');
  },
  'bats.epic': (m) => {
    const out = play(m, 0, 'bats', 9, 24);
    ready(out);
    const b = out[0];
    for (const o of out.slice(1)) o.dead = true;
    const a = foe(m, 'golem', b.x, b.y - 1.6);
    const c = foe(m, 'knight', b.x + 0.9, b.y - 1.9);
    a.stunT = c.stunT = 99;
    runUntil(m, () => b.attacks > 0, 3);
    run(m, 0.05);
    assert.equal(a.maxHp - a.hp, 100);
    assert.equal(c.maxHp - c.hp, 100, 'Fläche');
  },
  'minions.common': (m) => assert.equal(play(m, 0, 'minions', 9, 24).length, 4),
  'minions.rare': (m) => {
    const out = play(m, 0, 'minions', 9, 24);
    ready(out);
    const g = foe(m, 'knight', 9, 22);
    runUntil(m, () => g.stunT > 0, 3);
    assert.ok(g.stunT > 0);
  },
  'minions.epic': (m) => {
    const out = play(m, 0, 'minions', 9, 24);
    assert.equal(out.length, 3);
    assert.ok(out.every((e) => e.def.key === 'mega-minion' && e.maxHp === 837));
  },
  'goblin-gang.common': (m) => {
    const out = play(m, 0, 'goblin-gang', 9, 24);
    assert.equal(out.filter((e) => e.def.key === 'goblins').length, 5);
    assert.equal(out.filter((e) => e.def.key === 'spear-goblins').length, 5);
  },
  'goblin-gang.rare': (m) => {
    const out = play(m, 0, 'goblin-gang', 9, 26);
    assert.equal(out.length, 6);
    assert.ok(out.every((e) => e.def.key === 'spear-goblins' && e.def.traits.poisonDart));
    ready(out);
    const g = foe(m, 'golem', 9, 21.5);
    g.stunT = 99;
    run(m, 2);
    assert.ok(m.zones.some((z) => z.follow === g.id && z.s.fx === 'poison'), 'Gift am Ziel');
  },
  'goblin-gang.epic': (m) => {
    const out = play(m, 0, 'goblin-gang', 9, 24);
    assert.deepEqual(out.map((e) => e.def.key).sort(), ['dart-goblin', 'dart-goblin', 'goblin-giant']);
  },
  'skeleton-army.common': (m) => {
    const out = play(m, 0, 'skeleton-army', 9, 24);
    assert.equal(out.length, 15);
    assert.ok(out.every((s) => s.shield === 60));
  },
  'skeleton-army.rare': (m) => {
    const out = play(m, 0, 'skeleton-army', 9, 24);
    ready(out);
    m.damage(out[0], 999, null, 1);
    run(m, 0.05);
    const shade = m.entities.find((e) => e.owner === 0 && e.def.key === 'skeletons' && e.def.lifetime === 6);
    assert.ok(shade, 'Schattenskelett');
    shade.deployT = 0;
    run(m, 0.1);
    assert.ok(m.isHidden(shade), 'unsichtbar');
    const k = foe(m, 'knight', shade.x, shade.y - 1);
    assert.equal(m.canTarget(k, shade), false, 'nicht anvisierbar');
    m.areaBlast(1, shade.x, shade.y, { damage: 10, radius: 1 }, null);
    assert.ok(shade.hp < shade.maxHp, 'Flächenschaden trifft');
    m.damage(shade, 999, null, 1);
    run(m, 0.05);
    assert.equal(m.entities.filter((e) => e.def.lifetime === 6).length, 0, 'steht nur einmal auf');
    run(m, 7);
  },
  'skeleton-army.epic': (m) => {
    const out = play(m, 0, 'skeleton-army', 9, 24);
    assert.equal(out.length, 15);
    const allowed = new Set(['skeletons', 'guards', 'bomber', 'wall-breakers', 'skeleton-dragons', 'skeletrooper', 'giant-skeleton', 'skeleton-king', 'tomb-queen']);
    assert.ok(out.every((e) => allowed.has(e.def.key)), out.map((e) => e.def.key).join());
    for (const heavy of ['giant-skeleton', 'skeleton-king', 'tomb-queen']) assert.ok(out.filter((e) => e.def.key === heavy).length <= 1);
    assert.ok(out.every((e) => !e.ability), 'Skelettkönig ohne Fähigkeit');
    assert.ok(new Set(out.map((e) => e.def.key)).size >= 3, 'gemischt');
  },
  'barbarians.common': (m) => assert.equal(play(m, 0, 'barbarians', 9, 24).length, 6),
  'barbarians.rare': (m) => assert.ok(play(m, 0, 'barbarians', 9, 24).every((b) => b.maxHp === 1432)),
  'barbarians.epic': (m) => {
    const out = play(m, 0, 'barbarians', 9, 24);
    assert.equal(out.length, 3);
    assert.ok(out.every((e) => e.def.key === 'elite-barbarians'));
  },
  'ice-spirit.common': (m) => assert.equal(play(m, 0, 'ice-spirit', 9, 24).length, 3),
  'ice-spirit.rare': (m) => {
    const [s] = play(m, 0, 'ice-spirit', 9, 24);
    ready([s]);
    foe(m, 'golem', 9, 22);
    runUntil(m, () => s.dead, 4);
    run(m, 0.1);
    const z = m.zones.find((zz) => zz.s.px?.freeze);
    assert.ok(z, 'Schneesturm');
    assert.equal(z.s.duration, 7);
    // wer hineinläuft, friert ein – und alle 2,5 s erneut
    const k = foe(m, 'knight', z.x + 4, z.y);
    k.x = z.x + 1;
    run(m, 0.1);
    assert.ok(k.stunT > 0.9 && k.frozen, 'eingefroren');
    k.stunT = 0;
    run(m, 1);
    assert.equal(k.stunT, 0);
    run(m, 1.6);
    assert.ok(k.stunT > 0, 'erneut eingefroren');
  },
  'ice-spirit.epic': (m) => {
    const out = play(m, 0, 'ice-spirit', 9, 24);
    assert.equal(out.length, 1);
    assert.equal(out[0].def.key, 'ice-golem');
    assert.equal(out[0].maxHp, 4912);
    close(out[0].px.scale, 1.5);
  },
  'mega-minion.common': (m) => assert.equal(play(m, 0, 'mega-minion', 9, 24)[0].maxHp, 2511),
  'mega-minion.rare': (m) => {
    const [mm] = play(m, 0, 'mega-minion', 9, 24);
    ready([mm]);
    const a = foe(m, 'golem', 9, 21.8);
    const b = foe(m, 'knight', 9.8, 21.6);
    a.stunT = b.stunT = 99;
    run(m, 2.2);
    assert.ok(a.hp < a.maxHp && b.hp < b.maxHp, 'Flammenkegel trifft mehrere');
    assert.ok(a.slowT > 0 && a.burn, 'verlangsamt und brennt');
    mm.dead = true;
    run(m, 0.1);
    const hp = a.hp;
    run(m, 2);
    assert.ok(hp - a.hp >= 70, `Nachbrennen ${hp - a.hp}`);
  },
  'mega-minion.epic': (m) => {
    const [mm] = play(m, 0, 'mega-minion', 9, 24);
    close(mm.def.range, 9.6);
    close(mm.def.hitSpeed, 0.5, 1e-3);
  },
  'baby-dragon.common': (m) => close(play(m, 0, 'baby-dragon', 9, 24)[0].def.speed, 4.5),
  'baby-dragon.rare': (m) => {
    const [d] = play(m, 0, 'baby-dragon', 9, 26);
    ready([d]);
    const g = foe(m, 'golem', 9, 22.3);
    g.stunT = 99;
    const ev = events(m, 2);
    assert.ok(ev.some((e) => e[0] === 'sp' && e[1] === db.typeIndex.get('fireball')), 'Feuerball-Zauber');
  },
  'baby-dragon.epic': (m) => {
    const [d] = play(m, 0, 'baby-dragon', 9, 24);
    m.damage(d, 1e5, null, 1);
    run(m, 0.05);
    const hatched = m.entities.filter((e) => e.owner === 0 && !e.dead && e !== d && e.kind === 'unit');
    assert.equal(hatched.length, 1);
    assert.ok(['baby-dragon', 'electro-dragon', 'inferno-dragon'].includes(hatched[0].def.key) || hatched[0].def.cardId);
    assert.equal(hatched[0].evo, true, 'Evo-Drache');
    assert.ok(!hatched[0].perkTier);
  },
  'inferno-dragon.common': (m) => close(play(m, 0, 'inferno-dragon', 9, 24)[0].def.range, 7),
  'inferno-dragon.rare': (m) => {
    const [d] = play(m, 0, 'inferno-dragon', 9, 25);
    ready([d]);
    const a = foe(m, 'golem', 8, 22);
    const b = foe(m, 'golem', 10.5, 22);
    a.stunT = b.stunT = 99;
    run(m, 5);
    assert.ok(a.maxHp - a.hp > 300 && b.maxHp - b.hp > 300, `zwei Strahlen (${a.maxHp - a.hp}, ${b.maxHp - b.hp})`);
  },
  'inferno-dragon.epic': (m) => {
    const [d] = play(m, 0, 'inferno-dragon', 9, 25);
    assert.equal(d.evo, true);
    ready([d]);
    const a = foe(m, 'golem', 9, 22);
    const far = foe(m, 'knight', 2, 4);
    far.stunT = 99;
    a.stunT = 99;
    run(m, 1.5);
    const da = a.maxHp - a.hp;
    const dfar = far.maxHp - far.hp;
    assert.ok(dfar > 0, 'auch weit entfernte Truppen');
    close(dfar, da / 2, 1, 'Hälfte');
    const t = m.towers.find((x) => x.owner === 1 && x.towerKey === 'king');
    assert.equal(t.hp, t.maxHp, 'Türme ausgenommen');
  },
  'hog-rider.common': (m) => close(play(m, 0, 'hog-rider', 9, 24)[0].def.speed, 3.5),
  'hog-rider.rare': (m) => {
    const [h] = play(m, 0, 'hog-rider', 9, 24);
    const t = enemyTower(m);
    atTower(h, t);
    const dmg = [];
    for (let i = 0; i < 20 * 5; i++) {
      const hp = t.hp;
      m.step();
      if (t.hp < hp) dmg.push(Math.round(hp - t.hp));
    }
    assert.ok(dmg.includes(50) && dmg.includes(120) && dmg.includes(300), `Bohrer steigert sich: ${[...new Set(dmg)]}`);
  },
  'hog-rider.epic': (m) => {
    const [h] = play(m, 0, 'hog-rider', 9, 24);
    const t = enemyTower(m);
    atTower(h, t);
    runUntil(m, () => h.attacks >= 3, 8);
    run(m, 0.1);
    const piglets = mine(m, 'royal-hogs');
    assert.equal(piglets.length, 3);
    assert.ok(piglets.every((p) => p.maxHp === 301 && p.def.damage === 80));
  },
  'battle-ram.common': (m) => {
    const [r] = play(m, 0, 'battle-ram', 9, 24);
    m.damage(r, 1e5, null, 1);
    run(m, 0.05);
    assert.equal(mine(m, 'barbarians').length, 4);
  },
  'battle-ram.rare': (m) => {
    const [r] = play(m, 0, 'battle-ram', 9, 24);
    m.damage(r, 1e5, null, 1);
    run(m, 0.05);
    assert.equal(mine(m, 'elite-barbarians').length, 2);
  },
  'battle-ram.epic': (m) => {
    const out = play(m, 0, 'battle-ram', 9, 24);
    assert.equal(out.length, 2);
    close(out[0].y, out[1].y, 1e-6, 'nebeneinander');
  },
  'balloon.common': (m) => close(play(m, 0, 'balloon', 9, 24)[0].def.hitSpeed, 0.667, 1e-3),
  'balloon.rare': (m) => {
    const [b] = play(m, 0, 'balloon', 6, 28);
    ready([b]);
    const k = foe(m, 'golem', 6, 26.6);
    k.stunT = 99;
    run(m, 2);
    assert.ok(k.maxHp - k.hp >= 150, 'Bomben unterwegs');
  },
  'balloon.epic': (m) => {
    const [b] = play(m, 0, 'balloon', 9, 24);
    assert.equal(b.maxHp, 6716);
    assert.equal(b.def.damage, 960);
    close(b.radius, 1.2);
  },
  'royal-giant.common': () => {},
  'royal-giant.rare': (m) => assert.equal(play(m, 0, 'royal-giant', 9, 24)[0].maxHp, 9492),
  'royal-giant.epic': (m) => {
    const [r] = play(m, 0, 'royal-giant', 3.5, 20);
    ready([r]);
    close(r.def.range, 11);
    const t = enemyTower(m, 0);
    const y0 = r.y;
    runUntil(m, () => r.attacks > 0, 10);
    const d = Math.hypot(t.x - r.x, t.y - r.y);
    assert.ok(d > 7, `schießt aus großer Distanz (${d})`);
    run(m, 1);
    assert.ok(r.y < y0 - 0.5, 'läuft beim Schießen weiter');
  },
  'tesla.common': (m) => assert.equal(play(m, 0, 'tesla', 9, 24)[0].def.traits.multiTarget, 4),
  'tesla.rare': (m) => {
    const [t] = play(m, 0, 'tesla', 9, 24);
    ready([t]);
    const k = foe(m, 'golem', 9, 21);
    k.stunT = 99;
    for (let i = 0; i < 12; i++) run(m, 1.1);
    assert.equal(k.maxHp, Math.round(5120 * 0.3), 'höchstens −70 %');
    close(k.dmgMult, 0.3, 1e-9);
  },
  'tesla.epic': (m) => {
    const [t] = play(m, 0, 'tesla', 9, 24);
    t.deployT = 0;
    t.hidden = false;
    m.damage(t, 1e5, null, 1);
    run(m, 0.05);
    const keys = m.entities.filter((e) => e.owner === 0 && e.kind === 'unit').map((e) => e.def.key).sort();
    assert.deepEqual(keys, ['goblinstein', 'goblinstein-monster']);
    assert.ok(m.entities.filter((e) => e.owner === 0 && e.kind === 'unit').every((e) => !e.ability));
    // auch beim Ablaufen
    const { m: m2 } = arena('tesla.epic');
    const [t2] = play(m2, 0, 'tesla', 9, 24);
    t2.deployT = 0;
    run(m2, 26);
    assert.ok(m2.entities.some((e) => e.def.key === 'goblinstein-monster'));
  },
  'goblin-hut.common': (m) => {
    const [h] = play(m, 0, 'goblin-hut', 9, 24);
    ready([h]);
    foe(m, 'golem', 9, 19.5).stunT = 99;
    run(m, 1);
    assert.equal(mine(m, 'spear-goblins').length, 2);
  },
  'goblin-hut.rare': (m) => {
    const [h] = play(m, 0, 'goblin-hut', 9, 24);
    ready([h]);
    const g = foe(m, 'minions', 9, 17.5);
    g.stunT = 99;
    run(m, 2);
    assert.ok(g.hp < g.maxHp, 'Hütte wirft selbst Speere (auch auf Flieger)');
    assert.equal(h.def.range, 8);
  },
  'goblin-hut.epic': (m) => {
    const [h] = play(m, 0, 'goblin-hut', 9, 24);
    ready([h]);
    foe(m, 'golem', 9, 19.5).stunT = 99;
    run(m, 1);
    assert.equal(mine(m, 'goblin-demolisher').length, 1);
    m.damage(h, 1e5, null, 1);
    run(m, 0.05);
    assert.equal(mine(m, 'goblin-demolisher').length, 2);
  },
  'inferno-tower.common': (m) => close(play(m, 0, 'inferno-tower', 9, 24)[0].def.traits.ramp.stageTime, 1),
  'inferno-tower.rare': (m) => {
    const [t] = play(m, 0, 'inferno-tower', 9, 24);
    ready([t]);
    const gs = [foe(m, 'golem', 7, 20), foe(m, 'golem', 9, 19.5), foe(m, 'golem', 11, 20)];
    for (const g of gs) g.stunT = 99;
    run(m, 3);
    assert.ok(gs.every((g) => g.hp < g.maxHp - 100), 'drei Strahlen');
  },
  'inferno-tower.epic': (m) => {
    const [t] = play(m, 0, 'inferno-tower', 9, 24);
    ready([t]);
    const g = foe(m, 'golem', 9, 20);
    g.stunT = 99;
    runUntil(m, () => g.hp < g.maxHp, 3);
    assert.equal(g.maxHp - g.hp, 847, 'sofort Höchststufe');
    m.stun(t, 0.5);
    run(m, 0.6);
    const hp = g.hp;
    runUntil(m, () => g.hp < hp, 2);
    assert.equal(hp - g.hp, 847, 'fällt nach Betäubung nicht zurück');
  },
  'zap.common': (m) => {
    const g = foe(m, 'golem', 9, 9);
    g.stunT = 99;
    play(m, 0, 'zap', 9, 9);
    run(m, 0.1);
    const afterZap = 5120 - 192;
    assert.equal(Math.round(g.hp), Math.round(afterZap * 0.7));
    close(g.dmgMult, 0.5);
    const t = m.towers.find((x) => x.owner === 1 && x.towerKey === 'king');
    const { m: m2 } = arena('zap.common');
    const king = m2.towers.find((x) => x.owner === 1 && x.towerKey === 'king');
    play(m2, 0, 'zap', king.x, king.y);
    run(m2, 0.1);
    close(king.maxHp - king.hp, 192 * 0.3, 1, 'Kronenturm nur normaler Schaden');
    void t;
  },
  'zap.rare': (m) => {
    // Golem außerhalb des Knalls (2,5), aber im Blitz-Umkreis (3,5)
    const g = foe(m, 'golem', 11.9, 9);
    const k = foe(m, 'knight', 8, 9);
    g.stunT = k.stunT = 99;
    play(m, 0, 'zap', 8, 9);
    run(m, 0.5);
    assert.equal(g.maxHp - g.hp, 1057, 'Blitz auf den Gegner mit den meisten Leben');
  },
  'zap.epic': (m) => {
    play(m, 0, 'zap', 9, 20);
    const zs = m.zones.filter((z) => z.typeIdx === db.typeIndex.get('zap'));
    assert.equal(zs.length, 5);
    const ys = zs.map((z) => z.y);
    assert.deepEqual(ys, [20, 17.5, 15, 12.5, 10]);
    assert.deepEqual(zs.map((z) => Math.round(z.delay * 10) / 10), [0, 0.3, 0.6, 0.9, 1.2]);
  },
  'the-log.common': (m) => {
    play(m, 0, 'the-log', 9, 24);
    close(m.zones.at(-1).s.roll.length, 20.2);
  },
  'the-log.rare': (m) => {
    play(m, 0, 'the-log', 9, 24);
    assert.equal(m.zones.filter((z) => z.s.roll).length, 1);
    run(m, 1.05);
    assert.equal(m.zones.filter((z) => z.s.roll).length, 2, 'zweiter Stamm nach 1 s');
  },
  'the-log.epic': (m) => {
    play(m, 0, 'the-log', 9, 24);
    run(m, 2);
    assert.equal(mine(m, 'lumberjack').length, 1);
  },
  'arrows.common': (m) => {
    play(m, 0, 'arrows', 9, 9);
    assert.equal(m.zones.at(-1).s.waves, 4);
  },
  'arrows.rare': (m) => {
    const g = foe(m, 'golem', 9, 9);
    g.stunT = 99;
    play(m, 0, 'arrows', 9, 9);
    run(m, 3);
    const direct = 3 * 150;
    assert.ok(g.maxHp - g.hp >= direct + 25, `Feuerregen und Brennen (${g.maxHp - g.hp})`);
    assert.ok(g.burn || g.maxHp - g.hp >= direct + 40);
  },
  'arrows.epic': (m) => {
    play(m, 0, 'arrows', 9, 9);
    run(m, 1.5);
    const q = mine(m, 'archer-queen');
    assert.equal(q.length, 1);
    assert.equal(q[0].ability, null);
  },
  'goblin-barrel.common': (m) => {
    play(m, 0, 'goblin-barrel', 9, 9);
    close(m.zones.at(-1).s.travel, 15);
  },
  'goblin-barrel.rare': (m) => {
    const g = foe(m, 'golem', 9, 9);
    g.stunT = 99;
    play(m, 0, 'goblin-barrel', 9, 9);
    run(m, 3);
    assert.equal(g.maxHp - g.hp >= 1484, true);
    assert.equal(mine(m, 'goblins').length, 3);
  },
  'goblin-barrel.epic': (m) => {
    play(m, 0, 'goblin-barrel', 9, 9);
    run(m, 3.5);
    assert.equal(mine(m, 'goblin-giant').length, 1);
    assert.equal(mine(m, 'goblins').length, 0);
  },
  'fireball.common': (m) => {
    const g = foe(m, 'golem', 9, 9);
    g.stunT = 99;
    play(m, 0, 'fireball', 9, 9);
    run(m, 5);
    assert.ok(g.maxHp - g.hp >= 688 + 140, `Glutboden (${g.maxHp - g.hp})`);
  },
  'fireball.rare': (m) => {
    const g = foe(m, 'golem', 9, 9);
    g.stunT = 99;
    play(m, 0, 'fireball', 9, 9);
    assert.ok(m.zones.some((z) => z.typeIdx === db.typeIndex.get('tornado')), 'Tornado zuerst');
    const fbs = m.zones.filter((z) => z.typeIdx === db.typeIndex.get('fireball'));
    assert.deepEqual(fbs.map((z) => z.delay), [0.4, 0.7, 1]);
    run(m, 1.3);
    assert.ok(g.maxHp - g.hp >= 3 * 688, `drei Feuerbälle (${g.maxHp - g.hp})`);
  },
  'fireball.epic': (m) => {
    const g = foe(m, 'golem', 9, 9);
    const far = foe(m, 'knight', 9, 3.2);
    g.stunT = far.stunT = 99;
    play(m, 0, 'fireball', 9, 9);
    run(m, 3);
    assert.ok(g.maxHp - g.hp >= 1000);
    assert.ok(far.maxHp - far.hp >= 300, 'Druckwelle bis 7 Felder');
  },
  'poison.common': (m) => {
    const k = foe(m, 'golem', 9, 9);
    play(m, 0, 'poison', 9, 9);
    run(m, 1.5);
    close(k.slowAmt, 0.5);
  },
  'poison.rare': () => {},
  'poison.epic': (m) => {
    const k = foe(m, 'knight', 9, 9);
    const b = foe(m, 'minions', 10, 9);
    play(m, 0, 'poison', 9, 9);
    run(m, 1.5);
    const z = m.zones.at(-1);
    close(z.r, 4.95);
    assert.equal(z.s.duration, 16);
    assert.equal(z.s.damage, 184);
    assert.ok(k.rootT > 13 && b.rootT > 13, 'festgehalten bis zum Ende, auch Flieger');
    const x0 = k.x;
    run(m, 1);
    assert.equal(k.x, x0);
  },
  'golden-knight.common': () => {},
  'golden-knight.rare': (m) => close(play(m, 0, 'golden-knight', 9, 24)[0].def.hitSpeed, 0.45),
  'golden-knight.epic': (m) => {
    const [k] = play(m, 0, 'golden-knight', 12, 26);
    assert.equal(k.ability.dash.count, 50);
    ready([k]);
    run(m, 0.05);
    // 14 Gegner in einer Gruppe weit weg von den Türmen: mehr als 10 Sprünge
    for (let i = 0; i < 14; i++) foe(m, 'skeletons', 11 + (i % 4) * 1.2, 21 + Math.floor(i / 4) * 1.2).stunT = 99;
    m.players[0].elixir = 10;
    assert.ok(m.useAbility(0).ok);
    let jumps = 0;
    for (let i = 0; i < 20 * 12; i++) {
      m.step();
      jumps += m.events.filter((e) => e[0] === 'ds' && e[1] === k.id).length;
      m.flushEvents();
    }
    assert.ok(jumps > 10, `mehr als 10 Sprünge (${jumps})`);
    // Kette Richtung Turm: bevorzugt Ziele zum Turm hin und endet am Turm
    const { m: m2 } = arena('golden-knight.epic');
    const [k2] = play(m2, 0, 'golden-knight', 3.5, 22);
    ready([k2]);
    run(m2, 0.05);
    for (let i = 0; i < 6; i++) foe(m2, 'skeletons', 3.5 + (i % 2 ? 1 : -1), 20 - i * 2.2).stunT = 99;
    foe(m2, 'skeletons', 8, 23).stunT = 99;
    m2.players[0].elixir = 10;
    assert.ok(m2.useAbility(0).ok);
    let last = null;
    for (let i = 0; i < 20 * 10; i++) {
      m2.step();
      for (const e of m2.events) if (e[0] === 'ds' && e[1] === k2.id) last = [e[4], e[5]];
      m2.flushEvents();
    }
    const t = enemyTower(m2, 0);
    assert.ok(last && Math.hypot(last[0] - t.x, last[1] - t.y) < 3, `landet am Turm (${last})`);
  },
  'bowler-hero.common': (m) => assert.equal(play(m, 0, 'bowler-hero', 9, 24)[0].ability.cost, 1),
  'bowler-hero.rare': (m) => {
    const [b] = play(m, 0, 'bowler-hero', 9, 24);
    assert.equal(b.def.traits.pierce.length, 14);
    assert.equal(b.def.traits.pierce.knockback, 2);
  },
  'bowler-hero.epic': (m) => {
    const [b] = play(m, 0, 'bowler-hero', 9, 26);
    ready([b]);
    const g = foe(m, 'knight', 9, 22.5);
    const side = foe(m, 'knight', 10.6, 22.5);
    g.stunT = side.stunT = 99;
    runUntil(m, () => side.hp < side.maxHp, 4);
    assert.ok(side.hp < side.maxHp, 'Explosion trifft daneben');
    assert.ok(side.x > 12, 'fliegt weit zurück');
  },
};

test('Alle 120 Perks haben eine eigene Prüfung', () => {
  assert.deepEqual(Object.keys(CHECKS).sort(), [...chaos.perks.keys()].sort());
});

for (const card of chaos.pool) {
  test(`Perks von ${db.card(card).name}: ${PERK_TIERS.map((t) => chaos.perkFor(card, t).name).join(' · ')}`, () => {
    for (const t of PERK_TIERS) {
      const perk = chaos.perkFor(card, t);
      const { m } = arena(perk.id);
      CHECKS[perk.id](m, perk);
    }
  });
}

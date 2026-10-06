// Erzeugt eine feste, reproduzierbare Extremszene als Snapshot-Folge (wie sie der Server an Spieler 0 sendet):
// viele Einheiten auf beiden Seiten, Schwärme, mehrere Zauber kurz hintereinander, ein Turm fällt mitten im
// Schwarmkampf, Champion-Fähigkeit, Evo-Einheiten. Dient als Benchmark (vorher/nachher) und für Screenshots.
//
//   node tools/bench/replay.mjs [ausgabe.json] [--seconds 14]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb } from '../../shared/cards.js';
import { Match } from '../../server/sim/match.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith('--')) || path.join(ROOT, 'tools/bench/replay.json');
const secIdx = args.indexOf('--seconds');
const SECONDS = secIdx >= 0 ? Number(args[secIdx + 1]) : 14;

export function buildReplay(seconds = SECONDS) {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cards.json'), 'utf8'));
  const rules = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/rules.json'), 'utf8'));
  const db = createDb(raw, { level: rules.cardLevel });
  const deck0 = ['knight', 'archers', 'archer-queen', 'giant', 'fireball', 'freeze', 'poison', 'the-log'];
  const deck1 = ['skeletons', 'bats', 'knight-hero', 'golem', 'zap', 'lightning', 'tornado', 'arrows'];
  const m = new Match({ db, rules, decks: [deck0, deck1], seed: 77 });
  m.started = true;
  const play = (side, id, x, y) => {
    const p = m.players[side];
    p.hand[0] = id;
    p.handReady[0] = 0;
    p.elixir = 10;
    return m.play(side, 0, id, x, y);
  };
  const spawn = (side, ref, x, y, evo = false) => m.addEntity(db.unit(ref, evo), side, x, y, { deployTime: 0.4, evo });
  const marks = [];
  const script = new Map();
  const at = (sec, name, fn, shotDelay = null) => {
    const tick = Math.round(sec * 20);
    if (!script.has(tick)) script.set(tick, []);
    script.get(tick).push(fn);
    if (shotDelay != null) marks.push({ name, tick: tick + Math.round(shotDelay * 20) });
  };

  // ── Aufmarsch: Schwärme, Tanks, Fernkämpfer auf beiden Seiten (≈ 170 Einheiten)
  at(0.2, 'aufmarsch', () => {
    for (const [side, y0, dir] of [[0, 19.5, 1], [1, 12.5, -1]]) {
      for (const lane of [3.5, 14.5]) {
        for (let i = 0; i < 15; i++) spawn(side, 'skeletons', lane - 1.6 + (i % 5) * 0.8, y0 + dir * (Math.floor(i / 5) * 0.8));
        for (let i = 0; i < 6; i++) spawn(side, 'minions', lane - 1.2 + (i % 3) * 1.2, y0 + dir * (2.6 + Math.floor(i / 3) * 0.9));
        for (let i = 0; i < 4; i++) spawn(side, 'barbarians', lane - 1.2 + (i % 2) * 2.4, y0 + dir * (4.6 + Math.floor(i / 2)));
        spawn(side, side ? 'golem' : 'giant', lane, y0 + dir * 6.5);
        for (let i = 0; i < 2; i++) spawn(side, i ? 'wizard' : 'musketeer', lane - 1 + i * 2, y0 + dir * 7.8);
        for (let i = 0; i < 5; i++) spawn(side, 'bats', lane - 1 + (i % 5) * 0.5, y0 + dir * 8.8);
      }
      spawn(side, 'knight', 9, y0 + dir * 1.5, true);
      spawn(side, 'pekka', 9, y0 + dir * 3, side === 0);
      spawn(side, 'baby-dragon', 9, y0 + dir * 5);
    }
  }, 1.6);
  // ── Nachschub-Wellen: Schwärme halten die Einheitenzahl nahe am Limit
  for (const sec of [3.0, 5.5, 8.5]) {
    at(sec, 'welle', () => {
      for (const [side, y0] of [[0, 21], [1, 11]]) {
        for (const lane of [3.5, 9, 14.5]) {
          for (let i = 0; i < 10; i++) spawn(side, i % 2 ? 'goblins' : 'skeletons', lane - 1.5 + (i % 5) * 0.75, y0 + (Math.floor(i / 5) - 0.5) * 0.8);
          for (let i = 0; i < 3; i++) spawn(side, 'minions', lane - 1 + i, y0 + (side ? -1.8 : 1.8));
        }
      }
    });
  }
  // ── Zauber kurz hintereinander, teils gleichzeitig
  at(2.0, 'feuerball', () => play(0, 'fireball', 3.5, 13), 1.9);
  at(2.3, 'pfeile', () => play(1, 'arrows', 14.5, 18.5), 1.3);
  at(3.2, 'gift', () => play(0, 'poison', 14.5, 13.5), 1.0);
  at(3.6, 'zap', () => play(1, 'zap', 3.5, 18), 0.3);
  at(4.4, 'frost', () => play(0, 'freeze', 9, 14), 0.5);
  at(5.0, 'blitz', () => play(1, 'lightning', 9, 19.5), 1.0);
  at(5.6, 'tornado', () => play(1, 'tornado', 3.5, 19), 0.6);
  at(6.2, 'kampfholz', () => play(0, 'the-log', 3.5, 20), 0.5);
  // ── Turm fällt mitten im Schwarmkampf (Wachturm links des Gegners) → Burgturm erwacht
  at(7.0, 'turm-faellt', () => {
    const t = m.towers.find((x) => x.owner === 1 && x.towerKey === 'princess' && x.x < 9);
    if (t && !t.dead) m.damage(t, 1e7, null, 0);
  }, 0.35);
  at(7.6, 'rakete', () => play(1, 'rocket', 9, 25), 1.6);
  at(8.0, 'champion', () => play(0, 'archer-queen', 9, 22), 1.2);
  at(9.3, 'faehigkeit', () => m.useAbility(0), 1.2);
  at(9.0, 'erdbeben', () => play(0, 'earthquake', 14.5, 12), 1.0);
  at(9.8, 'wut', () => play(1, 'rage', 9, 16), 0.8);
  at(10.4, 'friedhof', () => play(0, 'graveyard', 3.5, 9), 2.5);
  at(11.0, 'leere', () => play(1, 'void', 9, 21), 1.2);
  at(11.6, 'fluch', () => play(0, 'goblin-curse', 9, 12), 0.8);
  at(12.2, 'held', () => play(1, 'knight-hero', 9, 10), 1.0);

  const snaps = [];
  const total = Math.round(seconds * 20);
  let maxEntities = 0;
  for (let tick = 0; tick < total; tick++) {
    for (const fn of script.get(tick) || []) fn();
    m.step();
    maxEntities = Math.max(maxEntities, m.entities.length);
    snaps.push(m.snapshot(0));
    m.flushEvents();
  }
  const init = {
    type: 'matchInit',
    side: 0,
    names: ['Benchmark', 'Schwarm-Bot'],
    types: db.typeList,
    deck: deck0,
    training: true,
    matchNo: 1,
    rules: {
      tickRate: rules.tickRate,
      regularSeconds: rules.regularSeconds,
      overtimeSeconds: rules.overtimeSeconds,
      doubleElixirLastSeconds: rules.doubleElixirLastSeconds,
      elixir: rules.elixir,
      suddenDeath: rules.suddenDeath,
      emoteCooldown: rules.emoteCooldown,
      towers: { king: { size: rules.towers.king.size }, princess: { size: rules.towers.princess.size } },
    },
  };
  return { init, snaps: JSON.parse(JSON.stringify(snaps)), marks: marks.sort((a, b) => a.tick - b.tick), maxEntities };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = buildReplay();
  fs.writeFileSync(out, JSON.stringify(r));
  console.log(`${r.snaps.length} Snapshots, max. ${r.maxEntities} Entitäten, ${r.marks.length} Marken → ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
}

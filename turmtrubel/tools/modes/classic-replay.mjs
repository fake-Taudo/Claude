// Regressions-Aufzeichnung des klassischen 1v1-Modus.
// Spielt Bot-gegen-Bot-Kämpfe mit festen Seeds, protokolliert alle Eingaben und bildet je Tick eine
// Prüfsumme über den kompletten Snapshot (gemeinsamer Teil + beide Spielerzustände).
//
//   node tools/modes/classic-replay.mjs --write   → test/fixtures/classic-replay.json neu schreiben
//   node tools/modes/classic-replay.mjs           → mit der gespeicherten Aufzeichnung vergleichen
//
// test/classic-regression.test.js spielt die gespeicherten Eingaben erneut ab: Die Simulation des
// klassischen Modus muss Tick für Tick dieselben Prüfsummen liefern wie vor dem Modus-Umbau.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createDb, randomDeck } from '../../shared/cards.js';
import { Match } from '../../server/sim/match.js';
import { Bot } from '../../server/bot.js';
import { mulberry32 } from '../../server/sim/rng.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const FIXTURE = path.join(ROOT, 'test/fixtures/classic-replay.json');
export const GAMES = 12;
export const MAX_TICKS = 20 * 320;

export function loadClassic() {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cards.json'), 'utf8'));
  const rules = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/rules.json'), 'utf8'));
  return { db: createDb(raw, { level: rules.cardLevel }), rules };
}

/** Prüfsumme eines Ticks: gemeinsamer Snapshot + Zustand beider Spieler. */
export function tickDigest(m) {
  const h = crypto.createHash('sha1');
  h.update(JSON.stringify(m.snapshotCommon()));
  h.update(JSON.stringify(m.meState(0)));
  h.update(JSON.stringify(m.meState(1)));
  return h.digest('hex').slice(0, 16);
}

/** Bot-Kampf aufzeichnen: Eingaben (Tick, Seite, Aktion) und Prüfsummen-Kette. */
export function record(db, rules, g, makeMatch = (o) => new Match(o)) {
  const rng = mulberry32(5000 + g);
  const decks = [randomDeck(db, rng), randomDeck(db, rng)];
  const seed = 900 + g;
  const m = makeMatch({ db, rules, decks, seed });
  m.started = true;
  const inputs = [];
  // Eingaben der Bots mitschneiden (gleiche Schnittstelle wie Menschen)
  const play = m.play.bind(m);
  const useAbility = m.useAbility.bind(m);
  m.play = (side, slot, card, x, y) => {
    const r = play(side, slot, card, x, y);
    if (r.ok) inputs.push([m.tick, side, 'p', slot, card, x, y]);
    return r;
  };
  m.useAbility = (side) => {
    const r = useAbility(side);
    if (r.ok) inputs.push([m.tick, side, 'a']);
    return r;
  };
  const bots = [new Bot(m, 0, g * 7 + 1), new Bot(m, 1, g * 7 + 2)];
  const chain = crypto.createHash('sha1');
  const checkpoints = [];
  while (!m.result && m.tick < MAX_TICKS) {
    bots[0].update();
    bots[1].update();
    m.step();
    const d = tickDigest(m);
    chain.update(d);
    if (m.tick % 200 === 0) checkpoints.push([m.tick, d]);
    m.flushEvents();
  }
  return { g, seed, decks, inputs, ticks: m.tick, checkpoints, digest: chain.digest('hex'), result: m.result };
}

/** Gespeicherte Eingaben in eine frische Simulation einspielen (ohne Bots). */
export function replay(db, rules, rec, makeMatch = (o) => new Match(o)) {
  const m = makeMatch({ db, rules, decks: rec.decks, seed: rec.seed });
  m.started = true;
  const chain = crypto.createHash('sha1');
  const checkpoints = [];
  let k = 0;
  const errors = [];
  while (!m.result && m.tick < MAX_TICKS) {
    while (k < rec.inputs.length && rec.inputs[k][0] === m.tick) {
      const [, side, kind, slot, card, x, y] = rec.inputs[k++];
      const r = kind === 'p' ? m.play(side, slot, card, x, y) : m.useAbility(side);
      if (!r.ok) errors.push(`Tick ${m.tick}: Eingabe abgelehnt (${r.code})`);
    }
    m.step();
    const d = tickDigest(m);
    chain.update(d);
    if (m.tick % 200 === 0) checkpoints.push([m.tick, d]);
    m.flushEvents();
  }
  return { ticks: m.tick, checkpoints, digest: chain.digest('hex'), result: m.result, errors };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { db, rules } = loadClassic();
  const recs = [];
  for (let g = 0; g < GAMES; g++) recs.push(record(db, rules, g));
  if (process.argv.includes('--write')) {
    fs.writeFileSync(FIXTURE, JSON.stringify({ _info: 'Klassischer Modus vor dem Modus-Umbau. Erzeugt mit tools/modes/classic-replay.mjs --write', games: recs }) + '\n');
    console.log(`geschrieben: ${path.relative(ROOT, FIXTURE)} (${recs.length} Kämpfe, ${recs.reduce((s, r) => s + r.inputs.length, 0)} Eingaben)`);
  } else {
    const old = JSON.parse(fs.readFileSync(FIXTURE, 'utf8')).games;
    let bad = 0;
    for (const r of recs) {
      const o = old.find((x) => x.g === r.g);
      const same = o && o.digest === r.digest && JSON.stringify(o.inputs) === JSON.stringify(r.inputs);
      if (!same) bad++;
      console.log(`Kampf ${r.g}: ${same ? 'identisch' : 'ABWEICHUNG'} · ${r.ticks} Ticks · ${r.inputs.length} Eingaben · ${r.result?.reason}`);
    }
    process.exitCode = bad ? 1 : 0;
  }
}

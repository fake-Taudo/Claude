#!/usr/bin/env node
// Auswertung der Bot-Stufen: Bot gegen Bot im klassischen Modus (und optional weiteren Modi).
// Jede Paarung spielt jedes Deck-Paar zweimal mit vertauschten Seiten, damit weder Deck noch Seite das Ergebnis
// verzerren. Unentschieden zählen halb.
//
//   node tools/modes/bot-eval.mjs [--games=20] [--mode=classic] [--out=docs/bot_eval.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb, randomDeck } from '../../shared/cards.js';
import { createModes, resolveRules } from '../../shared/modes.js';
import { Match } from '../../server/sim/match.js';
import { Bot } from '../../server/bot.js';
import { createDraft } from '../../server/draft.js';
import { draftChoice } from '../../server/botdraft.js';
import { mulberry32 } from '../../server/sim/rng.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function loadAll() {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cards.json'), 'utf8'));
  const rules = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/rules.json'), 'utf8'));
  const modes = createModes(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/modes.json'), 'utf8')));
  return { db: createDb(raw, { level: rules.cardLevel }), rules, modes };
}

/** Ein Bot-Kampf; diffs[i] = Stufe auf Seite i. Draft-Modi draften die Bots selbst. */
export function botMatch({ db, rules, modes }, modeId, diffs, seed, decks = null) {
  const mode = modes.get(modeId);
  const R = resolveRules(rules, mode);
  if (!decks) {
    if (mode.deckSource === 'draft') {
      const d = createDraft(db, mode.draft, { seed });
      const rng = mulberry32(seed * 31);
      while (!d.done) for (const s of d.pending()) d.pick(s, draftChoice(db, d, s, diffs[s], rng) ?? d.offers?.[s]?.[0]) || d.autoPick(s);
      decks = d.decks();
    } else {
      const rng = mulberry32(7000 + seed);
      decks = [randomDeck(db, rng), randomDeck(db, rng)];
    }
  }
  const m = new Match({ db, rules: R, decks, seed });
  m.started = true;
  const bots = diffs.map((d, i) => new Bot(m, i, seed * 13 + i, { difficulty: d, minGap: mode.bot?.minGap?.[d] }));
  while (!m.result && m.tick < 20 * 330) {
    for (const b of bots) b.update();
    m.step();
    m.flushEvents();
  }
  return { result: m.result, decks, ticks: m.tick };
}

/** Paarung A gegen B: Punkte von A (Sieg 1, Unentschieden 0,5). */
export function pairing(ctx, modeId, a, b, games) {
  let score = 0;
  let n = 0;
  const reasons = {};
  for (let g = 0; g < games; g++) {
    const first = botMatch(ctx, modeId, [a, b], 100 + g);
    // klassisch: gleiche Decks mit vertauschten Seiten; Draft-Modi: jeder Bot draftet selbst (Draft-Können zählt mit)
    const draft = ctx.modes.get(modeId).deckSource === 'draft';
    const second = botMatch(ctx, modeId, [b, a], 100 + g, draft ? null : first.decks.slice().reverse());
    for (const [res, sideA] of [[first.result, 0], [second.result, 1]]) {
      n++;
      reasons[res.reason] = (reasons[res.reason] || 0) + 1;
      if (res.winner == null) score += 0.5;
      else if (res.winner === sideA) score += 1;
    }
  }
  return { a, b, games: n, scoreA: score, rateA: Math.round((score / n) * 1000) / 10, reasons };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
  const games = Number(args.games || 20);
  const ctx = loadAll();
  const modesToRun = String(args.mode || 'classic').split(',');
  const out = {};
  for (const modeId of modesToRun) {
    const t0 = Date.now();
    const rows = [pairing(ctx, modeId, 'hard', 'medium', games), pairing(ctx, modeId, 'medium', 'easy', games), pairing(ctx, modeId, 'hard', 'easy', games)];
    out[modeId] = rows;
    for (const r of rows) console.log(`${modeId.padEnd(16)} ${r.a.padEnd(6)} gegen ${r.b.padEnd(6)} ${String(r.rateA).padStart(5)} % (${r.scoreA}/${r.games}) · ${JSON.stringify(r.reasons)}`);
    console.log(`  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  if (args.out) fs.writeFileSync(path.resolve(ROOT, String(args.out)), JSON.stringify(out, null, 1) + '\n');
}

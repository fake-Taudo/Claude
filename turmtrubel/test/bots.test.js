// Bots: jede Stufe in jedem Bot-fähigen Modus spielt fehlerfrei bis zum Ende; Leicht ist schlagbar, Schwer spürbar
// stärker (Bot-gegen-Bot-Auswertung, Decks und Seiten getauscht).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadAll, botMatch, pairing } from '../tools/modes/bot-eval.mjs';
import { Bot } from '../server/bot.js';
import { Match } from '../server/sim/match.js';
import { resolveRules } from '../shared/modes.js';
import { db, rules, DECK } from './helpers.js';

const ctx = loadAll();
const BOT_MODES = ctx.modes.list.filter((m) => m.botsAllowed).map((m) => m.id);

test('Jeder Bot-fähige Modus mit jeder Stufe läuft vollständig durch (ohne Fehler, ohne Hänger)', () => {
  assert.deepEqual(BOT_MODES, ['classic', 'infinite-elixir', 'triple-draft', 'mega-draft']);
  for (const mode of BOT_MODES) {
    for (const diffs of [['easy', 'easy'], ['medium', 'medium'], ['hard', 'hard'], ['easy', 'hard']]) {
      const { result, ticks } = botMatch(ctx, mode, diffs, 7);
      assert.ok(result, `${mode} ${diffs}: Kampf endet`);
      assert.ok(ticks <= 20 * 300 + 1, `${mode} ${diffs}: spätestens nach der Verlängerung`);
      assert.ok(result.stats.every((s) => s.played > 3), `${mode} ${diffs}: beide Bots spielen Karten`);
    }
  }
});

test('2 gegen 2 ist kein Bot-Modus (nur Bot-Übernahme bei Abbruch)', () => {
  assert.equal(ctx.modes.get('2v2').botsAllowed, false);
  assert.equal(ctx.modes.get('2v2').multiplayerOnly, true);
});

test('Unendlich-Elixier: Bots halten ihren Mindestabstand zwischen Aktionen ein', () => {
  const mode = ctx.modes.get('infinite-elixir');
  for (const d of ['easy', 'medium', 'hard']) {
    const m = new Match({ db, rules: resolveRules(rules(), mode), decks: [DECK, DECK], seed: 3 });
    m.started = true;
    const bot = new Bot(m, 1, 9, { difficulty: d, minGap: mode.bot.minGap[d] });
    const times = [];
    const play = m.play.bind(m);
    m.play = (...a) => {
      const r = play(...a);
      if (r.ok) times.push(m.time);
      return r;
    };
    for (let i = 0; i < 20 * 60; i++) {
      bot.update();
      m.step();
    }
    assert.ok(times.length >= 10, `${d}: spielt (${times.length})`);
    for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= mode.bot.minGap[d] - 1e-9, `${d}: Abstand ${times[i] - times[i - 1]}`);
  }
});

test('Bots sehen nur, was ein Spieler sieht (Leicht/Schwer ignorieren unterirdische und getarnte Einheiten)', () => {
  const m = new Match({ db, rules: rules(), decks: [DECK, DECK], seed: 4 });
  m.started = true;
  const bot = new Bot(m, 1, 5, { difficulty: 'hard' });
  const miner = m.addEntity(db.unit('miner'), 0, 9, 10, { deployTime: 0 });
  miner.underT = 2;
  assert.ok(!bot.visibleFoes().includes(miner));
  miner.underT = 0;
  assert.ok(bot.visibleFoes().includes(miner));
});

test('Stärke: Schwer schlägt Mittel, Mittel schlägt Leicht, Schwer schlägt Leicht (klassisch, 24 Kämpfe je Paarung)', () => {
  const hm = pairing(ctx, 'classic', 'hard', 'medium', 12);
  const me = pairing(ctx, 'classic', 'medium', 'easy', 12);
  const he = pairing(ctx, 'classic', 'hard', 'easy', 12);
  console.log(`# Schwer–Mittel ${hm.rateA} % · Mittel–Leicht ${me.rateA} % · Schwer–Leicht ${he.rateA} %`);
  assert.ok(hm.rateA >= 58, `Schwer gegen Mittel ${hm.rateA} %`);
  assert.ok(me.rateA >= 60, `Mittel gegen Leicht ${me.rateA} %`);
  assert.ok(he.rateA >= 65, `Schwer gegen Leicht ${he.rateA} %`);
});

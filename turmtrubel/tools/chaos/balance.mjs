#!/usr/bin/env node
// Balance-Stichprobe für den Modus „Chaos“: Bot gegen Bot (Stufe Mittel gegen Mittel, Zufallsdecks aus dem Pool,
// Auswahlrunden wie im Raum, Bots wählen ihre Perks selbst). Protokolliert Sieger, Karten und Perks und markiert
// Karten/Perks, die auffällig oft zum Sieg führen. Nur Beobachtung, kein Abnahmekriterium.
//
//   node tools/chaos/balance.mjs [--games=20] [--diff=medium] [--out=docs/chaos_balance.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAll, botMatch } from '../modes/bot-eval.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const games = Number(args.games || 20);
const diff = String(args.diff || 'medium');

const ctx = loadAll();
const t0 = Date.now();
const matches = [];
for (let g = 0; g < games; g++) {
  const r = botMatch(ctx, 'chaos', [diff, diff], 500 + g);
  matches.push({
    seed: 500 + g,
    winner: r.result.winner,
    reason: r.result.reason,
    time: r.result.time,
    crowns: r.result.crowns,
    decks: r.decks,
    perks: r.perks.map((list) => list.map((p) => p.perk)),
  });
}
const ms = Date.now() - t0;

// Auswertung: je Karte und je Perk – wie oft im Siegerteam vs. Verliererteam
const cards = new Map();
const perks = new Map();
const bump = (map, k, win) => {
  const e = map.get(k) || { k, games: 0, wins: 0 };
  e.games++;
  if (win) e.wins++;
  map.set(k, e);
};
let draws = 0;
for (const m of matches) {
  if (m.winner == null) {
    draws++;
    continue;
  }
  for (const side of [0, 1]) {
    const win = m.winner === side;
    for (const id of m.decks[side]) bump(cards, id, win);
    for (const id of m.perks[side]) bump(perks, id, win);
  }
}
const rate = (e) => Math.round((e.wins / e.games) * 100);
const notable = (map, minGames) =>
  [...map.values()]
    .filter((e) => e.games >= minGames && (rate(e) >= 75 || rate(e) <= 25))
    .sort((a, b) => rate(b) - rate(a) || b.games - a.games)
    .map((e) => ({ ...e, rate: rate(e) }));
const sideWins = [0, 1].map((s) => matches.filter((m) => m.winner === s).length);
const reasons = {};
for (const m of matches) reasons[m.reason] = (reasons[m.reason] || 0) + 1;
const perkCount = matches.reduce((s, m) => s + m.perks[0].length + m.perks[1].length, 0);
const tiers = { common: 0, rare: 0, epic: 0 };
for (const m of matches) for (const list of m.perks) for (const id of list) tiers[ctx.chaos.perk(id).rarityTier]++;

const summary = {
  games,
  difficulty: diff,
  seconds: Math.round(ms / 100) / 10,
  sideWins,
  draws,
  reasons,
  avgTime: Math.round((matches.reduce((s, m) => s + m.time, 0) / games) * 10) / 10,
  perksPicked: perkCount,
  perksPerMatch: Math.round((perkCount / games) * 10) / 10,
  tiers,
  notableCards: notable(cards, 4),
  notablePerks: notable(perks, 3),
  matches,
};
console.log(`${games} Kämpfe (${diff} gegen ${diff}) in ${summary.seconds} s · Siege blau/rot ${sideWins.join('/')} · Unentschieden ${draws} · Ø ${summary.avgTime} s`);
console.log('Enden:', JSON.stringify(reasons), '· Perks je Kampf', summary.perksPerMatch, '· Stufen', JSON.stringify(tiers));
console.log('Auffällige Karten (≥ 4 Kämpfe, ≥ 75 % oder ≤ 25 % Siege):');
for (const e of summary.notableCards) console.log(`  ${ctx.db.card(e.k).name.padEnd(22)} ${e.wins}/${e.games} (${e.rate} %)`);
console.log('Auffällige Perks (≥ 3 Kämpfe):');
for (const e of summary.notablePerks) console.log(`  ${(ctx.chaos.perk(e.k).name + ' (' + ctx.db.card(ctx.chaos.perk(e.k).cardId).name + ')').padEnd(40)} ${e.wins}/${e.games} (${e.rate} %)`);
if (args.out) fs.writeFileSync(path.resolve(ROOT, String(args.out)), JSON.stringify(summary, null, 1) + '\n');

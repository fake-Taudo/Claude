#!/usr/bin/env node
// Last- und Performance-Test „Unendlich-Elixier“: Zwei Spieler spielen mit ×7-Elixier nur Schwarm-Karten, so schnell
// es die Server-Regeln erlauben (Elixier, Handrotation, Eingabe-Limit). Die Einheitenzahl läuft bis an das Limit
// (rules.maxEntities). Gemessen werden
//   – Server: Dauer eines Simulations-Ticks (Mittel, p99, Maximum) bei voller Arena,
//   – Client: FPS im echten Browser (Desktop CPU 1×, Handy hoch/quer mit 4× gedrosselter CPU) per Wiedergabe der
//     aufgezeichneten Snapshots (gleiches Verfahren wie tools/bench/run.mjs).
//
//   node tools/modes/perf-infinite.mjs [--seconds=20] [--out=docs/modes_perf.json] [--only=desktop-1440x900] [--server-only] [--spend]
// Standard ist der schlimmste Fall: zusätzlich der Schalter elixirInfinite (Elixier wird nie verbraucht), sodass nur
// noch das Eingabe-Limit (2,5 Platzierungen/s pro Spieler) bremst. --spend misst mit normalem ×7-Elixier.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb } from '../../shared/cards.js';
import { createModes, resolveRules } from '../../shared/modes.js';
import { Match } from '../../server/sim/match.js';
import { PROFILES, loadPlaywright, startServer, measure } from '../bench/run.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const SECONDS = Number(args.seconds || 20);
const SWARM = ['skeleton-army', 'minion-horde', 'goblin-gang', 'barbarians', 'bats', 'skeletons', 'goblins', 'spear-goblins'];

export function recordInfinite(seconds = SECONDS, { spend = !!args.spend } = {}) {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cards.json'), 'utf8'));
  const baseRules = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/rules.json'), 'utf8'));
  const modes = createModes(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/modes.json'), 'utf8')));
  const db = createDb(raw, { level: baseRules.cardLevel });
  const mode = modes.get('infinite-elixir');
  const rules = resolveRules(baseRules, spend ? mode : { ...mode, elixir: { ...mode.elixir, infinite: true } });
  const m = new Match({ db, rules, decks: [SWARM, SWARM], seed: 5 });
  m.started = true;
  const spots = [[3.5, 20], [14.5, 20], [9, 21], [6, 23], [12, 23]];
  let k = 0;
  const snaps = [];
  const tickMs = [];
  let maxEntities = 0;
  let plays = 0;
  let rejects = 0;
  const total = Math.round(seconds * 20);
  for (let tick = 0; tick < total; tick++) {
    // jeder Spieler versucht in jedem Tick eine Karte (der Server entscheidet: Elixier, Bereitschaft, Limit)
    for (const side of [0, 1]) {
      const p = m.players[side];
      const slot = p.handReady.findIndex((t, i) => m.time >= t && (m.costOf(side, m.db.card(p.hand[i])) ?? 99) <= p.elixir);
      if (slot < 0) continue;
      const [x, y0] = spots[k++ % spots.length];
      const y = side === 0 ? y0 : 32 - y0;
      const r = m.play(side, slot, p.hand[slot], x, y);
      if (r.ok) plays++;
      else rejects++;
    }
    const t0 = performance.now();
    m.step();
    tickMs.push(performance.now() - t0);
    maxEntities = Math.max(maxEntities, m.entities.length);
    snaps.push(m.snapshot(0));
    m.flushEvents();
  }
  const sorted = tickMs.slice().sort((a, b) => a - b);
  const server = {
    ticks: tickMs.length,
    meanMs: Math.round((tickMs.reduce((a, b) => a + b, 0) / tickMs.length) * 100) / 100,
    p99Ms: Math.round(sorted[Math.floor(sorted.length * 0.99)] * 100) / 100,
    maxMs: Math.round(sorted.at(-1) * 100) / 100,
    budgetMs: 1000 / rules.tickRate,
    maxEntities,
    entityLimit: rules.maxEntities,
    plays,
    rejects,
    elixirInfinite: !!rules.elixir.infinite,
  };
  const init = {
    type: 'matchInit',
    side: 0,
    me: 0,
    teams: [0, 1],
    names: ['Lasttest', 'Schwarm-Bot'],
    types: db.typeList,
    deck: SWARM,
    training: true,
    matchNo: 1,
    mode: { id: 'infinite-elixir', name: 'Unendlich-Elixier' },
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
  return { replay: { init, snaps: JSON.parse(JSON.stringify(snaps)), marks: [], maxEntities }, server };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { replay, server } = recordInfinite();
  console.log(
    `Server: ${server.ticks} Ticks · Ø ${server.meanMs} ms · p99 ${server.p99Ms} ms · max ${server.maxMs} ms (Budget ${server.budgetMs} ms) · Einheiten max ${server.maxEntities}/${server.entityLimit} · ${server.plays} Platzierungen, ${server.rejects} abgelehnt`,
  );
  const result = { date: new Date().toISOString(), server, profiles: {} };
  if (!args['server-only']) {
    const pw = await loadPlaywright();
    const srv = await startServer(ROOT);
    const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--mute-audio', '--enable-precise-memory-info', '--autoplay-policy=no-user-gesture-required'] });
    const only = args.only ? String(args.only).split(',') : null;
    try {
      for (const prof of PROFILES) {
        if (only && !only.includes(prof.name)) continue;
        const r = await measure(browser, srv.url, prof, replay, prof.cpu);
        result.profiles[prof.name] = r;
        console.log(
          `${prof.name.padEnd(17)} CPU ${prof.cpu}× · ${String(r.fps).padStart(3)} fps · p95 ${r.p95ms} ms · schlechtester ${r.worstMs} ms · Long Tasks ${r.longTasks} · Partikel max ${r.peakParticles} · Qualität am Ende ${JSON.stringify(r.autoQuality)} · Wiedergabe ${r.replaySeconds} s (Soll ${SECONDS} s)` +
            (r.errors.length ? ` · Fehler: ${r.errors.join(' | ')}` : ''),
        );
      }
    } finally {
      await browser.close();
      srv.proc.kill();
    }
  }
  if (args.out) fs.writeFileSync(path.resolve(ROOT, String(args.out)), JSON.stringify(result, null, 1) + '\n');
}

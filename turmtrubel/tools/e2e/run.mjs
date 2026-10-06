// Startet einen Server (im Zeitraffer) und lässt zwei Test-Clients je Szenario einen kompletten Kampf spielen.
// Aufruf: npm run e2e   (optional: --scale 8)
import { startServer } from '../../server/index.js';
import { validateDeck } from '../../shared/cards.js';
import { playMatch, loadDb } from './client.mjs';
import { SCENARIOS, GROUPS, CHAMPIONS, HEROES } from './scenarios.mjs';

const argScale = process.argv.indexOf('--scale');
const timeScale = argScale > 0 ? Number(process.argv[argScale + 1]) : 8;

export async function runScenarios({ timeScale: scale = 8, log = () => {} } = {}) {
  const db = loadDb();
  for (const s of SCENARIOS) {
    for (const d of s.decks) {
      const v = validateDeck(db, d);
      if (!v.ok) throw new Error(`${s.name}: ungültiges Deck ${d.join(',')}: ${v.errors.join(', ')}`);
    }
  }
  const srv = await startServer({ port: 0, host: '127.0.0.1', quiet: true, timeScale: scale });
  try {
    const t0 = Date.now();
    const results = await Promise.all(SCENARIOS.map((s, i) => playMatch({ port: srv.port, decks: s.decks, seed: i + 1 }).then((r) => ({ ...r, name: s.name }))));
    log(`Kämpfe fertig nach ${((Date.now() - t0) / 1000).toFixed(1)} s (Zeitraffer ×${scale})`);
    const played = new Set();
    const evo = new Set();
    const abilities = new Set();
    for (const r of results) {
      for (const side of r.sides) {
        Object.keys(side.played).forEach((id) => played.add(id));
        side.evo.forEach((id) => evo.add(id));
        side.abilities.forEach((id) => abilities.add(id));
      }
    }
    const groups = Object.entries(GROUPS).map(([g, ids]) => ({ group: g, hit: ids.filter((id) => played.has(id)) }));
    return {
      results,
      played,
      evo,
      abilities,
      groups,
      champion: CHAMPIONS.filter((id) => abilities.has(id)),
      hero: HEROES.filter((id) => abilities.has(id)),
    };
  } finally {
    await srv.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await runScenarios({ timeScale, log: console.log });
  for (const m of r.results) {
    const [a, b] = m.sides;
    console.log(`\n${m.name}: ${m.result.reasonText} – Kronen ${m.result.crowns.join(':')} nach ${Math.round(m.result.time)} s Spielzeit`);
    for (const s of [a, b]) {
      console.log(`  ${s.name}: ${Object.entries(s.played).map(([id, n]) => `${id}×${n}`).join(', ')}`);
      console.log(`    Evo: ${s.evo.join(', ') || '–'} · Fähigkeit: ${s.abilities.join(', ') || '–'} · Abgelehnt: ${JSON.stringify(s.rejects)}`);
    }
  }
  console.log('\nMechanik-Gruppen:');
  for (const g of r.groups) console.log(`  ${g.hit.length ? '✓' : '✗'} ${g.group}: ${g.hit.join(', ') || 'nicht gespielt'}`);
  console.log(`Champion-Fähigkeit: ${r.champion.join(', ') || '✗'} · Helden-Fähigkeit: ${r.hero.join(', ') || '✗'} · Evos: ${[...r.evo].join(', ') || '✗'}`);
}

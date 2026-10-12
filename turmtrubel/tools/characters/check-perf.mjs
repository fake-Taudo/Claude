// Performance-Teil des Prüfskripts: 60 Einheiten aus 60 verschiedenen Figuren plus Zauber, als Snapshot-Folge im
// echten Client abgespielt (Messung wie tools/bench/run.mjs). Optional derselbe Lauf mit einem älteren Stand.
//
//   node tools/characters/check-perf.mjs [--before <Ordner mit altem Stand>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { recordScene } from '../bench/replay.mjs';
import { loadPlaywright, startServer, measure, PROFILES } from '../bench/run.mjs';
import { CHECK } from './system.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SPELLS = [
  [3.4, 0, 'fireball', 9, 14],
  [4.1, 1, 'arrows', 9, 18],
  [4.8, 0, 'zap', 5, 15],
  [5.5, 1, 'poison', 13, 17],
  [6.3, 0, 'freeze', 9, 13],
  [7.0, 1, 'lightning', 6, 19],
  [7.8, 1, 'tornado', 12, 18],
  [8.6, 0, 'rage', 9, 18],
  [9.4, 0, 'earthquake', 4, 12],
  [10.2, 1, 'the-log', 9, 20],
  [11.0, 0, 'goblin-curse', 13, 13],
  [11.8, 1, 'rocket', 9, 22],
];

/** Szene aufnehmen: 60 Einheiten (gleichmäßig über alle Truppen mit Figur verteilt) in drei Wellen, 12 Zauber. */
export function perfScene() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'client/assets/characters/manifest.json'), 'utf8'));
  const n = CHECK.perf.units;
  const info = { units: 0, figures: 0, spells: SPELLS.length };
  const rep = recordScene(
    ({ at, play, spawn, db }) => {
      const pool = [];
      for (const c of db.cards) {
        if (c.type !== 'troop') continue;
        for (const g of c.forms ? c.forms : db.groupsOf(c)) if (manifest.types[g.unit] && !pool.includes(g.unit)) pool.push(g.unit);
      }
      const pick = Array.from({ length: n }, (_, i) => pool[Math.floor((i * pool.length) / n)]);
      info.figures = new Set(pick.map((u) => manifest.types[u].figure)).size;
      for (let w = 0; w < 3; w++) {
        at(0.3 + w * 1.4, 'welle', () => {
          for (let k = 0; k < n / 3; k++) {
            const side = k % 2;
            const u = pick[w * (n / 3) + k];
            const x = 2 + (Math.floor(k / 2) % 10) * 1.55;
            spawn(side, u, x, side ? 12.5 - w * 1.5 : 19.5 + w * 1.5);
            info.units++;
          }
        });
      }
      for (const [t, side, id, x, y] of SPELLS) at(t, id, () => play(side, id, x, y));
    },
    { seconds: CHECK.perf.seconds },
  );
  return { rep, info };
}

/** Misst Desktop (CPU 1×) und Handy (CPU gedrosselt) für den aktuellen und optional einen älteren Stand. */
export async function measurePerf({ before = null } = {}) {
  const { rep, info } = perfScene();
  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--mute-audio', '--enable-precise-memory-info', '--autoplay-policy=no-user-gesture-required'] });
  const profs = [PROFILES.find((p) => p.name === 'desktop-1440x900'), { ...PROFILES.find((p) => p.name === 'phone-390x844'), cpu: CHECK.perf.cpu }];
  const runOn = async (root, stress) => {
    const server = await startServer(root);
    try {
      const out = { ...info, maxEntities: rep.maxEntities, profiles: {} };
      for (const p of profs) {
        const r = await measure(browser, server.url, p, rep, p.cpu);
        r.cpu = p.cpu;
        out.profiles[p.name] = r;
        console.log(`  ${path.basename(root)} ${p.name} CPU ${p.cpu}×: ${r.fps} FPS · p95 ${r.p95ms} ms · schlechtester ${r.worstMs} ms · Long Tasks ${r.longTasks} · ${JSON.stringify(r.autoQuality)}`);
      }
      // Lasttest der automatischen Qualität: stärker gedrosselt, Stufen müssen sinken
      if (stress) {
        const p = { ...profs[1], cpu: CHECK.perf.cpu * 2 };
        const r = await measure(browser, server.url, p, rep, p.cpu);
        out.autoDown = { cpu: p.cpu, fps: r.fps, ...r.autoQuality };
        console.log(`  Lasttest CPU ${p.cpu}×: ${r.fps} FPS · ${JSON.stringify(r.autoQuality)}`);
      }
      return out;
    } finally {
      server.proc.kill();
    }
  };
  try {
    const res = { scene: { ...info, maxEntities: rep.maxEntities } };
    if (before) res.before = await runOn(before, false);
    res.after = await runOn(ROOT, true);
    return res;
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf('--before');
  const r = await measurePerf({ before: i > 0 ? path.resolve(process.argv[i + 1]) : null });
  console.log(JSON.stringify(r.scene));
}

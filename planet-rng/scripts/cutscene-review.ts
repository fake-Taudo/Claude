// Writes docs/cutscenes/cutscene-review.md: the checklist of every cutscene, derived from the
// definitions (so it cannot drift), plus the notes from looking at the contact sheets.
// Usage: npx tsx scripts/cutscene-review.ts

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AURA_BY_ID } from '../src/config';
import { CUTSCENE, CUTSCENES, flashEvents, maxFlashRate, type CutsceneDef, type Track } from '../src/config/cutscenes';

/** What the contact sheets show (docs/cutscenes/cutscene-<id>.png). */
const NOTES: Record<string, string> = {
  singularitaet: 'Spiralsog mit Linse um ein schwarzes Loch, Kollaps auf einen Punkt, 0,5 s Schwarz, Explosion. Ende stark.',
  akkretion: 'Kreis-Stern mit Glutpartikeln, die hineinspiralen; Ringe werden eingesogen, der Stern „schluckt“.',
  blutmond: 'Roter Mond steigt durch fallende Tropfen, Finsternis legt sich über ihn, Ränder bluten (Randglühen statt Weiß).',
  seraph: 'Federn und Goldregen, Strahlen sammeln sich zur Lichtsäule. Hellstes T1-Ende, ohne Vollbildblitz.',
  zeitriss: 'Pixel-Glitches, Sanduhr-Puls, das Bild wird schräg zerschnitten und verrutscht.',
  ewigkeit: 'Lemniskate zeichnet sich im Spektrum, Stillstand in Grau, dann Spektrum-Blüte.',
  chronosphaere: 'Uhr mit immer schnelleren Zeigern und Ticken, Stopp um Mitternacht, Gong.',
  ereignishorizont: 'Schwarzes Loch von der Kante, Lichtströme fallen hinein, Dunkelheit, dann violette Ränder.',
  quasar: 'Zwei Jets wachsen bis an die Bildränder, Flare über die volle Höhe, lange Weißsättigung.',
  supernova: 'Roter Nebel, Herzschlag-Pulse, Zähler „Kernstabilität“, grauer Stillstand, Ausbruch.',
  andromeda: 'Geneigte Spiralgalaxie, eine zweite fliegt heran, Kollision mit Ringen.',
  magnetar: 'Kreis-Stern mit Feldlinien, Funken auf Umlaufbahnen, Blitzsturm mit Wackeln, Ränder blau/pink.',
  multiversum: 'Kinobalken, Schnitte zwischen Kugel-Universen werden schneller, drei Kugeln verschmelzen.',
  kosmischesnetz: 'Netz wächst Knoten für Knoten, Impulse rasen, wird zu einem Faden gespannt, der reißt.',
  urknall: 'Countdown im Dunkeln, Herzschlag-Kern, Kollaps, Stille, das ganze Bild zerspringt in Glutscherben.',
  ursuppe: 'Zellteilung mit Zähler, Verschmelzung, Blitz als Lebensfunke.',
  entropie: 'Gitter zerfällt zu Staub, Farbe weicht, Kollaps, dann stille Wiederkehr.',
  waermetod: 'Sterne verlöschen, Temperatur fällt, letzte Glut in Dunkelheit und Stille, warmes Aufblühen.',
  paradoxon: 'Orange/Cyan-Hälften, Wahr/Falsch im Beat mit Inversion, Schnitt: Farbe und Zeit drehen sich.',
  moebius: '3D-Möbiusband mit Läufern, das ganze Bild stülpt sich auf die andere Seite.',
  omniversum: 'Reprise aller Motive im Beat, Spektral-Mandala mit Universen-Zähler, Kollaps, Stille, Schockwelle.',
  schoepfung: 'Lichtpunkt, graue Welt entsteht Schnitt für Schnitt, Farbe flutet von der Mitte, Sonnenaufgang.',
  nullpunkt: 'Beginnt wie Singularität, Schnitt auf Weiß, schwarze Null, Schwarz-Weiß im Beat, Lichtstrich.',
  archetyp: 'Polygone gewinnen im Beat Ecken bis zum Kreis, rasten mit Strahlenkranz zur Urform ein, Kristall.',
  aeon: 'Zeitringe durch die Zeitalter, Jahre-Zähler, Rücklauf durch dieselben Zeitalter bis zum Ursprung.',
  weltenkern: 'Reise nach innen in Kinobalken, Tiefen-Zähler, Herz im Takt, Kern öffnet sich zur Lichtblüte.',
};

const has = (def: CutsceneDef, ...blocks: Track['block'][]) => def.tracks.some((t) => blocks.includes(t.block));
/** German decimal comma. */
const de = (n: number | string) => String(n).replace('.', ',');

function ramp(def: CutsceneDef): string {
  const out: string[] = [];
  for (const t of def.tracks) {
    if (t.block === 'Counter') out.push(`Zähler ${t.params.label ?? ''}`.trim());
    if (t.block === 'Ticker') out.push('Ticken');
    if (t.block === 'SceneCut' && t.params.scenes.length > 3) out.push('Schnitte');
    if (t.block === 'BeatInvert') out.push('Inversion im Beat');
    if (t.block === 'Rays') out.push('Strahlen');
    if (t.block === 'ThemeParticles' && Array.isArray(t.params.speed)) out.push('Partikeltempo');
    if (t.block === 'CoreMotif' && (t.params.rate !== undefined || t.params.spin)) out.push('Motivtempo');
  }
  return [...new Set(out)].join(', ') || '–';
}

const rows = CUTSCENES.map((def) => {
  const silence = (def.audio.silence ?? []).find(([, b]) => Math.abs(b - def.signature.at) <= 0.05);
  const flashes = maxFlashRate(flashEvents(def)).count;
  const atmosphere = [has(def, 'FogLayers') && 'Nebel', has(def, 'ThemeParticles') && 'Partikel', has(def, 'SceneCut') && 'Szenen', (def.audio.wind ?? 0) > 0 && 'Wind'].filter(Boolean).join(', ');
  return [
    `**${AURA_BY_ID[def.auraId]?.name ?? def.id}**`,
    `T${def.tier}`,
    `${de(def.duration)} s`,
    def.extends ? `wie ${def.extends.id}` : 'Schwarz 0,4 s + Jingle',
    atmosphere || '–',
    ramp(def),
    `${def.signature.name} (${de(def.signature.at)} s)`,
    silence ? `${de((silence[1] - silence[0]).toFixed(2))} s` : '–',
    def.audio.sting ?? '–',
    { whiteout: 'Weißblende', edgeglow: 'Randglühen', cut: 'Schnitt' }[def.reveal.style],
    def.echo ? `Stufe ${def.echo.strength}, ${def.echo.mode}` : '–',
    `${flashes}/s`,
    def.tier === 3 ? 'immer' : 'Einstellung',
    'ja',
  ];
});

const header = ['Aura', 'Stufe', 'Dauer', 'Entzug', 'Atmosphäre', 'Aufbau mit Rampe', 'Bruch', 'Stille davor', 'Impact', 'Enthüllung', 'Nachhall', 'Flash-Limit', 'Skip', 'Logik vorher'];
const table = [`| ${header.join(' | ')} |`, `|${header.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

const notes = CUTSCENES.map((d) => `- **${AURA_BY_ID[d.auraId]?.name ?? d.id}** ([Bogen](cutscene-${d.id}.png)): ${NOTES[d.id] ?? ''}`).join('\n');

const md = `# Cutscene-Prüfung

Erzeugt mit \`npx tsx scripts/cutscene-review.ts\` aus den Definitionen in \`src/config/cutscenes\`.
Kontaktbögen (0/10/25/50/75/90/100 % der Dauer): \`docs/cutscenes/cutscene-<id>.png\`, alle zusammen:
[cutscene-contact-sheet.png](cutscene-contact-sheet.png). Kosten pro Bild: [perf.json](perf.json).

## Checkliste

${table}

Flash-Limit: höchstens ${CUTSCENE.flashLimitPerSecond} Blitze, Inversionen oder helle Schnitte in jedem 1-s-Fenster (Unit-Test
\`tests/cutscenes.test.ts\`). „Logik vorher“: Aura, Statistik und Speicherstand sind vor dem Start der Cutscene
geschrieben (Playwright-Smoke-Test). Skip: „Einstellung“ = Schaltfläche/langes Drücken, wenn „Überspringen erlauben“
an ist; T3-Filme sind immer überspringbar, beim erneuten Ansehen genügt Tippen.

## Bewertung der Kontaktbögen

${notes}
`;

writeFileSync(resolve('docs/cutscenes/cutscene-review.md'), md);
console.log(`docs/cutscenes/cutscene-review.md: ${rows.length} Cutscenes`);

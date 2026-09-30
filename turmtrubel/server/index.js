// Turmtrubel-Server: liefert den Client aus und betreibt die WebSocket-Spielserver-Logik.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { createDb } from '../shared/cards.js';
import { C2S, S2C, ERRORS, PROTOCOL_VERSION, sanitizeName } from '../shared/protocol.js';
import { RoomManager } from './rooms.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadData(root = ROOT) {
  const cardsText = fs.readFileSync(path.join(root, 'data/cards.json'), 'utf8');
  const rulesText = fs.readFileSync(path.join(root, 'data/rules.json'), 'utf8');
  const db = createDb(JSON.parse(cardsText));
  const rules = JSON.parse(rulesText);
  const version = crypto.createHash('sha1').update(cardsText).update(rulesText).digest('hex').slice(0, 10);
  return { db, rules, cardsText, rulesText, version };
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

function makeStaticHandler(data) {
  const dirs = {
    '/shared/': path.join(ROOT, 'shared'),
  };
  const clientDir = path.join(ROOT, 'client');
  return (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405).end();
      return;
    }
    let url;
    try {
      url = new URL(req.url, 'http://x');
    } catch {
      res.writeHead(400).end();
      return;
    }
    const p = decodeURIComponent(url.pathname);
    const headers = { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' };
    // Daten immer aus dem Speicher → identisch mit dem, was der Server simuliert
    if (p === '/data/cards.json' || p === '/data/rules.json') {
      res.writeHead(200, { ...headers, 'Content-Type': MIME['.json'], ETag: data.version });
      res.end(p === '/data/cards.json' ? data.cardsText : data.rulesText);
      return;
    }
    if (p === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
      return;
    }
    let base = clientDir;
    let rel = p;
    for (const [prefix, dir] of Object.entries(dirs)) {
      if (p.startsWith(prefix)) {
        base = dir;
        rel = p.slice(prefix.length - 1);
      }
    }
    if (rel === '/' || rel === '') rel = '/index.html';
    const file = path.normalize(path.join(base, rel));
    if (!file.startsWith(base + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
        return;
      }
      res.writeHead(200, { ...headers, 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Content-Length': st.size });
      if (req.method === 'HEAD') res.end();
      else fs.createReadStream(file).pipe(res);
    });
  };
}

/** Token-Bucket pro Verbindung: max. 30 Nachrichten/s dauerhaft, Burst 60. */
function makeLimiter(rate = 30, burst = 60) {
  let tokens = burst;
  let last = Date.now();
  let strikes = 0;
  return () => {
    const now = Date.now();
    tokens = Math.min(burst, tokens + ((now - last) / 1000) * rate);
    last = now;
    if (tokens >= 1) {
      tokens -= 1;
      return 'ok';
    }
    strikes++;
    return strikes > 200 ? 'kick' : 'drop';
  };
}

export function startServer({ port = Number(process.env.PORT) || 3000, host = process.env.HOST || '0.0.0.0', quiet = false } = {}) {
  const data = loadData();
  const mgr = new RoomManager({ db: data.db, rules: data.rules });
  const server = http.createServer(makeStaticHandler(data));
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });

  wss.on('connection', (ws) => {
    let session = null;
    const limit = makeLimiter();
    const sendRaw = (msg, raw) => {
      if (ws.readyState === ws.OPEN) ws.send(raw ? msg : JSON.stringify(msg));
    };
    const error = (code, message) => sendRaw({ type: S2C.ERROR, code, message: message || ERRORS[code] || code });
    const reply = (res, seq) => {
      if (res && res.ok === false) {
        if (seq !== undefined) sendRaw({ type: S2C.REJECT, seq, code: res.code, message: res.message });
        else error(res.code, res.message);
      }
    };

    ws.on('message', (raw, isBinary) => {
      const l = limit();
      if (l === 'kick') {
        ws.close(4008, 'Rate limit');
        return;
      }
      if (l === 'drop' || isBinary) return;
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') return;

      if (msg.type === C2S.PING) {
        sendRaw({ type: S2C.PONG, t: Number(msg.t) || 0, st: Date.now() });
        return;
      }
      if (msg.type === C2S.HELLO) {
        if (session) return;
        const resumed = msg.token ? mgr.resume(msg.token, sendRaw) : null;
        if (resumed) {
          session = resumed;
          sendRaw({ type: S2C.WELCOME, token: session.token, name: session.name, resumed: true, inRoom: !!session.room, dataVersion: data.version, protocol: PROTOCOL_VERSION });
          if (session.room) session.room.sendState(session);
          return;
        }
        const name = sanitizeName(msg.name) || 'Spieler' + Math.floor(Math.random() * 900 + 100);
        session = mgr.createSession(name, sendRaw);
        sendRaw({ type: S2C.WELCOME, token: session.token, name: session.name, resumed: false, inRoom: false, dataVersion: data.version, protocol: PROTOCOL_VERSION });
        return;
      }
      if (!session) {
        error('NO_SESSION');
        return;
      }
      session.lastSeen = Date.now();
      const room = session.room;
      const m = room && room.match;
      switch (msg.type) {
        case C2S.NAME:
          reply(mgr.rename(session, msg.name));
          break;
        case C2S.CREATE:
          reply(mgr.createRoom(session, msg.deck));
          break;
        case C2S.JOIN:
          reply(mgr.joinRoom(session, msg.code, msg.deck));
          break;
        case C2S.TRAINING:
          reply(mgr.createTraining(session, msg.deck));
          break;
        case C2S.LEAVE:
          if (room) room.leave(session, 'leave');
          sendRaw({ type: S2C.CLOSED, reason: 'left' });
          break;
        case C2S.DECK:
          if (!room) error('NOT_IN_ROOM');
          else reply(room.setDeck(session, msg.deck));
          break;
        case C2S.READY:
          if (!room) error('NOT_IN_ROOM');
          else reply(room.setReady(session, !!msg.ready));
          break;
        case C2S.LOADED:
          if (room) room.onLoaded(session);
          break;
        case C2S.PLAY:
          if (!m || room.state !== 'playing') reply({ ok: false, code: 'NOT_RUNNING', message: 'Der Kampf läuft gerade nicht.' }, msg.seq ?? 0);
          else reply(m.play(session.side, msg.slot, msg.card, Number(msg.x), Number(msg.y)), msg.seq ?? 0);
          break;
        case C2S.ABILITY:
          if (m && room.state === 'playing') reply(m.useAbility(session.side), msg.seq ?? 0);
          break;
        case C2S.EMOTE:
          if (m && room.state === 'playing') m.emote(session.side, msg.id);
          break;
        case C2S.SURRENDER:
          if (room) room.surrender(session);
          break;
        case C2S.REMATCH:
          if (room) reply(room.requestRematch(session, msg.want !== false));
          break;
        default:
          break;
      }
    });

    ws.on('close', () => {
      if (session) mgr.disconnect(session);
    });
    ws.on('error', () => {});
  });

  // Feste Tick-Schleife mit Drift-Ausgleich
  const stepMs = 1000 / data.rules.tickRate;
  let last = performance.now();
  let acc = 0;
  const loop = setInterval(() => {
    const now = performance.now();
    acc += now - last;
    last = now;
    let n = 0;
    while (acc >= stepMs && n < 4) {
      mgr.tick();
      acc -= stepMs;
      n++;
    }
    if (n === 4) acc = 0;
  }, stepMs / 2);
  const cleanup = setInterval(() => mgr.cleanup(), 5000);

  // Heartbeat: tote Verbindungen erkennen
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 10000);
  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => (ws.isAlive = true));
  });

  return new Promise((resolve) => {
    server.listen(port, host, () => {
      const addr = server.address();
      if (!quiet) {
        console.log(`\n  Turmtrubel läuft!  →  http://localhost:${addr.port}`);
        console.log(`  Im LAN: http://<deine-IP>:${addr.port}  (${data.db.cards.length} Karten geladen)\n`);
      }
      resolve({
        server,
        wss,
        mgr,
        port: addr.port,
        close: () =>
          new Promise((r) => {
            clearInterval(loop);
            clearInterval(cleanup);
            clearInterval(heartbeat);
            for (const c of wss.clients) c.terminate();
            wss.close();
            server.close(() => r());
          }),
      });
    });
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) startServer();

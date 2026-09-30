// WebSocket-Verbindung mit automatischem Reconnect (30 s) und Ping-Messung.
import { C2S, S2C } from '/shared/protocol.js';

const TOKEN_KEY = 'turmtrubel.token';

export class Net {
  constructor() {
    this.ws = null;
    this.handlers = new Map();
    this.token = sessionStorage.getItem(TOKEN_KEY);
    this.name = null;
    this.connected = false;
    this.welcomed = false;
    this.rtt = null;
    this.lostAt = null;
    this.retryTimer = null;
    this.pingTimer = null;
    this.graceMs = 30000;
  }

  on(type, fn) {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type).push(fn);
  }

  emit(type, data) {
    for (const fn of this.handlers.get(type) || []) fn(data);
  }

  url() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${location.host}/ws`;
  }

  connect(name) {
    if (name) this.name = name;
    clearTimeout(this.retryTimer);
    let ws;
    try {
      ws = new WebSocket(this.url());
    } catch {
      this.scheduleRetry();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      this.connected = true;
      this.send(C2S.HELLO, { name: this.name, token: this.token });
      this.startPing();
    };
    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg.type === S2C.WELCOME) {
        const wasLost = this.lostAt != null;
        this.token = msg.token;
        sessionStorage.setItem(TOKEN_KEY, msg.token);
        this.welcomed = true;
        this.lostAt = null;
        this.emit('status', { state: 'online', resumed: msg.resumed, wasLost });
      } else if (msg.type === S2C.PONG) {
        const rtt = performance.now() - msg.t;
        this.rtt = this.rtt == null ? rtt : this.rtt * 0.7 + rtt * 0.3;
        this.emit('ping', this.rtt);
        return;
      }
      this.emit(msg.type, msg);
    };
    ws.onclose = () => {
      const was = this.connected;
      this.connected = false;
      this.welcomed = false;
      this.stopPing();
      if (this.ws !== ws) return;
      if (this.lostAt == null) this.lostAt = Date.now();
      if (was || this.lostAt) this.emit('status', { state: 'reconnecting', left: this.graceLeft() });
      this.scheduleRetry();
    };
    ws.onerror = () => {};
  }

  graceLeft() {
    return this.lostAt == null ? this.graceMs : Math.max(0, this.graceMs - (Date.now() - this.lostAt));
  }

  scheduleRetry() {
    clearTimeout(this.retryTimer);
    if (this.lostAt != null && this.graceLeft() <= 0) {
      // Nach Ablauf der Gnadenfrist neu anmelden (neue Sitzung)
      this.token = null;
      sessionStorage.removeItem(TOKEN_KEY);
      this.emit('status', { state: 'lost' });
      this.lostAt = null;
      this.retryTimer = setTimeout(() => this.connect(), 2000);
      return;
    }
    this.retryTimer = setTimeout(() => this.connect(), 1000);
  }

  startPing() {
    this.stopPing();
    const ping = () => this.send(C2S.PING, { t: performance.now() });
    ping();
    this.pingTimer = setInterval(ping, 2000);
  }

  stopPing() {
    clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  send(type, data = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify({ type, ...data }));
    return true;
  }
}

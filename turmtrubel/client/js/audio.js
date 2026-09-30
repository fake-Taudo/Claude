// Soundeffekte und Musik – komplett prozedural per Web Audio (keine Audiodateien).
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

const TRACKS = {
  menu: { bpm: 92, root: 60, chords: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], drums: 0.3, lead: 0.6, seed: 3 },
  battle: { bpm: 120, root: 57, chords: [[0, 3, 7], [8, 12, 15], [3, 7, 10], [10, 14, 17]], drums: 1, lead: 0.8, seed: 11 },
  overtime: { bpm: 140, root: 57, chords: [[0, 3, 7], [5, 8, 12], [8, 12, 15], [7, 11, 14]], drums: 1.2, lead: 1, seed: 29 },
  victory: { bpm: 130, root: 60, chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], drums: 0.8, lead: 1, seed: 5, once: true },
};

export class AudioSys {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.last = {};
    this.track = null;
    this.wanted = null;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch {
        return;
      }
      const c = this.ctx;
      this.master = c.createGain();
      this.master.connect(c.destination);
      this.sfxGain = c.createGain();
      this.sfxGain.connect(this.master);
      this.musicGain = c.createGain();
      this.musicGain.connect(this.master);
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -12;
      this.master.disconnect();
      this.master.connect(comp);
      comp.connect(c.destination);
      const len = c.sampleRate;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.apply();
      if (this.wanted) this.music(this.wanted);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  apply() {
    if (!this.ctx) return;
    const s = this.settings;
    const t = this.ctx.currentTime;
    this.sfxGain.gain.setTargetAtTime(s.sfx ? s.sfxVol : 0, t, 0.05);
    this.musicGain.gain.setTargetAtTime(s.music ? s.musicVol * 0.45 : 0, t, 0.1);
  }

  // ───────── Bausteine ─────────
  tone(freq, dur, o = {}) {
    const c = this.ctx;
    const t0 = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + dur);
    const g = c.createGain();
    const v = (o.vol ?? 0.3) * (o.mul ?? 1);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + (o.attack ?? 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = osc;
    if (o.filter) {
      const f = c.createBiquadFilter();
      f.type = o.filter;
      f.frequency.value = o.ff || 1000;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(o.out || this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, o = {}) {
    const c = this.ctx;
    const t0 = c.currentTime + (o.delay || 0);
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.ff || 2000, t0);
    if (o.slide) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.slide), t0 + dur);
    f.Q.value = o.q || 0.8;
    const g = c.createGain();
    const v = (o.vol ?? 0.3) * (o.mul ?? 1);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + (o.attack ?? 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.out || this.sfxGain);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.05);
  }

  sfx(name, vol = 1) {
    if (!this.ctx || !this.settings.sfx) return;
    const now = this.ctx.currentTime;
    if (this.last[name] && now - this.last[name] < 0.045) return;
    this.last[name] = now;
    const m = vol;
    const T = (f, d, o = {}) => this.tone(f, d, { ...o, mul: m });
    const N = (d, o = {}) => this.noise(d, { ...o, mul: m });
    switch (name) {
      case 'click': T(880, 0.07, { type: 'triangle', vol: 0.2 }); break;
      case 'select': T(660, 0.06, { type: 'triangle', vol: 0.18 }); T(990, 0.06, { type: 'triangle', vol: 0.12, delay: 0.03 }); break;
      case 'deploy': T(320, 0.14, { slide: 110, vol: 0.35 }); N(0.08, { ff: 1500, vol: 0.12 }); break;
      case 'cast': T(520, 0.2, { type: 'triangle', slide: 1040, vol: 0.2 }); N(0.2, { filter: 'highpass', ff: 3000, vol: 0.08 }); break;
      case 'swing': N(0.08, { filter: 'bandpass', ff: 1800, slide: 900, q: 1.5, vol: 0.18 }); break;
      case 'hit': N(0.06, { filter: 'bandpass', ff: 2500, q: 2, vol: 0.15 }); T(180, 0.06, { vol: 0.12, slide: 90 }); break;
      case 'hitStone': N(0.09, { filter: 'bandpass', ff: 900, q: 1.5, vol: 0.18 }); break;
      case 'shoot': N(0.07, { filter: 'highpass', ff: 2500, slide: 5000, vol: 0.12 }); break;
      case 'bow': N(0.06, { filter: 'highpass', ff: 3000, vol: 0.1 }); T(420, 0.05, { type: 'triangle', vol: 0.08 }); break;
      case 'cannon': T(110, 0.25, { slide: 45, vol: 0.35 }); N(0.2, { ff: 800, slide: 100, vol: 0.2 }); break;
      case 'boom': T(90, 0.45, { slide: 35, vol: 0.5 }); N(0.5, { ff: 1400, slide: 80, vol: 0.4 }); break;
      case 'bigBoom': T(70, 0.8, { slide: 28, vol: 0.6 }); N(0.9, { ff: 1800, slide: 60, vol: 0.5 }); break;
      case 'zap': T(1400, 0.12, { type: 'sawtooth', slide: 300, vol: 0.12, filter: 'highpass', ff: 600 }); N(0.12, { filter: 'highpass', ff: 4000, vol: 0.12 }); break;
      case 'thunder': N(0.9, { ff: 600, slide: 60, vol: 0.5 }); T(60, 0.6, { slide: 30, vol: 0.4 }); break;
      case 'freeze': [1568, 2093, 2637, 3136].forEach((f, i) => T(f, 0.3, { type: 'triangle', vol: 0.08, delay: i * 0.05 })); N(0.35, { filter: 'highpass', ff: 5000, vol: 0.1 }); break;
      case 'poison': N(0.6, { filter: 'bandpass', ff: 500, q: 3, vol: 0.2 }); T(140, 0.5, { type: 'triangle', slide: 90, vol: 0.12 }); break;
      case 'heal': [660, 880, 1320].forEach((f, i) => T(f, 0.35, { type: 'sine', vol: 0.12, delay: i * 0.07 })); break;
      case 'rage': [220, 277, 330].forEach((f, i) => T(f, 0.2, { type: 'square', vol: 0.07, delay: i * 0.05, filter: 'lowpass', ff: 1200 })); break;
      case 'arrows': for (let i = 0; i < 5; i++) N(0.05, { filter: 'highpass', ff: 3500, vol: 0.08, delay: i * 0.05 }); break;
      case 'barrel': T(200, 0.18, { slide: 80, vol: 0.3 }); N(0.2, { ff: 1200, vol: 0.2 }); break;
      case 'spooky': T(330, 0.8, { type: 'triangle', slide: 220, vol: 0.12 }); T(311, 0.8, { type: 'triangle', slide: 207, vol: 0.1 }); break;
      case 'splat': N(0.2, { ff: 700, slide: 200, vol: 0.25 }); break;
      case 'roll': N(0.8, { ff: 300, vol: 0.25 }); break;
      case 'pop': T(600, 0.08, { slide: 200, vol: 0.12 }); N(0.06, { ff: 3000, vol: 0.06 }); break;
      case 'crumble': N(0.5, { ff: 900, slide: 120, vol: 0.3 }); break;
      case 'towerDown': T(55, 1.2, { slide: 25, vol: 0.6 }); N(1.3, { ff: 1500, slide: 50, vol: 0.55 }); N(0.6, { filter: 'bandpass', ff: 700, q: 1, vol: 0.3, delay: 0.3 }); break;
      case 'king': T(220, 0.18, { type: 'square', vol: 0.12, filter: 'lowpass', ff: 1500 }); T(330, 0.3, { type: 'square', vol: 0.12, delay: 0.15, filter: 'lowpass', ff: 1500 }); break;
      case 'elixir': T(1046, 0.1, { type: 'triangle', vol: 0.1 }); T(1568, 0.12, { type: 'triangle', vol: 0.08, delay: 0.06 }); break;
      case 'double': [523, 659, 784, 1046].forEach((f, i) => T(f, 0.18, { type: 'square', vol: 0.07, delay: i * 0.08, filter: 'lowpass', ff: 2500 })); break;
      case 'overtime': T(98, 1.2, { type: 'sawtooth', vol: 0.15, filter: 'lowpass', ff: 600 }); T(147, 1.2, { type: 'sawtooth', vol: 0.1, filter: 'lowpass', ff: 600 }); break;
      case 'emote': T(880, 0.08, { type: 'triangle', vol: 0.15 }); T(1320, 0.1, { type: 'triangle', vol: 0.12, delay: 0.06 }); break;
      case 'ability': N(0.3, { filter: 'bandpass', ff: 1200, slide: 4000, q: 1, vol: 0.2 }); [784, 1046, 1568].forEach((f, i) => T(f, 0.25, { type: 'triangle', vol: 0.1, delay: 0.1 + i * 0.05 })); break;
      case 'whoosh': N(0.15, { filter: 'bandpass', ff: 800, slide: 3000, q: 1.2, vol: 0.2 }); break;
      case 'thud': T(70, 0.25, { slide: 40, vol: 0.4 }); N(0.15, { ff: 400, vol: 0.2 }); break;
      case 'build': T(300, 0.08, { type: 'square', vol: 0.08, filter: 'lowpass', ff: 1500 }); T(450, 0.08, { type: 'square', vol: 0.08, delay: 0.1, filter: 'lowpass', ff: 1500 }); break;
      case 'error': T(160, 0.14, { type: 'square', vol: 0.1, filter: 'lowpass', ff: 900 }); T(120, 0.16, { type: 'square', vol: 0.1, delay: 0.09, filter: 'lowpass', ff: 900 }); break;
      case 'count': T(660, 0.15, { type: 'triangle', vol: 0.25 }); break;
      case 'go': T(990, 0.35, { type: 'triangle', vol: 0.28 }); T(1320, 0.35, { type: 'triangle', vol: 0.15 }); break;
      case 'win': [523, 659, 784, 1046, 1318].forEach((f, i) => T(f, i === 4 ? 0.7 : 0.2, { type: 'square', vol: 0.12, delay: i * 0.12, filter: 'lowpass', ff: 3000 })); break;
      case 'lose': [392, 370, 349, 294].forEach((f, i) => T(f, i === 3 ? 0.7 : 0.25, { type: 'triangle', vol: 0.15, delay: i * 0.2 })); break;
      case 'draw': [440, 440, 523].forEach((f, i) => T(f, 0.25, { type: 'triangle', vol: 0.15, delay: i * 0.18 })); break;
      case 'crown': T(1318, 0.2, { type: 'triangle', vol: 0.18 }); T(1760, 0.3, { type: 'triangle', vol: 0.14, delay: 0.08 }); break;
      default: break;
    }
  }

  // ───────── Musik ─────────
  music(name) {
    this.wanted = name;
    if (!this.ctx) return;
    if (this.track && this.track.name === name) return;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.track = null;
    if (!name || !TRACKS[name]) return;
    const def = TRACKS[name];
    const rnd = mulberry(def.seed);
    const scale = [0, 3, 5, 7, 10, 12, 15];
    const melody = [];
    for (let i = 0; i < 64; i++) {
      const strong = i % 4 === 0;
      melody.push(rnd() < (strong ? 0.75 : 0.3) ? scale[Math.floor(rnd() * scale.length)] : -1);
    }
    this.track = { name, def, melody, step: 0, next: this.ctx.currentTime + 0.1 };
    this.timer = setInterval(() => this.schedule(), 25);
  }

  schedule() {
    const tr = this.track;
    if (!tr || !this.ctx) return;
    const c = this.ctx;
    const stepDur = 60 / tr.def.bpm / 4;
    while (tr.next < c.currentTime + 0.15) {
      this.playStep(tr, tr.step, tr.next, stepDur);
      tr.next += stepDur;
      tr.step++;
      if (tr.def.once && tr.step >= 64) {
        clearInterval(this.timer);
        this.timer = null;
        this.track = null;
        return;
      }
    }
  }

  playStep(tr, step, t, sd) {
    const c = this.ctx;
    const out = this.musicGain;
    const d = tr.def;
    const bar = Math.floor(step / 16) % d.chords.length;
    const chord = d.chords[bar];
    const s = step % 16;
    const note = (n, dur, type, vol, filt) => {
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.value = midi(n);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let node = osc;
      if (filt) {
        const f = c.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = filt;
        osc.connect(f);
        node = f;
      }
      node.connect(g);
      g.connect(out);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    };
    const drum = (kind, vol) => {
      if (kind === 'kick') {
        const o = c.createOscillator();
        o.frequency.setValueAtTime(140, t);
        o.frequency.exponentialRampToValueAtTime(45, t + 0.15);
        const g = c.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(g);
        g.connect(out);
        o.start(t);
        o.stop(t + 0.25);
      } else {
        const src = c.createBufferSource();
        src.buffer = this.noiseBuf;
        const f = c.createBiquadFilter();
        f.type = kind === 'hat' ? 'highpass' : 'bandpass';
        f.frequency.value = kind === 'hat' ? 7000 : 1800;
        const g = c.createGain();
        const len = kind === 'hat' ? 0.04 : 0.14;
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        src.connect(f);
        f.connect(g);
        g.connect(out);
        src.start(t, Math.random() * 0.5);
        src.stop(t + len + 0.02);
      }
    };
    // Bass
    if (s === 0 || s === 8 || (s === 11 && d.drums >= 1)) note(d.root - 24 + chord[0], sd * 3, 'triangle', 0.35);
    // Akkord-Stabs
    if (s === 4 || s === 12) for (const n of chord) note(d.root - 12 + n, sd * 2, 'square', 0.035, 1400);
    // Melodie
    const m = tr.melody[step % 64];
    if (m >= 0 && d.lead > 0) note(d.root + chord[0] % 12 + m, sd * 1.8, 'triangle', 0.09 * d.lead);
    // Schlagzeug
    if (d.drums > 0) {
      if (s % 2 === 0) drum('hat', 0.04 * d.drums);
      if (d.drums >= 1) {
        if (s === 0 || s === 8 || (d.drums > 1 && s === 10)) drum('kick', 0.5);
        if (s === 4 || s === 12) drum('snare', 0.16);
      }
    }
  }
}

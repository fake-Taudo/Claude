// Kleinere PNGs für große Prüfbögen (Contact Sheet, Team- und 40-px-Bogen): liest das RGBA-PNG aus dem Browser und
// schreibt ein deckendes RGB-PNG mit adaptiver Zeilenfilterung, wahlweise mit 6 Bit pro Kanal (Abweichung höchstens
// ±2 Farbstufen, sichtbar nicht zu unterscheiden, etwa halbe Dateigröße). Eine Palette mit 256 Farben verschob
// Hauttöne und Teamfarben sichtbar und wird deshalb nicht benutzt.
import zlib from 'node:zlib';

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** RGBA-PNG (8 Bit, ohne Interlace, wie es canvas.toDataURL liefert) → { w, h, rgba }. */
export function decodePng(buf) {
  let p = 8;
  let w = 0;
  let h = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw new Error('nur 8-Bit-RGBA ohne Interlace');
    } else if (type === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = w * bpp;
  const rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? rgba[dst + x - bpp] : 0;
      const b = y > 0 ? rgba[dst - stride + x] : 0;
      const c = x >= bpp && y > 0 ? rgba[dst - stride + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const pp = a + b - c;
        const pa = Math.abs(pp - a);
        const pb = Math.abs(pp - b);
        const pc = Math.abs(pp - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      rgba[dst + x] = v & 0xff;
    }
  }
  return { w, h, rgba };
}

/** RGBA-PNG-Puffer → RGB-PNG (deckend) mit adaptiver Zeilenfilterung; bits < 8 vergröbert die Kanäle (weniger Daten). */
export function toPngRgb(buf, bits = 8) {
  const { w, h, rgba } = decodePng(buf);
  const step = 1 << (8 - bits);
  const q = (v) => (step === 1 ? v : Math.min(255, Math.round(v / step) * step));
  const stride = w * 3;
  const cur = Buffer.alloc(stride);
  const prev = Buffer.alloc(stride);
  const out = Buffer.alloc(h * (stride + 1));
  const cand = [0, 1, 2, 3, 4].map(() => Buffer.alloc(stride));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      cur[x * 3] = q(rgba[i]);
      cur[x * 3 + 1] = q(rgba[i + 1]);
      cur[x * 3 + 2] = q(rgba[i + 2]);
    }
    // Filter je Zeile: kleinste Summe der Beträge gewinnt
    let best = 0;
    let bestSum = Infinity;
    for (let f = 0; f < 5; f++) {
      const o = cand[f];
      let sum = 0;
      for (let x = 0; x < stride; x++) {
        const a = x >= 3 ? cur[x - 3] : 0;
        const b = y > 0 ? prev[x] : 0;
        const c = x >= 3 && y > 0 ? prev[x - 3] : 0;
        let p;
        if (f === 0) p = 0;
        else if (f === 1) p = a;
        else if (f === 2) p = b;
        else if (f === 3) p = (a + b) >> 1;
        else {
          const pp = a + b - c;
          const pa = Math.abs(pp - a);
          const pb = Math.abs(pp - b);
          const pc = Math.abs(pp - c);
          p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        }
        const v = (cur[x] - p) & 0xff;
        o[x] = v;
        sum += v < 128 ? v : 256 - v;
      }
      if (sum < bestSum) {
        bestSum = sum;
        best = f;
      }
    }
    out[y * (stride + 1)] = best;
    cand[best].copy(out, y * (stride + 1) + 1);
    cur.copy(prev);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(out, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

import { Painter } from './painter.js';
import { hex, type ColorInput } from './color.js';
import { mulberry32 } from './rng.js';

export interface RotateImageOptions {
  /** Varsayılan true; false ise kaynak boyutlarında merkezden kırpar. */
  expand?: boolean;
}

/** Merkezden saat yönünde, ters eşlemeli en yakın komşu; kaynak değişmez. */
export function rotateImage(src: Painter, degrees: number, opts: RotateImageOptions = {}): Painter {
  if (!Number.isFinite(degrees)) throw new RangeError('rotateImage: açı sonlu olmalı');
  const angle = ((degrees % 360) + 360) % 360;
  const expand = opts.expand !== false;
  if (angle === 0) { const out = new Painter(src.w, src.h); out.data.set(src.data); return out; }
  const quarter = angle / 90;
  if (Number.isInteger(quarter)) {
    const turn = quarter;
    const w = expand && turn % 2 ? src.h : src.w, h = expand && turn % 2 ? src.w : src.h;
    const out = new Painter(w, h);
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      let dx: number, dy: number;
      if (turn === 1) { dx = src.h - 1 - y; dy = x; }
      else if (turn === 2) { dx = src.w - 1 - x; dy = src.h - 1 - y; }
      else { dx = y; dy = src.w - 1 - x; }
      if (!expand) { dx = Math.floor((dx + (w - (turn % 2 ? src.h : src.w)) / 2)); dy = Math.floor((dy + (h - (turn % 2 ? src.w : src.h)) / 2)); }
      if (dx >= 0 && dy >= 0 && dx < w && dy < h) out.data.set(src.data.subarray((y * src.w + x) * 4, (y * src.w + x) * 4 + 4), (dy * w + dx) * 4);
    }
    return out;
  }
  const rad = angle * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad);
  const w = expand ? Math.ceil(Math.abs(src.w * c) + Math.abs(src.h * s)) : src.w;
  const h = expand ? Math.ceil(Math.abs(src.w * s) + Math.abs(src.h * c)) : src.h;
  const out = new Painter(w, h), scx = (src.w - 1) / 2, scy = (src.h - 1) / 2, ocx = (w - 1) / 2, ocy = (h - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - ocx, dy = y - ocy, sx = Math.round(c * dx + s * dy + scx), sy = Math.round(-s * dx + c * dy + scy);
    if (sx >= 0 && sy >= 0 && sx < src.w && sy < src.h) out.data.set(src.data.subarray((sy * src.w + sx) * 4, (sy * src.w + sx) * 4 + 4), (y * w + x) * 4);
  }
  return out;
}

/** Alan örtüşmeleriyle alfa ağırlıklı küçültme; kaynak değişmez. */
export function resizeArea(src: Painter, width: number, height = Math.max(1, Math.round(src.h * width / src.w))): Painter {
  if (![width, height].every(n => Number.isInteger(n) && n > 0) || width > src.w || height > src.h)
    throw new RangeError('resizeArea: hedef pozitif tam sayı olmalı ve kaynaktan büyük olmamalı');
  const out = new Painter(width, height), sx = src.w / width, sy = src.h / height;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const left = x * sx, right = (x + 1) * sx, top = y * sy, bottom = (y + 1) * sy;
    let a = 0, r = 0, g = 0, b = 0;
    for (let yy = Math.floor(top); yy < Math.ceil(bottom); yy++) for (let xx = Math.floor(left); xx < Math.ceil(right); xx++) {
      if (xx >= src.w || yy >= src.h) continue;
      const weight = (Math.min(right, xx + 1) - Math.max(left, xx)) * (Math.min(bottom, yy + 1) - Math.max(top, yy));
      const i = (yy * src.w + xx) * 4, aw = src.data[i + 3] * weight;
      a += aw; r += src.data[i] * aw; g += src.data[i + 1] * aw; b += src.data[i + 2] * aw;
    }
    const i = (y * width + x) * 4;
    if (a > 0) out.data.set([Math.round(r / a), Math.round(g / a), Math.round(b / a), Math.round(a / (sx * sy))], i);
  }
  return out;
}

export interface ChromaKeyOptions {
  key?: ColorInput;
  dominance?: number;
  high?: number;
  low?: number;
  edgeDominance?: number;
  spillPrimary?: number;
  spillSecondary?: number;
  passes?: number;
}

/** Yerinde anahtar/kenar temizliği. Varsayılanlar Veyra karma macenta eşikleridir. */
export function chromaKey(p: Painter, opts: ChromaKeyOptions = {}): void {
  const key = hex(opts.key ?? '#ff00ff');
  // RGB/CMY anahtarları: güçlü kanallar ile zayıf kanalların farkı.
  const strong = [0, 1, 2].filter(c => key[c] >= 128);
  const weak = [0, 1, 2].filter(c => key[c] < 128);
  if (!strong.length || !weak.length) throw new RangeError('chromaKey: anahtar RGB/CMY tonu olmalı (güçlü ve zayıf kanal gerekli)');
  const signal = (i: number): number => Math.min(...strong.map(c => p.data[i + c]));
  const base = (i: number): number => Math.max(...weak.map(c => p.data[i + c]));
  const { dominance = 60, high = 140, low = 120, edgeDominance = 25,
    spillPrimary = 40, spillSecondary = 60, passes = 2 } = opts;
  if (![dominance, high, low, edgeDominance, spillPrimary, spillSecondary].every(Number.isFinite)
    || !Number.isInteger(passes) || passes < 0) throw new RangeError('chromaKey: geçersiz eşik veya geçiş sayısı');
  const { data: d, w, h } = p;
  for (let i = 0; i < d.length; i += 4) {
    if (signal(i) - base(i) > dominance
      || (signal(i) > high && base(i) < low)) d[i + 3] = 0;
  }
  const op = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
  for (let pass = 0; pass < passes; pass++) {
    const kill: number[] = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!d[i + 3] || (op(x - 1, y) && op(x + 1, y) && op(x, y - 1) && op(x, y + 1))) continue;
      if (signal(i) - base(i) > edgeDominance) kill.push(i);
      else { const b = base(i); strong.forEach((c, j) => { d[i + c] = Math.min(d[i + c], b + (j === 0 ? spillPrimary : spillSecondary)); }); }
    }
    for (const i of kill) d[i + 3] = 0;
  }
}

export interface QuantizeOptions { seed?: number; iterations?: number; maxSamples?: number }
/** Yerinde k-means RGB paleti. Saydam pikseller atlanır, alfa korunur; RNG mulberry32. */
export function quantizeKMeans(p: Painter, colors: number, opts: QuantizeOptions = {}): void {
  const { seed = 7, iterations = 14, maxSamples = 60000 } = opts;
  if (![colors, iterations, maxSamples].every(n => Number.isInteger(n) && n > 0) || !Number.isFinite(seed))
    throw new RangeError('quantizeKMeans: geçersiz renk, seed, iterasyon veya örnek sayısı');
  const d = p.data, px: number[][] = [];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3]) px.push([d[i], d[i + 1], d[i + 2]]);
  if (!px.length) return;
  const rnd = mulberry32(seed), pick = (): number[] => px[Math.floor(rnd() * px.length)].slice();
  let cent = Array.from({ length: Math.min(colors, px.length) }, pick);
  const sample = px.length > maxSamples ? px.filter(() => rnd() < maxSamples / px.length) : px;
  const nearest = (c: ArrayLike<number>): number => {
    let bi = 0, bd = Infinity;
    for (let k = 0; k < cent.length; k++) {
      const e = cent[k], dd = (c[0] - e[0]) ** 2 + (c[1] - e[1]) ** 2 + (c[2] - e[2]) ** 2;
      if (dd < bd) { bd = dd; bi = k; }
    }
    return bi;
  };
  for (let it = 0; it < iterations; it++) {
    const sums = cent.map(() => [0, 0, 0, 0]);
    for (const c of sample) { const s = sums[nearest(c)]; s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; s[3]++; }
    cent = cent.map((_, k) => { const s = sums[k]; return s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : pick(); });
  }
  for (let i = 0; i < d.length; i += 4) if (d[i + 3]) {
    const c = cent[nearest(d.subarray(i, i + 3))];
    for (let j = 0; j < 3; j++) d[i + j] = Math.round(c[j]);
  }
}

/** Yerinde 8-komşu çoğunluk süzgeci; sınırlar/saydamlık korunur. */
export function despeckle(p: Painter, threshold = 6): void {
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > 8) throw new RangeError('despeckle: eşik 1..8 olmalı');
  const { w, h, data: d } = p, out = new Uint8Array(d);
  const color = (i: number): number => (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = (y * w + x) * 4;
    if (!d[i + 3]) continue;
    const own = color(i), counts = new Map<number, number>();
    for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
      if (!xx && !yy) continue;
      const j = ((y + yy) * w + x + xx) * 4;
      if (d[j + 3]) { const c = color(j); counts.set(c, (counts.get(c) ?? 0) + 1); }
    }
    let best = own, count = 0;
    for (const [c, n] of counts) if (n > count) { best = c; count = n; }
    if (best !== own && count >= threshold && !counts.has(own)) out.set([best >> 16, (best >> 8) & 255, best & 255], i);
  }
  d.set(out);
}

// ============================================================
// Node çıktı katmanı — bağımlılıksız PNG encoder (zlib + elle CRC32).
// Sadece Node'da import edilir (tarayıcı bundle'ına girmemeli).
// Painter.data (RGBA Uint8Array) → PNG Buffer.
// ============================================================
import { deflateSync, inflateSync } from "node:zlib";
import { Painter } from "../core/painter.js";

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/** Painter'ın RGBA buffer'ını PNG dosya içeriğine encode eder. */
export function encodePng(painter: Painter): Buffer {
  const { w, h, data } = painter;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    // satır başı filtre baytı 0 (none) — kalanı ham RGBA
    Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(
      raw,
      (stride + 1) * y + 1,
    );
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Nearest-neighbor büyütme: w*n × h*n ham RGBA Uint8Array döner, Painter değil. */
export function upscale(painter: Painter, n: number): Uint8Array {
  const { w, h, data } = painter;
  const out = new Uint8Array(w * n * h * n * 4);
  for (let y = 0; y < h * n; y++) {
    const sy = (y / n) | 0;
    for (let x = 0; x < w * n; x++) {
      const sx = (x / n) | 0;
      const si = (sy * w + sx) * 4;
      const di = (y * w * n + x) * 4;
      out[di] = data[si];
      out[di + 1] = data[si + 1];
      out[di + 2] = data[si + 2];
      out[di + 3] = data[si + 3];
    }
  }
  return out;
}

/** 8-bit, interlace olmayan RGB/RGBA PNG'yi düz RGBA Painter'a çözer. */
export function decodePng(input: Uint8Array): Painter {
  const buf = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  const fail = (message: string): never => { throw new Error(`decodePng: ${message}`); };
  if (!buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) fail('geçersiz PNG imzası');
  let w = 0, h = 0, channels = 0, ended = false, sawIdat = false, transparency: Buffer | undefined;
  const parts: Buffer[] = [];
  for (let at = 8; at < buf.length;) {
    if (at + 12 > buf.length) fail('eksik chunk');
    const length = buf.readUInt32BE(at), end = at + 12 + length;
    if (end > buf.length) fail('eksik chunk verisi');
    const type = buf.toString('ascii', at + 4, at + 8), data = buf.subarray(at + 8, end - 4);
    if (crc32(buf.subarray(at + 4, end - 4)) !== buf.readUInt32BE(end - 4)) fail(`${type} CRC uyuşmuyor`);
    if (at === 8 && type !== 'IHDR') fail('ilk chunk IHDR olmalı');
    if (type === 'IHDR') {
      if (w || length !== 13) fail('geçersiz IHDR');
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      if (!w || !h || w > 0x7fffffff || h > 0x7fffffff) fail('geçersiz boyut');
      if (data[8] !== 8 || ![2, 6].includes(data[9])) fail('yalnız 8-bit RGB (2) / RGBA (6) desteklenir');
      if (data[10] || data[11] || data[12]) fail('desteklenmeyen sıkıştırma, filtre yöntemi veya interlace');
      channels = data[9] === 2 ? 3 : 4;
    } else if (type === 'IDAT') { parts.push(data); sawIdat = true; }
    else if (type === 'tRNS') {
      if (channels !== 3 || length !== 6 || sawIdat || transparency) fail('geçersiz tRNS');
      transparency = data;
    } else if (type === 'IEND') { if (length) fail('geçersiz IEND'); ended = true; break; }
    else if (type !== 'PLTE' && (buf[at + 4] & 32) === 0) fail(`desteklenmeyen kritik chunk: ${type}`);
    at = end;
  }
  if (!ended || !parts.length || !w) fail('IHDR, IDAT veya IEND eksik');
  const stride = w * channels, expected = (stride + 1) * h;
  if (!Number.isSafeInteger(expected) || expected > 0x7fffffff || w * h * 4 > 0x7fffffff) fail('görüntü çok büyük');
  let raw: Buffer;
  try { raw = inflateSync(Buffer.concat(parts), { maxOutputLength: expected }); }
  catch { return fail('geçersiz veya fazla büyük zlib verisi'); }
  if (raw.length !== expected) fail('piksel verisi boyutu uyuşmuyor');
  const out = new Painter(w, h), decoded = new Uint8Array(stride * h);
  const paeth = (a: number, b: number, c: number): number => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    if (filter > 4) fail(`desteklenmeyen satır filtresi: ${filter}`);
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x, a = x >= channels ? decoded[i - channels] : 0;
      const b = y ? decoded[i - stride] : 0, c = y && x >= channels ? decoded[i - stride - channels] : 0;
      const predictor = filter === 0 ? 0 : filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : paeth(a, b, c);
      decoded[i] = (raw[y * (stride + 1) + 1 + x] + predictor) & 255;
    }
    for (let x = 0; x < w; x++) {
      const i = y * stride + x * channels, o = (y * w + x) * 4;
      out.data.set(decoded.subarray(i, i + 3), o);
      const transparent = transparency && [0, 1, 2].every(c => decoded[i + c] === transparency!.readUInt16BE(c * 2));
      out.data[o + 3] = channels === 4 ? decoded[i + 3] : transparent ? 0 : 255;
    }
  }
  return out;
}

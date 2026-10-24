// ============================================================
// Node çıktı katmanı — bağımlılıksız PNG encoder (zlib + elle CRC32).
// Sadece Node'da import edilir (tarayıcı bundle'ına girmemeli).
// Painter.data (RGBA Uint8Array) → PNG Buffer.
// ============================================================
import { deflateSync } from "node:zlib";
import type { Painter } from "../core/painter.js";

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

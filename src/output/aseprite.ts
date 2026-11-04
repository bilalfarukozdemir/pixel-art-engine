// ============================================================
// Aseprite çıktısı — Painter karelerini .aseprite dosyasına yazar.
// Sadece Node'da import edilir (node:zlib). Biçim:
// https://github.com/aseprite/aseprite/blob/main/docs/ase-file-specs.md
// ============================================================
import { deflateSync } from "node:zlib";
import type { Painter } from "../core/painter.js";

export interface AseLayerFrame {
  name: string;
  painter: Painter;
}

/** Tek katman için `painter`, birden çok katman için `layers` verilir. */
export interface AseFrame {
  painter?: Painter;
  /** Dizideki ilk katman en altta kalır; her karede aynı adlar aynı sırada olmalı. */
  layers?: AseLayerFrame[];
  delayMs?: number;
}

export type AseTagDirection = "forward" | "reverse" | "pingpong" | "pingpong-reverse";

export interface AseTag {
  name: string;
  /** İlk kare, 0'dan başlar. */
  from: number;
  /** Son kare, aralığa dahildir. */
  to: number;
  direction?: AseTagDirection;
  /** 0: belirtilmemiş (Aseprite varsayılanı). */
  repeat?: number;
}

export interface EncodeAsepriteOptions {
  frames: AseFrame[];
  tags?: AseTag[];
  defaultDelayMs?: number;
}

const WORD_MAX = 0xffff;
const TAG_DIRECTIONS: AseTagDirection[] = ["forward", "reverse", "pingpong", "pingpong-reverse"];

function word(value: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(value);
  return b;
}

function str(value: string): Buffer {
  const bytes = Buffer.from(value, "utf8");
  if (bytes.length > WORD_MAX) throw new Error(`encodeAseprite: ad çok uzun: "${value.slice(0, 32)}…"`);
  return Buffer.concat([word(bytes.length), bytes]);
}

function chunk(type: number, data: Buffer): Buffer {
  const head = Buffer.alloc(6);
  head.writeUInt32LE(data.length + 6, 0);
  head.writeUInt16LE(type, 4);
  return Buffer.concat([head, data]);
}

function layerChunk(name: string): Buffer {
  const fixed = Buffer.alloc(16);
  fixed.writeUInt16LE(3, 0); // görünür + düzenlenebilir
  fixed.writeUInt8(255, 12); // opaklık; karışım kipi 0 (normal)
  return chunk(0x2004, Buffer.concat([fixed, str(name)]));
}

/** Boş pikselleri kırparak sıkıştırılmış cel üretir; tamamen boş katman karesi için null. */
function celChunk(layerIndex: number, painter: Painter): Buffer | null {
  const { w, h, data } = painter;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] === 0) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;

  const celW = maxX - minX + 1;
  const celH = maxY - minY + 1;
  const pixels = Buffer.alloc(celW * celH * 4);
  for (let y = 0; y < celH; y++) {
    for (let x = 0; x < celW; x++) {
      const si = ((y + minY) * w + x + minX) * 4;
      if (data[si + 3] === 0) continue; // tam saydam pikselin rengi dosyaya sızmasın
      pixels.set(data.subarray(si, si + 4), (y * celW + x) * 4);
    }
  }

  const fixed = Buffer.alloc(20);
  fixed.writeUInt16LE(layerIndex, 0);
  fixed.writeInt16LE(minX, 2);
  fixed.writeInt16LE(minY, 4);
  fixed.writeUInt8(255, 6); // opaklık
  fixed.writeUInt16LE(2, 7); // sıkıştırılmış görüntü
  fixed.writeUInt16LE(celW, 16);
  fixed.writeUInt16LE(celH, 18);
  return chunk(0x2005, Buffer.concat([fixed, deflateSync(pixels, { level: 9 })]));
}

function tagsChunk(tags: AseTag[]): Buffer {
  const head = Buffer.alloc(10);
  head.writeUInt16LE(tags.length, 0);
  const parts: Buffer[] = [head];
  for (const tag of tags) {
    const fixed = Buffer.alloc(17);
    fixed.writeUInt16LE(tag.from, 0);
    fixed.writeUInt16LE(tag.to, 2);
    fixed.writeUInt8(TAG_DIRECTIONS.indexOf(tag.direction ?? "forward"), 4);
    fixed.writeUInt16LE(tag.repeat ?? 0, 5);
    parts.push(fixed, str(tag.name));
  }
  return chunk(0x2018, Buffer.concat(parts));
}

/** Kullanılan renkleri ilk görülme sırasıyla (en çok 256) toplar; rötuş yaparken renkler paletten seçilebilsin. */
function collectPalette(frames: AseLayerFrame[][]): number[] {
  const seen = new Set<number>();
  for (const layers of frames) {
    for (const { painter } of layers) {
      const { data } = painter;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue;
        seen.add(((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]) >>> 0);
        if (seen.size === 256) return [...seen];
      }
    }
  }
  return [...seen];
}

function paletteChunk(colors: number[]): Buffer {
  const head = Buffer.alloc(20);
  head.writeUInt32LE(colors.length, 0);
  head.writeUInt32LE(0, 4);
  head.writeUInt32LE(colors.length - 1, 8);
  const entries = Buffer.alloc(colors.length * 6);
  colors.forEach((rgb, i) => {
    entries.writeUInt8((rgb >> 16) & 0xff, i * 6 + 2);
    entries.writeUInt8((rgb >> 8) & 0xff, i * 6 + 3);
    entries.writeUInt8(rgb & 0xff, i * 6 + 4);
    entries.writeUInt8(255, i * 6 + 5);
  });
  return chunk(0x2019, Buffer.concat([head, entries]));
}

function frameLayers(frame: AseFrame, index: number): AseLayerFrame[] {
  if (frame.painter && frame.layers) {
    throw new Error(`encodeAseprite: kare ${index} hem painter hem layers veriyor`);
  }
  if (frame.painter) return [{ name: "Layer 1", painter: frame.painter }];
  if (!frame.layers?.length) throw new Error(`encodeAseprite: kare ${index} boş`);
  return frame.layers;
}

/** Painter karelerini RGBA .aseprite dosya içeriğine encode eder. */
export function encodeAseprite(opts: EncodeAsepriteOptions): Buffer {
  const { frames, tags = [], defaultDelayMs = 100 } = opts;
  if (frames.length === 0) throw new Error("encodeAseprite: en az bir kare gerekli");
  if (frames.length > WORD_MAX) throw new Error("encodeAseprite: kare sayısı 65535'i aşamaz");

  const layersByFrame = frames.map(frameLayers);
  const names = layersByFrame[0].map((layer) => layer.name);
  if (new Set(names).size !== names.length) throw new Error("encodeAseprite: katman adları tekrar ediyor");
  if (names.length > WORD_MAX) throw new Error("encodeAseprite: katman sayısı 65535'i aşamaz");

  const { w, h } = layersByFrame[0][0].painter;
  if (w < 1 || h < 1 || w > WORD_MAX || h > WORD_MAX) {
    throw new Error(`encodeAseprite: geçersiz boyut ${w}x${h}`);
  }
  layersByFrame.forEach((layers, frameIndex) => {
    if (layers.length !== names.length || layers.some((layer, i) => layer.name !== names[i])) {
      throw new Error(`encodeAseprite: kare ${frameIndex} katman listesi ilk kareyle aynı değil`);
    }
    for (const { name, painter } of layers) {
      if (painter.w !== w || painter.h !== h) {
        throw new Error(`encodeAseprite: kare ${frameIndex}, "${name}" boyutu ${w}x${h} değil`);
      }
    }
  });

  if (tags.length > WORD_MAX) throw new Error("encodeAseprite: etiket sayısı 65535'i aşamaz");
  for (const tag of tags) {
    const ranged = Number.isInteger(tag.from) && Number.isInteger(tag.to)
      && tag.from >= 0 && tag.from <= tag.to && tag.to < frames.length;
    if (!ranged) throw new Error(`encodeAseprite: "${tag.name}" etiket aralığı geçersiz`);
    const repeat = tag.repeat ?? 0;
    if (!Number.isInteger(repeat) || repeat < 0 || repeat > WORD_MAX) {
      throw new Error(`encodeAseprite: "${tag.name}" tekrar sayısı geçersiz`);
    }
    if (!TAG_DIRECTIONS.includes(tag.direction ?? "forward")) {
      throw new Error(`encodeAseprite: "${tag.name}" yönü geçersiz`);
    }
  }

  const delays = frames.map((frame, i) => {
    const delay = frame.delayMs ?? defaultDelayMs;
    if (!Number.isInteger(delay) || delay < 1 || delay > WORD_MAX) {
      throw new Error(`encodeAseprite: kare ${i} süresi geçersiz: ${delay}`);
    }
    return delay;
  });

  const palette = collectPalette(layersByFrame);
  const frameBuffers = layersByFrame.map((layers, frameIndex) => {
    const chunks: Buffer[] = [];
    if (frameIndex === 0) {
      if (palette.length > 0) chunks.push(paletteChunk(palette));
      for (const name of names) chunks.push(layerChunk(name));
      if (tags.length > 0) chunks.push(tagsChunk(tags));
    }
    layers.forEach(({ painter }, layerIndex) => {
      const cel = celChunk(layerIndex, painter);
      if (cel) chunks.push(cel);
    });
    const body = Buffer.concat(chunks);
    const head = Buffer.alloc(16);
    head.writeUInt32LE(body.length + 16, 0);
    head.writeUInt16LE(0xf1fa, 4);
    head.writeUInt16LE(Math.min(chunks.length, WORD_MAX), 6);
    head.writeUInt16LE(delays[frameIndex], 8);
    head.writeUInt32LE(chunks.length, 12);
    return Buffer.concat([head, body]);
  });

  const header = Buffer.alloc(128);
  const fileSize = 128 + frameBuffers.reduce((sum, frame) => sum + frame.length, 0);
  header.writeUInt32LE(fileSize, 0);
  header.writeUInt16LE(0xa5e0, 4);
  header.writeUInt16LE(frames.length, 6);
  header.writeUInt16LE(w, 8);
  header.writeUInt16LE(h, 10);
  header.writeUInt16LE(32, 12); // RGBA
  header.writeUInt32LE(1, 14); // katman opaklığı geçerli
  header.writeUInt16LE(delays[0], 18); // eski alan; okuyucular karedeki süreyi kullanır
  header.writeUInt16LE(palette.length || 256, 32);
  return Buffer.concat([header, ...frameBuffers]);
}

// ============================================================
// GIF export — Painter kareler dizisini animasyonlu GIF'e encode
// eder. `gifenc` (MIT, bağımsız küçük paket) kullanıyor; bağımlılık
// kararı: çizim çekirdeği sıfır bağımlılık kalır, yan
// özellikler için gerekince npm paketi serbest.
// ============================================================
// gifenc bir CommonJS modülü; Node native ESM loader'ı named export'ları
// güvenilir çıkaramadığı için default import + destructure kullanılıyor.
import gifenc from "gifenc";
import type { Painter } from "../core/painter.js";

const { GIFEncoder, quantize, applyPalette } = gifenc;

export interface GifFrame {
  painter: Painter;
  delayMs?: number;
}

export interface EncodeGifOptions {
  defaultDelayMs?: number;
  maxColors?: number;
}

/** Painter kareler dizisini animasyonlu GIF byte'larına encode eder. */
export function encodeGif(frames: GifFrame[], opts: EncodeGifOptions = {}): Uint8Array {
  if (frames.length === 0) throw new Error("encodeGif: en az bir kare gerekli");
  const maxColors = opts.maxColors ?? 256;
  const gif = GIFEncoder();
  for (const frame of frames) {
    const { w, h, data } = frame.painter;
    const palette = quantize(data, maxColors);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, w, h, {
      palette,
      delay: frame.delayMs ?? opts.defaultDelayMs ?? 100,
    });
  }
  gif.finish();
  return gif.bytes();
}

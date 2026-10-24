// ============================================================
// Tarayıcı çıktı katmanı — Painter'ın RGBA buffer'ını doğrudan
// ImageData ile canvas'a blit eder. Eski Canvas portundaki
// fillRect-per-pixel yaklaşımının yerini
// alır — o yaklaşım alfa harmanlamayı desteklemiyordu, bu ImageData
// yolu Painter.px'in blend sonucunu birebir aktarır.
// ============================================================
import type { Painter } from "../core/painter.js";

/** Painter'ı bir <canvas>'a piksel-hassas (image-rendering: pixelated varsayımıyla) çizer. */
export function blitToCanvas(painter: Painter, ctx: CanvasRenderingContext2D): void {
  const { w, h, data } = painter;
  const imageData = new ImageData(new Uint8ClampedArray(data), w, h);
  ctx.putImageData(imageData, 0, 0);
}

/** Painter boyutunda yeni bir canvas oluşturup üzerine çizer; ölçekli CSS boyutu da ayarlar. */
export function paintToNewCanvas(painter: Painter, cssScale = 1): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = painter.w;
  canvas.height = painter.h;
  canvas.style.width = `${painter.w * cssScale}px`;
  canvas.style.height = `${painter.h * cssScale}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context alınamadı");
  ctx.imageSmoothingEnabled = false;
  blitToCanvas(painter, ctx);
  return canvas;
}

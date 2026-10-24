// ============================================================
// İkon/sprite bitiş araçları — Veyra'nın iconlib.mjs'inden taşındı.
// İlk taşımada (motifs.mjs) atlanmıştı; Veyra çıktılarıyla karşılaştırmada
// fark edildi. Her Veyra portresi/icon'u outline() ile bitiyordu,
// motorda hiç karşılığı yoktu.
// ============================================================
import type { Painter } from "../core/painter.js";
import { hex, type ColorInput } from "../core/color.js";

/**
 * Otomatik dış kontur: şeffaf olup opak komşusu olan her piksele
 * kontur rengi basar. Klasik "1px outline" — sprite her zeminde okunur.
 * Şekil çizimi BİTTİKTEN sonra çağrılır.
 */
export function outline(p: Painter, color: ColorInput): void {
  const C = hex(color);
  const { w, h, data } = p;
  const isOpaque = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    return data[(y * w + x) * 4 + 3] > 60;
  };
  const targets: number[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] > 60) continue; // zaten opak
      if (isOpaque(x - 1, y) || isOpaque(x + 1, y) || isOpaque(x, y - 1) || isOpaque(x, y + 1))
        targets.push(i);
    }
  for (const i of targets) {
    data[i] = C[0];
    data[i + 1] = C[1];
    data[i + 2] = C[2];
    data[i + 3] = 255;
  }
}

/** Tek noktadan parlama: highlight kümesi (sprite'ın "ışık yakalayan" köşesi). cx,cy merkez; c parlak renk. */
export function glint(p: Painter, cx: number, cy: number, c: ColorInput): void {
  p.px(cx, cy, c);
  p.px(cx - 1, cy, c);
  p.px(cx, cy - 1, c);
}

/** Dikey simetri: sol yarıyı sağa aynalar (kalkan, kafa, şişe gibi simetrik sprite'lar). */
export function mirrorX(p: Painter): void {
  const { w, h, data } = p;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w >> 1; x++) {
      const src = (y * w + x) * 4;
      const dst = (y * w + (w - 1 - x)) * 4;
      data[dst] = data[src];
      data[dst + 1] = data[src + 1];
      data[dst + 2] = data[src + 2];
      data[dst + 3] = data[src + 3];
    }
}

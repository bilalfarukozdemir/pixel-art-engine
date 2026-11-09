import type { Painter } from "./painter.js";
import type { ColorInput } from "./color.js";
import { fbm, vnoise } from "./noise.js";

/** Siluet aşındırma: kenar piksellerini gürültüyle yer, bazı yerlere taşıntı ekler. */
export function erode(layer: Painter, amount: number, seed: number, passes = 2): void {
  const { w, h, data } = layer;
  for (let pass = 0; pass < passes; pass++) {
    const op = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] > 0;
    const kill: number[] = [], grow: Array<[number, number]> = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const n = fbm(x * 0.35 + seed, y * 0.35 + pass * 7, 2);
      if (data[i + 3] > 0) {
        if ((!op(x - 1, y) || !op(x + 1, y) || !op(x, y - 1)) && n < amount) kill.push(i);
      } else if (op(x, y + 1) && n > 1 - amount * 0.45) grow.push([i, ((y + 1) * w + x) * 4]);
    }
    for (const i of kill) data[i + 3] = 0;
    for (const [i, j] of grow) { data[i] = data[j]; data[i + 1] = data[j + 1]; data[i + 2] = data[j + 2]; data[i + 3] = data[j + 3]; }
  }
}
/** Eğik, düzensiz kenarlı kule gövdesi (dikdörtgen yerine). */
export function roughTower(p: Painter, x: number, base: number, w: number, h: number, lean: number, c: ColorInput, seed: number): void {
  for (let y = 0; y < h; y++) {
    const t = y / h, off = lean * t;
    const l = Math.round(x + off + (vnoise(seed, y * 0.4) - 0.5) * 1.6 + t * 0.6);
    const r = Math.round(x + w + off - (vnoise(seed + 9, y * 0.4) - 0.5) * 1.6 - t * 0.8);
    p.hline(l, base - y, Math.max(1, r - l), c);
  }
}

/** Elle çekilmiş çizgi: dik yönde gürültüyle salınır, uçlara doğru söner. */
export function stroke(p: Painter, x0: number, y0: number, x1: number, y1: number, c: ColorInput, amp: number, seed: number): void {
  const L = Math.max(1, Math.hypot(x1 - x0, y1 - y0)), nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
  let lx = Math.round(x0), ly = Math.round(y0);
  for (let i = 1; i <= Math.ceil(L); i++) {
    const t = i / Math.ceil(L), o = (vnoise(seed, t * L * 0.18) - 0.5) * 2 * amp * Math.sin(Math.PI * t);
    const x = Math.round(x0 + (x1 - x0) * t + nx * o), y = Math.round(y0 + (y1 - y0) * t + ny * o);
    p.line(lx, ly, x, y, c); lx = x; ly = y;
  }
}
/** Çokgen kenarlarını böl ve gürültüyle oynat (düz kenar kalmasın). */
export function wobblePoly(pts: ReadonlyArray<readonly [number, number]>, amp: number, seed: number, step = 3): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
      out.push([x + (vnoise(seed + i, k * 0.7) - 0.5) * 2 * amp, y + (vnoise(seed + i + 50, k * 0.7) - 0.5) * 2 * amp]);
    }
  }
  return out;
}


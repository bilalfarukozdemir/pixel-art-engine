// ============================================================
// FxFrame — bir efekt karesinin iki katmanı:
//   color: keskin pikseller (Painter), alfa harmanlı
//   light: toplanan ışık (RGB, 0..1+), parıltı ve flaş için
// Koordinatlar yereldir: (0,0) efektin çapası (origin), y aşağı.
// composite() ışığı Bayer titreşimli kademelere nicelleyip renge ekler;
// yumuşak gradyan yok, sonuç yine sert pikseldir (antialiasing yok kuralı).
//
// İki katman fikri patch-gg/pixelfx'ten (MIT) esinlenmiştir; kod bizimdir.
// ============================================================
import { Painter } from "../core/painter.js";
import { hex, type ColorInput } from "../core/color.js";

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** (x, y) pikselinin Bayer eşiği, 0..1 aralığında (0.5/16 kaydırmalı). */
export function bayer(x: number, y: number): number {
  return (BAYER4[y & 3][x & 3] + 0.5) / 16;
}

export class FxFrame {
  readonly w: number;
  readonly h: number;
  readonly ox: number;
  readonly oy: number;
  readonly color: Painter;
  /** w*h*3 ışık değeri (r, g, b), 1 = tam parlak. */
  readonly light: Float32Array;

  constructor(w: number, h: number, origin: readonly [number, number]) {
    this.w = w;
    this.h = h;
    this.ox = origin[0];
    this.oy = origin[1];
    this.color = new Painter(w, h);
    this.light = new Float32Array(w * h * 3);
  }

  /** Yerel koordinatta tek piksel. `a` 0..1 opaklık. */
  dot(x: number, y: number, c: ColorInput, a = 1): void {
    if (a <= 0) return;
    const C = hex(c);
    const alpha = Math.round((C[3] ?? 255) * Math.min(1, a));
    this.color.px(Math.floor(this.ox + x), Math.floor(this.oy + y), [C[0], C[1], C[2], alpha]);
  }

  /** Opaklığı Bayer eşiğiyle verir: piksel ya tam çizilir ya hiç (yumuşak kenar yok). */
  ditherDot(x: number, y: number, c: ColorInput, a: number): void {
    const px = Math.floor(this.ox + x), py = Math.floor(this.oy + y);
    if (a >= 1 || (a > 0 && bayer(px, py) < a)) this.color.px(px, py, c);
  }

  rect(x: number, y: number, w: number, h: number, c: ColorInput, a = 1): void {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) this.dot(x + xx, y + yy, c, a);
  }

  /** Bresenham çizgi, yerel koordinatta. */
  line(x0: number, y0: number, x1: number, y1: number, c: ColorInput, a = 1): void {
    let ax = Math.floor(x0), ay = Math.floor(y0);
    const bx = Math.floor(x1), by = Math.floor(y1);
    const dx = Math.abs(bx - ax), dy = -Math.abs(by - ay);
    const sx = ax < bx ? 1 : -1, sy = ay < by ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.dot(ax, ay, c, a);
      if (ax === bx && ay === by) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; ax += sx; }
      if (e2 <= dx) { err += dx; ay += sy; }
    }
  }

  /** Dolu daire; `dither` true ise opaklık Bayer ile verilir. */
  disc(x: number, y: number, r: number, c: ColorInput, a = 1, dither = false): void {
    const R = Math.ceil(r);
    for (let yy = -R; yy <= R; yy++)
      for (let xx = -R; xx <= R; xx++) {
        if (xx * xx + yy * yy > r * r) continue;
        if (dither) this.ditherDot(x + xx, y + yy, c, a);
        else this.dot(x + xx, y + yy, c, a);
      }
  }

  /** Işık ekler: merkezde `strength`, `r` yarıçapında sıfıra iner (karesel düşüş). */
  glow(x: number, y: number, r: number, c: ColorInput, strength = 1): void {
    if (r <= 0 || strength <= 0) return;
    const C = hex(c), cx = this.ox + x, cy = this.oy + y;
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(this.w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(this.h - 1, Math.ceil(cy + r));
    for (let py = y0; py <= y1; py++)
      for (let px = x0; px <= x1; px++) {
        const d = Math.hypot(px + 0.5 - cx, py + 0.5 - cy) / r;
        if (d >= 1) continue;
        const k = strength * (1 - d) * (1 - d), i = (py * this.w + px) * 3;
        this.light[i] += (C[0] / 255) * k;
        this.light[i + 1] += (C[1] / 255) * k;
        this.light[i + 2] += (C[2] / 255) * k;
      }
  }
}

export interface CompositeOptions {
  /** Işığın kaç kademeye nicelleneceği (varsayılan 4). Az kademe = daha belirgin bant. */
  levels?: number;
}

/**
 * Renk katmanına ışığı ekleyip tek Painter döndürür. Işık her kanalda Bayer
 * titreşimiyle `levels` kademeye yuvarlanır. Rengin boş olduğu yerde ışık,
 * en parlak kanalı opaklık olan renk olur (koyu arka planda toplanır gibi görünür).
 */
export function composite(frame: FxFrame, opts: CompositeOptions = {}): Painter {
  const levels = Math.max(1, Math.floor(opts.levels ?? 4));
  const out = new Painter(frame.w, frame.h);
  out.data.set(frame.color.data);
  const d = out.data, L = frame.light;
  for (let y = 0; y < frame.h; y++)
    for (let x = 0; x < frame.w; x++) {
      const li = (y * frame.w + x) * 3, i = (y * frame.w + x) * 4, t = bayer(x, y);
      const q = [0, 1, 2].map((k) => Math.min(levels, Math.floor(Math.min(1, L[li + k]) * levels + t)) / levels);
      const m = Math.max(q[0], q[1], q[2]);
      if (m <= 0) continue;
      if (d[i + 3] === 0) {
        d[i] = Math.round((q[0] / m) * 255);
        d[i + 1] = Math.round((q[1] / m) * 255);
        d[i + 2] = Math.round((q[2] / m) * 255);
        d[i + 3] = Math.round(m * 255);
      } else {
        for (let k = 0; k < 3; k++) d[i + k] = Math.min(255, d[i + k] + Math.round(q[k] * 255));
      }
    }
  return out;
}

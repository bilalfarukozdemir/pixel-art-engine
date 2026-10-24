// ============================================================
// Painter — piksel çizim çekirdeği. Kendi RGBA buffer'ına yazar,
// hiçbir runtime'a (Node/tarayıcı) bağlı değil. Çıktı katmanı
// (src/output/*) bu buffer'ı PNG'ye ya da canvas'a dönüştürür.
//
// Node (Veyra) ve Canvas (tower-defence) versiyonlarının birleşimi:
// Canvas versiyonunda eksik olan alfa harmanlama, vgrad, scatter,
// vignette burada geri geldi.
// ============================================================
import { type ColorInput, type RGBA, hex } from "./color.js";
import type { Rng } from "./rng.js";

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export interface GradientStop {
  t: number;
  color: ColorInput;
}

export interface VGradOptions {
  dither?: boolean;
  /** Continuous RGBA interpolation; overrides dither. Legacy defaults stay unchanged. */
  smooth?: boolean;
}

export class Painter {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = new Uint8Array(w * h * 4);
  }

  /** Tek piksel; alfa < 255 ise mevcut pikselle harmanlar. */
  px(x: number, y: number, c: ColorInput): void {
    const xi = x | 0, yi = y | 0;
    if (xi < 0 || yi < 0 || xi >= this.w || yi >= this.h) return;
    const C = hex(c);
    const a = C[3] ?? 255;
    if (a <= 0) return;
    const i = (yi * this.w + xi) * 4;
    if (a >= 255) {
      this.data[i] = C[0];
      this.data[i + 1] = C[1];
      this.data[i + 2] = C[2];
      this.data[i + 3] = 255;
    } else {
      const t = a / 255;
      this.data[i] = Math.round(C[0] * t + this.data[i] * (1 - t));
      this.data[i + 1] = Math.round(C[1] * t + this.data[i + 1] * (1 - t));
      this.data[i + 2] = Math.round(C[2] * t + this.data[i + 2] * (1 - t));
      this.data[i + 3] = Math.max(this.data[i + 3], a);
    }
  }

  get(x: number, y: number): RGBA {
    const i = ((y | 0) * this.w + (x | 0)) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]];
  }

  fill(c: ColorInput): void {
    this.rect(0, 0, this.w, this.h, c);
  }

  rect(x: number, y: number, w: number, h: number, c: ColorInput): void {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.px(xx, yy, c);
  }

  hline(x: number, y: number, w: number, c: ColorInput): void {
    this.rect(x, y, w, 1, c);
  }

  vline(x: number, y: number, h: number, c: ColorInput): void {
    this.rect(x, y, 1, h, c);
  }

  /** Bresenham çizgisi. */
  line(x0: number, y0: number, x1: number, y1: number, c: ColorInput): void {
    let xa = x0 | 0, ya = y0 | 0;
    const xb = x1 | 0, yb = y1 | 0;
    const dx = Math.abs(xb - xa), dy = -Math.abs(yb - ya);
    const sx = xa < xb ? 1 : -1, sy = ya < yb ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(xa, ya, c);
      if (xa === xb && ya === yb) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; xa += sx; }
      if (e2 <= dx) { err += dx; ya += sy; }
    }
  }

  /** Dolu elips. */
  ellipse(cx: number, cy: number, rx: number, ry: number, c: ColorInput): void {
    for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
      const t = (y - cy) / ry;
      const half = rx * Math.sqrt(Math.max(0, 1 - t * t));
      for (let x = Math.ceil(cx - half); x <= Math.floor(cx + half); x++)
        this.px(x, y, c);
    }
  }

  /** Dolu çokgen (scanline, antialiasing kasıtlı yok). */
  poly(pts: ReadonlyArray<readonly [number, number]>, c: ColorInput): void {
    let minY = Infinity, maxY = -Infinity;
    for (const [, y] of pts) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    minY = Math.max(0, Math.ceil(minY));
    maxY = Math.min(this.h - 1, Math.floor(maxY));
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y))
          xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++)
          this.px(x, y, c);
    }
  }

  /**
   * Köşeleri yuvarlatılmış dolu dikdörtgen. Piksel merkezleri örneklenir;
   * r=0 düz rect ile aynıdır. Mobilya, yastık, yumuşak stil kutuları için.
   */
  roundRect(x: number, y: number, w: number, h: number, r: number, c: ColorInput): void {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    for (let yy = Math.ceil(y - 0.5); yy + 0.5 < y + h; yy++) {
      const cy = yy + 0.5;
      let inset = 0;
      if (cy < y + rr) {
        const d = y + rr - cy;
        inset = rr - Math.sqrt(Math.max(0, rr * rr - d * d));
      } else if (cy > y + h - rr) {
        const d = cy - (y + h - rr);
        inset = rr - Math.sqrt(Math.max(0, rr * rr - d * d));
      }
      for (let xx = Math.ceil(x + inset - 0.5); xx + 0.5 <= x + w - inset; xx++) this.px(xx, yy, c);
    }
  }

  /**
   * Dikey degrade — Bayer 4x4 dithering ile kademeli geçiş (pixel art
   * gökyüzünün temel aracı).
   */
  vgrad(x: number, y: number, w: number, h: number, stops: GradientStop[], opts: VGradOptions = {}): void {
    const dither = opts.dither !== false;
    const S = stops.map((s) => ({ t: s.t, color: hex(s.color) }));
    for (let yy = 0; yy < h; yy++) {
      const t = h <= 1 ? 0 : yy / (h - 1);
      let i = 0;
      while (i < S.length - 2 && t > S[i + 1].t) i++;
      const s0 = S[i];
      const s1 = S[Math.min(i + 1, S.length - 1)];
      const local = s1.t === s0.t ? 0 : Math.min(1, Math.max(0, (t - s0.t) / (s1.t - s0.t)));
      for (let xx = 0; xx < w; xx++) {
        let c: RGBA;
        if (opts.smooth) {
          c = s0.color.map((value, channel) => Math.round(value + (s1.color[channel] - value) * local)) as RGBA;
        } else if (dither) {
          const th = (BAYER4[(y + yy) & 3][(x + xx) & 3] + 0.5) / 16;
          c = local > th ? s1.color : s0.color;
        } else {
          c = local > 0.5 ? s1.color : s0.color;
        }
        this.px(x + xx, y + yy, c);
      }
    }
  }

  /** Bölgeye rastgele tek pikseller serp (yıldız, kıvılcım, kül). */
  scatter(x: number, y: number, w: number, h: number, c: ColorInput, count: number, rng: Rng): void {
    for (let i = 0; i < count; i++)
      this.px(x + rng() * w, y + rng() * h, c);
  }

  /** Başka bir Painter'ı (dx,dy) konumuna kopyalar — alfa harmanlı, atlas oluşturmak için. */
  blit(src: Painter, dx: number, dy: number): void {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const c = src.get(x, y);
        if (c[3] > 0) this.px(dx + x, dy + y, c);
      }
  }

  /** Kenarlara doğru karartma (8 kademeye nicelenmiş — bantlar estetik). */
  vignette(strength = 0.3): void {
    const cx = this.w / 2, cy = this.h / 2;
    const maxD2 = cx * cx + cy * cy;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const d2 = ((x - cx) ** 2 + (y - cy) ** 2) / maxD2;
        const f = Math.round((1 - strength * d2) * 8) / 8;
        const i = (y * this.w + x) * 4;
        this.data[i] = Math.round(this.data[i] * f);
        this.data[i + 1] = Math.round(this.data[i + 1] * f);
        this.data[i + 2] = Math.round(this.data[i + 2] * f);
      }
    }
  }
}

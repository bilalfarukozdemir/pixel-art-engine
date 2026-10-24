// ============================================================
// Kapsama tabanlı anti-aliasing (AA) — "hayali vektör çizgisini düşün,
// en büyük boşlukları doldur" yönteminin otomatik hâli.
// Kaynak: recipes/anti-aliasing.md.
//
// Her piksel samples×samples alt noktayla örneklenir. Kapsama >= %50 ise
// piksel düz renk alır; daha az kapsanan kenar pikselleri, ALTINDAKİ opak
// renkle 1 ya da 2 ara tona karıştırılır. Şeffaf piksele AA yapılmaz:
// arka plan bilinmeden ara ton seçilemez (sprite dış kenarı için
// selectiveOutline kullan). palette verilirse ara ton en yakın palet
// rengine oturur — yeni renk üretmemek için önerilir.
// ============================================================
import type { Painter } from "./painter.js";
import { mix, type ColorInput, type RGBA } from "./color.js";
import { nearestColor } from "../palette/index.js";

export interface AAOptions {
  /** Ara ton sayısı: 1 (başlangıç) veya 2 (daha yumuşak). Varsayılan 1. */
  levels?: 1 | 2;
  /** Eksen başına alt örnek sayısı (2..8). Varsayılan 4. */
  samples?: number;
  /** Ara tonları bu palete oturt. */
  palette?: ReadonlyArray<ColorInput>;
  /** AA başlama eşiği (kapsama). Düşük = daha çok AA. Varsayılan levels=1: 0.25, levels=2: 0.16. */
  threshold?: number;
}

function coverageFill(p: Painter, x0: number, y0: number, x1: number, y1: number,
  inside: (x: number, y: number) => boolean, c: ColorInput, opts: AAOptions): void {
  const S = opts.samples ?? 4;
  if (!Number.isInteger(S) || S < 2 || S > 8) throw new RangeError("samples must be an integer 2..8");
  const levels = opts.levels ?? 1;
  if (levels !== 1 && levels !== 2) throw new RangeError("levels must be 1 or 2");
  const t0 = opts.threshold ?? (levels === 1 ? 0.25 : 0.16);
  const writes: [number, number, RGBA | ColorInput][] = [];
  for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(p.h - 1, Math.ceil(y1)); y++)
    for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(p.w - 1, Math.ceil(x1)); x++) {
      let n = 0;
      for (let sy = 0; sy < S; sy++)
        for (let sx = 0; sx < S; sx++)
          if (inside(x - 0.5 + (sx + 0.5) / S, y - 0.5 + (sy + 0.5) / S)) n++;
      const cov = n / (S * S);
      if (cov >= 0.5) { writes.push([x, y, c]); continue; }
      if (cov < t0) continue;
      const under = p.get(x, y);
      if (under[3] < 255) continue;
      let k: number;
      if (levels === 1) k = 0.5;
      else k = cov >= (t0 + 0.5) / 2 ? 0.66 : 0.33;
      let col = mix(under, c, k);
      if (opts.palette && opts.palette.length) col = nearestColor(col, opts.palette);
      writes.push([x, y, col]);
    }
  for (const [x, y, col] of writes) p.px(x, y, col);
}

/** AA'lı dolu çokgen (çift-tek kuralı). */
export function aaPoly(p: Painter, pts: ReadonlyArray<readonly [number, number]>, c: ColorInput, opts: AAOptions = {}): void {
  if (pts.length < 3) throw new RangeError("polygon needs at least 3 points");
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const inside = (x: number, y: number): boolean => {
    let hit = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };
  coverageFill(p, minX - 1, minY - 1, maxX + 1, maxY + 1, inside, c, opts);
}

/** AA'lı dolu elips. */
export function aaEllipse(p: Painter, cx: number, cy: number, rx: number, ry: number, c: ColorInput, opts: AAOptions = {}): void {
  if (!(rx > 0 && ry > 0)) throw new RangeError("radii must be positive");
  const inside = (x: number, y: number): boolean => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  coverageFill(p, cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1, inside, c, opts);
}

// ============================================================
// Dithering — sınırlı renkle geçiş yanılsaması. Kaynak: recipes/dithering.md.
//
// Sıralı (ordered) 4x4 Bayer deseni kitaptaki "dama ailesi"ni verir:
// level 0..16 → 16'da kaç piksel ikinci renk. 8 = tam dama tahtası.
// Bu desenlerde azınlık pikselleri hiçbir zaman yan yana gelmez
// (2x1 "geniş piksel" oluşmaz). Desen mutlak koordinata bağlıdır,
// böylece yan yana boyanan alanlar ve tile'lar hizalı kalır.
// Kullanım alanı: gökyüzü, geniş arka plan, doku, sert renk sınırı.
// Küçük sprite ve animasyonlu parçalarda kullanma; kontrastı düşük tut.
// ============================================================
import type { Painter } from "../core/painter.js";
import type { ColorInput } from "../core/color.js";

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const LINE4 = [0, 8, 4, 12];

export type DitherPattern = "ordered" | "lines-h" | "lines-v";

function checkLevel(level: number): void {
  if (!Number.isInteger(level) || level < 0 || level > 16) throw new RangeError("level must be an integer 0..16");
}

/** (x,y) pikseli bu seviyede ikinci rengi mi alır? */
export function ditherLevel(x: number, y: number, level: number, pattern: DitherPattern = "ordered"): boolean {
  checkLevel(level);
  if (pattern === "lines-h") return LINE4[y & 3] < level;
  if (pattern === "lines-v") return LINE4[x & 3] < level;
  return BAYER4[y & 3][x & 3] < level;
}

/** Kutuyu a ile boyar; level/16 oranındaki piksellere b basar. */
export function ditherRect(p: Painter, x: number, y: number, w: number, h: number,
  a: ColorInput, b: ColorInput, level: number, pattern: DitherPattern = "ordered"): void {
  checkLevel(level);
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) p.px(xx, yy, ditherLevel(xx, yy, level, pattern) ? b : a);
}

export interface DitherBandOptions {
  /** Geçiş yönü: "y" yukarıdan aşağı, "x" soldan sağa. Varsayılan "y". */
  axis?: "x" | "y";
  /** İki renk arasındaki ara dither bandı sayısı (1..7). Varsayılan 3 (25/50/75%). */
  levels?: number;
  pattern?: DitherPattern;
}

/**
 * Bantlı dither geçişi: her renk çifti arasında düz bant + `levels` adet
 * ara dither bandı. Klasik konsol gökyüzü görünümü. Eşit bant yükseklikleri.
 */
export function ditherBands(p: Painter, x: number, y: number, w: number, h: number,
  colors: ReadonlyArray<ColorInput>, opts: DitherBandOptions = {}): void {
  if (colors.length < 2) throw new RangeError("need at least 2 colors");
  const levels = opts.levels ?? 3;
  if (!Number.isInteger(levels) || levels < 1 || levels > 7) throw new RangeError("levels must be an integer 1..7");
  const axis = opts.axis ?? "y";
  const bands: { a: ColorInput; b: ColorInput; level: number }[] = [];
  for (let i = 0; i + 1 < colors.length; i++) {
    bands.push({ a: colors[i], b: colors[i + 1], level: 0 });
    for (let k = 1; k <= levels; k++)
      bands.push({ a: colors[i], b: colors[i + 1], level: Math.round((k / (levels + 1)) * 16) });
  }
  bands.push({ a: colors[colors.length - 1], b: colors[colors.length - 1], level: 0 });
  const span = axis === "y" ? h : w;
  for (let k = 0; k < bands.length; k++) {
    const s0 = Math.round((k / bands.length) * span), s1 = Math.round(((k + 1) / bands.length) * span);
    const band = bands[k];
    if (axis === "y") ditherRect(p, x, y + s0, w, s1 - s0, band.a, band.b, band.level, opts.pattern);
    else ditherRect(p, x + s0, y, s1 - s0, h, band.a, band.b, band.level, opts.pattern);
  }
}

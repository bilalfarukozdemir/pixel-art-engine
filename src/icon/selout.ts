// ============================================================
// Seçmeli (selective) ve renkli outline — kitaptaki outline türlerinin
// motor karşılıkları. Kaynak: recipes/line-art.md, recipes/subpixel.md.
//
// outline() tek renkli kontur basar ("black contour"). Bu dosya:
//   - colouredOutline: her kontur pikseli komşu dolgu renginin koyusudur.
//   - selectiveOutline: kontur ışık kaynağına göre gölgelenir; ışığa bakan
//     kenar açık (dolgu rengine yakın), gölge kenarı koyu mürekkep olur.
// Saf siyah kullanılmaz; koyu ton dolgu renginden inkOf ile türetilir.
// Şekil BİTTİKTEN sonra, tek nesnelik tuvalde çağrılır (outline gibi).
// Not: seçmeli outline koyu arka planlarda en iyi görünür; çok açık
// zeminde kırık görünebilir → lit değerini yükselt veya colouredOutline kullan.
// ============================================================
import type { Painter } from "../core/painter.js";
import { mix, luma, type ColorInput, type RGBA } from "../core/color.js";
import { inkOf, nearestColor } from "../palette/index.js";

export interface SelOutOptions {
  /** Işığın GELDİĞİ yön (ekran koordinatı). Varsayılan [-1,-1] = sol üst. */
  light?: readonly [number, number];
  /** Tüm kontur için sabit koyu ton. Verilmezse her dolgu renginden inkOf ile türetilir. */
  ink?: ColorInput;
  /** Işığa bakan kenarda dolgu→mürekkep karışımı (0..1). Varsayılan 0.45. */
  lit?: number;
  /** Yan kenarlarda karışım. Varsayılan 0.72. */
  mid?: number;
  /** Gölge kenarında karışım. Varsayılan 1 (tam mürekkep). */
  dark?: number;
  /**
   * Kontur renklerini bu palete oturt (örn. [inkOf(ramp[0]), ...ramp]).
   * Önerilir: aksi hâlde her dolgu için ayrı ara ton üretilir ve renk sayısı şişer.
   */
  palette?: ReadonlyArray<ColorInput>;
}

function checkMix(name: string, v: number): number {
  if (!Number.isFinite(v) || v < 0 || v > 1) throw new RangeError(`${name} must be 0..1`);
  return v;
}

function shadeTargets(p: Painter, pick: (fill: RGBA, nx: number, ny: number) => RGBA): void {
  const { w, h, data } = p;
  const opaque = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] > 60;
  const colorAt = (x: number, y: number): RGBA => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2], 255];
  };
  const writes: [number, RGBA][] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (opaque(x, y)) continue;
      const n4 = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([a, b]) => opaque(a, b));
      if (n4.length === 0) continue;
      // Komşu dolgu rengi: en sık olan, eşitlikte en koyu.
      const tally = new Map<number, { c: RGBA; n: number }>();
      for (const [a, b] of n4) {
        const c = colorAt(a, b), k = (c[0] << 16) | (c[1] << 8) | c[2];
        const t = tally.get(k);
        if (t) t.n++; else tally.set(k, { c, n: 1 });
      }
      const fill = [...tally.values()].sort((A, B) => B.n - A.n || luma(A.c) - luma(B.c))[0].c;
      // Dış normal: 8 komşudaki opak piksellerden uzaklaşan yön.
      let nx = 0, ny = 0;
      for (let yy = -1; yy <= 1; yy++)
        for (let xx = -1; xx <= 1; xx++)
          if ((xx || yy) && opaque(x + xx, y + yy)) { nx -= xx; ny -= yy; }
      const len = Math.hypot(nx, ny) || 1;
      writes.push([(y * w + x) * 4, pick(fill, nx / len, ny / len)]);
    }
  for (const [i, c] of writes) { data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255; }
}

/** Işığa göre gölgelenmiş kontur (sel-out). */
export function selectiveOutline(p: Painter, opts: SelOutOptions = {}): void {
  const [lx0, ly0] = opts.light ?? [-1, -1];
  const ll = Math.hypot(lx0, ly0);
  if (!(ll > 0)) throw new RangeError("light must be a non-zero direction");
  const lx = lx0 / ll, ly = ly0 / ll;
  const lit = checkMix("lit", opts.lit ?? 0.45);
  const mid = checkMix("mid", opts.mid ?? 0.72);
  const dark = checkMix("dark", opts.dark ?? 1);
  shadeTargets(p, (fill, nx, ny) => {
    const facing = nx * lx + ny * ly;
    const t = facing > 0.35 ? lit : facing < -0.35 ? dark : mid;
    const c = mix(fill, opts.ink ?? inkOf(fill), t);
    return opts.palette && opts.palette.length ? nearestColor(c, opts.palette) : c;
  });
}

/** Renkli kontur: her kenar, komşu dolgunun koyu tonu (ışık yönü yok). */
export function colouredOutline(p: Painter,
  opts: { ink?: ColorInput; amount?: number; palette?: ReadonlyArray<ColorInput> } = {}): void {
  const t = checkMix("amount", opts.amount ?? 0.7);
  shadeTargets(p, (fill) => {
    const c = mix(fill, opts.ink ?? inkOf(fill), t);
    return opts.palette && opts.palette.length ? nearestColor(c, opts.palette) : c;
  });
}

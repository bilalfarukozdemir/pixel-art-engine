// ============================================================
// Çizgi araçları — "eşit merdiven" kuralına uyan çizgi ve eğriler.
// Kaynak: recipes/line-art.md.
//
// Piksel çizgisi, aynı uzunlukta adımlardan oluştuğunda pürüzsüz görünür
// (1:1, 2:1, 3:1 ...). Eğri ise adımların tek yönde değiştiği bir dizidir:
// dikey kısımda adımlar kısalır, yatay kısımda uzar. Örn. 4-3-2-1-1-1-1-2-3-4-8.
// Bu modül eğriyi adım uzunluklarıyla tarif etmeyi sağlar; böylece
// "jaggy" (düzensiz adım) baştan oluşmaz.
// ============================================================
import type { Painter } from "../core/painter.js";
import type { ColorInput } from "../core/color.js";

/**
 * Sabit adımlı (pixel-perfect) merdiven çizgisi. stepW veya stepH'den biri 1
 * olmalı: stepW=2, stepH=1 → 2:1 (izometrik) çizgi; stepW=1, stepH=3 → dik çizgi.
 * dir: +1 sağa, -1 sola ilerler; çizgi her zaman aşağı iner. Bitiş noktasını döner.
 */
export function stairs(p: Painter, x: number, y: number, stepW: number, stepH: number, count: number,
  c: ColorInput, dir: 1 | -1 = 1): { x: number; y: number } {
  for (const v of [stepW, stepH, count])
    if (!Number.isInteger(v) || v < 1) throw new RangeError("stepW, stepH and count must be positive integers");
  if (stepW !== 1 && stepH !== 1) throw new RangeError("one of stepW/stepH must be 1 for a clean staircase");
  let cx = x, cy = y;
  for (let i = 0; i < count; i++) {
    if (stepH === 1) {
      for (let k = 0; k < stepW; k++) p.px(cx + k * dir, cy, c);
      cx += stepW * dir; cy += 1;
    } else {
      for (let k = 0; k < stepH; k++) p.px(cx, cy + k, c);
      cx += dir; cy += stepH;
    }
  }
  return { x: cx, y: cy };
}

/**
 * Adım uzunluklarıyla tarif edilen çeyrek eğri: önce dikey koşular (vRuns),
 * sonra yatay koşular (hRuns). Her koşu bir öncekine çapraz bağlanır.
 * dx/dy ilerleme yönleri. Kitaptaki iyi örnek:
 *   runCurve(p, x, y, [4,3,2,1,1,1,1], [2,3,4,8], 1, 1, ink)
 * Bitiş noktasını döner (son pikselden bir çapraz adım sonrası).
 */
export function runCurve(p: Painter, x: number, y: number, vRuns: ReadonlyArray<number>,
  hRuns: ReadonlyArray<number>, dx: 1 | -1, dy: 1 | -1, c: ColorInput): { x: number; y: number } {
  for (const r of [...vRuns, ...hRuns])
    if (!Number.isInteger(r) || r < 1) throw new RangeError("runs must be positive integers");
  let cx = x, cy = y;
  for (const r of vRuns) {
    for (let k = 0; k < r; k++) p.px(cx, cy + k * dy, c);
    cx += dx; cy += r * dy;
  }
  for (const r of hRuns) {
    for (let k = 0; k < r; k++) p.px(cx + k * dx, cy, c);
    cx += r * dx; cy += dy;
  }
  return { x: cx, y: cy };
}

export interface RunIssue { axis: "v" | "h"; index: number; }

/**
 * Bir runCurve tarifinin temizliğini kontrol eder: dikey koşular kısalmalı
 * (artmamalı), yatay koşular uzamalı (azalmamalı). Bozan indeksleri döner.
 * Boş dizi = tek yönlü, pürüzsüz eğri.
 */
export function curveRunIssues(vRuns: ReadonlyArray<number>, hRuns: ReadonlyArray<number>): RunIssue[] {
  const out: RunIssue[] = [];
  for (let i = 1; i < vRuns.length; i++) if (vRuns[i] > vRuns[i - 1]) out.push({ axis: "v", index: i });
  for (let i = 1; i < hRuns.length; i++) if (hRuns[i] < hRuns[i - 1]) out.push({ axis: "h", index: i });
  return out;
}

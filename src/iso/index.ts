// ============================================================
// İzometrik yardımcılar — piksel sanatın "2'ye 1" izometrisi.
// Kaynak: recipes/perspective.md.
//
// Gerçek 30° piksellerle çizilemez; herkes 2 piksellik adımları kullanır
// (~26.5°). Kenarlar çizgiyle değil renk farkıyla ayrılır: kesişimlerde
// "tıknaz" çift piksel oluşmaz (dama tahtası yöntemi).
// ============================================================
import type { Painter } from "../core/painter.js";
import type { ColorInput } from "../core/color.js";

function checkWidth(w: number): number {
  if (!Number.isInteger(w) || w < 4 || w % 4 !== 0) throw new RangeError("width must be a positive multiple of 4");
  return w / 4;
}

/** Satır r için elmasın yarı genişliği (k = w/4, yükseklik 2k). */
function halfWidth(r: number, k: number): number {
  return r < k ? 2 * (r + 1) : 2 * (2 * k - r);
}

/**
 * 2:1 izometrik elmas (zemin karosu). Genişlik w (4'ün katı), yükseklik w/2.
 * (cx, cy) elmasın merkezi: x ∈ [cx-w/2, cx+w/2), y ∈ [cy-w/4, cy+w/4).
 */
export function isoDiamond(p: Painter, cx: number, cy: number, w: number, c: ColorInput): void {
  const k = checkWidth(w);
  for (let r = 0; r < 2 * k; r++) {
    const hw = halfWidth(r, k);
    for (let x = cx - hw; x < cx + hw; x++) p.px(x, cy - k + r, c);
  }
}

export interface IsoBoxColors { top: ColorInput; left: ColorInput; right: ColorInput; }

/**
 * İzometrik kutu: üst yüz elmas, sol ve sağ yüzler h piksel aşağı uzanır.
 * Işık genelde üstten: top en açık, ışığa bakan yan orta, diğer yan koyu.
 */
export function isoBox(p: Painter, cx: number, cy: number, w: number, h: number, colors: IsoBoxColors): void {
  const k = checkWidth(w);
  if (!Number.isInteger(h) || h < 1) throw new RangeError("height must be a positive integer");
  isoDiamond(p, cx, cy, w, colors.top);
  for (let x = cx - 2 * k; x < cx + 2 * k; x++) {
    const d = x < cx ? cx - x : x - cx + 1;
    const rMax = 2 * k - Math.ceil(d / 2);
    const yb = cy - k + rMax;
    for (let y = yb + 1; y <= yb + h; y++) p.px(x, y, x < cx ? colors.left : colors.right);
  }
}

// ============================================================
// Subpiksel kaydırma — "0.5 piksel" ara kare taslağı.
// Kaynak: recipes/subpixel.md (kitaptaki "hızlı ama ucuz" yöntem).
//
// Adımlar: 2x en-yakın büyüt → 1 yüksek-çözünürlük pikseli (= yarım piksel)
// kaydır → kutu filtresiyle 1x'e küçült → sprite'ın KENDİ paletine indir.
// Sonuç bir TASLAKTIR: göz/yüz bozulabilir, elle temizlenmelidir.
// Değer (parlaklık) kayma yönündeki komşu piksele taşınır; renk paletten
// seçildiği için yeni renk oluşmaz.
// ============================================================
import { Painter } from "./painter.js";
import type { ColorInput } from "./color.js";
import { downsample } from "./resample.js";
import { paletteOf, quantize } from "../palette/index.js";

export interface SubpixelOptions {
  /** Ara renklerin seçileceği palet. Varsayılan: sprite'ın kendi renkleri. */
  palette?: ReadonlyArray<ColorInput>;
  /** Bu alfanın altı şeffaf kalır. Varsayılan 129: yarım kapsanan kenar büyümez. */
  alphaCut?: number;
}

/** Sprite'ı dx, dy yönünde (her biri -1, 0, 1) yarım piksel kaydırılmış YENİ bir Painter döndürür. */
export function subpixelShift(src: Painter, dx: -1 | 0 | 1, dy: -1 | 0 | 1, opts: SubpixelOptions = {}): Painter {
  for (const v of [dx, dy]) if (v !== -1 && v !== 0 && v !== 1) throw new RangeError("dx/dy must be -1, 0 or 1");
  const palette = opts.palette ?? paletteOf(src);
  const big = new Painter(src.w * 2, src.h * 2);
  for (let y = 0; y < big.h; y++)
    for (let x = 0; x < big.w; x++) {
      const sx = x - dx, sy = y - dy;
      if (sx < 0 || sy < 0 || sx >= big.w || sy >= big.h) continue;
      const si = ((sy >> 1) * src.w + (sx >> 1)) * 4, di = (y * big.w + x) * 4;
      big.data[di] = src.data[si]; big.data[di + 1] = src.data[si + 1];
      big.data[di + 2] = src.data[si + 2]; big.data[di + 3] = src.data[si + 3];
    }
  const out = downsample(big, 2);
  if (palette.length) quantize(out, palette, opts.alphaCut ?? 129);
  return out;
}

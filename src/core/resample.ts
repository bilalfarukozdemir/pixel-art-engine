// ============================================================
// Küçültme (box filter). upscale'in tersi ama farklı amaçla: sahneyi
// n kat büyük çizip n'e bölmek kenarları yumuşatır (supersampling).
// Piksel sanat felsefesinin dışındaki "yumuşak stil" bu yolla aynı
// Painter ilkelleriyle üretilir; motorun antialiasing'siz çekirdeği değişmez.
// Runtime-agnostik: Node ve tarayıcıda çalışır.
// ============================================================
import { Painter } from "./painter.js";

/** n×n blokların alfa-ağırlıklı ortalaması. Boyut n'e tam bölünmezse kalan kenar atılır. */
export function downsample(src: Painter, n: number): Painter {
  if (!Number.isInteger(n) || n < 1) throw new RangeError("downsample factor must be a positive integer");
  const w = Math.floor(src.w / n), h = Math.floor(src.h / n);
  if (w < 1 || h < 1) throw new RangeError("source smaller than one output pixel");
  const out = new Painter(w, h);
  const area = n * n;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let yy = 0; yy < n; yy++)
        for (let xx = 0; xx < n; xx++) {
          const i = ((y * n + yy) * src.w + (x * n + xx)) * 4;
          const al = src.data[i + 3];
          r += src.data[i] * al;
          g += src.data[i + 1] * al;
          b += src.data[i + 2] * al;
          a += al;
        }
      const o = (y * w + x) * 4;
      if (a > 0) {
        out.data[o] = Math.round(r / a);
        out.data[o + 1] = Math.round(g / a);
        out.data[o + 2] = Math.round(b / a);
        out.data[o + 3] = Math.round(a / area);
      }
    }
  return out;
}

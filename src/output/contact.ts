// ============================================================
// contactSheet — karelerin ızgarada, büyütülmüş, numaralı dizildiği
// tek görsel. "Çiz, bak, düzelt" döngüsünün gözü: efektin her anını
// tek bakışta gösterir. Saydam alan dama deseniyle görünür.
// Saf çekirdek kodu; Node'a bağlı değil (PNG için encodePng kullan).
// ============================================================
import { Painter } from "../core/painter.js";
import type { ColorInput } from "../core/color.js";

export interface ContactSheetOptions {
  /** Satırdaki kare sayısı (varsayılan 6). */
  cols?: number;
  /** Tam sayı büyütme (varsayılan 2). */
  scale?: number;
  /** Her kaçıncı kare alınsın (varsayılan 1 = hepsi). */
  every?: number;
  /** Kareler arası boşluk, px (varsayılan 4). */
  gap?: number;
  /** Saydamlık dama deseni iki tonu. */
  checker?: [ColorInput, ColorInput];
  /** Kare numarası yazılsın mı (varsayılan true). */
  numbers?: boolean;
}

// 3x5 rakamlar, satır başına 3 bit
const DIGITS: Record<string, number[]> = {
  "0": [7, 5, 5, 5, 7], "1": [2, 6, 2, 2, 7], "2": [7, 1, 7, 4, 7], "3": [7, 1, 7, 1, 7], "4": [5, 5, 7, 1, 1],
  "5": [7, 4, 7, 1, 7], "6": [7, 4, 7, 5, 7], "7": [7, 1, 2, 2, 2], "8": [7, 5, 7, 5, 7], "9": [7, 5, 7, 1, 7],
};

function number(p: Painter, x: number, y: number, n: number, c: ColorInput): void {
  let cx = x;
  for (const ch of String(n)) {
    const rows = DIGITS[ch];
    for (let r = 0; r < 5; r++) for (let b = 0; b < 3; b++) if (rows[r] & (4 >> b)) p.px(cx + b, y + r, c);
    cx += 4;
  }
}

export function contactSheet(frames: Painter[], opts: ContactSheetOptions = {}): Painter {
  if (frames.length === 0) throw new Error("contactSheet: en az bir kare gerekli");
  const cols = Math.max(1, Math.floor(opts.cols ?? 6)), s = Math.max(1, Math.floor(opts.scale ?? 2));
  const every = Math.max(1, Math.floor(opts.every ?? 1)), gap = Math.max(0, Math.floor(opts.gap ?? 4));
  const numbers = opts.numbers ?? true, [c0, c1] = opts.checker ?? ["#2a2a36", "#33333f"];
  const picked = frames.map((f, i) => [f, i] as const).filter(([, i]) => i % every === 0 || i === frames.length - 1);
  const fw = frames[0].w * s, fh = frames[0].h * s, label = numbers ? 8 : 0;
  const rows = Math.ceil(picked.length / cols), n = Math.min(cols, picked.length);
  const out = new Painter(gap + n * (fw + gap), gap + rows * (fh + label + gap));
  out.fill("#15151d");
  picked.forEach(([f, idx], k) => {
    const ox = gap + (k % cols) * (fw + gap), oy = gap + Math.floor(k / cols) * (fh + label + gap);
    if (numbers) number(out, ox, oy, idx, "#9a9ab0");
    const top = oy + label;
    for (let y = 0; y < fh; y++)
      for (let x = 0; x < fw; x++) out.px(ox + x, top + y, ((x >> 3) + (y >> 3)) & 1 ? c1 : c0);
    for (let y = 0; y < f.h; y++)
      for (let x = 0; x < f.w; x++) {
        const c = f.get(x, y);
        if (c[3] > 0) out.rect(ox + x * s, top + y * s, s, s, c);
      }
  });
  return out;
}

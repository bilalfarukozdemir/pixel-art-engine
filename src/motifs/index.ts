// ============================================================
// Ortak motifler — Painter üstüne kompoze edilen, rng alan hazır
// sahne parçaları. Veyra'nın motifs.mjs'inden birebir taşındı,
// `glow` (parıldayan ışık) burada yeni eklendi.
// ============================================================
import type { Painter } from "../core/painter.js";
import { alpha, shade, type ColorInput } from "../core/color.js";
import type { Rng } from "../core/rng.js";

/** Yıldızlar: çoğu tek piksel, birkaçı parlak artı. */
export function stars(p: Painter, x: number, y: number, w: number, h: number, count: number, rng: Rng, c: ColorInput): void {
  for (let i = 0; i < count; i++) {
    const sx = (x + rng() * w) | 0;
    const sy = (y + rng() * h) | 0;
    p.px(sx, sy, alpha(c, 90 + rng() * 120));
    if (rng() < 0.12) {
      p.px(sx - 1, sy, alpha(c, 70));
      p.px(sx + 1, sy, alpha(c, 70));
      p.px(sx, sy - 1, alpha(c, 70));
      p.px(sx, sy + 1, alpha(c, 70));
    }
  }
}

/** Yatay sis bandı — dalgalı, yarı saydam. */
export function fogBand(p: Painter, y: number, thickness: number, c: ColorInput, rng: Rng, a = 70): void {
  let off = 0;
  for (let x = 0; x < p.w; x++) {
    if (rng() < 0.18) off += rng() < 0.5 ? 1 : -1;
    off = Math.max(-2, Math.min(2, off));
    for (let t = 0; t < thickness; t++) {
      const fade = 1 - Math.abs(t - thickness / 2) / (thickness / 2 + 0.01);
      p.px(x, y + off + t, alpha(c, a * fade));
    }
  }
}

/** Ay / parlayan küre + halo. */
export function orb(p: Painter, cx: number, cy: number, r: number, core: ColorInput, haloC: ColorInput): void {
  p.ellipse(cx, cy, r + 2.5, r + 2.5, alpha(haloC, 38));
  p.ellipse(cx, cy, r + 1.2, r + 1.2, alpha(haloC, 70));
  p.ellipse(cx, cy, r, r, core);
  p.px(cx - (r >> 1), cy - (r >> 1), shade(core, 1.25));
}

/**
 * Parıldayan ışık kaynağı — shard, mum, büyü gibi küçük ışık noktaları
 * için. `orb`'dan farkı: `intensity` (0..1) parametresiyle kontrol
 * edilebilir, çağıran taraf kareden kareye bunu değiştirerek "yanıp
 * sönme" animasyonu üretir (bkz. GIF export). Yeni motif,
 * Veyra'da karşılığı yok.
 */
export interface GlowOptions {
  rng?: Rng;
  flicker?: number; // 0..1 — kenarda rastgele kıvılcım pikseli miktarı
}

export function glow(
  p: Painter,
  x: number,
  y: number,
  r: number,
  core: ColorInput,
  haloColor: ColorInput,
  intensity = 1,
  opts: GlowOptions = {},
): void {
  const haloR = r * (2 + intensity);
  p.ellipse(x, y, haloR, haloR, alpha(haloColor, Math.round(30 * intensity)));
  p.ellipse(x, y, haloR * 0.55, haloR * 0.55, alpha(haloColor, Math.round(70 * intensity)));
  p.ellipse(x, y, r, r, alpha(core, Math.round(200 + 55 * intensity)));
  const flicker = opts.flicker ?? 0;
  if (opts.rng && flicker > 0) {
    const sparkCount = Math.round(2 * flicker);
    for (let i = 0; i < sparkCount; i++) {
      const ang = opts.rng() * Math.PI * 2;
      const dist = r + opts.rng() * haloR * 0.4;
      p.px(x + Math.cos(ang) * dist, y + Math.sin(ang) * dist, alpha(core, 120));
    }
  }
}

/** Mazgallı sur üst hattı: y üst kenar olmak üzere dişler. */
export function crenellate(p: Painter, x: number, y: number, w: number, c: ColorInput, toothW = 3, gap = 3, toothH = 3): void {
  for (let i = 0; i < w; i += toothW + gap)
    p.rect(x + i, y - toothH, Math.min(toothW, w - i), toothH, c);
}

export interface TowerOptions {
  taper?: number;
  spire?: number;
  crenellated?: boolean;
  windows?: [ColorInput, number, Rng];
}

/** Kule silüeti: hafif daralan gövde + tepe. */
export function tower(p: Painter, cx: number, baseY: number, w: number, h: number, c: ColorInput, opts: TowerOptions = {}): void {
  const topW = Math.max(2, Math.round(w * (opts.taper ?? 0.7)));
  p.poly(
    [
      [cx - w / 2, baseY],
      [cx - topW / 2, baseY - h],
      [cx + topW / 2, baseY - h],
      [cx + w / 2, baseY],
    ],
    c,
  );
  if (opts.spire) {
    const sh = opts.spire;
    p.poly(
      [
        [cx - topW / 2, baseY - h],
        [cx, baseY - h - sh],
        [cx + topW / 2, baseY - h],
      ],
      c,
    );
  }
  if (opts.crenellated) crenellate(p, cx - topW / 2, baseY - h, topW, c, 2, 2, 2);
  if (opts.windows) {
    const [wc, count, rng] = opts.windows;
    for (let i = 0; i < count; i++) {
      const wy = baseY - 3 - rng() * (h - 6);
      const wx = cx - topW / 2 + 1 + rng() * (topW - 2);
      p.px(wx, wy, wc);
    }
  }
}

/** Ölü/çıplak ağaç: gövde + birkaç kıvrık dal. */
export function deadTree(p: Painter, x: number, baseY: number, h: number, c: ColorInput, rng: Rng): void {
  let cx = x;
  for (let i = 0; i < h; i++) {
    const w = i < h * 0.25 ? 2 : 1;
    p.rect(cx, baseY - i, w, 1, c);
    if (rng() < 0.15) cx += rng() < 0.5 ? 1 : -1;
    if (i > h * 0.35 && rng() < 0.3) {
      let bx = cx, by = baseY - i;
      const dir = rng() < 0.5 ? -1 : 1;
      const len = 2 + rng() * (h * 0.3);
      for (let j = 0; j < len; j++) {
        bx += dir;
        if (rng() < 0.5) by -= 1;
        p.px(bx, by, c);
      }
    }
  }
}

/** Turkuaz damar: kırık, dallanan çizgi (taş/zemin çatlağı). */
export function veins(p: Painter, x: number, y: number, len: number, rng: Rng, c: ColorInput, bright: ColorInput): void {
  let cx = x, cy = y;
  for (let i = 0; i < len; i++) {
    p.px(cx, cy, rng() < 0.2 ? bright : c);
    cx += rng() < 0.6 ? 1 : 0;
    cy += rng() < 0.35 ? (rng() < 0.5 ? 1 : -1) : 0;
    if (rng() < 0.12) {
      let bx = cx, by = cy;
      for (let j = 0; j < 2 + rng() * 3; j++) {
        by += rng() < 0.5 ? 1 : -1;
        bx += 1;
        p.px(bx, by, alpha(c, 160));
      }
    }
  }
}

/** Havada asılı kor zerreleri (statik an). emberColors: [ember2, ember3, flame] gibi 3 renk. */
export function embers(p: Painter, x: number, y: number, w: number, h: number, count: number, rng: Rng, emberColors: [ColorInput, ColorInput, ColorInput]): void {
  for (let i = 0; i < count; i++) {
    const c = emberColors[(rng() * 3) | 0];
    p.px(x + rng() * w, y + rng() * h, alpha(c, 120 + rng() * 135));
  }
}

/** Kül tanecikleri (aşağı süzülen his). ashColors: 3 renk. */
export function ashfall(p: Painter, x: number, y: number, w: number, h: number, count: number, rng: Rng, ashColors: [ColorInput, ColorInput, ColorInput]): void {
  for (let i = 0; i < count; i++) {
    const c = ashColors[(rng() * 3) | 0];
    p.px(x + rng() * w, y + rng() * h, alpha(c, 70 + rng() * 90));
  }
}

export interface HoodedFigureOptions {
  seated?: boolean;
  rim?: -1 | 0 | 1;
  emberColor?: ColorInput;
  brightEmberColor?: ColorInput;
}

/** Kapüşonlu insan silüeti (yandan, otururken ya da ayakta). */
export function hoodedFigure(p: Painter, x: number, baseY: number, h: number, c: ColorInput, opts: HoodedFigureOptions = {}): void {
  const seated = opts.seated;
  const bodyH = seated ? Math.round(h * 0.72) : h;
  const halfW = Math.max(3, h * 0.3);
  p.poly(
    [
      [x - halfW, baseY],
      [x - halfW * 0.9, baseY - bodyH * 0.62],
      [x - halfW * 0.55, baseY - bodyH * 0.88],
      [x + halfW * 0.55, baseY - bodyH * 0.88],
      [x + halfW * 0.9, baseY - bodyH * 0.62],
      [x + halfW, baseY],
    ],
    c,
  );
  const hr = Math.max(2.4, h * 0.17);
  const lean = (opts.rim ?? 0) * hr * 0.5;
  p.ellipse(x + lean, baseY - bodyH - hr * 0.4, hr, hr * 1.08, c);
  p.px(x + lean + (opts.rim ?? 1) * 1, baseY - bodyH - 1, shade(c, 0.55));
  if (opts.rim && opts.emberColor) {
    const dir = opts.rim;
    const ex = x + dir * (halfW * 0.85);
    p.vline(ex, baseY - bodyH * 0.85, bodyH * 0.7, alpha(opts.emberColor, 150));
    p.vline(ex - dir, baseY - bodyH * 0.6, bodyH * 0.35, alpha(opts.emberColor, 80));
    p.px(x + lean + dir * hr * 0.8, baseY - bodyH - hr * 0.4, alpha(opts.brightEmberColor ?? opts.emberColor, 170));
  }
}

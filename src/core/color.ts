// ============================================================
// Renk yardımcıları. Veyra'nın painter.mjs'inden TypeScript'e
// birebir taşındı — davranış aynı kalmalı.
// ============================================================

export type RGBA = [number, number, number, number];
export type ColorInput = string | RGBA;

export function hex(c: ColorInput): RGBA {
  if (Array.isArray(c)) return c;
  const s = c.replace("#", "");
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
    s.length >= 8 ? parseInt(s.slice(6, 8), 16) : 255,
  ];
}

/** İki rengin t (0..1) karışımı. */
export function mix(a: ColorInput, b: ColorInput, t: number): RGBA {
  const A = hex(a), B = hex(b);
  return [
    Math.round(A[0] + (B[0] - A[0]) * t),
    Math.round(A[1] + (B[1] - A[1]) * t),
    Math.round(A[2] + (B[2] - A[2]) * t),
    255,
  ];
}

/** Rengi koyulaştır/aydınlat (f<1 koyu, f>1 açık). */
export function shade(c: ColorInput, f: number): RGBA {
  const A = hex(c);
  return [
    Math.min(255, Math.round(A[0] * f)),
    Math.min(255, Math.round(A[1] * f)),
    Math.min(255, Math.round(A[2] * f)),
    A[3] ?? 255,
  ];
}

/** Renge alfa ekle (0..255). */
export function alpha(c: ColorInput, a: number): RGBA {
  const A = hex(c);
  return [A[0], A[1], A[2], a];
}

/** Painter içi kullanım: renk girdisini CSS hex string'e çevirir (canvas fillStyle için). */
export function toCssHex([r, g, b]: RGBA): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

// ------------------------------------------------------------
// HSV, parlaklık ve renk uzaklığı — renk rampası (hue shifting),
// palet indirgeme ve lint araçlarının ortak temeli.
// ------------------------------------------------------------

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/** RGB → HSV. h: 0..360 derece, s ve v: 0..1. Alfa dikkate alınmaz. */
export function toHsv(c: ColorInput): [number, number, number] {
  const [R, G, B] = hex(c);
  const r = R / 255, g = G / 255, b = B / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

/** HSV → RGBA. h derece (her değer 0..360'a sarılır), s ve v 0..1'e kırpılır. */
export function fromHsv(h: number, s: number, v: number, a = 255): RGBA {
  const hh = ((h % 360) + 360) % 360;
  const ss = clamp01(s), vv = clamp01(v);
  const c = vv * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = vv - c;
  let r = 0, g = 0, b = 0;
  if (hh < 60) [r, g, b] = [c, x, 0];
  else if (hh < 120) [r, g, b] = [x, c, 0];
  else if (hh < 180) [r, g, b] = [0, c, x];
  else if (hh < 240) [r, g, b] = [0, x, c];
  else if (hh < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255), a];
}

/** Algısal parlaklık 0..1 (Rec. 601 luma). Rampa sıralaması ve kontrast kontrolü için. */
export function luma(c: ColorInput): number {
  const [r, g, b] = hex(c);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * "Redmean" ağırlıklı RGB uzaklığı (0..~765). Gözün yeşile duyarlılığını
 * kabaca hesaba katar. Küçük sprite'ta ~20'nin altındaki iki renk ayırt edilmez.
 */
export function colorDistance(a: ColorInput, b: ColorInput): number {
  const A = hex(a), B = hex(b);
  const rm = (A[0] + B[0]) / 2;
  const dr = A[0] - B[0], dg = A[1] - B[1], db = A[2] - B[2];
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}

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

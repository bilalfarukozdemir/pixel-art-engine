// ============================================================
// İç mekân yardımcıları — kesit (cut-away) oda: arka duvar, süpürgelik,
// ahşap zemin, pencere, halı. `unit` piksel sanatta 1'dir; yumuşak stil için sahne
// büyük çizilip downsample edilirken çizgi kalınlığı/aralık unit ile ölçeklenir.
// RNG yok: desenler konuma bağlı, aynı girdi → aynı çıktı.
// ============================================================
import type { Painter, GradientStop } from "../core/painter.js";
import { alpha, mix, type ColorInput } from "../core/color.js";

export interface InteriorPalette {
  wall: ColorInput; wallDark: ColorInput;
  trim: ColorInput; trimDark: ColorInput;
  floor: ColorInput; floorDark: ColorInput; floorLight: ColorInput;
}
export const COZY_INTERIOR: Readonly<InteriorPalette> = Object.freeze({
  wall: "#f1dcc0", wallDark: "#d4b48f",
  trim: "#fff3df", trimDark: "#b48e69",
  floor: "#b07a4f", floorDark: "#87573a", floorLight: "#cf9a6a",
});

export interface InteriorOptions {
  /** Çizgi kalınlığı ve desen aralığı çarpanı (piksel sanatta 1). */
  unit?: number;
  /** Duvar/cam degradesini dither yerine yumuşak harmanla. */
  smooth?: boolean;
}

function unitOf(o: InteriorOptions): number {
  const u = o.unit ?? 1;
  if (!Number.isInteger(u) || u < 1) throw new RangeError("unit must be a positive integer");
  return u;
}
function box(w: number, h: number, minW: number, minH: number): void {
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < minW || h < minH)
    throw new RangeError(`Expected integer dimensions >= ${minW}x${minH}`);
}

/**
 * Kutu içine arka duvar + tavan pervazı + süpürgelik + tahta zemin boyar.
 * floorY mutlak koordinattır (y < floorY < y+h). Kutunun dışına taşmaz.
 */
export function roomShell(p: Painter, x: number, y: number, w: number, h: number, floorY: number,
  palette: InteriorPalette = COZY_INTERIOR, opts: InteriorOptions = {}): void {
  const u = unitOf(opts);
  box(w, h, 12 * u, 12 * u);
  if (!Number.isInteger(floorY) || floorY <= y + 6 * u || floorY >= y + h - u)
    throw new RangeError("floorY must leave room for wall trim and at least one floor row");
  const wallH = floorY - y;
  p.vgrad(x, y, w, wallH, [
    { t: 0, color: mix(palette.wall, palette.wallDark, 0.3) },
    { t: 0.3, color: palette.wall },
    { t: 1, color: palette.wall },
  ], { smooth: opts.smooth });
  for (let sx = x + 4 * u; sx + u <= x + w; sx += 10 * u) p.rect(sx, y, u, wallH, alpha(palette.wallDark, 60));
  p.rect(x, y, w, 2 * u, palette.trim);
  p.rect(x, y + 2 * u, w, u, alpha(palette.trimDark, 110));
  const bb = 4 * u;
  p.rect(x, floorY - bb, w, bb, palette.trim);
  p.rect(x, floorY - bb, w, u, alpha("#ffffff", 120));
  p.rect(x, floorY - u, w, u, palette.trimDark);
  const floorH = y + h - floorY;
  p.rect(x, floorY, w, floorH, palette.floor);
  const row = 4 * u;
  for (let r = 0, fy = floorY; fy < y + h; r++, fy += row) {
    const rh = Math.min(row, y + h - fy);
    p.rect(x, fy, w, u, palette.floorDark);
    if (rh > 2 * u) p.rect(x, fy + u, w, u, alpha(palette.floorLight, 110));
    for (let jx = x + ((r * 13) % 24) * u; jx + u <= x + w; jx += 24 * u) p.rect(jx, fy, u, rh, palette.floorDark);
  }
}

export interface WindowOptions extends InteriorOptions {
  /** Perde rengi; verilirse pencerenin iki yanına perde ve korniş çizilir (kutunun dışına taşar). */
  curtain?: ColorInput;
}

/** Çerçeveli pencere: cam degradesi (gökyüzü), kayıt, denizlik, isteğe bağlı perde. En az 12u×12u. */
export function windowPane(p: Painter, x: number, y: number, w: number, h: number, sky: GradientStop[],
  palette: InteriorPalette = COZY_INTERIOR, opts: WindowOptions = {}): void {
  const u = unitOf(opts);
  box(w, h, 12 * u, 12 * u);
  const f = 2 * u;
  p.rect(x, y, w, h, palette.trim);
  p.vgrad(x + f, y + f, w - 2 * f, h - 2 * f, sky, { smooth: opts.smooth });
  const mx = x + Math.floor(w / 2 / u) * u - Math.floor(u / 2);
  const my = y + Math.floor(h / 2 / u) * u;
  p.rect(mx, y + f, u, h - 2 * f, palette.trim);
  p.rect(x + f, my, w - 2 * f, u, palette.trim);
  for (let i = 0; i < Math.min(w, h) / 3; i += u) p.rect(x + f + 2 * u + i, y + f + 5 * u - i, u, u, alpha("#ffffff", 70));
  p.rect(x - 2 * u, y + h, w + 4 * u, 2 * u, palette.trim);
  p.rect(x - 2 * u, y + h + 2 * u, w + 4 * u, u, alpha(palette.trimDark, 150));
  if (opts.curtain !== undefined) {
    const c = opts.curtain;
    p.rect(x - 7 * u, y - 4 * u, w + 14 * u, u, palette.trimDark);
    for (const side of [0, 1]) {
      const cx = side === 0 ? x - 5 * u : x + w - 2 * u;
      p.poly([[cx, y - 3 * u], [cx + 7 * u, y - 3 * u], [cx + (side === 0 ? 5 : 7) * u, y + h + 6 * u],
        [cx + (side === 0 ? 0 : 2) * u, y + h + 6 * u]], c);
      for (let k = 2 * u; k < 7 * u; k += 2 * u)
        p.line(cx + k, y - 2 * u, cx + k - (side === 0 ? 1 : -1) * u, y + h + 5 * u, alpha("#000000", 35));
    }
  }
}

export interface RugColors { base: ColorInput; border: ColorInput; pattern: ColorInput; }

/** Oval halı; sınır, zemin ve çevresinde nokta deseni. Kutu: cx±rx, cy±ry. */
export function rug(p: Painter, cx: number, cy: number, rx: number, ry: number, colors: RugColors,
  opts: InteriorOptions = {}): void {
  const u = unitOf(opts);
  if (rx < 6 * u || ry < 2 * u) throw new RangeError("rug must be at least 6u x 2u radius");
  p.ellipse(cx, cy, rx, ry, colors.border);
  p.ellipse(cx, cy, rx - u, ry - u * 0.6, colors.base);
  const n = Math.max(8, Math.round(rx / (3 * u)) * 2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    p.rect(Math.round(cx + Math.cos(a) * (rx - 3 * u)), Math.round(cy + Math.sin(a) * (ry - 1.6 * u)), u, u, colors.pattern);
  }
}

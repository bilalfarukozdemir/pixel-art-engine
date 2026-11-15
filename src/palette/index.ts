// ============================================================
// Palet araçları — renk rampası (hue shifting), renkli siyah,
// palet çıkarma ve palete indirgeme. Kaynak: recipes/color.md.
//
// Ana fikir: gölge yalnız "daha koyu" değil, tonu da kayan bir renktir.
// Işıklar sarıya (gökkuşağının en parlak tonu), gölgeler mavi-mora
// (en koyu ton) doğru en kısa yoldan kayar. Saf siyah yerine paletten
// türeyen koyu, renkli bir mürekkep kullanılır.
// Runtime-agnostik; RNG yok — aynı girdi her zaman aynı paleti verir.
// ============================================================
import type { Painter } from "../core/painter.js";
import { hex, toHsv, fromHsv, luma, colorDistance, type ColorInput, type RGBA } from "../core/color.js";

/** Işıkların kaydığı ton (sarı). */
export const HIGHLIGHT_HUE = 60;
/** Gölgelerin kaydığı ton (mavi-mor). */
export const SHADOW_HUE = 255;

/** h tonunu target'a en kısa yoldan en fazla deg derece yaklaştırır; hedefi geçmez. */
export function hueToward(h: number, target: number, deg: number): number {
  const d = ((target - h + 540) % 360) - 180;
  const step = Math.sign(d) * Math.min(Math.abs(d), Math.max(0, deg));
  return (h + step + 360) % 360;
}

/**
 * Doygunluk eğrisi — rampanın uçlarında doygunluk nasıl değişir:
 * - arc: iki uç da biraz donuk, orta tonlar canlı (varsayılan, en güvenli)
 * - flat: doygunluk sabit
 * - vividShadows: gölgeler canlı, ışıklar donuk
 * - vividHighlights: ışıklar canlı, gölgeler donuk
 */
export type SaturationCurve = "arc" | "flat" | "vividShadows" | "vividHighlights";

export interface RampOptions {
  /** Rampadaki renk sayısı (2..12). Küçük sprite'ta 3-4 yeter. Varsayılan 5. */
  steps?: number;
  /** Uçlarda tonun en fazla kaç derece kayacağı. 0 = kayma yok. Varsayılan 36. */
  hueShift?: number;
  /** En koyu rengin HSV değeri (0..1). Saf siyaha inmemek için varsayılan 0.2. */
  darkest?: number;
  /** En açık rengin HSV değeri (0..1). Varsayılan 0.97. */
  lightest?: number;
  saturation?: SaturationCurve;
}

function satAt(s0: number, t: number, side: "dark" | "light", curve: SaturationCurve): number {
  switch (curve) {
    case "flat": return s0;
    case "vividShadows":
      return side === "dark" ? s0 + (1 - s0) * 0.5 * t : s0 * (1 - 0.5 * t);
    case "vividHighlights":
      return side === "dark" ? s0 * (1 - 0.4 * t) : s0 + (1 - s0) * 0.35 * t;
    default:
      return side === "dark" ? s0 * (1 - 0.15 * t) : s0 * (1 - 0.45 * t);
  }
}

/**
 * Tek bir temel renkten koyudan açığa sıralı renk rampası üretir.
 * Temel renk rampada aynen yer alır (index: Math.floor(steps/2)); temelin
 * alfası bütün rampaya taşınır (yarı saydam malzeme yarı saydam kalır).
 * Koyu taraf SHADOW_HUE'ya, açık taraf HIGHLIGHT_HUE'ya doğru kayar.
 * Luma soldan sağa hiçbir seçenekte azalmaz; temel saf siyah değilse koyu
 * taraf, saf beyaz değilse açık taraf kesin artar (testle garanti).
 */
export function hueRamp(base: ColorInput, opts: RampOptions = {}): RGBA[] {
  const n = opts.steps ?? 5;
  if (!Number.isInteger(n) || n < 2 || n > 12) throw new RangeError("steps must be an integer 2..12");
  const shift = opts.hueShift ?? 36;
  if (!Number.isFinite(shift) || shift < 0 || shift > 180) throw new RangeError("hueShift must be 0..180");
  const curve = opts.saturation ?? "arc";
  const [h0, s0, v0] = toHsv(base);
  let vMin = opts.darkest ?? 0.2;
  let vMax = opts.lightest ?? 0.97;
  if (!(vMin >= 0 && vMax <= 1 && vMin < vMax)) throw new RangeError("darkest/lightest must satisfy 0 <= darkest < lightest <= 1");
  // Temel renk uçların dışında kalıyorsa ucu temele göre esnet.
  if (v0 <= vMin) vMin = v0 * 0.55;
  if (v0 >= vMax) vMax = Math.min(1, v0 + (1 - v0) * 0.5);
  const mid = Math.floor(n / 2);
  const B = hex(base);
  const out: RGBA[] = [];
  for (let i = 0; i < n; i++) {
    if (i === mid) { out.push([B[0], B[1], B[2], B[3]]); continue; }
    if (i < mid) {
      const t = (mid - i) / mid;
      const v = v0 - (v0 - vMin) * t;
      out.push(fromHsv(hueToward(h0, SHADOW_HUE, shift * t), satAt(s0, t, "dark", curve), v));
    } else {
      const t = (i - mid) / (n - 1 - mid);
      // Çok açık temelde değer artamıyorsa ışığı doygunluğu düşürerek ver.
      const v = v0 + (vMax - v0) * t;
      const s = v0 >= 0.95 ? s0 * (1 - 0.6 * t) : satAt(s0, t, "light", curve);
      out.push(fromHsv(hueToward(h0, HIGHLIGHT_HUE, shift * t), s, v));
    }
  }
  // Ton kayması bazı tonlarda luma sırasını bozabilir; komşu değişimini garanti et.
  // Taban (index mid) aynen kalır: koyu taraf tabandan sola doğru koyulaştırılarak,
  // açık taraf sağa doğru açılarak düzeltilir. Siyah gibi uçlarda eşitlik kalabilir.
  for (let i = mid - 1; i >= 0; i--) {
    let guard = 0;
    while (luma(out[i]) >= luma(out[i + 1]) && toHsv(out[i])[2] > 0 && guard++ < 40) {
      const [h, s, v] = toHsv(out[i]);
      out[i] = fromHsv(h, s, Math.max(0, v - 0.015));
    }
  }
  for (let i = mid + 1; i < n; i++) {
    let guard = 0;
    while (luma(out[i]) <= luma(out[i - 1]) && guard++ < 40) {
      const [h, s, v] = toHsv(out[i]);
      out[i] = fromHsv(h, s * 0.97, Math.min(1, v + 0.02));
    }
  }
  // Uç seçeneklerde (ör. darkest≈1, vividHighlights) yukarıdaki adım sınırı sırayı
  // kuramayabilir. Kalan ihlalleri kesin çöz; döngünün çözdüğü rampalara dokunulmaz.
  for (let i = mid - 1; i >= 0; i--) out[i] = darkerThan(out[i], luma(out[i + 1]));
  for (let i = mid + 1; i < n; i++) out[i] = lighterThan(out[i], luma(out[i - 1]));
  return out.map((c) => [c[0], c[1], c[2], B[3]] as RGBA);
}

/** c'yi luma'sı target'ın altına inene kadar koyulaştırır (ton ve doygunluk sabit). target=0 → siyah. */
function darkerThan(c: RGBA, target: number): RGBA {
  if (luma(c) < target) return c;
  const [h, s, v] = toHsv(c);
  if (target <= 0) return fromHsv(h, s, 0);
  // Sabit ton/doygunlukta luma, değer (v) ile doğru orantılı: doğrudan ölçekle, yuvarlamayı adımla düzelt.
  let vv = Math.min(v, (v * target) / luma(c)) * 0.98;
  let out = fromHsv(h, s, vv);
  while (luma(out) >= target && vv > 0) { vv = Math.max(0, vv - 1 / 255); out = fromHsv(h, s, vv); }
  return out;
}

/** c'yi luma'sı target'ın üstüne çıkana kadar açar: önce değeri, yetmezse doygunluğu düşürerek. target=1 → beyaz. */
function lighterThan(c: RGBA, target: number): RGBA {
  if (luma(c) > target) return c;
  const [h, s, v] = toHsv(c);
  if (target >= 1) return fromHsv(h, 0, 1);
  const lc = luma(c);
  let vv = lc > 0 ? Math.min(1, ((v * target) / lc) * 1.02) : 1;
  let out = fromHsv(h, s, vv);
  while (luma(out) <= target && vv < 1) { vv = Math.min(1, vv + 1 / 255); out = fromHsv(h, s, vv); }
  if (luma(out) > target) return out;
  // v=1'de bile yetmiyorsa doygunluğu azalt: beyaza yaklaştıkça luma artar (beyaz = 1 > target).
  let lo = 0, hi = s;
  for (let k = 0; k < 24; k++) {
    const m = (lo + hi) / 2;
    if (luma(fromHsv(h, m, 1)) > target) lo = m; else hi = m;
  }
  return fromHsv(h, lo, 1);
}

/**
 * Saf siyah yerine kullanılacak koyu, renkli "mürekkep": rengin tonunu
 * gölge yönüne kaydırır, değeri çok düşürür. Gri girdide koyu mor döner.
 */
export function inkOf(c: ColorInput, value = 0.16): RGBA {
  const [h, s] = toHsv(c);
  const hh = s < 0.08 ? 270 : hueToward(h, SHADOW_HUE, 30);
  return fromHsv(hh, Math.min(0.75, 0.35 + s * 0.4), value);
}

/** Sprite'taki benzersiz opak renkler (alfa >= minAlpha), koyudan açığa sıralı. */
export function paletteOf(p: Painter, minAlpha = 128): RGBA[] {
  const seen = new Map<number, RGBA>();
  const d = p.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < minAlpha) continue;
    const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    if (!seen.has(k)) seen.set(k, [d[i], d[i + 1], d[i + 2], 255]);
  }
  return [...seen.values()].sort((a, b) => luma(a) - luma(b));
}

/** Paletteki en yakın renk (colorDistance'a göre). */
export function nearestColor(c: ColorInput, palette: ReadonlyArray<ColorInput>): RGBA {
  if (palette.length === 0) throw new RangeError("palette must not be empty");
  let best = hex(palette[0]), bd = Infinity;
  for (const pc of palette) {
    const dd = colorDistance(c, pc);
    if (dd < bd) { bd = dd; best = hex(pc); }
  }
  return [best[0], best[1], best[2], 255];
}

/**
 * Sprite'ı palete indirger (yerinde değiştirir): alfa < alphaCut şeffaf olur,
 * kalan her piksel paletteki en yakın opak renge oturur. Ölçeklenmiş veya
 * döndürülmüş bir sprite'ı temizlemeden önceki "renk azaltma" adımı.
 */
export function quantize(p: Painter, palette: ReadonlyArray<ColorInput>, alphaCut = 128): Painter {
  const d = p.data;
  const cache = new Map<number, RGBA>();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < alphaCut) { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0; continue; }
    const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    let c = cache.get(k);
    if (!c) { c = nearestColor([d[i], d[i + 1], d[i + 2], 255], palette); cache.set(k, c); }
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  return p;
}

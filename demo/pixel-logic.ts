// Pixel Logic teknik tablosu — kitaptan eklenen araçların önce/sonra karşılaştırması.
// Çıktı: reports/pixel-logic.png (x4) ve reports/pixel-logic-native.png.
// Satırlar (yukarıdan aşağı):
//   1. Renk rampası: üstte yalnız koyulaştırma (shade), altta hueRamp.
//   2. Slime: solda düz gölge + saf siyah kontur, sağda hueRamp + aaEllipse + selectiveOutline;
//      her biri açık ve koyu zeminde.
//   3. Eğri: solda düzensiz adımlar (lint işaretli), sağda runCurve ile temiz eğri.
//   4. Dither: 0..16 dama ailesi şeridi, bantlı gökyüzü, izometrik kutular, subpiksel kareler.
import { mkdirSync, writeFileSync } from "node:fs";
import {
  Painter, shade, hueRamp, inkOf, outline, selectiveOutline, aaEllipse, runCurve,
  lintSprite, markIssues, formatLint, ditherRect, ditherBands, isoBox, subpixelShift,
} from "../src/index.js";
import { encodePng, upscale } from "../src/output/png.js";

const W = 256, H = 196;
const BG_LIGHT = "#e8e2d4", BG_DARK = "#1e1a2a", PANEL = "#f4efe4";

// ---- 1. Rampalar ----
function ramps(p: Painter, x: number, y: number): void {
  const bases = ["#a8805f", "#4a9e3c", "#3d5fc4", "#c43d4f", "#8b4fb0"];
  bases.forEach((b, bi) => {
    const flat = [0.45, 0.7, 1, 1.25, 1.5].map((f) => shade(b, f));
    const hue = hueRamp(b, { steps: 5 });
    for (let i = 0; i < 5; i++) {
      p.rect(x + bi * 48 + i * 8, y, 8, 8, flat[i]);
      p.rect(x + bi * 48 + i * 8, y + 9, 8, 8, hue[i]);
    }
  });
}

// ---- 2. Slime ----
function slimeBefore(): Painter {
  const s = new Painter(30, 26);
  const base = "#4a9e3c";
  s.ellipse(15, 15, 12, 9, shade(base, 0.6));
  s.ellipse(14, 14, 11, 8, base);
  s.ellipse(12, 11, 6, 4, shade(base, 1.35));
  s.rect(10, 13, 2, 3, "#000000"); s.rect(17, 13, 2, 3, "#000000");
  outline(s, "#000000");
  return s;
}
function slimeAfter(): Painter {
  const s = new Painter(30, 26);
  const r = hueRamp("#4a9e3c", { steps: 5 });
  const ink = inkOf(r[0]);
  // Yarıçaplar .5 eksik: tam sayı merkez + tam sayı yarıçap uçlarda
  // tek piksellik çıkıntı (nub) bırakır. aaEllipse şeffaf zeminde yalnız
  // >= %50 kapsanan pikselleri boyar, opak zeminde 1 ara ton ekler.
  aaEllipse(s, 15, 15, 11.5, 8.5, r[1]);
  // Ana ton ışığa (sol üst) doğru kaydırıldı: gölge sağ altta kalınlaşır,
  // kontura paralel ince şerit (pillow shading / banding) oluşmaz.
  aaEllipse(s, 12.5, 12.5, 9.5, 7, r[2]);
  aaEllipse(s, 12, 11, 5.5, 3.5, r[3]);
  s.px(9, 9, r[4]); s.px(10, 9, r[4]); s.px(9, 10, r[4]);
  s.rect(10, 13, 2, 3, ink); s.rect(17, 13, 2, 3, ink);
  s.px(10, 13, r[4]); s.px(17, 13, r[4]);
  selectiveOutline(s, { light: [-1, -1], palette: [ink, ...r] });
  return s;
}

// ---- 3. Eğri ----
function curve(clean: boolean): Painter {
  const c = new Painter(34, 26);
  if (clean) runCurve(c, 2, 22, [4, 3, 2, 1, 1, 1, 1], [2, 3, 4, 8], 1, -1, "#2b1d24");
  else runCurve(c, 2, 22, [4, 3, 2, 1, 1, 1], [2, 1, 3, 2, 3, 8], 1, -1, "#2b1d24");
  return c;
}

const p = new Painter(W, H);
p.fill(PANEL);

ramps(p, 8, 6);

// slime satırı: açık zemin + koyu zemin, önce | sonra
const before = slimeBefore(), after = slimeAfter();
p.rect(8, 30, 116, 34, BG_LIGHT); p.rect(132, 30, 116, 34, BG_DARK);
p.blit(before, 14, 34); p.blit(after, 54, 34);
p.blit(before, 138, 34); p.blit(after, 178, 34);
p.rect(92, 32, 30, 30, BG_DARK); p.rect(216, 32, 30, 30, BG_LIGHT); // ters zemin örnekleri
const smallAfter = slimeAfter();
p.blit(smallAfter, 92, 35); p.blit(smallAfter, 216, 35);

// eğri satırı
const bad = curve(false), good = curve(true);
const badMarked = markIssues(bad, lintSprite(bad));
p.rect(8, 70, 116, 34, "#ffffff"); p.rect(132, 70, 116, 34, "#ffffff");
p.blit(badMarked, 20, 74); p.blit(bad, 70, 74);
p.blit(good, 144, 74); p.blit(good, 194, 74);

// dither şeridi: 17 seviye
for (let lv = 0; lv <= 16; lv++) ditherRect(p, 8 + lv * 7, 112, 7, 14, "#2a3a6a", "#9fc4e0", lv);
// bantlı gökyüzü
ditherBands(p, 132, 112, 116, 30, ["#2a2350", "#5a4f9a", "#d88a8a", "#f6d6a0"], { levels: 3 });
// izometrik kutular
const ramp = hueRamp("#b8875a", { steps: 5 });
isoBox(p, 30, 150, 24, 10, { top: ramp[3], left: ramp[2], right: ramp[1] });
isoBox(p, 66, 156, 16, 6, { top: ramp[3], left: ramp[2], right: ramp[1] });
isoBox(p, 54, 168, 8, 4, { top: ramp[4], left: ramp[2], right: ramp[1] });
// subpiksel: orijinal, yarım piksel sağ, tam piksel sağ
const blob = new Painter(16, 14);
const br = hueRamp("#c43d4f", { steps: 4 });
blob.ellipse(8, 8, 5, 4, br[1]); blob.ellipse(7, 7, 4, 3, br[2]); blob.ellipse(6, 6, 2, 1, br[3]);
outline(blob, inkOf(br[1]));
const half = subpixelShift(blob, 1, 0);
const full = new Painter(16, 14); full.blit(blob, 1, 0);
p.rect(132, 148, 116, 40, BG_DARK);
p.blit(blob, 146, 160); p.blit(half, 176, 160); p.blit(full, 206, 160);

mkdirSync("reports", { recursive: true });
writeFileSync("reports/pixel-logic-native.png", encodePng(p));
const big = new Painter(W * 4, H * 4);
big.data.set(upscale(p, 4));
writeFileSync("reports/pixel-logic.png", encodePng(big));

console.log("Önce/sonra slime lint:");
console.log(formatLint(lintSprite(before)));
console.log(formatLint(lintSprite(after)));
console.log("Düzensiz eğri lint:\n" + formatLint(lintSprite(bad)));
console.log("Üretildi: reports/pixel-logic.png");

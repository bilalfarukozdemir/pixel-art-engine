// Demo sahne 3: çadırın önünde kamp ateşi yakmış dinlenen yaşlı adam —
// stars + embers + glow + hoodedFigure motiflerini gerçek bir
// kompozisyonda birleştiren test. 2. sürümde tuval 2x büyütüldü, asa,
// ateş taşları, çadır ipi/kazık ve uzak tepe silüeti eklendi.
import { Painter } from "../../src/core/painter.js";
import { mulberry32 } from "../../src/core/rng.js";
import { alpha, shade } from "../../src/core/color.js";
import { stars, embers, glow, hoodedFigure } from "../../src/motifs/index.js";
import { DP } from "../palette.js";

export function buildCampfireElder(seed = 3): Painter {
  const w = 80, h = 64;
  const p = new Painter(w, h);
  const rng = mulberry32(seed);

  p.vgrad(0, 0, w, h, [
    { t: 0, color: DP.night2 },
    { t: 0.6, color: DP.night1 },
    { t: 1, color: DP.night0 },
  ]);
  stars(p, 0, 0, w, 22, 26, rng, DP.starDust);

  // uzak tepe silüeti
  p.poly([[0, 44], [14, 30], [26, 40], [40, 26], [52, 38], [80, 32], [80, 46], [0, 46]], shade(DP.night2, 1.15));

  const groundY = 52;
  p.rect(0, groundY, w, h - groundY, DP.night0);

  // çadır + ip/kazık
  p.poly([[52, groundY], [60, groundY - 20], [76, groundY - 20], [72, groundY]], DP.canvas1);
  p.poly([[60, groundY - 20], [64, groundY - 26], [68, groundY - 20]], DP.canvas2);
  p.hline(60, groundY - 20, 12, DP.canvas0);
  p.rect(62, groundY - 8, 6, 8, DP.night0); // çadır girişi (karanlık)
  p.line(76, groundY, 80, groundY - 6, DP.clothDark); // germe ipi
  p.line(80, groundY - 6, 80, groundY - 4, DP.clothDark);
  p.px(80, groundY - 6, shade(DP.clothDark, 1.4)); // kazık

  // kamp ateşi + çevresindeki taşlar
  const fireX = 28, fireY = groundY - 4;
  for (const [dx, dy] of [[-4, 2], [-2, 3], [2, 3], [4, 2], [0, 4]]) {
    p.ellipse(fireX + dx, fireY + dy, 1.6, 1.1, DP.steelDark);
  }
  embers(p, fireX - 5, fireY - 11, 10, 10, 10, rng, [DP.ember2, "#f2925a", DP.flame]);
  glow(p, fireX, fireY - 3, 3.5, DP.flame, DP.ember2, 0.9, { rng, flicker: 0.4 });
  p.poly([[fireX - 3, fireY], [fireX, fireY - 9], [fireX + 3, fireY]], DP.ember1);
  p.poly([[fireX - 1.5, fireY], [fireX, fireY - 5], [fireX + 1.5, fireY]], DP.flame);
  p.line(fireX - 5, fireY + 1, fireX + 5, fireY - 2, DP.canvas0);
  p.line(fireX - 5, fireY - 2, fireX + 5, fireY + 1, DP.canvas0);

  // yaşlı adam (oturan, ateşe dönük) + elinde asa
  const figX = fireX + 18;
  hoodedFigure(p, figX, groundY, 24, DP.clothMid, {
    seated: true,
    rim: -1,
    emberColor: DP.ember2,
    brightEmberColor: DP.flame,
  });
  p.line(figX + 6, groundY - 2, figX + 9, groundY - 22, DP.canvas0); // asa
  p.px(figX + 9, groundY - 22, shade(DP.canvas0, 1.5));

  p.scatter(0, groundY + 2, w, h - groundY - 2, alpha(DP.starDust, 15), 30, rng); // zemin dokusu

  return p;
}

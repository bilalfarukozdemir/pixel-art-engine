// Demo sahne 2: göğsüne bıçak saplanmış, kanlar içinde yatan goblin —
// yara/kan efekti motorda hiç yoktu, elle bileşenlerden kompoze edildi.
// 2. sürümde tuval 2x büyütüldü, yüz detayı (göz/burun/ağız), kan
// sızıntı damarları ve bıçak kabza sarımı eklendi.
import { Painter } from "../../src/core/painter.js";
import { alpha, shade } from "../../src/core/color.js";
import { mulberry32 } from "../../src/core/rng.js";
import { veins } from "../../src/motifs/index.js";
import { DP } from "../palette.js";

export function buildGoblinCorpse(seed = 2): Painter {
  const w = 80, h = 56;
  const p = new Painter(w, h);
  const rng = mulberry32(seed);

  p.vgrad(0, 0, w, h, [
    { t: 0, color: DP.night1 },
    { t: 1, color: DP.night0 },
  ]);

  const groundY = 40;

  // kan göleti (iki katman + sızıntı damarları)
  p.poly(
    [
      [20, groundY + 2], [28, groundY - 2], [40, groundY - 4], [54, groundY - 2],
      [60, groundY + 4], [56, groundY + 10], [40, groundY + 12], [24, groundY + 10], [18, groundY + 6],
    ],
    DP.blood0,
  );
  p.poly(
    [
      [24, groundY], [32, groundY - 2], [44, groundY - 2], [52, groundY],
      [48, groundY + 6], [30, groundY + 6],
    ],
    DP.blood1,
  );
  veins(p, 40, groundY + 3, 14, rng, DP.blood2, DP.bloodBright);
  veins(p, 34, groundY + 5, 8, rng, DP.blood2, DP.bloodBright);
  p.scatter(18, groundY - 4, 44, 16, alpha(DP.bloodBright, 90), 18, rng);

  // gövde (yatık, hafif kıvrık)
  const bodyC = DP.goblinSkin0;
  p.poly(
    [
      [24, groundY - 4], [32, groundY - 10], [48, groundY - 10], [58, groundY - 6],
      [54, groundY - 2], [30, groundY - 2],
    ],
    bodyC,
  );
  p.line(30, groundY - 9, 50, groundY - 9, shade(bodyC, 1.3)); // sırt vurgusu

  // kafa + yüz detayı
  const hx = 20, hy = groundY - 8;
  p.ellipse(hx, hy, 6.4, 5.2, DP.goblinSkin1);
  p.poly([[hx - 5, hy - 5], [hx - 9, hy - 3], [hx - 5, hy + 1]], DP.goblinSkin0); // kulak
  p.line(hx - 3, hy - 1, hx, hy - 1, DP.night0); // kapalı göz
  p.px(hx + 2, hy + 1, shade(DP.goblinSkin1, 0.8)); // burun deliği
  p.line(hx - 1, hy + 3, hx + 3, hy + 3, DP.night0); // ağız
  p.px(hx + 3, hy + 2, DP.steelGlint); // diş ucu

  // kollar / bacaklar (kalınlaştırılmış çizgi çiftleri)
  p.line(36, groundY - 4, 32, groundY + 4, DP.goblinSkin0);
  p.line(37, groundY - 4, 33, groundY + 4, DP.goblinSkin0);
  p.line(48, groundY - 4, 54, groundY + 6, DP.goblinSkin0);
  p.line(49, groundY - 4, 55, groundY + 6, DP.goblinSkin0);
  p.line(40, groundY - 2, 44, groundY + 8, DP.goblinSkin1);
  p.line(41, groundY - 2, 45, groundY + 8, DP.goblinSkin1);

  // bel kemeri
  p.hline(30, groundY - 3, 20, DP.clothDark);
  p.px(40, groundY - 3, DP.steel);

  // göğsüne saplanmış bıçak + kabza sarımı
  const kx = 40, ky = groundY - 8;
  p.line(kx, ky, kx + 10, ky - 6, DP.steel);
  p.line(kx + 1, ky - 1, kx + 10, ky - 6, shade(DP.steel, 1.3));
  p.px(kx + 10, ky - 6, DP.steelGlint);
  p.line(kx, ky, kx - 4, ky + 2, DP.clothDark);
  for (let i = 0; i < 3; i++) p.px(kx - 1 - i, ky + i * 0.6, shade(DP.clothDark, 1.4));
  p.px(kx - 2, ky, DP.blood2);
  p.px(kx, ky - 2, DP.bloodBright);
  p.px(kx + 1, ky - 1, DP.bloodBright);

  return p;
}

// Demo sahne 4: karanlıkta çalıların arasından sadece gözleri ve
// kılıcının ucu görünen gizemli figür — negative space / "az ile çok
// anlatma" testi. 2. sürümde tuval 2x büyütüldü, pelerin kıvrımı
// (katmanlı poly), kılıç kabzası/el ipucu ve katmanlı çalı derinliği
// eklendi.
import { Painter } from "../../src/core/painter.js";
import { alpha, shade } from "../../src/core/color.js";
import { mulberry32 } from "../../src/core/rng.js";
import { fogBand, deadTree, glow } from "../../src/motifs/index.js";
import { DP } from "../palette.js";

export function buildHiddenFigure(seed = 4): Painter {
  const w = 64, h = 80;
  const p = new Painter(w, h);
  const rng = mulberry32(seed);

  p.fill(DP.night0);
  fogBand(p, h - 16, 8, DP.fogTeal, rng, 30);

  // arka plan çalı katmanı (uzak, en koyu)
  for (let i = 0; i < 8; i++) {
    const x = rng() * w;
    const bh = 10 + rng() * 14;
    deadTree(p, x, h - 12, bh, DP.bush0, rng);
  }

  const fx = w / 2, fy = h - 20;

  // pelerin (katmanlı — dış siluet + iç ton farkı, kıvrım hissi)
  p.poly(
    [[fx - 8, fy + 4], [fx - 6, fy - 18], [fx + 6, fy - 18], [fx + 8, fy + 4]],
    shade(DP.night1, 1.35),
  );
  p.poly(
    [[fx - 6, fy + 4], [fx - 5, fy - 14], [fx - 1, fy - 16], [fx - 1, fy + 4]],
    shade(DP.night1, 1.55),
  ); // sol kıvrım vurgusu
  p.poly(
    [[fx + 2, fy + 4], [fx + 2, fy - 15], [fx + 6, fy - 12], [fx + 6, fy + 4]],
    shade(DP.night1, 1.2),
  ); // sağ kıvrım gölgesi
  p.line(fx - 4, fy - 8, fx - 3, fy + 4, shade(DP.night1, 1.7)); // kıvrım çizgisi
  p.line(fx + 3, fy - 6, fx + 4, fy + 4, shade(DP.night1, 1.1));

  // kapüşon (biraz daha koyu, hafif öne eğik)
  p.ellipse(fx, fy - 20, 5, 4.5, shade(DP.night1, 1.4));

  // gözler — küçük, keskin, tek piksel + ince hale
  p.px(fx - 2, fy - 21, DP.eyeGlow);
  p.px(fx + 2, fy - 21, DP.eyeGlow);
  glow(p, fx - 2, fy - 21, 0.4, DP.eyeGlow, DP.eyeGlow, 0.35);
  glow(p, fx + 2, fy - 21, 0.4, DP.eyeGlow, DP.eyeGlow, 0.35);

  // kılıç: kabza + el ipucu + parlak uç
  p.line(fx + 7, fy + 2, fx + 6, fy - 4, DP.clothDark); // kabza
  p.px(fx + 6, fy - 1, shade(DP.night1, 1.6)); // el ipucu (parmak koyu leke)
  p.line(fx + 6, fy - 4, fx + 12, fy - 20, DP.steelDark); // ağız
  p.px(fx + 12, fy - 20, DP.steelGlint);
  p.px(fx + 11.3, fy - 19.2, alpha(DP.steelGlint, 160));

  // ön plan çalı (figürü kısmen gizleyen, en koyu/en yakın katman)
  p.poly(
    [[0, h], [0, h - 24], [10, h - 18], [16, h - 28], [26, h - 16], [16, h], [0, h]],
    DP.bush1,
  );
  p.poly(
    [[w, h], [w, h - 20], [w - 14, h - 26], [w - 8, h - 14], [w - 24, h - 19], [w - 16, h]],
    DP.bush0,
  );
  p.scatter(0, h - 30, w, 30, alpha(DP.bush1, 60), 20, rng); // yaprak dokusu

  return p;
}

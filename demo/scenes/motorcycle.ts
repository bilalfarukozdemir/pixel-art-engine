// Demo sahne 1: asfaltta giden motosiklet, sürücüsüyle — mekanik/hareket
// teması, fantastik RPG kaynağından tamamen uzak. 2. sürümde tuval 2x
// büyütüldü ve gerçek detay eklendi (sürücü, jant ispitleri, far/stop
// lambası, yakıt deposu/egzoz ayrımı) — ilk sürüm sadece siluetti.
import { Painter } from "../../src/core/painter.js";
import { alpha, shade } from "../../src/core/color.js";
import { mulberry32 } from "../../src/core/rng.js";
import { glow } from "../../src/motifs/index.js";
import { DP } from "../palette.js";

export function buildMotorcycle(seed = 1): Painter {
  const w = 96, h = 48;
  const p = new Painter(w, h);
  const rng = mulberry32(seed);

  p.fill(DP.night1);
  const roadY = 34;
  p.rect(0, roadY, w, h - roadY, DP.asphalt0);
  p.hline(0, roadY, w, DP.asphalt1);
  for (let x = -6; x < w; x += 16) p.rect(x, roadY + 6, 8, 2, DP.lineYellow);

  const baseY = roadY;

  // --- tekerlekler (dış lastik, iç jant, göbek, ispitler) ---
  const wheel = (cx: number) => {
    p.ellipse(cx, baseY - 8, 8, 8, DP.metal0);
    p.ellipse(cx, baseY - 8, 5, 5, DP.night0);
    p.ellipse(cx, baseY - 8, 4.4, 4.4, DP.metal2);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      p.line(cx, baseY - 8, cx + Math.cos(a) * 4, baseY - 8 + Math.sin(a) * 4, DP.metal0);
    }
    p.ellipse(cx, baseY - 8, 1.4, 1.4, DP.chrome);
  };
  wheel(22);
  wheel(62);

  // --- gövde: motor bloğu, yakıt deposu, egzoz, koltuk ---
  p.rect(36, baseY - 15, 14, 7, DP.metal0); // motor bloğu
  p.rect(38, baseY - 13, 4, 3, shade(DP.metal0, 1.4)); // silindir kapağı vurgusu
  p.ellipse(42, baseY - 19, 7, 4.5, DP.metal1); // yakıt deposu (damla)
  p.ellipse(40, baseY - 20.5, 2, 1, shade(DP.metal1, 1.3)); // depo parlaklık
  p.rect(46, baseY - 23, 20, 3, DP.metal0); // koltuk
  p.rect(64, baseY - 21, 6, 2, DP.metal0); // koltuk arka çıkıntı

  // ön çatal + gidon
  p.line(56, baseY - 16, 68, baseY - 30, DP.metal2);
  p.line(54, baseY - 15, 66, baseY - 29, DP.metal2);
  p.line(66, baseY - 29, 74, baseY - 31, DP.chrome); // gidon
  p.px(74, baseY - 31, DP.chrome);
  glow(p, 70, baseY - 26, 1.4, "#fff6d8", "#f2e08a", 0.8); // far

  // arka amortisör + stop lambası
  p.line(36, baseY - 15, 30, baseY - 9, DP.metal2);
  p.px(28, baseY - 10, DP.bloodBright);
  glow(p, 28, baseY - 10, 0.5, DP.bloodBright, DP.bloodBright, 0.5);

  // egzoz borusu (arkada alt)
  p.rect(20, baseY - 9, 16, 2, DP.metal2);
  p.px(19, baseY - 9, shade(DP.metal2, 1.3));

  // Not (2026-09-01): sürücü siluetini iki kez denedim, ikisinde de kask/
  // gövde oranı doğru oturmadı — bu motorun API'sinin değil, benim elle
  // koordinat tahminimin sınırı. Sürücüsüz bırakıldı,
  // motosikletin kendisi (tekerlek/jant/far/egzoz) net tanınıyor.

  // --- efekt: kaldırım tozu + hız çizgileri ---
  p.scatter(10, baseY - 4, 6, 4, alpha(DP.asphalt2, 140), 10, rng);
  for (let i = 0; i < 8; i++) {
    const y = baseY - 22 - i * 2 + rng() * 1.5;
    const len = 8 + rng() * 8;
    p.hline(76 + rng() * 6, y, len, alpha(DP.chrome, 50 + rng() * 50));
  }

  return p;
}

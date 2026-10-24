// Demo sahne 3'ün "duvar kağıdı" sürümü — sahne tam ekran masaüstü
// gibi düşünülüp büyütüldü ve detaylandırıldı. 384×216 (16:9, ×5 ile 1920×1080'e tam oturur) —
// gerçek pixel-art duvar kağıtlarının tipik native çözünürlüğü; 1920×1080'i
// native çizmek piksel sanatın "her piksel görünür/kasıtlı" karakterini
// bozar, bu yüzden native tuval burada büyütülüp upscale edilir (build
// script'inde), tıpkı bir oyun motorunun 320×180 render edip ekrana
// ölçeklemesi gibi.
import { Painter } from "../../src/core/painter.js";
import { alpha, shade, mix } from "../../src/core/color.js";
import { mulberry32 } from "../../src/core/rng.js";
import { stars, embers, glow, hoodedFigure, orb } from "../../src/motifs/index.js";
import { DP } from "../palette.js";

/**
 * Çoklu frekanslı sinüs toplamı — doğal alev titreşimi hissi, t=0 ve t=1
 * aynı değeri verir (loop-uyumlu). Baskın bileşen 1 frekans (yavaş "nefes"),
 * üstüne küçük genlikli 2.5 ve 5 frekans (ince çıtırtı) biniyor — ilk
 * sürümde 3/7/11 kullanılmıştı ve gerçek dışı hızlı yanıp sönüyordu.
 */
function fireFlicker(t: number, phase = 0): number {
  const a = t * Math.PI * 2;
  return 0.78 + 0.14 * Math.sin(a * 1 + phase) + 0.06 * Math.sin(a * 2.5 + phase * 1.7 + 1.3) + 0.03 * Math.sin(a * 5 + phase * 2.3 + 2.7);
}

/** Tek frekanslı, yavaş "nefes alma" — ışık kaynaklarının halesi için (0..1, loop-uyumlu). */
function slowBreath(t: number, phase = 0): number {
  return (Math.sin(t * Math.PI * 2 + phase) + 1) / 2;
}

/**
 * `frameT` (0..1, döngüsel) ateşin animasyon konumunu belirler, `fireStep`
 * kare indeksidir (kıvılcım deseni için). Sahnenin geri kalanı (dağ,
 * yıldız, adam, çadır) `seed` ile deterministik ve karadan kareye birebir
 * aynı kalır çünkü ana `rng`'nin çağrı SAYISI ve SIRASI hiçbir zaman
 * `frameT`/`fireStep`'e bağlı değil — sadece ateşin kıvılcımları ayrı bir
 * `fireRng` ile, çim tutamlarının birkaçı ise çizim SIRASINDA değişmeyen
 * bir offset'le hareket ediyor.
 */
export function buildCampfireElderWallpaper(seed = 3, frameT = 0, fireStep = 0): Painter {
  const w = 384, h = 216;
  const p = new Painter(w, h);
  const rng = mulberry32(seed);
  // kıvılcım deseni her karede değil, her 3 karede bir değişir — sürekli
  // beyaz gürültü yerine daha sakin, kademeli bir hareket hissi
  const fireRng = mulberry32(seed * 1000 + Math.floor(fireStep / 3));

  // --- gökyüzü ---
  p.vgrad(0, 0, w, h, [
    { t: 0, color: DP.night2 },
    { t: 0.55, color: DP.night1 },
    { t: 1, color: DP.night0 },
  ]);
  orb(p, 64, 34, 9, "#e9e4cf", "#c9c2a0"); // ay
  stars(p, 0, 0, w, 40, 60, rng, DP.starDust); // uzak/sönük yıldızlar
  stars(p, 0, 0, w, 90, 30, rng, "#e9e4cf"); // yakın/parlak yıldızlar

  // --- uzak dağ katmanları (parallax hissi) ---
  p.poly(
    [[0, 128], [40, 96], [90, 118], [150, 84], [210, 112], [270, 92], [330, 116], [384, 100], [384, 140], [0, 140]],
    shade(DP.night2, 1.12),
  );
  p.poly(
    [[0, 150], [60, 122], [130, 144], [190, 116], [250, 146], [320, 126], [384, 148], [384, 165], [0, 165]],
    shade(DP.night2, 1.28),
  );

  const groundY = 162;

  // --- zemin ---
  p.rect(0, groundY, w, h - groundY, DP.night0);
  p.vgrad(0, groundY, w, 14, [
    { t: 0, color: shade(DP.night0, 1.4) },
    { t: 1, color: DP.night0 },
  ]);
  // çim tutamları — her 9.'su rüzgarda yavaşça sallanıyor (rng çağrı
  // sayısı/sırası frameT'den bağımsız kalıyor, sadece uç noktaya offset ekleniyor)
  for (let i = 0; i < 90; i++) {
    const gx = rng() * w, gy = groundY + 2 + rng() * (h - groundY - 4);
    const gc = rng() < 0.5 ? "#1c2a15" : "#243318";
    const sway = i % 9 === 0 ? Math.sin(frameT * Math.PI * 2 + i) * 1.3 : 0;
    p.line(gx, gy, gx - 1 + rng() * 2 + sway, gy - 2 - rng() * 2, gc);
  }
  // dağınık taşlar
  for (let i = 0; i < 10; i++) {
    const sx = rng() * w, sy = groundY + 6 + rng() * (h - groundY - 10);
    p.ellipse(sx, sy, 1.6 + rng() * 1.4, 1 + rng() * 0.8, DP.night2);
    p.px(sx - 1, sy - 1, shade(DP.night2, 1.5));
  }

  // ==================== KAMP ATEŞİ ====================
  const fireX = 96, fireY = groundY - 6;

  // zemine ateşten vuran ışık çemberi (kamp.mjs referansı: iç içe düşük-alfa
  // ellipse'ler, glow'dan ayrı — glow ateşin kendisi, bu zeminin ısınması)
  p.ellipse(fireX, fireY + 3, 34, 12, alpha(DP.ember0, 24));
  p.ellipse(fireX, fireY + 3, 25, 9, alpha(DP.ember1, 20));
  p.ellipse(fireX, fireY + 2, 16, 6, alpha(DP.ember1, 26));
  p.ellipse(fireX, fireY + 2, 9, 4, alpha(DP.ember2, 28));

  // dip gölgesi (ateşi zemine bağlar)
  p.hline(fireX - 12, fireY + 7, 24, alpha(DP.night0, 130));

  // taş halkası — ateşe bakan iç yüzü ısıtılmış (mix ile yönlü ışık)
  for (const a of [-24, -16, -8, 0, 8, 16, 24]) {
    const tx = fireX + a * 0.9, ty = fireY + 6 + Math.abs(a) * 0.12;
    p.ellipse(tx, ty, 3.2, 2.2, DP.night2);
    p.px(tx - Math.sign(a || 1), ty - 1, mix(DP.night2, DP.ember1, 0.35)); // ateşe bakan taraf
  }
  // odun yığını — üst yüzü kor rengiyle karışmış
  p.line(fireX - 10, fireY + 3, fireX + 9, fireY - 4, mix(DP.canvas0, DP.ember0, 0.2));
  p.line(fireX - 9, fireY + 4, fireX + 10, fireY - 3, mix(DP.canvas0, DP.ember1, 0.3));
  p.line(fireX - 8, fireY + 2, fireX + 7, fireY + 6, shade(DP.canvas0, 0.8));

  // alev — 3 katman + embers + glow, hepsi frameT'ye bağlı titreşiyor
  const glowFlicker = fireFlicker(frameT);
  const h1 = fireFlicker(frameT, 2.1), h2 = fireFlicker(frameT, 4.4), h3 = fireFlicker(frameT, 0.6);
  embers(p, fireX - 10, fireY - 24, 20, 22, 26, fireRng, [DP.ember2, "#f2925a", DP.flame]);
  glow(p, fireX, fireY - 8, 6 + glowFlicker * 1.6, DP.flame, DP.ember2, glowFlicker, { rng: fireRng, flicker: 0.6 });
  p.poly([[fireX - 7, fireY], [fireX - 2, fireY - 20 * h1], [fireX + 3, fireY - 10 * h1], [fireX + 8, fireY - 22 * h1], [fireX + 8, fireY]], DP.ember0);
  p.poly([[fireX - 5, fireY], [fireX - 1, fireY - 16 * h2], [fireX + 2, fireY - 9 * h2], [fireX + 6, fireY - 17 * h2], [fireX + 6, fireY]], DP.ember1);
  p.poly([[fireX - 3, fireY], [fireX, fireY - 11 * h3], [fireX + 3, fireY]], DP.flame);
  // uçuşan kıvılcımlar (her kare farklı fireRng ile — kareler arası hareket eder)
  for (let i = 0; i < 14; i++) {
    const kx = fireX + (fireRng() - 0.5) * 20;
    const ky = fireY - 20 - fireRng() * 30;
    p.px(kx, ky, alpha(DP.flame, 80 + fireRng() * 150));
  }
  // havadaki sıcak parıltı (alevin üstünde yükselen ısı hissi, glow'dan ayrı)
  p.ellipse(fireX, fireY - 26, 10, 8, alpha(DP.ember1, 22));
  p.ellipse(fireX, fireY - 22, 7, 6, alpha(DP.ember2, 28));

  // duman — yukarı süzülen, yükseldikçe SOLAN, 3 piksel kalınlıkta (tek
  // pikselden daha görünür). Sabit rng (frameT'den bağımsız), sahnenin ana
  // rng çağrı sırasını etkilemesin diye ayrı bir kaynak.
  const smokeRng = mulberry32(seed + 777);
  let smokeX = fireX;
  for (let y = fireY - 22; y > 6; y--) {
    if (smokeRng() < 0.45) smokeX += smokeRng() < 0.5 ? 1 : -1;
    const fade = Math.max(0, Math.min(1, (y - 6) / (fireY - 28)));
    const a = (28 + smokeRng() * 34) * fade;
    p.px(smokeX, y, alpha("#7d756d", a));
    if (smokeRng() < 0.5) p.px(smokeX + (smokeRng() < 0.5 ? 1 : -1), y, alpha("#7d756d", a * 0.6));
  }

  // ==================== YAŞLI ADAM ====================
  const figX = fireX + 62;
  hoodedFigure(p, figX, groundY, 54, DP.clothMid, {
    seated: true,
    rim: -1,
    emberColor: DP.ember2,
    brightEmberColor: DP.flame,
  });
  // pelerin kıvrım detayları — ateşe bakan (sol) kenar ısıtılmış (yarı saydam,
  // px'in blend'i devreye girsin diye — opak mix "yama" gibi sert duruyordu),
  // arka (sağ) soğuk
  p.line(figX - 6, groundY - 8, figX - 4, groundY - 32, alpha(DP.ember2, 90));
  p.line(figX + 4, groundY - 6, figX + 6, groundY - 30, shade(DP.clothMid, 0.75));
  // dip gölgesi (adamı zemine bağlar)
  p.hline(figX - 10, groundY + 1, 20, alpha(DP.night0, 130));
  // elinde asa + üstünde parıldayan taş
  const staffX = figX + 13, staffTopY = groundY - 50;
  p.line(staffX - 2, groundY - 4, staffX, staffTopY, DP.canvas0);
  p.line(staffX - 1, groundY - 4, staffX + 1, staffTopY, shade(DP.canvas0, 1.3));
  const staffBreath = slowBreath(frameT, 1.5); // faz ateşten farklı, senkron sallanmasın
  glow(p, staffX, staffTopY - 2, 2.2 + staffBreath * 0.7, "#a8e0d6", DP.fogTeal, 0.55 + staffBreath * 0.3, { rng, flicker: 0.3 });
  // yanında heybe — üstü ışık alan, altı gölgede + kendi dip gölgesi
  p.ellipse(figX - 14, groundY - 4, 5, 4, DP.canvas0);
  p.ellipse(figX - 15, groundY - 5.5, 2.6, 1.6, mix(DP.canvas1, DP.ember1, 0.25));
  p.line(figX - 17, groundY - 7, figX - 11, groundY - 7, DP.canvas1);
  p.hline(figX - 19, groundY, 10, alpha(DP.night0, 110));

  // ==================== ÇADIR ====================
  const tx0 = 260;
  // sol (ateşe bakan) yüz hafifçe ısıtılmış, sağ (arka) yüz soğuk gölgede
  p.poly([[tx0, groundY], [tx0 + 24, groundY - 56], [tx0 + 70, groundY - 56], [tx0 + 94, groundY]], mix(DP.canvas1, DP.ember0, 0.12));
  p.poly([[tx0 + 24, groundY - 56], [tx0 + 47, groundY - 70], [tx0 + 70, groundY - 56]], mix(DP.canvas2, DP.ember0, 0.1));
  // gölge tarafı (sağ yarı biraz koyu)
  p.poly([[tx0 + 47, groundY], [tx0 + 70, groundY - 56], [tx0 + 94, groundY]], shade(DP.canvas1, 0.82));
  p.poly([[tx0 + 47, groundY - 70], [tx0 + 70, groundY - 56], [tx0 + 47, groundY - 56]], shade(DP.canvas2, 0.85));
  // dip gölgesi (çadırı zemine bağlar)
  p.hline(tx0 - 4, groundY + 1, 102, alpha(DP.night0, 120));
  // yamalar/dikiş çizgileri
  p.hline(tx0 + 24, groundY - 56, 46, DP.canvas0);
  p.line(tx0 + 47, groundY - 70, tx0 + 47, groundY, alpha(DP.canvas0, 90));
  // giriş
  p.poly([[tx0 + 38, groundY], [tx0 + 44, groundY - 30], [tx0 + 56, groundY - 30], [tx0 + 60, groundY]], DP.night0);
  // ip germe + kazıklar
  for (const [ex, ey] of [[tx0 - 12, groundY], [tx0 + 106, groundY]] as const) {
    const anchorX = ex < tx0 ? tx0 + 6 : tx0 + 88;
    const anchorY = ex < tx0 ? groundY - 40 : groundY - 40;
    p.line(anchorX, anchorY, ex, ey, DP.clothDark);
    p.px(ex, ey, shade(DP.clothDark, 1.5));
    p.line(ex, ey, ex, ey - 5, shade(DP.clothDark, 1.4));
  }
  // çadır önünde küçük fener — kendi yavaş nefesiyle, asa ve ateşten farklı fazda
  const lanternBreath = slowBreath(frameT, 3.8);
  glow(p, tx0 - 4, groundY - 10, 1.4 + lanternBreath * 0.5, DP.flame, DP.ember2, 0.4 + lanternBreath * 0.25);

  // hafif zemin sisi (atmosfer)
  for (let x = 0; x < w; x += 2) {
    const fy = groundY - 2 + Math.sin(x * 0.08 + seed) * 1.5;
    p.px(x, fy, alpha(DP.fogTeal, 18));
  }

  p.vignette(0.32); // Veyra referansı (kamp.mjs): her sahnenin son adımı
  return p;
}

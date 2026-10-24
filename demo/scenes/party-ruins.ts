// "party-ruins" — bir referans görselden (fantezi
// illüstrasyon: minotor + mor cübbeli büyücü + kurbağa-adam büyücü, yıkık
// taş harabe önünde yürüyorlar) motorla yeniden üretim denemesi. Kod
// kopyalanacak bir kaynak yok (Veyra'daki gibi) — kompozisyon, renk, ışık
// yönü tamamen görselden analiz edilip yeniden yorumlandı.
//
// Mimari: her karakter kendi küçük Painter'ında çizilip outline() uygulanıyor,
// sonra ana sahneye blit() ediliyor — Veyra'nın "icon" yaklaşımını sahne
// içinde kullanma denemesi (outline sadece karaktere uygulansın, zemin/duvar
// kontur almasın diye).
import { Painter } from "../../src/core/painter.js";
import { alpha, shade, mix } from "../../src/core/color.js";
import { mulberry32 } from "../../src/core/rng.js";
import { outline, glint } from "../../src/icon/index.js";
import { RP } from "../party-ruins-palette.js";

function drawBull(): Painter {
  const w = 76, h = 92;
  const bp = new Painter(w, h);
  const baseY = 88;

  // arka bacak + toynak
  bp.poly([[20, baseY], [18, baseY - 22], [26, baseY - 26], [30, baseY - 6], [28, baseY]], RP.bull0);
  bp.ellipse(22, baseY, 5, 2.4, RP.gold1);
  // ön bacak (sıçrama pozu — kalkık)
  bp.poly([[46, baseY - 10], [50, baseY - 34], [60, baseY - 36], [58, baseY - 14], [50, baseY - 8]], RP.bull1);
  bp.ellipse(56, baseY - 12, 5, 3, RP.gold1);

  // sırtta torba/çuval
  bp.ellipse(46, 16, 11, 8, RP.bone0);
  bp.ellipse(43, 13, 5, 4, mix(RP.bone0, RP.stone4, 0.4));
  bp.line(38, 18, 54, 16, shade(RP.bone0, 0.7));

  // gövde (kaslı gri-mavi silüet)
  bp.poly(
    [[16, baseY - 22], [14, baseY - 46], [22, baseY - 62], [42, baseY - 66], [56, baseY - 54], [54, baseY - 32], [44, baseY - 20], [24, baseY - 18]],
    RP.bull1,
  );
  // ışık yüzü (üstten/sağdan gelen ışık)
  bp.poly([[42, baseY - 66], [56, baseY - 54], [54, baseY - 32], [46, baseY - 34], [44, baseY - 50]], mix(RP.bull1, RP.bull2, 0.6));
  bp.poly([[22, baseY - 62], [42, baseY - 66], [44, baseY - 50], [30, baseY - 48]], RP.bull2);
  // gölge (sol alt)
  bp.poly([[16, baseY - 22], [14, baseY - 46], [22, baseY - 44], [24, baseY - 24]], shade(RP.bull0, 0.85));

  // kırmızı bel örtüsü (kumaş, altın diskler)
  bp.poly([[16, baseY - 24], [20, baseY - 8], [40, baseY - 6], [46, baseY - 22], [30, baseY - 26]], RP.cloth1);
  bp.poly([[30, baseY - 26], [46, baseY - 22], [40, baseY - 6], [34, baseY - 8]], RP.cloth0);
  for (const [dx, dy] of [[22, -18], [28, -14], [34, -10], [24, -10]]) bp.ellipse(dx, baseY + dy, 1.6, 1.6, RP.gold1);

  // baş — boğa kafası (3/4 profil, sağa/aşağı bakan uzun burun)
  const hx = 26, hy = baseY - 76;
  bp.poly(
    [[hx - 12, hy + 2], [hx - 11, hy - 10], [hx - 4, hy - 18], [hx + 6, hy - 17], [hx + 16, hy - 6], [hx + 18, hy + 4], [hx + 10, hy + 10], [hx - 4, hy + 10]],
    RP.bull1,
  );
  // ışık yüzü (sağ üst — ışık kaynağı sağdan)
  bp.poly([[hx + 6, hy - 17], [hx + 16, hy - 6], [hx + 18, hy + 4], [hx + 10, hy + 10], [hx + 6, hy - 2]], mix(RP.bull1, RP.bull2, 0.55));
  // burun/nazal bölge — uzun, aşağı sivrilen, koyu
  bp.poly([[hx + 3, hy + 3], [hx + 16, hy + 3], [hx + 13, hy + 15], [hx + 6, hy + 15]], shade(RP.bull0, 0.8));
  bp.px(hx + 7, hy + 13, RP.gold1); // burun halkası
  bp.px(hx + 12, hy + 13, RP.gold1);
  // boynuzlar — kalın, eğri koniler (line yerine poly)
  bp.poly([[hx - 9, hy - 8], [hx - 6, hy - 11], [hx - 19, hy - 27], [hx - 25, hy - 23]], RP.bullHorn0);
  bp.poly([[hx - 6, hy - 11], [hx - 3, hy - 13], [hx - 16, hy - 29], [hx - 19, hy - 27]], RP.bullHorn1);
  bp.poly([[hx + 11, hy - 12], [hx + 14, hy - 14], [hx + 27, hy - 25], [hx + 23, hy - 22]], RP.bullHorn0);
  bp.poly([[hx + 14, hy - 14], [hx + 17, hy - 16], [hx + 30, hy - 26], [hx + 27, hy - 25]], RP.bullHorn1);
  // göz
  bp.px(hx + 9, hy - 3, RP.ink);
  bp.px(hx + 9, hy - 4, mix(RP.ink, RP.gold1, 0.3));

  // kol + balta (öne kalkık, tehditkar pose)
  bp.line(50, baseY - 58, 64, baseY - 76, RP.bull0);
  bp.line(51, baseY - 59, 65, baseY - 77, RP.bull1);
  bp.px(64, baseY - 76, RP.gold1); // bilezik
  // çift ağızlı balta (labrys) — iki simetrik üçgen ağız + orta göbek
  const ax = 64, ay = baseY - 76;
  bp.poly([[ax, ay - 2], [ax + 13, ay - 18], [ax + 20, ay - 8], [ax + 8, ay + 6]], RP.bone1); // üst ağız
  bp.poly([[ax, ay + 2], [ax + 13, ay + 18], [ax + 20, ay + 8], [ax + 8, ay - 6]], RP.bone1); // alt ağız
  bp.line(ax, ay - 2, ax + 8, ay + 6, shade(RP.bone1, 0.65)); // üst ağız iç kenar gölgesi
  bp.line(ax, ay + 2, ax + 8, ay - 6, mix(RP.bone1, RP.stone4, 0.5)); // alt ağız iç kenar ışığı
  bp.ellipse(ax + 2, ay, 2.6, 2.6, RP.stone1); // sap göbeği

  // dip gölgesi
  bp.hline(10, baseY + 1, 30, alpha(RP.shadow, 150));

  outline(bp, RP.ink);
  return bp;
}

function drawMage(): Painter {
  const w = 58, h = 108;
  const mp = new Painter(w, h);
  const baseY = 104;

  // dip gölgesi
  mp.hline(8, baseY + 1, 30, alpha(RP.shadow, 150));

  // cübbe — geniş, uzun, alt astarı krem
  mp.poly([[10, baseY], [14, baseY - 50], [20, baseY - 66], [38, baseY - 66], [44, baseY - 50], [48, baseY], [40, baseY - 6], [18, baseY - 6]], RP.purple1);
  // sağ (ışık) yüz
  mp.poly([[38, baseY - 66], [44, baseY - 50], [48, baseY], [40, baseY - 6], [34, baseY - 40]], mix(RP.purple1, RP.purple2, 0.6));
  // sol (gölge) yüz
  mp.poly([[10, baseY], [14, baseY - 50], [20, baseY - 66], [24, baseY - 40], [18, baseY - 6]], shade(RP.purple0, 0.9));
  // eteğin krem astarı (alttan görünen)
  mp.poly([[18, baseY - 6], [24, baseY - 14], [34, baseY - 14], [40, baseY - 6], [34, baseY], [24, baseY]], RP.cream0);

  // önde açık kitap
  mp.poly([[30, baseY - 40], [40, baseY - 42], [42, baseY - 34], [31, baseY - 32]], RP.cream1);
  mp.line(31, baseY - 38, 41, baseY - 38, shade(RP.cream1, 0.6));

  // belde altın küre (fener/amulet)
  mp.ellipse(22, baseY - 30, 3, 3.4, RP.gold1);
  glint(mp, 21, baseY - 31, RP.gold2);

  // boyun + baş
  mp.rect(24, baseY - 72, 8, 6, mix(RP.cream0, RP.amber0, 0.15));
  mp.ellipse(28, baseY - 80, 8, 8, mix(RP.cream0, RP.amber0, 0.12));
  mp.poly([[21, baseY - 78], [22, baseY - 84], [28, baseY - 88], [28, baseY - 76]], shade(RP.cream0, 0.75)); // yüz gölgesi (sol)

  // mavi sivri başlık
  mp.poly([[18, baseY - 82], [22, baseY - 96], [28, baseY - 108], [34, baseY - 96], [38, baseY - 82]], RP.blue1);
  mp.poly([[28, baseY - 108], [34, baseY - 96], [38, baseY - 82], [32, baseY - 84], [29, baseY - 98]], mix(RP.blue1, RP.blue2, 0.6));
  mp.hline(18, baseY - 82, 20, RP.blue0); // başlık bandı

  // gözler (gölgede, sakin bakış)
  mp.px(25, baseY - 80, RP.ink);
  mp.px(30, baseY - 80, RP.ink);

  // asa — uzun, tepesinde göz sembollü mavi top
  const staffX = 46, staffTop = baseY - 100;
  mp.line(staffX, baseY - 20, staffX - 2, staffTop, RP.stone1);
  mp.line(staffX + 1, baseY - 20, staffX - 1, staffTop, mix(RP.stone1, RP.stone3, 0.5));
  mp.ellipse(staffX - 2, staffTop - 3, 4.5, 4.5, RP.blue2);
  mp.ellipse(staffX - 2, staffTop - 3, 2, 2.4, RP.ink); // "göz" bebeği
  glint(mp, staffX - 3, staffTop - 5, RP.sky1);

  outline(mp, RP.ink);
  return mp;
}

function drawFrogMage(): Painter {
  const w = 54, h = 90;
  const fp = new Painter(w, h);
  const baseY = 86;

  fp.hline(6, baseY + 1, 26, alpha(RP.shadow, 150));

  // pelerin (kahve/toprak, kısa, omuzdan)
  fp.poly([[8, baseY], [10, baseY - 40], [16, baseY - 50], [32, baseY - 50], [38, baseY - 40], [40, baseY], [30, baseY - 6], [16, baseY - 6]], RP.hat1);
  fp.poly([[32, baseY - 50], [38, baseY - 40], [40, baseY], [34, baseY - 4], [28, baseY - 30]], mix(RP.hat1, RP.hatBand, 0.35)); // ışık yüzü
  fp.poly([[8, baseY], [10, baseY - 40], [16, baseY - 50], [18, baseY - 26]], shade(RP.hat0, 0.8));

  // gövde/karın (yeşil, cüppe altından)
  fp.ellipse(24, baseY - 14, 8, 10, RP.frog0);

  // eller — bir elinde asa
  fp.ellipse(12, baseY - 22, 3, 3, RP.frog1);
  fp.ellipse(36, baseY - 30, 3, 3, RP.frog1);

  // baş (kurbağa-insansı, geniş ağız hissi)
  const hx = 24, hy = baseY - 62;
  fp.ellipse(hx, hy, 9, 8, RP.frog1);
  fp.poly([[hx - 8, hy + 2], [hx + 8, hy + 2], [hx + 6, hy + 5], [hx - 6, hy + 5]], shade(RP.frog0, 0.85)); // ağız gölgesi
  fp.ellipse(hx - 4, hy - 3, 2.6, 2.8, RP.frog2); // sol göz kabarıklığı
  fp.ellipse(hx + 4, hy - 3, 2.6, 2.8, RP.frog2); // sağ göz kabarıklığı
  fp.px(hx - 4, hy - 4, RP.ink);
  fp.px(hx + 4, hy - 4, RP.ink);
  glint(fp, hx - 5, hy - 5, RP.sky1);

  // sivri şapka + sarı bant
  fp.poly([[hx - 9, hy - 6], [hx - 3, hy - 22], [hx + 2, hy - 6]], RP.hat0);
  fp.line(hx - 8, hy - 7, hx + 1, hy - 7, RP.hatBand);
  fp.px(hx - 3, hy - 21, mix(RP.hat0, RP.hatBand, 0.4));

  // kendi asası — tepesinde yeşil kristal
  const staffX = 40, staffTop = baseY - 76;
  fp.line(staffX, baseY - 24, staffX - 1, staffTop, RP.hat0);
  fp.ellipse(staffX - 1, staffTop - 2, 3, 3.6, RP.frog2);
  fp.px(staffX - 1, staffTop - 3, alpha(RP.sky1, 200));

  outline(fp, RP.ink);
  return fp;
}

export function buildPartyRuins(seed = 5): Painter {
  const w = 240, h = 180;
  const p = new Painter(w, h);
  const rng = mulberry32(seed);

  // --- gökyüzü/arka aralık ---
  p.vgrad(0, 0, w, h, [
    { t: 0, color: RP.sky1 },
    { t: 0.5, color: RP.sky0 },
    { t: 1, color: mix(RP.sky0, RP.stone2, 0.4) },
  ]);

  // --- taş harabe duvarı (arka plan, iki kademeli derinlik) ---
  const wallY = 118;
  // uzak duvar bloğu deseni
  for (let by = 20; by < wallY; by += 14) {
    for (let bx = -6; bx < w; bx += 22) {
      const jx = ((by / 14) | 0) % 2 === 0 ? 0 : 11;
      const bw = 20, bh = 12;
      const c = mix(RP.stone3, RP.stone2, ((bx + by) % 40) / 60);
      p.rect(bx + jx, by, bw, bh, c);
      p.hline(bx + jx, by, bw, mix(c, RP.stone4, 0.4)); // üst kenar ışığı
      p.vline(bx + jx, by, bh, shade(RP.stoneCrack, 1.2)); // sol dikiş
    }
  }
  p.rect(0, 0, w, 18, mix(RP.sky1, RP.stone3, 0.3)); // duvar üstü açık gökyüzü şeridi

  // kırık kemer/sütun parçası (sağ üstte, siluet)
  p.poly([[210, wallY], [206, 40], [222, 30], [232, 44], [228, wallY]], RP.stone1);
  p.poly([[222, 30], [232, 44], [228, wallY], [224, wallY], [224, 44]], shade(RP.stone1, 0.8));

  // yer: taş zemin → önde koyu kaya
  p.rect(0, wallY, w, h - wallY, RP.stone1);
  p.vgrad(0, wallY, w, 20, [
    { t: 0, color: mix(RP.stone2, RP.stone3, 0.3) },
    { t: 1, color: RP.stone1 },
  ]);
  for (let i = 0; i < 40; i++)
    p.px(rng() * w, wallY + rng() * (h - wallY), alpha(RP.stone0, 60 + rng() * 60));

  // ön plan kayalar/moloz (koyu, soğuk — sahnenin en önü)
  p.poly([[0, h], [0, h - 34], [26, h - 44], [46, h - 24], [30, h], [0,h]], RP.rock0);
  p.poly([[0, h - 34], [26, h - 44], [46, h - 24], [40, h - 30], [22, h - 36]], mix(RP.rock0, RP.rock2, 0.5));
  p.poly([[150, h], [160, h - 20], [190, h - 26], [210, h - 8], [200, h], [150,h]], RP.rock1);
  p.poly([[160, h - 20], [190, h - 26], [210, h - 8], [198, h - 10], [172, h - 20]], mix(RP.rock1, RP.rock2, 0.5));
  p.hline(0, h - 2, w, alpha(RP.shadow, 90));

  // --- karakterler (kendi tuvallerinde çizilip blit ediliyor) ---
  const bull = drawBull();
  p.blit(bull, 10, wallY - 66);

  const mage = drawMage();
  p.blit(mage, 96, wallY - 78);

  const frog = drawFrogMage();
  p.blit(frog, 168, wallY - 62);

  p.vignette(0.3);
  return p;
}

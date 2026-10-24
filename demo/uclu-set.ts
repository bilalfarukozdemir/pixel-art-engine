// Üçlü set: zıplayan tavşan (48x48), dalda serçe (32x32), İsmail Kartal portresi (48x48).
// Stil tavsan.ts (v1) ile aynı: elle seçilmiş sıcak palet, mix ile yüzey tonu,
// alpha ile ince vurgu, kendi tuvalinde düz outline. Işık her üçünde de sol üstten.
// Portre referanssız, genel hatlarla (gri geriye taranmış saç, lacivert takım) yapılmış
// karikatürize bir benzerliktir.
// Çalıştırma (proje kökünde):
//   npx tsc -p tsconfig.demo.json
//   node dist-demo/demo/uclu-set.js
// Çıktılar (demo-out/):
//   tavsan-zipla.png, serce.png, ismail-kartal.png   native, şeffaf arka plan
//   *-x8.png                                         8x büyütülmüş
//   uclu-set.png                                     üçü yan yana (x6) + altta native boyut
import { mkdirSync, writeFileSync } from "node:fs";
import { Painter, mix, shade, alpha, outline, contactShadow } from "../src/index.js";
import { encodePng, upscale } from "../src/output/png.js";

const INK = "#2b1d24";

// Yaprak biçimli uzun şekil (kulak, uzanmış bacak): tabandan uca şişip yuvarlak biter.
function leaf(p: Painter, bx: number, by: number, tx: number, ty: number, width: number, c: string): void {
  const dx = tx - bx, dy = ty - by;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const hw = width * Math.pow(Math.sin(Math.PI * (0.18 + 0.82 * t)), 0.55);
    const cx = bx + dx * t, cy = by + dy * t;
    left.push([cx + nx * hw, cy + ny * hw]);
    right.push([cx - nx * hw, cy - ny * hw]);
  }
  p.poly([...left, ...right.reverse()], c);
}

// ---------------------------------------------------------------------------
// Tavşan — sağa zıplarken: gövde uzamış, arka bacak geride, ön patiler önde, kulaklar geriye yatık.
const R = {
  fur0: "#7d5a45", fur1: "#a8805f", fur2: "#cfa67f",
  cream: "#efdfc2", creamShade: "#cdb592", earIn: "#e2a3a0", nose: "#d9788a",
  eye: "#1b1217", white: "#fff8ec",
};

function drawRabbit(): Painter {
  const p = new Painter(48, 48);

  // arka kulak (uzak, koyu), geriye yatık
  leaf(p, 35, 16, 24, 7, 2.6, R.fur0);

  // arka bacak: geriye uzanmış uzun ayak
  leaf(p, 14, 30, 2, 37, 2.4, R.fur0);
  leaf(p, 13, 30, 3, 35.5, 1.4, R.fur1);

  // kuyruk
  p.ellipse(8, 21, 3.5, 3.5, R.creamShade);
  p.ellipse(7.5, 20.5, 2.5, 2.5, R.cream);

  // gövde: kalça + göğüs, gerilmiş tek kütle
  p.ellipse(17, 25, 9.5, 7.5, R.fur0);
  p.ellipse(28, 26, 9.5, 6.5, R.fur0);
  p.ellipse(16.5, 24.5, 8.5, 6.5, R.fur1);
  p.ellipse(27.5, 25.5, 8.5, 5.5, R.fur1);
  p.ellipse(20, 21.5, 9.5, 3.5, mix(R.fur1, R.fur2, 0.6)); // sırt ışığı

  // kalça: gövdeden ayrı okunsun
  p.ellipse(14, 28, 6.5, 5.5, R.fur0);
  p.ellipse(13.5, 27.5, 5.5, 4.5, R.fur1);
  p.ellipse(12, 26, 2.5, 1.5, mix(R.fur1, R.fur2, 0.5));

  // karın (krem), alt kenarda
  p.ellipse(25, 29.5, 6.5, 2.5, R.creamShade);
  p.ellipse(25, 29, 5.5, 1.5, R.cream);

  // ön patiler: ileri-aşağı uzanmış; uzaktaki koyu, yakındaki krem
  leaf(p, 32, 29, 37, 37, 1.6, R.creamShade);
  leaf(p, 30, 29, 34, 38, 1.8, R.cream);

  // baş
  p.ellipse(37, 20, 6.5, 5.5, R.fur0);
  p.ellipse(36.5, 19.5, 6, 5, R.fur1);
  p.ellipse(35, 17.5, 3.5, 2.5, mix(R.fur1, R.fur2, 0.7)); // alın ışığı
  p.ellipse(33, 23, 3.5, 3.5, R.fur1); // boyun: baş-gövde çentiği
  // burun/yanak
  p.ellipse(42, 21.5, 3, 2.5, R.fur1);
  p.ellipse(42, 22.5, 2.5, 1.5, R.cream);

  // ön kulak (yakın, ışıkta), geriye yatık
  leaf(p, 36, 16, 25, 10, 3, R.fur1);
  leaf(p, 35, 15.5, 27.5, 11, 1.4, R.earIn);
  p.line(27, 9, 33, 13, alpha(R.fur2, 170)); // kulak üst kenarı ışık

  // yüz
  p.rect(38, 18, 2, 2, R.eye);
  p.px(38, 18, R.white);
  p.px(45, 21, R.nose);
  p.px(44, 23, alpha(INK, 150));

  outline(p, INK);
  return p;
}

// ---------------------------------------------------------------------------
// Serçe — erkek ev serçesi, sağa bakıyor, dalda tünemiş.
// Tanıtıcı özellikler: gri tepe, gözün arkasında kestane şerit, beyaz yanak,
// siyah gerdan, çizgili kahve kanat ve beyaz kanat bandı, kısa konik gaga.
const S = {
  back0: "#6b4a33", back1: "#8f6644", back2: "#b48a5e",
  chestnut: "#9a5a32", crown: "#8a8580", crownLight: "#aaa59c",
  cheek: "#e9e4d8", belly0: "#a8a196", belly1: "#cbc4b6",
  bib: "#2a2224", beak: "#3c3434", streak: "#3a2a22", bar: "#efe8da",
  leg: "#b08a78", twig0: "#5a3e2a", twig1: "#7a5838",
};

function drawSparrow(): Painter {
  const p = new Painter(32, 32);

  // dal (en arkada değil: ayaklar önünde kalacak, bu yüzden önce dal sonra ayak)
  p.rect(2, 27, 28, 3, S.twig0);
  p.hline(2, 27, 28, S.twig1);
  p.px(24, 26, S.twig0); p.px(25, 25, S.twig0); // küçük filiz

  // kuyruk: geriye ve hafif yukarı
  p.poly([[11, 17], [2, 12], [1.5, 14.5], [10, 21]], S.back0);
  p.line(3, 13, 9, 17, S.back1);

  // gövde: alt göğüs/karın açık gri-bej
  p.ellipse(15, 19, 8.5, 6.5, S.belly0);
  p.ellipse(15.5, 18.5, 7.5, 5.5, S.belly1);

  // kanat: gövdenin üst-arka kısmı, çizgili
  p.poly([[7, 16], [13, 12.5], [20, 13.5], [21, 17], [17, 21], [10, 21]], S.back0);
  p.poly([[8, 16], [13, 13.5], [19, 14], [19.5, 16.5], [16, 19.5], [10, 19.5]], S.back1);
  p.ellipse(14, 14.5, 4.5, 1.5, S.back2); // kanat üstü ışık
  // kanat çizgileri (koyu) ve beyaz kanat bandı
  p.line(10, 17, 15, 15, S.streak);
  p.line(12, 19, 18, 16, S.streak);
  p.line(14, 17, 19, 15, S.bar);

  // baş
  // .5 yarıçaplar: tam sayı yarıçap tepede tek piksel çıkıntı bırakıyordu
  p.ellipse(22.5, 11.5, 4.5, 4.5, S.chestnut);  // ense ve göz arkası kestane
  p.ellipse(23, 9.5, 3.5, 2, S.crown);        // gri tepe, yalnız üstte
  p.ellipse(22, 8.5, 1.5, 0.5, S.crownLight);
  p.ellipse(23.5, 14, 2.5, 1.5, S.cheek);     // beyaz yanak, gözün altında
  // siyah gerdan: gaga dibinden göğse inen dar şerit (yanağı ve gözü yutmasın)
  p.poly([[25, 12.5], [27, 12.5], [26.5, 18], [24.5, 17.5]], S.bib);
  p.px(25, 11, INK);                          // göz
  p.px(24, 11, S.cheek);                      // göz parıltısı yerine açık kenar: gözü kestaneden ayırır

  // gaga: kısa, konik
  p.poly([[27, 10.5], [30.5, 12], [27, 13.5]], S.beak);
  p.px(27, 11, mix(S.beak, S.crownLight, 0.5));

  // bacaklar dalın önünde
  p.vline(14, 24, 3, S.leg);
  p.vline(17, 24, 3, S.leg);
  p.px(13, 27, S.leg); p.px(16, 27, S.leg);

  outline(p, INK);
  return p;
}

// ---------------------------------------------------------------------------
// İsmail Kartal — göğüs hizası portre, hafif sağa dönük, hafif gülümseme.
const K = {
  skin0: "#b07a5c", skin1: "#d39c78", skin2: "#e8b994",
  hair0: "#8c8a8e", hair1: "#b9b7b8", hair2: "#dedcda",
  brow: "#6c6768", eye: "#2a1f22", mouth: "#8a4a44",
  suit0: "#1c2440", suit1: "#2a3560", suit2: "#3e4c80",
  shirt: "#eef0f2", shirtShade: "#c4c9d2",
  tie0: "#1a2a52", tie1: "#e8c23a",
};

function drawKartal(): Painter {
  const p = new Painter(48, 48);

  // omuzlar / ceket
  p.poly([[2, 48], [5, 39], [14, 34.5], [34, 34.5], [43, 39], [46, 48]], K.suit0);
  p.poly([[3, 48], [6, 40], [14, 35.5], [24, 35.5], [24, 48]], K.suit1); // ışık alan sol yarı
  p.poly([[6, 41], [12, 37], [14, 40], [8, 48], [4, 48]], K.suit2);     // sol omuz ışığı
  // gömlek yakası + kravat
  p.poly([[18, 34], [24, 44], [30, 34]], K.shirt);
  p.poly([[25, 34], [24, 44], [30, 34]], K.shirtShade);
  p.poly([[22.5, 36], [25.5, 36], [26, 43], [24, 47], [22, 43]], K.tie0);
  p.line(23, 39, 25, 37, K.tie1); p.line(23, 43, 25, 41, K.tie1); // ince sarı çizgiler
  // ceket yakaları
  p.poly([[17, 34], [24, 46], [20, 48], [15, 36]], K.suit2);
  p.poly([[31, 34], [24, 46], [28, 48], [33, 36]], K.suit0);

  // boyun: yüzden dar ve koyu, çene siluetini ayırsın
  p.rect(20, 27, 8, 8, shade(K.skin0, 0.85));
  p.rect(20, 30, 4, 4, K.skin0);

  // kulaklar
  p.ellipse(14.5, 20.5, 1.5, 2.5, K.skin0);
  p.ellipse(33.5, 20.5, 1.5, 2.5, K.skin0);

  // yüz: gölge → ana → ışık (ışık sol üst)
  p.ellipse(24, 20, 9.5, 11.5, K.skin0);
  p.ellipse(23.5, 19.5, 8.5, 10.5, K.skin1);
  p.ellipse(21, 16.5, 4.5, 5.5, K.skin2);

  // saç: gri, kısa, geriye taranmış; yanlar daha açık beyazımsı
  p.ellipse(24, 10.5, 9.5, 5.5, K.hair0);
  p.ellipse(23, 9.5, 8.5, 4.5, K.hair1);
  p.ellipse(20, 8, 4.5, 2, K.hair2);
  p.rect(14, 11, 2, 7, K.hair0);   // favoriler
  p.rect(32, 11, 2, 7, K.hair0);
  p.px(14, 11, K.hair1); p.px(15, 12, K.hair1);
  // alın: saç çizgisini yuvarlak ve hafif geride bırakır (düz şerit kafa bandı gibi duruyordu)
  p.ellipse(23.5, 15.5, 7.5, 3, K.skin1);
  p.ellipse(21, 15, 3.5, 1.5, K.skin2);

  // kaşlar
  p.hline(17, 17, 5, K.brow);
  p.hline(26, 17, 5, K.brow);
  // gözler + göz altı gölgesi
  p.rect(18, 19, 3, 2, K.eye); p.px(18, 19, K.skin2);
  p.rect(27, 19, 3, 2, K.eye); p.px(27, 19, K.skin2);
  p.hline(18, 21, 3, alpha(K.skin0, 140));
  p.hline(27, 21, 3, alpha(K.skin0, 140));
  // burun: ışık sol üstten → sağ kenarı ve altı gölge
  p.vline(25, 20, 5, K.skin0);
  p.hline(22, 25, 4, K.skin0);
  p.vline(23, 20, 4, alpha(K.skin2, 180));
  // yanak çizgileri ve hafif gülümseme
  p.line(19, 25, 20, 27, alpha(K.skin0, 160));
  p.line(29, 25, 28, 27, alpha(K.skin0, 160));
  p.hline(21, 27, 7, K.mouth);
  p.px(20, 26, K.mouth); p.px(28, 26, K.mouth);
  p.hline(22, 28, 5, alpha(K.skin0, 120));

  outline(p, INK);
  return p;
}

// ---------------------------------------------------------------------------
function saveScaled(p: Painter, path: string, n: number): void {
  const big = new Painter(p.w * n, p.h * n);
  big.data.set(upscale(p, n));
  writeFileSync(path, encodePng(big));
}

// Set sayfası: üstte x6 paneller (zemin + temas gölgesi), altta native boyut.
function sheet(items: { p: Painter; ground: boolean }[], n: number): Painter {
  const cell = 52, H = cell;
  const top = new Painter(cell * items.length, H);
  top.fill("#f4efe4");
  items.forEach(({ p, ground }, i) => {
    const x0 = i * cell + Math.floor((cell - p.w) / 2);
    const y0 = H - p.h - 2;
    if (ground) contactShadow(top, x0 + p.w / 2, y0 + p.h - 2, Math.round(p.w * 0.7), 4, "#5a4a3a", 70);
    top.blit(p, x0, y0);
  });
  const out = new Painter(top.w * n, H * n + 56);
  out.fill("#e8e2d4");
  const big = new Painter(top.w * n, H * n);
  big.data.set(upscale(top, n));
  out.blit(big, 0, 0);
  items.forEach(({ p }, i) => out.blit(p, i * cell * n + (cell * n - p.w) / 2, H * n + 4));
  return out;
}

mkdirSync("demo-out", { recursive: true });
const rabbit = drawRabbit(), sparrow = drawSparrow(), kartal = drawKartal();
for (const [name, p] of [["tavsan-zipla", rabbit], ["serce", sparrow], ["ismail-kartal", kartal]] as const) {
  writeFileSync(`demo-out/${name}.png`, encodePng(p));
  saveScaled(p, `demo-out/${name}-x8.png`, 8);
}
writeFileSync("demo-out/uclu-set.png", encodePng(sheet([
  { p: rabbit, ground: true }, { p: sparrow, ground: false }, { p: kartal, ground: false },
], 6)));
console.log("Üretildi: demo-out/tavsan-zipla*.png, serce*.png, ismail-kartal*.png, uclu-set.png");

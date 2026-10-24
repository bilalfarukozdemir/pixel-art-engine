// Tavşan — oturan, sağa bakan, 48x48 sprite. Işık sol üstten.
// Çalıştırma (proje kökünde):
//   npx tsc -p tsconfig.demo.json
//   node dist-demo/demo/tavsan.js
// Çıktılar (demo-out/):
//   tavsan.png           48x48, şeffaf arka plan (oyuna koymak için)
//   tavsan-x8.png        8x büyütülmüş (incelemek için)
//   tavsan-onizleme.png  çimen üstünde, gölgeli önizleme (x6)
import { mkdirSync, writeFileSync } from "node:fs";
import { Painter, mix, shade, alpha, outline, contactShadow } from "../src/index.js";
import { encodePng, upscale } from "../src/output/png.js";

// ---- Palet ----
const C = {
  ink: "#2b1d24",      // kontur
  fur0: "#7d5a45",     // gölge
  fur1: "#a8805f",     // ana tüy
  fur2: "#cfa67f",     // ışık
  cream: "#efdfc2",    // göğüs / kuyruk
  creamShade: "#cdb592",
  earIn: "#e2a3a0",    // kulak içi
  nose: "#d9788a",
  eye: "#1b1217",
  white: "#fff8ec",
};

// Uzun, yaprak biçimli kulak: tabandan uca doğru şişip sivrilen poligon.
function leaf(p: Painter, bx: number, by: number, tx: number, ty: number, width: number, c: string): void {
  const dx = tx - bx, dy = ty - by;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len; // dik yön
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const hw = width * Math.pow(Math.sin(Math.PI * (0.18 + 0.82 * t)), 0.55); // yuvarlak uç
    const cx = bx + dx * t, cy = by + dy * t;
    left.push([cx + nx * hw, cy + ny * hw]);
    right.push([cx - nx * hw, cy - ny * hw]);
  }
  p.poly([...left, ...right.reverse()], c);
}

function drawRabbit(): Painter {
  const p = new Painter(48, 48);
  const baseY = 44;

  // --- arka kulak (uzak, koyu) ---
  leaf(p, 29, 18, 22, 4, 3, C.fur0);

  // --- kuyruk ---
  p.ellipse(9, 32, 3.6, 3.6, C.creamShade);
  p.ellipse(8.5, 31.5, 2.8, 2.8, C.cream);

  // --- gövde: koyu → ana → ışık katmanları (ışık sol üstten) ---
  p.ellipse(22, 34, 13, 10, C.fur0);
  p.ellipse(21, 33, 12, 9, C.fur1);
  p.ellipse(19, 30, 8, 5, mix(C.fur1, C.fur2, 0.6));

  // arka bacak (kalça) — gövdeden ayrı okunsun diye hafif gölge kenarı
  p.ellipse(17, 37, 8.5, 6.5, C.fur0);
  p.ellipse(16.5, 36.5, 7.5, 5.5, C.fur1);
  p.ellipse(15, 35, 4, 3, mix(C.fur1, C.fur2, 0.5));

  // arka ayak (uzun tavşan ayağı)
  p.ellipse(21, baseY - 1, 9, 2.4, C.fur0);
  p.ellipse(20, baseY - 1.5, 8, 1.6, C.fur1);

  // göğüs (krem)
  p.ellipse(31, 35, 5, 7, C.creamShade);
  p.ellipse(30.5, 34, 4, 6, C.cream);

  // ön pati
  p.ellipse(32, baseY - 1, 3.2, 2, C.creamShade);
  p.ellipse(31.5, baseY - 1.5, 2.4, 1.4, C.cream);
  p.ellipse(28, baseY - 1, 2.8, 1.8, C.creamShade);

  // boyun — baş ile sırt arasındaki çentiği doldurur
  p.ellipse(27, 27, 5, 4.5, C.fur1);

  // --- baş ---
  p.ellipse(33, 22, 8, 7, C.fur0);
  p.ellipse(32.5, 21.5, 7.5, 6.5, C.fur1);
  p.ellipse(31, 19.5, 4.5, 3.5, mix(C.fur1, C.fur2, 0.7)); // alın ışığı
  // başın koyu kenarı boyunda dikiş bırakmasın: ensenin üstünü ana tüyle kapat
  p.ellipse(28, 26, 3.5, 3, C.fur1);
  // burun/yanak (sağa uzanan ağız kısmı)
  p.ellipse(38.5, 24, 4, 3.5, C.fur1);
  p.ellipse(38.5, 25, 3, 2.5, C.cream);

  // --- ön kulak (yakın, ışıkta) ---
  leaf(p, 32, 17, 29, 3, 3.3, C.fur1);
  leaf(p, 32, 16, 29.6, 5.5, 1.7, C.earIn);
  // kulak kenarında ince ışık
  p.line(28, 6, 29, 13, alpha(C.fur2, 170));

  // --- yüz detayları ---
  // göz (2x3) + parıltı
  p.rect(35, 20, 2, 3, C.eye);
  p.px(35, 20, C.white);
  // burun + ağız
  p.px(42, 23, C.nose);
  p.px(41, 23, shade(C.nose, 0.85));
  p.px(41, 25, alpha(C.ink, 150));
  // yanak pembeliği
  p.px(37, 23, alpha(C.earIn, 120));

  outline(p, C.ink);
  return p;
}

function preview(rabbit: Painter): Painter {
  const s = new Painter(96, 64);
  s.vgrad(0, 0, 96, 40, [
    { t: 0, color: "#9fd0e0" },
    { t: 0.7, color: "#cfe8de" },
    { t: 1, color: "#e8f0d0" },
  ], { smooth: true });
  // çimen zemini
  s.rect(0, 40, 96, 24, "#7fa44f");
  for (let x = 0; x < 96; x++) {
    const edge = Math.round(40 + Math.sin(x / 9) * 1.5);
    s.vline(x, edge, 41 - edge + 1, "#94b85c");
  }
  s.rect(0, 52, 96, 12, "#6d9244");
  // temas gölgesi (tavşanın altında)
  contactShadow(s, 47, 57, 36, 5, "#2f3a1f", 110);
  s.blit(rabbit, 24, 12);
  return s;
}

function saveScaled(p: Painter, path: string, n: number): void {
  const big = new Painter(p.w * n, p.h * n);
  big.data.set(upscale(p, n));
  writeFileSync(path, encodePng(big));
}

mkdirSync("demo-out", { recursive: true });
const rabbit = drawRabbit();
writeFileSync("demo-out/tavsan.png", encodePng(rabbit));
saveScaled(rabbit, "demo-out/tavsan-x8.png", 8);
saveScaled(preview(rabbit), "demo-out/tavsan-onizleme.png", 6);
console.log("Üretildi: demo-out/tavsan.png, tavsan-x8.png, tavsan-onizleme.png");

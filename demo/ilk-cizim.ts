// İlk çizim — buradaki kodu değiştirip tekrar çalıştır.
// Çalıştırma (proje kökünde):
//   npx tsc -p tsconfig.demo.json
//   node dist-demo/demo/ilk-cizim.js
// Çıktı: demo-out/ilk-cizim.png
import { mkdirSync, writeFileSync } from "node:fs";
import { Painter } from "../src/index.js";
import { encodePng, upscale } from "../src/output/png.js";

const p = new Painter(64, 48);          // iç çözünürlük (piksel)
p.fill("#0d0b10");                      // arka plan
p.ellipse(32, 24, 10, 8, "#8aab52");    // yeşil bir blob

// 8x büyütüp kaydet (yoksa 64x48 çok küçük görünür)
const SCALE = 8;
const big = new Painter(p.w * SCALE, p.h * SCALE);
big.data.set(upscale(p, SCALE));

mkdirSync("demo-out", { recursive: true });
writeFileSync("demo-out/ilk-cizim.png", encodePng(big));
console.log("Üretildi: demo-out/ilk-cizim.png");

// campfire-elder-wallpaper'ı animasyonlu GIF'e çevirir — ateş ve ona bağlı
// ışık halesi titreşir, sahnenin geri kalanı (dağ/yıldız/adam/çadır) her
// karede birebir aynı kalır (bkz. campfire-elder-wallpaper.ts'teki not).
import { writeFileSync } from "node:fs";
import { Painter } from "../src/core/painter.js";
import { upscale } from "../src/output/png.js";
import { encodeGif, type GifFrame } from "../src/output/gif.js";
import { buildCampfireElderWallpaper } from "./scenes/campfire-elder-wallpaper.js";

const OUT = process.argv[2] ?? "./demo-out";
const SCALE = 3; // GIF dosya boyutu için PNG'den daha düşük upscale (3x -> 1152x648)
const FRAME_COUNT = 30;
const DELAY_MS = 110; // toplam döngü ~3.3s — ilk sürüm 16 kare x 70ms (~1.1s) gerçek dışı hızlıydı

const frames: GifFrame[] = [];
for (let i = 0; i < FRAME_COUNT; i++) {
  const t = i / FRAME_COUNT; // 0..1, döngüsel
  const p = buildCampfireElderWallpaper(3, t, i);
  const scaledData = upscale(p, SCALE);
  const big = new Painter(p.w * SCALE, p.h * SCALE);
  big.data.set(scaledData);
  frames.push({ painter: big, delayMs: DELAY_MS });
}

const gifBytes = encodeGif(frames, { maxColors: 128 });
writeFileSync(`${OUT}/campfire-elder-wallpaper.gif`, gifBytes);
console.log(`Üretildi: ${OUT}/campfire-elder-wallpaper.gif (${frames[0].painter.w}x${frames[0].painter.h}, ${FRAME_COUNT} kare, ${gifBytes.length} byte)`);

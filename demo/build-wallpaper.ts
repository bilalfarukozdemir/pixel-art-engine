// Sadece campfire-elder-wallpaper sahnesini üretir, 5x upscale ile
// 1920×1080'e tam oturur. Diğer demo sahnelerine dokunmaz.
import { writeFileSync } from "node:fs";
import { Painter } from "../src/core/painter.js";
import { encodePng, upscale } from "../src/output/png.js";
import { buildCampfireElderWallpaper } from "./scenes/campfire-elder-wallpaper.js";

const OUT = process.argv[2] ?? "./demo-out";
const SCALE = 5;

const p = buildCampfireElderWallpaper();
const scaledData = upscale(p, SCALE);
const big = new Painter(p.w * SCALE, p.h * SCALE);
big.data.set(scaledData);
writeFileSync(`${OUT}/campfire-elder-wallpaper.png`, encodePng(big));
console.log(`Üretildi: ${OUT}/campfire-elder-wallpaper.png (${big.w}x${big.h}, native ${p.w}x${p.h})`);

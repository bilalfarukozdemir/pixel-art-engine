// party-ruins sahnesini üretir — referans görsel denemesi.
import { writeFileSync } from "node:fs";
import { Painter } from "../src/core/painter.js";
import { encodePng, upscale } from "../src/output/png.js";
import { buildPartyRuins } from "./scenes/party-ruins.js";

const OUT = process.argv[2] ?? "./demo-out";
const SCALE = 6;

const p = buildPartyRuins();
const scaledData = upscale(p, SCALE);
const big = new Painter(p.w * SCALE, p.h * SCALE);
big.data.set(scaledData);
writeFileSync(`${OUT}/party-ruins.png`, encodePng(big));
console.log(`Üretildi: ${OUT}/party-ruins.png (${big.w}x${big.h}, native ${p.w}x${p.h})`);

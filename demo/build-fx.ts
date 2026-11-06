// Zamanlı efektlerin kontak föyü ve GIF'i: "çiz, bak, düzelt" döngüsünün çıktısı.
// Çalıştır: npm run fx  → examples/fx-*.png
import { writeFileSync } from "node:fs";
import { Painter, contactSheet, renderEffect, sparkBurst } from "../src/index.js";
import { encodePng } from "../src/output/png.js";

function save(name: string, sheet: Painter): void {
  writeFileSync(`examples/${name}.png`, encodePng(sheet));
}

for (const [name, depth] of [["fx-spark-burst", 0], ["fx-spark-burst-derinlik", 7]] as const) {
  const frames = renderEffect(sparkBurst, { seed: 2, opts: { depth } });
  save(name, contactSheet(frames, { cols: 9, scale: 3, every: 1 }));
}
console.log("fx örnekleri yazıldı");

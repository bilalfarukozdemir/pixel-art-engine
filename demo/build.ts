// Demo katalog build — dört farklı yönden sahne üretir, her birini
// büyütülmüş PNG olarak ve hepsini birlikte bir Catalog/atlas olarak
// kaydeder. Motorun sınırlarını farklı temalarla test etmek içindir.
import { writeFileSync } from "node:fs";
import { Painter } from "../src/core/painter.js";
import { Catalog } from "../src/catalog/index.js";
import { encodePng, upscale } from "../src/output/png.js";
import { saveCatalog } from "../src/output/catalog-fs.js";
import { buildMotorcycle } from "./scenes/motorcycle.js";
import { buildGoblinCorpse } from "./scenes/goblin-corpse.js";
import { buildCampfireElder } from "./scenes/campfire-elder.js";
import { buildHiddenFigure } from "./scenes/hidden-figure.js";

const OUT = process.argv[2] ?? "./demo-out";

function saveUpscaled(p: Painter, path: string, n = 8): void {
  const scaledData = upscale(p, n);
  const big = new Painter(p.w * n, p.h * n);
  big.data.set(scaledData);
  writeFileSync(path, encodePng(big));
}

const scenes: Record<string, Painter> = {
  motorcycle: buildMotorcycle(),
  "goblin-corpse": buildGoblinCorpse(),
  "campfire-elder": buildCampfireElder(),
  "hidden-figure": buildHiddenFigure(),
};

const cat = new Catalog();
for (const [id, painter] of Object.entries(scenes)) {
  cat.add(id, painter, { generator: "demo-catalog", tags: [id] });
  saveUpscaled(painter, `${OUT}/${id}.png`, 8);
}
saveCatalog(cat, `${OUT}/catalog`);
console.log("Demo katalog üretildi:", OUT);
console.log("Sahneler:", Object.keys(scenes).join(", "));

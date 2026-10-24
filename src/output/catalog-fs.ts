// ============================================================
// Katalog dosya kalıcılığı — Node-only (fs). Atlas Painter'ı PNG'ye,
// manifest'i JSON'a yazar/okur. Tarayıcı bundle'ına girmemeli.
// ============================================================
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Catalog, CatalogEntry } from "../catalog/index.js";
import { encodePng } from "./png.js";

/** Kataloğu bir klasöre atlas.png + manifest.json olarak kaydeder. */
export function saveCatalog(catalog: Catalog, dir: string, maxWidth = 1024): void {
  mkdirSync(dir, { recursive: true });
  const { atlas, manifest } = catalog.buildAtlas(maxWidth);
  writeFileSync(join(dir, "atlas.png"), encodePng(atlas));
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
}

/** Kaydedilmiş manifest.json'ı okur — sprite'ları atlas.png içinden kesip almak için atlasX/atlasY/w/h kullanılır. */
export function loadManifest(dir: string): CatalogEntry[] {
  return JSON.parse(readFileSync(join(dir, "manifest.json"), "utf-8")) as CatalogEntry[];
}

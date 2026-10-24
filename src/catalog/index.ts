// ============================================================
// Katalog — üretilen sprite'ları (goblin gibi) saklar, tekrar
// üretmeden çekmeyi sağlar. buildAtlas() shelf packing ile hepsini
// tek bir Painter'da (+ manifest) birleştirir. Runtime'dan bağımsız
// (dosyaya kaydetme "../output/catalog-fs.js"te, Node-only).
// ============================================================
import { Painter } from "../core/painter.js";

export interface CatalogMeta {
  generator?: string;
  seed?: number;
  params?: Record<string, unknown>;
  tags?: string[];
}

export interface CatalogEntry extends CatalogMeta {
  id: string;
  w: number;
  h: number;
  createdAt: string;
  atlasX?: number;
  atlasY?: number;
}

export interface AtlasResult {
  atlas: Painter;
  manifest: CatalogEntry[];
}

export class Catalog {
  private items = new Map<string, { painter: Painter; meta: CatalogEntry }>();

  /** Bir sprite'ı kataloğa ekler. Aynı id ikinci kez eklenemez (tekrar üretmemek katalogun amacı). */
  add(id: string, painter: Painter, meta: CatalogMeta = {}): void {
    if (this.items.has(id)) throw new Error(`Catalog: "${id}" zaten kayıtlı`);
    this.items.set(id, {
      painter,
      meta: { ...meta, id, w: painter.w, h: painter.h, createdAt: new Date().toISOString() },
    });
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  get(id: string): Painter | undefined {
    return this.items.get(id)?.painter;
  }

  getMeta(id: string): CatalogEntry | undefined {
    return this.items.get(id)?.meta;
  }

  list(): CatalogEntry[] {
    return [...this.items.values()].map((v) => v.meta);
  }

  /** Shelf packing: sprite'ları yükseklik azalan sırayla, maxWidth'i aşmayan satırlara diz. */
  buildAtlas(maxWidth = 1024): AtlasResult {
    const entries = [...this.items.values()].sort((a, b) => b.painter.h - a.painter.h);
    let x = 0, y = 0, shelfH = 0, atlasW = 0;
    const placed: { x: number; y: number; painter: Painter; meta: CatalogEntry }[] = [];
    for (const { painter, meta } of entries) {
      if (x + painter.w > maxWidth && x > 0) {
        x = 0;
        y += shelfH;
        shelfH = 0;
      }
      placed.push({ x, y, painter, meta });
      x += painter.w;
      shelfH = Math.max(shelfH, painter.h);
      atlasW = Math.max(atlasW, x);
    }
    const atlasH = y + shelfH;
    const atlas = new Painter(atlasW, atlasH);
    const manifest: CatalogEntry[] = [];
    for (const p of placed) {
      atlas.blit(p.painter, p.x, p.y);
      manifest.push({ ...p.meta, atlasX: p.x, atlasY: p.y });
    }
    return { atlas, manifest };
  }
}

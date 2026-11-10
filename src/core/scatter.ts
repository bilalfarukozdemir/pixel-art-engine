import type { Rng } from './rng.js';

export interface ScatterBounds { x: number; y: number; w: number; h: number }
export interface ScatterOptions {
  /** Öklid uzaklığı, px; varsayılan 0 (aynı konuma izin verir). */
  minDist?: number;
  /** Nokta başına deneme sayısı; varsayılan 30. */
  maxTries?: number;
}

/** [x, x+w) × [y, y+h) içine tam sayı noktaları saçar; yer bulunamazsa atlar. */
export function scatterPoints(bounds: ScatterBounds, count: number, rng: Rng, opts: ScatterOptions = {}): { x: number; y: number }[] {
  const { x, y, w, h } = bounds, minDist = opts.minDist ?? 0, maxTries = opts.maxTries ?? 30;
  if (![x, y, w, h, count, minDist, maxTries].every(Number.isFinite) || minDist < 0 || maxTries < 1)
    throw new RangeError('scatterPoints: geçersiz sınır veya seçenek');
  if (count <= 0 || w <= 0 || h <= 0) return [];
  const points: { x: number; y: number }[] = [], x0 = Math.ceil(x), y0 = Math.ceil(y), x1 = Math.ceil(x + w), y1 = Math.ceil(y + h);
  if (x0 >= x1 || y0 >= y1) return points;
  for (let i = 0; i < Math.floor(count); i++) {
    for (let attempt = 0; attempt < Math.floor(maxTries); attempt++) {
      const p = { x: x0 + Math.floor(rng() * (x1 - x0)), y: y0 + Math.floor(rng() * (y1 - y0)) };
      if (p.x < x || p.y < y || p.x >= x + w || p.y >= y + h) continue;
      if (points.every(q => (p.x - q.x) ** 2 + (p.y - q.y) ** 2 >= minDist ** 2)) { points.push(p); break; }
    }
  }
  return points;
}

import { Painter } from '../core/painter.js';
import { encodePng } from './png.js';
import { encodeAseprite, type AseFrame, type AseTag } from './aseprite.js';

export interface SheetAnimation {
  /** Sheet üzerindeki sıfır tabanlı kare indeksleri; sıra/tekrar serbest. */
  frames: number[];
  /** Her animasyon karesinin ms süresi. */
  delays: number[];
  /** Anahtarlar animasyon içindeki sıfır tabanlı kare sıralarıdır. */
  events?: Record<string, string>;
  hitStopMs?: Record<string, number>;
}
export interface SheetMetadata {
  frameWidth: number;
  frameHeight: number;
  pivot: [number, number];
  animations: Record<string, SheetAnimation>;
}
export interface EncodeSheetOptions {
  frames: readonly Painter[];
  pivot: readonly [number, number];
  animations: Record<string, SheetAnimation>;
}
export interface EncodedSheet {
  png: Buffer;
  json: string;
  aseprite: Buffer;
}

/** Tek satır sheet PNG + JSON + etiketli Aseprite; dosya yazmaz. */
export function encodeSheet(opts: EncodeSheetOptions): EncodedSheet {
  const { frames, pivot, animations } = opts;
  const fail = (message: string): never => { throw new Error(`encodeSheet: ${message}`); };
  if (!frames.length) fail('en az bir kare gerekli');
  const { w, h } = frames[0];
  if (![w, h].every(n => Number.isInteger(n) && n > 0) || frames.some(f => f.w !== w || f.h !== h)) fail('kare boyutları pozitif ve eşit olmalı');
  if (pivot.length !== 2 || !pivot.every(Number.isFinite)) fail('pivot iki sonlu sayı olmalı');
  const timeline: AseFrame[] = [], tags: AseTag[] = [], used = new Set<number>();
  for (const [name, animation] of Object.entries(animations)) {
    const { frames: indices, delays, events, hitStopMs } = animation;
    if (!name || !indices.length || indices.length !== delays.length) fail('animasyon adı/kare/süre listesi geçersiz');
    if (indices.some(i => !Number.isInteger(i) || i < 0 || i >= frames.length)) fail(`${name}: kare indeksi geçersiz`);
    if (delays.some(n => !Number.isInteger(n) || n < 1 || n > 65535)) fail(`${name}: süre 1..65535 ms olmalı`);
    for (const [field, values] of [['events', events], ['hitStopMs', hitStopMs]] as const) {
      for (const [key, value] of Object.entries(values ?? {})) {
        const index = Number(key);
        if (!Number.isInteger(index) || String(index) !== key || index < 0 || index >= indices.length) fail(`${name}: ${field} kare indeksi geçersiz`);
        if (field === 'events' ? typeof value !== 'string' : typeof value !== 'number' || !Number.isFinite(value) || value < 0) fail(`${name}: ${field} değeri geçersiz`);
      }
    }
    const from = timeline.length;
    indices.forEach((index, i) => { used.add(index); timeline.push({ painter: frames[index], delayMs: delays[i] }); });
    tags.push({ name, from, to: timeline.length - 1 });
  }
  // Etiketsiz kareler de Aseprite'ta kaybolmasın.
  frames.forEach((painter, i) => { if (!used.has(i)) timeline.push({ painter, delayMs: 100 }); });
  const aseprite = encodeAseprite({ frames: timeline, tags });
  const sheet = new Painter(w * frames.length, h);
  // Ham kopya: saydam RGB dahil kare baytları korunur.
  frames.forEach((f, i) => {
    for (let y = 0; y < h; y++) sheet.data.set(f.data.subarray(y * w * 4, (y + 1) * w * 4), (y * sheet.w + i * w) * 4);
  });
  const metadata: SheetMetadata = { frameWidth: w, frameHeight: h, pivot: [pivot[0], pivot[1]], animations };
  return { png: encodePng(sheet), json: JSON.stringify(metadata, null, 2), aseprite };
}

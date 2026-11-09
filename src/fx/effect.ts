// ============================================================
// Effect — zamanlı efektin sözleşmesi ve kare kare render.
// Efekt `create(rng, opts)` ile bir örnek kurar; örnek `update(dt)` ile
// sabit adımda (varsayılan 1/120 s) ilerler, `draw(frame)` ile çizer.
// Aynı seed → aynı kareler: kare hızı değişse de fizik aynı kalır.
// Kural: tek seferlik efekt `duration` anında hiçbir şey çizmez.
// ============================================================
import type { Painter } from "../core/painter.js";
import { mulberry32, type Rng } from "../core/rng.js";
import { FxFrame, composite } from "./frame.js";

export interface EffectMeta {
  name: string;
  /** Tuval boyutu, px. */
  w: number;
  h: number;
  /** Yerel (0,0)'ın tuvaldeki yeri: çarpma noktası, ayak, zemin. */
  origin: readonly [number, number];
  /** Saniye. */
  duration: number;
  /** Önerilen oynatma hızı. */
  fps: number;
}

export interface EffectInstance {
  update(dt: number): void;
  draw(frame: FxFrame): void;
}

export interface Effect<O extends object = Record<string, never>> {
  meta: EffectMeta;
  defaults: O;
  create(rng: Rng, opts: O): EffectInstance;
}

export interface RenderEffectOptions<O extends object> {
  seed?: number;
  /** Verilmezse meta.fps. */
  fps?: number;
  /** Simülasyon adımı, saniye. */
  step?: number;
  /** composite() ışık kademesi. */
  levels?: number;
  opts?: Partial<O>;
}

/** Efekti 0..duration arasında kare kare çizer; son kare t = duration'dır. */
export function renderEffect<O extends object>(effect: Effect<O>, options: RenderEffectOptions<O> = {}): Painter[] {
  const { meta } = effect;
  const fps = options.fps ?? meta.fps, step = options.step ?? 1 / 120;
  if (!(fps > 0) || !(step > 0)) throw new Error("renderEffect: fps ve step pozitif olmalı");
  const fx = effect.create(mulberry32(options.seed ?? 1), { ...effect.defaults, ...options.opts } as O);
  const count = Math.round(meta.duration * fps) + 1, frames: Painter[] = [];
  let sim = 0;
  for (let i = 0; i < count; i++) {
    const target = Math.min(meta.duration, i / fps);
    while (sim + step / 2 < target) { fx.update(step); sim += step; }
    const frame = new FxFrame(meta.w, meta.h, meta.origin);
    fx.draw(frame);
    frames.push(composite(frame, { levels: options.levels }));
  }
  return frames;
}

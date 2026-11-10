// ============================================================
// Hazır efektler — sözleşmenin (Effect) çalışan örnekleri.
// sparkBurst: çarpma anında beyaz flaş, ışık saçan kıvılcımlar, sekip
// duran taş parçaları, yükselip sönen toz. `depth` > 0 ise zemin tek
// çizgi değil derinlikli bir yoldur: parçalar farklı y'lere düşer.
// ============================================================
import type { ColorInput } from "../core/color.js";
import type { Effect } from "./effect.js";
import { Particles } from "./particles.js";

export interface SparkBurstOptions {
  /** Kıvılcım renkleri, parlaktan koyuya. */
  sparks: ColorInput[];
  /** Parça renkleri, açıktan koyuya. */
  chunks: ColorInput[];
  dust: ColorInput[];
  /** Kıvılcım sayısı. */
  count: number;
  /** Derinlikli zeminin yarı yüksekliği, px (0 = tek çizgi). */
  depth: number;
}

export const sparkBurst: Effect<SparkBurstOptions> = {
  meta: { name: "spark-burst", w: 96, h: 72, origin: [48, 52], duration: 0.8, fps: 20 },
  defaults: {
    sparks: ["#ffffff", "#fff2a8", "#ffc23d", "#f2561d", "#8a2a1a"],
    chunks: ["#c9b28a", "#927a58", "#5e4a34"],
    dust: ["#d8c8a8", "#a8957a", "#7a6a58"],
    count: 26,
    depth: 0,
  },
  create(rng, o) {
    const ground = (x: number) => o.depth * Math.sin(x * 0.21 + 1.1) * Math.cos(x * 0.083);
    const ps = new Particles({ ground });
    for (let i = 0; i < o.count; i++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * 2.4, sp = 60 + rng() * 110;
      ps.spawn({ kind: "spark", x: 0, y: -2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.3 + rng() * 0.35, gravity: 560, colors: o.sparks, light: 0.6 });
    }
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (rng() - 0.5) * 2, sp = 50 + rng() * 90;
      ps.spawn({ kind: "chunk", x: 0, y: -1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5 + rng() * 0.25, size: 1.5 + rng() * 1.5, bounce: 0.35, colors: o.chunks });
    }
    for (let i = 0; i < 7; i++) {
      const s = rng() < 0.5 ? -1 : 1;
      ps.spawn({ kind: "dust", x: s * rng() * 6, y: -2 - rng() * 3, vx: s * (10 + rng() * 30), vy: -(8 + rng() * 18), life: 0.4 + rng() * 0.3, size: 2 + rng() * 1.5, colors: o.dust });
    }
    let t = 0;
    return {
      update(dt) { t += dt; ps.update(dt); },
      draw(f) {
        if (t < 0.1) {
          const k = 1 - t / 0.1;
          f.disc(0, -3, 2 + 4 * k, "#ffffff");
          f.glow(0, -3, 22, "#ffd27a", 1.1 * k);
        }
        ps.draw(f);
      },
    };
  },
};

export interface DustPuffOptions {
  /** Toz renkleri, açıktan koyuya. */
  dust: ColorInput[];
  /** Toz parçacığı sayısı. */
  count: number;
}

/** Zeminden yavaşça yükselip açılan, sonda sönen kısa toz bulutu. */
export const dustPuff: Effect<DustPuffOptions> = {
  meta: { name: "dust-puff", w: 64, h: 48, origin: [32, 34], duration: 0.7, fps: 20 },
  defaults: { dust: ["#d8c8a8", "#a8957a", "#7a6a58"], count: 7 },
  create(rng, o) {
    const ps = new Particles();
    for (let i = 0; i < o.count; i++) {
      const side = rng() < 0.5 ? -1 : 1;
      ps.spawn({ kind: "dust", x: (rng() - 0.5) * 4, y: 0, vx: side * (5 + rng() * 13), vy: -(10 + rng() * 15), gravity: 5, drag: 0.15, life: 0.42 + rng() * 0.2, size: 2 + rng() * 1.5, colors: o.dust });
    }
    return { update(dt) { ps.update(dt); }, draw(f) { ps.draw(f); } };
  },
};

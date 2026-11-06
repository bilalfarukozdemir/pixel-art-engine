// ============================================================
// Particles — tohumlu, sabit adımla ilerleyen parçacıklar.
// Üç tür: kıvılcım (hıza göre uzayan çizgi), toz (büyüyüp titreşimle
// sönen disk), parça (yere düşüp seken kare). Zemin bir fonksiyondur:
// ground(x) yerel y döndürür; tek çizgi (() => 0) ya da derinlikli yol
// (x'e göre değişen y) olabilir. Rastgelelik çağıranın Rng'sinden gelir.
// ============================================================
import type { ColorInput } from "../core/color.js";
import type { FxFrame } from "./frame.js";

export type ParticleKind = "spark" | "dust" | "chunk";

export interface ParticleSpawn {
  kind?: ParticleKind;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  /** Saniye. */
  life: number;
  /** px/s², aşağı pozitif. Varsayılan kıvılcım/parça 420, toz 0. */
  gravity?: number;
  /** Saniyede hız kaybı oranı (0 = yok). */
  drag?: number;
  /** Yere çarpınca dikey hızın kalan oranı. */
  bounce?: number;
  /** Toz yarıçapı / parça kenarı, px. */
  size?: number;
  /** Yaşa göre sırayla kullanılan renkler, parlaktan koyuya. */
  colors: ColorInput[];
  /** >0 ise parçacık ışık da saçar (glow gücü). */
  light?: number;
}

export interface Particle extends Required<Omit<ParticleSpawn, "light">> {
  light: number;
  age: number;
  rest: boolean;
}

export interface ParticlesOptions {
  /** Yerel zemin yüksekliği; verilmezse zemin yok. */
  ground?: (x: number) => number;
}

export class Particles {
  readonly list: Particle[] = [];
  private readonly ground?: (x: number) => number;

  constructor(opts: ParticlesOptions = {}) {
    this.ground = opts.ground;
  }

  get count(): number {
    return this.list.length;
  }

  spawn(s: ParticleSpawn): void {
    const kind = s.kind ?? "spark";
    if (s.colors.length === 0) throw new Error("Particles.spawn: en az bir renk gerekli");
    this.list.push({
      kind, x: s.x, y: s.y, vx: s.vx ?? 0, vy: s.vy ?? 0, life: s.life,
      gravity: s.gravity ?? (kind === "dust" ? 0 : 420), drag: s.drag ?? (kind === "dust" ? 2 : 0.4),
      bounce: s.bounce ?? 0.3, size: s.size ?? (kind === "dust" ? 3 : 1.5), colors: s.colors,
      light: s.light ?? 0, age: 0, rest: false,
    });
  }

  update(dt: number): void {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.age += dt;
      if (p.age >= p.life) { this.list.splice(i, 1); continue; }
      if (p.rest) continue;
      p.vy += p.gravity * dt;
      const keep = Math.max(0, 1 - p.drag * dt);
      p.vx *= keep;
      p.vy *= keep;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (this.ground && p.kind !== "dust") {
        const g = this.ground(p.x);
        if (p.y > g) {
          p.y = g;
          if (p.vy > 0) p.vy = -p.vy * p.bounce;
          p.vx *= 0.7;
          if (Math.abs(p.vy) < 12) { p.vy = 0; if (Math.abs(p.vx) < 6) p.rest = true; }
        }
      }
    }
  }

  draw(frame: FxFrame): void {
    for (const p of this.list) {
      const t = p.age / p.life, c = p.colors[Math.min(p.colors.length - 1, Math.floor(t * p.colors.length))];
      if (p.kind === "spark") {
        // hızla uzayan iz, en fazla 6 px
        const sp = Math.hypot(p.vx, p.vy), len = Math.min(6, sp * 0.02);
        const tx = sp > 0 ? (p.vx / sp) * len : 0, ty = sp > 0 ? (p.vy / sp) * len : 0;
        frame.line(p.x - tx, p.y - ty, p.x, p.y, c);
        if (p.light > 0) frame.glow(p.x, p.y, 4, c, p.light * (1 - t));
      } else if (p.kind === "dust") {
        frame.disc(p.x, p.y, p.size * (0.6 + 0.8 * t), c, 1 - t, true);
      } else {
        const s = Math.max(1, Math.round(p.size * (1 - 0.4 * t)));
        frame.rect(p.x - s / 2, p.y - s + 0.5, s, s, c, t > 0.8 ? (1 - t) / 0.2 : 1);
      }
    }
  }
}

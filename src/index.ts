// Çekirdek — hem Node hem tarayıcıda kullanılabilir, hiçbir runtime API'sine dokunmaz.
// Çıktı katmanları (PNG için node:zlib, Canvas için DOM) kasıtlı olarak burada
// export edilmiyor — Node-only ve tarayıcı-only kod birbirine sızmasın diye
// ayrı yollardan import edilir: "./output/png.js", "./output/canvas.js".
export { Painter } from "./core/painter.js";
export type { GradientStop, VGradOptions } from "./core/painter.js";
export { hex, mix, shade, alpha, toCssHex } from "./core/color.js";
export type { RGBA, ColorInput } from "./core/color.js";
export { mulberry32 } from "./core/rng.js";
export type { Rng } from "./core/rng.js";
export {
  stars, fogBand, orb, glow, crenellate, tower, deadTree, veins, embers, ashfall, hoodedFigure,
} from "./motifs/index.js";
export type { GlowOptions, TowerOptions, HoodedFigureOptions } from "./motifs/index.js";
export { Catalog } from "./catalog/index.js";
export type { CatalogMeta, CatalogEntry, AtlasResult } from "./catalog/index.js";
export { outline, glint, mirrorX } from "./icon/index.js";
export { stoneCourses, lancetWindow, archedDoor, contactShadow, WARM_STONE } from './motifs/architecture.js';
export type { MasonryPalette } from './motifs/architecture.js';
export { downsample } from './core/resample.js';
export { roomShell, windowPane, rug, COZY_INTERIOR } from './motifs/interior.js';
export type { InteriorPalette, InteriorOptions, WindowOptions, RugColors } from './motifs/interior.js';
export { FxFrame, composite, bayer } from './fx/frame.js';
export type { CompositeOptions } from './fx/frame.js';
export { Particles } from './fx/particles.js';
export type { ParticleKind, ParticleSpawn, Particle, ParticlesOptions } from './fx/particles.js';
export { renderEffect } from './fx/effect.js';
export type { Effect, EffectMeta, EffectInstance, RenderEffectOptions } from './fx/effect.js';
export { sparkBurst } from './fx/presets.js';
export type { SparkBurstOptions } from './fx/presets.js';
export { contactSheet } from './output/contact.js';
export type { ContactSheetOptions } from './output/contact.js';
export { H32, vnoise, fbm } from './core/noise.js';
export { stroke, wobblePoly, erode, roughTower } from './core/organic.js';
export { resizeArea, chromaKey, quantizeKMeans, despeckle } from './core/image.js';
export type { ChromaKeyOptions, QuantizeOptions } from './core/image.js';

// Çekirdek — hem Node hem tarayıcıda kullanılabilir, hiçbir runtime API'sine dokunmaz.
// Çıktı katmanları (PNG için node:zlib, Canvas için DOM) kasıtlı olarak burada
// export edilmiyor — Node-only ve tarayıcı-only kod birbirine sızmasın diye
// ayrı yollardan import edilir: "./output/png.js", "./output/canvas.js".
export { Painter } from "./core/painter.js";
export type { GradientStop, VGradOptions } from "./core/painter.js";
export { hex, mix, shade, alpha, toCssHex, toHsv, fromHsv, luma, colorDistance } from "./core/color.js";
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
// Pixel Logic teknikleri (recipes/ altındaki line-art, anti-aliasing, color,
// dithering, perspective, cleanup, subpixel tarifleri).
export { hueRamp, hueToward, inkOf, paletteOf, nearestColor, quantize, HIGHLIGHT_HUE, SHADOW_HUE } from './palette/index.js';
export type { RampOptions, SaturationCurve } from './palette/index.js';
export { lintSprite, formatLint, markIssues } from './lint/index.js';
export type { LintKind, LintIssue, LintOptions, LintReport } from './lint/index.js';
export { stairs, runCurve, curveRunIssues } from './lineart/index.js';
export type { RunIssue } from './lineart/index.js';
export { selectiveOutline, colouredOutline } from './icon/selout.js';
export type { SelOutOptions } from './icon/selout.js';
export { aaPoly, aaEllipse } from './core/aa.js';
export type { AAOptions } from './core/aa.js';
export { ditherLevel, ditherRect, ditherBands } from './dither/index.js';
export type { DitherPattern, DitherBandOptions } from './dither/index.js';
export { subpixelShift } from './core/subpixel.js';
export type { SubpixelOptions } from './core/subpixel.js';
export { isoDiamond, isoBox } from './iso/index.js';
export type { IsoBoxColors } from './iso/index.js';

// gifenc kendi tip tanımı yayınlamıyor — README'deki gerçek API'ye göre
// elle yazıldı. Sadece burada kullandığımız yüzeyi kapsar.
declare module "gifenc" {
  export interface WriteFrameOptions {
    palette?: number[][];
    delay?: number;
    transparent?: boolean;
    transparentIndex?: number;
    dispose?: number;
    repeat?: number;
    first?: boolean;
  }

  export interface GIFEncoderInstance {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: WriteFrameOptions): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    reset(): void;
  }

  interface GifencModule {
    GIFEncoder(opts?: { auto?: boolean }): GIFEncoderInstance;
    quantize(
      rgba: Uint8Array | Uint8ClampedArray,
      maxColors: number,
      opts?: Record<string, unknown>,
    ): number[][];
    applyPalette(
      rgba: Uint8Array | Uint8ClampedArray,
      palette: number[][],
      format?: string,
    ): Uint8Array;
  }

  // gifenc bir CommonJS modülü — Node native ESM loader'ı named export'ları
  // güvenilir çıkaramıyor, bu yüzden default import + destructure kullanılıyor
  // (bkz. src/output/gif.ts).
  const gifenc: GifencModule;
  export default gifenc;
}

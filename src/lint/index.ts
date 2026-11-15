// ============================================================
// Sprite lint — temizlik (clean-up) aşamasının otomatik ilk turu.
// Kaynak: recipes/line-art.md, recipes/anti-aliasing.md, recipes/cleanup.md.
//
// Bulduğu sorunlar:
//   nub      siluetin ucunda kısa çıkıntı ("meme ucu"): uçtaki sıra, yanındaki
//            adımlardan kısa. Tam sayı merkez+yarıçaplı elipslerde sık görülür.
//   double   1px çizgide L-köşe ("çift piksel"); merdiveni kalınlaştırır.
//   jaggy    merdivende iki uzun adım arasında kalan tek kısa adım
//            ("bir sırayı kendinden büyüklerle çevreleme" kuralı).
//   banding  iki 1px çizginin aynı boyda, merdiven boyunca yapışık gitmesi.
//   stray    düz bir alanın ortasında tek başına kalmış piksel (gürültü).
//   colors   renk sayısı sınırı aşıyor.
//   similar  gözün ayırt edemeyeceği kadar yakın iki renk.
//   pureBlack saf #000000 kullanımı (renkli koyu ton önerilir).
//
// Bu bir sezgisel kontroldür, hakem değildir: her bulgu görüntüye bakılarak
// değerlendirilir. "Lint temiz" demek "sanat iyi" demek değildir.
// ============================================================
import { Painter } from "../core/painter.js";
import { colorDistance, type RGBA } from "../core/color.js";

export type LintKind = "nub" | "double" | "jaggy" | "banding" | "stray" | "colors" | "similar" | "pureBlack";

export interface LintIssue {
  kind: LintKind;
  severity: "warn" | "info";
  /** Sorunlu bölgenin kutusu (native piksel). */
  x: number; y: number; w: number; h: number;
  message: string;
}

export interface LintOptions {
  /** Bu sayının üstündeki benzersiz renk "colors" uyarısı verir. Varsayılan 16 (sprite). */
  maxColors?: number;
  /** Bu uzaklığın altındaki renk çiftleri "similar" bilgisi verir. Varsayılan 20. */
  similarDistance?: number;
  /** Opak sayılacak minimum alfa. Varsayılan 128. */
  minAlpha?: number;
}

export interface LintReport {
  issues: LintIssue[];
  colors: number;
  counts: Record<LintKind, number>;
}

const MESSAGES: Record<LintKind, string> = {
  nub: "Siluetin ucunda kısa çıkıntı (meme ucu). Düz uç, yanındaki adımlardan uzun olmalı: uçtaki sırayı uzat ya da sil.",
  double: "1px çizgide L-köşe (çift piksel). Köşedeki pikseli sil; merdiven incelir.",
  jaggy: "Merdivende kısa adım iki uzun adımın arasında. Adımları tekdüze yap (2'lerin arasına 1 koyma) veya AA ile yumuşat.",
  banding: "İki 1px çizgi aynı boyda yapışık gidiyor (banding). Bir uçtan piksel ekle/sil veya AA ile kır.",
  stray: "Düz alanda tek başına piksel. Kasıtlı parıltı değilse kaldır; gürültü gibi okunur.",
  colors: "Renk sayısı sınırı aşıyor. Yakın tonları birleştir, rampaları paylaştır.",
  similar: "İki renk neredeyse aynı; bu boyutta ayırt edilmez. Birleştir veya farkı artır.",
  pureBlack: "Saf siyah kullanılmış. Paletten türeyen koyu renkli ton (inkOf) daha canlı durur.",
};

const SEVERITY: Record<LintKind, "warn" | "info"> = {
  nub: "warn",
  double: "warn", jaggy: "warn", banding: "warn", stray: "info",
  colors: "warn", similar: "info", pureBlack: "info",
};

/** Renk ızgarası: opak pikselde 24-bit RGB anahtarı, şeffafta -1. */
function colorGrid(p: Painter, minAlpha: number): Int32Array {
  const g = new Int32Array(p.w * p.h);
  for (let i = 0, j = 0; j < g.length; i += 4, j++)
    g[j] = p.data[i + 3] >= minAlpha ? (p.data[i] << 16) | (p.data[i + 1] << 8) | p.data[i + 2] : -1;
  return g;
}

interface Run { a: number; b: number; len: number; lineLike: boolean; }

/**
 * Bir satırın (axis=h) ya da sütunun (axis=v) aynı renkli maksimal koşuları.
 * lineLike: koşunun hiçbir pikselinin dik eksende aynı renkte komşusu yok (1px çizgi).
 */
function buildRuns(g: Int32Array, w: number, h: number, axis: "h" | "v"): Map<number, Run>[] {
  const lines = axis === "h" ? h : w;
  const len = axis === "h" ? w : h;
  const at = (line: number, pos: number): number => {
    if (line < 0 || pos < 0 || line >= lines || pos >= len) return -1;
    return axis === "h" ? g[line * w + pos] : g[pos * w + line];
  };
  const out: Map<number, Run>[] = [];
  for (let line = 0; line < lines; line++) {
    const m = new Map<number, Run>();
    let pos = 0;
    while (pos < len) {
      const c = at(line, pos);
      if (c === -1) { pos++; continue; }
      let end = pos;
      while (end + 1 < len && at(line, end + 1) === c) end++;
      let lineLike = true;
      for (let q = pos; q <= end && lineLike; q++)
        if (at(line - 1, q) === c || at(line + 1, q) === c) lineLike = false;
      const run: Run = { a: pos, b: end, len: end - pos + 1, lineLike };
      for (let q = pos; q <= end; q++) m.set(q, run);
      pos = end + 1;
    }
    out.push(m);
  }
  return out;
}

function box(kind: LintKind, x: number, y: number, w: number, h: number): LintIssue {
  return { kind, severity: SEVERITY[kind], x, y, w, h, message: MESSAGES[kind] };
}

/** Aynı türden, birbirine değen/çakışan kutuları tek kutuda birleştirir. */
function mergeIssues(issues: LintIssue[]): LintIssue[] {
  const out: LintIssue[] = [];
  for (const kind of Object.keys(MESSAGES) as LintKind[]) {
    let list = issues.filter((i) => i.kind === kind);
    let merged = true;
    while (merged) {
      merged = false;
      const next: LintIssue[] = [];
      for (const it of list) {
        const hit = next.find((o) =>
          it.x <= o.x + o.w && o.x <= it.x + it.w && it.y <= o.y + o.h && o.y <= it.y + it.h);
        if (hit && kind !== "colors" && kind !== "similar" && kind !== "pureBlack") {
          const x0 = Math.min(hit.x, it.x), y0 = Math.min(hit.y, it.y);
          const x1 = Math.max(hit.x + hit.w, it.x + it.w), y1 = Math.max(hit.y + hit.h, it.y + it.h);
          hit.x = x0; hit.y = y0; hit.w = x1 - x0; hit.h = y1 - y0;
          merged = true;
        } else next.push({ ...it });
      }
      list = next;
    }
    out.push(...list);
  }
  return out;
}

/** Sprite'ı tarar ve temizlik önerilerini döndürür. Tuvali değiştirmez. */
export function lintSprite(p: Painter, opts: LintOptions = {}): LintReport {
  const { w, h } = p;
  const minAlpha = opts.minAlpha ?? 128;
  const g = colorGrid(p, minAlpha);
  const at = (x: number, y: number): number => (x < 0 || y < 0 || x >= w || y >= h ? -1 : g[y * w + x]);
  const issues: LintIssue[] = [];

  // --- nub: siluet ucunda kısa çıkıntı (yalnız alfa maskesi) ---
  const solid = (x: number, y: number): boolean => at(x, y) !== -1;
  for (const axis of ["h", "v"] as const) {
    const lines = axis === "h" ? h : w, len = axis === "h" ? w : h;
    const S = (line: number, pos: number): boolean => (axis === "h" ? solid(pos, line) : solid(line, pos));
    for (let line = 0; line < lines; line++) {
      let pos = 0;
      while (pos < len) {
        if (!S(line, pos)) { pos++; continue; }
        let end = pos;
        while (end + 1 < len && S(line, end + 1)) end++;
        for (const out of [-1, 1]) {
          // uç sıra: dış taraf (line+out) boyunca [pos-1, end+1] tamamen boş
          let isTip = true;
          for (let q = pos - 1; q <= end + 1 && isTip; q++) if (S(line + out, q)) isTip = false;
          if (!isTip || !S(line - out, pos) || !S(line - out, end)) continue;
          let a2 = pos, b2 = end;
          while (S(line - out, a2 - 1)) a2--;
          while (S(line - out, b2 + 1)) b2++;
          const L = end - pos + 1;
          if (pos - a2 > L && b2 - end > L)
            issues.push(axis === "h" ? box("nub", pos, line, L, 1) : box("nub", line, pos, 1, L));
        }
        pos = end + 1;
      }
    }
  }

  // --- double: L-köşe ---
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (c === -1) continue;
      const L = at(x - 1, y) === c, R = at(x + 1, y) === c, U = at(x, y - 1) === c, D = at(x, y + 1) === c;
      if (+L + +R + +U + +D !== 2 || (L && R) || (U && D)) continue;
      const dx = L ? -1 : 1, dy = U ? -1 : 1;
      if (at(x + dx, y + dy) === c) continue; // 2x2 blok köşesi, çizgi değil
      // Merdiven devam ediyorsa (dik kol yatayda, yatay kol dikeyde sürüyorsa) çift piksel.
      if (at(x - dx, y + dy) === c || at(x + dx, y - dy) === c) issues.push(box("double", x, y, 1, 1));
    }

  // --- jaggy: merdivende vadi adımı ---
  for (const axis of ["h", "v"] as const) {
    const runs = buildRuns(g, w, h, axis);
    const lines = runs.length;
    for (let line = 0; line < lines; line++) {
      const seen = new Set<Run>();
      for (const run of runs[line].values()) {
        if (seen.has(run)) continue;
        seen.add(run);
        if (!run.lineLike) continue;
        for (const s of [-1, 1]) {
          const prev = line + s >= 0 && line + s < lines ? runs[line + s].get(run.a - 1) : undefined;
          const next = line - s >= 0 && line - s < lines ? runs[line - s].get(run.b + 1) : undefined;
          if (!prev || !next || prev.b !== run.a - 1 || next.a !== run.b + 1) continue;
          if (!prev.lineLike || !next.lineLike) continue;
          // aynı renk: koşu haritaları renk ayırmıyor, piksel üzerinden doğrula
          const c = axis === "h" ? at(run.a, line) : at(line, run.a);
          const cp = axis === "h" ? at(prev.b, line + s) : at(line + s, prev.b);
          const cn = axis === "h" ? at(next.a, line - s) : at(line - s, next.a);
          if (cp !== c || cn !== c) continue;
          if (prev.len > run.len && next.len > run.len) {
            issues.push(axis === "h" ? box("jaggy", run.a, line, run.len, 1) : box("jaggy", line, run.a, 1, run.len));
          }
        }
      }
    }
  }

  // --- banding: merdiven boyunca yapışık eşit 1px çizgiler ---
  for (const axis of ["v", "h"] as const) {
    const runs = buildRuns(g, w, h, axis); // axis=v: sütun koşuları
    const lines = runs.length;
    const colorOf = (line: number, pos: number): number => (axis === "v" ? at(line, pos) : at(pos, line));
    const hugs: { line: number; a: number; b: number }[] = [];
    for (let line = 0; line + 1 < lines; line++) {
      const seen = new Set<Run>();
      for (const run of runs[line].values()) {
        if (seen.has(run)) continue;
        seen.add(run);
        if (run.len < 2 || !run.lineLike) continue;
        const other = runs[line + 1].get(run.a);
        if (!other || other.a !== run.a || other.b !== run.b || !other.lineLike) continue;
        if (colorOf(line, run.a) === colorOf(line + 1, run.a)) continue;
        hugs.push({ line, a: run.a, b: run.b });
      }
    }
    for (const hg of hugs) {
      const chained = hugs.some((o) => o !== hg && Math.abs(o.line - hg.line) === 1 &&
        (o.a === hg.b + 1 || o.b === hg.a - 1));
      if (!chained) continue;
      issues.push(axis === "v" ? box("banding", hg.line, hg.a, 2, hg.b - hg.a + 1) : box("banding", hg.a, hg.line, hg.b - hg.a + 1, 2));
    }
  }

  // --- stray: düz alanda tek piksel ---
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const c = at(x, y);
      if (c === -1) continue;
      const n = at(x - 1, y - 1);
      if (n === -1 || n === c) continue;
      let uniform = true;
      for (let yy = -1; yy <= 1 && uniform; yy++)
        for (let xx = -1; xx <= 1; xx++)
          if ((xx || yy) && at(x + xx, y + yy) !== n) { uniform = false; break; }
      if (uniform) issues.push(box("stray", x, y, 1, 1));
    }

  // --- renk kontrolleri ---
  const firstAt = new Map<number, number>();
  for (let j = 0; j < g.length; j++) if (g[j] !== -1 && !firstAt.has(g[j])) firstAt.set(g[j], j);
  const keys = [...firstAt.keys()];
  const maxColors = opts.maxColors ?? 16;
  if (keys.length > maxColors) {
    const it = box("colors", 0, 0, w, h);
    it.message = `${keys.length} renk (sınır ${maxColors}). ` + it.message;
    issues.push(it);
  }
  const rgb = (k: number): RGBA => [(k >> 16) & 255, (k >> 8) & 255, k & 255, 255];
  const hexOf = (k: number): string => "#" + k.toString(16).padStart(6, "0");
  const simD = opts.similarDistance ?? 20;
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) {
      if (colorDistance(rgb(keys[i]), rgb(keys[j])) >= simD) continue;
      const pos = firstAt.get(keys[j])!;
      const it = box("similar", pos % w, Math.floor(pos / w), 1, 1);
      it.message = `${hexOf(keys[i])} ≈ ${hexOf(keys[j])}. ` + it.message;
      issues.push(it);
    }
  if (firstAt.has(0)) {
    const pos = firstAt.get(0)!;
    issues.push(box("pureBlack", pos % w, Math.floor(pos / w), 1, 1));
  }

  const merged = mergeIssues(issues);
  const counts = { nub: 0, double: 0, jaggy: 0, banding: 0, stray: 0, colors: 0, similar: 0, pureBlack: 0 } as Record<LintKind, number>;
  for (const it of merged) counts[it.kind]++;
  return { issues: merged, colors: keys.length, counts };
}

/** Raporu okunur satırlara çevirir (ajan çıktısı / konsol için). */
export function formatLint(report: LintReport): string {
  if (report.issues.length === 0) return `Lint temiz (${report.colors} renk). Yine de görüntüye bak.`;
  const lines = report.issues.map((i) =>
    `[${i.severity}] ${i.kind} @ (${i.x},${i.y}) ${i.w}x${i.h}: ${i.message}`);
  const sum = (Object.entries(report.counts) as [LintKind, number][])
    .filter(([, n]) => n > 0).map(([k, n]) => `${k}=${n}`).join(", ");
  return `${report.colors} renk; ${sum}\n` + lines.join("\n");
}

const MARK: Record<LintKind, RGBA> = {
  nub: [255, 220, 0, 220],
  double: [255, 40, 60, 200], jaggy: [255, 150, 0, 200], banding: [230, 40, 230, 200],
  stray: [0, 220, 255, 200], colors: [0, 0, 0, 0], similar: [80, 255, 120, 160], pureBlack: [0, 0, 0, 0],
};

/**
 * Sorunlu bölgeleri renkli bindirmeyle işaretlenmiş bir KOPYA döndürür
 * (nub sarı, double kırmızı, jaggy turuncu, banding mor, stray camgöbeği, similar yeşil).
 * Büyütüp görsel incelemede kullan.
 */
export function markIssues(p: Painter, report: LintReport): Painter {
  const out = new Painter(p.w, p.h);
  out.data.set(p.data);
  for (const it of report.issues) {
    const c = MARK[it.kind];
    if (c[3] === 0) continue;
    for (let y = it.y; y < it.y + it.h; y++)
      for (let x = it.x; x < it.x + it.w; x++) out.px(x, y, c);
  }
  return out;
}

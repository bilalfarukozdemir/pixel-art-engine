import { test } from "node:test";
import assert from "node:assert/strict";
import { FxFrame, Painter, Particles, composite, contactSheet, renderEffect, sparkBurst } from "../dist/index.js";

const same = (a, b) => a.length === b.length && a.every((p, i) => Buffer.compare(Buffer.from(p.data), Buffer.from(b[i].data)) === 0);
const opaque = (p) => { let n = 0; for (let i = 3; i < p.data.length; i += 4) if (p.data[i] > 0) n++; return n; };

test("renderEffect: aynı seed aynı kareler, farklı seed farklı", () => {
  assert.ok(same(renderEffect(sparkBurst, { seed: 3 }), renderEffect(sparkBurst, { seed: 3 })));
  assert.ok(!same(renderEffect(sparkBurst, { seed: 3 }), renderEffect(sparkBurst, { seed: 4 })));
});

test("renderEffect: kare sayısı, ilk kare dolu, t = duration boş", () => {
  const frames = renderEffect(sparkBurst);
  assert.equal(frames.length, Math.round(sparkBurst.meta.duration * sparkBurst.meta.fps) + 1);
  assert.ok(opaque(frames[0]) > 0, "flaş ilk karede görünür");
  assert.equal(opaque(frames.at(-1)), 0, "tek seferlik efekt sonunda hiçbir şey çizmez");
});

test("renderEffect: kare hızı fiziği değiştirmez", () => {
  const a = renderEffect(sparkBurst, { fps: 20 }), b = renderEffect(sparkBurst, { fps: 10 });
  assert.ok(same([a[10]], [b[5]]), "t = 0,5 s iki hızda aynı");
});

test("Particles: parça yere düşer, seker ve durur; derinlikli zemin x'e göre", () => {
  const ground = (x) => (x > 0 ? 6 : -4);
  const ps = new Particles({ ground });
  ps.spawn({ kind: "chunk", x: 5, y: -20, life: 5, colors: ["#fff"] });
  ps.spawn({ kind: "chunk", x: -5, y: -20, life: 5, colors: ["#fff"] });
  for (let i = 0; i < 300; i++) ps.update(1 / 120);
  assert.equal(ps.list[0].y, 6);
  assert.equal(ps.list[1].y, -4);
  assert.ok(ps.list.every((p) => p.rest), "durdu");
  for (let i = 0; i < 120 * 3; i++) ps.update(1 / 120);
  assert.equal(ps.count, 0, "ömrü bitince silinir");
});

test("Particles: toz titreşimle söner, yarı saydam piksel bırakmaz", () => {
  const ps = new Particles();
  ps.spawn({ kind: "dust", x: 0, y: 0, life: 1, size: 5, colors: ["#c0a080"] });
  for (let i = 0; i < 60; i++) ps.update(1 / 120);
  const f = new FxFrame(32, 32, [16, 16]);
  ps.draw(f);
  const alphas = new Set();
  for (let i = 3; i < f.color.data.length; i += 4) alphas.add(f.color.data[i]);
  assert.deepEqual([...alphas].sort((a, b) => a - b), [0, 255]);
});

test("composite: ışık kademeli, boş yerde opaklık olur, ışıksız kare değişmez", () => {
  const f = new FxFrame(24, 24, [12, 12]);
  f.dot(0, 0, "#204060");
  const plain = composite(f);
  assert.deepEqual(Array.from(plain.data), Array.from(f.color.data));
  f.glow(0, 0, 10, "#ffffff", 1);
  const lit = composite(f, { levels: 3 });
  const alphas = new Set();
  for (let i = 3; i < lit.data.length; i += 4) if (f.color.data[i] === 0 && lit.data[i] > 0) alphas.add(lit.data[i]);
  assert.ok(alphas.size >= 1 && alphas.size <= 3, `en fazla 3 kademe, görülen ${[...alphas]}`);
  const c = lit.get(12, 12);
  assert.ok(c[0] > 0x20 && c[2] > 0x60, "ışık rengin üstüne eklenir");
});

test("contactSheet: boyut, büyütme ve son karenin hep alınması", () => {
  const frames = Array.from({ length: 7 }, (_, i) => { const p = new Painter(10, 8); p.px(i, 0, "#ff0000"); return p; });
  const sheet = contactSheet(frames, { cols: 3, scale: 2, every: 3, gap: 4 });
  // alınan kareler: 0, 3, 6 → tek satır
  assert.equal(sheet.w, 4 + 3 * (20 + 4));
  assert.equal(sheet.h, 4 + (16 + 8 + 4));
  const last = sheet.get(4 + 2 * 24 + 6 * 2, 4 + 8);
  assert.deepEqual(last, [255, 0, 0, 255], "6. karenin pikseli 2x büyütülmüş yerinde");
  assert.throws(() => contactSheet([]));
});

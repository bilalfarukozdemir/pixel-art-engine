import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Painter, rotateImage } from '../dist/index.js';
const opaque = p => { let n = 0; for (let i = 3; i < p.data.length; i += 4) if (p.data[i]) n++; return n; };
test('rotateImage: sıfır kopyalar, çeyrek dönüşler kayıpsızdır', () => {
  const p = new Painter(3, 2); p.px(0, 0, '#ff0000'); p.px(2, 0, '#00ff00'); p.px(1, 1, '#0000ff');
  const z = rotateImage(p, 0); assert.notEqual(z, p); assert.deepEqual(z.data, p.data);
  const r = rotateImage(p, 90); assert.equal(r.w, 2); assert.equal(r.h, 3); assert.equal(opaque(r), opaque(p));
  assert.deepEqual(rotateImage(rotateImage(rotateImage(rotateImage(p, 90), 90), 90), 90).data, p.data);
  assert.equal(rotateImage(p, 180).w, 3); assert.equal(rotateImage(p, 270).h, 3);
});
test('rotateImage: renkleri korur, boşluk saydamdır ve expand false kırpar', () => {
  const p = new Painter(3, 3); p.fill('#123456'); const r = rotateImage(p, 45), colors = new Set();
  for (let i = 0; i < p.data.length; i += 4) if (p.data[i + 3]) colors.add([...p.data.slice(i, i + 4)].join(','));
  let transparent = 0;
  for (let i = 0; i < r.data.length; i += 4) { if (!r.data[i + 3]) transparent++; else assert.ok(colors.has([...r.data.slice(i, i + 4)].join(','))); }
  assert.ok(transparent > 0); const crop = rotateImage(p, 45, { expand: false }); assert.equal(crop.w, 3); assert.equal(crop.h, 3);
});

test('rotateImage: dikdörtgende 90/180/270 doğru yönde ve tüm RGBA baytları kayıpsız', () => {
  const src = new Painter(4, 3);
  for (let i = 0; i < src.data.length; i += 4) src.data.set([i, 255 - i, 31, i % 3 ? 255 : 0], i);
  const saved = src.data.slice();
  for (const angle of [90, 180, 270]) {
    const out = rotateImage(src, angle);
    assert.deepEqual([out.w, out.h], angle === 180 ? [4, 3] : [3, 4]);
    assert.equal(opaque(out), opaque(src));
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const [dx, dy] = angle === 90 ? [src.h - 1 - y, x]
        : angle === 180 ? [src.w - 1 - x, src.h - 1 - y] : [y, src.w - 1 - x];
      assert.deepEqual(out.get(dx, dy), src.get(x, y));
    }
  }
  let out = src;
  for (let i = 0; i < 4; i++) out = rotateImage(out, 90);
  assert.deepEqual([out.w, out.h], [src.w, src.h]);
  assert.deepEqual(out.data, saved);
  assert.deepEqual(src.data, saved);
});

test('rotateImage: negatif ve büyük açılar normalleştirilir; sıfır bağımsız kopyadır', () => {
  const src = new Painter(7, 4);
  src.rect(0, 0, 3, 4, '#ab3456'); src.px(6, 0, '#123456');
  for (const [angle, normalized] of [[-90, 270], [-45, 315], [374, 14], [765, 45], [-720, 0], [360, 0]]) {
    const a = rotateImage(src, angle), b = rotateImage(src, normalized);
    assert.deepEqual([a.w, a.h], [b.w, b.h]);
    assert.deepEqual(a.data, b.data);
  }
  const zero = rotateImage(src, 0);
  assert.deepEqual(zero.data, src.data);
  zero.data[0] ^= 255;
  assert.notEqual(zero.data[0], src.data[0]);
  for (const angle of [NaN, Infinity, -Infinity]) assert.throws(() => rotateImage(src, angle), RangeError);
});

test('rotateImage: çok renkli kaynakta en yakın komşu RGBA kümesi, saydam boşluk ve değişmez kaynak', () => {
  const src = new Painter(40, 24);
  src.fill('#123456'); src.rect(8, 0, 8, 24, '#aabbcc'); src.rect(24, 0, 8, 24, [230, 30, 40, 128]);
  const saved = src.data.slice(), colors = new Set();
  for (let i = 0; i < src.data.length; i += 4) colors.add([...src.data.slice(i, i + 4)].join(','));
  for (const angle of [14, 45, -14, 123]) {
    const out = rotateImage(src, angle);
    const rad = angle * Math.PI / 180;
    assert.equal(out.w, Math.ceil(Math.abs(src.w * Math.cos(rad)) + Math.abs(src.h * Math.sin(rad))));
    assert.equal(out.h, Math.ceil(Math.abs(src.w * Math.sin(rad)) + Math.abs(src.h * Math.cos(rad))));
    assert.ok(opaque(out) > 0 && opaque(out) < out.w * out.h);
    for (let i = 0; i < out.data.length; i += 4) {
      if (out.data[i + 3]) assert.ok(colors.has([...out.data.slice(i, i + 4)].join(',')));
      else assert.deepEqual([...out.data.slice(i, i + 4)], [0, 0, 0, 0]);
    }
  }
  assert.deepEqual(src.data, saved);
});

test('rotateImage: 45 derecede dolu dikdörtgenin satır ve sütunlarında iç delik yok', () => {
  const src = new Painter(40, 24); src.fill('#123456');
  const out = rotateImage(src, 45);
  assert.ok(opaque(out) > 0);
  for (const vertical of [false, true]) {
    const lines = vertical ? out.w : out.h, length = vertical ? out.h : out.w;
    for (let line = 0; line < lines; line++) {
      const hits = [];
      for (let i = 0; i < length; i++) if (out.get(vertical ? line : i, vertical ? i : line)[3]) hits.push(i);
      if (hits.length) assert.equal(hits.length, hits.at(-1) - hits[0] + 1, `iç delik: ${vertical}, ${line}`);
    }
  }
  assert.equal(out.get(Math.floor(out.w / 2), Math.floor(out.h / 2))[3], 255);
});

test('rotateImage: expand=false dikdörtgen boyutlarını korur ve merkezi kırpar', () => {
  const src = new Painter(8, 4); src.fill('#123456');
  for (const angle of [0, 14, 45, 90, 180, 270, -45, 405]) {
    const out = rotateImage(src, angle, { expand: false });
    assert.deepEqual([out.w, out.h], [8, 4]);
    assert.ok(opaque(out) > 0);
    if (angle === 90 || angle === 270) assert.equal(opaque(out), 16);
  }
});

test('rotateImage: çok küçük açıda expand dönen tuvali küçültmez', () => {
  const src = new Painter(40, 24); src.fill('#123456');
  // Sıfırdan farklı bu açılarda izdüşümler 40 ve 24'ten biraz büyüktür.
  for (const angle of [1e-10, -1e-10]) {
    const out = rotateImage(src, angle);
    assert.deepEqual([out.w, out.h], [41, 25]);
  }
});

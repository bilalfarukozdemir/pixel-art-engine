import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, scatterPoints } from '../dist/index.js';
test('scatterPoints: sınırlar, tamsayılar ve aynı tohum aynı sonuç', () => {
  const bounds = { x: 2, y: 3, w: 12, h: 9 }, a = scatterPoints(bounds, 12, mulberry32(7));
  assert.deepEqual(a, scatterPoints(bounds, 12, mulberry32(7)));
  for (const p of a) { assert.ok(Number.isInteger(p.x) && Number.isInteger(p.y)); assert.ok(p.x >= 2 && p.x < 14 && p.y >= 3 && p.y < 12); }
});
test('scatterPoints: minDist korunur ve denemeler sınırlıdır', () => {
  const pts = scatterPoints({ x: 0, y: 0, w: 20, h: 20 }, 20, mulberry32(2), { minDist: 5 });
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) assert.ok(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) >= 5);
  assert.ok(scatterPoints({ x: 0, y: 0, w: 1, h: 1 }, 100, () => 0.5, { minDist: 2, maxTries: 2 }).length <= 1);
});

test('scatterPoints: boş/negatif alan ve count RNG çağırmadan boş döner', () => {
  const rng = () => { assert.fail('boş yerleştirme RNG tüketmemeli'); };
  const bounds = { x: 0, y: 0, w: 10, h: 10 };
  for (const count of [0, -1, -2.5]) assert.deepEqual(scatterPoints(bounds, count, rng), []);
  for (const patch of [{ w: 0 }, { h: 0 }, { w: -1 }, { h: -1 }, { x: 0.1, w: 0.2 }]) {
    assert.deepEqual(scatterPoints({ ...bounds, ...patch }, 10, rng), []);
  }
});

test('scatterPoints: kesirli/negatif sınırlar içinde tüm çiftler minDist sağlar', () => {
  const bounds = { x: -10.7, y: -4.2, w: 40.3, h: 30.8 };
  const opts = { minDist: 3.5, maxTries: 50 };
  const points = scatterPoints(bounds, 25, mulberry32(91), opts);
  assert.equal(points.length, 25, 'boş sonuçla mesafe testi geçmemeli');
  assert.deepEqual(points, scatterPoints(bounds, 25, mulberry32(91), opts));
  for (const p of points) {
    assert.ok(Number.isInteger(p.x) && Number.isInteger(p.y));
    assert.ok(p.x >= bounds.x && p.x < bounds.x + bounds.w && p.y >= bounds.y && p.y < bounds.y + bounds.h);
  }
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
    assert.ok(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) >= opts.minDist);
  }
});

test('scatterPoints: her noktanın deneme sınırı kesin, varsayılan 30; başarısız nokta atlanır', () => {
  for (const maxTries of [undefined, 2]) {
    let calls = 0;
    const points = scatterPoints({ x: 0, y: 0, w: 1, h: 1 }, 4, () => { calls++; return 0.5; }, { minDist: 1, maxTries });
    assert.deepEqual(points, [{ x: 0, y: 0 }]);
    assert.equal(calls, 2 * (1 + 3 * (maxTries ?? 30)));
  }
  const values = [0, 0, 0, 0, 0.9, 0];
  let calls = 0;
  assert.deepEqual(scatterPoints({ x: 0, y: 0, w: 10, h: 1 }, 3, () => values[calls++], { minDist: 2, maxTries: 1 }), [{ x: 0, y: 0 }, { x: 9, y: 0 }]);
  assert.equal(calls, 6);
});

test('scatterPoints: mesafe eşitliği kabul edilir ve geçersiz seçenekler reddedilir', () => {
  const bounds = { x: 0, y: 0, w: 4, h: 1 };
  let calls = 0;
  const values = [0, 0, 0.75, 0];
  assert.equal(scatterPoints(bounds, 2, () => values[calls++], { minDist: 3 }).length, 2);
  assert.equal(scatterPoints(bounds, 4, () => 0).length, 4, 'varsayılan minDist=0');
  for (const opts of [{ minDist: -1 }, { minDist: NaN }, { maxTries: 0 }, { maxTries: Infinity }]) {
    assert.throws(() => scatterPoints(bounds, 2, mulberry32(1), opts), RangeError);
  }
});

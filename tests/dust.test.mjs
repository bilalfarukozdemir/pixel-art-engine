import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dustPuff, renderEffect } from '../dist/index.js';
const opaque = p => { let n = 0; for (let i = 3; i < p.data.length; i += 4) if (p.data[i]) n++; return n; };
const same = (a, b) => a.length === b.length && a.every((p, i) => Buffer.compare(Buffer.from(p.data), Buffer.from(b[i].data)) === 0);
test('dustPuff: aynı seed aynı kareler, ilk kare görünür ve sonunda söner', () => {
  const a = renderEffect(dustPuff, { seed: 17 }), b = renderEffect(dustPuff, { seed: 17 });
  assert.ok(same(a, b)); assert.ok(opaque(a[0]) > 0);
  const peak = Math.max(...a.slice(0, Math.ceil(a.length / 2)).map(opaque)); assert.ok(opaque(a.at(-1)) < peak);
});

test('dustPuff: tüm kareler belirlenimci, tohuma duyarlı, kısa ve son kare boş', () => {
  const frames = renderEffect(dustPuff, { seed: 17 });
  assert.equal(frames.length, Math.round(dustPuff.meta.duration * dustPuff.meta.fps) + 1);
  assert.ok(dustPuff.meta.duration > 0 && dustPuff.meta.duration <= 1);
  assert.ok(frames.every(p => p.w === dustPuff.meta.w && p.h === dustPuff.meta.h));
  assert.ok(!same(frames, renderEffect(dustPuff, { seed: 18 })));
  const peak = Math.max(...frames.map(opaque));
  assert.ok(peak > 0);
  assert.ok(opaque(frames.at(-1)) < peak);
  assert.equal(opaque(frames.at(-1)), 0);
  assert.ok(renderEffect(dustPuff, { opts: { count: 0 } }).every(p => opaque(p) === 0));
});

test('dustPuff: zeminden yukarı yükselir ve iki yana açılır', () => {
  const frames = renderEffect(dustPuff, { seed: 17 });
  const extent = p => {
    const xs = [], ys = [];
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.get(x, y)[3]) { xs.push(x); ys.push(y); }
    assert.ok(xs.length > 0);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), cy: ys.reduce((a, b) => a + b, 0) / ys.length };
  };
  const start = extent(frames[0]), middle = extent(frames[4]);
  assert.ok(Math.abs(start.cy - dustPuff.meta.origin[1]) <= 2);
  assert.ok(middle.cy < start.cy && middle.top < start.top);
  assert.ok(middle.left < start.left && middle.right > start.right);
});

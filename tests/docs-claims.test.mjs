// recipes/ altındaki tariflerde geçen somut sayıları ve örnekleri yeniden üretir.
// Bir tarif sayısı değişirse bu test kırılır; tarif ile kod birlikte güncellenir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Painter, hex, shade, toCssHex, toHsv, outline, aaEllipse, hueRamp, lintSprite,
  runCurve, curveRunIssues, ditherLevel, bayer,
} from '../dist/index.js';

const INK='#2b1d24';

test('line-art.md: 196 radius pairs, integer radii leave nubs, half-less radii leave none',()=>{
  const count=(draw,d)=>{ let nub=0,n=0;
    for(let r=3;r<=16;r++) for(let q=3;q<=16;q++){ const p=new Painter(42,42); draw(p,r-d,q-d); nub+=lintSprite(p).counts.nub; n++; }
    return {n,nub}; };
  const el=(p,rx,ry)=>p.ellipse(20,20,rx,ry,'#4a9e3c');
  const aa=(p,rx,ry)=>aaEllipse(p,20,20,rx,ry,'#4a9e3c');
  assert.deepEqual(count(el,0),{n:196,nub:676});
  assert.deepEqual(count(el,0.5),{n:196,nub:0});
  assert.deepEqual(count(aa,0),{n:196,nub:420});
  assert.deepEqual(count(aa,0.5),{n:196,nub:0});
});

test('line-art.md: 3-2-1-1-2-3-4 is the top-left quarter of ellipse(…,11.5,8.5); the mixed version is jaggy',()=>{
  const inkAt=(p,x,y)=>p.get(x,y).join()===hex(INK).join();
  const e=new Painter(44,44); e.ellipse(22,22,11.5,8.5,'#888888'); outline(e,INK);
  let sx=0; while(!inkAt(e,sx,22)) sx++;
  const c=new Painter(44,44); runCurve(c,sx,22,[3,2,1,1],[2,3,4],1,-1,INK);
  for(let y=0;y<=22;y++) for(let x=0;x<=22;x++) assert.equal(inkAt(c,x,y),inkAt(e,x,y),`${x},${y}`);
  assert.deepEqual(curveRunIssues([3,2,1,1],[2,3,4]),[]);
  assert.ok(curveRunIssues([3,1,2],[2,1,3,4]).length>0);
  const bad=new Painter(32,32); runCurve(bad,4,20,[3,1,2],[2,1,3,4],1,-1,INK);
  assert.ok(lintSprite(bad).counts.jaggy>=1);
});

test('color.md: shade keeps the hue, hueRamp shifts it (#a8805f example)',()=>{
  const dark=shade('#a8805f',0.45);
  assert.equal(toCssHex(dark),'#4c3a2b');
  assert.equal(Math.round(toHsv(dark)[0]),27);
  const r=hueRamp('#a8805f');
  assert.deepEqual(r.map(c=>toCssHex(c)),['#332023','#6e4841','#a8805f','#d0be8a','#f7f7bc']);
  assert.equal(Math.round(toHsv(r[0])[0]),351);
  assert.equal(Math.round(toHsv(r[4])[0]),60);
});

test('dithering.md: ordered dither uses the same Bayer matrix as fx bayer()',()=>{
  for(let level=0;level<=16;level++) for(let y=0;y<4;y++) for(let x=0;x<4;x++)
    assert.equal(ditherLevel(x,y,level),bayer(x,y)<level/16,`${level} ${x},${y}`);
});

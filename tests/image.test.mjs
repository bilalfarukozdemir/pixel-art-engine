import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Painter, resizeArea, chromaKey, quantizeKMeans, despeckle } from '../dist/index.js';

function image(w,h,pixels) { const p=new Painter(w,h);p.data.set(pixels.flat());return p; }
test('resizeArea: fractional source coverage, alpha weighting, aspect ratio and no mutation',()=>{
  const p=image(3,1,[[255,0,0,255],[0,255,0,255],[0,0,255,255]]), before=p.data.slice();
  const q=resizeArea(p,2,1);
  assert.deepEqual(q.get(0,0),[170,85,0,255]);assert.deepEqual(q.get(1,0),[0,85,170,255]);
  assert.deepEqual(p.data,before);
  const a=image(2,1,[[255,0,0,255],[0,255,0,0]]);
  assert.deepEqual(resizeArea(a,1,1).get(0,0),[255,0,0,128]);
  assert.equal(resizeArea(new Painter(6,4),3).h,2);
  assert.deepEqual(resizeArea(new Painter(2,2),1).get(0,0),[0,0,0,0]);
  for(const width of [0,1.5,4,NaN]) assert.throws(()=>resizeArea(p,width,1),RangeError);
});
test('chromaKey: default magenta key, edge kill, spill clamp and alpha preservation',()=>{
  const p=image(4,1,[[255,0,255,255],[130,100,130,255],[180,140,160,128],[20,30,40,255]]);
  chromaKey(p); assert.deepEqual([...p.data].filter((_,i)=>i%4===3),[0,0,128,255]);
  const spill=image(1,1,[[30,50,100,128]]);chromaKey(spill);
  assert.deepEqual(spill.get(0,0),[30,50,100,128]);
  const clipped=image(1,1,[[100,50,70,128]]);chromaKey(clipped);
  assert.deepEqual(clipped.get(0,0),[90,50,70,128]);
});
test('chromaKey: configurable green key and thresholds',()=>{
  const p=image(2,1,[[0,255,0,255],[80,120,80,255]]);chromaKey(p,{key:'#00ff00',passes:0,dominance:50,high:250});
  assert.equal(p.get(0,0)[3],0);assert.equal(p.get(1,0)[3],255);
  assert.throws(()=>chromaKey(p,{passes:-1}),RangeError);
  assert.throws(()=>chromaKey(p,{key:'#ffffff'}),/anahtar/);
});
test('chromaKey: edge kills are deferred between passes',()=>{
  const p=new Painter(5,5);p.fill([130,100,130,255]);
  chromaKey(p,{passes:1});assert.equal(p.get(2,2)[3],255);assert.equal(p.get(1,1)[3],255);assert.equal(p.get(0,0)[3],0);
  const q=new Painter(5,5);q.fill([130,100,130,255]);chromaKey(q,{passes:2});assert.equal(q.get(1,1)[3],0);assert.equal(q.get(2,2)[3],255);
});
test('quantizeKMeans: one-color mean ignores transparent pixels and preserves alpha',()=>{
  const p=image(3,1,[[10,20,30,128],[30,40,50,255],[255,0,255,0]]);quantizeKMeans(p,1);
  assert.deepEqual(p.get(0,0),[20,30,40,128]);assert.deepEqual(p.get(1,0),[20,30,40,255]);assert.deepEqual(p.get(2,0),[255,0,255,0]);
});
test('quantizeKMeans: seeded determinism, palette limit, empty inputs and validation',()=>{
  const p=new Painter(12,4);for(let i=0;i<p.data.length;i+=4)p.data.set([i%256,(i*7)%256,(i*13)%256,255],i);
  const q=new Painter(p.w,p.h);q.data.set(p.data);
  quantizeKMeans(p,3,{seed:42,maxSamples:20});quantizeKMeans(q,3,{seed:42,maxSamples:20});assert.deepEqual(p.data,q.data);
  const colors=new Set();for(let i=0;i<p.data.length;i+=4)colors.add([...p.data.slice(i,i+3)].join(','));assert.ok(colors.size<=3);
  quantizeKMeans(new Painter(1,1),24);
  const single=image(1,1,[[1,2,3,255]]);quantizeKMeans(single,24);assert.deepEqual(single.get(0,0),[1,2,3,255]);
  for(const k of [0,-1,1.5])assert.throws(()=>quantizeKMeans(p,k),RangeError);
});
test('despeckle: replaces isolated minority, preserves alpha and borders',()=>{
  const p=new Painter(3,3);p.fill('#aabbcc');p.data.set([1,2,3,128],16);despeckle(p);
  assert.deepEqual(p.get(1,1),[170,187,204,128]);assert.deepEqual(p.get(0,0),[170,187,204,255]);
  p.data.set([1,2,3,0],16);despeckle(p);assert.deepEqual(p.get(1,1),[1,2,3,0]);
});
test('despeckle: needs threshold and no same-color neighbor',()=>{
  const p=new Painter(3,3);p.fill('#aaaaaa');p.px(1,1,'#010203');p.px(0,0,'#010203');despeckle(p);assert.deepEqual(p.get(1,1),[1,2,3,255]);
  p.px(0,0,'#000000');p.px(0,1,'#000000');p.px(0,2,'#000000');despeckle(p);assert.deepEqual(p.get(1,1),[1,2,3,255]);
  despeckle(p,5);assert.deepEqual(p.get(1,1),[170,170,170,255]);
  assert.throws(()=>despeckle(p,9),RangeError);
});

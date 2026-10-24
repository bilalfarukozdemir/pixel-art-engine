import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Painter, roomShell, windowPane, rug, downsample } from '../dist/index.js';

const SKY=[{t:0,color:'#3d4f8a'},{t:1,color:'#e9a17a'}];

test('roomShell: deterministic, fills its box and stays inside',()=>{
  const a=new Painter(64,48), b=new Painter(64,48);
  roomShell(a,4,4,56,40,30); roomShell(b,4,4,56,40,30);
  assert.deepEqual(a.data,b.data);
  for(let y=0;y<48;y++) for(let x=0;x<64;x++) {
    const inside=x>=4&&x<60&&y>=4&&y<44;
    assert.equal(a.get(x,y)[3]>0,inside,`${x},${y}`);
  }
});
test('roomShell unit scales the pattern without leaving the box',()=>{
  const p=new Painter(256,192); roomShell(p,0,0,224,160,120,undefined,{unit:4,smooth:true});
  assert.equal(p.get(230,10)[3],0); assert.equal(p.get(10,170)[3],0);
});
test('windowPane without curtain and rug stay inside their boxes',()=>{
  const p=new Painter(64,64); windowPane(p,20,10,20,24,SKY);
  assert.equal(p.get(10,20)[3],0); assert.ok(p.get(30,20)[3]>0);
  const r=new Painter(64,32); rug(r,32,16,20,6,{base:'#c46b5c',border:'#7a3b35',pattern:'#f2d48c'});
  assert.equal(r.get(5,16)[3],0); assert.ok(r.get(32,16)[3]>0);
});
test('invalid interior sizes fail explicitly',()=>{
  const p=new Painter(32,32);
  assert.throws(()=>roomShell(p,0,0,8,8,4),RangeError);
  assert.throws(()=>roomShell(p,0,0,30,30,2),RangeError);
  assert.throws(()=>windowPane(p,0,0,8,8,SKY),RangeError);
  assert.throws(()=>rug(p,16,16,3,1,{base:'#000',border:'#000',pattern:'#000'}),RangeError);
  assert.throws(()=>windowPane(p,0,0,20,20,SKY,undefined,{unit:0}),RangeError);
});
test('roundRect leaves corners empty and r=0 equals rect',()=>{
  const p=new Painter(20,20); p.roundRect(0,0,20,20,6,'#ffffff');
  assert.equal(p.get(0,0)[3],0); assert.equal(p.get(10,10)[3],255); assert.equal(p.get(10,0)[3],255);
  const a=new Painter(10,10), b=new Painter(10,10);
  a.roundRect(2,2,5,4,0,'#123456'); b.rect(2,2,5,4,'#123456');
  assert.deepEqual(a.data,b.data);
});
test('downsample averages with alpha weighting',()=>{
  const p=new Painter(4,2); p.rect(0,0,1,2,'#ff0000'); p.rect(1,0,1,2,'#0000ff');
  const d=downsample(p,2);
  assert.equal(d.w,2); assert.equal(d.h,1);
  assert.deepEqual(d.get(0,0),[128,0,128,255]);
  assert.deepEqual(d.get(1,0),[0,0,0,0]);
  const half=new Painter(2,2); half.px(0,0,'#ffffff');
  assert.deepEqual(downsample(half,2).get(0,0),[255,255,255,64]);
  assert.throws(()=>downsample(p,0),RangeError);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Painter, fogBand, mulberry32, hex } from '../dist/index.js';

function oldPx(x, y, color) {
  x |= 0; y |= 0;
  if(x<0 || y<0 || x>=this.w || y>=this.h) return;
  const c=hex(color), a=c[3]??255, i=(y*this.w+x)*4;
  if(a<=0) return;
  if(a>=255) { this.data.set([...c.slice(0,3),255],i); return; }
  const t=a/255;
  for(let k=0;k<3;k++) this.data[i+k]=Math.round(c[k]*t+this.data[i+k]*(1-t));
  this.data[i+3]=Math.max(this.data[i+3],a);
}
test('px: transparent target preserves straight source RGBA',()=>{
  const p=new Painter(1,1); p.data.set([12,34,56,0]);
  p.px(0,0,[210,80,30,128]); assert.deepEqual(p.get(0,0),[210,80,30,128]);
  p.px(0,0,[0,0,0,0]); assert.deepEqual(p.get(0,0),[210,80,30,128]);
});
test('px: half transparent destination uses Porter-Duff over',()=>{
  const p=new Painter(1,1); p.data.set([0,0,255,128]); p.px(0,0,[255,0,0,128]);
  assert.deepEqual(p.get(0,0),[170,0,85,192]);
  p.px(0,0,'#102030'); assert.deepEqual(p.get(0,0),[16,32,48,255]);
});
test('px: opaque target matches legacy rounding for all byte alphas',()=>{
  const rng=mulberry32(32);
  for(let a=0;a<=255;a++) for(let j=0;j<8;j++) {
    const p=new Painter(1,1), q=new Painter(1,1);
    const base=[...Array.from({length:3},()=>Math.floor(rng()*256)),255];
    const src=[...Array.from({length:3},()=>Math.floor(rng()*256)),a];
    p.data.set(base); q.data.set(base); p.px(0,0,src); oldPx.call(q,0,0,src);
    assert.deepEqual(p.data,q.data);
  }
});
test('blit: transparent sheet preserves source; translucent target accumulates alpha',()=>{
  const src=new Painter(1,1); src.data.set([255,0,0,128]);
  const out=new Painter(2,1); out.blit(src,1,0); assert.deepEqual(out.get(1,0),src.get(0,0));
  out.blit(src,1,0); assert.deepEqual(out.get(1,0),[255,0,0,192]);
  out.blit(src,-1,0); assert.deepEqual(out.get(0,0),[0,0,0,0]);
});
test('fogBand: empty target retains fog RGB; opaque target matches legacy',()=>{
  const empty=new Painter(8,8); fogBand(empty,2,4,'#c08040',mulberry32(4));
  assert.ok(empty.data.some((a,i)=>i%4===3 && a>0 && a<255));
  for(let y=0;y<8;y++) for(let x=0;x<8;x++) if(empty.get(x,y)[3]) assert.deepEqual(empty.get(x,y).slice(0,3),[192,128,64]);
  const p=new Painter(8,8),q=new Painter(8,8); p.fill('#283040');q.fill('#283040');q.px=oldPx;
  fogBand(p,2,4,'#c08040',mulberry32(4));fogBand(q,2,4,'#c08040',mulberry32(4));
  assert.deepEqual(p.data,q.data);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Painter, H32, vnoise, fbm, stroke, wobblePoly, erode, roughTower } from '../dist/index.js';
import * as ref from './helpers/veyra-organic.mjs';

for(const [name,fn] of Object.entries({H32,vnoise,fbm})) test(`${name}: exact Veyra arithmetic and determinism`,()=>{
  for(const [x,y] of [[0,0],[1,2],[-3.2,7.9],[1234.25,-57.75],[1e6,21.3]]) {
    assert.equal(fn(x,y),ref[name](x,y)); assert.equal(fn(x,y),fn(x,y));
    if(name==='fbm') for(const oct of [1,2,6]) assert.equal(fn(x,y,oct),ref.fbm(x,y,oct));
  }
});
test('noise: seed coordinates change values',()=>assert.notEqual(vnoise(7,1.2),vnoise(8,1.2)));
test('wobblePoly: exact Veyra points for multiple seeds',()=>{
  const pts=[[2,3],[23,4],[13,24]];
  for(const seed of [0,7,-13]) for(const step of [1,3,7]) assert.deepEqual(wobblePoly(pts,2,seed,step),ref.wobblePoly(pts,2,seed,step));
  assert.deepEqual(wobblePoly([],2,7),[]);
});
for(const name of ['stroke','erode','roughTower']) test(`${name}: exact Veyra pixels, seed behavior and ColorInput`,()=>{
  for(const seed of [0,7,-13]) {
    const a=new Painter(40,40),b=new Painter(40,40),c=new Painter(40,40);
    if(name==='erode') {
      for(const p of [a,b,c]) p.rect(7,7,24,26,'#bb8855');
      erode(a,.45,seed);ref.erode(b,.45,seed);erode(c,.45,seed);
    } else {
      const args=name==='stroke'?[3,5,30,32]:[7,35,18,28,3];
      const fn=name==='stroke'?stroke:roughTower;
      fn(a,...args,'#bb8855',...(name==='stroke'?[2,seed]:[seed]));
      ref[name](b,...args,'#bb8855',...(name==='stroke'?[2,seed]:[seed]));
      fn(c,...args,[187,136,85,255],...(name==='stroke'?[2,seed]:[seed]));
    }
    assert.deepEqual(a.data,b.data);assert.deepEqual(a.data,c.data);assert.ok(a.data.some(Boolean));
  }
});

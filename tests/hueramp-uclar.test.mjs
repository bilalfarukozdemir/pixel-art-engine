import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hex, luma, hueRamp } from '../dist/index.js';

test('hueRamp keeps the base alpha on every entry',()=>{
  const r=hueRamp('#80808080',{steps:2});
  assert.deepEqual(r[1],[128,128,128,128],'base kept with its alpha');
  for(const c of r) assert.equal(c[3],128);
  for(const c of hueRamp('#a8805f40')) assert.equal(c[3],0x40);
  for(const c of hueRamp('#a8805f')) assert.equal(c[3],255,'opaque base stays opaque');
});

test('hueRamp extreme options: luma order holds where the 40-step loop used to fail',()=>{
  const r=hueRamp('#0000ff',{steps:2,hueShift:0,darkest:0.999,lightest:1,saturation:'vividHighlights'});
  assert.deepEqual(r[1],hex('#0000ff'));
  assert.ok(luma(r[0])<luma(r[1]),`dark ${luma(r[0])} < base ${luma(r[1])}`);
  const r4=hueRamp('#0000ff',{steps:4,hueShift:36,darkest:0.999,lightest:1});
  for(let i=1;i<r4.length;i++) assert.ok(luma(r4[i])>luma(r4[i-1]),`steps=4 i=${i}`);
});

test('hueRamp luma never decreases over an option grid; strict unless the base is pure black/white',()=>{
  const bases=['#0000ff','#ff0000','#00ff00','#ffff00','#000000','#ffffff','#808080','#202020','#e0e0e0','#3d5fc4','#a8805f'];
  for(const base of bases) for(const steps of [2,3,5,8,12]) for(const hueShift of [0,36,180])
    for(const saturation of ['arc','flat','vividShadows','vividHighlights'])
      for(const [darkest,lightest] of [[0.2,0.97],[0,1],[0.9,1],[0.999,1],[0,0.05],[0.5,0.51]]) {
        const r=hueRamp(base,{steps,hueShift,saturation,darkest,lightest});
        const mid=Math.floor(steps/2), L=r.map(luma), tag=`${base} ${JSON.stringify({steps,hueShift,saturation,darkest,lightest})}`;
        assert.deepEqual(r[mid],hex(base),tag);
        for(let i=1;i<r.length;i++){
          assert.ok(L[i]>=L[i-1],`${tag} i=${i} decreases`);
          const extreme=(i<=mid&&L[mid]===0)||(i>mid&&L[mid]===1);
          if(!extreme) assert.ok(L[i]>L[i-1],`${tag} i=${i} not strict`);
        }
      }
});

test('hueRamp output for ordinary bases is unchanged by the fallback',()=>{
  assert.deepEqual(hueRamp('#a8805f').map(c=>c.slice(0,3)),
    ['#332023','#6e4841','#a8805f','#d0be8a','#f7f7bc'].map(c=>hex(c).slice(0,3)));
});

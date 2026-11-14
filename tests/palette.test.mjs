import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Painter, hex, toHsv, fromHsv, luma, colorDistance,
  hueRamp, hueToward, inkOf, paletteOf, quantize, nearestColor, HIGHLIGHT_HUE, SHADOW_HUE,
} from '../dist/index.js';

const hueDist=(a,b)=>{const d=Math.abs(a-b)%360; return Math.min(d,360-d);};

test('toHsv / fromHsv round-trip and known values',()=>{
  for(const c of ['#a8805f','#3d4f8a','#e9a17a','#7fa44f','#ffffff','#000000','#808080']) {
    const [h,s,v]=toHsv(c); assert.deepEqual(fromHsv(h,s,v),hex(c),c);
  }
  assert.deepEqual(toHsv('#ff0000'),[0,1,1]);
  assert.deepEqual(toHsv('#00ff00'),[120,1,1]);
  assert.deepEqual(fromHsv(240,1,1),[0,0,255,255]);
  assert.deepEqual(fromHsv(-120,1,1),fromHsv(240,1,1),'hue wraps');
  assert.equal(fromHsv(0,0,0.5,77)[3],77);
});
test('luma orders by perceived brightness',()=>{
  assert.equal(luma('#000000'),0);
  assert.equal(luma('#ffffff'),1);
  assert.ok(luma('#ffff00')>luma('#ff0000'));
  assert.ok(luma('#00ff00')>luma('#0000ff'));
});
test('colorDistance is symmetric, zero for equal colors, larger for larger differences',()=>{
  assert.equal(colorDistance('#808080','#808080'),0);
  assert.equal(colorDistance('#102030','#405060'),colorDistance('#405060','#102030'));
  assert.ok(colorDistance('#808080','#828282')<20);
  assert.ok(colorDistance('#000000','#ffffff')>colorDistance('#000000','#808080'));
});
test('hueToward takes the shortest way and never overshoots',()=>{
  assert.equal(hueToward(120,HIGHLIGHT_HUE,30),90);
  assert.equal(hueToward(10,SHADOW_HUE,30),340,'red goes to purple through magenta');
  assert.equal(hueToward(50,60,30),60,'stops at target');
  assert.equal(hueToward(200,200,30),200);
});
test('hueRamp keeps the base, rises in luma and is deterministic',()=>{
  for(const base of ['#a8805f','#4a9e3c','#3d5fc4','#c43d4f','#8b4fb0','#d8c23a']) {
    const r=hueRamp(base,{steps:5});
    assert.equal(r.length,5);
    assert.deepEqual(r[2],hex(base));
    for(let i=1;i<r.length;i++) assert.ok(luma(r[i])>luma(r[i-1]),`${base} step ${i}`);
    assert.deepEqual(hueRamp(base,{steps:5}),r);
  }
  for(const steps of [2,3,4,7,12]) assert.equal(hueRamp('#a8805f',{steps}).length,steps);
});
test('hueRamp shifts shadows toward purple and lights toward yellow',()=>{
  const h0=toHsv('#4a9e3c')[0];
  const r=hueRamp('#4a9e3c',{steps:5,hueShift:36});
  assert.ok(toHsv(r[0])[0]>h0,'shadow hue moves toward blue/purple');
  assert.ok(toHsv(r[4])[0]<h0,'highlight hue moves toward yellow');
  for(const c of hueRamp('#4a9e3c',{steps:5,hueShift:0})) assert.ok(hueDist(toHsv(c)[0],h0)<3);
  // dokümandaki motor örneği (recipes/color.md)
  assert.deepEqual(hueRamp('#a8805f').map(c=>c.slice(0,3)),
    ['#332023','#6e4841','#a8805f','#d0be8a','#f7f7bc'].map(c=>hex(c).slice(0,3)));
});
test('hueRamp saturation curves differ at the ends',()=>{
  const sat=c=>toHsv(c)[1];
  const vs=hueRamp('#4a9e3c',{saturation:'vividShadows'}), vh=hueRamp('#4a9e3c',{saturation:'vividHighlights'});
  assert.ok(sat(vs[0])>sat(vh[0]));
  assert.ok(sat(vh[4])>sat(vs[4]));
});
test('hueRamp validates options',()=>{
  assert.throws(()=>hueRamp('#888888',{steps:1}),RangeError);
  assert.throws(()=>hueRamp('#888888',{steps:2.5}),RangeError);
  assert.throws(()=>hueRamp('#888888',{hueShift:-5}),RangeError);
  assert.throws(()=>hueRamp('#888888',{darkest:0.9,lightest:0.5}),RangeError);
});
test('inkOf is dark, tinted, never pure black',()=>{
  for(const c of ['#a8805f','#4a9e3c','#808080','#ffffff']) {
    const k=inkOf(c); assert.ok(luma(k)<0.2); assert.notDeepEqual(k.slice(0,3),[0,0,0]);
  }
});
test('paletteOf / nearestColor / quantize',()=>{
  const p=new Painter(4,1); p.px(0,0,'#ff0000'); p.px(1,0,'#fe0101'); p.px(2,0,'#0000ff'); p.px(3,0,'#0000ff40');
  const pal=paletteOf(p);
  assert.equal(pal.length,3);
  for(let i=1;i<pal.length;i++) assert.ok(luma(pal[i])>=luma(pal[i-1]),'sorted dark to light');
  assert.deepEqual(nearestColor('#f00a0a',['#00ff00','#ff0000']),[255,0,0,255]);
  assert.throws(()=>nearestColor('#fff',[]),RangeError);
  quantize(p,['#ff0000','#0000ff']);
  assert.deepEqual(p.get(1,0),[255,0,0,255]);
  assert.deepEqual(p.get(3,0),[0,0,0,0]);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Painter, hex, toHsv, fromHsv, luma, hueRamp, inkOf, paletteOf, quantize, nearestColor,
  lintSprite, formatLint, markIssues, stairs, runCurve, curveRunIssues,
  selectiveOutline, colouredOutline, outline, aaPoly, aaEllipse,
  ditherLevel, ditherRect, ditherBands, subpixelShift, isoDiamond, isoBox,
} from '../dist/index.js';

const INK='#2b1d24';
const hueDist=(a,b)=>{const d=Math.abs(a-b)%360; return Math.min(d,360-d);};

// ---------- renk ----------
test('HSV round-trip is stable',()=>{
  for(const c of ['#a8805f','#3d4f8a','#e9a17a','#7fa44f','#ffffff','#000000','#808080']) {
    const [h,s,v]=toHsv(c); assert.deepEqual(fromHsv(h,s,v),hex(c),c);
  }
});
test('hueRamp: base kept, luma rises, deterministic',()=>{
  for(const base of ['#a8805f','#4a9e3c','#3d5fc4','#c43d4f','#8b4fb0','#d8c23a']) {
    const r=hueRamp(base,{steps:5});
    assert.equal(r.length,5);
    assert.deepEqual(r[2],hex(base));
    for(let i=1;i<r.length;i++) assert.ok(luma(r[i])>luma(r[i-1]),`${base} step ${i}`);
    assert.deepEqual(hueRamp(base,{steps:5}),r);
  }
});
test('hueRamp shifts shadows toward purple and lights toward yellow',()=>{
  const r=hueRamp('#4a9e3c',{steps:5,hueShift:36});      // yeşil
  const h0=toHsv('#4a9e3c')[0];
  assert.ok(toHsv(r[0])[0]>h0,'shadow hue moves toward blue/purple');
  assert.ok(toHsv(r[4])[0]<h0,'highlight hue moves toward yellow');
  const flat=hueRamp('#4a9e3c',{steps:5,hueShift:0});
  for(const c of flat) assert.ok(hueDist(toHsv(c)[0],h0)<3);
});
test('hueRamp validates options',()=>{
  assert.throws(()=>hueRamp('#888888',{steps:1}),RangeError);
  assert.throws(()=>hueRamp('#888888',{hueShift:-5}),RangeError);
  assert.throws(()=>hueRamp('#888888',{darkest:0.9,lightest:0.5}),RangeError);
});
test('inkOf is dark, tinted, never pure black',()=>{
  for(const c of ['#a8805f','#4a9e3c','#808080','#ffffff']) {
    const k=inkOf(c); assert.ok(luma(k)<0.2); assert.notDeepEqual(k.slice(0,3),[0,0,0]);
  }
});
test('paletteOf / quantize snap pixels to the palette',()=>{
  const p=new Painter(4,1); p.px(0,0,'#ff0000'); p.px(1,0,'#fe0101'); p.px(2,0,'#0000ff'); p.px(3,0,'#0000ff40');
  assert.equal(paletteOf(p).length,3);
  quantize(p,['#ff0000','#0000ff']);
  assert.deepEqual(p.get(1,0),[255,0,0,255]);
  assert.equal(p.get(3,0)[3],0);
  assert.deepEqual(nearestColor('#f00a0a',['#00ff00','#ff0000']),[255,0,0,255]);
});

// ---------- çizgi ----------
test('stairs draws equal steps and validates',()=>{
  const p=new Painter(12,6); const end=stairs(p,0,0,2,1,5,INK);
  assert.deepEqual(end,{x:10,y:5});
  for(let i=0;i<5;i++){ assert.equal(p.get(2*i,i)[3],255); assert.equal(p.get(2*i+1,i)[3],255); assert.equal(p.get(2*i+2,i)[3],0); }
  assert.throws(()=>stairs(p,0,0,2,2,3,INK),RangeError);
});
test('runCurve follows the book example and curveRunIssues finds bad steps',()=>{
  assert.deepEqual(curveRunIssues([4,3,2,1,1,1,1],[2,3,4,8]),[]);
  assert.deepEqual(curveRunIssues([4,3,2,1,1,1],[2,1,3,2,3,8]),[{axis:'h',index:1},{axis:'h',index:3}]);
  const p=new Painter(32,32); runCurve(p,0,20,[4,3,2,1,1,1,1],[2,3,4,8],1,-1,INK);
  assert.equal(lintSprite(p).counts.jaggy,0);
  assert.equal(lintSprite(p).counts.double,0);
});

// ---------- lint ----------
test('lint: integer-radius ellipses leave nubs, half-radius ones do not',()=>{
  const a=new Painter(32,32); a.ellipse(16,16,10,7,'#4a9e3c');
  assert.equal(lintSprite(a).counts.nub,4);
  const b=new Painter(32,32); b.ellipse(16,16,9.5,6.5,'#4a9e3c');
  assert.equal(lintSprite(b).counts.nub,0);
  const c=new Painter(32,32); aaEllipse(c,16,16,9.5,6.5,'#4a9e3c');
  assert.equal(lintSprite(c).counts.nub,0);
  const flatTop=new Painter(16,16); flatTop.rect(4,2,8,1,'#4a9e3c'); flatTop.rect(2,3,12,8,'#4a9e3c');
  assert.equal(lintSprite(flatTop).counts.nub,0);
});
test('lint: L-corner doubles are found, clean staircase and box corners are not',()=>{
  const bad=new Painter(10,10);
  for(let i=0;i<4;i++){ bad.px(2*i,i,INK); bad.px(2*i+1,i,INK); bad.px(2*i+1,i+1,INK); }
  assert.ok(lintSprite(bad).counts.double>0);
  const good=new Painter(10,10); stairs(good,0,0,2,1,4,INK);
  assert.equal(lintSprite(good).counts.double,0);
  const box=new Painter(10,10); for(let i=1;i<9;i++){ box.px(i,1,INK); box.px(i,8,INK); box.px(1,i,INK); box.px(8,i,INK); }
  assert.equal(lintSprite(box).counts.double,0);
});
test('lint: a short step between longer steps is a jaggy',()=>{
  const p=new Painter(20,8); runCurve(p,0,0,[],[2,2,1,2,2],1,1,INK);
  const r=lintSprite(p);
  assert.equal(r.counts.jaggy,1);
  const j=r.issues.find(i=>i.kind==='jaggy'); assert.deepEqual([j.x,j.y,j.w,j.h],[4,2,1,1]);
  const ok=new Painter(20,8); stairs(ok,0,0,2,1,5,INK);
  assert.equal(lintSprite(ok).counts.jaggy,0);
});
test('lint: hugging equal staircases are banding; outline + fill is not',()=>{
  const p=new Painter(12,14);
  for(let i=0;i<5;i++){ for(let k=0;k<2;k++){ p.px(i,2*i+k,INK); p.px(i+1,2*i+k,'#8a8a9a'); } }
  assert.ok(lintSprite(p).counts.banding>0);
  const q=new Painter(24,24); q.ellipse(12,12,8,8,'#a8805f'); outline(q,INK);
  assert.equal(lintSprite(q).counts.banding,0);
});
test('lint: stray pixel, pure black, color limits; formatLint and markIssues',()=>{
  const p=new Painter(9,9); p.rect(0,0,9,9,'#406080'); p.px(4,4,'#000000');
  const r=lintSprite(p,{maxColors:1});
  assert.equal(r.counts.stray,1); assert.equal(r.counts.pureBlack,1); assert.equal(r.counts.colors,1);
  assert.match(formatLint(r),/stray/);
  const m=markIssues(p,r); assert.notDeepEqual(m.get(4,4),p.get(4,4)); assert.deepEqual(p.get(4,4),[0,0,0,255]);
  const s=new Painter(2,1); s.px(0,0,'#808080'); s.px(1,0,'#828282');
  assert.equal(lintSprite(s).counts.similar,1);
  assert.match(formatLint(lintSprite(new Painter(2,2))),/temiz/);
});

// ---------- outline ----------
test('selectiveOutline: lit edge lighter than shadow edge, only transparent pixels change',()=>{
  const p=new Painter(24,24); p.ellipse(12,12,7,7,'#4a9e3c');
  const before=p.data.slice();
  selectiveOutline(p,{light:[-1,-1]});
  for(let i=0;i<before.length;i+=4) if(before[i+3]===255) assert.equal(p.data[i],before[i]);
  const tl=p.get(7,7), br=p.get(17,17);       // sol üst ve sağ alt kontur
  assert.equal(tl[3],255); assert.equal(br[3],255);
  assert.ok(luma(tl)>luma(br),'lit side is lighter');
  for(let i=0;i<p.data.length;i+=4) if(p.data[i+3]) assert.notDeepEqual([...p.data.slice(i,i+3)],[0,0,0]);
  assert.throws(()=>selectiveOutline(p,{light:[0,0]}),RangeError);
});
test('colouredOutline darkens each neighbour colour',()=>{
  const p=new Painter(10,10); p.rect(2,2,3,6,'#c43d4f'); p.rect(5,2,3,6,'#3d5fc4');
  colouredOutline(p);
  assert.ok(toHsv(p.get(3,1))[0]>300||toHsv(p.get(3,1))[0]<30);
  assert.ok(toHsv(p.get(6,1))[0]>180&&toHsv(p.get(6,1))[0]<300);
});

// ---------- AA ----------
test('aaEllipse adds 1-2 intermediate tones on opaque ground and never touches transparency',()=>{
  const p=new Painter(32,32); p.rect(0,0,32,16,'#20304a');
  aaEllipse(p,16,16,10,7,'#e0c070',{levels:2});
  const tones=new Set(); for(let y=0;y<16;y++) for(let x=0;x<32;x++){ const c=p.get(x,y); tones.add(c.join()); }
  assert.ok(tones.size>=3&&tones.size<=4,`tones ${tones.size}`);
  for(let x=0;x<32;x++) for(let y=24;y<32;y++) assert.equal(p.get(x,y)[3],0);
  const q=new Painter(16,16); q.fill('#000000'); aaPoly(q,[[2,2],[13,4],[6,13]],'#ffffff',{palette:['#000000','#ffffff','#808080']});
  for(let i=0;i<q.data.length;i+=4) assert.ok([0,128,255].includes(q.data[i]));
  assert.throws(()=>aaEllipse(q,4,4,0,2,'#fff'),RangeError);
});

// ---------- dither ----------
test('ordered dither: level 8 is a checkerboard, minority pixels never touch',()=>{
  for(let y=0;y<4;y++) for(let x=0;x<4;x++) assert.equal(ditherLevel(x,y,8),(x+y)%2===0);
  for(let level=1;level<16;level++){
    const minority=level<=8;
    for(let y=0;y<8;y++) for(let x=0;x<8;x++){
      if(ditherLevel(x,y,level)!==minority) continue;
      assert.notEqual(ditherLevel(x+1,y,level),minority,`level ${level} at ${x},${y}`);
      assert.notEqual(ditherLevel(x,y+1,level),minority,`level ${level} at ${x},${y}`);
    }
  }
  assert.throws(()=>ditherLevel(0,0,17),RangeError);
});
test('ditherRect / ditherBands are deterministic and use only given colors',()=>{
  const a=new Painter(16,32), b=new Painter(16,32);
  ditherBands(a,0,0,16,32,['#1a2a5a','#4a6ab0','#a0c8e8']); ditherBands(b,0,0,16,32,['#1a2a5a','#4a6ab0','#a0c8e8']);
  assert.deepEqual(a.data,b.data);
  assert.equal(paletteOf(a).length,3);
  assert.deepEqual(a.get(0,0),hex('#1a2a5a')); assert.deepEqual(a.get(0,31),hex('#a0c8e8'));
  const r=new Painter(4,4); ditherRect(r,0,0,4,4,'#000000','#ffffff',4,'lines-h');
  assert.equal(paletteOf(r).length,2);
});

// ---------- subpiksel ----------
test('subpixelShift keeps size and palette, moves value toward the shift',()=>{
  const p=new Painter(8,8); p.rect(2,2,4,4,'#3d5fc4'); p.rect(2,2,2,4,'#a0c8e8');
  const s=subpixelShift(p,1,0);
  assert.equal(s.w,8); assert.equal(s.h,8);
  const pal=paletteOf(p).map(c=>c.join());
  for(const c of paletteOf(s)) assert.ok(pal.includes(c.join()));
  assert.deepEqual(subpixelShift(p,1,0).data,s.data);
  assert.throws(()=>subpixelShift(p,2,0),RangeError);
});

// ---------- izometrik ----------
test('isoDiamond rows grow by 2 per side and are symmetric; isoBox sides go down',()=>{
  const p=new Painter(40,30); isoDiamond(p,20,10,16,'#88aa66');
  const widths=[]; for(let y=0;y<30;y++){ let n=0; for(let x=0;x<40;x++) if(p.get(x,y)[3]) n++; if(n) widths.push(n); }
  assert.deepEqual(widths,[4,8,12,16,16,12,8,4]);
  const b=new Painter(40,40); isoBox(b,20,10,16,6,{top:'#ddeeaa',left:'#99aa66',right:'#667744'});
  assert.deepEqual(b.get(19,16),hex('#99aa66')); assert.deepEqual(b.get(20,16),hex('#667744'));
  assert.equal(b.get(19,20)[3],0); assert.deepEqual(b.get(12,10),hex('#ddeeaa'));
  assert.throws(()=>isoDiamond(p,0,0,6,'#fff'),RangeError);
});

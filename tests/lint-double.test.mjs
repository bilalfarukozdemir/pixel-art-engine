import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Painter, outline, lintSprite, stairs } from '../dist/index.js';

const INK='#2b1d24';

test('double: an isolated L-corner in a clean 1px staircase is reported once',()=>{
  const p=new Painter(14,8); stairs(p,0,0,2,1,6,INK);
  assert.equal(lintSprite(p).counts.double,0);
  p.px(2,0,INK);
  const r=lintSprite(p);
  assert.equal(r.counts.double,1);
  const d=r.issues.find(i=>i.kind==='double');
  assert.ok(d.x<=2&&d.x+d.w>2&&d.y<=0&&d.y+d.h>0,'issue box covers the extra pixel');
});

test('double regression: a sprite with filled colour areas reports no doubles',()=>{
  // Kulak içi gibi: kontur + tüy + 2px kalın çapraz gölge şeridi + pembe dolgu.
  const p=new Painter(24,24);
  p.ellipse(12,12,9.5,9.5,'#a8805f');
  for(let i=0;i<14;i++){ p.px(5+i,4+i,'#7d5a45'); p.px(6+i,4+i,'#7d5a45'); }
  for(let y=8;y<16;y++) for(let x=y-3;x<y+1;x++) p.px(x+4,y,'#e2a3a0');
  p.rect(9,15,3,3,'#e2a3a0');
  outline(p,INK);
  assert.equal(lintSprite(p).counts.double,0);
});

test('double: a 2px band drawn along a whole diagonal is a fill/thickness choice, not a double',()=>{
  const band=new Painter(12,12); for(let i=0;i<8;i++){ band.px(i,i,INK); band.px(i+1,i,INK); }
  assert.equal(lintSprite(band).counts.double,0);
  const fill=new Painter(16,16); fill.ellipse(8,8,6.5,6.5,'#4a9e3c'); fill.rect(4,4,5,5,'#8ac35a');
  assert.equal(lintSprite(fill).counts.double,0);
});

test('double: engine outlines stay clean',()=>{
  for(const [rx,ry] of [[5.5,3.5],[9.5,6.5],[11.5,8.5]]){
    const q=new Painter(32,32); q.ellipse(16,16,rx,ry,'#a8805f'); outline(q,INK);
    assert.equal(lintSprite(q).counts.double,0,`${rx}x${ry}`);
  }
});

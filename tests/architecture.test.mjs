import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Painter, stoneCourses, archedDoor, lancetWindow, contactShadow } from '../dist/index.js';

for (const [name, draw] of Object.entries({stoneCourses, archedDoor, lancetWindow})) {
  test(`${name}: deterministic, visible and bounded`, () => {
    const a=new Painter(48,48), b=new Painter(48,48);
    draw(a,8,8,24,28); draw(b,8,8,24,28);
    assert.deepEqual(a.data,b.data);
    assert.ok(a.data.some(n=>n));
    for(let y=0;y<48;y++) for(let x=0;x<48;x++) {
      if(x<8||x>=32||y<8||y>=36) assert.equal(a.get(x,y)[3],0,`${x},${y}`);
    }
  });
}
test('invalid sizes and opacity fail explicitly',()=>{
  const p=new Painter(32,32);
  assert.throws(()=>archedDoor(p,0,0,4,5),RangeError);
  assert.throws(()=>archedDoor(p,0,0,100,16),RangeError);
  assert.throws(()=>lancetWindow(p,0,0,4,5),RangeError);
  assert.throws(()=>stoneCourses(p,0,0,8,8,undefined,0),RangeError);
  assert.throws(()=>contactShadow(p,8,8,12,4,undefined,256),RangeError);
});
test('shadow is translucent and centered',()=>{
  const p=new Painter(32,32); contactShadow(p,16,16,20,6);
  assert.ok(p.get(16,16)[3]>0 && p.get(16,16)[3]<255);
  assert.equal(p.get(0,0)[3],0);
});
test('smooth gradient interpolates; legacy threshold stays unchanged',()=>{
  const stops=[{t:0,color:'#000000'},{t:1,color:'#ffffff'}];
  const p=new Painter(1,3); p.vgrad(0,0,1,3,stops,{smooth:true});
  assert.deepEqual(p.get(0,0),[0,0,0,255]);
  assert.deepEqual(p.get(0,1),[128,128,128,255]);
  assert.deepEqual(p.get(0,2),[255,255,255,255]);
  const legacy=new Painter(1,3); legacy.vgrad(0,0,1,3,stops,{dither:false});
  assert.deepEqual(legacy.get(0,1),[0,0,0,255]);
});

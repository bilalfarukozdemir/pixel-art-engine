import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { Painter } from '../dist/index.js';
import { encodeSheet, decodePng } from '../dist/output/index.js';

function frames() {return ['#ff000080','#00ff00','#0000ff'].map(c=>{const p=new Painter(2,3);p.fill(c);return p;});}
function parseAse(buf) {
  const tags=[],delays=[],pixels=[];
  let at=128;
  for(let f=0;f<buf.readUInt16LE(6);f++) {
    delays.push(buf.readUInt16LE(at+8));let c=at+16;
    for(let j=0;j<buf.readUInt32LE(at+12);j++) {
      const size=buf.readUInt32LE(c),type=buf.readUInt16LE(c+4),d=c+6;
      if(type===0x2005)pixels.push([...inflateSync(buf.subarray(d+20,c+size)).subarray(0,4)]);
      if(type===0x2018) {let o=d+10;for(let t=0;t<buf.readUInt16LE(d);t++){const len=buf.readUInt16LE(o+17);tags.push({from:buf.readUInt16LE(o),to:buf.readUInt16LE(o+2),name:buf.toString('utf8',o+19,o+19+len)});o+=19+len;}}
      c+=size;
    }
    at+=buf.readUInt32LE(at);
  }
  return {tags,delays,pixels};
}
test('encodeSheet: PNG cells and exact JSON schema, optional combat metadata',()=>{
  const f=frames(), animations={attack:{frames:[0,1,2],delays:[90,80,110],events:{'2':'hit'},hitStopMs:{'2':45}},idle:{frames:[0],delays:[200]}};
  const opts={frames:f,pivot:[1,2],animations},out=encodeSheet(opts),p=decodePng(out.png);
  assert.equal(p.w,6);assert.equal(p.h,3);
  for(let n=0;n<3;n++) for(let y=0;y<3;y++)for(let x=0;x<2;x++)assert.deepEqual(p.get(n*2+x,y),f[n].get(x,y));
  assert.deepEqual(JSON.parse(out.json),{frameWidth:2,frameHeight:3,pivot:[1,2],animations});
  assert.ok(!Object.hasOwn(JSON.parse(out.json).animations.idle,'events'));
  assert.deepEqual(out,encodeSheet(opts));
});
test('encodeSheet: Aseprite tags preserve arbitrary animation order, repeats and delays',()=>{
  const f=frames(),out=encodeSheet({frames:f,pivot:[1,2],animations:{attack:{frames:[2,0,2],delays:[70,90,110]}}});
  const ase=parseAse(out.aseprite);
  assert.deepEqual(ase.tags,[{name:'attack',from:0,to:2}]);assert.deepEqual(ase.delays,[70,90,110,100]);
  assert.deepEqual(ase.pixels,[f[2].get(0,0),f[0].get(0,0),f[2].get(0,0),f[1].get(0,0)]);
});
test('encodeSheet: no animations retains all frames, does not mutate input',()=>{
  const f=frames(),before=f.map(p=>p.data.slice());const out=encodeSheet({frames:f,pivot:[0,0],animations:{}});
  assert.deepEqual(parseAse(out.aseprite).delays,[100,100,100]);f.forEach((p,i)=>assert.deepEqual(p.data,before[i]));
});
test('encodeSheet: malformed dimensions, indices, timings and combat metadata fail',()=>{
  const base={frames:frames(),pivot:[1,2],animations:{idle:{frames:[0],delays:[100]}}};
  for(const patch of [{frames:[]},{frames:[...frames(),new Painter(1,1)]},{pivot:[NaN,0]},
    ...[{frames:[3],delays:[100]},{frames:[0],delays:[]},{frames:[0],delays:[0]},
    {frames:[0],delays:[100],events:{'2':'hit'}},{frames:[0],delays:[100],hitStopMs:{'0':-1}}].map(idle=>({animations:{idle}}))])
    assert.throws(()=>encodeSheet({...base,...patch}),/encodeSheet:/);
});

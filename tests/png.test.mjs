import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { Painter } from '../dist/index.js';
import { encodePng, decodePng } from '../dist/output/png.js';

// Bağımsız fixture encoder: CRC bit bit hesaplanır; tüm filtrelere bilinen veri.
function chunk(type,data) {
  const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);b.write(type,4);b.set(data,8);
  let crc=0xffffffff;
  for(const byte of b.subarray(4,-4)) {crc^=byte;for(let i=0;i<8;i++)crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;}
  b.writeUInt32BE((crc^0xffffffff)>>>0,b.length-4);return b;
}
function fixture(channels, filter, opts={}) {
  const w=3,h=2,stride=w*channels;
  const pixels=Uint8Array.from({length:stride*h},(_,i)=>(i*73+21)%256), raw=Buffer.alloc((stride+1)*h);
  for(let y=0;y<h;y++) {
    raw[y*(stride+1)]=filter;
    for(let x=0;x<stride;x++) {
      const i=y*stride+x,a=x>=channels?pixels[i-channels]:0,b=y?pixels[i-stride]:0,c=y&&x>=channels?pixels[i-stride-channels]:0;
      const q=a+b-c,ds=[Math.abs(q-a),Math.abs(q-b),Math.abs(q-c)],paeth=[a,b,c][ds.indexOf(Math.min(...ds))];
      const pred=[0,a,b,Math.floor((a+b)/2),paeth][filter]??0;
      raw[y*(stride+1)+x+1]=(pixels[i]-pred)&255;
    }
  }
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=opts.depth??8;ihdr[9]=opts.type??(channels===3?2:6);ihdr[12]=opts.interlace??0;
  const compressed=deflateSync(raw), cut=Math.floor(compressed.length/2);
  return {pixels, png:Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),...(opts.trns?[chunk('tRNS',opts.trns)]:[]),chunk('IDAT',compressed.subarray(0,cut)),chunk('IDAT',compressed.subarray(cut)),chunk('IEND',Buffer.alloc(0))])};
}
test('PNG: encode/decode round trip preserves all RGBA bytes including transparent RGB',()=>{
  const p=new Painter(4,3);for(let i=0;i<p.data.length;i++)p.data[i]=(i*37)%256;
  p.data[3]=0;p.data[7]=128;
  const png=encodePng(p), q=decodePng(png);assert.equal(q.w,4);assert.equal(q.h,3);assert.deepEqual(q.data,p.data);assert.deepEqual(encodePng(q),png);
});
for(const channels of [3,4]) for(let filter=0;filter<=4;filter++) test(`decodePng: ${channels===3?'RGB':'RGBA'} filter ${filter}, split IDAT`,()=>{
  const {png,pixels}=fixture(channels,filter), p=decodePng(png);
  for(let n=0;n<6;n++)assert.deepEqual(p.get(n%3,Math.floor(n/3)),[...pixels.slice(n*channels,n*channels+3),channels===4?pixels[n*channels+3]:255]);
});
test('decodePng: RGB tRNS is honored',()=>{
  const t=Buffer.alloc(6);[21,94,167].forEach((v,i)=>t.writeUInt16BE(v,i*2));
  const p=decodePng(fixture(3,4,{trns:t}).png);assert.equal(p.get(0,0)[3],0);assert.equal(p.get(1,0)[3],255);
});
test('decodePng: unsupported/malformed inputs give clear errors',()=>{
  assert.throws(()=>decodePng(Buffer.alloc(0)),/decodePng:.*imza/);
  for(const opts of [{depth:16},{type:3},{interlace:1}]) assert.throws(()=>decodePng(fixture(4,0,opts).png),/decodePng:.*desteklen/);
  assert.throws(()=>decodePng(fixture(4,5).png),/satır filtresi/);
  const {png}=fixture(4,0);assert.throws(()=>decodePng(png.subarray(0,-4)),/eksik/);
  const corrupt=Buffer.from(png);corrupt[45]^=1;assert.throws(()=>decodePng(corrupt),/CRC/);
});

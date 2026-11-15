import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import * as api from '../dist/index.js';

test('core is the bottom layer: src/core imports nothing outside src/core',()=>{
  for(const f of readdirSync('src/core').filter(n=>n.endsWith('.ts'))){
    const src=readFileSync(`src/core/${f}`,'utf8');
    for(const m of src.matchAll(/from\s+["']([^"']+)["']/g))
      assert.ok(!m[1].startsWith('../'),`src/core/${f} imports ${m[1]}`);
  }
});

test('moving aa/subpixel out of core keeps the public export names',()=>{
  for(const name of ['aaEllipse','aaPoly','subpixelShift','nearestColor','paletteOf','quantize'])
    assert.equal(typeof api[name],'function',name);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('guide links resolve and promised scripts exist',()=>{
  const text=readFileSync('GUIDE.md','utf8');
  for(const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    if(!match[1].startsWith('http')) assert.ok(existsSync(resolve(match[1])),match[1]);
  }
  const pkg=JSON.parse(readFileSync('package.json','utf8'));
  for(const script of ['build','typecheck','test','examples']) assert.ok(pkg.scripts[script]);
});

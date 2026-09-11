import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/utils/seu.js',import.meta.url),'utf8').replace("import seed from './seuSeed.json';",`const seed=${fs.readFileSync(new URL('../src/utils/seuSeed.json',import.meta.url),'utf8')};`);
const {initialRows,summarize,monthLabels}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
test('31 supplied records and financial year boundary',()=>{const rows=initialRows(2026);assert.equal(rows.length,31);assert.equal(new Set(rows.map(r=>r.id)).size,31);assert.ok(rows.every(r=>r.values.length===12));assert.equal(monthLabels(2026)[0],'Apr 26');assert.equal(monthLabels(2026)[11],'Mar 27');assert.ok(initialRows(2027).every(r=>r.target===null&&r.values.every(v=>v===null)));});
test('missing months excluded and deviation uses indicator direction',()=>{const rows=initialRows(2026);assert.equal(summarize(rows[0]).average,237.2);assert.equal(summarize(rows[11]).status,'Leading');assert.equal(summarize(rows[16]).count,4);assert.equal(summarize(rows[30]).status,'Leading');assert.equal(summarize(rows[14]).deviation,null);assert.equal(summarize(rows[0],5,11).average,null);});
test('zero is data; zero target has no percentage comparison',()=>{const r={values:[0,null],target:10,direction:'lower',tolerance:3};assert.equal(summarize(r).average,0);assert.equal(summarize(r).deviation,100);assert.equal(summarize({...r,target:0}).deviation,null);});

import test from 'node:test';
import assert from 'node:assert/strict';
import {trendMonths,performance} from '../src/utils/enpiTargets.js';
test('6, 12 and 18 month windows end at selected month across year boundaries',()=>{
 for(const count of [6,12,18]){const months=trendMonths('2026-06',count);assert.equal(months.length,count);assert.equal(months.at(-1),'2026-06');assert.equal(new Set(months).size,count);}
 assert.equal(trendMonths('2026-06',18)[0],'2025-01');
});
test('lower EnPI leads and missing actual/target never produces a comparison',()=>{
 assert.equal(performance(80,90),'Better than target');assert.equal(performance(100,90),'Above target');assert.equal(performance(90,90),'On target');assert.equal(performance(0,90),'Better than target');assert.equal(performance(null,90),'No comparison');assert.equal(performance(80,null),'No comparison');
});

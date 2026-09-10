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
import {averageEnpi,canonicalEnpiUnit} from '../src/utils/enpiTargets.js';
test('plant mean excludes missing and incompatible units, preserves zero',()=>{
 const rows=[{enpiUnit:'kWh/MT',enpiValue:100},{enpiUnit:'Kwh/Ton',enpiValue:0},{enpiUnit:'kWh/MT',enpiValue:null},{enpiUnit:'kWh/KL',enpiValue:900}];
 assert.deepEqual(averageEnpi(rows,'kwh/mt'),{value:50,count:2,total:3});
 assert.equal(averageEnpi(rows,'').value,null);
 assert.equal(canonicalEnpiUnit(' kWh / Tonne '),'kwh/mt');
});
import {applicableTarget,targetGap} from '../src/utils/enpiTargets.js';
test('target effective dates preserve historical comparison and ignore remarks',()=>{
 const records=[{kind:'target',month:'2026-04',target:90},{kind:'target',month:'2026-07',target:80},{kind:'remark',month:'2026-08',remark:'Shutdown'}];
 assert.equal(applicableTarget(records,'2026-03'),null);assert.equal(applicableTarget(records,'2026-06').target,90);assert.equal(applicableTarget(records,'2026-09').target,80);
 assert.equal(targetGap(99,90),10);assert.equal(targetGap(81,90),-10);assert.equal(targetGap(0,0),null);assert.equal(targetGap(null,90),null);
});

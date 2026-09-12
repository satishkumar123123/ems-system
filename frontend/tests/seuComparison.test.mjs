import test from 'node:test';
import assert from 'node:assert/strict';
import {compareSeu,comparisonRows} from '../src/utils/seuComparison.js';
const row={id:'1',name:'Plant',unit:'kWh/MT',direction:'lower',values:[100,0,200,null]};
test('comparison uses same months and includes real zeros',()=>{const result=compareSeu(row,{...row,values:[80,null,180,900]},0,3);assert.equal(result.paired.length,2);assert.equal(result.previousAverage,150);assert.equal(result.currentAverage,130);assert.ok(result.improvement>0);const zero=compareSeu(row,{...row,values:[null,0,null,null]},0,3);assert.equal(zero.paired.length,1);assert.equal(zero.change,null);assert.equal(zero.reason,'Previous average is zero');});
test('incompatible units and missing identities are not compared',()=>{assert.equal(compareSeu(row,{...row,unit:'MT/kWh'}).unitMatches,false);const rs=comparisonRows([row],[{...row,id:'2'}],['1','2']);assert.equal(rs[0].reason,'Not listed in 2026-27');assert.equal(rs[1].reason,'Not listed in 2025-26');});
test('higher is better reverses performance and selected range is honored',()=>{const previous={...row,unit:'CFM/kWh',direction:'higher'};const current={...previous,values:[120,0,220,null]};assert.ok(compareSeu(previous,current).improvement>0);assert.equal(compareSeu(previous,current,2,2).paired.length,1);});

test('cubic-metre unit typography is equivalent',()=>{assert.equal(compareSeu({...row,unit:'KwH/M3'},{...row,unit:'kWh/m³'}).unitMatches,true);});

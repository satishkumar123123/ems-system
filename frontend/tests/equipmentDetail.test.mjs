import test from 'node:test';
import assert from 'node:assert/strict';
import {equipmentMetrics,numeric,lastSixMonths} from '../src/utils/equipmentDetail.js';
test('finds equipment case-insensitively and preserves recorded zero values',()=>{
 const data={rows:[{equipment:' CGL ',electricity:0,lng:12,hsd:3,totalConsumption:15,production:0,enpiUnit:'kWh/MT',enpiValue:'0',wrtKwh:0}]};
 const metrics=equipmentMetrics('wider','cgl',data);
 assert.equal(metrics.length,8);assert.equal(metrics[0].value,0);assert.equal(metrics[1].value,12);assert.equal(metrics.at(-1).value,0);
 assert.ok(equipmentMetrics('wider','missing',data).every(m=>m.value===null));
});
test('fuel aliases, recorded EnPI text and solar parameters remain truthful',()=>{
 assert.equal(equipmentMetrics('utility','Pump',{rows:[{equipment:'Pump',lngLpg:20,enpiValue:'1.2 / 3.4'}]})[1].value,20);
 assert.equal(numeric('1.2 / 3.4'),null);assert.equal(numeric(''),null);assert.equal(numeric('1,234.5'),1234.5);
 assert.deepEqual(equipmentMetrics('solar','CTL Production',{ctlProduction:0}),[{key:'ctlProduction',label:'Production',unit:'MT',value:0}]);
});
test('six month trend handles calendar rollover',()=>{
 assert.deepEqual(lastSixMonths('2026-03'),['2025-10','2025-11','2025-12','2026-01','2026-02','2026-03']);
});

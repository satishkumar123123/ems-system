import test from 'node:test';import assert from 'node:assert/strict';
import {augustFuelEquipment,equipmentKey} from '../src/utils/fuelEligibility.js';
test('August eligibility accepts fuel aliases and excludes blank or zero values',()=>{
 const result=augustFuelEquipment({rows:[{equipment:'ARP',lng:10},{equipment:'Boiler(LPG)',lngLpg:2},{equipment:'Pump',lngLpg:0},{equipment:'MEE PLANT',lpg:5},{equipment:'Blank',lng:''},{equipment:'Bad',lng:'abc'}]});
 assert.deepEqual([...result],['ARP','BOILER','MEE PLANT']);assert.ok(result.has(equipmentKey('  Boiler(LPG) ')));assert.equal(augustFuelEquipment(null).size,0);assert.throws(()=>augustFuelEquipment({}));
});

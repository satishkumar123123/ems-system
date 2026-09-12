const test=require('node:test'),assert=require('node:assert/strict');
const {prepareSave,toInputRows,calculateRows,quantityMonth}=require('../utils/fuelConversion');
const row=(extra={})=>({equipment:'CGL',electricity:1000,lng:10,hsd:5,production:10,enpiUnit:'kWh/MT',...extra});
const save=(plant,r)=>prepareSave(plant,{monthYear:'2026-09',inputBasis:'quantity-v1',rows:r});
test('cutoff leaves August records and totals unchanged',()=>{const old={monthYear:'2026-08',rows:[row()],totals:{totalConsumption:123}};assert.equal(prepareSave('wider',old),old);assert.equal(quantityMonth('2026-09'),true);assert.equal(quantityMonth('2026-08'),false);assert.throws(()=>prepareSave('wider',{monthYear:'2026-09',rows:[row()]}),/Refresh/);});
test('LNG and HSD conversion recalculates totals EnPI and percentage',()=>{const d=save('wider',[row()]);assert.equal(d.rows[0].lng,139);assert.equal(d.rows[0].hsd,16.5);assert.equal(d.rows[0].totalConsumption,1155.5);assert.equal(d.rows[0].enpiValue,115.55);assert.equal(d.rows[0].wrtKwh,100);assert.equal(d.rows[0].fuelQuantity,10);assert.equal(d.totals.totalConsumption,1155.5);});
test('LPG factor and Utility mixed types',()=>{const lpg=save('hsu',[row({lpg:10})]);assert.equal(lpg.rows[0].lpg,127.8);assert.equal(lpg.totals.totalConsumption,1144.3);const u=save('utility',[row({equipment:'Boiler(LPG)',lngLpg:10}),row({equipment:'ARP(LNG)',lngLpg:10})]);assert.equal(u.rows[0].lngLpg,127.8);assert.equal(u.rows[1].lngLpg,139);assert.equal(u.totals.lngLpg,266.8);});
test('saved and legacy kWh read-edit-save do not double convert',()=>{const first=save('wider',[row()]);const second=save('wider',toInputRows('wider','2026-09',first.rows));assert.deepEqual(first.totals,second.totals);const legacy=[row({lng:139,hsd:16.5})];const display=toInputRows('wider','2026-09',legacy);assert.equal(display[0].lng,10);assert.equal(save('wider',display).rows[0].lng,139);});
test('zeros missing production and invalid input are handled',()=>{const zero=save('wider',[row({electricity:0,lng:0,hsd:0,production:0})]);assert.equal(zero.rows[0].totalConsumption,0);assert.equal(zero.rows[0].enpiValue,null);assert.equal(zero.rows[0].wrtKwh,null);assert.throws(()=>save('wider',[row({lng:-1})]),/Invalid/);assert.throws(()=>save('wider',[row({hsd:'bad'})]),/Invalid/);});
test('nonenergy EnPI units use the relevant raw quantity',()=>{const r=calculateRows('hsu',[row({lpg:10,enpiUnit:'Ltr/Hrs',production:2})])[0];assert.equal(r.enpiValue,2.5);});
test('custom formula saves factors and survives a load/save without double conversion',()=>{
 const formula={ELECTRICITY:1,LNG:15,LPG:12,HSD:4};
 const first=prepareSave('wider',{monthYear:'2026-09',inputBasis:'quantity-v1',formula,rows:[row()]});
 assert.equal(first.rows[0].totalConsumption,1170);assert.deepEqual(first.formula,formula);
 assert.equal(first.rows[0].fuelFactor,15);assert.equal(first.rows[0].hsdFactor,4);
 const second=prepareSave('wider',{monthYear:'2026-09',inputBasis:'quantity-v1',formula:first.formula,rows:toInputRows('wider','2026-09',first.rows)});
 assert.deepEqual(first.totals,second.totals);
});
test('all plants honor chosen fuel and corresponding factor',()=>{
 for(const plant of ['wider','utility','hsu','narrow-flat','narrow-tube']){
  const key=plant==='wider'?'lng':plant==='utility'?'lngLpg':'lpg';
  for(const type of ['LNG','LPG']){const d=save(plant,[row({[key]:10,fuelType:type})]);assert.equal(d.rows[0][key],type==='LNG'?139:127.8);assert.equal(d.rows[0].fuelType,type);}
 }
});
test('explicit legacy formula recalculates numeric inputs without converting stored fuel twice',()=>{
 const formula={ELECTRICITY:1,LNG:2,LPG:3,HSD:1};
 const first=prepareSave('wider',{monthYear:'2026-08',formula,rows:[row({electricity:'1000',lng:'10',hsd:'5',fuelType:'LNG'})]});
 assert.equal(first.rows[0].lng,10);assert.equal(first.rows[0].totalConsumption,1025);assert.equal(first.totals.electricity,1000);assert.equal(first.totals.lng,10);
 const second=prepareSave('wider',{...first,rows:toInputRows('wider','2026-08',first.rows)});assert.deepEqual(first.totals,second.totals);
});
test('rejects unsafe, missing or non-finite formula factors and unsupported fuel types',()=>{
 const formula={ELECTRICITY:1,LNG:15,LPG:12,HSD:4};
 for(const LNG of [0,-1,Infinity,'15'])assert.throws(()=>prepareSave('wider',{monthYear:'2026-09',inputBasis:'quantity-v1',formula:{...formula,LNG},rows:[row()]}),/factors/);
 assert.throws(()=>save('hsu',[row({lpg:10,fuelType:'INVALID'})]),/LNG or LPG/);
});

export const numeric = value => {
 if(value == null || String(value).trim()==='') return null;
 const n=Number(String(value).replaceAll(',','').replace(/%$/,''));return Number.isFinite(n)?n:null;
};
export function equipmentMetrics(plant,name,data) {
 if(plant==='solar') {
  const fields={'CTL Production':['ctlProduction','Production','MT'],'EV Station':['evStationElectricity','Electricity','kWh'],'Solar Generation':['solarElectricity','Generation','kWh']};
  const item=fields[name];return item?[{key:item[0],label:item[1],unit:item[2],value:data?.[item[0]]??null}]:[];
 }
 const norm=s=>String(s||'').trim().toUpperCase();
 const row=data?.rows?.find(r=>norm(r.equipment)===norm(name));
 const r=row||{};
 const unit=String(r.enpiUnit||'').split('/')[1]||'MT';
 return [
  {key:'electricity',label:'Electricity',unit:'kWh',value:r.electricity??null},
  {key:'fuel',label:`${r.fuelType || (plant==='wider'?'LNG':plant==='utility'?'LNG / LPG':'LPG')} Energy`,unit:'kWh',value:r.lng??r.lpg??r.lngLpg??null},
  ...(data?.inputBasis==='quantity-v1'?[{key:'fuelQuantity',label:`${r.fuelType||'Fuel'} Quantity`,unit:'kg',value:r.fuelQuantity??null},{key:'hsdLitres',label:'HSD Quantity',unit:'Ltr',value:r.hsdLitres??null}]:[]),
  {key:'hsd',label:'HSD Energy',unit:'kWh',value:r.hsd??null},
  {key:'totalConsumption',label:'Total Consumption',unit:'kWh',value:r.totalConsumption??null},
  {key:'production',label:'Production',unit,value:r.production??null},
  {key:'enpiUnit',label:'EnPI Unit',unit:'',value:r.enpiUnit??null,text:true},
  {key:'enpiValue',label:'EnPI Value',unit:r.enpiUnit||'',value:r.enpiValue??null},
  {key:'wrtKwh',label:'WRT to Total',unit:'%',value:r.wrtKwh??null},
 ];
}
export function lastSixMonths(month) {
 const [year,m]=month.split('-').map(Number);
 return Array.from({length:6},(_,i)=>{const d=new Date(Date.UTC(year,m-1-(5-i),1));return d.toISOString().slice(0,7);});
}

import {quantityMonth,fuelKey,fuelType} from './fuelConversion';
const normalized=s=>String(s).toLowerCase().replace(/\s+/g,'');
export function prepareFuelSpreadsheet(plant,month,items){
 if(!quantityMonth(month))return items.map(item=>{
  const out={...item};
  for(const [k,v] of Object.entries(item)){
   if(/^(lng|lpg|lng\/lpg)\(kwh\)$/.test(normalized(k)))for(const alias of ['LNG ( Kwh)','LNG (Kwh)','LPG ( Kg)','LPG (Kg)','LNG/LPG ( Kg)','LNG/LPG (Kg)'])out[alias]=v;
   if(normalized(k)==='hsd(kwh)'){out['HSD (Ltr)']=v;out['HSD (Kwh)']=v;}
  }
  return out;
 });
 const fuel=plant==='wider'?'LNG':plant==='utility'?'LNG/LPG':'LPG';
 return items.map(item=>{
  const get=names=>{const key=Object.keys(item).find(k=>names.some(n=>normalized(k)===normalized(n)));return key==null?undefined:item[key];};
  const quantity=get([`${fuel} (kg)`, 'LNG/LPG (kg)']);const litres=get(['HSD (Ltr)','HSD (litre)','HSD (litres)']);
  if(quantity===undefined||litres===undefined)throw Error(`Use the September-onward sample with ${fuel} (kg) and HSD (Ltr) columns. Old kWh columns cannot be imported as quantities.`);
  if(item['Fuel Type']&&!['LNG','LPG'].includes(item['Fuel Type']))throw Error('Fuel Type must be LNG or LPG.');
  const rowMonth=get(['Month-Year']);if(rowMonth&&String(rowMonth)!==month)throw Error('Excel month does not match the selected month.');
  for(const value of [quantity,litres])if(value!==''&&value!=null&&(!Number.isFinite(Number(value))||Number(value)<0))throw Error('Fuel quantities must be nonnegative numbers.');
  return {...item,'LNG ( Kwh)':quantity,'LNG (Kwh)':quantity,'LPG ( Kg)':quantity,'LPG (Kg)':quantity,'LNG/LPG ( Kg)':quantity,'LNG/LPG (Kg)':quantity,'HSD (Kwh)':litres,'HSD (Ltr)':litres};
 });
}
export function fuelSampleRows(plant,month,items,rows){
 const key=fuelKey(plant);
 return items.map((item,i)=>{const out={...item};for(const k of Object.keys(out)){if(/^(LNG|LPG|LNG\/LPG|HSD)\s*\(/i.test(k))delete out[k];}
 out[`LNG/LPG (${quantityMonth(month)?'kg':'kWh'})`]=rows[i]?.[key]??'';out[`HSD (${quantityMonth(month)?'Ltr':'kWh'})`]=rows[i]?.hsd??'';
 out['Fuel Type']=fuelType(plant,rows[i]||{});
 return out;});
}

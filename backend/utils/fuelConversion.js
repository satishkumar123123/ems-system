const CUTOFF='2026-09';
const FACTORS={LNG:13.9,LPG:12.78,HSD:3.3};
const quantityMonth=month=>/^20\d{2}-(0[1-9]|1[0-2])$/.test(month||'')&&month>=CUTOFF;
const fuelKey=plant=>plant==='wider'?'lng':plant==='utility'?'lngLpg':'lpg';
const fuelType=(plant,row)=>plant==='wider'?'LNG':plant!=='utility'?'LPG':['LNG','LPG'].includes(row.fuelType)?row.fuelType:/LPG/i.test(row.equipment||'')?'LPG':'LNG';
const number=value=>value==null||String(value).trim()===''?null:Number(String(value).replaceAll(',',''));
function calculateRows(plant,rows){
 const key=fuelKey(plant);
 const calculated=rows.map(row=>{
  const type=fuelType(plant,row),e=number(row.electricity),f=number(row[key]),h=number(row.hsd),p=number(row.production);
  const has=e!=null||f!=null||h!=null;
  const total=has?(e||0)+(f||0)*FACTORS[type]+(h||0)*FACTORS.HSD:null;
  const unit=String(row.enpiUnit||'').replace(/\s/g,'').toLowerCase();
  let enpi=row.enpiValue;
  if(/^kwh(?:\/|$)/.test(unit))enpi=unit==='kwh'?total:p>0&&total!=null?total/p:null;
  else if(/^(ltr|litre|liter)\//.test(unit))enpi=p>0&&h!=null?h/p:null;
  else if(/^kg\//.test(unit))enpi=p>0&&f!=null?f/p:null;
  return {...row,fuelType:type,totalConsumption:total,enpiValue:enpi};
 });
 const total=calculated.reduce((s,r)=>s+(r.totalConsumption||0),0);
 return calculated.map(r=>({...r,wrtKwh:r.totalConsumption!=null&&total>0?r.totalConsumption/total*100:null}));
}
function toInputRows(plant,month,rows){
 if(!quantityMonth(month))return rows;
 const key=fuelKey(plant);
 return rows.map(row=>{const type=fuelType(plant,row);const fuel=row[key]??row.lng??row.lpg??row.lngLpg;return {...row,fuelType:type,[key]:row.fuelQuantity??(number(fuel)==null?null:number(fuel)/(row.fuelFactor||FACTORS[type])),hsd:row.hsdLitres??(number(row.hsd)==null?null:number(row.hsd)/(row.hsdFactor||FACTORS.HSD))};});
}
function prepareSave(plant,body){
 if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(body.monthYear||''))throw Error('Invalid month');
 if(!quantityMonth(body.monthYear))return body;
 if(body.inputBasis!=='quantity-v1')throw Error('September 2026 onward requires kg/litre inputs. Refresh the page before saving.');
 if(!Array.isArray(body.rows))throw Error('Equipment rows are required');
 const key=fuelKey(plant);
 for(const r of body.rows){for(const k of ['electricity',key,'hsd','production']){const n=number(r[k]);if(n!=null&&(!Number.isFinite(n)||n<0))throw Error(`Invalid nonnegative quantity: ${r.equipment} ${k}`);}if(plant==='utility'&&r.fuelType!=null&&!['LNG','LPG'].includes(r.fuelType))throw Error('Choose LNG or LPG');}
 const rows=calculateRows(plant,body.rows).map(r=>{const f=number(r[key]),h=number(r.hsd),type=fuelType(plant,r);return {...r,electricity:number(r.electricity),production:number(r.production),fuelQuantity:f,hsdLitres:h,fuelFactor:FACTORS[type],hsdFactor:FACTORS.HSD,[key]:f==null?null:f*FACTORS[type],hsd:h==null?null:h*FACTORS.HSD};});
 const totals=rows.reduce((a,r)=>{for(const k of ['electricity',key,'hsd','totalConsumption','production'])a[k]+=(r[k]||0);return a;},{electricity:0,[key]:0,hsd:0,totalConsumption:0,production:0});
 totals.enpiValue=totals.production>0?totals.totalConsumption/totals.production:null;totals.wrtKwh=totals.totalConsumption>0?100:null;
 return {...body,inputBasis:'quantity-v1',rows,totals};
}
module.exports={CUTOFF,FACTORS,quantityMonth,fuelKey,fuelType,calculateRows,toInputRows,prepareSave};

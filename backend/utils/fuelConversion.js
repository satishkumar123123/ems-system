const CUTOFF='2026-09';
const FACTORS={LNG:13.9,LPG:12.78,HSD:3.3};
const quantityMonth=month=>/^20\d{2}-(0[1-9]|1[0-2])$/.test(month||'')&&month>=CUTOFF;
const fuelKey=plant=>plant==='wider'?'lng':plant==='utility'?'lngLpg':'lpg';
const fuelType=(plant,row)=>['LNG','LPG'].includes(row.fuelType)?row.fuelType:plant==='wider'?'LNG':plant!=='utility'?'LPG':/LPG|BOILER|MEE/i.test(row.equipment||'')?'LPG':'LNG';
const number=value=>value==null||String(value).trim()===''?null:Number(String(value).replaceAll(',',''));
function defaultFormula(month){return {ELECTRICITY:1,...(quantityMonth(month)?FACTORS:{LNG:1,LPG:1,HSD:1})};}
function validateFormula(formula){
 if(!formula||Array.isArray(formula)||typeof formula!=='object')throw Error('Formula factors are required');
 const keys=['ELECTRICITY','LNG','LPG','HSD'];
 if(Object.keys(formula).some(k=>!keys.includes(k))||keys.some(k=>typeof formula[k]!=='number'||!Number.isFinite(formula[k])||formula[k]<=0||formula[k]>1000000))throw Error('Formula factors must be positive numbers up to 1,000,000');
 return Object.fromEntries(keys.map(k=>[k,formula[k]]));
}
function calculateRows(plant,rows,formula={ELECTRICITY:1,...FACTORS},basis='quantity-v1'){
 const factors=validateFormula(formula);
 const key=fuelKey(plant);
 const calculated=rows.map(row=>{
  const type=fuelType(plant,row),e=number(row.electricity),f=number(row[key]),h=number(row.hsd),p=number(row.production);
  const has=e!=null||f!=null||h!=null;
  const total=has?(e||0)*factors.ELECTRICITY+(f||0)*factors[type]+(h||0)*factors.HSD:null;
  if(total!=null&&!Number.isFinite(total))throw Error('Calculation exceeds the supported numeric range');
  const unit=String(row.enpiUnit||'').replace(/\s/g,'').toLowerCase();
  let enpi=row.enpiValue;
  if(/^kwh(?:\/|$)/.test(unit))enpi=unit==='kwh'?total:p>0&&total!=null?total/p:null;
  else if(basis==='quantity-v1'&&/^(ltr|litre|liter)\//.test(unit))enpi=p>0&&h!=null?h/p:null;
  else if(basis==='quantity-v1'&&/^kg\//.test(unit))enpi=p>0&&f!=null?f/p:null;
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
 const isQuantity=quantityMonth(body.monthYear);
 if(!isQuantity && body.formula==null)return body;
 const formula=validateFormula(body.formula??defaultFormula(body.monthYear));
 if(isQuantity&&body.inputBasis!=='quantity-v1')throw Error('September 2026 onward requires kg/litre inputs. Refresh the page before saving.');
 if(!Array.isArray(body.rows))throw Error('Equipment rows are required');
 const key=fuelKey(plant);
 for(const r of body.rows){for(const k of ['electricity',key,'hsd','production']){const n=number(r[k]);if(n!=null&&(!Number.isFinite(n)||n<0))throw Error(`Invalid nonnegative quantity: ${r.equipment} ${k}`);}if(r.fuelType!=null&&!['LNG','LPG'].includes(r.fuelType))throw Error('Choose LNG or LPG');}
 const calculated=calculateRows(plant,body.rows,formula,isQuantity?'quantity-v1':'legacy-kwh');
 const rows=isQuantity?calculated.map(r=>{const f=number(r[key]),h=number(r.hsd),type=fuelType(plant,r);return {...r,electricity:number(r.electricity),production:number(r.production),fuelQuantity:f,hsdLitres:h,fuelFactor:formula[type],hsdFactor:formula.HSD,[key]:f==null?null:f*formula[type],hsd:h==null?null:h*formula.HSD};}):calculated.map(r=>({...r,electricity:number(r.electricity),[key]:number(r[key]),hsd:number(r.hsd),production:number(r.production)}));
 const totals=rows.reduce((a,r)=>{for(const k of ['electricity',key,'hsd','totalConsumption','production'])a[k]+=(r[k]||0);return a;},{electricity:0,[key]:0,hsd:0,totalConsumption:0,production:0});
 totals.enpiValue=totals.production>0?totals.totalConsumption/totals.production:null;totals.wrtKwh=totals.totalConsumption>0?100:null;
 return {...body,inputBasis:isQuantity?'quantity-v1':'legacy-kwh',formula,rows,totals};
}
module.exports={CUTOFF,FACTORS,quantityMonth,fuelKey,fuelType,calculateRows,toInputRows,prepareSave,defaultFormula,validateFormula};

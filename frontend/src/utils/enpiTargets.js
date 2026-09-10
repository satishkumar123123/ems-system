export function trendMonths(month,count){const [y,m]=month.split('-').map(Number);return Array.from({length:count},(_,i)=>new Date(Date.UTC(y,m-count+i,1)).toISOString().slice(0,7));}
export function performance(actual,target){return actual==null||target==null?'No comparison':actual>target?'Above target':actual<target?'Better than target':'On target';}
export function canonicalEnpiUnit(value) {
 return String(value||'').toLowerCase().replace(/\s+/g,'').replace(/\/ton(?:ne)?s?$/, '/mt');
}
export function averageEnpi(rows,unit) {
 const group=rows.filter(r=>canonicalEnpiUnit(r.enpiUnit)===canonicalEnpiUnit(unit)&&canonicalEnpiUnit(unit));
 const values=group.map(r=>r.enpiValue).filter(v=>v!=null&&String(v).trim()!=='').map(v=>Number(String(v).replaceAll(',',''))).filter(Number.isFinite);
 return {value:values.length?values.reduce((a,b)=>a+b,0)/values.length:null,count:values.length,total:group.length};
}

export function applicableTarget(records,month){return records.filter(r=>r.kind==='target'&&r.month<=month).sort((a,b)=>b.month.localeCompare(a.month))[0]||null;}
export function targetGap(actual,target){return actual==null||target==null||target===0?null:(actual-target)/target*100;}

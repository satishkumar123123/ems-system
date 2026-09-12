import seed from './seuSeed.json';
import seed2025 from './seuSeed2025.json';
export const plants = {abpl:'ABPL',wider:'Wider',hsu:'HSU','narrow-flat':'Narrow Flat','narrow-tube':'Narrow Tube',utility:'Utility'};
export function initialRows(year){if(year===2025)return seed2025.map(r=>({...r,values:[...r.values]}));return seed.map(r=>({...r,values:year===2026?[...r.values]:Array(12).fill(null),baseline:year===2026?r.baseline:null,target:year===2026?r.target:null}));}
export function summarize(row,start=0,end=11){const values=row.values.slice(start,end+1).filter(v=>v!==null&&Number.isFinite(v));const average=values.length?values.reduce((a,b)=>a+b,0)/values.length:null;const deviation=average===null||row.target===null||row.target===0?null:(row.direction==='higher'?average-row.target:row.target-average)/row.target*100;return {average,deviation,count:values.length,status:deviation===null?'No comparison':deviation<0?'Lagging':deviation>0?'Leading':'On target',outside:deviation!==null&&row.tolerance!==null&&Math.abs(deviation)>row.tolerance};}
export function monthLabels(year){return Array.from({length:12},(_,i)=>new Date(Date.UTC(year,3+i,1)).toLocaleDateString('en-GB',{month:'short',year:'2-digit',timeZone:'UTC'}));}

export function mergeRows(year,records=[]){return initialRows(year).map(row=>{const saved=records.find(r=>r.id===row.id);return {...row,...saved,id:row.id,name:row.name,plant:row.plant,revision:saved?.revision||0};});}

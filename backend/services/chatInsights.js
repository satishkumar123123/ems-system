const {NAMES,monthsBetween,sec}=require('./chatData');
const format=v=>v==null?'N/A':v.toLocaleString('en-IN',{maximumFractionDigits:2});
function comparePeriods(plan,data){
 if(!plan.comparison)return null;
 const c=plan.comparison,key=plan.metric==='sec'?'totalSec':plan.metric;
 const units=plan.metric==='sec'?'kWh/ton':plan.metric==='production'?'recorded output':'kWh';
 const value=(plant,from,to)=>{
  const months=monthsBetween(from,to),periods=data.monthly.filter(r=>r.plant===NAMES[plant]&&months.includes(r.month));
  if(periods.length!==months.length||periods.some(r=>!r.available||r[key]==null))return null;
  const equipment=data.equipment.filter(r=>r.plant===NAMES[plant]&&months.includes(r.month));
  if(plan.metric==='production'){
   if(!data.equipmentFilter||!equipment.length||new Set(equipment.map(r=>r.outputBasis.toLowerCase())).size!==1)return null;
  }
  if(plan.metric==='sec')return sec(equipment.map(r=>({...r,enpiUnit:r.outputBasis})),'totalConsumption');
  return periods.reduce((sum,r)=>sum+r[key],0);
 };
 const calculations=plan.plants.map(plant=>{
  let baseline=value(plant,c.baselineFrom,c.baselineTo),current=value(plant,c.currentFrom,c.currentTo);
  if(plan.metric==='production'){
   const bases=new Set(data.equipment.filter(r=>r.plant===NAMES[plant]).map(r=>r.outputBasis.toLowerCase()));if(bases.size!==1)baseline=current=null;
  }
  const delta=baseline==null||current==null?null:current-baseline;
  return {plant:NAMES[plant],baseline,current,delta,percent:delta==null||baseline===0?null:delta/baseline*100,note:baseline==null||current==null?'Incomplete data / incompatible production units':baseline===0?'Zero baseline: percentage is undefined':'Complete comparison'};
 });
 return {calculations,table:{title:`${plan.metric}: ${c.currentFrom}–${c.currentTo} vs ${c.baselineFrom}–${c.baselineTo}`,columns:['Plant',`Baseline (${units})`,`Current (${units})`,`Change (${units})`,'Change %','Coverage'],rows:calculations.map(r=>[r.plant,format(r.baseline),format(r.current),format(r.delta),r.percent==null?'N/A':`${format(r.percent)}%`,r.note])},text:calculations.map(r=>`${r.plant}: ${format(r.baseline)} → ${format(r.current)} ${units}; change ${format(r.delta)} (${r.percent==null?'percentage N/A':format(r.percent)+'%'}).`).join('\n')};
}
async function findEvidence(plan,models,equipmentFilter){
 const query={plant:{$in:plan.plants.filter(p=>p!=='solar')},date:{$gte:`${plan.from}-01`,$lte:`${plan.to}-31`},kind:{$in:['audit','meeting','action']}};
 // Literal matching: user text cannot become a regex or a MongoDB operator.
 const docs=await models.ScheduleItem.find(query).select('-attachments -__v').sort({date:-1}).limit(201).lean();
 const filter=(equipmentFilter||'').toLowerCase();
 const eligible=docs.slice(0,200).filter(i=>!filter||[i.equipment,i.title,i.description,i.findings,i.correctiveAction].some(v=>String(v||'').toLowerCase().includes(filter)));
 const items=eligible.filter(i=>i.findings||i.decisions||i.correctiveAction||i.description).slice(0,20);
 return {truncated:docs.length>200||eligible.length>20,items:items.map(i=>({plant:i.plant,date:i.date,title:i.title,status:i.status,text:i.findings||i.decisions||i.correctiveAction||i.description,url:`/${i.plant}/schedule?record=${i._id}`}))};
}
function enrichAnswer(plan,data,result,evidence){
 const comparison=data?comparePeriods(plan,data):null;
 if(comparison){result.tables.unshift(comparison.table);result.answer=`Calculated comparison\n${comparison.text}\n\n${result.answer}`;result.calculations=comparison.calculations;}
 if(evidence){
  result.answer+='\n\n'+(evidence.items.length?'Related saved notes were found. They are recorded observations/actions, not proof that they caused this energy change.':'Selected plant/period/equipment ke liye matching audit/meeting notes nahi mile. Isliye increase ka confirmed reason available nahi hai.');
  if(evidence.truncated)result.answer+=' Notes search was limited; older/additional records may not be included.';
  if(evidence.items.length){result.tables.push({title:'Recorded observations — confirm relevance before attributing a cause',columns:['Plant','Date','Record','Status','Saved note'],rows:evidence.items.map(i=>[NAMES[i.plant],i.date,i.title,i.status,i.text])});result.sources.push(...evidence.items.map(i=>({label:`${NAMES[i.plant]} · ${i.title}`,url:i.url})));}
 }
 const sourceMap=new Map();for(const source of result.sources){if(!sourceMap.has(source.url))sourceMap.set(source.url,source);}result.sources=[...sourceMap.values()].map((s,i)=>({...s,id:`S${i+1}`}));
 if(result.sources.length)result.answer+='\n\nSource records: '+result.sources.slice(0,8).map(s=>`[${s.id}]`).join(' ')+(result.sources.length>8?' (more links below)':'');
 result.coverage={requestedMonths:plan.months.length,missing:data?.missing||[],equipmentMatches:data?.equipment.length||0,notes:evidence?.items.length||0,notesLimited:evidence?.truncated||false};
 result.assumptions=plan.assumptions;
 return result;
}
module.exports={comparePeriods,findEvidence,enrichAnswer};

const PLANTS = { wider: 'WiderData', utility: 'UtilityData', hsu: 'HsuData', 'narrow-flat': 'NarrowFlatData', 'narrow-tube': 'NarrowTubeData', solar: 'SolarData' };
const NAMES = { wider: 'Wider', utility: 'Utility', hsu: 'HSU', 'narrow-flat': 'Narrow Flat', 'narrow-tube': 'Narrow Tube', solar: 'Solar' };
const MONTH = /^20\d{2}-(0[1-9]|1[0-2])$/;
const normalizeText = value => String(value || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097f]+/g, ' ').trim();
const num = value => value == null || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0 ? null : Number(value);
const tonnes = row => /^kwh\/(mt|t|ton|tons|tonne|tonnes)$/i.test(String(row.enpiUnit || '').replace(/\s/g,''));
function fail(message) { const error = new Error(message); error.status = 400; throw error; }
function monthsBetween(from,to) {
 if(!MONTH.test(from || '') || !MONTH.test(to || '') || from > to) fail('Select a valid start and end month.');
 const months=[];let [year,month]=from.split('-').map(Number);
 while(`${year}-${String(month).padStart(2,'0')}`<=to){months.push(`${year}-${String(month).padStart(2,'0')}`);if(months.length>24)fail('Ask about up to 24 months at a time.');if(++month===13){year++;month=1;}}
 return months;
}
function planQuestion(body) {
 if(!body || typeof body.message!=='string' || !body.message.trim() || body.message.length>1500)fail('Enter a question of up to 1,500 characters.');
 const question=body.message.trim(), q=normalizeText(question);
 if(body.plant!=='all' && !Object.hasOwn(PLANTS,body.plant || ''))fail('Select a valid plant.');
 let plants=body.plant==='all'?Object.keys(PLANTS).filter(p=>p!=='solar'):[body.plant];
 const explicit=Object.keys(PLANTS).filter(p=>new RegExp(`\\b${p.replaceAll('-','[ -]?')}\\b`,'i').test(question));
 if(explicit.length)plants=explicit;
 if(/\b(abpl|all plants|all units|five plants|5 plants|paanch|pancho|sabhi|sare plant)\b/.test(q))plants=Object.keys(PLANTS).filter(p=>p!=='solar');
 let from=body.from,to=body.to || body.from;
 const exact=[...question.matchAll(/\b(20\d{2}-(?:0[1-9]|1[0-2]))\b/g)].map(m=>m[1]);
 const years=[...question.matchAll(/\b(20\d{2})\b/g)].map(m=>Number(m[1]));
 const fy=[...question.matchAll(/\b(20\d{2})\s*[-/]\s*(\d{2}|20\d{2})\b/g)].filter(m=>Number(m[2])%100===(Number(m[1])+1)%100);
 if(fy.length && /\b(fy|financial|finan|yoy|year)\b/i.test(question)){
   const starts=fy.map(m=>Number(m[1]));if(starts.length===1 && /\b(yoy|previous|pichle|compare|comparison)\b/i.test(question))starts.push(starts[0]-1);
   from=`${Math.min(...starts)}-04`;to=`${Math.max(...starts)+1}-03`;
 } else if(exact.length){from=exact.slice().sort()[0];to=exact.slice().sort().at(-1);}
 else {
   const monthNames={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
   const found=[...question.matchAll(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b(?:\s+(20\d{2}))?/gi)];
   if(found.length){const values=found.map(m=>`${m[2] || years.at(-1) || String(from).slice(0,4)}-${String(monthNames[m[1].slice(0,3).toLowerCase()]).padStart(2,'0')}`).sort();from=values[0];to=values.at(-1);}
 }
 const months=monthsBetween(from,to);
 const schedule=/\b(schedule|meetings?|audits?|actions?|pending|overdue|objectives?|targets?|reviews?|decisions?|improvement|verified|findings)\b|बैठक|ऑडिट|सुधार/.test(q);
 const metric=/\b(sec|specific|efficiency|enpi)\b/.test(q)?'sec':/\b(production|output|utpadan)\b|उत्पादन/.test(q)?'production':/\b(total|energy|consumption)\b/.test(q)&&!/\b(electricity|electric|bijli)\b/.test(q)?'totalConsumption':'electricity';
 return { question,plants,from,to,months,schedule,metric,rank:/\b(top|highest|maximum|max|sabse|jyada|ranking)\b/.test(q),equipment:typeof body.equipment==='string'?body.equipment.trim().slice(0,180):'',q };
}
function sec(rows,key) {
 const selected=rows.filter(tonnes);
 if(!selected.length || selected.some(r=>num(r.production)==null || num(r[key])==null))return null;
 const denominator=selected.reduce((s,r)=>s+num(r.production),0);
 return denominator>0?selected.reduce((s,r)=>s+num(r[key]),0)/denominator:null;
}
function summarize(rows) {
 const sum=key=>rows.length && rows.every(r=>num(r[key])!=null)?rows.reduce((s,r)=>s+num(r[key]),0):null;
 return {electricity:sum('electricity'),totalConsumption:sum('totalConsumption'),production:sum('production'),electricSec:sec(rows,'electricity'),totalSec:sec(rows,'totalConsumption')};
}
async function loadData(plan,models) {
 const source=[];const missing=[];const monthly=[];const equipment=[];const fullRows=[];
 const datasets=await Promise.all(plan.plants.map(async plant=>({plant,docs:await models[PLANTS[plant]].find({monthYear:{$in:plan.months}}).select('-__v').lean()})));
 let filter=normalizeText(plan.equipment);
 {const names=[...new Set(datasets.flatMap(d=>d.docs.flatMap(doc=>(doc.rows||[]).map(r=>r.equipment))).filter(Boolean))].sort((a,b)=>b.length-a.length);const name=names.find(name=>` ${plan.q} `.includes(` ${normalizeText(name)} `));if(name)filter=normalizeText(name);}
 for(const {plant,docs} of datasets)for(const month of plan.months){
  const doc=docs.find(d=>d.monthYear===month);
  if(!doc){missing.push(`${NAMES[plant]} ${month}`);monthly.push({plant:NAMES[plant],month,available:false,electricity:null,totalConsumption:null,production:null,electricSec:null,totalSec:null});continue;}
  source.push({label:`${NAMES[plant]} · ${month}`,url:`/${plant}?month=${month}`,plant,month});
  const rows=plant==='solar'?[{equipment:'Solar generation',electricity:doc.solarElectricity,totalConsumption:null,production:null,enpiUnit:''},{equipment:'EV station',electricity:doc.evStationElectricity,totalConsumption:null,production:null,enpiUnit:''},{equipment:'CTL',electricity:null,totalConsumption:null,production:doc.ctlProduction,enpiUnit:'kWh/MT'}]:(doc.rows||[]);
  const selected=filter?rows.filter(r=>normalizeText(r.equipment).includes(filter)):rows;
  const sums=summarize(selected);
  if(!filter && plant==='solar'){sums.electricity=num(doc.solarElectricity);sums.totalConsumption=null;sums.production=num(doc.ctlProduction);}
  // Plant cards match saved totals; SEC always uses compatible row-level denominators.
  if(!filter && plant!=='solar')for(const key of ['electricity','totalConsumption','production'])if(num(doc.totals?.[key])!=null)sums[key]=num(doc.totals[key]);
  monthly.push({plant:NAMES[plant],month,available:true,...sums});
  for(const row of selected){fullRows.push({plant,month,row});equipment.push({plant:NAMES[plant],month,equipment:row.equipment,electricity:num(row.electricity),totalConsumption:num(row.totalConsumption),production:num(row.production),outputBasis:row.enpiUnit||'Unspecified',electricSec:sec([row],'electricity'),totalSec:sec([row],'totalConsumption')});}
 }
 const summary=plan.plants.map(plant=>{
  const periods=monthly.filter(r=>r.plant===NAMES[plant]);const complete=periods.every(r=>r.available);
  const sum=key=>complete && periods.every(r=>r[key]!=null)?periods.reduce((s,r)=>s+r[key],0):null;
  const rows=fullRows.filter(r=>r.plant===plant).map(r=>r.row);
  return {plant:NAMES[plant],savedMonths:periods.filter(r=>r.available).length,requestedMonths:plan.months.length,electricity:sum('electricity'),totalConsumption:sum('totalConsumption'),production:sum('production'),electricSec:complete?sec(rows,'electricity'):null,totalSec:complete?sec(rows,'totalConsumption'):null};
 });
 return {summary,monthly,equipment,source,missing,equipmentFilter:filter};
}
async function loadSchedules(plan,models) {
 const selected=plan.plants.filter(p=>p!=='solar');
 const query={plant:{$in:selected}};
 const currentView=/\b(pending|overdue|upcoming|next|last|latest)\b/.test(plan.q);
 if(!currentView)query.date={$gte:`${plan.from}-01`,$lte:`${plan.to}-31`};
 if(/\bactions?\b|\bpending\b/.test(plan.q))query.kind='action';
 else if(/\bmeetings?|decisions?\b/.test(plan.q))query.kind='meeting';
 else if(/\baudits?|findings?\b/.test(plan.q))query.kind='audit';
 else if(/\bobjectives?|targets?\b/.test(plan.q))query.kind='objective';
 const records=await models.ScheduleItem.find(query).select('-attachments -__v').sort({date:-1,createdAt:-1}).limit(201).lean();
 const truncated=records.length>200;let items=records.slice(0,200);
 if(/\bactions?\b/.test(plan.q))items=items.filter(i=>i.kind==='action');
 if(/\boverdue\b/.test(plan.q))items=items.filter(i=>!['Completed','Verified'].includes(i.status)&&i.date<new Date().toISOString().slice(0,10));
 else if(/\bpending\b/.test(plan.q))items=items.filter(i=>i.kind==='action'&&i.status!=='Verified');
 else if(/\bmeeting|decision\b/.test(plan.q))items=items.filter(i=>i.kind==='meeting');
 else if(/\baudit|finding\b/.test(plan.q))items=items.filter(i=>i.kind==='audit');
 else if(/\bobjective|target\b/.test(plan.q))items=items.filter(i=>i.kind==='objective');
 // Upcoming and overdue are current-work views; ordinary schedule questions use selected dates.
 const current=/\b(pending|overdue|upcoming|next|last|latest)\b/.test(plan.q);
 if(!current)items=items.filter(i=>i.date>=`${plan.from}-01` && i.date.slice(0,7)<=plan.to);
 if(/\b(upcoming|next)\b/.test(plan.q))items=items.filter(i=>['meeting','audit'].includes(i.kind)&&i.date>=new Date().toISOString().slice(0,10)&&!['Completed','Verified'].includes(i.status)).sort((a,b)=>a.date.localeCompare(b.date));
 if(/\b(last|latest)\b/.test(plan.q))items=items.filter(i=>i.date<=new Date().toISOString().slice(0,10)).slice(0,1);
 return {items:items.map(i=>({...i,_id:String(i._id),history:(i.history||[]).slice(-5)})),truncated,current,source:items.map(i=>({label:`${NAMES[i.plant]} · ${i.title}`,url:`/${i.plant}/schedule?record=${i._id}`}))};
}
const format=value=>value==null?'N/A':Number(value).toLocaleString('en-IN',{maximumFractionDigits:2});
function answerFromData(plan,data,schedules) {
 const reasons=[];
 if(schedules){
  const rows=schedules.items.map(i=>[NAMES[i.plant],i.title,i.kind,i.owner,i.date,i.status,i.decisions||i.findings||i.correctiveAction||i.description||'—']);
  return {answer:`${rows.length} matching schedule record${rows.length===1?'':'s'} ${schedules.current?'current work view mein':`${plan.from} se ${plan.to} tak`} mile.${schedules.truncated?' Latest 200 records ke andar search hua; older records is answer mein included nahi hain.':''}\nRecord link se complete details aur history khol sakte hain.`,tables:[{title:'Schedule records',columns:['Plant','Title','Type','Owner','Date','Status','Notes'],rows}],sources:schedules.source};
 }
 const key=plan.metric==='sec'?'totalSec':plan.metric;
 const sorted=[...data.summary].sort((a,b)=>(b[key]??-1)-(a[key]??-1));
 if(data.missing.length)reasons.push(`${data.missing.length} plant-month record missing hai. Missing data ko zero nahi maana gaya.`);
 reasons.push('Energy: kWh. Solar summary electricity means solar generation (EV use is separate in equipment details). Production plant totals may mix output units; equipment output basis is shown below. SEC: kWh/ton, only tonne-based process throughput.');
 if(plan.rank && plan.metric==='production')reasons.push('Production ranking is not shown because equipment may use different output units.');
 let answer=`${plan.from}${plan.to!==plan.from?` se ${plan.to}`:''} ke saved records ka result${data.equipmentFilter?` (${data.equipmentFilter})`:''}:`;
 if(!plan.rank && data.summary.length===1 && data.summary[0][key]!=null)answer+=`\n${data.summary[0].plant}: ${key} = ${format(data.summary[0][key])}${key==='totalSec'?' kWh/ton':key==='production'?' (recorded output units)':' kWh'}.`;
 if(plan.rank && plan.metric!=='production' && sorted[0]?.[key]!=null)answer+=`\nAvailable complete plant totals mein ${sorted[0].plant} ka ${key} highest hai: ${format(sorted[0][key])}.`;
 if(/\b(why|kyu|kyun|reason|cause)\b/.test(plan.q))answer+='\nConsumption badhne ka confirmed reason monthly numbers se nahi pata chalta. Audit findings / meeting notes ka question poochhein; main reason guess nahi karunga.';
 if(!plan.reason && !plan.comparison && !/\b(electricity|electric|bijli|energy|consumption|production|output|sec|enpi|summary|compare|comparison|yoy|highest|top|solar|kitna|kitni|data)\b|बिजली|उत्पादन/.test(plan.q))answer='Data mode is question ko fully interpret nahi kar saka. Neeche selected scope ka data hai. Electricity, production, SEC, comparison ya schedule ke baare mein poochhein. Full conversational AI abhi connected nahi hai.';
 const table=rows=>rows.map(r=>[r.plant,r.electricity,r.totalConsumption,r.production,r.electricSec,r.totalSec].map(v=>typeof v==='string'?v:format(v)));
 const tables=[{title:'Plant totals for requested period',columns:['Plant','Electricity (kWh)','Total energy (kWh)','Recorded production*','Electricity SEC','Total energy SEC'],rows:table(plan.rank && plan.metric!=='production'?sorted:data.summary)}];
 if(plan.months.length>1)tables.push({title:'Monthly breakdown',columns:['Plant','Month','Electricity (kWh)','Total energy (kWh)','Recorded production*','Record'],rows:data.monthly.map(r=>[r.plant,r.month,format(r.electricity),format(r.totalConsumption),format(r.production),r.available?'Saved':'Missing'])});
 let equipment=data.equipment;if(plan.rank && plan.metric!=='production')equipment=[...equipment].sort((a,b)=>(b[key]??-1)-(a[key]??-1)).slice(0,10);
 if(equipment.length)tables.push({title:plan.rank && plan.metric!=='production'?'Top 10 equipment-month values':'Equipment details (up to 100 records)',columns:['Plant','Month','Equipment','Electricity (kWh)','Total energy (kWh)','Production','Output basis','Electricity SEC','Total SEC'],rows:equipment.slice(0,100).map(r=>[r.plant,r.month,r.equipment,format(r.electricity),format(r.totalConsumption),format(r.production),r.outputBasis,format(r.electricSec),format(r.totalSec)])});
 return {answer:`${answer}\n\n${reasons.join('\n')}`,tables,sources:data.source};
}
module.exports={PLANTS,NAMES,planQuestion,monthsBetween,summarize,sec,loadData,loadSchedules,answerFromData};

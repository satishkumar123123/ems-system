const {PLANTS,planQuestion,monthsBetween}=require('./chatData');
const METRICS=['electricity','totalConsumption','production','sec'];
const MONTH=/^20\d{2}-(0[1-9]|1[0-2])$/;
function shift(month,delta){const [y,m]=month.split('-').map(Number);const date=new Date(Date.UTC(y,m-1+delta,1));return date.toISOString().slice(0,7);}
function words(message){const aliases={'जनवरी':'January','फरवरी':'February','मार्च':'March','अप्रैल':'April','मई':'May','जून':'June','जुलाई':'July','अगस्त':'August','सितंबर':'September','अक्टूबर':'October','नवंबर':'November','दिसंबर':'December','बिजली':'electricity','उत्पादन':'production','बैठक':'meeting','क्यों':'why','तुलना':'compare','वाइडर':'Wider'};let text=message;for(const [from,to]of Object.entries(aliases))text=text.replaceAll(from,to);return text;}
function contextFor(body){
 const c=body.context;
 if(!c || !Array.isArray(c.plants)||!c.plants.length||c.plants.some(p=>!Object.hasOwn(PLANTS,p))||!METRICS.includes(c.metric)||!MONTH.test(c.from||'')||!MONTH.test(c.to||''))return null;
 if(body.from!==c.from || (body.to||body.from)!==c.to || String(body.equipment||'').trim().toLowerCase()!==String(c.equipment||'').trim().toLowerCase())return null;
 if(body.plant!=='all' && (c.plants.length!==1||c.plants[0]!==body.plant))return null;
 return {plants:[...new Set(c.plants)].slice(0,6),from:c.from,to:c.to,metric:c.metric,equipment:String(c.equipment||'').slice(0,180),schedule:!!c.schedule,pendingComparison:!!c.pendingComparison,focusMonth:MONTH.test(c.focusMonth||'')?c.focusMonth:c.to};
}
function understand(body,now=new Date()){
 const previous=contextFor(body);const original=body.message;
 // Validate raw input before replacing known words.
 planQuestion(body);
 let message=words(original);
 const q=message.toLowerCase();const anchor=previous?.focusMonth||body.to||body.from;
 const fiscal=/\b(?:last|previous|pichhle|pichle)\s+(?:financial|fiscal)\s+year\b/i.test(message);
 if(fiscal){const start=(now.getUTCMonth()>=3?now.getUTCFullYear():now.getUTCFullYear()-1)-1;message=message.replace(/\b(?:last|previous|pichhle|pichle)\s+(?:financial|fiscal)\s+year\b/i,`FY ${start}-${String(start+1).slice(-2)}`);}
 const compare=previous?.pendingComparison || /\b(compare|comparison|versus|vs|difference|change|percent|percentage|badha|badhi|ghata|ghati|increase|decrease|jyada|kam)\b|%|कितना बढ़|कितना घट/i.test(message);
 const previousMonth=/\b(previous|last|pichhle|pichle)\s+(month|mahine|mahina)\b|पिछले महीने/i.test(message);
 const previousYear=/\b(previous|last|pichhle|pichle)\s+year\b/i.test(message)&&!fiscal;
 if(previousMonth)message=message.replace(/\b(previous|last|pichhle|pichle)\s+(month|mahine|mahina)\b|पिछले महीने/gi,shift(anchor,-1));
 if(previousYear)message=message.replace(/\b(previous|last|pichhle|pichle)\s+year\b/gi,shift(anchor,-12));
 const plan=planQuestion({...body,message});plan.question=original;plan.q=message.toLowerCase();
 const explicitMetric=/\b(electricity|electric|bijli|energy|total|consumption|production|output|utpadan|sec|specific|efficiency|enpi)\b/i.test(message);
 if(previous&&!explicitMetric){plan.metric=previous.metric;if(previous.schedule)plan.schedule=true;}
 const explicitPlants=Object.keys(PLANTS).some(p=>new RegExp(`\\b${p.replaceAll('-','[ -]?')}\\b`,'i').test(message))||/\b(all|abpl|pancho|paanch|sabhi)\b/i.test(message);
 if(previous&&!explicitPlants)plan.plants=previous.plants;
 plan.reason=/\b(why|kyu|kyun|reason|cause|wajah)\b/i.test(message);
 if(plan.reason && !explicitMetric && previous)plan.schedule=false;
 plan.focusMonth=plan.to;plan.comparison=null;plan.clarification='';plan.assumptions=[];
 if(previous&&!explicitMetric)plan.assumptions.push(`Previous metric retained: ${plan.metric}.`);
 const fy=/\bFY\s*20\d{2}[-/]\d{2}/i.test(message);
 if(compare && !plan.schedule && !plan.reason){
   if(fy && plan.months.length===24){plan.comparison={baselineFrom:plan.months[0],baselineTo:plan.months[11],currentFrom:plan.months[12],currentTo:plan.months[23]};}
   else if(plan.months.length>1){plan.comparison={baselineFrom:plan.from,baselineTo:plan.from,currentFrom:plan.to,currentTo:plan.to};if(plan.months.length>2)plan.assumptions.push('Change compares the first and last month; intermediate months remain in the monthly table.');}
   else if(previous && plan.to!==anchor){plan.comparison={baselineFrom:plan.to,baselineTo:plan.to,currentFrom:anchor,currentTo:anchor};plan.focusMonth=anchor;}
   else if(previousMonth||previousYear){plan.comparison={baselineFrom:plan.to,baselineTo:plan.to,currentFrom:anchor,currentTo:anchor};plan.focusMonth=anchor;}
   else if(!explicitPlants || plan.plants.length===1){plan.clarification='Kis month se comparison karna hai? Jaise: “May 2026 se compare karo” ya “previous month se kitna badha?”';}
   if(plan.comparison){plan.from=[plan.comparison.baselineFrom,plan.comparison.currentFrom].sort()[0];plan.to=[plan.comparison.baselineTo,plan.comparison.currentTo].sort().at(-1);plan.months=monthsBetween(plan.from,plan.to);}
 }
 if(fiscal)plan.assumptions.push(`Previous financial year resolved from today's date: ${plan.from} to ${plan.to}.`);
 return plan;
}
function validateModelPlan(value,base){
 if(!value||typeof value!=='object'||!Array.isArray(value.plants)||!value.plants.length||value.plants.length>6||value.plants.some(p=>!Object.hasOwn(PLANTS,p))||!METRICS.includes(value.metric)||!['monthly','schedule','reason'].includes(value.intent)||typeof value.equipment!=='string'||value.equipment.length>180||typeof value.clarification!=='string'||value.clarification.length>500)throw Error('Invalid AI query plan');
 const months=monthsBetween(value.from,value.to);
 if(!['none','periods'].includes(value.comparison))throw Error('Invalid comparison type');
 let comparison=null;
 if(value.comparison==='periods'){
  const baseline=monthsBetween(value.baselineFrom,value.baselineTo),current=monthsBetween(value.currentFrom,value.currentTo);
  if(baseline.length!==current.length)throw Error('Comparison periods must be equal in length');
  if([...baseline,...current].some(m=>!months.includes(m)))throw Error('Comparison is outside requested scope');
  comparison={baselineFrom:value.baselineFrom,baselineTo:value.baselineTo,currentFrom:value.currentFrom,currentTo:value.currentTo};
 }
 return {...base,plants:[...new Set(value.plants)],from:value.from,to:value.to,months,metric:value.metric,equipment:value.equipment,schedule:value.intent==='schedule',reason:value.intent==='reason',comparison,focusMonth:comparison?.currentTo||value.to,clarification:value.clarification,assumptions:[...base.assumptions,'Plant, period and equipment interpreted from your question; the scope is shown below.']};
}
module.exports={understand,validateModelPlan,contextFor,shift};

const test=require('node:test'),assert=require('node:assert/strict');
const {understand,validateModelPlan}=require('../services/chatUnderstanding');
const {comparePeriods,findEvidence,enrichAnswer}=require('../services/chatInsights');
const {loadData,planQuestion}=require('../services/chatData');
const {interpret}=require('../services/chatAi');
const context={plants:['wider'],from:'2026-06',to:'2026-06',metric:'electricity',equipment:'cgl',focusMonth:'2026-06',schedule:false};
const base={plant:'wider',from:'2026-06',to:'2026-06',equipment:'cgl',context};
test('follow-up retains equipment and metric and compares May baseline with June current',()=>{
 const plan=understand({...base,message:'May se kitna badha?'});
 assert.equal(plan.metric,'electricity');assert.equal(plan.equipment,'cgl');assert.deepEqual(plan.plants,['wider']);assert.deepEqual(plan.comparison,{baselineFrom:'2026-05',baselineTo:'2026-05',currentFrom:'2026-06',currentTo:'2026-06'});
 assert.equal(plan.focusMonth,'2026-06');assert.equal(plan.from,'2026-05');
});
test('previous month crosses calendar year and relative financial year is April-March',()=>{
 let p=understand({plant:'wider',from:'2026-01',to:'2026-01',message:'previous month se compare karo'});assert.equal(p.comparison.baselineFrom,'2025-12');assert.equal(p.comparison.currentTo,'2026-01');
 p=understand({plant:'wider',from:'2026-06',to:'2026-06',message:'pichhle financial year ka electricity'},new Date('2026-09-07'));assert.equal(p.from,'2025-04');assert.equal(p.to,'2026-03');
});
test('manual filter changes reset inherited metric; ambiguous comparison asks before reading DB',()=>{
 assert.equal(understand({...base,plant:'hsu',message:'summary',context:{...context,metric:'sec'}}).metric,'electricity');
 assert.ok(understand({...base,message:'Compare karo'}).clarification);
 const p=understand({...base,message:'May 2026',context:{...context,pendingComparison:true}});assert.equal(p.comparison.currentTo,'2026-06');
 assert.equal(understand({...base,message:'Iska reason kya hai?'}).reason,true);assert.equal(understand({...base,message:'Iska reason kya hai?'}).clarification,'');
});
test('Hindi month and metric names work in deterministic mode',()=>{
 const p=understand({plant:'all',from:'2026-04',to:'2026-04',message:'वाइडर जून 2026 बिजली'});assert.equal(p.from,'2026-06');assert.deepEqual(p.plants,['wider']);assert.equal(p.metric,'electricity');
});
const row=(month,value,production=10)=>({plant:'Wider',month,equipment:'CGL',electricity:value,totalConsumption:value*2,production,outputBasis:'kWh/MT',electricSec:value/production,totalSec:value*2/production});
function dataset(values){const equipment=values.map(([month,value,p])=>row(month,value,p));return {equipment,monthly:equipment.map(r=>({...r,available:true})),equipmentFilter:'cgl',source:[],missing:[]};}
test('delta and percentage are deterministic; zero and missing baselines remain unknown',()=>{
 const p=understand({...base,message:'May se kitna badha?'});let c=comparePeriods(p,dataset([['2026-05',100],['2026-06',125]]));assert.equal(c.calculations[0].delta,25);assert.equal(c.calculations[0].percent,25);
 c=comparePeriods(p,dataset([['2026-05',0],['2026-06',125]]));assert.equal(c.calculations[0].percent,null);assert.equal(c.calculations[0].delta,125);
 c=comparePeriods(p,dataset([['2026-06',125]]));assert.equal(c.calculations[0].delta,null);
});
test('SEC comparisons use ratio of sums, not an average of monthly SEC',()=>{
 const p={...understand({...base,message:'SEC'}),metric:'sec',comparison:{baselineFrom:'2026-03',baselineTo:'2026-04',currentFrom:'2026-05',currentTo:'2026-06'}};
 const d=dataset([['2026-03',100,10],['2026-04',300,30],['2026-05',200,10],['2026-06',200,30]]);
 const c=comparePeriods(p,d);assert.equal(c.calculations[0].baseline,20);assert.equal(c.calculations[0].current,20);
});
test('explicit equipment overrides old follow-up equipment',async()=>{
 const p=understand({...base,message:'Ab CRM electricity dikhao'});
 const model={find(){return {select(){return this;},lean:async()=>[{monthYear:'2026-06',rows:[{equipment:'CGL',electricity:100},{equipment:'CRM',electricity:200}]}]};}};
 const d=await loadData(p,{WiderData:model});assert.equal(d.equipmentFilter,'crm');assert.equal(d.equipment[0].electricity,200);
});
test('reason search scopes notes before limiting and never turns an observation into a confirmed cause',async()=>{
 const p=understand({...base,message:'Iska reason kya hai?'});
 const models={ScheduleItem:{find(query){assert.deepEqual(query.plant,{$in:['wider']});assert.equal(query.date.$gte,'2026-06-01');return {select(text){assert.ok(text.includes('-attachments'));return this;},sort(){return this;},limit(){return this;},lean:async()=>[{_id:'audit1',plant:'wider',date:'2026-06-15',equipment:'CGL',title:'Leak audit',status:'Completed',findings:'Air leak observed.'},{_id:'audit2',plant:'wider',equipment:'CRM',findings:'Different line.'}]};}}};
 const evidence=await findEvidence(p,models,'cgl');assert.equal(evidence.items.length,1);
 const result=enrichAnswer(p,null,{answer:'Data',tables:[],sources:[]},evidence);assert.match(result.answer,/not proof/);assert.equal(result.sources[0].id,'S1');assert.equal(result.sources[0].url,'/wider/schedule?record=audit1');
});
test('AI query output cannot choose arbitrary models, unsafe periods or invalid comparisons',()=>{
 const p=understand({...base,message:'summary'});const good={plants:['wider'],from:'2026-05',to:'2026-06',metric:'electricity',intent:'monthly',equipment:'CGL',clarification:'',comparison:'periods',baselineFrom:'2026-05',baselineTo:'2026-05',currentFrom:'2026-06',currentTo:'2026-06'};
 assert.equal(validateModelPlan(good,p).months.length,2);
 for(const change of [{plants:['users']},{from:{$gt:''}},{currentTo:'2026-08'},{baselineFrom:'2026-04'}])assert.throws(()=>validateModelPlan({...good,...change},p));
});
test('optional AI interpreter uses strict schema without receiving any records or API secret in body',async()=>{
 const answer=await interpret('May se kitna badha?',understand({...base,message:'summary'}),context,{env:{OPENAI_API_KEY:'test-secret',OPENAI_MODEL:'test-model'},fetchImpl:async(url,options)=>{const b=JSON.parse(options.body);assert.equal(b.text.format.strict,true);assert.equal(b.store,false);assert.ok(!options.body.includes('test-secret'));return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'{"metric":"electricity"}'}]}]})};}});assert.equal(answer.metric,'electricity');
});

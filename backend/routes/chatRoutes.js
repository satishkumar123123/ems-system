const express=require('express');
const mongoose=require('mongoose');
const {loadData,loadSchedules,answerFromData}=require('../services/chatData');
const {understand,validateModelPlan,contextFor}=require('../services/chatUnderstanding');
const {findEvidence,enrichAnswer}=require('../services/chatInsights');
const {configured,explain,interpret}=require('../services/chatAi');
const router=express.Router();
let windowStart=Date.now(),requests=0,active=0;
const scopeOf=(plan,data)=>({plants:plan.plants,from:plan.from,to:plan.to,equipment:data?.equipmentFilter||plan.equipment||'',schedule:plan.schedule,metric:plan.metric,focusMonth:plan.focusMonth,comparison:plan.comparison,pendingComparison:!!plan.clarification});
router.get('/status',(req,res)=>res.json({version:2,aiConfigured:configured(),mode:configured()?'ai':'data',capabilities:['follow-ups','period-comparison','source-citations','related-notes'],message:configured()?'AI answers with saved plant records':'Saved-data mode. Full conversational AI is not connected yet.'}));
router.post('/',async(req,res)=>{
 let entered=false;
 try{
  let plan=understand(req.body);
  if(req.body.history!=null && (!Array.isArray(req.body.history) || req.body.history.length>12))return res.status(400).json({error:'Invalid conversation history.'});
  if(Date.now()-windowStart>60000){windowStart=Date.now();requests=0;}
  if(requests>=30 || active>=3){res.set('Retry-After','30');return res.status(429).json({error:'Chat is busy. Please retry in 30 seconds.'});}
  requests++;active++;entered=true;
  let aiReady=configured(),planningNotice='';
  if(aiReady){try{const interpretation=await interpret(plan.question,plan,contextFor(req.body));if(interpretation)plan=validateModelPlan(interpretation,plan);}catch{aiReady=false;planningNotice='AI interpretation unavailable; the shown scope uses saved-data question rules.';}}
  if(plan.clarification)return res.json({answer:plan.clarification,clarification:true,mode:'data',notice:planningNotice,tables:[],sources:[],scope:scopeOf(plan),assumptions:plan.assumptions});
  const schedules=plan.schedule?await loadSchedules(plan,mongoose.models):null;
  const data=plan.schedule?null:await loadData(plan,mongoose.models);
  if(data?.equipmentFilter && !data.equipment.length)return res.json({answer:`“${data.equipmentFilter}” ka matching equipment selected records mein nahi mila. Equipment ka exact naam ya plant/month check karein.`,clarification:true,mode:'data',tables:[],sources:data.source,scope:scopeOf(plan,data),notice:'No equipment values were assumed.'});
  let evidence=null;let evidenceError=false;
  if(plan.reason && data){try{evidence=await findEvidence(plan,mongoose.models,data.equipmentFilter);}catch{evidenceError=true;}}
  const result=enrichAnswer(plan,data,answerFromData(plan,data,schedules),evidence);
  if(evidenceError)result.answer+='\nRelated audit/meeting notes could not be loaded; no cause has been established. Please retry.';
  let mode='data';let notice=planningNotice || (configured()?'':'Saved-data mode: full conversational AI is not connected.');
  if(aiReady){
   try{const answer=await explain({plan,data,schedules,result,history:req.body.history||[]});if(answer){
      const cited=[...answer.matchAll(/\[(S\d+)\]/g)].map(m=>m[1]);
      if(cited.some(id=>!result.sources.some(s=>s.id===id))||(result.sources.length&&!cited.length))throw Error('Unsupported citations');
      result.answer=answer;mode='ai';
    }else notice='Showing exact saved-data results. Narrow the filters for a shorter AI explanation.';}
   catch {notice='AI explanation is temporarily unavailable. Showing saved-data results instead.';}
  }
  res.set('Cache-Control','no-store');
  res.json({...result,mode,notice,scope:scopeOf(plan,data),generatedAt:new Date().toISOString()});
 }catch(error){res.status(error.status||503).json({error:error.status?error.message:'Plant records could not be loaded. Please retry.'});}
 finally{if(entered)active--;}
});
module.exports=router;

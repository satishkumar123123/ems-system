const express=require('express');
const mongoose=require('mongoose');
const {planQuestion,loadData,loadSchedules,answerFromData}=require('../services/chatData');
const {configured,explain}=require('../services/chatAi');
const router=express.Router();
let windowStart=Date.now(),requests=0,active=0;
router.get('/status',(req,res)=>res.json({aiConfigured:configured(),mode:configured()?'ai':'data',message:configured()?'AI answers with saved plant records':'Saved-data mode. Full conversational AI is not connected yet.'}));
router.post('/',async(req,res)=>{
 let entered=false;
 try{
  const plan=planQuestion(req.body);
  if(req.body.history!=null && (!Array.isArray(req.body.history) || req.body.history.length>12))return res.status(400).json({error:'Invalid conversation history.'});
  if(Date.now()-windowStart>60000){windowStart=Date.now();requests=0;}
  if(requests>=30 || active>=3){res.set('Retry-After','30');return res.status(429).json({error:'Chat is busy. Please retry in 30 seconds.'});}
  requests++;active++;entered=true;
  const schedules=plan.schedule?await loadSchedules(plan,mongoose.models):null;
  const data=plan.schedule?null:await loadData(plan,mongoose.models);
  const result=answerFromData(plan,data,schedules);
  let mode='data';let notice=configured()?'':'Saved-data mode: full conversational AI is not connected.';
  if(configured()){
   try{const answer=await explain({plan,data,schedules,result,history:req.body.history||[]});if(answer){result.answer=answer;mode='ai';}else notice='This result is too large for AI explanation. Showing calculated saved-data results; narrow the filters for an AI answer.';}
   catch {notice='AI explanation is temporarily unavailable. Showing saved-data results instead.';}
  }
  res.set('Cache-Control','no-store');
  res.json({...result,mode,notice,scope:{plants:plan.plants,from:plan.from,to:plan.to,equipment:data?.equipmentFilter||'',schedule:plan.schedule},generatedAt:new Date().toISOString()});
 }catch(error){res.status(error.status||503).json({error:error.status?error.message:'Plant records could not be loaded. Please retry.'});}
 finally{if(entered)active--;}
});
module.exports=router;

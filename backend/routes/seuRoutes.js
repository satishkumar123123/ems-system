const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const schema = new mongoose.Schema({year:Number,id:String,plant:String,unit:String,direction:String,baseline:Number,target:Number,tolerance:Number,values:[Number],remark:String,revision:Number},{timestamps:true});
schema.index({year:1,id:1},{unique:true});
const Record = mongoose.models.SeuRecord || mongoose.model('SeuRecord',schema);
const validYear = y => Number.isInteger(y) && y>=2025 && y<=2100;
router.get('/:year',async(req,res)=>{const year=Number(req.params.year);if(!validYear(year))return res.status(400).json({error:'Invalid financial year'});try{res.json({records:await Record.find({year}).lean()});}catch(e){res.status(503).json({error:'SEU records could not be loaded. Retry before editing.'});}});
router.put('/:year/:id',async(req,res)=>{
 const year=Number(req.params.year),id=req.params.id,b=req.body;
 const number=n=>n===null||(typeof n==='number'&&Number.isFinite(n)&&n>=0);
 const plantById=['abpl','wider','hsu','narrow-flat','narrow-tube','utility','wider','wider','wider','wider','utility','utility','utility','utility','utility','narrow-flat','narrow-flat','narrow-flat','narrow-flat','hsu','hsu','hsu','hsu','hsu','narrow-tube','narrow-tube','narrow-tube','narrow-tube','narrow-tube','narrow-tube','narrow-tube','utility'];
 if(!validYear(year)||!/^([1-9]|[12][0-9]|3[012])$/.test(id)||(id==='32'&&year!==2025)||!b||!['higher','lower'].includes(b.direction)||typeof b.unit!=='string'||b.unit.length>40||![b.baseline,b.target,b.tolerance].every(number)||!Array.isArray(b.values)||b.values.length!==12||!b.values.every(number)||typeof b.remark!=='string'||b.remark.length>3000||!Number.isInteger(b.revision)||b.revision<0)return res.status(400).json({error:'Check values, units and remarks. Use nonnegative numbers or blank values.'});
 const fields={year,id,plant:plantById[Number(id)-1],unit:b.unit.trim(),direction:b.direction,baseline:b.baseline,target:b.target,tolerance:b.tolerance,values:b.values,remark:b.remark.trim(),revision:b.revision+1};
 try{let record;if(b.revision===0)record=await Record.create(fields);else record=await Record.findOneAndUpdate({year,id,revision:b.revision},{$set:fields},{new:true,runValidators:true});if(!record)return res.status(409).json({error:'This record changed. Reload the page before editing.'});res.json({record});}catch(e){res.status(e.code===11000?409:503).json({error:e.code===11000?'This record changed. Reload before editing.':'Save failed. Your edits have not been saved.'});}
});
module.exports=router;

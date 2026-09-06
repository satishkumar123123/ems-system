const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const helper = require('../utils/schedule');
const base = (kind = 'action') => ({ id: randomUUID(), kind, title: 'Reduce air leaks', owner: 'Unit manager', date: '2026-10-12', status: helper.STATUSES[kind][0], correctiveAction: 'Repair and measure losses', updatedBy: 'Reviewer', target: '100', actual: '120', attachments: [] });
test('validates dates, categories, numbers and verification transitions', () => {
  for (const changes of [{date:'2026-02-30'}, {kind:'unknown'}, {target:'NaN'}, {status:'Verified'}]) assert.throws(() => helper.normalize({...base(),...changes}));
  assert.throws(() => helper.normalize({...base('objective'),target:''}), /Target is required/);
  assert.equal(helper.normalize({...base(),status:'Verified'}, {...base(),status:'Completed'}).status,'Verified');
});
test('evidence is bounded, retained on edit, and excluded from public response', () => {
  const file={id:randomUUID(),name:'proof.txt',mime:'text/plain',data:Buffer.from('result').toString('base64')};
  const record=helper.normalize({...base(),attachments:[file]});
  assert.equal(helper.publicItem(record).attachments[0].data,undefined);
  assert.equal(helper.normalize({...base(),attachments:[{id:file.id}]},record).attachments[0].data,file.data);
  assert.throws(()=>helper.normalize({...base(),attachments:[{...file,mime:'text/html'}]}));
  assert.throws(()=>helper.normalize({...base(),attachments:[file,file]}));
  assert.throws(()=>helper.normalize({...base(),attachments:[{...file,data:Buffer.alloc(1048577).toString('base64')}]}));
});
function harness() {
  const records = [], routes = {}, params = {};
  const matches=(record,filter)=>Object.entries(filter).every(([key,value])=>record[key]===value);
  const query=value=>({select(){return this;},sort(){return this;},async lean(){return structuredClone(value);}});
  const model={ find:filter=>query(records.filter(r=>matches(r,filter))),findOne:filter=>query(records.find(r=>matches(r,filter))),findById:id=>query(records.find(r=>r._id===id)),
    async create(data){records.push(structuredClone(data));return {toObject:()=>structuredClone(data)};},
    findOneAndUpdate(filter,update){const row=records.find(r=>matches(r,filter));if(row){Object.assign(row,update.$set);row.revision++;row.history.push(update.$push.history);}return query(row);}};
  class Schema {index(){}}
  const router={param:(key,fn)=>params[key]=fn};for(const method of ['get','post','patch'])router[method]=(path,fn)=>routes[method+' '+path]=fn;
  const context=vm.createContext({module:{exports:{}},Buffer,require:name=>name==='express'?{Router:()=>router}:name==='mongoose'?{Schema,models:{ScheduleItem:model}}:helper});
  new vm.Script(fs.readFileSync(require.resolve('../routes/scheduleRoutes'),'utf8')).runInContext(context);
  async function call(method,plant,body={},id='',fileId=''){
    const res={code:200,status(code){this.code=code;return this;},json(data){this.body=structuredClone(data);return this;},set(){return this;},send(data){this.body=data;}};
    let allowed=false;params.plant({},res,()=>allowed=true,plant);if(!allowed)return res;
    if(id){allowed=false;params.id({},res,()=>allowed=true,id);if(!allowed)return res;}
    const route=method==='get'?(fileId?'/:plant/items/:id/files/:fileId':'/:plant'):method==='post'?'/:plant/items':'/:plant/items/:id';
    await routes[method+' '+route]({params:{plant,id,fileId},body},res);return res;
  }
  return {call,records};
}
test('plant isolation, idempotent create, revision conflicts and meeting review history',async()=>{
  const {call,records}=harness();const meeting=base('meeting'),action=base();
  assert.equal((await call('post','wider',meeting)).code,201);
  assert.equal((await call('post','wider',action)).code,201);
  assert.equal((await call('post','wider',action)).code,200);assert.equal(records.length,2);
  assert.equal((await call('get','utility')).body.items.length,0);
  assert.equal((await call('get','solar')).code,404);
  assert.equal((await call('patch','utility',{...action,revision:0},action.id)).code,404);
  assert.equal((await call('patch','wider',{...action,revision:1},action.id)).code,409);
  assert.equal((await call('patch','wider',{...action,revision:0,status:'Completed'},action.id)).code,200);
  assert.equal((await call('patch','wider',{...action,revision:1,status:'Verified'},action.id)).code,400);
  const foreign=base('meeting');await call('post','utility',foreign);
  assert.equal((await call('patch','wider',{...action,revision:1,status:'Verified',reviewMeetingId:foreign.id,updateNote:'Measured improvement'},action.id)).code,400);
  assert.equal((await call('patch','wider',{...action,revision:1,status:'Verified',reviewMeetingId:meeting.id},action.id)).code,400);
  const result=await call('patch','wider',{...action,revision:1,status:'Verified',reviewMeetingId:meeting.id,updateNote:'Measured improvement'},action.id);
  assert.equal(result.code,200);assert.equal(result.body.item.revision,2);assert.equal(result.body.item.history.length,3);
  assert.equal(result.body.item.history[2].meetingId,meeting.id);assert.equal(result.body.item.history[2].note,'Measured improvement');
  assert.equal((await call('post','wider',{...base(),sourceId:foreign.id})).code,400);
});
test('evidence download is scoped to its plant',async()=>{
 const {call}=harness(),record=base();record.attachments=[{id:randomUUID(),name:'proof.txt',mime:'text/plain',data:Buffer.from('result').toString('base64')}];
 const saved=await call('post','wider',record);assert.equal(saved.body.item.attachments[0].data,undefined);
 assert.equal((await call('get','utility',{},record.id,record.attachments[0].id)).code,404);
 assert.equal((await call('get','wider',{},record.id,record.attachments[0].id)).body.toString(),'result');
});

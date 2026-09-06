import test from 'node:test';
import assert from 'node:assert/strict';
import { equipmentSec, summarizeSec } from '../src/utils/sec.js';
import { scheduleSummary } from '../src/utils/scheduleSummary.js';
import { meetingReportData, createMeetingReport } from '../src/utils/meetingReport.js';
const row={equipment:'Mill',enpiUnit:'KwH/MT',electricity:1000,totalConsumption:1500,production:10};
test('SEC uses ratio of totals, includes idle energy and excludes non-tonne output',()=>{
 assert.equal(equipmentSec(row).totalSec,150);
 const sum=summarizeSec([row,{...row,electricity:200,totalConsumption:300,production:0},{...row,enpiUnit:'CFM/KWH',production:99999}]);
 assert.equal(sum.electricSec,120);assert.equal(sum.totalSec,180);assert.equal(sum.excluded,1);
 assert.equal(summarizeSec([row,{...row,production:20,electricity:1000}]).electricSec,2000/30);
});
test('SEC rejects missing, invalid and zero output without Infinity or false zero',()=>{
 for(const production of [0,'',null,-2,'x'])assert.equal(equipmentSec({...row,production}).electricSec,null);
 assert.equal(equipmentSec({...row,electricity:'1,000'}).electricSec,100);
 assert.equal(equipmentSec({...row,enpiUnit:'kWh/day'}).electricSec,null);
 assert.equal(summarizeSec([row,{...row,production:null}]).totalSec,null);
 assert.equal(equipmentSec({...row,electricity:0}).electricSec,0);
});
const meeting={_id:'meeting-1',plant:'wider',kind:'meeting',title:'Monthly review',date:'2026-09-10',owner:'Satish',status:'Completed',decisions:'Repair leaks and measure the result.',history:[]};
const action={_id:'action-1',plant:'wider',kind:'action',title:'Compressor leak',owner:'Maintenance',date:'2026-09-11',status:'Completed',sourceId:'audit-1',correctiveAction:'Repair seals.',history:[{meetingId:meeting._id,by:'Satish',note:'Improvement confirmed',status:'In Progress',at:'2026-09-10T10:00:00Z'}]};
test('overview counts overdue, awaiting verification and upcoming dates',()=>{
 const summary=scheduleSummary([meeting,action,{...meeting,_id:'next',status:'Planned',date:'2026-10-01'},{...action,_id:'late',status:'Pending',date:'2026-09-01'}],'2026-09-12');
 assert.equal(summary.pending,2);assert.equal(summary.overdue,1);assert.equal(summary.upcoming.length,1);
});
test('meeting report preserves review-time status and excludes other plants',()=>{
 const data=meetingReportData(meeting,[action,{...action,plant:'utility',_id:'foreign'},{_id:'audit-1',plant:'wider',kind:'audit',findings:'Leak detected'}],'wider');
 assert.equal(data.reviews.length,1);assert.equal(data.reviews[0].review.status,'In Progress');assert.equal(data.pending.length,1);assert.equal(data.sources.length,1);
 assert.throws(()=>meetingReportData(meeting,[],'utility'));
});
test('long meeting reports paginate without dropping final content',()=>{
 const doc=createMeetingReport({...meeting,description:'Long meeting discussion. '.repeat(180),decisions:'FINAL DECISION RECORDED'},[action],'wider','Wider');
 assert.ok(doc.getNumberOfPages()>1);
 const text=doc.output();assert.ok(text.startsWith('%PDF-'));assert.ok(doc.getNumberOfPages()<15);
});

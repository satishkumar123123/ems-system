import { jsPDF } from 'jspdf';

export function meetingReportData(meeting, items, plant) {
  if (meeting.kind !== 'meeting' || meeting.plant !== plant) throw new Error('Choose a meeting from this plant.');
  const local = items.filter(i => i.plant === plant);
  const actions = local.filter(i => i.kind === 'action');
  const reviews = actions.flatMap(action => (action.history || []).filter(h => h.meetingId === meeting._id).map(review => ({ action, review })));
  const relevant = actions.filter(a => a.sourceId === meeting._id || reviews.some(r => r.action._id === a._id));
  const sources = local.filter(i => relevant.some(a => a.sourceId === i._id) && i.kind !== 'meeting');
  return { reviews, relevant, sources, pending: actions.filter(a => a.status !== 'Verified') };
}
export function createMeetingReport(meeting, items, plant, plantName, { generatedAt = new Date(), canvasFactory = () => document.createElement('canvas') } = {}) {
  const data = meetingReportData(meeting, items, plant);
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ title: `${plantName} - ${meeting.title}`, subject: 'EMS Management Review Meeting', author: 'EMS' });
  let y = 43;
  const ink = [31, 48, 73], accent = [31, 117, 140];
  function header() { doc.setFillColor(22,39,69); doc.rect(0,0,210,32,'F');doc.setFillColor(28,159,161);doc.rect(0,32,210,2,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text('MANAGEMENT REVIEW',16,15);doc.setFontSize(10);doc.text(`${plantName.toUpperCase()}  |  EMS MEETING REPORT`,16,24); }
  function room(height) { if(y + height > 278) { doc.addPage();header();y=43; } }
  const clean = text => String(text ?? '').replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/\u2022/g,'-');
  function paragraph(value, size=10, bold=false, color=ink) {
    const text=clean(value || 'Not recorded'); doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);
    if (/[^\x09\x0a\x0d\x20-\xff]/.test(text)) {
      // Browser text shaping preserves Hindi and other scripts in saved notes.
      const canvas=canvasFactory(), ctx=canvas.getContext('2d'); if(!ctx)throw new Error('PDF text rendering is unavailable. Please retry in your browser.');
      const scale=3, width=178*96/25.4;canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(size*1.9*scale);ctx.font=`${bold?'bold ':''}${size*96/72*scale}px sans-serif`;
      let line='';const lines=[];
      for(const part of text.split(/(\s+)/)){ if(part.includes('\n')){if(line)lines.push(line);line='';continue;} for(const char of part){if(ctx.measureText(line+char).width>canvas.width-4){lines.push(line);line='';}line+=char;} }if(line)lines.push(line);
      for(const line of lines){room(7);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=`rgb(${color.join(',')})`;ctx.textBaseline='top';ctx.fillText(line,0,2);doc.addImage(canvas.toDataURL('image/png'),'PNG',16,y-3.7,178,canvas.height/scale*25.4/96);y+=size*.55+1;}
    } else {
      const lines=doc.splitTextToSize(text,178);
      for(const line of lines){room(7);doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);doc.text(line,16,y);y+=size*.48+1;}
    }
    y+=3;
  }
  function section(title, color=accent) {room(23);doc.setFillColor(...color);doc.roundedRect(16,y-3,178,10,2,2,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(title,20,y+3.5);y+=16;}
  function field(label,value){if(value){room(18);paragraph(label,9,true,accent);paragraph(value);}}
  function action(record) {room(25);paragraph(record.title,11,true);paragraph(`Owner: ${record.owner}  |  Due: ${record.date}  |  Current status: ${record.status}`,9);field('Corrective action',record.correctiveAction);field('Details / deficiency',record.description);}
  header();paragraph(meeting.title,16,true);paragraph(`Meeting date: ${meeting.date}   |   Status: ${meeting.status}`,10);paragraph(`Generated: ${generatedAt.toISOString().replace('T',' ').slice(0,19)} UTC`,8,false,[90,105,125]);
  section('01  Meeting details');field('Responsible person',meeting.owner);field('Equipment / department',meeting.equipment);field('Attendees',meeting.attendees);field('Agenda / discussion',meeting.description);field('Decisions',meeting.decisions);field('Next meeting date',meeting.nextDate);
  section('02  Findings and linked improvement actions',[111,71,151]);
  if(!data.relevant.length)paragraph('No improvement actions linked to or reviewed in this meeting.');
  for(const source of data.sources){paragraph(source.title,11,true);field('Audit findings',source.findings);field('Details',source.description);}
  for(const record of data.relevant)action(record);
  section('03  Outcomes recorded in this meeting',[18,119,99]);
  if(!data.reviews.length)paragraph('No action reviews have been recorded in this meeting.');
  for(const {action:record,review} of data.reviews){paragraph(record.title,11,true);paragraph(`Status at review: ${review.status}  |  Reviewer: ${review.by}`,9);field('Review outcome',review.note);field('Recorded at',review.at ? new Date(review.at).toISOString() : '');}
  section('04  Current outstanding actions in this unit',[167,96,38]);paragraph('Snapshot at report generation, across all meetings. Completed actions remain here until verified.',9);
  if(!data.pending.length)paragraph('No outstanding improvement actions.');for(const record of data.pending)action(record);
  section('05  Evidence and meeting history');const evidence=[meeting,...data.relevant,...data.sources].flatMap(i=>(i.attachments||[]).map(f=>`${i.title}: ${f.name}`));
  paragraph(evidence.length?evidence.join('\n'):'No evidence attached.');if(evidence.length)paragraph('Evidence files can be downloaded separately from the unit Schedule page.',9);
  for(const h of meeting.history||[]){paragraph(`${h.by}  |  ${h.status}  |  ${h.at ? new Date(h.at).toISOString() : ''}`,9,true);paragraph(h.note||'Record saved.');}
  const count=doc.getNumberOfPages();for(let page=1;page<=count;page++){doc.setPage(page);doc.setDrawColor(209,218,231);doc.line(16,284,194,284);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(95,111,130);doc.text('EMS | Unit review and improvement tracking',16,290);doc.text(`${page} / ${count}`,194,290,{align:'right'});}
  return doc;
}
export function downloadMeetingReport(meeting, items, plant, plantName) {
  const doc=createMeetingReport(meeting,items,plant,plantName);
  doc.save(`EMS-${plant}-meeting-${meeting.date}-${meeting._id.slice(0,8)}.pdf`);
}

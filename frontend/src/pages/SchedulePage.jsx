import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import '../styles/schedule.css';

const plants = { wider: 'Wider', utility: 'Utility', hsu: 'HSU', 'narrow-flat': 'Narrow Flat', 'narrow-tube': 'Narrow Tube' };
const categories = { objective: 'Objectives & Targets', audit: 'Internal Audits', meeting: 'Management Reviews', action: 'Improvement Actions' };
const statuses = { objective: ['Pending', 'In Progress', 'Completed'], audit: ['Planned', 'In Progress', 'Completed'], meeting: ['Planned', 'Completed'], action: ['Pending', 'In Progress', 'Completed', 'Verified'] };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const open = item => !['Completed', 'Verified'].includes(item.status);
const met = item => item.actual !== '' && item.target !== '' && (item.direction === 'higher' ? Number(item.actual) >= Number(item.target) : Number(item.actual) <= Number(item.target));
async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/schedule/${path}`, { ...options, cache: 'no-store', headers: { 'Content-Type': 'application/json' }, signal: options.signal || AbortSignal.timeout(65000) });
  const data = await response.json().catch(() => ({ error: 'The service did not return data. Please retry.' }));
  if (!response.ok || data.error) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}
export default function SchedulePage() {
  const { plant } = useParams();
  return plants[plant] ? <PlantSchedule key={plant} plant={plant} /> : <div className="schedule"><Link to="/">Unknown plant — return to dashboard</Link></div>;
}
function PlantSchedule({ plant }) {
  const [reportBusy, setReportBusy] = useState(false), [reportError, setReportError] = useState('');
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]), [tab, setTab] = useState('objective'), [loading, setLoading] = useState(true), [error, setError] = useState(''), [refresh, setRefresh] = useState(0);
  const [draft, setDraft] = useState(null), [selected, setSelected] = useState(searchParams.get('record') || ''), [saving, setSaving] = useState(false), [formError, setFormError] = useState(''), [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 65000);
    setLoading(true); setError('');
    request(plant, { signal: controller.signal }).then(data => { if (active) setItems(data.items); }).catch(e => { if (active) setError(e.name === 'AbortError' ? 'Loading timed out. Please retry.' : e.message); }).finally(() => { clearTimeout(timer); if (active) setLoading(false); });
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [plant, refresh]);
  const edit = (kind = tab, item, extras = {}) => {
    setFormError('');
    setDraft({ id: crypto.randomUUID(), kind, title: '', owner: '', date: today(), status: statuses[kind][0], description: '', equipment: '', baseline: '', target: '', actual: '', unit: '', direction: 'lower', findings: '', attendees: '', decisions: '', nextDate: '', correctiveAction: '', sourceId: '', attachments: [], ...item, updatedBy: '', updateNote: '', reviewMeetingId: '', ...extras });
  };
  const change = (name, value) => setDraft(d => ({ ...d, [name]: value }));
  const save = async event => {
    event.preventDefault(); setSaving(true); setFormError('');
    try {
      const result = await request(`${plant}/items${draft._id ? `/${draft._id}` : ''}`, { method: draft._id ? 'PATCH' : 'POST', body: JSON.stringify(draft) });
      setItems(old => [...old.filter(i => i._id !== result.item._id), result.item]);
      setDraft(null); setNotice('Saved successfully.');
    } catch (e) { setFormError(e.name === 'TimeoutError' ? 'Saving timed out. Retry to confirm the saved record.' : e.message); }
    finally { setSaving(false); }
  };
  const attach = async event => {
    const files = [...event.target.files]; event.target.value = '';
    if (files.length + draft.attachments.length > 3 || files.some(f => f.size > 1048576 || !f.size)) { setFormError('Attach up to 3 files, between 1 byte and 1 MB each.'); return; }
    setSaving(true);
    try {
      const additions = await Promise.all(files.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onerror = () => reject(new Error('Could not read the attachment.'));
        reader.onload = () => resolve({ id: crypto.randomUUID(), name: file.name, mime: file.type || (file.name.endsWith('.txt') ? 'text/plain' : ''), data: reader.result.split(',')[1], size: file.size }); reader.readAsDataURL(file);
      })));
      setDraft(d => ({ ...d, attachments: [...d.attachments, ...additions] })); setFormError('');
    } catch (e) { setFormError(e.message); } finally { setSaving(false); }
  };
  const report = async () => {
    setReportBusy(true); setReportError('');
    try {
      const fresh = await request(plant);
      const meeting = fresh.items.find(i => i._id === selected);
      if (!meeting) throw new Error('Meeting no longer exists. Refresh the schedule.');
      const { downloadMeetingReport } = await import('../utils/meetingReport');
      downloadMeetingReport(meeting, fresh.items, plant, plants[plant]);
      setItems(fresh.items);
    } catch (error) { setReportError(error.message); }
    finally { setReportBusy(false); }
  };
  const detail = items.find(i => i._id === selected);
  const pending = items.filter(i => i.kind === 'action' && i.status !== 'Verified');
  const upcoming = items.flatMap(i => ['audit', 'meeting'].includes(i.kind) ? [...(open(i) && i.date >= today() ? [{ ...i, displayDate: i.date }] : []), ...(i.kind === 'meeting' && i.nextDate >= today() ? [{ ...i, displayDate: i.nextDate, title: `Follow-up: ${i.title}` }] : [])] : []).sort((a, b) => a.displayDate.localeCompare(b.displayDate));
  const field = (name, label, type = 'text', required = false) => <label key={name}>{label}{type === 'textarea' ? <textarea value={draft[name]} onChange={e => change(name, e.target.value)} required={required} maxLength={name === 'updateNote' ? 2000 : 4000} /> : <input type={type} step={type === 'number' ? 'any' : undefined} value={draft[name]} onChange={e => change(name, e.target.value)} required={required} maxLength={name === 'title' ? 180 : name === 'owner' || name === 'updatedBy' ? 120 : undefined} />}</label>;
  return <main className="schedule">
    <header className="sch-hero"><div><Link to={`/${plant}`}>← Back to {plants[plant]}</Link><p className="sch-eyebrow">PLAN · ACT · REVIEW · IMPROVE</p><h1>{plants[plant]} Schedule</h1><p>Objectives, audits and meeting follow-ups for your unit.</p></div><button onClick={() => edit()} disabled={loading || !!error}>＋ Add {tab === 'objective' ? 'objective' : tab}</button></header>
    {notice && <p role="status" className="sch-success">{notice}</p>}
    {error && <p role="alert" className="sch-error">{error} <button onClick={() => setRefresh(n => n + 1)}>Retry</button></p>}
    <section className="sch-stats">{[['Upcoming dates', upcoming.length], ['Open actions', pending.length], ['Overdue', items.filter(i => open(i) && i.date < today()).length], ['Targets achieved', items.filter(i => i.kind === 'objective' && met(i)).length]].map(([label, value], index) => <div className={`sch-stat tone-${index}`} key={label}><span>{label}</span><strong>{loading || error ? '—' : value}</strong></div>)}</section>
    <nav className="sch-tabs" aria-label="Schedule categories">{Object.entries(categories).map(([kind, label], index) => <button key={kind} className={`tone-${index} ${tab === kind ? 'active' : ''}`} aria-pressed={tab === kind} onClick={() => setTab(kind)}>{label}<b>{items.filter(i => i.kind === kind).length}</b></button>)}</nav>
    <div className="sch-workspace"><section><div className="sch-section-title"><h2>{categories[tab]}</h2><button onClick={() => setRefresh(n => n + 1)} disabled={loading}>↻ Refresh</button></div>
      {loading ? <p role="status">Loading schedule…</p> : !error && <div className="sch-cards">{items.filter(i => i.kind === tab).sort((a,b) => a.date.localeCompare(b.date)).map(item => <button className={`sch-record ${item.kind}`} key={item._id} onClick={() => setSelected(item._id)}><div className="sch-row"><span className={`sch-badge ${item.status.replaceAll(' ', '-')}`}>{item.status}</span>{open(item) && item.date < today() && <span className="sch-overdue">Overdue</span>}</div><h3>{item.title}</h3><p>{item.equipment || categories[item.kind]}</p><div className="sch-row"><span>{item.owner}</span><time>{item.date}</time></div>{item.kind === 'objective' && <div className="sch-target">Current: {item.actual || '—'} / Target: {item.target} {item.unit}<span>{met(item) ? ' ✓ Target achieved' : ` · ${item.direction === 'higher' ? 'Increase' : 'Reduce'} to target`}</span></div>}</button>)}{!items.some(i => i.kind === tab) && <div className="sch-empty"><h3>No {categories[tab].toLowerCase()} yet</h3><p>Add your first record to start tracking this plant.</p><button onClick={() => edit()}>＋ Add record</button></div>}</div>}
    </section><aside><h2>Upcoming dates</h2>{upcoming.slice(0, 8).map((item, index) => <button className="sch-upcoming" key={`${item._id}-${index}`} onClick={() => setSelected(item._id)}><time>{item.displayDate}</time><strong>{item.title}</strong><span>{item.owner}</span></button>)}{!upcoming.length && <p>No upcoming dates scheduled.</p>}<div className="sch-tip">Complete an improvement action, then verify its result during a review meeting. Every review stays in its history.</div></aside></div>
    {detail && !draft && <div className="sch-overlay"><section className="sch-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title"><div className="sch-section-title"><h2 id="detail-title">{detail.title}</h2><button onClick={() => setSelected('')} aria-label="Close details">✕</button></div><p><span className="sch-badge">{detail.status}</span> · {detail.owner} · {detail.date}</p>
      <dl className="sch-details">{[['equipment','Equipment / department'],['description','Details'],['baseline','Baseline'],['target','Target'],['actual','Current value'],['unit','Unit'],['findings','Audit findings'],['attendees','Attendees'],['decisions','Decisions'],['nextDate','Next meeting'],['correctiveAction','Corrective action']].filter(([key]) => detail[key] !== '' && detail[key] != null).map(([key,label]) => <div key={key}><dt>{label}</dt><dd>{detail[key]}</dd></div>)}</dl>
      {detail.sourceId && <p>Linked to: {items.find(i => i._id === detail.sourceId)?.title || 'Previous record'}</p>}
      {reportError && <p role="alert" className="sch-error">{reportError}</p>}
      <div className="sch-actions">{detail.kind === 'meeting' && <button disabled={reportBusy} onClick={report}>{reportBusy ? 'Preparing PDF…' : 'Download meeting PDF'}</button>}<button onClick={() => edit(detail.kind, detail)}>Edit / update</button>{detail.kind !== 'action' && <button onClick={() => edit('action', null, { sourceId: detail._id, equipment: detail.equipment })}>＋ Improvement action</button>}{detail.kind === 'meeting' && detail.nextDate && <button onClick={() => edit('meeting', null, { date: detail.nextDate, title: `Follow-up: ${detail.title}`.slice(0,180), attendees: detail.attendees, owner: detail.owner })}>Schedule next meeting</button>}</div>
      {!!detail.attachments?.length && <section><h3>Evidence</h3>{detail.attachments.map(f => <a className="sch-file" key={f.id} href={`${API_BASE_URL}/api/schedule/${plant}/items/${detail._id}/files/${f.id}`} download>{f.name} ↓</a>)}</section>}
      {detail.kind === 'meeting' && <section><h3>Open actions to review ({pending.length})</h3>{pending.map(action => <div className="sch-review" key={action._id}><div><strong>{action.title}</strong><p>{action.owner} · Due {action.date} · {action.status}</p></div><button onClick={() => edit('action', action, { reviewMeetingId: detail._id })}>Review action</button></div>)}{!pending.length && <p>No outstanding actions.</p>}<h3>Reviews recorded in this meeting</h3>{items.filter(i => i.kind === 'action').flatMap(i => (i.history || []).filter(h => h.meetingId === detail._id).map((h,index) => <div className="sch-history" key={`${i._id}-${index}`}><strong>{i.title} · {h.status}</strong><p>{h.note}</p><small>{h.by} · {new Date(h.at).toLocaleString()}</small></div>))}</section>}
      <h3>Update history</h3>{[...(detail.history || [])].reverse().map((h,index) => <div className="sch-history" key={index}><strong>{h.status} · {h.by}</strong><p>{h.note || 'Record saved.'}</p>{h.actual !== '' && h.actual != null && <p>Current value: {h.actual} {detail.unit}</p>}{h.meetingId && <p>Review meeting: {items.find(i => i._id === h.meetingId)?.title}</p>}<small>{new Date(h.at).toLocaleString()}</small></div>)}
    </section></div>}
    {draft && <div className="sch-overlay"><section className="sch-modal" role="dialog" aria-modal="true" aria-labelledby="form-title"><div className="sch-section-title"><h2 id="form-title">{draft._id ? 'Update' : 'Add'} {categories[draft.kind]}</h2><button disabled={saving} onClick={() => setDraft(null)} aria-label="Close form">✕</button></div><form onSubmit={save}><fieldset disabled={saving} className="sch-form">
      {field('title','Title','text',true)}{field('owner',draft.kind === 'audit' ? 'Auditor' : 'Responsible person','text',true)}{field('date',['objective','action'].includes(draft.kind) ? 'Due date' : 'Scheduled date','date',true)}{field('equipment','Equipment / department')}
      <label>Status<select value={draft.status} onChange={e => change('status',e.target.value)}>{statuses[draft.kind].map(status => <option key={status} disabled={status === 'Verified' && !['Completed','Verified'].includes(items.find(i => i._id === draft._id)?.status)}>{status}</option>)}</select></label>{field('description','Details','textarea')}
      {draft.kind === 'objective' && <>{field('baseline','Baseline','number')}{field('target','Target','number',true)}{field('actual','Current value','number')}{field('unit','Measurement unit')}<label>Target direction<select value={draft.direction} onChange={e => change('direction',e.target.value)}><option value="lower">Lower is better</option><option value="higher">Higher is better</option></select></label></>}
      {draft.kind === 'audit' && field('findings','Findings / deficiencies','textarea')}
      {draft.kind === 'meeting' && <>{field('attendees','Attendees','textarea')}{field('decisions','Discussion / decisions','textarea')}{field('nextDate','Next meeting date','date')}</>}
      {draft.kind === 'action' && <>{field('correctiveAction','Corrective action / improvement plan','textarea',true)}<label>Linked record<select value={draft.sourceId} onChange={e => change('sourceId',e.target.value)}><option value="">No linked record</option>{items.filter(i => i.kind !== 'action').map(i => <option key={i._id} value={i._id}>{i.title}</option>)}</select></label><label>Review meeting<select required={draft.status === 'Verified'} value={draft.reviewMeetingId} onChange={e => change('reviewMeetingId',e.target.value)}><option value="">No meeting review</option>{items.filter(i => i.kind === 'meeting').map(i => <option key={i._id} value={i._id}>{i.date} — {i.title}</option>)}</select></label></>}
      {field('updatedBy',draft.reviewMeetingId ? 'Reviewer' : 'Updated by','text',true)}{field('updateNote',draft.reviewMeetingId ? 'Review outcome / improvement observed' : 'Update notes','textarea',!!draft.reviewMeetingId)}
      <label className="sch-full">Evidence — up to 3 files, 1 MB each<input type="file" multiple accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.docx,.xlsx" onChange={attach}/></label><div className="sch-full">{draft.attachments.map(f => <div className="sch-file" key={f.id}>{f.name}<button type="button" onClick={() => change('attachments',draft.attachments.filter(a => a.id !== f.id))}>Remove</button></div>)}</div>
      {formError && <p className="sch-error sch-full" role="alert">{formError}</p>}<div className="sch-actions sch-full"><button type="submit">{saving ? 'Saving…' : 'Save record'}</button><button type="button" onClick={() => setDraft(null)}>Cancel</button></div>
    </fieldset></form></section></div>}
  </main>;
}

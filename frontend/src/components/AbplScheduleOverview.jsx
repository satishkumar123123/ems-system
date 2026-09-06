import { scheduleSummary } from '../utils/scheduleSummary';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL, apiFetch } from '../config/api';
import '../styles/insights.css';
export const schedulePlants = { wider: 'Wider', utility: 'Utility', hsu: 'HSU', 'narrow-flat': 'Narrow Flat', 'narrow-tube': 'Narrow Tube' };
export default function AbplScheduleOverview() {
  const [results, setResults] = useState(null), [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; const controller = new AbortController(); setResults(null);
    const now = new Date(); const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    Promise.all(Object.entries(schedulePlants).map(async ([id,name]) => {
      try { const response = await apiFetch(`${API_BASE_URL}/api/schedule/${id}`, { signal: controller.signal }); const data = await response.json(); if (!Array.isArray(data.items)) throw new Error('Invalid schedule response'); return { id,name,...scheduleSummary(data.items,date) }; }
      catch (error) { return { id,name,error:error.message }; }
    })).then(data => { if (active) setResults(data); });
    return () => { active = false; controller.abort(); };
  }, [retry]);
  return <section className="ems-insight" id="abpl-schedule"><div className="insight-heading"><div><p>ALL FIVE UNITS · CURRENT SCHEDULE</p><h2>ABPL Schedule Overview</h2></div><button onClick={() => setRetry(n => n + 1)}>Refresh schedule</button></div><p className="insight-note">Current pending actions and upcoming dates across all months. Completed actions stay open until verified in a meeting.</p>{!results ? <p>Loading schedules…</p> : <div className="overview-grid">{results.map((r,index) => <article key={r.id} className={`overview-card overview-${index}`}><h3><Link to={`/${r.id}/schedule`}>{r.name} ↗</Link></h3>{r.error ? <p role="alert">Schedule unavailable. Use Refresh schedule to retry.</p> : <><div className="overview-counts"><span><b>{r.pending}</b> Open actions</span><span><b>{r.overdue}</b> Overdue tasks</span><span><b>{r.upcoming.length}</b> Audits / meetings</span></div><h4>Upcoming audits & meetings</h4>{r.upcoming.slice(0,3).map(i => <Link className="overview-date" key={i._id} to={`/${r.id}/schedule?record=${i._id}`}><time>{i.date}</time><span>{i.title}</span></Link>)}{!r.upcoming.length && <p>No upcoming audits or meetings.</p>}{r.followups.length > 0 && <p>Next follow-up: <Link to={`/${r.id}/schedule?record=${r.followups[0]._id}`}>{r.followups[0].nextDate}</Link></p>}</>}<Link className="overview-open" to={`/${r.id}/schedule`}>Open unit schedule →</Link></article>)}</div>}</section>;
}

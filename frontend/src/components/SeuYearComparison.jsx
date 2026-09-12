import {useEffect,useMemo,useState} from 'react';
import {BarChart,Bar,LineChart,Line,CartesianGrid,XAxis,YAxis,Tooltip,Legend} from 'recharts';
import {API_BASE_URL,apiFetch} from '../config/api';
import {mergeRows} from '../utils/seu';
import {comparisonRows,formatNumber as fmt} from '../utils/seuComparison';
import ExpandableChart from './ExpandableChart';
import '../styles/seu-comparison.css';
export default function SeuYearComparison({year,rows,start,end,plantName,currentState}) {
 const otherYear=year===2025?2026:2025;
 const [other,setOther]=useState({year:otherYear,records:[],loading:true,error:''});
 const [retry,setRetry]=useState(0),[downloading,setDownloading]=useState(false),[downloadError,setDownloadError]=useState('');
 useEffect(()=>{const controller=new AbortController();setOther({year:otherYear,records:[],loading:true,error:''});
 apiFetch(`${API_BASE_URL}/api/seu/${otherYear}`,{signal:controller.signal}).then(r=>r.json()).then(data=>{if(!Array.isArray(data.records))throw Error('Invalid SEU response');if(!controller.signal.aborted)setOther({year:otherYear,records:data.records,loading:false,error:''});}).catch(e=>{if(!controller.signal.aborted)setOther({year:otherYear,records:[],loading:false,error:e.message});});return()=>controller.abort();},[otherYear,retry]);
 const comparisons=useMemo(()=>{const others=mergeRows(otherYear,other.year===otherYear?other.records:[]);return comparisonRows(year===2025?rows:others,year===2026?rows:others,rows.map(r=>r.id),start,end);},[year,rows,otherYear,other,start,end]);
 const pending=currentState.loading||other.loading||other.year!==otherYear;
 const reference=Boolean(currentState.error||other.error);
 async function download(){setDownloading(true);setDownloadError('');try{const {createSeuReport}=await import('../utils/seuReport');createSeuReport({comparisons,year,plantName,start,end,reference}).save(`EMS-SEU-${plantName.replace(/\W+/g,'-')}-${year}-${year+1}-comparison.pdf`);}catch(e){setDownloadError(e.message||'Report could not be generated. Please retry.');}finally{setDownloading(false);}}
 return <section className="seu-comparison">
 <header><div><p>YEAR-ON-YEAR PERFORMANCE</p><h2>2025–26 vs 2026–27</h2><p>Compare the same recorded months. Lower consumption indicators improve when they decrease; output-per-energy indicators improve when they increase.</p></div><button className="seu-download" disabled={pending||downloading||!rows.length} onClick={download}>{downloading?'Preparing PDF…':reference?'Download reference PDF':'Download colourful PDF report'}</button></header>
 <p>The report includes this filtered selection, monthly tables, bar charts and line charts. Different units are never combined into one average.</p>
 {pending&&<p role="status">Checking both years for saved updates…</p>}
 {!pending&&reference&&<p role="alert">Saved updates could not be verified for one or both years. Reference data is shown and marked in the report. <button onClick={()=>setRetry(r=>r+1)}>Retry comparison year</button></p>}
 {downloadError&&<p role="alert">{downloadError}</p>}
 <div className="seu-comparison-table"><table><thead><tr><th>Equipment / Facility</th><th>2025–26 average</th><th>2026–27 average</th><th>Common months</th><th>Change %</th><th>Performance</th></tr></thead><tbody>{comparisons.map(c=><tr key={c.id}><th>{c.name}</th><td>{fmt(c.previousAverage)}</td><td>{fmt(c.currentAverage)}</td><td>{c.paired.length}</td><td>{fmt(c.change)}{c.change!==null?'%':''}</td><td className={c.improvement===null?'':c.improvement<0?'negative':'positive'}>{c.reason||(c.improvement>0?'Improved':c.improvement<0?'Worsened':'Unchanged')}</td></tr>)}</tbody></table></div>
 <p>Change % = (2026–27 − 2025–26) / 2025–26 × 100. Averages use only common recorded months; a zero previous average has no percentage change.</p>
 {comparisons.length!==1?<p>Select one equipment in the Equipment filter for overlaid monthly charts. The PDF includes charts for every selected row.</p>:comparisons.map(c=><div key={c.id}>{!c.unitMatches?<p>{c.reason}. See the year register for the available values; overlaid charts require matching units.</p>:<><h3>{c.name} · {c.current.unit}</h3><div className="seu-comparison-charts">{['bar','line'].map(type=><article key={type}><h3>{type==='bar'?'Monthly bar comparison':'Monthly trend comparison'}</h3><div style={{height:290}}><ExpandableChart>{type==='bar'?<BarChart data={c.points}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip/><Legend/><Bar dataKey="previous" name="2025–26" fill="#7c3aed" radius={[4,4,0,0]}/><Bar dataKey="current" name="2026–27" fill="#0891b2" radius={[4,4,0,0]}/></BarChart>:<LineChart data={c.points}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip/><Legend/><Line dataKey="previous" name="2025–26" stroke="#7c3aed" strokeWidth={2} connectNulls={false}/><Line dataKey="current" name="2026–27" stroke="#0891b2" strokeWidth={2} connectNulls={false}/></LineChart>}</ExpandableChart></div></article>)}</div></>}</div>)}
 </section>;
}

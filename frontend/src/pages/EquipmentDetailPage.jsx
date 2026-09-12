import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import ExpandableChart from '../components/ExpandableChart';
import DataLoadNotice from '../components/DataLoadNotice';
import { API_BASE_URL, apiFetch } from '../config/api';
import catalog from '../utils/equipmentQrCatalog.json';
import { equipmentMetrics, numeric, lastMonths } from '../utils/equipmentDetail';
import '../styles/equipment-detail.css';
const colours=['#38bdf8','#fb923c','#c084fc','#2dd4bf','#60a5fa','#f472b6','#facc15'];
const display=v=>v==null||v===''?'Not recorded':numeric(v)==null?String(v):numeric(v).toLocaleString('en-IN',{maximumFractionDigits:4});
export default function EquipmentDetailPage(){
 const {plant}=useParams();const [params,setParams]=useSearchParams();const name=params.get('equipment')||'';
 const range=params.get('range')==='12'?12:6;
 const raw=params.get('month');const month=/^\d{4}-(0[1-9]|1[0-2])$/.test(raw||'')?raw:new Date().toISOString().slice(0,7);
 const [data,setData]=useState(null),[history,setHistory]=useState([]),[loading,setLoading]=useState(true),[historyLoading,setHistoryLoading]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const valid=Boolean(catalog[plant])&&Boolean(name);
 useEffect(()=>{
  if(!valid)return;const controller=new AbortController();let active=true;
  setLoading(true);setError('');setData(null);setHistory([]);setHistoryLoading(false);
  const fetchMonth=async m=>{const response=await apiFetch(`${API_BASE_URL}/api/${plant}?month=${m}`,{signal:controller.signal});const value=await response.json();if(value!==null && (typeof value!=='object'||Array.isArray(value)||(plant!=='solar'&&!Array.isArray(value.rows))))throw Error('Invalid equipment data response.');return value;};
  (async()=>{try{
   const current=await fetchMonth(month);if(!active)return;setData(current);setLoading(false);setHistoryLoading(true);
   const months=lastMonths(month,range);const result=Array(range);let cursor=0;
   await Promise.all(Array.from({length:3},async()=>{while(cursor<months.length){const i=cursor++;const m=months[i];try{result[i]={month:m,data:m===month?current:await fetchMonth(m)};}catch(e){if(e.name==='AbortError')return;result[i]={month:m,data:null,failed:true};}}}));
   if(active){setHistory(result);setHistoryLoading(false);}
  }catch(e){if(active&&e.name!=='AbortError'){setError(e.message);setLoading(false);}}})();
  return()=>{active=false;controller.abort();};
 },[plant,name,month,attempt,valid,range]);
 if(!valid)return <main className="equipment-detail"><h1>Equipment link is incomplete</h1><Link to="/">Back to Home</Link></main>;
 const metrics=equipmentMetrics(plant,name,data);const chartMetrics=metrics.filter(m=>!m.text);
 const noData=metrics.every(m=>m.value==null);
 return <main className="equipment-detail">
 <header><div><Link to={`/${plant}?month=${month}`}>← {plant.replaceAll('-',' ').toUpperCase()} plant</Link><h1>{name}</h1><p>Equipment consumption & performance</p></div>
 <label> Select month <input type="month" value={month} onChange={e=>{if(e.target.value)setParams({equipment:name,month:e.target.value,range:String(range)});}}/></label><div className="equipment-range" role="group" aria-label="History period">{[6,12].map(n=><button key={n} aria-pressed={range===n} onClick={()=>setParams({equipment:name,month,range:String(n)})}>Last {n} months</button>)}</div></header>
 <DataLoadNotice loading={loading} error={error} empty={!loading&&!error&&noData} period={month} onRetry={()=>setAttempt(n=>n+1)}/>
 {!loading&&!error&&<>
 <div className="equipment-detail-table"><table><caption>{name} · {month}</caption><thead><tr>{metrics.map(m=><th key={m.key}>{m.label}{m.unit&&<small>{m.unit}</small>}</th>)}</tr></thead><tbody><tr>{metrics.map(m=><td key={m.key}>{display(m.value)}</td>)}</tr></tbody></table></div>
 <div className="equipment-kpis">{chartMetrics.filter(m=>['electricity','totalConsumption','production','enpiValue','wrtKwh'].includes(m.key)).map(m=><article key={m.key}><span>{m.label}</span><strong>{display(m.value)}</strong><small>{m.unit}</small></article>)}</div>
 <h2>Bar charts · Last {range} months ending {month}</h2><p>Each parameter has its own scale and unit. Missing records remain blank.</p>{historyLoading&&<p role="status">Loading monthly history…</p>}
 <div className="equipment-detail-charts">{chartMetrics.map((m,i)=><section key={m.key}><h3>{m.label} <small>{m.unit}</small></h3>{historyLoading?<p>Loading history…</p>:<div className="equipment-detail-chart"><ExpandableChart><BarChart data={history.map(r=>({month:r.month,value:numeric(equipmentMetrics(plant,name,r.data).find(item=>item.key===m.key)?.value)}))} margin={{top:28,right:20,left:10,bottom:5}}><CartesianGrid stroke="#334155" vertical={false}/><XAxis dataKey="month" stroke="#cbd5e1"/><YAxis stroke="#cbd5e1" tickFormatter={v=>Intl.NumberFormat('en',{notation:'compact'}).format(v)}/><Tooltip contentStyle={{background:'#0f172a',color:'#fff'}} formatter={v=>[`${display(v)} ${m.unit}`,m.label]}/><Bar dataKey="value" fill={colours[i%colours.length]} maxBarSize={75} radius={[8,8,0,0]}/></BarChart></ExpandableChart></div>}</section>)}</div>
 <h2>Line charts · Last {range} months ending {month}</h2>
 <p>Missing records appear as gaps, not zero.{history.some(r=>r?.failed)&&' Some months could not load.'}</p>
 {history.some(r=>r?.failed)&&<button onClick={()=>setAttempt(n=>n+1)}>Retry history</button>}
 {historyLoading?<p role="status">Loading monthly history…</p>:<div className="equipment-detail-charts">{chartMetrics.map((m,i)=>{
 const points=history.map(r=>({month:r.month,value:numeric(equipmentMetrics(plant,name,r.data).find(item=>item.key===m.key)?.value)}));
 return <section key={m.key}><h3>{m.label} <small>{m.unit}</small></h3><div className="equipment-detail-chart"><ExpandableChart><LineChart data={points} margin={{top:28,right:20,left:10,bottom:5}}><CartesianGrid stroke="#334155"/><XAxis dataKey="month" stroke="#cbd5e1" tick={{fontSize:10}}/><YAxis stroke="#cbd5e1" tickFormatter={v=>Intl.NumberFormat('en',{notation:'compact'}).format(v)}/><Tooltip contentStyle={{background:'#0f172a',color:'#fff'}} formatter={v=>[`${display(v)} ${m.unit}`,m.label]}/><Line type="linear" dataKey="value" stroke={colours[i%colours.length]} strokeWidth={3} connectNulls={false} dot={{r:4}} isAnimationActive={false}/></LineChart></ExpandableChart></div></section>;
 })}</div>}
 </>}
 </main>;
}

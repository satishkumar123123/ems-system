import { trendMonths, performance } from '../utils/enpiTargets';
import { useEffect, useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import ExpandableChart from './ExpandableChart';
import { API_BASE_URL, apiFetch } from '../config/api';
import { numeric } from '../utils/equipmentDetail';
import './enpi-targets.css';
const format=v=>v==null?'Not recorded':v.toLocaleString('en-IN',{maximumFractionDigits:3});
export default function EnpiTargets({plant,rows,selectedMonth,loading,error}){
 const [choice,setChoice]=useState(''),[range,setRange]=useState(6),[history,setHistory]=useState([]),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0),[settings,setSettings]=useState({});
 const equipment=rows.some(r=>r.equipment===choice)?choice:rows[0]?.equipment||'';
 const row=rows.find(r=>r.equipment===equipment);
 const values=settings[equipment]||{baseline:'100',target:'90'};
 const baseline=numeric(values.baseline),target=numeric(values.target),actual=loading||error?null:numeric(row?.enpiValue);
 useEffect(()=>{
  if(loading||error){setHistory([]);return;}
  const controller=new AbortController();let active=true;setBusy(true);setHistory([]);
  const months=trendMonths(selectedMonth,range).slice(0,-1),results=Array(months.length);let next=0;
  (async()=>{
   await Promise.all(Array.from({length:3},async()=>{while(next<months.length){const i=next++;try{
    const response=await apiFetch(`${API_BASE_URL}/api/${plant}?month=${months[i]}`,{signal:controller.signal});const data=await response.json();
    if(data!==null&&!Array.isArray(data?.rows))throw Error('Invalid response');results[i]={month:months[i],rows:data?.rows||[]};
   }catch(e){if(e.name==='AbortError')return;results[i]={month:months[i],rows:[],failed:true};}}}));
   if(active){setHistory(results);setBusy(false);}
  })();return()=>{active=false;controller.abort();};
 },[plant,selectedMonth,range,loading,error,retry]);
 const unit=row?.enpiUnit||'';
 const points=[...history,{month:selectedMonth,rows:loading||error?[]:rows}].map(item=>{
  const found=item.rows.find(r=>String(r.equipment).trim().toUpperCase()===equipment.trim().toUpperCase());
  const mismatch=found?.enpiUnit&&unit&&found.enpiUnit!==unit;
  const value=item.failed||mismatch?null:numeric(found?.enpiValue);
  return {month:item.month,value,failed:item.failed,mismatch,status:performance(value,target)};
 });
 const change=key=>event=>setSettings(prev=>({...prev,[equipment]:{...values,[key]:event.target.value}}));
 return <section className="enpi-targets">
 <header><div><h2>EnPI Baseline & Target Tracker</h2><p className="enpi-demo">DEMO VALUES · Baseline 100 / Target 90 are illustrative, not approved targets.</p></div><label>Equipment<select value={equipment} onChange={e=>setChoice(e.target.value)}>{rows.map(r=><option key={r.equipment}>{r.equipment}</option>)}</select></label></header>
 <p>Lower EnPI is treated as better. Units: {unit||'Not recorded'}. Edited demo values apply only in this page session.</p>
 <div className="enpi-summary"><label>Demo baseline<input type="number" min="0" step="any" value={values.baseline} onChange={change('baseline')}/></label><label>Demo target<input type="number" min="0" step="any" value={values.target} onChange={change('target')}/></label><div><span>Actual · {selectedMonth}</span><strong>{format(actual)}</strong></div><div className={actual!=null&&target!=null&&actual>target?'enpi-lag':'enpi-lead'}><span>Against demo target</span><strong>{performance(actual,target)}</strong><small>{actual!=null&&target!=null?`${format(Math.abs(actual-target))} ${unit} ${actual>target?'above':actual<target?'below':'difference'}`:'No numeric comparison available'}</small></div></div>
 <div className="enpi-range"><h3>{equipment} · Monthly EnPI</h3><label>Trend range<select value={range} onChange={e=>setRange(Number(e.target.value))}><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option><option value={18}>Last 18 months</option></select></label></div>
 <p><span className="enpi-key-good">● Better / on target</span> · <span className="enpi-key-bad">● Above target</span> · Missing or incompatible-unit records remain gaps.</p>
 {error?<p role="alert">Reload the plant data to view comparisons.</p>:loading||busy?<p role="status">Loading EnPI history…</p>:<><div className="enpi-trend"><ExpandableChart><BarChart data={points} margin={{top:30,right:35,left:15,bottom:30}}><CartesianGrid stroke="#cbd5e1" vertical={false}/><XAxis dataKey="month" tick={{fontSize:11,fill:'#334155'}} angle={-35} textAnchor="end" interval={0}/><YAxis domain={[0,'auto']} tick={{fill:'#334155'}}/><Tooltip contentStyle={{background:'#fff',color:'#172554'}} formatter={v=>[`${format(v)} ${unit}`,'Actual EnPI']}/>{baseline!=null&&<ReferenceLine y={baseline} stroke="#7c3aed" strokeDasharray="5 5" ifOverflow="extendDomain" label={{value:'Demo baseline',fill:'#7c3aed',position:'insideTopLeft'}}/>}{target!=null&&<ReferenceLine y={target} stroke="#0284c7" strokeDasharray="3 3" ifOverflow="extendDomain" label={{value:'Demo target',fill:'#0284c7',position:'insideBottomLeft'}}/>}<Bar dataKey="value" radius={[6,6,0,0]} maxBarSize={50} isAnimationActive={false}>{points.map(p=><Cell key={p.month} fill={p.value!=null&&target!=null&&p.value>target?'#e11d48':'#059669'}/>)}</Bar></BarChart></ExpandableChart></div>
 <div className="enpi-months">{points.map(p=><div key={p.month} className={p.value==null?'enpi-missing':target!=null&&p.value>target?'enpi-lag':'enpi-lead'}><b>{p.month}</b><strong>{format(p.value)}</strong><small>{p.failed?'Load failed':p.mismatch?'Unit changed':p.status}</small></div>)}</div>{points.some(p=>p.failed)&&<button onClick={()=>setRetry(n=>n+1)}>Retry missing requests</button>}</>}
 </section>;
}

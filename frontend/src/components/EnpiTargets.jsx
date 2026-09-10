import catalog from '../utils/equipmentQrCatalog.json';
import { trendMonths, performance, canonicalEnpiUnit, averageEnpi } from '../utils/enpiTargets';
import { useEffect, useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import ExpandableChart from './ExpandableChart';
import { API_BASE_URL, apiFetch } from '../config/api';
import { numeric } from '../utils/equipmentDetail';
import './enpi-targets.css';
const format=v=>v==null?'Not recorded':v.toLocaleString('en-IN',{maximumFractionDigits:3});
export default function EnpiTargets({plant,rows,selectedMonth,loading,error}){
 const [choice,setChoice]=useState(''),[range,setRange]=useState(6),[history,setHistory]=useState([]),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0),[settings,setSettings]=useState({});
 const [unitChoice,setUnitChoice]=useState('');
 const knownRows=[...rows,...history.flatMap(h=>h.rows)];
 const names=[...new Set([...(catalog[plant]||[]),...knownRows.map(r=>r.equipment)].filter(Boolean))];
 const plantView=choice==='__plant__';
 const equipment=plantView?'Plant Average':names.includes(choice)?choice:names[0]||'';
 const row=knownRows.find(r=>r.equipment===equipment);
 const units=[...new Set(knownRows.map(r=>canonicalEnpiUnit(r.enpiUnit)).filter(Boolean))];
 const selectedUnit=units.includes(unitChoice)?unitChoice:units.includes('kwh/mt')?'kwh/mt':units[0]||'';
 const unit=plantView?selectedUnit:row?.enpiUnit||'';
 const settingKey=plantView?`__plant__:${unit}`:equipment;
 const values=settings[settingKey]||{baseline:'100',target:'90'};
 const currentRow=rows.find(r=>r.equipment===equipment);
 const average=averageEnpi(loading||error?[]:rows,unit);
 const baseline=numeric(values.baseline),target=numeric(values.target),actual=loading||error?null:plantView?average.value:numeric(currentRow?.enpiValue);
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
 const points=[...history,{month:selectedMonth,rows:loading||error?[]:rows}].map(item=>{
  const found=item.rows.find(r=>String(r.equipment).trim().toUpperCase()===equipment.trim().toUpperCase());
  const mismatch=!plantView&&found?.enpiUnit&&unit&&canonicalEnpiUnit(found.enpiUnit)!==canonicalEnpiUnit(unit);
  const value=item.failed||mismatch?null:plantView?averageEnpi(item.rows,unit).value:numeric(found?.enpiValue);
  return {month:item.month,value,failed:item.failed,mismatch,status:performance(value,target)};
 });
 const change=key=>event=>setSettings(prev=>({...prev,[settingKey]:{...values,[key]:event.target.value}}));
 return <section className="enpi-targets">
 <header><div><h2>EnPI Baseline & Target Tracker</h2><p className="enpi-demo">DEMO VALUES · Baseline 100 / Target 90 are illustrative, not approved targets.</p></div><label>Choose equipment or plant<select value={plantView?'__plant__':equipment} onChange={e=>setChoice(e.target.value)}><option value="__plant__">★ Plant Average</option>{names.map(name=><option key={name} value={name}>{name}</option>)}</select></label></header>
 <div className="enpi-equipment-options" aria-label="Equipment selection"><button type="button" aria-pressed={plantView} onClick={()=>setChoice('__plant__')}>★ Plant Average</button>{names.map(name=><button type="button" key={name} aria-pressed={!plantView&&equipment===name} onClick={()=>setChoice(name)}>{name}</button>)}</div>
 {plantView&&<div className="enpi-plant-average"><label>Average unit group<select value={selectedUnit} onChange={e=>setUnitChoice(e.target.value)}>{units.map(u=><option key={u}>{u}</option>)}</select></label><p>Arithmetic average of recorded equipment EnPI in this unit group: {average.count} of {average.total} equipment included for {selectedMonth}. Missing values are excluded. This is an equipment average, not total plant energy ÷ total production.</p></div>}
 <p>Lower EnPI is treated as better. Units: {unit||'Not recorded'}. Edited demo values apply only in this page session.</p>
 <div className="enpi-summary"><label>Demo baseline<input type="number" min="0" step="any" value={values.baseline} onChange={change('baseline')}/></label><label>Demo target<input type="number" min="0" step="any" value={values.target} onChange={change('target')}/></label><div><span>Actual · {selectedMonth}</span><strong>{format(actual)}</strong></div><div className={actual!=null&&target!=null&&actual>target?'enpi-lag':'enpi-lead'}><span>Against demo target</span><strong>{performance(actual,target)}</strong><small>{actual!=null&&target!=null?`${format(Math.abs(actual-target))} ${unit} ${actual>target?'above':actual<target?'below':'difference'}`:'No numeric comparison available'}</small></div></div>
 <div className="enpi-range"><h3>{equipment} · Monthly EnPI</h3><label>Trend range<select value={range} onChange={e=>setRange(Number(e.target.value))}><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option><option value={18}>Last 18 months</option></select></label></div>
 <p><span className="enpi-key-good">● Better / on target</span> · <span className="enpi-key-bad">● Above target</span> · Missing or incompatible-unit records remain gaps.</p>
 {error?<p role="alert">Reload the plant data to view comparisons.</p>:loading||busy?<p role="status">Loading EnPI history…</p>:<><div className="enpi-trend"><ExpandableChart><BarChart data={points} margin={{top:30,right:35,left:15,bottom:30}}><CartesianGrid stroke="#cbd5e1" vertical={false}/><XAxis dataKey="month" tick={{fontSize:11,fill:'#334155'}} angle={-35} textAnchor="end" interval={0}/><YAxis domain={[0,'auto']} tick={{fill:'#334155'}}/><Tooltip contentStyle={{background:'#fff',color:'#172554'}} formatter={v=>[`${format(v)} ${unit}`,'Actual EnPI']}/>{baseline!=null&&<ReferenceLine y={baseline} stroke="#7c3aed" strokeDasharray="5 5" ifOverflow="extendDomain" label={{value:'Demo baseline',fill:'#7c3aed',position:'insideTopLeft'}}/>}{target!=null&&<ReferenceLine y={target} stroke="#0284c7" strokeDasharray="3 3" ifOverflow="extendDomain" label={{value:'Demo target',fill:'#0284c7',position:'insideBottomLeft'}}/>}<Bar dataKey="value" radius={[6,6,0,0]} maxBarSize={50} isAnimationActive={false}>{points.map(p=><Cell key={p.month} fill={p.value!=null&&target!=null&&p.value>target?'#e11d48':'#059669'}/>)}</Bar></BarChart></ExpandableChart></div>
 <div className="enpi-months">{points.map(p=><div key={p.month} className={p.value==null?'enpi-missing':target!=null&&p.value>target?'enpi-lag':'enpi-lead'}><b>{p.month}</b><strong>{format(p.value)}</strong><small>{p.failed?'Load failed':p.mismatch?'Unit changed':p.status}</small></div>)}</div>{points.some(p=>p.failed)&&<button onClick={()=>setRetry(n=>n+1)}>Retry missing requests</button>}</>}
 </section>;
}

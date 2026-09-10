import useEnpiSettings from './useEnpiSettings';
import catalog from '../utils/equipmentQrCatalog.json';
import { trendMonths, performance, canonicalEnpiUnit, averageEnpi, applicableTarget, targetGap } from '../utils/enpiTargets';
import { useEffect, useState } from 'react';
import { ComposedChart, Line, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
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
 const config=useEnpiSettings(plant,plantView?'__plant_average__':equipment,canonicalEnpiUnit(unit));
 const saved=applicableTarget(config.records,selectedMonth);
 const [effective,setEffective]=useState(selectedMonth),[remark,setRemark]=useState(''),[saving,setSaving]=useState(false),[feedback,setFeedback]=useState('');
 useEffect(()=>{setEffective(selectedMonth);setFeedback('');},[selectedMonth,settingKey]);
 useEffect(()=>{setRemark(config.records.find(r=>r.kind==='remark'&&r.month===selectedMonth)?.remark||'');},[config.records,selectedMonth]);
 const values=settings[settingKey]||{baseline:String(saved?.baseline??100),target:String(saved?.target??90)};
 const currentRow=rows.find(r=>r.equipment===equipment);
 const average=averageEnpi(loading||error?[]:rows,unit);
 const baseline=config.loading||config.error?null:saved?.baseline??numeric(values.baseline),target=config.loading||config.error?null:saved?.target??numeric(values.target),actual=loading||error?null:plantView?average.value:numeric(currentRow?.enpiValue);
 const gap=targetGap(actual,target);
 const saveRecord=async(kind)=>{setSaving(true);setFeedback('');try{
  if(kind==='targets'){const b=numeric(values.baseline),t=numeric(values.target);if(b==null||t==null||b<0||t<0)throw Error('Enter a valid nonnegative baseline and target.');await config.save(kind,{month:effective,baseline:b,target:t});setSettings(prev=>{const next={...prev};delete next[settingKey];return next;});}
  else await config.save(kind,{month:selectedMonth,remark});
  setFeedback('Saved successfully.');
 }catch(e){setFeedback(e.message+' If a target exists for this month, choose a new effective month.');}finally{setSaving(false);}};
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
  const historical=applicableTarget(config.records,item.month);
  const demo=config.records.some(r=>r.kind==='target')?null:{target,baseline};
  const reference=config.loading||config.error?null:historical||demo;
  return {month:item.month,value,failed:item.failed,mismatch,target:reference?.target??null,baseline:reference?.baseline??null,gap:targetGap(value,reference?.target??null),status:performance(value,reference?.target??null)};
 });
 const change=key=>event=>setSettings(prev=>({...prev,[settingKey]:{...values,[key]:event.target.value}}));
 return <section className="enpi-targets">
 <header><div><h2>EnPI Baseline & Target Tracker</h2><p className="enpi-demo">{config.loading?'Loading saved targets…':saved?`SAVED TARGET · Effective ${saved.month}`:'DEMO VALUES · Not approved. Save real values with an effective month.'}</p></div><label>Choose equipment or plant<select value={plantView?'__plant__':equipment} onChange={e=>setChoice(e.target.value)}><option value="__plant__">★ Plant Average</option>{names.map(name=><option key={name} value={name}>{name}</option>)}</select></label></header>
 <div className="enpi-equipment-options" aria-label="Equipment selection"><button type="button" aria-pressed={plantView} onClick={()=>setChoice('__plant__')}>★ Plant Average</button>{names.map(name=><button type="button" key={name} aria-pressed={!plantView&&equipment===name} onClick={()=>setChoice(name)}>{name}</button>)}</div>
 {plantView&&<div className="enpi-plant-average"><label>Average unit group<select value={selectedUnit} onChange={e=>setUnitChoice(e.target.value)}>{units.map(u=><option key={u}>{u}</option>)}</select></label><p>Arithmetic average of recorded equipment EnPI in this unit group: {average.count} of {average.total} equipment included for {selectedMonth}. Missing values are excluded. This is an equipment average, not total plant energy ÷ total production.</p></div>}
 <p>Lower EnPI is treated as better. Units: {unit||'Not recorded'}. Saved targets apply from their effective month; earlier months retain their previous targets.</p>
 <div className="enpi-summary"><label>Baseline to save<input type="number" min="0" step="any" value={values.baseline} onChange={change('baseline')}/></label><label>Target to save<input type="number" min="0" step="any" value={values.target} onChange={change('target')}/></label><div><span>Actual · {selectedMonth}</span><strong>{format(actual)}</strong></div><div className={actual!=null&&target!=null&&actual>target?'enpi-lag':'enpi-lead'}><span>{saved?'Against saved target':'Against demo target'}</span><strong>{performance(actual,target)}</strong><small>{actual!=null&&target!=null?`${format(Math.abs(actual-target))} ${unit} ${actual>target?'above':actual<target?'below':'difference'}`:'No numeric comparison available'}</small><small>{gap==null?'Gap % unavailable (missing or zero target)':`${gap>0?'+':''}${format(gap)}% vs target`}</small></div></div>
 {config.error&&<p role="alert">{config.error} <button onClick={config.reload}>Retry settings</button></p>}
 <div className="enpi-save-panel"><label>Target effective month<input type="month" value={effective} onChange={e=>setEffective(e.target.value)}/></label><button type="button" disabled={saving||config.loading||Boolean(config.error)||!effective} onClick={()=>saveRecord('targets')}>Save baseline & target</button><p>One saved target per effective month. Existing target versions are retained.</p></div>
 {config.records.some(r=>r.kind==='target')&&<details><summary>Saved target history</summary>{config.records.filter(r=>r.kind==='target').map(r=><p key={r.month}>{r.month} · Baseline {format(r.baseline)} · Target {format(r.target)} {unit}</p>)}</details>}
 <div className="enpi-remark-panel"><label>Monthly remarks · {selectedMonth}<textarea rows={3} maxLength={3000} value={remark} onChange={e=>setRemark(e.target.value)} placeholder="Shutdown, maintenance, low production or other reason…"/></label><button type="button" disabled={saving||config.loading||Boolean(config.error)} onClick={()=>saveRecord('remarks')}>Save monthly remarks</button></div>
 {feedback&&<p role="status">{feedback}</p>}
 <div className="enpi-range"><h3>{equipment} · Monthly EnPI</h3><label>Trend range<select value={range} onChange={e=>setRange(Number(e.target.value))}><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option><option value={18}>Last 18 months</option></select></label></div>
 <p><span className="enpi-key-good">● Better / on target</span> · <span className="enpi-key-bad">● Above target</span> · Missing or incompatible-unit records remain gaps.</p>
 {error?<p role="alert">Reload the plant data to view comparisons.</p>:loading||busy?<p role="status">Loading EnPI history…</p>:<><div className="enpi-trend"><ExpandableChart><ComposedChart data={points} margin={{top:30,right:35,left:15,bottom:30}}><CartesianGrid stroke="#cbd5e1" vertical={false}/><XAxis dataKey="month" tick={{fontSize:11,fill:'#334155'}} angle={-35} textAnchor="end" interval={0}/><YAxis domain={[0,'auto']} tick={{fill:'#334155'}}/><Tooltip contentStyle={{background:'#fff',color:'#172554'}} formatter={(v,name)=>[`${format(v)} ${unit}`,name==='value'?'Actual EnPI':name]}/><Line dataKey="baseline" name="Baseline" stroke="#7c3aed" strokeDasharray="5 5" dot={false} connectNulls={false} isAnimationActive={false}/><Line dataKey="target" name="Target" stroke="#0284c7" strokeDasharray="3 3" dot={false} connectNulls={false} isAnimationActive={false}/><Bar dataKey="value" radius={[6,6,0,0]} maxBarSize={50} isAnimationActive={false}>{points.map(p=><Cell key={p.month} fill={p.value!=null&&p.target!=null&&p.value>p.target?'#e11d48':'#059669'}/>)}</Bar></ComposedChart></ExpandableChart></div>
 <div className="enpi-months">{points.map(p=><div key={p.month} className={p.value==null?'enpi-missing':p.target!=null&&p.value>p.target?'enpi-lag':'enpi-lead'}><b>{p.month}</b><strong>{format(p.value)}</strong><small>{p.failed?'Load failed':p.mismatch?'Unit changed':p.status}</small><small>{p.gap==null?'Gap % N/A':`${p.gap>0?'+':''}${format(p.gap)}%`}</small></div>)}</div>{points.some(p=>p.failed)&&<button onClick={()=>setRetry(n=>n+1)}>Retry missing requests</button>}</>}
 </section>;
}

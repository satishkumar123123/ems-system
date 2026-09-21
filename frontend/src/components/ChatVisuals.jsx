import {useMemo, useState} from 'react';
import {BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts';
import {chatVisualData, formatChatValue} from '../utils/chatVisualData';
import '../styles/chat-visuals.css';
export default function ChatVisuals({message}) {
 const charts=useMemo(()=>(message.tables||[]).map(chatVisualData).filter(Boolean),[message.tables]);
 const [selected,setSelected]=useState(0),[metric,setMetric]=useState(0),[view,setView]=useState('bar');
 const chart=charts[selected]||charts[0], m=chart?.metrics[metric]||chart?.metrics[0];
 // A line is only meaningful within one plant's chronological series.
 const plants=[...new Set(chart?.rows.map(r=>r.label.split(' · ')[0])||[])];
 const canLine=chart?.temporal&&plants.length===1;
 const rows=chart ? [...chart.rows].sort((a,b)=>canLine?a.label.localeCompare(b.label):a.key-b.key) : [];
 const C=canLine&&view==='line'?LineChart:BarChart;
 return <div className="chat-visuals">
 {!!message.calculations?.length&&<section aria-label="Period comparisons" className="chat-comparisons">{message.calculations.map((r,i)=><article key={i}><h3>{r.plant}</h3><p>{message.tables?.[0]?.title}</p><div><span>Baseline<strong>{formatChatValue(r.baseline)}</strong></span><span>Current<strong>{formatChatValue(r.current)}</strong></span></div><b className="chat-delta">Change: {formatChatValue(r.delta)} · {formatChatValue(r.percent)}{r.percent==null?'':'%'}</b><small>{r.note}</small></article>)}</section>}
 {chart&&<section className="chat-chart"><div className="chat-chart-controls"><label>Dataset<select value={selected} onChange={e=>{setSelected(Number(e.target.value));setMetric(0);setView('bar');}}>{charts.map((c,i)=><option value={i} key={i}>{c.title}</option>)}</select></label><label>Metric<select value={metric} onChange={e=>setMetric(Number(e.target.value))}>{chart.metrics.map((x,i)=><option key={i} value={i}>{x.name}</option>)}</select></label><div role="group" aria-label="Chart view"><button type="button" aria-pressed={view==='bar'||!canLine} onClick={()=>setView('bar')}>Bar</button><button type="button" disabled={!canLine} aria-pressed={view==='line'&&canLine} onClick={()=>setView('line')}>Line</button></div></div><h3>{m.name}</h3><p>Charts use the displayed table values. Missing readings are gaps. Line view is available for one plant's monthly trend.</p><div style={{overflowX:'auto'}}><div style={{height:340,minWidth:Math.max(560,rows.length*65)}}><ResponsiveContainer width="100%" height="100%"><C data={rows} margin={{top:15,right:25,left:15,bottom:85}}><CartesianGrid stroke="#dce5f1" strokeDasharray="3 3"/><XAxis dataKey="label" angle={-30} textAnchor="end" interval={0} tick={{fontSize:10,fill:'#334155'}}/><YAxis tick={{fontSize:11,fill:'#334155'}}/><Tooltip formatter={v=>[formatChatValue(v),m.name]}/>{C===LineChart?<Line dataKey={`v${m.index}`} stroke="#7c3aed" strokeWidth={3} connectNulls={false} isAnimationActive={false}/>:<Bar dataKey={`v${m.index}`} fill="#2563eb" radius={[6,6,0,0]} isAnimationActive={false}/>}</C></ResponsiveContainer></div></div></section>}
 </div>;
}

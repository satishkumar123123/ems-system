import { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import ExpandableChart from './ExpandableChart';
import './enpi-breakdown.css';
export default function EnpiBreakdownView({data,colors,children}) {
 const [view,setView]=useState('pie');
 return <div className="enpi-breakdown-view">
  <div className="enpi-breakdown-toggle" role="group" aria-label="EnPI breakdown chart type">
   <button type="button" aria-pressed={view==='pie'} onClick={()=>setView('pie')}>◔ Pie Chart</button>
   <button type="button" aria-pressed={view==='bar'} onClick={()=>setView('bar')}>▥ Bar Chart</button>
  </div>
  <div className="enpi-breakdown-canvas">
   {view==='pie'?children:!data.length?<p role="status">No EnPI breakdown data for this month.</p>:<ExpandableChart>
    <BarChart data={data} margin={{top:32,right:20,left:5,bottom:35}}>
     <CartesianGrid stroke="#ffffff20" vertical={false}/>
     <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" tick={{fontSize:10,fill:'#e9d5ff'}} tickFormatter={name=>name.length>16?`${name.slice(0,14)}…`:name}/>
     <YAxis tick={{fontSize:11,fill:'#e9d5ff'}} tickFormatter={value=>Intl.NumberFormat('en',{notation:'compact'}).format(value)}/>
     <Tooltip cursor={{fill:'#ffffff10'}} contentStyle={{background:'#17102e',border:'1px solid #a78bfa',borderRadius:12,color:'#fff'}} formatter={value=>[Number(value).toLocaleString('en-IN',{maximumFractionDigits:4}),'EnPI Metric']}/>
     <Bar dataKey="value" maxBarSize={65} radius={[8,8,0,0]} isAnimationActive={false}>{data.map((item,index)=><Cell key={`${item.name}-${index}`} fill={colors[(index+4)%colors.length]}/>)}</Bar>
    </BarChart>
   </ExpandableChart>}
  </div>
 </div>;
}

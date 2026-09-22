import { useEffect, useState } from 'react';
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ExpandableChart from './ExpandableChart';
import { apiFetch, API_BASE_URL } from '../config/api';
import './abpl-trends.css';

const metrics = { electricity: ['Electricity', 'kWh'], totalConsumption: ['Total consumption', 'kWh Eq'], production: ['Production', 'MT'] };
const fmt = value => value == null ? 'Unavailable' : Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export function monthsEnding(month, count) {
  const [year, m] = month.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(year, m - count + i, 1));
    return date.toISOString().slice(0, 7);
  });
}
export function comparison(actual, previous) {
  if (actual == null || previous == null) return 'Comparison unavailable';
  const delta = actual - previous;
  return `${delta > 0 ? '+' : ''}${fmt(delta)} · ${previous === 0 ? 'percentage N/A (previous zero)' : `${delta > 0 ? '+' : ''}${(delta / previous * 100).toFixed(1)}%`}`;
}
export default function AbplTrends({ month, current, loading, error }) {
  const [range, setRange] = useState(6), [metric, setMetric] = useState('electricity');
  const [plant, setPlant] = useState('all'), [kind, setKind] = useState('line');
  const [history, setHistory] = useState([]), [busy, setBusy] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setHistory([]);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || loading || error || !current) return () => controller.abort();
    setBusy(true);
    const months = monthsEnding(month, range).slice(0, -1), results = new Array(months.length);
    let next = 0;
    (async () => {
      await Promise.all(Array.from({ length: 3 }, async () => {
        while (next < months.length && !controller.signal.aborted) {
          const i = next++;
          try {
            const response = await apiFetch(`${API_BASE_URL}/api/abpl?month=${months[i]}`, { signal: controller.signal });
            const data = await response.json();
            if (!Array.isArray(data.plants) || !data.totals) throw Error('Invalid response');
            results[i] = { month: months[i], data };
          } catch { results[i] = { month: months[i], failed: true }; }
        }
      }));
      if (!controller.signal.aborted) { setHistory(results); setBusy(false); }
    })();
    return () => controller.abort();
  }, [month, range, current, loading, error, retry]);
  // Old backends lack availability metadata: do not fabricate trustworthy comparisons.
  const value = (data, key, id = 'all') => !data?.availability ? null : id === 'all' ? data.totals?.[key] ?? null : data.plants.find(p => p.id === id)?.[key] ?? null;
  const previous = history.at(-1)?.data;
  const points = [...history, { month, data: current }].map(item => ({ month: item.month, value: value(item.data, metric, plant) }));
  const Chart = kind === 'line' ? LineChart : BarChart;
  return <section className="abpl-trends">
    <h2>Monthly performance & trends</h2>
    <p>Corporate totals require all five plants for each metric. Missing months stay gaps; recorded zero stays zero. A rise or fall alone does not indicate efficiency.</p>
    {loading || error ? <p role="status">{loading ? 'Loading selected month…' : 'Reload selected month to view comparisons.'}</p> : <>
      <h3>Previous month comparison</h3>
      <div className="abpl-change-grid">{Object.entries(metrics).map(([key, [label, unit]]) => <article key={key}><h4>{label}</h4><strong>{fmt(value(current, key))} {unit}</strong><p>{busy ? 'Loading comparison…' : comparison(value(current, key), value(previous, key))}</p><small>Previous: {busy ? 'Loading…' : fmt(value(previous, key))} {unit}</small></article>)}</div>
      <div className="abpl-trend-controls">
        <label>Metric<select value={metric} onChange={e => setMetric(e.target.value)}>{Object.entries(metrics).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}</select></label>
        <label>Plant<select value={plant} onChange={e => setPlant(e.target.value)}><option value="all">ABPL consolidated</option>{current?.plants?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>Period<select value={range} onChange={e => setRange(+e.target.value)}><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option></select></label>
        <label>Chart<select value={kind} onChange={e => setKind(e.target.value)}><option value="line">Line</option><option value="bar">Bar</option></select></label>
      </div>
      {busy ? <p role="status">Loading historical months…</p> : <><div className="abpl-trend-chart"><ExpandableChart><Chart data={points} margin={{ top: 15, right: 25, bottom: 25, left: 15 }}><CartesianGrid stroke="#d2dceb" strokeDasharray="3 3"/><XAxis dataKey="month"/><YAxis/><Tooltip formatter={v => [fmt(v), metrics[metric][1]]}/><Legend/>{kind === 'line' ? <Line dataKey="value" name={metrics[metric][0]} stroke="#6d28d9" strokeWidth={3} connectNulls={false} isAnimationActive={false}/> : <Bar dataKey="value" name={metrics[metric][0]} fill="#0891b2" radius={[5,5,0,0]} isAnimationActive={false}/>}</Chart></ExpandableChart></div>{points.every(p => p.value == null) && <p>No complete data available for this selection.</p>}{history.some(p => p.failed) && <p role="alert">Some months could not load. <button onClick={() => setRetry(n => n + 1)}>Retry history</button></p>}</>}
    </>}
  </section>;
}

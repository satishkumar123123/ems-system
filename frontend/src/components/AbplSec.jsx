import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL, apiFetch } from '../config/api';
import { summarizeSec } from '../utils/sec';
import { formatSec } from './SecPanel';
const plants = { wider: 'Wider', utility: 'Utility', hsu: 'HSU', 'narrow-flat': 'Narrow Flat', 'narrow-tube': 'Narrow Tube' };
export default function AbplSec({ selectedMonth }) {
  const [results, setResults] = useState(null), [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; const controller = new AbortController(); setResults(null);
    Promise.all(Object.entries(plants).map(async ([id, name]) => {
      try { const response = await apiFetch(`${API_BASE_URL}/api/${id}?month=${selectedMonth}`, { signal: controller.signal }); const data = await response.json(); if (data.rows != null && !Array.isArray(data.rows)) throw new Error('Invalid monthly data'); return { id, name, ...summarizeSec(data.rows || []) }; }
      catch (error) { return { id, name, error: error.message }; }
    })).then(data => { if (active) setResults(data); });
    return () => { active = false; controller.abort(); };
  }, [selectedMonth, retry]);
  return <section className="ems-insight"><div className="insight-heading"><div><p>PLANT COMPARISON · {selectedMonth}</p><h2>Specific Energy Consumption</h2></div><button onClick={() => setRetry(n => n + 1)}>Refresh SEC</button></div><p className="insight-note">kWh / ton of recorded process throughput, using only equipment with a tonne-based output unit. Utility output is excluded; incomplete tonne-based records show N/A. Compare similar processes; these are not finished-product SEC figures.</p>{!results ? <p>Loading plant SEC…</p> : <div className="insight-scroll"><table><thead><tr><th>Plant</th><th>Electricity SEC</th><th>Total energy SEC</th><th>Coverage</th></tr></thead><tbody>{results.map(r => <tr key={r.id}><th><Link to={`/${r.id}`}>{r.name}</Link></th><td>{r.error ? 'Unavailable' : formatSec(r.electricSec)}</td><td>{r.error ? 'Unavailable' : formatSec(r.totalSec)}</td><td>{r.error || `${r.included} tonne-based equipment; ${r.excluded} excluded`}</td></tr>)}</tbody></table></div>}</section>;
}

import SecPanel from './SecPanel';
import { useMemo } from 'react';
import {
  BarChart, Bar, Cell, CartesianGrid, LabelList,
  Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

// Reuse the facility charts' bright palette, with distinct colours for larger lists.
const EQUIPMENT_COLORS = [
  '#00e5ff', '#00e676', '#ffab00', '#ff1744', '#d500f9', '#00b0ff',
  '#f50057', '#76ff03', '#fb923c', '#c084fc', '#facc15', '#2dd4bf',
  '#f472b6', '#818cf8', '#a3e635', '#fda4af', '#7dd3fc', '#fbbf24',
  '#a78bfa', '#34d399', '#e879f9', '#fdba74', '#67e8f9', '#bef264',
  '#c4b5fd', '#6ee7b7', '#f9a8d4', '#93c5fd', '#fde047', '#5eead4',
];

const METRICS = [
  { key: 'electricity', title: 'Electricity', unit: 'kWh', background: '#4c1d95', border: '#7c3aed', accent: '#c084fc', glow: 'rgba(124,58,237,0.2)' },
  { key: 'totalConsumption', title: 'Total Consumption', unit: 'kWh', background: '#082f49', border: '#0284c7', accent: '#38bdf8', glow: 'rgba(2,132,199,0.2)' },
  { key: 'production', title: 'Production', unit: '', background: '#064e3b', border: '#059669', accent: '#34d399', glow: 'rgba(5,150,105,0.2)' },
];

const formatValue = value => Number(value).toLocaleString('en-IN', { maximumFractionDigits: 3 });
const formatAxis = value => Number(value).toLocaleString('en', { notation: 'compact', maximumFractionDigits: 1 });

function EquipmentTick({ x, y, payload }) {
  const name = String(payload.value);
  const words = name.split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach(word => {
    if (line && `${line} ${word}`.length > 23) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  });
  if (line) lines.push(line);
  return (
    <text x={x - 4} y={y} textAnchor="end" fill="#e2e8f0" fontSize={11} fontWeight={700}>
      <title>{name}</title>
      {lines.map((text, index) => (
        <tspan key={index} x={x - 4} dy={index === 0 ? 4 - (lines.length - 1) * 7 : 14}>{text}</tspan>
      ))}
    </text>
  );
}

export default function EquipmentBarCharts({ rows, selectedMonth, loading, error }) {
  const charts = useMemo(() => {
    // Colour assignment happens before ranking so equipment keep their colour
    // across all three charts, even when their rankings differ.
    const names = [...new Set(rows.map(row => String(row.equipment || '').trim()))].filter(Boolean).sort();
    const colors = new Map(names.map((name, index) => [
      name, EQUIPMENT_COLORS[index] || `hsl(${(index * 137.508) % 360} 80% 65%)`,
    ]));
    return METRICS.map(metric => ({
      ...metric,
      data: rows.map(row => {
        const raw = row[metric.key];
        const value = typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(/,/g, '').trim());
        const name = String(row.equipment || '').trim();
        return { name, value, color: colors.get(name), hasValue: raw != null && String(raw).trim() !== '' };
      })
        .filter(item => item.name && item.hasValue && Number.isFinite(item.value) && item.value >= 0)
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
        .slice(0, 10),
    }));
  }, [rows]);

  return (
    <div aria-label="Equipment bar charts" style={{ display: 'grid', gap: '24px', marginTop: '24px', minWidth: 0 }}>
      {charts.map(metric => (
        <section
          key={metric.key}
          aria-label={`${metric.title} — Top 10 Equipment — ${selectedMonth}`}
          style={{ minWidth: 0, background: `linear-gradient(180deg, #0f172a 0%, ${metric.background} 100%)`, border: `2px solid ${metric.border}`, borderRadius: '24px', padding: '20px', boxShadow: `0 20px 30px ${metric.glow}` }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderBottom: `1px solid ${metric.border}`, paddingBottom: '12px', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', color: metric.accent }}>
              {metric.title} <span style={{ color: '#facc15' }}>— Top 10 Equipment</span>
            </h3>
            <span style={{ fontSize: '11px', fontWeight: '900', color: metric.accent, backgroundColor: 'rgba(15,23,42,0.6)', border: `1px solid ${metric.accent}`, padding: '2px 8px', borderRadius: '12px' }}>
              {selectedMonth}{metric.unit ? ` · ${metric.unit}` : ''}
            </span>
          </div>
          <p style={{ margin: '8px 0 16px', color: '#cbd5e1', fontSize: '12px' }}>
            Highest to lowest for the selected month.
            {metric.key === 'production' && ' Production values use each equipment’s recorded unit.'}
          </p>
          {loading || error || metric.data.length === 0 ? (
            <p style={{ padding: '28px 0', color: '#94a3b8', textAlign: 'center', fontSize: '13px' }}>
              {loading ? `Loading ${selectedMonth} data…` : error ? 'Chart unavailable. Retry loading the month above.' : `No ${metric.title.toLowerCase()} data for ${selectedMonth}.`}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '640px', width: '100%', height: Math.max(260, metric.data.length * 56 + 50) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart key={`${metric.key}-${selectedMonth}`} data={metric.data} layout="vertical" margin={{ top: 8, right: 110, left: 8, bottom: 8 }} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                    <XAxis type="number" domain={[0, 'auto']} tickFormatter={formatAxis} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={190} interval={0} tick={<EquipmentTick />} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(148,163,184,0.12)' }}
                      contentStyle={{ backgroundColor: '#030712', borderColor: metric.border, borderRadius: '14px', color: '#f8fafc', fontSize: '12px', fontWeight: '900' }}
                      itemStyle={{ color: metric.accent }}
                      formatter={value => [`${formatValue(value)}${metric.unit ? ` ${metric.unit}` : ''}`, metric.title]}
                    />
                    {/* An explicit shape keeps recorded zero values in the label list. */}
                    <Bar dataKey="value" name={metric.title} maxBarSize={28} radius={[0, 6, 6, 0]} shape={<Rectangle />} isAnimationActive={false}>
                      {metric.data.map(item => <Cell key={item.name} fill={item.color} />)}
                      <LabelList dataKey="value" position="right" formatter={formatValue} fill="#f8fafc" fontSize={11} fontWeight={700} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>
      ))}
      <SecPanel rows={rows} selectedMonth={selectedMonth} loading={loading} error={error} />
    </div>
  );
}

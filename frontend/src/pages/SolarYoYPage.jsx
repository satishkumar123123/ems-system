import DataLoadNotice from '../components/DataLoadNotice';
import { API_BASE_URL, apiFetch } from '../config/api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Factory, BatteryCharging, Sun } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

// Dark accents stay readable on the pastel page and white chart surfaces.
const textColors = ['#1d4ed8', '#7e22ce', '#be185d', '#047857', '#b45309', '#0e7490'];

function ColorWords({ children, offset = 0 }) {
  return <span>{String(children).split(/(\s+)/).map((word, index) => (
    /\s+/.test(word) ? word : <span key={index} style={{ color: textColors[(Math.floor(index / 2) + offset) % textColors.length] }}>{word}</span>
  ))}</span>;
}

function ColorTick({ x, y, payload, index = 0, vertical = false }) {
  return <text x={x} y={y} dy={vertical ? 4 : 16} textAnchor={vertical ? 'end' : 'middle'}
    fill={textColors[index % textColors.length]} fontSize={11} fontWeight={600}>{payload.value}</text>;
}

export default function SolarYoYPage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState('2025-26');
  const [yoyMonthlyData, setYoyMonthlyData] = useState([]);
  const [prevYearLabel, setPrevYearLabel] = useState('2024-25');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadAttempt, setReloadAttempt] = useState(0);


  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setLoadError('');
    setYoyMonthlyData([]);
    apiFetch(`${API_BASE_URL}/api/solar/yoy?year=${selectedYear}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (!data || !Array.isArray(data.monthlyData)) throw new Error('The comparison service returned invalid data. Please retry.');
        setYoyMonthlyData(data.monthlyData);
        setPrevYearLabel(data.prevFinancialYear);
      })
      .catch(error => {
        if (!active || error.name === 'AbortError') return;
        setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedYear, reloadAttempt]);

  const sections = [
    {
      id: 'ctl',
      title: '1. CTL Production (MT)',
      icon: Factory,
      unit: 'MT',
      colorPrev: '#fde68a',
      colorCurr: '#f59e0b',
      badge: 'Production Comparison'
    },
    {
      id: 'evStation',
      title: '2. EV Station Electricity (kWh)',
      icon: BatteryCharging,
      unit: 'kWh',
      colorPrev: '#a7f3d0',
      colorCurr: '#10b981',
      badge: 'Consumption Comparison'
    },
    {
      id: 'solar',
      title: '3. Solar Electricity Generation (kWh)',
      icon: Sun,
      unit: 'kWh',
      colorPrev: '#c7d2fe',
      colorCurr: '#6366f1',
      badge: 'Generation Comparison'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-8" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0f2fe 0%, #ede9fe 55%, #fce7f3 100%)' }}>
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 bg-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/solar')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold border border-slate-300 transition shadow-sm cursor-pointer"
          >
            <ArrowLeft size={18} color="#1d4ed8" /> <ColorWords>Back to Solar</ColorWords>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800"><ColorWords>Solar Facility - YoY Analytics</ColorWords></h1>
            <p className="text-xs text-slate-500"><ColorWords offset={2}>April to March Financial Year Comparison for CTL, EV Station & Solar</ColorWords></p>
          </div>
        </div>

        {/* Financial Year Selector */}
        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
          <Calendar size={18} color="#7e22ce" />
          <span className="text-xs font-bold text-slate-600"><ColorWords offset={3}>Financial Year:</ColorWords></span>
          <select
            value={selectedYear}
            aria-label="Financial year comparison"
            style={{ color: selectedYear === '2025-26' ? '#7e22ce' : '#047857', backgroundColor: '#fff' }}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1 font-semibold text-xs outline-none cursor-pointer"
          >
            <option value="2025-26" style={{ color: '#7e22ce' }}>FY 2025-26 vs FY 2024-25</option>
            <option value="2024-25" style={{ color: '#047857' }}>FY 2024-25 vs FY 2023-24</option>
          </select>
        </div>
      </div>

      {/* 3 YoY BAR CHARTS */}
      <DataLoadNotice loading={loading} error={loadError} period={selectedYear} onRetry={() => setReloadAttempt(attempt => attempt + 1)} />
      {loading || loadError ? (
        null
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {sections.map((sec, idx) => {
            const chartData = yoyMonthlyData.map(m => ({
              month: m.month,
              [`FY ${prevYearLabel}`]: m[sec.id].prevYear,
              [`FY ${selectedYear}`]: m[sec.id].currYear,
            }));

            const Icon = sec.icon;

            return (
              <div
                key={sec.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-sm">
                      <Icon size={18} color={textColors[idx]} />
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-800 tracking-wide">
                      <ColorWords offset={idx}>{sec.title}</ColorWords>
                    </h2>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-lg">
                    <ColorWords offset={idx + 3}>{sec.badge}</ColorWords>
                  </span>
                </div>

                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={<ColorTick />} />
                      <YAxis tick={<ColorTick vertical />} />
                      <Tooltip
                        formatter={(val, name) => [<ColorWords offset={3}>{`${Number(val).toLocaleString()} ${sec.unit}`}</ColorWords>, <ColorWords>{name}</ColorWords>]}
                        labelFormatter={(label) => <ColorWords offset={2}>{label}</ColorWords>}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      />
                      <Legend formatter={(value, entry, index) => <ColorWords offset={index * 3}>{value}</ColorWords>} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                      <Bar
                        dataKey={`FY ${prevYearLabel}`}
                        fill={sec.colorPrev}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey={`FY ${selectedYear}`}
                        fill={sec.colorCurr}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
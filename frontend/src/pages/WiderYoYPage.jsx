import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Factory, BarChart3, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function WiderYoYPage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState('2025-26');
  const [selectedMetric, setSelectedMetric] = useState('electricity'); // 'electricity' | 'production' | 'enpi'
  const [yoyData, setYoyData] = useState([]);
  const [prevYearLabel, setPrevYearLabel] = useState('2024-25');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchYoYData();
  }, [selectedYear]);

  const fetchYoYData = () => {
    setLoading(true);
    fetch(`http://localhost:5000/api/wider/yoy?year=${selectedYear}`)
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.data) {
          setYoyData(resData.data);
          setPrevYearLabel(resData.prevFinancialYear);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Wider YoY Fetch Error:", err);
        setLoading(false);
      });
  };

  const getMetricConfig = () => {
    switch (selectedMetric) {
      case 'electricity':
        return { label: 'Electricity Consumption (kWh)', colorPrev: '#94a3b8', colorCurr: '#4f46e5', unit: 'kWh' };
      case 'production':
        return { label: 'Production (MT)', colorPrev: '#cbd5e1', colorCurr: '#10b981', unit: 'MT' };
      case 'enpi':
        return { label: 'EnPI Value (KwH/MT)', colorPrev: '#fcd34d', colorCurr: '#f59e0b', unit: 'KwH/MT' };
      default:
        return { label: 'Electricity Consumption (kWh)', colorPrev: '#94a3b8', colorCurr: '#4f46e5', unit: 'kWh' };
    }
  };

  const metricConfig = getMetricConfig();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-8">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 bg-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/wider')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold border border-slate-300 transition shadow-sm cursor-pointer"
          >
            <ArrowLeft size={18} /> Back to Wider
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Wider Facility - YoY Analytics</h1>
            <p className="text-xs text-slate-500">April to March Financial Year Monthly Comparison</p>
          </div>
        </div>

        {/* Financial Year Selector */}
        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
          <Calendar size={18} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-600">Financial Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1 font-semibold text-xs outline-none cursor-pointer"
          >
            <option value="2025-26">FY 2025-26 vs FY 2024-25</option>
            <option value="2024-25">FY 2024-25 vs FY 2023-24</option>
          </select>
        </div>
      </div>

      {/* 3 Parameter Selection Bar */}
      <div className="mt-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <span className="text-sm font-bold text-slate-700">Select Parameter to Compare:</span>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedMetric('electricity')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition cursor-pointer ${
              selectedMetric === 'electricity'
                ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <Zap size={16} /> Electricity (kWh)
          </button>

          <button
            onClick={() => setSelectedMetric('production')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition cursor-pointer ${
              selectedMetric === 'production'
                ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <Factory size={16} /> Production (MT)
          </button>

          <button
            onClick={() => setSelectedMetric('enpi')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition cursor-pointer ${
              selectedMetric === 'enpi'
                ? 'bg-amber-600 text-white shadow-amber-200 shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <BarChart3 size={16} /> EnPI Value
          </button>
        </div>
      </div>

      {/* 4 Fixed Equipment Rows (6HI, CGL, CCL, COMPRESSOR) */}
      {loading ? (
        <div className="p-16 text-center text-indigo-600 font-bold animate-pulse">
          Loading Wider YoY Data for {selectedMetric.toUpperCase()}...
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {yoyData.map((item, idx) => {
            const chartData = item.monthlyData.map(m => ({
              month: m.month,
              [`FY ${prevYearLabel}`]: m[selectedMetric].prevYear,
              [`FY ${selectedYear}`]: m[selectedMetric].currYear,
            }));

            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center text-sm">
                      0{idx + 1}
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-800 tracking-wide">
                      {item.equipment}
                    </h2>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-lg">
                    Showing: {metricConfig.label}
                  </span>
                </div>

                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        formatter={(val) => [`${Number(val).toLocaleString()} ${metricConfig.unit}`, '']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                      <Bar
                        dataKey={`FY ${prevYearLabel}`}
                        fill={metricConfig.colorPrev}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey={`FY ${selectedYear}`}
                        fill={metricConfig.colorCurr}
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
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Factory, BatteryCharging, Sun } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function SolarYoYPage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState('2025-26');
  const [yoyMonthlyData, setYoyMonthlyData] = useState([]);
  const [prevYearLabel, setPrevYearLabel] = useState('2024-25');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchYoYData();
  }, [selectedYear]);

  const fetchYoYData = () => {
    setLoading(true);
    fetch(`http://localhost:5000/api/solar/yoy?year=${selectedYear}`)
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.monthlyData) {
          setYoyMonthlyData(resData.monthlyData);
          setPrevYearLabel(resData.prevFinancialYear);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Solar YoY Fetch Error:", err);
        setLoading(false);
      });
  };

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
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-8">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 bg-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/solar')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold border border-slate-300 transition shadow-sm cursor-pointer"
          >
            <ArrowLeft size={18} /> Back to Solar
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Solar Facility - YoY Analytics</h1>
            <p className="text-xs text-slate-500">April to March Financial Year Comparison for CTL, EV Station & Solar</p>
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

      {/* 3 YoY BAR CHARTS */}
      {loading ? (
        <div className="p-16 text-center text-amber-600 font-bold animate-pulse">
          Loading Solar YoY Comparative Analytics...
        </div>
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
                      <Icon size={18} />
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-800 tracking-wide">
                      {sec.title}
                    </h2>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-lg">
                    {sec.badge}
                  </span>
                </div>

                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        formatter={(val) => [`${Number(val).toLocaleString()} ${sec.unit}`, '']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
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
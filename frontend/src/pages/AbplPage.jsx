import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Zap, 
  Flame, 
  Fuel, 
  Activity, 
  Factory, 
  Calendar,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

export default function AbplPage() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState('2026-04');
  const [selectedMetric, setSelectedMetric] = useState('electricity');
  const [abplData, setAbplData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAbplData();
  }, [selectedMonth]);

  const fetchAbplData = () => {
    setLoading(true);
    fetch(`http://localhost:5000/api/abpl?month=${selectedMonth}`)
      .then((res) => res.json())
      .then((data) => {
        setAbplData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('ABPL Fetch Error:', err);
        setLoading(false);
      });
  };

  // 5 Distinct Colorful Theme Configurations
  const metricConfigs = {
    electricity: {
      title: 'Electricity',
      unit: 'kWh',
      icon: Zap,
      gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      shadowColor: 'rgba(37, 99, 235, 0.4)',
      borderColor: '#1d4ed8',
      barColor: '#2563eb',
      totalVal: abplData?.totals?.electricity || 0,
    },
    lpg: {
      title: 'LPG / LNG',
      unit: 'Kg',
      icon: Flame,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      shadowColor: 'rgba(245, 158, 11, 0.4)',
      borderColor: '#d97706',
      barColor: '#f59e0b',
      totalVal: abplData?.totals?.lpg || 0,
    },
    hsd: {
      title: 'HSD',
      unit: 'Ltr',
      icon: Fuel,
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
      shadowColor: 'rgba(244, 63, 94, 0.4)',
      borderColor: '#e11d48',
      barColor: '#f43f5e',
      totalVal: abplData?.totals?.hsd || 0,
    },
    totalConsumption: {
      title: 'Total Consumption',
      unit: 'kWh Eq',
      icon: Activity,
      gradient: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
      shadowColor: 'rgba(147, 51, 234, 0.4)',
      borderColor: '#7e22ce',
      barColor: '#9333ea',
      totalVal: abplData?.totals?.totalConsumption || 0,
    },
    production: {
      title: 'Production',
      unit: 'MT',
      icon: Factory,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadowColor: 'rgba(16, 185, 129, 0.4)',
      borderColor: '#059669',
      barColor: '#10b981',
      totalVal: abplData?.totals?.production || 0,
    },
  };

  const activeConf = metricConfigs[selectedMetric];

  // Prepare chart data
  const chartData = (abplData?.plants || []).map((p) => ({
    name: p.name,
    value: p[selectedMetric] || 0,
    color: p.color,
  }));

  const pieData = chartData.filter((item) => item.value > 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-6 md:p-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 bg-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold border border-slate-300 transition shadow-sm cursor-pointer"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-200">
                <Layers size={22} />
              </span>
              ABPL Master Facility
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated Multi-Plant Energy & Production Intelligence
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-3 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl">
          <Calendar size={18} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Select Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1 font-bold text-xs text-slate-800 outline-none cursor-pointer shadow-sm"
          />
        </div>
      </div>

      {/* 5 COLORFUL RECTANGULAR BLOCKS IN 1 ROW */}
      <div 
        className="mt-6 w-full" 
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          flexWrap: 'nowrap', 
          gap: '14px', 
          width: '100%',
          overflowX: 'auto',
          paddingBottom: '6px'
        }}
      >
        {Object.entries(metricConfigs).map(([key, conf]) => {
          const Icon = conf.icon;
          const isSelected = selectedMetric === key;

          return (
            <div
              key={key}
              onClick={() => setSelectedMetric(key)}
              style={{
                flex: '1 1 0px',
                minWidth: '170px',
                background: conf.gradient,
                boxShadow: isSelected ? `0 10px 20px -3px ${conf.shadowColor}` : '0 2px 6px rgba(0,0,0,0.08)',
                transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                outline: isSelected ? '3px solid white' : 'none',
                outlineOffset: '-2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
                borderRadius: '16px',
                padding: '14px 16px',
                color: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                {/* Icon Container */}
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.22)',
                    backdropFilter: 'blur(4px)',
                    padding: '9px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={20} color="#ffffff" />
                </div>

                {/* Details */}
                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'rgba(255, 255, 255, 0.9)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {conf.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginTop: '2px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                      {conf.totalVal.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', flexShrink: 0 }}>
                      {conf.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Badge */}
              {isSelected && (
                <div 
                  style={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '50%', 
                    padding: '2px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginLeft: '8px',
                    flexShrink: 0
                  }}
                >
                  <CheckCircle2 size={16} color={conf.barColor} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="p-16 text-center text-indigo-600 font-bold animate-pulse text-base">
          Aggregating telemetry from all plant databases...
        </div>
      ) : (
        <>
          {/* Active Metric Title Banner */}
          <div className="mt-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: activeConf.barColor }}></span>
              <h2 className="text-base font-extrabold text-slate-800">
                Plant-Wise Distribution for <span className="text-indigo-600">{activeConf.title}</span> ({selectedMonth})
              </h2>
            </div>
            <div className="text-xs font-bold text-slate-500">
              Consolidated Total: <span className="text-slate-800 font-black">{activeConf.totalVal.toLocaleString()} {activeConf.unit}</span>
            </div>
          </div>

          {/* VISUALIZATION GRID: BAR GRAPH + PIE CHART */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 1. Bar Graph (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-slate-800">
                  Plant Comparison Bar Chart ({activeConf.unit})
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                  Monthly Total
                </span>
              </div>

              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val) => [`${Number(val).toLocaleString()} ${activeConf.unit}`, activeConf.title]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="value" fill={activeConf.barColor} radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || activeConf.barColor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Pie Chart (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-between">
              <div className="w-full flex items-center justify-between mb-2 border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-slate-800">
                  Share & Contribution Percentage
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                  100% Split
                </span>
              </div>

              <div style={{ width: '100%', height: 320, minHeight: 320 }}>
                {pieData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
                    No data recorded for {activeConf.title} in {selectedMonth}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        innerRadius={45}
                        paddingAngle={3}
                        label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [`${Number(val).toLocaleString()} ${activeConf.unit}`, 'Share']}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* 3. Detailed Data Table */}
          <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800">
                Consolidated Breakdown Table — {selectedMonth}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-3 text-left">Plant / Facility</th>
                    <th className="p-3">Electricity (kWh)</th>
                    <th className="p-3">LPG / LNG (Kg)</th>
                    <th className="p-3">HSD (Ltr)</th>
                    <th className="p-3">Total Consumption</th>
                    <th className="p-3">Production (MT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(abplData?.plants || []).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-left font-bold flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></span>
                        {p.name}
                      </td>
                      <td className="p-3">{p.electricity ? p.electricity.toLocaleString() : '-'}</td>
                      <td className="p-3">{p.lpg ? p.lpg.toLocaleString() : '-'}</td>
                      <td className="p-3">{p.hsd ? p.hsd.toLocaleString() : '-'}</td>
                      <td className="p-3 font-semibold text-slate-900">{p.totalConsumption ? p.totalConsumption.toLocaleString() : '-'}</td>
                      <td className="p-3">{p.production ? p.production.toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                  {/* Grand Total Row */}
                  <tr className="bg-emerald-50 text-emerald-950 font-black border-t-2 border-emerald-300">
                    <td className="p-3.5 text-left text-sm">TOTAL ABPL CONSOLIDATED</td>
                    <td className="p-3.5">{abplData?.totals?.electricity?.toLocaleString()}</td>
                    <td className="p-3.5">{abplData?.totals?.lpg?.toLocaleString()}</td>
                    <td className="p-3.5">{abplData?.totals?.hsd?.toLocaleString()}</td>
                    <td className="p-3.5 font-black text-indigo-900">{abplData?.totals?.totalConsumption?.toLocaleString()}</td>
                    <td className="p-3.5">{abplData?.totals?.production?.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
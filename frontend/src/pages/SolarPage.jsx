import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, TrendingUp, Sun, BatteryCharging, Factory, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#f59e0b', '#10b981', '#6366f1'];

export default function SolarPage() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState('2026-04');
  const [ctlProduction, setCtlProduction] = useState('');
  const [evStationElectricity, setEvStationElectricity] = useState('');
  const [solarElectricity, setSolarElectricity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMonthData(selectedMonth);
  }, [selectedMonth]);

  const fetchMonthData = (month) => {
    setLoading(true);
    fetch(`http://localhost:5000/api/solar?month=${month}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setCtlProduction(data.ctlProduction ?? '');
          setEvStationElectricity(data.evStationElectricity ?? '');
          setSolarElectricity(data.solarElectricity ?? '');
        } else {
          setCtlProduction('');
          setEvStationElectricity('');
          setSolarElectricity('');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Solar fetch error:", err);
        setLoading(false);
      });
  };

  const handleSave = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/solar/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthYear: selectedMonth,
          ctlProduction: Number(ctlProduction) || 0,
          evStationElectricity: Number(evStationElectricity) || 0,
          solarElectricity: Number(solarElectricity) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Solar data successfully saved in Atlas database for ${selectedMonth}!`);
      } else {
        alert('Save failed: ' + data.error);
      }
    } catch (err) {
      alert('Error saving solar data: ' + err.message);
    }
  };

  const graphData = [
    { name: 'CTL Production', value: Number(ctlProduction) || 0, unit: 'MT', fill: '#f59e0b' },
    { name: 'EV Station', value: Number(evStationElectricity) || 0, unit: 'kWh', fill: '#10b981' },
    { name: 'Solar Generation', value: Number(solarElectricity) || 0, unit: 'kWh', fill: '#6366f1' }
  ];

  const pieData = [
    { name: 'EV Station (kWh)', value: Number(evStationElectricity) || 0 },
    { name: 'Solar Generation (kWh)', value: Number(solarElectricity) || 0 }
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-8">
      {/* Top Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-semibold border border-slate-300 transition shadow-sm cursor-pointer"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-600 rounded-xl border border-amber-300">
              <Sun size={24} />
            </span>
            Solar Facility Dashboard
          </h1>
          <p className="text-xs text-slate-500">CTL Production, EV Charging & Solar Energy Monitoring</p>
        </div>
      </div>

      {/* Row 2: Date Selector + 2 Colorful Rectangular Buttons (Save & YoY) */}
      <div className="mt-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-300 px-4 py-2 rounded-xl">
          <Calendar size={18} className="text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Select Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1 font-bold text-xs text-slate-800 outline-none cursor-pointer"
          />
        </div>

        {/* 2 Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition cursor-pointer"
          >
            <Save size={18} /> Save Data
          </button>

          <button
            onClick={() => navigate('/solar/yoy')}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-md shadow-amber-200 transition cursor-pointer"
          >
            <TrendingUp size={18} /> YoY Comparison
          </button>
        </div>
      </div>

      {/* Row 3: 3 COLORFUL INPUT BLOCKS */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Block 1: CTL */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">Unit: MT</span>
            <Factory size={26} className="text-white/80" />
          </div>
          <div className="my-4">
            <h3 className="text-sm font-bold text-white/90 uppercase tracking-wide">1. CTL Production</h3>
            <p className="text-[11px] text-white/70">Production Output</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-white/80 block mb-1">Enter Production (MT):</label>
            <input
              type="number"
              value={ctlProduction}
              onChange={(e) => setCtlProduction(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full bg-white text-slate-800 font-bold text-lg px-4 py-2.5 rounded-xl outline-none shadow-inner border border-white"
            />
          </div>
        </div>

        {/* Block 2: EV Station */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">Unit: kWh</span>
            <BatteryCharging size={26} className="text-white/80" />
          </div>
          <div className="my-4">
            <h3 className="text-sm font-bold text-white/90 uppercase tracking-wide">2. EV Station</h3>
            <p className="text-[11px] text-white/70">Electricity Consumption</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-white/80 block mb-1">Enter Electricity (kWh):</label>
            <input
              type="number"
              value={evStationElectricity}
              onChange={(e) => setEvStationElectricity(e.target.value)}
              placeholder="e.g. 12000"
              className="w-full bg-white text-slate-800 font-bold text-lg px-4 py-2.5 rounded-xl outline-none shadow-inner border border-white"
            />
          </div>
        </div>

        {/* Block 3: Solar Generation */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">Unit: kWh</span>
            <Sun size={26} className="text-white/80" />
          </div>
          <div className="my-4">
            <h3 className="text-sm font-bold text-white/90 uppercase tracking-wide">3. Solar Generation</h3>
            <p className="text-[11px] text-white/70">Electricity Generation</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-white/80 block mb-1">Enter Electricity (kWh):</label>
            <input
              type="number"
              value={solarElectricity}
              onChange={(e) => setSolarElectricity(e.target.value)}
              placeholder="e.g. 55000"
              className="w-full bg-white text-slate-800 font-bold text-lg px-4 py-2.5 rounded-xl outline-none shadow-inner border border-white"
            />
          </div>
        </div>
      </div>

      {/* Row 4: GRAPHICAL VISUALIZATIONS (BAR CHART + PIE CHART) */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-800">
              Live Monthly Parameter Comparison ({selectedMonth})
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              Telemetry Bar Chart
            </span>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graphData} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val, name, item) => [`${Number(val).toLocaleString()} ${item.payload.unit}`, 'Value']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {graphData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between mb-2 border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-800">
              Electricity Energy Split (kWh)
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              EV vs Solar
            </span>
          </div>

          <div style={{ width: '100%', height: 280, minHeight: 280 }}>
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                Enter EV Station & Solar values to view split chart
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
                    outerRadius={85}
                    innerRadius={45}
                    paddingAngle={3}
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name.includes('EV') ? '#10b981' : '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${Number(val).toLocaleString()} kWh`, 'Energy']} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
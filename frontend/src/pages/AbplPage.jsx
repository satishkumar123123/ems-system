import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Zap, 
  Flame, 
  Fuel, 
  Activity, 
  Factory, 
  Calendar,
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
  const dateInputRef = useRef(null);
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

  // 5 Distinct Colorful Theme Configurations with Vibrant Gradients
  const metricConfigs = {
    electricity: {
      title: 'Electricity',
      unit: 'kWh',
      icon: Zap,
      gradient: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
      shadowColor: 'rgba(2, 132, 199, 0.45)',
      borderColor: '#38bdf8',
      barColor: '#00e5ff',
      totalVal: abplData?.totals?.electricity || 0,
    },
    lpg: {
      title: 'LPG / LNG',
      unit: 'Kg',
      icon: Flame,
      gradient: 'linear-gradient(135deg, #d97706 0%, #f97316 100%)',
      shadowColor: 'rgba(245, 158, 11, 0.45)',
      borderColor: '#fbbf24',
      barColor: '#ffab00',
      totalVal: abplData?.totals?.lpg || 0,
    },
    hsd: {
      title: 'HSD',
      unit: 'Ltr',
      icon: Fuel,
      gradient: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)',
      shadowColor: 'rgba(244, 63, 94, 0.45)',
      borderColor: '#fb7185',
      barColor: '#ff1744',
      totalVal: abplData?.totals?.hsd || 0,
    },
    totalConsumption: {
      title: 'Total Consumption',
      unit: 'kWh Eq',
      icon: Activity,
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
      shadowColor: 'rgba(147, 51, 234, 0.45)',
      borderColor: '#c084fc',
      barColor: '#d500f9',
      totalVal: abplData?.totals?.totalConsumption || 0,
    },
    production: {
      title: 'Production',
      unit: 'MT',
      icon: Factory,
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      shadowColor: 'rgba(16, 185, 129, 0.45)',
      borderColor: '#34d399',
      barColor: '#00e676',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', backgroundColor: '#020617', minHeight: '100vh', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* 1. TOP BRAND HEADING: BACK BUTTON + "A B P L" (PURE INLINE STYLES WITH RADIANT GLOW) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '2px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Back button to return to home page */}
          <button 
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '7px 14px', color: '#38bdf8', fontSize: '12px', fontWeight: '900', cursor: 'pointer', marginRight: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
          >
            <ArrowLeft size={16} color="#38bdf8" /> Back
          </button>

          {/* Letter by Letter Colorful Logo */}
          <span style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '3px', color: '#00e5ff', textShadow: '0 0 16px rgba(0,229,255,0.8)' }}>A</span>
          <span style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '3px', color: '#00e676', textShadow: '0 0 16px rgba(0,230,118,0.8)' }}>B</span>
          <span style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '3px', color: '#ffea00', textShadow: '0 0 16px rgba(255,234,0,0.8)' }}>P</span>
          <span style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '3px', color: '#ff1744', textShadow: '0 0 16px rgba(255,23,68,0.8)' }}>L</span>

          <span style={{ marginLeft: '14px', padding: '4px 12px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', borderRadius: '8px', backgroundColor: '#1e1b4b', border: '1px solid #6366f1', color: '#a5b4fc', letterSpacing: '1px' }}>
            Master Facility
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px', fontWeight: '900' }}>
          <Activity size={16} color="#00e676" />
          <span style={{ color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Intelligence</span>
        </div>
      </div>

      {/* 2. TOP TOOLBAR: SELECT MONTH (STRICT SINGLE ROW FORCED) */}
      <div 
        className="no-print"
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          flexWrap: 'nowrap', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '12px', 
          width: '100%', 
          backgroundColor: '#0f172a', 
          padding: '12px 18px', 
          borderRadius: '16px', 
          border: '1px solid #1e293b',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          boxSizing: 'border-box'
        }}
      >
        {/* SELECT MONTH BLOCK (CYAN/BLUE GRADIENT) */}
        <div 
          style={{ 
            display: 'flex', 
            flexShrink: 0, 
            alignItems: 'center', 
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', 
            padding: '8px 14px', 
            borderRadius: '12px', 
            border: '1px solid #38bdf8', 
            boxShadow: '0 4px 12px rgba(2,132,199,0.35)' 
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', color: '#e0f2fe', letterSpacing: '1px' }}>
              Select Month
            </span>
            <div 
              onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '3px 10px', cursor: 'pointer', marginTop: '3px' }}
            >
              <input
                ref={dateInputRef}
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', fontWeight: '900', color: '#38bdf8', cursor: 'pointer' }}
              />
              <Calendar size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8' }}>Consolidated Plant View:</span>
          <span style={{ fontSize: '12px', fontWeight: '900', color: '#00e5ff', padding: '4px 10px', backgroundColor: 'rgba(0,229,255,0.1)', borderRadius: '8px', border: '1px solid rgba(0,229,255,0.3)' }}>
            {selectedMonth}
          </span>
        </div>
      </div>

      {/* 3. 5 COLORFUL METRIC CARDS IN 1 STRICT ROW (ZERO WRAPPING) */}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          flexWrap: 'nowrap', 
          gap: '14px', 
          width: '100%',
          overflowX: 'auto',
          paddingBottom: '6px',
          boxSizing: 'border-box'
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
                minWidth: '190px',
                background: conf.gradient,
                boxShadow: isSelected ? `0 10px 22px -3px ${conf.shadowColor}` : '0 4px 12px rgba(0,0,0,0.4)',
                transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                outline: isSelected ? '3px solid #ffffff' : 'none',
                outlineOffset: '-2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
                borderRadius: '16px',
                padding: '14px 16px',
                color: '#ffffff',
                border: `1px solid ${conf.borderColor}`,
                flexShrink: 0
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
                      margin: 0,
                      fontSize: '11px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'rgba(255, 255, 255, 0.95)',
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
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.85)', flexShrink: 0 }}>
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
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
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
        <div style={{ padding: '60px', textAlign: 'center', color: '#00e5ff', fontWeight: 900, fontSize: '14px', letterSpacing: '1px' }}>
          Aggregating telemetry from all plant databases...
        </div>
      ) : (
        <>
          {/* Active Metric Title Banner */}
          <div style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', padding: '16px 20px', borderRadius: '16px', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: activeConf.barColor, display: 'inline-block', boxShadow: `0 0 10px ${activeConf.barColor}` }}></span>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 900, letterSpacing: '0.5px', color: '#f8fafc' }}>
                Plant-Wise Distribution for <span style={{ color: activeConf.barColor }}>{activeConf.title}</span> ({selectedMonth})
              </h2>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8' }}>
              Consolidated Total: <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '14px' }}>{activeConf.totalVal.toLocaleString()} {activeConf.unit}</span>
            </div>
          </div>

          {/* 4. CHARTS VISUALIZATION GRID: BIG 360PX HEIGHT */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
            
            {/* 1. BAR GRAPH */}
            <div style={{ background: 'linear-gradient(180deg, #0f172a 0%, #082f49 100%)', border: '2px solid #0284c7', borderRadius: '24px', padding: '20px', boxShadow: '0 20px 30px rgba(2,132,199,0.2)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(56, 189, 248, 0.3)', paddingBottom: '12px', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#00e5ff' }}>Plant</span>
                  <span style={{ color: '#38bdf8' }}>Comparison</span>
                  <span style={{ color: '#facc15' }}>Bar Chart</span>
                </h3>
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#00e5ff', backgroundColor: 'rgba(0,229,255,0.15)', border: '1px solid #00e5ff', padding: '2px 8px', borderRadius: '12px' }}>
                  {activeConf.unit}
                </span>
              </div>

              <div style={{ width: '100%', height: 360 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
                    <Tooltip
                      formatter={(val) => [`${Number(val).toLocaleString()} ${activeConf.unit}`, activeConf.title]}
                      contentStyle={{ backgroundColor: '#030712', borderColor: '#0284c7', borderRadius: '14px', color: '#38bdf8', fontSize: '12px', fontWeight: 900 }}
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

            {/* 2. PIE CHART */}
            <div style={{ background: 'linear-gradient(180deg, #0f172a 0%, #4c1d95 100%)', border: '2px solid #7c3aed', borderRadius: '24px', padding: '20px', boxShadow: '0 20px 30px rgba(124,58,237,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(192, 132, 252, 0.3)', paddingBottom: '12px', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#d500f9' }}>Share</span>
                  <span style={{ color: '#e879f9' }}>&amp; Contribution</span>
                  <span style={{ color: '#f43f5e' }}>Percentage</span>
                </h3>
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#d500f9', backgroundColor: 'rgba(213,0,249,0.15)', border: '1px solid #d500f9', padding: '2px 8px', borderRadius: '12px' }}>
                  100% Split
                </span>
              </div>

              <div style={{ width: '100%', height: 360 }}>
                {pieData.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: 700 }}>
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
                        cy="48%"
                        outerRadius={115}
                        innerRadius={60}
                        paddingAngle={4}
                        labelLine={{ stroke: '#c084fc', strokeWidth: 1.5 }}
                        label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#020617" strokeWidth={2.5} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [`${Number(val).toLocaleString()} ${activeConf.unit}`, 'Share']}
                        contentStyle={{ backgroundColor: '#030712', borderColor: '#7c3aed', borderRadius: '14px', color: '#c084fc', fontSize: '12px', fontWeight: 900 }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        iconType="circle"
                        formatter={(val) => <span style={{ color: '#d8b4fe', fontWeight: 'bold', fontSize: '11px' }}>{val}</span>}
                        wrapperStyle={{ paddingTop: '10px' }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* 5. DETAILED DATA TABLE */}
          <div style={{ backgroundColor: '#020617', borderRadius: '16px', border: '2px solid #1e293b', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', backgroundColor: '#0f172a', borderBottom: '2px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#38bdf8' }}>
                Consolidated Breakdown Table — {selectedMonth}
              </h3>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>
                All Facilities Active
              </span>
            </div>

            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', minWidth: '900px', fontSize: '12px', textAlign: 'center', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#020617', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #000' }}>
                    <th style={{ backgroundColor: "#38bdf8", padding: "12px 14px", borderRight: "2px solid #000", textAlign: "left" }}>Plant / Facility</th>
                    <th style={{ backgroundColor: "#bbf7d0", padding: "12px 6px", borderRight: "2px solid #000" }}>Electricity (kWh)</th>
                    <th style={{ backgroundColor: "#fed7aa", padding: "12px 6px", borderRight: "2px solid #000" }}>LPG / LNG (Kg)</th>
                    <th style={{ backgroundColor: "#e9d5ff", padding: "12px 6px", borderRight: "2px solid #000" }}>HSD (Ltr)</th>
                    <th style={{ backgroundColor: "#a7f3d0", padding: "12px 6px", borderRight: "2px solid #000" }}>Total Consumption</th>
                    <th style={{ backgroundColor: "#bae6fd", padding: "12px 6px" }}>Production (MT)</th>
                  </tr>
                </thead>
                <tbody>
                  {(abplData?.plants || []).map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #1e293b', fontWeight: 'bold' }}>
                      <td style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 900, color: '#f8fafc', borderRight: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: p.color, display: 'inline-block' }}></span>
                        {p.name}
                      </td>
                      <td style={{ padding: '12px 6px', borderRight: '1px solid #1e293b', color: '#86efac' }}>{p.electricity ? p.electricity.toLocaleString() : '-'}</td>
                      <td style={{ padding: '12px 6px', borderRight: '1px solid #1e293b', color: '#fdba74' }}>{p.lpg ? p.lpg.toLocaleString() : '-'}</td>
                      <td style={{ padding: '12px 6px', borderRight: '1px solid #1e293b', color: '#d8b4fe' }}>{p.hsd ? p.hsd.toLocaleString() : '-'}</td>
                      <td style={{ padding: '12px 6px', borderRight: '1px solid #1e293b', color: '#67e8f9', fontWeight: 900 }}>{p.totalConsumption ? p.totalConsumption.toLocaleString() : '-'}</td>
                      <td style={{ padding: '12px 6px', color: '#7dd3fc' }}>{p.production ? p.production.toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                  
                  {/* Grand Total Row */}
                  <tr style={{ borderTop: '4px solid #000', color: '#000', fontWeight: 900, fontSize: '13px' }}>
                    <td style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '12px 14px', borderRight: '2px solid #000', textAlign: 'left', textTransform: 'uppercase' }}>
                      TOTAL ABPL CONSOLIDATED
                    </td>
                    <td style={{ backgroundColor: '#bbf7d0', padding: '12px 6px', borderRight: '2px solid #000' }}>
                      {abplData?.totals?.electricity ? abplData.totals.electricity.toLocaleString() : '-'}
                    </td>
                    <td style={{ backgroundColor: '#fed7aa', padding: '12px 6px', borderRight: '2px solid #000' }}>
                      {abplData?.totals?.lpg ? abplData.totals.lpg.toLocaleString() : '-'}
                    </td>
                    <td style={{ backgroundColor: '#e9d5ff', padding: '12px 6px', borderRight: '2px solid #000' }}>
                      {abplData?.totals?.hsd ? abplData.totals.hsd.toLocaleString() : '-'}
                    </td>
                    <td style={{ backgroundColor: '#a7f3d0', padding: '12px 6px', borderRight: '2px solid #000', fontSize: '14px' }}>
                      {abplData?.totals?.totalConsumption ? abplData.totals.totalConsumption.toLocaleString() : '-'}
                    </td>
                    <td style={{ backgroundColor: '#bae6fd', padding: '12px 6px' }}>
                      {abplData?.totals?.production ? abplData.totals.production.toLocaleString() : '-'}
                    </td>
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
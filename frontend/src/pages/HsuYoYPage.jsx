import '../styles/yoy.css';
import DataLoadNotice from '../components/DataLoadNotice';
import { API_BASE_URL, apiFetch } from '../config/api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Factory, BarChart3, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function HsuYoYPage() {
  const navigate = useNavigate();
  const selectedYear = '2026-27';
  const [selectedMetric, setSelectedMetric] = useState('electricity'); // 'electricity' | 'production' | 'totalConsumption'
  const [yoyData, setYoyData] = useState([]);
  const prevYearLabel = '2025-26';
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadAttempt, setReloadAttempt] = useState(0);


  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setLoadError('');
    setYoyData([]);
    apiFetch(`${API_BASE_URL}/api/hsu/yoy?year=${selectedYear}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (!data || data.source !== 'monthly-records' || data.financialYear !== selectedYear || data.prevFinancialYear !== prevYearLabel || !Array.isArray(data.data)) throw new Error('Saved monthly comparison is not available yet. Please retry.');
        setYoyData(data.data);

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

  const getMetricConfig = () => {
    switch (selectedMetric) {
      case 'electricity':
        return { label: 'Electricity Consumption (kWh)', colorPrev: '#a78bfa', colorCurr: '#22d3ee', unit: 'kWh' };
      case 'production':
        return { label: 'Production / Output', colorPrev: '#60a5fa', colorCurr: '#34d399', unit: '' };
      case 'totalConsumption':
        return { label: 'Total Consumption (kWh)', colorPrev: '#f472b6', colorCurr: '#fbbf24', unit: 'kWh' };
      default:
        return { label: 'Electricity Consumption (kWh)', colorPrev: '#94a3b8', colorCurr: '#4f46e5', unit: 'kWh' };
    }
  };

  const metricConfig = getMetricConfig();

  return (
    <div className="yoy-page">
      {/* Top Header Bar */}
      <div className="yoy-header">
        <div className="yoy-heading-group">
          <button
            onClick={() => navigate('/hsu')}
            className="yoy-back"
          >
            <ArrowLeft size={18} /> Back to HSU
          </button>
          <div>
            <h1 className="yoy-title">HSU Facility - YoY Analytics</h1>
            <p className="yoy-subtitle">April to March · Saved monthly data · Missing data = 0</p>
          </div>
        </div>

        {/* Financial Year Selector */}
        <div className="yoy-years">
          <Calendar size={18} className="yoy-calendar" />
          <span className="yoy-years-label">Financial Year:</span>
          <span className="yoy-years-value">FY 2025-26 vs FY 2026-27</span>
        </div>
      </div>

      {/* 3 Parameter Selection Bar */}
      <div className="yoy-toolbar">
        <span className="yoy-toolbar-label">Select Parameter to Compare:</span>
        <div className="yoy-metrics">
          <button
            onClick={() => setSelectedMetric('electricity')}
            className={`yoy-metric yoy-metric--electricity ${selectedMetric === 'electricity' ? 'is-active' : ''}`} aria-pressed={selectedMetric === 'electricity'}
          >
            <Zap size={16} /> Electricity (kWh)
          </button>

          <button
            onClick={() => setSelectedMetric('production')}
            className={`yoy-metric yoy-metric--production ${selectedMetric === 'production' ? 'is-active' : ''}`} aria-pressed={selectedMetric === 'production'}
          >
            <Factory size={16} /> Production / Output
          </button>

          <button
            onClick={() => setSelectedMetric('totalConsumption')}
            className={`yoy-metric yoy-metric--totalConsumption ${selectedMetric === 'totalConsumption' ? 'is-active' : ''}`} aria-pressed={selectedMetric === 'totalConsumption'}
          >
            <BarChart3 size={16} /> Total Consumption (kWh)
          </button>
        </div>
      </div>

      {/* 4 Fixed Equipment Rows (ZY-120 MILL, FD-200 MILL, OLIMPIA MILL, ZY-500 MILL+1800KWHF) */}
      <DataLoadNotice loading={loading} error={loadError} period={selectedYear} onRetry={() => setReloadAttempt(attempt => attempt + 1)} />
      {loading || loadError ? (
        null
      ) : (
        <div className="yoy-cards">
          {yoyData.map((item, idx) => {
            const chartData = item.monthlyData.map(m => ({
              month: m.month,
              [`FY ${prevYearLabel}`]: m[selectedMetric].prevYear,
              [`FY ${selectedYear}`]: m[selectedMetric].currYear,
            }));

            return (
              <div
                key={item.equipment}
                className="yoy-card"
              >
                <div className="yoy-card-header">
                  <div className="yoy-equipment">
                    <span className="yoy-equipment-number">
                      0{idx + 1}
                    </span>
                    <h2 className="yoy-equipment-name">
                      {item.equipment}
                    </h2>
                  </div>
                  <span className="yoy-metric-badge">
                    Showing: {metricConfig.label}
                  </span>
                </div>

                <div className="yoy-chart-scroll">
                <div className="yoy-chart-canvas">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#25354d" />
                      <XAxis interval={0} dataKey="month" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                      <Tooltip
                        formatter={(val, year) => [`${Number(val).toLocaleString()}${metricConfig.unit ? ` ${metricConfig.unit}` : ''}`, year]}
                        contentStyle={{ background: '#020617', borderRadius: '12px', border: '1px solid #475569', color: '#f8fafc', boxShadow: '0 12px 28px rgba(0,0,0,0.45)' }} labelStyle={{ color: '#f8fafc', fontWeight: 800 }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px', fontWeight: 700 }} />
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
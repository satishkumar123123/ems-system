import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  ArrowLeft, UploadCloud, Download, Save, TrendingUp,
  FileSpreadsheet, X, Calendar, Lock, XCircle, Activity
} from 'lucide-react';

// Equipment Definitions with distinct badges
const PERMANENT_EQUIPMENTS = [
  { equipment: "ZY-190 PLANK MILL", enpiUnit: "KwH/MT", labelBg: "#0284c7", textCol: "#ffffff" },
  { equipment: "DDF 95.0D", enpiUnit: "KwH/MT", labelBg: "#059669", textCol: "#ffffff" },
  { equipment: "ZY-140", enpiUnit: "KwH/MT", labelBg: "#d97706", textCol: "#ffffff" },
  { equipment: "GMT-1", enpiUnit: "KwH/MT", labelBg: "#ea580c", textCol: "#ffffff" },
  { equipment: "GMT-2", enpiUnit: "KwH/MT", labelBg: "#e11d48", textCol: "#ffffff" },
  { equipment: "GMT-4", enpiUnit: "KwH/MT", labelBg: "#0891b2", textCol: "#ffffff" },
  { equipment: "ZY-76 (LTZ)", enpiUnit: "KwH/MT", labelBg: "#9333ea", textCol: "#ffffff" },
  { equipment: "GMT-3", enpiUnit: "KwH/MT", labelBg: "#0d9488", textCol: "#ffffff" },
  { equipment: "ZY-76", enpiUnit: "KwH/MT", labelBg: "#c2410c", textCol: "#ffffff" },
  { equipment: "ZY-63", enpiUnit: "KwH/MT", labelBg: "#7c3aed", textCol: "#ffffff" },
  { equipment: "ZY-38", enpiUnit: "KwH/MT", labelBg: "#db2777", textCol: "#ffffff" },
  { equipment: "ZY-25", enpiUnit: "KwH/MT", labelBg: "#65a30d", textCol: "#ffffff" },
  { equipment: "CRS-1", enpiUnit: "KwH/MT", labelBg: "#38bdf8", textCol: "#000000" },
  { equipment: "CRS-2", enpiUnit: "KwH/MT", labelBg: "#4ade80", textCol: "#000000" },
  { equipment: "CRS-3", enpiUnit: "KwH/MT", labelBg: "#facc15", textCol: "#000000" },
  { equipment: "PUMP HOUSE", enpiUnit: "KwH/MT", labelBg: "#fb923c", textCol: "#000000" },
  { equipment: "COMPRESSOR", enpiUnit: "CFM/KWH", labelBg: "#22d3ee", textCol: "#000000" },
  { equipment: "OTHER AUX LOAD & works", enpiUnit: "KwH/MT", labelBg: "#c084fc", textCol: "#ffffff" }
];

// Fixed Solid Color Codes for Columns
const COL_COLORS = {
  index: "#f1f5f9",
  month: "#fef08a",
  electricity: "#bbf7d0",
  lpg: "#fed7aa",
  hsd: "#e9d5ff",
  total: "#a7f3d0",
  production: "#bae6fd",
  unit: "#ddd6fe",
  enpiVal: "#fbcfe8",
  wrt: "#fef08a",
};

const getInitialBlankRows = () => {
  return PERMANENT_EQUIPMENTS.map(pe => ({
    equipment: pe.equipment,
    electricity: '',
    lpg: '',
    hsd: '',
    totalConsumption: '',
    production: '',
    enpiUnit: pe.enpiUnit,
    enpiValue: '---',
    wrtKwh: ''
  }));
};

// Radiant Glowing Palette for Big Charts
const PIE_COLORS = [
  '#00e5ff', // Neon Cyan
  '#00e676', // Bright Green
  '#ffab00', // Amber
  '#ff1744', // Hot Red
  '#d500f9', // Vivid Purple
  '#00b0ff', // Vivid Blue
  '#f50057', // Deep Pink
  '#76ff03'  // Lime Accent
];

const SAVE_AUTH_PASSWORD = "1234";

export default function NarrowTubePage() {
  const navigate = useNavigate();
  const dateInputRef = useRef(null);

  const [selectedMonth, setSelectedMonth] = useState('2026-04');
  const [rows, setRows] = useState(getInitialBlankRows());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetchMonthData(selectedMonth);
  }, [selectedMonth]);

  const fetchMonthData = (month) => {
    setLoading(true);
    fetch(`http://localhost:5000/api/narrow-tube?month=${month}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.rows && data.rows.length > 0) {
          const merged = PERMANENT_EQUIPMENTS.map(pe => {
            const found = data.rows.find(r => r.equipment?.trim().toUpperCase() === pe.equipment.trim().toUpperCase());
            return found || {
              equipment: pe.equipment,
              electricity: '',
              lpg: '',
              hsd: '',
              totalConsumption: '',
              production: '',
              enpiUnit: pe.enpiUnit,
              enpiValue: '---',
              wrtKwh: ''
            };
          });
          setRows(merged);
        } else {
          setRows(getInitialBlankRows());
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setRows(getInitialBlankRows());
        setLoading(false);
      });
  };

  const handleCellChange = (idx, field, value) => {
    setRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };

      const elec = parseFloat(field === 'electricity' ? value : next[idx].electricity) || 0;
      const lpg = parseFloat(field === 'lpg' ? value : next[idx].lpg) || 0;
      const hsd = parseFloat(field === 'hsd' ? value : next[idx].hsd) || 0;
      const total = elec + lpg + hsd;

      if (field === 'electricity' || field === 'lpg' || field === 'hsd') {
        next[idx].totalConsumption = total > 0 ? total : '';
      }

      const prod = parseFloat(field === 'production' ? value : next[idx].production) || 0;
      const currentTotal = field === 'totalConsumption' ? (parseFloat(value) || 0) : total;
      if (prod > 0 && currentTotal > 0) {
        next[idx].enpiValue = (currentTotal / prod).toFixed(2);
      }

      return next;
    });
  };

  const totals = useMemo(() => {
    return rows.reduce((acc, curr) => ({
      electricity: acc.electricity + (Number(curr.electricity) || 0),
      lpg: acc.lpg + (Number(curr.lpg) || 0),
      hsd: acc.hsd + (Number(curr.hsd) || 0),
      totalConsumption: acc.totalConsumption + (Number(curr.totalConsumption) || 0),
      production: acc.production + (Number(curr.production) || 0),
      wrtKwh: acc.wrtKwh + (Number(curr.wrtKwh) || 0)
    }), { electricity: 0, lpg: 0, hsd: 0, totalConsumption: 0, production: 0, wrtKwh: 0 });
  }, [rows]);

  const totalEnpiVal = totals.production > 0 ? (totals.totalConsumption / totals.production).toFixed(2) : "0.00";

  // Pie Chart Data (COMPRESSOR, GMT-1, GMT-2, PUMP HOUSE + OTHERS)
  const getCategorizedData = (key) => {
    const mainKeys = ['COMPRESSOR', 'GMT-1', 'GMT-2', 'PUMP HOUSE'];
    let mainItems = [];
    let othersVal = 0;

    rows.forEach((r) => {
      let rawVal = r[key];
      let val = 0;
      if (typeof rawVal === 'number') {
        val = rawVal;
      } else if (typeof rawVal === 'string' && rawVal.trim() !== '' && rawVal !== '---') {
        val = parseFloat(rawVal.replace(/,/g, '')) || 0;
      }

      if (val > 0) {
        const eqName = (r.equipment || '').trim().toUpperCase();
        if (mainKeys.some(k => eqName === k.toUpperCase())) {
          mainItems.push({ name: r.equipment, value: Number(val.toFixed(2)) });
        } else {
          othersVal += val;
        }
      }
    });

    if (othersVal > 0) {
      mainItems.push({ name: 'OTHERS', value: Number(othersVal.toFixed(2)) });
    }
    return mainItems;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const parsedData = XLSX.utils.sheet_to_json(ws);

        if (parsedData.length > 0) {
          const mapped = PERMANENT_EQUIPMENTS.map(pe => {
            const found = parsedData.find(item => 
              (item["Process/Equipments"] || item["Equipment"] || item.equipment || "").trim().toUpperCase() === pe.equipment.trim().toUpperCase()
            );

            if (found) {
              return {
                equipment: pe.equipment,
                electricity: found["Electricity (Kwh)"] ?? found["Electricity"] ?? '',
                lpg: found["LPG ( Kg)"] ?? found["LPG (Kg)"] ?? found["LPG"] ?? '',
                hsd: found["HSD (Ltr)"] ?? found["HSD"] ?? '',
                totalConsumption: found["Total Consumption"] ?? '',
                production: found["Production (MT)"] ?? found["Production"] ?? '',
                enpiUnit: found["EnPI"] || pe.enpiUnit,
                enpiValue: found["EnPI Value(s)"] || found.enpiValue || "---",
                wrtKwh: found["% WRT to Total KWH"] ?? found["% WRT"] ?? ''
              };
            }

            return {
              equipment: pe.equipment,
              electricity: '',
              lpg: '',
              hsd: '',
              totalConsumption: '',
              production: '',
              enpiUnit: pe.enpiUnit,
              enpiValue: '---',
              wrtKwh: ''
            };
          });

          setRows(mapped);
          setShowUploader(false);
          alert('Narrow Tube Excel Data Uploaded Successfully! Click Save to store.');
        } else {
          alert('Excel file is empty!');
        }
      } catch (err) {
        alert('Failed to read Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadSample = () => {
    const exportData = PERMANENT_EQUIPMENTS.map(pe => {
      const existing = rows.find(r => r.equipment === pe.equipment);
      return {
        "Process/Equipments": pe.equipment,
        "Month-Year": selectedMonth,
        "Electricity (Kwh)": existing?.electricity !== '' ? existing?.electricity : "",
        "LPG ( Kg)": existing?.lpg !== '' ? existing?.lpg : "",
        "HSD (Ltr)": existing?.hsd !== '' ? existing?.hsd : "",
        "Total Consumption": existing?.totalConsumption !== '' ? existing?.totalConsumption : "",
        "Production (MT)": existing?.production !== '' ? existing?.production : "",
        "EnPI": pe.enpiUnit,
        "EnPI Value(s)": existing?.enpiValue !== '' ? existing?.enpiValue : "---",
        "% WRT to Total KWH": existing?.wrtKwh !== '' ? existing?.wrtKwh : ""
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Narrow_Tube_Facility");
    XLSX.writeFile(wb, `Narrow_Tube_Template_${selectedMonth}.xlsx`);
  };

  const executeSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/narrow-tube/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthYear: selectedMonth,
          rows,
          totals: {
            ...totals,
            enpiValue: Number(totalEnpiVal) || 0
          }
        })
      });
      const resData = await res.json();
      if (resData.success) {
        alert('Narrow Tube Data successfully saved in MongoDB Database!');
      } else {
        alert('Save error: ' + (resData.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error saving data: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (enteredPassword !== SAVE_AUTH_PASSWORD) {
      setPasswordError("Galat Password! Sahi password enter karein.");
      return;
    }
    setShowPasswordModal(false);
    await executeSave();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', backgroundColor: '#020617', minHeight: '100vh', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* 1. TOP BRAND HEADING: BACK BUTTON + "N A R R O W   T U B E" */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '2px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Back button to return to home/first page */}
          <button 
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '7px 14px', color: '#38bdf8', fontSize: '12px', fontWeight: '900', cursor: 'pointer', marginRight: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
          >
            <ArrowLeft size={16} color="#38bdf8" /> Back
          </button>

          {/* Letter by Letter Colorful Logo */}
          <span style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '2px', color: '#00e5ff', textShadow: '0 0 16px rgba(0,229,255,0.8)' }}>N</span>
          <span style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '2px', color: '#00e676', textShadow: '0 0 16px rgba(0,230,118,0.8)' }}>A</span>
          <span style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '2px', color: '#ffea00', textShadow: '0 0 16px rgba(255,234,0,0.8)' }}>R</span>
          <span style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '2px', color: '#ff6d00', textShadow: '0 0 16px rgba(255,109,0,0.8)' }}>R</span>
          <span style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '2px', color: '#ff1744', textShadow: '0 0 16px rgba(255,23,68,0.8)' }}>O</span>
          <span style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '2px', color: '#d500f9', textShadow: '0 0 16px rgba(213,0,249,0.8)' }}>W</span>
          <span style={{ margin: '0 6px' }}></span>
          <span style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '2px', color: '#38bdf8', textShadow: '0 0 16px rgba(56,189,248,0.8)' }}>T</span>
          <span style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '2px', color: '#4ade80', textShadow: '0 0 16px rgba(74,222,128,0.8)' }}>U</span>
          <span style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '2px', color: '#facc15', textShadow: '0 0 16px rgba(250,204,21,0.8)' }}>B</span>
          <span style={{ fontSize: '38px', fontWeight: '900', letterSpacing: '2px', color: '#fb923c', textShadow: '0 0 16px rgba(251,146,60,0.8)' }}>E</span>

          <span style={{ marginLeft: '12px', padding: '4px 12px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', borderRadius: '8px', backgroundColor: '#1e1b4b', border: '1px solid #6366f1', color: '#a5b4fc', letterSpacing: '1px' }}>
            NTD Facility
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px', fontWeight: '900' }}>
          <Activity size={16} color="#00e676" />
          <span style={{ color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Monitoring</span>
        </div>
      </div>

      {/* 2. 5 ACTION BLOCKS - STRICT SINGLE ROW FORCED (ZERO WRAPPING) */}
      <div 
        className="no-print"
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          flexWrap: 'nowrap', 
          alignItems: 'center', 
          gap: '12px', 
          width: '100%', 
          overflowX: 'auto', 
          backgroundColor: '#0f172a', 
          padding: '12px', 
          borderRadius: '16px', 
          border: '1px solid #1e293b',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          boxSizing: 'border-box'
        }}
      >
        {/* BLOCK 1: SELECT MONTH (CYAN / BLUE GRADIENT) */}
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

        {/* BLOCK 2: UPLOAD EXCEL (EMERALD GREEN GRADIENT) */}
        <button 
          onClick={() => setShowUploader((o) => !o)}
          style={{ 
            display: 'flex', 
            flexShrink: 0, 
            alignItems: 'center', 
            gap: '8px', 
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 
            color: '#ffffff', 
            fontWeight: '900', 
            fontSize: '12px', 
            padding: '12px 18px', 
            borderRadius: '12px', 
            border: '1px solid #34d399', 
            boxShadow: '0 4px 12px rgba(5,150,105,0.35)', 
            cursor: 'pointer', 
            whiteSpace: 'nowrap' 
          }}
        >
          <UploadCloud size={16} strokeWidth={2.5} color="#ffffff" />
          <span>Upload Excel</span>
        </button>

        {/* BLOCK 3: SAMPLE EXCEL (AMBER / ORANGE GRADIENT) */}
        <button 
          onClick={handleDownloadSample}
          style={{ 
            display: 'flex', 
            flexShrink: 0, 
            alignItems: 'center', 
            gap: '8px', 
            background: 'linear-gradient(135deg, #d97706 0%, #f97316 100%)', 
            color: '#ffffff', 
            fontWeight: '900', 
            fontSize: '12px', 
            padding: '12px 18px', 
            borderRadius: '12px', 
            border: '1px solid #fbbf24', 
            boxShadow: '0 4px 12px rgba(217,119,6,0.35)', 
            cursor: 'pointer', 
            whiteSpace: 'nowrap' 
          }}
        >
          <Download size={16} strokeWidth={2.5} color="#ffffff" />
          <span>Sample Excel</span>
        </button>

        {/* BLOCK 4: SAVE (ROYAL PURPLE GRADIENT) */}
        <button 
          onClick={() => {
            setPasswordError("");
            setEnteredPassword("");
            setShowPasswordModal(true);
          }}
          disabled={saving}
          style={{ 
            display: 'flex', 
            flexShrink: 0, 
            alignItems: 'center', 
            gap: '8px', 
            background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)', 
            color: '#ffffff', 
            fontWeight: '900', 
            fontSize: '12px', 
            padding: '12px 20px', 
            borderRadius: '12px', 
            border: '1px solid #c084fc', 
            boxShadow: '0 4px 12px rgba(124,58,237,0.35)', 
            cursor: 'pointer', 
            whiteSpace: 'nowrap',
            opacity: saving ? 0.5 : 1
          }}
        >
          <Save size={16} strokeWidth={2.5} color="#ffffff" />
          <span>{saving ? "Saving…" : "Save Data"}</span>
        </button>

        {/* BLOCK 5: YOY ANALYTICS (ROSE / PINK GRADIENT) */}
        <button 
          onClick={() => navigate('/narrow-tube/yoy')}
          style={{ 
            display: 'flex', 
            flexShrink: 0, 
            alignItems: 'center', 
            gap: '8px', 
            background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)', 
            color: '#ffffff', 
            fontWeight: '900', 
            fontSize: '12px', 
            padding: '12px 18px', 
            borderRadius: '12px', 
            border: '1px solid #fb7185', 
            boxShadow: '0 4px 12px rgba(225,29,72,0.35)', 
            cursor: 'pointer', 
            whiteSpace: 'nowrap' 
          }}
        >
          <TrendingUp size={16} strokeWidth={2.5} color="#ffffff" />
          <span>YoY Analytics</span>
        </button>
      </div>

      {/* PASSWORD CONFIRMATION MODAL */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: '#0f172a', border: '2px solid #6366f1', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '380px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #1e293b', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <Lock size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Authorization Required
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#fbbf24', fontWeight: 'bold' }}>
                  Data save karne ke liye password (1234) enter karein.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#a5b4fc', marginBottom: '6px' }}>
                  Enter Password
                </label>
                <input
                  type="password"
                  autoFocus
                  value={enteredPassword}
                  onChange={(e) => {
                    setEnteredPassword(e.target.value);
                    setPasswordError("");
                  }}
                  placeholder="••••"
                  style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', fontWeight: 'bold', color: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                />
                {passwordError && (
                  <p style={{ margin: '6px 0 0 0', fontSize: '11px', fontWeight: 'bold', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={13} /> {passwordError}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid #1e293b' }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', color: '#f43f5e', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', backgroundColor: '#4f46e5', color: '#ffffff', borderRadius: '10px', fontSize: '12px', fontWeight: '900', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)' }}
                >
                  Verify &amp; Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DYNAMIC UPLOAD MODAL */}
      {showUploader && (
        <div style={{ padding: '16px', border: '2px dashed #10b981', borderRadius: '16px', backgroundColor: 'rgba(6, 78, 59, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <FileSpreadsheet size={26} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '900', color: '#34d399', textTransform: 'uppercase' }}>Select Excel (.xlsx, .xls) File</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 'bold', color: '#99f6e4' }}>Values automatically map to the {selectedMonth} dataset.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              style={{ fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}
            />
            <button 
              onClick={() => setShowUploader(false)}
              style={{ padding: '6px', color: '#f43f5e', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* SOLID COLORFUL TABLE */}
      <div style={{ backgroundColor: '#020617', borderRadius: '16px', border: '2px solid #1e293b', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}>
        {loading && (
          <div style={{ padding: '10px', backgroundColor: '#4f46e5', color: '#fef08a', textAlign: 'center', fontWeight: '900', fontSize: '12px' }}>
            Loading data for {selectedMonth}…
          </div>
        )}

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', minWidth: '1300px', fontSize: '12px', textAlign: 'center', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            
            {/* STRICT COLUMN SIZING */}
            <colgroup>
              <col style={{ width: "45px" }} />  {/* # */}
              <col style={{ width: "185px" }} /> {/* Equipment */}
              <col style={{ width: "190px" }} /> {/* Month (BADA KIYA GAYA) */}
              <col style={{ width: "135px" }} /> {/* Electricity */}
              <col style={{ width: "75px" }} />  {/* LPG (CHOTA KIYA GAYA) */}
              <col style={{ width: "110px" }} /> {/* HSD */}
              <col style={{ width: "140px" }} /> {/* Total Consumption */}
              <col style={{ width: "125px" }} /> {/* Production */}
              <col style={{ width: "100px" }} /> {/* Unit */}
              <col style={{ width: "115px" }} /> {/* EnPI Value */}
              <col style={{ width: "125px" }} /> {/* % WRT */}
            </colgroup>

            {/* HEADERS */}
            <thead>
              <tr style={{ color: '#020617', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #000' }}>
                <th style={{ backgroundColor: "#94a3b8", padding: "12px 6px", borderRight: "2px solid #000" }}>#</th>
                <th style={{ backgroundColor: "#38bdf8", padding: "12px 8px", borderRight: "2px solid #000", textAlign: "left" }}>Parameters / Equipment</th>
                <th style={{ backgroundColor: "#fde047", padding: "12px 6px", borderRight: "2px solid #000" }}>Month-Year</th>
                <th style={{ backgroundColor: "#4ade80", padding: "12px 6px", borderRight: "2px solid #000" }}>Electricity (kWh)</th>
                <th style={{ backgroundColor: "#fb923c", padding: "12px 4px", borderRight: "2px solid #000" }}>LPG (Kg)</th>
                <th style={{ backgroundColor: "#c084fc", padding: "12px 6px", borderRight: "2px solid #000" }}>HSD (Ltr)</th>
                <th style={{ backgroundColor: "#2dd4bf", padding: "12px 6px", borderRight: "2px solid #000" }}>Total Consumption</th>
                <th style={{ backgroundColor: "#60a5fa", padding: "12px 6px", borderRight: "2px solid #000" }}>Production (MT)</th>
                <th style={{ backgroundColor: "#a5b4fc", padding: "12px 6px", borderRight: "2px solid #000" }}>EnPI Unit</th>
                <th style={{ backgroundColor: "#f472b6", padding: "12px 6px", borderRight: "2px solid #000" }}>EnPI Value(s)</th>
                <th style={{ backgroundColor: "#facc15", padding: "12px 6px" }}>% WRT to Total</th>
              </tr>
            </thead>

            {/* ROW CELLS */}
            <tbody>
              {rows.map((r, idx) => {
                const config = PERMANENT_EQUIPMENTS[idx] || {};

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #000', fontWeight: 'bold' }}>
                    {/* Index */}
                    <td style={{ backgroundColor: COL_COLORS.index, padding: '10px 4px', borderRight: '2px solid #000', color: '#0f172a', fontWeight: '900' }}>
                      {idx + 1}
                    </td>

                    {/* Parameter / Equipment Name */}
                    <td style={{ backgroundColor: config.labelBg || '#0284c7', color: config.textCol || '#ffffff', padding: '10px 8px', borderRight: '2px solid #000', textAlign: 'left', fontWeight: '900', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.equipment}
                    </td>

                    {/* Month Column (Expanded) */}
                    <td style={{ backgroundColor: COL_COLORS.month, padding: '8px', borderRight: '2px solid #000', color: '#78350f', fontWeight: '900' }}>
                      {selectedMonth}
                    </td>

                    {/* Electricity Column */}
                    <td style={{ backgroundColor: COL_COLORS.electricity, padding: '6px', borderRight: '2px solid #000' }}>
                      <input 
                        type="number"
                        value={r.electricity}
                        onChange={(e) => handleCellChange(idx, 'electricity', e.target.value)}
                        placeholder="—"
                        style={{ width: '100%', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #065f46', borderRadius: '6px', padding: '4px 2px', fontWeight: '900', color: '#064e3b', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </td>

                    {/* LPG Column (Reduced to 75px) */}
                    <td style={{ backgroundColor: COL_COLORS.lpg, padding: '4px', borderRight: '2px solid #000' }}>
                      <input 
                        type="number"
                        value={r.lpg}
                        onChange={(e) => handleCellChange(idx, 'lpg', e.target.value)}
                        placeholder="—"
                        style={{ width: '100%', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #9a3412', borderRadius: '6px', padding: '4px 1px', fontWeight: '900', color: '#7c2d12', outline: 'none', boxSizing: 'border-box', fontSize: '11px' }}
                      />
                    </td>

                    {/* HSD Column */}
                    <td style={{ backgroundColor: COL_COLORS.hsd, padding: '6px', borderRight: '2px solid #000' }}>
                      <input 
                        type="number"
                        value={r.hsd}
                        onChange={(e) => handleCellChange(idx, 'hsd', e.target.value)}
                        placeholder="—"
                        style={{ width: '100%', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #6b21a8', borderRadius: '6px', padding: '4px 2px', fontWeight: '900', color: '#581c87', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </td>

                    {/* Total Consumption Column */}
                    <td style={{ backgroundColor: COL_COLORS.total, padding: '8px', borderRight: '2px solid #000', color: '#064e3b', fontWeight: '900' }}>
                      {r.totalConsumption !== '' && r.totalConsumption != null ? Number(r.totalConsumption).toLocaleString() : '—'}
                    </td>

                    {/* Production Column */}
                    <td style={{ backgroundColor: COL_COLORS.production, padding: '6px', borderRight: '2px solid #000' }}>
                      <input 
                        type="number"
                        value={r.production}
                        onChange={(e) => handleCellChange(idx, 'production', e.target.value)}
                        placeholder="—"
                        style={{ width: '100%', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #0369a1', borderRadius: '6px', padding: '4px 2px', fontWeight: '900', color: '#0c4a6e', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </td>

                    {/* EnPI Unit Column */}
                    <td style={{ backgroundColor: COL_COLORS.unit, padding: '8px', borderRight: '2px solid #000', color: '#312e81', fontWeight: '900' }}>
                      {r.enpiUnit}
                    </td>

                    {/* EnPI Value Column */}
                    <td style={{ backgroundColor: COL_COLORS.enpiVal, padding: '8px', borderRight: '2px solid #000', color: '#831843', fontWeight: '900' }}>
                      {r.enpiValue !== '' && r.enpiValue != null ? r.enpiValue : '—'}
                    </td>

                    {/* % WRT to Total KWH Column */}
                    <td style={{ backgroundColor: COL_COLORS.wrt, padding: '8px', color: '#713f12', fontWeight: '900' }}>
                      {r.wrtKwh !== '' && r.wrtKwh != null ? (typeof r.wrtKwh === 'number' ? r.wrtKwh.toFixed(4) : r.wrtKwh) : '—'}
                    </td>
                  </tr>
                );
              })}

              {/* TOTAL SUMMARY ROW */}
              <tr style={{ borderTop: '4px solid #000', color: '#000', fontWeight: '900', fontSize: '13px' }}>
                <td style={{ backgroundColor: COL_COLORS.index, padding: '12px 6px', borderRight: '2px solid #000' }}>∑</td>
                <td style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '12px 8px', borderRight: '2px solid #000', textAlign: 'left', textTransform: 'uppercase' }}>
                  Total NTD Facility
                </td>
                <td style={{ backgroundColor: COL_COLORS.month, padding: '12px 6px', borderRight: '2px solid #000' }}>{selectedMonth}</td>
                <td style={{ backgroundColor: COL_COLORS.electricity, padding: '12px 6px', borderRight: '2px solid #000' }}>{totals.electricity > 0 ? totals.electricity.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.lpg, padding: '12px 4px', borderRight: '2px solid #000' }}>{totals.lpg > 0 ? totals.lpg.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.hsd, padding: '12px 6px', borderRight: '2px solid #000' }}>{totals.hsd > 0 ? totals.hsd.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.total, padding: '12px 6px', borderRight: '2px solid #000' }}>{totals.totalConsumption > 0 ? totals.totalConsumption.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.production, padding: '12px 6px', borderRight: '2px solid #000' }}>{totals.production > 0 ? totals.production.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.unit, padding: '12px 6px', borderRight: '2px solid #000' }}></td>
                <td style={{ backgroundColor: COL_COLORS.enpiVal, padding: '12px 6px', borderRight: '2px solid #000' }}>{totals.production > 0 ? totalEnpiVal : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.wrt, padding: '12px 6px' }}>{totals.totalConsumption > 0 ? '100%' : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. CHARTS ANALYTICS GRID: BIG, GLOWING & COLORFUL TITLES */}
      <div style={{ marginTop: '8px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '20px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#d946ef', fontSize: '26px' }}>▍</span> 
          <span style={{ color: '#00e5ff', textShadow: '0 0 12px rgba(0,229,255,0.6)' }}>NARROW</span>
          <span style={{ color: '#38bdf8' }}>TUBE</span>
          <span style={{ color: '#facc15' }}>&amp;</span>
          <span style={{ color: '#fb923c', textShadow: '0 0 12px rgba(251,146,60,0.6)' }}>CONSUMPTION</span>
          <span style={{ color: '#4ade80', textShadow: '0 0 12px rgba(74,222,128,0.6)' }}>ANALYTICS</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          
          {/* CHART 1: TOTAL CONSUMPTION BREAKDOWN */}
          <div style={{ background: 'linear-gradient(180deg, #0f172a 0%, #082f49 100%)', border: '2px solid #0284c7', borderRadius: '24px', padding: '20px', boxShadow: '0 20px 30px rgba(2,132,199,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(56, 189, 248, 0.3)', paddingBottom: '12px', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#00e5ff' }}>Total</span>
                <span style={{ color: '#38bdf8' }}>Consumption</span>
                <span style={{ color: '#facc15' }}>Breakdown</span>
              </h3>
              <span style={{ fontSize: '11px', fontWeight: '900', color: '#00e5ff', backgroundColor: 'rgba(0,229,255,0.15)', border: '1px solid #00e5ff', padding: '2px 8px', borderRadius: '12px' }}>
                kWh
              </span>
            </div>

            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getCategorizedData('totalConsumption')}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    outerRadius={115}
                    innerRadius={60}
                    paddingAngle={4}
                    labelLine={{ stroke: '#38bdf8', strokeWidth: 1.5 }}
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  >
                    {getCategorizedData('totalConsumption').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#020617" strokeWidth={2.5} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#030712', borderColor: '#0284c7', borderRadius: '14px', color: '#38bdf8', fontSize: '12px', fontWeight: '900' }}
                    formatter={(value) => [`${Number(value).toLocaleString()} kWh`, 'Consumption']} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle"
                    formatter={(val) => <span style={{ color: '#7dd3fc', fontWeight: 'bold', fontSize: '11px' }}>{val}</span>}
                    wrapperStyle={{ paddingTop: '10px' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 2: PRODUCTION BREAKDOWN */}
          <div style={{ background: 'linear-gradient(180deg, #0f172a 0%, #064e3b 100%)', border: '2px solid #059669', borderRadius: '24px', padding: '20px', boxShadow: '0 20px 30px rgba(5,150,105,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(52, 211, 153, 0.3)', paddingBottom: '12px', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#00e676' }}>Production</span>
                <span style={{ color: '#34d399' }}>Breakdown</span>
                <span style={{ color: '#a3e635' }}>(MT)</span>
              </h3>
              <span style={{ fontSize: '11px', fontWeight: '900', color: '#00e676', backgroundColor: 'rgba(0,230,118,0.15)', border: '1px solid #00e676', padding: '2px 8px', borderRadius: '12px' }}>
                MT
              </span>
            </div>

            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getCategorizedData('production')}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    outerRadius={115}
                    innerRadius={60}
                    paddingAngle={4}
                    labelLine={{ stroke: '#34d399', strokeWidth: 1.5 }}
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  >
                    {getCategorizedData('production').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} stroke="#020617" strokeWidth={2.5} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#030712', borderColor: '#059669', borderRadius: '14px', color: '#34d399', fontSize: '12px', fontWeight: '900' }}
                    formatter={(value) => [`${Number(value).toLocaleString()} MT`, 'Production']} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle"
                    formatter={(val) => <span style={{ color: '#86efac', fontWeight: 'bold', fontSize: '11px' }}>{val}</span>}
                    wrapperStyle={{ paddingTop: '10px' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 3: ENPI VALUE BREAKDOWN */}
          <div style={{ background: 'linear-gradient(180deg, #0f172a 0%, #4c1d95 100%)', border: '2px solid #7c3aed', borderRadius: '24px', padding: '20px', boxShadow: '0 20px 30px rgba(124,58,237,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(192, 132, 252, 0.3)', paddingBottom: '12px', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#d500f9' }}>EnPI</span>
                <span style={{ color: '#e879f9' }}>Value</span>
                <span style={{ color: '#f43f5e' }}>Breakdown</span>
              </h3>
              <span style={{ fontSize: '11px', fontWeight: '900', color: '#d500f9', backgroundColor: 'rgba(213,0,249,0.15)', border: '1px solid #d500f9', padding: '2px 8px', borderRadius: '12px' }}>
                Metric
              </span>
            </div>

            <div style={{ width: '100%', height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getCategorizedData('enpiValue')}
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
                    {getCategorizedData('enpiValue').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 4) % PIE_COLORS.length]} stroke="#020617" strokeWidth={2.5} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#030712', borderColor: '#7c3aed', borderRadius: '14px', color: '#c084fc', fontSize: '12px', fontWeight: '900' }}
                    formatter={(value) => [Number(value).toLocaleString(), 'EnPI Metric']} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle"
                    formatter={(val) => <span style={{ color: '#d8b4fe', fontWeight: 'bold', fontSize: '11px' }}>{val}</span>}
                    wrapperStyle={{ paddingTop: '10px' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
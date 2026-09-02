import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  UploadCloud, Download, Save, TrendingUp,
  FileSpreadsheet, X, Calendar, Lock, XCircle, Sparkles, Activity
} from 'lucide-react';

// Equipment Definitions with Badges
const PERMANENT_EQUIPMENTS = [
  { equipment: "6HI", enpiUnit: "KwH/MT", labelBg: "#0284c7", textCol: "#ffffff" },
  { equipment: "CGL", enpiUnit: "KwH/MT", labelBg: "#059669", textCol: "#ffffff" },
  { equipment: "CCL", enpiUnit: "KwH/MT", labelBg: "#d97706", textCol: "#ffffff" },
  { equipment: "HRS", enpiUnit: "KwH/MT", labelBg: "#ea580c", textCol: "#ffffff" },
  { equipment: "PICKLING", enpiUnit: "KwH", labelBg: "#e11d48", textCol: "#ffffff" },
  { equipment: "COMPRESSOR", enpiUnit: "Kwh", labelBg: "#0891b2", textCol: "#ffffff" },
  { equipment: "CHILLER", enpiUnit: "KwH/MT", labelBg: "#9333ea", textCol: "#ffffff" },
  { equipment: "TRIMMER", enpiUnit: "KwH/MT", labelBg: "#0d9488", textCol: "#ffffff" },
  { equipment: "RGM", enpiUnit: "KwH/MT", labelBg: "#c2410c", textCol: "#ffffff" },
  { equipment: "CRS", enpiUnit: "KwH/MT", labelBg: "#7c3aed", textCol: "#ffffff" },
  { equipment: "AUTO CTL", enpiUnit: "KwH/MT", labelBg: "#db2777", textCol: "#ffffff" },
  { equipment: "CORRUGATION", enpiUnit: "KwH/MT", labelBg: "#65a30d", textCol: "#ffffff" },
  { equipment: "OTHER AUX", enpiUnit: "KwH", labelBg: "#475569", textCol: "#ffffff" },
  { equipment: "MATERIAL HANDLING", enpiUnit: "KwH", labelBg: "#c026d3", textCol: "#ffffff" }
];

// Refined Column Pastel Colors
const COL_COLORS = {
  index: "#f1f5f9",
  month: "#fef08a",
  electricity: "#bbf7d0",
  lng: "#fed7aa",
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
    lng: '',
    hsd: '',
    totalConsumption: '',
    production: '',
    enpiUnit: pe.enpiUnit,
    enpiValue: '',
    wrtKwh: ''
  }));
};

// Vibrant Colors for Big Pie Charts
const PIE_COLORS = [
  '#38bdf8', // Cyan
  '#10b981', // Emerald Green
  '#f59e0b', // Amber
  '#f43f5e', // Rose Red
  '#a855f7', // Purple
  '#06b6d4', // Teal
  '#ec4899', // Pink
  '#84cc16'  // Lime
];

const SAVE_AUTH_PASSWORD = "1234";

export default function WiderPage() {
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
    fetch(`http://localhost:5000/api/wider?month=${month}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.rows && data.rows.length > 0) {
          const merged = PERMANENT_EQUIPMENTS.map(pe => {
            const found = data.rows.find(r => r.equipment?.trim().toUpperCase() === pe.equipment.trim().toUpperCase());
            return found || {
              equipment: pe.equipment,
              electricity: '',
              lng: '',
              hsd: '',
              totalConsumption: '',
              production: '',
              enpiUnit: pe.enpiUnit,
              enpiValue: '',
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
      const lng = parseFloat(field === 'lng' ? value : next[idx].lng) || 0;
      const hsd = parseFloat(field === 'hsd' ? value : next[idx].hsd) || 0;
      const total = elec + lng + hsd;

      if (field === 'electricity' || field === 'lng' || field === 'hsd') {
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
      lng: acc.lng + (Number(curr.lng) || 0),
      hsd: acc.hsd + (Number(curr.hsd) || 0),
      totalConsumption: acc.totalConsumption + (Number(curr.totalConsumption) || 0),
      production: acc.production + (Number(curr.production) || 0),
      wrtKwh: acc.wrtKwh + (Number(curr.wrtKwh) || 0)
    }), { electricity: 0, lng: 0, hsd: 0, totalConsumption: 0, production: 0, wrtKwh: 0 });
  }, [rows]);

  const totalEnpiVal = totals.production > 0 ? (totals.totalConsumption / totals.production).toFixed(2) : "";

  const getCategorizedData = (key) => {
    const mainKeys = ['6HI', 'CGL', 'CCL', 'COMPRESSOR'];
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
                lng: found["LNG ( Kwh)"] ?? found["LNG (Kwh)"] ?? found["LNG"] ?? '',
                hsd: found["HSD (Kwh)"] ?? found["HSD"] ?? '',
                totalConsumption: found["Total Consumption"] ?? '',
                production: found["Production (MT)"] ?? found["Production"] ?? '',
                enpiUnit: found["EnPI"] || found["EnPI Unit"] || pe.enpiUnit,
                enpiValue: found["EnPI Value(s)"] || found["EnPI Value"] || found.enpiValue || '',
                wrtKwh: found["% WRT to Total KWH"] ?? found["% WRT"] ?? ''
              };
            }

            return {
              equipment: pe.equipment,
              electricity: '',
              lng: '',
              hsd: '',
              totalConsumption: '',
              production: '',
              enpiUnit: pe.enpiUnit,
              enpiValue: '',
              wrtKwh: ''
            };
          });

          setRows(mapped);
          setShowUploader(false);
          alert('Excel Data Fetched Successfully! Click Save to store in Database.');
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
        "LNG ( Kwh)": existing?.lng !== '' ? existing?.lng : "",
        "HSD (Kwh)": existing?.hsd !== '' ? existing?.hsd : "",
        "Total Consumption": existing?.totalConsumption !== '' ? existing?.totalConsumption : "",
        "Production (MT)": existing?.production !== '' ? existing?.production : "",
        "EnPI": pe.enpiUnit,
        "EnPI Value(s)": existing?.enpiValue !== '' ? existing?.enpiValue : "",
        "% WRT to Total KWH": existing?.wrtKwh !== '' ? existing?.wrtKwh : ""
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Wider_Facility");
    XLSX.writeFile(wb, `Wider_Facility_Template_${selectedMonth}.xlsx`);
  };

  const executeSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/wider/save', {
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
        alert('Data successfully saved in MongoDB Database!');
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
    <div className="flex flex-col gap-6 p-6 bg-slate-950 min-h-screen text-slate-100 font-sans relative">

      {/* TOP BRAND HEADING: "W I D E R" (Har letter alag radiant neon color) */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-4xl font-black tracking-widest text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">W</span>
          <span className="text-4xl font-black tracking-widest text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]">I</span>
          <span className="text-4xl font-black tracking-widest text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">D</span>
          <span className="text-4xl font-black tracking-widest text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]">E</span>
          <span className="text-4xl font-black tracking-widest text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]">R</span>
          <span className="ml-3 px-3 py-1 text-xs font-black uppercase rounded-lg bg-indigo-950/80 border border-indigo-500/50 text-indigo-300">
            Facility System
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-black">
          <Activity size={16} className="text-emerald-400 animate-pulse" />
          <span className="text-teal-300 uppercase tracking-wide">Live Monitoring Dashboard</span>
        </div>
      </div>

      {/* 5-BLOCK ACTION ROW: ALL 5 BLOCKS HAVE DIFFERENT VIBRANT GRADIENTS IN ONE SINGLE LINE */}
      <div 
        className="no-print bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl overflow-x-auto"
        style={{ width: '100%' }}
      >
        <div 
          style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: '14px', minWidth: 'max-content' }}
        >
          
          {/* BLOCK 1: SELECT MONTH (Cyan / Sky Blue Gradient) */}
          <div 
            style={{ flexShrink: 0 }}
            className="flex items-center gap-2.5 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 p-2 px-3.5 rounded-xl border border-cyan-300/40 shadow-lg shadow-cyan-950/50"
          >
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-cyan-100 tracking-wider">Select Month</span>
              <div 
                onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
                className="flex items-center gap-2 bg-slate-950/70 border border-white/30 rounded-lg px-2.5 py-1 cursor-pointer hover:bg-slate-950/90 transition-all mt-0.5"
              >
                <input
                  ref={dateInputRef}
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-black text-cyan-300 focus:outline-none cursor-pointer"
                />
                <Calendar size={15} className="text-cyan-200 flex-shrink-0" />
              </div>
            </div>
          </div>

          {/* BLOCK 2: UPLOAD EXCEL (Emerald / Lime Gradient) */}
          <button 
            style={{ flexShrink: 0 }}
            onClick={() => setShowUploader((o) => !o)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-black text-xs px-4 py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-950/50 border border-emerald-300/40 cursor-pointer whitespace-nowrap"
          >
            <UploadCloud size={18} className="stroke-[2.5] text-emerald-100" />
            <span className="tracking-wide">Upload Excel</span>
          </button>

          {/* BLOCK 3: SAMPLE EXCEL (Amber / Orange Gradient) */}
          <button 
            style={{ flexShrink: 0 }}
            onClick={handleDownloadSample}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-white font-black text-xs px-4 py-3.5 rounded-xl transition-all shadow-lg shadow-orange-950/50 border border-amber-300/40 cursor-pointer whitespace-nowrap"
          >
            <Download size={18} className="stroke-[2.5] text-amber-100" />
            <span className="tracking-wide">Sample Excel</span>
          </button>

          {/* BLOCK 4: SAVE (Royal Purple / Violet / Fuchsia Gradient) */}
          <button 
            style={{ flexShrink: 0 }}
            onClick={() => {
              setPasswordError("");
              setEnteredPassword("");
              setShowPasswordModal(true);
            }}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 active:scale-95 text-white font-black text-xs px-5 py-3.5 rounded-xl transition-all shadow-lg shadow-purple-950/50 border border-purple-300/40 cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <Save size={18} className="stroke-[2.5] text-purple-100" />
            <span className="tracking-wide">{saving ? "Saving…" : "Save Data"}</span>
          </button>

          {/* BLOCK 5: YOY ANALYTICS (Rose / Hot Pink / Red Gradient) */}
          <button 
            style={{ flexShrink: 0 }}
            onClick={() => navigate('/wider/yoy')}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-500 via-pink-600 to-red-500 hover:from-rose-400 hover:to-pink-500 active:scale-95 text-white font-black text-xs px-5 py-3.5 rounded-xl transition-all shadow-lg shadow-rose-950/50 border border-pink-300/40 cursor-pointer whitespace-nowrap"
          >
            <TrendingUp size={18} className="stroke-[2.5] text-pink-100" />
            <span className="tracking-wide">YoY Analytics</span>
          </button>

        </div>
      </div>

      {/* PASSWORD CONFIRMATION MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
                <Lock size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wide">
                  Authorization Required
                </h3>
                <p className="text-[11px] text-amber-300 font-bold">
                  Data save karne ke liye password (1234) enter karein.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-teal-300 mb-1">
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
                  className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none"
                />
                {passwordError && (
                  <p className="text-[11px] font-bold text-rose-400 mt-1.5 flex items-center gap-1">
                    <XCircle size={13} /> {passwordError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
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
        <div className="p-4 border-2 border-dashed border-emerald-400 rounded-2xl bg-emerald-950/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/40">
              <FileSpreadsheet size={26} />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-300 uppercase">Select Excel (.xlsx, .xls) File</p>
              <p className="text-[11px] font-bold text-teal-200">Values automatically map to the {selectedMonth} dataset.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
            />
            <button 
              onClick={() => setShowUploader(false)}
              className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* SOLID COLORFUL TABLE */}
      <div className="bg-slate-950 rounded-2xl border-2 border-slate-800 shadow-2xl overflow-hidden">
        {loading && (
          <div className="p-2.5 bg-indigo-600 text-yellow-300 text-center font-black text-xs border-b-2 border-slate-900 animate-pulse">
            Loading data for {selectedMonth}…
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-center border-collapse table-fixed min-w-[1300px]">
            
            {/* STRICT COLUMN SIZING */}
            <colgroup>
              <col style={{ width: "45px" }} />  {/* # */}
              <col style={{ width: "175px" }} /> {/* Equipment */}
              <col style={{ width: "190px" }} /> {/* Month (BADA KIYA GAYA) */}
              <col style={{ width: "135px" }} /> {/* Electricity */}
              <col style={{ width: "70px" }} />  {/* LNG (CHOTA KIYA GAYA) */}
              <col style={{ width: "110px" }} /> {/* HSD */}
              <col style={{ width: "140px" }} /> {/* Total Consumption */}
              <col style={{ width: "125px" }} /> {/* Production */}
              <col style={{ width: "100px" }} /> {/* Unit */}
              <col style={{ width: "115px" }} /> {/* EnPI Value */}
              <col style={{ width: "125px" }} /> {/* % WRT */}
            </colgroup>

            {/* HEADERS */}
            <thead>
              <tr className="text-slate-950 font-black text-xs uppercase tracking-wider border-b-2 border-slate-900">
                <th style={{ backgroundColor: "#94a3b8" }} className="p-3 border-r-2 border-slate-900 text-center text-slate-950">#</th>
                <th style={{ backgroundColor: "#38bdf8" }} className="p-3 border-r-2 border-slate-900 text-left text-slate-950">
                  Parameters / Equipment
                </th>
                <th style={{ backgroundColor: "#fde047" }} className="p-3 border-r-2 border-slate-900 text-slate-950">
                  Month
                </th>
                <th style={{ backgroundColor: "#4ade80" }} className="p-3 border-r-2 border-slate-900 text-slate-950">
                  Electricity (kWh)
                </th>
                <th style={{ backgroundColor: "#fb923c" }} className="p-3 border-r-2 border-slate-900 text-slate-950">
                  LNG (kWh)
                </th>
                <th style={{ backgroundColor: "#c084fc" }} className="p-3 border-r-2 border-slate-900 text-slate-950">
                  HSD (kWh)
                </th>
                <th style={{ backgroundColor: "#2dd4bf" }} className="p-3 border-r-2 border-slate-900 text-slate-950">
                  Total Consumption
                </th>
                <th style={{ backgroundColor: "#60a5fa" }} className="p-3 border-r-2 border-slate-900 text-slate-950">
                  Production (MT)
                </th>
                <th style={{ backgroundColor: "#a5b4fc" }} className="p-3 border-r-2 border-slate-900 text-slate-950">
                  EnPI Unit
                </th>
                <th style={{ backgroundColor: "#f472b6" }} className="p-3 border-r-2 border-slate-900 text-slate-950">
                  EnPI Value(s)
                </th>
                <th style={{ backgroundColor: "#facc15" }} className="p-3 text-slate-950">
                  % WRT to Total
                </th>
              </tr>
            </thead>

            {/* ROW CELLS */}
            <tbody>
              {rows.map((r, idx) => {
                const config = PERMANENT_EQUIPMENTS[idx] || {};

                return (
                  <tr 
                    key={idx} 
                    className="border-b border-slate-900 font-bold"
                  >
                    {/* Index */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.index }}
                      className="p-2.5 border-r-2 border-slate-900 text-center font-black text-indigo-950 truncate"
                    >
                      {idx + 1}
                    </td>

                    {/* Parameter / Equipment Name */}
                    <td 
                      style={{ backgroundColor: config.labelBg, color: config.textCol }}
                      className="p-2.5 border-r-2 border-slate-900 text-left font-black tracking-wide text-xs truncate"
                    >
                      {r.equipment}
                    </td>

                    {/* Month Column (Expanded) */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.month }}
                      className="p-2 border-r-2 border-slate-900 font-black text-amber-950 truncate"
                    >
                      {selectedMonth}
                    </td>

                    {/* Electricity Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.electricity }}
                      className="p-1.5 border-r-2 border-slate-900"
                    >
                      <input 
                        type="number"
                        value={r.electricity}
                        onChange={(e) => handleCellChange(idx, 'electricity', e.target.value)}
                        placeholder="—"
                        className="w-full text-center bg-white/95 border border-emerald-800/40 rounded-lg py-1 font-black text-emerald-950 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600"
                      />
                    </td>

                    {/* LNG Column (Reduced to 70px) */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.lng }}
                      className="p-1 border-r-2 border-slate-900"
                    >
                      <input 
                        type="number"
                        value={r.lng}
                        onChange={(e) => handleCellChange(idx, 'lng', e.target.value)}
                        placeholder="—"
                        className="w-full text-center bg-white/95 border border-orange-800/40 rounded-lg py-1 font-black text-orange-950 outline-none focus:bg-white focus:ring-2 focus:ring-orange-600 text-xs px-0.5"
                      />
                    </td>

                    {/* HSD Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.hsd }}
                      className="p-1.5 border-r-2 border-slate-900"
                    >
                      <input 
                        type="number"
                        value={r.hsd}
                        onChange={(e) => handleCellChange(idx, 'hsd', e.target.value)}
                        placeholder="—"
                        className="w-full text-center bg-white/95 border border-purple-800/40 rounded-lg py-1 font-black text-purple-950 outline-none focus:bg-white focus:ring-2 focus:ring-purple-600"
                      />
                    </td>

                    {/* Total Consumption Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.total }}
                      className="p-2 border-r-2 border-slate-900 font-black text-emerald-950 text-xs truncate"
                    >
                      {r.totalConsumption !== '' && r.totalConsumption != null ? Number(r.totalConsumption).toLocaleString() : '—'}
                    </td>

                    {/* Production Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.production }}
                      className="p-1.5 border-r-2 border-slate-900"
                    >
                      <input 
                        type="number"
                        value={r.production}
                        onChange={(e) => handleCellChange(idx, 'production', e.target.value)}
                        placeholder="—"
                        className="w-full text-center bg-white/95 border border-sky-800/40 rounded-lg py-1 font-black text-sky-950 outline-none focus:bg-white focus:ring-2 focus:ring-sky-600"
                      />
                    </td>

                    {/* EnPI Unit Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.unit }}
                      className="p-2 border-r-2 border-slate-900 font-black text-indigo-950 truncate"
                    >
                      {r.enpiUnit}
                    </td>

                    {/* EnPI Value Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.enpiVal }}
                      className="p-2 border-r-2 border-slate-900 font-black text-pink-950 text-xs truncate"
                    >
                      {r.enpiValue !== '' && r.enpiValue != null ? r.enpiValue : '—'}
                    </td>

                    {/* % WRT to Total KWH Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.wrt }}
                      className="p-2 font-black text-amber-950 text-xs truncate"
                    >
                      {r.wrtKwh !== '' && r.wrtKwh != null ? (typeof r.wrtKwh === 'number' ? r.wrtKwh.toFixed(4) : r.wrtKwh) : '—'}
                    </td>
                  </tr>
                );
              })}

              {/* TOTAL FACILITY SUMMARY ROW */}
              <tr className="font-black text-xs border-t-4 border-slate-900 text-slate-950">
                <td style={{ backgroundColor: COL_COLORS.index }} className="p-3 border-r-2 border-slate-900 text-center font-black text-blue-900">∑</td>
                <td style={{ backgroundColor: '#0284c7' }} className="p-3 border-r-2 border-slate-900 text-left font-black tracking-wider uppercase text-white truncate">
                  Total Wider Facility
                </td>
                <td style={{ backgroundColor: COL_COLORS.month }} className="p-3 border-r-2 border-slate-900 font-black text-amber-950 truncate">{selectedMonth}</td>
                <td style={{ backgroundColor: COL_COLORS.electricity }} className="p-3 border-r-2 border-slate-900 font-black text-emerald-950 truncate">{totals.electricity > 0 ? totals.electricity.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.lng }} className="p-3 border-r-2 border-slate-900 font-black text-orange-950 truncate">{totals.lng > 0 ? totals.lng.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.hsd }} className="p-3 border-r-2 border-slate-900 font-black text-purple-950 truncate">{totals.hsd > 0 ? totals.hsd.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.total }} className="p-3 border-r-2 border-slate-900 text-sm font-black text-teal-950 truncate">{totals.totalConsumption > 0 ? totals.totalConsumption.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.production }} className="p-3 border-r-2 border-slate-900 font-black text-sky-950 truncate">{totals.production > 0 ? totals.production.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.unit }} className="p-3 border-r-2 border-slate-900"></td>
                <td style={{ backgroundColor: COL_COLORS.enpiVal }} className="p-3 border-r-2 border-slate-900 text-sm font-black text-pink-950 truncate">{totalEnpiVal || '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.wrt }} className="p-3 font-black text-yellow-950 truncate">{totals.totalConsumption > 0 ? '100%' : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CHARTS ANALYTICS GRID: ALL HEADINGS IN DISTINCT RADIANT COLORS */}
      <div>
        <h2 className="text-xl font-black mb-5 tracking-wide flex items-center gap-2">
          <span className="text-fuchsia-400 text-2xl animate-pulse">▍</span> 
          <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">WIDER</span>
          <span className="text-blue-400">FACILITY</span>
          <span className="text-amber-400">&amp;</span>
          <span className="text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]">CONSUMPTION</span>
          <span className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">ANALYTICS</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. TOTAL CONSUMPTION BREAKDOWN */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950/40 border-2 border-cyan-500/50 rounded-3xl p-5 shadow-2xl shadow-cyan-950/50 flex flex-col items-center backdrop-blur-md">
            <div className="w-full flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-2">
              <h3 className="text-sm font-black uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400 animate-ping mr-1"></span>
                <span className="text-cyan-400">Total</span>
                <span className="text-sky-300">Consumption</span>
                <span className="text-yellow-400">Breakdown</span>
              </h3>
              <span className="text-[11px] font-black text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-0.5 rounded-full">
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
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PIE_COLORS[index % PIE_COLORS.length]} 
                        stroke="#090d16" 
                        strokeWidth={2.5}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#021024', 
                      borderColor: '#38bdf8', 
                      borderRadius: '14px', 
                      color: '#38bdf8', 
                      fontSize: '12px', 
                      fontWeight: '900',
                      boxShadow: '0 10px 25px rgba(0, 200, 255, 0.2)'
                    }}
                    formatter={(value) => [`${Number(value).toLocaleString()} kWh`, 'Total Consumption']} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle"
                    formatter={(val) => <span style={{ color: '#67e8f9', fontWeight: 'bold', fontSize: '11px' }}>{val}</span>}
                    wrapperStyle={{ paddingTop: '10px' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. PRODUCTION BREAKDOWN */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/50 rounded-3xl p-5 shadow-2xl shadow-emerald-950/50 flex flex-col items-center backdrop-blur-md">
            <div className="w-full flex items-center justify-between border-b border-emerald-500/30 pb-3 mb-2">
              <h3 className="text-sm font-black uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400 animate-ping mr-1"></span>
                <span className="text-emerald-400">Production</span>
                <span className="text-teal-300">Breakdown</span>
                <span className="text-lime-400">(MT)</span>
              </h3>
              <span className="text-[11px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
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
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} 
                        stroke="#090d16" 
                        strokeWidth={2.5}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#032014', 
                      borderColor: '#10b981', 
                      borderRadius: '14px', 
                      color: '#6ee7b7', 
                      fontSize: '12px', 
                      fontWeight: '900',
                      boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)'
                    }}
                    formatter={(value) => [`${Number(value).toLocaleString()} MT`, 'Production Output']} 
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

          {/* 3. ENPI VALUE BREAKDOWN */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950/40 border-2 border-purple-500/50 rounded-3xl p-5 shadow-2xl shadow-purple-950/50 flex flex-col items-center backdrop-blur-md">
            <div className="w-full flex items-center justify-between border-b border-purple-500/30 pb-3 mb-2">
              <h3 className="text-sm font-black uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-md shadow-purple-400 animate-ping mr-1"></span>
                <span className="text-purple-400">EnPI</span>
                <span className="text-fuchsia-400">Value</span>
                <span className="text-pink-400">Breakdown</span>
              </h3>
              <span className="text-[11px] font-black text-pink-300 bg-purple-950/80 border border-purple-500/40 px-2.5 py-0.5 rounded-full">
                Index
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
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PIE_COLORS[(index + 4) % PIE_COLORS.length]} 
                        stroke="#090d16" 
                        strokeWidth={2.5}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1b0629', 
                      borderColor: '#c084fc', 
                      borderRadius: '14px', 
                      color: '#f0abfc', 
                      fontSize: '12px', 
                      fontWeight: '900',
                      boxShadow: '0 10px 25px rgba(192, 132, 252, 0.2)'
                    }}
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
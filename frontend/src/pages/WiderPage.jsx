import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  UploadCloud, Download, Save, TrendingUp,
  FileSpreadsheet, X, Calendar, Lock, XCircle
} from 'lucide-react';

// Equipment Definitions
const PERMANENT_EQUIPMENTS = [
  { equipment: "6HI", enpiUnit: "KwH/MT", labelBg: "#38bdf8", textCol: "#000000" },
  { equipment: "CGL", enpiUnit: "KwH/MT", labelBg: "#4ade80", textCol: "#000000" },
  { equipment: "CCL", enpiUnit: "KwH/MT", labelBg: "#facc15", textCol: "#000000" },
  { equipment: "HRS", enpiUnit: "KwH/MT", labelBg: "#fb923c", textCol: "#000000" },
  { equipment: "PICKLING", enpiUnit: "KwH", labelBg: "#f87171", textCol: "#000000" },
  { equipment: "COMPRESSOR", enpiUnit: "Kwh", labelBg: "#22d3ee", textCol: "#000000" },
  { equipment: "CHILLER", enpiUnit: "KwH/MT", labelBg: "#c084fc", textCol: "#000000" },
  { equipment: "TRIMMER", enpiUnit: "KwH/MT", labelBg: "#2dd4bf", textCol: "#000000" },
  { equipment: "RGM", enpiUnit: "KwH/MT", labelBg: "#fdba74", textCol: "#000000" },
  { equipment: "CRS", enpiUnit: "KwH/MT", labelBg: "#d8b4fe", textCol: "#000000" },
  { equipment: "AUTO CTL", enpiUnit: "KwH/MT", labelBg: "#f472b6", textCol: "#000000" },
  { equipment: "CORRUGATION", enpiUnit: "KwH/MT", labelBg: "#a3e635", textCol: "#000000" },
  { equipment: "OTHER AUX", enpiUnit: "KwH", labelBg: "#94a3b8", textCol: "#000000" },
  { equipment: "MATERIAL HANDLING", enpiUnit: "KwH", labelBg: "#e879f9", textCol: "#000000" }
];

// Fixed Solid Color Codes for Columns
const COL_COLORS = {
  index: "#e2e8f0",
  month: "#fef3c7",
  electricity: "#bbf7d0",
  lng: "#fed7aa",
  hsd: "#e9d5ff",
  total: "#86efac",
  production: "#bae6fd",
  unit: "#c7d2fe",
  enpiVal: "#fbcfe8",
  wrt: "#fde68a",
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

const PIE_COLORS = ['#0284c7', '#16a34a', '#d97706', '#dc2626', '#9333ea', '#0891b2'];
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
    <div className="flex flex-col gap-6 p-6 bg-slate-100 min-h-screen text-slate-900 font-sans relative">

      {/* TOP TOOLBAR: Date -> Upload -> Sample -> Save -> YoY */}
      <div className="no-print flex items-center justify-start gap-3 overflow-x-auto bg-white border border-slate-200 rounded-2xl p-4 shadow-lg shadow-slate-200/70">
        
        {/* SELECT DATE / MONTH */}
        <div className="flex flex-shrink-0 flex-col gap-1 bg-gradient-to-br from-cyan-500 to-blue-600 border border-cyan-400 px-3 py-1.5 rounded-xl shadow-md shadow-cyan-200">
          <span className="text-[10px] uppercase font-black text-white tracking-wider">Select Month</span>
          <div 
            onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
            className="flex items-center gap-2 bg-white border border-white rounded-lg px-2.5 py-1 cursor-pointer hover:bg-cyan-50 transition-colors"
          >
            <input
              ref={dateInputRef}
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-900 focus:outline-none cursor-pointer"
            />
            <Calendar size={15} className="text-cyan-700 flex-shrink-0" />
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
        {/* 1. UPLOAD EXCEL */}
        <button 
          onClick={() => setShowUploader((o) => !o)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 active:scale-95 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition-all shadow-md shadow-emerald-200 cursor-pointer whitespace-nowrap"
        >
          <UploadCloud size={16} /> Upload Excel
        </button>

        {/* 2. SAMPLE EXCEL */}
        <button 
          onClick={handleDownloadSample}
          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 active:scale-95 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition-all shadow-md shadow-orange-200 cursor-pointer whitespace-nowrap"
        >
          <Download size={16} /> Sample Excel
        </button>

        {/* 3. SAVE */}
        <button 
          onClick={() => {
            setPasswordError("");
            setEnteredPassword("");
            setShowPasswordModal(true);
          }}
          disabled={saving}
          className="flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 active:scale-95 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition-all shadow-md shadow-purple-200 cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Saving…" : "Save"}
        </button>

        {/* 4. YOY ANALYTICS */}
        <button 
          onClick={() => navigate('/wider/yoy')}
          className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 active:scale-95 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition-all shadow-md shadow-pink-200 cursor-pointer whitespace-nowrap"
        >
          <TrendingUp size={16} /> YoY Analytics
        </button>
        </div>

      </div>

      {/* PASSWORD CONFIRMATION MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-slate-300 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-4">
              <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                <Lock size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Authorization Required
                </h3>
                <p className="text-[11px] text-slate-500">
                  Data save karne ke liye password (1234) enter karein.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
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
                  className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none"
                />
                {passwordError && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                    <XCircle size={13} /> {passwordError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
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
        <div className="p-5 border-2 border-dashed border-cyan-400 rounded-2xl bg-cyan-50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-cyan-200 text-cyan-800 rounded-xl">
              <FileSpreadsheet size={26} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase">Select Excel (.xlsx, .xls) File</p>
              <p className="text-[11px] font-semibold text-slate-600">Values map automatically to the {selectedMonth} dataset.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-cyan-700 file:text-white hover:file:bg-cyan-800 cursor-pointer"
            />
            <button 
              onClick={() => setShowUploader(false)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* FULL SOLID COLORFUL TABLE WITH DIRECT INLINE STYLES */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/50 overflow-hidden">
        {loading && (
          <div className="p-2.5 bg-blue-100 text-blue-900 text-center font-black text-xs border-b-2 border-slate-900 animate-pulse">
            Loading data for {selectedMonth}…
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            
            {/* 1. SOLID VIBRANT HEADERS */}
            <thead>
              <tr className="text-slate-950 font-black text-xs uppercase tracking-wider border-b-2 border-slate-300">
                <th style={{ backgroundColor: "#94a3b8" }} className="p-3.5 border-r-[2px] border-slate-900 w-12 text-center text-black">#</th>
                <th style={{ backgroundColor: "#00a8e8" }} className="p-3.5 border-r-[2px] border-slate-900 text-left min-w-[190px] text-black">
                  Parameters / Equipment
                </th>
                <th style={{ backgroundColor: "#facc15" }} className="p-3.5 border-r-[2px] border-slate-900 min-w-[155px] text-black">
                  Month
                </th>
                <th style={{ backgroundColor: "#34d399" }} className="p-3.5 border-r-[2px] border-slate-900 min-w-[130px] text-black">
                  Electricity (kWh)
                </th>
                <th style={{ backgroundColor: "#fb923c" }} className="p-3.5 border-r-[2px] border-slate-900 min-w-[82px] w-[82px] text-black">
                  LNG (kWh)
                </th>
                <th style={{ backgroundColor: "#c084fc" }} className="p-3.5 border-r-[2px] border-slate-900 min-w-[110px] text-black">
                  HSD (kWh)
                </th>
                <th style={{ backgroundColor: "#4ade80" }} className="p-3.5 border-r-[2px] border-slate-900 min-w-[140px] text-black">
                  Total Consumption
                </th>
                <th style={{ backgroundColor: "#38bdf8" }} className="p-3.5 border-r-[2px] border-slate-900 min-w-[120px] text-black">
                  Production (MT)
                </th>
                <th style={{ backgroundColor: "#a5b4fc" }} className="p-3.5 border-r-[2px] border-slate-900 min-w-[100px] text-black">
                  EnPI Unit
                </th>
                <th style={{ backgroundColor: "#f472b6" }} className="p-3.5 border-r-[2px] border-slate-900 min-w-[120px] text-black">
                  EnPI Value(s)
                </th>
                <th style={{ backgroundColor: "#fde047" }} className="p-3.5 min-w-[130px] text-black">
                  % WRT to Total
                </th>
              </tr>
            </thead>

            {/* 2. SOLID COLORFUL ROW CELLS */}
            <tbody>
              {rows.map((r, idx) => {
                const config = PERMANENT_EQUIPMENTS[idx] || {};

                return (
                  <tr 
                    key={idx} 
                    className="border-b border-slate-200 font-bold transition-colors hover:bg-blue-50/60"
                  >
                    
                    {/* Index */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.index }}
                      className="p-3 border-r-[2px] border-slate-900 text-center font-black text-slate-800"
                    >
                      {idx + 1}
                    </td>

                    {/* Parameter / Equipment Name */}
                    <td 
                      style={{ backgroundColor: config.labelBg, color: config.textCol }}
                      className="p-3 border-r-[2px] border-slate-900 text-left font-black tracking-wide text-xs"
                    >
                      {r.equipment}
                    </td>

                    {/* Month Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.month }}
                      className="p-2 border-r-[2px] border-slate-900 min-w-[155px] font-black text-slate-900"
                    >
                      {selectedMonth}
                    </td>

                    {/* Electricity Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.electricity }}
                      className="p-2 border-r-[2px] border-slate-900 min-w-[130px]"
                    >
                      <input 
                        type="number"
                        value={r.electricity}
                        onChange={(e) => handleCellChange(idx, 'electricity', e.target.value)}
                        placeholder="—"
                        className="w-full text-center bg-white/70 border border-emerald-700/40 rounded py-1 font-black text-slate-950 outline-none focus:bg-white"
                      />
                    </td>

                    {/* LNG Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.lng }}
                      className="p-2 border-r-[2px] border-slate-900 w-[82px] min-w-[82px]"
                    >
                      <input 
                        type="number"
                        value={r.lng}
                        onChange={(e) => handleCellChange(idx, 'lng', e.target.value)}
                        placeholder="—"
                        className="w-full text-center bg-white/70 border border-orange-700/40 rounded py-1 font-black text-slate-950 outline-none focus:bg-white"
                      />
                    </td>

                    {/* HSD Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.hsd }}
                      className="p-2 border-r-[2px] border-slate-900"
                    >
                      <input 
                        type="number"
                        value={r.hsd}
                        onChange={(e) => handleCellChange(idx, 'hsd', e.target.value)}
                        placeholder="—"
                        className="w-full text-center bg-white/70 border border-purple-700/40 rounded py-1 font-black text-slate-950 outline-none focus:bg-white"
                      />
                    </td>

                    {/* Total Consumption Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.total }}
                      className="p-2 border-r-[2px] border-slate-900 font-black text-slate-950 text-xs"
                    >
                      {r.totalConsumption !== '' && r.totalConsumption != null ? Number(r.totalConsumption).toLocaleString() : '—'}
                    </td>

                    {/* Production Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.production }}
                      className="p-2 border-r-[2px] border-slate-900"
                    >
                      <input 
                        type="number"
                        value={r.production}
                        onChange={(e) => handleCellChange(idx, 'production', e.target.value)}
                        placeholder="—"
                        className="w-full text-center bg-white/70 border border-sky-700/40 rounded py-1 font-black text-slate-950 outline-none focus:bg-white"
                      />
                    </td>

                    {/* EnPI Unit Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.unit }}
                      className="p-2 border-r-[2px] border-slate-900 font-black text-slate-950"
                    >
                      {r.enpiUnit}
                    </td>

                    {/* EnPI Value Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.enpiVal }}
                      className="p-2 border-r-[2px] border-slate-900 font-black text-slate-950 text-xs"
                    >
                      {r.enpiValue !== '' && r.enpiValue != null ? r.enpiValue : '—'}
                    </td>

                    {/* % WRT to Total KWH Column */}
                    <td 
                      style={{ backgroundColor: COL_COLORS.wrt }}
                      className="p-2 font-black text-slate-950 text-xs"
                    >
                      {r.wrtKwh !== '' && r.wrtKwh != null ? (typeof r.wrtKwh === 'number' ? r.wrtKwh.toFixed(4) : r.wrtKwh) : '—'}
                    </td>
                  </tr>
                );
              })}

              {/* 3. TOTAL FACILITY SUMMARY ROW */}
              <tr className="font-black text-xs border-t-[3px] border-slate-900 text-slate-950">
                <td style={{ backgroundColor: COL_COLORS.index }} className="p-3.5 border-r-[2px] border-slate-900 text-center font-black">∑</td>
                <td style={{ backgroundColor: '#0ea5e9' }} className="p-3.5 border-r-[2px] border-slate-900 text-left font-black tracking-wider uppercase text-white">
                  Total Wider Facility
                </td>
                <td style={{ backgroundColor: COL_COLORS.month }} className="p-3.5 border-r-[2px] border-slate-900 min-w-[155px] font-bold">{selectedMonth}</td>
                <td style={{ backgroundColor: COL_COLORS.electricity }} className="p-3.5 border-r-[2px] border-slate-900">{totals.electricity > 0 ? totals.electricity.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.lng }} className="p-3.5 border-r-[2px] border-slate-900 w-[82px] min-w-[82px]">{totals.lng > 0 ? totals.lng.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.hsd }} className="p-3.5 border-r-[2px] border-slate-900">{totals.hsd > 0 ? totals.hsd.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.total }} className="p-3.5 border-r-[2px] border-slate-900 text-sm">{totals.totalConsumption > 0 ? totals.totalConsumption.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.production }} className="p-3.5 border-r-[2px] border-slate-900">{totals.production > 0 ? totals.production.toLocaleString() : '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.unit }} className="p-3.5 border-r-[2px] border-slate-900"></td>
                <td style={{ backgroundColor: COL_COLORS.enpiVal }} className="p-3.5 border-r-[2px] border-slate-900 text-sm">{totalEnpiVal || '—'}</td>
                <td style={{ backgroundColor: COL_COLORS.wrt }} className="p-3.5 font-black">{totals.totalConsumption > 0 ? '100%' : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CHARTS ANALYTICS GRID */}
      <div>
        <h2 className="text-base font-black text-slate-900 mb-4 tracking-wide flex items-center gap-2">
          <span className="text-purple-600 animate-pulse">▍</span> 
          <span className="text-cyan-800">WIDER FACILITY</span> &amp; 
          <span className="text-amber-800">CONSUMPTION</span> 
          <span className="text-emerald-800">ANALYTICS</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* TOTAL CONSUMPTION BREAKDOWN */}
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm flex flex-col items-center">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5 self-start">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Total Consumption Breakdown
            </h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getCategorizedData('totalConsumption')}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={42}
                    paddingAngle={3}
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  >
                    {getCategorizedData('totalConsumption').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [Number(value).toLocaleString() + ' kWh', 'Consumption']} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PRODUCTION BREAKDOWN */}
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm flex flex-col items-center">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5 self-start">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Production Breakdown (MT)
            </h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getCategorizedData('production')}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={42}
                    paddingAngle={3}
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  >
                    {getCategorizedData('production').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [Number(value).toLocaleString() + ' MT', 'Production']} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ENPI VALUE BREAKDOWN */}
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm flex flex-col items-center">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5 self-start">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              EnPI Value Breakdown
            </h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getCategorizedData('enpiValue')}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={42}
                    paddingAngle={3}
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                  >
                    {getCategorizedData('enpiValue').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'EnPI Value']} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

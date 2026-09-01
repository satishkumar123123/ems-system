import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  UploadCloud, Download, Save, TrendingUp,
  FileSpreadsheet, X, Calendar, Lock, XCircle
} from 'lucide-react';

// 14 Equipments with Dedicated Custom Row Backgrounds and Distinct Text Colors
const PERMANENT_EQUIPMENTS = [
  { equipment: "6HI", enpiUnit: "KwH/MT", labelBg: "#bbf7d0", textCol: "#14532d" },
  { equipment: "CGL", enpiUnit: "KwH/MT", labelBg: "#bfdbfe", textCol: "#1e3a8a" },
  { equipment: "CCL", enpiUnit: "KwH/MT", labelBg: "#fef08a", textCol: "#713f12" },
  { equipment: "HRS", enpiUnit: "KwH/MT", labelBg: "#fed7aa", textCol: "#7c2d12" },
  { equipment: "PICKLING", enpiUnit: "KwH", labelBg: "#fecdd3", textCol: "#881337" },
  { equipment: "COMPRESSOR", enpiUnit: "Kwh", labelBg: "#a5f3fc", textCol: "#164e63" },
  { equipment: "CHILLER", enpiUnit: "KwH/MT", labelBg: "#ddd6fe", textCol: "#4c1d95" },
  { equipment: "TRIMMER", enpiUnit: "KwH/MT", labelBg: "#99f6e4", textCol: "#134e4a" },
  { equipment: "RGM", enpiUnit: "KwH/MT", labelBg: "#ffedd5", textCol: "#9a3412" },
  { equipment: "CRS", enpiUnit: "KwH/MT", labelBg: "#e9d5ff", textCol: "#581c87" },
  { equipment: "AUTO CTL", enpiUnit: "KwH/MT", labelBg: "#fbcfe8", textCol: "#831843" },
  { equipment: "CORRUGATION", enpiUnit: "KwH/MT", labelBg: "#d9f99d", textCol: "#365314" },
  { equipment: "OTHER AUX", enpiUnit: "KwH", labelBg: "#bae6fd", textCol: "#0c4a6e" },
  { equipment: "MATERIAL HANDLING", enpiUnit: "KwH", labelBg: "#f5d0fe", textCol: "#701a75" }
];

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

  // Password Modal States
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
    <div className="flex flex-col gap-6 p-6 bg-[#f1f5f9] min-h-screen text-slate-900 font-sans relative">

      {/* TOP TOOLBAR: Date -> Upload -> Sample -> Save -> YoY */}
      <div className="no-print flex flex-wrap items-center gap-3 bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-sm">
        
        {/* SELECT DATE / MONTH */}
        <div className="flex flex-col gap-1 bg-cyan-50 border border-cyan-300 px-3 py-1 rounded-xl shadow-xs">
          <span className="text-[10px] uppercase font-black text-cyan-900 tracking-wider">Select Month</span>
          <div 
            onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
            className="flex items-center gap-2 bg-white border border-cyan-400 rounded-lg px-2.5 py-1 cursor-pointer hover:border-cyan-600 transition-colors"
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

        {/* 1. UPLOAD EXCEL */}
        <button 
          onClick={() => setShowUploader((o) => !o)}
          className="flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <UploadCloud size={16} /> Upload Excel
        </button>

        {/* 2. SAMPLE EXCEL */}
        <button 
          onClick={handleDownloadSample}
          className="flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
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
          className="flex items-center gap-1.5 bg-[#4f46e5] hover:bg-[#4338ca] active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Saving…" : "Save"}
        </button>

        {/* 4. YOY ANALYTICS */}
        <button 
          onClick={() => navigate('/wider/yoy')}
          className="flex items-center gap-1.5 bg-[#db2777] hover:bg-[#be185d] active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <TrendingUp size={16} /> YoY Analytics
        </button>

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

      {/* COMPLETE COLORFUL MATRIX TABLE (ALL ROWS & COLUMNS COLOR-CODED) */}
      <div className="bg-white rounded-2xl border-[2px] border-slate-700 shadow-xl overflow-hidden">
        {loading && (
          <div className="p-2.5 bg-blue-50 text-blue-800 text-center font-black text-xs border-b-2 border-slate-700 animate-pulse">
            Loading data for {selectedMonth}…
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse border-[2px] border-slate-700">
            
            {/* 1. SOLID VIBRANT COLUMN HEADERS */}
            <thead>
              <tr className="text-slate-900 font-black text-xs uppercase tracking-wide border-b-[2px] border-slate-700">
                <th className="p-3.5 border-r-[2px] border-slate-700 w-12 text-center bg-[#cbd5e1] text-slate-900">#</th>
                <th className="p-3.5 border-r-[2px] border-slate-700 text-left min-w-[190px] bg-[#38bdf8] text-slate-950 font-black">
                  Parameters / Equipment
                </th>
                <th className="p-3.5 border-r-[2px] border-slate-700 min-w-[110px] bg-[#fde047] text-slate-950 font-black">
                  Month
                </th>
                <th className="p-3.5 border-r-[2px] border-slate-700 min-w-[130px] bg-[#5eead4] text-slate-950 font-black">
                  Electricity (kWh)
                </th>
                <th className="p-3.5 border-r-[2px] border-slate-700 min-w-[110px] bg-[#fdba74] text-slate-950 font-black">
                  LNG (kWh)
                </th>
                <th className="p-3.5 border-r-[2px] border-slate-700 min-w-[110px] bg-[#d8b4fe] text-slate-950 font-black">
                  HSD (kWh)
                </th>
                <th className="p-3.5 border-r-[2px] border-slate-700 min-w-[140px] bg-[#86efac] text-slate-950 font-black">
                  Total Consumption
                </th>
                <th className="p-3.5 border-r-[2px] border-slate-700 min-w-[120px] bg-[#7dd3fc] text-slate-950 font-black">
                  Production (MT)
                </th>
                <th className="p-3.5 border-r-[2px] border-slate-700 min-w-[100px] bg-[#c7d2fe] text-slate-950 font-black">
                  EnPI Unit
                </th>
                <th className="p-3.5 border-r-[2px] border-slate-700 min-w-[120px] bg-[#f9a8d4] text-slate-950 font-black">
                  EnPI Value(s)
                </th>
                <th className="p-3.5 min-w-[130px] bg-[#fef08a] text-slate-950 font-black">
                  % WRT to Total
                </th>
              </tr>
            </thead>

            {/* 2. EQUIPMENT ROWS (EVERY ROW & EVERY COLUMN FULLY COLOR-CODED) */}
            <tbody>
              {rows.map((r, idx) => {
                const config = PERMANENT_EQUIPMENTS[idx] || {};

                return (
                  <tr 
                    key={idx} 
                    className="border-b-[2px] border-slate-700 hover:brightness-95 transition-all font-bold"
                  >
                    
                    {/* Index */}
                    <td className="p-3 border-r-[2px] border-slate-700 text-center font-black text-slate-700 bg-[#e2e8f0]">
                      {idx + 1}
                    </td>

                    {/* Parameter / Equipment Label (Individual Unique Row Background) */}
                    <td 
                      style={{ backgroundColor: config.labelBg, color: config.textCol }}
                      className="p-3 border-r-[2px] border-slate-700 text-left font-black tracking-wide text-xs"
                    >
                      {r.equipment}
                    </td>

                    {/* Month Column (Warm Amber Tint) */}
                    <td className="p-2 border-r-[2px] border-slate-700 bg-[#fef3c7] font-black text-amber-950">
                      {selectedMonth}
                    </td>

                    {/* Electricity Column (Teal / Aqua Tint) */}
                    <td className="p-2 border-r-[2px] border-slate-700 bg-[#ccfbf1] text-teal-950">
                      <input 
                        type="number"
                        value={r.electricity}
                        onChange={(e) => handleCellChange(idx, 'electricity', e.target.value)}
                        placeholder="—"
                        className="w-full text-center bg-transparent font-black text-teal-950 outline-none focus:bg-white/70 rounded"
                      />
                    </td>

                    {/* LNG Column (Peach / Orange Tint) */}
                    <td className="p-2 border-r-[2px] border-slate-700 bg-[#ffedd5] text-orange-950">
                      <input 
                        type="number"
                        value={r.lng}
                        onChange={(e) => handleCellChange(idx, 'lng', e.target.value)}
                        placeholder="—"
                        className="w-full text-center bg-transparent font-black text-orange-950 outline-none focus:bg-white/70 rounded"
                      />
                    </td>

                    {/* HSD Column (Lavender / Violet Tint) */}
                    <td className="p-2 border-r-[2px] border-slate-700 bg-[#f3e8ff] text-purple-950">
                      <input 
                        type="number"
                        value={r.hsd}
                        onChange={(e) => handleCellChange(idx, 'hsd', e.target.value)}
                        placeholder="—"
                        className="w-full text-center bg-transparent font-black text-purple-950 outline-none focus:bg-white/70 rounded"
                      />
                    </td>

                    {/* Total Consumption Column (Bright Mint / Emerald Tint) */}
                    <td className="p-2 border-r-[2px] border-slate-700 bg-[#dcfce7] font-black text-emerald-950 text-xs">
                      {r.totalConsumption !== '' && r.totalConsumption != null ? Number(r.totalConsumption).toLocaleString() : '—'}
                    </td>

                    {/* Production Column (Soft Sky Blue Tint) */}
                    <td className="p-2 border-r-[2px] border-slate-700 bg-[#e0f2fe] text-sky-950">
                      <input 
                        type="number"
                        value={r.production}
                        onChange={(e) => handleCellChange(idx, 'production', e.target.value)}
                        placeholder="—"
                        className="w-full text-center bg-transparent font-black text-sky-950 outline-none focus:bg-white/70 rounded"
                      />
                    </td>

                    {/* EnPI Unit Column (Soft Indigo Tint) */}
                    <td className="p-2 border-r-[2px] border-slate-700 bg-[#e0e7ff] text-indigo-950 font-bold">
                      {r.enpiUnit}
                    </td>

                    {/* EnPI Value Column (Rose / Pink Tint) */}
                    <td className="p-2 border-r-[2px] border-slate-700 bg-[#fce7f3] font-black text-pink-950 text-xs">
                      {r.enpiValue !== '' && r.enpiValue != null ? r.enpiValue : '—'}
                    </td>

                    {/* % WRT to Total KWH Column (Light Gold Tint) */}
                    <td className="p-2 bg-[#fef9c3] font-black text-yellow-950 text-xs">
                      {r.wrtKwh !== '' && r.wrtKwh != null ? (typeof r.wrtKwh === 'number' ? r.wrtKwh.toFixed(4) : r.wrtKwh) : '—'}
                    </td>
                  </tr>
                );
              })}

              {/* 3. TOTAL FACILITY SUMMARY ROW */}
              <tr className="bg-[#1e293b] text-white font-black text-xs border-t-[3px] border-slate-900">
                <td className="p-3.5 border-r-[2px] border-slate-600 text-center font-black text-yellow-300">∑</td>
                <td className="p-3.5 border-r-[2px] border-slate-600 text-left font-black tracking-wider uppercase text-yellow-300">
                  Total Wider Facility
                </td>
                <td className="p-3.5 border-r-[2px] border-slate-600 text-yellow-200">{selectedMonth}</td>
                <td className="p-3.5 border-r-[2px] border-slate-600 text-teal-300">{totals.electricity > 0 ? totals.electricity.toLocaleString() : '—'}</td>
                <td className="p-3.5 border-r-[2px] border-slate-600 text-orange-300">{totals.lng > 0 ? totals.lng.toLocaleString() : '—'}</td>
                <td className="p-3.5 border-r-[2px] border-slate-600 text-purple-300">{totals.hsd > 0 ? totals.hsd.toLocaleString() : '—'}</td>
                <td className="p-3.5 border-r-[2px] border-slate-600 text-emerald-300 text-sm font-black">{totals.totalConsumption > 0 ? totals.totalConsumption.toLocaleString() : '—'}</td>
                <td className="p-3.5 border-r-[2px] border-slate-600 text-sky-300">{totals.production > 0 ? totals.production.toLocaleString() : '—'}</td>
                <td className="p-3.5 border-r-[2px] border-slate-600 text-indigo-200"></td>
                <td className="p-3.5 border-r-[2px] border-slate-600 text-pink-300 text-sm font-black">{totalEnpiVal || '—'}</td>
                <td className="p-3.5 text-yellow-300 font-black">{totals.totalConsumption > 0 ? '100%' : '—'}</td>
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
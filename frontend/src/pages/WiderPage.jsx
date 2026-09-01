import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  UploadCloud, Download, Save, TrendingUp,
  FileSpreadsheet, X, Calendar, Lock, XCircle
} from 'lucide-react';

const PERMANENT_EQUIPMENTS = [
  { equipment: "6HI", enpiUnit: "KwH/MT", color: "#38bdf8" },
  { equipment: "CGL", enpiUnit: "KwH/MT", color: "#34d399" },
  { equipment: "CCL", enpiUnit: "KwH/MT", color: "#a78bfa" },
  { equipment: "HRS", enpiUnit: "KwH/MT", color: "#fbbf24" },
  { equipment: "PICKLING", enpiUnit: "KwH", color: "#f43f5e" },
  { equipment: "COMPRESSOR", enpiUnit: "Kwh", color: "#22d3ee" },
  { equipment: "CHILLER", enpiUnit: "KwH/MT", color: "#818cf8" },
  { equipment: "TRIMMER", enpiUnit: "KwH/MT", color: "#2dd4bf" },
  { equipment: "RGM", enpiUnit: "KwH/MT", color: "#fb923c" },
  { equipment: "CRS", enpiUnit: "KwH/MT", color: "#c084fc" },
  { equipment: "AUTO CTL", enpiUnit: "KwH/MT", color: "#f472b6" },
  { equipment: "CORRUGATION", enpiUnit: "KwH/MT", color: "#a3e635" },
  { equipment: "OTHER AUX", enpiUnit: "KwH", color: "#38bdf8" },
  { equipment: "MATERIAL HANDLING", enpiUnit: "KwH", color: "#e879f9" }
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

const PIE_COLORS = ['#38bdf8', '#34d399', '#a78bfa', '#fbbf24', '#f43f5e', '#22d3ee'];
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
    <div className="flex flex-col gap-6 p-6 bg-[#0a0f1d] min-h-screen text-slate-100 font-sans relative">

      {/* TOP TOOLBAR: Date -> Upload -> Sample -> Save -> YoY */}
      <div className="no-print flex flex-wrap items-center gap-3 bg-[#131c31] border border-[#23314e] rounded-2xl p-4 shadow-2xl">
        
        {/* SELECT DATE / MONTH */}
        <div className="flex flex-col gap-1 bg-[#0a0f1d] border border-cyan-500/50 px-3 py-1.5 rounded-xl">
          <span className="text-[10px] uppercase font-black text-cyan-400 tracking-wider">Select Month</span>
          <div 
            onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.focus()}
            className="flex items-center gap-2 bg-[#131c31] border border-cyan-500/60 rounded-lg px-2.5 py-1 cursor-pointer hover:border-cyan-400 transition-colors"
          >
            <input
              ref={dateInputRef}
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-200 focus:outline-none cursor-pointer"
            />
            <Calendar size={15} className="text-cyan-400 flex-shrink-0" />
          </div>
        </div>

        {/* 1. UPLOAD EXCEL */}
        <button 
          onClick={() => setShowUploader((o) => !o)}
          className="flex items-center gap-1.5 bg-[#059669] hover:bg-[#10b981] active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg cursor-pointer border border-emerald-400/40"
        >
          <UploadCloud size={16} /> Upload Excel
        </button>

        {/* 2. SAMPLE EXCEL */}
        <button 
          onClick={handleDownloadSample}
          className="flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#3b82f6] active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg cursor-pointer border border-blue-400/40"
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
          className="flex items-center gap-1.5 bg-[#6366f1] hover:bg-[#4f46e5] active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50 border border-indigo-400/40"
        >
          <Save size={16} /> {saving ? "Saving…" : "Save"}
        </button>

        {/* 4. YOY ANALYTICS */}
        <button 
          onClick={() => navigate('/wider/yoy')}
          className="flex items-center gap-1.5 bg-[#db2777] hover:bg-[#ec4899] active:scale-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg cursor-pointer border border-pink-400/40"
        >
          <TrendingUp size={16} /> YoY Analytics
        </button>

      </div>

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#131c31] rounded-2xl p-6 w-full max-w-sm border border-slate-700 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Lock size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Authorization Required
                </h3>
                <p className="text-[11px] text-slate-400">
                  Data save karne ke liye password enter karein.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
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
                  className="w-full bg-[#0a0f1d] border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none transition-all"
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all"
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
        <div className="p-5 border-2 border-dashed border-cyan-500/50 rounded-2xl bg-[#131c31] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <FileSpreadsheet size={26} />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase">Select Excel (.xlsx, .xls) File</p>
              <p className="text-[11px] font-semibold text-slate-400">Values map automatically to the {selectedMonth} dataset.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
            />
            <button 
              onClick={() => setShowUploader(false)}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* RECTANGULAR BOX MATRIX TABLE WITH HORIZONTAL & VERTICAL DIVIDER LINES */}
      <div className="bg-[#121a2c] rounded-2xl border-2 border-[#2b3a58] shadow-2xl overflow-hidden">
        {loading && (
          <div className="p-2.5 bg-cyan-950/80 text-cyan-300 text-center font-black text-xs border-b border-cyan-800 animate-pulse">
            Loading data for {selectedMonth}…
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse border border-[#2b3a58]">
            
            {/* VIBRANT TABLE HEADERS */}
            <thead>
              <tr className="bg-[#0b1220] border-b-2 border-[#384869] text-[11px] uppercase tracking-wider">
                <th className="p-3 border-r-2 border-[#2b3a58] w-12 text-center text-slate-400 font-black">#</th>
                <th className="p-3 border-r-2 border-[#2b3a58] text-left min-w-[190px] text-[#38bdf8] font-black">
                  Parameters / Equipment
                </th>
                <th className="p-3 border-r-2 border-[#2b3a58] min-w-[110px] text-[#fde047] font-black">
                  Month-Year
                </th>
                <th className="p-3 border-r-2 border-[#2b3a58] min-w-[130px] text-[#ff5252] font-black">
                  Electricity (kWh)
                </th>
                <th className="p-3 border-r-2 border-[#2b3a58] min-w-[110px] text-[#ffb703] font-black">
                  LNG (kWh)
                </th>
                <th className="p-3 border-r-2 border-[#2b3a58] min-w-[110px] text-[#00e5ff] font-black">
                  HSD (kWh)
                </th>
                <th className="p-3 border-r-2 border-[#2b3a58] min-w-[140px] text-[#00e676] font-black">
                  Total Consumption
                </th>
                <th className="p-3 border-r-2 border-[#2b3a58] min-w-[120px] text-[#1de9b6] font-black">
                  Production (MT)
                </th>
                <th className="p-3 border-r-2 border-[#2b3a58] min-w-[100px] text-[#c7d2fe] font-black">
                  EnPI Unit
                </th>
                <th className="p-3 border-r-2 border-[#2b3a58] min-w-[120px] text-[#e040fb] font-black">
                  EnPI Value(s)
                </th>
                <th className="p-3 min-w-[130px] text-[#ff4081] font-black">
                  % WRT to Total
                </th>
              </tr>
            </thead>

            {/* FULLY BORDERED RECTANGULAR BOX CELLS */}
            <tbody>
              {rows.map((r, idx) => {
                const config = PERMANENT_EQUIPMENTS[idx] || {};

                return (
                  <tr 
                    key={idx} 
                    className="border-b-2 border-[#2b3a58] hover:bg-[#1a253c] transition-colors"
                  >
                    
                    {/* Index */}
                    <td className="p-2 border-r-2 border-[#2b3a58] text-center font-bold text-slate-400 bg-[#0b1220]/60">
                      {idx + 1}
                    </td>

                    {/* 1. Equipment Name (Neon Color in Box) */}
                    <td className="p-2.5 border-r-2 border-[#2b3a58] text-left font-black tracking-wide" style={{ color: config.color }}>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }}></span>
                        {r.equipment}
                      </div>
                    </td>

                    {/* 2. Month-Year (Yellow in Box) */}
                    <td className="p-2 border-r-2 border-[#2b3a58] text-center">
                      <div className="bg-[#1a253f] border border-[#fde047]/30 rounded-md py-1.5 font-bold text-[#fde047]">
                        {selectedMonth}
                      </div>
                    </td>

                    {/* 3. Electricity (Vivid Red in Box) */}
                    <td className="p-2 border-r-2 border-[#2b3a58]">
                      <div className="bg-[#1a253f] border border-[#ff5252]/40 rounded-md px-2 py-1">
                        <input 
                          type="number"
                          value={r.electricity}
                          onChange={(e) => handleCellChange(idx, 'electricity', e.target.value)}
                          placeholder="—"
                          className="w-full text-center bg-transparent font-black text-[#ff5252] outline-none"
                        />
                      </div>
                    </td>

                    {/* 4. LNG (Gold Orange in Box) */}
                    <td className="p-2 border-r-2 border-[#2b3a58]">
                      <div className="bg-[#1a253f] border border-[#ffb703]/40 rounded-md px-2 py-1">
                        <input 
                          type="number"
                          value={r.lng}
                          onChange={(e) => handleCellChange(idx, 'lng', e.target.value)}
                          placeholder="—"
                          className="w-full text-center bg-transparent font-black text-[#ffb703] outline-none"
                        />
                      </div>
                    </td>

                    {/* 5. HSD (Light Blue in Box) */}
                    <td className="p-2 border-r-2 border-[#2b3a58]">
                      <div className="bg-[#1a253f] border border-[#00e5ff]/40 rounded-md px-2 py-1">
                        <input 
                          type="number"
                          value={r.hsd}
                          onChange={(e) => handleCellChange(idx, 'hsd', e.target.value)}
                          placeholder="—"
                          className="w-full text-center bg-transparent font-black text-[#00e5ff] outline-none"
                        />
                      </div>
                    </td>

                    {/* 6. Total Consumption (Neon Green in Box) */}
                    <td className="p-2 border-r-2 border-[#2b3a58]">
                      <div className="bg-[#103028] border border-[#00e676]/50 rounded-md py-1.5 font-black text-[#00e676]">
                        {r.totalConsumption !== '' && r.totalConsumption != null ? Number(r.totalConsumption).toLocaleString() : '—'}
                      </div>
                    </td>

                    {/* 7. Production (Aqua in Box) */}
                    <td className="p-2 border-r-2 border-[#2b3a58]">
                      <div className="bg-[#1a253f] border border-[#1de9b6]/40 rounded-md px-2 py-1">
                        <input 
                          type="number"
                          value={r.production}
                          onChange={(e) => handleCellChange(idx, 'production', e.target.value)}
                          placeholder="—"
                          className="w-full text-center bg-transparent font-black text-[#1de9b6] outline-none"
                        />
                      </div>
                    </td>

                    {/* 8. EnPI Unit (Lavender in Box) */}
                    <td className="p-2 border-r-2 border-[#2b3a58]">
                      <div className="bg-[#1a253f] border border-[#c7d2fe]/30 rounded-md py-1.5 font-bold text-[#c7d2fe]">
                        {r.enpiUnit}
                      </div>
                    </td>

                    {/* 9. EnPI Value(s) (Bright Purple in Box) */}
                    <td className="p-2 border-r-2 border-[#2b3a58]">
                      <div className="bg-[#2f183c] border border-[#e040fb]/50 rounded-md py-1.5 font-black text-[#e040fb]">
                        {r.enpiValue !== '' && r.enpiValue != null ? r.enpiValue : '—'}
                      </div>
                    </td>

                    {/* 10. % WRT to Total KWH (Hot Pink in Box) */}
                    <td className="p-2">
                      <div className="bg-[#1a253f] border border-[#ff4081]/40 rounded-md py-1.5 font-bold text-[#ff4081]">
                        {r.wrtKwh !== '' && r.wrtKwh != null ? (typeof r.wrtKwh === 'number' ? r.wrtKwh.toFixed(4) : r.wrtKwh) : '—'}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* TOTAL FACILITY SUMMARY ROW WITH BORDERS */}
              <tr className="bg-[#0b1220] border-t-2 border-emerald-500 font-black text-xs">
                <td className="p-3 border-r-2 border-[#2b3a58] text-center font-black text-[#fde047]">∑</td>
                <td className="p-3 border-r-2 border-[#2b3a58] text-left font-black tracking-wider uppercase text-[#fde047]">
                  Total Wider Facility
                </td>
                <td className="p-3 border-r-2 border-[#2b3a58] text-[#fde047] font-bold">{selectedMonth}</td>
                <td className="p-3 border-r-2 border-[#2b3a58] text-[#ff5252] font-black">{totals.electricity > 0 ? totals.electricity.toLocaleString() : '—'}</td>
                <td className="p-3 border-r-2 border-[#2b3a58] text-[#ffb703] font-black">{totals.lng > 0 ? totals.lng.toLocaleString() : '—'}</td>
                <td className="p-3 border-r-2 border-[#2b3a58] text-[#00e5ff] font-black">{totals.hsd > 0 ? totals.hsd.toLocaleString() : '—'}</td>
                <td className="p-3 border-r-2 border-[#2b3a58] text-[#00e676] font-black text-sm">{totals.totalConsumption > 0 ? totals.totalConsumption.toLocaleString() : '—'}</td>
                <td className="p-3 border-r-2 border-[#2b3a58] text-[#1de9b6] font-black">{totals.production > 0 ? totals.production.toLocaleString() : '—'}</td>
                <td className="p-3 border-r-2 border-[#2b3a58] text-[#c7d2fe]"></td>
                <td className="p-3 border-r-2 border-[#2b3a58] text-[#e040fb] font-black text-sm">{totalEnpiVal || '—'}</td>
                <td className="p-3 text-[#ff4081] font-black">{totals.totalConsumption > 0 ? '100%' : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CHARTS ANALYTICS GRID */}
      <div>
        <h2 className="text-base font-black text-slate-100 mb-4 tracking-wide flex items-center gap-2">
          <span className="text-purple-500 animate-pulse">▍</span> 
          <span className="text-cyan-400">WIDER FACILITY</span> &amp; 
          <span className="text-amber-400">CONSUMPTION</span> 
          <span className="text-emerald-400">ANALYTICS</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* TOTAL CONSUMPTION BREAKDOWN */}
          <div className="bg-[#121a2c] border border-[#2b3a58] rounded-2xl p-4 shadow-xl flex flex-col items-center">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wide mb-3 flex items-center gap-1.5 self-start">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
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
                  <Tooltip formatter={(value) => [Number(value).toLocaleString() + ' kWh', 'Consumption']} contentStyle={{ backgroundColor: '#0b1220', borderColor: '#2b3a58', color: '#fff', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PRODUCTION BREAKDOWN */}
          <div className="bg-[#121a2c] border border-[#2b3a58] rounded-2xl p-4 shadow-xl flex flex-col items-center">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wide mb-3 flex items-center gap-1.5 self-start">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
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
                  <Tooltip formatter={(value) => [Number(value).toLocaleString() + ' MT', 'Production']} contentStyle={{ backgroundColor: '#0b1220', borderColor: '#2b3a58', color: '#fff', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ENPI VALUE BREAKDOWN */}
          <div className="bg-[#121a2c] border border-[#2b3a58] rounded-2xl p-4 shadow-xl flex flex-col items-center">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wide mb-3 flex items-center gap-1.5 self-start">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
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
                  <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'EnPI Value']} contentStyle={{ backgroundColor: '#0b1220', borderColor: '#2b3a58', color: '#fff', borderRadius: '12px' }} />
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
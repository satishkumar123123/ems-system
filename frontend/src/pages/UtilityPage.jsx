import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ArrowLeft, Upload, Download, Save, TrendingUp, FileSpreadsheet } from 'lucide-react';

const PERMANENT_EQUIPMENTS = [
  { equipment: "ARP(LNG)", enpiUnit: "Kwh/KL" },
  { equipment: "Boiler(LPG)", enpiUnit: "Kwh/Ton" },
  { equipment: "Pump house", enpiUnit: "Kwh/MT" },
  { equipment: "DG Set", enpiUnit: "Kwh/Ltr" },
  { equipment: "N2 Plant", enpiUnit: "Kwh/M3" },
  { equipment: "ETP PLANT", enpiUnit: "KwH/KL" },
  { equipment: "MEE PLANT(LPG)", enpiUnit: "KwH/KL" },
  { equipment: "SLUDGE DRYER(LNG)", enpiUnit: "KwH/KG" }
];

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

export default function UtilityPage() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState('2026-04');
  const [showUploader, setShowUploader] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMonthData(selectedMonth);
  }, [selectedMonth]);

  const fetchMonthData = (month) => {
    setLoading(true);
    fetch(`http://localhost:5000/api/utility?month=${month}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.rows && data.rows.length > 0) {
          const merged = PERMANENT_EQUIPMENTS.map(pe => {
            const found = data.rows.find(r => r.equipment?.trim().toUpperCase() === pe.equipment.trim().toUpperCase());
            return found || {
              equipment: pe.equipment,
              electricity: null,
              lngLpg: null,
              hsd: null,
              totalConsumption: null,
              production: null,
              enpiUnit: pe.enpiUnit,
              enpiValue: '---',
              wrtKwh: null
            };
          });
          setRows(merged);
        } else {
          setRows(PERMANENT_EQUIPMENTS.map(pe => ({
            equipment: pe.equipment,
            electricity: null,
            lngLpg: null,
            hsd: null,
            totalConsumption: null,
            production: null,
            enpiUnit: pe.enpiUnit,
            enpiValue: '---',
            wrtKwh: null
          })));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  };

  // Totals Calculation
  const totals = rows.reduce((acc, curr) => ({
    electricity: acc.electricity + (Number(curr.electricity) || 0),
    lngLpg: acc.lngLpg + (Number(curr.lngLpg) || 0),
    hsd: acc.hsd + (Number(curr.hsd) || 0),
    totalConsumption: acc.totalConsumption + (Number(curr.totalConsumption) || 0),
    production: acc.production + (Number(curr.production) || 0),
    wrtKwh: acc.wrtKwh + (Number(curr.wrtKwh) || 0)
  }), { electricity: 0, lngLpg: 0, hsd: 0, totalConsumption: 0, production: 0, wrtKwh: 0 });

  const totalEnpiVal = totals.totalConsumption > 0 ? (totals.totalConsumption / 30).toFixed(0) : "0";

  // Pie Chart Data Formatter (ARP(LNG), Boiler(LPG), Pump house, MEE PLANT(LPG) + OTHERS)
  const getCategorizedData = (key) => {
    const mainKeys = ['ARP(LNG)', 'BOILER(LPG)', 'PUMP HOUSE', 'MEE PLANT(LPG)'];
    let mainItems = [];
    let othersVal = 0;

    rows.forEach((r) => {
      let rawVal = r[key];
      let val = 0;
      if (typeof rawVal === 'number') {
        val = rawVal;
      } else if (typeof rawVal === 'string' && rawVal.trim() !== '' && rawVal !== '---' && rawVal !== '-') {
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

  // Excel Upload Handler
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
              (item["Process/Equipments"] || item.equipment || "").trim().toUpperCase() === pe.equipment.trim().toUpperCase()
            );

            if (found) {
              return {
                equipment: pe.equipment,
                electricity: found["Electricity (Kwh)"] != null ? Number(found["Electricity (Kwh)"]) : null,
                lngLpg: found["LNG/LPG ( Kg)"] != null || found["LNG/LPG (Kg)"] != null ? Number(found["LNG/LPG ( Kg)"] || found["LNG/LPG (Kg)"]) : null,
                hsd: found["HSD (Ltr)"] != null ? Number(found["HSD (Ltr)"]) : null,
                totalConsumption: found["Total Consumption"] != null ? Number(found["Total Consumption"]) : null,
                production: found["Production"] != null ? Number(found["Production"]) : null,
                enpiUnit: found["EnPI"] || pe.enpiUnit,
                enpiValue: found["EnPI Value(s)"] || found.enpiValue || "---",
                wrtKwh: found["% WRT to Total KWH"] != null ? Number(found["% WRT to Total KWH"]) : null
              };
            }

            return {
              equipment: pe.equipment,
              electricity: null,
              lngLpg: null,
              hsd: null,
              totalConsumption: null,
              production: null,
              enpiUnit: pe.enpiUnit,
              enpiValue: '---',
              wrtKwh: null
            };
          });

          setRows(mapped);
          setShowUploader(false);
          alert('Utility Excel Data Uploaded Successfully! Click Save to store.');
        }
      } catch (err) {
        alert('Failed to read Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Sample Excel Download
  const handleDownloadSample = () => {
    const exportData = PERMANENT_EQUIPMENTS.map(pe => {
      const existing = rows.find(r => r.equipment === pe.equipment);
      return {
        "Process/Equipments": pe.equipment,
        "Month-Year": selectedMonth,
        "Electricity (Kwh)": existing?.electricity ?? "",
        "LNG/LPG ( Kg)": existing?.lngLpg ?? "",
        "HSD (Ltr)": existing?.hsd ?? "",
        "Total Consumption": existing?.totalConsumption ?? "",
        "Production": existing?.production ?? "",
        "EnPI": pe.enpiUnit,
        "EnPI Value(s)": existing?.enpiValue ?? "---",
        "% WRT to Total KWH": existing?.wrtKwh ?? ""
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Utility_Facility");
    XLSX.writeFile(wb, `Utility_Facility_${selectedMonth}.xlsx`);
  };

  // Save to DB
  const handleSaveData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/utility/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthYear: selectedMonth,
          rows,
          totals: {
            ...totals,
            enpiUnit: "KWH/Day",
            enpiValue: Number(totalEnpiVal),
            wrtKwh: Number(totals.wrtKwh.toFixed(5))
          }
        })
      });
      const resData = await res.json();
      if (resData.success) {
        alert('Utility Data successfully saved in MongoDB Database!');
      } else {
        alert('Save error: ' + (resData.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error saving data: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 p-6 md:p-8">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold border border-slate-300 transition shadow-sm cursor-pointer"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Utility Facility Dashboard</h1>
            <p className="text-xs text-slate-500">Real-time equipment monitoring & EnPI metrics</p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-300 px-4 py-2 rounded-xl">
          <span className="text-sm font-bold text-slate-600">Select Month:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1 font-semibold text-slate-700 outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* 4 Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition cursor-pointer"
        >
          <Upload size={18} /> Upload Excel
        </button>

        <button
          onClick={handleDownloadSample}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition cursor-pointer"
        >
          <Download size={18} /> Sample Excel
        </button>

        <button
          onClick={handleSaveData}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition cursor-pointer"
        >
          <Save size={18} /> Save
        </button>

        <button
          onClick={() => navigate('/utility/yoy')}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-sm transition cursor-pointer"
        >
          <TrendingUp size={18} /> YoY
        </button>
      </div>

      {/* Upload Dropzone */}
      {showUploader && (
        <div className="mt-4 p-6 border-2 border-dashed border-blue-400 rounded-2xl bg-blue-50/50 flex flex-col items-center justify-center gap-3">
          <FileSpreadsheet className="text-blue-600" size={36} />
          <p className="text-sm font-medium text-slate-600">Select Utility `.xlsx` file to parse and populate the schema</p>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
        </div>
      )}

      {/* Schema Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-300 shadow-sm bg-white">
        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr className="bg-[#6b21a8] text-white font-semibold text-xs tracking-wider">
              <th className="p-3 border border-slate-400 text-left">Process/Equipments</th>
              <th className="p-3 border border-slate-400 bg-yellow-400 text-black">Month-Year</th>
              <th className="p-3 border border-slate-400">Electricity (Kwh)</th>
              <th className="p-3 border border-slate-400">LNG/LPG ( Kg)</th>
              <th className="p-3 border border-slate-400">HSD (Ltr)</th>
              <th className="p-3 border border-slate-400">Total Consumption</th>
              <th className="p-3 border border-slate-400">Production</th>
              <th className="p-3 border border-slate-400">EnPI</th>
              <th className="p-3 border border-slate-400">EnPI Value(s)</th>
              <th className="p-3 border border-slate-400">% WRT to Total KWH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
            {rows.map((r, idx) => {
              const isHighlight = ['ARP(LNG)', 'BOILER(LPG)', 'PUMP HOUSE', 'MEE PLANT(LPG)'].includes(r.equipment.toUpperCase());

              return (
                <tr key={idx} className={isHighlight ? "bg-amber-50 hover:bg-amber-100/60 font-semibold" : "hover:bg-slate-50 transition"}>
                  <td className={`p-2.5 text-left border border-slate-300 ${isHighlight ? 'text-amber-900 font-bold' : ''}`}>
                    {r.equipment}
                  </td>
                  <td className="p-2.5 bg-yellow-100 border border-slate-300">{selectedMonth}</td>
                  <td className="p-2.5 border border-slate-300">{r.electricity != null ? Number(r.electricity).toLocaleString() : '-'}</td>
                  <td className="p-2.5 border border-slate-300">{r.lngLpg != null ? Number(r.lngLpg).toLocaleString() : '-'}</td>
                  <td className="p-2.5 border border-slate-300">{r.hsd != null ? Number(r.hsd).toLocaleString() : '-'}</td>
                  <td className="p-2.5 border border-slate-300 font-semibold">{r.totalConsumption != null ? Number(r.totalConsumption).toLocaleString() : '-'}</td>
                  <td className="p-2.5 border border-slate-300">{r.production != null ? Number(r.production).toLocaleString() : '-'}</td>
                  <td className="p-2.5 border border-slate-300 text-slate-500">{r.enpiUnit}</td>
                  <td className="p-2.5 border border-slate-300 font-bold">{r.enpiValue ?? '---'}</td>
                  <td className="p-2.5 border border-slate-300">{r.wrtKwh != null ? Number(r.wrtKwh).toFixed(5) : '-'}</td>
                </tr>
              );
            })}
            {/* Total Row */}
            <tr className="bg-[#bbf7d0] text-black font-extrabold text-xs">
              <td className="p-3 text-left border border-slate-400">Total Utility Facility</td>
              <td className="p-3 border border-slate-400"></td>
              <td className="p-3 border border-slate-400">{totals.electricity ? totals.electricity.toLocaleString() : ''}</td>
              <td className="p-3 border border-slate-400">{totals.lngLpg ? totals.lngLpg.toLocaleString() : ''}</td>
              <td className="p-3 border border-slate-400">{totals.hsd ? totals.hsd.toLocaleString() : ''}</td>
              <td className="p-3 border border-slate-400">{totals.totalConsumption ? totals.totalConsumption.toLocaleString() : ''}</td>
              <td className="p-3 border border-slate-400"></td>
              <td className="p-3 border border-slate-400">KWH/Day</td>
              <td className="p-3 border border-slate-400">{totals.totalConsumption > 0 ? Number(totalEnpiVal).toLocaleString() : ''}</td>
              <td className="p-3 border border-slate-400">{totals.wrtKwh ? totals.wrtKwh.toFixed(5) + '%' : ''}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3 Pie Charts Grid */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Consumption Chart */}
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col items-center">
          <h3 className="font-bold text-sm text-slate-700 mb-2">Total Consumption Contribution</h3>
          <div style={{ width: '100%', height: 280, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getCategorizedData('totalConsumption')}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                >
                  {getCategorizedData('totalConsumption').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [Number(value).toLocaleString() + ' kWh', 'Consumption']} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Production Chart */}
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col items-center">
          <h3 className="font-bold text-sm text-slate-700 mb-2">Production Contribution</h3>
          <div style={{ width: '100%', height: 280, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getCategorizedData('production')}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#82ca9d"
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                >
                  {getCategorizedData('production').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Production']} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* EnPI Values Chart */}
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col items-center">
          <h3 className="font-bold text-sm text-slate-700 mb-2">EnPI Value Contribution</h3>
          <div style={{ width: '100%', height: 280, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getCategorizedData('enpiValue')}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#ffc658"
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                >
                  {getCategorizedData('enpiValue').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'EnPI Value']} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
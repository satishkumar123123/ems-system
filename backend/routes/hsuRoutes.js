// backend/routes/hsuRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// 1. Schema Definition (Pehle wala intact hai)
const HsuDataSchema = new mongoose.Schema({
  monthYear: { type: String, required: true, unique: true },
  rows: [
    {
      equipment: String,
      electricity: Number,
      lpg: Number,
      hsd: Number,
      totalConsumption: Number,
      production: Number,
      enpiUnit: String,
      enpiValue: mongoose.Schema.Types.Mixed,
      wrtKwh: Number
    }
  ],
  totals: {
    electricity: Number,
    lpg: Number,
    hsd: Number,
    totalConsumption: Number,
    production: Number,
    enpiValue: Number,
    wrtKwh: Number
  }
}, { timestamps: true });

const HsuData = mongoose.models.HsuData || mongoose.model('HsuData', HsuDataSchema);

// ----------------------------------------------------
// ROUTE 1: GET HSU data by month (Pehle wala intact hai)
// ----------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    const data = await HsuData.findOne({ monthYear: month });
    res.json(data || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// ROUTE 2: SAVE / UPDATE HSU data (Pehle wala intact hai)
// ----------------------------------------------------
router.post('/save', async (req, res) => {
  try {
    const { monthYear, rows, totals } = req.body;
    const updated = await HsuData.findOneAndUpdate(
      { monthYear },
      { monthYear, rows, totals },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// ROUTE 3: GET HSU YoY Comparison Data (Naya added route)
// ----------------------------------------------------
router.get('/yoy', async (req, res) => {
  try {
    const { year = '2025-26' } = req.query;
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const equipments = ['ZY-120 MILL', 'FD-200 MILL', 'OLIMPIA MILL', 'ZY-500 MILL+1800KWHF'];

    const yoyResult = equipments.map(eq => {
      const monthlyBreakdown = months.map(m => {
        let baseElect = 120000;
        let baseProd = 3500;

        if (eq === 'ZY-120 MILL') { baseElect = 117471; baseProd = 2239; }
        else if (eq === 'FD-200 MILL') { baseElect = 130672; baseProd = 4072; }
        else if (eq === 'OLIMPIA MILL') { baseElect = 156139; baseProd = 6018; }
        else if (eq === 'ZY-500 MILL+1800KWHF') { baseElect = 158126; baseProd = 4909; }

        const randomPrevFact = 0.85 + Math.random() * 0.2;
        const randomCurrFact = 0.90 + Math.random() * 0.2;

        const prevElect = Math.round(baseElect * randomPrevFact);
        const currElect = Math.round(baseElect * randomCurrFact);

        const prevProd = Math.round(baseProd * randomPrevFact);
        const currProd = Math.round(baseProd * randomCurrFact);

        const prevEnpi = prevProd > 0 ? Number((prevElect / prevProd).toFixed(2)) : 0;
        const currEnpi = currProd > 0 ? Number((currElect / currProd).toFixed(2)) : 0;

        return {
          month: m,
          electricity: { prevYear: prevElect, currYear: currElect },
          production: { prevYear: prevProd, currYear: currProd },
          enpi: { prevYear: prevEnpi, currYear: currEnpi }
        };
      });

      return {
        equipment: eq,
        monthlyData: monthlyBreakdown
      };
    });

    const [startYear, endYear] = year.split('-').map(Number);
    const prevFinancialYear = `${startYear - 1}-${(endYear - 1).toString().padStart(2, '0')}`;

    res.json({
      financialYear: year,
      prevFinancialYear,
      data: yoyResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
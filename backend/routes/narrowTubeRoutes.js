const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const NarrowTubeDataSchema = new mongoose.Schema({
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

const NarrowTubeData = mongoose.models.NarrowTubeData || mongoose.model('NarrowTubeData', NarrowTubeDataSchema);

// GET data by month
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    const data = await NarrowTubeData.findOne({ monthYear: month });
    res.json(data || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SAVE / UPDATE data
router.post('/save', async (req, res) => {
  try {
    const { monthYear, rows, totals } = req.body;
    const updated = await NarrowTubeData.findOneAndUpdate(
      { monthYear },
      { monthYear, rows, totals },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET YoY Data (4 Equipments: COMPRESSOR, GMT-1, GMT-2, PUMP HOUSE)
router.get('/yoy', async (req, res) => {
  try {
    const { year = '2025-26' } = req.query;
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const equipments = ['COMPRESSOR', 'GMT-1', 'GMT-2', 'PUMP HOUSE'];

    const yoyResult = equipments.map(eq => {
      const monthlyBreakdown = months.map(m => {
        let baseElect = 80000;
        let baseProd = 3000;

        if (eq === 'COMPRESSOR') { baseElect = 186465; baseProd = 48776; }
        else if (eq === 'GMT-1') { baseElect = 97089; baseProd = 3119; }
        else if (eq === 'GMT-2') { baseElect = 79517; baseProd = 2556; }
        else if (eq === 'PUMP HOUSE') { baseElect = 78776; baseProd = 11757; }

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

    res.json({
      financialYear: year,
      prevFinancialYear: `${parseInt(year.split('-')[0]) - 1}-${parseInt(year.split('-')[1]) - 1}`,
      data: yoyResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
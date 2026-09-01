const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const UtilityDataSchema = new mongoose.Schema({
  monthYear: { type: String, required: true, unique: true },
  type: { type: String, default: 'utility' },
  rows: [
    {
      equipment: String,
      electricity: Number,
      lngLpg: Number,
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
    lngLpg: Number,
    hsd: Number,
    totalConsumption: Number,
    production: Number,
    enpiUnit: String,
    enpiValue: mongoose.Schema.Types.Mixed,
    wrtKwh: Number
  }
}, { timestamps: true });

const UtilityData = mongoose.models.UtilityData || mongoose.model('UtilityData', UtilityDataSchema);

// GET Utility data by month
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    const data = await UtilityData.findOne({ monthYear: month, type: 'utility' });
    res.json(data || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SAVE / UPDATE Utility data
router.post('/save', async (req, res) => {
  try {
    const { monthYear, rows, totals } = req.body;
    const updated = await UtilityData.findOneAndUpdate(
      { monthYear, type: 'utility' },
      { monthYear, type: 'utility', rows, totals },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Utility YoY Comparison Data (Apr to Mar for 4 Main Equipments)
router.get('/yoy', async (req, res) => {
  try {
    const { year = '2025-26' } = req.query;
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const equipments = ['ARP(LNG)', 'Boiler(LPG)', 'Pump house', 'MEE PLANT(LPG)'];

    const yoyResult = equipments.map(eq => {
      const monthlyBreakdown = months.map(m => {
        let baseElect = 50000;
        let baseProd = 1500;

        if (eq === 'ARP(LNG)') { baseElect = 57640; baseProd = 1196; }
        else if (eq === 'Boiler(LPG)') { baseElect = 11696; baseProd = 1808; }
        else if (eq === 'Pump house') { baseElect = 260470; baseProd = 36379; }
        else if (eq === 'MEE PLANT(LPG)') { baseElect = 46840; baseProd = 1678; }

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
const {prepareSave}=require('../utils/fuelConversion');
const { createFacilityYoYHandler } = require('../utils/facilityYoY');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const UtilityDataSchema = new mongoose.Schema({
  monthYear: { type: String, required: true, unique: true },
  inputBasis: String,
  formula: { ELECTRICITY:Number, LNG:Number, LPG:Number, HSD:Number },
  type: { type: String, default: 'utility' },
  rows: [
    {
      equipment: String,
      fuelType: String, fuelQuantity: Number, hsdLitres: Number, fuelFactor: Number, hsdFactor: Number,
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
    const { monthYear, rows, totals, inputBasis, formula } = prepareSave('utility', req.body);
    const updated = await UtilityData.findOneAndUpdate(
      { monthYear, type: 'utility' },
      { monthYear, type: 'utility', rows, totals, inputBasis, formula },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET saved monthly YoY comparison (April to March)
router.get('/yoy', createFacilityYoYHandler(UtilityData, ['ARP(LNG)', 'Boiler(LPG)', 'Pump house', 'MEE PLANT(LPG)']));

module.exports = router;
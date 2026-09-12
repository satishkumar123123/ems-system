const {prepareSave}=require('../utils/fuelConversion');
const { createFacilityYoYHandler } = require('../utils/facilityYoY');
// backend/routes/hsuRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// 1. Schema Definition (Pehle wala intact hai)
const HsuDataSchema = new mongoose.Schema({
  monthYear: { type: String, required: true, unique: true },
  inputBasis: String,
  formula: { ELECTRICITY:Number, LNG:Number, LPG:Number, HSD:Number },
  rows: [
    {
      equipment: String,
      fuelType: String, fuelQuantity: Number, hsdLitres: Number, fuelFactor: Number, hsdFactor: Number,
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
    const { monthYear, rows, totals, inputBasis, formula } = prepareSave('hsu', req.body);
    const updated = await HsuData.findOneAndUpdate(
      { monthYear },
      { monthYear, rows, totals, inputBasis, formula },
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
router.get('/yoy', createFacilityYoYHandler(HsuData, ['ZY-120 MILL', 'FD-200 MILL', 'OLIMPIA MILL', 'ZY-500 MILL+1800KWHF']));

module.exports = router;
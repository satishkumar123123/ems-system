const {prepareSave}=require('../utils/fuelConversion');
const { createFacilityYoYHandler } = require('../utils/facilityYoY');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const WiderDataSchema = new mongoose.Schema({
  monthYear: { type: String, required: true, unique: true },
  inputBasis: String,
  formula: { ELECTRICITY:Number, LNG:Number, LPG:Number, HSD:Number },
  type: { type: String, default: 'wider' },
  rows: [
    {
      equipment: String,
      fuelType: String, fuelQuantity: Number, hsdLitres: Number, fuelFactor: Number, hsdFactor: Number,
      electricity: Number,
      lng: Number,
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
    lng: Number,
    hsd: Number,
    totalConsumption: Number,
    production: Number,
    enpiValue: Number,
    wrtKwh: Number
  }
}, { timestamps: true });

const WiderData = mongoose.models.WiderData || mongoose.model('WiderData', WiderDataSchema);

// GET Wider data by month (Flexible query by monthYear)
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    const data = await WiderData.findOne({ monthYear: month });
    res.json(data || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SAVE / UPDATE Wider data
router.post('/save', async (req, res) => {
  try {
    const { monthYear, rows, totals, inputBasis, formula } = prepareSave('wider', req.body);
    const updated = await WiderData.findOneAndUpdate(
      { monthYear },
      { monthYear, type: 'wider', rows, totals, inputBasis, formula },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET saved monthly YoY comparison (April to March)
router.get('/yoy', createFacilityYoYHandler(WiderData, ['6HI', 'CGL', 'CCL', 'COMPRESSOR']));

module.exports = router;
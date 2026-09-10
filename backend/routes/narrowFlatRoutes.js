const {prepareSave}=require('../utils/fuelConversion');
const { createFacilityYoYHandler } = require('../utils/facilityYoY');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const NarrowFlatDataSchema = new mongoose.Schema({
  monthYear: { type: String, required: true, unique: true },
  inputBasis: String,
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

const NarrowFlatData = mongoose.models.NarrowFlatData || mongoose.model('NarrowFlatData', NarrowFlatDataSchema);

// GET Narrow Flat data by month
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    const data = await NarrowFlatData.findOne({ monthYear: month });
    res.json(data || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SAVE / UPDATE Narrow Flat data
router.post('/save', async (req, res) => {
  try {
    const { monthYear, rows, totals, inputBasis } = prepareSave('narrow-flat', req.body);
    const updated = await NarrowFlatData.findOneAndUpdate(
      { monthYear },
      { monthYear, rows, totals, inputBasis },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET saved monthly YoY comparison (April to March)
router.get('/yoy', createFacilityYoYHandler(NarrowFlatData, ['CRM', 'CGL', 'CCL', 'COMPRESSOR', 'BOILER']));

module.exports = router;
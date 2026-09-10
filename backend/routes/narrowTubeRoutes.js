const {prepareSave}=require('../utils/fuelConversion');
const { createFacilityYoYHandler } = require('../utils/facilityYoY');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const NarrowTubeDataSchema = new mongoose.Schema({
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
    const { monthYear, rows, totals, inputBasis } = prepareSave('narrow-tube', req.body);
    const updated = await NarrowTubeData.findOneAndUpdate(
      { monthYear },
      { monthYear, rows, totals, inputBasis },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET YoY Data (4 Equipments: COMPRESSOR, GMT-1, GMT-2, PUMP HOUSE)
router.get('/yoy', createFacilityYoYHandler(NarrowTubeData, ['COMPRESSOR', 'GMT-1', 'GMT-2', 'PUMP HOUSE']));

module.exports = router;
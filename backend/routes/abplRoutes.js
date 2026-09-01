const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// GET Aggregated ABPL Data from all 5 Plants for a selected month
router.get('/', async (req, res) => {
  try {
    const { month = '2026-04' } = req.query;

    // Sabhi models ko safely get karein
    const WiderData = mongoose.models.WiderData || mongoose.model('WiderData');
    const UtilityData = mongoose.models.UtilityData || mongoose.model('UtilityData');
    const HsuData = mongoose.models.HsuData || mongoose.model('HsuData');
    const NarrowFlatData = mongoose.models.NarrowFlatData || mongoose.model('NarrowFlatData');
    const NarrowTubeData = mongoose.models.NarrowTubeData || mongoose.model('NarrowTubeData');

    // Parallel DB fetch for the selected month
    const [wider, utility, hsu, narrowFlat, narrowTube] = await Promise.all([
      WiderData.findOne({ monthYear: month }),
      UtilityData.findOne({ monthYear: month }),
      HsuData.findOne({ monthYear: month }),
      NarrowFlatData.findOne({ monthYear: month }),
      NarrowTubeData.findOne({ monthYear: month }),
    ]);

    const plantsList = [
      {
        id: 'wider',
        name: 'Wider Facility',
        color: '#6366f1',
        electricity: wider?.totals?.electricity || 0,
        lpg: (wider?.totals?.lng || 0),
        hsd: wider?.totals?.hsd || 0,
        totalConsumption: wider?.totals?.totalConsumption || 0,
        production: wider?.totals?.production || 0,
      },
      {
        id: 'utility',
        name: 'Utility Facility',
        color: '#06b6d4',
        electricity: utility?.totals?.electricity || 0,
        lpg: utility?.totals?.lngLpg || 0,
        hsd: utility?.totals?.hsd || 0,
        totalConsumption: utility?.totals?.totalConsumption || 0,
        production: utility?.totals?.production || 0,
      },
      {
        id: 'hsu',
        name: 'HSU Facility',
        color: '#10b981',
        electricity: hsu?.totals?.electricity || 0,
        lpg: hsu?.totals?.lpg || 0,
        hsd: hsu?.totals?.hsd || 0,
        totalConsumption: hsu?.totals?.totalConsumption || 0,
        production: hsu?.totals?.production || 0,
      },
      {
        id: 'narrow-flat',
        name: 'Narrow Flat',
        color: '#f59e0b',
        electricity: narrowFlat?.totals?.electricity || 0,
        lpg: narrowFlat?.totals?.lpg || 0,
        hsd: narrowFlat?.totals?.hsd || 0,
        totalConsumption: narrowFlat?.totals?.totalConsumption || 0,
        production: narrowFlat?.totals?.production || 0,
      },
      {
        id: 'narrow-tube',
        name: 'Narrow Tube',
        color: '#ec4899',
        electricity: narrowTube?.totals?.electricity || 0,
        lpg: narrowTube?.totals?.lpg || 0,
        hsd: narrowTube?.totals?.hsd || 0,
        totalConsumption: narrowTube?.totals?.totalConsumption || 0,
        production: narrowTube?.totals?.production || 0,
      },
    ];

    // Grand Totals across all plants
    const grandTotals = plantsList.reduce(
      (acc, curr) => ({
        electricity: acc.electricity + curr.electricity,
        lpg: acc.lpg + curr.lpg,
        hsd: acc.hsd + curr.hsd,
        totalConsumption: acc.totalConsumption + curr.totalConsumption,
        production: acc.production + curr.production,
      }),
      { electricity: 0, lpg: 0, hsd: 0, totalConsumption: 0, production: 0 }
    );

    res.json({
      monthYear: month,
      totals: grandTotals,
      plants: plantsList,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
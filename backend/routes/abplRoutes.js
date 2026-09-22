const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// GET Aggregated ABPL Data from all 5 Plants for a selected month
router.get('/', async (req, res) => {
  try {
    const { month = '2026-08' } = req.query;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return res.status(400).json({ error: 'Use YYYY-MM for month.' });

    // Sabhi models ko safely get karein
    const WiderData = mongoose.models.WiderData || mongoose.model('WiderData');
    const UtilityData = mongoose.models.UtilityData || mongoose.model('UtilityData');
    const HsuData = mongoose.models.HsuData || mongoose.model('HsuData');
    const NarrowFlatData = mongoose.models.NarrowFlatData || mongoose.model('NarrowFlatData');
    const NarrowTubeData = mongoose.models.NarrowTubeData || mongoose.model('NarrowTubeData');

    // Parallel DB fetch for the selected month
    const [wider, utility, hsu, narrowFlat, narrowTube] = await Promise.all([
      WiderData.findOne({ monthYear: month }).lean(),
      UtilityData.findOne({ monthYear: month }).lean(),
      HsuData.findOne({ monthYear: month }).lean(),
      NarrowFlatData.findOne({ monthYear: month }).lean(),
      NarrowTubeData.findOne({ monthYear: month }).lean(),
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
        lpg: utility?.totals?.lngLpg ?? utility?.totals?.lng ?? utility?.totals?.lpg ?? 0,
        hsd: utility?.totals?.hsd || 0,
        totalConsumption: utility?.totals?.totalConsumption || 0,
        production: utility?.totals?.production || 0,
      },
      {
        id: 'hsu',
        name: 'HSU Facility',
        color: '#10b981',
        electricity: hsu?.totals?.electricity || 0,
        lpg: hsu?.totals?.lpg ?? hsu?.totals?.lng ?? hsu?.totals?.lngLpg ?? 0,
        hsd: hsu?.totals?.hsd || 0,
        totalConsumption: hsu?.totals?.totalConsumption || 0,
        production: hsu?.totals?.production || 0,
      },
      {
        id: 'narrow-flat',
        name: 'Narrow Flat',
        color: '#f59e0b',
        electricity: narrowFlat?.totals?.electricity || 0,
        lpg: narrowFlat?.totals?.lpg ?? narrowFlat?.totals?.lng ?? narrowFlat?.totals?.lngLpg ?? 0,
        hsd: narrowFlat?.totals?.hsd || 0,
        totalConsumption: narrowFlat?.totals?.totalConsumption || 0,
        production: narrowFlat?.totals?.production || 0,
      },
      {
        id: 'narrow-tube',
        name: 'Narrow Tube',
        color: '#ec4899',
        electricity: narrowTube?.totals?.electricity || 0,
        lpg: narrowTube?.totals?.lpg ?? narrowTube?.totals?.lng ?? narrowTube?.totals?.lngLpg ?? 0,
        hsd: narrowTube?.totals?.hsd || 0,
        totalConsumption: narrowTube?.totals?.totalConsumption || 0,
        production: narrowTube?.totals?.production || 0,
      },
    ];

    // Preserve missing records/metrics instead of turning them into recorded zeros.
    const documents = [wider, utility, hsu, narrowFlat, narrowTube];
    const keys = ['electricity', 'lpg', 'hsd', 'totalConsumption', 'production'];
    plantsList.forEach((plant, index) => {
      const doc = documents[index];
      plant.available = Boolean(doc);
      const totals = doc?.totals || {};
      keys.forEach(key => {
        const raw = key === 'lpg' ? totals.lngLpg ?? totals.lng ?? totals.lpg : totals[key];
        plant[key] = raw == null || String(raw).trim() === '' || !Number.isFinite(Number(raw)) ? null : Number(raw);
      });
    });
    // Only complete corporate totals can be compared across months.
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
    keys.forEach(key => {
      if (plantsList.some(plant => plant[key] == null)) grandTotals[key] = null;
    });

    res.json({
      monthYear: month,
      totals: grandTotals,
      plants: plantsList,
      availability: { available: plantsList.filter(p => p.available).length, expected: plantsList.length },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

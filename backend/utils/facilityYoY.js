const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const equipmentKey = name => String(name || '').trim().replace(/\s+/g, ' ').toUpperCase();
const numberOrZero = value => {
  const number = Number(typeof value === 'string' ? value.replace(/,/g, '').trim() : value);
  return Number.isFinite(number) ? number : 0;
};

function financialMonths(startYear) {
  return MONTHS.map((month, index) => ({
    month,
    monthYear: `${startYear + (index >= 9 ? 1 : 0)}-${String(((index + 3) % 12) + 1).padStart(2, '0')}`,
  }));
}

function createFacilityYoYHandler(Model, equipments) {
  return async (req, res) => {
    const year = req.query.year ?? '2026-27';
    const match = typeof year === 'string' && /^(\d{4})-(\d{2})$/.exec(year);
    if (!match || Number(match[2]) !== (Number(match[1]) + 1) % 100) {
      return res.status(400).json({ error: 'Use a financial year such as 2026-27.' });
    }

    try {
      const startYear = Number(match[1]);
      const previous = financialMonths(startYear - 1);
      const current = financialMonths(startYear);
      // One query for both April–March periods. Missing records remain zero.
      const records = await Model.find({
        monthYear: { $in: [...previous, ...current].map(item => item.monthYear) },
      }).select('monthYear rows').lean();
      const rowsByMonth = new Map(records.map(record => [
        record.monthYear,
        new Map((record.rows || []).map(row => [equipmentKey(row.equipment), row])),
      ]));

      const data = equipments.map(equipment => ({
        equipment,
        monthlyData: current.map((item, index) => {
          const prevRow = rowsByMonth.get(previous[index].monthYear)?.get(equipmentKey(equipment));
          const currRow = rowsByMonth.get(item.monthYear)?.get(equipmentKey(equipment));
          const pair = key => ({ prevYear: numberOrZero(prevRow?.[key]), currYear: numberOrZero(currRow?.[key]) });
          return {
            month: item.month,
            prevMonthYear: previous[index].monthYear,
            currMonthYear: item.monthYear,
            electricity: pair('electricity'),
            totalConsumption: pair('totalConsumption'),
            production: pair('production'),
            // Preserve the existing API field for older clients, using saved values.
            enpi: pair('enpiValue'),
          };
        }),
      }));

      return res.json({
        source: 'monthly-records',
        financialYear: year,
        prevFinancialYear: `${startYear - 1}-${String(startYear % 100).padStart(2, '0')}`,
        data,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  };
}

module.exports = { createFacilityYoYHandler, financialMonths };

const test = require('node:test');
const assert = require('node:assert/strict');
const { createFacilityYoYHandler, financialMonths } = require('../utils/facilityYoY');

async function request(records, year, equipments = ['MILL', 'COMPRESSOR']) {
  let query;
  let calls = 0;
  const Model = {
    find(filter) {
      query = filter;
      calls++;
      return {
        select(fields) {
          assert.equal(fields, 'monthYear rows');
          return { lean: async () => records.filter(row => filter.monthYear.$in.includes(row.monthYear)) };
        },
      };
    },
  };
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await createFacilityYoYHandler(Model, equipments)({ query: year === undefined ? {} : { year } }, response);
  return { ...response, query, calls };
}

test('financial periods run April to March across the calendar-year boundary', () => {
  const months = financialMonths(2026);
  assert.equal(months.length, 12);
  assert.deepEqual(months[0], { month: 'Apr', monthYear: '2026-04' });
  assert.deepEqual(months[8], { month: 'Dec', monthYear: '2026-12' });
  assert.deepEqual(months[9], { month: 'Jan', monthYear: '2027-01' });
  assert.deepEqual(months[11], { month: 'Mar', monthYear: '2027-03' });
});

test('defaults to FY 2025-26 vs 2026-27 and reads exactly 24 months once', async () => {
  const result = await request([]);
  assert.equal(result.calls, 1);
  assert.equal(result.body.source, 'monthly-records');
  assert.equal(result.body.financialYear, '2026-27');
  assert.equal(result.body.prevFinancialYear, '2025-26');
  assert.equal(new Set(result.query.monthYear.$in).size, 24);
  assert.equal(result.query.monthYear.$in[0], '2025-04');
  assert.equal(result.query.monthYear.$in.at(-1), '2027-03');
  assert.deepEqual(result.body.data.map(row => row.equipment), ['MILL', 'COMPRESSOR']);
  for (const equipment of result.body.data) {
    assert.equal(equipment.monthlyData.length, 12);
    for (const month of equipment.monthlyData) {
      for (const metric of ['electricity', 'totalConsumption', 'production', 'enpi']) {
        assert.deepEqual(month[metric], { prevYear: 0, currYear: 0 });
      }
    }
  }
});

test('uses saved fields, preserves zero, and matches equipment case and whitespace', async () => {
  const records = [
    { monthYear: '2025-06', rows: [{ equipment: ' mill ', electricity: '1,234.5', totalConsumption: 3000, production: 20, enpiValue: 150 }] },
    { monthYear: '2026-06', rows: [{ equipment: 'MILL', electricity: 0, totalConsumption: 4500, production: 30, enpiValue: 0 }, { equipment: 'OTHER', electricity: 99999 }] },
    { monthYear: '2026-01', rows: [{ equipment: 'MILL', electricity: 111 }] },
    { monthYear: '2027-01', rows: [{ equipment: 'MILL', electricity: 222 }] },
    { monthYear: '2025-03', rows: [{ equipment: 'MILL', electricity: 99999 }] },
    { monthYear: '2027-04', rows: [{ equipment: 'MILL', electricity: 99999 }] },
  ];
  const result = await request(records, '2026-27');
  const months = result.body.data[0].monthlyData;
  assert.deepEqual(months[2].electricity, { prevYear: 1234.5, currYear: 0 });
  assert.deepEqual(months[2].totalConsumption, { prevYear: 3000, currYear: 4500 });
  assert.deepEqual(months[2].production, { prevYear: 20, currYear: 30 });
  assert.deepEqual(months[2].enpi, { prevYear: 150, currYear: 0 });
  assert.deepEqual(months[9].electricity, { prevYear: 111, currYear: 222 });
  assert.deepEqual(months[11].electricity, { prevYear: 0, currYear: 0 });
  assert.deepEqual(result.body.data[1].monthlyData[2].electricity, { prevYear: 0, currYear: 0 });
  assert.deepEqual((await request(records, '2026-27')).body, result.body, 'identical records never generate random values');
});

test('null or invalid fields are zero without inventing totals or production', async () => {
  const result = await request([{ monthYear: '2026-04', rows: [{ equipment: 'MILL', electricity: 50, totalConsumption: null, production: '---', enpiValue: '' }] }]);
  const april = result.body.data[0].monthlyData[0];
  assert.equal(april.electricity.currYear, 50);
  for (const metric of ['totalConsumption', 'production', 'enpi']) assert.equal(april[metric].currYear, 0);
});

test('malformed or non-consecutive financial years do not query the database', async () => {
  for (const year of ['2026-28', '2026', '', ['2026-27'], { $ne: null }]) {
    const result = await request([], year);
    assert.equal(result.statusCode, 400);
    assert.equal(result.calls, 0);
  }
});

test('database failures remain errors rather than a misleading zero comparison', async () => {
  const Model = { find() { throw new Error('Database unavailable'); } };
  const response = { status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
  await createFacilityYoYHandler(Model, ['MILL'])({ query: {} }, response);
  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { error: 'Database unavailable' });
});

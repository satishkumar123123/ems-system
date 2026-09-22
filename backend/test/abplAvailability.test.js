const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../routes/abplRoutes.js'), 'utf8');
async function request(docs, month = '2026-08') {
  let handler, body, status = 200;
  const names = ['WiderData', 'UtilityData', 'HsuData', 'NarrowFlatData', 'NarrowTubeData'];
  const models = Object.fromEntries(names.map((name, i) => [name, { findOne: () => ({ lean: async () => docs[i] }) }]));
  vm.runInNewContext(source, { module: { exports: {} }, require: name => name === 'express' ? { Router: () => ({ get: (_, fn) => { handler = fn; } }) } : { models } });
  const res = { status(n) { status = n; return this; }, json(value) { body = JSON.parse(JSON.stringify(value)); return this; } };
  await handler({ query: { month } }, res);
  return { status, body };
}
const record = () => ({ totals: { electricity: 0, lng: 0, hsd: 0, totalConsumption: 0, production: 0 } });
test('recorded zeros remain available corporate zeros', async () => {
  const { body } = await request(Array.from({ length: 5 }, record));
  assert.equal(body.availability.available, 5);
  assert.equal(body.totals.electricity, 0);
  assert.ok(body.plants.every(p => p.available && p.lpg === 0));
});
test('missing plant invalidates totals without discarding other plant values', async () => {
  const { body } = await request([null, record(), record(), record(), record()]);
  assert.equal(body.availability.available, 4);
  assert.equal(body.plants[0].electricity, null);
  assert.equal(body.plants[1].electricity, 0);
  assert.equal(body.totals.production, null);
});
test('blank metric invalidates only that corporate metric', async () => {
  const docs = Array.from({ length: 5 }, record); docs[0].totals.electricity = '';
  const { body } = await request(docs);
  assert.equal(body.totals.electricity, null);
  assert.equal(body.totals.production, 0);
});
test('invalid month rejected', async () => assert.equal((await request([], '2026-13')).status, 400));

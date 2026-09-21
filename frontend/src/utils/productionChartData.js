// Production-chart exclusion only; never use this to change saved rows or totals.
export const isCompressor = name => /compressor/i.test(String(name ?? ''));
export function productionChartData(rows) {
  return rows.filter(row => !isCompressor(row.equipment)).map(row => ({
    name: String(row.equipment ?? '').trim(),
    value: Number(String(row.production ?? '').replace(/,/g, '').trim()),
  })).filter(row => row.name && Number.isFinite(row.value) && row.value > 0);
}

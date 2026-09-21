const numeric = value => {
  if (value == null || String(value).trim() === '' || String(value).trim() === 'N/A') return null;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};
export function chatVisualData(table) {
  if (!table || !Array.isArray(table.columns) || !Array.isArray(table.rows)) return null;
  // Restrict charts to energy and SEC: production tables can mix tonnes and other units.
  const metrics = table.columns.flatMap((name, index) => /electricity|total energy|total sec/i.test(name) && !/coverage/i.test(name) ? [{name, index}] : []);
  if (!metrics.length) return null;
  const month = table.columns.indexOf('Month');
  const equipment = table.columns.indexOf('Equipment');
  return {title: table.title, metrics, temporal: month >= 0 && equipment < 0,
    rows: table.rows.map((row, index) => ({label: [row[0], month >= 0 ? row[month] : null, equipment >= 0 ? row[equipment] : null].filter(Boolean).join(' · '), ...Object.fromEntries(metrics.map(m => [`v${m.index}`, numeric(row[m.index])])), key:index}))};
}
export const formatChatValue = value => value == null || !Number.isFinite(value) ? 'N/A' : value.toLocaleString('en-IN', {maximumFractionDigits:2});

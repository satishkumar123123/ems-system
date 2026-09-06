// Never mix tonnes with utility output (CFM, days, litres, etc.).
export function numeric(value) {
  if (value == null || String(value).trim() === '') return null;
  const number = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(number) && number >= 0 ? number : null;
}
export function equipmentSec(row) {
  const unit = String(row.enpiUnit || '').replace(/\s/g, '').toLowerCase();
  const tonnes = /^kwh\/(mt|t|ton|tons|tonne|tonnes)$/.test(unit);
  const production = numeric(row.production), electricity = numeric(row.electricity), energy = numeric(row.totalConsumption);
  const reason = !tonnes ? 'Output unit is not confirmed as tonnes' : production == null ? 'Production missing / invalid' : production === 0 ? 'Zero production' : '';
  return { name: row.equipment, production, electricity, energy, tonnes, reason, electricSec: !reason && electricity != null ? electricity / production : null, totalSec: !reason && energy != null ? energy / production : null };
}
export function summarizeSec(rows) {
  const data = rows.map(equipmentSec);
  const aggregate = key => {
    const eligible = data.filter(r => r.tonnes && r.production != null);
    // A plant result requires complete energy and production for all tonne-based rows.
    if (!eligible.length || data.some(r => r.tonnes && (r.production == null || r[key] == null))) return null;
    const output = eligible.reduce((sum, r) => sum + r.production, 0);
    return output > 0 ? eligible.reduce((sum, r) => sum + r[key], 0) / output : null;
  };
  return { data, electricSec: aggregate('electricity'), totalSec: aggregate('energy'), included: data.filter(r => r.tonnes).length, excluded: data.filter(r => !r.tonnes).length };
}

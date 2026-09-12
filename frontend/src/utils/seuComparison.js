const valid = n => typeof n === 'number' && Number.isFinite(n);
export const normalizedUnit = unit => String(unit || '').toLowerCase().replace(/³/g, '3').replace(/²/g, '2').replace(/\s/g, '').replace(/\/ton(?:ne)?s?$/, '/mt');
export function compareSeu(previous, current, start = 0, end = 11) {
  const unitMatches = Boolean(previous && current && previous.unit && normalizedUnit(previous.unit) === normalizedUnit(current.unit));
  const points = Array.from({length: end - start + 1}, (_, i) => {
    const index = start + i;
    return {index, month:['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'][index], previous:previous?.values[index] ?? null, current:current?.values[index] ?? null};
  });
  const paired = unitMatches ? points.filter(p => valid(p.previous) && valid(p.current)) : [];
  const average = key => paired.length ? paired.reduce((s,p) => s+p[key],0)/paired.length : null;
  const previousAverage = average('previous'), currentAverage = average('current');
  const change = previousAverage > 0 ? (currentAverage-previousAverage)/previousAverage*100 : null;
  const directionMatches = previous?.direction === current?.direction;
  const improvement = change == null || !directionMatches ? null : current.direction === 'higher' ? change : -change;
  const reason = !previous ? 'Not listed in 2025-26' : !current ? 'Not listed in 2026-27' : !unitMatches ? 'Different or missing units' : !paired.length ? 'No common recorded months' : previousAverage === 0 ? 'Previous average is zero' : !directionMatches ? 'Performance direction changed' : '';
  return {id:(current||previous).id,name:(current||previous).name,plant:(current||previous).plant,previous,current,points,paired,unitMatches,previousAverage,currentAverage,change,improvement,reason};
}
export function comparisonRows(previousRows,currentRows,ids,start=0,end=11){
 return ids.map(id=>compareSeu(previousRows.find(r=>r.id===id),currentRows.find(r=>r.id===id),start,end));
}
export const formatNumber = n => valid(n) ? n.toLocaleString('en-IN',{maximumFractionDigits:2}) : '—';

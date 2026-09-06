export function scheduleSummary(items, date) {
  const unfinished = i => !['Completed', 'Verified'].includes(i.status);
  return { pending: items.filter(i => i.kind === 'action' && i.status !== 'Verified').length, overdue: items.filter(i => unfinished(i) && i.date < date).length, upcoming: items.filter(i => ['audit', 'meeting'].includes(i.kind) && unfinished(i) && i.date >= date).sort((a,b) => a.date.localeCompare(b.date)), followups: items.filter(i => i.kind === 'meeting' && i.nextDate >= date).sort((a,b) => a.nextDate.localeCompare(b.nextDate)) };
}

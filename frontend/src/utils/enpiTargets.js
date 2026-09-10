export function trendMonths(month,count){const [y,m]=month.split('-').map(Number);return Array.from({length:count},(_,i)=>new Date(Date.UTC(y,m-count+i,1)).toISOString().slice(0,7));}
export function performance(actual,target){return actual==null||target==null?'No comparison':actual>target?'Above target':actual<target?'Better than target':'On target';}

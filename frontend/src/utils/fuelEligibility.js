export const AUGUST_REFERENCE_MONTH='2026-08';
export const equipmentKey=name=>String(name||'').replace(/\((?:LNG|LPG)\)/gi,'').trim().replace(/\s+/g,' ').toUpperCase();
export function augustFuelEquipment(data){
 if(data===null)return new Set();
 if(!data||!Array.isArray(data.rows))throw Error('August fuel data is invalid.');
 return new Set(data.rows.filter(row=>[row.lngLpg,row.lng,row.lpg].some(value=>value!=null&&String(value).trim()!==''&&Number(String(value).replaceAll(',',''))>0)).map(row=>equipmentKey(row.equipment)));
}

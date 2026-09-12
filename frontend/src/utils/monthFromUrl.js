export function monthFromUrl(fallback='2026-08') {
 const month=new URLSearchParams(window.location.search).get('month');
 return /^20\d{2}-(0[1-9]|1[0-2])$/.test(month||'')?month:fallback;
}

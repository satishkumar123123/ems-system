import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { createQrLabel, createLabelsPdf, equipmentLink } from '../utils/qrLabels';
import catalog from '../utils/equipmentQrCatalog.json';
import './plant-qr.css';
// Preserve existing printed QR URLs while opening the new detail view.
export function useEquipmentQrTarget() {
 const { search, pathname } = useLocation();
 const navigate = useNavigate();
 useEffect(() => {
  const params = new URLSearchParams(search);
  if (params.get('equipment')) navigate(`/equipment${pathname}?${params.toString()}`, { replace: true });
 }, [search, pathname, navigate]);
}
function QrCard({plant,name}) {
 const [src,setSrc] = useState(''); const [error,setError] = useState(''); const [retry,setRetry] = useState(0);
 const link = equipmentLink(plant,name); const title = name || 'Plant Dashboard';
 useEffect(() => {let active=true;setError('');createQrLabel(plant,name).then(v=>{if(active)setSrc(v);}).catch(()=>{if(active)setError('QR generation failed.');});return()=>{active=false;};},[link,plant,name,retry]);
 return <article className="plant-qr-card"><small>{plant.replaceAll('-',' ').toUpperCase()}</small><h3>{title}</h3>
 {src ? <img src={src} width="180" height="240" alt={`${title} QR code`}/> : <p role="status">{error || 'Generating QR…'}</p>}
 {error && <button onClick={()=>setRetry(n=>n+1)}>Retry</button>}
 <div className="plant-qr-actions">{src && <a href={src} download={`${plant}-${title.replace(/[^a-z0-9]/gi,'-')}-QR.png`}>Download PNG</a>}<a href={link}>{name?'Open equipment':'Open plant'}</a></div></article>;
}
export default function PlantQrCodes({plant}) {
 const [exporting,setExporting]=useState(false);const [exportError,setExportError]=useState('');
 const [open,setOpen]=useState(false);const [query,setQuery]=useState('');const dialog=useRef(null);const button=useRef(null);const id=useId();
 useEffect(()=>{if(!open)return;const node=dialog.current;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';node.showModal();return()=>{node.close();document.body.style.overflow=overflow;button.current?.focus();};},[open]);
 const plants=plant==='abpl'?Object.keys(catalog):[plant];
 const entries=plants.flatMap(unit=>(catalog[unit]||[]).map(name=>({plant:unit,name}))).filter(item=>`${item.plant} ${item.name}`.toLowerCase().includes(query.toLowerCase()));
 const exportLabels=async(print=false)=>{
  if(exporting)return;
  const preview=print?window.open('about:blank','_blank'):null;
  if(print&&!preview){setExportError('Allow pop-ups to print, or use Download PDF.');return;}
  if(preview)preview.document.body.textContent='Preparing QR labels…';
  setExporting(true);setExportError('');
  try{
   const allEntries=plants.flatMap(unit=>(catalog[unit]||[]).map(name=>({plant:unit,name})));
   const pdf=await createLabelsPdf(allEntries,window.location.origin,print);
   if(print){const url=URL.createObjectURL(pdf.output('blob'));preview.location.href=url;setTimeout(()=>URL.revokeObjectURL(url),120000);}
   else pdf.save(`${plant}-equipment-QR-labels.pdf`);
  }catch{preview?.close();setExportError('Could not create labels. Please retry.');}
  finally{setExporting(false);}
 };
 return <><button ref={button} type="button" className="plant-qr-button" onClick={()=>setOpen(true)}>▦ QR Codes / Download</button>
 {open && createPortal(<dialog ref={dialog} className="plant-qr-dialog" aria-labelledby={id} onCancel={e=>{e.preventDefault();setOpen(false);}} onClose={()=>setOpen(false)}>
 <header><div><h2 id={id}>{plant.replaceAll('-',' ').toUpperCase()} — Equipment QR Codes</h2><p>Scan an equipment QR to select a month and view its parameters and charts.</p></div><button type="button" autoFocus onClick={()=>setOpen(false)}>Close ✕</button></header>
 <div className="plant-qr-export"><button type="button" disabled={exporting} onClick={()=>exportLabels(false)}>{exporting?'Preparing labels…':'Download All Labels PDF'}</button><button type="button" disabled={exporting} onClick={()=>exportLabels(true)}>Print All Labels</button><span>All equipment · 6 labels per A4 sheet</span></div>
 {exportError && <p role="alert">{exportError}</p>}
 <input className="plant-qr-search" aria-label="Search equipment" placeholder="Search equipment or plant…" value={query} onChange={e=>setQuery(e.target.value)}/>
 <div className="plant-qr-grid">{!query && <QrCard plant={plant}/>} {entries.map(item=><QrCard key={`${item.plant}-${item.name}`} {...item}/>)}</div>
 {!entries.length && query && <p role="status">No matching equipment.</p>}
 </dialog>,document.body)}</>;
}

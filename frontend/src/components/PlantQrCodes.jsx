import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
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
 const url = new URL(name ? `/equipment/${plant}` : `/${plant}`,window.location.origin); if(name) url.searchParams.set('equipment',name);
 const link = url.href; const title = name || 'Plant Dashboard';
 useEffect(() => {let active=true;setError('');QRCode.toDataURL(link,{width:768,margin:4,errorCorrectionLevel:'M',color:{dark:'#000000',light:'#ffffff'}}).then(v=>{if(active)setSrc(v);}).catch(()=>{if(active)setError('QR generation failed.');});return()=>{active=false;};},[link,retry]);
 return <article className="plant-qr-card"><small>{plant.replaceAll('-',' ').toUpperCase()}</small><h3>{title}</h3>
 {src ? <img src={src} width="180" height="180" alt={`${title} QR code`}/> : <p role="status">{error || 'Generating QR…'}</p>}
 {error && <button onClick={()=>setRetry(n=>n+1)}>Retry</button>}
 <div className="plant-qr-actions">{src && <a href={src} download={`${plant}-${title.replace(/[^a-z0-9]/gi,'-')}-QR.png`}>Download PNG</a>}<a href={link}>{name?'Open equipment':'Open plant'}</a></div></article>;
}
export default function PlantQrCodes({plant}) {
 const [open,setOpen]=useState(false);const [query,setQuery]=useState('');const dialog=useRef(null);const button=useRef(null);const id=useId();
 useEffect(()=>{if(!open)return;const node=dialog.current;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';node.showModal();return()=>{node.close();document.body.style.overflow=overflow;button.current?.focus();};},[open]);
 const plants=plant==='abpl'?Object.keys(catalog):[plant];
 const entries=plants.flatMap(unit=>(catalog[unit]||[]).map(name=>({plant:unit,name}))).filter(item=>`${item.plant} ${item.name}`.toLowerCase().includes(query.toLowerCase()));
 return <><button ref={button} type="button" className="plant-qr-button" onClick={()=>setOpen(true)}>▦ QR Codes / Download</button>
 {open && createPortal(<dialog ref={dialog} className="plant-qr-dialog" aria-labelledby={id} onCancel={e=>{e.preventDefault();setOpen(false);}} onClose={()=>setOpen(false)}>
 <header><div><h2 id={id}>{plant.replaceAll('-',' ').toUpperCase()} — Equipment QR Codes</h2><p>Scan an equipment QR to select a month and view its parameters and charts.</p></div><button type="button" autoFocus onClick={()=>setOpen(false)}>Close ✕</button></header>
 <input className="plant-qr-search" aria-label="Search equipment" placeholder="Search equipment or plant…" value={query} onChange={e=>setQuery(e.target.value)}/>
 <div className="plant-qr-grid">{!query && <QrCard plant={plant}/>} {entries.map(item=><QrCard key={`${item.plant}-${item.name}`} {...item}/>)}</div>
 {!entries.length && query && <p role="status">No matching equipment.</p>}
 </dialog>,document.body)}</>;
}

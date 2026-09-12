import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {API_BASE_URL,apiFetch} from '../config/api';
import {FACTORS,defaultFormula,fuelType,quantityMonth,validateFormula} from '../utils/fuelConversion';
import {AUGUST_REFERENCE_MONTH,augustFuelEquipment,equipmentKey} from '../utils/fuelEligibility';
import './fuel-controls.css';
export function useAugustFuelEquipment(plant){
 const [state,setState]=useState({plant,eligible:new Set(),loading:true,error:''}),[attempt,retry]=useState(0);
 useEffect(()=>{const controller=new AbortController();setState({plant,eligible:new Set(),loading:true,error:''});apiFetch(`${API_BASE_URL}/api/${plant}?month=${AUGUST_REFERENCE_MONTH}`,{signal:controller.signal}).then(r=>r.json()).then(data=>{if(!controller.signal.aborted)setState({plant,eligible:augustFuelEquipment(data),loading:false,error:data===null?'August 2026 records are missing; fuel selectors cannot be determined.':''});}).catch(e=>{if(!controller.signal.aborted)setState({plant,eligible:new Set(),loading:false,error:e.message});});return()=>controller.abort();},[plant,attempt]);
 return {...state,allows:name=>state.plant===plant&&state.eligible.has(equipmentKey(name)),retry:()=>retry(n=>n+1)};
}
export function FuelSelector({plant,row,eligible,onChange,formula,month,disabled}){
 if(!eligible)return null;
 const factors=formula||defaultFormula(month);
 return <select className="fuel-selector" disabled={disabled} aria-label={`Fuel type for ${row.equipment}`} value={fuelType(plant,row)} onChange={e=>onChange(e.target.value)}><option value="LNG">LNG × {factors.LNG}</option><option value="LPG">LPG × {factors.LPG}</option></select>;
}
export function FuelReferenceNotice({state}){return state.loading?<p className="fuel-reference">Checking August 2026 fuel rows…</p>:state.error?<p className="fuel-reference" role="alert">Fuel selectors: {state.error} <button onClick={state.retry}>Retry August data</button></p>:null;}
export function formulaLabel(formula,month){const f=formula||defaultFormula(month);return `Electricity × ${f.ELECTRICITY} + Fuel × (LNG: ${f.LNG} / LPG: ${f.LPG}) + HSD × ${f.HSD}`;}
function FormulaDialog({plant,month,formula,onSave,onClose,saving}){
 const [draft,setDraft]=useState(formula||defaultFormula(month));const [error,setError]=useState('');const ref=useRef(null);
 useEffect(()=>{const node=ref.current;node.showModal();return()=>node.close();},[]);
 function submit(e){e.preventDefault();try{const next=validateFormula(Object.fromEntries(Object.entries(draft).map(([k,v])=>[k,v===''?NaN:Number(v)])));onSave(next);onClose();}catch(e){setError(e.message);}}
 return createPortal(<dialog className="formula-dialog" ref={ref} onCancel={e=>{if(saving)e.preventDefault();else onClose();}} aria-labelledby="formula-title"><form onSubmit={submit}><header><p>{plant.replaceAll('-',' ').toUpperCase()} · {month}</p><h2 id="formula-title">Total Consumption Formula</h2></header><p className="formula-preview">{formulaLabel(draft,month)}</p><p>{quantityMonth(month)?'Electricity is in kWh, fuel is in kg, and HSD is in litres. The selected fuel type chooses either the LNG or LPG factor.':'This month uses legacy inputs. Existing fuel and HSD columns are labelled kWh, so default multipliers are 1. Imported totals may use different units: confirm the multipliers before recalculating.'}</p>{!formula&&!quantityMonth(month)&&<p className="formula-warning">No formula was stored with these historical records. Defaults reflect the existing input-edit calculation, not necessarily imported totals.</p>}{!quantityMonth(month)&&<p className="formula-preview">Standard kg/litre conversion: {formulaLabel({ELECTRICITY:1,...FACTORS},'2026-09')}</p>}<div className="formula-grid">{Object.keys(draft).map(key=><label key={key}>{key==='ELECTRICITY'?'Electricity multiplier':`${key} multiplier`}<input type="number" min="0.000001" max="1000000" step="any" required disabled={saving} value={draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}</div><p>Save recalculates this plant’s displayed rows, Total Consumption, energy-based EnPI and contribution percentages for {month}. The formula is saved with this month’s data.</p>{error&&<p role="alert">{error}</p>}<footer>{!quantityMonth(month)&&<button type="button" disabled={saving} onClick={()=>setDraft({ELECTRICITY:1,...FACTORS})}>Use kg/litre multipliers</button>}<button type="button" disabled={saving} onClick={()=>setDraft(defaultFormula(month))}>Reset defaults</button><button type="button" disabled={saving} onClick={onClose}>Cancel</button><button className="formula-save" type="submit" disabled={saving}>Save formula & data</button></footer></form></dialog>,document.body);
}
export function TotalFormulaControl({plant,month,formula,onSave,disabled,saving}){
 const [open,setOpen]=useState(false);
 useEffect(()=>setOpen(false),[month]);
 return <><button className="formula-heading" type="button" disabled={disabled} onClick={()=>setOpen(true)} title="View or update the calculation formula">Total Consumption <small>View / edit formula ↗</small></button>{open&&<FormulaDialog key={month} plant={plant} month={month} formula={formula} saving={saving} onSave={onSave} onClose={()=>setOpen(false)}/>}</>;
}

import {useEffect,useState} from 'react';
import {API_BASE_URL,apiFetch} from '../config/api';
export default function useEnpiSettings(plant,equipment,unit){
 const key=JSON.stringify([plant,equipment,unit]);const [state,setState]=useState({key:'',records:[],loading:true,error:''});const [retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;const controller=new AbortController();setState({key,records:[],loading:true,error:''});if(!equipment||!unit){setState({key,records:[],loading:false,error:'Select an equipment with a recorded EnPI unit.'});return;}
 const params=new URLSearchParams({equipment,unit});apiFetch(`${API_BASE_URL}/api/enpi-settings/${plant}?${params}`,{signal:controller.signal}).then(r=>r.json()).then(d=>{if(!Array.isArray(d.records))throw Error('Invalid settings response');if(active)setState({key,records:d.records,loading:false,error:''});}).catch(e=>{if(active&&e.name!=='AbortError')setState({key,records:[],loading:false,error:e.message});});return()=>{active=false;controller.abort();};},[key,plant,equipment,unit,retry]);
 const save=async(kind,body)=>{const r=await apiFetch(`${API_BASE_URL}/api/enpi-settings/${plant}/${kind}`,{method:kind==='targets'?'POST':'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({equipment,unit,...body})});await r.json();setRetry(n=>n+1);};
 return {...(state.key===key?state:{records:[],loading:true,error:''}),save,reload:()=>setRetry(n=>n+1)};
}

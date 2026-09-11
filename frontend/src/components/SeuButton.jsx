import { Link } from 'react-router-dom';
export default function SeuButton({plant}) {return <Link to={`/${plant}/seu`} style={{display:'inline-flex',alignItems:'center',padding:'12px 22px',borderRadius:12,background:'linear-gradient(120deg,#7c3aed,#db2777)',color:'#fff',fontWeight:800,textDecoration:'none',boxShadow:'0 5px 16px #7c3aed40'}}>⚡ SEU</Link>;}

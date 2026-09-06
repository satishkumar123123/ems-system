import { useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
export default function ScheduleButton({ plant }) {
  const navigate = useNavigate();
  return <button onClick={() => navigate(`/${plant}/schedule`)} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, padding: '12px 18px', borderRadius: 12, border: '1px solid #63ddc777', background: 'linear-gradient(120deg, #0f857b, #5955b4)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px #18978633' }}><CalendarDays size={16} /><span>Schedule</span></button>;
}

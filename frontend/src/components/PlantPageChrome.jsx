import { Children, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, CalendarDays, ChevronDown } from 'lucide-react';
import '../styles/plant-dashboard.css';

export default function PlantPageHeader({ title, subtitle, month }) {
  const period = /^\d{4}-\d{2}$/.test(month || '')
    ? new Date(`${month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'Select a month';
  return (
    <header className="audit-header monthly-header">
      <div className="monthly-brand">
        <Link to="/" className="monthly-back" aria-label="Back to plant selection"><ArrowLeft size={18} /></Link>
        <span className="monthly-plant-icon" aria-hidden="true"><Building2 size={26} /></span>
        <div className="monthly-title">
          <p>{subtitle}</p>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="monthly-period"><CalendarDays size={18} aria-hidden="true" /><div><span>Monthly Energy Overview</span><strong>{period}</strong></div></div>
    </header>
  );
}

export function PlantToolbar({ children, solar = false }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const [month, ...actions] = Children.toArray(children);
  return (
    <div className={`no-print audit-toolbar monthly-toolbar${solar ? ' solar-toolbar' : ''}`}>
      <div className="monthly-month">{month}</div>
      <button type="button" className="monthly-actions-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>Actions <ChevronDown size={16} aria-hidden="true" /></button>
      <div id={id} className="monthly-actions" data-open={open}>{actions}</div>
    </div>
  );
}

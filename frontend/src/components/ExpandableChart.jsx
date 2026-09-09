import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ResponsiveContainer } from 'recharts';
import './expandable-chart.css';

export default function ExpandableChart({ children, width = '100%', height = '100%', ...props }) {
  const [expanded, setExpanded] = useState(false);
  const [context, setContext] = useState({ title: 'Chart', light: false });
  const host = useRef(null);
  const dialog = useRef(null);
  const trigger = useRef(null);
  const titleId = useId();
  useEffect(() => {
    if (!expanded) return;
    const element = dialog.current;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = oldOverflow;
      if (trigger.current?.isConnected) trigger.current.focus();
    };
  }, [expanded]);
  const open = () => {
    let node = host.current.parentElement;
    let title = 'Chart';
    while (node && !node.classList.contains('plant-theme')) {
      const heading = node.querySelector('h3, h2');
      if (heading) { title = heading.textContent.trim(); break; }
      node = node.parentElement;
    }
    setContext({ title, light: Boolean(host.current.closest('.solar-page')) });
    setExpanded(true);
  };
  return <div ref={host} className="expandable-chart" style={{ width, height }}>
    <button ref={trigger} type="button" className="chart-expand-button" onClick={open} aria-label="Expand chart">⛶ Expand</button>
    {!expanded && <ResponsiveContainer {...props} width="100%" height="100%">{children}</ResponsiveContainer>}
    {expanded && createPortal(
      <dialog ref={dialog} className={`chart-dialog${context.light ? ' chart-dialog-light' : ''}`} aria-labelledby={titleId}
        onCancel={event => { event.preventDefault(); setExpanded(false); }} onClose={() => setExpanded(false)}>
        <header className="chart-dialog-header"><h2 id={titleId}>{context.title}</h2>
          <button type="button" autoFocus onClick={() => setExpanded(false)}>Close ✕</button>
        </header>
        <div className="chart-dialog-scroll"><div className="chart-dialog-canvas">
          <ResponsiveContainer {...props} width="100%" height="100%">{children}</ResponsiveContainer>
        </div></div>
      </dialog>, document.body)}
  </div>;
}

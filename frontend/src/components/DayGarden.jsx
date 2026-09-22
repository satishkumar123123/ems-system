import { useState } from 'react';
import './day-garden.css';

// Decorative garden is mounted only in day mode; no night styles are changed.
export default function DayGarden() {
  const [paused, setPaused] = useState(false);
  return <>
    <div className={`day-garden${paused ? ' garden-paused' : ''}`} aria-hidden="true">
      <div className="garden-sun" />
      <div className="garden-cloud garden-cloud-one" />
      <div className="garden-cloud garden-cloud-two" />
      <svg className="garden-meadow" viewBox="0 0 1440 900" preserveAspectRatio="none" focusable="false">
        <path fill="#b7dbc4" d="M-100 820 Q220 660 570 820 T1540 730 V950 H-100Z" />
        <path fill="#83bea7" opacity=".65" d="M-100 880 Q330 740 700 870 T1540 820 V950 H-100Z" />
      </svg>
      {['left', 'right'].map(side => <div key={side} className={`garden-border garden-border-${side}`}>
        {Array.from({length: 7}, (_, i) => <svg key={i} className="garden-stem" viewBox="0 0 100 260" focusable="false" style={{'--i': i, height: `${130 + (i % 3) * 55}px`}}>
          <path d="M50 260 Q35 155 54 40" fill="none" stroke="#397b60" strokeWidth="3" />
          <path d="M46 208 Q-8 158 12 140 Q50 150 46 208 M45 164 Q95 135 85 103 Q46 109 45 164 M49 111 Q8 80 23 58 Q56 66 49 111" fill={i % 2 ? '#7ab890' : '#48966f'} />
          <g transform="translate(54 40)" fill={['#e8acc2','#f5d782','#c8b6e8'][i % 3]}>
            {[0,60,120,180,240,300].map(angle => <ellipse key={angle} cy="-13" rx="8" ry="14" transform={`rotate(${angle})`} />)}
            <circle r="7" fill="#b87923" />
          </g>
        </svg>)}
      </div>)}
      {Array.from({length: 12}, (_, i) => <span key={i} className="garden-drifter" style={{'--i': i, left: `${(i * 17) % 100}%`, top: `${10 + (i * 23) % 75}%`}}><i /></span>)}
    </div>
    <button type="button" className="garden-motion-toggle" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? '▶ Resume garden' : 'Ⅱ Pause garden'}</button>
  </>;
}

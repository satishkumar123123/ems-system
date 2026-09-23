import { useEffect, useRef, useState } from 'react';
import './day-garden.css';
import { flowerRoute, pointOnRoute, visiblePerch } from './butterfly-routes';

function DewDrops({ x = 0, y = 0 }) {
  return <g className="garden-dew" transform={`translate(${x} ${y})`}>
    <ellipse cx="-12" cy="-10" rx="3" ry="4" fill="#d9f5ff" fillOpacity=".8" stroke="#fff" strokeWidth=".7" />
    <circle cx="-13" cy="-12" r="1" fill="#fff" />
    <ellipse cx="14" cy="5" rx="2.5" ry="3.5" fill="#c9f2ff" fillOpacity=".8" stroke="#fff" strokeWidth=".7" />
    <path className="garden-dew-glint" d="M-12-17v10m-5-5h10" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
  </g>;
}

// Decorative garden is mounted only in day mode; no night styles are changed.
export default function DayGarden() {
  const [paused, setPaused] = useState(false);
  const garden = useRef(null);
  const motionPaused = useRef(false);
  useEffect(() => { motionPaused.current = paused; }, [paused]);
  useEffect(() => {
    const root = garden.current;
    const stage = root.closest('.blueprint-stage');
    const cards = [...stage.querySelectorAll('.iso-3d-block, .portal-theme-toggle')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let flights = [], frame, elapsed = 0, previous;
    const layout = () => {
      const bounds = root.getBoundingClientRect();
      const rect = el => {
        const r = el.getBoundingClientRect();
        return { left: r.left - bounds.left, right: r.right - bounds.left,
          top: r.top - bounds.top, bottom: r.bottom - bounds.top };
      };
      // Includes butterfly wings, card hover growth, and flower sway clearance.
      const boxes = cards.map(rect).map(r => ({left:r.left-34, right:r.right+34, top:r.top-34, bottom:r.bottom+34}));
      const toggle = rect(stage.querySelector('.portal-theme-toggle'));
      const narrow = rect(stage.querySelector('.block-ntd'));
      const wider = rect(stage.querySelector('.block-wider'));
      const specs = [
        ['blue', '.flower-pos-nf', [Math.max(42, bounds.width * .05), 76], 0],
        ['amber', '.flower-pos-substation', [(narrow.right + wider.left) / 2, Math.max(42, (narrow.top + narrow.bottom) / 2 - 22)], 2400],
        ['rose', '.flower-pos-hsg', [(toggle.left + toggle.right) / 2, toggle.bottom + 52], 4800],
      ];
      flights = specs.map(([color, selector, requestedHome, delay]) => {
        const el = root.querySelector(`.garden-butterfly-${color}`);
        const flower = stage.querySelector(selector);
        const r = rect(flower);
        const home = visiblePerch(requestedHome, boxes, bounds.width, bounds.height);
        const target = visiblePerch([(r.left + r.right) / 2, (r.top + r.bottom) / 2 - 9], boxes, bounds.width, bounds.height);
        const planned = flowerRoute(home, target, boxes, bounds.width, bounds.height);
        // A blocked flight must never make the butterfly disappear.
        const route = planned.length ? planned : [home];
        el.style.transform = `translate3d(${home[0]-37}px, ${home[1]-32}px, 0)`;
        el.style.visibility = 'visible';
        // Both route endpoints use the same flower artwork and blossom centre.
        ['home', 'destination'].forEach((spot, index) => {
          const bloom = root.querySelector(`.landing-flower-${color}-${spot}`);
          const point = index ? target : home;
          bloom.style.left = `${point[0]}px`;
          bloom.style.top = `${point[1] + 9}px`;
          bloom.style.visibility = 'visible';
        });
        return {el, route, delay, heading: 0,
          homeBloom: root.querySelector(`.landing-flower-${color}-home`),
          destinationBloom: root.querySelector(`.landing-flower-${color}-destination`)};
      });
      elapsed = 0;
    };
    const tick = now => {
      const dt = previous === undefined || motionPaused.current || reduced.matches ? 0 : Math.min(now - previous, 50);
      elapsed += dt;
      previous = now;
      flights.forEach(flight => {
        const {el, route, delay, homeBloom, destinationBloom} = flight;
        if (!route.length) return;
        const phase = Math.max(0, elapsed - delay) % 22000;
        const resting = route.length > 1 && phase >= 8000 && phase < 12000;
        const progress = phase < 8000 ? phase / 8000 : phase < 12000 ? 1 : phase < 20000 ? 1 - (phase - 12000) / 8000 : 0;
        const eased = progress * progress * (3 - 2 * progress);
        let [x, y] = pointOnRoute(route, eased);
        const atHome = route.length === 1 || phase >= 20000 || elapsed <= delay;
        const landed = resting || atHome;
        const ahead = pointOnRoute(route, Math.max(0, Math.min(1, eased + (phase < 12000 ? .003 : -.003))));
        const dx = ahead[0] - x, dy = ahead[1] - y;
        const desired = landed ? 0 : Math.atan2(dy, dx) * 180 / Math.PI + 90;
        const delta = ((desired - flight.heading + 540) % 360) - 180;
        if (dt) flight.heading += delta * (1 - Math.exp(-dt / 180));
        el.style.setProperty('--flight-heading', `${flight.heading}deg`);
        homeBloom.classList.toggle('has-butterfly', atHome);
        destinationBloom.classList.toggle('has-butterfly', resting);
        el.style.transform = `translate3d(${x - 37}px, ${y - 32}px, 0)`;
        el.classList.toggle('is-landed', landed || reduced.matches);
      });
      frame = requestAnimationFrame(tick);
    };
    const observer = new ResizeObserver(layout);
    observer.observe(stage);
    observer.observe(stage.querySelector('.schematic-grid'));
    window.addEventListener('resize', layout);
    layout();
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', layout); };
  }, []);
  return <>
    <div ref={garden} className={`day-garden${paused ? ' garden-paused' : ''}`} aria-hidden="true">
      <div className="garden-rainbow" />
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
            <DewDrops />
          </g>
        </svg>)}
      </div>)}
      {Array.from({length: 12}, (_, i) => <span key={i} className="garden-drifter" style={{'--i': i, left: `${(i * 17) % 100}%`, top: `${10 + (i * 23) % 75}%`}}><i /></span>)}
      {['blue', 'rose', 'amber'].flatMap(color => ['home', 'destination'].map(spot =>
        <svg key={`${color}-${spot}`} className={`landing-flower landing-flower-${color} landing-flower-${color}-${spot}`} viewBox="0 0 64 64" focusable="false">
          <g className="landing-petals" fill="var(--petal)" stroke="var(--petal-edge)" strokeWidth="1">
            {[0,45,90,135,180,225,270,315].map(angle => <ellipse key={angle} cx="32" cy="17" rx="8" ry="14" transform={`rotate(${angle} 32 32)`} />)}
          </g>
          <circle cx="32" cy="32" r="10" fill="#ffcf4a" stroke="#c68a20" strokeWidth="2" />
          <circle cx="29" cy="29" r="3" fill="#fff4af" />
          <DewDrops x={32} y={32} />
        </svg>
      ))}
      {['blue', 'rose', 'amber'].map(color => <div key={color} className={`garden-butterfly garden-butterfly-${color}`}>
        <div className="garden-butterfly-body">
          {['left', 'right'].map(side => <svg key={side} className={`garden-butterfly-wing garden-butterfly-wing-${side}`} viewBox="0 0 42 64" focusable="false">
            <path d="M39 33C26 4 2-5 3 17C3 31 13 37 26 37C7 35 3 52 16 58C29 64 38 46 39 33Z" fill="var(--wing)" stroke="#29354c" strokeWidth="2" />
            <path d="M36 32C23 12 11 8 10 18C10 26 23 31 36 32ZM35 39C21 39 13 48 19 51C25 55 32 45 35 39Z" fill="var(--wing-light)" />
            <path d="M37 34L13 17M37 36L17 47" fill="none" stroke="#29354c" strokeWidth="1" opacity=".5" />
            <circle cx="8" cy="19" r="2" fill="#fff" /><circle cx="13" cy="28" r="1.5" fill="#fff" /><circle cx="17" cy="53" r="1.5" fill="#fff" />
          </svg>)}
          <span className="garden-butterfly-spine" />
        </div>
      </div>)}
    </div>
    <button type="button" className="garden-motion-toggle" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? '▶ Resume garden' : 'Ⅱ Pause garden'}</button>
  </>;
}

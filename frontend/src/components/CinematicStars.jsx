import {useEffect,useRef,useState} from 'react';
import './cinematic-stars.css';
export default function CinematicStars(){
 const canvas=useRef(null),[paused,setPaused]=useState(false);
 useEffect(()=>{
  const el=canvas.current,ctx=el.getContext('2d');if(!ctx)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let width=1,height=1,stars=[],frame=0,last=0,clock=0;
  const resize=()=>{const box=el.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(window.devicePixelRatio||1,1.5);el.width=width*dpr;el.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);stars=Array.from({length:Math.min(200,Math.round(width*height/5500))},()=>({x:Math.random()*width,y:Math.random()*height,z:.25+Math.random()*.75,phase:Math.random()*Math.PI*2}));draw(0);};
  const draw=dt=>{ctx.clearRect(0,0,width,height);clock+=dt;for(const s of stars){s.x-=dt*(3+s.z*9);s.y+=dt*s.z*2;if(s.x<0)s.x=width;if(s.y>height)s.y=0;ctx.globalAlpha=.35+s.z*.4+Math.sin(clock*.6+s.phase)*.12;ctx.fillStyle=s.z>.7?'#ffffff':'#a5c9ff';ctx.beginPath();ctx.arc(s.x,s.y,.45+s.z,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
   // One softly fading meteor every 14 seconds, without flashes.
   const t=clock%14;if(t>11&&t<12.4){const p=(t-11)/1.4,x=width*(.8-p*.28),y=height*(.12+p*.25);ctx.globalAlpha=Math.sin(p*Math.PI)*.65;const g=ctx.createLinearGradient(x,y,x+95,y-45);g.addColorStop(0,'#dbeafe');g.addColorStop(1,'#93c5fd00');ctx.strokeStyle=g;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+95,y-45);ctx.stroke();ctx.globalAlpha=1;}};
  const tick=time=>{const dt=last?Math.min((time-last)/1000,.05):0;last=time;draw(dt);frame=requestAnimationFrame(tick);};
  const sync=()=>{cancelAnimationFrame(frame);last=0;if(!paused&&!motion.matches&&!document.hidden)frame=requestAnimationFrame(tick);else draw(0);};
  const observer=new ResizeObserver(resize);observer.observe(el);resize();sync();motion.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();motion.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};
 },[paused]);
 return <><canvas ref={canvas} className="cinematic-stars" aria-hidden="true"/><button className="star-motion-toggle" type="button" aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?'▶ Stars':'Ⅱ Stars'}</button></>;
}

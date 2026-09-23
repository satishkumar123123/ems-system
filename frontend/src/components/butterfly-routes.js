// Shortest visible path around expanded card rectangles, in screen pixels.
export function flowerRoute(start, end, boxes, width, height) {
  const inside = ([x,y]) => boxes.some(b => x > b.left && x < b.right && y > b.top && y < b.bottom);
  const valid = p => p[0] >= 24 && p[0] <= width-24 && p[1] >= 24 && p[1] <= height-24 && !inside(p);
  if (!valid(start) || !valid(end)) return [];
  const clear = (a,b) => {
    const steps = Math.ceil(Math.hypot(b[0]-a[0], b[1]-a[1]));
    for (let i=0; i<=steps; i++) {
      const t = steps ? i/steps : 0;
      if (inside([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])) return false;
    }
    return true;
  };
  const points = [start,end,...boxes.flatMap(b => [1,18].flatMap(gap => [[b.left-gap,b.top-gap],[b.right+gap,b.top-gap],[b.left-gap,b.bottom+gap],[b.right+gap,b.bottom+gap]])).filter(valid)];
  const distance = points.map(() => Infinity), previous = [], visited = new Set();
  distance[0] = 0;
  while (visited.size < points.length) {
    let current = -1;
    points.forEach((_,i) => { if (!visited.has(i) && (current < 0 || distance[i] < distance[current])) current = i; });
    if (current < 0 || !Number.isFinite(distance[current])) return [];
    if (current === 1) {
      const route = [];
      for (let i=1; i!==undefined; i=previous[i]) route.unshift(points[i]);
      // Round each bend only if every sampled segment keeps card clearance.
      const rounded = [route[0]];
      for (let j=1; j<route.length-1; j++) {
        const a=route[j-1], corner=route[j], b=route[j+1];
        const incoming=Math.hypot(corner[0]-a[0],corner[1]-a[1]);
        const outgoing=Math.hypot(b[0]-corner[0],b[1]-corner[1]);
        const radius=Math.min(28,incoming/3,outgoing/3);
        const entry=corner.map((v,k)=>v+(a[k]-v)*radius/incoming);
        const exit=corner.map((v,k)=>v+(b[k]-v)*radius/outgoing);
        const curve=Array.from({length:17},(_,k)=>{
          const t=k/16;
          return corner.map((v,axis)=>(1-t)**2*entry[axis]+2*(1-t)*t*v+t*t*exit[axis]);
        });
        if (curve.every((point,k)=>!k || clear(curve[k-1],point))) rounded.push(...curve);
        else rounded.push(corner);
      }
      rounded.push(route.at(-1));
      return rounded;
    }
    visited.add(current);
    points.forEach((p,i) => {
      if (visited.has(i) || !clear(points[current],p)) return;
      const next = distance[current] + Math.hypot(p[0]-points[current][0],p[1]-points[current][1]);
      if (next < distance[i]) { distance[i] = next; previous[i] = current; }
    });
  }
  return [];
}

export function pointOnRoute(route, progress) {
  const lengths = route.slice(1).map((p,i) => Math.hypot(p[0]-route[i][0],p[1]-route[i][1]));
  let remaining = lengths.reduce((a,b) => a+b,0) * Math.max(0,Math.min(1,progress));
  for (let i=0; i<lengths.length; i++) {
    if (remaining <= lengths[i] && lengths[i]) {
      const t = remaining/lengths[i];
      return route[i].map((v,j) => v+(route[i+1][j]-v)*t);
    }
    remaining -= lengths[i];
  }
  return route.at(-1);
}

// Keep a visible, card-free perch even when a narrow viewport clips a destination.
export function visiblePerch(point, boxes, width, height) {
  const free = ([x,y]) => x >= 26 && x <= width-26 && y >= 26 && y <= height-35 &&
    !boxes.some(b => x > b.left && x < b.right && y > b.top && y < b.bottom);
  const clamped = [Math.max(26,Math.min(width-26,point[0])),Math.max(26,Math.min(height-35,point[1]))];
  if (free(clamped)) return clamped;
  for (let radius=8; radius<Math.max(width,height); radius+=8) {
    for (let i=0;i<48;i++) {
      const angle=i*Math.PI/24;
      const candidate=[clamped[0]+Math.cos(angle)*radius,clamped[1]+Math.sin(angle)*radius];
      if (free(candidate)) return candidate;
    }
  }
  return clamped;
}

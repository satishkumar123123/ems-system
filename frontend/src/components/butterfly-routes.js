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
  const points = [start,end,...boxes.flatMap(b => [[b.left-1,b.top-1],[b.right+1,b.top-1],[b.left-1,b.bottom+1],[b.right+1,b.bottom+1]]).filter(valid)];
  const distance = points.map(() => Infinity), previous = [], visited = new Set();
  distance[0] = 0;
  while (visited.size < points.length) {
    let current = -1;
    points.forEach((_,i) => { if (!visited.has(i) && (current < 0 || distance[i] < distance[current])) current = i; });
    if (current < 0 || !Number.isFinite(distance[current])) return [];
    if (current === 1) {
      const route = [];
      for (let i=1; i!==undefined; i=previous[i]) route.unshift(points[i]);
      return route;
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

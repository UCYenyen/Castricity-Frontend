export function smoothPath<T>(points: T[], accessor: (p: T, i: number) => [number, number]): string {
  if (!points.length) return "";
  let d = "";
  for (let i = 0; i < points.length; i++) {
    const [x, y] = accessor(points[i], i);
    d += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
  }
  return d;
}

export function niceBounds(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = range * 0.12;
  const lo = Math.floor((min - pad) / 200) * 200;
  const hi = Math.ceil((max + pad) / 200) * 200;
  return [Math.max(0, lo), hi];
}

export interface Scales {
  x: (v: number) => number;
  y: (v: number) => number;
  xMin: number;
  xMax: number;
}

export function makeScales<T>(args: {
  data: T[];
  xAccessor: (d: T) => number;
  plotW: number;
  plotH: number;
  yMin: number;
  yMax: number;
}): Scales {
  const { data, xAccessor, plotW, plotH, yMin, yMax } = args;
  const xs = data.map(xAccessor);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const x = (v: number) => ((v - xMin) / Math.max(1, xMax - xMin)) * plotW;
  const y = (v: number) => plotH - ((v - yMin) / Math.max(1, yMax - yMin)) * plotH;
  return { x, y, xMin, xMax };
}

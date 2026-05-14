"use client";
import { useId } from "react";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = "var(--accent-cyan)", height = 42 }: SparklineProps) {
  const id = useId().replace(/[^a-z0-9]/gi, "");
  if (!data.length) return null;
  const w = 160;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const xs = data.map((_, i) => (i / (data.length - 1)) * w);
  const ys = data.map((v) => h - 6 - ((v - min) / Math.max(0.0001, max - min)) * (h - 12));
  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 1; i < data.length; i++) d += ` L${xs[i]},${ys[i]}`;
  const area = d + ` L${xs[xs.length - 1]},${h} L${xs[0]},${h} Z`;
  const gradId = `sg-${id}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height={h}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" />
    </svg>
  );
}

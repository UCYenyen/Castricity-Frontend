"use client";
import { useMemo } from "react";
import { useElementSize } from "@/hooks/use-element-size";
import { makeScales, niceBounds, smoothPath } from "@/components/features/dashboard/chart-utils";
import { fmtMW, fmtTime, DAY_SHORT } from "@/lib/dashboard/format";
import type { AnomalyEntry, HistoryPoint, Severity } from "@/types/dashboard";

const SEV_FILL: Record<Severity, string> = {
  critical: "var(--accent-red)",
  warning: "var(--accent-orange)",
  info: "var(--accent-cyan)",
};

const SEV_HALO: Record<Severity, string> = {
  critical: "rgba(239,68,68,0.20)",
  warning: "rgba(249,115,22,0.20)",
  info: "rgba(6,182,212,0.20)",
};

interface Props {
  history: HistoryPoint[];
  anomalies: AnomalyEntry[];
  selectedAnomalyT?: number | null;
  onSelect?: (a: AnomalyEntry) => void;
}

export function AnomalyChart({ history, anomalies, selectedAnomalyT, onSelect }: Props) {
  const { ref, size } = useElementSize<HTMLDivElement>({ w: 900, h: 320 });
  const M = { l: 56, r: 16, t: 16, b: 36 };
  const plotW = size.w - M.l - M.r;
  const plotH = size.h - M.t - M.b;

  const [yMin, yMax] = useMemo(
    () => (history.length ? niceBounds(history.flatMap((d) => [d.actual, d.predicted])) : [0, 1]),
    [history]
  );

  const { x, y } = makeScales({
    data: history,
    xAccessor: (d) => d.t.getTime(),
    plotW,
    plotH,
    yMin,
    yMax,
  });

  const actualPath = useMemo(
    () => smoothPath(history, (d) => [x(d.t.getTime()), y(d.actual)]),
    [history, x, y]
  );
  const predictedPath = useMemo(
    () => smoothPath(history, (d) => [x(d.t.getTime()), y(d.predicted)]),
    [history, x, y]
  );

  const yTicks = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i <= 5; i++) out.push(yMin + ((yMax - yMin) * i) / 5);
    return out;
  }, [yMin, yMax]);

  const xTicks = useMemo(() => {
    if (history.length < 2) return [];
    const n = Math.min(6, history.length);
    const out: HistoryPoint[] = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.round((i * (history.length - 1)) / (n - 1));
      out.push(history[idx]);
    }
    return out;
  }, [history]);

  const markers = useMemo(() => {
    if (!history.length) return [];
    const tMin = history[0].t.getTime();
    const tMax = history[history.length - 1].t.getTime();
    return anomalies
      .map((a) => {
        const t = a.point.t.getTime();
        if (t < tMin || t > tMax) return null;
        let nearest = history[0];
        let best = Infinity;
        for (const p of history) {
          const diff = Math.abs(p.t.getTime() - t);
          if (diff < best) {
            best = diff;
            nearest = p;
          }
        }
        return { a, cx: x(nearest.t.getTime()), cy: y(nearest.actual) };
      })
      .filter((m): m is { a: AnomalyEntry; cx: number; cy: number } => m !== null);
  }, [anomalies, history, x, y]);

  return (
    <div ref={ref} className="absolute inset-0">
      <svg width={size.w} height={size.h} style={{ display: "block" }}>
        <g transform={`translate(${M.l},${M.t})`}>
          {yTicks.map((v, i) => (
            <g key={i}>
              <line
                x1={0}
                x2={plotW}
                y1={y(v)}
                y2={y(v)}
                stroke="rgba(148,163,184,0.08)"
                strokeDasharray="2 4"
              />
              <text
                x={-8}
                y={y(v)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="10"
                fill="#6b7587"
                fontFamily="JetBrains Mono, monospace"
              >
                {fmtMW(v)}
              </text>
            </g>
          ))}

          <path d={predictedPath} fill="none" stroke="var(--accent-green)" strokeWidth="1.4" strokeDasharray="5 4" opacity="0.85" />
          <path d={actualPath} fill="none" stroke="var(--accent-cyan)" strokeWidth="2" />

          {markers.map((m, i) => {
            const isSelected = selectedAnomalyT != null && m.a.point.t.getTime() === selectedAnomalyT;
            return (
              <g
                key={i}
                transform={`translate(${m.cx},${m.cy})`}
                style={{ cursor: onSelect ? "pointer" : "default" }}
                onClick={() => onSelect?.(m.a)}
              >
                {isSelected && <circle r="14" fill="none" stroke={SEV_FILL[m.a.sev]} strokeWidth="1.5" opacity="0.7" />}
                <circle r="8" fill={SEV_HALO[m.a.sev]} />
                <circle r="4.5" fill={SEV_FILL[m.a.sev]} stroke="#fff" strokeWidth="1.2" />
              </g>
            );
          })}

          <line x1={0} x2={plotW} y1={plotH} y2={plotH} stroke="rgba(148,163,184,0.18)" />
          {xTicks.map((d, i) => (
            <g key={i}>
              <text
                x={x(d.t.getTime())}
                y={plotH + 18}
                textAnchor="middle"
                fontSize="10"
                fill="#9CA3AF"
                fontFamily="JetBrains Mono, monospace"
              >
                {fmtTime(d.t)}
              </text>
              <text
                x={x(d.t.getTime())}
                y={plotH + 30}
                textAnchor="middle"
                fontSize="9"
                fill="#6b7587"
                fontFamily="JetBrains Mono, monospace"
              >
                {DAY_SHORT[d.t.getDay()]} {d.t.getDate()}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

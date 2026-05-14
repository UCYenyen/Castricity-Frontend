"use client";
import { useCallback, useMemo, useState } from "react";
import { useElementSize } from "@/hooks/use-element-size";
import { fmtMW, fmtSigned, fmtTime, DAY_SHORT } from "@/lib/dashboard/format";
import { makeScales, niceBounds, smoothPath } from "./chart-utils";
import type { BrushRange, HistoryPoint } from "@/types/dashboard";

interface Props {
  data: HistoryPoint[];
  accent: string;
  showActual: boolean;
  showPredicted: boolean;
  showError: boolean;
  errorAsPct: boolean;
  brush: BrushRange;
  onPointClick: (p: HistoryPoint) => void;
}

export function ValidationChart({
  data, accent, showActual, showPredicted, showError, errorAsPct, brush, onPointClick,
}: Props) {
  const { ref, size } = useElementSize<HTMLDivElement>({ w: 800, h: 360 });

  const M = { l: 50, r: 16, t: 12, b: 36 };
  const errH = showError ? 60 : 0;
  const plotW = size.w - M.l - M.r;
  const plotH = size.h - M.t - M.b - errH;

  const sliced = useMemo(() => {
    if (!data.length) return data;
    const i0 = Math.floor(brush[0] * (data.length - 1));
    const i1 = Math.ceil(brush[1] * (data.length - 1));
    return data.slice(i0, i1 + 1);
  }, [data, brush]);

  const yValues = sliced.flatMap((d) => [d.actual, d.predicted]);
  const [yMin, yMax] = sliced.length ? niceBounds(yValues) : [0, 1];
  const { x, y } = makeScales({
    data: sliced,
    xAccessor: (d) => d.t.getTime(),
    plotW,
    plotH,
    yMin,
    yMax,
  });

  const actualPath = smoothPath(sliced, (d) => [x(d.t.getTime()), y(d.actual)]);
  const predictedPath = smoothPath(sliced, (d) => [x(d.t.getTime()), y(d.predicted)]);

  const yTicks = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i <= 5; i++) out.push(yMin + ((yMax - yMin) * i) / 5);
    return out;
  }, [yMin, yMax]);

  const xTicks = useMemo(() => {
    if (sliced.length < 2) return [];
    const n = Math.min(6, sliced.length);
    const out: HistoryPoint[] = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.round((i * (sliced.length - 1)) / (n - 1));
      out.push(sliced[idx]);
    }
    return out;
  }, [sliced]);

  const [hover, setHover] = useState<HistoryPoint | null>(null);
  const onMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left - M.l;
      if (px < 0 || px > plotW || sliced.length === 0) {
        setHover(null);
        return;
      }
      const t =
        (px / plotW) * (sliced[sliced.length - 1].t.getTime() - sliced[0].t.getTime()) +
        sliced[0].t.getTime();
      let nearest = sliced[0];
      let best = Infinity;
      for (const d of sliced) {
        const diff = Math.abs(d.t.getTime() - t);
        if (diff < best) {
          best = diff;
          nearest = d;
        }
      }
      setHover(nearest);
    },
    [sliced, plotW]
  );

  const anomalyPts = sliced.filter((d) => d.anomaly);

  const errMax = Math.max(0.001, ...sliced.map((d) => Math.abs(d.actual - d.predicted)));
  const errMaxPct = Math.max(0.001, ...sliced.map((d) => Math.abs(d.actual - d.predicted) / d.actual));
  const errBarH = (d: HistoryPoint): number => {
    const v = errorAsPct
      ? Math.abs(d.actual - d.predicted) / d.actual / errMaxPct
      : Math.abs(d.actual - d.predicted) / errMax;
    return v * (errH - 14);
  };

  return (
    <div ref={ref} className="absolute inset-0">
      <svg
        width={size.w}
        height={size.h}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        onClick={() => hover && onPointClick(hover)}
        style={{ display: "block", cursor: hover ? "pointer" : "crosshair" }}
      >
        <g transform={`translate(${M.l},${M.t})`}>
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={0} x2={plotW} y1={y(v)} y2={y(v)} stroke="rgba(148,163,184,0.08)" strokeDasharray="2 4" />
              <text x={-8} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="#6b7587" fontFamily="JetBrains Mono, monospace">
                {fmtMW(v)}
              </text>
            </g>
          ))}

          {showActual && showPredicted && sliced.length > 0 && (
            <path
              d={
                smoothPath(sliced, (d) => [x(d.t.getTime()), y(Math.max(d.actual, d.predicted))]) +
                " " +
                sliced
                  .slice()
                  .reverse()
                  .map((d, i) => {
                    const px = x(d.t.getTime());
                    const py = y(Math.min(d.actual, d.predicted));
                    return (i === 0 ? `L${px},${py}` : ` L${px},${py}`);
                  })
                  .join("") +
                " Z"
              }
              fill="rgba(239,68,68,0.05)"
              stroke="none"
            />
          )}

          {showPredicted && (
            <path d={predictedPath} fill="none" stroke="var(--accent-green)" strokeWidth="1.6" strokeDasharray="5 4" opacity="0.95" />
          )}
          {showActual && <path d={actualPath} fill="none" stroke={accent} strokeWidth="2" />}

          {anomalyPts.map((d, i) => (
            <g key={i} transform={`translate(${x(d.t.getTime())},${y(d.actual)})`}>
              <circle r="6" fill="rgba(239,68,68,0.18)" />
              <circle r="3.5" fill="var(--accent-red)" stroke="#fff" strokeWidth="1" />
            </g>
          ))}

          {hover && (
            <g pointerEvents="none">
              <line x1={x(hover.t.getTime())} x2={x(hover.t.getTime())} y1={0} y2={plotH} stroke="rgba(148,163,184,0.35)" strokeDasharray="3 3" />
              {showActual && (
                <circle cx={x(hover.t.getTime())} cy={y(hover.actual)} r="4.5" fill={accent} stroke="#0B1120" strokeWidth="2" />
              )}
              {showPredicted && (
                <circle cx={x(hover.t.getTime())} cy={y(hover.predicted)} r="4" fill="var(--accent-green)" stroke="#0B1120" strokeWidth="2" />
              )}
            </g>
          )}

          <line x1={0} x2={plotW} y1={plotH} y2={plotH} stroke="rgba(148,163,184,0.18)" />
          {xTicks.map((d, i) => (
            <g key={i}>
              <text x={x(d.t.getTime())} y={plotH + 18} textAnchor="middle" fontSize="10" fill="#9CA3AF" fontFamily="JetBrains Mono, monospace">
                {fmtTime(d.t)}
              </text>
              <text x={x(d.t.getTime())} y={plotH + 30} textAnchor="middle" fontSize="9" fill="#6b7587" fontFamily="JetBrains Mono, monospace">
                {DAY_SHORT[d.t.getDay()]} {d.t.getDate()}
              </text>
            </g>
          ))}

          {showError && (
            <g transform={`translate(0,${plotH + 36})`}>
              <line x1={0} x2={plotW} y1={errH - 14} y2={errH - 14} stroke="rgba(148,163,184,0.18)" />
              <text x={-8} y={errH - 14} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#6b7587" fontFamily="JetBrains Mono, monospace">0</text>
              <text x={-8} y={0} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#6b7587" fontFamily="JetBrains Mono, monospace">
                {errorAsPct ? `${(errMaxPct * 100).toFixed(1)}%` : fmtMW(errMax)}
              </text>
              {sliced.map((d, i) => {
                const cx = x(d.t.getTime());
                const w = Math.max(1.5, (plotW / sliced.length) * 0.6);
                const h = errBarH(d);
                const over = d.actual >= d.predicted;
                return (
                  <rect
                    key={i}
                    x={cx - w / 2}
                    y={errH - 14 - h}
                    width={w}
                    height={h}
                    fill={over ? "rgba(239,68,68,0.65)" : "rgba(6,182,212,0.6)"}
                  />
                );
              })}
              <text x={0} y={-2} fontSize="9" fill="#6b7587" fontFamily="JetBrains Mono, monospace" letterSpacing="0.1em">
                ERROR · {errorAsPct ? "%" : "MW"}
              </text>
            </g>
          )}
        </g>

        {hover && (
          <foreignObject
            x={Math.min(size.w - 200, M.l + x(hover.t.getTime()) + 12)}
            y={Math.max(0, M.t + y(Math.max(hover.actual, hover.predicted)) - 80)}
            width="200"
            height="120"
            style={{ overflow: "visible", pointerEvents: "none" }}
          >
            <div
              style={{
                background: "rgba(11,17,32,0.96)",
                border: "1px solid var(--card-border)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 11.5,
                color: "var(--text-primary)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
                backdropFilter: "blur(6px)",
              }}
            >
              <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                {fmtTime(hover.t, { withDate: true, withYear: true })}
              </div>
              <Row swatch={accent} label="Actual" value={`${fmtMW(hover.actual)} MW`} />
              <Row swatch="var(--accent-green)" label="Predicted" value={`${fmtMW(hover.predicted)} MW`} />
              <div className="mono" style={{ marginTop: 6, paddingTop: 6, borderTop: "1px dashed var(--card-border)", fontSize: 11, color: "var(--text-muted)" }}>
                Δ {fmtSigned(hover.actual - hover.predicted, 0)} MW · {fmtSigned(((hover.actual - hover.predicted) / hover.predicted) * 100, 2)}%
              </div>
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  );
}

function Row({ swatch, label, value }: { swatch: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14, marginTop: 2 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
        <i style={{ width: 8, height: 8, borderRadius: 2, background: swatch, display: "inline-block" }} />
        {label}
      </span>
      <span className="mono" style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

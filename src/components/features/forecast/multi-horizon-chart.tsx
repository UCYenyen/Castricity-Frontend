"use client";
import { useCallback, useId, useMemo, useState } from "react";
import { useElementSize } from "@/hooks/use-element-size";
import { makeScales, niceBounds, smoothPath } from "@/components/features/dashboard/chart-utils";
import { fmtMW } from "@/lib/dashboard/format";
import type { ForecastPoint } from "@/types/dashboard";

interface Props {
  future: ForecastPoint[];
  showBand: boolean;
  selectedT?: number | null;
  onSelect?: (p: ForecastPoint) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MultiHorizonChart({ future, showBand, selectedT, onSelect }: Props) {
  const { ref, size } = useElementSize<HTMLDivElement>({ w: 900, h: 340 });
  const idSeed = useId().replace(/[^a-z0-9]/gi, "");
  const bandId = `bg-${idSeed}`;

  const M = { l: 64, r: 18, t: 16, b: 40 };
  const plotW = size.w - M.l - M.r;
  const plotH = size.h - M.t - M.b;

  const yValues = future.flatMap((d) => [d.predicted, d.p10, d.p90]);
  const [yMin, yMax] = future.length ? niceBounds(yValues) : [0, 1];
  const { x, y } = makeScales({
    data: future,
    xAccessor: (d) => d.t.getTime(),
    plotW,
    plotH,
    yMin,
    yMax,
  });

  const predPath = useMemo(
    () => smoothPath(future, (d) => [x(d.t.getTime()), y(d.predicted)]),
    [future, x, y]
  );

  const bandPath = useMemo(() => {
    if (future.length < 2) return "";
    const top = future.map((d) => `${x(d.t.getTime())},${y(d.p90)}`).join(" L");
    const bot = [...future]
      .reverse()
      .map((d) => `${x(d.t.getTime())},${y(d.p10)}`)
      .join(" L");
    return `M${top} L${bot} Z`;
  }, [future, x, y]);

  const yTicks = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i <= 5; i++) out.push(yMin + ((yMax - yMin) * i) / 5);
    return out;
  }, [yMin, yMax]);

  const xTicks = useMemo(() => {
    if (future.length < 2) return [];
    const n = Math.min(8, future.length);
    const out: ForecastPoint[] = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.round((i * (future.length - 1)) / (n - 1));
      out.push(future[idx]);
    }
    return out;
  }, [future]);

  const [hover, setHover] = useState<ForecastPoint | null>(null);

  const onMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left - M.l;
      if (px < 0 || px > plotW || future.length === 0) {
        setHover(null);
        return;
      }
      const t =
        (px / plotW) * (future[future.length - 1].t.getTime() - future[0].t.getTime()) +
        future[0].t.getTime();
      let nearest = future[0];
      let best = Infinity;
      for (const d of future) {
        const diff = Math.abs(d.t.getTime() - t);
        if (diff < best) {
          best = diff;
          nearest = d;
        }
      }
      setHover(nearest);
    },
    [future, plotW]
  );

  return (
    <div ref={ref} className="absolute inset-0">
      <svg
        width={size.w}
        height={size.h}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        onClick={() => hover && onSelect?.(hover)}
        style={{ display: "block", cursor: hover ? "pointer" : "crosshair" }}
      >
        <defs>
          <linearGradient id={bandId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(6,182,212,0.18)" />
            <stop offset="100%" stopColor="rgba(6,182,212,0.04)" />
          </linearGradient>
        </defs>

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

          {showBand && bandPath && <path d={bandPath} fill={`url(#${bandId})`} stroke="none" />}

          <path d={predPath} fill="none" stroke="var(--accent-cyan)" strokeWidth="2" />

          {future.map((d, i) => {
            const isSelected = selectedT != null && d.t.getTime() === selectedT;
            return (
              <circle
                key={i}
                cx={x(d.t.getTime())}
                cy={y(d.predicted)}
                r={isSelected ? 5 : 2.5}
                fill={isSelected ? "var(--accent-cyan)" : "rgba(6,182,212,0.55)"}
                stroke={isSelected ? "#0B1120" : "none"}
                strokeWidth={isSelected ? 2 : 0}
              />
            );
          })}

          {hover && (
            <g pointerEvents="none">
              <line
                x1={x(hover.t.getTime())}
                x2={x(hover.t.getTime())}
                y1={0}
                y2={plotH}
                stroke="rgba(148,163,184,0.35)"
                strokeDasharray="3 3"
              />
              <circle
                cx={x(hover.t.getTime())}
                cy={y(hover.predicted)}
                r={4.5}
                fill="var(--accent-cyan)"
                stroke="#0B1120"
                strokeWidth={2}
              />
            </g>
          )}

          <line x1={0} x2={plotW} y1={plotH} y2={plotH} stroke="rgba(148,163,184,0.18)" />
          {xTicks.map((d, i) => (
            <text
              key={i}
              x={x(d.t.getTime())}
              y={plotH + 18}
              textAnchor="middle"
              fontSize="10"
              fill="#9CA3AF"
              fontFamily="JetBrains Mono, monospace"
            >
              {d.t.getDate()} {MONTHS[d.t.getMonth()]}
            </text>
          ))}
        </g>

        {hover && (
          <foreignObject
            x={Math.min(size.w - 220, M.l + x(hover.t.getTime()) + 12)}
            y={Math.max(0, M.t + y(hover.predicted) - 70)}
            width="200"
            height="90"
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
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 4,
                }}
              >
                {hover.t.toISOString().slice(0, 10)}
              </div>
              <div className="mono" style={{ fontWeight: 600, color: "var(--accent-cyan)" }}>
                {fmtMW(hover.predicted)} MW
              </div>
              <div className="mono" style={{ marginTop: 2, fontSize: 11, color: "var(--text-muted)" }}>
                {fmtMW(hover.p10)} – {fmtMW(hover.p90)} MW
              </div>
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  );
}

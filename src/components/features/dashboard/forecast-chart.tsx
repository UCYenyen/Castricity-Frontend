"use client";
import { useCallback, useId, useMemo, useState } from "react";
import { useElementSize } from "@/hooks/use-element-size";
import { fmtMW, fmtTime, DAY_SHORT } from "@/lib/dashboard/format";
import { makeScales, niceBounds, smoothPath } from "./chart-utils";
import type { ForecastPoint, HistoryPoint, ExplainerPoint } from "@/types/dashboard";

interface Props {
  history: HistoryPoint[];
  future: ForecastPoint[];
  accent: string;
  showBand: boolean;
  showHistory: boolean;
  peak: ForecastPoint;
  onPointClick: (p: ExplainerPoint) => void;
}

type AnyPoint = HistoryPoint | ForecastPoint;

export function ForecastChart({
  history, future, accent, showBand, showHistory, peak, onPointClick,
}: Props) {
  const { ref, size } = useElementSize<HTMLDivElement>({ w: 600, h: 360 });
  const idSeed = useId().replace(/[^a-z0-9]/gi, "");
  const bandId = `bg-${idSeed}`;
  const futId = `ff-${idSeed}`;

  const M = { l: 50, r: 16, t: 14, b: 40 };
  const plotW = size.w - M.l - M.r;
  const plotH = size.h - M.t - M.b;

  const tail: HistoryPoint[] = showHistory ? history.slice(-24) : [];
  const all: AnyPoint[] = [...tail, ...future];

  const yValues = all.flatMap((d) => {
    const arr: number[] = [d.predicted];
    if ("actual" in d && typeof d.actual === "number") arr.push(d.actual);
    if ("p10" in d && typeof d.p10 === "number") arr.push(d.p10);
    if ("p90" in d && typeof d.p90 === "number") arr.push(d.p90);
    return arr;
  });
  const [yMin, yMax] = all.length ? niceBounds(yValues) : [0, 1];
  const { x, y } = makeScales({
    data: all,
    xAccessor: (d) => d.t.getTime(),
    plotW,
    plotH,
    yMin,
    yMax,
  });

  const nowT = future[0] ? future[0].t.getTime() - 30 * 60 * 1000 : Date.now();

  const histPath = tail.length ? smoothPath(tail, (d) => [x(d.t.getTime()), y(d.actual)]) : "";
  const histPredPath = tail.length ? smoothPath(tail, (d) => [x(d.t.getTime()), y(d.predicted)]) : "";
  const futurePath = smoothPath(future, (d) => [x(d.t.getTime()), y(d.predicted)]);

  const bandPath = useMemo(() => {
    if (!future.length) return "";
    const top = future.map((d) => [x(d.t.getTime()), y(d.p90)] as const);
    const bot = future.slice().reverse().map((d) => [x(d.t.getTime()), y(d.p10)] as const);
    let s = `M${top[0][0]},${top[0][1]}`;
    for (let i = 1; i < top.length; i++) s += ` L${top[i][0]},${top[i][1]}`;
    for (let i = 0; i < bot.length; i++) s += ` L${bot[i][0]},${bot[i][1]}`;
    return s + " Z";
  }, [future, x, y]);

  const yTicks = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i <= 5; i++) out.push(yMin + ((yMax - yMin) * i) / 5);
    return out;
  }, [yMin, yMax]);

  const xTicks = useMemo(() => {
    if (all.length < 2) return [];
    const n = Math.min(6, all.length);
    const out: AnyPoint[] = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.round((i * (all.length - 1)) / (n - 1));
      out.push(all[idx]);
    }
    return out;
  }, [all]);

  const [hover, setHover] = useState<AnyPoint | null>(null);
  const onMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left - M.l;
      if (px < 0 || px > plotW || all.length === 0) {
        setHover(null);
        return;
      }
      const t =
        (px / plotW) * (all[all.length - 1].t.getTime() - all[0].t.getTime()) +
        all[0].t.getTime();
      let nearest = all[0];
      let best = Infinity;
      for (const d of all) {
        const diff = Math.abs(d.t.getTime() - t);
        if (diff < best) {
          best = diff;
          nearest = d;
        }
      }
      setHover(nearest);
    },
    [all, plotW]
  );

  const handleClick = () => {
    if (!hover) return;
    const ep: ExplainerPoint = {
      t: hover.t,
      predicted: hover.predicted,
      actual: "actual" in hover ? hover.actual : undefined,
      p10: "p10" in hover ? hover.p10 : undefined,
      p90: "p90" in hover ? hover.p90 : undefined,
    };
    onPointClick(ep);
  };

  return (
    <div ref={ref} className="absolute inset-0">
      <svg
        width={size.w}
        height={size.h}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        onClick={handleClick}
        style={{ display: "block", cursor: hover ? "pointer" : "crosshair" }}
      >
        <defs>
          <linearGradient id={bandId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id={futId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        <g transform={`translate(${M.l},${M.t})`}>
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={0} x2={plotW} y1={y(v)} y2={y(v)} stroke="rgba(148,163,184,0.08)" strokeDasharray="2 4" />
              <text x={-8} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="#6b7587" fontFamily="JetBrains Mono, monospace">
                {fmtMW(v)}
              </text>
            </g>
          ))}

          <line x1={x(nowT)} x2={x(nowT)} y1={0} y2={plotH} stroke="rgba(6,182,212,0.4)" strokeDasharray="4 4" />
          <rect x={x(nowT)} y={0} width={plotW - x(nowT)} height={plotH} fill={`url(#${futId})`} opacity="0.5" />
          <text x={x(nowT) + 6} y={12} fontSize="9" fill="var(--accent-cyan-2)" fontFamily="JetBrains Mono, monospace" letterSpacing="0.12em">FORECAST →</text>
          <text x={x(nowT) - 6} y={12} fontSize="9" fill="#6b7587" textAnchor="end" fontFamily="JetBrains Mono, monospace" letterSpacing="0.12em">← OBSERVED</text>

          {showBand && <path d={bandPath} fill={`url(#${bandId})`} stroke="none" />}

          {showHistory && tail.length > 0 && (
            <>
              <path d={histPath} fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.6" />
              <path d={histPredPath} fill="none" stroke="var(--accent-green)" strokeWidth="1.4" strokeDasharray="3 3" opacity="0.55" />
            </>
          )}

          <path d={futurePath} fill="none" stroke={accent} strokeWidth="2.2" />

          {peak && (
            <g transform={`translate(${x(peak.t.getTime())},${y(peak.predicted)})`}>
              <circle r="6" fill="rgba(245,158,11,0.18)" />
              <circle r="4" fill="var(--accent-orange)" stroke="#0B1120" strokeWidth="1.5" />
              <text x={0} y={-12} textAnchor="middle" fontSize="10" fill="var(--accent-orange)" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                PEAK · {fmtMW(peak.predicted)} MW
              </text>
            </g>
          )}

          {hover && (
            <g pointerEvents="none">
              <line x1={x(hover.t.getTime())} x2={x(hover.t.getTime())} y1={0} y2={plotH} stroke="rgba(148,163,184,0.35)" strokeDasharray="3 3" />
              <circle cx={x(hover.t.getTime())} cy={y(hover.predicted)} r="4.5" fill={accent} stroke="#0B1120" strokeWidth="2" />
              {"actual" in hover && typeof hover.actual === "number" && (
                <circle cx={x(hover.t.getTime())} cy={y(hover.actual)} r="4" fill="rgba(148,163,184,0.85)" stroke="#0B1120" strokeWidth="2" />
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
        </g>
      </svg>
    </div>
  );
}

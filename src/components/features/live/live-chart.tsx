"use client";
import { useId, useMemo, useState, useCallback } from "react";
import { useElementSize } from "@/hooks/use-element-size";
import { fmtMW, fmtTime, DAY_SHORT } from "@/lib/dashboard/format";
import { makeScales, niceBounds, smoothPath } from "@/components/features/dashboard/chart-utils";
import type { LiveTick, LiveWindow } from "@/types/live";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Segmented } from "@/components/features/dashboard/segmented";
import { LegendItem, Swatch, SwatchDashed } from "@/components/features/dashboard/legend";

interface Props {
  ticks: readonly LiveTick[];
  window: LiveWindow;
  onWindowChange: (w: LiveWindow) => void;
}

const WINDOW_OPTS = [
  { v: 1 as const, l: "1h" },
  { v: 6 as const, l: "6h" },
  { v: 12 as const, l: "12h" },
  { v: 24 as const, l: "24h" },
];

export function LiveChart({ ticks, window, onWindowChange }: Props) {
  const { ref, size } = useElementSize<HTMLDivElement>({ w: 600, h: 360 });
  const idSeed = useId().replace(/[^a-z0-9]/gi, "");
  const gradId = `lg-${idSeed}`;
  const errGradId = `eg-${idSeed}`;

  const [showForecast, setShowForecast] = useState(true);
  const [showError, setShowError] = useState(false);

  const M = { l: 50, r: 16, t: 14, b: 40 };
  const plotW = size.w - M.l - M.r;
  const plotH = size.h - M.t - M.b;

  const yValues = useMemo(() => {
    const vals: number[] = [];
    for (const t of ticks) {
      vals.push(t.actual, t.predicted);
    }
    return vals;
  }, [ticks]);

  const [yMin, yMax] = ticks.length > 1 ? niceBounds(yValues) : [0, 1];
  const { x, y } = makeScales({
    data: ticks as LiveTick[],
    xAccessor: (d: LiveTick) => d.t.getTime(),
    plotW,
    plotH,
    yMin,
    yMax,
  });

  const actualPath = useMemo(
    () => smoothPath(ticks as LiveTick[], (d: LiveTick) => [x(d.t.getTime()), y(d.actual)]),
    [ticks, x, y]
  );

  const forecastPath = useMemo(
    () => smoothPath(ticks as LiveTick[], (d: LiveTick) => [x(d.t.getTime()), y(d.predicted)]),
    [ticks, x, y]
  );

  // Area fill under actual line
  const areaPath = useMemo(() => {
    if (ticks.length < 2) return "";
    const pts = (ticks as LiveTick[]).map((d: LiveTick) => [x(d.t.getTime()), y(d.actual)] as const);
    let s = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) s += ` L${pts[i][0]},${pts[i][1]}`;
    s += ` L${pts[pts.length - 1][0]},${plotH} L${pts[0][0]},${plotH} Z`;
    return s;
  }, [ticks, x, y, plotH]);

  // Error band (area between actual and forecast)
  const errorBandPath = useMemo(() => {
    if (ticks.length < 2) return "";
    const t = ticks as LiveTick[];
    const top = t.map((d: LiveTick) => [x(d.t.getTime()), y(Math.max(d.actual, d.predicted))] as const);
    const bot = t.slice().reverse().map((d: LiveTick) => [x(d.t.getTime()), y(Math.min(d.actual, d.predicted))] as const);
    let s = `M${top[0][0]},${top[0][1]}`;
    for (let i = 1; i < top.length; i++) s += ` L${top[i][0]},${top[i][1]}`;
    for (let i = 0; i < bot.length; i++) s += ` L${bot[i][0]},${bot[i][1]}`;
    return s + " Z";
  }, [ticks, x, y]);

  const yTicks = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i <= 5; i++) out.push(yMin + ((yMax - yMin) * i) / 5);
    return out;
  }, [yMin, yMax]);

  const xTicks = useMemo(() => {
    if (ticks.length < 2) return [];
    const n = Math.min(6, ticks.length);
    const out: LiveTick[] = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.round((i * (ticks.length - 1)) / (n - 1));
      out.push(ticks[idx]);
    }
    return out;
  }, [ticks]);

  const [hover, setHover] = useState<LiveTick | null>(null);
  const onMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left - M.l;
      if (px < 0 || px > plotW || ticks.length === 0) {
        setHover(null);
        return;
      }
      const tArr = ticks as LiveTick[];
      const t =
        (px / plotW) *
          (tArr[tArr.length - 1].t.getTime() - tArr[0].t.getTime()) +
        tArr[0].t.getTime();
      let nearest = tArr[0];
      let best = Infinity;
      for (const d of tArr) {
        const diff = Math.abs(d.t.getTime() - t);
        if (diff < best) {
          best = diff;
          nearest = d;
        }
      }
      setHover(nearest);
    },
    [ticks, plotW]
  );

  const lastTick = ticks.length > 0 ? ticks[ticks.length - 1] : null;

  return (
    <Card className="min-h-96">
      <CardHeader>
        <CardTitle>Live demand stream</CardTitle>
        <CardDescription className="text-text-muted">
          Real-time actual vs forecast · {ticks.length} ticks buffered
        </CardDescription>
        <CardAction>
          <Segmented
            options={WINDOW_OPTS}
            value={window}
            onChange={onWindowChange}
            ariaLabel="Time window"
          />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="mb-2 flex flex-wrap items-center gap-3.5">
          <LegendItem
            checked
            disabled
            onChange={() => {}}
            swatch={<Swatch color="var(--accent-cyan)" />}
            label="Actual demand"
          />
          <LegendItem
            checked={showForecast}
            onChange={setShowForecast}
            swatch={<SwatchDashed color="var(--accent-green)" />}
            label="Forecast"
          />
          <LegendItem
            checked={showError}
            onChange={setShowError}
            swatch={<Swatch color="rgba(239,68,68,0.35)" />}
            label="Error band"
          />
        </div>

        <div className="relative min-h-80 flex-1" ref={ref}>
          <svg
            width={size.w}
            height={size.h}
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
            style={{ display: "block", cursor: hover ? "crosshair" : "crosshair" }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={errGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-red)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--accent-red)" stopOpacity="0.04" />
              </linearGradient>
            </defs>

            <g transform={`translate(${M.l},${M.t})`}>
              {/* Grid lines */}
              {yTicks.map((v, i) => (
                <g key={i}>
                  <line
                    x1={0} x2={plotW} y1={y(v)} y2={y(v)}
                    stroke="rgba(148,163,184,0.08)" strokeDasharray="2 4"
                  />
                  <text
                    x={-8} y={y(v)} textAnchor="end" dominantBaseline="middle"
                    fontSize="10" fill="#6b7587" fontFamily="JetBrains Mono, monospace"
                  >
                    {fmtMW(v)}
                  </text>
                </g>
              ))}

              {/* Area under actual */}
              {ticks.length > 1 && (
                <path d={areaPath} fill={`url(#${gradId})`} />
              )}

              {/* Error band */}
              {showError && ticks.length > 1 && (
                <path d={errorBandPath} fill={`url(#${errGradId})`} />
              )}

              {/* Forecast line */}
              {showForecast && ticks.length > 1 && (
                <path
                  d={forecastPath}
                  fill="none"
                  stroke="var(--accent-green)"
                  strokeWidth="1.6"
                  strokeDasharray="4 3"
                  opacity="0.75"
                />
              )}

              {/* Actual line */}
              {ticks.length > 1 && (
                <path d={actualPath} fill="none" stroke="var(--accent-cyan)" strokeWidth="2.2" />
              )}

              {/* Live head dot */}
              {lastTick && (
                <g transform={`translate(${x(lastTick.t.getTime())},${y(lastTick.actual)})`}>
                  <circle r="7" fill="rgba(6,182,212,0.18)" />
                  <circle r="4" fill="var(--accent-cyan)" stroke="#0B1120" strokeWidth="1.5" />
                  <circle r="7" fill="none" stroke="var(--accent-cyan)" strokeWidth="1" opacity="0.5">
                    <animate attributeName="r" from="7" to="16" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                </g>
              )}

              {/* Hover crosshair */}
              {hover && (
                <g pointerEvents="none">
                  <line
                    x1={x(hover.t.getTime())} x2={x(hover.t.getTime())} y1={0} y2={plotH}
                    stroke="rgba(148,163,184,0.35)" strokeDasharray="3 3"
                  />
                  <circle
                    cx={x(hover.t.getTime())} cy={y(hover.actual)}
                    r="4.5" fill="var(--accent-cyan)" stroke="#0B1120" strokeWidth="2"
                  />
                  {showForecast && (
                    <circle
                      cx={x(hover.t.getTime())} cy={y(hover.predicted)}
                      r="4" fill="var(--accent-green)" stroke="#0B1120" strokeWidth="2"
                    />
                  )}
                  {/* Tooltip */}
                  <foreignObject
                    x={Math.min(x(hover.t.getTime()) + 12, plotW - 170)}
                    y={Math.max(y(hover.actual) - 70, 0)}
                    width={160} height={64}
                  >
                    <div
                      style={{
                        background: "rgba(17,26,44,0.92)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: "6px 10px",
                        fontSize: 11,
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      <div style={{ color: "#9CA3AF" }}>{fmtTime(hover.t)}</div>
                      <div style={{ color: "var(--accent-cyan)" }}>
                        Act: {fmtMW(hover.actual)} MW
                      </div>
                      <div style={{ color: "var(--accent-green)" }}>
                        Fcst: {fmtMW(hover.predicted)} MW
                      </div>
                    </div>
                  </foreignObject>
                </g>
              )}

              {/* X axis */}
              <line x1={0} x2={plotW} y1={plotH} y2={plotH} stroke="rgba(148,163,184,0.18)" />
              {xTicks.map((d, i) => (
                <g key={i}>
                  <text
                    x={x(d.t.getTime())} y={plotH + 18} textAnchor="middle"
                    fontSize="10" fill="#9CA3AF" fontFamily="JetBrains Mono, monospace"
                  >
                    {fmtTime(d.t)}
                  </text>
                  <text
                    x={x(d.t.getTime())} y={plotH + 30} textAnchor="middle"
                    fontSize="9" fill="#6b7587" fontFamily="JetBrains Mono, monospace"
                  >
                    {DAY_SHORT[d.t.getDay()]} {d.t.getDate()}
                  </text>
                </g>
              ))}
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

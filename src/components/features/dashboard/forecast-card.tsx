"use client";
import type { ExplainerPoint, ForecastHorizon, ForecastPoint, HistoryPoint } from "@/types/dashboard";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Segmented } from "./segmented";
import { LegendItem, Swatch, SwatchBand } from "./legend";
import { ForecastChart } from "./forecast-chart";
import { fmtMW, fmtTime } from "@/lib/dashboard/format";

interface Props {
  history: HistoryPoint[];
  future: ForecastPoint[];
  peak: ForecastPoint;
  trough: ForecastPoint;
  futureHours: ForecastHorizon;
  onFutureHours: (h: ForecastHorizon) => void;
  accent: string;
  showBand: boolean;
  onShowBand: (v: boolean) => void;
  showHistOnForecast: boolean;
  onShowHistOnForecast: (v: boolean) => void;
  now: Date;
  onPointClick: (p: ExplainerPoint) => void;
}

const HORIZON_OPTS = [
  { v: 24 as const, l: "24h" },
  { v: 48 as const, l: "48h" },
  { v: 72 as const, l: "72h" },
  { v: 168 as const, l: "7d" },
];

export function ForecastCard({
  history, future, peak, trough, futureHours, onFutureHours, accent,
  showBand, onShowBand, showHistOnForecast, onShowHistOnForecast, now, onPointClick,
}: Props) {
  return (
    <Card className="min-h-130">
      <CardHeader>
        <CardTitle>Next forecast</CardTitle>
        <CardDescription className="text-text-muted">
          Issued {fmtTime(now)} · resolution 1h · model demand-xgb-v2.4
        </CardDescription>
        <CardAction>
          <Segmented
            options={HORIZON_OPTS}
            value={futureHours}
            onChange={onFutureHours}
            ariaLabel="Forecast horizon"
          />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="mb-2 flex flex-wrap items-center gap-3.5">
          <LegendItem
            checked
            disabled
            onChange={() => {}}
            swatch={<Swatch color={accent} />}
            label="Forecast"
          />
          <LegendItem
            checked={showBand}
            onChange={onShowBand}
            swatch={<SwatchBand />}
            label="P10–P90 band"
          />
          <LegendItem
            checked={showHistOnForecast}
            onChange={onShowHistOnForecast}
            swatch={<Swatch color="rgba(148,163,184,0.6)" />}
            label="24h context"
          />
        </div>

        <div className="relative min-h-90 flex-1">
          <ForecastChart
            history={history}
            future={future}
            accent={accent}
            showBand={showBand}
            showHistory={showHistOnForecast}
            peak={peak}
            onPointClick={onPointClick}
          />
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Callout
            label="Day-ahead peak"
            value={`${fmtMW(peak.predicted)} MW`}
            time={fmtTime(peak.t, { withDate: true })}
            sub={`P10 ${fmtMW(peak.p10)} · P90 ${fmtMW(peak.p90)}`}
            accent="text-accent-cyan-2"
          />
          <Callout
            label="Trough"
            value={`${fmtMW(trough.predicted)} MW`}
            time={fmtTime(trough.t, { withDate: true })}
            sub={`Daily ramp ${fmtMW(peak.predicted - trough.predicted)} MW`}
            accent="text-accent-green"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Callout({
  label, value, time, sub, accent,
}: { label: string; value: string; time: string; sub: string; accent: string }) {
  return (
    <div className="rounded-lg border border-border bg-popover/55 px-3.5 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        <span className={`mono whitespace-nowrap text-[20px] font-semibold ${accent}`}>
          {value}
        </span>
        <span className="mono whitespace-nowrap text-[11px] text-muted-foreground">
          {time}
        </span>
      </div>
      <div className="mono mt-1 text-[11px] text-text-faint">{sub}</div>
    </div>
  );
}

"use client";
import { fmtMW, fmtSigned, fmtTime } from "@/lib/dashboard/format";
import type { ForecastPoint, HistoryPoint, Metrics } from "@/types/dashboard";
import { MetricTile } from "./metric-tile";

interface Props {
  history: HistoryPoint[];
  future: ForecastPoint[];
  peak: ForecastPoint;
  metrics: Metrics;
}

export function HeroMetrics({ history, future, peak, metrics }: Props) {
  const lastActual = history[history.length - 1].actual;
  const lastErr = lastActual - history[history.length - 1].predicted;

  const peakHourSpark = future.slice(0, 24).map((d) => d.predicted);

  return (
    <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2">
      <MetricTile
        hero
        corner={fmtTime(peak.t, { withDate: true })}
        label="Tomorrow's peak demand"
        value={fmtMW(peak.predicted)}
        unit="MW"
        trend={{ dir: "up", text: "2.1% vs 7d avg" }}
        badge={{ tone: "cyan", text: `±${fmtMW((peak.p90 - peak.p10) / 2)} MW (P10–P90)` }}
        accent="cyan"
        sparkline={peakHourSpark}
      />
      <MetricTile
        label="Forecast accuracy · MAPE"
        value={metrics.mape.toFixed(2)}
        unit="%"
        accent="green"
      />
    </div>
  );
}

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
  const lastErrPct = (lastErr / lastActual) * 100;

  const accuracySpark = history.slice(-48).map((d) => 100 - (Math.abs(d.actual - d.predicted) / d.actual) * 100);
  const demandSpark = history.slice(-48).map((d) => d.actual);
  const peakHourSpark = future.slice(0, 24).map((d) => d.predicted);

  const sysHealth = metrics.mape < 2.5 ? "NOMINAL" : metrics.mape < 4 ? "WATCH" : "STRESSED";
  const sysHealthBadge: { tone: "green" | "orange"; text: string } =
    metrics.mape < 2.5
      ? { tone: "green", text: "Within tolerance" }
      : metrics.mape < 4
        ? { tone: "orange", text: "Drift detected" }
        : { tone: "orange", text: "Review required" };

  return (
    <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
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
        trend={{
          dir: metrics.mape < 2.5 ? "down" : "up",
          text: metrics.mape < 2.5 ? "good" : "rising",
        }}
        badge={{
          tone: metrics.mape < 2.5 ? "green" : "orange",
          text: `${metrics.hit.toFixed(0)}% within ±3%`,
        }}
        accent="green"
        sparkline={accuracySpark}
      />
      <MetricTile
        label="Live demand"
        value={fmtMW(lastActual)}
        unit="MW"
        trend={{
          dir: lastErrPct > 0.2 ? "up" : lastErrPct < -0.2 ? "down" : "flat",
          text: `${fmtSigned(lastErrPct, 2)}% vs forecast`,
        }}
        accent="cyan"
        sparkline={demandSpark}
      />
      <MetricTile
        label="System health"
        value={sysHealth}
        badge={sysHealthBadge}
        accent={sysHealth === "NOMINAL" ? "green" : "amber"}
      />
    </div>
  );
}

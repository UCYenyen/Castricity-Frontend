"use client";
import { fmtMW, fmtSigned } from "@/lib/dashboard/format";
import type { LiveMetrics, LiveTick } from "@/types/live";
import { MetricTile } from "@/components/features/dashboard/metric-tile";

interface Props {
  currentTick: LiveTick;
  ticks: readonly LiveTick[];
  metrics: LiveMetrics | null;
  demandSpark: number[];
  errorSpark: number[];
}

export function LiveHeroMetrics({
  currentTick,
  ticks,
  metrics,
  demandSpark,
  errorSpark,
}: Props) {
  const avgDelta =
    ticks.length > 0
      ? ticks.reduce((s, t) => s + t.deltaPct, 0) / ticks.length
      : 0;

  const maxDemand = ticks.length > 0
    ? Math.max(...ticks.map((t) => t.actual))
    : currentTick.actual;

  const trendStatus: "improving" | "stable" | "degrading" =
    metrics?.trend ?? "stable";
  const trendLabel =
    trendStatus === "improving"
      ? "NOMINAL"
      : trendStatus === "stable"
        ? "WATCH"
        : "STRESSED";

  return (
    <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <MetricTile
        hero
        label="Live demand"
        value={fmtMW(currentTick.actual)}
        unit="MW"
        trend={{
          dir: currentTick.delta > 0 ? "up" : currentTick.delta < 0 ? "down" : "flat",
          text: `${fmtSigned(currentTick.deltaPct, 1)}% vs forecast`,
        }}
        badge={{
          tone: Math.abs(currentTick.deltaPct) < 2 ? "green" : Math.abs(currentTick.deltaPct) < 4 ? "orange" : "red",
          text: `Δ ${fmtSigned(currentTick.delta, 0)} MW`,
        }}
        accent="cyan"
        sparkline={demandSpark}
      />
      <MetricTile
        label="Forecast value"
        value={fmtMW(currentTick.predicted)}
        unit="MW"
        trend={{
          dir: "flat",
          text: "model demand-xgb-v2.4",
        }}
        accent="green"
        sparkline={ticks.slice(-60).map((t) => t.predicted)}
      />
      <MetricTile
        label="Session peak"
        value={fmtMW(maxDemand)}
        unit="MW"
        trend={{
          dir: maxDemand > currentTick.actual ? "down" : "up",
          text: `avg err ${fmtSigned(avgDelta, 1)}%`,
        }}
        badge={{
          tone: "cyan",
          text: `${ticks.length} ticks`,
        }}
        accent="amber"
        sparkline={errorSpark}
      />
      <MetricTile
        label="Stream health"
        value={trendLabel}
        badge={{
          tone: trendStatus === "improving" ? "green" : trendStatus === "stable" ? "orange" : "red",
          text: metrics ? `MAPE ${metrics.mape.toFixed(1)}%` : "Awaiting data",
        }}
        accent={trendStatus === "improving" ? "green" : "amber"}
      />
    </div>
  );
}

"use client";
import type { LiveMetrics } from "@/types/live";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  metrics: LiveMetrics | null;
}

const TREND_BADGE: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  improving: {
    bg: "bg-accent-green/15 border-accent-green/30",
    text: "text-accent-green",
    label: "Improving",
  },
  stable: {
    bg: "bg-accent-orange/15 border-accent-orange/30",
    text: "text-accent-orange",
    label: "Stable",
  },
  degrading: {
    bg: "bg-accent-red/15 border-accent-red/30",
    text: "text-accent-red",
    label: "Degrading",
  },
};

interface MetricRowProps {
  label: string;
  value: string;
  unit: string;
  accent: string;
}

function MetricRow({ label, value, unit, accent }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={`mono text-base font-semibold ${accent}`}>{value}</span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

export function LiveMetricsPanel({ metrics }: Props) {
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Rolling metrics</CardTitle>
          <CardDescription className="text-text-muted text-xs">
            Awaiting data stream…
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20 text-text-faint text-xs mono">
            Connecting…
          </div>
        </CardContent>
      </Card>
    );
  }

  const trend = TREND_BADGE[metrics.trend] ?? TREND_BADGE.stable;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Rolling metrics</CardTitle>
        <CardDescription className="text-text-muted text-xs">
          24h rolling window
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${trend.bg} ${trend.text}`}
          >
            {trend.label}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Model accuracy trend
          </span>
        </div>

        <MetricRow
          label="MAE"
          value={metrics.mae.toFixed(1)}
          unit="MW"
          accent="text-accent-cyan-2"
        />
        <MetricRow
          label="RMSE"
          value={metrics.rmse.toFixed(1)}
          unit="MW"
          accent="text-accent-cyan-2"
        />
        <MetricRow
          label="MAPE"
          value={metrics.mape.toFixed(2)}
          unit="%"
          accent={
            metrics.mape < 2.5
              ? "text-accent-green"
              : metrics.mape < 4
                ? "text-accent-orange"
                : "text-accent-red"
          }
        />
        <MetricRow
          label="Bias"
          value={(metrics.bias >= 0 ? "+" : "") + metrics.bias.toFixed(1)}
          unit="MW"
          accent="text-text-secondary"
        />
        <MetricRow
          label="Hit rate (±3%)"
          value={metrics.hit.toFixed(0)}
          unit="%"
          accent="text-accent-green"
        />
      </CardContent>
    </Card>
  );
}
